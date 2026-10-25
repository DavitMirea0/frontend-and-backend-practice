import React, { useEffect, useState } from 'react';
import { api } from './api.js';

export default function DeliveryModal({ onClose, onSaved }) {
  const [suppliers, setSuppliers] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [units,     setUnits]     = useState([]);
  const [form, setForm] = useState({
    order_date: new Date().toISOString().slice(0, 10),
    supplier_code: '',
    balance_account: '10.01',
    document_code: '',
    document_number: '',
    material_code: '',
    material_account: '10.01',
    unit_code: '',
    quantity: '',
    unit_price: '',
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const [s, m, d, u] = await Promise.all([
        api.suppliers(), api.materials(), api.documents(), api.units(),
      ]);
      setSuppliers(s); setMaterials(m); setDocuments(d); setUnits(u);
      // дефолты — первые элементы
      setForm(f => ({
        ...f,
        supplier_code: s[0]?.supplier_code ?? '',
        document_code: d[0]?.document_code ?? '',
        material_code: m[0]?.material_code ?? '',
        unit_code:     m[0]?.unit_code     ?? '',
      }));
    })();
  }, []);

  // При смене материала — подставить его ед. изм.
  function onMaterialChange(v) {
    const mat = materials.find(m => m.material_code === Number(v));
    setForm(f => ({
      ...f,
      material_code: Number(v),
      unit_code: mat?.unit_code ?? f.unit_code,
    }));
  }

  function set(field, v) { setForm(f => ({ ...f, [field]: v })); }

  async function submit(e) {
    e?.preventDefault();
    setErr('');
    setBusy(true);
    try {
      await api.addStorage({
        ...form,
        supplier_code:   Number(form.supplier_code),
        document_code:   Number(form.document_code),
        material_code:   Number(form.material_code),
        unit_code:       Number(form.unit_code),
        quantity:        Number(form.quantity),
        unit_price:      Number(form.unit_price),
      });
      onSaved?.('Поставка успешно добавлена');
      onClose();
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>Поставка товаров</h2>
        {err && <div className="error-banner">{err}</div>}

        <div className="field">
          <label>Дата ордера</label>
          <input type="date" value={form.order_date}
            onChange={e => set('order_date', e.target.value)} />
        </div>

        <div className="field">
          <label>Поставщик</label>
          <select value={form.supplier_code} onChange={e => set('supplier_code', e.target.value)}>
            {suppliers.map(s => (
              <option key={s.supplier_code} value={s.supplier_code}>{s.supplier_name}</option>
            ))}
          </select>
        </div>

        <div className="row">
          <div className="field">
            <label>Сопроводительный документ</label>
            <select value={form.document_code} onChange={e => set('document_code', e.target.value)}>
              {documents.map(d => (
                <option key={d.document_code} value={d.document_code}>{d.document_name}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Номер документа</label>
            <input value={form.document_number}
              onChange={e => set('document_number', e.target.value)} placeholder="ТТН-123/26" />
          </div>
        </div>

        <div className="field">
          <label>Материал</label>
          <select value={form.material_code} onChange={e => onMaterialChange(e.target.value)}>
            {materials.map(m => (
              <option key={m.material_code} value={m.material_code}>{m.material_name}</option>
            ))}
          </select>
        </div>

        <div className="row">
          <div className="field">
            <label>Балансный счёт</label>
            <input value={form.balance_account}
              onChange={e => set('balance_account', e.target.value)} />
          </div>
          <div className="field">
            <label>Счёт материала</label>
            <input value={form.material_account}
              onChange={e => set('material_account', e.target.value)} />
          </div>
        </div>

        <div className="row">
          <div className="field">
            <label>Количество</label>
            <input type="number" step="0.001" min="0.001" value={form.quantity}
              onChange={e => set('quantity', e.target.value)} />
          </div>
          <div className="field">
            <label>Цена за единицу</label>
            <input type="number" step="0.01" min="0" value={form.unit_price}
              onChange={e => set('unit_price', e.target.value)} />
          </div>
        </div>

        <div className="modal-actions">
          <button className="btn-secondary" onClick={onClose} disabled={busy}>Отмена</button>
          <button className="btn-primary"   onClick={submit}  disabled={busy}>
            {busy ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </div>
    </div>
  );
}
