import "../../style.css"
import SimpleImageSlider from "react-simple-image-slider";
import a1 from "../../assets/a1.jpg"
import a2 from "../../assets/a2.jpg"
import a3 from "../../assets/a3.jpg"
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