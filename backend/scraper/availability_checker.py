# backend/scraper/availability_checker.py

from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, ProductPriceHistory, engine
from datetime import datetime, timezone
from collections import defaultdict
import sys


class AvailabilityChecker:
    def __init__(self, chunk_size=2000, start_product_id=None):
        """
        Initialize the AvailabilityChecker.

        :param chunk_size: Number of products to process at once (default=2000).
        :param start_product_id: (Optional) Product ID to start processing from.
        """
        self.scrapers = {
            "Amazon": AmazonScraper,
            "Jarir": JarirScraper,
            "Extra": ExtraScraper,
        }
        self.chunk_size = chunk_size
        self.start_product_id = start_product_id

    def check_store_availability(self, store_name, products):
        """
        Check availability for a list of products (all belonging to the same store)
        and update the database.

        :param store_name: Name of the store (e.g., 'Amazon', 'Jarir', 'Extra').
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
                                print(f"[WARN] Unable to parse price for Product ID {product.product_id}, "
                                      f"skipping price update.")
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
                        print(f"[ERROR] [{store_name}] Error processing Product ID: {product.product_id}, "
                              f"Link: {product.link}. Error: {e}")

        except Exception as e:
            print(f"[ERROR] Failed to initialize scraper for store: {store_name}. Error: {e}")
        finally:
            # Ensure the WebDriver is properly closed
            scraper.quit_driver()

    def update_availability(self):
        """
        Update the availability of products in the database in ascending order by product_id.

        Steps:
          1. Fetch all products in ascending order by product_id, optionally starting from start_product_id.
          2. Process them in chunks (offset/limit).
          3. For each chunk, fix any naive last_updated timestamps by setting tzinfo to UTC.
          4. Group products by store_name and call check_store_availability for each group.
          5. Continue until no more products remain.
        """
        with Session(engine) as db:
            product_query = (
                db.query(Product)
                .join(Store, Product.store_id == Store.store_id)
                .order_by(Product.product_id.asc())
            )

            if self.start_product_id is not None:
                product_query = product_query.filter(Product.product_id >= self.start_product_id)
                print(f"[INFO] Starting from product_id >= {self.start_product_id}")

            offset = 0

            while True:
                # 1. Load a chunk of products
                chunk = product_query.offset(offset).limit(self.chunk_size).all()
                if not chunk:
                    print(f"[INFO] No more products to process.")
                    break

                print(f"[INFO] Loaded chunk of {len(chunk)} products (offset={offset}).")

                # 2. Fix naive timestamps in the current chunk
                changed = False
                for prod in chunk:
                    if prod.last_updated and prod.last_updated.tzinfo is None:
                        prod.last_updated = prod.last_updated.replace(tzinfo=timezone.utc)
                        changed = True
                if changed:
                    db.commit()
                    print(f"[INFO] Fixed naive timestamps in current chunk.")

                # 3. Group products by store
                store_groups = defaultdict(list)
                for product in chunk:
                    store_groups[product.store.store_name].append(product)

                # 4. For each store group, check availability
                for store_name, products in store_groups.items():
                    self.check_store_availability(store_name, products)

                # Move to the next chunk
                offset += self.chunk_size

        print("\n[INFO] All products processed successfully.")


if __name__ == "__main__":
    import argparse

    # Set up command-line argument parsing
    parser = argparse.ArgumentParser(description="Check product availability and update the database.")
    parser.add_argument('--chunk_size', type=int, default=2000, help='Number of products to process at once.')
    parser.add_argument('--start_product_id', type=int, default=None, help='Product ID to start processing from.')

    args = parser.parse_args()

    # Initialize the AvailabilityChecker
    checker = AvailabilityChecker(
        chunk_size=args.chunk_size,
        start_product_id=args.start_product_id
    )
    checker.update_availability()
