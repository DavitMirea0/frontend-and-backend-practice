import React, { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';

const TABS = [
  { id: 'materials', label: 'Материалы' },
  { id: 'suppliers', label: 'Поставщики' },
  { id: 'units',     label: 'Ед. измерения' },
  { id: 'documents', label: 'Документы'  },
];

// Поля ввода для добавления по каждому типу
const FORMS = {
  materials: [
    { name: 'material_name', label: 'Наименование', placeholder: 'Сталь листовая 3мм' },
    { name: 'class_code',    label: 'Код класса',   placeholder: '1', type: 'number' },
    { name: 'group_code',    label: 'Код группы',   placeholder: '1', type: 'number' },
    { name: 'unit_code',     label: 'Код ед.изм.',  placeholder: '1', type: 'number' },
  ],
  suppliers: [
    { name: 'supplier_name', label: 'Наименование',    placeholder: 'ООО Поставщик' },
    { name: 'inn',           label: 'ИНН',             placeholder: '7700000000' },
    { name: 'legal_city',    label: 'Юр. город',       placeholder: 'Москва' },
    { name: 'legal_street',  label: 'Юр. улица',       placeholder: 'ул. Ленина' },
    { name: 'legal_house',   label: 'Дом',             placeholder: '1' },
    { name: 'bank_city',     label: 'Город банка',     placeholder: 'Москва' },
    { name: 'bank_account',  label: 'Счёт',            placeholder: '40702810000000000001' },
  ],
  units: [
    { name: 'unit_name', label: 'Наименование', placeholder: 'штук' },
  ],
  documents: [
    { name: 'document_name', label: 'Наименование', placeholder: 'ТТН' },
  ],
};

async function loadTab(tab) {
  const map = { materials: api.materials, suppliers: api.suppliers, units: api.units, documents: api.documents };
  return (map[tab] || api.materials)();
}

export default function ReferencesModal({ onClose }) {
  const [tab, setTab]       = useState('materials');
  const [rows, setRows]     = useState([]);
  const [form, setForm]     = useState({});
  const [err, setErr]       = useState('');
  const [busy, setBusy]     = useState(false);
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    setLoading(true);
    try { setRows(await loadTab(tab)); } catch (e) { setErr(e.message); }
    setLoading(false);
  }, [tab]);

  useEffect(() => { setForm({}); setErr(''); reload(); }, [reload]);

  async function add() {
    setErr(''); setBusy(true);
    try {
      const map = { materials: api.materials, suppliers: api.suppliers };
      // POST через fetch напрямую (api.js не имеет POST для units/documents — добавим через general)
      const token = (() => {
        try { return JSON.parse(localStorage.getItem('wh66_auth'))?.token; } catch { return null; }
      })();
      const endpoints = {
        materials: '/api/materials',
        suppliers: '/api/suppliers',
        units:     '/api/units',
        documents: '/api/documents',
      };
      const res = await fetch(endpoints[tab], {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setForm({});
      await reload();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const fields = FORMS[tab] || [];

  // Отображение строк — берём первые 2-3 поля
  function rowLabel(r) {
    if (tab === 'materials')  return `${r.material_code}. ${r.material_name} (${r.unit_name || r.unit_code})`;
    if (tab === 'suppliers')  return `${r.supplier_code}. ${r.supplier_name} — ИНН ${r.inn}`;
    if (tab === 'units')      return `${r.unit_code}. ${r.unit_name}`;
    if (tab === 'documents')  return `${r.document_code}. ${r.document_name}`;
    return JSON.stringify(r);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()} style={{ width: 'min(780px, 95vw)' }}>
        <h2>Справочники</h2>

        {/* Вкладки */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              style={{
                padding: '6px 14px', borderRadius: 6, fontSize: 13, cursor: 'pointer',
                border: tab === t.id ? '1px solid var(--accent-cyan)' : '1px solid rgba(255,255,255,0.1)',
                background: tab === t.id ? 'rgba(95,212,217,0.12)' : 'var(--bg-card)',
                color: tab === t.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Список */}
        <div style={{ maxHeight: 220, overflowY: 'auto', marginBottom: 16,
                      background: 'var(--bg-card)', borderRadius: 6, padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)' }}>Загрузка...</div>
          ) : rows.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 16, color: 'var(--text-secondary)' }}>
              Список пуст
            </div>
          ) : rows.map((r, i) => (
            <div key={i} style={{
              padding: '7px 14px', fontSize: 12,
              borderBottom: '1px solid rgba(255,255,255,0.04)',
              color: 'var(--text-primary)',
            }}>
              {rowLabel(r)}
            </div>
          ))}
        </div>

        {/* Форма добавления */}
        <div style={{ background: 'var(--bg-card)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--text-secondary)' }}>
            Добавить запись
          </div>
          {err && <div className="error-banner" style={{ marginBottom: 10 }}>{err}</div>}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10 }}>
            {fields.map(f => (
              <div key={f.name} className="field" style={{ margin: 0 }}>
                <label style={{ fontSize: 11 }}>{f.label}</label>
                <input type={f.type || 'text'} placeholder={f.placeholder}
                  value={form[f.name] || ''}
                  onChange={e => setForm(prev => ({ ...prev, [f.name]: e.target.value }))} />
              </div>
            ))}
          </div>

          <button className="btn-primary" onClick={add} disabled={busy}
            style={{ marginTop: 12, padding: '7px 20px', fontSize: 13 }}>
            {busy ? 'Сохраняем...' : 'Добавить'}
          </button>
        </div>

        <div className="modal-actions" style={{ marginTop: 16 }}>
          <button className="btn-secondary" onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
}
