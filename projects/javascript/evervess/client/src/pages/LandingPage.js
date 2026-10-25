import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import './LandingPage.css';

const PRODUCTS = [
  {
    id: 1,
    icon: '💳',
    title: 'Дебетовая карта',
    desc: 'Бесплатное обслуживание навсегда. Кэшбэк до 5% на все покупки.',
    features: ['Бесплатный выпуск', 'Кэшбэк 5%', 'Бесконтактная оплата', 'Снятие без комиссии'],
    color: '#1e1e3a',
    accent: '#33aa88',
  },
  {
    id: 2,
    icon: '💎',
    title: 'Кредитная карта',
    desc: 'Кредитный лимит до 100 000 ₽. Льготный период 60 дней.',
    features: ['Лимит 100 000 ₽', 'Льготный период 60 дней', 'Ставка от 19%', 'Без скрытых комиссий'],
    color: '#1a4a30',
    accent: '#7fdbbd',
  },
  {
    id: 3,
    icon: '🌐',
    title: 'Виртуальная карта',
    desc: 'Мгновенный выпуск. Идеально для онлайн-покупок и подписок.',
    features: ['Мгновенный выпуск', 'Для онлайн-платежей', 'Уникальный номер', 'Защита данных'],
    color: '#3a1a4a',
    accent: '#bb88ff',
  },
];

const TARIFFS = [
  {
    name: 'Сберегательный',
    percent: 7,
    desc: 'Для тех, кто хочет копить стабильно',
    features: ['7% годовых', 'Срок до 5 лет', 'Пополнение в любое время', 'Без потери процентов'],
    highlight: false,
  },
  {
    name: 'Депозитный',
    percent: 10.5,
    desc: 'Максимальная доходность',
    features: ['10.5% годовых', 'Срок до 5 лет', 'Фиксированная ставка', 'Страхование вкладов'],
    highlight: true,
  },
  {
    name: 'Текущий',
    percent: 0,
    desc: 'Счёт для ежедневного использования',
    features: ['Без ограничений', 'Мгновенный доступ', 'Бесплатное ведение', 'Переводы без комиссий'],
    highlight: false,
  },
];

const STATS = [
  { value: '1 200+', label: 'Клиентов' },
  { value: '₽2.4M', label: 'Общий баланс' },
  { value: '99.9%', label: 'Uptime системы' },
  { value: '5 мин', label: 'Открытие карты' },
];

const STEPS = [
  { num: '01', title: 'Регистрация', desc: 'Заполните форму — имя, email, пароль. Займёт меньше минуты.' },
  { num: '02', title: 'Выберите продукт', desc: 'Дебетовая, кредитная, виртуальная карта или сберегательный счёт.' },
  { num: '03', title: 'Пополните счёт', desc: 'Переведите деньги удобным способом.' },
  { num: '04', title: 'Пользуйтесь', desc: 'Переводы, оплата услуг, накопления — всё в одном приложении.' },
];

