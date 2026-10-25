import { useParams, Link } from 'react-router-dom';
import { useRoadmap } from '../context/RoadmapContext';
import ResourceLoader from '../components/ResourceLoader';

function ItemDetailPage() {
  const { techId } = useParams();
  const { getItemById, getItemProgress, updateItemStatus } = useRoadmap();

  const item = getItemById(techId);
  const progress = getItemProgress(techId);

  if (!item) {
    return (
      <div className="page">
        <h1>😕 Пункт не найден</h1>
        <p>Пункт с ID "{techId}" не существует.</p>
        <Link to="/" className="btn btn-primary">← На главную</Link>
      </div>
    );
  }

  const handleStatusChange = (newStatus) => {
    updateItemStatus(techId, newStatus);
  };

  return (
    <div className="page item-detail-page">
      <Link to="/" className="back-link">← Назад</Link>
      
      <h1>{item.title}</h1>
      <p className="item-description">{item.description}</p>

      {/* Статус */}
      <div className="status-section">
        <h3>📊 Статус изучения</h3>
        <div className="status-buttons">
          <button
            onClick={() => handleStatusChange('not-started')}
            className={`status-btn ${progress.status === 'not-started' ? 'active' : ''}`}
          >
            ⏳ Не начато
          </button>
          <button
            onClick={() => handleStatusChange('in-progress')}
            className={`status-btn ${progress.status === 'in-progress' ? 'active' : ''}`}
          >
            🔄 В процессе
          </button>
          <button
            onClick={() => handleStatusChange('completed')}
            className={`status-btn ${progress.status === 'completed' ? 'active' : ''}`}
          >
            ✅ Завершено
          </button>
        </div>
      </div>

      {/* Ресурсы из данных */}
      {item.resources && item.resources.length > 0 && (
        <div className="resources-section">
          <h3>📚 Ресурсы для изучения</h3>
          <ul className="resources-list">
            {item.resources.map((url, index) => (
              <li key={index}>
                <a href={url} target="_blank" rel="noopener noreferrer">
                  🔗 {url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Загрузка дополнительных ресурсов из API */}
      <div className="additional-resources">
        <h3>🌐 Дополнительные ресурсы</h3>
        <ResourceLoader technology={item} />
      </div>
    </div>
  );
}

export default ItemDetailPage;