import { Type } from '@sinclair/typebox';

// 리뷰 생성 스키마
export const CreateReviewSchema = Type.Object({
  orderId: Type.String({
    minLength: 1,
    description: '주문 ID'
  }),
  rating: Type.Integer({
    minimum: 1,
    maximum: 5,
    description: '평점 (1-5)'
  }),
  title: Type.Optional(Type.String({
    maxLength: 100,
    description: '리뷰 제목'
  })),
  content: Type.String({
    minLength: 1,
    maxLength: 2000,
    description: '리뷰 내용'
  }),
  images: Type.Optional(Type.Array(Type.String({
    format: 'uri',
    description: '이미지 URL'
  }), {
    maxItems: 10,
    description: '리뷰 이미지들'
  }))
});

// 리뷰 수정 스키마
export const UpdateReviewSchema = Type.Object({
  rating: Type.Optional(Type.Integer({
    minimum: 1,
    maximum: 5,
    description: '평점 (1-5)'
  })),
  title: Type.Optional(Type.Union([
    Type.String({ maxLength: 100 }),
    Type.Null()
  ], {
    description: '리뷰 제목'
  })),
  content: Type.Optional(Type.String({
    minLength: 1,
    maxLength: 2000,
    description: '리뷰 내용'
  })),
  images: Type.Optional(Type.Array(Type.String({
    format: 'uri',
    description: '이미지 URL'
  }), {
    maxItems: 10,
    description: '리뷰 이미지들'
  }))
});

// 리뷰 목록 조회 쿼리 스키마
export const ReviewListQuerySchema = Type.Object({
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
  minRating: Type.Optional(Type.Integer({
    minimum: 1,
    maximum: 5,
    description: '최소 평점'
  })),
  maxRating: Type.Optional(Type.Integer({
    minimum: 1,
    maximum: 5,
    description: '최대 평점'
  })),
  isApproved: Type.Optional(Type.Boolean({
    description: '승인된 리뷰만 조회'
  })),
  sortBy: Type.Optional(Type.Union([
    Type.Literal('createdAt'),
    Type.Literal('rating'),
    Type.Literal('helpfulCount')
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
  }))
});

// 리뷰 응답 스키마
export const ReviewResponseSchema = Type.Object({
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
  helpfulCount: Type.Integer(),
  createdAt: Type.String({ format: 'date-time' }),
  updatedAt: Type.String({ format: 'date-time' }),
  customer: Type.Optional(Type.Object({
    id: Type.String(),
    user: Type.Object({
      name: Type.String(),
      avatarUrl: Type.Union([Type.String(), Type.Null()])
    })
  })),
  expert: Type.Optional(Type.Object({
    id: Type.String(),
    businessName: Type.String(),
    rating: Type.Union([Type.Number(), Type.Null()]),
    user: Type.Object({
      name: Type.String(),
      avatarUrl: Type.Union([Type.String(), Type.Null()])
    })
  })),
  order: Type.Optional(Type.Object({
    id: Type.String(),
    orderNumber: Type.String(),
    serviceItem: Type.Object({
      name: Type.String(),
      category: Type.Object({
        name: Type.String()
      })
    })
  })),
  isHelpfulByCurrentUser: Type.Optional(Type.Boolean())
});

// 리뷰 목록 응답 스키마
export const ReviewListResponseSchema = Type.Object({
  reviews: Type.Array(ReviewResponseSchema),
  pagination: Type.Object({
    page: Type.Integer(),
    limit: Type.Integer(),
    total: Type.Integer(),
    totalPages: Type.Integer(),
    hasNext: Type.Boolean(),
    hasPrev: Type.Boolean()
  }),
  statistics: Type.Optional(Type.Object({
    averageRating: Type.Union([Type.Number(), Type.Null()]),
    totalReviews: Type.Integer(),
    ratingDistribution: Type.Object({
      1: Type.Integer(),
      2: Type.Integer(),
      3: Type.Integer(),
      4: Type.Integer(),
      5: Type.Integer()
    })
  }))
});

// 도움됨 표시 응답 스키마
export const HelpfulResponseSchema = Type.Object({
  reviewId: Type.String(),
  helpfulCount: Type.Integer(),
  isHelpful: Type.Boolean()
});

// 파라미터 스키마
export const ReviewParamsSchema = Type.Object({
  reviewId: Type.String({
    minLength: 1,
    description: '리뷰 ID'
  })
});

// 리뷰 신고 스키마
export const ReportReviewSchema = Type.Object({
  reason: Type.Union([
    Type.Literal('INAPPROPRIATE_CONTENT'),
    Type.Literal('SPAM'),
    Type.Literal('FALSE_INFORMATION'),
    Type.Literal('HARASSMENT'),
    Type.Literal('COPYRIGHT_VIOLATION'),
    Type.Literal('OTHER')
  ], {
    description: '신고 사유'
  }),
  description: Type.Optional(Type.String({
    maxLength: 500,
    description: '신고 상세 설명'
  }))
});

// 신고 응답 스키마
export const ReportResponseSchema = Type.Object({
  success: Type.Boolean(),
  message: Type.String(),
  reportId: Type.String()
});

// 에러 응답 스키마
export const ErrorResponseSchema = Type.Object({
  error: Type.String(),
  message: Type.String(),
  statusCode: Type.Integer(),
  details: Type.Optional(Type.Any())
});