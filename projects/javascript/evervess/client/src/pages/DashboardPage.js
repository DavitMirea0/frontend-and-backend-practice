import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import './Dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [cards, setCards] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [scores, setScores] = useState([]);

  useEffect(() => {
    api.get('/cards').then(r => setCards(r.data)).catch(() => {});
    api.get('/transactions').then(r => setTransactions(r.data.slice(0, 5))).catch(() => {});
    api.get('/scores').then(r => setScores(r.data)).catch(() => {});
  }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);
  const totalBalance = cards.reduce((a, c) => a + parseFloat(c.balance), 0);
  const totalScores = scores.reduce((a, s) => a + parseFloat(s.balance), 0);
  const today = new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="dashboard">
      <div className="dash-header">
        <div><h2>Добро пожаловать в evervess!</h2><p className="dash-date">Сегодня {today}</p></div>
        <div className="user-badge">
          <div className="user-avatar">{user?.name?.charAt(0)?.toUpperCase()}</div>
          <div><div className="user-name">{user?.name}</div><div className="user-email">{user?.login}</div></div>
        </div>
      </div>
      <div className="balance-row">
        <div className="balance-card"><div className="balance-label">Баланс карт</div><div className="balance-amount">{fmt(totalBalance)} ₽</div></div>
        <div className="balance-card scores-balance"><div className="balance-label">Накопления</div><div className="balance-amount">{fmt(totalScores)} ₽</div></div>
      </div>
      <div className="quick-actions">
        <Link to="/transfers" className="qa-btn qa-accent">↗ Перевести</Link>
        <Link to="/cards" className="qa-btn">💳 Новая карта</Link>
        <Link to="/transfers?tab=topup" className="qa-btn">➕ Пополнить</Link>
        <Link to="/payments" className="qa-btn">⚡ Платежи</Link>
      </div>
      <div className="dash-grid">
        <div className="dash-section">
          <div className="section-head"><h3>Мои карты</h3><Link to="/cards" className="link-green">Все карты →</Link></div>
          {cards.length === 0 && <p className="empty-text">У вас пока нет карт</p>}
          {cards.map(card => {
            const isCredit = card.category_name === 'Кредитный';
            const debt = isCredit ? parseFloat(card.credit_limit) - parseFloat(card.balance) : 0;
            return (
              <div key={card.id} className={`mini-card ${isCredit ? 'credit' : 'debit'} ${card.is_blocked ? 'blocked-card' : ''}`}>
                {card.is_blocked && <div className="blocked-tag">ЗАБЛОКИРОВАНА</div>}
                <div className="mc-type">{card.category_name} карта</div>
                <div className="mc-number">•••• {card.number_card.slice(-4)}</div>
                <div className="mc-balance-label">Доступно</div>
                <div className="mc-bottom">
                  <span className="mc-balance">{fmt(card.balance)} ₽</span>
                  <span className="mc-exp">{card.date_finish?.slice(5,7)}/{card.date_finish?.slice(2,4)}</span>
                </div>
                {isCredit && debt > 0 && <div className="mc-debt">Задолженность: {fmt(debt)} ₽</div>}
              </div>
            );
          })}
        </div>
        <div className="dash-section">
          <div className="section-head"><h3>Последние операции</h3><Link to="/history" className="link-green">Все →</Link></div>
          {transactions.length === 0 && <p className="empty-text">Нет операций</p>}
          {transactions.map(tx => {
            const isOut = !!(tx.sender_card || tx.sender_score);
            const isTopupExt = tx.tx_type === 'topup' && !tx.sender_card;
            return (
              <div key={tx.id} className="tx-row">
                <div className={`tx-icon ${isOut && !isTopupExt ? 'expense' : 'income'}`}>{isOut && !isTopupExt ? '↙' : '↗'}</div>
                <div className="tx-info"><div className="tx-name">{tx.description || tx.status_name}</div><div className="tx-meta">{tx.status_name}</div></div>
                <div className={`tx-amount ${isOut && !isTopupExt ? 'neg' : 'pos'}`}>{isOut && !isTopupExt ? '-' : '+'}{fmt(tx.sum)} ₽</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
