# backend/scraper/availability_checker.py

from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, ProductPriceHistory, engine
from datetime import datetime, timezone, timedelta
from collections import defaultdict

class AvailabilityChecker:
    def __init__(self, chunk_size=2000):
        """
        :param chunk_size: Number of products to process at once (default=2000).
        """
        self.scrapers = {
            "Amazon": AmazonScraper,
            "Jarir": JarirScraper,
            "Extra": ExtraScraper,
        }
        self.chunk_size = chunk_size

    def check_store_availability(self, store_name, products):
        """
        Check availability for a chunk of products from a specific store and update the database.
        Then delete any product that has been unavailable for >=2 weeks.
        """
        scraper_class = self.scrapers.get(store_name)
        if not scraper_class:
            print(f"No scraper found for store: {store_name}")
            return

        # 1) Initialize the scraper (WebDriver) for this store
        scraper = scraper_class(store_name)
        scraper.driver = scraper.setup_driver()  # Ensure driver is set up

        # Create a new session for DB updates
        with Session(engine) as db:
            try:
                for product in products:
                    try:
                        # --- A) SCRAPE AVAILABILITY & PRICE ---
                        scraped_info = scraper.scrape_availability(product.link)
                        new_availability = scraped_info.get("availability", False)
                        new_price_str = scraped_info.get("price", "N/A")

                        # Convert price if possible
                        new_price = None
                        if new_price_str != "N/A":
                            try:
                                new_price = float(new_price_str)
                            except ValueError:
                                new_price = None

                        # --- B) UPDATE FIELDS ---
                        old_availability = product.availability
                        old_price = product.price

                        product.availability = new_availability

                        # Price logic
                        price_changed = False
                        price_message = "price not change"
                        if new_price is not None:
                            if (old_price is None) or abs(old_price - new_price) > 1e-6:
                                # Price changed
                                price_changed = True
                                old_price_str = (f"{old_price:.2f}"
                                                 if old_price is not None else "N/A")
                                updated_price_str = f"{new_price:.2f}"
                                price_message = (f"old price: {old_price_str}, "
                                                 f"new price: {updated_price_str}")

                                product.price = new_price
                                product.last_updated = datetime.now(timezone.utc)

                                # Insert history
                                ph = ProductPriceHistory(
                                    product_id=product.product_id,
                                    old_price=old_price if old_price else 0.0,
                                    new_price=new_price
                                )
                                db.add(ph)
                            else:
                                # Price didn't change
                                if new_availability:
                                    product.last_updated = datetime.now(timezone.utc)
                                price_message = "price not change"
                        else:
                            # new_price is None => keep old price
                            if new_availability:
                                product.last_updated = datetime.now(timezone.utc)

                        # --- C) Print debug
                        availability_str = str(new_availability)
                        print(
                            f"[{availability_str}]"
                            f"[{product.product_id}]"
                            f"[{price_message}]"
                            f"[{product.last_updated}]"
                            f"[{product.link}]"
                        )

                        # --- D) Commit this product update
                        db.merge(product)
                        db.commit()

                        # --- E) DELETE IF UNAVAILABLE >= 2 WEEKS ---
                        if product.availability is False:
                            # By now last_updated should be offset-aware, but let's be safe:
                            if product.last_updated and product.last_updated.tzinfo is None:
                                product.last_updated = product.last_updated.replace(tzinfo=timezone.utc)
                                db.merge(product)
                                db.commit()

                            two_weeks_ago = datetime.now(timezone.utc) - timedelta(days=14)
                            if product.last_updated and product.last_updated < two_weeks_ago:
                                db.delete(product)
                                db.commit()
                                print(f"Deleted Product ID: {product.product_id} (unavailable >= 2 weeks)")

                    except Exception as e:
                        print(f"[{store_name}] Error on Product ID: {product.product_id}, Link: {product.link}, Err: {e}")
            finally:
                # Ensure WebDriver is closed
                scraper.quit_driver()

    def update_availability(self):
        """
        Update the availability of products in the database, store by store, in chunks.
        
        Steps:
          1) Fetch all store records.
          2) For each store, load products in chunked queries (offset/limit).
          3) Fix any naive last_updated => set tzinfo=UTC
          4) Call check_store_availability on that chunk
          5) Repeat until no more products for that store
        """
        with Session(engine) as db:
            # 1) Load all stores
            all_stores = db.query(Store).order_by(Store.store_id.asc()).all()

        # 2) Process each store separately in chunks
        for store in all_stores:
            store_name = store.store_name
            print(f"\nProcessing store: {store_name} (store_id={store.store_id})")

            offset = 0
            while True:
                # Create a new session each iteration
                with Session(engine) as db_chunk:
                    # 2a) Query products for this store in ascending product_id order
                    #     with offset/limit
                    chunk_q = (
                        db_chunk.query(Product)
                        .filter(Product.store_id == store.store_id)
                        .order_by(Product.product_id.asc())
                        .offset(offset)
                        .limit(self.chunk_size)
                    )
                    chunk = chunk_q.all()

                    # If no products left, break out
                    if not chunk:
                        break

                    print(f"  Loaded chunk of {len(chunk)} products from store '{store_name}' (offset={offset}).")

                    # 2b) Fix naive timestamps in this chunk
                    #     We do so in the same session (db_chunk).
                    changed = False
                    for prod in chunk:
                        if prod.last_updated and prod.last_updated.tzinfo is None:
                            prod.last_updated = prod.last_updated.replace(tzinfo=timezone.utc)
                            changed = True
                    if changed:
                        db_chunk.commit()
                        print(f"  Fixed naive timestamps in chunk (store_id={store.store_id}, offset={offset}).")

                    # 2c) Call check_store_availability on these chunked products
                    #     We pass them as Python objects. That function has its own session.
                    self.check_store_availability(store_name, chunk)

                offset += self.chunk_size

        print("\nAll stores processed successfully.")


if __name__ == "__main__":
    checker = AvailabilityChecker(chunk_size=2000)
    checker.update_availability()
