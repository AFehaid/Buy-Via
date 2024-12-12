import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const ProductDetails = () => {
    const { productId } = useParams(); // Get the product ID from the URL
    const [product, setProduct] = useState(null);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:8000/search/products/?product_id=${productId}`);
                setProduct(response.data);
            } catch (err) {
                console.error("Error fetching product:", err);
                setError("Failed to load product details. Please try again.");
            }
        };

        fetchProduct();
    }, [productId]);

    if (error) return <p>{error}</p>;

    if (!product) return <p>Loading...</p>;

    return (
        <div className="product-details">
            <h1>{product.name}</h1>
            <p>{product.description}</p>
            <p>Price: {product.price}</p>
            <img src={product.image_url} alt={product.name} />
        </div>
    );
};

export default ProductDetails;
