import os
import time
import threading
from dotenv import load_dotenv

from models import SessionLocal, Alert, Product
from ai_modules.ai_recommendation import continuously_update_recommendations
from scraper.scraper_manager import ScraperManager
from scraper.availability_checker import AvailabilityChecker
from scraper.arabic_manager import ArabicTitleUpdater

load_dotenv()

def continuously_monitor_alerts(interval_seconds: int = 60):
    """
    Continuously monitor "active" alerts. If a product's current price
    is <= the alert threshold_price, mark it as 'triggered'.
    """
    while True:
        with SessionLocal() as db:
            active_alerts = (
                db.query(Alert)
                .join(Product, Alert.product_id == Product.product_id)
                .filter(Alert.alert_status == "active")
                .all()
            )
            for a in active_alerts:
                if a.product and a.product.price is not None:
                    if a.product.price <= a.threshold_price:
                        a.alert_status = "triggered"
                        #a.user.send_alert_email(a.product)
            db.commit()
        time.sleep(interval_seconds)

def run_alert_monitor(interval_seconds: int = 60):
    """
    Wrapper to run alerts in a thread-safe infinite loop.
    """
    threading.Thread(
        target=continuously_monitor_alerts,
        args=(interval_seconds,),
        daemon=True
    ).start()
    print("Started Alert Monitor.")

def continuously_update_recommendations_loop(interval_seconds: int = 60):
    """
    Continuously run recommendation updates every X seconds.
    """
    while True:
        with SessionLocal() as db:
            continuously_update_recommendations(db)
        time.sleep(interval_seconds)

def run_recommendation_updater(interval_seconds: int = 60):
    """
    Wrapper to run recommendation updater in a thread-safe infinite loop.
    """
    threading.Thread(
        target=continuously_update_recommendations_loop,
        args=(interval_seconds,),
        daemon=True
    ).start()
    print("Started Recommendation Updater.")

def continuously_run_scraper_manager():
    """
    Continuously run the scraper manager until completion,
    then wait and restart.
    """
    while True:
        try:
            print("Starting Scraper Manager...")
            manager = ScraperManager()
            manager.scrape_all_products()  # Allow this to run fully
            print("Scraper Manager task completed. Restarting after delay...")
        except Exception as e:
            print(f"Error in Scraper Manager: {e}")
        time.sleep(3600)  # Wait for 1 hour before restarting

def run_scraper_manager():
    """
    Wrapper to run the scraper manager in a thread-safe infinite loop.
    """
    threading.Thread(
        target=continuously_run_scraper_manager,
        daemon=True
    ).start()
    print("Started Scraper Manager in the background.")

def continuously_run_availability_checker():
    """
    Continuously run the availability checker until completion,
    then wait and restart.
    """
    while True:
        try:
            print("Starting Availability Checker...")
            checker = AvailabilityChecker(chunk_size=2000)
            checker.update_availability()  # Allow this to run fully
            print("Availability Checker task completed. Restarting after delay...")
        except Exception as e:
            print(f"Error in Availability Checker: {e}")
        time.sleep(3600)  # Wait for 1 hour before restarting

def run_availability_checker():
    """
    Wrapper to run the availability checker in a thread-safe infinite loop.
    """
    threading.Thread(
        target=continuously_run_availability_checker,
        daemon=True
    ).start()
    print("Started Availability Checker in the background.")

def continuously_run_arabic_title_updater():
    """
    Continuously run the Arabic title updater until completion,
    then wait and restart.
    """
    while True:
        try:
            print("Starting Arabic Title Updater...")
            updater = ArabicTitleUpdater()
            updater.update_titles()  # Allow this to run fully
            print("Arabic Title Updater task completed. Restarting after delay...")
        except Exception as e:
            print(f"Error in Arabic Title Updater: {e}")
        time.sleep(3600)  # Wait for 1 hour before restarting

def run_arabic_title_updater():
    """
    Wrapper to run the Arabic title updater in a thread-safe infinite loop.
    """
    threading.Thread(
        target=continuously_run_arabic_title_updater,
        daemon=True
    ).start()
    print("Started Arabic Title Updater in the background.")


def start_background_tasks():
    """
    Check environment, and if not DEV, start the scraper, availability checker,
    and Arabic updater in infinite loops.
    Then start the recommendation updater & alert monitor for all environments.
    """
    environment = os.getenv("DEPLOYMENT_ENVIRONMENT", "DEV")

    # Always run Recommendation Updater & Alert Monitor
    run_recommendation_updater()
    run_alert_monitor()

    # Only run heavy scrapers if environment != DEV
    if environment != "DEV":
        run_scraper_manager()
        run_availability_checker()
        run_arabic_title_updater()

    print("Background tasks have started.")
