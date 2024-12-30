import React, { useState, useEffect, useRef } from 'react';
import './SearchResults.css';
import AMZN from '../assets/AMZN.png';
import Jarir from '../assets/Jarir.png';
import Extra from '../assets/Extra.png';
import { useLocation } from 'react-router-dom';

const SearchResults = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('query') || '';
    const [results, setResults] = useState([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [priceRange, setPriceRange] = useState([0, 1000]);
    const [selectedBrands, setSelectedBrands] = useState([]);
    const [sortBy, setSortBy] = useState('relevance');

    const observer = useRef();
    const lastProductRef = useRef();
    const pageSize = 10;
    const sar = ' SAR';


    const getQueryFromUrl = () => {
        const params = new URLSearchParams(window.location.search);
        return params.get('query') || '';
    };

    const getStoreIcon = (store_id) => {
        switch(store_id) {
            case 1:
                return AMZN;
            case 2:
                return Jarir;
            case 3:
                return Extra;
            default:
                return null;
        }
    };

    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [location.search]);
    
    useEffect(() => {
        const fetchResults = async () => {
            try {
                setLoading(true);
                const response = await fetch(
                    `http://localhost:8000/search?query=${query}&page=${page}&page_size=${pageSize}`
                );
                const data = await response.json();

                if (data && data.products) {
                    setResults(prev => {
                        const newResults = [...prev, ...data.products];
                        const unique = Array.from(new Map(newResults.map(item => 
                            [item.product_id, item])).values());
                        return unique;
                    });
                    setTotalResults(data.total_count);
                    setHasMore(data.products.length === pageSize);
                }
            } catch (error) {
                console.error('Error fetching search results:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchResults();
    }, [query, page]);

    useEffect(() => {
        if (!hasMore || loading) return;

        const options = {
            root: null,
            rootMargin: '20px',
            threshold: 0.1
        };

        const handleObserver = (entries) => {
            const [target] = entries;
            if (target.isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        };

        const currentObserver = new IntersectionObserver(handleObserver, options);
        if (lastProductRef.current) {
            currentObserver.observe(lastProductRef.current);
        }

        return () => {
            if (lastProductRef.current) {
                currentObserver.unobserve(lastProductRef.current);
            }
        };
    }, [hasMore, loading]);

    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    const handlePriceChange = (e, index) => {
        const newRange = [...priceRange];
        newRange[index] = Number(e.target.value);
        setPriceRange(newRange);
    };

    const handleBrandChange = (brand) => {
        setSelectedBrands(prev => {
            if (prev.includes(brand)) {
                return prev.filter(b => b !== brand);
            }
            return [...prev, brand];
        });
    };

    const handleProductClick = (productId) => {
        window.location.href = `/product/${productId}`;
    };

    return (
        <div className="search-container">
            {/* Filters Sidebar */}
            <div className="filters-sidebar">
                <div className="filter-section">
                    <h3>Sort By</h3>
                    <select 
                        value={sortBy}
                        onChange={handleSortChange}
                        className="sort-select"
                    >
                        <option value="relevance">Relevance</option>
                        <option value="price-low">Price: Low to High</option>
                        <option value="price-high">Price: High to Low</option>
                        <option value="newest">Newest First</option>
                    </select>
                </div>

                <div className="filter-section">
                    <h3>Price Range</h3>
                    <div className="price-range">
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            value={priceRange[0]}
                            onChange={(e) => handlePriceChange(e, 0)}
                        />
                        <input
                            type="range"
                            min="0"
                            max="1000"
                            value={priceRange[1]}
                            onChange={(e) => handlePriceChange(e, 1)}
                        />
                        <div className="price-labels">
                            <span>${priceRange[0]}</span>
                            <span>${priceRange[1]}</span>
                        </div>
                    </div>
                </div>

                <div className="filter-section">
                    <h3>Brands</h3>
                    <div className="brand-list">
                        {['Apple', 'Samsung', 'huawei', 'LG'].map(brand => (
                            <label key={brand} className="brand-item">
                                <input
                                    type="checkbox"
                                    checked={selectedBrands.includes(brand)}
                                    onChange={() => handleBrandChange(brand)}
                                />
                                <span>{brand}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                <h1>Search Results for "{query}"</h1>
                <p className="results-count">
                    {totalResults > 0 ? `Showing ${results.length} of ${totalResults} results` : 'No results found'}
                </p>

                <div className="product-grid">

                    
                    {results.map((result, index) => {
                        const isAvailable = result.availability && result.price !== null;
                        const priceClasses = isAvailable 
                            ? 'product-price available' 
                            : result.price !== null 
                                ? 'product-price unavailable' 
                                : 'price-not-available';
                        
                        const productCard = (
                            <div 
                                key={result.product_id}
                                className="product-card"
                                onClick={() => handleProductClick(result.product_id)}
                            >
                                <div className="product-image-container">
                                    <img 
                                        src={result.image_url} 
                                        alt={result.title}
                                        className="product-image"
                                    />
                                </div>
                                <h3 className="product-title">{result.title}</h3>
                                <div className="product-info">
                                    <div className="price-availability">
                                        <p className={priceClasses}>
                                            {result.price !== null 
                                                ? `${result.price.toFixed(2)}${sar}` 
                                                : "Price not available"}
                                        </p>
                                        {!isAvailable && result.price !== null && (
                                            <span className="availability-status">Out of Stock</span>
                                        )}
                                    </div>
                                    {result.store_id && (
                                        <img 
                                            src={getStoreIcon(result.store_id)} 
                                            alt="Store" 
                                            className="store-icon"
                                        />
                                    )}
                                </div>
                            </div>
                        );

                        if (results.length === index + 1) {
                            return <div ref={lastProductRef} key={result.product_id}>{productCard}</div>;
                        }
                        return productCard;
                    })}
                </div>

                {loading && (
                    <div className="loading-spinner">
                        <div className="spinner"></div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResults;