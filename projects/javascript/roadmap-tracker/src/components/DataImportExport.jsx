import { useState } from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import './DataImportExport.css';

function DataImportExport() {
  const { 
    roadmap, 
    userProgress,
    importRoadmap, 
    exportRoadmap,
    resetProgress,
    resetAll,
    getItemProgress
  } = useRoadmap();
  
  const [status, setStatus] = useState('');

  // Получаем массив items
  const items = roadmap?.items || [];

  // Обработчик экспорта (использует функцию из контекста)
  const handleExport = () => {
    exportRoadmap();
    setStatus(`✅ Экспортировано ${items.length} технологий`);
  };

  // Обработчик импорта
  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      await importRoadmap(file);
      setStatus('✅ Данные успешно импортированы!');
    } catch (error) {
      setStatus(`❌ Ошибка импорта: ${error.message}`);
    }

    event.target.value = '';
  };

  // Сброс прогресса
  const handleResetProgress = () => {
    if (window.confirm('Сбросить весь прогресс? Технологии останутся.')) {
      resetProgress();
      setStatus('🔄 Прогресс сброшен');
    }
  };

  // Сброс всего
  const handleResetAll = () => {
    if (window.confirm('Удалить ВСЕ данные и вернуть настройки по умолчанию?')) {
      resetAll();
      setStatus('🗑️ Все данные сброшены');
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      'completed': '✅ Завершено',
      'in-progress': '🔄 В процессе',
      'not-started': '⏳ Не начато'
    };
    return labels[status] || labels['not-started'];
  };

  const getStatusColor = (status) => {
    const colors = {
      'completed': '#27ae60',
      'in-progress': '#f39c12',
      'not-started': '#e74c3c'
    };
    return colors[status] || colors['not-started'];
  };

  // Статистика
  const stats = {
    total: items.length,
    completed: items.filter(item => getItemProgress(item.id).status === 'completed').length,
    inProgress: items.filter(item => getItemProgress(item.id).status === 'in-progress').length,
    notStarted: items.filter(item => {
      const s = getItemProgress(item.id).status;
      return s === 'not-started' || !s;
    }).length
  };

  return (
    <div className="data-import-export">
      <h2>📁 Импорт/Экспорт данных</h2>
      
      {roadmap && (
        <p className="roadmap-title">📋 {roadmap.title}</p>
      )}

      {/* Статус */}
      {status && (
        <div className={`status-message ${status.includes('❌') ? 'error' : 'success'}`}>
          {status}
        </div>
      )}

      {/* Управление данными */}
      <div className="actions-bar">
        <button
          onClick={handleExport}
          disabled={items.length === 0}
          className="btn btn-export"
        >
          📥 Экспорт ({items.length})
        </button>

        <label className="btn btn-import">
          📤 Импорт JSON
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
        </label>

        <button
          onClick={handleResetProgress}
          disabled={items.length === 0}
          className="btn btn-reset"
        >
          🔄 Сбросить прогресс
        </button>

        <button
          onClick={handleResetAll}
          className="btn btn-clear"
        >
          🗑️ Сбросить всё
        </button>
      </div>

      {/* Список технологий */}
      <div className="tech-list">
        <h3>Технологии ({items.length})</h3>

        {items.length === 0 ? (
          <p className="empty-message">
            Технологий пока нет. Импортируйте JSON файл.
          </p>
        ) : (
          <div className="tech-grid">
            {items.map(item => {
              const progress = getItemProgress(item.id);
              return (
                <div key={item.id} className="tech-card">
                  <div className="tech-card-header">
                    <h4>{item.title}</h4>
                    <span className="tech-id">ID: {item.id}</span>
                  </div>
                  <p>{item.description || 'Нет описания'}</p>
                  
                  {progress.note && (
                    <p className="tech-note">📝 {progress.note}</p>
                  )}
                  
                  {progress.deadline && (
                    <p className="tech-deadline">
                      📅 {new Date(progress.deadline).toLocaleDateString('ru-RU')}
                    </p>
                  )}
                  
                  <span
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(progress.status) }}
                  >
                    {getStatusLabel(progress.status)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Статистика */}
      {items.length > 0 && (
        <div className="statistics">
          <h3>📊 Статистика:</h3>
          <div className="stats-grid">
            <div className="stat">Всего: <strong>{stats.total}</strong></div>
            <div className="stat">Завершено: <strong>{stats.completed}</strong></div>
            <div className="stat">В процессе: <strong>{stats.inProgress}</strong></div>
            <div className="stat">Не начато: <strong>{stats.notStarted}</strong></div>
          </div>
        </div>
      )}

      {/* Пример JSON для импорта */}
      <div className="import-help">
        <h4>📋 Формат JSON для импорта:</h4>
        <pre>{`{
  "title": "My Roadmap",
  "description": "Описание",
  "items": [
    {
      "id": "unique-id",
      "title": "Название",
      "description": "Описание",
      "resources": ["https://..."]
    }
  ]
}`}</pre>
      </div>
    </div>
  );
}

export default DataImportExport;