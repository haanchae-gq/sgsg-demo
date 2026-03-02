import { FastifyInstance } from 'fastify';
import { UploadService, UploadFileOptions, UploadedFileInfo } from '../../../services/upload.service.js';
import { 
  UploadFileRequest, 
  GetFileParams, 
  DeleteFileParams, 
  ListFilesQuery,
  UploadedFileResponse,
  ListFilesResponse,
  ReviewImageUploadRequest,
  ReviewImageResponse
} from './schema.js';
import { AppError } from '../../../types/errors.js';

export async function uploadFileHandler(
  this: FastifyInstance,
  request: any,
  reply: any
) {
  try {
    const userId = request.user?.userId;
    if (!userId) {
      throw new AppError('AUTH_003', 'Unauthorized', 401);
    }

    // multipart/form-data 파싱
    const data = await request.file();
    if (!data) {
      throw new AppError('UPLOAD_003', 'No file uploaded', 400);
    }

    // 파일 크기 제한 (10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (data.file.bytesRead > maxSize) {
      throw new AppError('UPLOAD_004', 'File size too large (max 10MB)', 400);
    }

    // 파일 타입 제한 (이미지, PDF, 문서 등)
    const allowedMimeTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain'
    ];

    if (!allowedMimeTypes.includes(data.mimetype)) {
      throw new AppError('UPLOAD_005', 'Unsupported file type', 400);
    }

    // 메타데이터 파싱
    let metadata = {};
    if (data.fields.metadata) {
      try {
        metadata = JSON.parse(data.fields.metadata.value);
      } catch {
        // 메타데이터 파싱 실패 시 무시
      }
    }

    // 파일 데이터 읽기
    const buffer = await data.toBuffer();

    const uploadService = new UploadService(this.prisma);
    const fileInfo = await uploadService.uploadFile({
      userId,
      file: {
        data: buffer,
        filename: data.filename,
        mimetype: data.mimetype,
        size: data.file.bytesRead,
      },
      metadata,
    });

    const response: UploadedFileResponse = {
      id: fileInfo.id,
      userId: fileInfo.userId,
      originalName: fileInfo.originalName,
      storagePath: fileInfo.storagePath,
      mimeType: fileInfo.mimeType,
      size: fileInfo.size,
      metadata: fileInfo.metadata || undefined,
      createdAt: fileInfo.createdAt.toISOString(),
      url: fileInfo.url,
    };

    return reply.code(201).send(response);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    // 알 수 없는 에러
    throw new AppError('SERVER_001', 'Internal server error', 500);
  }
}

export async function getFileHandler(
  this: FastifyInstance,
  request: any,
  reply: any
) {
  try {
    const { fileId } = request.params as GetFileParams;
    const userId = request.user?.userId;

    const uploadService = new UploadService(this.prisma);
    const fileInfo = await uploadService.getFileById(fileId);

    // 권한 확인: 자신의 파일만 접근 가능 (어드민 예외 처리 필요)
    if (fileInfo.userId !== userId) {
      throw new AppError('AUTH_004', 'Forbidden', 403);
    }

    const response: UploadedFileResponse = {
      id: fileInfo.id,
      userId: fileInfo.userId,
      originalName: fileInfo.originalName,
      storagePath: fileInfo.storagePath,
      mimeType: fileInfo.mimeType,
      size: fileInfo.size,
      metadata: fileInfo.metadata || undefined,
      createdAt: fileInfo.createdAt.toISOString(),
      url: fileInfo.url,
    };

    return reply.send(response);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('SERVER_001', 'Internal server error', 500);
  }
}

export async function listFilesHandler(
  this: FastifyInstance,
  request: any,
  reply: any
) {
  try {
    const userId = request.user?.userId;
    if (!userId) {
      throw new AppError('AUTH_003', 'Unauthorized', 401);
    }

    const { skip = 0, take = 50 } = request.query as ListFilesQuery;

    const uploadService = new UploadService(this.prisma);
    const result = await uploadService.listUserFiles(userId, { skip, take });

    const response: ListFilesResponse = {
      items: result.items.map((file: UploadedFileInfo) => ({
        id: file.id,
        userId: file.userId,
        originalName: file.originalName,
        storagePath: file.storagePath,
        mimeType: file.mimeType,
        size: file.size,
        metadata: file.metadata || undefined,
        createdAt: file.createdAt.toISOString(),
        url: file.url,
      })),
      total: result.total,
      skip: result.skip,
      take: result.take,
      hasMore: result.hasMore,
    };

    return reply.send(response);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('SERVER_001', 'Internal server error', 500);
  }
}

