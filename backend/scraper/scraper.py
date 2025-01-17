from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, WebDriverException, NoSuchElementException
from bs4 import BeautifulSoup
from time import sleep
import urllib.parse
import platform
import os
import stat
import re
from scrapy import Selector
import requests

class StoreScraper:
    def __init__(self, store_name):
        self.store_name = store_name
        self.driver = self.setup_driver()

    def setup_driver(self):

        options = webdriver.ChromeOptions()
        # Basic optimizations
        options.add_argument("--headless")  # Run without GUI
        options.add_argument("--disable-gpu")  # Disable GPU for headless mode
        options.add_argument("--no-sandbox")  # Required for Docker containers
        options.add_argument("--disable-dev-shm-usage")  # Use /tmp for shared memory

        # Lower memory and CPU consumption
        options.add_argument("--disable-extensions")
        options.add_argument("--disable-infobars")
        options.add_argument("--disable-browser-side-navigation")
        options.add_argument("--disable-blink-features=AutomationControlled")
        options.add_argument("--disable-popup-blocking")

        # Use a custom user-agent to avoid detection
        options.add_argument(
            "user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36"
        )
        driver = webdriver.Chrome(options=options)
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
        try:
            price = price.replace("\n", "").strip()
            price = re.sub(r"[^\d.,]", "", price)
            price = price.replace(",", "")
            normalized_price = float(price)
            return f"{normalized_price:.2f}"
        except (ValueError, IndexError):
            return "N/A"


class JarirScraper(StoreScraper):
    def handle_popups(self):
        """Handle popups for language selection and cookie consent."""
        try:
            WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.CSS_SELECTOR, "button#switcher-button-en"))
            ).click()
            print("Language selected: English")
        except TimeoutException:
            print("Language popup did not appear or was already handled.")

        try:
            WebDriverWait(self.driver, 5).until(
                EC.element_to_be_clickable((By.ID, "onetrust-accept-btn-handler"))
            ).click()
            print("Accepted cookie consent.")
        except TimeoutException:
            print("Cookie consent popup did not appear or was already handled.")

    def scrape_products(self, search_value, max_scrolls=5):
        """Scrape products from the Jarir website."""
        encoded_search_value = urllib.parse.quote(search_value)
        url = f"https://www.jarir.com/sa-en/catalogsearch/result?search={encoded_search_value}&country=sa"

        try:
            self.driver.get(url)
            self.handle_popups()

            WebDriverWait(self.driver, 20).until(
                EC.presence_of_element_located((By.CLASS_NAME, "product-tile__item--spacer"))
            )
            print(f"Scraping results from {self.store_name} for: {search_value}")

            unique_products = set()

            def extract_products():
                """Extract product details using BeautifulSoup."""
                page_source = self.driver.page_source
                soup = BeautifulSoup(page_source, "html.parser")
                product_elements = soup.find_all("div", class_="product-tile__item--spacer")

                if not product_elements:
                    print("No product tiles found. The page structure might have changed.")

                for product in product_elements:
                    try:
                        # Extract title and link
                        title_elem = product.find("p", class_="product-title__title")
                        link_elem = product.find("a", class_="product-tile__link")

                        # Extract price
                        price_elem = product.find("div", class_="price")
                        raw_price = price_elem.get_text(strip=True) if price_elem else "N/A"
                        price = self.normalize_price(raw_price)

                        # Extract info
                        info_elem = product.find("p", class_="product-title__info")
                        info = (
                            info_elem.get_text(" | ", strip=True)
                            if info_elem
                            else "No additional info available"
                        )

                        # Extract image (focus on `loading="eager"` to get the correct image)
                        image_elem = product.find("img", {"loading": "eager", "class": "image--contain"})
                        image_url = self.clean_image_url(image_elem["src"]) if image_elem else ""

                        # Format the product link
                        title = title_elem.get_text(strip=True) if title_elem else "No title"
                        link = f"https://www.jarir.com{link_elem['href']}" if link_elem else "No link"

                        product_key = (title, link)
                        if product_key not in unique_products:
                            unique_products.add(product_key)
                            yield {
                                "store": self.store_name,
                                "title": title,
                                "link": link,
                                "price": price,
                                "info": info,
                                "image_url": image_url,
                            }
                    except AttributeError as e:
                        print(f"Error extracting product details: {e}. Skipping product...")

            yield from extract_products()

            # Implement scrolling for dynamic content loading
            last_height = self.driver.execute_script("return document.body.scrollHeight")
            for _ in range(max_scrolls):
                self.driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
                sleep(3)
                yield from extract_products()
                new_height = self.driver.execute_script("return document.body.scrollHeight")
                if new_height == last_height:
                    print("No more products to load.")
                    break
                last_height = new_height

        except (TimeoutException, WebDriverException) as e:
            print(f"Error during scraping: {e}")


    def scrape_arabic(self, url):
        self.driver.get(url)
        try:
            title_element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "h2.product-title__title"))
            )
            title = title_element.text.strip()
            return {"store": self.store_name, "title_arabic": title}
        except Exception as e:
            print(f"[Jarir] Error fetching Arabic title: {e}")
            return None

    def scrape_availability(self, product_link):
        """
        Check the availability and price of a product on Jarir's website using BeautifulSoup.
        :param product_link: The URL of the product page.
        :return: A dictionary with 'availability' (bool) and 'price' (float or 'N/A').
        """
        try:
            # Navigate to the product page
            self.driver.get(product_link)

            # Get the page source after loading the product page
            page_source = self.driver.page_source

            # Parse the page source with BeautifulSoup
            soup = BeautifulSoup(page_source, "html.parser")

            # Check for availability
            notify_me_buttons = soup.select("button.button--primary.button--fluid.button--secondary")
            add_to_cart_buttons = soup.select("button.button--add-to-cart.button--primary.button--fluid")

            # Determine availability
            availability = bool(add_to_cart_buttons or not notify_me_buttons)

            # Extract the price
            price_element = soup.select_one("div.price-box__row div.price span.price__currency + span")
            price = "N/A"

            if price_element:
                raw_price = price_element.get_text(strip=True).replace(",", "")
                price = self.normalize_price(raw_price)

            # Return both availability and price
            return {"availability": availability, "price": price}

        except Exception as e:
            print(f"[{self.store_name}] Error checking availability and price for {product_link}: {e}")
            return {"availability": False, "price": "N/A"}



