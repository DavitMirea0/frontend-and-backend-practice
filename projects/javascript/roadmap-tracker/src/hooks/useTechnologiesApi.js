import { useState, useCallback, useRef } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export const useTechnologiesApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  // Для debounce поиска
  const searchTimeoutRef = useRef(null);

  // Базовый метод для запросов
  const request = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // Получить все технологии
  const getAllTechnologies = useCallback(async () => {
    return await request('/api/technologies');
  }, [request]);

  // Получить технологию по ID
  const getTechnologyById = useCallback(async (id) => {
    return await request(`/api/technologies/${id}`);
  }, [request]);

  // Поиск технологий (возвращает результат)
  const searchTechnologies = useCallback(async (query, filters = {}) => {
    const params = new URLSearchParams();
    
    if (query) {
      params.append('q', query);
    }
    
    if (filters.category) {
      params.append('category', filters.category);
    }
    
    if (filters.status) {
      params.append('status', filters.status);
    }
    
    if (filters.ring) {
      params.append('ring', filters.ring);
    }

    const queryString = params.toString();
    const endpoint = queryString 
      ? `/api/technologies/search?${queryString}` 
      : '/api/technologies';
    
    return await request(endpoint);
  }, [request]);

  // Обработчик поиска с debounce (для TechnologySearch компонента)
  const handleSearch = useCallback((query) => {
    // Очищаем предыдущий таймаут
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Если запрос пустой, очищаем результаты
    if (!query || query.trim() === '') {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);

    // Debounce: ждём 300ms перед запросом
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchTechnologies(query);
        setSearchResults(Array.isArray(results) ? results : []);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);
  }, [searchTechnologies]);

  // Очистить результаты поиска
  const clearSearch = useCallback(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    setSearchResults([]);
    setSearching(false);
    setError(null);
  }, []);

  // Создать новую технологию
  const createTechnology = useCallback(async (technologyData) => {
    return await request('/api/technologies', {
      method: 'POST',
      body: JSON.stringify(technologyData),
    });
  }, [request]);

  // Обновить технологию
  const updateTechnology = useCallback(async (id, technologyData) => {
    return await request(`/api/technologies/${id}`, {
      method: 'PUT',
      body: JSON.stringify(technologyData),
    });
  }, [request]);

  // Удалить технологию
  const deleteTechnology = useCallback(async (id) => {
    return await request(`/api/technologies/${id}`, {
      method: 'DELETE',
    });
  }, [request]);

  // Получить технологии по категории
  const getTechnologiesByCategory = useCallback(async (category) => {
    return await request(`/api/technologies/category/${category}`);
  }, [request]);

  // Получить технологии по кольцу (ring)
  const getTechnologiesByRing = useCallback(async (ring) => {
    return await request(`/api/technologies/ring/${ring}`);
  }, [request]);

  // Получить статистику
  const getStatistics = useCallback(async () => {
    return await request('/api/technologies/statistics');
  }, [request]);

  // Очистить ошибку
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // Состояние
    loading,
    error,
    searchResults,
    searching,
    
    // Методы для TechnologySearch
    handleSearch,
    clearSearch,
    
    // Остальные методы API
    getAllTechnologies,
    getTechnologyById,
    searchTechnologies,
    createTechnology,
    updateTechnology,
    deleteTechnology,
    getTechnologiesByCategory,
    getTechnologiesByRing,
    getStatistics,
    clearError,
  };
};

// Дефолтный экспорт для совместимости
export default useTechnologiesApi;