export async function deleteFileHandler(
  this: FastifyInstance,
  request: any,
  reply: any
) {
  try {
    const { fileId } = request.params as DeleteFileParams;
    const userId = request.user?.userId;

    const uploadService = new UploadService(this.prisma);
    const fileInfo = await uploadService.getFileById(fileId);

    // 권한 확인: 자신의 파일만 삭제 가능
    if (fileInfo.userId !== userId) {
      throw new AppError('AUTH_004', 'Forbidden', 403);
    }

    await uploadService.deleteFile(fileId);

    return reply.code(204).send();
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('SERVER_001', 'Internal server error', 500);
  }
}

export async function downloadFileHandler(
  this: FastifyInstance,
  request: any,
  reply: any
) {
  try {
    const { fileId } = request.params as GetFileParams;
    const userId = request.user?.userId;

    const uploadService = new UploadService(this.prisma);
    const fileInfo = await uploadService.getFileById(fileId);

    // 권한 확인: 자신의 파일만 다운로드 가능
    if (fileInfo.userId !== userId) {
      throw new AppError('AUTH_004', 'Forbidden', 403);
    }

    const { stream, fileInfo: fileDetails } = await uploadService.getFileStream(fileId);

    reply.header('Content-Type', fileDetails.mimeType);
    reply.header('Content-Disposition', `attachment; filename="${encodeURIComponent(fileDetails.originalName)}"`);
    reply.header('Content-Length', fileDetails.size);

    // 파일 스트림 전송
    const nodeStream = stream.createReadStream();
    return reply.send(nodeStream);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('SERVER_001', 'Internal server error', 500);
  }
}

