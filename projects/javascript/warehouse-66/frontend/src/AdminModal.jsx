import React, { useEffect, useState } from 'react';
import { api } from './api.js';
import { useAuth } from './AuthContext.jsx';

const ROLES = ['admin', 'client', 'guest'];

export default function AdminModal({ onClose }) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    try {
      setUsers(await api.users());
    } catch (e) {
      setErr(e.message);
    }
  }
  useEffect(() => { load(); }, []);

  async function changeRole(id, role) {
    setErr(''); setBusy(true);
    try {
      await api.updateUserRole(id, role);
      await load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function removeUser(id, username) {
    if (!confirm(`Удалить пользователя «${username}»?`)) return;
    setErr(''); setBusy(true);
    try {
      await api.deleteUser(id);
      await load();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(760px, 95vw)' }}>
        <h2>Управление пользователями</h2>
        {err && <div className="error-banner">{err}</div>}

        <table className="admin-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Логин</th>
              <th>ФИО</th>
              <th>Роль</th>
              <th>Создан</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.user_id}>
                <td>{u.user_id}</td>
                <td><b>{u.username}</b>{u.user_id === user.sub && <span className="badge-self"> вы</span>}</td>
                <td>{u.full_name || '—'}</td>
                <td>
                  <select value={u.role}
                    disabled={busy || u.user_id === user.sub}
                    onChange={e => changeRole(u.user_id, e.target.value)}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </td>
                <td>{new Date(u.created_at).toLocaleDateString('ru')}</td>
                <td>
                  {u.user_id !== user.sub && (
                    <button className="btn-link-danger"
                      onClick={() => removeUser(u.user_id, u.username)}>удалить</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
