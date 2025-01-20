from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, Store, engine


class ArabicTitleTester:
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

    def scrape_and_print_title(self, scraper, product):
        """
        Scrape Arabic title for a product and print the result in the desired format.
        """
        arabic_url = self.get_arabic_url(product)
        if not arabic_url:
            print(f"[{product.product_id}][Could not derive Arabic URL][{product.link}]")
            return

        try:
            result = scraper.scrape_arabic(arabic_url)
            if result and "title_arabic" in result:
                arabic_title = result["title_arabic"]
                print(f"[{product.product_id}][{arabic_title}][{arabic_url}]")
            else:
                print(f"[{product.product_id}][Title unavailable][{arabic_url}]")
        except Exception as e:
            print(f"[{product.product_id}][Error scraping: {e}][{arabic_url}]")

    def process_store(self, store_name, batch_size=100):
        """
        Process all products for a specific store, printing the Arabic translation without committing.
        """
        scraper_class = self.scrapers.get(store_name)
        if not scraper_class:
            print(f"No scraper found for store: {store_name}. Exiting.")
            return

        scraper = scraper_class(store_name)
        scraper.driver = scraper.setup_driver()

        with Session(engine) as session:
            total_products = session.query(Product).filter(
                Product.store_id == session.query(Store.store_id).filter_by(store_name=store_name).scalar(),
            ).count()

            print(f"[{store_name}] Found {total_products} products to test scraping.")

            for offset in range(0, total_products, batch_size):
                batch = session.query(Product).filter(
                    Product.store_id == session.query(Store.store_id).filter_by(store_name=store_name).scalar(),
                ).offset(offset).limit(batch_size).all()

                print(f"[{store_name}] Testing batch {(offset // batch_size) + 1}/{(total_products + batch_size - 1) // batch_size}...")

                for product in batch:
                    self.scrape_and_print_title(scraper, product)

        scraper.quit_driver()

    def test_store(self, store_name):
        """
        Test Arabic title scraping for a specific store.
        """
        print(f"Starting test for store: {store_name}")
        self.process_store(store_name)


if __name__ == "__main__":
    tester = ArabicTitleTester()

    # Allow the user to select a store to test
    store_name = input("Enter the store name to test (Amazon, Jarir, Extra): ").strip()
    tester.test_store(store_name)