class AmazonScraper(StoreScraper):
    def scrape_products(self, search_value, max_pages=5):
        """Scrape products from Amazon for a given search value."""
        encoded_search_value = urllib.parse.quote(search_value)
        base_url = f"https://www.amazon.sa/s?k={encoded_search_value}&language=en_AE"

        try:
            for page in range(1, max_pages + 1):
                url = f"{base_url}&page={page}"
                print(f"Loading page {page} for Amazon - URL: {url}")
                self.driver.get(url)

                # Wait for the product list to load
                WebDriverWait(self.driver, 20).until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, "div.s-main-slot"))
                )
                print(f"Scraping results from {self.store_name} - Page {page} for: {search_value}")

                unique_products = set()

                def extract_products():
                    """Extract product details using BeautifulSoup."""
                    page_source = self.driver.page_source
                    soup = BeautifulSoup(page_source, "html.parser")
                    product_elements = soup.select("div.s-result-item[data-component-type='s-search-result']")

                    for product in product_elements:
                        try:
                            # Extract title and link
                            title_elem = product.select_one("a.a-link-normal.s-line-clamp-4")
                            if not title_elem:
                                title_elem = product.select_one("h2 a.a-link-normal")
                            title = title_elem.text.strip()
                            link = f"https://www.amazon.sa{title_elem['href']}"

                            # Extract price
                            price = "N/A"
                            price_elem = product.select_one("span.a-price span.a-offscreen")
                            if price_elem:
                                raw_price = price_elem.text.strip()
                                price = self.normalize_price(raw_price)

                            # Extract image URL
                            image_elem = product.select_one("img.s-image")
                            image_url = image_elem["src"] if image_elem else ""

                            # Add unique product
                            product_key = (title, link)
                            if product_key not in unique_products and title:
                                unique_products.add(product_key)
                                yield {
                                    "store": self.store_name,
                                    "title": title,
                                    "link": link,
                                    "price": price,
                                    "info": "N/A",
                                    "image_url": image_url
                                }
                        except AttributeError as e:
                            print(f"Failed to extract some product details: {e}. Skipping...")

                yield from extract_products()

                # Check for 'Next' button to paginate
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

    def scrape_arabic(self, url):
        self.driver.get(url)
        try:
            title_element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "span#productTitle"))
            )
            title = title_element.text.strip()
            return {"store": self.store_name, "title_arabic": title}
        except Exception as e:
            print(f"[Amazon] Error fetching Arabic title: {e}")
            return None
    
    def scrape_availability(self, product_link):
        """
        Check availability and price of a product on Amazon based on its link.
        1) If not available -> skip price extraction and set price = "N/A".
        2) If available -> do the normal 3-step approach to find a price.
        """
        try:
            self.driver.get(product_link)
            soup = BeautifulSoup(self.driver.page_source, "html.parser")

            # =========== AVAILABILITY DETECTION ===========
            availability = False

            # 1) If text "In Stock" appears in .a-size-medium.a-color-success
            availability_elem = soup.select_one(".a-size-medium.a-color-success")
            if availability_elem:
                availability_text = availability_elem.get_text(strip=True)
                if "in stock" in availability_text.lower():
                    availability = True

            # 2) If the #add-to-cart-button is present, also consider it available
            add_to_cart_button = soup.select_one("#add-to-cart-button")
            if add_to_cart_button:
                availability = True

            # 3) Check if "Currently unavailable" is present
            #    If found, override availability to False
            unavailable_element = soup.select_one("#availability span.a-declarative")
            if unavailable_element:
                unavailable_text = unavailable_element.get_text(strip=True)
                if "currently unavailable" in unavailable_text.lower():
                    availability = False

            # =========== PRICE DETECTION ===========
            if not availability:
                # If the product is not available, forcibly skip price:
                price = "N/A"
            else:
                price = "N/A"
                # 1) apexPriceToPay .a-offscreen
                apex_elem = soup.select_one("span.a-price.a-text-price.a-size-medium.apexPriceToPay span.a-offscreen")
                if apex_elem:
                    raw_price = apex_elem.get_text(strip=True)
                    raw_price = raw_price.replace("SAR", "").replace("ر.س", "").strip()
                    price = self.normalize_price(raw_price)
                else:
                    # 2) a-price-whole + a-price-fraction
                    whole_elem = soup.select_one("span.a-price-whole")
                    fraction_elem = soup.select_one("span.a-price-fraction")
                    if whole_elem and fraction_elem:
                        whole_str = whole_elem.get_text(strip=True).replace(",", "")
                        frac_str = fraction_elem.get_text(strip=True)
                        if whole_str.endswith("."):
                            whole_str = whole_str[:-1]  # remove trailing dot
                        combined_price = f"{whole_str}.{frac_str}"
                        price = self.normalize_price(combined_price)
                    else:
                        # 3) fallback: .aok-offscreen
                        fallback_elem = soup.select_one("div.a-section.aok-relative span.aok-offscreen")
                        if fallback_elem:
                            raw_price = fallback_elem.get_text(strip=True)
                            raw_price = raw_price.replace("SAR", "").replace("ر.س", "").strip()
                            price = self.normalize_price(raw_price)

            return {"availability": availability, "price": price}

        except Exception as e:
            print(f"[Amazon] Error checking availability and price for {product_link}: {e}")
            return {"availability": False, "price": "N/A"}


