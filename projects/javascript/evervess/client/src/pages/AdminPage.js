import React, { useEffect, useState } from 'react';
import api from '../api';
import './Pages.css';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, cards: 0, totalBalance: 0, transactions: 0 });
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase()) || u.login.toLowerCase().includes(search.toLowerCase()));
  const colors = ['#e67e22', '#3498db', '#9b59b6', '#e84393', '#1abc9c', '#e74c3c'];

  return (
    <div className="page">
      <div className="page-header-row">
        <div><h2>Управление клиентами</h2><p className="page-sub">Всего: {users.length}</p></div>
        <div className="header-btns"><input className="search-input" placeholder="Поиск..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><div className="stat-label">Клиентов</div><div className="stat-value">{stats.users}</div></div>
        <div className="stat-card"><div className="stat-label">Карт</div><div className="stat-value">{stats.cards}</div></div>
        <div className="stat-card"><div className="stat-label">Общий баланс</div><div className="stat-value">{fmt(stats.totalBalance)} ₽</div></div>
        <div className="stat-card"><div className="stat-label">Транзакций</div><div className="stat-value">{stats.transactions}</div></div>
      </div>
      <div className="table-card">
        <div className="table-header"><div>Клиент</div><div>Email</div><div>Баланс</div><div>Роль</div><div>Карт</div></div>
        {filtered.map((u, i) => (
          <div key={u.id} className="table-row">
            <div className="cell-user">
              <div className="tbl-avatar" style={{background: colors[i % colors.length]}}>{u.name.charAt(0).toUpperCase()}</div>
              <div><div className="tbl-name">{u.name}</div><div className="tbl-id">ID: {u.id}</div></div>
            </div>
            <div className="cell-email">{u.login}</div>
            <div className="cell-balance">{fmt(u.total_balance)} ₽</div>
            <div><span className={`role-badge ${u.role_name === 'Админ' ? 'admin' : 'client'}`}>{u.role_name}</span></div>
            <div>{u.cards_count}</div>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-text" style={{padding:20}}>Ничего не найдено</p>}
      </div>
    </div>
  );
}
