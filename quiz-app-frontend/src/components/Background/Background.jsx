import { useEffect, useState } from "react";
import styles from './Background.module.css';

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
    <div className={styles.backgroundContainer}>
      {images.map((image, index) => (
        <img
          key={index}
          src={image}
          alt={`background-${index}`}
          className={`${styles.backgroundImage} ${index === currentIndex ? styles.active : ""}`}
        />
      ))}
    </div>
  );
}

export default Background;
