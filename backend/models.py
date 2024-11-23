# C:\Users\afeha\Documents\My Documents\Buy-Via\backend\models.py
import os
from datetime import datetime, timezone
from sqlalchemy import (
    create_engine, Column, Integer, String, ForeignKey, Float, DateTime, Boolean
)
from sqlalchemy.ext.declarative import declarative_base # to Initialize Base for the models
from sqlalchemy.orm import relationship, sessionmaker
from dotenv import load_dotenv
from pathlib import Path

# Load environment variables
load_dotenv()

# Initialize Base
Base = declarative_base()

# Database connection setup
environment = os.getenv("DEPLOYMENT_ENVIRONMENT", "DEV")
db_url = os.getenv("DB_URL")

if not db_url:
    raise RuntimeError("DB_URL environment variable is not set!")

# Resolve SQLite path for development
if environment == "DEV" and "sqlite" in db_url:
    db_path = Path(db_url.replace("sqlite:///", ""))
    db_path.parent.mkdir(parents=True, exist_ok=True)  # Ensure directory exists
    print(f"Database path resolved to: {db_path.resolve()}")

# Create engine
engine = create_engine(
    db_url,
    connect_args={"check_same_thread": False} if "sqlite" in db_url else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Models
class User(Base):
    __tablename__ = "users"
    user_id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    search_histories = relationship("SearchHistory", back_populates="user")
    alerts = relationship("Alert", back_populates="user")


class Product(Base):
    __tablename__ = "products"
    product_id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=True)
    info = Column(String) 
    search_value = Column(String, index=True)
    link = Column(String)
    image_url = Column(String)
    store_id = Column(Integer, ForeignKey("stores.store_id"))
    group_id = Column(Integer, ForeignKey("product_groups.group_id"))
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    availability = Column(Boolean, default=True)
    store = relationship("Store", back_populates="products")
    category = relationship("Category", back_populates="products")
    group = relationship("ProductGroup", back_populates="products")


class Store(Base):
    __tablename__ = "stores"
    store_id = Column(Integer, primary_key=True, index=True)
    store_name = Column(String, nullable=False)
    products = relationship("Product", back_populates="store")


class Category(Base):
    __tablename__ = "categories"
    category_id = Column(Integer, primary_key=True, index=True)
    category_name = Column(String)
    products = relationship("Product", back_populates="category")
    product_groups = relationship("ProductGroup", back_populates="category")


class ProductGroup(Base):
    __tablename__ = "product_groups"
    group_id = Column(Integer, primary_key=True, index=True)
    group_name = Column(String, nullable=False)
    category_id = Column(Integer, ForeignKey("categories.category_id"))
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    category = relationship("Category", back_populates="product_groups")
    products = relationship("Product", back_populates="group")


class SearchHistory(Base):
    __tablename__ = "search_histories"
    search_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    search_value = Column(String, nullable=False)
    search_date = Column(DateTime, default=datetime.now(timezone.utc))
    user = relationship("User", back_populates="search_histories")


class Alert(Base):
    __tablename__ = "alerts"
    alert_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"))
    product_id = Column(Integer, ForeignKey("products.product_id"))
    threshold_price = Column(Float, nullable=False)
    alert_status = Column(String, default="active")  # Options: active, triggered, expired
    created_at = Column(DateTime, default=datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc))
    user = relationship("User", back_populates="alerts")
    product = relationship("Product")


class ProductMatch(Base):
    __tablename__ = "product_matches"
    product_match_id = Column(Integer, primary_key=True, index=True)
    product_id_1 = Column(Integer, ForeignKey("products.product_id"))
    product_id_2 = Column(Integer, ForeignKey("products.product_id"))
    similarity_score = Column(Float)


# Create all tables
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully.")
except Exception as e:
    print(f"Error creating database tables: {e}")
