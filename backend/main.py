# \Buy-Via\backend\main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routers import auth, search , alert
from ai_modules.ai_recommendation import continuously_update_recommendations
import threading
from dependencies.deps import get_db
from sqlalchemy.orm import Session
from models import SessionLocal

load_dotenv()
print(f"DB_URL: {os.getenv('DB_URL')}")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("API_URL")],  # The default React port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(search.router)
app.include_router(alert.router)

# Background task to run the recommendation engine
def run_recommendation_updater():
    with SessionLocal() as db:  # Use a database session
        continuously_update_recommendations(db, interval_seconds=60)

# FastAPI startup event
@app.on_event("startup")
def on_startup():
    """
    Event triggered on application startup.
    Starts the recommendation updater in a separate thread.
    """
    recommendation_thread = threading.Thread(target=run_recommendation_updater, daemon=True)
    recommendation_thread.start()
    print("Recommendation updater started in the background.")

@app.get("/")
async def health_check():
    return {"Healthy": 200}
