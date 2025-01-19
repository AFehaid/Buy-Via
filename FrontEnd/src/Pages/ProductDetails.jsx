import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import Jarir from '../assets/Jarir.png';
import AMZN from '../assets/AMZN1.png';
import Extra from '../assets/Extra1.png';
import './ProductDetails.css';
import RelatedProducts from '../Components/HorizontalScrollView/RelatedProducts';
import UserRecommendations from '../Components/HorizontalScrollView/UserRecommendations';

const ProductDetails = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const { t, isRTL, formatCurrency } = useLanguage();

    const getStoreLogo = (storeId) => {
        switch(storeId) {
            case 1: return AMZN;
            case 2: return Jarir;
            case 3: return Extra;
            default: return null;
        }
    };

    const calculateDiscount = (currentPrice, oldPrice) => {
        if (!currentPrice || !oldPrice || oldPrice <= currentPrice) return null;
        const discount = ((oldPrice - currentPrice) / oldPrice) * 100;
        return discount >= 4 ? discount : null;
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                const response = await fetch(`http://localhost:8000/search/${productId}`);
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

    if (loading) {
        return (
            <div className="loading-container-details">
                <Loader2 className="loading-spinner-details" />
                <p>{t('common.loading')}</p>
            </div>
        );
    }

    if (error) {
        return <div className="error-message-details">{t('common.error')}</div>;
    }

    if (!product) return null;

    const defaultDescription = t('product.defaultDescription');
    
    const discount = product.last_old_price 
        ? calculateDiscount(product.price, product.last_old_price)
        : null;

    return (
        <div className={`container-details ${isRTL ? 'rtl' : ''}`}>
            <div className="left-column-details">
                <div className="product-image-container-details">
                    <img 
                        src={product.image_url} 
                        alt={product.title}
                        className="product-image-details"
                        onError={(e) => { e.target.src = 'https://via.placeholder.com/400'; }}
                    />
                </div>
            </div>

            <div className="right-column-details">
                <div className="product-description-details">
                    <span className="product-category-details">
                        {product.category || t('common.category')}
                    </span>
                    <h1 className="product-title-details">{product.title}</h1>
                    <p className="product-info-details">
                        {product.info || defaultDescription}
                    </p>
                </div>

                <div className={product.availability !== false ? 'product-price-details' : 'product-not-available-details'}>
                    <div className="price-section-details">
                        {product.price !== null && product.availability ? (
                            <>
                                <p className="current-price-details">
                                    {formatCurrency(product.price)}
                                </p>
                                {discount && (
                                    <>
                                        <p className="old-price-details">
                                            {formatCurrency(product.last_old_price)}
                                        </p>
                                        <span className="discount-badge-details">
                                            {discount.toFixed(0)}% {t('common.off')}
                                        </span>
                                    </>
                                )}
                            </>
                        ) : (
                            <p>{t('product.notAvailable')}</p>
                        )}
                    </div>

                    {product.availability && (
                        <button 
                            className="buy-button-details"
                            onClick={() => window.open(product.link, "_blank")}
                        >
                            <svg width="36px" height="36px">
                                <rect width="36" height="36" x="0" y="0" fillOpacity={0}></rect>
                                <image 
                                    width="36px"
                                    height="36px"
                                    href={getStoreLogo(product.store_id)}
                                />
                            </svg>
                            <span className="via-details">{t('common.via')}</span>
                            <span className="buy-details">{t('product.buy')}</span>
                        </button>
                    )}
                </div>
            </div>
            <RelatedProducts category={product.category_id}/>
            <UserRecommendations />
        </div>
    );
};

export default ProductDetails;