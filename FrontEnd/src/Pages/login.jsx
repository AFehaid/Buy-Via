import React, { useState } from "react";
import { useAuth } from "../Components/Navbar/AuthProvider";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import "../Pages/login.css";

const AuthModal = ({ mode, onClose }) => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
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
        const result = await login(formData.username, formData.password);
        if (result) {
          setSuccess(t('auth.loginSuccess'));
          onClose();
          window.location.reload();
        }
      } else if (activeForm === "signUp") {
        if (formData.password !== formData.confirmPassword) {
          setError(t('auth.passwordsMismatch'));
          return;
        }

        const response = await fetch("http://localhost:8000/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.username,
            email: formData.email,
            password: formData.password,
          }),
        });

        if (response.ok) {
          setSuccess(t('auth.registrationSuccess'));
          setActiveForm("signIn");
          setFormData({ username: "", email: "", password: "", confirmPassword: "" });
        } else {
          const errorData = await response.json();
          setError(errorData.detail || t('auth.registrationFailed'));
        }
      }
    } catch (err) {
      console.error("Error during login/registration:", err);
      setError(t('auth.generalError'));
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className={`auth-container ${isRTL ? 'rtl' : ''}`}>
        <button className="close-button" onClick={onClose}>×</button>
        <h2>{t('auth.welcome')}</h2>
        <p>{t('auth.subtitle')}</p>
        
        <div className="form-toggle">
          <button
            className={`toggle-button ${activeForm === "signIn" ? "active" : ""}`}
            onClick={() => setActiveForm("signIn")}
          >
            {t('auth.login')}
          </button>
          <button
            className={`toggle-button ${activeForm === "signUp" ? "active" : ""}`}
            onClick={() => setActiveForm("signUp")}
          >
            {t('auth.signup')}
          </button>
        </div>

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {activeForm === "signIn" && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder={t('auth.usernamePlaceholder')}
              value={formData.username}
              onChange={handleInputChange}
              required
              dir={isRTL ? "rtl" : "ltr"}
            />
            <input
              type="password"
              name="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={formData.password}
              onChange={handleInputChange}
              required
              dir={isRTL ? "rtl" : "ltr"}
            />
            <button type="submit" className="form-submit">
              {t('auth.login')}
            </button>
          </form>
        )}

        {activeForm === "signUp" && (
          <form className="auth-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="username"
              placeholder={t('auth.usernamePlaceholder')}
              value={formData.username}
              onChange={handleInputChange}
              required
              dir={isRTL ? "rtl" : "ltr"}
            />
            <input
              type="email"
              name="email"
              placeholder={t('auth.emailPlaceholder')}
              value={formData.email}
              onChange={handleInputChange}
              required
              dir={isRTL ? "rtl" : "ltr"}
            />
            <input
              type="password"
              name="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={formData.password}
              onChange={handleInputChange}
              required
              dir={isRTL ? "rtl" : "ltr"}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder={t('auth.confirmPasswordPlaceholder')}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              dir={isRTL ? "rtl" : "ltr"}
            />
            <button type="submit" className="form-submit">
              {t('auth.signup')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default AuthModal;