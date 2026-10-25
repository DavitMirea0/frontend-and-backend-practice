import { useState } from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import TechnologyForm from './TechnologyForm';
import './TechnologyManager.css';

function TechnologyManager() {
  const { 
    roadmap, 
    userProgress, 
    updateItemStatus,
    getItemProgress 
  } = useRoadmap();
  
  const [showForm, setShowForm] = useState(false);
  const [editingTech, setEditingTech] = useState(null);

  // Получаем массив items из roadmap
  const items = roadmap?.items || [];

  // Обработчик сохранения технологии (пока локально, без изменения контекста)
  const handleSaveTechnology = (techData) => {
    console.log('Сохранение технологии:', techData);
    // TODO: добавить функцию addItem в контекст если нужно
    setShowForm(false);
    setEditingTech(null);
  };

  // Обработчик редактирования
  const handleEdit = (technology) => {
    setEditingTech(technology);
    setShowForm(true);
  };

  // Обработчик отмены
  const handleCancel = () => {
    setShowForm(false);
    setEditingTech(null);
  };

  // Изменение статуса
  const toggleStatus = (itemId) => {
    const currentProgress = getItemProgress(itemId);
    const statuses = ['not-started', 'in-progress', 'completed'];
    const currentIndex = statuses.indexOf(currentProgress.status || 'not-started');
    const nextStatus = statuses[(currentIndex + 1) % statuses.length];
    updateItemStatus(itemId, nextStatus);
  };

  const getStatusInfo = (status) => {
    const statusMap = {
      'not-started': { label: '⏳ Не начато', color: '#e74c3c' },
      'in-progress': { label: '🔄 В процессе', color: '#f39c12' },
      'completed': { label: '✅ Завершено', color: '#27ae60' }
    };
    return statusMap[status] || statusMap['not-started'];
  };

  // Статистика
  const stats = {
    total: items.length,
    completed: items.filter(item => getItemProgress(item.id).status === 'completed').length,
    inProgress: items.filter(item => getItemProgress(item.id).status === 'in-progress').length,
    notStarted: items.filter(item => {
      const status = getItemProgress(item.id).status;
      return status === 'not-started' || !status;
    }).length
  };

  return (
    <div className="technology-manager">
      <div className="manager-header">
        <h2>🎯 Управление технологиями</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary"
        >
          + Добавить технологию
        </button>
      </div>

      {/* Статистика */}
      {items.length > 0 && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Всего</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Завершено</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">В процессе</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.notStarted}</span>
            <span className="stat-label">Не начато</span>
          </div>
        </div>
      )}

      {/* Список технологий */}
      <div className="technologies-list">
        {items.length === 0 ? (
          <div className="empty-state">
            <p>📚 Технологий пока нет</p>
            <p>Добавьте первую технологию для изучения!</p>
          </div>
        ) : (
          items.map(item => {
            const progress = getItemProgress(item.id);
            const statusInfo = getStatusInfo(progress.status);
            
            return (
              <div key={item.id} className="technology-item">
                <div className="tech-header">
                  <h3>{item.title}</h3>
                </div>
                <p className="tech-description">
                  {item.description || 'Нет описания'}
                </p>

                {progress.deadline && (
                  <p className="tech-deadline">
                    📅 Дедлайн: {new Date(progress.deadline).toLocaleDateString('ru-RU')}
                  </p>
                )}

                {item.resources && item.resources.length > 0 && (
                  <div className="tech-resources">
                    {item.resources.slice(0, 3).map((url, idx) => (
                      <a key={idx} href={url} target="_blank" rel="noopener noreferrer">
                        🔗 Ресурс {idx + 1}
                      </a>
                    ))}
                  </div>
                )}

                {progress.note && (
                  <p className="tech-note">📝 {progress.note}</p>
                )}

                <div className="tech-actions">
                  <button
                    onClick={() => toggleStatus(item.id)}
                    className="status-btn"
                    style={{ backgroundColor: statusInfo.color }}
                  >
                    {statusInfo.label}
                  </button>
                  <button onClick={() => handleEdit(item)} className="edit-btn">
                    ✏️ Редактировать
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Модальное окно с формой */}
      {showForm && (
        <div className="form-modal">
          <div className="modal-overlay" onClick={handleCancel}></div>
          <div className="modal-content">
            <TechnologyForm
              onSave={handleSaveTechnology}
              onCancel={handleCancel}
              initialData={editingTech || {}}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default TechnologyManager;