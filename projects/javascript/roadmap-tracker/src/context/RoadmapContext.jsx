import React, { createContext, useContext, useState, useEffect } from 'react';

// Данные по умолчанию (встроенные)
const defaultRoadmap = {
  "title": "Frontend Developer Roadmap",
  "description": "Путь изучения фронтенд-разработки",
  "items": [
    {
      "id": "html-basics",
      "title": "HTML основы",
      "description": "Изучение базовых тегов и структуры HTML документа",
      "resources": [
        "https://developer.mozilla.org/ru/docs/Learn/HTML",
        "https://html5book.ru/"
      ]
    },
    {
      "id": "css-basics",
      "title": "CSS основы",
      "description": "Стилизация, селекторы, блочная модель",
      "resources": [
        "https://developer.mozilla.org/ru/docs/Learn/CSS",
        "https://flexboxfroggy.com/"
      ]
    },
    {
      "id": "javascript-basics",
      "title": "JavaScript основы",
      "description": "Переменные, функции, циклы, DOM",
      "resources": [
        "https://learn.javascript.ru/",
        "https://developer.mozilla.org/ru/docs/Web/JavaScript"
      ]
    },
    {
      "id": "react-basics",
      "title": "React основы",
      "description": "Компоненты, props, state, хуки",
      "resources": [
        "https://react.dev/",
        "https://reactjs.org/tutorial/tutorial.html"
      ]
    },
    {
      "id": "git-basics",
      "title": "Git и GitHub",
      "description": "Контроль версий, ветки, pull requests",
      "resources": [
        "https://git-scm.com/book/ru/v2",
        "https://githowto.com/ru"
      ]
    }
  ]
};

const RoadmapContext = createContext();

// Хук для использования контекста
export const useRoadmap = () => {
  const context = useContext(RoadmapContext);
  if (!context) {
    throw new Error('useRoadmap must be used within a RoadmapProvider');
  }
  return context;
};

