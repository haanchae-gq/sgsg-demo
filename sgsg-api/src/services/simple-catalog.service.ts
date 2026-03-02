import { PrismaClient } from '@prisma/client';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface CategoryFilter {
  isActive?: boolean;
  search?: string;
  includeItems?: boolean;
}

export interface ItemFilter {
  isActive?: boolean;
  search?: string;
  categoryId?: string;
  priceRange?: {
    min?: number;
    max?: number;
  };
}

export class SimpleCatalogService {
  constructor(private prisma: PrismaClient) {}

  // 서비스 카테고리 관련 메서드
  async getCategories(
    pagination: PaginationOptions,
    filter: CategoryFilter = {}
  ) {
    const { page, limit } = pagination;
    const { isActive, search, includeItems } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    const include = includeItems ? {
      items: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' } as const,
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          displayOrder: true,
          isActive: true,
        },
      },
    } : undefined;

    const [categories, total] = await Promise.all([
      this.prisma.serviceCategory.findMany({
        where,
        include,
        orderBy: { displayOrder: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.serviceCategory.count({ where }),
    ]);

    return {
      data: categories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getCategoryById(categoryId: string, includeItems = false) {
    const include = includeItems ? {
      items: {
        where: { isActive: true },
        orderBy: { displayOrder: 'asc' } as const,
        select: {
          id: true,
          name: true,
          description: true,
          basePrice: true,
          displayOrder: true,
          isActive: true,
        },
      },
    } : undefined;

    return await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include,
    });
  }

  async getItemsByCategoryId(
    categoryId: string,
    pagination: PaginationOptions,
    filter: Omit<ItemFilter, 'categoryId'> = {}
  ) {
    const { page, limit } = pagination;
    const { isActive, search, priceRange } = filter;
    const skip = (page - 1) * limit;

    const where: any = { categoryId };
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (priceRange && (priceRange.min || priceRange.max)) {
      if (priceRange.min) {
        where.basePrice = { ...where.basePrice, gte: priceRange.min };
      }
      if (priceRange.max) {
        where.basePrice = { ...where.basePrice, lte: priceRange.max };
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.serviceItem.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: { displayOrder: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.serviceItem.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // 서비스 항목 관련 메서드
  async getItems(
    pagination: PaginationOptions,
    filter: ItemFilter = {}
  ) {
    const { page, limit } = pagination;
    const { isActive, search, categoryId, priceRange } = filter;
    const skip = (page - 1) * limit;

    const where: any = {};
    
    if (isActive !== undefined) {
      where.isActive = isActive;
    }
    
    if (categoryId) {
      where.categoryId = categoryId;
    }
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (priceRange && (priceRange.min || priceRange.max)) {
      where.basePrice = {};
      if (priceRange.min) {
        where.basePrice.gte = priceRange.min;
      }
      if (priceRange.max) {
        where.basePrice.lte = priceRange.max;
      }
    }

    const [items, total] = await Promise.all([
      this.prisma.serviceItem.findMany({
        where,
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
        },
        orderBy: [
          { category: { displayOrder: 'asc' } },
          { displayOrder: 'asc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.serviceItem.count({ where }),
    ]);

    return {
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getItemById(itemId: string) {
    return await this.prisma.serviceItem.findUnique({
      where: { id: itemId },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });
  }

  async getItemExperts(itemId: string, pagination: PaginationOptions) {
    const { page, limit } = pagination;
    const skip = (page - 1) * limit;

    const where: any = {
      serviceMappings: {
        some: {
          serviceItemId: itemId,
          isAvailable: true,
        },
      },
      operationalStatus: 'active',
    };

    const [experts, total] = await Promise.all([
      this.prisma.expert.findMany({
        where,
        include: {
          user: {
            select: {
              name: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: [
          { rating: 'desc' },
          { totalCompletedOrders: 'desc' },
        ],
        skip,
        take: limit,
      }),
      this.prisma.expert.count({ where }),
    ]);

    return {
      data: experts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getItemPrices(itemId: string, options: { effective?: boolean; includeHistory?: boolean }) {
    const { effective = true, includeHistory = false } = options;
    const now = new Date();

    let where: any = {
      serviceItemId: itemId,
    };

    if (effective) {
      where.effectiveStartDate = { lte: now };
      where.OR = [
        { effectiveEndDate: null },
        { effectiveEndDate: { gte: now } },
      ];
      where.isActive = true;
    }

    const prices = await this.prisma.serviceItemPrice.findMany({
      where,
      include: {
        serviceItem: {
          select: {
            id: true,
            name: true,
            basePrice: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            name: true,
          },
        },
      },
      orderBy: [
        { effectiveStartDate: 'desc' },
        { priceVersion: 'desc' },
      ],
    });

    if (!includeHistory && effective && prices.length > 0) {
      // Return only the most recent effective price
      return {
        current: prices[0],
        item: prices[0].serviceItem,
      };
    }

    return {
      prices,
      item: prices[0]?.serviceItem || null,
    };
  }

  // 유틸리티 메서드
  async buildCategoryTree() {
    const categories = await this.prisma.serviceCategory.findMany({
      where: { isActive: true },
      include: {
        items: {
          where: { isActive: true },
          orderBy: { displayOrder: 'asc' },
        },
      },
      orderBy: { displayOrder: 'asc' },
    });

    return categories;
  }
}