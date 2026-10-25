import { useState, useEffect } from 'react';

function WindowSizeTracker() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const getScreenType = () => {
    if (windowSize.width < 768) return 'мобильный';
    if (windowSize.width < 1024) return 'планшет';
    return 'десктоп';
  };

  return (
    <div className="window-tracker">
      <h2>📐 Отслеживание размера окна</h2>
      <div className="size-info">
        <p>Ширина: <strong>{windowSize.width}px</strong></p>
        <p>Высота: <strong>{windowSize.height}px</strong></p>
        <p>Тип экрана: <strong>{getScreenType()}</strong></p>
      </div>
    </div>
  );
}

export default WindowSizeTracker;