import React, { useEffect, useState } from 'react';

const WH_NAMES = { 1: 'общий-2', 2: 'сортировочный', 3: 'общий', 4: 'утилизация' };
const WH_ADDR  = { 1: 'ул. Станколит, 5', 2: 'ул. Малая Ордынка, 6', 3: 'ш. Бесединское, 7', 4: 'ул. Тимура Фрунзе, 4' };

function getToken() {
  try { return JSON.parse(localStorage.getItem('wh66_auth'))?.token; } catch { return null; }
}
async function apiFetch(path) {
  const res = await fetch('/api' + path, {
    headers: { Authorization: `Bearer ${getToken()}` }
  });
  return res.json();
}

export default function InventoryModal({ onClose }) {
  const [summary, setSummary]   = useState([]);
  const [detail, setDetail]     = useState([]);
  const [activeWh, setActiveWh] = useState(null);
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    apiFetch('/inventory/summary').then(setSummary).catch(() => {});
  }, []);

  async function loadDetail(code) {
    setActiveWh(code); setLoading(true);
    try { setDetail(await apiFetch(`/inventory/warehouse/${code}`)); }
    catch { setDetail([]); }
    setLoading(false);
  }

  const totalValue = summary.reduce((a, b) => a + parseFloat(b.total_value || 0), 0);
  const totalQty   = summary.reduce((a, b) => a + parseFloat(b.total_qty   || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(900px, 95vw)' }}>
        <h2>Инвентаризация</h2>

        {/* Итоги по всем складам */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
          {[1,2,3,4].map(code => {
            const s = summary.find(x => x.warehouse_code === code) || {};
            const isActive = activeWh === code;
            return (
              <div key={code} onClick={() => loadDetail(code)} style={{
                background: isActive ? 'rgba(95,212,217,0.12)' : 'var(--bg-card)',
                border: `1px solid ${isActive ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                transition: 'all 0.2s',
              }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-cyan)', fontSize: 13, marginBottom: 4 }}>
                  {WH_NAMES[code]}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 8 }}>{WH_ADDR[code]}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {s.positions_count || 0}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>позиций</div>
                <div style={{ fontSize: 13, color: 'var(--accent-orange)', marginTop: 6, fontWeight: 600 }}>
                  {Number(s.total_value || 0).toLocaleString('ru', { maximumFractionDigits: 0 })} ₽
                </div>
                {s.oldest_days > 0 && (
                  <div style={{ fontSize: 10, color: s.oldest_days > 60 ? '#e8848d' : 'var(--text-secondary)', marginTop: 4 }}>
                    Старейший: {s.oldest_days} дн.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Итоговая строка */}
        <div style={{
          background: 'var(--bg-card)', borderRadius: 6, padding: '10px 14px',
          marginBottom: 16, display: 'flex', gap: 32, fontSize: 13,
        }}>
          <span>Всего позиций: <b>{summary.reduce((a,b) => a + Number(b.positions_count||0), 0)}</b></span>
          <span>Суммарный объём: <b>{totalQty.toLocaleString('ru', { maximumFractionDigits: 1 })} ед.</b></span>
          <span>Общая стоимость: <b style={{ color: 'var(--accent-orange)' }}>{totalValue.toLocaleString('ru', { maximumFractionDigits: 0 })} ₽</b></span>
        </div>

        {/* Детализация склада */}
        {activeWh && (
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
              Остатки: склад «{WH_NAMES[activeWh]}»
            </div>
            {loading ? (
              <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)' }}>Загрузка...</div>
            ) : detail.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 16, color: '#7dc97a' }}>Позиций нет</div>
            ) : (
              <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>№</th><th>Дата</th><th>Дней</th>
                      <th>Материал</th><th>Поставщик</th>
                      <th>Кол-во</th><th>Ед.</th><th>Стоимость</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.map(d => (
                      <tr key={d.order_number}>
                        <td>{d.order_number}</td>
                        <td>{new Date(d.order_date).toLocaleDateString('ru')}</td>
                        <td style={{ color: d.days_on_stock > 60 ? '#e8848d' : d.days_on_stock > 30 ? '#f5a142' : 'inherit' }}>
                          {d.days_on_stock}
                        </td>
                        <td>{d.material_name}</td>
                        <td>{d.supplier_name}</td>
                        <td>{parseFloat(d.quantity).toLocaleString('ru')}</td>
                        <td>{d.unit_name}</td>
                        <td style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>
                          {parseFloat(d.total_value).toLocaleString('ru', { maximumFractionDigits: 0 })} ₽
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!activeWh && (
          <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)', fontSize: 13 }}>
            Выберите склад для просмотра детальных остатков
          </div>
        )}

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
