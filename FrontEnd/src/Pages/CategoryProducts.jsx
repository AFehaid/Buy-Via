import React, { useState, useEffect, useRef, useCallback } from 'react';
import Slider from '@mui/material/Slider';
import './SearchResults.css';  // Reusing the same CSS
import AMZN from '../assets/AMZN.png';
import Jarir from '../assets/Jarir.png';
import Extra from '../assets/Extra.png';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';

function valuetext(value) {
    return `${value} SAR`;
}

const CategoryProducts = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { categoryId } = useParams(); // Get categoryId from URL params
    const [results, setResults] = useState([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedStore, setSelectedStore] = useState('all');
    const [sortBy, setSortBy] = useState('relevance');
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true);
    const lastProductRef = useRef();
    const pageSize = 20;
    const sar = ' SAR';
    const [showScrollTop, setShowScrollTop] = useState(false);

    const stores = [
        { id: 'all', name: 'All Stores' },
        { id: '1', name: 'Amazon' },
        { id: '2', name: 'Jarir' },
        { id: '3', name: 'Extra' }
    ];

    const toggleFilters = () => {
        setIsFiltersCollapsed((prev) => !prev);
    };

    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [sortBy, selectedStore, priceRange[0], priceRange[1], categoryId]);

    const fetchResults = useCallback(async () => {
        try {
            setLoading(true);
            const maxPrice = priceRange[1] === 5000 ? 50000 : priceRange[1];
            const storeFilter = selectedStore === 'all' ? '' : selectedStore;

            const url = `http://localhost:8000/search/category-products?category_id=${categoryId}&page=${page}&page_size=${pageSize}&sort_by=${sortBy}&min_price=${priceRange[0]}&max_price=${maxPrice}${storeFilter ? `&store_filter=${storeFilter}` : ''}&in_stock_only=false`;

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            if (!data.products || !Array.isArray(data.products)) {
                throw new Error('Invalid response format');
            }

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
            console.error('Error fetching category products:', error);
        } finally {
            setLoading(false);
        }
    }, [categoryId, page, sortBy, selectedStore, priceRange, pageSize]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchResults();
        }, 500);

        return () => clearTimeout(timer);
    }, [fetchResults]);

    useEffect(() => {
        const handleScroll = () => {
            setShowScrollTop(window.pageYOffset > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [location.search]);

    useEffect(() => {
        if (!hasMore || loading || !lastProductRef.current) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasMore) {
                    setPage(prev => prev + 1);
                }
            },
            { threshold: 0.5 }
        );

        observer.observe(lastProductRef.current);
        return () => observer.disconnect();
    }, [hasMore, loading]);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getStoreIcon = (store_id) => {
        switch (store_id) {
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
            <div className="filters-header" onClick={toggleFilters}>
                <h3>Filters</h3>
                <span className="dropdown-icon">{isFiltersCollapsed ? '+' : '−'}</span>
            </div>

            <div className={`filters-sidebar ${isFiltersCollapsed ? 'collapsed' : ''}`}>
                <div className="filter-section">
                    <h3>Sort By</h3>
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
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
                            onChange={(e, newValue) => setPriceRange(newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={5000}
                            step={100}
                            valueLabelFormat={value => value >= 5000 ? '5000+' : `${value}`}
                            getAriaValueText={valuetext}
                        />
                    </Box>
                    <div className="price-range-display">
                        <span>{priceRange[0]} SAR</span>
                        <span>{priceRange[1]} SAR</span>
                    </div>
                </div>

                <div className="filter-section">
                    <h3>Stores</h3>
                    <div className="store-list">
                        {stores.map((store) => (
                            <label key={store.id} className="store-item">
                                <input
                                    type="radio"
                                    name="store"
                                    value={store.id}
                                    checked={selectedStore === store.id}
                                    onChange={() => setSelectedStore(store.id)}
                                />
                                <span>{store.name}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div className="main-content">
                <h1>{categoryId ? `Category Products` : 'All Products'}</h1>
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

                        const calculateDiscount = (currentPrice, oldPrice) => {
                            if (!currentPrice || !oldPrice || oldPrice <= currentPrice) return null;
                            const discount = ((oldPrice - currentPrice) / oldPrice) * 100;
                            return discount >= 4 ? discount : null;
                        };

                        const discount = result.last_old_price 
                            ? calculateDiscount(result.price, result.last_old_price)
                            : null;

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
                                        <div className="price-container">
                                            {result.price !== null ? (
                                                <>
                                                    <p className={priceClasses}>
                                                        {result.price.toFixed(2)}{sar}
                                                    </p>
                                                    {discount && (
                                                        <>
                                                            <span className="old-price">
                                                                {result.last_old_price.toFixed(2)}{sar}
                                                            </span>
                                                            <span className="discount-badge">
                                                                {discount.toFixed(0)}% OFF
                                                            </span>
                                                        </>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="price-not-available">Price not available</p>
                                            )}
                                        </div>
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

export default CategoryProducts;