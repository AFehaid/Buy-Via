from sqlalchemy.orm import Session
from sqlalchemy.sql import func, or_
from models import User, SearchHistory, Product, UserRecommendation
from datetime import datetime, timezone

def calculate_priority(product: Product, is_group_match: bool, is_search_match: bool, is_recent_click: bool) -> float:
    """
    Calculate a priority score for a product based on matching criteria.
    Tune the weights to your preference.
    """
    priority = 0.0

    # Large boost for recent clicks
    if is_recent_click:
        priority += 20

    # Medium boost if product title matches the user's search terms
    if is_search_match:
        priority += 10

    # Small/medium boost if product is in the same group as a clicked product
    if is_group_match:
        priority += 5

    # Slight boost for products that are in stock
    if product.availability:
        priority += 3

    # Favor lower-priced items (inverse relationship)
    # If product.price is None or 0, skip or handle carefully
    if product.price and product.price > 0:
        priority += 1 / product.price

    return priority


def generate_user_recommendations(db: Session):
    """
    Generate and update recommendations for every user who has any SearchHistory.
    Ensures each user always ends up with exactly 20 recommendations if possible.

    Main steps:
      1) Identify users who have at least one SearchHistory record.
      2) For each user, gather all relevant products:
         - Matches on search_value (title ILIKE)
         - Matches on group_ids of clicked products
         - (Optionally) exclude fallback categories if desired
      3) Calculate a priority score for each matching product.
      4) If fewer than 20 matching products, add fallback products to reach 20.
      5) Sort by priority descending, take top 20.
      6) Delete old recommendations for this user and insert the new ones.
    """

    # --- 1) Find all users who have at least one search history record ---
    users_with_history = (
        db.query(User)
        .join(SearchHistory, User.user_id == SearchHistory.user_id)
        .distinct()
        .all()
    )

    if not users_with_history:
        print("No users with search history found. Skipping recommendation generation.")
        return

    for user in users_with_history:
        # --- 2a) Gather user's search histories ---
        search_histories = (
            db.query(SearchHistory)
            .filter(SearchHistory.user_id == user.user_id)
            .all()
        )
        if not search_histories:
            # Safety check: skip user if no search history
            continue

        # Extract search text and clicked product IDs
        search_values = [h.search_value.strip() for h in search_histories if h.search_value]
        clicked_product_ids = [h.product_id for h in search_histories if h.product_id]

        # If no search values and no clicks, skip
        if not search_values and not clicked_product_ids:
            # Clear old recommendations if needed
            db.query(UserRecommendation).filter(UserRecommendation.user_id == user.user_id).delete()
            db.commit()
            continue

        # Build the initial recommended_products_query
        recommended_products_query = db.query(Product)

        # Filter by search_values
        if search_values:
            like_clauses = [Product.title.ilike(f"%{val}%") for val in search_values]
            recommended_products_query = recommended_products_query.filter(or_(*like_clauses))

        # If we have clicked products, gather their group IDs
        group_ids = []
        if clicked_product_ids:
            group_ids = (
                db.query(Product.group_id)
                .filter(
                    Product.product_id.in_(clicked_product_ids),
                    Product.group_id.isnot(None)
                )
                .distinct()
                .all()
            )
            group_ids = [g[0] for g in group_ids if g[0] is not None]

            if group_ids:
                recommended_products_query = recommended_products_query.filter(
                    or_(Product.group_id.in_(group_ids))
                )

        # Exclude "fallback" categories if desired (e.g. category_id=54)
        # You can remove or edit this if not needed
        recommended_products_query = recommended_products_query.filter(
            or_(Product.category_id != 54, Product.category_id.is_(None))
        )

        # Fetch matching products
        candidate_products = recommended_products_query.all()

        # --- 2b) Calculate priority for each product ---
        product_scores = []
        for prod in candidate_products:
            is_group_match = prod.group_id in group_ids if group_ids else False
            is_search_match = any(val.lower() in prod.title.lower() for val in search_values)
            is_recent_click = prod.product_id in clicked_product_ids

            score = calculate_priority(prod, is_group_match, is_search_match, is_recent_click)
            product_scores.append((prod, score))

        # Ensure recently-clicked products are in the list (in case they didn't match search_value)
        for clicked_id in clicked_product_ids:
            already_in_list = any(p.product_id == clicked_id for p, _ in product_scores)
            if not already_in_list:
                clicked_prod = db.query(Product).filter(Product.product_id == clicked_id).first()
                if clicked_prod:
                    # Give them a high priority to force them into the top 20
                    product_scores.append((clicked_prod, 25.0))

        # --- 3) If fewer than 20 after normal logic, add fallback products ---
        existing_ids = {p.product_id for p, _ in product_scores}
        short_by = 20 - len(product_scores)
        if short_by > 0:
            # One approach: pick random fallback products from entire catalog
            # that are not already included
            fallback_query = (
                db.query(Product)
                .filter(~Product.product_id.in_(existing_ids))
                # Optionally exclude the same fallback category
                .filter(or_(Product.category_id != 54, Product.category_id.is_(None)))
                .order_by(func.random())  # random fallback
                .limit(short_by)
            )
            fallback_products = fallback_query.all()

            # Give fallback a smaller priority (e.g., 0.0) so real matches rank higher
            for fb_prod in fallback_products:
                product_scores.append((fb_prod, 0.0))

        # --- 4) Sort by priority and pick top 20 ---
        sorted_by_priority = sorted(product_scores, key=lambda x: x[1], reverse=True)
        top_20 = sorted_by_priority[:20]

        # --- 5) Clear old recommendations and insert new ones ---
        db.query(UserRecommendation).filter(UserRecommendation.user_id == user.user_id).delete()

        for prod, score in top_20:
            new_rec = UserRecommendation(
                user_id=user.user_id,
                product_id=prod.product_id,
                recommendation_date=datetime.now(timezone.utc),
                priority_score=score
            )
            db.add(new_rec)

        db.commit()

    print("All user recommendations updated successfully.")


def continuously_update_recommendations(db: Session, interval_seconds: int = 60):
    """
    Continuously run the recommendation logic at specified intervals.
    Useful in a background thread, container, or worker.
    """
    import time
    while True:
        try:
            print(f"Running recommendation update at {datetime.now(timezone.utc)}")
            generate_user_recommendations(db)
            print("Recommendations updated successfully.")
        except Exception as e:
            print(f"Error while updating recommendations: {e}")
        time.sleep(interval_seconds)
