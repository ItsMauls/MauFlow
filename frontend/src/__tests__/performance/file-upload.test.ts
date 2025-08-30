/**
 * @jest-environment jsdom
 */

import { performance } from 'perf_hooks';
import {
  validateFile,
  validateFiles,
  simulateFileUpload,
  createImageThumbnail,
  formatFileSize,
  getFileTypeCategory
} from '@/lib/attachments';

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  } as any;
}

// Mock DOM APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
});

// Mock File constructor
Object.defineProperty(global, 'File', {
  value: class MockFile {
    constructor(public parts: any[], public name: string, public options: any = {}) {
      this.type = options.type || '';
      this.size = parts.reduce((acc, part) => acc + (typeof part === 'string' ? part.length : part.byteLength || 0), 0);
    }
    type: string;
    size: number;
  }
});

// Helper function to measure execution time
const measureExecutionTime = async (fn: () => void | Promise<void>): Promise<number> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Helper to create mock files of various sizes
const createMockFile = (sizeInMB: number, name: string, type: string): File => {
  const sizeInBytes = sizeInMB * 1024 * 1024;
  const content = new ArrayBuffer(sizeInBytes);
  return new File([content], name, { type });
};

// Helper to create multiple files
const createMockFiles = (count: number, sizeInMB: number): File[] => {
  const files: File[] = [];
  for (let i = 0; i < count; i++) {
    files.push(createMockFile(sizeInMB, `file-${i}.txt`, 'text/plain'));
  }
  return files;
};

