import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import Logo from '../Logo/Logo';
import { FaUserCircle } from 'react-icons/fa';
import Dropdown from 'react-bootstrap/Dropdown';
import {useAuth}  from './AuthProvider';
import { useNavigate } from 'react-router-dom';
import { FiChevronDown } from 'react-icons/fi';

const Navbar = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { isLoggedIn, logout } = useAuth();
    const searchRef = useRef(null);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const navigate = useNavigate();

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
    const handleHomeClick = () => {
        navigate('/'); 
      };


      const categories = [
        {
            header: 'Mobiles & Electronics',
            icon: '📱',
            subcategories: [
                { name: 'Smartphones', featured: ['iPhone', 'Samsung', 'Xiaomi'] },
                { name: 'Tablets', featured: ['iPad', 'Galaxy Tab', 'Huawei'] },
                { name: 'Smartwatches', featured: ['Apple Watch', 'Galaxy Watch', 'Fitbit'] },
                { name: 'Accessories', featured: ['Cases', 'Chargers', 'Screen Protectors'] }
            ]
        },
        {
            header: 'Home Appliances',
            icon: '🏠',
            subcategories: [
                { name: 'Kitchen Appliances', featured: ['Refrigerators', 'Ovens', 'Dishwashers'] },
                { name: 'Laundry', featured: ['Washers', 'Dryers', 'Irons'] },
                { name: 'Climate Control', featured: ['AC', 'Heaters', 'Air Purifiers'] },
                { name: 'Small Appliances', featured: ['Blenders', 'Coffee Makers', 'Toasters'] }
            ]
        },
        {
            header: 'Computers & Gaming',
            icon: '💻',
            subcategories: [
                { name: 'Laptops', featured: ['MacBook', 'Gaming', 'Ultrabooks'] },
                { name: 'Desktop PCs', featured: ['Gaming PCs', 'All-in-One', 'Monitors'] },
                { name: 'Gaming', featured: ['Consoles', 'Games', 'Accessories'] },
                { name: 'Computer Parts', featured: ['GPUs', 'CPUs', 'Storage'] }
            ]
        },
        {
            header: 'Fashion & Lifestyle',
            icon: '👔',
            subcategories: [
                { name: 'Men\'s Fashion', featured: ['Casual', 'Formal', 'Sports'] },
                { name: 'Women\'s Fashion', featured: ['Dresses', 'Tops', 'Accessories'] },
                { name: 'Kids\' Fashion', featured: ['Boys', 'Girls', 'Infants'] },
                { name: 'Footwear', featured: ['Sneakers', 'Formal', 'Sports'] }
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
                        <FiChevronDown className={`chevron-icon ${isMenuOpen ? 'rotate' : ''}`} />
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
                    <Dropdown className='dropdown' drop='down-centered'>
                        <Dropdown.Toggle as="button" className="account-btn">
                            <FaUserCircle size={30} color="#fff" />
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
                                    <Dropdown.Item className='dropdown-items' href="/login">Login</Dropdown.Item>
                                    <Dropdown.Item className='dropdown-items' href="/Sign_Up">Sign Up</Dropdown.Item>
                                </>
                            )}
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>

            <div 
                className={`category-mega-menu ${isMenuOpen ? 'show' : ''}`}
                ref={menuRef}
            >

                <div className="category-container">
                    {categories.map((category, index) => (
                        <div key={index} className="category-section">
                            <div className="category-header">
                                <span className="category-icon">{category.icon}</span>
                                <h3>{category.header}</h3>
                            </div>
                            <div className="subcategories-grid">
                                {category.subcategories.map((subcat, subIndex) => (
                                    <div key={subIndex} className="subcategory-column">
                                        <h4 className="subcategory-title">{subcat.name}</h4>
                                        <ul className="featured-list">
                                            {subcat.featured.map((item, itemIndex) => (
                                                <li key={itemIndex}>
                                                    <a href={`/category/${encodeURIComponent(category.header)}/${encodeURIComponent(subcat.name)}/${encodeURIComponent(item)}`}>
                                                        {item}
                                                    </a>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;