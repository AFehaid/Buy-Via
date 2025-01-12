import React, { useState, useRef, useEffect } from "react";
import ReactDOM from "react-dom";
import "./ProductAlert.css";
import { FaBell } from 'react-icons/fa';
const AlertPopup = ({ onClose, onSubmit, thresholdPrice, setThresholdPrice }) => {
  const popupRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const handleSubmit = (e) => {
    e.preventDefault();
    e.stopPropagation();
    onSubmit();
  };

  return ReactDOM.createPortal(
    <div className="alert-overlay" onClick={onClose}>
      <div 
        ref={popupRef}
        className="alert-popup"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="alert-title">Set Price Alert</h3>
        <form onSubmit={handleSubmit} className="alert-form">
          <div className="form-group">
            <label className="form-label">
              Threshold Price:
            </label>
            <input
              type="number"
              value={thresholdPrice}
              onChange={(e) => setThresholdPrice(e.target.value)}
              className="form-input"
              required
            />
          </div>
          <div className="button-container">
            <button type="submit" className="submit-button">
              Set Alert
            </button>
            <button
              type="button"
              onClick={onClose}
              className="cancel-button"
            >
              Close
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

const ProductAlert = () => {
  const [showPopup, setShowPopup] = useState(false);
  const [thresholdPrice, setThresholdPrice] = useState("");
  const containerRef = useRef(null);

  const handleAlertClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setShowPopup(true);
  };

  const handleSubmit = () => {
    alert(`Threshold price set to: ${thresholdPrice}`);
    setThresholdPrice("");
    setShowPopup(false);
  };

  return (
    <div ref={containerRef} className="product-alert-container">
      <button
        className="product-alert-button"
        onClick={handleAlertClick}
      >
        <FaBell size={20} color="#3b82f6" />

      </button>
      
      {showPopup && (
        <AlertPopup
          onClose={() => setShowPopup(false)}
          onSubmit={handleSubmit}
          thresholdPrice={thresholdPrice}
          setThresholdPrice={setThresholdPrice}
        />
      )}
    </div>
  );
};

export default ProductAlert;