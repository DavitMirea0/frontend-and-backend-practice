import useLocalStorage from './useLocalStorage';

const initialTechnologies = [
  { 
    id: 1, 
    title: 'React Components', 
    description: 'Изучение базовых компонентов', 
    status: 'not-started',
    notes: '',
    category: 'frontend'
  },
  { 
    id: 2, 
    title: 'useState Hook', 
    description: 'Работа с состоянием компонентов', 
    status: 'not-started',
    notes: '',
    category: 'frontend'
  },
  { 
    id: 3, 
    title: 'useEffect Hook', 
    description: 'Побочные эффекты и жизненный цикл', 
    status: 'not-started',
    notes: '',
    category: 'frontend'
  },
  { 
    id: 4, 
    title: 'Node.js Basics', 
    description: 'Основы серверного JavaScript', 
    status: 'not-started',
    notes: '',
    category: 'backend'
  },
  { 
    id: 5, 
    title: 'Custom Hooks', 
    description: 'Создание собственных хуков', 
    status: 'not-started',
    notes: '',
    category: 'frontend'
  },
  { 
    id: 6, 
    title: 'REST API', 
    description: 'Работа с REST API', 
    status: 'not-started',
    notes: '',
    category: 'backend'
  }
];

function useTechnologies() {
  const [technologies, setTechnologies] = useLocalStorage('technologies', initialTechnologies);

  const updateStatus = (techId, newStatus) => {
    setTechnologies(prev =>
      prev.map(tech =>
        tech.id === techId ? { ...tech, status: newStatus } : tech
      )
    );
  };

  const updateNotes = (techId, newNotes) => {
    setTechnologies(prev =>
      prev.map(tech =>
        tech.id === techId ? { ...tech, notes: newNotes } : tech
      )
    );
  };

  const markAllCompleted = () => {
    setTechnologies(prev =>
      prev.map(tech => ({ ...tech, status: 'completed' }))
    );
  };

  const resetAll = () => {
    setTechnologies(prev =>
      prev.map(tech => ({ ...tech, status: 'not-started' }))
    );
  };

  const calculateProgress = () => {
    if (technologies.length === 0) return 0;
    const completed = technologies.filter(tech => tech.status === 'completed').length;
    return Math.round((completed / technologies.length) * 100);
  };

  const getStats = () => ({
    total: technologies.length,
    notStarted: technologies.filter(t => t.status === 'not-started').length,
    inProgress: technologies.filter(t => t.status === 'in-progress').length,
    completed: technologies.filter(t => t.status === 'completed').length
  });

  return {
    technologies,
    updateStatus,
    updateNotes,
    markAllCompleted,
    resetAll,
    progress: calculateProgress(),
    stats: getStats()
  };
}

export default useTechnologies;