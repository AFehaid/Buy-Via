import React, { useState, useEffect, useRef, useCallback } from 'react';
import Slider from '@mui/material/Slider';
import './SearchResults.css';
import AMZN from '../assets/AMZN.png';
import Jarir from '../assets/Jarir.png';
import Extra from '../assets/Extra.png';
import { useLocation, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import { useLanguage } from '../contexts/LanguageContext';
import { getCategoryList, getCategoryById } from '../Pages/categories';
import ProductAlert from '../Components/ProductAlert/ProductAlert';
import { useAuth } from '../contexts/AuthProvider';
import { baseURL } from "../api"; 



const minDistance = 200;
function valuetext(value) {
    return `${value.toFixed(0)}`;
}
const SearchResults = () => {
    const { token } = useAuth();
    const { language, t, formatCurrency } = useLanguage();
    const navigate = useNavigate();
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
    const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(true); 
    const observer = useRef();
    const lastProductRef = useRef();
    const pageSize = 20; 
    const sar = ' SAR';
    const [showScrollTop, setShowScrollTop] = useState(false);
    const categoryId = queryParams.get('category_id') || 'all';
    const [isStoresExpanded, setIsStoresExpanded] = useState(false);
    const [inStockOnly, setInStockOnly] = useState(false);

    const stores = [
        { id: 'all', translations: { en: 'All Stores', ar: 'جميع المتاجر' }, icon: null },
        { id: '1', translations: { en: 'Amazon', ar: 'أمازون' }, icon: AMZN  },
        { id: '2', translations: { en: 'Jarir', ar: 'جرير' }, icon: Jarir  },
        { id: '3', translations: { en: 'Extra', ar: 'اكسترا' }, icon: Extra  }
    ];

    const categories = getCategoryList(language);

    const getCategoryName = (categoryId) => {
        const category = getCategoryById(categoryId, language);
        return category ? category.subcategory : null;
    };

    const categoryName = getCategoryName(categoryId);
    
    const toggleFilters = () => {
        setIsFiltersCollapsed((prev) => !prev); 
    };
    const formatPriceLabel = (value) => {
        if (value >= 5000) {
            return '5000+';
        }
        return `${value}`;
    };

    const getResultsText = (shown, total) => {
        if (total === 0) return t('common.noResults');
        return t('search.showing').replace('{{shown}}', shown).replace('{{total}}', total);
    };

    useEffect(() => {
        setResults([]);
        setPage(1);
        setHasMore(true);
    }, [query, sortBy, selectedStore, priceRange[0], priceRange[1], categoryId, inStockOnly]);


    const fetchResults = useCallback(async () => {
        try {
            setLoading(true);
            let url;
            const maxPrice = priceRange[1] === 5000 ? 50000 : priceRange[1]; 
            const storeFilter = selectedStore === 'all' ? '' : selectedStore;
            const categoryFilter = selectedCategory === 'all' ? '' : selectedCategory;
    
            url = `${baseURL}/search?query=${query}&page=${page}&page_size=${pageSize}&sort_by=${sortBy}&min_price=${priceRange[0]}&max_price=${maxPrice}${storeFilter ? `&store_filter=${storeFilter}` : ''}${categoryFilter ? `&category_id=${categoryFilter}` : ''}${inStockOnly ? '&in_stock_only=true' : ''}`;
    
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
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
        console.error('Error fetching search results:', error);
    } finally {
        setLoading(false);
    }
}, [query, page, sortBy, selectedStore, priceRange, selectedCategory, pageSize, inStockOnly]);

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


    const handleCategoryChange = (categoryId) => {
        setSelectedCategory(categoryId);
        setPage(1);
        
        const newUrl = new URL(window.location.href);
        if (categoryId === 'all') {
            newUrl.searchParams.delete('category_id');
        } else {
            newUrl.searchParams.set('category_id', categoryId);
        }
        window.history.pushState({}, '', newUrl);
        
        setResults([]);
        fetchResults();
    };

    const toggleMainCategory = (header) => {
        setExpandedMainCategories((prev) =>
            prev.includes(header)
                ? prev.filter((h) => h !== header) 
                : [...prev, header] 
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

    const getDisplayTitle = (result) => {
        if (!result) return '';
        
        if (language === 'ar') {
            return result.arabic_title || result.title || '';
        }
        return result.title || '';
    };
    return (
        <div className={`search-container ${language === 'ar' ? 'rtl' : ''}`}>
            <div className="filters-header" onClick={toggleFilters}>
                <h3>{t('filters.title')}</h3>
                <span className="dropdown-icon">{isFiltersCollapsed ? '+' : '−'}</span>
            </div>

            <div className={`filters-sidebar ${isFiltersCollapsed ? 'collapsed' : ''}`}>
                <div className="filter-section">
                    <h3 className="filter-title">{t('filters.sortBy')}</h3>
                    <select 
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="sort-select"
                    >
                        <option value="relevance">{t('filters.relevance')}</option>
                        <option value="price-low">{t('filters.priceLowToHigh')}</option>
                        <option value="price-high">{t('filters.priceHighToLow')}</option>
                        <option value="newest">{t('filters.newest')}</option>
                    </select>
                </div>

                <div className="filter-section">
                    <h3 className="filter-title">{t('filters.priceRange')}</h3>
                    <Box  marginLeft={language === 'ar' ? '0' : '10px'} marginRight={language === 'ar' ? '10px' : '0'}>
                        <Slider
                            value={priceRange}
                            onChange={(e, newValue) => setPriceRange(newValue)}
                            valueLabelDisplay="auto"
                            min={0}
                            max={5000}
                            step={100}
                            valueLabelFormat={(value) => value >= 5000 ? '5000+' : value.toFixed(0)}
                            getAriaValueText={valuetext}
                        />
                    </Box>
                    <div className="price-range-display">
                        <span>{formatCurrency(priceRange[0])}</span>
                        <span>{formatCurrency(priceRange[1])}</span>
                    </div>
                </div>
                <div className="filter-section">
                    <h3 className="filter-title">{t('filters.availability')}</h3>
                    <div className="checkbox-filter">
                        <label className="checkbox-label">
                            <input
                                type="checkbox"
                                checked={inStockOnly}
                                onChange={(e) => setInStockOnly(e.target.checked)}
                            />
                            <span>{t('filters.inStockOnly')}</span>
                        </label>
                    </div>
                </div>

                <div className="filter-section">
                    <div className="categories-header" onClick={() => setIsStoresExpanded(!isStoresExpanded)}>
                        <h3 className="filter-title">{t('filters.stores')}</h3>
                        <span className="dropdown-icon">{isStoresExpanded ? '−' : '+'}</span>
                    </div>
                    {isStoresExpanded && (
                        <div className="store-dropdown">
                            {stores.map((store) => (
                                <div
                                    key={store.id}
                                    className={`store-item ${selectedStore === store.id ? 'selected' : ''}`}
                                    onClick={() => setSelectedStore(store.id)}
                                >
                                    <div className="store-item-content">
                                        <span>{store.translations[language]}</span>
                                        {store.icon && (
                                            <img 
                                                src={store.icon} 
                                                alt={store.translations[language]}
                                                className="store-icon" 
                                            />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="filter-section">
                    <div className="categories-header" onClick={() => setIsCategoriesExpanded(!isCategoriesExpanded)}>
                        <h3 className="filter-title">{t('filters.categories')}</h3>
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
                                        <span>{category.header}</span>
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
                <div className="results-header">
                    {query ? (
                        <h1>{t('search.resultsFor').replace('{{query}}', query)}</h1>
                    ) : categoryName ? (
                        <h1>{categoryName}</h1>
                    ) : (
                        <h1>{t('search.allProducts')}</h1>
                    )}
                    <p className="results-count">
                        {getResultsText(results.length, totalResults)}
                    </p>
                </div>

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
                                <ProductAlert productId={result.product_id} currentPrice={result.price} />

                                    <img 
                                        src={result.image_url} 
                                        alt={getDisplayTitle(result)}
                                        className="product-image"
                                    />

                                </div>
                                <h3 className="product-title">{getDisplayTitle(result)}</h3>
                                <div className="product-info">
                                    <div className="price-availability">
                                    <div className="price-container">
                                        {result.price !== null ? (
                                            <>
                                                {discount && (
                                                    <>
                                                        <span className="old-price">
                                                            {formatCurrency(result.last_old_price)}
                                                        </span>
                                                        <span className="discount-badge-search">
                                                            {discount.toFixed(0)}% {language === 'ar' ? 'خصم' : 'OFF'}
                                                        </span>
                                                    </>
                                                )}
                                                <p className={priceClasses}>
                                                    {formatCurrency(result.price)}
                                                </p>
                                            </>
                                        ) : (
                                            <p className="price-not-available">
                                                {language === 'ar' ? 'السعر غير متوفر' : 'Price not available'}
                                            </p>
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

export default SearchResults;