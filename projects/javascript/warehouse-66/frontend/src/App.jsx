import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { useAuth } from './AuthContext.jsx';
import LoginScreen from './LoginScreen.jsx';
import RegisterScreen from './RegisterScreen.jsx';
import DeliveryModal from './DeliveryModal.jsx';
import AnalysisModal from './AnalysisModal.jsx';
import AdminModal from './AdminModal.jsx';
import OptimizationModal from './OptimizationModal.jsx';
import DisposalModal from './DisposalModal.jsx';
import ReferencesModal from './ReferencesModal.jsx';
import InventoryModal from './InventoryModal.jsx';

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
function fmt(n) {
  return Number(n).toLocaleString('ru', { maximumFractionDigits: 1, minimumFractionDigits: 1 });
}

export default function App() {
  const { user, ready, logout, isAdmin, isClient } = useAuth();
  const [authMode, setAuthMode] = useState('login');

  const [warehouses, setWarehouses] = useState([]);
  const [log, setLog]               = useState([]);
  const [activeId, setActiveId]     = useState(4);
  const [modal,    setModal]        = useState(null);
  const [toast,    setToast]        = useState(null);

  const refresh = useCallback(async () => {
    if (!user) return;
    try {
      const [s, l] = await Promise.all([api.summary(), api.log(50)]);
      setWarehouses(s);
      setLog(l);
    } catch { /* ignore */ }
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (!user) return;
    const t = setInterval(refresh, 5000);
    return () => clearInterval(t);
  }, [user, refresh]);

  function showToast(text, type = 'ok') {
    setToast({ text, type });
    setTimeout(() => setToast(null), 2500);
  }

  async function clearLog() {
    try { await api.clearLog(); setLog([]); showToast('Журнал очищен'); }
    catch (e) { showToast(e.message, 'error'); }
  }

  if (!ready) return <div className="auth-screen"><div style={{ color: '#888' }}>Загрузка...</div></div>;
  if (!user) {
    return authMode === 'login'
      ? <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />
      : <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return (
    <div className="app-window">
      <div className="titlebar">
        <div className="traffic-lights">
          <span className="traffic-light close" />
          <span className="traffic-light min" />
          <span className="traffic-light max" />
        </div>
        <div className="titlebar-title">Система складского учёта — Склад №66</div>
      </div>

      <header className="app-header" style={{ position: 'relative' }}>
        <h1>СИСТЕМА СКЛАДСКОГО УЧЁТА</h1>
        <div style={{ position: 'absolute', right: 28, top: 22,
                      display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="user-info">
            {user.username}
            <span className={'role-badge ' + user.role}>{user.role}</span>
          </span>
          {isAdmin && (
            <button className="logout-btn" onClick={() => setModal('admin')}>
              Пользователи
            </button>
          )}
          <button className="logout-btn" onClick={logout}>Выйти</button>
        </div>
      </header>

      <div className="app-body">
        {/* Левая панель — склады */}
        <section className="panel">
          <div className="panel-header">
            <span className="title">Склады</span>
          </div>
          <div className="panel-body">
            {warehouses.map(w => {
              const filled   = parseFloat(w.filled) || 0;
              const capacity = parseFloat(w.capacity) || 1;
              const pct      = Math.min(100, Math.round((filled / capacity) * 100));
              const barColor = pct >= 80 ? '#e8848d'
                             : pct >= 50 ? '#f5a142'
                             : pct >= 20 ? '#f5c451'
                             : '#7dc97a';
              return (
                <div key={w.class_code}
                     className={'warehouse-card' + (w.class_code === activeId ? ' active' : '')}
                     onClick={() => setActiveId(w.class_code)}>
                  <div className="row1">
                    <span className="name">{w.warehouse_name}</span>
                    <span className="id">(ID: {w.class_code})</span>
                  </div>
                  <div className="address">{w.address}</div>

                  {/* Прогресс-бар */}
                  <div style={{ background: 'rgba(255,255,255,0.08)',
                                borderRadius: 3, height: 6, margin: '6px 0 4px' }}>
                    <div style={{ width: `${pct}%`, height: '100%',
                                  background: barColor, borderRadius: 3,
                                  transition: 'width 0.4s ease' }} />
                  </div>

                  <div className="stat-line">
                    Заполнено:&nbsp;
                    <span className="filled">{fmt(filled)}</span>
                    {' / '}
                    <span className="capacity">{capacity}</span> м³
                    <span style={{ color: barColor, marginLeft: 8, fontWeight: 600 }}>
                      ({pct}%)
                    </span>
                  </div>
                  <div className="stat-line">
                    Товаров:&nbsp;<span className="goods-num">{w.goods_count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Правая панель — журнал */}
        <section className="panel">
          <div className="panel-header">
            <span className="title">Журнал операций</span>
          </div>
          <div className="panel-body">
            {log.length === 0 ? (
              <div className="log-empty">Записей пока нет</div>
            ) : log.map(e => (
              <div key={e.id} className="log-entry">
                <span className="time">{formatTime(e.ts)}</span>
                <span className={'badge ' + e.op_type}>{e.op_type}</span>
                <span className="msg">{e.message}</span>
              </div>
            ))}
          </div>
          {isAdmin && (
            <button className="action-btn clear-log" onClick={clearLog}>
              Очистить лог
            </button>
          )}
        </section>
      </div>

      {/* Нижняя панель — 6 кнопок */}
      <footer className="action-bar">
        <button className="action-btn delivery"
                disabled={!isClient}
                title={!isClient ? 'Недостаточно прав' : ''}
                onClick={() => setModal('delivery')}>
          Поставка товаров
        </button>

        <button className="action-btn optimize"
                disabled={!isClient}
                title={!isClient ? 'Недостаточно прав' : ''}
                onClick={() => setModal('optimization')}>
          Оптимизация
        </button>

        <button className="action-btn dispose"
                disabled={!isAdmin}
                title={!isAdmin ? 'Недостаточно прав' : ''}
                onClick={() => setModal('disposal')}>
          Утилизация просрочки
        </button>

        <button className="action-btn finance"
                disabled={!isClient}
                title={!isClient ? 'Недостаточно прав' : ''}
                onClick={() => setModal('analysis')}>
          Финансовый анализ
        </button>

        <button className="action-btn references"
                onClick={() => setModal('references')}>
          Справочники
        </button>

        <button className="action-btn inventory"
                onClick={() => setModal('inventory')}>
          Инвентаризация
        </button>
      </footer>

      {/* Модалы */}
      {modal === 'delivery'     && <DeliveryModal     onClose={() => setModal(null)}
                                     onSaved={msg => { showToast(msg); refresh(); }} />}
      {modal === 'analysis'     && <AnalysisModal     onClose={() => setModal(null)} />}
      {modal === 'admin'        && <AdminModal        onClose={() => setModal(null)} />}
      {modal === 'optimization' && <OptimizationModal onClose={() => setModal(null)}
                                     warehouses={warehouses} onRefresh={refresh} />}
      {modal === 'disposal'     && <DisposalModal     onClose={() => setModal(null)}
                                     onDone={msg => { showToast(msg); refresh(); }} />}
      {modal === 'references'   && <ReferencesModal   onClose={() => setModal(null)} />}
      {modal === 'inventory'    && <InventoryModal    onClose={() => setModal(null)} />}

      {toast && (
        <div className={'toast' + (toast.type === 'error' ? ' error' : '')}>
          {toast.text}
        </div>
      )}
    </div>
  );
}
