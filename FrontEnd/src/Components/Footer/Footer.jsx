import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import './Footer.css';

const Footer = () => {
    const { t, isRTL } = useLanguage();

    return (
        <footer className={`footer ${isRTL ? 'rtl' : ''}`}>
            <div className="footer-container">
                <div className="footer-section">
                    <h4>{t('footer.aboutUs')}</h4>
                    <p>{t('footer.aboutText')}</p>
                </div>
                <div className="footer-section">
                    <h4>{t('footer.quickLinks')}</h4>
                    <ul>
                        <li><a href="/">{t('navigation.home')}</a></li>
                        <li><a href="/deals">{t('navigation.deals')}</a></li>
                        <li><a href="/contact">{t('footer.contactUs')}</a></li>
                    </ul>
                </div>

                <div className="footer-section">
                    <h4>{t('footer.contactInfo')}</h4>
                    <p>{t('footer.email')}</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Buy Via. {t('footer.rights')}</p>
            </div>
        </footer>
    );
};

export default Footer;