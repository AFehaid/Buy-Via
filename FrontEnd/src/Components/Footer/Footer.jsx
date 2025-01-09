import React from 'react';
import './Footer.css'; // Import the CSS file for styling

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <h4>About Us</h4>
                    <p>
                        We are a leading e-commerce platform dedicated to providing the best prices for our customers.
                    </p>
                </div>
                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/deals">Deals</a></li>
                        <li><a href="/new">New Arrivals</a></li>
                        <li><a href="/contact">Contact Us</a></li>
                    </ul>
                </div>
                <div className="footer-section">
                    <h4>Follow Us</h4>
                    <div className="social-links">
                        <a href="" target="_blank" rel="noopener noreferrer">Facebook</a>
                        <a href="" target="_blank" rel="noopener noreferrer">Twitter</a>
                        <a href="" target="_blank" rel="noopener noreferrer">Instagram</a>
                    </div>
                </div>
                <div className="footer-section">
                    <h4>Contact Info</h4>
                    <p>Email: support@example.com</p>
                    <p>Phone: Example</p>
                    <p>Address: Example</p>
                </div>
            </div>
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} Buy Via. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;