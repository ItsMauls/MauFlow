import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import {
  validateFile,
  validateFiles,
  formatFileSize,
  getFileTypeCategory,
  getFileTypeIcon,
  simulateFileUpload,
  downloadAttachment,
  generatePreviewUrl,
  readTextFileContent,
  supportsPreview,
  getPreviewType,
  createImageThumbnail,
  generateSecureUrl,
  validateSecureUrl
} from '@/lib/attachments';
import { TaskAttachment } from '@/types/attachments';

// Mock DOM APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
});

Object.defineProperty(global, 'btoa', {
  value: jest.fn((str: string) => Buffer.from(str).toString('base64'))
});

// Mock fetch
global.fetch = jest.fn();

describe('Attachment Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('validateFile', () => {
    it('should validate file size correctly', () => {
      const smallFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      Object.defineProperty(smallFile, 'size', { value: 1024 }); // 1KB

      const result = validateFile(smallFile, 2048); // 2KB limit
      expect(result.isValid).toBe(true);
    });

    it('should reject files that are too large', () => {
      const largeFile = new File(['content'], 'large.txt', { type: 'text/plain' });
      Object.defineProperty(largeFile, 'size', { value: 3072 }); // 3KB

      const result = validateFile(largeFile, 2048); // 2KB limit
      expect(result.isValid).toBe(false);
      expect(result.error).toContain('exceeds');
    });

    it('should validate file types correctly', () => {
      const textFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const imageFile = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      const invalidFile = new File(['content'], 'test.exe', { type: 'application/x-executable' });

      const allowedTypes = ['text/plain', 'image/jpeg'];

      expect(validateFile(textFile, 1024 * 1024, allowedTypes).isValid).toBe(true);
      expect(validateFile(imageFile, 1024 * 1024, allowedTypes).isValid).toBe(true);
      expect(validateFile(invalidFile, 1024 * 1024, allowedTypes).isValid).toBe(false);
    });
  });

  describe('validateFiles', () => {
    it('should validate multiple files correctly', () => {
      const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });
      Object.defineProperty(file1, 'size', { value: 1024 });
      Object.defineProperty(file2, 'size', { value: 1024 });

      const files = [file1, file2];
      const result = validateFiles(files, 2048, ['text/plain'], 5, 0);

      expect(result.validFiles).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject when exceeding max file count', () => {
      const file1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
      const file2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });

      const files = [file1, file2];
      const result = validateFiles(files, 2048, ['text/plain'], 2, 1); // Already 1 existing

      expect(result.validFiles).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toContain('Cannot upload more than');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(0)).toBe('0 Bytes');
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });
  });

  describe('getFileTypeCategory', () => {
    it('should categorize file types correctly', () => {
      expect(getFileTypeCategory('image/jpeg')).toBe('image');
      expect(getFileTypeCategory('video/mp4')).toBe('video');
      expect(getFileTypeCategory('audio/mp3')).toBe('audio');
      expect(getFileTypeCategory('application/pdf')).toBe('pdf');
      expect(getFileTypeCategory('text/plain')).toBe('text');
      expect(getFileTypeCategory('application/zip')).toBe('archive');
      expect(getFileTypeCategory('application/unknown')).toBe('file');
    });
  });

  describe('getFileTypeIcon', () => {
    it('should return appropriate icons for file types', () => {
      expect(getFileTypeIcon('image/jpeg')).toBe('🖼️');
      expect(getFileTypeIcon('video/mp4')).toBe('🎥');
      expect(getFileTypeIcon('audio/mp3')).toBe('🎵');
      expect(getFileTypeIcon('application/pdf')).toBe('📄');
      expect(getFileTypeIcon('text/plain')).toBe('📄');
      expect(getFileTypeIcon('application/unknown')).toBe('📎');
    });
  });

  describe('simulateFileUpload', () => {
    it('should simulate file upload with progress', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      const progressCallback = jest.fn();

      const promise = simulateFileUpload(file, 'task-1', progressCallback);
      
      // Fast-forward timers to complete the upload
      jest.useFakeTimers();
      setTimeout(() => {
        jest.advanceTimersByTime(5000);
      }, 0);

      const result = await promise;
      
      expect(result.taskId).toBe('task-1');
      expect(result.fileName).toBe('test.txt');
      expect(result.fileType).toBe('text/plain');
      expect(progressCallback).toHaveBeenCalled();
      
      jest.useRealTimers();
    });

    it('should handle upload failures', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      
      // Mock Math.random to trigger failure
      const originalRandom = Math.random;
      Math.random = jest.fn(() => 0.01); // Force failure

      jest.useFakeTimers();
      
      const promise = simulateFileUpload(file, 'task-1');
      
      setTimeout(() => {
        jest.advanceTimersByTime(5000);
      }, 0);

      await expect(promise).rejects.toThrow('Network error');
      
      Math.random = originalRandom;
      jest.useRealTimers();
    });
  });

  describe('downloadAttachment', () => {
    it('should trigger file download', async () => {
      const attachment: TaskAttachment = {
        id: 'att-1',
        taskId: 'task-1',
        fileName: 'test.txt',
        fileSize: 1024,
        fileType: 'text/plain',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'https://example.com/file.txt',
        isSecure: false,
        downloadCount: 0
      };

      // Mock DOM methods
      const mockClick = jest.fn();
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: mockClick
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);

      await downloadAttachment(attachment);

      expect(mockClick).toHaveBeenCalled();
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
    });

    it('should handle secure URL validation', async () => {
      const attachment: TaskAttachment = {
        id: 'att-1',
        taskId: 'task-1',
        fileName: 'test.txt',
        fileSize: 1024,
        fileType: 'text/plain',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'https://secure.example.com/file.txt?token=invalid&expires=0',
        isSecure: true,
        downloadCount: 0
      };

      await expect(downloadAttachment(attachment)).rejects.toThrow('Download link has expired');
    });
  });

  describe('generatePreviewUrl', () => {
    it('should return existing preview URL', () => {
      const attachment: TaskAttachment = {
        id: 'att-1',
        taskId: 'task-1',
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'https://example.com/file.jpg',
        previewUrl: 'https://example.com/preview.jpg',
        isSecure: false,
        downloadCount: 0
      };

      expect(generatePreviewUrl(attachment)).toBe('https://example.com/preview.jpg');
    });

    it('should use download URL for images when no preview URL exists', () => {
      const attachment: TaskAttachment = {
        id: 'att-1',
        taskId: 'task-1',
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'https://example.com/file.jpg',
        isSecure: false,
        downloadCount: 0
      };

      expect(generatePreviewUrl(attachment)).toBe('https://example.com/file.jpg');
    });

    it('should return null for non-previewable files', () => {
      const attachment: TaskAttachment = {
        id: 'att-1',
        taskId: 'task-1',
        fileName: 'test.exe',
        fileSize: 1024,
        fileType: 'application/x-executable',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'https://example.com/file.exe',
        isSecure: false,
        downloadCount: 0
      };

      expect(generatePreviewUrl(attachment)).toBeNull();
    });
  });

  describe('readTextFileContent', () => {
    it('should read text file content', async () => {
      const attachment: TaskAttachment = {
        id: 'att-1',
        taskId: 'task-1',
        fileName: 'test.txt',
        fileSize: 1024,
        fileType: 'text/plain',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'https://example.com/file.txt',
        isSecure: false,
        downloadCount: 0
      };

      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('File content')
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const content = await readTextFileContent(attachment);
      expect(content).toBe('File content');
    });

    it('should reject non-text files', async () => {
      const attachment: TaskAttachment = {
        id: 'att-1',
        taskId: 'task-1',
        fileName: 'test.jpg',
        fileSize: 1024,
        fileType: 'image/jpeg',
        uploadedAt: '2024-01-01T00:00:00Z',
        downloadUrl: 'https://example.com/file.jpg',
        isSecure: false,
        downloadCount: 0
      };

      await expect(readTextFileContent(attachment)).rejects.toThrow('File is not a text file');
    });
  });

  describe('supportsPreview', () => {
    it('should correctly identify previewable file types', () => {
      expect(supportsPreview('image/jpeg')).toBe(true);
      expect(supportsPreview('application/pdf')).toBe(true);
      expect(supportsPreview('text/plain')).toBe(true);
      expect(supportsPreview('video/mp4')).toBe(true);
      expect(supportsPreview('audio/mp3')).toBe(true);
      expect(supportsPreview('application/zip')).toBe(false);
    });
  });

  describe('getPreviewType', () => {
    it('should return correct preview types', () => {
      expect(getPreviewType('image/jpeg')).toBe('image');
      expect(getPreviewType('application/pdf')).toBe('pdf');
      expect(getPreviewType('text/plain')).toBe('text');
      expect(getPreviewType('video/mp4')).toBe('video');
      expect(getPreviewType('audio/mp3')).toBe('audio');
      expect(getPreviewType('application/zip')).toBe('none');
    });
  });

  describe('createImageThumbnail', () => {
    it('should reject non-image files', async () => {
      const file = new File(['content'], 'test.txt', { type: 'text/plain' });
      await expect(createImageThumbnail(file)).rejects.toThrow('File is not an image');
    });

    it('should create thumbnail for image files', async () => {
      const file = new File(['content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Mock canvas and image APIs
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn()
        })),
        toBlob: jest.fn((callback) => {
          callback(new Blob(['thumbnail'], { type: 'image/jpeg' }));
        })
      };

      jest.spyOn(document, 'createElement').mockReturnValue(mockCanvas as any);

      // Mock Image constructor
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        width: 200,
        height: 100
      };

      (global as any).Image = jest.fn(() => mockImage);

      const promise = createImageThumbnail(file);
      
      // Trigger onload
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload();
      }, 0);

      const result = await promise;
      expect(result).toBe('blob:mock-url');
    });
  });

  describe('generateSecureUrl', () => {
    it('should generate secure URLs with tokens and expiry', () => {
      const url = generateSecureUrl('file123', 'test.txt');
      
      expect(url).toContain('secure-storage.mauflow.app');
      expect(url).toContain('file123');
      expect(url).toContain('test.txt');
      expect(url).toContain('token=');
      expect(url).toContain('expires=');
    });
  });

  describe('validateSecureUrl', () => {
    it('should validate secure URLs correctly', () => {
      const futureTime = Date.now() + 60000; // 1 minute from now
      const pastTime = Date.now() - 60000; // 1 minute ago
      
      const validUrl = `https://example.com/file?token=abc123&expires=${futureTime}`;
      const expiredUrl = `https://example.com/file?token=abc123&expires=${pastTime}`;
      const invalidUrl = 'https://example.com/file';

      expect(validateSecureUrl(validUrl)).toBe(true);
      expect(validateSecureUrl(expiredUrl)).toBe(false);
      expect(validateSecureUrl(invalidUrl)).toBe(false);
    });
  });
});