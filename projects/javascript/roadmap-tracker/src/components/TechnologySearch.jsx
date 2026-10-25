import React, { useState } from 'react';
// Удалили useRoadmap - не используется
import { useTechnologiesApi } from '../hooks/useTechnologiesApi';
import './TechnologySearch.css';

function TechnologySearch() {
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Удалили roadmap и addTechnologyToRoadmap - не используются
  const { 
    searchResults, 
    searching, 
    error, 
    handleSearch, 
    clearSearch 
  } = useTechnologiesApi();

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleClear = () => {
    setSearchTerm('');
    clearSearch();
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const handleAddTechnology = (tech) => {
    showMessage(`Технология "${tech.title}" готова к добавлению!`, 'success');
  };

  return (
    <div className="technology-search">
      <h3>🔍 Поиск технологий</h3>
      
      <div className="search-box">
        <input
          type="text"
          placeholder="Введите название технологии..."
          value={searchTerm}
          onChange={handleInputChange}
          className="search-input"
        />
        {searchTerm && (
          <button onClick={handleClear} className="clear-btn">✕</button>
        )}
        {searching && <span className="search-spinner">⏳</span>}
      </div>

      {message.text && (
        <div className={`search-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {error && <div className="search-error">❌ {error}</div>}

      <div className="search-results">
        {searchResults.length > 0 ? (
          <>
            <p className="results-count">Найдено: {searchResults.length}</p>
            <div className="results-grid">
              {searchResults.map(tech => (
                <div key={tech.id} className="result-card">
                  <div className="result-header">
                    <h4>{tech.title}</h4>
                    {tech.language && (
                      <span className="tech-language">{tech.language}</span>
                    )}
                  </div>
                  <p className="result-description">
                    {tech.description?.substring(0, 100)}
                    {tech.description?.length > 100 ? '...' : ''}
                  </p>
                  <div className="result-footer">
                    <span className="stars">⭐ {tech.stars?.toLocaleString()}</span>
                    <div className="result-actions">
                      <a 
                        href={tech.resources?.[0]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="btn-link"
                      >
                        Открыть
                      </a>
                      <button 
                        onClick={() => handleAddTechnology(tech)}
                        className="btn-add"
                      >
                        + Добавить
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          searchTerm && !searching && <p className="no-results">Ничего не найдено</p>
        )}
      </div>
    </div>
  );
}

export default TechnologySearch;