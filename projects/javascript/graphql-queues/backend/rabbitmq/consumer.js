import amqplib from 'amqplib';

const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672';
const WORKER_ID = process.env.WORKER_ID || '1';
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || 3;
const BASE_DELAY_MS = parseInt(process.env.BASE_DELAY_MS) || 1000;
const MAX_DELAY_MS = parseInt(process.env.MAX_DELAY_MS) || 30000;

async function processWithRetry(message, processor, retryCount = 0) {
  try {
    await processor(message);
    return { success: true, retryCount };
  } catch (err) {
    if (retryCount >= MAX_RETRIES) {
      console.error(`[Worker ${WORKER_ID}] ❌ Max retries (${MAX_RETRIES}) exceeded for task ${message.id}`);
      throw err;
    }
    
    const exponentialDelay = Math.min(BASE_DELAY_MS * Math.pow(2, retryCount), MAX_DELAY_MS);
    const jitter = Math.random() * 1000;
    const delay = exponentialDelay + jitter;
    
    console.warn(`[Worker ${WORKER_ID}] ⚠️ Retry ${retryCount + 1}/${MAX_RETRIES} for task ${message.id} in ${Math.round(delay)}ms`);
    await new Promise(resolve => setTimeout(resolve, delay));
    
    return processWithRetry(message, processor, retryCount + 1);
  }
}

async function processEmailTask(task) {
  console.log(`[Worker ${WORKER_ID}] 📧 Sending email to ${task.payload.to}: "${task.payload.subject}"`);
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 70% success rate for demo
  if (Math.random() < 0.7) {
    console.log(`[Worker ${WORKER_ID}] ✅ Email sent successfully`);
    return;
  }
  throw new Error('Email service temporarily unavailable');
}

async function processNotificationTask(task) {
  console.log(`[Worker ${WORKER_ID}] 🔔 Sending notification to ${task.payload.email}: "${task.payload.message}"`);
  await new Promise(resolve => setTimeout(resolve, 500));
  console.log(`[Worker ${WORKER_ID}] ✅ Notification sent successfully`);
}

async function waitForRabbitMQ(retries = 10, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      const connection = await amqplib.connect(RABBITMQ_URL);
      await connection.close();
      console.log(`[Worker ${WORKER_ID}] ✅ Connected to RabbitMQ`);
      return true;
    } catch (error) {
      console.log(`[Worker ${WORKER_ID}] ⏳ Waiting for RabbitMQ... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Could not connect to RabbitMQ after multiple retries');
}

async function startConsumer() {
  await waitForRabbitMQ();
  
  const connection = await amqplib.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();
  
  await channel.assertQueue('main_queue', { durable: true });
  channel.prefetch(1);
  
  console.log(`[Worker ${WORKER_ID}] 🚀 Started, waiting for tasks...`);
  
  channel.consume('main_queue', async (msg) => {
    if (!msg) return;
    
    const task = JSON.parse(msg.content.toString());
    const retryCount = msg.properties.headers?.['x-retry-count'] || 0;
    
    console.log(`[Worker ${WORKER_ID}] 📥 Received task ${task.id} (${task.type}), retry: ${retryCount}`);
    
    try {
      await processWithRetry(task, async (t) => {
        if (t.type === 'email') {
          await processEmailTask(t);
        } else if (t.type === 'notification') {
          await processNotificationTask(t);
        } else {
          console.log(`[Worker ${WORKER_ID}] ⚡ Processing ${t.type} task`);
        }
      }, retryCount);
      
      channel.ack(msg);
      console.log(`[Worker ${WORKER_ID}] ✅ Task ${task.id} completed successfully`);
      
    } catch (err) {
      console.error(`[Worker ${WORKER_ID}] ❌ Task ${task.id} failed permanently: ${err.message}`);
      channel.nack(msg, false, false);
      console.log(`[Worker ${WORKER_ID}] 📋 Task ${task.id} sent to Dead Letter Queue`);
    }
  });
}

startConsumer().catch(console.error);