import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/'); };

  const clientLinks = [
    { to: '/dashboard', label: 'Главная', icon: '🏠' },
    { to: '/cards', label: 'Карты', icon: '💳' },
    { to: '/transfers', label: 'Переводы', icon: '↗' },
    { to: '/history', label: 'История', icon: '📋' },
    { to: '/scores', label: 'Накопления', icon: '💰' },
    { to: '/payments', label: 'Платежи', icon: '⚡' },
    { to: '/support', label: 'Поддержка', icon: '🛟' },
  ];
  const adminLinks = [
    { to: '/admin', label: 'Клиенты', icon: '👥' },
    { to: '/admin/cards', label: 'Карты', icon: '💳' },
    { to: '/admin/transactions', label: 'Транзакции', icon: '📋' },
    { to: '/admin/tariffs', label: 'Тарифы', icon: '📊' },
  ];
  const links = user?.role_id === 3 ? adminLinks : clientLinks;

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>evervess</h1>
        <span>{user?.role_id === 3 ? 'Админ-панель' : 'Современный банк'}</span>
      </div>
      <nav className="sidebar-nav">
        {links.map(l => (
          <NavLink key={l.to} to={l.to} end={l.to==='/dashboard' || l.to==='/admin'} className={({isActive})=>isActive?'nav-link active':'nav-link'}>
            <span className="nav-icon">{l.icon}</span>{l.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-user">{user?.name}</div>
        <button className="logout-btn" onClick={handleLogout}>Выйти</button>
      </div>
    </aside>
  );
}
