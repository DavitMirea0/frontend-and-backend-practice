import React, { useState } from 'react';
import { useRoadmap } from '../context/RoadmapContext';
import TechnologySearch from '../components/TechnologySearch';

function Settings() {
  const { 
    roadmap, 
    importRoadmap, 
    exportRoadmap, 
    resetProgress, 
    resetAll 
  } = useRoadmap();
  
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  // Импорт файла
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      await importRoadmap(file);
      showMessage('✅ Файл успешно импортирован!', 'success');
    } catch (error) {
      showMessage(`❌ Ошибка: ${error.message}`, 'error');
    }
    e.target.value = '';
  };

  // Экспорт данных
  const handleExport = () => {
    if (!roadmap) {
      showMessage('❌ Нет данных для экспорта', 'error');
      return;
    }
    exportRoadmap();
    showMessage('✅ Файл экспортирован!', 'success');
  };

  // Сброс прогресса
  const handleResetProgress = () => {
    if (window.confirm('Сбросить весь прогресс?')) {
      resetProgress();
      showMessage('🔄 Прогресс сброшен', 'success');
    }
  };

  // Полный сброс
  const handleResetAll = () => {
    if (window.confirm('Удалить ВСЕ данные?')) {
      resetAll();
      showMessage('🗑️ Все данные удалены', 'success');
    }
  };

  return (
    <div className="page settings-page">
      <h1>⚙️ Настройки</h1>

      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Поиск технологий */}
      <TechnologySearch />

      {/* Импорт/Экспорт */}
      <section className="settings-section">
        <h2>📁 Управление данными</h2>
        
        <div className="settings-buttons">
          <label className="btn btn-primary">
            📥 Импорт JSON
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              style={{ display: 'none' }}
            />
          </label>

          <button 
            onClick={handleExport} 
            className="btn btn-secondary"
            disabled={!roadmap}
          >
            📤 Экспорт JSON
          </button>
        </div>
      </section>

      {/* Текущие данные */}
      {roadmap && (
        <section className="settings-section">
          <h2>📊 Текущая дорожная карта</h2>
          <p><strong>Название:</strong> {roadmap.title}</p>
          <p><strong>Элементов:</strong> {roadmap.items?.length || 0}</p>
        </section>
      )}

      {/* Опасная зона */}
      <section className="settings-section danger-zone">
        <h2>⚠️ Опасная зона</h2>
        
        <div className="danger-buttons">
          <button 
            onClick={handleResetProgress} 
            className="btn btn-warning"
            disabled={!roadmap}
          >
            🔄 Сбросить прогресс
          </button>
          
          <button 
            onClick={handleResetAll} 
            className="btn btn-danger"
          >
            🗑️ Удалить всё
          </button>
        </div>
      </section>
    </div>
  );
}

export default Settings;