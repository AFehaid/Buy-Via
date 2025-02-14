from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import or_, and_, asc, desc, case
from pydantic import BaseModel

from models import (
    Product,
    ProductTitleTranslation,
    ProductPriceHistory,
    SearchHistory,
    UserRecommendation
)
from dependencies.deps import get_db, get_current_user, get_optional_current_user
from fastapi.security import OAuth2PasswordBearer


# ----------------------------------------
# 1) Define your accessories search dict
# ----------------------------------------
accessories_search_keywords = {
    "protection": [
        "كفر", "cover", "case", "واقي شاشة", "screen protector", "tempered glass",
        "protector", "protection", "حافظة", "antishock", "portector", "حماية",
        "shield", "rotatable", "for iphone"
    ],
    "charging": [
        "شاحن", "charger", "كيبل", "كابل", "cable", "power bank", "بنك طاقة",
        "شاحن سيارة", "car charger", "magsafe", "شاحن لاسلكي", "wireless charger"
    ],
    "audio": [
        "سماعة", "سماعات", "earbuds", "earphones", "headset",
        "سماعة بلوتوث", "bluetooth headset", "سماعة جيمنج", "gaming headset", "aux"
    ],
    "mounts_and_holders": [
        "حامل", "حامل جوال", "phone stand", "tripod", "ترايبود", "selfie stick",
        "عصا سيلفي", "car mount", "bike mount", "camera lens", "عدسة كاميرا",
        "lens", "lens,"
    ],
    "storage": [
        "ذاكرة", "memory", "usb", "flash", "sd card", "micro sd", "external storage"
    ],
    "connectivity": [
        "محول", "adapter", "hdmi", "usb hub", "dongle", "sim ejector"
    ],
    "other": [
        "popsocket", "ring holder", "قلم", "stylus", "تنظيف", "cleaning kit",
        "portable speaker", "vr headset", "gaming controller", "يد تحكم",
        "fan", "cooling fan", "لوحة مفاتيح", "keyboard"
    ]
}

# Flatten accessory words for detection
all_accessories = []
for category_list in accessories_search_keywords.values():
    for item in category_list:
        all_accessories.append(item.lower())


# ----------------------------------------
# Pydantic Models
# ----------------------------------------
class ProductResponse(BaseModel):
    product_id: int
    title: str
    price: float | None
    info: str | None
    link: str
    image_url: str
    store_id: int
    availability: bool
    last_old_price: float | None
    category_id: int
    group_id: int | None
    arabic_title: Optional[str] = None  # <--- NEW FIELD
    last_updated: str

    class Config:
        from_attributes = True


class SearchResponse(BaseModel):
    total: int
    products: List[ProductResponse]


# ----------------------------------------
# Utility: get_search_query
# ----------------------------------------
def get_search_query(db: Session, query: str, sort_by: str):
    """
    Build a search query requiring ALL words in `query` to appear
    in the product title or Arabic translation. Also keeps accessory
    logic to push accessories lower if the user query doesn't
    explicitly mention accessories.
    """
    from sqlalchemy.sql import literal
    ar_trans = aliased(ProductTitleTranslation)

    # Split the user query into words
    words = query.lower().split()

    # ---------------------------------------
    # Build AND condition across all words
    # ---------------------------------------
    # e.g. "iphone 16 pro max" => must match *all* words in either
    # Product.title OR the Arabic translation (where language='ar').
    # So:
    #   AND(
    #     (title ILIKE '%iphone%' OR (lang='ar' AND translated_title ILIKE '%iphone%')),
    #     (title ILIKE '%16%'     OR (lang='ar' AND translated_title ILIKE '%16%')),
    #     (title ILIKE '%pro%'    OR (lang='ar' AND translated_title ILIKE '%pro%')),
    #     (title ILIKE '%max%'    OR (lang='ar' AND translated_title ILIKE '%max%'))
    #   )
    #
    # Only if all words match does the product show up.
    word_conditions = []
    for w in words:
        cond = or_(
            Product.title.ilike(f"%{w}%"),
            and_(
                ar_trans.language == "ar",
                ar_trans.translated_title.ilike(f"%{w}%")
            )
        )
        word_conditions.append(cond)

    combined_condition = and_(*word_conditions)

    # ---------------------------------------
    # Accessory condition => push accessories lower
    # ---------------------------------------
    accessory_condition = or_(
        *[Product.title.ilike(f"%{acc_keyword}%") for acc_keyword in all_accessories]
    )
    is_accessory_expr = case(
        (accessory_condition, 1),
        else_=0
    ).label("is_accessory")

    # Because all matched products have the same "match strength" (they match all words),
    # we can keep a simple integer for 'relevance'
    relevance_score = literal(len(words)).label("relevance")

    # ---------------------------------------
    # Build the query (no limit inside!)
    # ---------------------------------------
    combined_query = (
        db.query(
            Product,
            relevance_score.label("relevance"),
            is_accessory_expr.label("is_accessory"),
        )
        .outerjoin(ar_trans, ar_trans.product_id == Product.product_id)
        .filter(combined_condition)
    )

    # ---------------------------------------
    # Sorting
    # ---------------------------------------
    if sort_by == "relevance":
        # All matched items have same relevance, but we keep to your structure:
        combined_query = combined_query.order_by(asc("is_accessory"), desc("relevance"))
    elif sort_by == "price-low":
        combined_query = combined_query.order_by(
            asc("is_accessory"),
            case((Product.price.is_(None), 1), else_=0),  # put None prices last
            asc(Product.price)
        )
    elif sort_by == "price-high":
        combined_query = combined_query.order_by(
            asc("is_accessory"),
            case((Product.price.is_(None), 1), else_=0),
            desc(Product.price)
        )
    elif sort_by == "newest":
        combined_query = combined_query.order_by(
            asc("is_accessory"),
            desc(Product.last_updated)
        )
    # otherwise, do nothing special beyond is_accessory.

    # IMPORTANT: do not apply limit() here so that further filters
    # (like availability, price range, etc.) can be added without error.
    return combined_query

