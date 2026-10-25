import React from "react";

export default function ProductItem({ product, onEdit, onDelete }) {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="productRow">
      <div className="productMain">
        <div className="productId">#{product.id}</div>
        <div className="productName">{product.name}</div>
        <div className="productCategory">{product.category}</div>
        <div className="productPrice">{formatPrice(product.cost)}</div>
        <div className="productQuantity">Осталось: {product.quantity} шт.</div>
      </div>
      <div className="productDescription">{product.description}</div>
      <div className="productActions">
        <button className="btn" onClick={() => onEdit(product)}>
          Редактировать
        </button>
        <button 
          className="btn btn--danger" 
          onClick={() => onDelete(product.id)}
        >
          Удалить
        </button>
      </div>
    </div>
  );
}