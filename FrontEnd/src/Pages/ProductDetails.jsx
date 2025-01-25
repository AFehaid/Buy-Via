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
    const { isLoggedIn, token } = useAuth();
    const { productId } = useParams();
    const [displayProduct, setDisplayProduct] = useState(null);
    const [otherStoreProducts, setOtherStoreProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { t, isRTL, formatCurrency, language } = useLanguage();
    const navigate = useNavigate();

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const productRes = await fetch(`http://localhost:8000/search/${productId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    credentials: 'include'
                });

                if (!productRes.ok) throw new Error('Failed to fetch product');
                const productData = await productRes.json();
                setDisplayProduct(productData);

                const initialStores = [{
                    product_id: productData.product_id,
                    store_id: productData.store_id,
                    price: productData.price,
                    last_old_price: productData.last_old_price,
                    availability: productData.availability,
                    link: productData.link,
                    title: productData.title,
                    arabic_title: productData.arabic_title,
                    image_url: productData.image_url,
                    info: productData.info,
                    category_id: productData.category_id,
                    last_updated: productData.last_updated
                }];

                try {
                    const comparisonRes = await fetch(`http://localhost:8000/search/price-comparison/${productId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        credentials: 'include'
                    });

                    if (comparisonRes.ok) {
                        const comparisonData = await comparisonRes.json();
                        // Filter out any duplicates of the current product
                        const uniqueComparisonData = comparisonData.filter(
                            store => store.product_id !== productData.product_id
                        );
                        setOtherStoreProducts([...initialStores, ...uniqueComparisonData]);
                    } else {
                        setOtherStoreProducts(initialStores);
                    }
                } catch (err) {
                    setOtherStoreProducts(initialStores);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [productId, token]);

    const getDisplayTitle = product => language === 'ar' ? product?.arabic_title || product?.title || '' : product?.title || '';
    const getStoreLogo = storeId => ({ 1: AMZN, 2: JarirBtn, 3: Extra }[storeId] || null);
    const getBuyButtonLogo = storeId => ({ 1: AMZNBtn, 2: JarirBtn, 3: ExtraBtn }[storeId] || null);
    const handleCategoryClick = categoryId => navigate(`/category/${categoryId}`);

    const formatLastUpdated = timestamp => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) return '';
            return date.toLocaleDateString(language === 'ar' ? 'ar-US' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });
        } catch {
            return '';
        }
    };

    const calculateDiscount = (currentPrice, oldPrice) => {
        if (!oldPrice || !currentPrice || oldPrice <= currentPrice) return null;
        const discount = ((oldPrice - currentPrice) / oldPrice) * 100;
        return discount >= 4 ? Math.round(discount) : null;
    };

    const safeFormatCurrency = price => {
        if (price === null || price === undefined || isNaN(price)) return t('product.notAvailable');
        return formatCurrency(price);
    };

    if (loading) return <LoadingPage/>;
    if (error) return <div className="pd-error">{t('common.error')}</div>;
    if (!displayProduct) return null;

    const categoryInfo = getCategoryById(displayProduct.category_id, language);

    const renderStoreRows = () => {
        if (otherStoreProducts.length === 0) return null;

        const sortedStores = [...otherStoreProducts].sort((a, b) => a.price - b.price);
    
        return sortedStores.map(store => {
            const storeDiscount = calculateDiscount(store.price, store.last_old_price);
            const isOutOfStock = !store.availability;
            const isCurrentProduct = store.product_id === displayProduct.product_id;
            const isBestPrice = store.price === sortedStores[0].price;
            
            return (
                <div 
                    key={store.product_id} 
                    className={`pd-store-row ${!isOutOfStock && isBestPrice ? 'pd-best-price' : ''} ${isCurrentProduct ? 'pd-current-product' : ''}`}
                    onClick={() => {
                        if (!isCurrentProduct) {
                            setDisplayProduct(store);
                            scrollToTop();
                        }
                    }}
                    style={{ cursor: !isCurrentProduct ? 'pointer' : 'default' }}
                >
                    <div className="pd-store-info">
                        <img
                            src={getStoreLogo(store.store_id)}
                            alt="Store logo"
                            className="pd-store-logo"
                        />
                        <div className="pd-store-details">
                            <div className="pd-store-badges">
                                {!isOutOfStock && isBestPrice && (
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
                                {store.last_old_price && !isOutOfStock && (
                                    <span className="pd-price-old">
                                        {safeFormatCurrency(store.last_old_price)}
                                    </span>
                                )}
                            </div>
                            {store.availability && store.price && (
                                <button
                                    className="pd-btn-buy"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(store.link, '_blank');
                                    }}
                                >
                                    <svg width="36" height="36">
                                        <rect width="36" height="36" x="0" y="0" fillOpacity="0" />
                                        <image width="36" height="36" href={getBuyButtonLogo(store.store_id)} />
                                    </svg>
                                    <span className="pd-btn-via">{t('common.via')}</span>
                                    <span className="pd-btn-text">{t('product.buy')}</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            );
        });
    };

    return (
        <div className={`pd-wrapper ${isRTL ? 'rtl' : ''}`}>
            <div className="pd-container">
                <div className="pd-main-content">
                    <div className="pd-image-wrapper">
                        <img
                            src={displayProduct.image_url}
                            alt={getDisplayTitle(displayProduct)}
                            className="pd-image"
                            onError={(e) => { e.target.src = 'https://via.placeholder.com/400'; }}
                        />
                    </div>

                    <div className="pd-product-info">
                        <span 
                            className="pd-category-tag" 
                            onClick={() => handleCategoryClick(displayProduct.category_id)}
                            style={{ cursor: 'pointer' }}
                        >
                            {categoryInfo?.subcategory || t('common.category')}
                        </span>
                        <h1 className="pd-product-title">{getDisplayTitle(displayProduct)}</h1>

                        <div className="pd-info-header">
                            {displayProduct.price && (
                                <div className="pd-alert-button">
                                    <ProductAlert 
                                        productId={displayProduct.product_id}
                                        currentPrice={displayProduct.price}
                                    />
                                </div>
                            )}
                            <div className="pd-timestamp">
                                <Clock className="pd-icon-small" />
                                <span>{t('product.lastUpdated')}: {formatLastUpdated(displayProduct.last_updated)}</span>
                            </div>
                        </div>

                        <p className="pd-description">
                            {displayProduct.info || t('product.defaultDescription')}
                        </p>
                    </div>

                    <div className="pd-price-section">
                        <div className="pd-price-list-container">
                            <div className="pd-price-header">
                                <Store className="pd-icon" />
                                <h3 className="pd-section-title">
                                    {otherStoreProducts.length > 1 ? t('product.priceComparison') : t('product.store')}
                                </h3>
                            </div>
                            <div className="pd-price-grid">
                                {renderStoreRows()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="pd-additional-content">
                <RelatedProducts category={displayProduct.category_id} />
                {isLoggedIn && <UserRecommendations />}
            </div>
        </div>
    );
};

export default ProductDetails;