# ----------------------------------------
# Utility: get_price_history
# ----------------------------------------
def get_price_history(db: Session, product_ids: List[int]) -> Dict[int, float]:
    """Get last price history for products"""
    last_price_histories = (
        db.query(ProductPriceHistory)
        .filter(ProductPriceHistory.product_id.in_(product_ids))
        .order_by(ProductPriceHistory.product_id, ProductPriceHistory.change_date.desc())
        .all()
    )
    last_old_prices = {}
    for history in last_price_histories:
        if history.product_id not in last_old_prices:
            last_old_prices[history.product_id] = history.old_price
    return last_old_prices


# ----------------------------------------
# Utility: format_product_response
# ----------------------------------------
def format_product_response(product: Product, last_old_price: float = None) -> dict:
    """Return product data + arabic title if present."""
    # Find Arabic translation
    arabic_title = None
    for t in product.translations:
        if t.language == "ar":
            arabic_title = t.translated_title
            break

    return {
        "product_id": product.product_id,
        "title": product.title,
        "price": product.price,
        "info": product.info,
        "link": product.link,
        "image_url": product.image_url,
        "store_id": product.store_id,
        "availability": product.availability,
        "category_id": product.category_id,
        "last_old_price": last_old_price,
        "group_id": product.group_id,
        "arabic_title": arabic_title,  # None if no Arabic translation
        "last_updated": product.last_updated.strftime("%Y-%m-%d")  # Format to year-month-day
    }


# ----------------------------------------
# Round-robin reorder by store_id
# ----------------------------------------
def reorder_by_store_round_robin(products: List[Product]) -> List[Product]:
    from collections import OrderedDict
    store_ids = sorted({p.store_id for p in products})
    store_map = OrderedDict((sid, []) for sid in store_ids)

    for prod in products:
        store_map[prod.store_id].append(prod)

    final_list = []
    while True:
        all_empty = True
        for sid in store_ids:
            if store_map[sid]:
                final_list.append(store_map[sid].pop(0))
                all_empty = False
        if all_empty:
            break

    return final_list


# ----------------------------------------
# Router
# ----------------------------------------
router = APIRouter(prefix="/search", tags=["search"])

