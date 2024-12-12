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
    return (
        <nav>
            <div className="nav-menu navbar-fixed-top">
                <a href="/"><Logo className="logo" /></a>
                <div className="wrapper">
                    <ul className="nav-links">
                        <li onClick={handleHomeClick}><a href="Home">Home</a></li>
                        <li><a href="Categories">Categories</a></li>
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
