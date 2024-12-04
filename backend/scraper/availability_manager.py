from sqlalchemy.orm import Session
from scraper.scraper import AmazonScraper
from models import Product, engine

# Create a database session
with Session(engine) as db:
    # Query all Amazon products
    amazon_products = db.query(Product).filter(Product.store_id == 1).all()

    # Initialize the AmazonScraper
    amazon_scraper = AmazonScraper("Amazon")
    amazon_scraper.driver = amazon_scraper.setup_driver()  # Ensure the driver is set up

    # Check availability for each product
    for product in amazon_products:
        try:
            # Scrape the availability of the product
            availability = amazon_scraper.scrape_availability(product.link)
            print(f"Product ID: {product.product_id}, Title: {product.title}, Available: {availability}")
            
            # Update the product's availability in the database
            product.availability = availability
            db.add(product)  # Mark the product for update
        except Exception as e:
            print(f"Error checking availability for Product ID: {product.product_id}, Title: {product.title}. Error: {e}")

    # Commit changes to the database after processing all products
    db.commit()
    print("Availability data updated in the database.")

    # Quit the scraper's driver when done
    amazon_scraper.quit_driver()
