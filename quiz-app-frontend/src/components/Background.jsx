import { useEffect, useState } from "react";

const images = ["/Logo1.png", "/Logo2.png", "/Logo3.png", "/Logo4.png"];

function Background() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="background-container">
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`background-${index}`}
          className={`background-image ${index === currentIndex ? "active" : ""}`}
        />
      ))}
    </div>
  );
}

export default Background;
