import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { attachUser } from './auth.js';
import auth from './routes/auth.js';
import dictionaries from './routes/dictionaries.js';
import storage from './routes/storage.js';
import analytics from './routes/analytics.js';
import wms from './routes/wms.js';



dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(attachUser);     // распаковка JWT для всех запросов (если есть)

app.get('/api/health', (_, res) => res.json({ ok: true, service: 'warehouse-66' }));

app.use('/api', auth);
app.use('/api', dictionaries);
app.use('/api', storage);
app.use('/api', wms);
app.use('/api', analytics);

// Глобальный обработчик ошибок
app.use((err, _req, res, _next) => {
  console.error('[error]', err);
  res.status(500).json({ error: err.message || 'Internal error' });
});

const PORT = Number(process.env.PORT) || 4000;
app.listen(PORT, () => {
  console.log(`✓ Warehouse-66 API listening on http://localhost:${PORT}`);
});
