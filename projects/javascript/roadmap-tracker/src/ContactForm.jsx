import { useState, useEffect } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const [errors, setErrors] = useState({});
  const [isFormValid, setIsFormValid] = useState(false);

  useEffect(() => {
    const validateForm = () => {
      const newErrors = {};

      if (!formData.name.trim()) {
        newErrors.name = 'Имя обязательно для заполнения';
      } else if (formData.name.trim().length < 2) {
        newErrors.name = 'Имя должно содержать минимум 2 символа';
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!formData.email) {
        newErrors.email = 'Email обязателен для заполнения';
      } else if (!emailRegex.test(formData.email)) {
        newErrors.email = 'Введите корректный email адрес';
      }

      if (!formData.message.trim()) {
        newErrors.message = 'Сообщение обязательно для заполнения';
      } else if (formData.message.trim().length < 10) {
        newErrors.message = 'Сообщение должно содержать минимум 10 символов';
      }

      setErrors(newErrors);
      setIsFormValid(Object.keys(newErrors).length === 0);
    };

    validateForm();
  }, [formData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isFormValid) {
      console.log('Данные для отправки:', formData);
      alert('Форма успешно отправлена!');
      setFormData({ name: '', email: '', phone: '', message: '' });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="contact-form">
      <h2>📧 Форма обратной связи</h2>

      <div className="form-group">
        <label htmlFor="name">Имя *</label>
        <input
          id="name"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={errors.name ? 'error' : ''}
          placeholder="Введите ваше имя"
        />
        {errors.name && <span className="error-message">{errors.name}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="email">Email *</label>
        <input
          id="email"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={errors.email ? 'error' : ''}
          placeholder="example@mail.com"
        />
        {errors.email && <span className="error-message">{errors.email}</span>}
      </div>

      <div className="form-group">
        <label htmlFor="phone">Телефон</label>
        <input
          id="phone"
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+7 (999) 999-99-99"
        />
      </div>

      <div className="form-group">
        <label htmlFor="message">Сообщение *</label>
        <textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          rows="4"
          className={errors.message ? 'error' : ''}
          placeholder="Введите ваше сообщение..."
        />
        {errors.message && <span className="error-message">{errors.message}</span>}
      </div>

      <button
        type="submit"
        disabled={!isFormValid}
        className={!isFormValid ? 'disabled' : ''}
      >
        Отправить сообщение
      </button>
    </form>
  );
}

export default ContactForm;