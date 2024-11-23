# C:\Users\afeha\Documents\My Documents\Buy-Via\backend\main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os
from routers import auth, search

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

@app.get("/")
async def health_check():
    return {"Healthy": 200}
