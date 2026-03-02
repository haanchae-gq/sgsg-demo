import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

describe('Minimal Prisma test', () => {
  test('Can create Prisma client', async () => {
    console.log('Creating Prisma client...');
    
    // Create adapter like other tests do
    const connectionString = process.env.DB_URL || 'postgresql://user:pass@localhost:5432/test';
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    
    const prisma = new PrismaClient({
      adapter,
    });
    console.log('Prisma client created');
    
    // Try a simple query
    try {
      const result = await prisma.$queryRaw`SELECT 1 as test`;
      console.log('Query result:', result);
    } catch (error) {
      console.log('Query error:', error instanceof Error ? error.message : String(error));
    }
    
    // Don't connect, just test creation
    await prisma.$disconnect();
    console.log('Prisma client disconnected');
    
    // Clean up pool
    await pool.end();
  }, 5000);
});