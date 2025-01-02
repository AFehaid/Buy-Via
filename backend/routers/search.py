from typing import List, Optional, Dict
from fastapi import APIRouter, Depends, HTTPException, Query, Path
from sqlalchemy.orm import Session
from sqlalchemy import or_, asc, desc, case
from models import Product, ProductPriceHistory
from dependencies.deps import get_db
from pydantic import BaseModel

# Models
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

    class Config:
        from_attributes = True

class SearchResponse(BaseModel):
    total: int
    products: List[ProductResponse]

# Utility Functions
def get_search_query(db: Session, query: str, sort_by: str):
    """Build base search query with filters and sorting"""
    words = query.split()
    
    # Create conditions with weights for relevancy
    conditions = []
    
    # Exact match in title (highest priority)
    conditions.append((Product.title.ilike(f"%{query}%"), 3.0))
    
    # Partial matches in title (medium priority)
    for word in words:
        conditions.append((Product.title.ilike(f"%{word}%"), 2.0))
    
    # Matches in info (lower priority)
    conditions.append((Product.info.ilike(f"%{query}%"), 1.0))
    for word in words:
        conditions.append((Product.info.ilike(f"%{word}%"), 0.5))

    # Build the relevance score expression
    from sqlalchemy import case, cast, Float
    relevance_score = sum(
        case((condition, weight), else_=0.0)
        for condition, weight in conditions
    ).label('relevance')

    # Base query with relevance score
    combined_query = db.query(Product, relevance_score).filter(
        or_(*[condition for condition, _ in conditions])
    )

    # Apply sorting
    if sort_by == "relevance":
        combined_query = combined_query.order_by(desc('relevance'))
    elif sort_by == "price-low":
        combined_query = combined_query.order_by(
            case((Product.price.is_(None), 1), else_=0),
            asc(Product.price)
        )
    elif sort_by == "price-high":
        combined_query = combined_query.order_by(
            case((Product.price.is_(None), 1), else_=0),
            desc(Product.price)
        )
    elif sort_by == "newest":
        combined_query = combined_query.order_by(desc(Product.date))

    # Return only products that have some relevance
    return combined_query.filter(relevance_score > 0)

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
        "last_old_price": last_old_price
    }

# Router setup
router = APIRouter(prefix="/search", tags=["search"])

# Endpoints
@router.get("/", response_model=SearchResponse)
def search_products(
    query: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Items per page"),
    sort_by: Optional[str] = Query("relevance", description="Sort by: relevance, price-low, price-high, newest"),
    db: Session = Depends(get_db)
):
    """Search products with pagination and sorting"""
    offset = (page - 1) * page_size
    combined_query = get_search_query(db, query, sort_by)
    
    # Get total count
    total = combined_query.count()

    # Apply pagination and get results
    paginated_results = combined_query.offset(offset).limit(page_size).all()

    if not paginated_results:
        raise HTTPException(status_code=404, detail="No products found matching the query")

    # Extract products from results (excluding relevance scores)
    products_only = [result[0] for result in paginated_results]

    # Get price history
    product_ids = [p.product_id for p in products_only]
    last_old_prices = get_price_history(db, product_ids)

    # Format response
    products = [
        format_product_response(
            product, 
            last_old_prices.get(product.product_id)
        ) 
        for product in products_only
    ]

    return SearchResponse(total=total, products=products)

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(
    product_id: int = Path(..., description="The ID of the product to retrieve"),
    db: Session = Depends(get_db)
):
    """Get a single product by ID with its last price history"""
    # Query the database for the product
    product = db.query(Product).filter(Product.product_id == product_id).first()
    
    # Raise 404 if product not found
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Get price history for the product
    last_old_prices = get_price_history(db, [product_id])
    last_old_price = last_old_prices.get(product_id)

    # Format and return response using the common formatter
    return format_product_response(product, last_old_price)
