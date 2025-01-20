import logging
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, ProductTitleTranslation, engine

# Set up logging
logging.basicConfig(
    format="%(asctime)s - %(levelname)s - %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


class ArabicTitleUpdater:
    def __init__(self):
        # Map each store to its scraper class
        self.scrapers = {
            "Amazon": AmazonScraper,
            "Jarir": JarirScraper,
            "Extra": ExtraScraper,
        }

    def get_arabic_url(self, product):
        """
        Convert English URL to Arabic URL based on known patterns.
        """
        if "jarir.com" in product.link:
            return product.link.replace("/sa-en/", "/").replace("?country=sa", "") + "?country=sa"
        elif "amazon.sa" in product.link:
            return product.link + "&language=ar_AE"
        elif "extra.com" in product.link:
            return product.link.replace("/en-sa/", "/ar-sa/")
        else:
            return None

    def scrape_and_update_title(self, scraper, product, session):
        """
        Scrape Arabic title for a product and create/update a row in ProductTitleTranslation,
        but skip if the scraper returns "Title unavailable".
        """
        arabic_url = self.get_arabic_url(product)
        if not arabic_url:
            logger.warning(f"[{product.store.store_name}] Could not derive Arabic URL for product ID {product.product_id}.")
            return

        try:
            result = scraper.scrape_arabic(arabic_url)
            # If the scraper returns None or missing 'title_arabic', treat it as unavailable
            if not result or "title_arabic" not in result:
                logger.warning(f"[{product.store.store_name}] Product ID {product.product_id} - No Arabic title extracted. Skipping DB insert.")
                return

            arabic_title = result["title_arabic"]
            
            if arabic_title == "Title unavailable" or not arabic_title.strip():
                # If the scraped Arabic title is literally "Title unavailable" or empty,
                # skip writing it to the DB.
                logger.warning(f"[{product.store.store_name}] Product ID {product.product_id} - Title unavailable. Skipping DB insert.")
                return

            # Otherwise, we have a valid Arabic title -> proceed to update or create a row
            logger.info(f"[{product.store.store_name}] Product ID {product.product_id} - Arabic Title: {arabic_title}")

            # Check if a translation record already exists
            translation = session.query(ProductTitleTranslation).filter_by(
                product_id=product.product_id, language="ar"
            ).first()

            if translation:
                translation.translated_title = arabic_title
            else:
                session.add(ProductTitleTranslation(
                    product_id=product.product_id,
                    language="ar",
                    translated_title=arabic_title
                ))

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
        scraper.driver = scraper.setup_driver()

        with Session(engine) as session:
            # Use exists() for a more efficient query
            total_products = session.query(Product).filter(
                Product.store_id == store.store_id,
                ~session.query(ProductTitleTranslation.product_id)
                .filter(ProductTitleTranslation.product_id == Product.product_id, ProductTitleTranslation.language == "ar")
                .exists()
            ).count()

            logger.info(f"[{store.store_name}] Found {total_products} products to update (no Arabic translation yet).")

            for offset in range(0, total_products, batch_size):
                batch = session.query(Product).filter(
                    Product.store_id == store.store_id,
                    ~session.query(ProductTitleTranslation.product_id)
                    .filter(ProductTitleTranslation.product_id == Product.product_id, ProductTitleTranslation.language == "ar")
                    .exists()
                ).offset(offset).limit(batch_size).all()

                logger.info(f"[{store.store_name}] Processing batch {offset // batch_size + 1}/{(total_products + batch_size - 1) // batch_size}...")

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
        Update Arabic titles for all products, store by store,
        only if no Arabic translation currently exists.
        """
        with Session(engine) as session:
            stores = session.query(Store).order_by(Store.store_id.asc()).all()

        for store in stores:
            logger.info(f"Processing store: {store.store_name}")
            self.process_store(store)


if __name__ == "__main__":
    updater = ArabicTitleUpdater()
    updater.update_titles()
