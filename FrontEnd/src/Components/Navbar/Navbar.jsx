import React, { useState, useRef, useEffect } from 'react';
import './Navbar.css';
import Logo from '../Logo/Logo';
import { FaUserCircle } from 'react-icons/fa';
import Dropdown from 'react-bootstrap/Dropdown';
import {useAuth}  from './AuthProvider';
import { useNavigate } from 'react-router-dom';

const Navbar = () => {
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchText, setSearchText] = useState('');
    const { isLoggedIn, setToken, logout } = useAuth();
    const searchRef = useRef(null);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout(); // This will automatically clear the token and update isLoggedIn
        navigate('/')
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

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (searchText.trim()) {
            navigate(`/search?query=${encodeURIComponent(searchText)}&page=1&page_size=10`);
        }
    };
    const handleHomeClick = () => {
        navigate('/'); // Navigate to the home page
      };
      const [isMenuOpen, setIsMenuOpen] = useState(false);
      const menuRef = useRef(null);

      const categories = [
        {
            header: 'Mobiles, Tablets & Wearables',
            subcategories: ['Smartphones', 'Tablets', 'Smartwatches', 'Fitness Trackers', 'Accessories']
        },
        {
            header: 'Appliances',
            subcategories: ['Refrigerators', 'Washing Machines', 'Microwaves', 'Air Conditioners', 'Small Kitchen Appliances']
        },
        {
            header: 'Computers & Laptops',
            subcategories: ['Laptops', 'Desktops', 'Monitors', 'Keyboards & Mice', 'Computer Accessories']
        },
        {
            header: 'Beauty & Personal Care',
            subcategories: ['Makeup', 'Skincare', 'Haircare', 'Perfumes', 'Tools & Accessories']
        },
        {
            header: 'Fashion',
            subcategories: ['Men', 'Women', 'Kids', 'Footwear', 'Accessories']
        },
        {
            header: 'Books',
            subcategories: ['Fiction', 'Non-Fiction', 'Comics', 'Textbooks', 'Magazines']
        },
        {
            header: 'Sports Equipment',
            subcategories: ['Fitness Equipment', 'Outdoor Gear', 'Team Sports', 'Apparel', 'Accessories']
        },
        {
            header: 'Travel and Luggage',
            subcategories: ['Suitcases', 'Backpacks', 'Travel Accessories', 'Duffel Bags', 'Carry-Ons']
        }
    ];
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleMenu = () => {
        console.log("Menu toggled");
        setIsMenuOpen(!isMenuOpen);
    };
    return (
        <nav>
            <div className="nav-menu navbar-fixed-top">
                <a href="/"><Logo className="logo" /></a>
                <div className="wrapper">
                <ul className="nav-links">
                    <li><a className='nav-home' href="/">Home</a></li>
                    <li>
                        <button className="categories-btn" onClick={toggleMenu}>Categories ☰</button>
                    </li>
                </ul>
                {isMenuOpen && (
                    <div
                    className={`category-menu ${isMenuOpen ? 'show' : ''}`}
                    ref={menuRef}
                    onMouseEnter={() => setIsMenuOpen(true)}
                    onMouseLeave={() => setIsMenuOpen(false)}>
                        <div className="category-content">
                            {categories.map((category, index) => (
                                <div key={index} className="category-column">
                                    <div className="category-header">
                                        <span className="category-logo">{category.logo}</span>
                                        {category.header}
                                    </div>
                                    {category.subcategories.map((sub, subIndex) => (
                                        <div key={subIndex} className="category-item">
                                            {sub}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
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
                        <Dropdown.Toggle as ="button" className="account-btn" >
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
        </nav>
    );
};

export default Navbar;
