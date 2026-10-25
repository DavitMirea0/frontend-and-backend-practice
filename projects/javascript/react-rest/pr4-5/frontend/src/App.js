import React, { useEffect, useState } from 'react';
import LoginPage    from './pages/LoginPage/LoginPage';
import RegisterPage from './pages/RegisterPage/RegisterPage';
import ProductsPage from './pages/ProductsPage/ProductsPage';
import UsersPage    from './pages/UsersPage/UsersPage';

export default function App() {
  const [page, setPage] = useState('login');
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (localStorage.getItem('accessToken')) {
      // Декодируем роль из токена без библиотеки
      try {
        const payload = JSON.parse(atob(localStorage.getItem('accessToken').split('.')[1]));
        setRole(payload.role);
        setPage('products');
      } catch {
        setPage('products');
      }
    }
  }, []);

  const handleLoginSuccess = (userRole) => {
    setRole(userRole);
    setPage('products');
  };

  const handleLogout = () => {
    setRole(null);
    setPage('login');
  };

  if (page === 'register') return <RegisterPage onSuccess={handleLoginSuccess} onGoLogin={() => setPage('login')} />;
  if (page === 'users')    return <UsersPage onLogout={handleLogout} onGoProducts={() => setPage('products')} role={role} />;
  if (page === 'products') return <ProductsPage onLogout={handleLogout} onGoUsers={() => setPage('users')} role={role} />;

  return <LoginPage onSuccess={handleLoginSuccess} onGoRegister={() => setPage('register')} />;
}
