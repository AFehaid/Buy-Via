import React, { useState } from "react";
import axios from "axios";
import qs from "qs";
import { useAuth } from "../Components/Navbar/AuthProvider";
import { useNavigate } from "react-router-dom";
import "../Pages/login.css";

const AuthModal = ({ mode, onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState(mode); 
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (activeForm === "signIn") {
        await login(formData.username, formData.password);
        console.log("Login successful! Token stored in localStorage.");
        setSuccess("Logged in successfully!");
        onClose();
      } else if (activeForm === "signUp") {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const response = await axios.post("http://localhost:8000/auth/register", {
          username: formData.username,
          email: formData.email,
          password: formData.password,
        });

        if (response.status === 201) {
          console.log("Registration successful!");
          setSuccess("Account created successfully! Please sign in.");
          setActiveForm("signIn"); 
        }
      }
    } catch (err) {
      console.error("Error during login/registration:", err);
      setError(err.response?.data?.detail || "An error occurred. Please try again.");
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="auth-container">
        <button className="close-button" onClick={onClose}>×</button>
        <h2>Welcome to Buy Via</h2>
        <p>Your ultimate AI-driven price comparison platform</p>
        <div className="form-toggle">
          <button
            className={`toggle-button ${activeForm === "signIn" ? "active" : ""}`}
            onClick={() => setActiveForm("signIn")}
          >
            Sign In
          </button>
          <button
            className={`toggle-button ${activeForm === "signUp" ? "active" : ""}`}
            onClick={() => setActiveForm("signUp")}
          >
            Sign Up
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {activeForm === "signIn" && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <button type="submit" className="form-submit">Sign In</button>
          </form>
        )}

        {activeForm === "signUp" && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleInputChange}
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleInputChange}
              required
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
            />
            <button type="submit" className="form-submit">Sign Up</button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;