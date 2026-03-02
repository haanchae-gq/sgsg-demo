import React, { useState, useRef } from 'react';
import { Button, ProgressBar, Toast } from 'antd-mobile';
import { CameraOutline, DeleteOutline } from 'antd-mobile-icons';
import { uploadFile, validateFile, createPreviewUrl, revokePreviewUrl, formatFileSize } from '../utils/fileUpload';
import './FileUploader.css';

interface FileUploaderProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  onUpload?: (urls: string[]) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
  category?: 'image' | 'document';
}

interface UploadingFile {
  id: string;
  file: File;
  previewUrl?: string;
  uploadProgress: number;
  uploadedUrl?: string;
  error?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  accept = 'image/*',
  multiple = false,
  maxFiles = 5,
  onUpload,
  onError,
  disabled = false,
  category = 'image'
}) => {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    if (files.length === 0) return;

    // 최대 파일 수 체크
    if (uploadingFiles.length + files.length > maxFiles) {
      onError?.(`최대 ${maxFiles}개까지 업로드할 수 있습니다`);
      return;
    }

    // 파일 검증 및 업로드 준비
    const newUploadingFiles: UploadingFile[] = files.map(file => {
      const id = `${Date.now()}-${Math.random()}`;
      const validation = validateFile(file, category);
      
      return {
        id,
        file,
        previewUrl: category === 'image' ? createPreviewUrl(file) : undefined,
        uploadProgress: validation ? -1 : 0,
        error: validation || undefined
      };
    });

    setUploadingFiles(prev => [...prev, ...newUploadingFiles]);

    // 검증 통과한 파일들 업로드 시작
    newUploadingFiles
      .filter(item => !item.error)
      .forEach(item => uploadSingleFile(item));

    // 입력 초기화
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadSingleFile = async (uploadingFile: UploadingFile) => {
    try {
      const result = await uploadFile(
        uploadingFile.file,
        (progress) => {
          setUploadingFiles(prev => 
            prev.map(item => 
              item.id === uploadingFile.id 
                ? { ...item, uploadProgress: progress.percentage }
                : item
            )
          );
        },
        category === 'image'
      );

      // 업로드 완료
      setUploadingFiles(prev => 
        prev.map(item => 
          item.id === uploadingFile.id 
            ? { ...item, uploadProgress: 100, uploadedUrl: result.url }
            : item
        )
      );

      // 성공 콜백 호출
      const currentUrls = uploadingFiles
        .map(item => item.uploadedUrl)
        .filter(Boolean) as string[];
      onUpload?.([...currentUrls, result.url]);

    } catch (error: any) {
      setUploadingFiles(prev => 
        prev.map(item => 
          item.id === uploadingFile.id 
            ? { ...item, error: error.message }
            : item
        )
      );
      onError?.(error.message);
    }
  };

  const removeFile = (id: string) => {
    const fileToRemove = uploadingFiles.find(item => item.id === id);
    if (fileToRemove?.previewUrl) {
      revokePreviewUrl(fileToRemove.previewUrl);
    }

    setUploadingFiles(prev => prev.filter(item => item.id !== id));

    // 업로드된 URL 목록 업데이트
    const remainingUrls = uploadingFiles
      .filter(item => item.id !== id && item.uploadedUrl)
      .map(item => item.uploadedUrl) as string[];
    onUpload?.(remainingUrls);
  };

  const triggerFileSelect = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="file-uploader">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={disabled}
      />

      {/* 업로드 버튼 */}
      <div className="upload-trigger">
        <Button
          block
          color="primary"
          fill="outline"
          onClick={triggerFileSelect}
          disabled={disabled || uploadingFiles.length >= maxFiles}
        >
          <CameraOutline />
          {category === 'image' ? '사진 추가' : '파일 추가'}
          {multiple && ` (${uploadingFiles.length}/${maxFiles})`}
        </Button>
      </div>

      {/* 업로드 중/완료된 파일 목록 */}
      {uploadingFiles.length > 0 && (
        <div className="file-list">
          {uploadingFiles.map(item => (
            <div key={item.id} className="file-item">
              {item.previewUrl && (
                <div className="file-preview">
                  <img src={item.previewUrl} alt="미리보기" />
                </div>
              )}
              
              <div className="file-info">
                <div className="file-name">{item.file.name}</div>
                <div className="file-size">{formatFileSize(item.file.size)}</div>
                
                {item.error ? (
                  <div className="file-error">{item.error}</div>
                ) : item.uploadProgress < 100 ? (
                  <div className="file-progress">
                    <ProgressBar 
                      percent={item.uploadProgress} 
                      style={{ '--fill-color': '#1890ff' }}
                    />
                    <span className="progress-text">{item.uploadProgress}%</span>
                  </div>
                ) : (
                  <div className="file-success">업로드 완료</div>
                )}
              </div>

              <button
                className="file-remove"
                onClick={() => removeFile(item.id)}
                disabled={disabled}
              >
                <DeleteOutline />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FileUploader;