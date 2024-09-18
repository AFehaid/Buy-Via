import streamlit as st
import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service
from jarir_scraper import scrape_jarir  # Import your existing scraper function

# Streamlit App
def main():
    st.title("Real-time Web Scraper")
    st.markdown("Enter a search term to scrape products from Stores.")

    # User input section
    search_term = st.text_input("Search Term", value="iPhone 16")
    if st.button("Search"):
        if search_term.strip():
            # Start the scraping process
            st.write(f"Scraping results for: {search_term}")
            placeholder = st.empty()  # Placeholder for real-time updates
            product_container = st.container()  # Container to display products
            
            # Display scraping status
            with st.spinner("Scraping in progress..."):
                try:
                    # Start scraping and show results as they are found
                    for idx, product in enumerate(scrape_jarir(search_term)):
                        with product_container:
                            # Display each product in a card-like format
                            st.markdown(f"### {product['title']}")
                            st.markdown(f"**Store**: {product['store']}")
                            st.markdown(f"**Price**: {product['price']}")
                            st.markdown(f"**Info**: {product['info']}")
                            st.image(product['image_url'], width=150)
                            st.markdown(f"[Product Link]({product['link']})")
                            st.markdown("---")
                        
                        # Real-time update delay to simulate scraping progress
                        time.sleep(1)  # You can adjust this based on your scraping speed
                    
                    # Remove scraping progress message
                    placeholder.empty()

                except Exception as e:
                    # Error handling
                    st.error(f"An error occurred during scraping: {e}")

        else:
            st.error("Please enter a valid search term.")

if __name__ == "__main__":
    main()
