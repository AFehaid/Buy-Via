import re
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
import numpy as np
# Import your base AIService interface (if you want to keep consistent with the structure)
from .ai_service import AIService

# Import your DB session and models
# Adjust these imports as needed depending on how you structure your project
from models import Product, ProductGroup
from models import SessionLocal



def clean_title(title: str) -> str:
    """
    Basic text cleaning. Adjust as needed.
    For example, remove punctuation, make lowercase, etc.
    """
    if not title:
        return ""
    # Convert to lowercase
    text = title.lower()
    # Remove non-alphanumeric (retain letters, numbers, and spaces)
    text = re.sub(r'[^a-z0-9\s]+', '', text)
    # Reduce multiple spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text


class AIProductGrouper(AIService):
    """
    Example AIService that groups similar products (by title) into the same ProductGroup.
    """

    def process_data(self):
        """
        Main entry point to run the grouping logic.
        """
        # Create a DB session
        session = SessionLocal()

        try:
            self._group_products(session)
        finally:
            session.close()

    def _group_products(self, session: Session):
        """
        Fetches all products, applies a text clustering approach using DBSCAN with TF-IDF,
        and updates/creates product groups for clusters of size >= 2.
        """

        # ---------------------------
        # 1. Fetch Products from DB
        # ---------------------------
        products = session.query(Product).all()
        if not products:
            print("No products found. Exiting.")
            return

        print(f"Loaded {len(products)} products...")

        # ---------------------------
        # 2. Prepare Titles for Clustering
        # ---------------------------
        product_titles = [clean_title(p.title) for p in products]

        # ---------------------------
        # 3. Vectorize with TF-IDF
        # ---------------------------
        vectorizer = TfidfVectorizer()
        tfidf_matrix = vectorizer.fit_transform(product_titles)

        # ---------------------------
        # 4. Cluster with DBSCAN
        #    - metric='cosine' uses vector similarity
        #    - eps ~ 0.3 is often a starting guess, tune it
        #    - min_samples=2 means at least 2 items must be near each other
        # ---------------------------
        dbscan = DBSCAN(eps=0.3, min_samples=2, metric='cosine')
        cluster_labels = dbscan.fit_predict(tfidf_matrix)

        # Number of clusters = number of unique labels (excluding -1)
        unique_labels = set(cluster_labels) - {-1}
        print(f"Found {len(unique_labels)} clusters (excluding noise).")

        # ---------------------------
        # 5. Create or Update ProductGroups
        # ---------------------------
        # We'll map cluster_label -> list of product_ids
        clusters = {}
        for idx, label in enumerate(cluster_labels):
            if label == -1:
                continue
            clusters.setdefault(label, []).append(products[idx])

        for label, cluster_products in clusters.items():
            # If only 1 product in cluster, skip (since we only group duplicates)
            if len(cluster_products) < 2:
                continue

            # 5a. Create a new ProductGroup for this cluster (or reuse your logic).
            #     In this example, we'll create a new group each time we run.
            new_group = ProductGroup(group_name=f"AI-Cluster-{label}")
            session.add(new_group)
            session.flush()  # so we get the group_id

            # 5b. Assign cluster products to this group
            for p in cluster_products:
                p.group_id = new_group.group_id

        # ---------------------------
        # 6. Commit the Changes
        # ---------------------------
        session.commit()
        print("Product grouping completed and saved to the database.")


# If you want a script entry point to run directly:
if __name__ == "__main__":
    grouper = AIProductGrouper()
    grouper.process_data()