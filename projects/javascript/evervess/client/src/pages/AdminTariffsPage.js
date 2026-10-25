import React, { useEffect, useState } from 'react';
import api from '../api';
import './Admin.css';

export default function AdminTariffsPage() {
  const [tariffs, setTariffs] = useState([]);
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');
  const [editPercent, setEditPercent] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');

  const load = () => api.get('/admin/tariffs').then(r => setTariffs(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const openEdit = (t) => {
    setEditId(t.id); setEditName(t.name); setEditPercent(t.percent); setMsg('');
  };

  const save = async () => {
    setLoading(true);
    try {
      await api.put(`/admin/tariffs/${editId}`, { name: editName, percent: parseFloat(editPercent) });
      setEditId(null); load(); setMsg('Тариф обновлён');
    } catch (e) { setMsg(e.response?.data?.message || 'Ошибка'); }
    finally { setLoading(false); }
  };

  const DESCRIPTIONS = {
    'Сберегательный': 'Стандартный накопительный счёт с умеренной ставкой. Пополнение в любое время.',
    'Депозитный': 'Максимальная доходность для долгосрочных накоплений. Фиксированная ставка.',
    'Текущий': 'Расчётный счёт для ежедневных операций. Мгновенный доступ к средствам.',
  };

  return (
    <div className="page" style={{ maxWidth: 900 }}>
      <div className="page-header">
        <h2>Управление тарифами</h2>
        <p className="page-sub">Настройка процентных ставок накопительных счетов</p>
      </div>

      {msg && <div className="cd-msg" style={{ marginBottom: 16 }}>{msg}</div>}

      <div className="tariffs-admin-grid">
        {tariffs.map(t => (
          <div key={t.id} className="tariff-admin-card">
            {editId === t.id ? (
              <div className="tac-edit">
                <h3>Редактирование</h3>
                <div className="cd-field"><label>Название</label><input value={editName} onChange={e => setEditName(e.target.value)} /></div>
                <div className="cd-field"><label>Ставка (%)</label><input type="number" step="0.1" min="0" max="100" value={editPercent} onChange={e => setEditPercent(e.target.value)} /></div>
                <div className="cd-edit-btns">
                  <button className="cd-btn cd-btn-save" onClick={save} disabled={loading}>{loading ? '...' : '✅ Сохранить'}</button>
                  <button className="cd-btn cd-btn-cancel" onClick={() => setEditId(null)}>Отмена</button>
                </div>
              </div>
            ) : (
              <>
                <div className="tac-percent">{t.percent}%</div>
                <div className="tac-period">годовых</div>
                <div className="tac-name">{t.name}</div>
                <p className="tac-desc">{DESCRIPTIONS[t.name] || 'Накопительный продукт банка'}</p>
                <button className="cd-btn cd-btn-edit" style={{ marginTop: 16 }} onClick={() => openEdit(t)}>
                  ✏️ Изменить ставку
                </button>
              </>
            )}
          </div>
        ))}
      </div>

      <div className="tariff-note">
        <div className="tn-icon">ℹ️</div>
        <div>
          <strong>Важно:</strong> Изменение ставки затронет только новые счета. Существующие счета клиентов сохраняют ставку на момент открытия.
        </div>
      </div>
    </div>
  );
}
