import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CardsPage from './pages/CardsPage';
import TransfersPage from './pages/TransfersPage';
import HistoryPage from './pages/HistoryPage';
import ScoresPage from './pages/ScoresPage';
import PaymentsPage from './pages/PaymentsPage';
import SupportPage from './pages/SupportPage';
import AdminClientsPage from './pages/AdminClientsPage';
import AdminCardsPage from './pages/AdminCardsPage';
import AdminTransactionsPage from './pages/AdminTransactionsPage';
import AdminTariffsPage from './pages/AdminTariffsPage';
import './App.css';

function PrivateRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Загрузка...</div>;
  if (!user) return <Navigate to="/login" />;
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="app-main"><Outlet /></main>
    </div>
  );
}
function AdminRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Загрузка...</div>;
  if (!user || user.role_id !== 3) return <Navigate to="/" />;
  return <Outlet />;
}
function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading">Загрузка...</div>;
  if (user) return <Navigate to={user.role_id === 3 ? '/admin' : '/dashboard'} />;
  return <Outlet />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>
          <Route element={<PrivateRoute />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/cards" element={<CardsPage />} />
            <Route path="/transfers" element={<TransfersPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/scores" element={<ScoresPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/support" element={<SupportPage />} />
            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AdminClientsPage />} />
              <Route path="/admin/cards" element={<AdminCardsPage />} />
              <Route path="/admin/transactions" element={<AdminTransactionsPage />} />
              <Route path="/admin/tariffs" element={<AdminTariffsPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
