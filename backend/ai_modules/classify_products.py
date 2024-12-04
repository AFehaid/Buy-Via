# classify_products.py
import os
import time
from tqdm import tqdm
from dotenv import load_dotenv
import openai

# Import your existing models and database session
from models import SessionLocal, Product, Category

load_dotenv()

openai.api_key = os.getenv("OPENAI_API_KEY")

def get_unclassified_products(session, limit=None):
    query = session.query(Product).filter(Product.category_id == None)
    if limit:
        query = query.limit(limit)
    return query.all()

def get_category_mappings(session):
    categories = session.query(Category).all()
    name_to_id = {c.category_name.lower(): c.category_id for c in categories}
    id_to_name = {c.category_id: c.category_name for c in categories}
    return name_to_id, id_to_name

def classify_product_title(title):
    prompt = (
        f"Assign a category to the following product title from the list of existing categories. "
        f"If no suitable category exists, return 'General'.\n\n"
        f"Product Title: \"{title}\"\n\n"
        f"Categories: Printers, Laptops, Desktops, Smartphones, Tablets, Home Appliances, "
        f"Furniture, Clothing, Shoes, Books, Toys, Sports Equipment, Beauty Products, "
        f"Health Products, Groceries, Automotive, Jewelry, Musical Instruments, Office Supplies, "
        f"Cameras, TV & Home Theater, Video Games, Software, Networking, Wearable Technology, "
        f"Device Accessories, Wear Accessories, Car Accessories\n\n"
        f"Category:"
    )
    try:
        response = openai.Completion.create(
            engine="text-davinci-003",
            prompt=prompt,
            max_tokens=10,
            temperature=0,
            n=1,
            stop=None,
        )
        category = response.choices[0].text.strip()
        return category
    except Exception as e:
        print(f"Error classifying title: {e}")
        return None

def update_product_category(session, product, category_name, name_to_id):
    category_name_lower = category_name.lower()
    if category_name_lower in name_to_id:
        category_id = name_to_id[category_name_lower]
    else:
        # Create a new category if it doesn't exist
        new_category = Category(category_name=category_name)
        session.add(new_category)
        session.commit()
        name_to_id[category_name_lower] = new_category.category_id
        category_id = new_category.category_id
        print(f"Created new category '{category_name}' with ID {category_id}")

    product.category_id = category_id
    session.commit()
    print(f"Updated product '{product.title}' with category '{category_name}'")

def classify_products():
    session = SessionLocal()
    name_to_id, id_to_name = get_category_mappings(session)
    products = get_unclassified_products(session)
    total_products = len(products)
    print(f"Total products to classify: {total_products}")

    for product in tqdm(products, desc="Classifying products"):
        title = product.title
        category_name = classify_product_title(title)
        if category_name:
            update_product_category(session, product, category_name, name_to_id)
        else:
            print(f"Failed to classify product '{title}'")
        time.sleep(1)  # Adjust sleep time based on rate limits

    session.close()

if __name__ == "__main__":
    classify_products()
