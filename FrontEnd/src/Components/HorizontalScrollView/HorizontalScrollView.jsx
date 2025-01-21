import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../../contexts/LanguageContext";
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

const HorizontalScrollView = ({ prompt, displayTitle }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  const { t, formatCurrency, isRTL } = useLanguage();

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const url = `http://localhost:8000/search/quick-search?query=${encodeURIComponent(prompt)}`;
        
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
        <p className="error-message">{t('common.errorLoading')}</p>
      </div>
    );
  }

  return (
    <div className={`horizontal-scroll-view ${isRTL ? 'rtl' : ''}`}>
      <div 
        className="prompt-container"
        onClick={handleShowMore}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <h2 className={`prompt-text original ${isHovered ? 'hide' : 'show'}`}>
          {displayTitle || prompt}
        </h2>
        <h2 className={`prompt-text hover ${isHovered ? 'show' : 'hide'}`}>
          {t('common.showMore')}
        </h2>
      </div>
      
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
                <img src={item.image_url} alt={item.title} loading="lazy" />
                <ProductAlert productId={item.product_id} currentPrice={item.price} />
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
                    alt={t('common.storeLogo')} 
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="no-results">
          <p>{t('search.noResults').replace('{query}', prompt)}</p>
        </div>
      )}
    </div>
  );
};

export default HorizontalScrollView;