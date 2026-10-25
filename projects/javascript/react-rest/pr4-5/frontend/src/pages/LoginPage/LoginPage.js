import React, { useState } from 'react';
import './LoginPage.css';
import { api } from '../../api';

export default function LoginPage({ onSuccess, onGoRegister }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password.trim()) { setError('Заполните все поля'); return; }
    try {
      setLoading(true);
      const data = await api.login(email.trim(), password);
      const role = data.user?.role || 'user';
      onSuccess(role);
    } catch (err) {
      if (err.response?.status === 401)      setError('Неверный пароль');
      else if (err.response?.status === 404) setError('Пользователь не найден');
      else                                   setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="card">
        <div className="card__header">
          <div className="logo">💾</div>
          <h1 className="card__title">SoftShop</h1>
          <p className="card__subtitle">Войдите в свой аккаунт</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Email
            <input className={`input ${error ? 'input--error' : ''}`} type="email" value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }} placeholder="ivan@mail.ru" autoFocus />
          </label>
          <label className="label">
            Пароль
            <input className={`input ${error ? 'input--error' : ''}`} type="password" value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }} placeholder="••••••••" />
          </label>
          {error && <div className="errorMsg">{error}</div>}
          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Войти'}
          </button>
        </form>

        <div className="registerLink">
          Нет аккаунта?{' '}
          <span className="registerLink__btn" onClick={onGoRegister}>Зарегистрироваться</span>
        </div>

        <div className="hint">
          <div className="hint__title">Тестовые аккаунты</div>
          <div className="hint__list">
            <div className="hint__item" onClick={() => { setEmail('ivan@mail.ru'); setPassword('password123'); setError(''); }}>
              <span>ivan@mail.ru</span><span className="hint__pass">password123 · user</span>
            </div>
            <div className="hint__item" onClick={() => { setEmail('maria@mail.ru'); setPassword('securePass'); setError(''); }}>
              <span>maria@mail.ru</span><span className="hint__pass">securePass · seller</span>
            </div>
            <div className="hint__item" onClick={() => { setEmail('admin@softshop.ru'); setPassword('admin2025'); setError(''); }}>
              <span>admin@softshop.ru</span><span className="hint__pass">admin2025 · admin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