export default function LandingPage() {
  const [activeProduct, setActiveProduct] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const [visibleSections, setVisibleSections] = useState({});
  const heroRef = useRef(null);
  const sectionsRef = useRef({});

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisibleSections(prev => ({ ...prev, [e.target.dataset.section]: true }));
          }
        });
      },
      { threshold: 0.15 }
    );
    Object.values(sectionsRef.current).forEach(el => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const setRef = (key) => (el) => {
    sectionsRef.current[key] = el;
  };

  return (
    <div className="landing">

      {/* NAV */}
      <nav className={`lnav ${scrolled ? 'scrolled' : ''}`}>
        <div className="lnav-inner">
          <div className="lnav-logo">evervess</div>
          <div className="lnav-links">
            <a href="#products">Продукты</a>
            <a href="#tariffs">Тарифы</a>
            <a href="#about">О банке</a>
            <a href="#support">Поддержка</a>
          </div>
          <div className="lnav-actions">
            <Link to="/login" className="lnav-login">Войти</Link>
            <Link to="/register" className="lnav-register">Открыть счёт</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" ref={heroRef}>
        <div className="hero-bg">
          <div className="hero-orb hero-orb1" />
          <div className="hero-orb hero-orb2" />
          <div className="hero-orb hero-orb3" />
          <div className="hero-grid" />
        </div>
        <div className="hero-content">
          <div className="hero-badge">🏦 Современный банк для всех</div>
          <h1 className="hero-title">
            Финансы, которые<br/>
            <span className="hero-accent">работают за вас</span>
          </h1>
          <p className="hero-sub">
            Карты, накопления, переводы и платежи — всё в одном месте.<br/>
            Без очередей. Без бумаг. Без скрытых комиссий.
          </p>
          <div className="hero-cta">
            <Link to="/register" className="hero-btn-primary">Открыть счёт бесплатно</Link>
            <a href="#products" className="hero-btn-ghost">Узнать больше →</a>
          </div>
          <div className="hero-stats">
            {STATS.map(s => (
              <div key={s.label} className="hero-stat">
                <div className="hs-value">{s.value}</div>
                <div className="hs-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-card-demo">
          <div className="demo-card debit-demo">
            <div className="dc-chip" />
            <div className="dc-type">Дебетовая карта</div>
            <div className="dc-number">•••• •••• •••• 4532</div>
            <div className="dc-bottom">
              <div><div className="dc-label">Держатель</div><div className="dc-val">IVAN IVANOV</div></div>
              <div><div className="dc-label">До</div><div className="dc-val">12/28</div></div>
            </div>
            <div className="dc-logo">◉◉</div>
          </div>
          <div className="demo-card credit-demo">
            <div className="dc-chip" />
            <div className="dc-type">Кредитная карта</div>
            <div className="dc-number">•••• •••• •••• 8821</div>
            <div className="dc-bottom">
              <div><div className="dc-label">Держатель</div><div className="dc-val">IVAN IVANOV</div></div>
              <div><div className="dc-label">До</div><div className="dc-val">12/28</div></div>
            </div>
            <div className="dc-logo">◉◉</div>
          </div>
        </div>
      </section>

      {/* PRODUCTS */}
      <section className="section" id="products" data-section="products" ref={setRef('products')}>
        <div className={`section-inner ${visibleSections.products ? 'visible' : ''}`}>
          <div className="section-label">Наши продукты</div>
          <h2 className="section-title">Выберите то, что подходит именно вам</h2>
          <p className="section-sub">Три типа карт под любые задачи — от ежедневных трат до онлайн-покупок.</p>

          <div className="products-tabs">
            {PRODUCTS.map((p, i) => (
              <button key={p.id} className={`prod-tab ${activeProduct === i ? 'active' : ''}`} onClick={() => setActiveProduct(i)}>
                <span>{p.icon}</span> {p.title}
              </button>
            ))}
          </div>

          <div className="product-showcase">
            {PRODUCTS.map((p, i) => (
              <div key={p.id} className={`product-card ${activeProduct === i ? 'active' : ''}`} style={{'--pc': p.color, '--pa': p.accent}}>
                <div className="pc-visual" style={{background: `linear-gradient(135deg, ${p.color}, ${p.color}cc)`}}>
                  <div className="pc-card-mock">
                    <div className="pcm-chip" />
                    <div className="pcm-type">{p.title}</div>
                    <div className="pcm-num">•••• •••• •••• ••••</div>
                    <div className="pcm-logo" style={{color: p.accent}}>◉◉</div>
                  </div>
                </div>
                <div className="pc-info">
                  <div className="pc-icon">{p.icon}</div>
                  <h3>{p.title}</h3>
                  <p>{p.desc}</p>
                  <ul className="pc-features">
                    {p.features.map(f => <li key={f}><span style={{color: p.accent}}>✓</span> {f}</li>)}
                  </ul>
                  <Link to="/register" className="pc-cta" style={{background: p.accent, color: p.color === '#1e1e3a' ? '#fff' : '#111'}}>
                    Оформить карту
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section section-dark" data-section="howto" ref={setRef('howto')}>
        <div className={`section-inner ${visibleSections.howto ? 'visible' : ''}`}>
          <div className="section-label light">Как начать</div>
          <h2 className="section-title light">4 шага до первой транзакции</h2>
          <div className="steps-grid">
            {STEPS.map((step, i) => (
              <div key={step.num} className="step-card" style={{'--delay': `${i * 0.1}s`}}>
                <div className="step-num">{step.num}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </div>
            ))}
          </div>
          <div className="howto-cta">
            <Link to="/register" className="hero-btn-primary">Начать сейчас →</Link>
          </div>
        </div>
      </section>

      {/* TARIFFS */}
      <section className="section" id="tariffs" data-section="tariffs" ref={setRef('tariffs')}>
        <div className={`section-inner ${visibleSections.tariffs ? 'visible' : ''}`}>
          <div className="section-label">Накопления</div>
          <h2 className="section-title">Тарифы для ваших накоплений</h2>
          <p className="section-sub">Откройте счёт и начните зарабатывать на своих деньгах.</p>
          <div className="tariffs-grid">
            {TARIFFS.map(t => (
              <div key={t.name} className={`tariff-card ${t.highlight ? 'highlighted' : ''}`}>
                {t.highlight && <div className="tariff-badge">Лучший выбор</div>}
                <div className="tariff-percent">{t.percent}%</div>
                <div className="tariff-period">годовых</div>
                <div className="tariff-name">{t.name}</div>
                <p className="tariff-desc">{t.desc}</p>
                <ul className="tariff-features">
                  {t.features.map(f => <li key={f}>✓ {f}</li>)}
                </ul>
                <Link to="/register" className={`tariff-cta ${t.highlight ? 'tariff-cta-accent' : ''}`}>Открыть счёт</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES ABOUT */}
      <section className="section section-tinted" id="about" data-section="about" ref={setRef('about')}>
        <div className={`section-inner ${visibleSections.about ? 'visible' : ''}`}>
          <div className="section-label">О банке</div>
          <h2 className="section-title">Почему клиенты выбирают evervess</h2>
          <div className="features-grid">
            {[
              { icon: '🔐', title: 'Безопасность', desc: 'Шифрование данных и двухфакторная аутентификация на каждом шаге.' },
              { icon: '⚡', title: 'Мгновенные переводы', desc: 'Переводы клиентам evervess — мгновенно и без комиссий.' },
              { icon: '📊', title: 'История операций', desc: 'Полная история всех транзакций с фильтрацией и экспортом.' },
              { icon: '💬', title: 'Поддержка 24/7', desc: 'Чат, email и телефон — всегда готовы помочь вам.' },
              { icon: '📱', title: 'Удобный интерфейс', desc: 'Современный дизайн, который работает на любом устройстве.' },
              { icon: '🏦', title: 'Страхование вкладов', desc: 'Все депозиты застрахованы в соответствии с законодательством.' },
            ].map(f => (
              <div key={f.title} className="feature-item">
                <div className="fi-icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SUPPORT */}
      <section className="section" id="support" data-section="support" ref={setRef('support')}>
        <div className={`section-inner ${visibleSections.support ? 'visible' : ''}`}>
          <div className="section-label">Поддержка</div>
          <h2 className="section-title">Мы всегда рядом</h2>
          <div className="support-grid">
            <div className="support-card">
              <div className="sc-icon">📞</div>
              <h3>Позвонить</h3>
              <p>Круглосуточно, без выходных</p>
              <div className="sc-contact">8 (800) 555-35-35</div>
            </div>
            <div className="support-card">
              <div className="sc-icon">💬</div>
              <h3>Онлайн-чат</h3>
              <p>Ответим в течение 5 минут</p>
              <Link to="/login" className="sc-contact sc-link">Написать →</Link>
            </div>
            <div className="support-card">
              <div className="sc-icon">✉️</div>
              <h3>Email</h3>
              <p>Ответим в течение 24 часов</p>
              <div className="sc-contact">support@evervess.com</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="cta-banner">
        <div className="ctab-inner">
          <h2>Готовы начать?</h2>
          <p>Регистрация займёт меньше минуты. Первая карта — бесплатно.</p>
          <div className="ctab-actions">
            <Link to="/register" className="hero-btn-primary">Создать аккаунт</Link>
            <Link to="/login" className="hero-btn-ghost">Войти в систему</Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="footer-logo">evervess</div>
            <div className="footer-tagline">Современный банк для современной жизни</div>
          </div>
          <div className="footer-links">
            <div className="fl-col">
              <div className="fl-title">Продукты</div>
              <a href="#products">Дебетовая карта</a>
              <a href="#products">Кредитная карта</a>
              <a href="#products">Виртуальная карта</a>
              <a href="#tariffs">Накопления</a>
            </div>
            <div className="fl-col">
              <div className="fl-title">Компания</div>
              <a href="#about">О банке</a>
              <a href="#support">Поддержка</a>
              <a href="#about">Безопасность</a>
            </div>
            <div className="fl-col">
              <div className="fl-title">Войти</div>
              <Link to="/login">Личный кабинет</Link>
              <Link to="/register">Регистрация</Link>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <span>© 2026 evervess. Все права защищены.</span>
          <span>Лицензия ЦБ РФ № 0000</span>
        </div>
      </footer>
    </div>
  );
}
