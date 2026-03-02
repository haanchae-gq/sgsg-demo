import api from '../services/api';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UploadResult {
  url: string;
  filename: string;
  size: number;
  type: string;
}

// 파일 크기 제한 (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// 허용된 파일 타입
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const ALLOWED_DOCUMENT_TYPES = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export const validateFile = (file: File, type: 'image' | 'document' = 'image'): string | null => {
  if (file.size > MAX_FILE_SIZE) {
    return '파일 크기는 5MB 이하여야 합니다';
  }

  const allowedTypes = type === 'image' ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  if (!allowedTypes.includes(file.type)) {
    return `지원하지 않는 파일 형식입니다. 허용 형식: ${allowedTypes.join(', ')}`;
  }

  return null;
};

export const compressImage = (file: File, maxWidth = 1024, quality = 0.8): Promise<File> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();

    img.onload = () => {
      // 비율 계산
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;

      // 이미지 그리기
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      // Blob으로 변환
      canvas.toBlob((blob) => {
        if (blob) {
          const compressedFile = new File([blob], file.name, {
            type: file.type,
            lastModified: Date.now()
          });
          resolve(compressedFile);
        } else {
          resolve(file);
        }
      }, file.type, quality);
    };

    img.src = URL.createObjectURL(file);
  });
};

export const uploadFile = async (
  file: File,
  onProgress?: (progress: UploadProgress) => void,
  compress = true
): Promise<UploadResult> => {
  try {
    // 파일 검증
    const validation = validateFile(file, file.type.startsWith('image/') ? 'image' : 'document');
    if (validation) {
      throw new Error(validation);
    }

    // 이미지 압축
    let finalFile = file;
    if (compress && file.type.startsWith('image/')) {
      finalFile = await compressImage(file);
    }

    // FormData 생성
    const formData = new FormData();
    formData.append('file', finalFile);
    formData.append('category', file.type.startsWith('image/') ? 'image' : 'document');

    // 업로드 요청
    const response = await api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress: UploadProgress = {
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100)
          };
          onProgress(progress);
        }
      }
    });

    return {
      url: response.data.data.url,
      filename: response.data.data.filename,
      size: finalFile.size,
      type: finalFile.type
    };
  } catch (error: any) {
    if (error.response?.data?.error?.message) {
      throw new Error(error.response.data.error.message);
    }
    throw new Error('파일 업로드에 실패했습니다');
  }
};

export const uploadMultipleFiles = async (
  files: File[],
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
): Promise<UploadResult[]> => {
  const results: UploadResult[] = [];
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadFile(
      files[i],
      onProgress ? (progress) => onProgress(i, progress) : undefined
    );
    results.push(result);
  }
  
  return results;
};

// 이미지 미리보기 URL 생성
export const createPreviewUrl = (file: File): string => {
  return URL.createObjectURL(file);
};

// 메모리 정리
export const revokePreviewUrl = (url: string): void => {
  URL.revokeObjectURL(url);
};

// 파일 크기 포맷팅
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};