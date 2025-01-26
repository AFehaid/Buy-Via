import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, Home, ArrowRight } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './ContactForm.css';

const ContactSuccess = () => {
    const { t, isRTL } = useLanguage();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className={`success-container ${isRTL ? 'rtl' : ''}`}>
            <div className="success-card">
                <div className="success-icon-wrapper">
                    <CheckCircle className="success-icon" />
                </div>
                <h1>{t('contact.messageSent')}</h1>
                <p>{t('contact.thankYou')}</p>
                <div className="success-actions">
                    <Link to="/" className="home-button">
                        <Home size={20} />
                        {t('contact.backHome')}
                    </Link>
                    <Link to="/products" className="browse-button">
                        {t('contact.browseProducts')}
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default ContactSuccess;