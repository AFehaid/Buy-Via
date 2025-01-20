from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
import threading
import time

from routers import auth, search, alert
from ai_modules.ai_recommendation import continuously_update_recommendations
from models import SessionLocal, Alert, Product

load_dotenv()

# ======================================
# 1) Recommendation Updater Thread
# ======================================
def run_recommendation_updater(interval_seconds: int = 60):
    """
    Example background task to run your recommendation engine 
    in a loop every X seconds.
    """
    while True:
        with SessionLocal() as db:
            continuously_update_recommendations(db)
        time.sleep(interval_seconds)

# ======================================
# 2) Alert Monitoring Thread
# ======================================
def continuously_monitor_alerts(interval_seconds: int = 60):
    """
    Continuously monitor "active" alerts. If a product's current price 
    is <= the alert threshold_price, mark it as 'triggered'.
    """
    while True:
        with SessionLocal() as db:
            active_alerts = (
                db.query(Alert)
                .join(Product, Alert.product_id == Product.product_id)
                .filter(Alert.alert_status == "active")
                .all()
            )
            for a in active_alerts:
                # If the product price is set and <= threshold, update status
                if a.product and a.product.price is not None:
                    if a.product.price <= a.threshold_price:
                        a.alert_status = "triggered"
            db.commit()
        time.sleep(interval_seconds)

def run_alert_monitor():
    continuously_monitor_alerts(interval_seconds=60)

# ======================================
# Lifespan (Startup/Shutdown) logic
# ======================================
def lifespan(app: FastAPI):
    """
    Lifespan context manager to manage startup and shutdown tasks.
    """
    # Start the recommendation thread
    recommendation_thread = threading.Thread(
        target=run_recommendation_updater, 
        daemon=True
    )
    recommendation_thread.start()

    # Start the alert monitoring thread
    alert_monitor_thread = threading.Thread(
        target=run_alert_monitor, 
        daemon=True
    )
    alert_monitor_thread.start()

    print("Background tasks have started (recommendations + alert monitor).")

    yield  # Application is up and running

    print("Application shutting down. Perform cleanup if necessary.")

# ======================================
# Create the FastAPI App
# ======================================
app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("API_URL_DEV")],  # or multiple origins if needed
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your routers
app.include_router(auth.router)
app.include_router(search.router)
app.include_router(alert.router)

# Health check or root endpoint
@app.get("/")
async def health_check():
    return {"Healthy": 200}
