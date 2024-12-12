import os
import logging
from tqdm import tqdm
from dotenv import load_dotenv
import openai
from models import SessionLocal, Product, Category

# Load environment variables
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# Set up minimal logging
logging.basicConfig(level=logging.WARNING)

def get_categories(session):
    """Fetch all categories from the database and return a list of category names."""
    categories = session.query(Category).order_by(Category.category_id).all()
    return [c.category_name for c in categories]

def get_category_mappings(session):
    """Return a dict mapping category_name.lower() to category_id."""
    categories = session.query(Category).all()
    return {c.category_name.lower(): c.category_id for c in categories}

def get_general_products(session, limit=None):
    """
    Fetch products currently classified under 'General (Fallback category)' (category_id=54).
    """
    target_category_id = 54
    query = session.query(Product).filter(Product.category_id == target_category_id)
    if limit:
        query = query.limit(limit)
    products = query.all()

    # Print fetched products for debugging
    if products:
        print(f"Fetched {len(products)} products from category_id={target_category_id}.")
    else:
        print(f"No products found in category_id={target_category_id}.")
    return products

def build_few_shot_examples(categories):
    examples = f"""
You must classify products into exactly one category from the following list:
{", ".join(categories)}

EXAMPLES (Product Title -> Category):
"Apple MacBook Air 13-inch" -> Laptops & Notebooks
"ASUS ROG Ally Gaming Handheld" -> Handheld Gaming Devices (ROG Ally, Steam Deck, Nintendo Switch Lite)
"Apple iPhone 15 Pro" -> Smartphones & Cell Phones
"Samsung 4K UHD Monitor" -> Monitors & Displays
"Canon EOS R5 Mirrorless Camera" -> Cameras & Camcorders
"Logitech MX Master 3 Wireless Mouse" -> Computer Peripherals (Keyboards, Mice)
"Breville Espresso Machine" -> Kitchen Appliances (Blenders, Microwaves, Coffee Makers)
"Ring Video Doorbell" -> Home Security & Surveillance
"Adidas Running Shoes" -> Shoes (Men, Women, Kids)
"Paper Mate Ballpoint Pens" -> Office Supplies (Paper, Pens, Folders)
"Nintendo Switch OLED Console" -> Gaming Consoles (PlayStation, Xbox, Nintendo)
"Zelda: Tears of the Kingdom" -> Video Games
"Dyson Vacuum Cleaner" -> Home Appliances (Refrigerators, Washers)
"PlayStation 5 Controller" -> Gaming Accessories (Controllers, VR Headsets, Cases)

DO NOT EXPLAIN. JUST OUTPUT THE EXACT CATEGORY NAME.
    """
    return examples.strip()

def classify_product_title(title: str, categories) -> str:
    few_shot = build_few_shot_examples(categories)
    user_message = f'Product title: "{title}"\nCategory:'

    try:
        response = openai.ChatCompletion.create(
            model="gpt-4o-mini",  # Change if needed
            messages=[
                {"role": "system", "content": few_shot},
                {"role": "user", "content": user_message}
            ],
            max_tokens=20,
            temperature=0.0
        )
        category_candidate = response.choices[0].message.content.strip()
    except Exception as e:
        print(f"Error classifying title '{title}': {e}")
        return "General (Fallback category)"

    cat_lower = category_candidate.lower()
    known_categories = [c.lower() for c in categories]
    if cat_lower in known_categories:
        for cat in categories:
            if cat.lower() == cat_lower:
                return cat
    print(f"Unknown category returned: {category_candidate}")
    return "General (Fallback category)"

def update_product_category(session, product, category_name, name_to_id):
    category_id = name_to_id.get(category_name.lower(), 54)  # fallback if not found
    product.category_id = category_id
    session.commit()

def classify_products(batch_size=100):
    session = SessionLocal()
    categories = get_categories(session)
    name_to_id = get_category_mappings(session)

    while True:
        products = get_general_products(session, limit=batch_size)
        if not products:
            print("No more products to classify.")
            break

        total_in_batch = len(products)
        for i, product in enumerate(products, start=1):
            print(f"Classifying Product ID: {product.product_id} ({i}/{total_in_batch}) - Title: {product.title}")
            category_name = classify_product_title(product.title, categories)
            update_product_category(session, product, category_name, name_to_id)
            # Print result in the requested format
            print(f"[{product.product_id}/{i}/{total_in_batch}][{category_name}][{product.title}]")

    session.close()
    print("Classification completed.")

if __name__ == "__main__":
    classify_products()