// 리뷰 이미지 업로드 핸들러 (단일 이미지)
export async function uploadReviewImageHandler(
  this: FastifyInstance,
  request: any,
  reply: any
) {
  try {
    const userId = request.user?.userId;
    if (!userId) {
      throw new AppError('AUTH_003', 'Unauthorized', 401);
    }

    // multipart/form-data 파싱
    const data = await request.file();
    if (!data) {
      throw new AppError('UPLOAD_003', 'No file uploaded', 400);
    }

    // 파일 크기 제한 (5MB - 리뷰 이미지는 더 작게)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (data.file.bytesRead > maxSize) {
      throw new AppError('UPLOAD_004', 'File size too large (max 5MB)', 400);
    }

    // 이미지 파일만 허용
    const allowedMimeTypes = [
      'image/jpeg', 
      'image/png', 
      'image/gif', 
      'image/webp'
    ];

    if (!allowedMimeTypes.includes(data.mimetype)) {
      throw new AppError('UPLOAD_005', 'Only image files are allowed', 400);
    }

    // 이미지 메타데이터 파싱
    let metadata: any = {};
    const fields = data.fields;
    
    if (fields.caption && typeof fields.caption === 'object' && 'value' in fields.caption) {
      metadata.caption = fields.caption.value;
    }
    if (fields.category && typeof fields.category === 'object' && 'value' in fields.category) {
      metadata.category = fields.category.value;
    }

    // 리뷰 이미지 전용 폴더에 저장
    const uploadService = new UploadService(this.prisma);
    // 파일 데이터 읽기
    const buffer = await data.toBuffer();
    const uploadOptions: UploadFileOptions = {
      userId,
      file: {
        data: buffer,
        filename: data.filename,
        mimetype: data.mimetype,
        size: data.file.bytesRead,
      },
      metadata: {
        ...metadata,
        uploadType: 'review_image',
        imageProcessed: false // 추후 이미지 리사이징/압축 플래그
      },
      folder: 'reviews' // reviews 폴더에 저장
    };

    const fileInfo = await uploadService.uploadFile(uploadOptions);

    const response: ReviewImageResponse = {
      id: fileInfo.id,
      url: fileInfo.url,
      originalName: fileInfo.originalName,
      mimeType: fileInfo.mimeType,
      size: fileInfo.size,
      caption: metadata.caption,
      category: metadata.category,
      uploadedAt: fileInfo.createdAt.toISOString()
    };

    return reply.code(201).send({
      success: true,
      data: response,
      message: '이미지가 성공적으로 업로드되었습니다.'
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('SERVER_001', 'Internal server error', 500);
  }
}

// 리뷰 이미지 다중 업로드 핸들러
export async function uploadMultipleReviewImagesHandler(
  this: FastifyInstance,
  request: any,
  reply: any
) {
  try {
    const userId = request.user?.userId;
    if (!userId) {
      throw new AppError('AUTH_003', 'Unauthorized', 401);
    }

    // 다중 파일 파싱
    const files = await request.files();
    const uploadedFiles: ReviewImageResponse[] = [];
    const failedFiles: Array<{ filename: string; error: string }> = [];

    // 최대 10개 파일 제한
    let fileCount = 0;
    for await (const file of files) {
      fileCount++;
      if (fileCount > 10) {
        failedFiles.push({
          filename: file.filename,
          error: 'Maximum 10 files allowed'
        });
        continue;
      }

      try {
        // 파일 크기 제한 (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.file.bytesRead > maxSize) {
          failedFiles.push({
            filename: file.filename,
            error: 'File size too large (max 5MB)'
          });
          continue;
        }

        // 이미지 파일만 허용
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedMimeTypes.includes(file.mimetype)) {
          failedFiles.push({
            filename: file.filename,
            error: 'Only image files are allowed'
          });
          continue;
        }

        // 메타데이터 파싱
        let metadata: any = {};
        if (file.fields.caption && typeof file.fields.caption === 'object' && 'value' in file.fields.caption) {
          metadata.caption = file.fields.caption.value;
        }
        if (file.fields.category && typeof file.fields.category === 'object' && 'value' in file.fields.category) {
          metadata.category = file.fields.category.value;
        }

        const uploadService = new UploadService(this.prisma);
        // 파일 데이터 읽기
        const buffer = await file.toBuffer();
        const uploadOptions: UploadFileOptions = {
          userId,
          file: {
            data: buffer,
            filename: file.filename,
            mimetype: file.mimetype,
            size: file.file.bytesRead,
          },
          metadata: {
            ...metadata,
            uploadType: 'review_image',
            imageProcessed: false
          },
          folder: 'reviews'
        };

        const fileInfo = await uploadService.uploadFile(uploadOptions);

        uploadedFiles.push({
          id: fileInfo.id,
          url: fileInfo.url,
          originalName: fileInfo.originalName,
          mimeType: fileInfo.mimeType,
          size: fileInfo.size,
          caption: metadata.caption,
          category: metadata.category,
          uploadedAt: fileInfo.createdAt.toISOString()
        });

      } catch (error) {
        failedFiles.push({
          filename: file.filename,
          error: error instanceof Error ? error.message : 'Upload failed'
        });
      }
    }

    const totalUploaded = uploadedFiles.length;
    const totalFailed = failedFiles.length;
    const totalFiles = totalUploaded + totalFailed;

    let message: string;
    if (totalFiles === 0) {
      message = '업로드할 파일이 없습니다.';
    } else if (totalFailed === 0) {
      message = `${totalUploaded}개 파일이 모두 성공적으로 업로드되었습니다.`;
    } else if (totalUploaded === 0) {
      message = `모든 파일 업로드에 실패했습니다.`;
    } else {
      message = `${totalUploaded}개 파일 업로드 성공, ${totalFailed}개 파일 실패`;
    }

    return reply.code(totalUploaded > 0 ? 201 : 400).send({
      success: totalUploaded > 0,
      data: {
        uploaded: uploadedFiles,
        failed: failedFiles
      },
      message
    });

  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError('SERVER_001', 'Internal server error', 500);
  }
}