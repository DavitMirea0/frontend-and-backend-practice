import { useState } from 'react';
import Modal from './Modal';

function TechnologyCard({ technology, onStatusChange, onNotesChange }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const statusCycle = {
    'not-started': 'in-progress',
    'in-progress': 'completed',
    'completed': 'not-started'
  };

  const statusLabels = {
    'not-started': '⏳ Не начато',
    'in-progress': '🔄 В процессе',
    'completed': '✅ Выполнено'
  };

  const statusColors = {
    'not-started': '#ff6b6b',
    'in-progress': '#ffa500',
    'completed': '#4ecdc4'
  };

  const handleStatusClick = (e) => {
    e.stopPropagation();
    const newStatus = statusCycle[technology.status];
    onStatusChange(technology.id, newStatus);
  };

  return (
    <>
      <div 
        className={`technology-card status-${technology.status}`}
        onClick={() => setIsModalOpen(true)}
      >
        <div className="card-header">
          <h3>{technology.title}</h3>
          <span 
            className="status-badge"
            onClick={handleStatusClick}
            style={{ backgroundColor: statusColors[technology.status] + '20', color: statusColors[technology.status] }}
          >
            {statusLabels[technology.status]}
          </span>
        </div>
        <p className="card-description">{technology.description}</p>
        <div className="card-footer">
          <span className="card-category">#{technology.category}</span>
          {technology.notes && <span className="has-notes">📝</span>}
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={technology.title}
      >
        <div className="tech-modal-content">
          <p className="tech-description">{technology.description}</p>
          
          <div className="tech-status-section">
            <label>Статус:</label>
            <div className="status-buttons">
              {Object.entries(statusLabels).map(([status, label]) => (
                <button
                  key={status}
                  className={`status-btn ${technology.status === status ? 'active' : ''}`}
                  onClick={() => onStatusChange(technology.id, status)}
                  style={{
                    borderColor: statusColors[status],
                    backgroundColor: technology.status === status ? statusColors[status] : 'white',
                    color: technology.status === status ? 'white' : statusColors[status]
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="tech-notes-section">
            <label>Мои заметки:</label>
            <textarea
              value={technology.notes || ''}
              onChange={(e) => onNotesChange(technology.id, e.target.value)}
              placeholder="Записывайте важные моменты..."
              rows="4"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}

export default TechnologyCard;