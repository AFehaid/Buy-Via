# backend/routers/auth.py
from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, EmailStr
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from datetime import timedelta, datetime, timezone
from jose import jwt
from sqlalchemy.orm import Session
from dependencies.deps import db_dependency, bcrypt_context, get_optional_current_user
from models import User
import os
from dotenv import load_dotenv
from jose.exceptions import JWTError
from typing import Optional

load_dotenv()

router = APIRouter(
    prefix="/auth",
    tags=["auth"]
)

SECRET_KEY = os.getenv("AUTH_SECRET_KEY")
ALGORITHM = os.getenv("AUTH_ALGORITHM")

# Request and Response Models
class UserCreateRequest(BaseModel):
    username: str
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

def authenticate_user(username: str, password: str, db: Session):
    user = db.query(User).filter(User.username == username).first()
    if not user or not bcrypt_context.verify(password, user.password):
        return False
    return user

def create_access_token(username: str, user_id: int, expires_delta: timedelta):
    encode = {'sub': username, 'id': user_id}
    expires = datetime.now(timezone.utc) + expires_delta
    encode.update({'exp': expires})
    return jwt.encode(encode, SECRET_KEY, algorithm=ALGORITHM)

@router.get("/me")
async def get_current_user_info(current_user: Optional[dict] = Depends(get_optional_current_user)):
    """
    Check if the user is logged in and return their information.
    """
    if current_user:
        return {"logged_in": True, "user": current_user}
    return {"logged_in": False, "user": None}


# Register Route
@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreateRequest, db: db_dependency):
    # Check if the username or email already exists
    existing_user = db.query(User).filter(
        (User.username == user.username) | (User.email == user.email)
    ).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="Username or Email already exists")

    # Create and save the new user
    hashed_password = bcrypt_context.hash(user.password)
    new_user = User(
        username=user.username,
        email=user.email,
        password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"message": "User registered successfully"}


@router.post("/token", response_model=Token)
async def login_for_access_token(
    response: Response,
    db: db_dependency,
    form_data: OAuth2PasswordRequestForm = Depends(),
):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password",
        )
    token = create_access_token(user.username, user.user_id, timedelta(seconds=1))  # Token expires in 1 second

    # Set the token in an HTTP-only cookie
    response.set_cookie(
        key="access_token",
        value=f"Bearer {token}",
        httponly=True,
        secure=True,  # Only send over HTTPS
        samesite="lax",  # Prevent CSRF attacks
        max_age=31,  # Expire after 1 second
    )

    return {"access_token": token, "token_type": "bearer"}

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=403, detail="Token is invalid or expired")
        return payload
    except JWTError:
        raise HTTPException(status_code=403, detail="Token is invalid or expired")


@router.get("/verify-token/")
async def verify_user_token(token: str):
    verify_token(token=token)
    return {"valid": "true"}