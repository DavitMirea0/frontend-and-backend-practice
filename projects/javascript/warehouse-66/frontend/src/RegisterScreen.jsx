import React, { useState } from 'react';
import { api } from './api.js';
import { useAuth } from './AuthContext.jsx';

export default function RegisterScreen({ onSwitchToLogin }) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr('');
    if (password !== password2) {
      setErr('Пароли не совпадают');
      return;
    }
    setBusy(true);
    try {
      const r = await api.register({
        username: username.trim(),
        password,
        full_name: fullName.trim() || undefined,
      });
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
        
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-subtitle">Создать учётную запись</p>

        {err && <div className="error-banner">{err}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>Логин (3–50 символов)</label>
            <input value={username} autoFocus
              onChange={e => setUsername(e.target.value)}
              placeholder="ivan_ivanov" />
          </div>
          <div className="field">
            <label>Полное имя (необязательно)</label>
            <input value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Иванов Иван" />
          </div>
          <div className="field">
            <label>Пароль (от 6 символов)</label>
            <input type="password" value={password}
              onChange={e => setPassword(e.target.value)} />
          </div>
          <div className="field">
            <label>Повторите пароль</label>
            <input type="password" value={password2}
              onChange={e => setPassword2(e.target.value)} />
          </div>
          <button className="btn-primary auth-btn" type="submit" disabled={busy}>
            {busy ? 'Создаём...' : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-switch">
          Уже есть аккаунт? <a onClick={onSwitchToLogin}>Войти</a>
        </div>

        <div className="auth-hint">
          После регистрации вы получите роль <b>client</b>. Повышение роли (до admin/guest)
          выполняется администратором системы.
        </div>
      </div>
    </div>
  );
}
