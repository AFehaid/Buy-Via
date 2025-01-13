# scraper_tester.py
from scraper.scraper import AmazonScraper, JarirScraper, ExtraScraper

class ScraperManager:
    def __init__(self):
        self.scrapers = {
            "amazon": AmazonScraper,
            "jarir": JarirScraper,
            "extra": ExtraScraper,
        }

    def scrape_all_stores(self, search_value):
        for store_name, scraper_class in self.scrapers.items():
            scraper = scraper_class(store_name)
            print(f"Starting scraping for {store_name}")
            yield from scraper.scrape_products(search_value)

if __name__ == "__main__":
    manager = ScraperManager()
    search_value = "Playstation 5"  # Example search term

    for product in manager.scrape_all_stores(search_value):
        print(product)  # Print each product as it is scraped in real time