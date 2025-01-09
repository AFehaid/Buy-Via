# backend/routers/alert.py
from fastapi import APIRouter, Depends, HTTPException, status,Query
from pydantic import BaseModel, PositiveFloat
from typing import List, Optional
from sqlalchemy.orm import Session
from dependencies.deps import db_dependency, get_current_user
from models import Alert, Product, User

'''
in the future, we will implement the email sending functionality in other file

we will use this library to send email
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dotenv import load_dotenv
'''

router = APIRouter(
    prefix="/alerts",
    tags=["alerts"]
)

class AlertCreateRequest(BaseModel):
    product_id: int
    threshold_price: PositiveFloat

class AlertUpdateRequest(BaseModel):
    threshold_price: PositiveFloat

class AlertResponse(BaseModel):
    alert_id: int
    product_id: int
    threshold_price: float
    alert_status: str

@router.post("/", response_model=AlertResponse, status_code=status.HTTP_201_CREATED)
async def create_alert(
    alert_req: AlertCreateRequest,
    db: db_dependency,
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new alert for the signed-in user.
    The user sets a threshold_price for a given product.
    An email will be sent later when the product price drops below threshold_price.
    """
    # Check if product exists
    product = db.query(Product).filter(Product.product_id == alert_req.product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")

    # Check if the user already has an alert for this product
    existing_alert = db.query(Alert).filter(
        Alert.user_id == current_user["id"],
        Alert.product_id == alert_req.product_id
    ).first()
    if existing_alert:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Alert for this product already exists")

    new_alert = Alert(
        user_id=current_user["id"],
        product_id=alert_req.product_id,
        threshold_price=alert_req.threshold_price,
        alert_status="active"
    )
    db.add(new_alert)
    db.commit()
    db.refresh(new_alert)

    return AlertResponse(
        alert_id=new_alert.alert_id,
        product_id=new_alert.product_id,
        threshold_price=new_alert.threshold_price,
        alert_status=new_alert.alert_status
    )

@router.get("/", response_model=List[AlertResponse])
async def list_user_alerts(
    db: db_dependency,
    user_id: int = Query(..., description="The ID of the user to fetch alerts for"),
):
    """
    List all alerts for a specific user by user ID.
    """
    alerts = db.query(Alert).filter(Alert.user_id == user_id).all()
    return [
        AlertResponse(
            alert_id=a.alert_id,
            product_id=a.product_id,
            threshold_price=a.threshold_price,
            alert_status=a.alert_status,
        )
        for a in alerts
    ]

@router.put("/{alert_id}", response_model=AlertResponse)
async def update_alert(
    alert_id: int,
    alert_req: AlertUpdateRequest,
    db: db_dependency,
    current_user: dict = Depends(get_current_user)
):
    """
    Update the threshold_price of an existing alert.
    """
    alert = db.query(Alert).filter(Alert.alert_id == alert_id, Alert.user_id == current_user["id"]).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    alert.threshold_price = alert_req.threshold_price
    db.commit()
    db.refresh(alert)

    return AlertResponse(
        alert_id=alert.alert_id,
        product_id=alert.product_id,
        threshold_price=alert.threshold_price,
        alert_status=alert.alert_status
    )

@router.delete("/{alert_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_alert(
    alert_id: int,
    db: db_dependency,
    current_user: dict = Depends(get_current_user)
):
    """
    Delete an alert owned by the currently signed-in user.
    """
    alert = db.query(Alert).filter(Alert.alert_id == alert_id, Alert.user_id == current_user["id"]).first()
    if not alert:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Alert not found")

    db.delete(alert)
    db.commit()
    return None