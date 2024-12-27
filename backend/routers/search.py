from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_
from models import Product, ProductPriceHistory
from dependencies.deps import get_db
from typing import List
from pydantic import BaseModel
from sqlalchemy.sql import func


# Router setup
router = APIRouter(
    prefix="/search",
    tags=["search"]
)

# Response model for products
class ProductResponse(BaseModel):
    product_id: int
    title: str
    price: float | None  # Nullable field
    info: str | None
    link: str
    image_url: str
    store_id: int
    availability: bool
    last_old_price: float | None  # Nullable field for the last old price

    class Config:
        from_attributes = True  # Replaces orm_mode

class SearchResponse(BaseModel):
    total_count: int
    products: List[ProductResponse]  # Reuse the existing ProductResponse model

    class Config:
        from_attributes = True  # Replaces orm_mode

@router.get("/", response_model=SearchResponse)
def search_products(
    query: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of results per page"),
    db: Session = Depends(get_db)
):
    """
    Search for products based on title and info fields.
    Returns the total count of results and a paginated list of products.
    """
    # Split the query into individual words
    words = query.split()

    # Calculate offset for pagination
    offset = (page - 1) * page_size

    # Build the conditions for adjacent and non-adjacent matches
    adjacent_condition = or_(
        Product.title.ilike(f"%{query}%"),  # Adjacent match in title
        Product.info.ilike(f"%{query}%")   # Adjacent match in info
    )
    
    non_adjacent_conditions = [
        or_(
            Product.title.ilike(f"%{word}%"),
            Product.info.ilike(f"%{word}%")
        )
        for word in words
    ]

    # Query for adjacent matches
    adjacent_matches = db.query(Product).filter(adjacent_condition)

    # Query for non-adjacent matches
    non_adjacent_matches = db.query(Product).filter(*non_adjacent_conditions)

    # Combine results: adjacent first, then non-adjacent
    combined_results = adjacent_matches.union_all(non_adjacent_matches)

    # Create a subquery to calculate the total count
    total_count_query = combined_results.subquery()
    total = db.query(func.count()).select_from(total_count_query).scalar()

    # Apply pagination
    paginated_results = combined_results.offset(offset).limit(page_size).all()

    # If no products are found, return a 404
    if not paginated_results:
        raise HTTPException(status_code=404, detail="No products found matching the query")

    # Fetch the last old price for each product
    product_ids = [product.product_id for product in paginated_results]
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

    # Build the response manually
    products = []
    for product in paginated_results:
        product_data = {
            "product_id": product.product_id,
            "title": product.title,
            "price": product.price,
            "info": product.info,
            "link": product.link,
            "image_url": product.image_url,
            "store_id": product.store_id,
            "availability": product.availability,
            "last_old_price": last_old_prices.get(product.product_id, None)  # Ensure this field is included
        }
        products.append(product_data)

    # Return the paginated results with the total count
    return {
        "total_count": total,
        "products": products
    }


@router.get("/products/", response_model=ProductResponse)
def get_product(
    product_id: int = Query(..., description="The ID of the product to retrieve"),  # Use ... to make it required
    db: Session = Depends(get_db)
):
    """
    Get a single product by ID, including the last old price before the most recent change.
    """
    # Query the database for the exact product
    product = db.query(Product).filter(Product.product_id == product_id).first()

    # Raise an error if the product is not found
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Fetch the last old price for the product
    last_price_history = (
        db.query(ProductPriceHistory)
        .filter(ProductPriceHistory.product_id == product_id)
        .order_by(ProductPriceHistory.change_date.desc())
        .first()
    )
    last_old_price = last_price_history.old_price if last_price_history else None

    # Manually construct the response with all required fields
    product_response = {
        "product_id": product.product_id,
        "title": product.title,
        "price": product.price,
        "info": product.info,
        "link": product.link,
        "image_url": product.image_url,
        "store_id": product.store_id,
        "availability": product.availability,
        "last_old_price": last_old_price  # Include the last old price
    }
    return product_response

