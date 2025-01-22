# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

from routers import auth, search, alert
from scheduler import start_background_tasks  # <-- NEW: import the function

load_dotenv()

# ======================================
# Lifespan (Startup/Shutdown) logic
# ======================================
def lifespan(app: FastAPI):
    # Start background tasks (threads)
    start_background_tasks()

    yield  # Application is up and running
    print("Application shutting down. Perform cleanup if necessary.")

# ======================================
# Create the FastAPI App
# ======================================
app = FastAPI(lifespan=lifespan)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("API_URL")],
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
