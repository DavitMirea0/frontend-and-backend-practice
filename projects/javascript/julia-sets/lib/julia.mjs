// Математика сайта: итерация комплексных отображений и подсчёт картинки.
// Комплексное число z = x + iy хранится как пара (x, y).

export const FUNCTIONS = {
  quad: { title: 'z² + c', hasC: true },
  r1: { title: '(i·z⁵ − 1) / (z⁵ − i)', hasC: false },
  r2: { title: '(z² + i) / (1 − z²)', hasC: false },
};

// Возвращает шаг итерации: (x, y, out) -> записывает f(z) в out.x, out.y
export function makeStep(fn, cr = 0, ci = 0) {
  switch (fn) {
    case 'quad':
      return (x, y, o) => { o.x = x * x - y * y + cr; o.y = 2 * x * y + ci; };
    case 'r1':
      return (x, y, o) => {
        const x2 = x * x - y * y, y2 = 2 * x * y;
        const x4 = x2 * x2 - y2 * y2, y4 = 2 * x2 * y2;
        const x5 = x4 * x - y4 * y, y5 = x4 * y + y4 * x;
        // числитель i*z^5 - 1 = (-y5 - 1) + x5*i, знаменатель z^5 - i = x5 + (y5 - 1)*i
        const a = -y5 - 1, b = x5, c = x5, d = y5 - 1;
        const den = c * c + d * d;
        o.x = (a * c + b * d) / den; o.y = (b * c - a * d) / den;
      };
    case 'r2':
      return (x, y, o) => {
        const x2 = x * x - y * y, y2 = 2 * x * y;
        // числитель z^2 + i = x2 + (y2 + 1)*i, знаменатель 1 - z^2 = (1 - x2) - y2*i
        const a = x2, b = y2 + 1, c = 1 - x2, d = -y2;
        const den = c * c + d * d;
        o.x = (a * c + b * d) / den; o.y = (b * c - a * d) / den;
      };
    default:
      throw new Error('Неизвестная функция');
  }
}

// Картинка n x n: байт = 255 * (номер итерации побега / nmax). 255 значит «не убежала».
// Строка 0 сверху (y = +win), столбец 0 слева (x = -win).
export function computeJulia({ fn, cr = 0, ci = 0, n = 500, win = 2.1, nmax = 300, zmax = 10 }) {
  const step = makeStep(fn, cr, ci);
  const out = new Uint8Array(n * n);
  const o = { x: 0, y: 0 };
  const z2max = zmax * zmax;
  const k0 = (2 * win) / n;
  for (let iy = 0; iy < n; iy++) {
    const y0 = win - (iy + 0.5) * k0;
    for (let ix = 0; ix < n; ix++) {
      let x = -win + (ix + 0.5) * k0, y = y0, k = 0;
      // NaN и Infinity делают сравнение ложным, то есть точка считается убежавшей
      while (k < nmax && x * x + y * y <= z2max) {
        step(x, y, o); x = o.x; y = o.y; k++;
      }
      out[iy * n + ix] = Math.round((255 * k) / nmax);
    }
  }
  return out;
}

export function orbit({ fn, cr = 0, ci = 0, x, y, steps = 10 }) {
  const step = makeStep(fn, cr, ci);
  const o = { x: 0, y: 0 };
  const list = [{ k: 0, x, y, abs: Math.hypot(x, y) }];
  for (let k = 1; k <= steps; k++) {
    step(x, y, o); x = o.x; y = o.y;
    list.push({ k, x, y, abs: Math.hypot(x, y) });
  }
  return list;
}

const clamp = (v, lo, hi, def) => {
  if (v === null || v === undefined || v === '') return def;
  const t = Number(v);
  return Number.isFinite(t) ? Math.min(hi, Math.max(lo, t)) : def;
};

export function parseParams(sp) {
  const fn = sp.get('fn') ?? 'quad';
  if (!Object.hasOwn(FUNCTIONS, fn)) throw new Error('Неизвестная функция');
  return {
    fn,
    cr: clamp(sp.get('cr'), -2, 2, -0.1),
    ci: clamp(sp.get('ci'), -2, 2, 0.65),
    n: Math.round(clamp(sp.get('n'), 50, 800, 500)),
    win: clamp(sp.get('win'), 0.2, 4, 2.1),
    nmax: Math.round(clamp(sp.get('nmax'), 5, 1000, 300)),
    zmax: clamp(sp.get('zmax'), 2, 100, 10),
  };
}
