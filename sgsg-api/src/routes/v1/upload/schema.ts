import { Static, Type } from '@sinclair/typebox';

export const UploadFileRequestSchema = Type.Object({
  // Note: File field is handled by multipart, not in JSON body
  // Additional metadata can be sent as JSON field
  metadata: Type.Optional(Type.String({ description: 'JSON string of metadata' })),
}, { additionalProperties: true });

export type UploadFileRequest = Static<typeof UploadFileRequestSchema>;

export const GetFileParamsSchema = Type.Object({
  fileId: Type.String(),
});

export type GetFileParams = Static<typeof GetFileParamsSchema>;

export const DeleteFileParamsSchema = Type.Object({
  fileId: Type.String(),
});

export type DeleteFileParams = Static<typeof DeleteFileParamsSchema>;

export const ListFilesQuerySchema = Type.Object({
  skip: Type.Optional(Type.Integer({ minimum: 0, default: 0 })),
  take: Type.Optional(Type.Integer({ minimum: 1, maximum: 100, default: 50 })),
});

export type ListFilesQuery = Static<typeof ListFilesQuerySchema>;

export const UploadedFileResponseSchema = Type.Object({
  id: Type.String(),
  userId: Type.String(),
  originalName: Type.String(),
  storagePath: Type.String(),
  mimeType: Type.String(),
  size: Type.Integer(),
  metadata: Type.Optional(Type.Any()),
  createdAt: Type.String({ format: 'date-time' }),
  url: Type.String(),
});

export type UploadedFileResponse = Static<typeof UploadedFileResponseSchema>;

export const ListFilesResponseSchema = Type.Object({
  items: Type.Array(UploadedFileResponseSchema),
  total: Type.Integer(),
  skip: Type.Integer(),
  take: Type.Integer(),
  hasMore: Type.Boolean(),
});

export type ListFilesResponse = Static<typeof ListFilesResponseSchema>;

// 리뷰 이미지 업로드 전용 스키마
export const ReviewImageUploadRequestSchema = Type.Object({
  // Note: File field is handled by multipart, not in JSON body
  caption: Type.Optional(Type.String({ 
    maxLength: 200,
    description: '이미지 설명 (선택사항)' 
  })),
  category: Type.Optional(Type.Union([
    Type.Literal('before'),
    Type.Literal('after'),
    Type.Literal('process'),
    Type.Literal('result'),
    Type.Literal('other')
  ], {
    description: '이미지 카테고리'
  }))
}, { additionalProperties: true });

export type ReviewImageUploadRequest = Static<typeof ReviewImageUploadRequestSchema>;

export const ReviewImageResponseSchema = Type.Object({
  id: Type.String(),
  url: Type.String(),
  originalName: Type.String(),
  mimeType: Type.String(),
  size: Type.Integer(),
  caption: Type.Optional(Type.String()),
  category: Type.Optional(Type.String()),
  uploadedAt: Type.String({ format: 'date-time' })
});

export type ReviewImageResponse = Static<typeof ReviewImageResponseSchema>;

// 다중 이미지 업로드 응답
export const MultipleImageUploadResponseSchema = Type.Object({
  success: Type.Boolean(),
  data: Type.Object({
    uploaded: Type.Array(ReviewImageResponseSchema),
    failed: Type.Array(Type.Object({
      filename: Type.String(),
      error: Type.String()
    }))
  }),
  message: Type.String()
});

export type MultipleImageUploadResponse = Static<typeof MultipleImageUploadResponseSchema>;