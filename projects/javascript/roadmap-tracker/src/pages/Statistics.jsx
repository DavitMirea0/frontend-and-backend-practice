import React from 'react';
import { Link } from 'react-router-dom';
import { useRoadmap } from '../context/RoadmapContext';

function Statistics() {
  const { roadmap, userProgress, getStatistics, calculateProgress } = useRoadmap();

  if (!roadmap) {
    return (
      <div className="page">
        <h1>📊 Статистика</h1>
        <p>Нет данных для отображения</p>
      </div>
    );
  }

  const stats = getStatistics();
  const progress = calculateProgress();

  // Группируем элементы по статусу
  const itemsByStatus = {
    'not-started': [],
    'in-progress': [],
    'completed': []
  };

  roadmap.items.forEach(item => {
    const status = userProgress[item.id]?.status || 'not-started';
    itemsByStatus[status].push(item);
  });

  return (
    <div className="page statistics-page">
      <h1>📊 Статистика</h1>

      {/* Общий прогресс */}
      <div className="progress-section">
        <h2>Общий прогресс: {progress}%</h2>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* Карточки статистики */}
      <div className="stats-cards">
        <div className="stat-card">
          <span className="stat-number">{stats.total}</span>
          <span className="stat-label">Всего</span>
        </div>
        <div className="stat-card not-started">
          <span className="stat-number">{stats.notStarted}</span>
          <span className="stat-label">Не начато</span>
        </div>
        <div className="stat-card in-progress">
          <span className="stat-number">{stats.inProgress}</span>
          <span className="stat-label">В процессе</span>
        </div>
        <div className="stat-card completed">
          <span className="stat-number">{stats.completed}</span>
          <span className="stat-label">Завершено</span>
        </div>
      </div>

      {/* Списки по статусам */}
      <div className="status-sections">
        {/* В процессе */}
        <div className="status-section">
          <h3>🔄 В процессе ({itemsByStatus['in-progress'].length})</h3>
          <ul>
            {itemsByStatus['in-progress'].map(item => (
              <li key={item.id}>
                <Link to={`/item/${item.id}`}>{item.title}</Link>
              </li>
            ))}
            {itemsByStatus['in-progress'].length === 0 && (
              <li className="empty">Нет элементов</li>
            )}
          </ul>
        </div>

        {/* Не начато */}
        <div className="status-section">
          <h3>⏳ Не начато ({itemsByStatus['not-started'].length})</h3>
          <ul>
            {itemsByStatus['not-started'].map(item => (
              <li key={item.id}>
                <Link to={`/item/${item.id}`}>{item.title}</Link>
              </li>
            ))}
            {itemsByStatus['not-started'].length === 0 && (
              <li className="empty">Нет элементов</li>
            )}
          </ul>
        </div>

        {/* Завершено */}
        <div className="status-section">
          <h3>✅ Завершено ({itemsByStatus['completed'].length})</h3>
          <ul>
            {itemsByStatus['completed'].map(item => (
              <li key={item.id}>
                <Link to={`/item/${item.id}`}>{item.title}</Link>
              </li>
            ))}
            {itemsByStatus['completed'].length === 0 && (
              <li className="empty">Нет элементов</li>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Statistics;