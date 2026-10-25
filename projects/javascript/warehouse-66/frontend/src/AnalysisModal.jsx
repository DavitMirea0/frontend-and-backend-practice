import React, { useEffect, useState } from 'react';
import { api } from './api.js';

const BASE = '/api';
function getToken() {
  try { return JSON.parse(localStorage.getItem('wh66_auth'))?.token; } catch { return null; }
}
async function req(path) {
  const res = await fetch(BASE + path, {
    headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
  return data;
}

export default function AnalysisModal({ onClose }) {
  const [materials, setMaterials] = useState([]);
  const [selectedMat, setSelectedMat] = useState('');
  const [countResult, setCountResult] = useState(null);
  const [listResult,  setListResult]  = useState([]);
  const [city, setCity]               = useState('');
  const [cityResult,  setCityResult]  = useState(null);
  const [topSuppliers, setTopSuppliers] = useState([]);
  const [busy, setBusy]               = useState(false);

  useEffect(() => {
    api.materials().then(m => {
      setMaterials(m);
      if (m.length) setSelectedMat(m[0].material_code);
    });
    req('/analytics/top-suppliers?limit=5').then(setTopSuppliers).catch(() => {});
  }, []);

  async function analyzeSuppliers() {
    if (!selectedMat) return;
    setBusy(true);
    try {
      const [c, l] = await Promise.all([
        req(`/analytics/suppliers-count/${selectedMat}`),
        req(`/analytics/suppliers-of-material/${selectedMat}`),
      ]);
      setCountResult(c.count);
      setListResult(l);
    } catch (e) { alert(e.message); }
    setBusy(false);
  }

  async function analyzeCity() {
    if (!city.trim()) return;
    setBusy(true);
    try {
      const r = await req(`/analytics/suppliers-by-bank-city?city=${encodeURIComponent(city.trim())}`);
      setCityResult(r.count);
    } catch (e) { alert(e.message); }
    setBusy(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(760px, 95vw)' }}>
        <h2>Финансовый анализ</h2>

        {/* === Топ поставщиков === */}
        {topSuppliers.length > 0 && (
          <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
              Топ-5 поставщиков по объёму по суммарному объёму
            </div>
            {topSuppliers.map((s, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: i < topSuppliers.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                fontSize: 13,
              }}>
                <span>
                  <span style={{ color: 'var(--accent-yellow)', fontWeight: 700, marginRight: 8 }}>#{i+1}</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>{s.supplier_name}</span>
                  <span style={{ color: 'var(--text-secondary)', fontSize: 11, marginLeft: 8 }}>ИНН {s.inn}</span>
                </span>
                <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>
                  {Number(s.orders_count)} поставок ·{' '}
                  <span style={{ color: 'var(--accent-orange)', fontWeight: 600 }}>
                    {Number(s.total_sum).toLocaleString('ru', { maximumFractionDigits: 0 })} ₽
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}

        {/* === Анализ поставщиков материала === */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '14px 16px', marginBottom: 16 }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
            Поставщики конкретного материала
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <select value={selectedMat}
              onChange={e => { setSelectedMat(e.target.value); setCountResult(null); setListResult([]); }}
              style={{ flex: 1 }}>
              {materials.map(m => (
                <option key={m.material_code} value={m.material_code}>{m.material_name}</option>
              ))}
            </select>
            <button className="btn-primary" onClick={analyzeSuppliers} disabled={busy}
              style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
              Анализировать
            </button>
          </div>

          {countResult !== null && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)' }}>{countResult}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: 13 }}>
                поставщик(ов) этого материала
              </span>
            </div>
          )}

          {listResult.length > 0 && (
            <div style={{ maxHeight: 200, overflowY: 'auto' }}>
              {listResult.map((s, i) => (
                <div key={i} style={{
                  padding: '8px 10px', background: 'rgba(255,255,255,0.03)',
                  borderRadius: 4, marginBottom: 4, fontSize: 12,
                }}>
                  <div style={{ fontWeight: 600, color: 'var(--accent-cyan)', marginBottom: 2 }}>{s.supplier_name}</div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    ИНН: {s.inn} · Счёт: {s.bank_account}
                  </div>
                  <div style={{ color: 'var(--text-secondary)' }}>
                    Юр. адрес: {s.legal_address} · Банк: {s.bank_address}
                  </div>
                  {s.total_qty && (
                    <div style={{ color: 'var(--accent-orange)', marginTop: 2 }}>
                      Поставлено: {Number(s.total_qty).toLocaleString('ru')} ед.
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* === Анализ по городу банка === */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontWeight: 600, marginBottom: 10, fontSize: 14 }}>
            Поставщики по городу банка
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <input placeholder="Введите город (напр. Москва)" value={city}
              onChange={e => { setCity(e.target.value); setCityResult(null); }}
              onKeyDown={e => e.key === 'Enter' && analyzeCity()}
              style={{ flex: 1 }} />
            <button className="btn-primary" onClick={analyzeCity} disabled={busy || !city.trim()}
              style={{ whiteSpace: 'nowrap', padding: '8px 16px' }}>
              Посчитать
            </button>
          </div>
          {cityResult !== null && (
            <div style={{ marginTop: 12 }}>
              <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent-blue)' }}>{cityResult}</span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: 8, fontSize: 13 }}>
                поставщик(ов) с банком в городе «{city}»
              </span>
            </div>
          )}
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}

