/**
 * Task Attachment System Types
 * Defines interfaces and types for the task file attachment functionality
 */

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  downloadUrl: string;
  previewUrl?: string;
  thumbnailUrl?: string;
  isSecure?: boolean;
  downloadCount?: number;
}

export interface FileUploadProgress {
  fileName: string;
  progress: number;
  status: 'uploading' | 'completed' | 'error' | 'cancelled';
  error?: string;
  uploadSpeed?: string;
  timeRemaining?: string;
  canRetry?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileAttachmentProps {
  taskId: string;
  attachments: TaskAttachment[];
  onAttachmentAdd: (taskId: string, file: File) => Promise<void>;
  onAttachmentRemove: (attachmentId: string) => Promise<void>;
  onAttachmentDownload: (attachment: TaskAttachment) => void;
  className?: string;
  maxFileSize?: number; // in bytes
  allowedFileTypes?: string[];
  maxFiles?: number;
}

export interface FileUploadAreaProps {
  onFileSelect: (files: FileList) => void;
  isDragActive: boolean;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  className?: string;
}

export interface AttachmentListProps {
  attachments: TaskAttachment[];
  onRemove: (attachmentId: string) => Promise<void>;
  onDownload: (attachment: TaskAttachment) => void;
  className?: string;
}

export interface AttachmentItemProps {
  attachment: TaskAttachment;
  onRemove: (attachmentId: string) => Promise<void>;
  onDownload: (attachment: TaskAttachment) => void;
  onPreview?: (attachment: TaskAttachment) => void;
  className?: string;
}

// File validation constants
export const DEFAULT_MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const DEFAULT_ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/zip',
  'application/x-zip-compressed'
];
export const DEFAULT_MAX_FILES = 5;