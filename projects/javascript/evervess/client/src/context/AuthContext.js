import React, { createContext, useState, useContext, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      api.get('/auth/me').then(r => setUser(r.data)).catch(() => {
        localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');
      }).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (loginStr, password) => {
    const res = await api.post('/auth/login', { login: loginStr, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user); return res.data.user;
  };

  const register = async (name, loginStr, password) => {
    const res = await api.post('/auth/register', { name, login: loginStr, password });
    localStorage.setItem('accessToken', res.data.accessToken);
    localStorage.setItem('refreshToken', res.data.refreshToken);
    setUser(res.data.user); return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem('accessToken'); localStorage.removeItem('refreshToken');
    setUser(null);
  };

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
