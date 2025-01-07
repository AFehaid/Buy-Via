import React from 'react';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import './Logo.css';

export default function Logo() {
  return (
    <button className="button">
      <span className="text">Buy Via</span>
      <span className="icon-container">
        <ShoppingCartIcon sx={{ fontSize: 40 }} className="shopping-cart-icon" />
      </span>
    </button>
  );
}