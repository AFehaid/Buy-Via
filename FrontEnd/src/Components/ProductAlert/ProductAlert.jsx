import React, { useState, useRef } from "react";
import ReactDOM from "react-dom";
import { FaBell, FaCheck } from 'react-icons/fa';
import { useAuth } from '../Navbar/AuthProvider';
import { useLanguage } from '../../contexts/LanguageContext';
import AuthModal from '../../Pages/login';
import "./ProductAlert.css";
import { useAlertRefresh } from "../../contexts/AlertContext";

const PriceAlertSuccess = ({ message, isRTL }) => (
  <div className={`pa-success-toast ${isRTL ? 'pa-rtl' : ''}`}>
    <FaCheck className="pa-success-icon" />
    <span>{message}</span>
  </div>
);

const PriceAlertPopup = ({ onClose, onSubmit, thresholdPrice, setThresholdPrice, existingAlert, t, isRTL }) => {
  const popupRef = useRef(null);

  return ReactDOM.createPortal(
    <div className="pa-modal-overlay" onClick={onClose}>
      <div 
        ref={popupRef}
        className={`pa-modal ${isRTL ? 'pa-rtl' : ''} ${existingAlert ? 'pa-delete-mode' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="pa-modal-title">
          {existingAlert ? t('alerts.removeAlert') : t('alerts.setAlert')}
        </h3>
        {existingAlert ? (
          <div className="pa-delete-content">
            <p className="pa-delete-text">{t('alerts.removeAlertConfirm')}</p>
            <div className="pa-button-group">
              <button 
                onClick={() => onSubmit(true)} 
                className="pa-delete-btn"
              >
                {t('alerts.remove')}
              </button>
              <button
                onClick={onClose}
                className="pa-cancel-btn"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={(e) => {
            e.preventDefault();
            onSubmit(false);
          }} className="pa-form">
            <div className="pa-input-group">
              <label className="pa-label">
                {t('alerts.thresholdPrice')}:
              </label>
              <input
                type="number"
                value={thresholdPrice}
                onChange={(e) => setThresholdPrice(e.target.value)}
                className="pa-input"
                required
                min="0"
                step="any"
                dir="ltr"
              />
            </div>
            <div className="pa-button-group">
              <button type="submit" className="pa-submit-btn">
                {t('alerts.setAlert')}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="pa-cancel-btn"
              >
                {t('common.cancel')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
};

const ProductAlert = ({ productId, currentPrice }) => {
  const { refreshAlerts } = useAlertRefresh();
  const [showPopup, setShowPopup] = useState(false);
  const [thresholdPrice, setThresholdPrice] = useState(currentPrice || "");
  const [existingAlert, setExistingAlert] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef(null);
  const { isLoggedIn, token } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { t, isRTL } = useLanguage();

  const checkExistingAlert = async () => {
    if (!isLoggedIn || !token || isLoading) return;

    setIsLoading(true);
    try {
      const userResponse = await fetch('http://localhost:8000/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });
      
      if (!userResponse.ok) {
        if (userResponse.status === 401) {
          setShowLoginModal(true);
          return;
        }
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await userResponse.json();
      const userId = userData.user.id;

      const alertsResponse = await fetch(`http://localhost:8000/alerts/?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        credentials: 'include'
      });

      if (!alertsResponse.ok) {
        throw new Error('Failed to fetch alerts');
      }

      const alerts = await alertsResponse.json();
      const existing = alerts.find(alert => alert.product_id === productId);
      setExistingAlert(existing);
      setShowPopup(true);
    } catch (error) {
      console.error('Error checking existing alert:', error);
      // Optionally show error message to user
    } finally {
      setIsLoading(false);
    }
  };

  const handleAlertClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isLoggedIn) {
      setShowLoginModal(true);
      return;
    }

    await checkExistingAlert();
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleSubmit = async (isRemove) => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      if (isRemove && existingAlert) {
        const response = await fetch(`http://localhost:8000/alerts/${existingAlert.alert_id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          credentials: 'include'
        });

        if (response.ok) {
          setExistingAlert(null);
          showSuccessMessage(t('alerts.removeSuccess'));
          refreshAlerts(); // Refresh navbar alerts
        } else if (response.status === 401) {
          setShowLoginModal(true);
          return;
        }
      } else {
        // Ensure productId is a number and threshold_price is a positive number
        const alertData = {
          product_id: parseInt(productId, 10),
          threshold_price: Math.max(0.01, parseFloat(thresholdPrice))
        };

        // Validate data before sending
        if (isNaN(alertData.product_id) || isNaN(alertData.threshold_price)) {
          throw new Error('Invalid product ID or threshold price');
        }

        const response = await fetch('http://localhost:8000/alerts/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(alertData),
          credentials: 'include'
        });

        if (response.status === 422) {
          const errorData = await response.json();
          throw new Error(errorData.detail || 'Invalid input data');
        }

        if (response.ok) {
          const data = await response.json();
          setExistingAlert(data);
          showSuccessMessage(t('alerts.alertCreated'));
          refreshAlerts(); // Refresh navbar alerts
        } else if (response.status === 401) {
          setShowLoginModal(true);
          return;
        }
      }
    } catch (error) {
      console.error('Error handling alert:', error);
      showSuccessMessage(error.message || t('alerts.error'));
    } finally {
      setIsLoading(false);
      setShowPopup(false);
      setThresholdPrice("");
    }
  };

  return (
    <>
      <div ref={containerRef} className="pa-container">
        <button
          className={`pa-button ${existingAlert ? 'pa-active' : ''} ${isLoading ? 'pa-loading' : ''}`}
          onClick={handleAlertClick}
          disabled={isLoading}
        >
          <FaBell size={20} color={existingAlert ? "#ef4444" : "#3b82f6"} />
          {isLoading && <span className="pa-spinner" />}
        </button>
        
        {showPopup && isLoggedIn && (
          <PriceAlertPopup
            onClose={() => setShowPopup(false)}
            onSubmit={handleSubmit}
            thresholdPrice={thresholdPrice}
            setThresholdPrice={setThresholdPrice}
            existingAlert={existingAlert}
            t={t}
            isRTL={isRTL}
          />
        )}

        {showSuccess && ReactDOM.createPortal(
          <PriceAlertSuccess message={successMessage} isRTL={isRTL} />,
          document.body
        )}
      </div>

      {showLoginModal && ReactDOM.createPortal(
        <div className="pa-auth-overlay">
          <div onClick={(e) => e.stopPropagation()}>
            <AuthModal 
              mode="signIn" 
              onClose={() => setShowLoginModal(false)}
              onLoginSuccess={() => {
                setShowLoginModal(false);
                checkExistingAlert();
              }}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ProductAlert;