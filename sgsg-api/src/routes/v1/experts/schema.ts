import { Type } from '@sinclair/typebox'
import {
  ExpertSchema,
  SubAccountSchema,
  MasterMembershipSchema,
  PenaltyHistorySchema,
  AssignmentHistorySchema,
  ExpertProfileUpdateRequestSchema,
  SubAccountCreateRequestSchema,
  SubAccountUpdateRequestSchema,
  SuccessResponseSchema,
  ErrorResponseSchema,
  PaginationQuerySchema
} from '../../../types/schemas'

// 전문가 프로필 조회 응답 스키마
const ExpertProfileResponseSchema = SuccessResponseSchema(ExpertSchema)

// 서브 계정 목록 조회 응답 스키마
const SubAccountsResponseSchema = SuccessResponseSchema(Type.Object({
  data: Type.Array(SubAccountSchema),
  pagination: Type.Object({
    page: Type.Integer({ minimum: 1 }),
    limit: Type.Integer({ minimum: 1 }),
    total: Type.Integer({ minimum: 0 }),
    totalPages: Type.Integer({ minimum: 0 })
  })
}))

// 멤버십 정보 조회 응답 스키마
const MembershipInfoResponseSchema = SuccessResponseSchema(
  Type.Object({
    membershipEnabled: Type.Boolean(),
    membershipSlotCount: Type.Integer({ minimum: 0 }),
    serviceCategoryMidAvailableList: Type.Array(Type.String()),
    usedSlots: Type.Integer({ minimum: 0 }),
    availableSlots: Type.Integer({ minimum: 0 }),
    masterMemberships: Type.Array(MasterMembershipSchema)
  })
)

// 배정 이력 조회 응답 스키마 (페이지네이션 포함)
const AssignmentHistoryResponseSchema = SuccessResponseSchema(
  Type.Object({
    histories: Type.Array(AssignmentHistorySchema),
    pagination: Type.Object({
      page: Type.Integer({ minimum: 1 }),
      limit: Type.Integer({ minimum: 1, maximum: 100 }),
      total: Type.Integer({ minimum: 0 }),
      totalPages: Type.Integer({ minimum: 0 })
    })
  })
)

// 패널티 이력 조회 응답 스키마
const PenaltyHistoryResponseSchema = SuccessResponseSchema(Type.Object({
  penalties: Type.Array(PenaltyHistorySchema),
  activePenaltiesCount: Type.Integer({ minimum: 0 }),
  pagination: Type.Object({
    page: Type.Integer({ minimum: 1 }),
    limit: Type.Integer({ minimum: 1 }),
    total: Type.Integer({ minimum: 0 }),
    totalPages: Type.Integer({ minimum: 0 })
  })
}))

