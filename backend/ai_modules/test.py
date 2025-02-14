import pickle

# Load the saved model
model_path = "ai_modules/classification_model.pkl"
with open(model_path, "rb") as f:
    loaded_model = pickle.load(f)

# Test products
new_products = [
    "PlayStation 5 Stick Module for DualSense Edge Wireless Controller (KSA Version)",
    "Office Printer with Fax and Scanner",
    "Smartphone with 128GB Storage",
    "",  # Edge case: Empty input
    "Unknown category example"  # Edge case: Unseen category
]

print("Classifying test products...")
predicted_categories = loaded_model.predict(new_products)

# Output results
for product, category in zip(new_products, predicted_categories):
    print(f"Product: {product} => Predicted Category ID: {category}")
