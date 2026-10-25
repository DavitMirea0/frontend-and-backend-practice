const { redisClient } = require('../config/redis');

/**
 * Middleware чтения из кэша.
 * keyBuilder(req) → строка-ключ Redis
 * ttl — время жизни кэша в секундах
 */
function cacheMiddleware(keyBuilder, ttl) {
  return async (req, res, next) => {
    try {
      const key = keyBuilder(req);
      const cached = await redisClient.get(key);
      if (cached) {
        return res.json({ source: 'cache', data: JSON.parse(cached) });
      }
      req.cacheKey = key;
      req.cacheTTL = ttl;
      next();
    } catch (err) {
      console.error('Cache read error:', err.message);
      next(); // при ошибке Redis — идём дальше без кэша
    }
  };
}

/**
 * Сохранить данные в кэш
 */
async function saveToCache(key, data, ttl) {
  try {
    await redisClient.set(key, JSON.stringify(data), { EX: ttl });
  } catch (err) {
    console.error('Cache save error:', err.message);
  }
}

/**
 * Инвалидировать кэш пользователей (pg или mongo)
 * prefix: 'pg' | 'mongo'
 */
async function invalidateUsersCache(prefix, id = null) {
  try {
    await redisClient.del(`${prefix}:users:all`);
    if (id) await redisClient.del(`${prefix}:users:${id}`);
  } catch (err) {
    console.error('Cache invalidate error:', err.message);
  }
}

module.exports = { cacheMiddleware, saveToCache, invalidateUsersCache };
