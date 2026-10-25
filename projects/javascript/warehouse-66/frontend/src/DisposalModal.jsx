import React, { useEffect, useState } from 'react';
import { api } from './api.js';

export default function DisposalModal({ onClose, onDone }) {
  const [days, setDays]       = useState(30);
  const [items, setItems]     = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [done, setDone]       = useState(0);

  async function load() {
    setLoading(true);
    try {
      const BASE = '/api';
      const token = (() => {
        try { return JSON.parse(localStorage.getItem('wh66_auth'))?.token; } catch { return null; }
      })();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch(`${BASE}/storage-units/old?days=${days}`, { headers });
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
      setSelected(new Set());
    } catch { setItems([]); }
    setLoading(false);
  }

  useEffect(() => { load(); }, [days]);

  function toggleAll() {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map(i => i.order_number)));
  }
  function toggle(id) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }

  async function writeOff() {
    if (!selected.size) return;
    if (!confirm(`Списать ${selected.size} ордер(ов)? Операция необратима.`)) return;
    setBusy(true);
    let count = 0;
    const token = (() => {
      try { return JSON.parse(localStorage.getItem('wh66_auth'))?.token; } catch { return null; }
    })();
    for (const id of selected) {
      try {
        await fetch(`/api/storage-units/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        count++;
      } catch { /* пропустить */ }
    }
    setBusy(false);
    setDone(count);
    await load();
    onDone?.(`Списано ${count} ордер(ов)`);
  }

  const totalQty = items.filter(i => selected.has(i.order_number))
                        .reduce((a, b) => a + parseFloat(b.quantity), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(860px, 95vw)' }}>
        <h2>Утилизация просрочки</h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginBottom: 12 }}>
          Список ордеров, созданных более чем{' '}
          <select value={days} onChange={e => setDays(+e.target.value)}
            style={{ background: 'var(--bg-input)', border: '1px solid rgba(255,255,255,0.1)',
                     color: 'var(--text-primary)', borderRadius: 4, padding: '2px 6px' }}>
            {[7, 14, 30, 60, 90].map(d => <option key={d} value={d}>{d} дней назад</option>)}
          </select>
          {' '} — выберите для списания.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: 'var(--text-secondary)' }}>Загрузка...</div>
        ) : items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#7dc97a' }}>
            Ордеров старше {days} дней не найдено
          </div>
        ) : (
          <>
            <div style={{ maxHeight: 320, overflowY: 'auto', marginBottom: 12 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" checked={selected.size === items.length && items.length > 0}
                      onChange={toggleAll}/></th>
                    <th>№ ордера</th>
                    <th>Дата</th>
                    <th>Дней</th>
                    <th>Материал</th>
                    <th>Поставщик</th>
                    <th>Кол-во</th>
                    <th>Ед.изм.</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(i => (
                    <tr key={i.order_number}
                      style={{ opacity: selected.has(i.order_number) ? 1 : 0.7 }}>
                      <td><input type="checkbox"
                        checked={selected.has(i.order_number)}
                        onChange={() => toggle(i.order_number)}/></td>
                      <td>{i.order_number}</td>
                      <td>{new Date(i.order_date).toLocaleDateString('ru')}</td>
                      <td style={{ color: i.age_days > 60 ? '#e8848d' : '#f5a142' }}>
                        {i.age_days}
                      </td>
                      <td>{i.material_name}</td>
                      <td>{i.supplier_name}</td>
                      <td>{parseFloat(i.quantity).toLocaleString('ru')}</td>
                      <td>{i.unit_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selected.size > 0 && (
              <div style={{
                background: 'rgba(232,132,141,0.1)',
                border: '1px solid rgba(232,132,141,0.3)',
                borderRadius: 6, padding: '10px 14px', fontSize: 13,
                marginBottom: 12, color: 'var(--text-primary)',
              }}>
                Выбрано <b>{selected.size}</b> ордер(ов),
                суммарное количество: <b>{totalQty.toLocaleString('ru')}</b> ед.
              </div>
            )}
          </>
        )}

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose}>Закрыть</button>
          {selected.size > 0 && (
            <button className="btn-primary" onClick={writeOff} disabled={busy}
              style={{ background: 'rgba(232,132,141,0.2)', borderColor: '#e8848d' }}>
              {busy ? 'Списываем...' : `Списать ${selected.size} ордер(ов)`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
