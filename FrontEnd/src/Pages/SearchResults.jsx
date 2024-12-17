import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './SearchResults.css';
import Img_Slider from '../Components/Img_Slider/Img_Slider';

const SearchResults = () => {
    const [results, setResults] = useState([]);
    const [totalResults, setTotalResults] = useState(0);

    const location = useLocation();
    const navigate = useNavigate();
    const [error, setError] = useState(null);

    const queryParams = new URLSearchParams(location.search);
    const query = queryParams.get('query') || '';
    const page = parseInt(queryParams.get('page'), 10) || 10;
    const pageSize = parseInt(queryParams.get('page_size'), 50) || 50;
    const sar = ' SAR'

    useEffect(() => {
const fetchResults = async () => {
    try {
        const response = await fetch(
            `http://localhost:8000/search?query=${query}&page=${page}&page_size=${pageSize}`
        );
        const data = await response.json();
        console.log("API Response:", data); // Logs the response
        console.log("Query:", query);

        if (data && data.products) {
            setResults(data.products);  // Set the products array
            setTotalResults(data.total_count);  // Use total_count from the response
        } else {
            setResults([]);
            setTotalResults(0);
        }
    } catch (error) {
        console.error('Error fetching search results:', error);
        setResults([]);
        setTotalResults(0);
    }
};
    
        fetchResults();
    }, [query, page, pageSize]);

    const handlePageChange = (newPage) => {
        navigate(`/search?query=${query}&page=${newPage}&page_size=${pageSize}`);
        window. scrollTo({ top: 0, left: 0})
    };

    const handlePageSizeChange = (newPageSize) => {
        navigate(`/search?query=${query}&page=1&page_size=${newPageSize}`);
    };
    const handleViewProduct = (productId) => {
        navigate(`/product/${productId}`);
      };

    const totalPages = Math.ceil(totalResults / pageSize);

    return (
<div className="search-results">
    <h1>Search Results for "{query}"</h1>
    {totalResults > 0 && (
        <p className="results-summary">
            Showing {pageSize * (page - 1) + 1}-{Math.min(page * pageSize, totalResults)} of {totalResults} results for "{query}"
        </p>
    )}
    {results.length > 0 ? (
        <div className="product-grid">
            {results.map((result) => (
                <div key={result.product_id} className="product-card">
                    <img src={result.image_url} alt={result.title} className="product-image" />
                    <h3 className="product-title">{result.title}</h3>
                    <p className="product-price">
                        {result.price !== null ? `${result.price.toFixed(2)}${sar}` : "Price not available"}
                    </p>
                    <p className="available">{result.availability !== false ? `` : "not available"}</p>
                    <a target="_blank" rel="noopener noreferrer" className={result.availability !== false ? `product-link` : `product-link-false`} 
                    onClick={() => handleViewProduct(result.product_id)}>
                        View Product
                    </a>
                </div>
            ))}
        </div>
    ) : (
        <p>No results found for "{query}".</p>
    )}
    {totalResults > pageSize && (
        <div className="pagination">
            <button onClick={() => handlePageChange(page - 1)} disabled={page === 1}>
                Previous
            </button>
            <span>Page {page} of {totalPages}</span>
            <button onClick={() => handlePageChange(page + 1)} disabled={page >= totalPages}>
                Next
            </button>
        </div>
    )}
</div>

    );
    
};

export default SearchResults;
