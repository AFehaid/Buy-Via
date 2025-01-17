from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper
from models import Product, engine
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed


class AvailabilityTester:
    def __init__(self):
        self.scrapers = {
            "Amazon": AmazonScraper("Amazon"),
            "Jarir": JarirScraper("Jarir"),
            "Extra": ExtraScraper("Extra"),
        }

    def test_availability(self, store_name, links):
        scraper = self.scrapers.get(store_name)
        if not scraper:
            print(f"Scraper for {store_name} not found!")
            return

        print(f"\nTesting availability for {store_name}...")
        results = []

        # Use ThreadPoolExecutor for parallel processing
        with ThreadPoolExecutor(max_workers=5) as executor:  # Limit to 5 threads
            future_to_link = {executor.submit(scraper.scrape_availability, link): (product_id, link) for product_id, link in links}
            
            for future in as_completed(future_to_link):
                product_id, link = future_to_link[future]
                try:
                    is_available = future.result()
                    status = "Available" if is_available else "Unavailable"
                    results.append([status, product_id, link])
                    print(f"[{status}][{product_id}][{link}]")
                except Exception as e:
                    print(f"Error while testing availability for {link}: {e}")
        
        scraper.quit_driver()
        return results


    def fetch_links(self, start_id=0, store_id=None):
        links = {
            "Amazon": [],
            "Jarir": [],
            "Extra": []
        }

        with Session(engine) as session:
            query = session.query(Product).filter(Product.product_id >= start_id).order_by(Product.product_id)
            if store_id:
                query = query.filter(Product.store_id == store_id)
            products = query.all()

            for product in products:
                if "amazon.sa" in product.link:
                    links["Amazon"].append((product.product_id, product.link))
                elif "jarir.com" in product.link:
                    links["Jarir"].append((product.product_id, product.link))
                elif "extra.com" in product.link:
                    links["Extra"].append((product.product_id, product.link))

        return links

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test product availability.")
    parser.add_argument("--start_id", type=int, default=0, help="Start testing from this product ID.")
    parser.add_argument("--store_id", type=int, default=None, help="Filter by store ID (optional).")

    args = parser.parse_args()

    tester = AvailabilityTester()

    # Fetch links from the database with filters
    store_links = tester.fetch_links(start_id=args.start_id, store_id=args.store_id)

    # Test availability for each store
    for store_name, links in store_links.items():
        if links:  # Ensure there are links to process
            results = tester.test_availability(store_name, links)
            for result in results:
                print(result)
        else:
            print(f"No products found for {store_name} with the given filters.")
