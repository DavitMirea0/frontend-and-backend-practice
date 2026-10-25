'use strict';

(() => {
  const form = document.getElementById('project-filters');
  if (!form) return;
  const search = document.getElementById('project-search');
  const language = document.getElementById('language-filter');
  const sections = [...document.querySelectorAll('[data-language]')];
  const cards = [...document.querySelectorAll('[data-project]')];
  const count = document.getElementById('results-count');
  const empty = document.getElementById('empty-results');
  const texts = new Map(cards.map(card => [card, card.textContent.toLocaleLowerCase('ru')]));

  function update() {
    const words = search.value.trim().toLocaleLowerCase('ru').split(/\s+/).filter(Boolean);
    let visible = 0;
    sections.forEach(section => {
      const matchesLanguage = language.value === 'all' || section.dataset.language === language.value;
      let groupVisible = 0;
      section.querySelectorAll('[data-project]').forEach(card => {
        const matches = matchesLanguage && words.every(word => texts.get(card).includes(word));
        card.hidden = !matches;
        if (matches) groupVisible++;
      });
      section.hidden = groupVisible === 0;
      visible += groupVisible;
    });
    count.textContent = `Показано: ${visible} из ${cards.length}`;
    empty.hidden = visible !== 0;
  }

  form.hidden = false;
  form.addEventListener('submit', event => event.preventDefault());
  search.addEventListener('input', update);
  language.addEventListener('change', update);
  form.addEventListener('reset', () => {
    search.value = '';
    language.value = 'all';
    update();
  });
  document.getElementById('reset-empty').addEventListener('click', () => {
    form.reset();
    search.focus();
  });
  document.querySelectorAll('.language-nav a[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      form.reset();
    });
  });
  update();
})();
