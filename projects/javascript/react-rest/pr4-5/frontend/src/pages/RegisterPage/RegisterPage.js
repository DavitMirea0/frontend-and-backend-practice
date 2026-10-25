import React, { useState } from 'react';
import './RegisterPage.css';
import { api } from '../../api';

export default function RegisterPage({ onSuccess, onGoLogin }) {
  const [firstName, setFirstName] = useState('');
  const [lastName,  setLastName]  = useState('');
  const [email,     setEmail]     = useState('');
  const [password,  setPassword]  = useState('');
  const [confirm,   setConfirm]   = useState('');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState('');

  const validate = () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password.trim() || !confirm.trim())
      return 'Заполните все поля';
    if (firstName.trim().length < 2 || lastName.trim().length < 2)
      return 'Имя и фамилия должны содержать минимум 2 символа';
    if (!/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(firstName.trim()) || !/^[a-zA-Zа-яА-ЯёЁ\s-]+$/.test(lastName.trim()))
      return 'Имя и фамилия должны содержать только буквы';
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email.trim()))
      return 'Введите корректный email (например ivan@mail.ru)';
    if (password.length < 6)
      return 'Пароль должен быть не менее 6 символов';
    if (password !== confirm)
      return 'Пароли не совпадают';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const validationError = validate();
    if (validationError) { setError(validationError); return; }
    try {
      setLoading(true);
      await api.register(email.trim(), password, firstName.trim(), lastName.trim());
      await api.login(email.trim(), password);
      onSuccess();
    } catch (err) {
      if (err.response?.status === 409) setError('Пользователь с таким email уже существует');
      else if (err.response?.data?.error) setError(err.response.data.error);
      else setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const emailError = error.includes('email');
  const passError  = error.includes('Пароль') || error.includes('Пароли');
  const nameError  = error.includes('Имя') || error.includes('буквы');

  return (
    <div className="page">
      <div className="card">
        <div className="card__header">
          <div className="logo">💾</div>
          <h1 className="card__title">SoftShop</h1>
          <p className="card__subtitle">Создайте аккаунт</p>
        </div>

        <form className="form" onSubmit={handleSubmit}>
          <div className="form__row">
            <label className="label">
              Имя
              <input
                className={`input ${nameError ? 'input--error' : ''}`}
                type="text"
                value={firstName}
                onChange={e => { setFirstName(e.target.value); setError(''); }}
                placeholder="Иван"
                autoFocus
              />
            </label>
            <label className="label">
              Фамилия
              <input
                className={`input ${nameError ? 'input--error' : ''}`}
                type="text"
                value={lastName}
                onChange={e => { setLastName(e.target.value); setError(''); }}
                placeholder="Иванов"
              />
            </label>
          </div>

          <label className="label">
            Email
            <input
              className={`input ${emailError ? 'input--error' : ''}`}
              type="text"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="ivan@mail.ru"
            />
          </label>

          <label className="label">
            Пароль
            <input
              className={`input ${passError ? 'input--error' : ''}`}
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
              placeholder="Минимум 6 символов"
            />
          </label>

          <label className="label">
            Повторите пароль
            <input
              className={`input ${error === 'Пароли не совпадают' ? 'input--error' : ''}`}
              type="password"
              value={confirm}
              onChange={e => { setConfirm(e.target.value); setError(''); }}
              placeholder="••••••••"
            />
          </label>

          {error && <div className="errorMsg">{error}</div>}

          <button className="btn btn--primary" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="loginLink">
          Уже есть аккаунт?{' '}
          <span className="loginLink__btn" onClick={onGoLogin}>Войти</span>
        </div>
      </div>
    </div>
  );
}
