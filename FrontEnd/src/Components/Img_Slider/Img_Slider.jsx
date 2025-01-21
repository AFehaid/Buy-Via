import React, { useState, useEffect, useCallback } from 'react';
import './Img_Slider.css';

const ImageSlider = ({ images, autoPlayInterval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const [isRTL, setIsRTL] = useState(false);
  const [loadedImages, setLoadedImages] = useState([]);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    // Check if the document or parent element is RTL
    setIsRTL(document.dir === 'rtl' || document.documentElement.dir === 'rtl');

    const preloadImages = async () => {
      const loadPromises = images.map((image) => {
        return new Promise((resolve) => {
          const img = new Image();
          img.onload = () => resolve(image.url);
          img.onerror = () => resolve(null);
          img.src = image.url;
        });
      });

      const loaded = await Promise.all(loadPromises);
      setLoadedImages(loaded.filter(url => url !== null));
    };

    preloadImages();
  }, [images]);

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
    if (!isPaused) {
      timer = setInterval(() => {
        nextSlide();
      }, autoPlayInterval);
    }
    return () => clearInterval(timer);
  }, [nextSlide, autoPlayInterval, isPaused]);

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
          <img
            className="slide"
            key={idx}
            src={imageUrl}
            alt={`Slide ${idx + 1}`}
          />
        ))}
      </div>

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
    </div>
  );
};

export default ImageSlider;