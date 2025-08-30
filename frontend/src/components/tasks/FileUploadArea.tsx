'use client';

import React, { useState, useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { FileUploadAreaProps } from '@/types/attachments';
import { formatFileSize, DEFAULT_MAX_FILE_SIZE, DEFAULT_ALLOWED_FILE_TYPES } from '@/lib/attachments';

/**
 * File upload area with drag-and-drop functionality
 */
export const FileUploadArea: React.FC<FileUploadAreaProps> = ({
  onFileSelect,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedFileTypes = DEFAULT_ALLOWED_FILE_TYPES,
  className
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setIsDragActive(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    setDragCounter(0);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFileSelect(e.dataTransfer.files);
    }
  }, [onFileSelect]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files);
      // Reset the input so the same file can be selected again
      e.target.value = '';
    }
  }, [onFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  // Format allowed file types for display
  const formatAllowedTypes = () => {
    const extensions = allowedFileTypes.map(type => {
      switch (type) {
        case 'image/jpeg': return 'JPG';
        case 'image/png': return 'PNG';
        case 'image/gif': return 'GIF';
        case 'image/webp': return 'WebP';
        case 'application/pdf': return 'PDF';
        case 'text/plain': return 'TXT';
        case 'application/msword': return 'DOC';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'DOCX';
        case 'application/vnd.ms-excel': return 'XLS';
        case 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': return 'XLSX';
        case 'application/zip': return 'ZIP';
        case 'application/x-zip-compressed': return 'ZIP';
        default: return type.split('/')[1]?.toUpperCase() || 'FILE';
      }
    });
    
    return extensions.slice(0, 5).join(', ') + (extensions.length > 5 ? '...' : '');
  };

  return (
    <div
      className={cn(
        'relative cursor-pointer transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400/50 rounded-xl',
        isDragActive && 'border-blue-400/60 bg-blue-500/10 scale-[1.02]',
        className
      )}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label="Upload files"
    >
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={allowedFileTypes.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        aria-hidden="true"
      />

      {/* Upload area content */}
      <div className="text-center py-8 px-4">
        {/* Upload icon */}
        <div className={cn(
          'mx-auto mb-4 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200',
          isDragActive 
            ? 'bg-blue-500/20 text-blue-300 scale-110' 
            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white/90'
        )}>
          <span className="text-2xl">
            {isDragActive ? '📤' : '📎'}
          </span>
        </div>

        {/* Main text */}
        <div className="mb-2">
          <p className={cn(
            'text-lg font-medium transition-colors duration-200',
            isDragActive ? 'text-blue-300' : 'text-white/90'
          )}>
            {isDragActive ? 'Drop files here' : 'Upload files'}
          </p>
          <p className="text-sm text-white/60 mt-1">
            Drag and drop files here, or click to browse
          </p>
        </div>

        {/* File restrictions */}
        <div className="text-xs text-white/50 space-y-1">
          <p>
            <span className="font-medium">Max size:</span> {formatFileSize(maxFileSize)}
          </p>
          <p>
            <span className="font-medium">Allowed types:</span> {formatAllowedTypes()}
          </p>
        </div>

        {/* Visual feedback for drag state */}
        {isDragActive && (
          <div className="absolute inset-0 rounded-xl bg-blue-500/5 border-2 border-blue-400/40 pointer-events-none animate-pulse" />
        )}
      </div>
    </div>
  );
};