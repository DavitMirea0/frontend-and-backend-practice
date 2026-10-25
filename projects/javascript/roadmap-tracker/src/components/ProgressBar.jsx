function ProgressBar({ 
  progress,
  label = '',
  color = '#4CAF50',
  height = 20,
  showPercentage = true,
  animated = false
}) {
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className="progress-bar-container">
      {(label || showPercentage) && (
        <div className="progress-bar-header">
          {label && <span className="progress-label">{label}</span>}
          {showPercentage && (
            <span className="progress-percentage">{normalizedProgress}%</span>
          )}
        </div>
      )}

      <div
        className="progress-bar-outer"
        style={{
          height: `${height}px`,
          backgroundColor: '#e0e0e0',
          borderRadius: `${height / 2}px`,
          overflow: 'hidden'
        }}
      >
        <div
          className={`progress-bar-inner ${animated ? 'animated' : ''}`}
          style={{
            width: `${normalizedProgress}%`,
            backgroundColor: color,
            height: '100%',
            transition: animated ? 'width 0.5s ease-in-out' : 'none',
            borderRadius: `${height / 2}px`
          }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;