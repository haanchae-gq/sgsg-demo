import { FastifyInstance } from 'fastify';
import * as handler from './handler.js';
import * as schema from './schema.js';

export default async function uploadRoutes(fastify: FastifyInstance) {
  // 파일 업로드 (multipart/form-data)
  fastify.post('/upload', {
    config: {
      // multipart 설정
      bodyLimit: 10 * 1024 * 1024, // 10MB
    },
    // Note: schema validation is handled manually in handler for multipart
    preHandler: [fastify.authenticate],
    handler: handler.uploadFileHandler,
  });

  // 파일 목록 조회
  fastify.get('/files', {
    schema: {
      querystring: schema.ListFilesQuerySchema,
      response: {
        200: schema.ListFilesResponseSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: handler.listFilesHandler,
  });

  // 파일 정보 조회
  fastify.get('/files/:fileId', {
    schema: {
      params: schema.GetFileParamsSchema,
      response: {
        200: schema.UploadedFileResponseSchema,
      },
    },
    preHandler: [fastify.authenticate],
    handler: handler.getFileHandler,
  });

  // 파일 다운로드
  fastify.get('/files/:fileId/download', {
    schema: {
      params: schema.GetFileParamsSchema,
    },
    preHandler: [fastify.authenticate],
    handler: handler.downloadFileHandler,
  });

  // 파일 삭제
  fastify.delete('/files/:fileId', {
    schema: {
      params: schema.DeleteFileParamsSchema,
    },
    preHandler: [fastify.authenticate],
    handler: handler.deleteFileHandler,
  });

  // 리뷰 이미지 업로드 (단일)
  fastify.post('/review-image', {
    config: {
      bodyLimit: 5 * 1024 * 1024, // 5MB
    },
    schema: {
      tags: ['Upload', 'Reviews'],
      summary: '리뷰 이미지 업로드 (단일)',
      description: '리뷰용 이미지를 업로드합니다. JPEG, PNG, GIF, WebP 형식 지원, 최대 5MB',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: schema.ReviewImageResponseSchema,
            message: { type: 'string' }
          }
        },
        400: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        },
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        }
      }
    },
    preHandler: [fastify.authenticate],
    handler: handler.uploadReviewImageHandler,
  });

  // 리뷰 이미지 다중 업로드
  fastify.post('/review-images', {
    config: {
      bodyLimit: 50 * 1024 * 1024, // 50MB (10개 * 5MB)
    },
    schema: {
      tags: ['Upload', 'Reviews'],
      summary: '리뷰 이미지 다중 업로드',
      description: '리뷰용 이미지를 여러 개 동시에 업로드합니다. 최대 10개까지, 각각 최대 5MB',
      security: [{ bearerAuth: [] }],
      consumes: ['multipart/form-data'],
      response: {
        201: schema.MultipleImageUploadResponseSchema,
        400: schema.MultipleImageUploadResponseSchema,
        401: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        },
        500: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            error: { type: 'string' },
            statusCode: { type: 'integer' }
          }
        }
      }
    },
    preHandler: [fastify.authenticate],
    handler: handler.uploadMultipleReviewImagesHandler,
  });
}