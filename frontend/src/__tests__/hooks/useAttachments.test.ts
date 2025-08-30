/**
 * @jest-environment jsdom
 */

import { renderHook, act } from '@testing-library/react';
import { useAttachments } from '@/hooks/useAttachments';
import { TaskAttachment } from '@/types/attachments';
import * as attachmentLib from '@/lib/attachments';

// Mock the attachments library
jest.mock('@/lib/attachments');

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock URL.revokeObjectURL
Object.defineProperty(global, 'URL', {
  value: {
    revokeObjectURL: jest.fn()
  }
});

describe('useAttachments Hook', () => {
  const mockTaskId = 'test-task-1';
  const mockAttachment: TaskAttachment = {
    id: 'att-1',
    taskId: mockTaskId,
    fileName: 'test.txt',
    fileSize: 1024,
    fileType: 'text/plain',
    uploadedAt: '2024-01-01T00:00:00Z',
    downloadUrl: 'https://example.com/test.txt',
    isSecure: false,
    downloadCount: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  it('should initialize with empty attachments', () => {
    const { result } = renderHook(() => useAttachments(mockTaskId));

    expect(result.current.attachments).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should load attachments from localStorage on mount', () => {
    const storedAttachments = [
      mockAttachment,
      { ...mockAttachment, id: 'att-2', taskId: 'other-task' }
    ];
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAttachments));

    const { result } = renderHook(() => useAttachments(mockTaskId));

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0].id).toBe('att-1');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('mauflow_task_attachments');
  });

  it('should handle localStorage errors gracefully', () => {
    mockLocalStorage.getItem.mockImplementation(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useAttachments(mockTaskId));

    expect(result.current.attachments).toEqual([]);
    expect(result.current.error).toBe('Failed to load attachments');
  });

  it('should add attachment successfully', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockSimulateFileUpload = attachmentLib.simulateFileUpload as jest.Mock;
    mockSimulateFileUpload.mockResolvedValue(mockAttachment);

    const { result } = renderHook(() => useAttachments(mockTaskId));

    await act(async () => {
      await result.current.addAttachment(mockTaskId, mockFile);
    });

    expect(result.current.attachments).toHaveLength(1);
    expect(result.current.attachments[0]).toEqual(mockAttachment);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should handle add attachment failure', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockSimulateFileUpload = attachmentLib.simulateFileUpload as jest.Mock;
    mockSimulateFileUpload.mockRejectedValue(new Error('Upload failed'));

    const { result } = renderHook(() => useAttachments(mockTaskId));

    await act(async () => {
      try {
        await result.current.addAttachment(mockTaskId, mockFile);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.attachments).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Upload failed');
  });

  it('should remove attachment successfully', async () => {
    // Setup initial state with attachment
    const storedAttachments = [mockAttachment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAttachments));

    const { result } = renderHook(() => useAttachments(mockTaskId));

    expect(result.current.attachments).toHaveLength(1);

    await act(async () => {
      await result.current.removeAttachment('att-1');
    });

    expect(result.current.attachments).toHaveLength(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should handle remove attachment failure', async () => {
    const storedAttachments = [mockAttachment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAttachments));

    const { result } = renderHook(() => useAttachments(mockTaskId));

    await act(async () => {
      try {
        await result.current.removeAttachment('non-existent');
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Attachment not found');
  });

  it('should clean up blob URLs when removing attachments', async () => {
    const blobAttachment = {
      ...mockAttachment,
      downloadUrl: 'blob:mock-url',
      previewUrl: 'blob:preview-url'
    };
    
    const storedAttachments = [blobAttachment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAttachments));

    const { result } = renderHook(() => useAttachments(mockTaskId));

    await act(async () => {
      await result.current.removeAttachment('att-1');
    });

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview-url');
  });

  it('should download attachment and update download count', async () => {
    const mockDownloadAttachment = attachmentLib.downloadAttachment as jest.Mock;
    mockDownloadAttachment.mockResolvedValue(undefined);

    const storedAttachments = [mockAttachment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAttachments));

    const { result } = renderHook(() => useAttachments(mockTaskId));

    await act(async () => {
      await result.current.downloadAttachment(mockAttachment);
    });

    expect(mockDownloadAttachment).toHaveBeenCalledWith(mockAttachment);
    expect(result.current.attachments[0].downloadCount).toBe(1);
    expect(mockLocalStorage.setItem).toHaveBeenCalled();
  });

  it('should handle download failure', async () => {
    const mockDownloadAttachment = attachmentLib.downloadAttachment as jest.Mock;
    mockDownloadAttachment.mockRejectedValue(new Error('Download failed'));

    const storedAttachments = [mockAttachment];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAttachments));

    const { result } = renderHook(() => useAttachments(mockTaskId));

    await act(async () => {
      try {
        await result.current.downloadAttachment(mockAttachment);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Download failed');
  });

  it('should handle localStorage save errors', async () => {
    const mockFile = new File(['content'], 'test.txt', { type: 'text/plain' });
    const mockSimulateFileUpload = attachmentLib.simulateFileUpload as jest.Mock;
    mockSimulateFileUpload.mockResolvedValue(mockAttachment);

    mockLocalStorage.setItem.mockImplementation(() => {
      throw new Error('Storage full');
    });

    const { result } = renderHook(() => useAttachments(mockTaskId));

    await act(async () => {
      try {
        await result.current.addAttachment(mockTaskId, mockFile);
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe('Failed to save attachments');
  });

  it('should filter attachments by task ID', () => {
    const storedAttachments = [
      mockAttachment,
      { ...mockAttachment, id: 'att-2', taskId: 'other-task' },
      { ...mockAttachment, id: 'att-3', taskId: mockTaskId }
    ];
    
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedAttachments));

    const { result } = renderHook(() => useAttachments(mockTaskId));

    expect(result.current.attachments).toHaveLength(2);
    expect(result.current.attachments.every(att => att.taskId === mockTaskId)).toBe(true);
  });

  it('should maintain attachment order', async () => {
    const mockFile1 = new File(['content1'], 'test1.txt', { type: 'text/plain' });
    const mockFile2 = new File(['content2'], 'test2.txt', { type: 'text/plain' });
    
    const mockAttachment1 = { ...mockAttachment, id: 'att-1', fileName: 'test1.txt' };
    const mockAttachment2 = { ...mockAttachment, id: 'att-2', fileName: 'test2.txt' };

    const mockSimulateFileUpload = attachmentLib.simulateFileUpload as jest.Mock;
    mockSimulateFileUpload
      .mockResolvedValueOnce(mockAttachment1)
      .mockResolvedValueOnce(mockAttachment2);

    const { result } = renderHook(() => useAttachments(mockTaskId));

    await act(async () => {
      await result.current.addAttachment(mockTaskId, mockFile1);
    });

    await act(async () => {
      await result.current.addAttachment(mockTaskId, mockFile2);
    });

    expect(result.current.attachments).toHaveLength(2);
    expect(result.current.attachments[0].fileName).toBe('test1.txt');
    expect(result.current.attachments[1].fileName).toBe('test2.txt');
  });
});