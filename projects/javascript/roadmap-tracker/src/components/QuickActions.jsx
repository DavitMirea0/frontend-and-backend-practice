import { useState } from 'react';
import Modal from './Modal';

function QuickActions({ onMarkAllCompleted, onResetAll, technologies }) {
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportData, setExportData] = useState('');

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      technologies: technologies
    };
    const dataStr = JSON.stringify(data, null, 2);
    setExportData(dataStr);
    setShowExportModal(true);
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tech-tracker-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(exportData);
    alert('Данные скопированы в буфер обмена!');
  };

  return (
    <div className="quick-actions">
      <h3>⚡ Быстрые действия</h3>
      <div className="action-buttons">
        <button onClick={onMarkAllCompleted} className="btn btn-success">
          ✅ Отметить все как выполненные
        </button>
        <button onClick={onResetAll} className="btn btn-warning">
          🔄 Сбросить все статусы
        </button>
        <button onClick={handleExport} className="btn btn-info">
          📤 Экспорт данных
        </button>
      </div>

      <Modal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        title="📤 Экспорт данных"
      >
        <div className="export-modal-content">
          <p>Данные готовы для экспорта!</p>
          <textarea 
            readOnly 
            value={exportData} 
            rows="10"
            className="export-textarea"
          />
          <div className="export-buttons">
            <button onClick={handleDownload} className="btn btn-success">
              💾 Скачать файл
            </button>
            <button onClick={handleCopyToClipboard} className="btn btn-info">
              📋 Копировать
            </button>
            <button onClick={() => setShowExportModal(false)} className="btn btn-secondary">
              Закрыть
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default QuickActions;