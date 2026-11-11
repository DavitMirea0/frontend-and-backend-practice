(function () {
  'use strict';

  var header = document.querySelector('.site-header');
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.getElementById('site-nav');

  /* Мобильное меню */
  function setMenu(open) {
    if (!header || !toggle) return;
    header.classList.toggle('nav-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(!header.classList.contains('nav-open'));
    });
    nav.addEventListener('click', function (event) {
      if (event.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') setMenu(false);
    });
  }

  /* Появление блоков при прокрутке */
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!('IntersectionObserver' in window) || reduceMotion) {
    items.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.15 });

    items.forEach(function (el) {
      var siblings = Array.prototype.slice.call(el.parentElement.children).filter(function (n) {
        return n.hasAttribute('data-reveal');
      });
      el.style.setProperty('--reveal-delay', siblings.indexOf(el) * 80 + 'ms');
      revealObserver.observe(el);
    });
  }

  /* Подсветка текущего раздела в меню */
  var links = Array.prototype.slice.call(document.querySelectorAll('.nav a[href^="#"]'));
  var targets = links.map(function (link) {
    var id = link.getAttribute('href').slice(1);
    return document.getElementById(id);
  });

  if ('IntersectionObserver' in window && links.length) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var index = targets.indexOf(entry.target);
        links.forEach(function (link, i) {
          link.classList.toggle('is-active', i === index);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });

    targets.forEach(function (target) {
      if (target) navObserver.observe(target);
    });
  }
})();
