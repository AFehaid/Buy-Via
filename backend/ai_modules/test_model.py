import pickle
import csv
from datetime import datetime

# Load the saved model
model_path = "ai_modules/classification_model.pkl"
with open(model_path, "rb") as f:
    loaded_model = pickle.load(f)

# Test products
new_products = [
    "PlayStation 5 Stick Module for DualSense Edge Wireless Controller (KSA Version)",  # Known category
    "Office Printer with Fax and Scanner",  # Known category
    "Smartphone with 128GB Storage",  # Known category
    "",  # Edge case: Empty input
    "Unknown category example"  # Edge case: Ambiguous input
]

# Test case table
test_cases = [
    {
        "Test Case ID": "TC-CL-001",
        "Description": "Known Product Category - Gaming Accessories",
        "Input": "PlayStation 5 Stick Module for DualSense Edge Wireless Controller (KSA Version)",
        "Expected Result": 21,
    },
    {
        "Test Case ID": "TC-CL-002",
        "Description": "Known Product Category - Printers & Scanners",
        "Input": "Office Printer with Fax and Scanner",
        "Expected Result": 9,
    },
    {
        "Test Case ID": "TC-CL-003",
        "Description": "Known Product Category - Smartphones & Cell Phones",
        "Input": "Smartphone with 128GB Storage",
        "Expected Result": 4,
    },
    {
        "Test Case ID": "TC-CL-004",
        "Description": "Edge Case - Empty Input",
        "Input": "",
        "Expected Result": 54,  # Fallback category
    },
    {
        "Test Case ID": "TC-CL-005",
        "Description": "Edge Case - Ambiguous Input",
        "Input": "Unknown category example",
        "Expected Result": 54,  # Fallback category
    }
]

# Classify products and validate
results = []
print("Classifying test products...")
for case in test_cases:
    product = case["Input"]
    expected = case["Expected Result"]
    
    try:
        # Predict category
        predicted = loaded_model.predict([product])[0]
    except Exception as e:
        predicted = f"Error: {e}"
    
    # Log result
    result = {
        "Test Case ID": case["Test Case ID"],
        "Description": case["Description"],
        "Input": product,
        "Expected Result": expected,
        "Predicted Result": predicted,
        "Status": "Pass" if predicted == expected else "Fail"
    }
    results.append(result)

    # Print to console
    print(f"{case['Test Case ID']}: Product: {product} => Predicted Category ID: {predicted} | Expected: {expected} | Status: {result['Status']}")

# Save results to CSV
csv_file = f"classification_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
with open(csv_file, mode="w", newline="") as file:
    writer = csv.DictWriter(file, fieldnames=results[0].keys())
    writer.writeheader()
    writer.writerows(results)

print(f"\nTest case results saved to {csv_file}")
