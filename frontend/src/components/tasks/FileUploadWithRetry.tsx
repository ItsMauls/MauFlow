'use client';

import React, { useState, useCallback } from 'react';
import { GlassButton } from '../ui';
import { LoadingSpinner } from '../loading/LoadingSpinner';
import { ErrorState } from '../fallback/ErrorState';
import { useRetry } from '@/hooks/useRetry';
import { simulateFileUpload } from '@/lib/attachments';
import { TaskAttachment } from '@/types/attachments';

interface FileUploadWithRetryProps {
  taskId: string;
  onUploadSuccess: (attachment: TaskAttachment) => void;
  onUploadError?: (error: Error) => void;
  maxFileSize?: number;
  allowedTypes?: string[];
  className?: string;
}

/**
 * File upload component with retry mechanism and comprehensive error handling
 */
export const FileUploadWithRetry: React.FC<FileUploadWithRetryProps> = ({
  taskId,
  onUploadSuccess,
  onUploadError,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedTypes = ['image/*', 'application/pdf', 'text/*', '.doc', '.docx'],
  className = ''
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<TaskAttachment> => {
    // Validate file size
    if (file.size > maxFileSize) {
      throw new Error(`File size exceeds ${Math.round(maxFileSize / 1024 / 1024)}MB limit`);
    }

    // Validate file type
    const isAllowedType = allowedTypes.some(type => {
      if (type.includes('*')) {
        const baseType = type.split('/')[0];
        return file.type.startsWith(baseType);
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isAllowedType) {
      throw new Error(`File type not allowed. Allowed types: ${allowedTypes.join(', ')}`);
    }

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const next = prev + Math.random() * 20;
        return next > 90 ? 90 : next;
      });
    }, 200);

    try {
      const attachment = await simulateFileUpload(file, taskId);
      setUploadProgress(100);
      clearInterval(progressInterval);
      return attachment;
    } catch (error) {
      clearInterval(progressInterval);
      setUploadProgress(0);
      throw error;
    }
  }, [taskId, maxFileSize, allowedTypes]);

  const {
    execute: executeUpload,
    isRetrying,
    retryCount,
    lastError,
    reset: resetRetry
  } = useRetry(uploadFile, {
    maxRetries: 3,
    retryDelay: 1000,
    onRetry: (attempt, error) => {
      console.log(`Upload attempt ${attempt} failed:`, error.message);
      setUploadProgress(0);
    },
    onMaxRetriesReached: (error) => {
      console.error('Upload failed after all retries:', error);
      onUploadError?.(error);
    }
  });

  const handleFileSelect = useCallback(async (file: File) => {
    setSelectedFile(file);
    setUploadProgress(0);
    resetRetry();

    try {
      const attachment = await executeUpload(file);
      onUploadSuccess(attachment);
      setSelectedFile(null);
      setUploadProgress(0);
    } catch (error) {
      console.error('Upload failed:', error);
    }
  }, [executeUpload, onUploadSuccess, resetRetry]);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const isUploading = uploadProgress > 0 && uploadProgress < 100;
  const hasError = lastError && !isRetrying;

  return (
    <div className={className}>
      {hasError && (
        <div className="mb-4">
          <ErrorState
            title="Upload Failed"
            message={lastError.message}
            error={lastError}
            onRetry={() => selectedFile && handleFileSelect(selectedFile)}
            onDismiss={resetRetry}
            showDetails={true}
          />
        </div>
      )}

      <div
        className={`
          relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-400/50 bg-blue-400/10' 
            : 'border-white/20 hover:border-white/30'
          }
          ${isUploading ? 'pointer-events-none opacity-75' : ''}
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {isUploading ? (
          <div className="space-y-4">
            <LoadingSpinner size="lg" />
            <div>
              <p className="text-white/80 mb-2">
                {isRetrying ? `Retrying upload (${retryCount}/3)...` : 'Uploading file...'}
              </p>
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-white/60 text-sm mt-1">
                {Math.round(uploadProgress)}%
              </p>
            </div>
            {selectedFile && (
              <p className="text-white/60 text-sm">
                {selectedFile.name}
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
              <svg className="w-6 h-6 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            
            <div>
              <p className="text-white/80 mb-2">
                Drop files here or click to browse
              </p>
              <p className="text-white/60 text-sm">
                Max size: {Math.round(maxFileSize / 1024 / 1024)}MB
              </p>
            </div>
            
            <GlassButton
              variant="secondary"
              onClick={() => document.getElementById('file-input')?.click()}
              className="rounded-full px-6 py-2"
            >
              Choose File
            </GlassButton>
          </div>
        )}

        <input
          id="file-input"
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          accept={allowedTypes.join(',')}
        />
      </div>

      {retryCount > 0 && !hasError && (
        <div className="mt-2 text-center">
          <p className="text-white/60 text-sm">
            Retry attempt {retryCount} of 3
          </p>
        </div>
      )}
    </div>
  );
};