import { Type } from '@sinclair/typebox';

// Common schemas
export const PaginationQuery = Type.Object({
  page: Type.Optional(Type.Integer({ minimum: 1, default: 1 })),
  limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 20 })),
});

// Order creation request schema
export const CreateOrderRequest = Type.Object({
  serviceItemId: Type.String(),
  addressId: Type.String(),
  requestedDate: Type.String({ format: 'date-time' }),
  customerNotes: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Any()),
});

// Order update request schema
export const UpdateOrderRequest = Type.Object({
  requestedDate: Type.Optional(Type.String({ format: 'date-time' })),
  customerNotes: Type.Optional(Type.String()),
  expertNotes: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Any()),
});

// Order response schema
export const OrderResponse = Type.Object({
  id: Type.String(),
  orderNumber: Type.String(),
  customerId: Type.String(),
  expertId: Type.Optional(Type.String()),
  serviceItemId: Type.String(),
  addressId: Type.String(),
  status: Type.Union([
    Type.Literal('new'),
    Type.Literal('consult_required'),
    Type.Literal('schedule_pending'),
    Type.Literal('schedule_confirmed'),
    Type.Literal('in_progress'),
    Type.Literal('payment_pending'),
    Type.Literal('paid'),
    Type.Literal('as_requested'),
    Type.Literal('cancelled'),
  ]),
  paymentStatus: Type.Union([
    Type.Literal('pending'),
    Type.Literal('deposit_paid'),
    Type.Literal('balance_pending'),
    Type.Literal('balance_paid'),
    Type.Literal('refunded'),
  ]),
  requestedDate: Type.String({ format: 'date-time' }),
  confirmedDate: Type.Optional(Type.String({ format: 'date-time' })),
  startedAt: Type.Optional(Type.String({ format: 'date-time' })),
  completedAt: Type.Optional(Type.String({ format: 'date-time' })),
  cancelledAt: Type.Optional(Type.String({ format: 'date-time' })),
  basePrice: Type.Number(),
  onsiteCosts: Type.Optional(Type.Array(Type.Any())),
  discountAmount: Type.Number(),
  depositAmount: Type.Number(),
  totalAmount: Type.Number(),
  paidAmount: Type.Number(),
  customerNotes: Type.Optional(Type.String()),
  expertNotes: Type.Optional(Type.String()),
  cancellationReason: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Any()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  serviceItem: Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    basePrice: Type.Number(),
    category: Type.Object({
      id: Type.String(),
      name: Type.String(),
      slug: Type.String(),
    }),
  }),
  customer: Type.Object({
    id: Type.String(),
    user: Type.Object({
      id: Type.String(),
      name: Type.String(),
      email: Type.String(),
      phone: Type.String(),
    }),
  }),
  expert: Type.Optional(Type.Object({
    id: Type.String(),
    businessName: Type.String(),
    rating: Type.Optional(Type.Number()),
    user: Type.Object({
      id: Type.String(),
      name: Type.String(),
      phone: Type.String(),
    }),
  })),
  address: Type.Object({
    id: Type.String(),
    label: Type.String(),
    addressLine1: Type.String(),
    addressLine2: Type.Optional(Type.String()),
    city: Type.String(),
    state: Type.String(),
    postalCode: Type.String(),
  }),
});

// Order list response schema
export const OrderListResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  data: Type.Array(OrderResponse),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
  }),
});

// Order detail response schema
export const OrderDetailResponse = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  data: OrderResponse,
});

// Order cancellation request schema
export const CancelOrderRequest = Type.Object({
  cancellationReason: Type.String(),
});

// Order note schemas
export const CreateOrderNoteRequest = Type.Object({
  content: Type.String(),
  isInternal: Type.Optional(Type.Boolean()),
});

