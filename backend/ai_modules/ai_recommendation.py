from sqlalchemy.orm import Session
from sqlalchemy.sql import func, or_
from models import User, SearchHistory, Product, UserRecommendation, ProductMatch
from datetime import datetime, timezone





def calculate_priority(product: Product, is_group_match: bool, is_search_match: bool, is_recent_click: bool) -> float:
    """
    Calculate the priority score for a product based on matching criteria.
    """
    priority = 0.0
    if is_recent_click:
        priority += 20  # High priority for recent clicks
    if is_search_match:
        priority += 10  # High priority for direct search matches
    if is_group_match:
        priority += 5  # Medium priority for group matches
    if product.availability:
        priority += 3  # Slight boost for products in stock
    if product.price:
        priority += 1 / product.price  # Favor lower-priced items (inverse relationship)
    return priority


def generate_user_recommendations(db: Session):
    """
    Generate and update recommendations for users with new or updated search histories.
    Ensure each user always has 20 recommendations, prioritizing based on recent interactions.
    """
    # Get users with updated search histories
    users_with_recent_history = (
        db.query(User)
        .join(SearchHistory, User.user_id == SearchHistory.user_id)
        .filter(SearchHistory.search_date > func.datetime('now', '-1 day'))  # Adjust time window if needed
        .distinct(User.user_id)
        .all()
    )

    for user in users_with_recent_history:
        # Fetch search history for the user
        search_histories = (
            db.query(SearchHistory)
            .filter(SearchHistory.user_id == user.user_id)
            .all()
        )

        # Collect search terms and product IDs from history
        search_values = [history.search_value for history in search_histories if history.search_value]
        clicked_product_ids = [history.product_id for history in search_histories if history.product_id]

        # Query products relevant to search terms and interactions
        recommended_products_query = db.query(Product)

        if search_values:
            recommended_products_query = recommended_products_query.filter(
                or_(*[Product.title.ilike(f"%{value}%") for value in search_values])
            )

        # Include products from the same groups as clicked products
        if clicked_product_ids:
            group_ids = (
                db.query(Product.group_id)
                .filter(Product.product_id.in_(clicked_product_ids), Product.group_id.isnot(None))
                .distinct()
                .all()
            )
            group_ids = [g[0] for g in group_ids]

            if group_ids:
                recommended_products_query = recommended_products_query.filter(
                    or_(Product.group_id.in_(group_ids))
                )

        # Exclude fallback categories
        recommended_products_query = recommended_products_query.filter(
            or_(Product.category_id != 54, Product.category_id.is_(None))
        )

        # Fetch products and calculate priority scores
        recommended_products = recommended_products_query.all()
        recommendations_with_scores = []

        for product in recommended_products:
            # Determine priority score
            is_group_match = product.group_id in group_ids if group_ids else False
            is_search_match = any(
                search_value.lower() in product.title.lower() for search_value in search_values
            )
            is_recent_click = product.product_id in clicked_product_ids
            priority_score = calculate_priority(product, is_group_match, is_search_match, is_recent_click)

            # Add to recommendations with scores
            recommendations_with_scores.append((product, priority_score))

        # Add clicked products with a high priority if not already included
        for clicked_product_id in clicked_product_ids:
            if not any(product.product_id == clicked_product_id for product, _ in recommendations_with_scores):
                clicked_product = db.query(Product).filter(Product.product_id == clicked_product_id).first()
                if clicked_product:
                    recommendations_with_scores.append((clicked_product, 25))  # Fixed high priority for clicked products

        # Sort recommendations by priority
        sorted_recommendations = sorted(
            recommendations_with_scores, key=lambda x: x[1], reverse=True
        )

        # Fetch existing recommendations for the user
        existing_recommendations = (
            db.query(UserRecommendation)
            .filter(UserRecommendation.user_id == user.user_id)
            .order_by(UserRecommendation.priority_score.asc())
            .all()
        )

        # Keep exactly 20 recommendations
        final_recommendations = []

        for product, priority_score in sorted_recommendations:
            if len(final_recommendations) < 20:
                final_recommendations.append((product, priority_score))
            elif (
                existing_recommendations
                and priority_score > existing_recommendations[0].priority_score
            ):
                # Replace lowest-priority recommendation
                db.delete(existing_recommendations.pop(0))
                final_recommendations.append((product, priority_score))

        # Insert new recommendations
        db.query(UserRecommendation).filter(UserRecommendation.user_id == user.user_id).delete()

        for product, priority_score in final_recommendations:
            recommendation = UserRecommendation(
                user_id=user.user_id,
                product_id=product.product_id,
                recommendation_date=datetime.now(timezone.utc),
                priority_score=priority_score
            )
            db.add(recommendation)

    # Commit changes to the database
    db.commit()


def continuously_update_recommendations(db: Session, interval_seconds: int = 60):
    """
    Continuously run the recommendation logic at specified intervals.
    """
    import time

    while True:
        try:
            print(f"Running recommendation update at {datetime.now(timezone.utc)}")
            generate_user_recommendations(db)
            print("Recommendations updated successfully.")
        except Exception as e:
            print(f"Error while updating recommendations: {e}")
        time.sleep(interval_seconds)  # Wait for the specified interval before rerunning

