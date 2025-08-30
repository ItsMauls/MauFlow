/**
 * File Attachment Utilities
 * Handles file validation, upload simulation, and attachment management
 */

import { 
  TaskAttachment, 
  FileValidationResult, 
  DEFAULT_MAX_FILE_SIZE, 
  DEFAULT_ALLOWED_FILE_TYPES,
  DEFAULT_MAX_FILES 
} from '@/types/attachments';

// Re-export constants for convenience
export { 
  DEFAULT_MAX_FILE_SIZE, 
  DEFAULT_ALLOWED_FILE_TYPES,
  DEFAULT_MAX_FILES 
} from '@/types/attachments';

/**
 * Validates a file against size and type restrictions
 */
export function validateFile(
  file: File,
  maxFileSize: number = DEFAULT_MAX_FILE_SIZE,
  allowedFileTypes: string[] = DEFAULT_ALLOWED_FILE_TYPES
): FileValidationResult {
  // Check file size
  if (file.size > maxFileSize) {
    const maxSizeMB = Math.round(maxFileSize / (1024 * 1024));
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`
    };
  }

  // Check file type
  if (!allowedFileTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `File type "${file.type}" is not allowed`
    };
  }

  return { isValid: true };
}

/**
 * Validates multiple files
 */
export function validateFiles(
  files: FileList | File[],
  maxFileSize: number = DEFAULT_MAX_FILE_SIZE,
  allowedFileTypes: string[] = DEFAULT_ALLOWED_FILE_TYPES,
  maxFiles: number = DEFAULT_MAX_FILES,
  existingAttachments: number = 0
): { validFiles: File[]; errors: string[] } {
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const errors: string[] = [];

  // Check total file count
  if (existingAttachments + fileArray.length > maxFiles) {
    errors.push(`Cannot upload more than ${maxFiles} files per task`);
    return { validFiles: [], errors };
  }

  // Validate each file
  fileArray.forEach(file => {
    const validation = validateFile(file, maxFileSize, allowedFileTypes);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push(`${file.name}: ${validation.error}`);
    }
  });

  return { validFiles, errors };
}

/**
 * Formats file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Gets file type category for display purposes
 */
export function getFileTypeCategory(fileType: string): string {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'audio';
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType.includes('word') || fileType.includes('document')) return 'document';
  if (fileType.includes('sheet') || fileType.includes('excel')) return 'spreadsheet';
  if (fileType.includes('zip') || fileType.includes('compressed')) return 'archive';
  if (fileType.startsWith('text/')) return 'text';
  return 'file';
}

/**
 * Gets appropriate icon class for file type
 */
export function getFileTypeIcon(fileType: string): string {
  const category = getFileTypeCategory(fileType);
  
  switch (category) {
    case 'image': return '🖼️';
    case 'video': return '🎥';
    case 'audio': return '🎵';
    case 'pdf': return '📄';
    case 'document': return '📝';
    case 'spreadsheet': return '📊';
    case 'archive': return '📦';
    case 'text': return '📄';
    default: return '📎';
  }
}

/**
 * Enhanced file upload simulation with detailed progress tracking
 */
export async function simulateFileUpload(
  file: File,
  taskId: string,
  onProgress?: (progress: number, details?: { speed: string; timeRemaining: string }) => void
): Promise<TaskAttachment> {
  return new Promise(async (resolve, reject) => {
    const startTime = Date.now();
    let progress = 0;
    let lastProgressTime = startTime;
    let lastProgressValue = 0;

    // Create thumbnail for images
    let thumbnailUrl: string | undefined;
    if (file.type.startsWith('image/')) {
      try {
        thumbnailUrl = await createImageThumbnail(file);
      } catch (error) {
        console.warn('Failed to create thumbnail:', error);
      }
    }

    const interval = setInterval(() => {
      const currentTime = Date.now();
      const increment = Math.random() * 15 + 5; // 5-20% increments
      progress = Math.min(progress + increment, 100);
      
      // Calculate upload speed and time remaining
      const timeDiff = (currentTime - lastProgressTime) / 1000; // seconds
      const progressDiff = progress - lastProgressValue;
      const bytesPerSecond = (file.size * progressDiff / 100) / timeDiff;
      const remainingBytes = file.size * (100 - progress) / 100;
      const timeRemaining = remainingBytes / bytesPerSecond;

      const speed = formatUploadSpeed(bytesPerSecond);
      const timeRemainingStr = formatTimeRemaining(timeRemaining);

      onProgress?.(progress, { speed, timeRemaining: timeRemainingStr });
      
      lastProgressTime = currentTime;
      lastProgressValue = progress;
      
      if (progress >= 100) {
        clearInterval(interval);
        
        // Generate secure URLs
        const fileId = `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const secureDownloadUrl = generateSecureUrl(fileId, file.name);
        
        // Simulate successful upload
        const attachment: TaskAttachment = {
          id: `attachment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          taskId,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
          uploadedAt: new Date().toISOString(),
          downloadUrl: secureDownloadUrl,
          previewUrl: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
          thumbnailUrl,
          isSecure: true,
          downloadCount: 0
        };
        
        resolve(attachment);
      }
    }, 200 + Math.random() * 300); // More realistic intervals
    
    // Simulate occasional upload failures (3% chance)
    if (Math.random() < 0.03) {
      setTimeout(() => {
        clearInterval(interval);
        reject(new Error('Network error: Upload failed. Please check your connection and try again.'));
      }, 1000 + Math.random() * 3000);
    }
  });
}

/**
 * Formats upload speed for display
 */
function formatUploadSpeed(bytesPerSecond: number): string {
  if (isNaN(bytesPerSecond) || !isFinite(bytesPerSecond)) return '-- KB/s';
  
  if (bytesPerSecond < 1024) return `${Math.round(bytesPerSecond)} B/s`;
  if (bytesPerSecond < 1024 * 1024) return `${Math.round(bytesPerSecond / 1024)} KB/s`;
  return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
}

/**
 * Formats time remaining for display
 */
function formatTimeRemaining(seconds: number): string {
  if (isNaN(seconds) || !isFinite(seconds)) return '--';
  
  if (seconds < 60) return `${Math.round(seconds)}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}

/**
 * Downloads an attachment with enhanced security and tracking
 */
export function downloadAttachment(attachment: TaskAttachment): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      // Validate secure URL if applicable
      if (attachment.isSecure && !validateSecureUrl(attachment.downloadUrl)) {
        reject(new Error('Download link has expired. Please refresh and try again.'));
        return;
      }

      // Create download link
      const link = document.createElement('a');
      link.href = attachment.downloadUrl;
      link.download = attachment.fileName;
      link.style.display = 'none';
      
      // Add to DOM temporarily
      document.body.appendChild(link);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Simulate download tracking
      console.log(`Download initiated for: ${attachment.fileName}`);
      
      resolve();
    } catch (error) {
      reject(new Error(`Failed to download ${attachment.fileName}: ${error instanceof Error ? error.message : 'Unknown error'}`));
    }
  });
}

