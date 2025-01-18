#!/usr/bin/env python3

import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, accuracy_score
import pickle
import os
from tqdm import tqdm

def main():
    print("1. Loading the CSV file...")
    csv_path = "/home/fahoo/Downloads/products.csv"
    df = pd.read_csv(csv_path)
    print(f"   Loaded {len(df)} rows from the CSV file.")

    print("2. Combining 'title' and 'search_value' columns into a single text feature...")
    df['title'] = df['title'].astype(str)
    df['search_value'] = df['search_value'].astype(str)
    df['combined_text'] = df['title'] + " " + df['search_value']

    print("3. Separating features (X) and labels (y)...")
    X = df['combined_text']
    y = df['category_id']

    print("4. Splitting into training and test sets...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, 
        y, 
        test_size=0.2, 
        random_state=42, 
        stratify=y
    )
    print(f"   Training set size: {len(X_train)}")
    print(f"   Test set size: {len(X_test)}")

    print("5. Creating the classification pipeline...")
    text_clf = Pipeline([
        ('tfidf', TfidfVectorizer(
            stop_words='english',
            lowercase=True
        )),
        ('clf', LogisticRegression(
            random_state=42,
            max_iter=1000
        ))
    ])

    print("6. Training the model (this might take some time)...")
    # Adding progress for fit
    for _ in tqdm(range(1), desc="   Training Progress"):  # Simulates progress for training
        text_clf.fit(X_train, y_train)

    print("7. Evaluating the model...")
    y_pred = text_clf.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"   Accuracy: {accuracy:.4f}")

    print("   Classification Report:")
    print(classification_report(y_test, y_pred))

    print("8. Saving the trained model...")
    save_path = "/home/fahoo/Documents/Buy-Via/backend/ai_modules"
    os.makedirs(save_path, exist_ok=True)
    model_file_path = os.path.join(save_path, "text_classification_model.pkl")

    with open(model_file_path, "wb") as f:
        pickle.dump(text_clf, f)
    print(f"   Model saved to {model_file_path}")

if __name__ == "__main__":
    main()
