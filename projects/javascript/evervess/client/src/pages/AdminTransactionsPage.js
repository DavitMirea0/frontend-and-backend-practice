import React, { useEffect, useState } from 'react';
import api from '../api';
import './Admin.css';

export default function AdminTransactionsPage() {
  const [txs, setTxs] = useState([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/admin/transactions').then(r => setTxs(r.data)).catch(() => {});
  }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);

  const filtered = txs.filter(tx => {
    const matchSearch =
      tx.sender_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.address_name?.toLowerCase().includes(search.toLowerCase()) ||
      tx.description?.toLowerCase().includes(search.toLowerCase()) ||
      tx.sender_card?.includes(search) ||
      tx.address_card?.includes(search);
    if (filter === 'transfer') return matchSearch && tx.tx_type === 'transfer';
    if (filter === 'payment') return matchSearch && tx.tx_type === 'payment';
    if (filter === 'topup') return matchSearch && tx.tx_type?.includes('topup');
    return matchSearch;
  });

  const typeLabel = (t) => {
    if (t === 'transfer') return 'Перевод';
    if (t === 'payment') return 'Платёж';
    if (t === 'topup') return 'Пополнение';
    if (t === 'topup_score') return 'Счёт';
    return t || '—';
  };

  return (
    <div className="page" style={{ maxWidth: 1100 }}>
      <div className="page-header-row" style={{ marginBottom: 20 }}>
        <div><h2>Все транзакции</h2><p className="page-sub">Последние 100 операций</p></div>
        <div style={{ display: 'flex', gap: 10 }}>
          <input className="admin-search-sm" placeholder="Поиск..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Все</option>
            <option value="transfer">Переводы</option>
            <option value="payment">Платежи</option>
            <option value="topup">Пополнения</option>
          </select>
        </div>
      </div>

      <div className="admin-cards-table">
        <div className="atx-header">
          <div>ID</div>
          <div>Тип</div>
          <div>Отправитель</div>
          <div>Получатель</div>
          <div>Описание</div>
          <div>Сумма</div>
          <div>Статус</div>
        </div>
        {filtered.map(tx => (
          <div key={tx.id} className="atx-row">
            <div className="atx-id">#{tx.id}</div>
            <div><span className={`type-badge type-${tx.tx_type}`}>{typeLabel(tx.tx_type)}</span></div>
            <div className="atx-party">
              {tx.sender_name && <div className="atx-name">{tx.sender_name}</div>}
              {tx.sender_card && <div className="atx-card">•••• {tx.sender_card.slice(-4)}</div>}
              {!tx.sender_name && !tx.sender_card && <span className="atx-empty">—</span>}
            </div>
            <div className="atx-party">
              {tx.address_name && <div className="atx-name">{tx.address_name}</div>}
              {tx.address_card && <div className="atx-card">•••• {tx.address_card.slice(-4)}</div>}
              {!tx.address_name && !tx.address_card && <span className="atx-empty">—</span>}
            </div>
            <div className="atx-desc">{tx.description || '—'}</div>
            <div className="atx-sum">{fmt(tx.sum)} ₽</div>
            <div><span className={`status-pill ${tx.status_name === 'Успешно' ? 'pill-active' : 'pill-blocked'}`}>{tx.status_name}</span></div>
          </div>
        ))}
        {filtered.length === 0 && <p className="empty-admin" style={{ padding: 20 }}>Нет транзакций</p>}
      </div>
    </div>
  );
}
