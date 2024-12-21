import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import "./ProductDetails.css"
import Jarir from '../assets/Jarir.png'
import AMZN from '../assets/AMZN1.png'
import Extra from '../assets/Extra1.png'
const ProductDetails = () => {
    const { productId } = useParams(); // Get the product ID from the URL
    const [product, setProduct] = useState(null);
    const [error, setError] = useState("");

      const AJX = (store_id) => {
        switch(store_id){
          case(1):
          return AMZN
          case(2):
          return Jarir
          case(3):
          return Extra
          default:
          return null}
      }

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
    const example = "This product offers a great combination of quality and value, designed to meet your needs. Suitable for various applications, it ensures durability and performance. For more details, please refer to the specifications or contact the seller."
    return (

        <div className='container'>
            <div className="left-column">
            <img  src={product.image_url} alt=""/>

            </div>
 
 
            <div className="right-column">
 
                <div className="product-description">
                <span>Category</span>
                <h1>{product.title}</h1>
                <p>{product.info != null ? product.info : example}</p>
                </div>
        <div className='product-price-details'>
            <span className='product-price-span'>{product.price} SAR</span>

            <button 
                className='buy-button' 
                onClick={() => window.open(product.link, "_blank")}>
                <svg
                    width="36px"
                    height="36px"
                >
                <rect width="36" height="36" x="0" y="0" fillOpacity={0}></rect>
                <image 
                    width="36px"
                    height="36px"
                    href={AJX(product.store_id)}
                />
                </svg>
                <span class="via">Via</span>
                <span class="buy">Buy</span>
            </button>
        </div>
            </div>
    </div>
    );
};

export default ProductDetails;
