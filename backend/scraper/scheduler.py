# scheduler.py
import schedule
import time
import subprocess
from datetime import datetime

def run_scraper():
    """
    Function to execute the ScraperManager script as a module.
    """
    print(f"[{datetime.now()}] Starting the scraper...")
    try:
        # Run the scraper_manager module
        subprocess.run(["python", "-m", "scraper.scraper_manager"], check=True)
        print(f"[{datetime.now()}] Scraper completed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"[{datetime.now()}] Error running scraper: {e}")

# Schedule the scraper to run at 1:00 AM and 5:00 PM every day
schedule.every().day.at("01:00").do(run_scraper)
schedule.every().day.at("17:00").do(run_scraper)

if __name__ == "__main__":
    print("Scheduler started. Press Ctrl+C to exit.")
    while True:
        # Run the scheduled tasks
        schedule.run_pending()
        time.sleep(1)
