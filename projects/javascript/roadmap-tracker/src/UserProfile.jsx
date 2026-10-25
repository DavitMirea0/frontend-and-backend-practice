import { useState, useEffect } from 'react';

function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch('https://jsonplaceholder.typicode.com/users/1');

        if (!response.ok) {
          throw new Error('Не удалось загрузить данные пользователя');
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) {
    return (
      <div className="user-profile loading">
        <p>⏳ Загрузка профиля...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="user-profile error">
        <p>❌ Ошибка: {error}</p>
        <button onClick={() => window.location.reload()}>
          Попробовать снова
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile">
      <h2>👤 Профиль пользователя</h2>
      <div className="user-info">
        <p><strong>Имя:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Телефон:</strong> {user.phone}</p>
        <p><strong>Website:</strong> {user.website}</p>
      </div>
    </div>
  );
}

export default UserProfile;