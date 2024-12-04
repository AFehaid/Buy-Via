# backend/scraper/scraper_manager.py
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Store, Product, Category, engine
from sqlalchemy.orm import Session
import json
import time
from selenium.common.exceptions import WebDriverException, TimeoutException, NoSuchElementException
import os
from datetime import datetime, timezone
import random

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
        # Handle price: set to None if it's not a valid float
        try:
            price = float(data["price"])
        except (ValueError, TypeError):
            price = None  # Set to None if price is "N/A" or invalid

        # Handle 'info': set to None if it's 'N/A' or empty
        info = data.get("info")
        if info == "N/A" or not info:
            info = None

        store_name = data["store"]
        title = data["title"]
        search_value = data["search_value"]
        link = data["link"]
        image_url = data["image_url"]

        # Check if store exists; if not, create it
        store = db.query(Store).filter_by(store_name=store_name).first()
        if not store:
            store = Store(store_name=store_name)
            db.add(store)
            db.commit()
            db.refresh(store)

        # Check if category exists; if not, create it
        category_name = "General"  # Default category
        category = db.query(Category).filter_by(category_name=category_name).first()
        if not category:
            category = Category(category_name=category_name)
            db.add(category)
            db.commit()
            db.refresh(category)

        # Check if the product already exists in the same store
        existing_product = db.query(Product).filter_by(
            title=title, store_id=store.store_id
        ).first()

        if existing_product:
            updated = False
            messages = []

            # Update the product if the price has changed
            if existing_product.price != price:
                messages.append(f"Price updated from {existing_product.price} to {price}")
                existing_product.price = price
                updated = True

            # Update the product if the link has changed
            if existing_product.link != link:
                messages.append("Link updated")
                existing_product.link = link
                updated = True

            # Update the product if the image_url has changed
            if existing_product.image_url != image_url:
                messages.append("Image URL updated")
                existing_product.image_url = image_url
                updated = True

            # Only update the search_value if any other field was updated
            if updated:
                if existing_product.search_value != search_value:
                    messages.append(f"Search value updated to {search_value}")
                    existing_product.search_value = search_value

                existing_product.last_updated = datetime.now(timezone.utc)
                print(f"[{store_name}] Product updated in the database: '{title}'")
                for msg in messages:
                    print(f" - {msg}")
            else:
                print(f"[{store_name}] Product skipped (no changes): '{title}'")
        else:
            # Create and add a new product if it doesn't exist
            new_product = Product(
                title=title,
                price=price,
                info=info,
                search_value=search_value,
                link=link,
                image_url=image_url,
                availability=True,
                store_id=store.store_id,
                category_id=category.category_id,
            )
            db.add(new_product)
            print(f"[{store_name}] Product '{title}' added to the database.")

        # Commit changes to the database
        db.commit()


    def scrape_all_products(self):
        """Scrape products and store them in the database."""
        search_values = self.load_search_values()

        # Create a database session
        with Session(engine) as db:
            for search_value in search_values:
                print(f"\nStarting scraping for search value: '{search_value}'")
                for scraper in self.scrapers:
                    print(f"Using scraper: {scraper.store_name}")
                    retries = 3
                    while retries > 0:
                        try:
                            # Ensure driver is set up
                            if not scraper.driver:
                                scraper.driver = scraper.setup_driver()
                            for product in scraper.scrape_products(search_value):
                                # Prepare product data for database insertion
                                product_data = {
                                    "store": product["store"],
                                    "title": product["title"],
                                    "price": product["price"],
                                    "info": product["info"],
                                    "search_value": search_value,
                                    "link": product["link"],
                                    "image_url": product["image_url"],
                                }
                                # Store the product in the database
                                self.store_to_database(db, product_data)
                            break  # Exit retry loop if scraping is successful
                        except Exception  as e:
                            retries -= 1
                            print(
                                f"Error with {scraper.store_name} while scraping '{search_value}': {e}. Retries left: {retries}"
                            )
                            scraper.quit_driver()  # Quit the driver to reset state
                            if retries == 0:
                                print(
                                    f"Failed to scrape {scraper.store_name} for '{search_value}' after multiple attempts. Skipping."
                                )
                            else:
                                time.sleep(5)  # Wait before retrying

                    # Quit the scraper's driver after scraping
                    scraper.quit_driver()


if __name__ == "__main__":
    manager = ScraperManager("search_values.json")
    manager.scrape_all_products()
