import { NavLink } from 'react-router-dom';

function Navigation() {
  return (
    <nav className="navigation">
      <div className="nav-brand">
        <h1>🎯 Tech Radar</h1>
      </div>

      <div className="nav-links">
        <NavLink to="/" className={({ isActive }) => isActive ? 'active' : ''}>
          🏠 Главная
        </NavLink>
        <NavLink to="/mui" className={({ isActive }) => isActive ? 'active' : ''}>
          🎨 MUI
        </NavLink>
        <NavLink to="/statistics" className={({ isActive }) => isActive ? 'active' : ''}>
          📊 Статистика
        </NavLink>

        <NavLink to="/forms" className={({ isActive }) => isActive ? 'active' : ''}>
          📝 Формы
        </NavLink>

        <NavLink to="/settings" className={({ isActive }) => isActive ? 'active' : ''}>
          ⚙️ Настройки
        </NavLink>
      </div>
    </nav>
  );
}

export default Navigation;