# ----------------------------------------
# GET /search/price-comparison/{product_id}
# ----------------------------------------
@router.get("/price-comparison/{product_id}", response_model=List[ProductResponse])
def price_comparison(
    product_id: int = Path(..., description="The ID of the product to compare prices for"),
    db: Session = Depends(get_db),
):
    """
    Compare prices of the same product across different stores.
    - Returns one product per store that belongs to the same group as the given product.
    - The product selected from each store is the one whose title most closely matches the title of the given product.
    """
    # Fetch the product with the given ID
    product = (
        db.query(Product)
        .filter(Product.product_id == product_id)
        .options(joinedload(Product.translations))
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get the group ID of the product
    group_id = product.group_id
    if not group_id:
        raise HTTPException(status_code=404, detail="Product does not belong to any group")

    # Fetch all products in the same group
    group_products = (
        db.query(Product)
        .filter(Product.group_id == group_id)
        .options(joinedload(Product.translations))
        .all()
    )

    # Group products by store
    store_products = {}
    for p in group_products:
        if p.store_id not in store_products:
            store_products[p.store_id] = []
        store_products[p.store_id].append(p)

    # Select one product per store with the most matching title
    selected_products = []
    for store_id, products in store_products.items():
        # Find the product with the most matching title
        best_match = None
        best_score = -1
        for p in products:
            # Simple matching score based on the number of common words
            common_words = len(set(product.title.lower().split()) & set(p.title.lower().split()))
            if common_words > best_score:
                best_match = p
                best_score = common_words
        if best_match:
            selected_products.append(best_match)

    # Get price history for the selected products
    product_ids = [p.product_id for p in selected_products]
    last_old_prices = get_price_history(db, product_ids)

    # Format the response
    return [
        format_product_response(prod, last_old_prices.get(prod.product_id))
        for prod in selected_products
    ]


# ----------------------------------------
# GET /search/quick-search
# ----------------------------------------
@router.get("/quick-search", response_model=SearchResponse)
def quick_search(
    query: str = Query(..., min_length=1, description="Search query"),
    category_id: Optional[int] = Query(None, description="Optional category filter."),
    db: Session = Depends(get_db),
):
    """
    Perform a quick search with a single 'query' parameter.
    - Returns only in-stock products.
    - Fixed page size of 20.
    - Sorted by relevance.
    """
    combined_query = get_search_query(db, query, sort_by="relevance")

    # Only in-stock
    # combined_query = combined_query.filter(Product.availability == True)

    if category_id is not None:
        combined_query = combined_query.filter(Product.category_id == category_id)

    total = combined_query.count()

    results = combined_query.limit(20).all()
    if not results:
        raise HTTPException(status_code=404, detail="No products found matching the query")

    products_only = [row[0] for row in results]

    reordered_products = reorder_by_store_round_robin(products_only)
    product_ids = [p.product_id for p in reordered_products]
    last_old_prices = get_price_history(db, product_ids)

    products_response = [
        format_product_response(prod, last_old_prices.get(prod.product_id))
        for prod in reordered_products
    ]
    return SearchResponse(total=total, products=products_response)


# ----------------------------------------
# GET /search/recommendations
# ----------------------------------------
@router.get("/recommendations", response_model=List[ProductResponse])
def get_user_recommendations(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = current_user["id"]

    # Get recommendations
    recommendations = (
        db.query(UserRecommendation)
        .filter(UserRecommendation.user_id == user_id)
        .join(Product, UserRecommendation.product_id == Product.product_id)
        .options(joinedload(UserRecommendation.product).joinedload(Product.translations))
        .order_by(UserRecommendation.priority_score.desc())
        .limit(20)
        .all()
    )
    if not recommendations:
        raise HTTPException(status_code=404, detail="No recommendations found")

    product_ids = [rec.product.product_id for rec in recommendations]
    last_old_prices = get_price_history(db, product_ids)

    return [
        format_product_response(rec.product, last_old_prices.get(rec.product.product_id))
        for rec in recommendations
    ]


# ----------------------------------------
# GET /search/related-products
# ----------------------------------------
@router.get("/related-products", response_model=List[ProductResponse])
def get_related_products(
    group_id: Optional[int] = Query(None, description="The group ID of the product"),
    category_id: int = Query(..., description="The category ID of the product"),
    limit: int = Query(20, ge=1, le=100, description="Max related products"),
    db: Session = Depends(get_db),
):
    if group_id:
        group_products_query = db.query(Product).filter(Product.group_id == group_id)
        group_products_query = group_products_query.options(joinedload(Product.translations))
        group_products = group_products_query.limit(limit).all()
    else:
        group_products = []

    if len(group_products) < limit:
        remaining = limit - len(group_products)
        category_products_query = db.query(Product).filter(Product.category_id == category_id)
        if group_id:
            category_products_query = category_products_query.filter(Product.group_id != group_id)
        category_products_query = category_products_query.options(joinedload(Product.translations))
        category_products = category_products_query.limit(remaining).all()
    else:
        category_products = []

    all_products = group_products + category_products
    product_ids = [p.product_id for p in all_products]
    last_old_prices = get_price_history(db, product_ids)

    return [
        format_product_response(prod, last_old_prices.get(prod.product_id))
        for prod in all_products
    ]


# ----------------------------------------
# GET /search/category-products
# ----------------------------------------
@router.get("/category-products", response_model=SearchResponse)
def search_products_by_category(
    category_id: int,
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    sort_by: Optional[str] = Query("relevance"),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    store_filter: Optional[int] = None,
    in_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """
    Fetch products for a specific category with optional filters and sorting.
    """
    query = db.query(Product).filter(Product.category_id == category_id)
    query = query.options(joinedload(Product.translations))

    if min_price is not None:
        query = query.filter(Product.price >= min_price)
    if max_price is not None:
        query = query.filter(Product.price <= max_price)
    if store_filter is not None:
        query = query.filter(Product.store_id == store_filter)
    if in_stock_only:
        query = query.filter(Product.availability == True)

    # Sorting
    if sort_by == "price-low":
        query = query.order_by(Product.price.asc())
    elif sort_by == "price-high":
        query = query.order_by(Product.price.desc())
    elif sort_by == "newest":
        query = query.order_by(Product.last_updated.desc())
    # If 'relevance', there's no text search here, so no effect.

    total_results = query.count()

    offset = (page - 1) * page_size
    products = query.offset(offset).limit(page_size).all()
    if not products:
        raise HTTPException(status_code=404, detail="No products found for the given category.")

    product_ids = [p.product_id for p in products]
    last_old_prices = get_price_history(db, product_ids)

    response_products = [
        format_product_response(prod, last_old_prices.get(prod.product_id))
        for prod in products
    ]

    return SearchResponse(total=total_results, products=response_products)


# ----------------------------------------
# GET /search
# ----------------------------------------
@router.get("/", response_model=SearchResponse)
def search_products(
    query: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    sort_by: Optional[str] = Query("relevance", description="Sort by: relevance, price-low, price-high, newest"),
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    store_filter: Optional[int] = None,
    category_id: Optional[int] = None,
    in_stock_only: bool = False,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """
    Search products with optional category filter, plus Arabic support.
    """
    combined_query = get_search_query(db, query, sort_by)

    if store_filter is not None:
        combined_query = combined_query.filter(Product.store_id == store_filter)
    if category_id is not None:
        combined_query = combined_query.filter(Product.category_id == category_id)
    if min_price is not None:
        combined_query = combined_query.filter(Product.price >= min_price)
    if max_price is not None:
        combined_query = combined_query.filter(Product.price <= max_price)
    if in_stock_only:
        combined_query = combined_query.filter(Product.availability == True)

    total = combined_query.count()
    offset = (page - 1) * page_size

    paginated_results = combined_query.offset(offset).limit(page_size).all()
    if not paginated_results:
        raise HTTPException(status_code=404, detail="No products found matching the query")

    # Extract Product objects
    products_only = [r[0] for r in paginated_results]

    # Round-robin reorder
    reordered = reorder_by_store_round_robin(products_only)
    product_ids = [p.product_id for p in reordered]
    last_old_prices = get_price_history(db, product_ids)

    # Log search if user is authenticated
    if current_user:
        search_history_entry = SearchHistory(
            user_id=current_user["id"],
            search_value=query,
        )
        db.add(search_history_entry)
        db.commit()

    products = [
        format_product_response(prod, last_old_prices.get(prod.product_id))
        for prod in reordered
    ]

    return SearchResponse(total=total, products=products)


# ----------------------------------------
# GET /search/{product_id}
# ----------------------------------------
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: Optional[dict] = Depends(get_optional_current_user),
):
    """
    Get a single product by ID, including Arabic title if available,
    and log the view if authenticated.
    """
    product = (
        db.query(Product)
        .filter(Product.product_id == product_id)
        .options(joinedload(Product.translations))
        .first()
    )
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    last_old_prices = get_price_history(db, [product_id])
    last_old_price = last_old_prices.get(product_id)

    if current_user:
        view_history_entry = SearchHistory(
            user_id=current_user["id"],
            product_id=product_id,
        )
        db.add(view_history_entry)
        db.commit()

    return format_product_response(product, last_old_price)
