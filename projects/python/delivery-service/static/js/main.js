document.querySelectorAll('[data-toggle]').forEach(button => {
  button.addEventListener('click', () => {
    const target = document.getElementById(button.dataset.toggle);
    target.hidden = !target.hidden;
    button.setAttribute('aria-expanded', String(!target.hidden));
    button.textContent = target.hidden ? 'Показать информацию о зоне' : 'Скрыть информацию о зоне';
  });
});
