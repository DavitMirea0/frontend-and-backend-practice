import React, { useEffect, useState } from 'react';
import api from '../api';
import './Admin.css';

export default function AdminClientsPage() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ users: 0, cards: 0, totalBalance: 0, transactions: 0, scores: 0 });
  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userDetail, setUserDetail] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editLogin, setEditLogin] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => {
    api.get('/admin/users').then(r => setUsers(r.data)).catch(() => {});
    api.get('/admin/stats').then(r => setStats(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);
  const colors = ['#e67e22', '#3498db', '#9b59b6', '#e84393', '#1abc9c', '#e74c3c', '#f39c12', '#2980b9'];

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.login.toLowerCase().includes(search.toLowerCase())
  );

  const openUser = async (user) => {
    setSelectedUser(user);
    setEditMode(false);
    setMsg('');
    try {
      const r = await api.get(`/admin/users/${user.id}`);
      setUserDetail(r.data);
    } catch { setUserDetail(null); }
  };

  const handleBlock = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/block`);
      load();
      if (selectedUser?.id === userId) {
        const r = await api.get(`/admin/users/${userId}`);
        setUserDetail(r.data);
        setSelectedUser(r.data.user);
      }
      setMsg('Статус обновлён');
    } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
  };

  const handleBlockCard = async (cardId) => {
    try {
      await api.put(`/admin/cards/${cardId}/block`);
      if (selectedUser) {
        const r = await api.get(`/admin/users/${selectedUser.id}`);
        setUserDetail(r.data);
      }
    } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
  };

  const handleEdit = async () => {
    setLoading(true);
    try {
      await api.put(`/admin/users/${selectedUser.id}`, { name: editName, login: editLogin });
      load();
      const r = await api.get(`/admin/users/${selectedUser.id}`);
      setUserDetail(r.data);
      setSelectedUser(r.data.user);
      setEditMode(false);
      setMsg('Данные обновлены');
    } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
    finally { setLoading(false); }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await api.delete(`/admin/users/${userId}`);
      setSelectedUser(null); setUserDetail(null);
      load();
    } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
  };

  return (
    <div className="admin-page">
      {/* LEFT PANEL */}
      <div className="admin-left">
        <div className="admin-header">
          <h2>Управление клиентами</h2>
          <p className="admin-sub">Всего клиентов: {users.filter(u => u.role_id === 2).length}</p>
        </div>

        <div className="admin-stats">
          <div className="astat"><div className="astat-val">{stats.users}</div><div className="astat-lbl">Клиентов</div></div>
          <div className="astat"><div className="astat-val">{stats.cards}</div><div className="astat-lbl">Карт</div></div>
          <div className="astat"><div className="astat-val">{stats.scores}</div><div className="astat-lbl">Счетов</div></div>
          <div className="astat"><div className="astat-val">{fmt(stats.totalBalance).split(',')[0]}</div><div className="astat-lbl">Баланс ₽</div></div>
        </div>

        <input className="admin-search" placeholder="🔍 Поиск по имени или email..." value={search} onChange={e => setSearch(e.target.value)} />

        <div className="clients-list">
          {filtered.map((u, i) => (
            <div key={u.id} className={`client-row ${selectedUser?.id === u.id ? 'selected' : ''} ${u.is_blocked ? 'blocked-row' : ''}`} onClick={() => openUser(u)}>
              <div className="cr-avatar" style={{ background: colors[i % colors.length] }}>
                {u.name.charAt(0).toUpperCase()}
              </div>
              <div className="cr-info">
                <div className="cr-name">{u.name} {u.is_blocked && <span className="mini-blocked">⛔</span>}</div>
                <div className="cr-email">{u.login}</div>
              </div>
              <div className="cr-right">
                <div className="cr-balance">{fmt(u.total_balance)} ₽</div>
                <div className="cr-meta">{u.cards_count} карт</div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="empty-admin">Ничего не найдено</p>}
        </div>
      </div>

      {/* RIGHT PANEL — Detail */}
      <div className="admin-right">
        {!selectedUser ? (
          <div className="admin-placeholder">
            <div className="ap-icon">👤</div>
            <div className="ap-text">Выберите клиента для просмотра деталей</div>
          </div>
        ) : (
          <div className="client-detail">
            <div className="cd-topbar">
              <div className="cd-title">
                <div className="cd-avatar" style={{ background: colors[users.findIndex(u => u.id === selectedUser.id) % colors.length] }}>
                  {selectedUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="cd-name">{selectedUser.name}</div>
                  <div className="cd-email">{selectedUser.login}</div>
                </div>
                {selectedUser.is_blocked && <span className="blocked-badge-user">ЗАБЛОКИРОВАН</span>}
              </div>
              <div className="cd-actions">
                <button className="cd-btn cd-btn-edit" onClick={() => { setEditMode(true); setEditName(selectedUser.name); setEditLogin(selectedUser.login); }}>✏️ Редактировать</button>
                <button className={`cd-btn ${selectedUser.is_blocked ? 'cd-btn-unblock' : 'cd-btn-block'}`} onClick={() => handleBlock(selectedUser.id)}>
                  {selectedUser.is_blocked ? '🔓 Разблокировать' : '🚫 Заблокировать'}
                </button>
                <button className="cd-btn cd-btn-delete" onClick={() => handleDelete(selectedUser.id)}>🗑️ Удалить</button>
              </div>
            </div>

            {msg && <div className="cd-msg">{msg}</div>}

            {editMode && (
              <div className="cd-edit-form">
                <h4>Редактирование данных</h4>
                <div className="cd-edit-row">
                  <div className="cd-field"><label>Имя</label><input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                  <div className="cd-field"><label>Email</label><input type="email" value={editLogin} onChange={e => setEditLogin(e.target.value)} /></div>
                </div>
                <div className="cd-edit-btns">
                  <button className="cd-btn cd-btn-save" onClick={handleEdit} disabled={loading}>{loading ? 'Сохранение...' : '✅ Сохранить'}</button>
                  <button className="cd-btn cd-btn-cancel" onClick={() => setEditMode(false)}>Отмена</button>
                </div>
              </div>
            )}

            {userDetail && (
              <>
                {/* Cards */}
                <div className="cd-section">
                  <h4>Карты ({userDetail.cards.length})</h4>
                  {userDetail.cards.length === 0 && <p className="empty-admin">Нет карт</p>}
                  <div className="cd-cards-grid">
                    {userDetail.cards.map(card => {
                      const isCredit = card.category_name === 'Кредитный';
                      const debt = isCredit ? parseFloat(card.credit_limit || 0) - parseFloat(card.balance) : 0;
                      return (
                        <div key={card.id} className={`cd-card ${isCredit ? 'cc-credit' : card.category_name === 'Виртуальный' ? 'cc-virtual' : 'cc-debit'} ${card.is_blocked ? 'cc-blocked' : ''}`}>
                          <div className="cc-top">
                            <div className="cc-type">{card.category_name}</div>
                            {card.is_blocked && <span className="cc-blocked-tag">⛔</span>}
                          </div>
                          <div className="cc-number">•••• {card.number_card.slice(-4)}</div>
                          <div className="cc-balance">{fmt(card.balance)} ₽</div>
                          {isCredit && debt > 0 && <div className="cc-debt">Долг: {fmt(debt)} ₽</div>}
                          <div className="cc-exp">до {card.date_finish?.slice(5, 7)}/{card.date_finish?.slice(2, 4)}</div>
                          <button className="cc-block-btn" onClick={() => handleBlockCard(card.id)}>
                            {card.is_blocked ? '🔓 Разблок.' : '🔒 Заблок.'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scores */}
                {userDetail.scores.length > 0 && (
                  <div className="cd-section">
                    <h4>Накопительные счета ({userDetail.scores.length})</h4>
                    <div className="cd-scores-list">
                      {userDetail.scores.map(s => (
                        <div key={s.id} className="cd-score-row">
                          <div className="csr-info">
                            <div className="csr-type">{s.type_name} · {s.percent}%</div>
                            <div className="csr-num">{s.number_score}</div>
                          </div>
                          <div className="csr-balance">{fmt(s.balance)} ₽</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Transactions */}
                <div className="cd-section">
                  <h4>Последние операции ({userDetail.transactions.length})</h4>
                  {userDetail.transactions.length === 0 && <p className="empty-admin">Нет операций</p>}
                  <div className="cd-tx-list">
                    {userDetail.transactions.slice(0, 10).map(tx => {
                      const isOut = !!tx.sender_card;
                      return (
                        <div key={tx.id} className="cd-tx-row">
                          <div className={`cd-tx-icon ${isOut ? 'tx-out' : 'tx-in'}`}>{isOut ? '↙' : '↗'}</div>
                          <div className="cd-tx-info">
                            <div className="cd-tx-desc">{tx.description || tx.status_name}</div>
                            <div className="cd-tx-meta">
                              {tx.sender_card && `•••• ${tx.sender_card.slice(-4)}`}
                              {tx.address_card && ` → •••• ${tx.address_card.slice(-4)}`}
                            </div>
                          </div>
                          <div className={`cd-tx-sum ${isOut ? 'sum-out' : 'sum-in'}`}>
                            {isOut ? '-' : '+'}{fmt(tx.sum)} ₽
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
