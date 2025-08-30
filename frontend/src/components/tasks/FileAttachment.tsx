'use client';

import React, { useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { 
  FileAttachmentProps, 
  FileUploadProgress, 
  TaskAttachment 
} from '@/types/attachments';
import { 
  validateFiles, 
  simulateFileUpload, 
  DEFAULT_MAX_FILE_SIZE, 
  DEFAULT_ALLOWED_FILE_TYPES, 
  DEFAULT_MAX_FILES 
} from '@/lib/attachments';
import { FileUploadArea } from './FileUploadArea';
import { AttachmentList } from './AttachmentList';

/**
 * Main FileAttachment component that handles file uploads and displays attachments
 */
export const FileAttachment: React.FC<FileAttachmentProps> = ({
  taskId,
  attachments,
  onAttachmentAdd,
  onAttachmentRemove,
  onAttachmentDownload,
  className,
  maxFileSize = DEFAULT_MAX_FILE_SIZE,
  allowedFileTypes = DEFAULT_ALLOWED_FILE_TYPES,
  maxFiles = DEFAULT_MAX_FILES
}) => {
  const [uploadProgress, setUploadProgress] = useState<FileUploadProgress[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleFileSelect = useCallback(async (files: FileList) => {
    setErrors([]);
    
    // Validate files
    const { validFiles, errors: validationErrors } = validateFiles(
      files,
      maxFileSize,
      allowedFileTypes,
      maxFiles,
      attachments.length
    );

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Process each valid file
    for (const file of validFiles) {
      const progressId = `${file.name}_${Date.now()}`;
      
      // Add to progress tracking
      setUploadProgress(prev => [...prev, {
        fileName: file.name,
        progress: 0,
        status: 'uploading'
      }]);

      try {
        // Simulate file upload with enhanced progress tracking
        await simulateFileUpload(
          file,
          taskId,
          (progress, details) => {
            setUploadProgress(prev => 
              prev.map(p => 
                p.fileName === file.name 
                  ? { 
                      ...p, 
                      progress,
                      uploadSpeed: details?.speed,
                      timeRemaining: details?.timeRemaining
                    }
                  : p
              )
            );
          }
        );

        // Mark as completed
        setUploadProgress(prev => 
          prev.map(p => 
            p.fileName === file.name 
              ? { ...p, status: 'completed' as const }
              : p
          )
        );

        // Call the parent's add handler
        await onAttachmentAdd(taskId, file);

        // Remove from progress after a short delay
        setTimeout(() => {
          setUploadProgress(prev => 
            prev.filter(p => p.fileName !== file.name)
          );
        }, 1000);

      } catch (error) {
        // Mark as error
        setUploadProgress(prev => 
          prev.map(p => 
            p.fileName === file.name 
              ? { 
                  ...p, 
                  status: 'error' as const, 
                  error: error instanceof Error ? error.message : 'Upload failed'
                }
              : p
          )
        );

        // Remove from progress after delay
        setTimeout(() => {
          setUploadProgress(prev => 
            prev.filter(p => p.fileName !== file.name)
          );
        }, 3000);
      }
    }
  }, [taskId, attachments.length, maxFileSize, allowedFileTypes, maxFiles, onAttachmentAdd]);

  const hasAttachments = attachments.length > 0;
  const hasUploads = uploadProgress.length > 0;

  return (
    <div className={cn('space-y-3', className)}>
      {/* Header with attachment count */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm font-medium text-white/80 hover:text-white transition-colors"
        >
          <span className="text-lg">📎</span>
          <span>
            Attachments {hasAttachments && `(${attachments.length})`}
          </span>
          <span className={cn(
            'transition-transform duration-200',
            isExpanded ? 'rotate-90' : 'rotate-0'
          )}>
            ▶
          </span>
        </button>
      </div>

      {/* Expandable content */}
      {isExpanded && (
        <div className="space-y-4">
          {/* File Upload Area */}
          <FileUploadArea
            onFileSelect={handleFileSelect}
            maxFileSize={maxFileSize}
            allowedFileTypes={allowedFileTypes}
            className="border-2 border-dashed border-white/30 rounded-xl p-6 bg-white/5 backdrop-blur-sm hover:border-white/50 hover:bg-white/10 transition-all duration-200"
          />

          {/* Enhanced Upload Progress */}
          {hasUploads && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-white/80">Uploading Files</h4>
                <span className="text-xs text-white/60">
                  {uploadProgress.filter(p => p.status === 'completed').length} of {uploadProgress.length} complete
                </span>
              </div>
              
              {uploadProgress.map((progress, index) => (
                <div key={index} className="bg-white/10 rounded-lg p-4 backdrop-blur-sm border border-white/20">
                  {/* File name and status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-lg">
                        {progress.status === 'uploading' && '⏳'}
                        {progress.status === 'completed' && '✅'}
                        {progress.status === 'error' && '❌'}
                        {progress.status === 'cancelled' && '⏹️'}
                      </span>
                      <span className="text-sm text-white/90 truncate">
                        {progress.fileName}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {progress.status === 'uploading' && (
                        <span className="text-xs text-white/70 font-mono">
                          {Math.round(progress.progress)}%
                        </span>
                      )}
                      
                      {progress.status === 'error' && progress.canRetry && (
                        <button
                          onClick={() => {
                            // Retry logic would go here
                            console.log('Retry upload for:', progress.fileName);
                          }}
                          className="text-xs text-blue-300 hover:text-blue-200 px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 transition-colors"
                        >
                          Retry
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  {progress.status === 'uploading' && (
                    <div className="space-y-2">
                      <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progress.progress}%` }}
                        />
                      </div>
                      
                      {/* Upload details */}
                      <div className="flex items-center justify-between text-xs text-white/60">
                        <span>
                          {progress.uploadSpeed && `${progress.uploadSpeed}`}
                        </span>
                        <span>
                          {progress.timeRemaining && `${progress.timeRemaining} remaining`}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {/* Error message */}
                  {progress.status === 'error' && progress.error && (
                    <div className="mt-2 p-2 bg-red-500/20 border border-red-400/30 rounded text-xs text-red-300">
                      {progress.error}
                    </div>
                  )}
                  
                  {/* Success message */}
                  {progress.status === 'completed' && (
                    <div className="mt-2 text-xs text-green-300">
                      Upload completed successfully
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-3 backdrop-blur-sm">
              <h4 className="text-sm font-medium text-red-300 mb-2">Upload Errors:</h4>
              <ul className="text-xs text-red-200 space-y-1">
                {errors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Attachment List */}
          {hasAttachments && (
            <AttachmentList
              attachments={attachments}
              onRemove={onAttachmentRemove}
              onDownload={onAttachmentDownload}
            />
          )}

          {/* Empty State */}
          {!hasAttachments && !hasUploads && (
            <div className="text-center py-6 text-white/60">
              <span className="text-2xl mb-2 block">📎</span>
              <p className="text-sm">No attachments yet</p>
              <p className="text-xs mt-1">Drag and drop files above to get started</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};