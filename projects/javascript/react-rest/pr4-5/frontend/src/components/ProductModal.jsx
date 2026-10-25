import React, { useEffect, useState } from 'react';

const CATEGORIES = [
  'Разработка', 'Графика и дизайн', 'Видеомонтаж',
  'Офис и продуктивность', 'Безопасность', 'Образование', 'Другое',
];

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName]             = useState('');
  const [category, setCategory]     = useState('Разработка');
  const [description, setDesc]      = useState('');
  const [price, setPrice]           = useState('');
  const [stock, setStock]           = useState('');
  const [rating, setRating]         = useState('');
  const [image, setImage]           = useState('');

  useEffect(() => {
    if (!open) return;
    setName(initialProduct?.name ?? '');
    setCategory(initialProduct?.category ?? 'Разработка');
    setDesc(initialProduct?.description ?? '');
    setPrice(initialProduct?.price != null ? String(initialProduct.price) : '');
    setStock(initialProduct?.stock != null ? String(initialProduct.stock) : '');
    setRating(initialProduct?.rating != null ? String(initialProduct.rating) : '');
    setImage(initialProduct?.image ?? '');
  }, [open, initialProduct]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return alert('Введите название');
    if (!description.trim()) return alert('Введите описание');
    const parsedPrice = Number(price);
    const parsedStock = Number(stock);
    if (!Number.isFinite(parsedPrice) || parsedPrice < 0) return alert('Введите корректную цену');
    if (!Number.isFinite(parsedStock) || parsedStock < 0) return alert('Введите корректный остаток');
    const parsedRating = rating !== '' ? Number(rating) : null;
    if (parsedRating !== null && (parsedRating < 0 || parsedRating > 5)) return alert('Рейтинг от 0 до 5');
    onSubmit({
      id: initialProduct?.id,
      name: name.trim(), category, description: description.trim(),
      price: parsedPrice, stock: parsedStock,
      rating: parsedRating, image: image.trim() || null,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div className="modal" onMouseDown={e => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal__header">
          <span className="modal__title">{mode === 'edit' ? 'Редактировать ПО' : 'Добавить ПО'}</span>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">✕</button>
        </div>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название
            <input className="input" value={name} onChange={e => setName(e.target.value)} placeholder="Например, Adobe Photoshop 2025" autoFocus />
          </label>
          <label className="label">
            Категория
            <select className="input" value={category} onChange={e => setCategory(e.target.value)}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label className="label">
            Описание
            <textarea className="input input--ta" value={description} onChange={e => setDesc(e.target.value)} placeholder="Краткое описание продукта" rows={3} />
          </label>
          <div className="formRow">
            <label className="label">
              Цена (₽/год)
              <input className="input" value={price} onChange={e => setPrice(e.target.value)} placeholder="0" inputMode="numeric" />
            </label>
            <label className="label">
              Лицензий
              <input className="input" value={stock} onChange={e => setStock(e.target.value)} placeholder="999" inputMode="numeric" />
            </label>
            <label className="label">
              Рейтинг (0–5)
              <input className="input" value={rating} onChange={e => setRating(e.target.value)} placeholder="4.5" inputMode="decimal" />
            </label>
          </div>
          <label className="label">
            Обложка (URL)
            <input className="input" value={image} onChange={e => setImage(e.target.value)} placeholder="https://..." />
          </label>
          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>Отмена</button>
            <button type="submit" className="btn btn--primary">{mode === 'edit' ? 'Сохранить' : 'Создать'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
