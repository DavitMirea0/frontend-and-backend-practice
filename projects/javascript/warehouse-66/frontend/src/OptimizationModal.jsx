import React, { useEffect, useState } from 'react';

const WAREHOUSES = [
  { code: 1, name: 'общий-2',      capacity: 3000, address: 'ул. Станколит, 5'    },
  { code: 2, name: 'сортировочный', capacity: 1000, address: 'ул. Малая Ордынка, 6' },
  { code: 3, name: 'общий',         capacity: 1500, address: 'ш. Бесединское, 7'    },
  { code: 4, name: 'утилизация',    capacity: 500,  address: 'ул. Тимура Фрунзе, 4' },
];

function statusColor(pct) {
  if (pct >= 80) return '#e8848d';
  if (pct >= 50) return '#f5a142';
  if (pct >= 20) return '#f5c451';
  return '#7dc97a';
}
function statusLabel(pct) {
  if (pct >= 80) return 'ПЕРЕГРУЖЕН';
  if (pct >= 50) return 'Заполнен наполовину';
  if (pct >= 20) return 'Есть место';
  return 'Почти пустой';
}

function getToken() {
  try { return JSON.parse(localStorage.getItem('wh66_auth'))?.token; } catch { return null; }
}
async function apiFetch(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` };
  const res = await fetch('/api' + path, { ...opts, headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

// ===== ВКЛАДКА «ОБЗОР» =====
function OverviewTab({ warehouses }) {
  const [stats, setStats] = useState([]);

  useEffect(() => {
    setStats(WAREHOUSES.map(w => {
      const s = warehouses.find(x => x.class_code === w.code) || {};
      const filled = parseFloat(s.filled) || 0;
      const pct = Math.min(100, Math.round((filled / w.capacity) * 100));
      return { ...w, filled, pct, goods: s.goods_count || 0 };
    }));
  }, [warehouses]);

  const overloaded = stats.filter(s => s.pct >= 80);
  const empty      = stats.filter(s => s.pct < 20);

  return (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {stats.map(w => (
          <div key={w.code} style={{
            background: 'var(--bg-card)', borderRadius: 8, padding: '14px 16px',
            borderLeft: `4px solid ${statusColor(w.pct)}`,
          }}>
            <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: 4 }}>{w.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 8 }}>{w.address}</div>
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 4, height: 8, marginBottom: 6 }}>
              <div style={{ width: `${w.pct}%`, height: '100%', background: statusColor(w.pct), borderRadius: 4, transition: 'width 0.5s' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: statusColor(w.pct) }}>{statusLabel(w.pct)}</span>
              <span style={{ color: 'var(--text-secondary)' }}>{w.filled} / {w.capacity} м³ ({w.pct}%)</span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>Товаров: {w.goods}</div>
          </div>
        ))}
      </div>

      <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '14px 16px' }}>
        <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>Рекомендации</div>
        {overloaded.length === 0 && empty.length === 0 && (
          <div style={{ color: '#7dc97a', fontSize: 13 }}>Все склады работают в нормальном режиме.</div>
        )}
        {overloaded.map(w => (
          <div key={w.code} style={{ color: '#e8848d', fontSize: 13, marginBottom: 6 }}>
            Склад «{w.name}» заполнен на {w.pct}% — рассмотрите перемещение
            {empty.length > 0 ? ` на склад «${empty[0].name}»` : ' на другой склад'}.
          </div>
        ))}
        {empty.map(w => (
          <div key={w.code} style={{ color: '#7dc97a', fontSize: 13, marginBottom: 6 }}>
            Склад «{w.name}» — доступно {w.capacity - w.filled} м³ свободного места.
          </div>
        ))}
      </div>
    </>
  );
}

// ===== ВКЛАДКА «ПЕРЕМЕЩЕНИЕ» =====
function TransferTab({ onRefresh }) {
  const [fromWh, setFromWh]   = useState(1);
  const [toWh, setToWh]       = useState(2);
  const [orders, setOrders]   = useState([]);
  const [selected, setSelected] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [busy, setBusy]       = useState(false);
  const [result, setResult]   = useState(null);

  async function loadOrders(code) {
    setLoading(true); setSelected(new Set()); setResult(null);
    try { setOrders(await apiFetch(`/warehouse/${code}/orders`)); }
    catch { setOrders([]); }
    setLoading(false);
  }

  useEffect(() => { loadOrders(fromWh); }, [fromWh]);

  function toggle(id) {
    const s = new Set(selected);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelected(s);
  }
  function toggleAll() {
    selected.size === orders.length ? setSelected(new Set()) : setSelected(new Set(orders.map(o => o.order_number)));
  }

  async function doTransfer() {
    if (!selected.size || fromWh === toWh) return;
    setBusy(true); setResult(null);
    try {
      const r = await apiFetch('/transfer', { method: 'POST', body: { order_ids: [...selected], to_warehouse: toWh } });
      setResult({ ok: true, msg: `Перемещено ${r.moved} ордер(ов) на склад «${WAREHOUSES.find(w=>w.code===toWh)?.name}»` });
      onRefresh?.();
      await loadOrders(fromWh);
    } catch (e) {
      setResult({ ok: false, msg: e.message });
    }
    setBusy(false);
  }

  return (
    <div>
      {/* Выбор складов */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Склад-источник</label>
          <select value={fromWh} onChange={e => setFromWh(+e.target.value)} style={{ width: '100%' }}>
            {WAREHOUSES.map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
          </select>
        </div>
        <div style={{ fontSize: 22, paddingTop: 18, color: 'var(--accent-cyan)' }}>—</div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={{ fontSize: 11, color: 'var(--text-secondary)', display: 'block', marginBottom: 4 }}>Склад-назначение</label>
          <select value={toWh} onChange={e => setToWh(+e.target.value)} style={{ width: '100%' }}>
            {WAREHOUSES.filter(w => w.code !== fromWh).map(w => <option key={w.code} value={w.code}>{w.name}</option>)}
          </select>
        </div>
        <button className="btn-primary" onClick={doTransfer}
          disabled={busy || !selected.size || fromWh === toWh}
          style={{ marginTop: 18, whiteSpace: 'nowrap', padding: '9px 20px' }}>
          {busy ? 'Перемещаем...' : `Переместить (${selected.size})`}
        </button>
      </div>

      {result && (
        <div style={{
          padding: '10px 14px', borderRadius: 6, marginBottom: 12, fontSize: 13,
          background: result.ok ? 'rgba(125,201,122,0.12)' : 'rgba(232,132,141,0.12)',
          border: `1px solid ${result.ok ? '#7dc97a' : '#e8848d'}`,
          color: result.ok ? '#7dc97a' : '#e8848d',
        }}>{result.msg}</div>
      )}

      {/* Таблица ордеров */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-secondary)' }}>Загрузка...</div>
      ) : orders.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#7dc97a' }}>На этом складе нет ордеров</div>
      ) : (
        <div style={{ maxHeight: 260, overflowY: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th><input type="checkbox" checked={selected.size === orders.length} onChange={toggleAll}/></th>
                <th>№</th><th>Дата</th><th>Материал</th><th>Поставщик</th><th>Кол-во</th><th>Ед.</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => (
                <tr key={o.order_number} style={{ opacity: selected.has(o.order_number) ? 1 : 0.7 }}>
                  <td><input type="checkbox" checked={selected.has(o.order_number)} onChange={() => toggle(o.order_number)}/></td>
                  <td>{o.order_number}</td>
                  <td>{new Date(o.order_date).toLocaleDateString('ru')}</td>
                  <td>{o.material_name}</td>
                  <td>{o.supplier_name}</td>
                  <td>{parseFloat(o.quantity).toLocaleString('ru')}</td>
                  <td>{o.unit_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 8 }}>
        ∗ Перемещение обновляет поле current_warehouse и записывается в журнал аудита
      </div>
    </div>
  );
}

// ===== ГЛАВНЫЙ КОМПОНЕНТ =====
export default function OptimizationModal({ warehouses, onClose, onRefresh }) {
  const [tab, setTab] = useState('overview');

  // Определяем роль из localStorage
  const role = (() => {
    try { return JSON.parse(localStorage.getItem('wh66_auth'))?.user?.role; } catch { return 'guest'; }
  })();
  const canTransfer = role === 'admin' || role === 'client';

  const tabStyle = (t) => ({
    padding: '7px 18px', borderRadius: 6, cursor: 'pointer', fontSize: 13,
    border: tab === t ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
    background: tab === t ? 'rgba(95,212,217,0.12)' : 'var(--bg-card)',
    color: tab === t ? 'var(--accent-cyan)' : 'var(--text-secondary)',
  });

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(760px, 95vw)' }}>
        <h2>Оптимизация складов</h2>

        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          <button style={tabStyle('overview')} onClick={() => setTab('overview')}>Обзор</button>
          {canTransfer && (
            <button style={tabStyle('transfer')} onClick={() => setTab('transfer')}>Перемещение</button>
          )}
        </div>

        {tab === 'overview' && <OverviewTab warehouses={warehouses} />}
        {tab === 'transfer' && <TransferTab onRefresh={onRefresh} />}

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
