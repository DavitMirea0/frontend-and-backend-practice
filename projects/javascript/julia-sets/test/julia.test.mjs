import test from 'node:test';
import assert from 'node:assert/strict';
import { makeStep, computeJulia, orbit, parseParams } from '../lib/julia.mjs';

const apply = (step, x, y) => { const o = {}; step(x, y, o); return [o.x, o.y]; };

test('z^2 + c: (1+i)^2 + 0 = 2i', () => {
  assert.deepEqual(apply(makeStep('quad', 0, 0), 1, 1), [0, 2]);
});

test('r2: f(0) = i', () => {
  const [x, y] = apply(makeStep('r2'), 0, 0);
  assert.ok(Math.abs(x) < 1e-12 && Math.abs(y - 1) < 1e-12);
});

test('r1: f(0) = (-1)/(-i) = -i', () => {
  const [x, y] = apply(makeStep('r1'), 0, 0);
  assert.ok(Math.abs(x) < 1e-12 && Math.abs(y + 1) < 1e-12);
});

test('c = 0: центр не убегает, угол убегает', () => {
  const n = 40, a = computeJulia({ fn: 'quad', cr: 0, ci: 0, n, win: 2.1, nmax: 100, zmax: 10 });
  assert.equal(a.length, n * n);
  assert.equal(a[(n / 2) * n + n / 2], 255);
  assert.ok(a[0] < 255);
});

test('orbit: длина и первые шаги', () => {
  const o = orbit({ fn: 'quad', cr: 0, ci: 0, x: 2, y: 0, steps: 3 });
  assert.equal(o.length, 4);
  assert.equal(o[1].x, 4);
  assert.equal(o[2].x, 16);
});

test('parseParams: ограничения и ошибка на неизвестной функции', () => {
  const p = parseParams(new URLSearchParams('fn=quad&n=100000&nmax=-5'));
  assert.equal(p.n, 800);
  assert.equal(p.nmax, 5);
  assert.throws(() => parseParams(new URLSearchParams('fn=evil')));
});
