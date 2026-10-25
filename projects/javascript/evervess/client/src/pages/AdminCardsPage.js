import React, { useEffect, useState } from 'react';
import api from '../api';
import './Admin.css';

export default function AdminCardsPage() {
  const [cards, setCards] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const load = () => api.get('/admin/cards').then(r => setCards(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);

  const filtered = cards.filter(c => {
    const matchSearch = c.owner_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.number_card.includes(search) ||
      c.owner_login?.toLowerCase().includes(search.toLowerCase());
    if (filter === 'blocked') return matchSearch && c.is_blocked;
    if (filter === 'active') return matchSearch && !c.is_blocked;
    if (filter === 'credit') return matchSearch && c.category_name === 'Кредитный';
    return matchSearch;
  });

  const handleBlock = async (cardId) => {
    try { await api.put(`/admin/cards/${cardId}/block`); load(); }
    catch (e) { alert(e.response?.data?.message || 'Ошибка'); }
  };

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div><h2>Карты клиентов</h2><p className="page-sub">Всего карт: {cards.length}</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="admin-search-sm" placeholder="Поиск по владельцу или номеру..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Все карты</option>
            <option value="active">Активные</option>
            <option value="blocked">Заблокированные</option>
            <option value="credit">Кредитные</option>
          </select>
        </div>
      </div>

      <div className="admin-cards-table">
        <div className="act-header">
          <div>Карта</div>
          <div>Владелец</div>
          <div>Тип</div>
          <div>Баланс</div>
          <div>Срок</div>
          <div>Статус</div>
          <div>Действие</div>
        </div>
        {filtered.map(card => {
          const isCredit = card.category_name === 'Кредитный';
          const debt = isCredit ? parseFloat(card.credit_limit || 0) - parseFloat(card.balance) : 0;
          return (
            <div key={card.id} className={`act-row ${card.is_blocked ? 'act-blocked' : ''}`}>
              <div className="act-card-num">
                <div className={`act-card-dot ${isCredit ? 'dot-credit' : card.category_name === 'Виртуальный' ? 'dot-virtual' : 'dot-debit'}`} />
                <div>
                  <div>•••• {card.number_card.slice(-4)}</div>
                  {isCredit && debt > 0 && <div className="act-debt">Долг: {fmt(debt)} ₽</div>}
                </div>
              </div>
              <div className="act-owner">
                <div className="act-owner-name">{card.owner_name}</div>
                <div className="act-owner-email">{card.owner_login}</div>
              </div>
              <div><span className={`type-badge type-${card.category_name?.toLowerCase()}`}>{card.category_name}</span></div>
              <div className="act-balance">{fmt(card.balance)} ₽</div>
              <div className="act-exp">{card.date_finish?.slice(5, 7)}/{card.date_finish?.slice(2, 4)}</div>
              <div>
                <span className={`status-pill ${card.is_blocked ? 'pill-blocked' : 'pill-active'}`}>
                  {card.is_blocked ? 'Заблокирована' : 'Активна'}
                </span>
              </div>
              <div>
                <button className={`act-action-btn ${card.is_blocked ? 'btn-unblock' : 'btn-block'}`} onClick={() => handleBlock(card.id)}>
                  {card.is_blocked ? 'Разблок.' : 'Заблок.'}
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="empty-admin" style={{ padding: 20 }}>Ничего не найдено</p>}
      </div>
    </div>
  );
}
