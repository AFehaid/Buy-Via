# scraper_runner.py
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Store, Product, Category, ProductGroup, engine
from sqlalchemy.orm import Session
import json
import time
from selenium.common.exceptions import WebDriverException, TimeoutException, NoSuchElementException
import os



class ScraperManager:
    def __init__(self, search_values_file="scraper/search_values.json"):
        self.search_values_file = os.path.join(
            os.path.dirname(__file__), search_values_file
        )
        self.scrapers = [
            AmazonScraper("Amazon"),
            JarirScraper("Jarir"),
            ExtraScraper("Extra")
        ]

    def load_search_values(self):
        """Load search values from a JSON file."""
        with open(self.search_values_file, 'r') as file:
            search_values_data = json.load(file)
            return search_values_data.get("search_values", [])

    def store_to_database(self, db: Session, data: dict):
        """Store a scraped product in the database."""
        # Handle price: set to None if it's not a valid float
        try:
            price = float(data["price"])
        except ValueError:
            price = None  # Set to None if price is "N/A"

        # Check if store exists; if not, create it
        store = db.query(Store).filter_by(store_name=data["store"]).first()
        if not store:
            store = Store(store_name=data["store"])
            db.add(store)
            db.commit()
            db.refresh(store)

        # Check if category exists; if not, create it
        category_name = "General"  # Set a default category; modify if categories are scraped
        category = db.query(Category).filter_by(category_name=category_name).first()
        if not category:
            category = Category(category_name=category_name)
            db.add(category)
            db.commit()
            db.refresh(category)

        # Create and add the product
        product = Product(
            title=data["title"],
            price=price,  # Use the parsed or None price
            info=data["info"],
            search_value=data["search_value"],
            link=data["link"],
            image_url=data["image_url"],
            availability=True,
            store_id=store.store_id,
            category_id=category.category_id,
        )
        db.add(product)
        db.commit()
        print(f"Product '{data['title']}' added to the database.")



    def scrape_all_products(self):
        """Scrape products and store them in the database."""
        search_values = self.load_search_values()

        # Create a database session
        with Session(engine) as db:
            for search_value in search_values:
                for scraper in self.scrapers:
                    scraper.driver = scraper.setup_driver()  # Ensure driver setup for each scraper
                    retries = 3
                    while retries > 0:
                        try:
                            for product in scraper.scrape_products(search_value):
                                # Reorder dictionary keys for database insertion
                                product_data = {
                                    "store": product["store"],
                                    "title": product["title"],
                                    "price": product["price"],
                                    "info": product["info"],
                                    "search_value": search_value,
                                    "link": product["link"],
                                    "image_url": product["image_url"]
                                }
                                # Store the product in the database
                                self.store_to_database(db, product_data)
                            break  # Exit retry loop if scraping is successful
                        except (WebDriverException, TimeoutException, NoSuchElementException) as e:
                            retries -= 1
                            print(f"Error encountered with {scraper.store_name} while scraping {search_value}: {e}. Retries left: {retries}")
                            if retries == 0:
                                print(f"Failed to scrape {scraper.store_name} for {search_value} after multiple attempts. Skipping.")
                                scraper.quit_driver()  # Quit the driver to clean up after failure
                            else:
                                time.sleep(5)  # Wait before retrying

            # Quit all drivers at the end
            for scraper in self.scrapers:
                scraper.quit_driver()


if __name__ == "__main__":
    manager = ScraperManager("search_values.json")
    manager.scrape_all_products()
