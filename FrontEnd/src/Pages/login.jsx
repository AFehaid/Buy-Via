import React, { useState, useEffect } from "react";
import axios from "axios"; // Import Axios for API calls
import qs from 'qs';
import { useAuth } from "../Components/Navbar/AuthProvider";
import { useNavigate } from "react-router-dom";
import "../Pages/login.css";

const Login = ({ onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState("signIn");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      if (activeForm === "signIn") {
        const response = await axios.post(
          "http://localhost:8000/auth/token",
          qs.stringify({
            username: formData.username,
            password: formData.password,
          }),
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (response.status === 200) {
          const token = response.data.access_token; // Ensure the token is extracted correctly
          if (token) {
            setSuccess("Logged in successfully!");
            login(token); // Use the extracted token
            onClose(); // Close the modal after successful login
            navigate("/"); // Redirect to the home page
          } else {
            setError("Failed to retrieve token from response.");
          }
        }
      } else if (activeForm === "signUp") {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords do not match.");
          return;
        }

        const response = await axios.post(
          "http://localhost:8000/auth/register",
          {
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }
        );

        if (response.status === 201) {
          setSuccess("Account created successfully! Please sign in.");
          setActiveForm("signIn");
        }
      }
    } catch (err) {
      // Log error response for better understanding
      console.error("API error:", err.response?.data);
      setError(err.response?.data?.detail?.map(e => e.msg).join(", ") || "An error occurred. Please try again.");
      if (err.response) {
        // The request was made and the server responded with a status code
        setError(err.response.data.message || "An error occurred. Please try again.");
      } else if (err.request) {
        // The request was made but no response was received
        setError("No response from the server. Please check your connection.");
      } else {
        // Something happened in setting up the request
        setError("Error in request setup: " + err.message);
      }
    }
  };

  // Close the modal when clicking outside
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
              type="username"
              name="username"
              placeholder="Email"
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

export default Login;