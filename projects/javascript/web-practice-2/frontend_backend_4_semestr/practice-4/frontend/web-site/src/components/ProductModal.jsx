import React, { useEffect, useState } from "react";

export default function ProductModal({ open, mode, initialProduct, onClose, onSubmit }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");

  useEffect(() => {
    if (!open) return;
    
    setName(initialProduct?.name ?? "");
    setCategory(initialProduct?.category ?? "");
    setDescription(initialProduct?.description ?? "");
    setPrice(initialProduct?.cost != null ? String(initialProduct.cost) : "");
    setQuantity(initialProduct?.quantity != null ? String(initialProduct.quantity) : "");
  }, [open, initialProduct]);

  if (!open) return null;

  const title = mode === "edit" ? "Редактирование товара" : "Создание товара";

  const handleSubmit = (e) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedCategory = category.trim();
    const trimmedDescription = description.trim();
    const parsedPrice = Number(price);
    const parsedQuantity = Number(quantity);

    if (!trimmedName) {
      alert("Введите название товара");
      return;
    }

    if (!trimmedCategory) {
      alert("Введите категорию товара");
      return;
    }

    if (!trimmedDescription) {
      alert("Введите описание товара");
      return;
    }

    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      alert("Введите корректную цену (больше 0)");
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      alert("Введите корректное количество (целое неотрицательное число)");
      return;
    }

    onSubmit({
      id: initialProduct?.id,
      name: trimmedName,
      category: trimmedCategory,
      description: trimmedDescription,
      cost: parsedPrice,
      quantity: parsedQuantity,
    });
  };

  return (
    <div className="backdrop" onMouseDown={onClose}>
      <div 
        className="modal" 
        onMouseDown={(e) => e.stopPropagation()}
        role="dialog" 
        aria-modal="true"
      >
        <div className="modal__header">
          <div className="modal__title">{title}</div>
          <button className="iconBtn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Название товара
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например, iPhone 15 Pro"
              autoFocus
            />
          </label>

          <label className="label">
            Категория
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Например, Смартфоны"
            />
          </label>

          <label className="label">
            Описание
            <textarea
              className="input textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Описание товара"
              rows="3"
            />
          </label>

          <label className="label">
            Цена (₽)
            <input
              className="input"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Например, 99990"
              inputMode="numeric"
            />
          </label>

          <label className="label">
            Количество на складе
            <input
              className="input"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Например, 15"
              inputMode="numeric"
            />
          </label>

          <div className="modal__footer">
            <button type="button" className="btn" onClick={onClose}>
              Отмена
            </button>
            <button type="submit" className="btn btn--primary">
              {mode === "edit" ? "Сохранить" : "Создать"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}