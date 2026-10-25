import React, { useState } from 'react';
import './Pages.css';
const FAQ = [
  { q: 'Как заблокировать карту?', a: 'Перейдите в раздел «Карты», выберите нужную карту и нажмите «Заблокировать».' },
  { q: 'Как перевести деньги в другой банк?', a: 'В разделе «Переводы» выберите «На карту другого банка».' },
  { q: 'Какие комиссии за переводы?', a: 'Переводы между клиентами evervess бесплатны.' },
  { q: 'Как открыть накопительный счёт?', a: 'Перейдите в «Накопления» и нажмите «Открыть новый счёт».' },
  { q: 'Как изменить лимиты по карте?', a: 'В разделе «Карты» → «Настройки» можно изменить лимиты.' },
];
export default function SupportPage() {
  const [open, setOpen] = useState(null);
  return (
    <div className="page">
      <div className="page-header"><h2>Техподдержка</h2><p className="page-sub">Мы всегда готовы помочь вам</p></div>
      <div className="contact-grid">
        <div className="contact-card"><div className="cc-icon">📞</div><h3>Позвонить</h3><p>Круглосуточно</p><div className="cc-value">8 (800) 555-35-35</div></div>
        <div className="contact-card"><div className="cc-icon">💬</div><h3>Онлайн-чат</h3><p>Ответим за 5 минут</p><div className="cc-value">Начать чат →</div></div>
        <div className="contact-card"><div className="cc-icon">✉️</div><h3>Email</h3><p>Ответим за 24 часа</p><div className="cc-value">support@evervess.com</div></div>
      </div>
      <div className="faq-block">
        <h3>Часто задаваемые вопросы</h3>
        {FAQ.map((item, i) => (
          <div key={i} className="faq-item" onClick={() => setOpen(open === i ? null : i)}>
            <div className="faq-q">{item.q}<span className="faq-arrow">{open === i ? '−' : '›'}</span></div>
            {open === i && <div className="faq-a">{item.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
}
