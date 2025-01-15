import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Smartphone, 
  Laptop, 
  Tv, 
  Headphones, 
  Camera, 
  Watch, 
  Gamepad,
  ShoppingBag,
  Home,
  Shirt
} from 'lucide-react';
import './PopularCategories.css';

const categories = [
  {
    id: 1,
    name: 'Smartphones',
    icon: Smartphone,
    subCategories: [
        {id: 4, name: 'Smartphones'},
        {id: 3, name: 'Tablets'},
        {id: 13, name: 'Accessories'}],
    count: 7000
  },
  {
    id: 2,
    name: 'Computers',
    icon: Laptop,
    subCategories: [
        {id: 2, name: 'Laptops'},
        {id: 1, name: 'Desktops'},
        {id: 6, name: 'Components'}],
    count: 4000
  },
  {
    id: 3,
    name: 'Home',
    icon: Home,
    subCategories: [
        {id: 23, name: 'Home Appliances'},
        {id: 25, name: 'Furniture'},
        {id: 27, name: 'Home Security'}],
    count: 8000
  },
  {
    id: 4,
    name: 'Gaming',
    icon: Gamepad,
    subCategories: [
        {id: 19, name: 'Consoles'},
        {id: 22, name: 'Games'},
        {id: 21, name: 'Accessories'}],
    count: 3100
  },
  {
    id: 5,
    name: 'Fashion',
    icon: Shirt,
    subCategories: [
        {id: 28, name: 'Clothing'},
        {id: 29, name: 'Shoes'},
        {id: 31, name: 'Jewelry'}],
    count: 1600
  }
];

const PopularCategories = () => {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState(null);
  const navigate = useNavigate();

  const handleCategoryClick = (categoryId) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
      setSelectedSubCategory(null);
    } else {
      setSelectedCategory(categoryId);
      setSelectedSubCategory(null);
    }
  };

  const handleSubCategoryClick = (subCategory) => {
    setSelectedSubCategory(subCategory.id);
    navigate(`/search?category_id=${subCategory.id}`);
  };

  return (
    <div className="popular-categories">
      <div className="popular-categories-header">
        {selectedCategory ? (
          <div className="fade-content">
            <h2>{categories.find(c => c.id === selectedCategory)?.name}</h2>
            <p>
              Explore our selection of {
                categories.find(c => c.id === selectedCategory)?.name.toLowerCase()
              } from top brands at competitive prices.
            </p>
          </div>
        ) : (
          <div className="fade-content">
            <h2>Popular Categories</h2>
            <p>Browse products across categories</p>
          </div>
        )}
      </div>

      <div className="popular-categories-grid">
        {categories.map((category) => (
          <div key={category.id} className="popular-category-item-wrapper">
            <button
              className={`popular-category-item ${selectedCategory === category.id ? 'selected' : ''}`}
              onClick={() => handleCategoryClick(category.id)}
            >
              <div className="popular-category-icon">
                <category.icon size={28} />
              </div>
              <div className="popular-category-info">
                <span className="popular-category-name">{category.name}</span>
                <span className="popular-category-count">{category.count}+ items</span>
              </div>
            </button>

            {selectedCategory === category.id && (
              <div className="popular-subcategories-dropdown">
                {category.subCategories.map((subCategory) => (
                  <button
                    key={subCategory.id}
                    className={`popular-subcategory-item ${
                      selectedSubCategory === subCategory.id ? 'selected' : ''
                    }`}
                    onClick={() => handleSubCategoryClick(subCategory)}
                  >
                    {subCategory.name}
                    <span className="popular-subcategory-arrow">→</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PopularCategories;