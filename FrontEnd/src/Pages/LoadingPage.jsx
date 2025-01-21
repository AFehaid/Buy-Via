import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import './LoadingPage.css';

const LoadingPage = () => {
    const { t } = useLanguage();
    
    return (
        <div className="loading-overlay">
            <div className="loading-content">
                <Loader2 className="loading-spinner" />
                <p className="loading-text">{t('common.loading')}</p>
            </div>
        </div>
    );
};

export default LoadingPage;