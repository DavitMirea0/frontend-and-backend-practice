import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api';
import './Pages.css';

export default function TransfersPage() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState(searchParams.get('tab') || 'transfer');
  const [cards, setCards] = useState([]);
  const [scores, setScores] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [senderCardId, setSenderCardId] = useState('');
  const [addressNum, setAddressNum] = useState('');
  const [sum, setSum] = useState('');

  const [topupTarget, setTopupTarget] = useState('');
  const [topupSource, setTopupSource] = useState('');
  const [topupSum, setTopupSum] = useState('');

  const [scoreId, setScoreId] = useState('');
  const [scoreCardId, setScoreCardId] = useState('');
  const [scoreSum, setScoreSum] = useState('');
  const [scoreDirection, setScoreDirection] = useState('to');

  const [creditCardId, setCreditCardId] = useState('');
  const [debitCardId, setDebitCardId] = useState('');
  const [creditSum, setCreditSum] = useState('');

  const load = () => {
    api.get('/cards').then(r => setCards(r.data)).catch(() => {});
    api.get('/scores').then(r => setScores(r.data)).catch(() => {});
  };
  useEffect(() => { load(); }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);
  const reset = () => { setError(''); setSuccess(''); };

  const allActive = cards.filter(c => !c.is_blocked);
  const debitCards = cards.filter(c => c.category_name !== 'Кредитный' && !c.is_blocked);
  const creditCards = cards.filter(c => c.category_name === 'Кредитный' && !c.is_blocked);

  const handleTransfer = async (e) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      await api.post('/transactions/card-transfer', { sender_card_id: parseInt(senderCardId), address_card_number: addressNum.replace(/\s/g, ''), sum: parseFloat(sum) });
      setSuccess('Перевод выполнен!'); setSum(''); setAddressNum(''); load();
    } catch (e) { setError(e.response?.data?.message || 'Ошибка'); } finally { setLoading(false); }
  };

  const handleTopup = async (e) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const body = { target_card_id: parseInt(topupTarget), sum: parseFloat(topupSum) };
      if (topupSource) body.source_card_id = parseInt(topupSource);
      await api.post('/transactions/topup-card', body);
      setSuccess('Пополнение выполнено!'); setTopupSum(''); load();
    } catch (e) { setError(e.response?.data?.message || 'Ошибка'); } finally { setLoading(false); }
  };

  const handleScore = async (e) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      const url = scoreDirection === 'to' ? '/transactions/topup-score' : '/transactions/withdraw-score';
      await api.post(url, { score_id: parseInt(scoreId), card_id: parseInt(scoreCardId), sum: parseFloat(scoreSum) });
      setSuccess(scoreDirection === 'to' ? 'Счёт пополнен!' : 'Средства выведены на карту!'); setScoreSum(''); load();
    } catch (e) { setError(e.response?.data?.message || 'Ошибка'); } finally { setLoading(false); }
  };

  const handlePayCredit = async (e) => {
    e.preventDefault(); reset(); setLoading(true);
    try {
      await api.post('/transactions/pay-credit', { credit_card_id: parseInt(creditCardId), debit_card_id: parseInt(debitCardId), sum: parseFloat(creditSum) });
      setSuccess('Задолженность погашена!'); setCreditSum(''); load();
    } catch (e) { setError(e.response?.data?.message || 'Ошибка'); } finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header"><h2>Переводы и пополнения</h2><p className="page-sub">Управление средствами</p></div>

      <div className="transfer-tabs">
        <div className={`tab ${tab==='transfer'?'active':''}`} onClick={()=>{setTab('transfer');reset();}}>↗ Перевод</div>
        <div className={`tab ${tab==='topup'?'active':''}`} onClick={()=>{setTab('topup');reset();}}>➕ Пополнение</div>
        <div className={`tab ${tab==='score'?'active':''}`} onClick={()=>{setTab('score');reset();}}>💰 Накопления</div>
        {creditCards.length > 0 && <div className={`tab ${tab==='credit'?'active':''}`} onClick={()=>{setTab('credit');reset();}}>💳 Погасить кредит</div>}
      </div>

      {error && <div className="msg-error">{error}</div>}
      {success && <div className="msg-success">{success}</div>}

      {tab === 'transfer' && (
        <div className="form-card">
          <h3>Перевод на карту</h3>
          <form onSubmit={handleTransfer}>
            <div className="field"><label>С какой карты</label>
              <select value={senderCardId} onChange={e=>setSenderCardId(e.target.value)} required>
                <option value="">Выберите</option>
                {allActive.map(c => <option key={c.id} value={c.id}>•••• {c.number_card.slice(-4)} — {fmt(c.balance)} ₽ ({c.category_name})</option>)}
              </select>
            </div>
            <div className="field"><label>Номер карты получателя</label><input placeholder="0000000000000000" value={addressNum} onChange={e=>setAddressNum(e.target.value)} required maxLength={16} /></div>
            <div className="field"><label>Сумма</label><input type="number" placeholder="0" value={sum} onChange={e=>setSum(e.target.value)} required min="0.01" step="0.01" /></div>
            <button type="submit" className="btn-accent" disabled={loading}>{loading?'Отправка...':'Перевести'}</button>
            <p className="note-text">Комиссия за перевод не взимается</p>
          </form>
        </div>
      )}

      {tab === 'topup' && (
        <div className="form-card">
          <h3>Пополнение карты</h3>
          <form onSubmit={handleTopup}>
            <div className="field"><label>Какую карту пополнить</label>
              <select value={topupTarget} onChange={e=>setTopupTarget(e.target.value)} required>
                <option value="">Выберите</option>
                {allActive.map(c => <option key={c.id} value={c.id}>•••• {c.number_card.slice(-4)} — {fmt(c.balance)} ₽</option>)}
              </select>
            </div>
            <div className="field"><label>Откуда (своя карта, необязательно)</label>
              <select value={topupSource} onChange={e=>setTopupSource(e.target.value)}>
                <option value="">Внешнее пополнение</option>
                {allActive.filter(c=>String(c.id)!==topupTarget).map(c => <option key={c.id} value={c.id}>•••• {c.number_card.slice(-4)} — {fmt(c.balance)} ₽</option>)}
              </select>
            </div>
            <div className="field"><label>Сумма</label><input type="number" placeholder="0" value={topupSum} onChange={e=>setTopupSum(e.target.value)} required min="0.01" step="0.01" /></div>
            <button type="submit" className="btn-accent" disabled={loading}>{loading?'Пополнение...':'Пополнить'}</button>
          </form>
        </div>
      )}

      {tab === 'score' && (
        <div className="form-card">
          <h3>Накопительный счёт ↔ Карта</h3>
          <div className="toggle-row">
            <button className={`toggle-btn ${scoreDirection==='to'?'active':''}`} onClick={()=>setScoreDirection('to')}>Карта → Счёт</button>
            <button className={`toggle-btn ${scoreDirection==='from'?'active':''}`} onClick={()=>setScoreDirection('from')}>Счёт → Карта</button>
          </div>
          <form onSubmit={handleScore}>
            <div className="field"><label>Счёт</label>
              <select value={scoreId} onChange={e=>setScoreId(e.target.value)} required>
                <option value="">Выберите счёт</option>
                {scores.map(s => <option key={s.id} value={s.id}>{s.type_name} — {fmt(s.balance)} ₽ ({s.percent}%)</option>)}
              </select>
            </div>
            <div className="field"><label>Карта</label>
              <select value={scoreCardId} onChange={e=>setScoreCardId(e.target.value)} required>
                <option value="">Выберите карту</option>
                {allActive.map(c => <option key={c.id} value={c.id}>•••• {c.number_card.slice(-4)} — {fmt(c.balance)} ₽</option>)}
              </select>
            </div>
            <div className="field"><label>Сумма</label><input type="number" placeholder="0" value={scoreSum} onChange={e=>setScoreSum(e.target.value)} required min="0.01" step="0.01" /></div>
            <button type="submit" className="btn-accent" disabled={loading}>{loading?'...': scoreDirection==='to'?'Пополнить счёт':'Вывести на карту'}</button>
          </form>
        </div>
      )}

      {tab === 'credit' && (
        <div className="form-card">
          <h3>Погашение задолженности</h3>
          {creditCards.map(c => {
            const debt = parseFloat(c.credit_limit) - parseFloat(c.balance);
            return <p key={c.id} className="credit-debt-info">•••• {c.number_card.slice(-4)}: долг <strong>{fmt(debt > 0 ? debt : 0)} ₽</strong> из лимита {fmt(c.credit_limit)} ₽</p>;
          })}
          <form onSubmit={handlePayCredit}>
            <div className="field"><label>Кредитная карта</label>
              <select value={creditCardId} onChange={e=>setCreditCardId(e.target.value)} required>
                <option value="">Выберите</option>
                {creditCards.map(c => <option key={c.id} value={c.id}>•••• {c.number_card.slice(-4)} — баланс {fmt(c.balance)} ₽</option>)}
              </select>
            </div>
            <div className="field"><label>Оплатить с дебетовой карты</label>
              <select value={debitCardId} onChange={e=>setDebitCardId(e.target.value)} required>
                <option value="">Выберите</option>
                {debitCards.map(c => <option key={c.id} value={c.id}>•••• {c.number_card.slice(-4)} — {fmt(c.balance)} ₽</option>)}
              </select>
            </div>
            <div className="field"><label>Сумма погашения</label><input type="number" placeholder="0" value={creditSum} onChange={e=>setCreditSum(e.target.value)} required min="0.01" step="0.01" /></div>
            <button type="submit" className="btn-accent" disabled={loading}>{loading?'Оплата...':'Погасить'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