describe('File Upload Performance Tests', () => {
  const PERFORMANCE_THRESHOLD = {
    VALIDATION_SINGLE: 5, // 5ms for single file validation
    VALIDATION_BATCH: 50, // 50ms for batch validation
    UPLOAD_SIMULATION: 100, // 100ms for upload simulation setup
    THUMBNAIL_CREATION: 200, // 200ms for thumbnail creation
    UTILITY_FUNCTIONS: 1, // 1ms for utility functions
    LARGE_FILE_HANDLING: 500, // 500ms for large file operations
    CONCURRENT_OPERATIONS: 1000 // 1s for concurrent operations
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('File Validation Performance', () => {
    it('should validate single file quickly', async () => {
      const file = createMockFile(1, 'test.txt', 'text/plain');
      
      const executionTime = await measureExecutionTime(() => {
        validateFile(file);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_SINGLE);
    });

    it('should validate large file quickly', async () => {
      const file = createMockFile(100, 'large.txt', 'text/plain'); // 100MB file
      
      const executionTime = await measureExecutionTime(() => {
        validateFile(file);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_SINGLE);
    });

    it('should validate multiple files efficiently', async () => {
      const files = createMockFiles(100, 1); // 100 files of 1MB each
      
      const executionTime = await measureExecutionTime(() => {
        validateFiles(files);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_BATCH);
    });

    it('should handle batch validation with mixed file sizes', async () => {
      const files = [
        createMockFile(0.1, 'small.txt', 'text/plain'),
        createMockFile(10, 'medium.txt', 'text/plain'),
        createMockFile(50, 'large.txt', 'text/plain'),
        createMockFile(0.01, 'tiny.txt', 'text/plain')
      ];
      
      const executionTime = await measureExecutionTime(() => {
        files.forEach(file => validateFile(file));
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_SINGLE * files.length);
    });

    it('should validate files with different types efficiently', async () => {
      const files = [
        createMockFile(1, 'document.pdf', 'application/pdf'),
        createMockFile(1, 'image.jpg', 'image/jpeg'),
        createMockFile(1, 'video.mp4', 'video/mp4'),
        createMockFile(1, 'audio.mp3', 'audio/mpeg'),
        createMockFile(1, 'text.txt', 'text/plain')
      ];
      
      const executionTime = await measureExecutionTime(() => {
        files.forEach(file => validateFile(file));
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_BATCH);
    });
  });

  describe('File Upload Simulation Performance', () => {
    it('should initialize upload simulation quickly', async () => {
      const file = createMockFile(1, 'test.txt', 'text/plain');
      
      const executionTime = await measureExecutionTime(() => {
        // Just measure the synchronous setup, not the full upload
        const uploadPromise = simulateFileUpload(file, 'task-1');
        expect(uploadPromise).toBeInstanceOf(Promise);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.UPLOAD_SIMULATION);
    });

    it('should handle multiple concurrent upload initializations', async () => {
      const files = createMockFiles(10, 1);
      
      const executionTime = await measureExecutionTime(() => {
        const promises = files.map(file => simulateFileUpload(file, 'task-1'));
        expect(promises).toHaveLength(10);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.CONCURRENT_OPERATIONS);
    });

    it('should handle large file upload initialization', async () => {
      const file = createMockFile(500, 'huge.txt', 'text/plain'); // 500MB file
      
      const executionTime = await measureExecutionTime(() => {
        const uploadPromise = simulateFileUpload(file, 'task-1');
        expect(uploadPromise).toBeInstanceOf(Promise);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.LARGE_FILE_HANDLING);
    });
  });

  describe('Thumbnail Creation Performance', () => {
    beforeEach(() => {
      // Mock canvas and image APIs
      const mockCanvas = {
        width: 0,
        height: 0,
        getContext: jest.fn(() => ({
          drawImage: jest.fn()
        })),
        toBlob: jest.fn((callback) => {
          setTimeout(() => callback(new Blob(['thumbnail'], { type: 'image/jpeg' })), 10);
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
    });

    it('should create thumbnail quickly for small image', async () => {
      const file = createMockFile(0.5, 'small.jpg', 'image/jpeg');
      
      const executionTime = await measureExecutionTime(async () => {
        const promise = createImageThumbnail(file);
        
        // Simulate image load
        setTimeout(() => {
          const mockImage = (global as any).Image.mock.results[0].value;
          if (mockImage.onload) mockImage.onload();
        }, 0);
        
        jest.advanceTimersByTime(50);
        await promise;
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.THUMBNAIL_CREATION);
    });

    it('should handle multiple thumbnail creations efficiently', async () => {
      const files = [
        createMockFile(0.5, 'image1.jpg', 'image/jpeg'),
        createMockFile(1, 'image2.jpg', 'image/jpeg'),
        createMockFile(0.3, 'image3.jpg', 'image/jpeg')
      ];
      
      const executionTime = await measureExecutionTime(async () => {
        const promises = files.map(file => {
          const promise = createImageThumbnail(file);
          
          // Simulate image load for each
          setTimeout(() => {
            const mockImages = (global as any).Image.mock.results;
            const mockImage = mockImages[mockImages.length - 1].value;
            if (mockImage.onload) mockImage.onload();
          }, 0);
          
          return promise;
        });
        
        jest.advanceTimersByTime(100);
        await Promise.all(promises);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.THUMBNAIL_CREATION * files.length);
    });
  });

  describe('Utility Functions Performance', () => {
    it('should format file sizes quickly', async () => {
      const sizes = [0, 1024, 1024 * 1024, 1024 * 1024 * 1024, 1024 * 1024 * 1024 * 1024];
      
      const executionTime = await measureExecutionTime(() => {
        sizes.forEach(size => formatFileSize(size));
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.UTILITY_FUNCTIONS);
    });

    it('should categorize file types quickly', async () => {
      const types = [
        'image/jpeg', 'image/png', 'image/gif',
        'video/mp4', 'video/avi', 'video/mov',
        'audio/mp3', 'audio/wav', 'audio/flac',
        'application/pdf', 'application/zip',
        'text/plain', 'text/html', 'text/css'
      ];
      
      const executionTime = await measureExecutionTime(() => {
        types.forEach(type => getFileTypeCategory(type));
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.UTILITY_FUNCTIONS);
    });

    it('should handle large arrays of file operations', async () => {
      const files = createMockFiles(1000, 0.1); // 1000 small files
      
      const executionTime = await measureExecutionTime(() => {
        files.forEach(file => {
          formatFileSize(file.size);
          getFileTypeCategory(file.type);
        });
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_BATCH);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during file validation', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Validate many files
      for (let i = 0; i < 1000; i++) {
        const file = createMockFile(1, `file-${i}.txt`, 'text/plain');
        validateFile(file);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal (less than 10MB)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });

    it('should handle large file objects efficiently', () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Create and validate large files
      const files = [];
      for (let i = 0; i < 10; i++) {
        files.push(createMockFile(50, `large-${i}.txt`, 'text/plain'));
      }
      
      files.forEach(file => validateFile(file));
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });

  describe('Stress Tests', () => {
    it('should handle extreme number of files', async () => {
      const files = createMockFiles(10000, 0.001); // 10,000 tiny files
      
      const executionTime = await measureExecutionTime(() => {
        validateFiles(files);
      });
      
      // Should complete within 2 seconds even for extreme numbers
      expect(executionTime).toBeLessThan(2000);
    });

    it('should handle very large single file', async () => {
      const file = createMockFile(1000, 'huge.txt', 'text/plain'); // 1GB file
      
      const executionTime = await measureExecutionTime(() => {
        validateFile(file);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_SINGLE);
    });

    it('should maintain performance under repeated operations', async () => {
      const iterations = 100;
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const files = createMockFiles(10, 1);
        
        const time = await measureExecutionTime(() => {
          validateFiles(files);
        });
        
        times.push(time);
      }
      
      // Performance should not degrade significantly
      const firstHalf = times.slice(0, iterations / 2);
      const secondHalf = times.slice(iterations / 2);
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
      
      // Second half should not be more than 50% slower
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
    });

    it('should handle concurrent file operations', async () => {
      const executionTime = await measureExecutionTime(async () => {
        const promises = [];
        
        // Simulate concurrent file operations
        for (let i = 0; i < 20; i++) {
          promises.push(Promise.resolve().then(() => {
            const files = createMockFiles(50, 0.1);
            return validateFiles(files);
          }));
        }
        
        await Promise.all(promises);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.CONCURRENT_OPERATIONS);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty file arrays efficiently', async () => {
      const executionTime = await measureExecutionTime(() => {
        validateFiles([]);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.UTILITY_FUNCTIONS);
    });

    it('should handle files with unusual properties', async () => {
      const files = [
        createMockFile(0, 'empty.txt', 'text/plain'), // Empty file
        createMockFile(0.001, '', 'text/plain'), // No name
        createMockFile(1, 'file.txt', ''), // No type
        createMockFile(1, 'file with spaces.txt', 'text/plain'),
        createMockFile(1, 'file-with-very-long-name-that-exceeds-normal-limits.txt', 'text/plain')
      ];
      
      const executionTime = await measureExecutionTime(() => {
        files.forEach(file => validateFile(file));
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_BATCH);
    });

    it('should handle files with special characters in names', async () => {
      const specialNames = [
        'file with spaces.txt',
        'file-with-dashes.txt',
        'file_with_underscores.txt',
        'file.with.dots.txt',
        'file(with)parentheses.txt',
        'file[with]brackets.txt',
        'file{with}braces.txt'
      ];
      
      const files = specialNames.map(name => createMockFile(1, name, 'text/plain'));
      
      const executionTime = await measureExecutionTime(() => {
        files.forEach(file => validateFile(file));
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.VALIDATION_BATCH);
    });
  });
});