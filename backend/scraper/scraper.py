# scraper.py
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException
from time import sleep
import urllib.parse
import platform
import os
import stat
import re


class StoreScraper:
    def __init__(self, store_name):
        self.store_name = store_name
        self.driver = self.setup_driver()

    def setup_driver(self):
        project_dir = os.path.dirname(os.path.abspath(__file__))

        # Define the path to chromedriver within the project directory
        if platform.system() == "Linux":
            driver_path = os.path.join(project_dir, "chromedriver")
        elif platform.system() == "Windows":
            driver_path = os.path.join(project_dir, "chromedriver.exe")
        else:
            raise Exception("Unsupported OS. This script supports only Windows and Linux.")

        # Ensure the chromedriver has executable permissions (only needed for Linux)
        if platform.system() == "Linux" and not os.access(driver_path, os.X_OK):
            os.chmod(driver_path, stat.S_IEXEC)

        # Set up the Chrome service with the specified path
        service = Service(executable_path=driver_path)

        # Set up Chrome options
        options = webdriver.ChromeOptions()
        options.add_argument("user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36")
        options.add_experimental_option("excludeSwitches", ["enable-automation"])
        options.add_experimental_option('useAutomationExtension', False)
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--window-size=1920x1080")
        options.add_argument("--ignore-certificate-errors")
        options.add_argument("--ignore-ssl-errors")
        options.add_argument("--allow-insecure-localhost")
        options.add_argument("--headless")  # Ensure this line is present for headless mode

        # Initialize the Chrome WebDriver with the specified service and options
        driver = webdriver.Chrome(service=service, options=options)
        return driver

    def quit_driver(self):
        if self.driver:
            self.driver.quit()
            self.driver = None


    def clean_image_url(self, image_url):
        if image_url.startswith("//"):
            image_url = "https:" + image_url

        image_url = image_url.replace("////", "//")

        if "100_00" in image_url:
            image_url = image_url.replace("100_00", "100_01")

        if "?locale=" in image_url:
            image_url = image_url.split("?locale=")[0] + "?locale=en-GB,en-"
        elif "&amp;fmt=" in image_url:
            image_url = image_url.split("&amp;")[0]

        return image_url

    @staticmethod
    def normalize_price(price):
        """
        Standardize price format to a consistent structure (e.g., 3499.00, 1999.00).
        Handles unexpected formats gracefully, including multi-line or messy inputs.
        """
        try:
            # Replace line breaks and extra spaces
            price = price.replace("\n", "").strip()

            # Remove all non-numeric characters except commas and periods
            price = re.sub(r"[^\d.,]", "", price)

            # Remove commas to handle cases like "3,499" correctly
            price = price.replace(",", "")

            # Convert to float and format to two decimal places
            normalized_price = float(price)
            return f"{normalized_price:.2f}"
        except (ValueError, IndexError):
            # Return "N/A" if parsing fails
            return "N/A"

class JarirScraper(StoreScraper):
    def handle_popups(self):
        """
        Handle popups like language selection and cookie consent.
        """
        try:
            # Handle language popup
            WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button#switcher-button-en"))
            ).click()
            print("Language selected: English")
        except TimeoutException:
            print("Language popup did not appear or was already handled.")

        try:
            # Handle cookie consent popup
            WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
            ).click()
            print("Accepted cookie consent.")
        except TimeoutException:
            print("Cookie consent popup did not appear or was already handled.")

    def scrape_products(self, search_value, max_scrolls=5):
        """
        Scrape products from Jarir for a given search value.
        """
        encoded_search_value = urllib.parse.quote(search_value)
        url = f"https://www.jarir.com/sa-en/catalogsearch/result?search={encoded_search_value}"

        try:
            self.driver.get(url)
            self.handle_popups()

            # Wait for product tiles to load
            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CLASS_NAME, "product-tile"))
            )
            print(f"Scraping results from {self.store_name} for: {search_value}")

            unique_products = set()

            def extract_products():
                """
                Extract product details from the current page.
                """
                try:
                    product_elements = self.driver.find_elements(By.CLASS_NAME, "product-tile")
                    for product in product_elements:
                        try:
                            title = product.find_element(By.CLASS_NAME, "product-title__title").text
                            link = product.find_element(By.CSS_SELECTOR, "a.product-tile__link").get_attribute("href")
                            raw_price = product.find_element(By.CLASS_NAME, "price").text if product.find_elements(By.CLASS_NAME, "price") else "N/A"
                            price = self.normalize_price(raw_price)
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
                        except NoSuchElementException:
                            print(f"Failed to extract product details. Skipping product...")
                except Exception as e:
                    print(f"Error extracting products: {e}")

            # Extract products from the first page
            yield from extract_products()

            # Scroll and extract products from additional content loaded dynamically
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            for _ in range(max_scrolls):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                sleep(3)  # Allow time for dynamic content to load
                yield from extract_products()

                # Check if scrolling has reached the bottom of the page
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    print("No more products to load.")
                    break
                last_height = new_height

        except (TimeoutException, WebDriverException) as e:
            print(f"Error during scraping: {e}")


