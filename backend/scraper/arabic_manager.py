from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, engine


class ArabicTitleUpdater:
    def __init__(self):
        # Map each store to its scraper class
        self.scrapers = {
            "Amazon": AmazonScraper,
            "Jarir": JarirScraper,
            "Extra": ExtraScraper,
        }

    def get_arabic_url(self, product):
        """
        Convert English URL to Arabic URL based on known patterns.
        """
        if "jarir.com" in product.link:
            return product.link.replace("/sa-en/", "/").replace("?country=sa", "") + "?country=sa"
        elif "amazon.sa" in product.link:
            return product.link + "&language=ar_AE"
        elif "extra.com" in product.link:
            return product.link.replace("/en-sa/", "/ar-sa/")
        else:
            return None

    def scrape_and_update_title(self, scraper, product, session):
        """
        Scrape Arabic title for a product and update it in the database.
        """
        arabic_url = self.get_arabic_url(product)
        if not arabic_url:
            print(f"[{product.store.store_name}] Could not derive Arabic URL for product ID {product.product_id}.")
            product.title_in_arabic = "Title unavailable"
            session.merge(product)  # Ensure changes are staged
            return

        try:
            result = scraper.scrape_arabic(arabic_url)
            if result and "title_arabic" in result:
                product.title_in_arabic = result["title_arabic"]
                print(f"[{product.store.store_name}] Product ID {product.product_id} - Arabic Title: {product.title_in_arabic}")
            else:
                product.title_in_arabic = "Title unavailable"
                print(f"[{product.store.store_name}] Product ID {product.product_id} - Arabic Title: Title unavailable")
            session.merge(product)
        except Exception as e:
            print(f"[{product.store.store_name}] Error updating Product ID {product.product_id}: {e}")
            product.title_in_arabic = "Title unavailable"
            session.merge(product)

    def process_store(self, store, batch_size=100):
        """
        Process all products for a specific store in batches.
        """
        scraper_class = self.scrapers.get(store.store_name)
        if not scraper_class:
            print(f"No scraper found for store: {store.store_name}. Skipping.")
            return

        scraper = scraper_class(store.store_name)
        scraper.driver = scraper.setup_driver()

        with Session(engine) as session:
            total_products = session.query(Product).filter(
                Product.store_id == store.store_id,
                Product.title_in_arabic == None
            ).count()

            print(f"[{store.store_name}] Found {total_products} products to update.")

            for offset in range(0, total_products, batch_size):
                batch = session.query(Product).filter(
                    Product.store_id == store.store_id,
                    Product.title_in_arabic == None
                ).offset(offset).limit(batch_size).all()

                print(f"[{store.store_name}] Processing batch {offset // batch_size + 1}/{(total_products + batch_size - 1) // batch_size}...")

                for product in batch:
                    self.scrape_and_update_title(scraper, product, session)

                try:
                    session.commit()
                    print(f"[{store.store_name}] Batch {offset // batch_size + 1} committed successfully.")
                except SQLAlchemyError as e:
                    print(f"[{store.store_name}] Error committing batch {offset // batch_size + 1}: {e}")
                    session.rollback()

        scraper.quit_driver()

    def update_titles(self):
        """
        Update Arabic titles for all products, store by store.
        """
        with Session(engine) as session:
            stores = session.query(Store).order_by(Store.store_id.desc()).all()

        for store in stores:
            print(f"Processing store: {store.store_name}")
            self.process_store(store)


if __name__ == "__main__":
    updater = ArabicTitleUpdater()
    updater.update_titles()
