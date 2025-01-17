# backend/scraper/availability_checker.py
from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, ProductPriceHistory, engine
from datetime import datetime, timezone

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
        Check availability of products for a specific store and update the database.
        :param store_name: The name of the store.
        :param products: List of product objects (from the DB) for the store.
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
                        # 1) Scrape availability & price
                        scraped_info = scraper.scrape_availability(product.link)
                        new_availability = scraped_info.get("availability", False)
                        new_price_str = scraped_info.get("price", "N/A")

                        # Convert new_price_str to float if possible, else None
                        new_price = None
                        if new_price_str != "N/A":
                            try:
                                new_price = float(new_price_str)
                            except ValueError:
                                new_price = None

                        # Current values in DB
                        old_availability = product.availability
                        old_price = product.price  # Can be None or float

                        # 2) Update availability
                        product.availability = new_availability

                        # ------------------------------
                        # Handle PRICE UPDATE LOGIC
                        # ------------------------------
                        price_changed = False
                        price_message = "price not change"

                        if new_price is not None:
                            # Only compare if new_price is valid
                            # (handle None comparisons carefully)
                            if old_price is None or abs(old_price - new_price) > 1e-6:
                                price_changed = True
                                # Build the "old price / new price" message
                                old_price_str = (
                                    f"{old_price:.2f}" if old_price is not None else "N/A"
                                )
                                updated_price_str = f"{new_price:.2f}"
                                price_message = (
                                    f"old price: {old_price_str}, new price: {updated_price_str}"
                                )

                                # Update Product.price
                                product.price = new_price

                                # Update last_updated because price changed
                                product.last_updated = datetime.now(timezone.utc)

                                # Insert a record in ProductPriceHistory
                                price_history = ProductPriceHistory(
                                    product_id=product.product_id,
                                    old_price=old_price if old_price is not None else 0.0,
                                    new_price=new_price,
                                )
                                db.add(price_history)

                            else:
                                # Price was valid, but unchanged
                                # Update last_updated only if availability = True
                                if new_availability:
                                    product.last_updated = datetime.now(timezone.utc)
                                price_message = "price not change"
                        else:
                            # new_price is None or "N/A"
                            # => Do NOT update product.price; keep old price
                            # Update last_updated only if availability = True
                            if new_availability:
                                product.last_updated = datetime.now(timezone.utc)

                        # 3) Print the results in the requested format
                        availability_str = str(new_availability)
                        print(
                            f"[{availability_str}]"
                            f"[{product.product_id}]"
                            f"[{price_message}]"
                            f"[{product.last_updated}]"
                            f"[{product.link}]"
                        )

                        # 4) Commit all changes to the DB
                        db.add(product)  # Stage the product changes
                        db.commit()

                    except Exception as e:
                        print(
                            f"[{store_name}] Error checking Product ID: {product.product_id}, "
                            f"Link: {product.link}. Error: {e}"
                        )
            finally:
                # Ensure the WebDriver is properly closed after processing
                scraper.quit_driver()

    def update_availability(self):
        """
        Update the availability of all products in the database,
        starting with the smallest product ID for each store.
        """
        # Fetch all stores from the database, ordering by store_id ascending
        with Session(engine) as db:
            stores = db.query(Store).order_by(Store.store_id.asc()).all()

        # Process stores sequentially
        for store in stores:
            # Fetch all products for the current store, ordered by product_id ascending
            with Session(engine) as db:
                store_products = (
                    db.query(Product)
                    .filter(Product.store_id == store.store_id)
                    .order_by(Product.product_id.asc())  # Sort by product_id
                    .all()
                )
                if not store_products:
                    continue

            # Run availability check
            self.check_store_availability(store.store_name, store_products)

if __name__ == "__main__":
    checker = AvailabilityChecker()
    checker.update_availability()
