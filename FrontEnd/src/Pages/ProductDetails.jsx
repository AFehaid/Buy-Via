import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, TrendingDown, Store, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { getCategoryById } from './categories';
import Extra from "../assets/Extra.png";
import AMZN from "../assets/AMZN.png";
import JarirBtn from '../assets/Jarir.png';
import AMZNBtn from '../assets/AMZN1.png';
import ExtraBtn from '../assets/Extra1.png';
import RelatedProducts from '../Components/HorizontalScrollView/RelatedProducts';
import UserRecommendations from '../Components/HorizontalScrollView/UserRecommendations';
import './ProductDetails.css';
import { useAuth } from '../contexts/AuthProvider';
import LoadingPage from './LoadingPage';
import ProductAlert from '../Components/ProductAlert/ProductAlert';

const ProductDetails = () => {
    const { isLoggedIn,token } = useAuth();
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { t, isRTL, formatCurrency, language } = useLanguage();
    const navigate = useNavigate();

    const getDisplayTitle = (product) => {
        if (!product) return '';
        
        if (language === 'ar') {
            return product.arabic_title || product.title || '';
        }
        return product.title || '';
    };


    const getStoreLogo = (storeId) => {
        const storeLogos = {
            1: AMZN,
            2: JarirBtn,
            3: Extra,
        };
        return storeLogos[storeId] || null;
    };
    const handleCategoryClick = (categoryId) => {
        navigate(`/category/${categoryId}`);
    };
    const getBuyButtonLogo = (storeId) => {
        const buyButtonLogos = {
            1: AMZNBtn,
            2: JarirBtn,
            3: ExtraBtn,
        };
        return buyButtonLogos[storeId] || null;
    };

    const formatLastUpdated = (timestamp) => {
        if (!timestamp) return '';
        
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return ''; // Invalid date
            
            return date.toLocaleDateString(language === 'ar' ? 'ar-US' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch (error) {
            console.error('Error formatting date:', error);
            return '';
        }
    };

    const calculateDiscount = (currentPrice, oldPrice) => {
        if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return null;
        const discount = ((oldPrice - currentPrice) / oldPrice) * 100;
        return discount >= 4 ? Math.round(discount) : null;
    };

    const safeFormatCurrency = (price) => {
        if (price === null || price === undefined || isNaN(price)) {
            return t('product.notAvailable');
        }
        return formatCurrency(price);
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8000/search/${productId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });
                if (!response.ok) throw new Error('Failed to fetch product');
                const data = await response.json();
                setProduct(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchProduct();
    }, [productId]);

    if (loading) return <LoadingPage/>
    if (error) return <div className="pd-error">{t('common.error')}</div>;

    if (!product) return null;

    const defaultDescription = t('product.defaultDescription');
    const categoryInfo = getCategoryById(product.category_id, language);

    const stores = product.price ? [
        {
            store_id: product.store_id,
            price: product.price,
            old_price: product.last_old_price || null,
            availability: product.availability !== undefined ? product.availability : true,
            link: product.link,
            isLowestPrice: true,
        },
        {
            store_id: 2,
            price: product.price * 1.1,
            availability: product.availability,
            link: product.link,
            isLowestPrice: false,
        },
        {
            store_id: 3,
            price: product.price * 1.2,
            availability: product.availability,
            link: product.link,
            isLowestPrice: false,
        }
    ] : [];

    return (
        <div className={`pd-wrapper ${isRTL ? 'rtl' : ''}`}>
            <div className="pd-container">
                <div className="pd-main-content">
                    <div className="pd-image-wrapper">
                        <img
                            src={product.image_url}
                            alt={getDisplayTitle(product)}
                            className="pd-image"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400'; }}
                        />
                    </div>

                    <div className="pd-product-info">
                        <span 
                            className="pd-category-tag" 
                            onClick={() => handleCategoryClick(product.category_id)}
                            style={{ cursor: 'pointer' }}
                        >
                            {categoryInfo ? `${categoryInfo.subcategory}` : t('common.category')}
                        </span>
                        <h1 className="pd-product-title">{getDisplayTitle(product)}</h1>

                        <div className="pd-info-header">
                            {product && product.price && (
                                <div className="pd-alert-button">
                                    <ProductAlert 
                                        productId={productId} 
                                        currentPrice={product.last_updated_price || product.price}
                                    />
                                </div>
                            )}
                            <div className="pd-timestamp">
                                <Clock className="pd-icon-small" />
                                <span>{t('product.lastUpdated')}: {formatLastUpdated(product.last_updated)}</span>
                            </div>
                        </div>

                        <p className="pd-description">
                            {product.info || defaultDescription}
                        </p>
                    </div>

                    <div className="pd-price-section">
                        <div className="pd-price-list-container">
                            <div className="pd-price-header">
                                <Store className="pd-icon" />
                                <h3 className="pd-section-title">{t('product.priceComparison')}</h3>
                        </div>

                            {stores.length > 0 ? (
                                <div className="pd-price-grid">
                                    {stores.map((store, index) => {
                                        const storeDiscount = calculateDiscount(store.price, store.old_price);
                                        const isOutOfStock = !store.availability;
                                        return (
                                            <div key={index} className={`pd-store-row ${!isOutOfStock && store.isLowestPrice ? 'pd-best-price' : ''}`}>
                                                <div className="pd-store-info">
                                                    <img
                                                        src={getStoreLogo(store.store_id)}
                                                        alt="Store logo"
                                                        className="pd-store-logo"
                                                    />
                                                    <div className="pd-store-details">
                                                        <div className="pd-store-badges">
                                                            {!isOutOfStock && store.isLowestPrice && (
                                                                <span className="pd-price-tag">
                                                                    <TrendingDown className="pd-icon-small" />
                                                                    {t('product.bestPrice')}
                                                                </span>
                                                            )}
                                                            {isOutOfStock && (
                                                                <span className="pd-out-of-stock-tag">
                                                                    {t('product.outOfStock')}
                                                                </span>
                                                            )}
                                                            {storeDiscount && !isOutOfStock && (
                                                                <span className="pd-store-discount">
                                                                    <TrendingDown className="pd-icon-small" />
                                                                    {storeDiscount}% {t('common.off')}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="pd-store-prices">
                                                            <span className={`pd-price-current ${isOutOfStock ? 'out-of-stock' : ''}`}>
                                                                {safeFormatCurrency(store.price)}
                                                            </span>
                                                            {store.old_price && !isOutOfStock && (
                                                                <span className="pd-price-old">
                                                                    {safeFormatCurrency(store.old_price)}
                                                                </span>
                                                            )}
                                                        </div>
                                                        {store.availability && store.price && (
                                                            <button
                                                                className="pd-btn-buy"
                                                                onClick={() => window.open(store.link, '_blank')}
                                                            >
                                                                <svg width="36" height="36">
                                                                    <rect width="36" height="36" x="0" y="0" fillOpacity="0"></rect>
                                                                    <image
                                                                        width="36"
                                                                        height="36"
                                                                        href={getBuyButtonLogo(store.store_id)}
                                                                    />
                                                                </svg>
                                                                <span className="pd-btn-via">{t('common.via')}</span>
                                                                <span className="pd-btn-text">{t('product.buy')}</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="pd-no-price">
                                    <p>{t('product.unavailable')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pd-additional-content">
                <RelatedProducts category={product.category_id} />
                {isLoggedIn && <UserRecommendations />}
                </div>
        </div>
    );
};

export default ProductDetails;