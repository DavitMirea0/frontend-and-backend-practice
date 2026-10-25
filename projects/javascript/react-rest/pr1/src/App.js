import React from 'react';
import './App.scss';
import bmwImage from './assets/bmw.jpg';


function App() {
  return (
    <div className="app">
      <div className="product-card">  
        <img
          className="product-card__image"
          src={bmwImage}
          alt="BMW M5 90"
        />
        <div className="product-card__content">
          <h2 className="product-card__title">BMW M5 F90</h2>
          <p className="product-card__description">
            Мощный двигатель, бомбовый внешний вид, короче реальный конкурента мерса.
          </p>
          <a className="product-card__btn" href="#">
            В корзину
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;