from concurrent.futures import ThreadPoolExecutor
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

        # Create a new session for this thread
        with Session(engine) as db:
            try:
                for product in products:
                    try:
                        # Scrape availability and update the product
                        availability = scraper.scrape_availability(product.link)
                        print(f"[{store_name}] Product ID: {product.product_id}, Title: {product.title}, Available: {availability}")
                        product.availability = availability
                        db.add(product)  # Stage the update
                        db.commit()  # Commit immediately
                    except Exception as e:
                        print(f"[{store_name}] Error checking Product ID: {product.product_id}, Title: {product.title}. Error: {e}")
            finally:
                scraper.quit_driver()  # Ensure the driver is quit after processing

    def update_availability(self):
        """
        Update the availability of all products in the database.
        """
        # Fetch all stores from the database
        with Session(engine) as db:
            stores = db.query(Store).all()

        # Use a ThreadPoolExecutor to process stores in parallel
        with ThreadPoolExecutor(max_workers=len(self.scrapers)) as executor:
            for store in stores:
                # Fetch all products for the current store
                with Session(engine) as db:
                    store_products = db.query(Product).filter(Product.store_id == store.store_id).all()
                    if not store_products:
                        continue  # Skip if no products for this store

                # Submit a task for this store
                executor.submit(self.check_store_availability, store.store_name, store_products)

if __name__ == "__main__":
    checker = AvailabilityChecker()
    checker.update_availability()
