import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
import '../HorizontalScrollView/HorizontalScrollView.css';
import Jarir from "../../assets/Jarir.png";
import Extra from "../../assets/Extra.png";
import AMZN from "../../assets/AMZN.png";
import { useAuth } from "../../contexts/AuthProvider";
import ProductAlert from "../ProductAlert/ProductAlert";
import { baseURL } from "../../api";

const UserRecommendations = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t, formatCurrency, isRTL } = useLanguage();

  useEffect(() => {
    const fetchUserRecommendations = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `${baseURL}/search/recommendations`;
        const response = await fetch(url, {
          credentials: 'include',
        });
        if (!response.ok) throw new Error(t('recommendations.fetchError'));
        const data = await response.json();
        
        console.log("User Recommendations:", data);
    
        if (Array.isArray(data) && data.length > 0) {
          setItems(data);
        } else {
          setItems([]);
          setError(t('recommendations.noRecommendations'));
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
      setError(t('recommendations.loginRequired'));
      setLoading(false);
    }
  }, [token, t]);

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
  const getDisplayTitle = (item) => {
    if (isRTL) {
      return item.arabic_title || item.title;
    }
    return item.title;
  };
  const calculateDiscount = (currentPrice, oldPrice) => {
    if (!currentPrice || !oldPrice || oldPrice <= currentPrice) return null;
    const discount = ((oldPrice - currentPrice) / oldPrice) * 100;
    return discount >= 4 ? discount : null;
  };

  const formatPrice = (item) => {
    if (!item.price) {
      return <span className="available">{t('common.priceNotAvailable')}</span>;
    }

    const discount = item.last_old_price 
      ? calculateDiscount(item.price, item.last_old_price)
      : null;

    return (
      <div className="price-content">
        <span className="current-price" dir={isRTL ? 'rtl' : 'ltr'}>
          {formatCurrency(item.price)}
        </span>
        {discount && (
          <>
            <span className="old-price" dir={isRTL ? 'rtl' : 'ltr'}>
              {formatCurrency(item.last_old_price)}
            </span>
            <span className="discount-badge">
              {discount.toFixed(0)}% {t('common.off')}
            </span>
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
    <div className={`horizontal-scroll-view ${isRTL ? 'rtl' : ''}`}>
      <h2 className="related-products-title">{t('recommendations.title')}</h2>
      {loading ? (
        <div className="loading-container1">
          <div className="loading-spinner1">
            <div className="spinner-ring"></div>
            <p>{t('common.loading')}</p>
          </div>
        </div>
      ) : items.length > 0 ? (
        <div className={`scroll-container ${isRTL ? 'rtl-scroll' : ''}`}>
          {items.map((item) => (
            <div 
              key={item.product_id}
              className="item-card" 
              onClick={() => handleViewProduct(item.product_id)}
            >
              <div className="item-image-container">
                <img 
                  src={item.image_url || "/api/placeholder/150/150"} 
                  alt={getDisplayTitle(item)} 
                  loading="lazy" 
                />
                <ProductAlert productId={item.product_id} currentPrice={item.price} />
              </div>
              <h3>{getDisplayTitle(item)}</h3>
              <div className="item-footer">
                <div className="price-container">
                  {formatPrice(item)}
                </div>
                {item.store_id && (
                  <img 
                    className="store-icon" 
                    src={getStoreIcon(item.store_id)} 
                    alt={t('common.storeLogo')} 
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>{t('recommendations.noResults')}</p>
        </div>
      )}
    </div>
  );
};

export default UserRecommendations;