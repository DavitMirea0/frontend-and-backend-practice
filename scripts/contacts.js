(function () {
  'use strict';

  var ENDPOINT = 'https://api.web3forms.com/submit';

  var modal = document.getElementById('contactModal');
  var openButton = document.getElementById('open-contact');
  var form = document.getElementById('feedbackForm');
  var sendButton = document.getElementById('send-feedback');
  var status = document.getElementById('form-status');
  var errorBox = document.getElementById('form-error');

  if (!modal || !form || typeof modal.showModal !== 'function') return;

  // Кнопка скрыта в разметке и появляется только если браузер умеет открывать dialog
  if (openButton) {
    openButton.hidden = false;
    openButton.addEventListener('click', function () {
      showError('');
      modal.showModal();
    });
  }

  // Закрытие окна по клику на фон
  modal.addEventListener('click', function (event) {
    if (event.target === modal) modal.close();
  });

  // Enter в полях не отправляет форму (в textarea он нужен для переноса строки)
  form.addEventListener('keydown', function (event) {
    if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
      event.preventDefault();
    }
  });

  function showError(text) {
    if (!errorBox) return;
    errorBox.textContent = text;
    errorBox.hidden = !text;
  }

  function setSending(sending) {
    if (!sendButton) return;
    sendButton.disabled = sending;
    sendButton.textContent = sending ? 'Отправляем…' : 'Отправить';
  }

  function showSuccess() {
    if (!status) return;
    status.textContent = 'Спасибо! Ваше обращение отправлено. Я свяжусь с вами в ближайшее время.';
    status.hidden = false;
    status.scrollIntoView({ block: 'nearest' });
  }

  function submitForm() {
    showError('');

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    var formData = new FormData(form);
    var accessKey = String(formData.get('access_key') || '');

    if (!accessKey || accessKey === 'YOUR_ACCESS_KEY') {
      showError('Форма ещё не настроена. Напишите мне на почту или в Telegram.');
      return;
    }

    var categorySelect = form.elements.category;
    var categoryLabel = categorySelect.options[categorySelect.selectedIndex].text;

    var payload = {
      access_key: accessKey,
      subject: 'Сообщение с портфолио: ' + categoryLabel,
      from_name: 'Портфолио',
      name: formData.get('name'),
      email: formData.get('email'),
      phone: formData.get('phone'),
      category: categoryLabel,
      message: formData.get('message'),
      botcheck: formData.get('botcheck') ? true : ''
    };

    setSending(true);

    fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify(payload)
    })
      .then(function (response) {
        return response.json().then(function (result) {
          return { ok: response.ok && result.success === true, message: result.message };
        });
      })
      .then(function (result) {
        if (!result.ok) throw new Error(result.message || 'Сервис не принял сообщение');
        modal.close();
        form.reset();
        showSuccess();
      })
      .catch(function () {
        // Окно остаётся открытым, введённый текст сохраняется
        showError('Не удалось отправить сообщение. Попробуйте ещё раз или напишите на почту davit.khachakryan.05@mail.ru.');
      })
      .then(function () {
        setSending(false);
      });
  }

  if (sendButton) sendButton.addEventListener('click', submitForm);
})();
