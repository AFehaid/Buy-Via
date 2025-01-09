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
    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('query') || '';
    const [results, setResults] = useState([]);
    const [totalResults, setTotalResults] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [selectedStore, setSelectedStore] = useState('all');
    const [sortBy, setSortBy] = useState('relevance');
    const [priceRange, setPriceRange] = useState([0, 5000]);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);
    const [expandedMainCategories, setExpandedMainCategories] = useState([]);
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true); // Collapsed by default on mobile
    const observer = useRef();
    const lastProductRef = useRef();
    const pageSize = 10;
    const sar = ' SAR';
    const [showScrollTop, setShowScrollTop] = useState(false);
    const categoryId = queryParams.get('category_id') || 'all';

    const stores = [
        { id: 'all', name: 'All Stores' },
        { id: '1', name: 'Amazon' },
        { id: '2', name: 'Jarir' },
        { id: '3', name: 'Extra' }
    ];

    const categories = [
        {
            header: 'Computers',
            icon: '💻',
            subcategories: [
                { id: 1, name: 'Desktops & Workstations' },
                { id: 2, name: 'Laptops & Notebooks' },
                { id: 3, name: 'Tablets & E-Readers' },
                { id: 6, name: 'Computer Components' },
                { id: 7, name: 'Computer Peripherals' },
                { id: 8, name: 'Networking Equipment' },
                { id: 9, name: 'Printers & Scanners' },
                { id: 11, name: 'Storage Devices' }
            ]
        },
        {
            header: 'Smartphones',
            icon: '📱',
            subcategories: [
                { id: 4, name: 'Smartphones & Cell Phones' },
                { id: 12, name: 'Wearable Technology' },
                { id: 13, name: 'Phone Accessories' },
                { id: 14, name: 'Device Accessories' }
            ]
        },
        {
            header: 'Home & Kitchen',
            icon: '🏠',
            subcategories: [
                { id: 23, name: 'Home Appliances' },
                { id: 24, name: 'Kitchen Appliances' },
                { id: 25, name: 'Furniture & Home Decor' },
                { id: 26, name: 'Home Improvement Tools' },
                { id: 27, name: 'Home Security & Surveillance' }
            ]
        },
        {
            header: 'Entertainment',
            icon: '🎮',
            subcategories: [
                { id: 19, name: 'Gaming Consoles' },
                { id: 20, name: 'Handheld Gaming Devices' },
                { id: 21, name: 'Gaming Accessories' },
                { id: 22, name: 'Video Games' },
                { id: 18, name: 'TV & Home Theater' },
                { id: 17, name: 'Audio Equipment' }
            ]
        },
        {
            header: 'Fashion',
            icon: '👗',
            subcategories: [
                { id: 28, name: 'Clothing' },
                { id: 29, name: 'Shoes' },
                { id: 30, name: 'Fashion Accessories' },
                { id: 31, name: 'Jewelry' },
                { id: 32, name: 'Beauty Products' },
                { id: 33, name: 'Health & Wellness' },
                { id: 34, name: 'Personal Care & Hygiene' }
            ]
        },
        {
            header: 'Sports',
            icon: '🏀',
            subcategories: [
                { id: 35, name: 'Sports Equipment' },
                { id: 36, name: 'Outdoor Gear' },
                { id: 37, name: 'Fitness Equipment' }
            ]
        },
        {
            header: 'Other Categories',
            icon: '📦',
            subcategories: [
                { id: 15, name: 'Cameras & Camcorders' },
                { id: 16, name: 'Camera Accessories' },
                { id: 38, name: 'Books & Magazines' },
                { id: 39, name: 'Music & Musical Instruments' },
                { id: 45, name: 'Toys & Games' },
                { id: 49, name: 'Pet Supplies' },
                { id: 50, name: 'Baby Products' },
                { id: 51, name: 'Garden & Patio' },
                { id: 52, name: 'Gift Cards & Vouchers' },
                { id: 53, name: 'Smart Home Devices' }
            ]
        }
    ];

    const getCategoryName = (categoryId) => {
        for (const category of categories) {
            const subcategory = category.subcategories.find(sub => sub.id === parseInt(categoryId));
            if (subcategory) {
                return subcategory.name;
            }
        }
        return null;
    };
    const categoryName = getCategoryName(categoryId);
    
    const toggleFilters = () => {
        setIsFiltersCollapsed((prev) => !prev); // Toggle filters visibility on mobile
    };
    const formatPriceLabel = (value) => {
        if (value >= 5000) {
            return '5000+';
        }
        return `${value}`;
    };


    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [query, sortBy, selectedStore, priceRange[0], priceRange[1], categoryId]);

    // Reset pagination when filters change
    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [query, sortBy, selectedStore, priceRange[0], priceRange[1], selectedCategory]);

    // Fetch results with debounced price range
    const fetchResults = useCallback(async () => {
        try {
            setLoading(true);
            let url;
            const maxPrice = priceRange[1] === 5000 ? 50000 : priceRange[1]; // Use 10x value for max price

            if (categoryId === 'all') {
                url = `http://localhost:8000/search?query=${query}&page=${page}&page_size=${pageSize}&sort_by=${sortBy}&min_price=${priceRange[0]}&max_price=${maxPrice}`;
            } else {
                url = `http://localhost:8000/search/category-products?category_id=${categoryId}&page=${page}&page_size=${pageSize}&sort_by=${sortBy}&min_price=${priceRange[0]}&max_price=${maxPrice}`;
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
    }, [query, page, sortBy, selectedStore, priceRange[0], priceRange[1], categoryId, pageSize]);

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

    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        setPage(1); // Reset to the first page when a new category is selected
    };

    const toggleCategoriesSection = () => {
        setIsCategoriesExpanded((prev) => !prev); // Toggle the entire Categories section
    };

    const toggleMainCategory = (header) => {
        setExpandedMainCategories((prev) =>
            prev.includes(header)
                ? prev.filter((h) => h !== header) // Collapse if already expanded
                : [...prev, header] // Expand if collapsed
        );
    };

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
            {/* Filters Header (Mobile) */}
            <div className="filters-header" onClick={toggleFilters}>
                <h3>Filters</h3>
                <span className="dropdown-icon">{isFiltersCollapsed ? '+' : '−'}</span>
            </div>

            {/* Filters Section */}
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
                            valueLabelFormat={(value) => (value >= 5000 ? '5000+' : `${value}`)}
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

                <div className="filter-section">
                    <div className="categories-header" onClick={() => setIsCategoriesExpanded((prev) => !prev)}>
                        <h3>Categories</h3>
                        <span className="dropdown-icon">{isCategoriesExpanded ? '−' : '+'}</span>
                    </div>
                    {isCategoriesExpanded && (
                        <div className="category-dropdown">
                            {categories.map((category) => (
                                <div key={category.header} className="category-item">
                                    <div
                                        className="main-category-header"
                                        onClick={() => toggleMainCategory(category.header)}
                                    >
                                        <span>{category.icon} {category.header}</span>
                                        <span className="dropdown-icon">
                                            {expandedMainCategories.includes(category.header) ? '−' : '+'}
                                        </span>
                                    </div>
                                    {expandedMainCategories.includes(category.header) && (
                                        <div className="sub-category-list">
                                            {category.subcategories.map((subCategory) => (
                                                <div
                                                    key={subCategory.id}
                                                    className={`sub-category-item ${selectedCategory === subCategory.id ? 'selected' : ''}`}
                                                    onClick={() => handleCategoryChange(subCategory.id)}
                                                >
                                                    {subCategory.name}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="main-content">
                {/* Conditional Header */}
                {query ? (
                    <h1>Search Results for "{query}"</h1>
                ) : categoryName ? (
                    <h1>{categoryName}</h1>
                ) : (
                    <h1>All Products</h1>
                )}
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