import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function LoginPage() {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login: doLogin } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await doLogin(login, password);
      navigate(user.role_id === 3 ? '/admin' : '/dashboard');
    } catch (err) { setError(err.response?.data?.message || 'Ошибка входа'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><span>evervess</span></div>
        <p className="auth-subtitle">Современный банкинг</p>
        <h2>Вход в систему</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Email</label><input type="email" placeholder="your@email.com" value={login} onChange={e=>setLogin(e.target.value)} required /></div>
          <div className="field"><label>Пароль</label><input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Вход...' : 'Войти'}</button>
        </form>
        <div className="auth-footer">Нет аккаунта? <Link to="/register">Зарегистрироваться</Link></div>
      </div>
    </div>
  );
}
