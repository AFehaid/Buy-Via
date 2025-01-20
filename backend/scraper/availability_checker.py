# backend/scraper/availability_checker.py

from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, ProductPriceHistory, engine
from datetime import datetime, timezone
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
        
        Changes in this version:
          - No product deletion.
          - If the scraped price is None, keep the old price in the DB.
        """
        scraper_class = self.scrapers.get(store_name)
        if not scraper_class:
            print(f"No scraper found for store: {store_name}")
            return

        # 1) Initialize the scraper (WebDriver) for this store
        scraper = scraper_class(store_name)
        scraper.driver = scraper.setup_driver()  # Ensure driver is set up

        with Session(engine) as db:
            try:
                for product in products:
                    try:
                        # --- (A) SCRAPE AVAILABILITY & PRICE ---
                        scraped_info = scraper.scrape_availability(product.link)

                        # Fallbacks
                        new_availability = False
                        new_price = None

                        if scraped_info:
                            new_availability = scraped_info.get("availability", False)
                            new_price_str = scraped_info.get("price", "N/A")
                            if new_price_str != "N/A":
                                try:
                                    new_price = float(new_price_str)
                                except ValueError:
                                    new_price = None

                        # --- (B) UPDATE FIELDS ---
                        old_availability = product.availability
                        old_price = product.price

                        # Always set the new availability (even if price is None)
                        product.availability = new_availability

                        price_changed = False
                        price_message = "price not change"

                        if new_price is not None:
                            # We got a valid price from the scrape
                            if (old_price is None) or abs(old_price - new_price) > 1e-6:
                                # Price changed
                                price_changed = True
                                old_price_str = (
                                    f"{old_price:.2f}" if old_price is not None else "N/A"
                                )
                                updated_price_str = f"{new_price:.2f}"
                                price_message = (
                                    f"old price: {old_price_str}, new price: {updated_price_str}"
                                )

                                product.price = new_price
                                product.last_updated = datetime.now(timezone.utc)

                                # Insert a new price history record
                                ph = ProductPriceHistory(
                                    product_id=product.product_id,
                                    old_price=old_price if old_price else 0.0,
                                    new_price=new_price
                                )
                                db.add(ph)
                            else:
                                # Price did not change
                                if new_availability:
                                    product.last_updated = datetime.now(timezone.utc)
                                price_message = "price not change"
                        else:
                            # The scraped price is None => keep old price
                            if new_availability:
                                # If it is available, at least update last_updated
                                product.last_updated = datetime.now(timezone.utc)

                        # --- (C) Print debug
                        print(
                            f"[{product.availability}]"
                            f"[{product.product_id}]"
                            f"[{price_message}]"
                            f"[{product.last_updated}]"
                            f"[{product.link}]"
                        )

                        # --- (D) Commit updates
                        db.merge(product)
                        db.commit()

                        # **No deletion logic** in this version

                    except Exception as e:
                        print(f"[{store_name}] Error on Product ID: {product.product_id}, Link: {product.link}, Err: {e}")
            finally:
                # Ensure the WebDriver is closed
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

        # 2) Process each store in chunks
        for store in all_stores:
            store_name = store.store_name
            print(f"\nProcessing store: {store_name} (store_id={store.store_id})")

            offset = 0
            while True:
                with Session(engine) as db_chunk:
                    # 2a) Query chunk of products
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

                    # 2b) Fix naive timestamps in chunk
                    changed = False
                    for prod in chunk:
                        if prod.last_updated and prod.last_updated.tzinfo is None:
                            prod.last_updated = prod.last_updated.replace(tzinfo=timezone.utc)
                            changed = True
                    if changed:
                        db_chunk.commit()
                        print(f"  Fixed naive timestamps (store_id={store.store_id}, offset={offset}).")

                    # 2c) Call check_store_availability on these chunked products
                    self.check_store_availability(store_name, chunk)

                offset += self.chunk_size

        print("\nAll stores processed successfully.")


if __name__ == "__main__":
    checker = AvailabilityChecker(chunk_size=2000)
    checker.update_availability()
