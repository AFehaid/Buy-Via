import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import Logo from '../Logo/Logo';
import { FaUserCircle, FaBell } from 'react-icons/fa';
import Dropdown from 'react-bootstrap/Dropdown';
import { useAuth } from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';
import AuthModal from '../../Pages/login'; // Renamed from Login.jsx
import { 
    // Main category icons
    Smartphone,
    Laptop,
    Tv,
    Gamepad,
    Shirt,
    Dumbbell,
    Package,
    Home,
    Baby,
    Car,
    // Navigation and UI icons
    UserCircle,
    Bell,
    ChevronDown,
    Camera,
    Music,
    Gift,
    ShoppingBag,
    Headphones,
    Watch,
    Truck,
    BookOpen,
    Palette,
    DumbbellIcon,
    Warehouse
} from 'lucide-react';

const Navbar = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isLoggedIn, logout } = useAuth();
    const searchRef = useRef(null);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const navigate = useNavigate();
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignUpModal, setShowSignUpModal] = useState(false);
    const [alerts, setAlerts] = useState([]);


    const handleCategoryClick = (categoryId) => {
        navigate(`/search?category_id=${categoryId}`);
        setIsMenuOpen(false);
    };

    useEffect(() => {
        if (isLoggedIn) {
            fetchAlerts();
        }
    }, [isLoggedIn]);




    // WIP !!
    const fetchProductDetails = async (product_id) => {
        try {
            const token = localStorage.getItem('token'); // Get the token from local storage
            const response = await fetch(`http://localhost:8000/search/${product_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Send the token in the headers
                },
            });
            if (response.ok) {
                const data = await response.json();
                return data;
            } else {
                console.error('Failed to fetch product details');
                return null;
            }
        } catch (error) {
            console.error('Error fetching product details:', error);
            return null;
        }
    };

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('token'); // Get the token from local storage
            const user_id = 2; // Hardcoded user ID for testing
            const response = await fetch(`http://localhost:8000/alerts/?user_id=${user_id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`, // Send the token in the headers
                },
            });
            if (response.ok) {
                const alerts = await response.json();
                const alertsWithProductDetails = await Promise.all(
                    alerts.map(async (alert) => {
                        const productDetails = await fetchProductDetails(alert.product_id);
                        const productName = productDetails?.title || 'Unknown Product';
                        const truncatedName = productName.split(' ').slice(0, 4).join(' ') + '...';
                        return {
                            ...alert,
                            product_id: productDetails?.product_id || '',
                            product_name: truncatedName, // Use truncated name
                            product_picture: productDetails?.image_url || '',
                            product_price: productDetails?.price || 0,
                        };
                    })
                );
                setAlerts(alertsWithProductDetails);
            } else {
                console.error('Failed to fetch alerts');
            }
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };
    // WIP !!

    const handleProductClick = (productId) => {
        window.location.href = `/product/${productId}`;
    };




    const handleLogout = () => {
        logout();
        navigate('/');
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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchText.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchText)}`);
            setIsSearchOpen(false);
        }
    };



   const categories = [
        {
            header: 'Computers',
            icon: Laptop,
            subcategories: [
                { id: 1, name: 'Desktops & Workstations' },
                { id: 2, name: 'Laptops & Notebooks' },
                { id: 3, name: 'Tablets & E-Readers' },
                { id: 6, name: 'Computer Components' },
                { id: 7, name: 'Computer Peripherals' },
                { id: 11, name: 'Storage Devices' },
                { id: 8, name: 'Networking Equipment' },
                { id: 9, name: 'Printers & Scanners' }
            ]
        },
        {
            header: 'Smartphones',
            icon: Smartphone,
            subcategories: [
                { id: 4, name: 'Smartphones' },
                { id: 13, name: 'Phone Accessories' },
                { id: 12, name: 'Wearable Technology' }
            ]
        },
        {
            header: 'Home & Kitchen',
            icon: Home,
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
            icon: Gamepad,
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
            icon: Shirt,
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
            icon: Dumbbell,
            subcategories: [
                { id: 35, name: 'Sports Equipment' },
                { id: 36, name: 'Outdoor Gear' },
                { id: 37, name: 'Fitness Equipment' }
            ]
        },
        {
            header: 'Other Categories',
            icon: Package,
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
    
    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };
    return (
        <nav>
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
                        <span>Categories</span>
                        <ChevronDown className={`chevron-icon ${isMenuOpen ? 'rotate' : ''}`} />
                    </button>
                </div>

                <div className="nav-center">
                    <ul className="nav-links">
                        <li><a className='nav-home' href="/">Home</a></li>
                        <li><a className='nav-home' href="/deals">Deals</a></li>
                        <li><a className='nav-home' href="/new">New Arrivals</a></li>
                    </ul>
                </div>

                <div className="right-section">
                    <div className="box" ref={searchRef}>
                        <form onSubmit={handleSearchSubmit}>
                            <input
                                type="text"
                                className={`input ${isSearchOpen ? 'open' : ''}`}
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                onFocus={() => setIsSearchOpen(true)}
                                placeholder="Search..."
                            />
                        </form>
                    </div>
                    {isLoggedIn ? (
                        <Dropdown className='dropdown' drop='down-centered'>
                            <Dropdown.Toggle as="button" className="alerts-btn">
                                <Bell size={30} color='white'/>
                            </Dropdown.Toggle>
                            <Dropdown.Menu className='dropdown-menu'>
                                {alerts.length > 0 ? (
                                    alerts.map(alert => (
                                        <Dropdown.Item
                                            key={alert.alert_id}
                                            className='dropdown-items'
                                            onClick={() => handleProductClick(alert.product_id)}
                                        >
                                            <div className="alert-item">
                                                <img src={alert.product_picture} alt={alert.product_name} className="alert-product-image" />
                                                <div className="alert-product-details">
                                                    <div className="alert-product-name">{alert.product_name}</div>
                                                    <div className="alert-product-price">${alert.product_price}</div>
                                                    <div className="alert-threshold-price">Alert at: ${alert.threshold_price}</div>
                                                </div>
                                            </div>
                                        </Dropdown.Item>
                                    ))
                                ) : (
                                    <Dropdown.Item className='dropdown-items'>
                                        No alerts
                                    </Dropdown.Item>
                                )}
                            </Dropdown.Menu>
                        </Dropdown>
                    ) : null}
                    <Dropdown className='dropdown' drop='down-centered'>
                        <Dropdown.Toggle as="button" className="account-btn">
                            <UserCircle size={30} color='white' />
                        </Dropdown.Toggle>
                        <Dropdown.Menu className='dropdown-menu'>
                            {isLoggedIn ? (
                                <>
                                    <Dropdown.Item className='dropdown-items' href="/profile">Profile</Dropdown.Item>
                                    <Dropdown.Item className='dropdown-items' href="/settings">Settings</Dropdown.Item>
                                    <Dropdown.Item className='dropdown-items' onClick={handleLogout}>
                                        Logout
                                    </Dropdown.Item>
                                </>
                            ) : (
                                <>
                                    <Dropdown.Item className='dropdown-items' onClick={() => setShowLoginModal(true)}>
                                        Login
                                    </Dropdown.Item>
                                    <Dropdown.Item className='dropdown-items' onClick={() => setShowSignUpModal(true)}>
                                        Sign Up
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
                            <div className="category-header">
                                <h3>{category.header}</h3>
                                <category.icon size={24} className="category-icon" />
                            </div>
                            <div className="subcategories-grid">
                                {category.subcategories.map((subcat, subIndex) => (
                                    <div
                                        key={subIndex}
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

            {showLoginModal && <AuthModal mode="signIn" onClose={() => setShowLoginModal(false)} />}
            {showSignUpModal && <AuthModal mode="signUp" onClose={() => setShowSignUpModal(false)} />}
        </nav>
    );
};

export default Navbar;