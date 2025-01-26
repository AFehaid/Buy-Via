import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, User, MessageCircle, Send } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './ContactForm.css';

const ContactForm = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { t, isRTL } = useLanguage();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        setTimeout(() => {
            navigate('/contact/success');
        }, 1000);
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className={`contact-wrapper ${isRTL ? 'rtl' : ''}`}>
            <div className="contact-container">
                <div className="contact-header">
                    <h1>{t('contact.getInTouch')}</h1>
                    <p>{t('contact.dropMessage')}</p>
                </div>
                
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <div className="input-icon">
                            <User className="icon" size={20} />
                            <input
                                type="text"
                                id="name"
                                name="name"
                                placeholder={t('contact.name')}
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-icon">
                            <Mail className="icon" size={20} />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder={t('contact.email')}
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <div className="input-icon">
                            <MessageCircle className="icon" size={20} />
                            <input
                                type="text"
                                id="subject"
                                name="subject"
                                placeholder={t('contact.subject')}
                                value={formData.subject}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <textarea
                            id="message"
                            name="message"
                            placeholder={t('contact.message')}
                            value={formData.message}
                            onChange={handleChange}
                            required
                            rows="5"
                        />
                    </div>

                    <button 
                        type="submit" 
                        className="submit-button"
                        disabled={loading}
                    >
                        <Send className="send-icon" size={20} />
                        {loading ? t('contact.sending') : t('contact.sendMessage')}
                    </button>
                </form>
            </div>
            
            <div className="contact-info">
                <div className="info-card">
                    <h3>{t('contact.contactInfo')}</h3>
                    <div className="info-item">
                        <Mail className="info-icon" />
                        <span>Email: support@pricepal.com</span>
                    </div>
                    <p className="response-time">
                        {t('contact.responseTime')}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ContactForm;