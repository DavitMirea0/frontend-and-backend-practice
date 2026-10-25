import React from 'react';
import { Link } from 'react-router-dom';
import { useRoadmap } from '../context/RoadmapContext';

const RoadmapCard = ({ item }) => {
  const { getItemProgress } = useRoadmap();
  const progress = getItemProgress(item.id);

  const statusLabels = {
    'not-started': 'Не начато',
    'in-progress': 'В работе',
    'completed': 'Выполнено'
  };

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short'
    });
  };

  const isOverdue = () => {
    if (!progress.deadline || progress.status === 'completed') return false;
    return new Date(progress.deadline) < new Date();
  };

  return (
    <Link to={`/item/${item.id}`}>
      <div className={`roadmap-card status-${progress.status}`}>
        <div className="card-header">
          <h3>{item.title}</h3>
          <span className={`status-badge ${progress.status}`}>
            {statusLabels[progress.status]}
          </span>
        </div>
        
        {item.description && (
          <p className="card-description">{item.description}</p>
        )}
        
        <div className="card-footer">
          {progress.deadline && (
            <span className={`deadline ${isOverdue() ? 'overdue' : ''}`}>
              📅 {formatDate(progress.deadline)}
              {isOverdue() && ' (просрочено)'}
            </span>
          )}
          {progress.note && (
            <span className="note-indicator">📝 Есть заметка</span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default RoadmapCard;