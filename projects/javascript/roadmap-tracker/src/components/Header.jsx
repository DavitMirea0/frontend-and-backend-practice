import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useRoadmap } from '../context/RoadmapContext';
import ProgressBar from './ProgressBar';

const Header = () => {
  const fileInputRef = useRef(null);
  const { roadmap, importRoadmap, exportRoadmap, error, clearError } = useRoadmap();

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        await importRoadmap(file);
      } catch (err) {
        console.error('Import error:', err);
      }
    }
    // Сбрасываем значение input для возможности повторной загрузки того же файла
    e.target.value = '';
  };

  return (
    <header className="header">
      <div className="header-content">
        <div className="header-top">
          <Link to="/">
            <h1>🎯 Tech Tracker</h1>
          </Link>
          <div className="header-controls">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json"
              className="file-input"
            />
            <button className="btn btn-primary" onClick={handleImportClick}>
              📁 Импорт
            </button>
            {roadmap && (
              <button className="btn btn-secondary" onClick={exportRoadmap}>
                💾 Экспорт
              </button>
            )}
          </div>
        </div>
        
        {error && (
          <div className="error-message">
            <span>⚠️ {error}</span>
            <button className="error-close" onClick={clearError}>×</button>
          </div>
        )}
        
        {roadmap && <ProgressBar />}
      </div>
    </header>
  );
};

export default Header;