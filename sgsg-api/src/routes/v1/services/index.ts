import { FastifyInstance } from 'fastify';
import { Type } from '@sinclair/typebox';
import { SimpleCatalogService } from '../../../services/simple-catalog.service';
import { SimpleCatalogHandler } from './simple-handler';

export default async function serviceRoutes(fastify: FastifyInstance) {
  // Create service instance
  const catalogService = new SimpleCatalogService(fastify.prisma);
  const handler = new SimpleCatalogHandler(catalogService);

  // Service categories routes
  fastify.get('/', handler.getCategories);

  fastify.get('/categories', {
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        isActive: Type.Optional(Type.Boolean()),
        search: Type.Optional(Type.String()),
        includeItems: Type.Optional(Type.Boolean()),
      }),
    },
  }, handler.getCategories);

  fastify.get('/categories/tree', {
    schema: {},
  }, handler.getCategoryTree);

  fastify.get('/categories/:categoryId', {
    schema: {
      params: Type.Object({
        categoryId: Type.String(),
      }),
      querystring: Type.Object({
        includeItems: Type.Optional(Type.Boolean()),
      }),
    },
  }, handler.getCategoryById);

  fastify.get('/categories/:categoryId/items', {
    schema: {
      params: Type.Object({
        categoryId: Type.String(),
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        isActive: Type.Optional(Type.Boolean()),
        search: Type.Optional(Type.String()),
        'priceRange.min': Type.Optional(Type.Number()),
        'priceRange.max': Type.Optional(Type.Number()),
      }),
    },
  }, handler.getItemsByCategoryId);

  // Service items routes
  fastify.get('/items', {
    schema: {
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
        isActive: Type.Optional(Type.Boolean()),
        search: Type.Optional(Type.String()),
        categoryId: Type.Optional(Type.String()),
        'priceRange.min': Type.Optional(Type.Number()),
        'priceRange.max': Type.Optional(Type.Number()),
      }),
    },
  }, handler.getItems);

  fastify.get('/items/:itemId', {
    schema: {
      params: Type.Object({
        itemId: Type.String(),
      }),
    },
  }, handler.getItemById);

  fastify.get('/items/:itemId/experts', {
    schema: {
      params: Type.Object({
        itemId: Type.String(),
      }),
      querystring: Type.Object({
        page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
        limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
      }),
    },
  }, handler.getItemExperts);

  fastify.get('/items/:itemId/prices', {
    schema: {
      params: Type.Object({
        itemId: Type.String(),
      }),
      querystring: Type.Object({
        effective: Type.Optional(Type.Boolean({ default: true })),
        includeHistory: Type.Optional(Type.Boolean({ default: false })),
      }),
    },
  }, handler.getItemPrices);
}