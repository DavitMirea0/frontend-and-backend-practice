import React, { useEffect, useState } from 'react';
import './UsersPage.css';
import { api } from '../../api';

const ROLE_LABELS = { user: 'Пользователь', seller: 'Продавец', admin: 'Администратор' };
const ROLE_COLORS = { user: 'role--user', seller: 'role--seller', admin: 'role--admin' };

export default function UsersPage({ onLogout, onGoProducts }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // { id, first_name, last_name, role }
  const [error,   setError]   = useState('');

  useEffect(() => { loadUsers(); }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setUsers(await api.getUsers());
    } catch (err) {
      if (err.response?.status === 403) setError('Доступ запрещён');
      else setError('Ошибка загрузки');
    } finally { setLoading(false); }
  };

  const handleBlock = async (id) => {
    if (!window.confirm('Заблокировать пользователя?')) return;
    try {
      await api.blockUser(id);
      setUsers(prev => prev.map(u => u.id === id ? { ...u, blocked: true } : u));
    } catch { alert('Ошибка блокировки'); }
  };

  const handleSaveEdit = async () => {
    try {
      const updated = await api.updateUser(editing.id, {
        first_name: editing.first_name,
        last_name:  editing.last_name,
        role:       editing.role,
      });
      setUsers(prev => prev.map(u => u.id === updated.id ? updated : u));
      setEditing(null);
    } catch { alert('Ошибка сохранения'); }
  };

  return (
    <div className="page">
      <header className="hdr">
        <div className="hdr__inner">
          <div className="brand">
            <span className="brand__icon">💾</span>
            <span className="brand__name">SoftShop</span>
          </div>
          <div className="hdr__right">
            <button className="btn btn--products" onClick={onGoProducts}>📦 Товары</button>
            <button className="btn btn--logout" onClick={() => { api.logout(); onLogout(); }}>Выйти</button>
          </div>
        </div>
      </header>

      <main className="main">
        <div className="container">
          <div className="toolbar">
            <h1 className="title">Пользователи <span className="count">({users.length})</span></h1>
          </div>

          {error && <div className="errorBanner">{error}</div>}

          {loading ? (
            <div className="empty">Загрузка...</div>
          ) : (
            <div className="usersTable">
              <div className="usersTable__head">
                <span>Имя</span>
                <span>Email</span>
                <span>Роль</span>
                <span>Статус</span>
                <span>Действия</span>
              </div>
              {users.map(u => (
                <div key={u.id} className={`usersTable__row ${u.blocked ? 'usersTable__row--blocked' : ''}`}>
                  {editing?.id === u.id ? (
                    <>
                      <span className="editFields">
                        <input className="editInput" value={editing.first_name}
                          onChange={e => setEditing(p => ({ ...p, first_name: e.target.value }))} />
                        <input className="editInput" value={editing.last_name}
                          onChange={e => setEditing(p => ({ ...p, last_name: e.target.value }))} />
                      </span>
                      <span>{u.email}</span>
                      <span>
                        <select className="editSelect" value={editing.role}
                          onChange={e => setEditing(p => ({ ...p, role: e.target.value }))}>
                          <option value="user">Пользователь</option>
                          <option value="seller">Продавец</option>
                          <option value="admin">Администратор</option>
                        </select>
                      </span>
                      <span>{u.blocked ? <span className="badge badge--blocked">Заблокирован</span> : <span className="badge badge--active">Активен</span>}</span>
                      <span className="actions">
                        <button className="btn btn--save" onClick={handleSaveEdit}>✓ Сохранить</button>
                        <button className="btn btn--cancel" onClick={() => setEditing(null)}>✕</button>
                      </span>
                    </>
                  ) : (
                    <>
                      <span>{u.first_name} {u.last_name}</span>
                      <span className="email">{u.email}</span>
                      <span><span className={`roleBadge ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role] || u.role}</span></span>
                      <span>{u.blocked ? <span className="badge badge--blocked">Заблокирован</span> : <span className="badge badge--active">Активен</span>}</span>
                      <span className="actions">
                        <button className="btn btn--edit" onClick={() => setEditing({ id: u.id, first_name: u.first_name, last_name: u.last_name, role: u.role })}>✎ Изменить</button>
                        {!u.blocked && <button className="btn btn--block" onClick={() => handleBlock(u.id)}>⊘ Блок</button>}
                      </span>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="ftr">
        <div className="ftr__inner">© {new Date().getFullYear()} SoftShop — лицензионное ПО</div>
      </footer>
    </div>
  );
}
