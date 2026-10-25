import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const STORAGE_KEY = 'wh66_auth';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [ready, setReady] = useState(false);

  // Загрузка из localStorage при старте
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setUser(parsed.user);
        setToken(parsed.token);
      }
    } catch { /* пусто */ }
    setReady(true);
  }, []);

  const login = useCallback((u, t) => {
    setUser(u);
    setToken(t);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: u, token: t }));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Хелперы для проверки прав
  const isAdmin  = user?.role === 'admin';
  const isClient = user?.role === 'client' || isAdmin;
  const isGuest  = !!user;

  return (
    <AuthContext.Provider value={{ user, token, ready, login, logout, isAdmin, isClient, isGuest }}>
      {children}
    </AuthContext.Provider>
  );
}
