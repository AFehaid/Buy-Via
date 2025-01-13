from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Store, Product, Category, ProductPriceHistory, engine
from sqlalchemy.orm import Session
import json
import time
from datetime import datetime, timezone
import random
import os


class ScraperManager:
    def __init__(self, search_values_file="scraper/search_values.json"):
        self.search_values_file = os.path.join(
            os.path.dirname(__file__), search_values_file
        )
        self.scrapers = [
            AmazonScraper("Amazon"),
            JarirScraper("Jarir"),
            ExtraScraper("Extra"),
        ]

    def load_search_values(self):
        """Load search values from a JSON file and shuffle them."""
        with open(self.search_values_file, 'r') as file:
            search_values_data = json.load(file)
            search_values = search_values_data.get("search_values", [])
            random.shuffle(search_values)  # Shuffle the search values
            return search_values

    def store_to_database(self, db: Session, data: dict):
        """Store a scraped product in the database and log actions."""
        current_index = data.get("current_index")
        total_values = data.get("total_values")

        try:
            price = float(data["price"])
        except (ValueError, TypeError):
            price = None

        info = data.get("info")
        if info == "N/A" or not info:
            info = None

        store_name = data["store"]
        title = data["title"]
        search_value = data["search_value"]
        link = data["link"]
        image_url = data["image_url"]

        # Ensure the store exists in the database
        store = db.query(Store).filter_by(store_name=store_name).first()
        if not store:
            store = Store(store_name=store_name)
            db.add(store)
            db.commit()
            db.refresh(store)

        # Use the fallback category with ID 54
        fallback_category_id = 54

        # Check if the product already exists
        existing_product = db.query(Product).filter_by(
            title=title, store_id=store.store_id
        ).first()

        if existing_product:
            updated = False
            messages = []

            if existing_product.price != price:
                price_history = ProductPriceHistory(
                    product_id=existing_product.product_id,
                    old_price=existing_product.price if existing_product.price is not None else 0.0,
                    new_price=price if price is not None else 0.0,
                    change_date=datetime.now(timezone.utc)
                )
                db.add(price_history)
                messages.append(f"Price updated from {existing_product.price} to {price}")
                existing_product.price = price
                updated = True

            if existing_product.link != link:
                messages.append("Link updated")
                existing_product.link = link
                updated = True

            if existing_product.image_url != image_url:
                messages.append("Image URL updated")
                existing_product.image_url = image_url
                updated = True

            if updated:
                if existing_product.search_value != search_value:
                    messages.append(f"Search value updated to {search_value}")
                    existing_product.search_value = search_value

                existing_product.last_updated = datetime.now(timezone.utc)
                db.commit()

                print(f"[{search_value}][{current_index}/{total_values}][{store_name}][Product ID: {existing_product.product_id}] {title}")
                for msg in messages:
                    print(f" - {msg}")
            else:
                print(f"[{search_value}][{current_index}/{total_values}][{store_name}][Product ID: {existing_product.product_id}] {title}: No changes.")
        else:
            # Add new product with fallback category ID 54
            new_product = Product(
                title=title,
                price=price,
                info=info,
                search_value=search_value,
                link=link,
                image_url=image_url,
                availability=True,
                store_id=store.store_id,
                category_id=fallback_category_id,  # Assign fallback category ID 54
            )
            db.add(new_product)
            db.commit()
            print(f"[{search_value}][{current_index}/{total_values}][{store_name}][Product ID: {new_product.product_id}] {title}: Added to database.")


    def run_scraper_for_value(self, scraper, search_value, current_index, total_values):
        """Run a single scraper for a given search value."""
        with Session(engine) as db:
            print(f"[{search_value}][{current_index}/{total_values}] Using scraper: {scraper.store_name}")
            retries = 3
            while retries > 0:
                try:
                    if not scraper.driver:
                        scraper.driver = scraper.setup_driver()

                    for product in scraper.scrape_products(search_value):
                        product_data = {
                            "store": product["store"],
                            "title": product["title"],
                            "price": product["price"],
                            "info": product["info"],
                            "search_value": search_value,
                            "link": product["link"],
                            "image_url": product["image_url"],
                            "current_index": current_index,
                            "total_values": total_values
                        }
                        self.store_to_database(db, product_data)
                    break

                except Exception as e:
                    retries -= 1
                    print(
                        f"[{search_value}][{current_index}/{total_values}][{scraper.store_name}] Error: {e}. Retries left: {retries}"
                    )
                    scraper.quit_driver()
                    if retries == 0:
                        print(
                            f"[{search_value}][{current_index}/{total_values}][{scraper.store_name}] Failed after multiple attempts. Skipping."
                        )
                    else:
                        time.sleep(5)

            scraper.quit_driver()

    def scrape_all_products(self):
        """Scrape products sequentially for each store."""
        start_time = time.time()
        search_values = self.load_search_values()
        total_values = len(search_values)

        for i, search_value in enumerate(search_values, start=1):
            print(f"\nStarting scraping for search value: '{search_value}' ({i}/{total_values})")

            for scraper in self.scrapers:
                self.run_scraper_for_value(scraper, search_value, i, total_values)

        end_time = time.time()
        elapsed_time = end_time - start_time
        print(f"\nAll scraping completed in {elapsed_time:.2f} seconds.")

if __name__ == "__main__":
    manager = ScraperManager("search_values.json")
    manager.scrape_all_products()
