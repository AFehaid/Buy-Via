# backend/scraper/availability_checker.py

from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, ProductPriceHistory, engine
from datetime import datetime, timezone, timedelta
from collections import defaultdict
import sys


class AvailabilityChecker:
    def __init__(self, chunk_size=2000, start_store_id=None, start_product_id=None):
        """
        Initialize the AvailabilityChecker.

        :param chunk_size: Number of products to process at once (default=2000).
        :param start_store_id: (Optional) Store ID to start processing from.
        :param start_product_id: (Optional) Product ID to start processing from within each store.
        """
        self.scrapers = {
            "Amazon": AmazonScraper,
            "Jarir": JarirScraper,
            "Extra": ExtraScraper,
        }
        self.chunk_size = chunk_size
        self.start_store_id = start_store_id
        self.start_product_id = start_product_id

    def check_store_availability(self, store_name, products):
        """
        Check availability for a chunk of products from a specific store and update the database.

        :param store_name: Name of the store.
        :param products: List of Product objects to process.
        """
        scraper_class = self.scrapers.get(store_name)
        if not scraper_class:
            print(f"[INFO] No scraper found for store: {store_name}")
            return

        # Initialize the scraper (WebDriver) for this store
        scraper = scraper_class(store_name)
        try:
            scraper.driver = scraper.setup_driver()  # Ensure driver is set up

            with Session(engine) as db:
                for product in products:
                    try:
                        # --- A) SCRAPE AVAILABILITY & PRICE ---
                        scraped_info = scraper.scrape_availability(product.link)

                        # If scraping failed or returned no data, skip update
                        if not scraped_info:
                            print(f"[WARN] No data scraped for Product ID {product.product_id}, skipping update.")
                            continue

                        new_availability = scraped_info.get("availability", None)
                        new_price_str = scraped_info.get("price", "N/A")

                        # If availability is None, skip update
                        if new_availability is None:
                            print(f"[WARN] availability=None for Product ID {product.product_id}, skipping update.")
                            continue

                        # Attempt to convert price to float
                        new_price = None
                        if new_price_str != "N/A":
                            try:
                                new_price = float(new_price_str)
                            except ValueError:
                                print(f"[WARN] Unable to parse price for Product ID {product.product_id}, skipping price update.")
                                new_price = None

                        # --- B) UPDATE FIELDS ---
                        old_availability = product.availability
                        old_price = product.price

                        # Always update availability
                        product.availability = new_availability

                        price_changed = False
                        price_message = "price not change"

                        if new_price is not None:
                            # Check if price has changed
                            if (old_price is None) or (abs(old_price - new_price) > 1e-6):
                                price_changed = True
                                old_price_str = f"{old_price:.2f}" if old_price is not None else "N/A"
                                updated_price_str = f"{new_price:.2f}"
                                price_message = f"old price: {old_price_str}, new price: {updated_price_str}"

                                # Update the product's price
                                product.price = new_price
                                product.last_updated = datetime.now(timezone.utc)

                                # Record the price history
                                price_history = ProductPriceHistory(
                                    product_id=product.product_id,
                                    old_price=old_price if old_price is not None else 0.0,
                                    new_price=new_price
                                )
                                db.add(price_history)
                            else:
                                # Price remains unchanged
                                if new_availability:
                                    product.last_updated = datetime.now(timezone.utc)
                                price_message = "price not change"
                        else:
                            # If new_price is None, do not update the price in DB
                            if new_availability:
                                product.last_updated = datetime.now(timezone.utc)
                            price_message = "price not change (scraped price is None)"

                        # --- C) Print debug information ---
                        print(
                            f"[Availability: {product.availability}] "
                            f"[Product ID: {product.product_id}] "
                            f"[{price_message}] "
                            f"[Last Updated: {product.last_updated}] "
                            f"[Link: {product.link}]"
                        )

                        # --- D) Commit the update ---
                        db.merge(product)
                        db.commit()

                    except Exception as e:
                        print(f"[ERROR] [{store_name}] Error processing Product ID: {product.product_id}, Link: {product.link}. Error: {e}")

        except Exception as e:
            print(f"[ERROR] Failed to initialize scraper for store: {store_name}. Error: {e}")
        finally:
            # Ensure the WebDriver is properly closed
            scraper.quit_driver()

    def update_availability(self):
        """
        Update the availability of products in the database, store by store, in chunks.

        Steps:
          1. Fetch all store records, optionally starting from a specific store_id.
          2. For each store, load products in chunked queries (offset/limit), optionally starting from a specific product_id.
          3. Fix any naive last_updated timestamps by setting tzinfo to UTC.
          4. Call check_store_availability on each chunk of products.
          5. Repeat until all products for all relevant stores are processed.
        """
        with Session(engine) as db:
            # 1. Load all stores, optionally starting from start_store_id
            store_query = db.query(Store).order_by(Store.store_id.asc())
            if self.start_store_id is not None:
                store_query = store_query.filter(Store.store_id >= self.start_store_id)
                print(f"[INFO] Starting from store_id >= {self.start_store_id}")

            all_stores = store_query.all()
            print(f"[INFO] Total stores to process: {len(all_stores)}")

        # 2. Process each store in chunks
        for store in all_stores:
            store_name = store.store_name
            print(f"\n[INFO] Processing store: {store_name} (store_id={store.store_id})")

            offset = 0
            while True:
                with Session(engine) as db_chunk:
                    # 2a. Query chunk of products, optionally starting from start_product_id for the first chunk
                    product_query = (
                        db_chunk.query(Product)
                        .filter(Product.store_id == store.store_id)
                        .order_by(Product.product_id.asc())
                    )

                    if self.start_product_id is not None and offset == 0:
                        product_query = product_query.filter(Product.product_id >= self.start_product_id)
                        print(f"  [INFO] Starting from product_id >= {self.start_product_id}")

                    chunk_q = product_query.offset(offset).limit(self.chunk_size)
                    chunk = chunk_q.all()

                    # If no products left, break out of the loop
                    if not chunk:
                        print(f"  [INFO] No more products to process for store '{store_name}'.")
                        break

                    print(f"  [INFO] Loaded chunk of {len(chunk)} products (offset={offset}).")

                    # 2b. Fix naive timestamps in the current chunk
                    changed = False
                    for prod in chunk:
                        if prod.last_updated and prod.last_updated.tzinfo is None:
                            prod.last_updated = prod.last_updated.replace(tzinfo=timezone.utc)
                            changed = True
                    if changed:
                        db_chunk.commit()
                        print(f"  [INFO] Fixed naive timestamps in current chunk.")

                    # 2c. Check availability for the current chunk
                    self.check_store_availability(store_name, chunk)

                # Increment offset for the next chunk
                offset += self.chunk_size

        print("\n[INFO] All stores processed successfully.")


if __name__ == "__main__":
    import argparse

    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(description="Check product availability and update the database.")
    parser.add_argument('--chunk_size', type=int, default=2000, help='Number of products to process at once.')
    parser.add_argument('--start_store_id', type=int, default=None, help='Store ID to start processing from.')
    parser.add_argument('--start_product_id', type=int, default=None, help='Product ID to start processing from within each store.')

    args = parser.parse_args()

    # Initialize the AvailabilityChecker with optional parameters
    checker = AvailabilityChecker(
        chunk_size=args.chunk_size,
        start_store_id=args.start_store_id,
        start_product_id=args.start_product_id
    )
    checker.update_availability()
