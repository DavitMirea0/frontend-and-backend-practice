import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { typeDefs } from './graphql/schema.js';
import { resolvers } from './graphql/resolvers.js';
import { sendTask, connectRabbitMQ } from './rabbitmq/producer.js';

const app = express();
const httpServer = http.createServer(app);

// GraphQL Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
});

await server.start();

app.use(
  cors(),
  express.json(),
  expressMiddleware(server, {
    context: async ({ req }) => ({
      headers: req.headers,
      sendTask,
    }),
  })
);

// REST endpoint for tasks
app.post('/api/tasks', express.json(), async (req, res) => {
  try {
    const { type, payload } = req.body;
    const task = { id: Date.now().toString(), type, payload, createdAt: new Date().toISOString() };
    await sendTask(task);
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 4000;

// Функция для ожидания RabbitMQ
async function waitForRabbitMQ(retries = 10, delay = 5000) {
  for (let i = 0; i < retries; i++) {
    try {
      await connectRabbitMQ();
      console.log('✅ Connected to RabbitMQ');
      return true;
    } catch (error) {
      console.log(`⏳ Waiting for RabbitMQ... (${i + 1}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Could not connect to RabbitMQ after multiple retries');
}

// Ждем RabbitMQ перед запуском сервера
await waitForRabbitMQ();

await new Promise((resolve) => httpServer.listen({ port: PORT }, resolve));
console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
console.log(`📡 REST API at http://localhost:${PORT}/api/tasks`);