function FilterTabs({ activeFilter, setActiveFilter }) {
  const filters = [
    { key: 'all', label: '📋 Все' },
    { key: 'not-started', label: '⏳ Не начато' },
    { key: 'in-progress', label: '🔄 В процессе' },
    { key: 'completed', label: '✅ Выполнено' }
  ];

  return (
    <div className="filter-tabs">
      {filters.map(filter => (
        <button
          key={filter.key}
          className={activeFilter === filter.key ? 'active' : ''}
          onClick={() => setActiveFilter(filter.key)}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}

export default FilterTabs;