import React, { useEffect, useState } from 'react';
import api from '../api';
import './Pages.css';

export default function CardsPage() {
  const [cards, setCards] = useState([]);
  const [categories, setCategories] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCat, setSelectedCat] = useState('');
  const [loading, setLoading] = useState(false);
  const [settingsCard, setSettingsCard] = useState(null);
  const [dailyLimit, setDailyLimit] = useState('');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [statementData, setStatementData] = useState(null);

  const load = () => {
    api.get('/cards').then(r => setCards(r.data)).catch(() => {});
    api.get('/cards/categories').then(r => setCategories(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);
  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);

  const createCard = async () => {
    if (!selectedCat) return; setLoading(true);
    try { await api.post('/cards', { category_id: parseInt(selectedCat) }); setShowCreate(false); setSelectedCat(''); load(); }
    catch (e) { alert(e.response?.data?.message || 'Ошибка'); } finally { setLoading(false); }
  };
  const blockCard = async (id) => { try { await api.put(`/cards/${id}/block`); load(); } catch (e) { alert(e.response?.data?.message); } };
  const openSettings = (c) => { setSettingsCard(c); setDailyLimit(c.daily_limit || 100000); setMonthlyLimit(c.monthly_limit || 1000000); };
  const saveSettings = async () => {
    try { await api.put(`/cards/${settingsCard.id}/settings`, { daily_limit: parseFloat(dailyLimit), monthly_limit: parseFloat(monthlyLimit) }); setSettingsCard(null); load(); }
    catch (e) { alert(e.response?.data?.message); }
  };
  const openStatement = async (id) => {
    try { const r = await api.get(`/cards/${id}/statement`); setStatementData(r.data); }
    catch (e) { alert(e.response?.data?.message); }
  };

  return (
    <div className="page">
      <div className="page-header"><h2>Управление картами</h2><p className="page-sub">Просматривайте и управляйте своими картами</p></div>
      <div className="cards-grid">
        {cards.map(card => {
          const isCredit = card.category_name === 'Кредитный';
          const debt = isCredit ? parseFloat(card.credit_limit) - parseFloat(card.balance) : 0;
          return (
            <div key={card.id} className="card-block">
              <div className={`bank-card ${isCredit ? 'credit' : card.category_name === 'Виртуальный' ? 'virtual' : 'debit'} ${card.is_blocked ? 'blocked' : ''}`}>
                {card.is_blocked && <div className="blocked-badge">ЗАБЛОКИРОВАНА</div>}
                <div className="bc-type">{card.category_name} карта</div>
                <div className="bc-number">•••• {card.number_card.slice(-4)}</div>
                <div className="bc-bal-label">Доступно</div>
                <div className="bc-bottom"><span className="bc-balance">{fmt(card.balance)} ₽</span><span className="bc-exp">{card.date_finish?.slice(5,7)}/{card.date_finish?.slice(2,4)}</span></div>
                {isCredit && <div className="bc-credit-info">Лимит: {fmt(card.credit_limit)} ₽{debt > 0 && <span className="debt-text"> · Долг: {fmt(debt)} ₽</span>}</div>}
              </div>
              <div className="card-actions-list">
                <div className="ca-item" onClick={() => blockCard(card.id)}>{card.is_blocked ? '🔓 Разблокировать' : '🔒 Заблокировать'} <span>›</span></div>
                <div className="ca-item" onClick={() => openSettings(card)}>⚙️ Настройки <span>›</span></div>
                <div className="ca-item" onClick={() => openStatement(card.id)}>📄 Выписка <span>›</span></div>
              </div>
            </div>
          );
        })}
      </div>
      {cards.length === 0 && <p className="empty-text" style={{textAlign:'center',marginTop:40}}>У вас пока нет карт</p>}
      <button className="btn-accent-full" onClick={() => setShowCreate(true)}>+ Заказать новую карту</button>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Новая карта</h3>
            <p className="modal-hint">Кредитная карта выпускается с лимитом 100 000 ₽</p>
            <div className="field"><label>Тип карты</label>
              <select value={selectedCat} onChange={e=>setSelectedCat(e.target.value)}>
                <option value="">Выберите тип</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="modal-buttons">
              <button className="btn-accent" onClick={createCard} disabled={loading}>{loading ? 'Создание...' : 'Создать'}</button>
              <button className="btn-cancel" onClick={() => setShowCreate(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}
      {settingsCard && (
        <div className="modal-overlay" onClick={() => setSettingsCard(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>⚙️ Настройки •••• {settingsCard.number_card.slice(-4)}</h3>
            <div className="settings-info">
              <p>Тип: <strong>{settingsCard.category_name}</strong></p>
              <p>Номер: <strong>{settingsCard.number_card.replace(/(.{4})/g,'$1 ').trim()}</strong></p>
              <p>CVC: <strong>{settingsCard.cvc}</strong></p>
              <p>Баланс: <strong>{fmt(settingsCard.balance)} ₽</strong></p>
              {settingsCard.category_name === 'Кредитный' && <p>Кредитный лимит: <strong>{fmt(settingsCard.credit_limit)} ₽</strong></p>}
            </div>
            <div className="field"><label>Дневной лимит (₽)</label><input type="number" value={dailyLimit} onChange={e=>setDailyLimit(e.target.value)} /></div>
            <div className="field"><label>Месячный лимит (₽)</label><input type="number" value={monthlyLimit} onChange={e=>setMonthlyLimit(e.target.value)} /></div>
            <div className="modal-buttons"><button className="btn-accent" onClick={saveSettings}>Сохранить</button><button className="btn-cancel" onClick={() => setSettingsCard(null)}>Закрыть</button></div>
          </div>
        </div>
      )}
      {statementData && (
        <div className="modal-overlay" onClick={() => setStatementData(null)}>
          <div className="modal modal-wide" onClick={e=>e.stopPropagation()}>
            <h3>📄 Выписка •••• {statementData.card.number_card.slice(-4)}</h3>
            <div className="settings-info"><p>Баланс: <strong>{fmt(statementData.card.balance)} ₽</strong></p></div>
            {statementData.transactions.length === 0 ? <p className="empty-text">Нет операций</p> : (
              <div className="statement-list">
                {statementData.transactions.map(tx => {
                  const isOut = tx.id_card_sender === statementData.card.id;
                  return (
                    <div key={tx.id} className="statement-row">
                      <div className={`st-icon ${isOut ? 'expense' : 'income'}`}>{isOut ? '↙' : '↗'}</div>
                      <div className="st-info"><div className="st-desc">{tx.description || tx.status_name}</div><div className="st-status">{tx.status_name}</div></div>
                      <div className={`st-amount ${isOut ? 'neg' : 'pos'}`}>{isOut?'-':'+'}{fmt(tx.sum)} ₽</div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="modal-buttons"><button className="btn-cancel" onClick={() => setStatementData(null)}>Закрыть</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