class ExtraScraper(StoreScraper):
    def scrape_products(self, search_value, max_pages=5):
        """Scrape products from Extra for a given search value."""
        base_url = f"https://www.extra.com/en-sa/search/?q={urllib.parse.quote(search_value)}%3Arelevance%3Atype%3APRODUCT&text={urllib.parse.quote(search_value)}&pageSize=96&sort=relevance"

        unique_products = set()

        try:
            for page in range(1, max_pages + 1):
                url = f"{base_url}&pg={page}"
                print(f"Loading page {page} for Extra - URL: {url}")
                self.driver.get(url)

                # Wait for product tiles to load
                try:
                    WebDriverWait(self.driver, 20).until(
                        EC.presence_of_all_elements_located((By.CLASS_NAME, "product-tile-wrapper"))
                    )
                except TimeoutException:
                    print(f"No products found on page {page}. Stopping pagination.")
                    break

                print(f"Scraping results from Extra - Page {page} for: {search_value}")

                def extract_products():
                    """Extract product details using BeautifulSoup."""
                    page_source = self.driver.page_source
                    soup = BeautifulSoup(page_source, "html.parser")
                    product_elements = soup.select("section.product-tile-wrapper")

                    for product in product_elements:
                        try:
                            # Extract product details
                            title_elem = product.select_one("span.product-name-data")
                            title = title_elem.get_text(strip=True) if title_elem else "No title"

                            link_elem = product.select_one("a.product-tile-content-wrapper")
                            link = f"https://www.extra.com{link_elem['href']}" if link_elem else "No link"

                            price_elem = product.select_one("section.price strong")
                            raw_price = price_elem.get_text(strip=True) if price_elem else "N/A"
                            price = self.normalize_price(raw_price)

                            stats = product.select("ul.product-stats li")
                            info = "; ".join([li.get_text(strip=True) for li in stats]) if stats else "No additional info available"

                            image_elem = product.select_one("picture img")
                            image_url = image_elem["src"] if image_elem else ""

                            # Deduplicate products
                            product_key = (title, link)
                            if product_key not in unique_products:
                                unique_products.add(product_key)
                                yield {
                                    "store": self.store_name,
                                    "title": title,
                                    "link": link,
                                    "price": price,
                                    "info": info,
                                    "image_url": self.clean_image_url(image_url),
                                }
                        except AttributeError as e:
                            print(f"Failed to extract some product details: {e}. Skipping...")
                yield from extract_products()

                # Check for the "Next" button and click it
                try:
                    next_button = self.driver.find_element(By.CSS_SELECTOR, "li.next > div.icon-inline")
                    if next_button.is_displayed() and "hidden" not in next_button.get_attribute("class"):
                        next_button.click()
                        WebDriverWait(self.driver, 10).until(
                            EC.staleness_of(next_button)
                        )  # Wait for the page to refresh
                    else:
                        print("No more pages to load. Stopping pagination.")
                        break
                except NoSuchElementException:
                    print("No 'Next' button found. Assuming this is the last page.")
                    break

        except (TimeoutException, WebDriverException) as e:
            print(f"Error during scraping: {e}")

    def scrape_arabic(self, url):
        self.driver.get(url)
        try:
            title_element = WebDriverWait(self.driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "h1.product-name"))
            )
            title = title_element.text.strip()
            return {"store": self.store_name, "title_arabic": title}
        except Exception as e:
            print(f"[Extra] Error fetching Arabic title: {e}")
            return None
    
    def scrape_availability(self, product_link):
        """
        Check the availability and price of a product on Extra's website using BeautifulSoup.
        :param product_link: The URL of the product page.
        :return: A dictionary with 'availability' (bool) and 'price' (float or 'N/A').
        """
        try:
            # Navigate to the product page
            self.driver.get(product_link)

            # Get the page source after loading the product page
            page_source = self.driver.page_source

            # Parse the page source with BeautifulSoup
            soup = BeautifulSoup(page_source, "html.parser")

            # Locate the product availability status
            product_status_element = soup.select_one("div.product-status-text.svelte-agjy")
            availability = True  # Default to available

            # Check if the status text indicates "Unavailable"
            if product_status_element and "Unavailable" in product_status_element.get_text(strip=True):
                availability = False  # Product is unavailable

            # Locate the price element
            price_element = soup.select_one("section.price span.price strong")
            price = "N/A"
            if price_element:
                raw_price = price_element.get_text(strip=True)
                price = self.normalize_price(raw_price)

            # Return both availability and price
            return {"availability": availability, "price": price}

        except Exception as e:
            print(f"[Extra] Error checking availability and price for {product_link}: {e}")
            return {"availability": False, "price": "N/A"}