/**
 * Enhanced preview URL generation with fallbacks
 */
export function generatePreviewUrl(attachment: TaskAttachment): string | null {
  // Use existing preview URL if available
  if (attachment.previewUrl) {
    return attachment.previewUrl;
  }
  
  // For images, use the download URL as preview (with security check)
  if (attachment.fileType.startsWith('image/')) {
    if (attachment.isSecure && !validateSecureUrl(attachment.downloadUrl)) {
      return null; // URL expired
    }
    return attachment.downloadUrl;
  }
  
  // For PDFs, return download URL for iframe preview
  if (attachment.fileType === 'application/pdf') {
    if (attachment.isSecure && !validateSecureUrl(attachment.downloadUrl)) {
      return null; // URL expired
    }
    return attachment.downloadUrl;
  }
  
  return null;
}

/**
 * Reads text file content for preview
 */
export async function readTextFileContent(attachment: TaskAttachment): Promise<string> {
  if (!attachment.fileType.startsWith('text/') && attachment.fileType !== 'application/json') {
    throw new Error('File is not a text file');
  }

  try {
    const response = await fetch(attachment.downloadUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    const content = await response.text();
    return content;
  } catch (error) {
    throw new Error(`Failed to read file content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}



/**
 * Checks if a file type supports preview
 */
export function supportsPreview(fileType: string): boolean {
  return fileType.startsWith('image/') || 
         fileType === 'application/pdf' ||
         fileType.startsWith('text/') ||
         fileType === 'application/json' ||
         fileType.startsWith('video/') ||
         fileType.startsWith('audio/');
}

/**
 * Gets preview type for a file
 */
export function getPreviewType(fileType: string): 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'none' {
  if (fileType.startsWith('image/')) return 'image';
  if (fileType === 'application/pdf') return 'pdf';
  if (fileType.startsWith('text/') || fileType === 'application/json') return 'text';
  if (fileType.startsWith('video/')) return 'video';
  if (fileType.startsWith('audio/')) return 'audio';
  return 'none';
}

/**
 * Creates a thumbnail for image files
 */
export function createImageThumbnail(file: File, maxSize: number = 150): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('File is not an image'));
      return;
    }

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate thumbnail dimensions
      const { width, height } = img;
      const aspectRatio = width / height;
      
      let thumbnailWidth = maxSize;
      let thumbnailHeight = maxSize;
      
      if (aspectRatio > 1) {
        thumbnailHeight = maxSize / aspectRatio;
      } else {
        thumbnailWidth = maxSize * aspectRatio;
      }

      canvas.width = thumbnailWidth;
      canvas.height = thumbnailHeight;

      // Draw thumbnail
      ctx?.drawImage(img, 0, 0, thumbnailWidth, thumbnailHeight);
      
      // Convert to blob URL
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(URL.createObjectURL(blob));
        } else {
          reject(new Error('Failed to create thumbnail'));
        }
      }, 'image/jpeg', 0.8);
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Generates secure mock URLs for file storage simulation
 */
export function generateSecureUrl(fileId: string, fileName: string): string {
  // Simulate secure URL with token and expiration
  const token = btoa(`${fileId}_${Date.now()}_${Math.random()}`).replace(/[+/=]/g, '');
  const expiry = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  return `https://secure-storage.mauflow.app/files/${fileId}/${encodeURIComponent(fileName)}?token=${token}&expires=${expiry}`;
}

/**
 * Validates secure URL (mock implementation)
 */
export function validateSecureUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const expires = urlObj.searchParams.get('expires');
    const token = urlObj.searchParams.get('token');
    
    if (!expires || !token) return false;
    
    const expiryTime = parseInt(expires);
    return Date.now() < expiryTime;
  } catch {
    return false;
  }
}