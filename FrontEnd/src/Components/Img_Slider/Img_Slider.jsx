import "./Img_Slider.css"
import SimpleImageSlider from "react-simple-image-slider";

import a6 from "../../assets/a6.jpg"
import a5 from "../../assets/a5.jpg"


const images = [
  { url:a5 },
  { url:a6 }


];

const Img_Slider = () => {
  return (
    <div className="SLIDER">
      <SimpleImageSlider
        width={1920}
        height={404}
        images={images}
        showBullets={false}
        showNavs={true}
        navStyle={2}
        autoPlay={true}
      />
    </div>
  );
}

export default Img_Slider