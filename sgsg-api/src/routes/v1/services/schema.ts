import { Type } from '@sinclair/typebox';

// Common schemas
export const PaginationQuery = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
});

export const FilterQuery = Type.Object({
  isActive: Type.Optional(Type.Boolean()),
  search: Type.Optional(Type.String()),
});

// Service Category schemas (대분류)
export const ServiceCategoryResponse = Type.Object({
  id: Type.String(),
  code: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  displayOrder: Type.Integer(),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const ServiceCategoryWithSubcategories = Type.Object({
  ...ServiceCategoryResponse.properties,
  subcategories: Type.Array(Type.Object({
    id: Type.String(),
    code: Type.String(),
    name: Type.String(),
    membershipAvailable: Type.Boolean(),
    displayOrder: Type.Integer(),
    isActive: Type.Boolean(),
  })),
});

export const CategoriesListResponse = Type.Object({
  data: Type.Array(ServiceCategoryResponse),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
  }),
});

export const CategoriesTreeResponse = Type.Object({
  data: Type.Array(ServiceCategoryWithSubcategories),
  total: Type.Integer(),
});

// Service Subcategory schemas (중분류)
export const ServiceSubcategoryResponse = Type.Object({
  id: Type.String(),
  categoryId: Type.String(),
  code: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  membershipAvailable: Type.Boolean(),
  displayOrder: Type.Integer(),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  category: Type.Optional(Type.Object({
    id: Type.String(),
    code: Type.String(),
    name: Type.String(),
  })),
});

export const ServiceSubcategoryWithItems = Type.Object({
  ...ServiceSubcategoryResponse.properties,
  items: Type.Array(Type.Object({
    id: Type.String(),
    code: Type.String(),
    name: Type.String(),
    displayOrder: Type.Integer(),
    isActive: Type.Boolean(),
  })),
});

export const SubcategoriesListResponse = Type.Object({
  data: Type.Array(ServiceSubcategoryResponse),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
  }),
});

export const MembershipInfoResponse = Type.Object({
  membershipAvailable: Type.Boolean(),
  subcategoryId: Type.String(),
  subcategoryName: Type.String(),
  categoryName: Type.String(),
  requirements: Type.Optional(Type.Array(Type.String())),
  benefits: Type.Optional(Type.Array(Type.String())),
});

// Service Item schemas (소분류)
export const ServiceItemResponse = Type.Object({
  id: Type.String(),
  subcategoryId: Type.String(),
  code: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  displayOrder: Type.Integer(),
  isActive: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  subcategory: Type.Optional(Type.Object({
    id: Type.String(),
    code: Type.String(),
    name: Type.String(),
    category: Type.Object({
      id: Type.String(),
      code: Type.String(),
      name: Type.String(),
    }),
  })),
});

export const ServiceItemsListResponse = Type.Object({
  data: Type.Array(ServiceItemResponse),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
  }),
});

// Price related schemas
export const ServiceItemPriceResponse = Type.Object({
  id: Type.String(),
  serviceItemId: Type.String(),
  basePrice: Type.Number(),
  unitType: Type.Union([
    Type.Literal('ea'),
    Type.Literal('area'),
    Type.Literal('time'),
    Type.Literal('meter'),
    Type.Literal('set'),
  ]),
  minPrice: Type.Optional(Type.Number()),
  vatIncluded: Type.Boolean(),
  effectiveStartDate: Type.String({ format: 'date-time' }),
  effectiveEndDate: Type.Optional(Type.String({ format: 'date-time' })),
  priceVersion: Type.Integer(),
  isActive: Type.Boolean(),
});

export const OnSiteFeeResponse = Type.Object({
  id: Type.String(),
  code: Type.String(),
  name: Type.String(),
  description: Type.Optional(Type.String()),
  feeType: Type.Union([Type.Literal('fixed'), Type.Literal('unit_based')]),
  baseAmount: Type.Number(),
  vatIncluded: Type.Boolean(),
  settlementIncluded: Type.Boolean(),
  isRequired: Type.Boolean(),
  maxQuantity: Type.Optional(Type.Integer()),
});

export const ExtraFieldResponse = Type.Object({
  id: Type.String(),
  fieldKey: Type.String(),
  label: Type.String(),
  fieldType: Type.Union([
    Type.Literal('text'),
    Type.Literal('number'),
    Type.Literal('date'),
    Type.Literal('select'),
    Type.Literal('checkbox'),
    Type.Literal('radio'),
  ]),
  options: Type.Optional(Type.Array(Type.Any())),
  isRequired: Type.Boolean(),
  displayLocation: Type.Union([
    Type.Literal('order_backoffice_only'),
    Type.Literal('expert_app_only'),
    Type.Literal('both'),
  ]),
  sortOrder: Type.Integer(),
  isActive: Type.Boolean(),
});

export const ExpertResponse = Type.Object({
  id: Type.String(),
  businessName: Type.String(),
  rating: Type.Optional(Type.Number()),
  totalCompletedOrders: Type.Integer(),
  operationalStatus: Type.Union([
    Type.Literal('active'),
    Type.Literal('inactive'),
    Type.Literal('busy'),
    Type.Literal('vacation'),
  ]),
  serviceRegions: Type.Array(Type.String()),
  user: Type.Object({
    name: Type.String(),
    avatarUrl: Type.Optional(Type.String()),
  }),
});

export const ChannelCommissionResponse = Type.Object({
  id: Type.String(),
  serviceItemId: Type.String(),
  channelCode: Type.String(),
  commissionType: Type.Union([Type.Literal('rate'), Type.Literal('fixed')]),
  commissionValue: Type.Number(),
  vatBasis: Type.Union([Type.Literal('included'), Type.Literal('excluded')]),
  effectiveStartDate: Type.String({ format: 'date-time' }),
  effectiveEndDate: Type.Optional(Type.String({ format: 'date-time' })),
  isActive: Type.Boolean(),
});

// Route parameter schemas
export const CategoryIdParam = Type.Object({
  categoryId: Type.String(),
});

export const SubcategoryIdParam = Type.Object({
  subcategoryId: Type.String(),
});

export const ItemIdParam = Type.Object({
  itemId: Type.String(),
});

// Query parameter schemas for filtering
export const CategoryFilterQuery = Type.Intersect([
  PaginationQuery,
  FilterQuery,
  Type.Object({
    includeSubcategories: Type.Optional(Type.Boolean()),
  }),
]);

export const SubcategoryFilterQuery = Type.Intersect([
  PaginationQuery,
  FilterQuery,
  Type.Object({
    categoryId: Type.Optional(Type.String()),
    membershipAvailable: Type.Optional(Type.Boolean()),
    includeItems: Type.Optional(Type.Boolean()),
  }),
]);

export const ItemFilterQuery = Type.Intersect([
  PaginationQuery,
  FilterQuery,
  Type.Object({
    subcategoryId: Type.Optional(Type.String()),
    categoryId: Type.Optional(Type.String()),
    priceRange: Type.Optional(Type.Object({
      min: Type.Optional(Type.Number()),
      max: Type.Optional(Type.Number()),
    })),
  }),
]);

export const ExpertFilterQuery = Type.Intersect([
  PaginationQuery,
  Type.Object({
    region: Type.Optional(Type.String()),
    rating: Type.Optional(Type.Number()),
    status: Type.Optional(Type.Union([
      Type.Literal('active'),
      Type.Literal('inactive'),
      Type.Literal('busy'),
      Type.Literal('vacation'),
    ])),
  }),
]);