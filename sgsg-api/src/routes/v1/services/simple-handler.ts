import { FastifyReply, FastifyRequest } from 'fastify';
import { SimpleCatalogService } from '../../../services/simple-catalog.service';

interface CategoryParams {
  categoryId: string;
}

interface ItemParams {
  itemId: string;
}

interface PaginationQuery {
  page?: number;
  limit?: number;
}

interface CategoryQuery extends PaginationQuery {
  isActive?: boolean;
  search?: string;
  includeItems?: boolean;
}

interface ItemQuery extends PaginationQuery {
  isActive?: boolean;
  search?: string;
  categoryId?: string;
  'priceRange.min'?: number;
  'priceRange.max'?: number;
}

export class SimpleCatalogHandler {
  private catalogService: SimpleCatalogService;

  constructor(catalogService: SimpleCatalogService) {
    this.catalogService = catalogService;
  }

  // 카테고리 관련 핸들러
  getCategories = async (
    request: FastifyRequest<{ Querystring: CategoryQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const {
        page = 1,
        limit = 20,
        isActive,
        search,
        includeItems,
      } = request.query;

      const result = await this.catalogService.getCategories(
        { page, limit },
        { isActive, search, includeItems }
      );

      reply.code(200).send({
        success: true,
        message: 'Categories retrieved successfully',
        ...result,
      });
    } catch (error) {
      request.log.error(error, 'Failed to get categories');
      reply.code(500).send({
        success: false,
        message: 'Failed to retrieve categories',
        error: 'CATALOG_001',
        debug: error.message || 'Unknown error'
      });
    }
  };

  getCategoryById = async (
    request: FastifyRequest<{
      Params: CategoryParams;
      Querystring: { includeItems?: boolean };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { categoryId } = request.params;
      const { includeItems = false } = request.query;

      const category = await this.catalogService.getCategoryById(
        categoryId,
        includeItems
      );

      if (!category) {
        reply.code(404).send({
          success: false,
          message: 'Category not found',
          error: 'CATALOG_002',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        message: 'Category retrieved successfully',
        data: category,
      });
    } catch (error) {
      request.log.error(error, 'Failed to get category');
      reply.code(500).send({
        success: false,
        message: 'Failed to retrieve category',
        error: 'CATALOG_003',
      });
    }
  };

  getItemsByCategoryId = async (
    request: FastifyRequest<{
      Params: CategoryParams;
      Querystring: Omit<ItemQuery, 'categoryId'>;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { categoryId } = request.params;
      const {
        page = 1,
        limit = 20,
        isActive,
        search,
        'priceRange.min': priceMin,
        'priceRange.max': priceMax,
      } = request.query;

      const priceRange = (priceMin || priceMax) ? {
        min: priceMin,
        max: priceMax,
      } : undefined;

      const result = await this.catalogService.getItemsByCategoryId(
        categoryId,
        { page, limit },
        { isActive, search, priceRange }
      );

      reply.code(200).send({
        success: true,
        message: 'Items retrieved successfully',
        ...result,
      });
    } catch (error) {
      request.log.error(error, 'Failed to get items by category');
      reply.code(500).send({
        success: false,
        message: 'Failed to retrieve items',
        error: 'CATALOG_004',
      });
    }
  };

  // 항목 관련 핸들러
  getItems = async (
    request: FastifyRequest<{ Querystring: ItemQuery }>,
    reply: FastifyReply
  ) => {
    try {
      const {
        page = 1,
        limit = 20,
        isActive,
        search,
        categoryId,
        'priceRange.min': priceMin,
        'priceRange.max': priceMax,
      } = request.query;

      const priceRange = (priceMin || priceMax) ? {
        min: priceMin,
        max: priceMax,
      } : undefined;

      const result = await this.catalogService.getItems(
        { page, limit },
        { isActive, search, categoryId, priceRange }
      );

      reply.code(200).send({
        success: true,
        message: 'Items retrieved successfully',
        ...result,
      });
    } catch (error) {
      request.log.error(error, 'Failed to get items');
      reply.code(500).send({
        success: false,
        message: 'Failed to retrieve items',
        error: 'CATALOG_005',
      });
    }
  };

  getItemById = async (
    request: FastifyRequest<{ Params: ItemParams }>,
    reply: FastifyReply
  ) => {
    try {
      const { itemId } = request.params;

      const item = await this.catalogService.getItemById(itemId);

      if (!item) {
        reply.code(404).send({
          success: false,
          message: 'Item not found',
          error: 'CATALOG_006',
        });
        return;
      }

      reply.code(200).send({
        success: true,
        message: 'Item retrieved successfully',
        data: item,
      });
    } catch (error) {
      request.log.error(error, 'Failed to get item');
      reply.code(500).send({
        success: false,
        message: 'Failed to retrieve item',
        error: 'CATALOG_007',
      });
    }
  };

  getItemExperts = async (
    request: FastifyRequest<{
      Params: ItemParams;
      Querystring: PaginationQuery;
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { itemId } = request.params;
      const { page = 1, limit = 20 } = request.query;

      const result = await this.catalogService.getItemExperts(
        itemId,
        { page, limit }
      );

      reply.code(200).send({
        success: true,
        message: 'Item experts retrieved successfully',
        ...result,
      });
    } catch (error) {
      request.log.error(error, 'Failed to get item experts');
      reply.code(500).send({
        success: false,
        message: 'Failed to retrieve item experts',
        error: 'CATALOG_008',
      });
    }
  };

  getItemPrices = async (
    request: FastifyRequest<{
      Params: ItemParams;
      Querystring: { effective?: boolean; includeHistory?: boolean };
    }>,
    reply: FastifyReply
  ) => {
    try {
      const { itemId } = request.params;
      const { effective = true, includeHistory = false } = request.query;

      const result = await this.catalogService.getItemPrices(
        itemId,
        { effective, includeHistory }
      );

      reply.code(200).send({
        success: true,
        message: 'Item prices retrieved successfully',
        data: result,
      });
    } catch (error) {
      request.log.error(error, 'Failed to get item prices');
      reply.code(500).send({
        success: false,
        message: 'Failed to retrieve item prices',
        error: 'CATALOG_010',
      });
    }
  };

  // 유틸리티 핸들러
  getCategoryTree = async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
    try {
      const tree = await this.catalogService.buildCategoryTree();

      reply.code(200).send({
        success: true,
        message: 'Category tree retrieved successfully',
        data: tree,
      });
    } catch (error) {
      request.log.error(error, 'Failed to get category tree');
      reply.code(500).send({
        success: false,
        message: 'Failed to retrieve category tree',
        error: 'CATALOG_009',
      });
    }
  };
}