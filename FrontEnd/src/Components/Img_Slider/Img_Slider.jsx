import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './Img_Slider.css';

const ImageSlider = ({ desktopImages = [], mobileImages = [], autoPlayInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isRTL, setIsRTL] = useState(false);
  const [loadedImages, setLoadedImages] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const navigate = useNavigate();

  const redirectLinks = {
    0: "/search?query=Apple Iphone 16", // iPhone image
    1: "/category/2",                    // Laptop image
    2: "/search?query=Galaxy S24 Ultra"  // Galaxy image
  };

  const handleImageClick = () => {
    const redirectPath = redirectLinks[currentIndex];
    if (redirectPath) {
      navigate(redirectPath);
    }
  };
  // Check for mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    // Check if the document or parent element is RTL
    setIsRTL(document.dir === 'rtl' || document.documentElement.dir === 'rtl');

    const preloadImages = async () => {
      try {
        // Use mobile images if available and on mobile, otherwise fall back to desktop images
        const imagesToLoad = isMobile && mobileImages.length > 0 ? mobileImages : desktopImages;

        // Ensure we have valid images to load
        if (!Array.isArray(imagesToLoad) || imagesToLoad.length === 0) {
          console.warn('No valid images provided to ImageSlider');
          setLoadedImages([]);
          return;
        }

        const loadPromises = imagesToLoad.map((image) => {
          if (!image || !image.url) {
            console.warn('Invalid image object:', image);
            return Promise.resolve(null);
          }

          return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(image.url);
            img.onerror = () => {
              console.warn(`Failed to load image: ${image.url}`);
              resolve(null);
            };
            img.src = image.url;
          });
        });

        const loaded = await Promise.all(loadPromises);
        const validImages = loaded.filter(url => url !== null);
        
        if (validImages.length === 0) {
          console.warn('No images were successfully loaded');
        }
        
        setLoadedImages(validImages);
      } catch (error) {
        console.error('Error loading images:', error);
        setLoadedImages([]);
      }
    };

    preloadImages();
  }, [desktopImages, mobileImages, isMobile]);

  const nextSlide = useCallback(() => {
    setCurrentIndex(prevIndex => 
      prevIndex >= loadedImages.length - 1 ? 0 : prevIndex + 1
    );
  }, [loadedImages.length]);

  const prevSlide = useCallback(() => {
    setCurrentIndex(prevIndex => 
      prevIndex <= 0 ? loadedImages.length - 1 : prevIndex - 1
    );
  }, [loadedImages.length]);

  useEffect(() => {
    let timer;
    if (!isPaused && loadedImages.length > 1) {
      timer = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);
    }
    return () => clearInterval(timer);
  }, [nextSlide, autoPlayInterval, isPaused, loadedImages.length]);

  const handleTouchStart = (e) => {
    setIsPaused(true);
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isRTL) {
      if (isLeftSwipe) prevSlide();
      else if (isRightSwipe) nextSlide();
    } else {
      if (isLeftSwipe) nextSlide();
      else if (isRightSwipe) prevSlide();
    }

    setTouchStart(0);
    setTouchEnd(0);
    setTimeout(() => setIsPaused(false), 1000);
  };

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  if (!loadedImages.length) {
    return <div className="slideshow">Loading...</div>;
  }

  // Calculate transform based on RTL
  const getSliderTransform = () => {
    const translationValue = currentIndex * 100;
    return isRTL 
      ? `translate3d(${translationValue}%, 0, 0)`
      : `translate3d(${-translationValue}%, 0, 0)`;
  };

  return (
    <div 
      className={`slideshow ${isRTL ? 'rtl' : 'ltr'}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="slideshowSlider"
        style={{ transform: getSliderTransform() }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {loadedImages.map((imageUrl, idx) => (
          <div 
            key={idx} 
            className="slide-container cursor-pointer"
            onClick={handleImageClick}
            style={{ width: '100%', height: '100%' }}
          >
            <img
              className="slide"
              src={imageUrl}
              alt={`Slide ${idx + 1}`}
              style={{ pointerEvents: 'none' }} // Prevents img from interfering with click
            />
          </div>
        ))}
      </div>

      {loadedImages.length > 1 && (
        <>
          <button
            className={`navButton ${isRTL ? 'nextButton' : 'prevButton'}`}
            onClick={prevSlide}
            aria-label="Previous slide"
          >
            ‹
          </button>
          <button
            className={`navButton ${isRTL ? 'prevButton' : 'nextButton'}`}
            onClick={nextSlide}
            aria-label="Next slide"
          >
            ›
          </button>

          <div className="slideshowDots">
            {loadedImages.map((_, idx) => (
              <div
                key={idx}
                className={`slideshowDot ${idx === currentIndex ? "active" : ""}`}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsPaused(true);
                  setTimeout(() => setIsPaused(false), 5000);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ImageSlider;