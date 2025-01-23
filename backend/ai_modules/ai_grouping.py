import re
import time
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import DBSCAN
import numpy as np

# Import models and session as appropriate in your project
from models import Product, ProductGroup, Category, SessionLocal

class AIProductGrouper:
    """
    Improved AI service that groups similar products by category using DBSCAN with TF-IDF.
    Handles large datasets by processing in chunks, uses a custom preprocessor to give 
    higher priority to the first half of the words in long titles.
    """

    def process_data(self):
        """
        Main entry point to run the grouping logic for all categories.
        """
        session = SessionLocal()
        try:
            # Fetch all categories
            categories = session.query(Category).all()
            if not categories:
                print("No categories found. Exiting.")
                return

            for category in categories:
                self._group_products_by_category(session, category)
        finally:
            session.close()

    def _group_products_by_category(self, session: Session, category: Category):
        """
        Groups products within a single category. Applies chunking only for category_id 54.
        """
        products = (
            session.query(Product)
            .filter(Product.category_id == category.category_id)
            .all()
        )
        if not products:
            print(f"No products in category '{category.category_name}'. Skipping.")
            return

        print(f"Clustering {len(products)} products in category '{category.category_name}'...")

        # Apply chunking only for category_id 54
        if category.category_id == 54:
            CHUNK_SIZE = 1000
            total_chunks = (len(products) + CHUNK_SIZE - 1) // CHUNK_SIZE

            for i in range(0, len(products), CHUNK_SIZE):
                chunk = products[i:i + CHUNK_SIZE]
                chunk_index = (i // CHUNK_SIZE) + 1
                print(f"  Processing chunk {chunk_index} of {total_chunks} for category '{category.category_name}'...")
                self._cluster_chunk(session, chunk, category)
        else:
            # Process the entire category as a single chunk
            print(f"  Processing all {len(products)} products in category '{category.category_name}' at once...")
            self._cluster_chunk(session, products, category)


    def _cluster_chunk(self, session: Session, products, category: Category):
        """
        Clusters a chunk of products using DBSCAN and updates the database with groups.
        """
        start_time = time.time()

        # Prepare product titles
        product_titles = [p.title if p.title else "" for p in products]

        # -- Configure TF-IDF with a custom preprocessor that:
        #    1) Cleans text (lowercase, remove punctuation)
        #    2) Replicates first half of words if title > 10 words
        vectorizer = TfidfVectorizer(
            max_features=5000,
            preprocessor=self.priority_preprocessor,
            token_pattern=r"\b\w+\b"  # default pattern for words
        )
        tfidf_matrix = vectorizer.fit_transform(product_titles)

        # Apply DBSCAN clustering
        dbscan = DBSCAN(eps=0.3, min_samples=2, metric="cosine")
        cluster_labels = dbscan.fit_predict(tfidf_matrix)

        # Collect products by cluster label
        clusters = {}
        for idx, label in enumerate(cluster_labels):
            if label == -1:
                continue  # -1 is noise
            clusters.setdefault(label, []).append(products[idx])

        # For each cluster of size >= 2, create a product group
        for label, cluster_products in clusters.items():
            if len(cluster_products) < 2:
                continue

            # Generate a group name from top TF-IDF keywords
            # Convert cluster_products to indices relative to 'products'
            indices = [products.index(p) for p in cluster_products]
            group_name = self.generate_group_name(vectorizer, tfidf_matrix, indices)

            # Create a new ProductGroup
            new_group = ProductGroup(
                group_name=group_name,
                category_id=category.category_id
            )
            session.add(new_group)
            session.flush()  # get the group_id

            # Assign each product to this group
            for p in cluster_products:
                p.group_id = new_group.group_id

        session.commit()
        duration = time.time() - start_time
        print(f"  Chunk clustering completed in {duration:.2f} seconds for {len(products)} products.")

    def priority_preprocessor(self, text: str) -> str:
        """
        Custom preprocessor that:
          1) Cleans text (lowercase, remove non-alphanumeric).
          2) Splits into words.
          3) If more than 10 words, duplicates the first half so they have higher priority in TF-IDF.
        Returns the modified text ready for token matching.
        """
        # Lowercase and remove non-alphanumeric except spaces
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s]+", "", text)
        # Split into tokens
        tokens = text.split()

        if len(tokens) > 10:
            half_idx = len(tokens) // 2
            # replicate the first half to increase TF-IDF weight
            first_half = tokens[:half_idx]
            second_half = tokens[half_idx:]
            # replicate first_half by factor 2 (adjust as needed)
            tokens = first_half * 2 + second_half

        # Rejoin into a single string for the TfidfVectorizer
        return " ".join(tokens)

    def generate_group_name(self, vectorizer: TfidfVectorizer, tfidf_matrix, indices, top_n=3) -> str:
        """
        Generates a group name using top TF-IDF keywords for products in a cluster.
        """
        cluster_vector = tfidf_matrix[indices].sum(axis=0)
        cluster_vector = np.asarray(cluster_vector).flatten()

        # Get top words
        top_indices = cluster_vector.argsort()[::-1][:top_n]
        feature_names = vectorizer.get_feature_names_out()
        top_words = [feature_names[i] for i in top_indices if cluster_vector[i] > 0]

        # Join top words as the group name
        group_name = " ".join(top_words)
        if not group_name.strip():
            group_name = "UnspecifiedGroup"
        return group_name


# If you want a script entry point to run directly:
if __name__ == "__main__":
    grouper = AIProductGrouper()
    grouper.process_data()