export const OrderNoteResponse = Type.Object({
  id: Type.String(),
  orderId: Type.String(),
  authorId: Type.String(),
  authorType: Type.Union([
    Type.Literal('customer'),
    Type.Literal('expert'),
    Type.Literal('admin'),
  ]),
  content: Type.String(),
  isInternal: Type.Boolean(),
  createdAt: Type.String({ format: 'date-time' }),
  author: Type.Object({
    id: Type.String(),
    name: Type.String(),
  }),
});

// Order attachment schemas  
export const OrderAttachmentResponse = Type.Object({
  id: Type.String(),
  orderId: Type.String(),
  uploaderId: Type.String(),
  fileName: Type.String(),
  fileUrl: Type.String(),
  fileType: Type.Optional(Type.String()),
  fileSize: Type.Optional(Type.Integer()),
  attachmentType: Type.Optional(Type.Union([
    Type.Literal('before'),
    Type.Literal('after'),
    Type.Literal('receipt'),
    Type.Literal('other'),
  ])),
  createdAt: Type.String({ format: 'date-time' }),
  uploader: Type.Object({
    id: Type.String(),
    name: Type.String(),
  }),
});

// Query parameter schemas
export const OrderFilterQuery = Type.Intersect([
  PaginationQuery,
  Type.Object({
    status: Type.Optional(Type.String()),
    paymentStatus: Type.Optional(Type.String()),
    expertId: Type.Optional(Type.String()),
    customerId: Type.Optional(Type.String()),
    serviceItemId: Type.Optional(Type.String()),
    dateFrom: Type.Optional(Type.String()),
    dateTo: Type.Optional(Type.String()),
  }),
]);

// Route parameter schemas
export const OrderIdParam = Type.Object({
  orderId: Type.String(),
});

export const NoteIdParam = Type.Object({
  noteId: Type.String(),
});

export const AttachmentIdParam = Type.Object({
  attachmentId: Type.String(),
});

// Payment related schemas
export const InitializePaymentRequest = Type.Object({
  orderId: Type.String(),
  paymentType: Type.Union([
    Type.Literal('deposit'),
    Type.Literal('balance'),
    Type.Literal('full'),
  ]),
  method: Type.Optional(Type.Union([
    Type.Literal('credit_card'),
    Type.Literal('virtual_account'),
    Type.Literal('simple_payment'),
    Type.Literal('cash'),
  ])),
});

export const PaymentResponse = Type.Object({
  id: Type.String(),
  orderId: Type.String(),
  paymentNumber: Type.String(),
  paymentType: Type.Union([
    Type.Literal('deposit'),
    Type.Literal('balance'),
    Type.Literal('full'),
  ]),
  method: Type.Optional(Type.Union([
    Type.Literal('credit_card'),
    Type.Literal('virtual_account'),
    Type.Literal('simple_payment'),
    Type.Literal('cash'),
  ])),
  amount: Type.Number(),
  status: Type.Union([
    Type.Literal('pending'),
    Type.Literal('completed'),
    Type.Literal('failed'),
    Type.Literal('cancelled'),
    Type.Literal('refunded'),
  ]),
  pgProvider: Type.Optional(Type.String()),
  pgTransactionId: Type.Optional(Type.String()),
  pgResponse: Type.Optional(Type.Any()),
  paidAt: Type.Optional(Type.String({ format: 'date-time' })),
  refundedAt: Type.Optional(Type.String({ format: 'date-time' })),
  refundAmount: Type.Number(),
  refundReason: Type.Optional(Type.String()),
  metadata: Type.Optional(Type.Any()),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
});

export const CompletePaymentRequest = Type.Object({
  paymentId: Type.String(),
  pgTransactionId: Type.String(),
  pgResponse: Type.Any(),
  paidAt: Type.Optional(Type.String({ format: 'date-time' })),
});

export const RefundPaymentRequest = Type.Object({
  amount: Type.Number(),
  reason: Type.String(),
});

export const PaymentIdParam = Type.Object({
  paymentId: Type.String(),
});