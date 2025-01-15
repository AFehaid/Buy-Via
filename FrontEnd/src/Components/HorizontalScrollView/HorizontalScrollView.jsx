import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HorizontalScrollView.css";
import Jarir from "../../assets/Jarir.png";
import Extra from "../../assets/Extra.png";
import AMZN from "../../assets/AMZN.png";
import ProductAlert from "../ProductAlert/ProductAlert";

const requestQueue = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || requestQueue.length === 0) return;
  
  isProcessing = true;
  const nextRequest = requestQueue[0];
  
  try {
    const response = await fetch(nextRequest.url);
    const data = await response.json();
    nextRequest.resolve(data);
  } catch (error) {
    nextRequest.reject(error);
  } finally {
    requestQueue.shift();
    isProcessing = false;
    processQueue();
  }
};

const queueRequest = (url) => {
  return new Promise((resolve, reject) => {
    requestQueue.push({ url, resolve, reject });
    processQueue();
  });
};

const HorizontalScrollView = ({ prompt }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `http://localhost:8000/search?query=${encodeURIComponent(prompt)}&page=1&page_size=20&sort_by=relevance&min_price=1000&in_stock_only=true`;
        
        const data = await queueRequest(url);

        if (data && data.products) {
          setItems(data.products);
          setTotalResults(data.total_count);
        } else {
          setItems([]);
          setTotalResults(0);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
        setError(error.message);
        setItems([]);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };

    if (prompt) {
      fetchItems();
    }
  }, [prompt]);

  const handleShowMore = () => {
    navigate(`/search?query=${encodeURIComponent(prompt)}`);
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  const getStoreIcon = (store_id) => {
    const storeIcons = {
      1: AMZN,
      2: Jarir,
      3: Extra
    };
    return storeIcons[store_id] || null;
  };

  const calculateDiscount = (currentPrice, oldPrice) => {
    if (!currentPrice || !oldPrice || oldPrice <= currentPrice) return null;
    const discount = ((oldPrice - currentPrice) / oldPrice) * 100;
    return discount >= 4 ? discount : null;
  };

  const formatPrice = (item) => {
    if (item.price === null) {
      return <span className="available">Price not available</span>;
    }

    const discount = item.last_old_price 
      ? calculateDiscount(item.price, item.last_old_price)
      : null;

    return (
      <div className="price-content">
        <span className="current-price">{item.price.toFixed(2)} SAR</span>
        {discount && (
          <>
            <span className="old-price">{item.last_old_price.toFixed(2)} SAR</span>
            <span className="discount-badge">{discount.toFixed(0)}% OFF</span>
          </>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <div className="error-container">
        <p className="error-message">Failed to load products. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="horizontal-scroll-view">
      <div 
        className="prompt-container"
        onClick={handleShowMore}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h2 className={`prompt-text original ${isHovered ? 'hide' : 'show'}`}>
          {prompt}
        </h2>
        <h2 className={`prompt-text hover ${isHovered ? 'show' : 'hide'}`}>
          Show More
        </h2>
      </div>
      
      {loading ? (
        <div className="loading-container1">
          <div className="loading-spinner1">
            <div className="spinner-ring"></div>
            <p>Loading products...</p>
          </div>
        </div>
      ) : items.length > 0 ? (
        <div className="scroll-container">
          {items.map((item) => (
            <div 
              key={item.product_id} 
              className="item-card" 
              onClick={() => handleViewProduct(item.product_id)}
            >
              <div className="item-image-container">
                <img src={item.image_url} alt={item.title} loading="lazy" />
                <ProductAlert />
              </div>
              <h3>{item.title}</h3>
              <div className="item-footer">
                <div className="price-container">
                  {formatPrice(item)}
                </div>
                {item.store_id && (
                  <img 
                    className="store-icon" 
                    src={getStoreIcon(item.store_id)} 
                    alt="Store logo" 
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>No products found for "{prompt}"</p>
        </div>
      )}
    </div>
  );
};

export default HorizontalScrollView;