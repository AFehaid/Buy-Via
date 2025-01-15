from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routers import auth, search, alert
from ai_modules.ai_recommendation import continuously_update_recommendations
import threading
from models import SessionLocal

load_dotenv()
print(f"DB_URL: {os.getenv('DB_URL')}")

def run_recommendation_updater():
    """
    Background task to run the recommendation engine.
    """
    with SessionLocal() as db:  # Use a database session
        continuously_update_recommendations(db, interval_seconds=60)

# Define the lifespan function
def lifespan(app: FastAPI):
    """
    Lifespan context manager to manage startup and shutdown tasks.
    """
    recommendation_thread = threading.Thread(target=run_recommendation_updater, daemon=True)
    recommendation_thread.start()
    print("Recommendation updater started in the background.")
    
    yield  # Allows the application to start
    
    print("Application shutting down. Perform cleanup if necessary.")

app = FastAPI(lifespan=lifespan)

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

@app.get("/")
async def health_check():
    return {"Healthy": 200}
