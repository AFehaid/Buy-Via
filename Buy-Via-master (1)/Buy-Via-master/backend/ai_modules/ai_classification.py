import os
import pandas as pd
import numpy as np
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import LabelEncoder
from sklearn.naive_bayes import MultinomialNB
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import re
import nltk
from nltk.corpus import stopwords
from nltk.stem import PorterStemmer
from models import Product, Category, Base  # Import your ORM models
from dotenv import load_dotenv
from ai_service import AIService

class AIClassification(AIService):
    def __init__(self, session):
        self.session = session
        self.vectorizer = None
        self.label_encoder = None
        self.classifier = None

    def process_data(self):
        self.classify_products()

    def preprocess_text(self, text):
        # Remove non-alphabetic characters
        text = re.sub(r'[^a-zA-Z\s]', '', text)
        # Lowercase
        text = text.lower()
        # Tokenize
        tokens = nltk.word_tokenize(text)
        # Remove stop words
        tokens = [t for t in tokens if t not in stopwords.words('english')]
        # Stemming
        stemmer = PorterStemmer()
        tokens = [stemmer.stem(t) for t in tokens]
        # Join tokens back to string
        return ' '.join(tokens)

    def fetch_labeled_data(self):
        """
        Fetch products that have already been categorized.
        """
        products = self.session.query(Product).filter(Product.category_id != None).all()
        data = []
        for product in products:
            data.append({
                'title': product.title,
                'category': product.category.category_name
            })
        return pd.DataFrame(data)

    def fetch_uncategorized_products(self):
        """
        Fetch products that have not been categorized yet.
        """
        return self.session.query(Product).filter(Product.category_id == None).all()

    def classify_products(self):
        # Step 1: Fetch labeled data
        df = self.fetch_labeled_data()
        if df.empty:
            print("No labeled data available for training.")
            return

        # Step 2: Preprocess text data
        df['processed_title'] = df['title'].apply(self.preprocess_text)

        # Step 3: Feature extraction
        self.vectorizer = TfidfVectorizer()
        X = self.vectorizer.fit_transform(df['processed_title'])

        # Step 4: Label encoding
        self.label_encoder = LabelEncoder()
        y = self.label_encoder.fit_transform(df['category'])

        # Step 5: Model training
        self.classifier = MultinomialNB()
        self.classifier.fit(X, y)

        # Optional: Evaluate the model
        # X_train, X_test, y_train, y_test = train_test_split(
        #     X, y, test_size=0.2, random_state=42
        # )
        # y_pred = self.classifier.predict(X_test)
        # print("Classification Report:")
        # print(classification_report(y_test, y_pred, target_names=self.label_encoder.classes_))

        # Step 6: Classify uncategorized products
        uncategorized_products = self.fetch_uncategorized_products()
        if not uncategorized_products:
            print("No uncategorized products found.")
            return

        # Prepare data for prediction
        uncategorized_titles = [self.preprocess_text(p.title) for p in uncategorized_products]
        X_new = self.vectorizer.transform(uncategorized_titles)

        # Predict categories
        predicted_categories = self.classifier.predict(X_new)
        predicted_category_names = self.label_encoder.inverse_transform(predicted_categories)

        # Step 7: Update the database
        for product, category_name in zip(uncategorized_products, predicted_category_names):
            # Fetch or create the category
            category = self.session.query(Category).filter_by(category_name=category_name).first()
            if not category:
                category = Category(category_name=category_name)
                self.session.add(category)
                self.session.commit()
            # Update product category
            product.category_id = category.category_id
            self.session.commit()
            print(f"Product '{product.title}' classified as '{category_name}'")
