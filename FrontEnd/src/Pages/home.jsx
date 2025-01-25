import "../style.css"
import ImageSlider from "../Components/Img_Slider/Img_Slider"
import SimpleImageSlider from "react-simple-image-slider";
import SearchResults from "./SearchResults";
import HorizontalScrollView from "../Components/HorizontalScrollView/HorizontalScrollView";
import PopularCategories from "../Components/PopularCategories/PopularCategories";
import React from "react";
import { useNavigate } from "react-router-dom";
import Iphone_Ad_EN from "../assets/iphone_ad_english.png"
import Iphone_Ad_AR from "../assets/iphone_ad_arabic.png"
import Laptop_Ad_EN from "../assets/laptop_ad_english.png"
import Laptop_Ad_AR from "../assets/laptop_ad_arabic.png"
import Galaxy_Ad_EN from "../assets/galaxy_ad_english.png"
import Galaxy_Ad_AR from "../assets/galaxy_ad_arabic.png"
import Iphone_Ad_Mobile_EN from "../assets/Iphone_Ad_Mobile_EN.png"
import Iphone_Ad_Mobile_AR from "../assets/Iphone_Ad_Mobile_AR.png"
import Laptop_Ad_Mobile_EN from "../assets/Laptop_Ad_Mobile_EN.png"
import Laptop_Ad_Mobile_AR from "../assets/Laptop_Ad_Mobile_AR.png"
import Galaxy_Ad_Mobile_EN from "../assets/Galaxy_Ad_Mobile_EN.png"
import Galaxy_Ad_Mobile_AR from "../assets/Galaxy_Ad_Mobile_AR.png"
import UserRecommendations from "../Components/HorizontalScrollView/UserRecommendations";
import { useAuth } from "../contexts/AuthProvider";
import { useLanguage } from "../contexts/LanguageContext";

const Home = () => {
  const { isLoggedIn } = useAuth();
  const { t, language } = useLanguage();

  const sectionTitles = {
    iphone: {
      prompt: "Apple Iphone",
      displayTitle: t('sections.iphone', 'Apple iPhone') 
    },
    samsung: {
      prompt: "Samsung Galaxy",
      displayTitle: t('sections.samsung', 'Samsung Galaxy')
    },
    huawei: {
      prompt: "huawei laptop",
      displayTitle: t('sections.huawei', 'Huawei Laptops')
    }
  };

  const adImages = {
    en: {
      desktop: [
        { url: Iphone_Ad_EN },
        { url: Laptop_Ad_EN },
        { url: Galaxy_Ad_EN },
      ],
      mobile: [
        { url: Iphone_Ad_Mobile_EN }, 
        { url: Laptop_Ad_Mobile_EN },
        { url: Galaxy_Ad_Mobile_EN },
      ]
    },
    ar: {
      desktop: [
        { url: Iphone_Ad_AR },
        { url: Laptop_Ad_AR }, 
        { url: Galaxy_Ad_AR },
      ],
      mobile: [
        { url: Iphone_Ad_Mobile_AR }, 
        { url: Laptop_Ad_Mobile_AR },
        { url: Galaxy_Ad_Mobile_AR },
      ]
    }
  };

  const currentLanguageImages = adImages[language] || adImages.en;

  return (
    <main>
      <ImageSlider 
        desktopImages={currentLanguageImages.desktop}
        mobileImages={currentLanguageImages.mobile}
        autoPlayInterval={5000} 
      />
      
      <PopularCategories />
      {isLoggedIn && <UserRecommendations />}
      
      <HorizontalScrollView 
        prompt={sectionTitles.iphone.prompt} 
        displayTitle={sectionTitles.iphone.displayTitle}
      />
      <HorizontalScrollView 
        prompt={sectionTitles.samsung.prompt} 
        displayTitle={sectionTitles.samsung.displayTitle}
      />
      <HorizontalScrollView 
        prompt={sectionTitles.huawei.prompt} 
        displayTitle={sectionTitles.huawei.displayTitle}
      />
    </main>
  );
};

export default Home