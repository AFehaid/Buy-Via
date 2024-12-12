import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./HorizontalScrollView.css";

const HorizontalScrollView = ({ prompt }) => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/search?query=${encodeURIComponent(prompt)}&page=1&page_size=20`
        );
        const data = await response.json();

        if (Array.isArray(data)) {
          setItems(data);
        } else {
          console.error("Unexpected API response format:", data);
          setItems([]);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      }
    };

    fetchItems();
  }, [prompt]);

  String.prototype.replaceJSX = function (find, replace) {
    return this.split(find).flatMap((item) => [item, replace]).slice(0, -1);
  };

  const handleShowMore = () => {
    navigate(`/search?query=${encodeURIComponent(prompt)}&page=1&page_size=50`);
  };

  const handleViewProduct = (productId) => {
    navigate(`/product/${productId}`);
  };

  return (
    <div className="horizontal-scroll-view">
      <button className="button5" data-text="Awesome" onClick={handleShowMore}>
        <span className="actual-text">&nbsp;{prompt.replaceJSX(" ", <b>&nbsp;</b>)}&nbsp;</span>
        <span aria-hidden="true" className="hover-text5">&nbsp;{prompt.replaceJSX(" ", <b>&nbsp;</b>)}&nbsp;</span>
      </button>
      {items.length > 0 ? (
        <>
          <div className="scroll-container">
            {items.map((item, index) => (
              <div key={index} className="item-card">
                <img src={item.image_url} alt={item.title} />
                <h3>{item.title}</h3>
                <p className="price">{item.price !== null ? `${item.price.toFixed(2)} SAR` : "Price not available"}</p>
                <p className="available">{item.availability !== false ? `` : "Not available"}</p>
                <button
                  className={item.availability !== false ? `product-link` : `product-link-false`}
                  onClick={() => handleViewProduct(item.product_id)}
                >
                  View Product
                </button>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p>{prompt}.</p>
      )}
    </div>
  );
};

export default HorizontalScrollView;
