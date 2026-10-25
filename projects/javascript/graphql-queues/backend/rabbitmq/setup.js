import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@localhost:5672';

async function setupQueues() {
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  // 1. Create Dead Letter Exchange
  await channel.assertExchange('dlx_exchange', 'direct', { durable: true });

  // 2. Create Dead Letter Queue
  await channel.assertQueue('dead_letter_queue', { durable: true });

  // 3. Bind DLQ to DLX
  await channel.bindQueue('dead_letter_queue', 'dlx_exchange', 'dead');

  // 4. Create main queue with DLX configuration
  await channel.assertQueue('main_queue', {
    durable: true,
    arguments: {
      'x-dead-letter-exchange': 'dlx_exchange',
      'x-dead-letter-routing-key': 'dead',
      'x-message-ttl': 60000,
    },
  });

  console.log('✅ Queues configured: main_queue → [DLX] → dead_letter_queue');
  
  await channel.close();
  await connection.close();
}

setupQueues().catch(console.error);