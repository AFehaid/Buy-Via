# backend/scraper/arabic_title_updater.py
import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, ProductTitleTranslation, engine
from datetime import datetime, timezone
from collections import defaultdict
import argparse


# Set up logging
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


class ArabicTitleUpdater:
    def __init__(self, chunk_size=100, start_store_id=None, start_product_id=None):
        """
        Initialize the ArabicTitleUpdater.

        :param chunk_size: Number of products to process at once (default=100).
        :param start_store_id: (Optional) Store ID to start processing from.
        :param start_product_id: (Optional) Product ID to start processing from within each store.
        """
        # Map each store name to its corresponding scraper class
        self.scrapers = {
            "Amazon": AmazonScraper,
            "Jarir": JarirScraper,
            "Extra": ExtraScraper,
        }
        self.chunk_size = chunk_size
        self.start_store_id = start_store_id
        self.start_product_id = start_product_id

    def get_arabic_url(self, product):
        """
        Convert English URL to Arabic URL based on known patterns.
        """
        if "jarir.com" in product.link:
            return product.link.replace("/sa-en/", "/").replace("?country=sa", "") + "?country=sa"
        elif "amazon.sa" in product.link:
            # Ensure proper URL encoding
            return product.link + "&language=ar_AE"
        elif "extra.com" in product.link:
            return product.link.replace("/en-sa/", "/ar-sa/")
        else:
            return None

    def scrape_and_update_title(self, scraper, product, session):
        """
        Scrape Arabic title for a product and create/update a row in ProductTitleTranslation,
        but skip if the scraper returns "Title unavailable" or None.
        """
        arabic_url = self.get_arabic_url(product)
        if not arabic_url:
            logger.warning(f"[{product.store.store_name}] Could not derive Arabic URL for Product ID {product.product_id}. Skipping.")
            return

        try:
            result = scraper.scrape_arabic(arabic_url)
            # If the scraper returns None or missing 'title_arabic', treat it as unavailable
            if not result or "title_arabic" not in result:
                logger.warning(f"[{product.store.store_name}] Product ID {product.product_id} - No Arabic title extracted. Skipping DB update.")
                return

            arabic_title = result["title_arabic"]

            if arabic_title == "Title unavailable" or not arabic_title.strip():
                # If the scraped Arabic title is literally "Title unavailable" or empty,
                # skip writing it to the DB.
                logger.warning(f"[{product.store.store_name}] Product ID {product.product_id} - Title unavailable or empty. Skipping DB update.")
                return

            # Otherwise, we have a valid Arabic title -> proceed to update or create a row
            logger.info(f"[{product.store.store_name}] Product ID {product.product_id} - Arabic Title: {arabic_title}")

            # Check if a translation record already exists
            translation = session.query(ProductTitleTranslation).filter_by(
                product_id=product.product_id, language="ar"
            ).first()

            if translation:
                translation.translated_title = arabic_title
                logger.info(f"[{product.store.store_name}] Updated Arabic title for Product ID {product.product_id}.")
            else:
                session.add(ProductTitleTranslation(
                    product_id=product.product_id,
                    language="ar",
                    translated_title=arabic_title
                ))
                logger.info(f"[{product.store.store_name}] Added Arabic title for Product ID {product.product_id}.")

        except Exception as e:
            logger.error(f"[{product.store.store_name}] Error scraping Product ID {product.product_id}: {e}")

    def process_store(self, store, batch_size=100):
        """
        Process all products for a specific store in batches,
        creating/updating the Arabic translation if missing.
        """
        scraper_class = self.scrapers.get(store.store_name)
        if not scraper_class:
            logger.error(f"No scraper found for store: {store.store_name}. Skipping.")
            return

        scraper = scraper_class(store.store_name)
        try:
            scraper.driver = scraper.setup_driver()
        except Exception as e:
            logger.error(f"Failed to initialize scraper for store: {store.store_name}. Error: {e}")
            return

        with Session(engine) as session:
            # Build the base query
            product_query = session.query(Product).filter(
                Product.store_id == store.store_id
            )

            # If start_product_id is set and this is the first batch, apply it
            if self.start_product_id is not None:
                product_query = product_query.filter(Product.product_id >= self.start_product_id)
                logger.info(f"[{store.store_name}] Starting from Product ID >= {self.start_product_id}")

            # Exclude products that already have an Arabic translation
            product_query = product_query.outerjoin(ProductTitleTranslation, 
                                                    (Product.product_id == ProductTitleTranslation.product_id) & 
                                                    (ProductTitleTranslation.language == "ar")) \
                                         .filter(ProductTitleTranslation.product_id == None)

            total_products = product_query.count()
            logger.info(f"[{store.store_name}] Found {total_products} products to update (no Arabic translation yet).")

            for offset in range(0, total_products, batch_size):
                batch = product_query.order_by(Product.product_id.asc()).offset(offset).limit(batch_size).all()
                if not batch:
                    break

                logger.info(f"[{store.store_name}] Processing batch {offset // batch_size + 1} / {(total_products + batch_size - 1) // batch_size}...")

                for product in batch:
                    self.scrape_and_update_title(scraper, product, session)

                try:
                    session.commit()
                    logger.info(f"[{store.store_name}] Batch {offset // batch_size + 1} committed successfully.")
                except SQLAlchemyError as e:
                    logger.error(f"[{store.store_name}] Error committing batch {offset // batch_size + 1}: {e}")
                    session.rollback()

        scraper.quit_driver()

    def update_titles(self):
        """
        Update Arabic titles for all products, store by store, in chunks,
        with optional starting points for store_id and product_id.
        """
        with Session(engine) as session:
            # 1. Load all stores, optionally starting from start_store_id
            store_query = session.query(Store).order_by(Store.store_id.asc())
            if self.start_store_id is not None:
                store_query = store_query.filter(Store.store_id >= self.start_store_id)
                logger.info(f"[INFO] Starting from Store ID >= {self.start_store_id}")

            all_stores = store_query.all()
            logger.info(f"[INFO] Total stores to process: {len(all_stores)}")

        # 2. Process each store
        for store in all_stores:
            logger.info(f"\n[INFO] Processing store: {store.store_name} (Store ID: {store.store_id})")
            self.process_store(store, batch_size=self.chunk_size)

        logger.info("\n[INFO] All stores processed successfully.")


if __name__ == "__main__":
    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(description="Update Arabic titles for products in the database.")
    parser.add_argument('--chunk_size', type=int, default=100, help='Number of products to process at once.')
    parser.add_argument('--start_store_id', type=int, default=None, help='Store ID to start processing from.')
    parser.add_argument('--start_product_id', type=int, default=None, help='Product ID to start processing from within each store.')

    args = parser.parse_args()

    # Initialize the ArabicTitleUpdater with optional parameters
    updater = ArabicTitleUpdater(
        chunk_size=args.chunk_size,
        start_store_id=args.start_store_id,
    )
    updater.update_titles()
