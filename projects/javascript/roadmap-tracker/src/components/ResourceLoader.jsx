import React, { useState } from 'react';
import useApi from '../hooks/useApi';

function ResourceLoader({ technology }) {
  const [showResources, setShowResources] = useState(false);
  
  // Загружаем дополнительные ресурсы из API
  const { data, loading, error, refetch } = useApi(
    showResources 
      ? `https://api.github.com/search/repositories?q=${encodeURIComponent(technology.title)}+in:name&sort=stars&per_page=5`
      : null
  );

  const handleToggle = () => {
    setShowResources(!showResources);
  };

  return (
    <div className="resource-loader">
      <button 
        onClick={handleToggle}
        className="btn btn-secondary"
      >
        {showResources ? '🔼 Скрыть ресурсы' : '🔽 Загрузить ресурсы из GitHub'}
      </button>

      {showResources && (
        <div className="resources-content">
          {loading && <p>⏳ Загрузка ресурсов...</p>}
          
          {error && (
            <div className="error">
              <p>❌ {error}</p>
              <button onClick={refetch}>Повторить</button>
            </div>
          )}

          {data?.items && (
            <ul className="resources-list">
              {data.items.map(repo => (
                <li key={repo.id}>
                  <a 
                    href={repo.html_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    📦 {repo.full_name}
                  </a>
                  <span className="stars">⭐ {repo.stargazers_count}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default ResourceLoader;