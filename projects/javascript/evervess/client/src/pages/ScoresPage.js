import React, { useEffect, useState } from 'react';
import api from '../api';
import './Pages.css';

export default function ScoresPage() {
  const [scores, setScores] = useState([]);
  const [types, setTypes] = useState([]);
  const [cards, setCards] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedType, setSelectedType] = useState('');
  const [loading, setLoading] = useState(false);
  const [actionScore, setActionScore] = useState(null);
  const [actionDir, setActionDir] = useState('to');
  const [actionCard, setActionCard] = useState('');
  const [actionSum, setActionSum] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    api.get('/scores').then(r => setScores(r.data)).catch(() => {});
    api.get('/scores/types').then(r => setTypes(r.data)).catch(() => {});
    api.get('/cards').then(r => setCards(r.data.filter(c => !c.is_blocked))).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);

  const createScore = async () => {
    if (!selectedType) return; setLoading(true);
    try { await api.post('/scores', { score_type_id: parseInt(selectedType) }); setShowCreate(false); setSelectedType(''); load(); }
    catch (e) { alert(e.response?.data?.message || 'Ошибка'); } finally { setLoading(false); }
  };

  const handleAction = async (e) => {
    e.preventDefault(); setError(''); setSuccess(''); setLoading(true);
    try {
      const url = actionDir === 'to' ? '/transactions/topup-score' : '/transactions/withdraw-score';
      await api.post(url, { score_id: actionScore.id, card_id: parseInt(actionCard), sum: parseFloat(actionSum) });
      setSuccess(actionDir === 'to' ? 'Счёт пополнен!' : 'Средства выведены!');
      setActionSum(''); load();
    } catch (e) { setError(e.response?.data?.message || 'Ошибка'); }
    finally { setLoading(false); }
  };

  const gradients = [
    'linear-gradient(135deg, #2a2a50, #1e1e3a)',
    'linear-gradient(135deg, #1a4a30, #2a5a3a)',
    'linear-gradient(135deg, #4a2a50, #3a1a4a)',
    'linear-gradient(135deg, #4a3a1a, #3a2a10)',
  ];

  return (
    <div className="page">
      <div className="page-header"><h2>Накопления</h2><p className="page-sub">Управляйте счетами и накоплениями</p></div>

      {scores.length === 0 && <p className="empty-text">У вас пока нет открытых счетов</p>}

      <div className="scores-grid">
        {scores.map((s, i) => (
          <div key={s.id} className="score-card" style={{ background: gradients[i % gradients.length] }}>
            <div className="sc-type">{s.type_name}</div>
            <div className="sc-number">№ {s.number_score}</div>
            <div className="sc-percent">Ставка: {s.percent}% годовых</div>
            <div className="sc-balance">{fmt(s.balance)} ₽</div>
            <div className="sc-dates">
              Открыт: {new Date(s.date_create).toLocaleDateString('ru-RU')} · До: {new Date(s.date_finish).toLocaleDateString('ru-RU')}
            </div>
            <div className="sc-actions">
              <button className="sc-btn" onClick={() => { setActionScore(s); setActionDir('to'); setError(''); setSuccess(''); }}>Пополнить</button>
              <button className="sc-btn" onClick={() => { setActionScore(s); setActionDir('from'); setError(''); setSuccess(''); }}>Вывести</button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn-accent-full" onClick={() => setShowCreate(true)}>+ Открыть новый счёт</button>

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Открыть счёт</h3>
            <div className="field"><label>Тип счёта</label>
              <select value={selectedType} onChange={e => setSelectedType(e.target.value)}>
                <option value="">Выберите</option>
                {types.map(t => <option key={t.id} value={t.id}>{t.name} ({t.percent}% годовых)</option>)}
              </select>
            </div>
            <div className="modal-buttons">
              <button className="btn-accent" onClick={createScore} disabled={loading}>{loading ? 'Открытие...' : 'Открыть'}</button>
              <button className="btn-cancel" onClick={() => setShowCreate(false)}>Отмена</button>
            </div>
          </div>
        </div>
      )}

      {actionScore && (
        <div className="modal-overlay" onClick={() => setActionScore(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>{actionDir === 'to' ? '➕ Пополнить счёт' : '💸 Вывести со счёта'}</h3>
            <div className="settings-info">
              <p>{actionScore.type_name} · {actionScore.percent}% годовых</p>
              <p>Баланс: <strong>{fmt(actionScore.balance)} ₽</strong></p>
            </div>
            {error && <div className="msg-error">{error}</div>}
            {success && <div className="msg-success">{success}</div>}
            <form onSubmit={handleAction}>
              <div className="field"><label>Карта</label>
                <select value={actionCard} onChange={e => setActionCard(e.target.value)} required>
                  <option value="">Выберите</option>
                  {cards.map(c => <option key={c.id} value={c.id}>•••• {c.number_card.slice(-4)} — {fmt(c.balance)} ₽</option>)}
                </select>
              </div>
              <div className="field"><label>Сумма</label><input type="number" placeholder="0" value={actionSum} onChange={e => setActionSum(e.target.value)} required min="0.01" step="0.01" /></div>
              <div className="modal-buttons">
                <button type="submit" className="btn-accent" disabled={loading}>{loading ? '...' : actionDir === 'to' ? 'Пополнить' : 'Вывести'}</button>
                <button type="button" className="btn-cancel" onClick={() => setActionScore(null)}>Отмена</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
