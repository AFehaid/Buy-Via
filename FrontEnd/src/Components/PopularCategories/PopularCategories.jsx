// src/components/PopularCategories/PopularCategories.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { 
  Smartphone, 
  Laptop, 
  Home, 
  Gamepad,
  Shirt
} from 'lucide-react';
import './PopularCategories.css';

const categories = [
  {
    id: 1,
    translations: {
      en: 'Smartphones',
      ar: 'الهواتف الذكية'
    },
    icon: Smartphone,
    subCategories: [
      { 
        id: 4, 
        translations: { en: 'Smartphones', ar: 'الهواتف الذكية' }
      },
      { 
        id: 3, 
        translations: { en: 'Tablets', ar: 'الأجهزة اللوحية' }
      },
      { 
        id: 13, 
        translations: { en: 'Accessories', ar: 'الإكسسوارات' }
      }
    ],
    count: 7000
  },
  {
    id: 2,
    translations: {
      en: 'Computers',
      ar: 'الحاسبات'
    },
    icon: Laptop,
    subCategories: [
      { 
        id: 2, 
        translations: { en: 'Laptops', ar: 'الحواسيب المحمولة' }
      },
      { 
        id: 1, 
        translations: { en: 'Desktops', ar: 'الحواسيب المكتبية' }
      },
      { 
        id: 6, 
        translations: { en: 'Components', ar: 'المكونات' }
      }
    ],
    count: 4000
  },
  {
    id: 3,
    translations: {
      en: 'Home',
      ar: 'المنزل'
    },
    icon: Home,
    subCategories: [
      { 
        id: 23, 
        translations: { en: 'Home Appliances', ar: 'الأجهزة المنزلية' }
      },
      { 
        id: 25, 
        translations: { en: 'Furniture', ar: 'الأثاث' }
      },
      { 
        id: 27, 
        translations: { en: 'Home Security', ar: 'الأمن المنزلي' }
      }
    ],
    count: 8000
  },
  {
    id: 4,
    translations: {
      en: 'Gaming',
      ar: 'الألعاب'
    },
    icon: Gamepad,
    subCategories: [
      { 
        id: 19, 
        translations: { en: 'Consoles', ar: 'أجهزة الألعاب' }
      },
      { 
        id: 22, 
        translations: { en: 'Games', ar: 'الألعاب' }
      },
      { 
        id: 21, 
        translations: { en: 'Accessories', ar: 'الإكسسوارات' }
      }
    ],
    count: 3100
  },
  {
    id: 5,
    translations: {
      en: 'Fashion',
      ar: 'الأزياء'
    },
    icon: Shirt,
    subCategories: [
      { 
        id: 28, 
        translations: { en: 'Clothing', ar: 'الملابس' }
      },
      { 
        id: 29, 
        translations: { en: 'Shoes', ar: 'الأحذية' }
      },
      { 
        id: 31, 
        translations: { en: 'Jewelry', ar: 'المجوهرات' }
      }
    ],
    count: 1600
  }
];

const PopularCategories = () => {
  const { language } = useLanguage();
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
    navigate(`/category/${subCategory.id}`);
    setSearchText('');
};

  const formatItemCount = (count) => {
    if (language === 'ar') {
      return `${count}+ منتج`;
    }
    return `${count}+ items`;
  };

  return (
    <div className={`popular-categories ${language === 'ar' ? 'rtl' : ''}`}>
      <div className="popular-categories-header">
        {selectedCategory ? (
          <div className="fade-content">
            <h2>{categories.find(c => c.id === selectedCategory)?.translations[language]}</h2>
            <p>
              {language === 'ar' 
                ? `اكتشف مجموعتنا من ${categories.find(c => c.id === selectedCategory)?.translations[language]} من أفضل الماركات بأسعار تنافسية`
                : `Explore our selection of ${categories.find(c => c.id === selectedCategory)?.translations[language].toLowerCase()} from top brands at competitive prices`
              }
            </p>
          </div>
        ) : (
          <div className="fade-content">
            <h2>{language === 'ar' ? 'الفئات الشائعة' : 'Popular Categories'}</h2>
            <p>{language === 'ar' ? 'تصفح المنتجات عبر الفئات' : 'Browse products across categories'}</p>
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
                <span className="popular-category-name">
                  {category.translations[language]}
                </span>
                <span className="popular-category-count">
                  {formatItemCount(category.count)}
                </span>
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
                    {subCategory.translations[language]}
                    <span className="popular-subcategory-arrow">
                      {language === 'ar' ? '←' : '→'}
                    </span>
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