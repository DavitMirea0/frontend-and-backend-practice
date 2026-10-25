import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
let channel = null;
let connection = null;

export async function connectRabbitMQ() {
  if (connection && channel) return { connection, channel };
  
  try {
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();
    
    await channel.assertQueue('main_queue', { durable: true });
    
    console.log('RabbitMQ connection established');
    return { connection, channel };
  } catch (error) {
    console.error('RabbitMQ connection failed:', error.message);
    throw error;
  }
}

async function getChannel() {
  if (channel) return channel;
  await connectRabbitMQ();
  return channel;
}

export async function sendTask(task) {
  const ch = await getChannel();
  const message = JSON.stringify(task);
  
  ch.sendToQueue('main_queue', Buffer.from(message), {
    persistent: true,
    headers: { 'x-retry-count': 0 }
  });
  
  console.log(`[Producer] Task ${task.id} (${task.type}) sent to queue`);
  return task;
}

export async function closeConnection() {
  if (channel) await channel.close();
  if (connection) await connection.close();
}