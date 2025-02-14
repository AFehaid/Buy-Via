import unittest
from unittest.mock import patch, MagicMock
from scraper.scraper_manager import ScraperManager
from models import Product, Store, engine
from sqlalchemy.orm import Session


class TestScraperManager(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        """Set up resources before running tests."""
        cls.manager = ScraperManager("test_search_values.json")
        cls.mock_scraper = MagicMock()
        cls.mock_scraper.scrape_products.return_value = [
            {
                "store": "Amazon",
                "title": "Test Product",
                "price": "199.99",
                "info": "Sample product information",
                "search_value": "test",
                "link": "http://example.com/product",
                "image_url": "http://example.com/image.jpg",
            }
        ]

    def test_load_search_values(self):
        """Test loading search values."""
        with patch("builtins.open", mock_open(read_data='{"search_values": ["test1", "test2", "test3"]}')):
            search_values = self.manager.load_search_values()
            self.assertIsInstance(search_values, list, "Search values should be a list.")
            self.assertGreater(len(search_values), 0, "Search values list should not be empty.")

    def test_classify_product(self):
        """Test product classification."""
        with patch.object(self.manager, "classification_model", MagicMock()):
            self.manager.classification_model.predict.return_value = [3]
            category_id = self.manager.classify_product("Test Product", "test")
            self.assertEqual(category_id, 3, "Category ID should match the mocked prediction.")

    def test_store_to_database(self):
        """Test storing a product in the database."""
        test_data = {
            "store": "Amazon",
            "title": "Test Product",
            "price": "199.99",
            "info": "Sample product information",
            "search_value": "test",
            "link": "http://example.com/product",
            "image_url": "http://example.com/image.jpg",
            "current_index": 1,
            "total_values": 1,
        }

        with Session(engine) as db:
            self.manager.store_to_database(db, test_data)

            # Query the database for the stored product
            product = db.query(Product).filter_by(title="Test Product").first()
            self.assertIsNotNone(product, "Product should be stored in the database.")
            self.assertEqual(product.price, 199.99, "Product price should match the input data.")

    def test_run_scraper_for_value(self):
        """Test running a scraper for a specific value."""
        with patch.object(self.manager, "store_to_database") as mock_store_to_database:
            self.manager.run_scraper_for_value(self.mock_scraper, "iphone", 1, 1)
            self.mock_scraper.scrape_products.assert_called_with("iphone")
            mock_store_to_database.assert_called_once()

    def test_scrape_all_products(self):
        """Test scraping all products."""
        with patch.object(self.manager, "run_scraper_for_value") as mock_run_scraper:
            with patch.object(self.manager, "load_search_values", return_value=["iphone"]):
                self.manager.scrape_all_products()
                mock_run_scraper.assert_called()

    @classmethod
    def tearDownClass(cls):
        """Clean up resources after tests."""
        with Session(engine) as db:
            db.query(Product).delete()
            db.query(Store).delete()
            db.commit()


if __name__ == "__main__":
    unittest.main()
