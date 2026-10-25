import React, { useEffect, useState } from 'react';
import api from '../api';
import './Pages.css';

const SERVICES = [
  { id: 'zhkh', name: 'ЖКХ', icon: '🏠', desc: 'Квартплата, вода, электричество' },
  { id: 'mobile', name: 'Мобильная связь', icon: '📱', desc: 'Оплата мобильного телефона' },
  { id: 'internet', name: 'Интернет', icon: '🌐', desc: 'Домашний интернет и ТВ' },
  { id: 'transport', name: 'Транспорт', icon: '🚌', desc: 'Проездные и штрафы' },
  { id: 'education', name: 'Образование', icon: '📚', desc: 'Оплата обучения' },
  { id: 'taxes', name: 'Налоги', icon: '🏛', desc: 'Налоги и госпошлины' },
];

export default function PaymentsPage() {
  const [cards, setCards] = useState([]);
  const [selected, setSelected] = useState(null);
  const [cardId, setCardId] = useState('');
  const [sum, setSum] = useState('');
  const [account, setAccount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/cards').then(r => setCards(r.data.filter(c => !c.is_blocked))).catch(() => {});
  }, []);

  const fmt = (n) => new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2 }).format(n);

  const handlePay = async (e) => {
    e.preventDefault(); setError(''); setSuccess('');
    if (!cardId || !sum) { setError('Заполните все поля'); return; }
    setLoading(true);
    try {
      await api.post('/payments/pay', {
        card_id: parseInt(cardId),
        sum: parseFloat(sum),
        description: `${selected.name}: ${account || 'б/н'}`,
      });
      setSuccess(`Оплата ${selected.name} выполнена!`);
      setSum(''); setAccount('');
      api.get('/cards').then(r => setCards(r.data.filter(c => !c.is_blocked)));
    } catch (e) { setError(e.response?.data?.message || 'Ошибка'); }
    finally { setLoading(false); }
  };

  return (
    <div className="page">
      <div className="page-header"><h2>Платежи</h2><p className="page-sub">Оплата услуг и счетов</p></div>

      {!selected ? (
        <div className="services-grid">
          {SERVICES.map(s => (
            <div key={s.id} className="service-card" onClick={() => setSelected(s)}>
              <div className="svc-icon">{s.icon}</div>
              <div className="svc-name">{s.name}</div>
              <div className="svc-desc">{s.desc}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="form-card">
          <button className="back-btn" onClick={() => { setSelected(null); setError(''); setSuccess(''); }}>← Назад</button>
          <h3>{selected.icon} {selected.name}</h3>
          {error && <div className="msg-error">{error}</div>}
          {success && <div className="msg-success">{success}</div>}
          <form onSubmit={handlePay}>
            <div className="field"><label>Карта списания</label>
              <select value={cardId} onChange={e => setCardId(e.target.value)} required>
                <option value="">Выберите</option>
                {cards.map(c => <option key={c.id} value={c.id}>•••• {c.number_card.slice(-4)} — {fmt(c.balance)} ₽</option>)}
              </select>
            </div>
            <div className="field"><label>Лицевой счёт / номер</label><input placeholder="Номер" value={account} onChange={e => setAccount(e.target.value)} /></div>
            <div className="field"><label>Сумма</label><input type="number" placeholder="0" value={sum} onChange={e => setSum(e.target.value)} required min="0.01" step="0.01" /></div>
            <button type="submit" className="btn-accent" disabled={loading}>{loading ? 'Оплата...' : 'Оплатить'}</button>
          </form>
        </div>
      )}
    </div>
  );
}
