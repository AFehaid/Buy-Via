from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc, case
from pydantic import BaseModel

from models import Product, ProductPriceHistory
from dependencies.deps import get_db

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

# ----------------------------------------
# Flatten all accessory words into one list (lowercased)
# ----------------------------------------
all_accessories = []
for category_list in accessories_search_keywords.values():
    for item in category_list:
        # ensure we handle them case-insensitively
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
    Build base search query with filters and sorting, 
    incorporating a special field to push accessories to the bottom if needed.
    """
    # 1) Split the user query and convert to lowercase
    words = query.lower().split()

    # 2) Is this an "accessory" query?
    is_accessory_query = any(word in all_accessories for word in words)

    # 3) Build standard full-text-ish conditions
    conditions = []
    # a) Exact match in title => +3
    conditions.append((Product.title.ilike(f"%{query}%"), 3.0))
    # b) Partial matches in title => +2
    for word in words:
        conditions.append((Product.title.ilike(f"%{word}%"), 2.0))
    # c) Matches in info => +1 / +0.5
    conditions.append((Product.info.ilike(f"%{query}%"), 1.0))
    for word in words:
        conditions.append((Product.info.ilike(f"%{word}%"), 0.5))

    from sqlalchemy import case as sql_case
    # 4) Accessory logic: if user NOT searching for accessories => push them down
    # Build "is_accessory" = 1 if product title has any accessory keyword, else 0
    accessory_condition = or_(
        *[Product.title.ilike(f"%{acc_keyword}%") for acc_keyword in all_accessories]
    )
    is_accessory_expr = sql_case(
        (accessory_condition, 1),
        else_=0
    ).label("is_accessory")

    # 5) Summation for "relevance"
    relevance_score = sum(
        sql_case((cond, weight), else_=0.0)
        for cond, weight in conditions
    ).label("relevance")

    # 6) Filter out irrelevant items (relevance > 0)
    positive_conditions = [cond for (cond, wt) in conditions if wt > 0]
    combined_query = db.query(
        Product,
        relevance_score.label("relevance"),
        is_accessory_expr.label("is_accessory")
    ).filter(or_(*positive_conditions))

    # 7) Sorting
    if sort_by == "relevance":
        if is_accessory_query:
            # Accessory query => normal relevance sort
            combined_query = combined_query.order_by(desc("relevance"))
        else:
            # Non-accessory => push accessories down, then sort by relevance
            combined_query = combined_query.order_by(
                asc("is_accessory"),
                desc("relevance")
            )
    elif sort_by == "price-low":
        combined_query = combined_query.order_by(
            asc("is_accessory"),
            case((Product.price.is_(None), 1), else_=0),
            asc(Product.price)
        )
    elif sort_by == "price-high":
        combined_query = combined_query.order_by(
            asc("is_accessory"),
            case((Product.price.is_(None), 1), else_=0),
            desc(Product.price)
        )
    elif sort_by == "newest":
        # Adjust if you store date in a different field
        combined_query = combined_query.order_by(
            asc("is_accessory"),
            desc(Product.last_updated)
        )

    return combined_query.filter(relevance_score > 0)


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
    """Format single product response"""
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
        "group_id": product.group_id
    }


# ----------------------------------------
# Round-robin reorder by store_id
# ----------------------------------------
def reorder_by_store_round_robin(products: List[Product]) -> List[Product]:
    """
    Takes the final sorted list of products (already sorted by relevance, is_accessory, etc.),
    and rearranges them so that store IDs cycle in ascending order:
      store 1, store 2, store 3, store 1, store 2, store 3, ...
    This preserves the internal order of products within each store.
    """
    from collections import OrderedDict

    # 1) Figure out which store_ids are present, in ascending order
    store_ids = sorted({p.store_id for p in products})

    # 2) Group products by store_id in the order they appear
    store_map = OrderedDict((sid, []) for sid in store_ids)
    for prod in products:
        store_map[prod.store_id].append(prod)

    # 3) Round-robin: pick the first item from store 1, then store 2, etc.
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
# GET /search
# ----------------------------------------
@router.get("/", response_model=SearchResponse)
def search_products(
    query: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    sort_by: Optional[str] = Query("relevance", description="Sort by: relevance, price-low, price-high, newest"),
    # -- NEW Filters --
    min_price: Optional[float] = Query(None, description="Minimum price filter"),
    max_price: Optional[float] = Query(None, description="Maximum price filter"),
    store_filter: Optional[int] = Query(None, description="Filter by store ID"),
    in_stock_only: bool = Query(False, description="Filter by availability: only show in-stock products"),
    db: Session = Depends(get_db)
):
    """Search products with pagination, sorting, round-robin store distribution, and additional filters."""
    # 1) Build base query (with relevance, accessory logic, sorting)
    combined_query = get_search_query(db, query, sort_by)

    # 2) Apply filters (if provided)
    if store_filter is not None:
        combined_query = combined_query.filter(Product.store_id == store_filter)
    if min_price is not None:
        combined_query = combined_query.filter(Product.price >= min_price)
    if max_price is not None:
        combined_query = combined_query.filter(Product.price <= max_price)
    if in_stock_only:
        combined_query = combined_query.filter(Product.availability == True)

    # 3) Count total
    total = combined_query.count()

    # 4) Pagination
    offset = (page - 1) * page_size
    paginated_results = combined_query.offset(offset).limit(page_size).all()
    if not paginated_results:
        raise HTTPException(status_code=404, detail="No products found matching the query")

    # 5) Extract Product objects (ignore relevance, is_accessory, etc.)
    products_only = [result[0] for result in paginated_results]

    # 6) Round-robin reorder by store
    #    (If you want to do it before pagination, you'd fetch all results, reorder, then slice.)
    reordered = reorder_by_store_round_robin(products_only)

    # 7) Price history
    product_ids = [p.product_id for p in reordered]
    last_old_prices = get_price_history(db, product_ids)

    # 8) Build final response
    products = [
        format_product_response(product, last_old_prices.get(product.product_id))
        for product in reordered
    ]

    return SearchResponse(total=total, products=products)


# ----------------------------------------
# GET /search/{product_id}
# ----------------------------------------
@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int = Path(..., description="The ID of the product to retrieve"),
    db: Session = Depends(get_db)
):
    """Get a single product by ID with its last price history."""
    product = db.query(Product).filter(Product.product_id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    last_old_prices = get_price_history(db, [product_id])
    last_old_price = last_old_prices.get(product_id)

    return format_product_response(product, last_old_price)
