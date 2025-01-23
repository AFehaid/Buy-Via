import "../style.css"
import ImageSlider from "../Components/Img_Slider/Img_Slider"
import SimpleImageSlider from "react-simple-image-slider";
import SearchResults from "./SearchResults";
import HorizontalScrollView from "../Components/HorizontalScrollView/HorizontalScrollView";
import PopularCategories from "../Components/PopularCategories/PopularCategories";
import a6 from "../assets/a6.jpg"
import a5 from "../assets/a5.jpg"
import UserRecommendations from "../Components/HorizontalScrollView/UserRecommendations";
import { useAuth } from "../contexts/AuthProvider";
import { useLanguage } from "../contexts/LanguageContext";

const Home = () => {
  const { isLoggedIn } = useAuth();
  const { t } = useLanguage();

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

  const images = [
    { url: a5 },
    { url: a6 },
  ];

  return (
    <main>
      <ImageSlider images={images} autoPlayInterval={5000} />

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
}

export default Home;