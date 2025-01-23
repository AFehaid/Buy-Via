import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import Logo from '../Logo/Logo';
import Dropdown from 'react-bootstrap/Dropdown';
import { useAuth } from '../../contexts/AuthProvider';
import { useNavigate } from 'react-router-dom';
import AuthModal from '../../Pages/login';
import { useLanguage } from '../../contexts/LanguageContext';
import { getCategoryList } from '../../Pages/categories';
import { 
    UserCircle,
    Bell,
    ChevronDown,
} from 'lucide-react';
import { useAlertRefresh } from '../../contexts/AlertContext';

const Navbar = () => {
    const { language, toggleLanguage, t, isRTL, formatCurrency } = useLanguage();
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isLoggedIn,token, logout } = useAuth();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [alerts, setAlerts] = useState([]);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

    const { alertsVersion } = useAlertRefresh();
    const searchRef = useRef(null);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const navigate = useNavigate();

    // Get categories with current language
    const categories = getCategoryList(language);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleCategoryClick = (categoryId) => {
        setIsMenuOpen(false);
        navigate(`/category/${categoryId}`);
        setSearchText('');
    };

    useEffect(() => {
        if (isLoggedIn && token) {
            fetchAlerts();
        } else {
            setAlerts([]); // Clear alerts when logged out
        }
    }, [isLoggedIn, token, alertsVersion]);


    const renderAlertItem = (alert) => (
        <Dropdown.Item
            key={alert.alert_id}
            className='dropdown-items'
            onClick={() => handleProductClick(alert.product_id)}
        >
            <div className="alert-item">
                <img 
                    src={alert.product_picture} 
                    alt={alert.product_name} 
                    className="alert-product-image" 
                />
                <div className="alert-product-details">
                    <div className="alert-product-name">
                        {alert.product_name}
                    </div>
                    <div className="alert-product-price">
                        {formatCurrency(alert.product_price)}
                    </div>
                    <div className="alert-threshold-price">
                        {t('product.setAlert')}: {formatCurrency(alert.threshold_price)}
                    </div>
                </div>
            </div>
        </Dropdown.Item>
    );

    const fetchProductDetails = async (product_id) => {
        try {
            const response = await fetch(`http://localhost:8000/search/${product_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
            
            if (response.ok) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('Error fetching product details:', error);
            return null;
        }
    };

    const fetchAlerts = async () => {
        if (!isLoggedIn || !token) return;

        try {
            const alertsResponse = await fetch('http://localhost:8000/alerts/triggered', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                credentials: 'include'
            });
    
            if (alertsResponse.ok) {
                const alerts = await alertsResponse.json();
                const alertsWithProductDetails = await Promise.all(
                    alerts.map(async (alert) => {
                        const productDetails = await fetchProductDetails(alert.product_id);
                        const productName = productDetails?.title || 'Unknown Product';
                        const truncatedName = productName.split(' ').slice(0, 4).join(' ') + '...';
                        return {
                            ...alert,
                            product_id: productDetails?.product_id || '',
                            product_name: truncatedName,
                            product_picture: productDetails?.image_url || '',
                            product_price: productDetails?.price || 0,
                        };
                    })
                );
                setAlerts(alertsWithProductDetails);
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    const navigateToAlerts = () => {
        navigate('/alerts');
    };

    const handleProductClick = (productId) => {
        window.location.href = `/product/${productId}`;
    };

      useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearchOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

      useEffect(() => {
        const handleClickOutside = (event) => {
            const isClickOutsideMenu = menuRef.current && !menuRef.current.contains(event.target);
            const isClickOutsideButton = buttonRef.current && !buttonRef.current.contains(event.target);
            
            if (isClickOutsideMenu && isClickOutsideButton) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchText.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchText)}`);
            setIsSearchOpen(false);
        }
    };

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    return (
        <nav className={`${isRTL ? 'rtl' : 'ltr'} ${isMobile ? 'mobile' : ''}`}>
            <div className="nav-menu">
                <div className="nav-left">
                    <a href="/" className="logo-link">
                        <Logo className="logo" />
                    </a>
                    <button
                        ref={buttonRef}
                        className={`categories-btn ${isMenuOpen ? 'active' : ''}`}
                        onClick={toggleMenu}
                        aria-expanded={isMenuOpen}
                    >
                        {!isMobile && <span>{t('navigation.categories')}</span>}
                        <ChevronDown className={`chevron-icon ${isMenuOpen ? 'rotate' : ''}`} />
                    </button>
                </div>

                {!isMobile && (
                    <div className="nav-center">
                        <ul className="nav-links">
                            <li><a className='nav-home' href="/">{t('navigation.home')}</a></li>
                            <li><a className='nav-home' href="/deals">{t('navigation.deals')}</a></li>
                            <li>
                                <a className='nav-home' href="/new">
                                    {t('navigation.newArrivals')}
                                </a>
                            </li>
                        </ul>
                    </div>
                )}

                <div className="right-section">
                    <div className="box" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                className={`input ${isSearchOpen ? 'open' : ''}`}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)}
                                placeholder={t('common.search')}
                                dir={isRTL ? 'rtl' : 'ltr'}
                            />
                        </form>
                    </div>

                    <button 
                        onClick={toggleLanguage}
                        className="language-toggle-btn"
                    >
                        <span className="full-text">
                            {language === 'en' ? 'العربية' : 'English'}
                        </span>
                        <span className="short-text">
                            {language === 'en' ? 'ع' : 'EN'}
                        </span>
                    </button>

                    {isLoggedIn && (
                <Dropdown 
                    className='dropdown' 
                    drop={isRTL ? 'down-start' : 'down-end'}
                    align={isRTL ? 'start' : 'end'}
                >
                    <Dropdown.Toggle as="button" className="alerts-btn">
                        <Bell size={isMobile ? 24 : 30} color='white'/>
                        {alerts.length > 0 && (
                            <span className="alert-badge">{alerts.length}</span>
                        )}
                    </Dropdown.Toggle>
                    <Dropdown.Menu className='dropdown-menu'>
                        <div className="alerts-header">
                            <span>{t('alerts.triggered')}</span>
                        </div>
                        {alerts.length > 0 ? (
                            <>
                                {alerts.map(alert => renderAlertItem(alert))}
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                    className='manage-alerts-btn'
                                    onClick={navigateToAlerts}
                                >
                                    {t('alerts.manageAlerts')}
                                </Dropdown.Item>
                            </>
                        ) : (
                            <>
                                <Dropdown.Item className='dropdown-items no-alerts'>
                                    {t('alerts.noTriggered')}
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item 
                                    className='manage-alerts-btn'
                                    onClick={navigateToAlerts}
                                >
                                    {t('alerts.manageAlerts')}
                                </Dropdown.Item>
                            </>
                        )}
                    </Dropdown.Menu>
                </Dropdown>
            )}

                    <Dropdown 
                        className='dropdown' 
                        drop={isRTL ? 'down-start' : 'down-end'}
                        align={isRTL ? 'start' : 'end'}
                    >
                        <Dropdown.Toggle as="button" className="account-btn">
                            <UserCircle size={isMobile ? 24 : 30} color='white' />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className='dropdown-menu'>
                            {isLoggedIn ? (
                                <>
                                    <Dropdown.Item className='dropdown-items' href="/alerts">
                                        {t('navigation.alerts')}
                                    </Dropdown.Item>
                                    <Dropdown.Item className='dropdown-items' onClick={handleLogout}>
                                        {t('auth.logout')}
                                    </Dropdown.Item>
                                </>
                            ) : (
                                <>
                                    <Dropdown.Item 
                                        className='dropdown-items' 
                                        onClick={() => setShowLoginModal(true)}
                                    >
                                        {t('auth.login')}
                                    </Dropdown.Item>
                                    <Dropdown.Item 
                                        className='dropdown-items' 
                                        onClick={() => setShowSignUpModal(true)}
                                    >
                                        {t('auth.signup')}
                                    </Dropdown.Item>
                                </>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            <div className={`category-mega-menu ${isMenuOpen ? 'show' : ''}`} ref={menuRef}>
                <div className="category-container">
                    {categories.map((category, index) => (
                        <div key={index} className="category-section">
                            <div className="category-header-nav">
                                <h3>{category.header}</h3>
                                <category.icon size={24} className="category-icon" />
                            </div>
                            <div className="subcategories-grid">
                                {category.subcategories.map((subcat) => (
                                    <div
                                        key={subcat.id}
                                        className="subcategory-column"
                                        onClick={() => handleCategoryClick(subcat.id)}
                                    >
                                        <h4 className="subcategory-title">{subcat.name}</h4>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {showLoginModal && (
                <AuthModal mode="signIn" onClose={() => setShowLoginModal(false)} />
            )}
            {showSignUpModal && (
                <AuthModal mode="signUp" onClose={() => setShowSignUpModal(false)} />
            )}
        </nav>
    );
};

export default Navbar;