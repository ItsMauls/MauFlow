/**
 * Enhanced File Attachment System Tests
 * Tests for the enhanced file attachment features including preview, download, and secure storage
 */

import { 
  supportsPreview, 
  getPreviewType, 
  createImageThumbnail, 
  generateSecureUrl, 
  validateSecureUrl,
  downloadAttachment,
  readTextFileContent
} from '@/lib/attachments';
import { TaskAttachment } from '@/types/attachments';

// Mock DOM APIs
global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock fetch for text file reading
global.fetch = jest.fn();

describe('Enhanced File Attachment Features', () => {
  describe('Preview Support', () => {
    test('should support preview for various file types', () => {
      expect(supportsPreview('image/jpeg')).toBe(true);
      expect(supportsPreview('image/png')).toBe(true);
      expect(supportsPreview('application/pdf')).toBe(true);
      expect(supportsPreview('text/plain')).toBe(true);
      expect(supportsPreview('application/json')).toBe(true);
      expect(supportsPreview('video/mp4')).toBe(true);
      expect(supportsPreview('audio/mp3')).toBe(true);
      expect(supportsPreview('application/zip')).toBe(false);
    });

    test('should return correct preview types', () => {
      expect(getPreviewType('image/jpeg')).toBe('image');
      expect(getPreviewType('application/pdf')).toBe('pdf');
      expect(getPreviewType('text/plain')).toBe('text');
      expect(getPreviewType('application/json')).toBe('text');
      expect(getPreviewType('video/mp4')).toBe('video');
      expect(getPreviewType('audio/mp3')).toBe('audio');
      expect(getPreviewType('application/zip')).toBe('none');
    });
  });

  describe('Thumbnail Generation', () => {
    test('should reject non-image files', async () => {
      const textFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      
      await expect(createImageThumbnail(textFile)).rejects.toThrow('File is not an image');
    });

    test('should handle image files', async () => {
      // Mock canvas and image APIs
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn()
        })),
        toBlob: jest.fn((callback) => {
          callback(new Blob(['mock-thumbnail'], { type: 'image/jpeg' }));
        })
      };
      
      const mockImage = {
        onload: null as any,
        onerror: null as any,
        src: '',
        width: 200,
        height: 150
      };

      global.document.createElement = jest.fn((tagName) => {
        if (tagName === 'canvas') return mockCanvas as any;
        return {} as any;
      });

      global.Image = jest.fn(() => mockImage) as any;

      const imageFile = new File(['image-data'], 'test.jpg', { type: 'image/jpeg' });
      
      const thumbnailPromise = createImageThumbnail(imageFile);
      
      // Simulate image load
      if (mockImage.onload) {
        mockImage.onload();
      }
      
      const thumbnailUrl = await thumbnailPromise;
      expect(thumbnailUrl).toBe('blob:mock-url');
    });
  });

  describe('Secure URL Management', () => {
    test('should generate secure URLs with tokens and expiration', () => {
      const fileId = 'test-file-123';
      const fileName = 'test document.pdf';
      
      const secureUrl = generateSecureUrl(fileId, fileName);
      
      expect(secureUrl).toContain('secure-storage.mauflow.app');
      expect(secureUrl).toContain(fileId);
      expect(secureUrl).toContain(encodeURIComponent(fileName));
      expect(secureUrl).toContain('token=');
      expect(secureUrl).toContain('expires=');
    });

    test('should validate secure URLs correctly', () => {
      const futureTime = Date.now() + 1000000;
      const pastTime = Date.now() - 1000000;
      
      const validUrl = `https://secure-storage.mauflow.app/files/123/test.pdf?token=abc123&expires=${futureTime}`;
      const expiredUrl = `https://secure-storage.mauflow.app/files/123/test.pdf?token=abc123&expires=${pastTime}`;
      const invalidUrl = 'https://example.com/file.pdf';
      
      expect(validateSecureUrl(validUrl)).toBe(true);
      expect(validateSecureUrl(expiredUrl)).toBe(false);
      expect(validateSecureUrl(invalidUrl)).toBe(false);
    });
  });

  describe('Enhanced Download Functionality', () => {
    test('should handle secure download with valid URL', async () => {
      const mockLink = {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn()
      };

      global.document.createElement = jest.fn(() => mockLink as any);
      global.document.body.appendChild = jest.fn();
      global.document.body.removeChild = jest.fn();

      const attachment: TaskAttachment = {
        id: '1',
        taskId: 'task-1',
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        downloadUrl: `https://secure-storage.mauflow.app/files/123/test.pdf?token=abc123&expires=${Date.now() + 1000000}`,
        isSecure: true
      };

      await expect(downloadAttachment(attachment)).resolves.toBeUndefined();
      expect(mockLink.click).toHaveBeenCalled();
    });

    test('should reject expired secure URLs', async () => {
      const attachment: TaskAttachment = {
        id: '1',
        taskId: 'task-1',
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        downloadUrl: `https://secure-storage.mauflow.app/files/123/test.pdf?token=abc123&expires=${Date.now() - 1000000}`,
        isSecure: true
      };

      await expect(downloadAttachment(attachment)).rejects.toThrow('Download link has expired');
    });
  });

  describe('Text File Content Reading', () => {
    test('should read text file content successfully', async () => {
      const mockResponse = {
        ok: true,
        text: jest.fn().mockResolvedValue('File content here')
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const attachment: TaskAttachment = {
        id: '1',
        taskId: 'task-1',
        fileName: 'test.txt',
        fileSize: 1024,
        fileType: 'text/plain',
        uploadedAt: new Date().toISOString(),
        downloadUrl: 'https://example.com/test.txt'
      };

      const content = await readTextFileContent(attachment);
      expect(content).toBe('File content here');
      expect(global.fetch).toHaveBeenCalledWith(attachment.downloadUrl);
    });

    test('should reject non-text files', async () => {
      const attachment: TaskAttachment = {
        id: '1',
        taskId: 'task-1',
        fileName: 'test.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
        uploadedAt: new Date().toISOString(),
        downloadUrl: 'https://example.com/test.pdf'
      };

      await expect(readTextFileContent(attachment)).rejects.toThrow('File is not a text file');
    });

    test('should handle fetch errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found'
      };
      
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const attachment: TaskAttachment = {
        id: '1',
        taskId: 'task-1',
        fileName: 'test.txt',
        fileSize: 1024,
        fileType: 'text/plain',
        uploadedAt: new Date().toISOString(),
        downloadUrl: 'https://example.com/test.txt'
      };

      await expect(readTextFileContent(attachment)).rejects.toThrow('Failed to fetch file: Not Found');
    });
  });
});