class AmazonScraper(StoreScraper):
    def scrape_products(self, search_value, max_pages=5):
        encoded_search_value = urllib.parse.quote(search_value)
        base_url = f"https://www.amazon.sa/s?k={encoded_search_value}&language=en_AE"

        try:
            for page in range(1, max_pages + 1):
                url = f"{base_url}&page={page}"
                print(f"Loading page {page} for Amazon - URL: {url}")
                self.driver.get(url)

                WebDriverWait(self.driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.s-main-slot"))
                )
                print(f"Scraping results from {self.store_name} - Page {page} for: {search_value}")

                unique_products = set()

                def extract_products():
                    product_elements = self.driver.find_elements(By.CSS_SELECTOR, "div.s-result-item[data-component-type='s-search-result']")
                    for product in product_elements:
                        try:
                            # Extract the product title
                            title_elem = product.find_element(By.CSS_SELECTOR, "h2 .a-link-normal")
                            title = title_elem.text

                            # Extract the product link
                            link = title_elem.get_attribute("href")

                            # Extract the product price
                            raw_price = "N/A"
                            try:
                                price_whole = product.find_element(By.CSS_SELECTOR, "span.a-price-whole").text
                                price_fraction = product.find_element(By.CSS_SELECTOR, "span.a-price-fraction").text
                                raw_price = f"{price_whole}.{price_fraction}"
                            except NoSuchElementException:
                                pass
                            price = self.normalize_price(raw_price)

                            # Extract the product image URL
                            image_url = product.find_element(By.CSS_SELECTOR, "img.s-image").get_attribute("src")

                            product_key = (title, link)
                            if product_key not in unique_products:
                                unique_products.add(product_key)
                                yield {
                                    "store": self.store_name,
                                    "title": title,
                                    "link": link,
                                    "price": price,
                                    "info": "N/A",  # Placeholder for additional product info
                                    "image_url": image_url
                                }
                        except (NoSuchElementException, WebDriverException):
                            continue

                yield from extract_products()

                try:
                    next_button = self.driver.find_element(By.CSS_SELECTOR, "a.s-pagination-next")
                    if not next_button.is_enabled():
                        print("No more pages to load.")
                        break
                except NoSuchElementException:
                    print("No 'Next' button found. Stopping pagination.")
                    break

        except (TimeoutException, WebDriverException) as e:
            print(f"Error during scraping: {e}")
    def scrape_availability(self, product_link):
        """
        Check the availability of a product on Amazon based on its link.
        :param product_link: The URL of the product page.
        :return: True if the product is available, False otherwise.
        """
        try:
            # Navigate to the product link
            self.driver.get(product_link)

            # Check if the "Currently unavailable" span is present
            try:
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located(
                        (By.CSS_SELECTOR, ".a-size-medium a-color-success")
                    )
                )
                return False  # Product is unavailable
            except TimeoutException:
                pass

            # If neither element is found, log and assume unavailability
            print(f"[Amazon] Availability status could not be determined for {product_link}")
            return True  # Assume the product is available by default

        except Exception as e:
            print(f"[Amazon] Error checking availability for {product_link}: {e}")
            return False


class ExtraScraper(StoreScraper):
    def scrape_products(self, search_value, max_pages=5):
        """
        Scrape products from the Extra store using the correct URL format.
        """
        # Correct URL format provided manually
        base_url = f"https://www.extra.com/en-sa/search/?q={search_value}%3Arelevance%3Atype%3APRODUCT&text={search_value}&pageSize=96&sort=relevance"

        unique_products = set()

        try:
            for page in range(1, max_pages + 1):
                # Construct the URL for each page using the correct format
                url = f"{base_url}&pg={page}"
                print(f"Loading page {page} for Extra - URL: {url}")
                self.driver.get(url)

                # Wait for the product tiles to load
                WebDriverWait(self.driver, 10).until(
                    EC.presence_of_element_located((By.CLASS_NAME, "product-tile-wrapper"))
                )
                print(f"Scraping results from {self.store_name} - Page {page} for: {search_value}")

                # Extract products on the current page
                def extract_products():
                    product_elements = self.driver.find_elements(By.CLASS_NAME, "product-tile-wrapper")
                    for product in product_elements:
                        try:
                            # Extract product details
                            title = product.find_element(By.CLASS_NAME, "product-name-data").text
                            link = product.find_element(By.CSS_SELECTOR, "a").get_attribute("href")
                            raw_price = product.find_element(By.CLASS_NAME, "price").text.replace("SAR", "").strip()
                            price = self.normalize_price(raw_price)
                            info = "; ".join([li.text for li in product.find_elements(By.CSS_SELECTOR, "ul.product-stats li")])
                            raw_image_url = product.find_element(By.CSS_SELECTOR, "picture img").get_attribute("src")
                            image_url = self.clean_image_url(raw_image_url)  # Clean the image URL

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
                        except (NoSuchElementException, WebDriverException):
                            continue

                yield from extract_products()

                # Check if the current page is the last page
                pagination_element = self.driver.find_elements(By.CLASS_NAME, "pagination-wrapper")
                if pagination_element:
                    next_button = self.driver.find_elements(By.CSS_SELECTOR, "li.next")
                    if not next_button or 'hidden' in next_button[0].get_attribute('class'):
                        print("No more pages to load. Stopping pagination.")
                        break
                else:
                    print("No pagination found. Assuming this is the only page.")
                    break

        except (TimeoutException, WebDriverException) as e:
            print(f"Error during scraping: {e}")
