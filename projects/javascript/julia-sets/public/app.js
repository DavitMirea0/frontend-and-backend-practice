const $ = id => document.getElementById(id);
const cv = $('cv'), ctx = cv.getContext('2d');
const FORMULA = { quad: 'z² + c', r1: '(i·z⁵ − 1) / (z⁵ − i)', r2: '(z² + i) / (1 − z²)' };
const state = { fn: 'quad', cr: -0.1, ci: 0.65, nmax: 300, zmax: 10, win: 1.6, pal: 'fire', n: 500, data: null };

// Палитры: v от 0 до 255, 255 значит «точка не убежала».
function hsv(h, s, v) {
  const f = k => { const t = (k + h * 6) % 6; return (v - v * s * Math.max(0, Math.min(t, 4 - t, 1))) * 255; };
  return [f(5), f(3), f(1)];
}
const PALETTES = {
  fire: v => { if (v === 255) return [255, 255, 255]; const t = v / 255; return [Math.min(255, t * 600), Math.max(0, Math.min(255, (t - 0.35) * 500)), Math.max(0, Math.min(255, (t - 0.8) * 1200))]; },
  ice: v => { if (v === 255) return [10, 14, 48]; const t = v / 255; return [40 + 215 * t * t, 80 + 175 * t, 140 + 115 * Math.sqrt(t)]; },
  bands: v => { if (v === 255) return [0, 0, 0]; return hsv(((v * 7) % 255) / 255, 0.75, 1); },
};

function paint() {
  if (!state.data) return;
  const n = state.n, img = ctx.createImageData(n, n), pal = PALETTES[state.pal];
  for (let i = 0; i < n * n; i++) {
    const [r, g, b] = pal(state.data[i]);
    img.data[i * 4] = r; img.data[i * 4 + 1] = g; img.data[i * 4 + 2] = b; img.data[i * 4 + 3] = 255;
  }
  cv.width = n; cv.height = n; ctx.putImageData(img, 0, 0);
}

const qs = () => new URLSearchParams({ fn: state.fn, cr: state.cr, ci: state.ci, n: state.n, win: state.win, nmax: state.nmax, zmax: state.zmax });
let seq = 0, timer = null;
async function load() {
  const my = ++seq;
  $('status').textContent = 'Считаем...';
  try {
    const res = await fetch('/api/julia?' + qs());
    if (!res.ok) throw new Error('Ошибка ' + res.status);
    const buf = new Uint8Array(await res.arrayBuffer());
    if (my !== seq) return; // пришёл устаревший ответ
    state.data = buf; state.n = Number(res.headers.get('X-Size'));
    paint();
    $('status').textContent = `${state.n} x ${state.n} = ${(state.n * state.n).toLocaleString('ru-RU')} пикселей, расчёт на сервере: ${res.headers.get('X-Time-Ms')} мс. В худшем случае ${(state.n * state.n * state.nmax).toLocaleString('ru-RU')} шагов.`;
  } catch (e) { if (my === seq) $('status').textContent = 'Не удалось посчитать: ' + e.message; }
}
const reload = () => { clearTimeout(timer); timer = setTimeout(load, 120); };

function sync() {
  $('formula').textContent = FORMULA[state.fn];
  $('rowCr').classList.toggle('hidden', state.fn !== 'quad');
  $('rowCi').classList.toggle('hidden', state.fn !== 'quad');
  const f = x => String(x).replace('.', ',');
  $('oCr').textContent = f(state.cr); $('oCi').textContent = f(state.ci);
  $('oNmax').textContent = state.nmax; $('oZmax').textContent = state.zmax; $('oWin').textContent = f(state.win);
  for (const k of ['cr', 'ci', 'nmax', 'zmax', 'win']) $(k).value = state[k];
  $('pal').value = state.pal;
  document.querySelectorAll('#presets button').forEach(b => {
    const on = b.dataset.fn === state.fn && (state.fn !== 'quad' || (Number(b.dataset.cr) === state.cr && Number(b.dataset.ci) === state.ci));
    b.classList.toggle('on', on);
  });
}

document.querySelectorAll('#presets button').forEach(b => b.addEventListener('click', () => {
  state.fn = b.dataset.fn;
  if (state.fn === 'quad') { state.cr = Number(b.dataset.cr); state.ci = Number(b.dataset.ci); state.win = 1.6; }
  else { state.win = 2.1; state.nmax = Math.min(state.nmax, 120); }
  sync(); load();
}));
for (const k of ['cr', 'ci', 'nmax', 'zmax', 'win']) $(k).addEventListener('input', e => { state[k] = Number(e.target.value); sync(); reload(); });
$('pal').addEventListener('change', e => { state.pal = e.target.value; paint(); });

cv.addEventListener('click', async e => {
  const r = cv.getBoundingClientRect();
  const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
  const x = -state.win + px * 2 * state.win, y = state.win - py * 2 * state.win;
  const p = qs(); p.set('x', x); p.set('y', y);
  const res = await fetch('/api/orbit?' + p);
  if (!res.ok) return;
  const { orbit, zmax } = await res.json();
  const fmt = v => Number.isFinite(v) ? v.toFixed(3).replace('.', ',') : 'нет';
  let escaped = false;
  const rows = orbit.map(o => {
    const out = !(o.abs <= zmax);
    if (out) escaped = true;
    return `<tr class="${out ? 'out' : ''}"><td>${o.k}</td><td>${fmt(o.x)} ${o.y < 0 ? '−' : '+'} ${fmt(Math.abs(o.y))}i</td><td>${fmt(o.abs)}</td></tr>`;
  }).join('');
  $('orbit').innerHTML = `<table><tr><th>k</th><th>z<sub>k</sub></th><th>|z<sub>k</sub>|</th></tr>${rows}</table>
    <p class="muted">${escaped ? 'Красным отмечены шаги, где модуль превысил порог: точка убежала.' : 'За 10 шагов точка не убежала.'}</p>`;
});

sync(); load();
