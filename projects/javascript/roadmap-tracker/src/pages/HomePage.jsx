import React from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import RoadmapCard from '../components/RoadmapCard';

const HomePage = () => {
  const { roadmap } = useRoadmap();

  if (!roadmap) {
    return (
      <div className="home-page">
        <div className="empty-state">
          <h2>👋 Добро пожаловать в Tech Tracker!</h2>
          <p>
            Загрузите JSON-файл с дорожной картой, чтобы начать отслеживать свой прогресс.
          </p>
          <p style={{ fontSize: '14px', color: '#999', marginTop: '20px' }}>
            Нажмите кнопку "Импорт" в шапке приложения
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-page">
      <div className="roadmap-info">
        <h2>{roadmap.title}</h2>
        {roadmap.description && <p>{roadmap.description}</p>}
      </div>
      
      <div className="cards-grid">
        {roadmap.items.map(item => (
          <RoadmapCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default HomePage;