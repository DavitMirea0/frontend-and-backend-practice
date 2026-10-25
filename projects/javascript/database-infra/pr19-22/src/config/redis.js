const { createClient } = require('redis');

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://127.0.0.1:6379',
});

redisClient.on('error', (err) => console.error('❌ Redis error:', err));

const connectRedis = async () => {
  await redisClient.connect();
  console.log('✅ Redis подключён');
};

module.exports = { redisClient, connectRedis };
