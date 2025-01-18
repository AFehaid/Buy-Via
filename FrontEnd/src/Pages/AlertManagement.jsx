import React, { useState, useEffect } from 'react';
import { useAuth } from '../Components/Navbar/AuthProvider';
import { Grid, List, Bell } from 'lucide-react';
import AuthModal from './login.jsx';
import './AlertManagement.css';

const AlertManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingAlert, setEditingAlert] = useState(null);
  const [newThresholdPrice, setNewThresholdPrice] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [alertToDelete, setAlertToDelete] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  const { isLoggedIn, token } = useAuth();

  useEffect(() => {
    if (isLoggedIn) {
      fetchAlerts();
    } else {
      setLoading(false);
    }
  }, [isLoggedIn, token]);

  // Fetch product details
  const fetchProductDetails = async (productId) => {
    try {
      const response = await fetch(`http://localhost:8000/search/${productId}`);
      if (!response.ok) throw new Error('Failed to fetch product details');
      const data = await response.json();
      return data;
    } catch (err) {
      console.error('Error fetching product details:', err);
      return null;
    }
  };


  const fetchAlerts = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://localhost:8000/alerts/?user_id=9', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to fetch alerts');
      const alertsData = await response.json();
      
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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAlert = async (alertId) => {
    if (!token) {
      setShowAuthModal(true);
      return;
    }
    
    try {
      // Make sure we're sending a valid token
      const currentToken = localStorage.getItem("token");
      if (!currentToken) {
        setShowAuthModal(true);
        return;
      }
  
      const response = await fetch(`http://localhost:8000/alerts/${alertId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          threshold_price: parseFloat(newThresholdPrice)
        }),
        credentials: 'include' // Include credentials if your API uses cookies
      });
  
      if (response.status === 401) {
        // Token is invalid or expired
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

    // Handle successful login
    const handleLoginSuccess = () => {
      setShowAuthModal(false);
      fetchAlerts(); // Refresh alerts after login
    };

  // Delete alert handler
  const handleDeleteAlert = async (alertId) => {
    if (!token) return;
    
    try {
      const response = await fetch(`http://localhost:8000/alerts/${alertId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete alert');

      setAlerts(alerts.filter(alert => alert.alert_id !== alertId));
      setShowDeleteModal(false);
      setAlertToDelete(null);
    } catch (err) {
      setError(err.message);
    }
  };

  if (!isLoggedIn) {
    return null; // Or a loading state while redirecting
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">Error: {error}</div>
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

  const AlertCard = ({ alert }) => (
    <div className={`alert-management-card-${viewMode}`}>
      <div className={`alert-management-product-info-${viewMode}`}>
        <div className="alert-management-image-wrapper">
          {alert.productDetail?.image_url ? (
            <img 
              src={alert.productDetail.image_url} 
              alt={alert.productDetail.title}
              className="alert-management-product-image"
            />
          ) : (
            <div className="alert-management-placeholder">
              <Bell size={32} />
            </div>
          )}
        </div>
        <h3 className="alert-management-product-title">
          {alert.productDetail?.title || `Product #${alert.product_id}`}
        </h3>
      </div>
      
      <div className="alert-management-content">
        <div className="alert-management-price-section">
          <div className="alert-management-price-current">
            <label className="alert-management-price-label">Current Price</label>
            <span className="alert-management-price-value">
              {alert.productDetail?.current_price || 'N/A'} SAR
            </span>
          </div>
          
          <div className="alert-management-price-threshold">
            <label className="alert-management-price-label">Alert Price</label>
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
                onKeyDown={(e) => {
                    // Allow backspace, delete, arrow keys, and numbers
                    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab'];
                    if (!allowedKeys.includes(e.key) && !/^\d$/.test(e.key) && e.key !== '.') {
                    e.preventDefault();
                    }
                }}
                placeholder="New threshold"
                className="alert-management-input"
                autoFocus
                min="0"
                step="any"
                />
              </div>
            ) : (
              <span className="alert-management-price-value">
                {alert.threshold_price} SAR
              </span>
            )}
          </div>
        </div>
        
        <div className="alert-management-actions">
          {editingAlert === alert.alert_id ? (
            <>
              <button 
                className="alert-management-btn-save"
                onClick={() => handleUpdateAlert(alert.alert_id)}
              >
                Save
              </button>
              <button 
                className="alert-management-btn-cancel"
                onClick={() => {
                  setEditingAlert(null);
                  setNewThresholdPrice('');
                }}
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                className="alert-management-btn-edit"
                onClick={() => {
                  setEditingAlert(alert.alert_id);
                  setNewThresholdPrice(alert.threshold_price.toString());
                }}
              >
                Edit Alert
              </button>
              <button
                className="alert-management-btn-delete"
                onClick={() => {
                  setShowDeleteModal(true);
                  setAlertToDelete(alert.alert_id);
                }}
              >
                Remove Alert
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );


  return (
    <div className="alert-management-container">
      {showAuthModal && (
        <AuthModal 
          mode="signIn" 
          onClose={() => setShowAuthModal(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
      <div className="alert-management-header">
        <div className="alert-management-header-content">
          <h1 className="alert-management-title">My Price Alerts</h1>
          <ViewToggle />
        </div>
      </div>

      {alerts.length === 0 ? (
        <div className="alert-management-empty">
          <div className="alert-management-empty-icon">
            <Bell size={48} />
          </div>
          <p className="alert-management-empty-text">
            You don't have any price alerts set up yet.
          </p>
          <button 
            className="alert-management-btn-primary"
            onClick={() => navigate('/search')}
          >
            Browse Products
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
          <div className="alert-management-modal">
            <h2 className="alert-management-modal-title">Remove Price Alert</h2>
            <p className="alert-management-modal-text">
              Are you sure you want to remove this price alert? 
              You won't receive notifications for this product anymore.
            </p>
            <div className="alert-management-modal-actions">
              <button 
                className="alert-management-btn-cancel"
                onClick={() => {
                  setShowDeleteModal(false);
                  setAlertToDelete(null);
                }}
              >
                Cancel
              </button>
              <button 
                className="alert-management-btn-delete"
                onClick={() => handleDeleteAlert(alertToDelete)}
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertManagement;