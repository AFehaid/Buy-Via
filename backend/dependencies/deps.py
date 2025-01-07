# Buy-Via\backend\dependencies\deps.py
from typing import Annotated
from sqlalchemy.orm import Session
from fastapi import Depends, HTTPException, status, Security
from fastapi.security import OAuth2PasswordBearer
from passlib.context import CryptContext
from jose import jwt, JWTError
from dotenv import load_dotenv
import os
from models import SessionLocal

load_dotenv()

SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
ALGORITHM = os.getenv("AUTH_ALGORITHM")

bcrypt_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_bearer = OAuth2PasswordBearer(tokenUrl="auth/token")

# Database Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

db_dependency = Annotated[Session, Depends(get_db)]

oauth2_bearer_optional = OAuth2PasswordBearer(tokenUrl="auth/token", auto_error=False)

async def get_optional_current_user(token: str = Depends(oauth2_bearer_optional)):
    """
    Retrieve the current user if authenticated; otherwise, return None.
    """
    if token:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            username: str = payload.get("sub")
            user_id: int = payload.get("id")
            if username is None or user_id is None:
                return None
            return {"username": username, "id": user_id}
        except JWTError:
            return None
    return None

# Authentication Dependency
async def get_current_user(token: str = Depends(oauth2_bearer)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        user_id: int = payload.get("id")
        if username is None or user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return {"username": username, "id": user_id}
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
