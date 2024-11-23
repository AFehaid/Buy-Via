from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
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
    Search for products based on title and info fields.
    """
    # Calculate offset for pagination
    offset = (page - 1) * page_size

    # Perform the search using ILIKE for title and info
    products = db.query(Product).filter(
        (Product.title.ilike(f"%{query}%")) | (Product.info.ilike(f"%{query}%"))
    ).offset(offset).limit(page_size).all()

    # If no products are found, return a 404
    if not products:
        raise HTTPException(status_code=404, detail="No products found matching the query")

    return products
