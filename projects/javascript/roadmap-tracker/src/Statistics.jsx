function Statistics({ technologies }) {
  const notStarted = technologies.filter(t => t.status === 'not-started').length;
  const inProgress = technologies.filter(t => t.status === 'in-progress').length;
  const completed = technologies.filter(t => t.status === 'completed').length;
  const total = technologies.length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="statistics">
      <h2>📊 Статистика</h2>
      <div className="stats-grid">
        <div className="stat-item">
          <span className="stat-number">{notStarted}</span>
          <span className="stat-label">Не начато</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{inProgress}</span>
          <span className="stat-label">В процессе</span>
        </div>
        <div className="stat-item">
          <span className="stat-number">{completed}</span>
          <span className="stat-label">Выполнено</span>
        </div>
      </div>
      <div className="progress-bar">
        <div 
          className="progress-fill" 
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="progress-text">Прогресс: {percentage}%</p>
    </div>
  );
}

export default Statistics;