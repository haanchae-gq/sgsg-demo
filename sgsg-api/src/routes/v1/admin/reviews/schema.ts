import { Type } from '@sinclair/typebox';

// 리뷰 승인/거부 스키마
export const ReviewApprovalSchema = Type.Object({
  action: Type.Union([
    Type.Literal('approve'),
    Type.Literal('reject')
  ], {
    description: '승인 액션'
  }),
  reason: Type.Optional(Type.String({
    maxLength: 500,
    description: '거부 이유 (거부 시 필수)'
  })),
  adminNote: Type.Optional(Type.String({
    maxLength: 1000,
    description: '관리자 메모'
  }))
});

// 관리자 리뷰 목록 조회 쿼리 스키마
export const AdminReviewListQuerySchema = Type.Object({
  page: Type.Optional(Type.Integer({
    minimum: 1,
    default: 1,
    description: '페이지 번호'
  })),
  limit: Type.Optional(Type.Integer({
    minimum: 1,
    maximum: 100,
    default: 20,
    description: '페이지 크기'
  })),
  status: Type.Optional(Type.Union([
    Type.Literal('pending'),
    Type.Literal('approved'),
    Type.Literal('rejected'),
    Type.Literal('all')
  ], {
    default: 'pending',
    description: '승인 상태 필터'
  })),
  expertId: Type.Optional(Type.String({
    description: '전문가 ID로 필터링'
  })),
  customerId: Type.Optional(Type.String({
    description: '고객 ID로 필터링'
  })),
  rating: Type.Optional(Type.Integer({
    minimum: 1,
    maximum: 5,
    description: '평점으로 필터링'
  })),
  reportCount: Type.Optional(Type.Integer({
    minimum: 1,
    description: '신고 수가 이 값 이상인 리뷰만'
  })),
  sortBy: Type.Optional(Type.Union([
    Type.Literal('createdAt'),
    Type.Literal('updatedAt'),
    Type.Literal('rating'),
    Type.Literal('helpfulCount'),
    Type.Literal('reportCount')
  ], {
    default: 'createdAt',
    description: '정렬 기준'
  })),
  sortOrder: Type.Optional(Type.Union([
    Type.Literal('asc'),
    Type.Literal('desc')
  ], {
    default: 'desc',
    description: '정렬 순서'
  })),
  search: Type.Optional(Type.String({
    minLength: 1,
    description: '제목 또는 내용 검색'
  })),
  dateFrom: Type.Optional(Type.String({
    format: 'date',
    description: '시작 날짜 (YYYY-MM-DD)'
  })),
  dateTo: Type.Optional(Type.String({
    format: 'date',
    description: '종료 날짜 (YYYY-MM-DD)'
  }))
});

// 관리자 리뷰 응답 스키마 (일반 리뷰 스키마에 관리자 정보 추가)
export const AdminReviewResponseSchema = Type.Object({
  id: Type.String(),
  orderId: Type.String(),
  customerId: Type.String(),
  expertId: Type.String(),
  rating: Type.Integer(),
  title: Type.Union([Type.String(), Type.Null()]),
  content: Type.String(),
  images: Type.Array(Type.String()),
  isVerified: Type.Boolean(),
  isApproved: Type.Boolean(),
  approvedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  rejectedAt: Type.Union([Type.String({ format: 'date-time' }), Type.Null()]),
  rejectionReason: Type.Union([Type.String(), Type.Null()]),
  adminNote: Type.Union([Type.String(), Type.Null()]),
  helpfulCount: Type.Integer(),
  reportCount: Type.Integer(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  customer: Type.Object({
    id: Type.String(),
    user: Type.Object({
      name: Type.String(),
      email: Type.String(),
      phone: Type.String(),
      avatarUrl: Type.Union([Type.String(), Type.Null()])
    })
  }),
  expert: Type.Object({
    id: Type.String(),
    businessName: Type.String(),
    rating: Type.Union([Type.Number(), Type.Null()]),
    user: Type.Object({
      name: Type.String(),
      email: Type.String(),
      phone: Type.String(),
      avatarUrl: Type.Union([Type.String(), Type.Null()])
    })
  }),
  order: Type.Object({
    id: Type.String(),
    orderNumber: Type.String(),
    status: Type.String(),
    totalAmount: Type.Number(),
    serviceItem: Type.Object({
      name: Type.String(),
      category: Type.Object({
        name: Type.String()
      })
    })
  }),
  reports: Type.Optional(Type.Array(Type.Object({
    id: Type.String(),
    reason: Type.String(),
    description: Type.Union([Type.String(), Type.Null()]),
    status: Type.String(),
    createdAt: Type.String({ format: 'date-time' }),
    reporter: Type.Object({
      name: Type.String(),
      email: Type.String()
    })
  })))
});

// 관리자 리뷰 목록 응답 스키마
export const AdminReviewListResponseSchema = Type.Object({
  reviews: Type.Array(AdminReviewResponseSchema),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean()
  }),
  statistics: Type.Object({
    pending: Type.Integer(),
    approved: Type.Integer(),
    rejected: Type.Integer(),
    totalReports: Type.Integer(),
    averageRating: Type.Union([Type.Number(), Type.Null()]),
    reportedReviews: Type.Integer()
  })
});

// 일괄 승인/거부 스키마
export const BulkActionSchema = Type.Object({
  reviewIds: Type.Array(Type.String(), {
    minItems: 1,
    maxItems: 50,
    description: '처리할 리뷰 ID 목록'
  }),
  action: Type.Union([
    Type.Literal('approve'),
    Type.Literal('reject')
  ], {
    description: '일괄 처리 액션'
  }),
  reason: Type.Optional(Type.String({
    maxLength: 500,
    description: '거부 이유 (거부 시 필수)'
  })),
  adminNote: Type.Optional(Type.String({
    maxLength: 1000,
    description: '관리자 메모'
  }))
});

// 일괄 처리 결과 스키마
export const BulkActionResultSchema = Type.Object({
  totalRequested: Type.Integer(),
  successful: Type.Integer(),
  failed: Type.Integer(),
  results: Type.Array(Type.Object({
    reviewId: Type.String(),
    success: Type.Boolean(),
    error: Type.Optional(Type.String())
  }))
});

// 파라미터 스키마
export const AdminReviewParamsSchema = Type.Object({
  reviewId: Type.String({
    minLength: 1,
    description: '리뷰 ID'
  })
});

// 에러 응답 스키마
export const ErrorResponseSchema = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Integer(),
  details: Type.Optional(Type.Any())
});