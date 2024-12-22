import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./HorizontalScrollView.css";
import Jarir from "../../assets/Jarir.png"
import Extra from "../../assets/Extra.png"
import AMZN from "../../assets/AMZN.png"
import EmptyPNG from "../../assets/Empty1.png"


const HorizontalScrollView = ({ prompt }) => {
  const [items, setItems] = useState([]);
  const navigate = useNavigate();
  const [totalResults, setTotalResults] = useState(0);
  

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await fetch(
          `http://localhost:8000/search?query=${encodeURIComponent(prompt)}&page=1&page_size=20`
        );
        const data = await response.json();

        if (data && data.products) {
          setItems(data.products);  // Set the products array
          setTotalResults(data.total_count);  // Use total_count from the response
      } else {
          setItems([]);
          setTotalResults(0);
      }
  } catch (error) {
      console.error('Error fetching search results:', error);
      setResults([]);
      setTotalResults(0);
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
  const AJX = (store_id) => {
    switch(store_id){
      case(1):
      return AMZN
      case(2):
      return Jarir
      case(3):
      return Extra
      default:
      return null}
  }

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
              <div key={index} className="item-card" onClick={() => handleViewProduct(item.product_id)}>
                <img src={item.image_url} alt={item.title} />
                <h3>{item.title}</h3>
                <div className="img-price">
                  { item.price !== null ?
                <img className="store-img" src={AJX(item.store_id)}></img>
                : null}
                <p className="price">{item.price !== null ? `${item.price.toFixed(2)} SAR` : <p className="available">{item.price == null ? `Price not available` : null} </p>
              }</p>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="Loading">{prompt}.</p>
      )}
    </div>
  );
};

export default HorizontalScrollView;
