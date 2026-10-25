import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { computeJulia, orbit, parseParams, FUNCTIONS } from './lib/julia.mjs';

const root = path.dirname(fileURLToPath(import.meta.url));
const files = {
  '/': ['index.html', 'text/html; charset=utf-8'],
  '/index.html': ['index.html', 'text/html; charset=utf-8'],
  '/app.js': ['app.js', 'text/javascript; charset=utf-8'],
  '/app.css': ['app.css', 'text/css; charset=utf-8'],
};

const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};

export const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method !== 'GET') return json(res, 405, { error: 'Только GET' });

    if (url.pathname === '/api/functions') return json(res, 200, FUNCTIONS);

    if (url.pathname === '/api/julia') {
      let p;
      try { p = parseParams(url.searchParams); } catch (e) { return json(res, 400, { error: e.message }); }
      const t0 = performance.now();
      const data = computeJulia(p);
      res.writeHead(200, {
        'Content-Type': 'application/octet-stream',
        'Cache-Control': 'no-store',
        'X-Size': String(p.n),
        'X-Time-Ms': String(Math.round(performance.now() - t0)),
        'Access-Control-Expose-Headers': 'X-Size, X-Time-Ms',
      });
      return res.end(Buffer.from(data.buffer));
    }

    if (url.pathname === '/api/orbit') {
      let p;
      try { p = parseParams(url.searchParams); } catch (e) { return json(res, 400, { error: e.message }); }
      const x = Number(url.searchParams.get('x')), y = Number(url.searchParams.get('y'));
      if (!Number.isFinite(x) || !Number.isFinite(y)) return json(res, 400, { error: 'Нужны числа x и y' });
      return json(res, 200, { orbit: orbit({ ...p, x, y, steps: 10 }), zmax: p.zmax });
    }

    const asset = files[url.pathname];
    if (asset) {
      const data = await readFile(path.join(root, 'public', asset[0]));
      res.writeHead(200, { 'Content-Type': asset[1], 'X-Content-Type-Options': 'nosniff' });
      return res.end(data);
    }
    return json(res, 404, { error: 'Страница не найдена' });
  } catch {
    json(res, 500, { error: 'Не удалось обработать запрос' });
  }
});

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 3000);
  server.listen(port, '127.0.0.1', () => console.log(`Множества Жюлиа: http://localhost:${port}`));
  server.on('error', err => {
    console.error(err.code === 'EADDRINUSE' ? 'Порт занят. Закройте предыдущий сервер или задайте PORT.' : err.message);
    process.exitCode = 1;
  });
}
