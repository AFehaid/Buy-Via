import React, { useState, useEffect, useRef, useCallback } from 'react';
import Slider from '@mui/material/Slider';
import './SearchResults.css';
import AMZN from '../assets/AMZN.png';
import Jarir from '../assets/Jarir.png';
import Extra from '../assets/Extra.png';
import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';

function valuetext(value) {
    return `${value} SAR`;
}

const minDistance = 200;

const SearchResults = () => {
    const location = useLocation();
    const query = new URLSearchParams(location.search).get('query') || '';
    const [results, setResults] = useState([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedStore, setSelectedStore] = useState('all');
    const [sortBy, setSortBy] = useState('relevance');
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const observer = useRef();
    const lastProductRef = useRef();
    const pageSize = 10;
    const sar = ' SAR';
    const [showScrollTop, setShowScrollTop] = useState(false);

    const stores = [
        { id: 'all', name: 'All Stores' },
        { id: '1', name: 'Amazon' },
        { id: '2', name: 'Jarir' },
        { id: '3', name: 'Extra' }
    ];
    const formatPriceLabel = (value) => {
        if (value >= 5000) {
            return '5000+';
        }
        return `${value}`;
    };
    // Reset pagination when filters change
    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [query, sortBy, selectedStore, priceRange[0], priceRange[1]]);

    // Fetch results with debounced price range
    const fetchResults = useCallback(async () => {
        if (!query) return;
        
        try {
            setLoading(true);
            let url;
            const maxPrice = priceRange[1] === 5000 ? 50000 : priceRange[1]; // Use 10x value for max price

            if (selectedStore === 'all') {
                url = `http://localhost:8000/search?query=${query}&page=${page}&page_size=${pageSize}&sort_by=${sortBy}&min_price=${priceRange[0]}&max_price=${priceRange[1]}`;
            } else {
                url = `http://localhost:8000/search/?query=${query}&page=${page}&page_size=${pageSize}&sort_by=${sortBy}&min_price=${priceRange[0]}&max_price=${maxPrice}&store_filter=${selectedStore}&in_stock_only=true`;
            }

            const response = await fetch(url);
            const data = await response.json();

            if (data && data.products) {
                setResults(prev => {
                    if (page === 1) {
                        return data.products;
                    }
                    const newResults = [...prev, ...data.products];
                    return Array.from(new Map(newResults.map(item => 
                        [item.product_id, item])).values());
                });
                setTotalResults(data.total);
                setHasMore(data.products.length === pageSize);
            }
        } catch (error) {
            console.error('Error fetching search results:', error);
        } finally {
            setLoading(false);
        }
    }, [query, page, sortBy, selectedStore, priceRange[0], priceRange[1], pageSize]);

    // Fetch results when dependencies change
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResults();
        }, 500); // Debounce time of 500ms

        return () => clearTimeout(timer);
    }, [fetchResults]);

    // Scroll to top handler
    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.pageYOffset > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Scroll to top on new search
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.search]);

    // Intersection Observer setup for infinite scrolling
    useEffect(() => {
        if (!hasMore || loading) return;

        const handleObserver = (entries) => {
            const [target] = entries;
            if (target.isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        };

        const options = {
            root: null,
            rootMargin: '20px',
            threshold: 0.1
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

    const handlePriceRangeChange = (event, newValue) => {
        setPriceRange(newValue);
    };

    const handleStoreChange = (storeId) => {
        setSelectedStore(storeId);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStoreIcon = (store_id) => {
        switch(store_id) {
            case 1: return AMZN;
            case 2: return Jarir;
            case 3: return Extra;
            default: return null;
        }
    };

    const handleProductClick = (productId) => {
        window.location.href = `/product/${productId}`;
    };

    return (
        <div className="search-container">
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
                    <Box sx={{ width: 210 }} marginLeft={'10px'}>
                    <Slider
                        value={priceRange}
                        onChange={handlePriceRangeChange}
                        valueLabelDisplay="auto"
                        min={0}
                        max={5000}
                        step={100}
                        
                        valueLabelFormat={formatPriceLabel}
                        getAriaValueText={valuetext}
                    />
                    </Box>
                    <div className="price-range-display">
                    <span>{formatPriceLabel(priceRange[0])} SAR</span>

                    <span>{formatPriceLabel(priceRange[1])} SAR</span>
                    </div>
                </div>

                <div className="filter-section">
                    <h3>Stores</h3>
                    <div className="store-list">
                        {stores.map(store => (
                            <label key={store.id} className="store-item">
                                <input
                                    type="radio"
                                    name="store"
                                    value={store.id}
                                    checked={selectedStore === store.id}
                                    onChange={() => handleStoreChange(store.id)}
                                />
                                <span>{store.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

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
            
            {showScrollTop && (
                <button 
                    className="scroll-to-top" 
                    onClick={scrollToTop}
                    aria-label="Scroll to top"
                >
                    ↑
                </button>
            )}
        </div>
    );
};

export default SearchResults;