// Провайдер контекста
export const RoadmapProvider = ({ children }) => {
  const [roadmap, setRoadmap] = useState(null);
  const [userProgress, setUserProgress] = useState({});
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Инициализация прогресса для всех пунктов
  const initializeProgress = (items) => {
    const initialProgress = {};
    items.forEach(item => {
      initialProgress[item.id] = {
        status: 'not-started',
        note: '',
        deadline: ''
      };
    });
    return initialProgress;
  };

  // Загрузка данных при инициализации
  useEffect(() => {
    try {
      const savedRoadmap = localStorage.getItem('roadmap');
      const savedProgress = localStorage.getItem('userProgress');
      
      let loadedRoadmap = null;
      let loadedProgress = {};

      // Загружаем roadmap
      if (savedRoadmap) {
        try {
          loadedRoadmap = JSON.parse(savedRoadmap);
          console.log('✅ Roadmap загружен из localStorage');
        } catch (e) {
          console.error('❌ Ошибка парсинга roadmap из localStorage:', e);
          loadedRoadmap = defaultRoadmap;
        }
      } else {
        console.log('📦 Используем roadmap по умолчанию');
        loadedRoadmap = defaultRoadmap;
      }

      // Загружаем прогресс
      if (savedProgress) {
        try {
          loadedProgress = JSON.parse(savedProgress);
          console.log('✅ Прогресс загружен из localStorage');
        } catch (e) {
          console.error('❌ Ошибка парсинга прогресса:', e);
          loadedProgress = initializeProgress(loadedRoadmap.items);
        }
      } else {
        console.log('📦 Инициализируем пустой прогресс');
        loadedProgress = initializeProgress(loadedRoadmap.items);
      }

      setRoadmap(loadedRoadmap);
      setUserProgress(loadedProgress);
      
    } catch (e) {
      console.error('❌ Критическая ошибка загрузки:', e);
      setRoadmap(defaultRoadmap);
      setUserProgress(initializeProgress(defaultRoadmap.items));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Сохранение roadmap в localStorage при изменениях
  useEffect(() => {
    if (roadmap && !isLoading) {
      localStorage.setItem('roadmap', JSON.stringify(roadmap));
      console.log('💾 Roadmap сохранён');
    }
  }, [roadmap, isLoading]);

  // Сохранение прогресса в localStorage при изменениях
  useEffect(() => {
    if (!isLoading && Object.keys(userProgress).length > 0) {
      localStorage.setItem('userProgress', JSON.stringify(userProgress));
      console.log('💾 Прогресс сохранён');
    }
  }, [userProgress, isLoading]);

  // Валидация структуры JSON
  const validateRoadmap = (data) => {
    if (!data || typeof data !== 'object') {
      throw new Error('Файл должен содержать объект JSON');
    }
    if (!data.title || typeof data.title !== 'string') {
      throw new Error('Отсутствует или некорректное поле "title"');
    }
    if (!Array.isArray(data.items)) {
      throw new Error('Поле "items" должно быть массивом');
    }
    for (const item of data.items) {
      if (!item.id || !item.title) {
        throw new Error('Каждый элемент должен иметь поля "id" и "title"');
      }
    }
    return true;
  };

  // Импорт JSON-файла
  const importRoadmap = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          validateRoadmap(data);
          
          setRoadmap(data);
          
          // Если в файле есть пользовательские данные, загружаем их
          if (data.userProgress) {
            setUserProgress(data.userProgress);
          } else {
            // Иначе инициализируем пустой прогресс
            setUserProgress(initializeProgress(data.items));
          }
          
          setError(null);
          resolve(data);
        } catch (err) {
          const errorMessage = err.message || 'Ошибка при чтении файла';
          setError(errorMessage);
          reject(new Error(errorMessage));
        }
      };
      
      reader.onerror = () => {
        const errorMessage = 'Не удалось прочитать файл';
        setError(errorMessage);
        reject(new Error(errorMessage));
      };
      
      reader.readAsText(file);
    });
  };

  // Экспорт в JSON-файл
  const exportRoadmap = () => {
    if (!roadmap) return;

    const exportData = {
      ...roadmap,
      userProgress: userProgress,
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${roadmap.title.replace(/\s+/g, '_')}_progress.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Обновление статуса пункта
  const updateItemStatus = (itemId, status) => {
    console.log(`📝 Обновление статуса: ${itemId} → ${status}`);
    setUserProgress(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        status
      }
    }));
  };

  // Обновление заметки
  const updateItemNote = (itemId, note) => {
    setUserProgress(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        note
      }
    }));
  };

  // Удаление заметки
  const deleteItemNote = (itemId) => {
    setUserProgress(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        note: ''
      }
    }));
  };

  // Обновление дедлайна
  const updateItemDeadline = (itemId, deadline) => {
    setUserProgress(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        deadline
      }
    }));
  };

  // Получение данных пункта по ID
  const getItemById = (id) => {
    if (!roadmap || !roadmap.items) {
      console.log('⚠️ roadmap или items не загружены');
      return null;
    }
    const item = roadmap.items.find(item => item.id === id);
    console.log(`🔍 Поиск item по id "${id}":`, item ? '✅ найден' : '❌ не найден');
    return item;
  };

  // Получение прогресса пункта
  const getItemProgress = (itemId) => {
    return userProgress[itemId] || {
      status: 'not-started',
      note: '',
      deadline: ''
    };
  };

  // Расчет общего прогресса
  const calculateProgress = () => {
    if (!roadmap || !roadmap.items || !roadmap.items.length) return 0;
    
    const completed = roadmap.items.filter(
      item => userProgress[item.id]?.status === 'completed'
    ).length;
    
    return Math.round((completed / roadmap.items.length) * 100);
  };

  // Получение статистики
  const getStatistics = () => {
    if (!roadmap || !roadmap.items) {
      return { total: 0, notStarted: 0, inProgress: 0, completed: 0 };
    }

    const stats = {
      total: roadmap.items.length,
      notStarted: 0,
      inProgress: 0,
      completed: 0
    };

    roadmap.items.forEach(item => {
      const status = userProgress[item.id]?.status || 'not-started';
      if (status === 'not-started') stats.notStarted++;
      else if (status === 'in-progress') stats.inProgress++;
      else if (status === 'completed') stats.completed++;
    });

    return stats;
  };

  // Сброс прогресса
  const resetProgress = () => {
    if (roadmap && roadmap.items) {
      setUserProgress(initializeProgress(roadmap.items));
      console.log('🔄 Прогресс сброшен');
    }
  };

  // Сброс всех данных
  const resetAll = () => {
    localStorage.removeItem('roadmap');
    localStorage.removeItem('userProgress');
    setRoadmap(defaultRoadmap);
    setUserProgress(initializeProgress(defaultRoadmap.items));
    console.log('🔄 Все данные сброшены');
  };

  // Очистка ошибки
  const clearError = () => setError(null);

  const value = {
    // Данные
    roadmap,
    userProgress,
    error,
    isLoading,
    
    // Импорт/Экспорт
    importRoadmap,
    exportRoadmap,
    
    // Обновление данных
    updateItemStatus,
    updateItemNote,
    deleteItemNote,
    updateItemDeadline,
    
    // Получение данных
    getItemById,
    getItemProgress,
    calculateProgress,
    getStatistics,
    
    // Сброс
    resetProgress,
    resetAll,
    clearError
  };

  // Показываем загрузку
  if (isLoading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <p>Загрузка...</p>
      </div>
    );
  }

  return (
    <RoadmapContext.Provider value={value}>
      {children}
    </RoadmapContext.Provider>
  );
};

export default RoadmapContext;