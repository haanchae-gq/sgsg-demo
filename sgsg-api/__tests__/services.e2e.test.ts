import { it, describe, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import Fastify, { FastifyInstance } from 'fastify';
import { build } from './setup';
import "dotenv/config";

describe('Services API (E2E)', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;

  beforeAll(async () => {
    try {
      app = await build();
    } catch (error) {
      console.error('Error in build():', error);
      throw error;
    }
    
    // Initialize Prisma for cleanup
    const connectionString = process.env.DB_URL;
    if (!connectionString) {
      throw new Error('DB_URL environment variable is not set');
    }
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    prisma = new PrismaClient({
      adapter,
      log: ['error'],
    });
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  describe('Categories API', () => {
    it('GET /api/v1/services/categories should return categories list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/categories',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toBeDefined();
      expect(body.pagination.page).toBe(1);
    });

    it('GET /api/v1/services/categories/:id should return category details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/categories/cl1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('cl1');
      expect(body.data.name).toBe('청소 서비스');
    });

    it('GET /api/v1/services/categories/:id with includeItems should return category with items', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/categories/cl1?includeItems=true',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.items).toBeDefined();
      expect(Array.isArray(body.data.items)).toBe(true);
      expect(body.data.items.length).toBeGreaterThan(0);
    });

    it('GET /api/v1/services/categories/tree should return category tree', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/categories/tree',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      
      // Check that items are included in tree
      const categoryWithItems = body.data.find((cat: any) => cat.items && cat.items.length > 0);
      expect(categoryWithItems).toBeDefined();
      expect(Array.isArray(categoryWithItems.items)).toBe(true);
    });

    it('GET /api/v1/services/categories/:id/items should return items for category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/categories/cl1/items',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toBeDefined();
      
      // All items should belong to the same category
      body.data.forEach((item: any) => {
        expect(item.categoryId).toBe('cl1');
      });
    });

    it('GET /api/v1/services/categories/nonexistent should return 404', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/categories/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Items API', () => {
    it('GET /api/v1/services/items should return items list', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toBeDefined();
      
      // Each item should have category information
      body.data.forEach((item: any) => {
        expect(item.category).toBeDefined();
        expect(item.category.id).toBeDefined();
        expect(item.category.name).toBeDefined();
      });
    });

    it('GET /api/v1/services/items/:id should return item details', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items/it1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe('it1');
      expect(body.data.name).toBe('정기 청소');
      expect(body.data.category).toBeDefined();
    });

    it('GET /api/v1/services/items with search should filter results', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items?search=청소',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      
      // All returned items should contain '청소' in name or description
      body.data.forEach((item: any) => {
        const hasSearchTerm = item.name.includes('청소') || 
                             (item.description && item.description.includes('청소'));
        expect(hasSearchTerm).toBe(true);
      });
    });

    it('GET /api/v1/services/items with price range should filter by price', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items?priceRange.min=100000&priceRange.max=200000',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      
      // All returned items should be within price range
      body.data.forEach((item: any) => {
        expect(item.basePrice).toBeGreaterThanOrEqual(100000);
        expect(item.basePrice).toBeLessThanOrEqual(200000);
      });
    });

    it('GET /api/v1/services/items with categoryId should filter by category', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items?categoryId=cl1',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      
      // All returned items should belong to cl1 category
      body.data.forEach((item: any) => {
        expect(item.categoryId).toBe('cl1');
      });
    });

    it('GET /api/v1/services/items/nonexistent should return 404', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items/nonexistent',
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Item Experts API', () => {
    it('GET /api/v1/services/items/:id/experts should return experts for service item', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items/it1/experts',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toBeDefined();
      
      // Each expert should have required fields
      body.data.forEach((expert: any) => {
        expect(expert.id).toBeDefined();
        expect(expert.user).toBeDefined();
        expect(expert.user.name).toBeDefined();
        expect(expert.rating).toBeDefined();
        expect(expert.totalCompletedOrders).toBeDefined();
      });
    });
  });

  describe('Item Prices API', () => {
    it('GET /api/v1/services/items/:id/prices should return price information', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items/it1/prices',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      
      // Should have item information
      if (body.data.current) {
        expect(body.data.current.basePrice).toBeDefined();
        expect(body.data.current.effectiveStartDate).toBeDefined();
        expect(body.data.current.serviceItem).toBeDefined();
      }
      
      if (body.data.item) {
        expect(body.data.item.name).toBeDefined();
        expect(body.data.item.category).toBeDefined();
      }
    });

    it('GET /api/v1/services/items/:id/prices with includeHistory should return price history', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items/it1/prices?includeHistory=true',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data).toBeDefined();
      
      if (body.data.prices) {
        expect(Array.isArray(body.data.prices)).toBe(true);
      }
    });

    it('GET /api/v1/services/items/nonexistent/prices should return 200 with null data', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items/nonexistent/prices',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
    });
  });

  describe('Pagination', () => {
    it('GET /api/v1/services/categories with pagination should work correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/categories?page=1&limit=2',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(2);
      expect(body.data.length).toBeLessThanOrEqual(2);
    });

    it('GET /api/v1/services/items with pagination should work correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/services/items?page=1&limit=3',
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(3);
      expect(body.data.length).toBeLessThanOrEqual(3);
    });
  });
});