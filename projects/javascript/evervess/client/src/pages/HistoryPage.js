import React, { useEffect, useState } from 'react';
import api from '../api';
import './Pages.css';

export default function HistoryPage() {
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/transactions').then(r => setTransactions(r.data)).catch(() => {});
  }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);

  const filtered = filter === 'all' ? transactions : transactions.filter(tx => {
    if (filter === 'income') return !(tx.sender_card || tx.sender_score) || tx.tx_type === 'topup';
    if (filter === 'expense') return !!(tx.sender_card || tx.sender_score) && tx.tx_type !== 'topup';
    return true;
  });

  return (
    <div className="page">
      <div className="page-header-row">
        <div><h2>История операций</h2><p className="page-sub">Все ваши транзакции</p></div>
        <div className="header-btns">
          <select className="filter-select" value={filter} onChange={e => setFilter(e.target.value)}>
            <option value="all">Все операции</option>
            <option value="income">Входящие</option>
            <option value="expense">Исходящие</option>
          </select>
        </div>
      </div>

      <div className="tx-list-card">
        {filtered.length === 0 && <p className="empty-text" style={{ padding: 20 }}>Нет операций</p>}
        {filtered.map(tx => {
          const isOut = !!(tx.sender_card || tx.sender_score) && tx.tx_type !== 'topup';
          return (
            <div key={tx.id} className="tx-list-item">
              <div className={`tx-li-icon ${isOut ? 'expense' : 'income'}`}>{isOut ? '↙' : '↗'}</div>
              <div className="tx-li-info">
                <div className="tx-li-name">{tx.description || tx.status_name}</div>
                <div className="tx-li-meta">
                  {tx.sender_card && `•••• ${tx.sender_card.slice(-4)}`}
                  {tx.address_card && ` → •••• ${tx.address_card.slice(-4)}`}
                  {tx.sender_score && `Счёт •••• ${tx.sender_score.slice(-4)}`}
                  {tx.address_score && ` → Счёт •••• ${tx.address_score.slice(-4)}`}
                  {tx.created_at && ` · ${new Date(tx.created_at).toLocaleString('ru-RU')}`}
                </div>
              </div>
              <div className="tx-li-right">
                <div className={`tx-li-amount ${isOut ? 'neg' : 'pos'}`}>{isOut ? '-' : '+'}{fmt(tx.sum)} ₽</div>
                <div className="tx-li-status">{tx.status_name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
