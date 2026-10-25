import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault(); setError('');
    if (password !== password2) { setError('Пароли не совпадают'); return; }
    setLoading(true);
    try { await register(name, login, password); navigate('/dashboard'); }
    catch (err) { setError(err.response?.data?.message || 'Ошибка регистрации'); }
    finally { setLoading(false); }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo"><span>evervess</span></div>
        <h2>Регистрация</h2>
        {error && <div className="auth-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="field"><label>Имя</label><input type="text" placeholder="Иван" value={name} onChange={e=>setName(e.target.value)} required /></div>
          <div className="field"><label>Email</label><input type="email" placeholder="your@email.com" value={login} onChange={e=>setLogin(e.target.value)} required /></div>
          <div className="field"><label>Пароль</label><input type="password" placeholder="••••••••" value={password} onChange={e=>setPassword(e.target.value)} required /></div>
          <div className="field"><label>Подтвердите пароль</label><input type="password" placeholder="••••••••" value={password2} onChange={e=>setPassword2(e.target.value)} required /></div>
          <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Создание...' : 'Создать аккаунт'}</button>
        </form>
        <div className="auth-footer">Уже есть аккаунт? <Link to="/login">Войти</Link></div>
      </div>
    </div>
  );
}
