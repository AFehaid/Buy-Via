# backend/scraper/availability_checker.py
from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, engine

class AvailabilityChecker:
    def __init__(self):
        # Map each store to its corresponding scraper class
        self.scrapers = {
            "Amazon": AmazonScraper,
            "Jarir": JarirScraper,
            "Extra": ExtraScraper,
        }

    def check_store_availability(self, store_name, products):
        """
        Check availability of products for a specific store and update the database immediately.
        :param store_name: The name of the store.
        :param products: List of products for the store.
        """
        scraper_class = self.scrapers.get(store_name)
        if not scraper_class:
            print(f"No scraper found for store: {store_name}")
            return

        # Initialize the scraper for the store
        scraper = scraper_class(store_name)
        scraper.driver = scraper.setup_driver()  # Ensure a driver is set up

        # Create a new session for database updates
        with Session(engine) as db:
            try:
                for product in products:
                    try:
                        # Scrape availability and update the product
                        availability = scraper.scrape_availability(product.link)
                        print(f"[{store_name}] Product ID: {product.product_id}, Title: {product.title}, Available: {availability}")
                        product.availability = availability
                        db.add(product)  # Stage the update
                        db.commit()       # Commit immediately
                    except Exception as e:
                        print(f"[{store_name}] Error checking Product ID: {product.product_id}, Title: {product.title}. Error: {e}")
            finally:
                # Ensure the WebDriver is properly closed after processing
                scraper.quit_driver()

    def update_availability(self):
        """
        Update the availability of all products in the database,
        starting from the largest store_id to the smallest (sequentially).
        """
        # Fetch all stores from the database, ordering by store_id descending
        with Session(engine) as db:
            stores = db.query(Store).order_by(Store.store_id.desc()).all()

        # Process stores sequentially (not in parallel)
        for store in stores:
            # Fetch all products for the current store
            with Session(engine) as db:
                store_products = db.query(Product).filter(Product.store_id == store.store_id).all()
                if not store_products:
                    continue

            # Run availability check
            self.check_store_availability(store.store_name, store_products)

if __name__ == "__main__":
    checker = AvailabilityChecker()
    checker.update_availability()
