import { PrismaClient, UploadedFile } from '@prisma/client';
import { randomUUID } from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { AppError } from '../types/errors.js';

export interface UploadFileOptions {
  userId: string;
  file: {
    data: Buffer;
    filename: string;
    mimetype: string;
    size: number;
  };
  metadata?: Record<string, any>;
  folder?: string;
}

export interface UploadedFileInfo {
  id: string;
  userId: string;
  originalName: string;
  storagePath: string;
  mimeType: string;
  size: number;
  metadata: Record<string, any> | null;
  createdAt: Date;
  url: string;
}

export class UploadService {
  private prisma: PrismaClient;
  private uploadDir: string;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    // 환경 변수에서 업로드 디렉토리 설정, 기본값은 './uploads'
    this.uploadDir = process.env.UPLOAD_DIR || './uploads';
  }

  /**
   * 파일 업로드 및 데이터베이스 기록 생성
   */
  async uploadFile(options: UploadFileOptions): Promise<UploadedFileInfo> {
    const { userId, file, metadata = {}, folder } = options;
    
    // 사용자 존재 확인
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    
    if (!user) {
      throw new AppError('USER_001', 'User not found', 404);
    }

    // 파일명 안전 처리 및 고유 ID 생성
    const fileExt = path.extname(file.filename) || '';
    const baseName = path.basename(file.filename, fileExt);
    const safeBaseName = baseName.replace(/[^a-zA-Z0-9가-힣_\-]/g, '_');
    const uniqueId = randomUUID();
    const storedFileName = `${uniqueId}${fileExt}`;
    
    // 저장 경로 생성 (연/월/일 구조)
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const datePath = path.join(year, month, day);
    const relativePath = folder ? path.join(folder, datePath, storedFileName) : path.join(datePath, storedFileName);
    const fullPath = path.join(this.uploadDir, relativePath);
    
    // 업로드 디렉토리 생성
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    
    // 파일 저장
    await fs.writeFile(fullPath, file.data);
    
    // 데이터베이스 기록 생성
    const uploadedFile = await this.prisma.uploadedFile.create({
      data: {
        userId,
        originalName: file.filename,
        storagePath: relativePath,
        mimeType: file.mimetype,
        size: file.size,
        metadata,
      },
    });
    
    // 접근 URL 생성 (개발 환경에서는 로컬 경로)
    const baseUrl = process.env.FILE_BASE_URL || 'http://localhost:4000/uploads';
    const url = `${baseUrl}/${relativePath}`;
    
    return {
      id: uploadedFile.id,
      userId: uploadedFile.userId,
      originalName: uploadedFile.originalName,
      storagePath: uploadedFile.storagePath,
      mimeType: uploadedFile.mimeType,
      size: uploadedFile.size,
      metadata: uploadedFile.metadata as Record<string, any> | null,
      createdAt: uploadedFile.createdAt,
      url,
    };
  }

  /**
   * 파일 정보 조회
   */
  async getFileById(fileId: string): Promise<UploadedFileInfo> {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });
    
    if (!file) {
      throw new AppError('UPLOAD_001', 'File not found', 404);
    }
    
    const baseUrl = process.env.FILE_BASE_URL || 'http://localhost:4000/uploads';
    const url = `${baseUrl}/${file.storagePath}`;
    
    return {
      id: file.id,
      userId: file.userId,
      originalName: file.originalName,
      storagePath: file.storagePath,
      mimeType: file.mimeType,
      size: file.size,
      metadata: file.metadata as Record<string, any> | null,
      createdAt: file.createdAt,
      url,
    };
  }

  /**
   * 사용자의 파일 목록 조회
   */
  async listUserFiles(userId: string, options?: { skip?: number; take?: number }) {
    const skip = options?.skip || 0;
    const take = options?.take || 50;
    
    const [files, total] = await Promise.all([
      this.prisma.uploadedFile.findMany({
        where: { userId },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.uploadedFile.count({
        where: { userId },
      }),
    ]);
    
    const baseUrl = process.env.FILE_BASE_URL || 'http://localhost:4000/uploads';
    
    const items = files.map((file: UploadedFile) => ({
      id: file.id,
      userId: file.userId,
      originalName: file.originalName,
      storagePath: file.storagePath,
      mimeType: file.mimeType,
      size: file.size,
      metadata: file.metadata as Record<string, any> | null,
      createdAt: file.createdAt,
      url: `${baseUrl}/${file.storagePath}`,
    }));
    
    return {
      items,
      total,
      skip,
      take,
      hasMore: skip + take < total,
    };
  }

  /**
   * 파일 삭제
   */
  async deleteFile(fileId: string): Promise<void> {
    const file = await this.prisma.uploadedFile.findUnique({
      where: { id: fileId },
    });
    
    if (!file) {
      throw new AppError('UPLOAD_001', 'File not found', 404);
    }
    
    // 파일 시스템에서 삭제
    const fullPath = path.join(this.uploadDir, file.storagePath);
    try {
      await fs.unlink(fullPath);
    } catch (error) {
      // 파일이 존재하지 않으면 무시
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
    
    // 데이터베이스에서 삭제
    await this.prisma.uploadedFile.delete({
      where: { id: fileId },
    });
  }

  /**
   * 파일 다운로드를 위한 실제 파일 경로 반환
   */
  async getFileStream(fileId: string): Promise<{ stream: fs.FileHandle; fileInfo: UploadedFileInfo }> {
    const fileInfo = await this.getFileById(fileId);
    const fullPath = path.join(this.uploadDir, fileInfo.storagePath);
    
    try {
      const fileHandle = await fs.open(fullPath, 'r');
      return { stream: fileHandle, fileInfo };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        throw new AppError('UPLOAD_002', 'File not found on disk', 404);
      }
      throw error;
    }
  }
}