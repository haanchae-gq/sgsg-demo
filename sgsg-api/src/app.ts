import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = Fastify({ logger: true });

// Register plugins
await app.register(cors, {
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});

await app.register(helmet);

// Health check route
app.get('/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Start server
const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '4000');
    await app.listen({ port, host: '0.0.0.0' });
    console.log(`Server running on http://localhost:${port}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();