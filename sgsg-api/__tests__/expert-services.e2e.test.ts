import { it, describe, beforeAll, afterAll } from '@jest/globals';
import { PrismaClient } from '../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import Fastify, { FastifyInstance } from 'fastify';
import { createTestApp } from './setup';
import "dotenv/config";

describe('Expert Services API (E2E)', () => {
  let app: FastifyInstance;
  let prisma: PrismaClient;
  let expertToken: string;
  let expertId: string;
  let createdMappingId: string;

  beforeAll(async () => {
    console.log('Starting beforeAll...');
    try {
      app = await createTestApp();
      console.log('Test app created');
    } catch (error) {
      console.error('createTestApp failed:', error);
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
    console.log('Prisma client initialized for cleanup');

    // Login as expert to get token
    console.log('Attempting login...');
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      payload: {
        email: 'expert@sgsg.com',
        password: 'Expert@123456'
      }
    });
    console.log('Login response status:', loginResponse.statusCode);
    console.log('Login response body:', loginResponse.body);

    try {
      expect(loginResponse.statusCode).toBe(200);
      const loginBody = JSON.parse(loginResponse.body);
      console.log('Parsed login body:', loginBody);
      expertToken = loginBody.data.accessToken;
      expertId = loginBody.data.user.expert?.id;
      console.log('Extracted expertToken:', expertToken);
      console.log('Extracted expertId:', expertId);
      expect(expertToken).toBeDefined();
      expect(expertId).toBeDefined();
      console.log('Login successful');
    } catch (error) {
      console.error('Login assertion failed:', error);
      throw error;
    }
  });

  afterAll(async () => {
    // Clean up created service mappings
    if (createdMappingId) {
      await prisma.expertServiceMapping.deleteMany({
        where: { id: createdMappingId }
      });
    }
    
    await app.close();
    await prisma.$disconnect();
  });

  describe('Service Mappings CRUD', () => {
    it('GET /api/v1/experts/me/services should return expert service mappings', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/experts/me/services',
        headers: {
          authorization: `Bearer ${expertToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(Array.isArray(body.data)).toBe(true);
      expect(body.pagination).toBeDefined();
      
      // Each mapping should have required fields
      body.data.forEach((mapping: any) => {
        expect(mapping.id).toBeDefined();
        expect(mapping.expertId).toBe(expertId);
        expect(mapping.serviceItemId).toBeDefined();
        expect(typeof mapping.isAvailable).toBe('boolean');
        expect(mapping.serviceItem).toBeDefined();
        expect(mapping.serviceItem.name).toBeDefined();
        expect(mapping.serviceItem.category).toBeDefined();
      });
    });

    it('POST /api/v1/experts/me/services should create new service mapping', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/experts/me/services',
        headers: {
          authorization: `Bearer ${expertToken}`
        },
        payload: {
          serviceItemId: 'it3', // 콘센트 설치
          customPrice: 80000,
          isAvailable: true
        }
      });

      expect(response.statusCode).toBe(201);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.expertId).toBe(expertId);
      expect(body.data.serviceItemId).toBe('it3');
      expect(body.data.customPrice).toBe(80000);
      expect(body.data.isAvailable).toBe(true);
      expect(body.data.serviceItem).toBeDefined();
      
      createdMappingId = body.data.id;
    });

    it('POST /api/v1/experts/me/services with duplicate serviceItemId should return 409', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/experts/me/services',
        headers: {
          authorization: `Bearer ${expertToken}`
        },
        payload: {
          serviceItemId: 'it1', // Already mapped in seed data
          customPrice: 90000,
          isAvailable: true
        }
      });

      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('PUT /api/v1/experts/me/services/:mappingId should update service mapping', async () => {
      // First ensure we have a mapping to update
      if (!createdMappingId) {
        const createResponse = await app.inject({
          method: 'POST',
          url: '/api/v1/experts/me/services',
          headers: {
            authorization: `Bearer ${expertToken}`
          },
          payload: {
            serviceItemId: 'it4', // 소형 이사
            customPrice: 100000,
            isAvailable: true
          }
        });
        expect(createResponse.statusCode).toBe(201);
        const createBody = JSON.parse(createResponse.body);
        createdMappingId = createBody.data.id;
      }

      const response = await app.inject({
        method: 'PUT',
        url: `/api/v1/experts/me/services/${createdMappingId}`,
        headers: {
          authorization: `Bearer ${expertToken}`
        },
        payload: {
          customPrice: 120000,
          isAvailable: false
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(createdMappingId);
      expect(body.data.customPrice).toBe(120000);
      expect(body.data.isAvailable).toBe(false);
    });

    it('PUT /api/v1/experts/me/services/nonexistent should return 404', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/experts/me/services/nonexistent',
        headers: {
          authorization: `Bearer ${expertToken}`
        },
        payload: {
          customPrice: 50000
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('DELETE /api/v1/experts/me/services/:mappingId should delete service mapping', async () => {
      // First ensure we have a mapping to delete
      if (!createdMappingId) {
        const createResponse = await app.inject({
          method: 'POST',
          url: '/api/v1/experts/me/services',
          headers: {
            authorization: `Bearer ${expertToken}`
          },
          payload: {
            serviceItemId: 'it5', // 대청소
            customPrice: 300000,
            isAvailable: true
          }
        });
        expect(createResponse.statusCode).toBe(201);
        const createBody = JSON.parse(createResponse.body);
        createdMappingId = createBody.data.id;
      }

      const response = await app.inject({
        method: 'DELETE',
        url: `/api/v1/experts/me/services/${createdMappingId}`,
        headers: {
          authorization: `Bearer ${expertToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.data.message).toBeDefined();
      
      // Reset for cleanup
      createdMappingId = '';
    });

    it('DELETE /api/v1/experts/me/services/nonexistent should return 404', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/experts/me/services/nonexistent',
        headers: {
          authorization: `Bearer ${expertToken}`
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });

  describe('Authentication Required', () => {
    it('GET /api/v1/experts/me/services without token should return 401', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/experts/me/services'
      });

      expect(response.statusCode).toBe(401);
    });

    it('POST /api/v1/experts/me/services without token should return 401', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/experts/me/services',
        payload: {
          serviceItemId: 'it1'
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('PUT /api/v1/experts/me/services/:id without token should return 401', async () => {
      const response = await app.inject({
        method: 'PUT',
        url: '/api/v1/experts/me/services/test-id',
        payload: {
          customPrice: 50000
        }
      });

      expect(response.statusCode).toBe(401);
    });

    it('DELETE /api/v1/experts/me/services/:id without token should return 401', async () => {
      const response = await app.inject({
        method: 'DELETE',
        url: '/api/v1/experts/me/services/test-id'
      });

      expect(response.statusCode).toBe(401);
    });
  });

  describe('Pagination and Filtering', () => {
    it('GET /api/v1/experts/me/services with pagination should work correctly', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/experts/me/services?page=1&limit=2',
        headers: {
          authorization: `Bearer ${expertToken}`
        }
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(true);
      expect(body.pagination.page).toBe(1);
      expect(body.pagination.limit).toBe(2);
      expect(body.data.length).toBeLessThanOrEqual(2);
    });
  });

  describe('Validation', () => {
    it('POST /api/v1/experts/me/services without serviceItemId should return 400', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/experts/me/services',
        headers: {
          authorization: `Bearer ${expertToken}`
        },
        payload: {
          customPrice: 50000
        }
      });

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });

    it('POST /api/v1/experts/me/services with invalid serviceItemId should return 404', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/api/v1/experts/me/services',
        headers: {
          authorization: `Bearer ${expertToken}`
        },
        payload: {
          serviceItemId: 'nonexistent',
          customPrice: 50000
        }
      });

      expect(response.statusCode).toBe(404);
      const body = JSON.parse(response.body);
      expect(body.success).toBe(false);
    });
  });
});