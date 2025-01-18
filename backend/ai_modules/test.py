import pickle

# Load the saved model
model_path = "/home/fahoo/Documents/Buy-Via/backend/ai_modules/classification_model.pkl"
with open(model_path, "rb") as f:
    loaded_model = pickle.load(f)

# Classify new products
new_products = [
    "PlayStation 5 Stick Module for DualSense Edge Wireless Controller (KSA Version)",
    "Office Printer with Fax and Scanner",
    "Smartphone with 128GB Storage",
]

predicted_categories = loaded_model.predict(new_products)

for product, category in zip(new_products, predicted_categories):
    print(f"Product: {product} => Predicted Category ID: {category}")
