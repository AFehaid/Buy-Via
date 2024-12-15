from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy.sql import or_
from models import Product
from dependencies.deps import get_db
from typing import List
from pydantic import BaseModel

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
    availability : bool

    class Config:
        orm_mode = True

# Search endpoint
@router.get("/", response_model=List[ProductResponse])
def search_products(
    query: str = Query(..., min_length=1, description="Search query"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Number of results per page"),
    db: Session = Depends(get_db)
):
    """
    Improved search for products based on title and info fields.
    Prioritize results with adjacent word matches first.
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

    # Apply pagination
    paginated_results = combined_results.offset(offset).limit(page_size).all()

    # If no products are found, return a 404
    if not paginated_results:
        raise HTTPException(status_code=404, detail="No products found matching the query")

    return paginated_results

@router.get("/products/", response_model=ProductResponse)
def get_product(
    product_id: int = Query(..., description="The ID of the product to retrieve"),  # Use ... to make it required
    db: Session = Depends(get_db)
):
    # Query the database for the exact product
    product = db.query(Product).filter(Product.product_id == product_id).first()

    # Raise an error if the product is not found
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product