import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Jarir from '../assets/Jarir.png';
import AMZN from '../assets/AMZN1.png';
import Extra from '../assets/Extra1.png';
import './ProductDetails.css';

const ProductDetails = () => {
    const { productId } = useParams();
    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const getStoreLogo = (storeId) => {
        switch(storeId) {
            case 1: return AMZN;
            case 2: return Jarir;
            case 3: return Extra;
            default: return null;
        }
    };

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                setLoading(true);
                // Update the endpoint URL to match the backend route
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
            <div className="loading-container">
                <Loader2 className="loading-spinner" />
            </div>
        );
    }

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    if (!product) return null;

    const defaultDescription = "This product offers a great combination of quality and value, designed to meet your needs. Suitable for various applications, it ensures durability and performance. For more details, please refer to the specifications or contact the seller.";

    return (
        <div className="container">
            <div className="left-column">
                <div className="product-image-container-details">
                    <img 
                        src={product.image_url} 
                        alt={product.title}
                        className="product-image-details"
                    />
                </div>
            </div>

            <div className="right-column">
                <div className="product-description">
                    <span>{product.category || 'Category'}</span>
                    <h1>{product.title}</h1>
                    <p>{product.info || defaultDescription}</p>
                </div>

                <div className={product.availability !== false ? 'product-price-details' : 'product-not-available1'}>
                    <p>
                        {product.price !== null && product.availability 
                            ? `${product.price.toFixed(2)} SAR` 
                            : "Product not available"
                        }
                    </p>

                    {product.availability && (
                        <button 
                            className="buy-button"
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
                            <span className="via">Via</span>
                            <span className="buy">Buy</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ProductDetails;