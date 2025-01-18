import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import '../HorizontalScrollView/HorizontalScrollView.css'
import Jarir from "../../assets/Jarir.png";
import Extra from "../../assets/Extra.png";
import AMZN from "../../assets/AMZN.png";
import { useAuth } from "../Navbar/AuthProvider";
import ProductAlert from "../ProductAlert/ProductAlert";

const UserRecommendations = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();

  useEffect(() => {
    const fetchUserRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `http://localhost:8000/search/recommendations`;
        const response = await fetch(url, {
          credentials: 'include', // Add this to send cookies
        });
        if (!response.ok) throw new Error('Failed to fetch recommendations');
        const data = await response.json();
        
        console.log("User Recommendations:", data);
    
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          setItems([]);
          setError("No recommendations found for this user.");
        }
      } catch (error) {
        console.error('Error fetching user recommendations:', error);
        setError(error.message);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUserRecommendations();
    } else {
      setError("You must be logged in to view recommendations.");
      setLoading(false);
    }
  }, [token]);

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
    if (!item.price) {
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
        <p className="error-message">{error}</p>
      </div>
    );
  }

  return (
    <div className="horizontal-scroll-view">
      <h2 className="related-products-title">Recommended for You</h2>
      {loading ? (
        <div className="loading-container1">
          <div className="loading-spinner1">
            <div className="spinner-ring"></div>
            <p>Loading recommendations...</p>
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
                <img 
                  src={item.image_url || "https://via.placeholder.com/150"} 
                  alt={item.title} 
                  loading="lazy" 
                />
                <ProductAlert/>
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
          <p>No recommendations found.</p>
        </div>
      )}
    </div>
  );
};

export default UserRecommendations;