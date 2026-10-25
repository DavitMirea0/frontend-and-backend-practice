import React, { useState } from 'react';
import { api } from './api.js';
import { useAuth } from './AuthContext.jsx';

export default function LoginScreen({ onSwitchToRegister }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const r = await api.login({ username: username.trim(), password });
      login(r.user, r.token);
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="auth-screen">
      <div className="auth-card">
        
        <h1 className="auth-title">Вход в систему</h1>
        <p className="auth-subtitle">Система складского учёта</p>

        {err && <div className="error-banner">{err}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Логин</label>
            <input value={username} autoFocus
              onChange={e => setUsername(e.target.value)}
              placeholder="admin" />
          </div>
          <div className="field">
            <label>Пароль</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••" />
          </div>
          <button className="btn-primary auth-btn" type="submit" disabled={busy}>
            {busy ? 'Вход...' : 'Войти'}
          </button>
        </form>

        <div className="auth-switch">
          Нет аккаунта? <a onClick={onSwitchToRegister}>Зарегистрироваться</a>
        </div>

        <div className="auth-hint">
          <b>Тестовые учётки:</b><br/>
          admin / admin123 (администратор)<br/>
          manager / manager123 (клиент)<br/>
          viewer / viewer123 (гость)
        </div>
      </div>
    </div>
  );
}
