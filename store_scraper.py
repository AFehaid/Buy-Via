from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, StaleElementReferenceException
from time import sleep
import urllib.parse
import os

# Base class for common scraper logic
class StoreScraper:
    def __init__(self, store_name):
        self.store_name = store_name
        self.driver = self.setup_driver()

    def setup_driver(self):
        chrome_driver_path = os.path.join(os.path.dirname(__file__), "chromedriver.exe")
        service = Service(executable_path=chrome_driver_path)
        options = webdriver.ChromeOptions()

        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--headless")  
        options.add_argument("--window-size=1920x1080")

        driver = webdriver.Chrome(service=service, options=options)
        return driver

    def handle_popups(self):
        """Override in child classes to handle store-specific popups."""
        pass

    def scrape_products(self, search_value):
        """Override in child classes to implement store-specific scraping."""
        pass

    def quit_driver(self):
        self.driver.quit()

# Jarir-specific scraper class inheriting from StoreScraper
class JarirScraper(StoreScraper):
    def handle_popups(self):
        # Handle language popup
        try:
            WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button#switcher-button-en"))
            ).click()
            print("Language selected: English")
        except TimeoutException:
            print("Language popup did not appear or was already handled.")
        
        # Handle cookie consent popup
        try:
            WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
            ).click()
            print("Accepted cookie consent.")
        except TimeoutException:
            print("Cookie consent popup did not appear or was already handled.")

    def scrape_products(self, search_value, max_scrolls=5):
        # URL encode the search query
        encoded_search_value = urllib.parse.quote(search_value)
        url = f"https://www.jarir.com/sa-en/catalogsearch/result?search={encoded_search_value}"

        try:
            self.driver.get(url)
            self.handle_popups()

            # Wait for the first set of products to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CLASS_NAME, "product-tile"))
            )
            print(f"Scraping results from {self.store_name} for: {search_value}")

            unique_products = set()

            def extract_products():
                # Find product elements and extract relevant info
                product_elements = self.driver.find_elements(By.CLASS_NAME, "product-tile")
                for product in product_elements:
                    title = product.find_element(By.CLASS_NAME, "product-title__title").text
                    link = product.find_element(By.CSS_SELECTOR, "a.product-tile__link").get_attribute("href")
                    price = product.find_element(By.CLASS_NAME, "price").text if product.find_elements(By.CLASS_NAME, "price") else "N/A"
                    info = product.find_element(By.CLASS_NAME, "product-title__info").text.strip() if product.find_elements(By.CLASS_NAME, "product-title__info") else "No additional info available"
                    image_url = next((img.get_attribute("src") for img in product.find_elements(By.CSS_SELECTOR, "img.image--contain") if 'placeholder' not in img.get_attribute("src")), "")

                    product_key = (title, link)
                    if product_key not in unique_products:
                        unique_products.add(product_key)
                        yield {
                            "store": self.store_name,
                            "title": title,
                            "link": link,
                            "price": price,
                            "info": info,
                            "image_url": image_url
                        }

            yield from extract_products()

            # Scroll the page to load more products and repeat extraction
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            for _ in range(max_scrolls):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                
                # Wait longer for the new products to load after scrolling
                sleep(3)
                
                yield from extract_products()

                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    print("No more products to load.")
                    break
                last_height = new_height

        except (TimeoutException, WebDriverException) as e:
            print(f"Error during scraping: {e}")
        finally:
            self.quit_driver()


# ScraperManager class for managing multiple scrapers
class ScraperManager:
    def __init__(self):
        self.scrapers = {
            "jarir": JarirScraper,
        }

    def scrape_all_stores(self, search_value):
        for store_name, scraper_class in self.scrapers.items():
            scraper = scraper_class(store_name)
            print(f"Starting scraping for {store_name}")
            yield from scraper.scrape_products(search_value)

# Example usage for real-time scraping of all stores
if __name__ == "__main__":
    manager = ScraperManager()
    search_value = "iPhone 16"  # Example search term

    for product in manager.scrape_all_stores(search_value):
        print(product)  # Print each product as it is scraped in real time
