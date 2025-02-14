import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthProvider.jsx';
import { useLanguage } from '../contexts/LanguageContext';
import { Grid, List, Bell } from 'lucide-react';
import AuthModal from './login.jsx';
import './AlertManagement.css';
import LoadingPage from './LoadingPage.jsx';
import { useNavigate } from "react-router-dom";
import { baseURL } from "../api";


const AlertManagement = () => {
  // Add language context
  const { t, isRTL, formatCurrency } = useLanguage();
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAlert, setEditingAlert] = useState(null);
  const [newThresholdPrice, setNewThresholdPrice] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState(null);
  const navigate = useNavigate()
  const [viewMode, setViewMode] = useState(() => {
    return window.innerWidth <= 768 ? 'list' : 'grid';
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { isLoggedIn, token } = useAuth();

  // Add event listener for window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth <= 768 && viewMode === 'grid') {
        setViewMode('list');
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [viewMode]);

  // Fetch product details
  const fetchProductDetails = async (productId) => {
    try {
      const response = await fetch(`${baseURL}/search/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product details');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching product details:', err);
      return null;
    }
  };
  const getDisplayTitle = (productDetail) => {
    if (!productDetail) {
      return t('alerts.product');
    }
    
    if (isRTL) {
      return productDetail.arabic_title || productDetail.title || t('alerts.product');
    }
    return productDetail.title || t('alerts.product');
  };
  const fetchAlerts = async () => {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        setLoading(false);
        return;
      }


      const userResponse = await fetch(`${baseURL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        credentials: 'include'
      });
      
      if (userResponse.status === 401) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }

      if (!userResponse.ok) throw new Error('Failed to fetch user details');
      const userData = await userResponse.json();
      const userId = userData.user.id;

      const alertsResponse = await fetch(`${baseURL}/alerts/?user_id=${userId}`, {
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        credentials: 'include'
      });
      
      if (alertsResponse.status === 401) {
        setShowAuthModal(true);
        setLoading(false);
        return;
      }

      if (!alertsResponse.ok) throw new Error('Failed to fetch alerts');
      const alertsData = await alertsResponse.json();
      
      const alertsWithProducts = await Promise.all(
        alertsData.map(async (alert) => {
          const productDetail = await fetchProductDetails(alert.product_id);
          return {
            ...alert,
            productDetail
          };
        })
      );
      
      setAlerts(alertsWithProducts);
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoggedIn) {
      fetchAlerts();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  const handleUpdateAlert = async (alertId) => {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        setShowAuthModal(true);
        return;
      }
  
      const response = await fetch(`${baseURL}/alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          threshold_price: parseFloat(newThresholdPrice)
        }),
        credentials: 'include' 
      });
  
      if (response.status === 401) {
        setShowAuthModal(true);
        return;
      }
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update alert');
      }
  
      const updatedAlert = await response.json();
      setAlerts(alerts.map(alert => 
        alert.alert_id === alertId ? { ...alert, ...updatedAlert } : alert
      ));
      setEditingAlert(null);
      setNewThresholdPrice('');
    } catch (err) {
      console.error('Error updating alert:', err);
      setError(err.message);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        setShowAuthModal(true);
        return;
      }

      const response = await fetch(`${baseURL}/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${currentToken}`
        },
        credentials: 'include'
      });

      if (response.status === 401) {
        setShowAuthModal(true);
        return;
      }

      if (!response.ok) throw new Error('Failed to delete alert');

      setAlerts(alerts.filter(alert => alert.alert_id !== alertId));
      setShowDeleteModal(false);
      setAlertToDelete(null);
    } catch (err) {
      console.error('Error deleting alert:', err);
      setError(err.message);
    }
  };

    if (loading) {
    return <LoadingPage/>
  }

  if (!isLoggedIn) {
    return (
      <div className={`alert-management-container ${isRTL ? 'rtl' : ''}`}>
        <div className="alert-management-empty">
          <div className="alert-management-empty-icon">
            <Bell size={48} />
          </div>
          <h2 className="alert-management-title">{t('alerts.title')}</h2>
          <p className="alert-management-empty-text">
            {t('alerts.signInRequired')}
          </p>
          <button 
            className="alert-management-btn-primary"
            onClick={() => setShowAuthModal(true)}
          >
            {t('auth.login')}
          </button>
        </div>
        {showAuthModal && (
          <AuthModal 
            mode="signIn" 
            onClose={() => setShowAuthModal(false)}
            onLoginSuccess={() => {
              setShowAuthModal(false);
              fetchAlerts();
            }}
          />
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{t('common.error')}: {error}</div>
      </div>
    );
  }

  const ViewToggle = () => (
    <div className="alert-management-view-toggle">
      <button 
        className={`alert-management-view-btn ${viewMode === 'list' ? 'active' : ''}`}
        onClick={() => setViewMode('list')}
      >
        <List size={20} />
      </button>
      <button 
        className={`alert-management-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
        onClick={() => setViewMode('grid')}
      >
        <Grid size={20} />
      </button>
    </div>
  );

  const AlertCard = ({ alert }) => {
    const handleCardClick = (e) => {
      if (e.target.closest('.alert-management-actions') || 
          e.target.closest('.alert-management-price-edit')) {
        return;
      }
      navigate('/');
    };
  
    return (
      <div 
        className={`alert-management-card-${viewMode}`} 
        onClick={handleCardClick}
      >
        <div className={`alert-management-product-info-${viewMode}`}>
          <div className="alert-management-image-wrapper">
            {alert.productDetail?.image_url ? (
              <img 
                src={alert.productDetail.image_url} 
                alt={getDisplayTitle(alert.productDetail)}
                className="alert-management-product-image"
              />
            ) : (
              <div className="alert-management-placeholder">
                <Bell size={32} />
              </div>
            )}
          </div>
          <h3 className="alert-management-product-title">
            {getDisplayTitle(alert.productDetail)}
          </h3>
        </div>
        
        <div className="alert-management-content">
          <div className="alert-management-price-section">
            <div className="alert-management-price-current">
              <label className="alert-management-price-label">{t('alerts.currentPrice')}</label>
              <span className="alert-management-price-value">
                {formatCurrency(alert.productDetail?.price || 0)}
              </span>
            </div>
            
            <div className="alert-management-price-threshold">
              <label className="alert-management-price-label">{t('alerts.alertPrice')}</label>
              {editingAlert === alert.alert_id ? (
                <div className="alert-management-price-edit">
                  <input
                    key={`price-input-${alert.alert_id}`}
                    type="number"
                    value={newThresholdPrice}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || (!isNaN(value) && parseFloat(value) >= 0)) {
                        setNewThresholdPrice(value);
                      }
                    }}
                    className="alert-management-input"
                    autoFocus
                    min="0"
                    step="any"
                    dir="ltr"
                    placeholder={t('alerts.newThreshold')}
                  />
                </div>
              ) : (
                <span className="alert-management-price-value">
                  {formatCurrency(alert.threshold_price)}
                </span>
              )}
            </div>
          </div>
          
          <div className="alert-management-actions">
            {editingAlert === alert.alert_id ? (
              <>
                <button 
                  className="alert-management-btn-save"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleUpdateAlert(alert.alert_id);
                  }}
                >
                  {t('common.save')}
                </button>
                <button 
                  className="alert-management-btn-cancel"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAlert(null);
                    setNewThresholdPrice('');
                  }}
                >
                  {t('common.cancel')}
                </button>
              </>
            ) : (
              <>
                <button
                  className="alert-management-btn-edit"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditingAlert(alert.alert_id);
                    setNewThresholdPrice(alert.threshold_price.toString());
                  }}
                >
                  {t('alerts.editAlert')}
                </button>
                <button
                  className="alert-management-btn-delete"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteModal(true);
                    setAlertToDelete(alert.alert_id);
                  }}
                >
                  {t('alerts.removeAlert')}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`alert-management-container ${isRTL ? 'rtl' : ''}`}>
      <div className="alert-management-header">
        <div className="alert-management-header-content">
          <h1 className="alert-management-title">{t('alerts.myAlerts')}</h1>
          <ViewToggle />
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="alert-management-empty">
          <div className="alert-management-empty-icon">
            <Bell size={48} />
          </div>
          <p className="alert-management-empty-text">
            {t('alerts.noAlerts')}
          </p>
          <button 
            className="alert-management-btn-primary"
            onClick={() => navigate('/')}
          >
            {t('alerts.browseProducts')}
          </button>
        </div>
      ) : (
        <div className={`alert-management-container-${viewMode}`}>
          {alerts.map((alert) => (
            <AlertCard key={alert.alert_id} alert={alert} />
          ))}
        </div>
      )}

      {showDeleteModal && (
        <div className="alert-management-modal-overlay">
          <div className={`alert-management-modal ${isRTL ? 'rtl' : ''}`}>
            <h2 className="alert-management-modal-title">{t('alerts.removeAlertTitle')}</h2>
            <p className="alert-management-modal-text">
              {t('alerts.removeAlertConfirm')}
            </p>
            <div className="alert-management-modal-actions">
              <button 
                className="alert-management-btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAlertToDelete(null);
                }}
              >
                {t('common.cancel')}
              </button>
              <button 
                className="alert-management-btn-delete"
                onClick={() => handleDeleteAlert(alertToDelete)}
              >
                {t('alerts.remove')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManagement;