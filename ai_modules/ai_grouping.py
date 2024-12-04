import os
import pandas as pd
import numpy as np
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
from sklearn.metrics.pairwise import cosine_similarity
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from models import Product, Category, ProductGroup, Base  # Import your ORM models
from dotenv import load_dotenv
from ai_service import AIService

class AIGrouping(AIService):
    def __init__(self, session):
        self.session = session

    def process_data(self):
        self.group_products()

    def preprocess_text(self, text):
        # Same as in AIClassification
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        text = text.lower()
        tokens = nltk.word_tokenize(text)
        tokens = [t for t in tokens if t not in stopwords.words('english')]
        stemmer = PorterStemmer()
        tokens = [stemmer.stem(t) for t in tokens]
        return ' '.join(tokens)

    def fetch_products_by_category(self, category_id):
        """
        Fetch products belonging to a specific category.
        """
        products = self.session.query(Product).filter(
            Product.category_id == category_id
        ).all()
        return products

    def group_products(self):
        # Step 1: Fetch all categories
        categories = self.session.query(Category).all()
        if not categories:
            print("No categories found.")
            return

        for category in categories:
            print(f"Processing category: {category.category_name}")
            products = self.fetch_products_by_category(category.category_id)
            if len(products) < 2:
                print(f"Not enough products in category '{category.category_name}' to group.")
                continue

            # Step 2: Prepare data
            data = []
            product_ids = []
            for product in products:
                processed_title = self.preprocess_text(product.title)
                data.append(processed_title)
                product_ids.append(product.product_id)

            # Step 3: Feature extraction
            vectorizer = TfidfVectorizer()
            X = vectorizer.fit_transform(data)

            # Step 4: Clustering
            # Compute similarity matrix
            similarity_matrix = cosine_similarity(X)
            # Use DBSCAN clustering
            clustering = DBSCAN(eps=0.5, min_samples=2, metric='precomputed')
            clusters = clustering.fit(1 - similarity_matrix)  # Dissimilarity matrix

            labels = clusters.labels_
            unique_labels = set(labels)
            print(f"Found {len(unique_labels) - (1 if -1 in labels else 0)} clusters in category '{category.category_name}'.")

            # Step 5: Update database
            for label in unique_labels:
                if label == -1:
                    # Noise, skip
                    continue
                # Create a new ProductGroup
                group = ProductGroup(
                    group_name=f"{category.category_name} Group {label}",
                    category_id=category.category_id
                )
                self.session.add(group)
                self.session.commit()
                # Assign products to the group
                indices = [i for i, lbl in enumerate(labels) if lbl == label]
                for idx in indices:
                    product = self.session.query(Product).get(product_ids[idx])
                    product.group_id = group.group_id
                    self.session.commit()
                    print(f"Product '{product.title}' assigned to group '{group.group_name}'")