// 전문가 프로필 조회 스키마
export const GetExpertProfileSchema = {
  response: {
    200: ExpertProfileResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 전문가 프로필 업데이트 스키마
export const UpdateExpertProfileSchema = {
  body: ExpertProfileUpdateRequestSchema,
  response: {
    200: ExpertProfileResponseSchema,
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서브 계정 목록 조회 스키마
export const GetSubAccountsSchema = {
  querystring: Type.Object({
    page: Type.Optional(Type.Integer({ minimum: 1 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    status: Type.Optional(Type.String())
  }),
  response: {
    200: SubAccountsResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서브 계정 생성 스키마
export const CreateSubAccountSchema = {
  body: SubAccountCreateRequestSchema,
  response: {
    201: SuccessResponseSchema(SubAccountSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    409: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서브 계정 업데이트 스키마
export const UpdateSubAccountSchema = {
  params: Type.Object({
    subAccountId: Type.String()
  }),
  body: SubAccountUpdateRequestSchema,
  response: {
    200: SuccessResponseSchema(SubAccountSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    403: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 멤버십 정보 조회 스키마
export const GetMembershipInfoSchema = {
  response: {
    200: MembershipInfoResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 배정 이력 조회 스키마
export const GetAssignmentHistorySchema = {
  querystring: Type.Object({
    page: Type.Optional(Type.Integer({ minimum: 1 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    startDate: Type.Optional(Type.String()),
    endDate: Type.Optional(Type.String()),
    assignmentType: Type.Optional(Type.String()),
    status: Type.Optional(Type.String())
  }),
  response: {
    200: AssignmentHistoryResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 패널티 이력 조회 스키마
export const GetPenaltyHistorySchema = {
  querystring: Type.Object({
    page: Type.Optional(Type.Integer({ minimum: 1 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    status: Type.Optional(Type.String()),
    penaltyType: Type.Optional(Type.String())
  }),
  response: {
    200: PenaltyHistoryResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서비스 매핑 관련 스키마
const ServiceMappingSchema = Type.Object({
  id: Type.String(),
  expertId: Type.String(),
  serviceItemId: Type.String(),
  customPrice: Type.Optional(Type.Number()),
  isAvailable: Type.Boolean(),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  serviceItem: Type.Object({
    id: Type.String(),
    name: Type.String(),
    description: Type.Optional(Type.String()),
    basePrice: Type.Number(),
    category: Type.Object({
      id: Type.String(),
      name: Type.String(),
      slug: Type.String()
    })
  })
})

const CreateServiceMappingRequestSchema = Type.Object({
  serviceItemId: Type.String(),
  customPrice: Type.Optional(Type.Number()),
  isAvailable: Type.Optional(Type.Boolean())
})

const UpdateServiceMappingRequestSchema = Type.Object({
  customPrice: Type.Optional(Type.Number()),
  isAvailable: Type.Optional(Type.Boolean())
})

// 서비스 매핑 목록 조회
export const GetServiceMappingsSchema = {
  querystring: PaginationQuerySchema,
  response: {
    200: SuccessResponseSchema(Type.Object({
      data: Type.Array(ServiceMappingSchema),
      pagination: Type.Object({
        page: Type.Integer({ minimum: 1 }),
        limit: Type.Integer({ minimum: 1 }),
        total: Type.Integer({ minimum: 0 }),
        totalPages: Type.Integer({ minimum: 0 })
      })
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서비스 매핑 생성
export const CreateServiceMappingSchema = {
  body: CreateServiceMappingRequestSchema,
  response: {
    201: SuccessResponseSchema(ServiceMappingSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    409: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서비스 매핑 수정
export const UpdateServiceMappingSchema = {
  params: Type.Object({
    mappingId: Type.String()
  }),
  body: UpdateServiceMappingRequestSchema,
  response: {
    200: SuccessResponseSchema(ServiceMappingSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 서비스 매핑 삭제
export const DeleteServiceMappingSchema = {
  params: Type.Object({
    mappingId: Type.String()
  }),
  response: {
    200: SuccessResponseSchema(Type.Object({
      message: Type.String()
    })),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 주문 목록 조회
const OrderSchema = Type.Object({
  id: Type.String(),
  orderNumber: Type.String(),
  customerId: Type.String(),
  serviceItemId: Type.String(),
  status: Type.String(),
  paymentStatus: Type.String(),
  requestedDate: Type.String(),
  confirmedDate: Type.Optional(Type.String()),
  basePrice: Type.Number(),
  totalAmount: Type.Number(),
  customer: Type.Object({
    user: Type.Object({
      name: Type.String(),
      phone: Type.String()
    })
  }),
  serviceItem: Type.Object({
    name: Type.String(),
    category: Type.Object({
      name: Type.String()
    })
  }),
  address: Type.Object({
    addressLine1: Type.String(),
    city: Type.String(),
    state: Type.String()
  })
})

export const GetExpertOrdersSchema = {
  querystring: Type.Intersect([
    PaginationQuerySchema,
    Type.Object({
      status: Type.Optional(Type.String()),
      dateFrom: Type.Optional(Type.String()),
      dateTo: Type.Optional(Type.String())
    })
  ]),
  response: {
    200: SuccessResponseSchema(Type.Object({
      data: Type.Array(OrderSchema),
      pagination: Type.Object({
        page: Type.Integer({ minimum: 1 }),
        limit: Type.Integer({ minimum: 1 }),
        total: Type.Integer({ minimum: 0 }),
        totalPages: Type.Integer({ minimum: 0 })
      })
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 정산 내역 조회
const SettlementSchema = Type.Object({
  id: Type.String(),
  settlementNumber: Type.String(),
  periodStart: Type.String(),
  periodEnd: Type.String(),
  totalOrders: Type.Integer(),
  totalRevenue: Type.Number(),
  platformFee: Type.Number(),
  paymentFee: Type.Number(),
  netAmount: Type.Number(),
  status: Type.String(),
  paidAt: Type.Optional(Type.String()),
  createdAt: Type.String()
})

export const GetSettlementsSchema = {
  querystring: Type.Intersect([
    PaginationQuerySchema,
    Type.Object({
      year: Type.Optional(Type.Integer()),
      month: Type.Optional(Type.Integer()),
      status: Type.Optional(Type.String())
    })
  ]),
  response: {
    200: SuccessResponseSchema(Type.Object({
      data: Type.Array(SettlementSchema),
      pagination: Type.Object({
        page: Type.Integer({ minimum: 1 }),
        limit: Type.Integer({ minimum: 1 }),
        total: Type.Integer({ minimum: 0 }),
        totalPages: Type.Integer({ minimum: 0 })
      })
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 스케줄 관련 스키마
const ScheduleSchema = Type.Object({
  id: Type.String(),
  orderId: Type.String(),
  expertId: Type.String(),
  scheduledDate: Type.String(),
  startTime: Type.String(),
  endTime: Type.String(),
  status: Type.String(),
  notes: Type.Optional(Type.String()),
  createdAt: Type.String(),
  updatedAt: Type.String(),
  order: Type.Object({
    id: Type.String(),
    orderNumber: Type.String(),
    customer: Type.Object({
      user: Type.Object({
        name: Type.String()
      })
    }),
    serviceItem: Type.Object({
      name: Type.String()
    }),
    address: Type.Object({
      addressLine1: Type.String()
    })
  })
})

const CreateScheduleRequestSchema = Type.Object({
  orderId: Type.String(),
  scheduledDate: Type.String(),
  startTime: Type.String(),
  endTime: Type.String(),
  notes: Type.Optional(Type.String())
})

const UpdateScheduleRequestSchema = Type.Object({
  scheduledDate: Type.Optional(Type.String()),
  startTime: Type.Optional(Type.String()),
  endTime: Type.Optional(Type.String()),
  status: Type.Optional(Type.String()),
  notes: Type.Optional(Type.String())
})

export const GetScheduleSchema = {
  querystring: Type.Object({
    page: Type.Optional(Type.Integer({ minimum: 1 })),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 100 })),
    date: Type.Optional(Type.String()),
    status: Type.Optional(Type.String())
  }),
  response: {
    200: SuccessResponseSchema(Type.Object({
      data: Type.Array(ScheduleSchema),
      pagination: Type.Object({
        page: Type.Integer({ minimum: 1 }),
        limit: Type.Integer({ minimum: 1 }),
        total: Type.Integer({ minimum: 0 }),
        totalPages: Type.Integer({ minimum: 0 })
      })
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

export const CreateScheduleSchema = {
  body: CreateScheduleRequestSchema,
  response: {
    201: SuccessResponseSchema(ScheduleSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

export const UpdateScheduleSchema = {
  params: Type.Object({
    scheduleId: Type.String()
  }),
  body: UpdateScheduleRequestSchema,
  response: {
    200: SuccessResponseSchema(ScheduleSchema),
    400: ErrorResponseSchema,
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

export const DeleteScheduleSchema = {
  params: Type.Object({
    scheduleId: Type.String()
  }),
  response: {
    200: SuccessResponseSchema(Type.Object({
      message: Type.String()
    })),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 통계 정보 스키마
export const GetStatisticsSchema = {
  response: {
    200: SuccessResponseSchema(Type.Object({
      totalOrders: Type.Integer(),
      completedOrders: Type.Integer(),
      totalEarnings: Type.Number(),
      averageRating: Type.Number(),
      totalReviews: Type.Integer(),
      thisMonthOrders: Type.Integer(),
      thisMonthEarnings: Type.Number(),
      pendingOrders: Type.Integer()
    })),
    401: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}

// 일일 배정 상한 조회 스키마
export const GetDailyAssignmentLimitSchema = {
  response: {
    200: SuccessResponseSchema(Type.Object({
      dailyAssignmentLimit: Type.Integer({ minimum: 0 }),
      todayAssignmentCount: Type.Integer({ minimum: 0 }),
      remainingLimit: Type.Integer({ minimum: 0 }),
      isLimitReached: Type.Boolean(),
      policy: Type.Optional(Type.Object({
        id: Type.String(),
        effectiveFrom: Type.String(),
        effectiveTo: Type.Optional(Type.String()),
        isActive: Type.Boolean()
      }))
    })),
    401: ErrorResponseSchema,
    404: ErrorResponseSchema,
    500: ErrorResponseSchema
  }
}