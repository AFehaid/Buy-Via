import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HorizontalScrollView.css";
import Jarir from "../../assets/Jarir.png";
import Extra from "../../assets/Extra.png";
import AMZN from "../../assets/AMZN.png";

const HorizontalScrollView = ({ prompt }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `http://localhost:8000/search?query=${encodeURIComponent(prompt)}&page=1&page_size=20`
        );
        
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        
        const data = await response.json();

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

  const formatPrice = (price) => {
    return price !== null 
      ? `${price.toFixed(2)} SAR`
      : <span className="available">Price not available</span>;
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
      <button className="button5" onClick={handleShowMore}>
        <span className="actual-text">
          &nbsp;{prompt.split(' ').map((word, i) => (
            <React.Fragment key={i}>
              {i > 0 && <b>&nbsp;</b>}{word}
            </React.Fragment>
          ))}&nbsp;
        </span>

      </button>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner">
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
              </div>
              <h3>{item.title}</h3>
              <div className="item-footer">
                <div className="price-container">
                  {formatPrice(item.price)}
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