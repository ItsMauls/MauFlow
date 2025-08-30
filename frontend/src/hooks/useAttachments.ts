/**
 * useAttachments Hook
 * Manages task file attachments with local storage persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { TaskAttachment } from '@/types/attachments';
import { simulateFileUpload, downloadAttachment } from '@/lib/attachments';

interface UseAttachmentsReturn {
  attachments: TaskAttachment[];
  addAttachment: (taskId: string, file: File) => Promise<void>;
  removeAttachment: (attachmentId: string) => Promise<void>;
  downloadAttachment: (attachment: TaskAttachment) => void;
  isLoading: boolean;
  error: string | null;
}

const STORAGE_KEY = 'mauflow_task_attachments';

/**
 * Custom hook for managing task attachments
 */
export function useAttachments(taskId: string): UseAttachmentsReturn {
  const [attachments, setAttachments] = useState<TaskAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load attachments from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const allAttachments: TaskAttachment[] = JSON.parse(stored);
        const taskAttachments = allAttachments.filter(att => att.taskId === taskId);
        setAttachments(taskAttachments);
      }
    } catch (err) {
      console.error('Failed to load attachments from storage:', err);
      setError('Failed to load attachments');
    }
  }, [taskId]);

  // Save attachments to localStorage
  const saveToStorage = useCallback((newAttachments: TaskAttachment[]) => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      const allAttachments: TaskAttachment[] = stored ? JSON.parse(stored) : [];
      
      // Remove existing attachments for this task
      const otherAttachments = allAttachments.filter(att => att.taskId !== taskId);
      
      // Add new attachments
      const updatedAttachments = [...otherAttachments, ...newAttachments];
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedAttachments));
    } catch (err) {
      console.error('Failed to save attachments to storage:', err);
      throw new Error('Failed to save attachments');
    }
  }, [taskId]);

  // Add new attachment
  const addAttachment = useCallback(async (taskId: string, file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate file upload
      const newAttachment = await simulateFileUpload(file, taskId);
      
      const updatedAttachments = [...attachments, newAttachment];
      setAttachments(updatedAttachments);
      saveToStorage(updatedAttachments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [attachments, saveToStorage]);

  // Remove attachment
  const removeAttachment = useCallback(async (attachmentId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Find the attachment to remove
      const attachmentToRemove = attachments.find(att => att.id === attachmentId);
      if (!attachmentToRemove) {
        throw new Error('Attachment not found');
      }

      // Clean up the blob URL if it exists
      if (attachmentToRemove.downloadUrl.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentToRemove.downloadUrl);
      }
      if (attachmentToRemove.previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(attachmentToRemove.previewUrl);
      }

      const updatedAttachments = attachments.filter(att => att.id !== attachmentId);
      setAttachments(updatedAttachments);
      saveToStorage(updatedAttachments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove attachment';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [attachments, saveToStorage]);

  // Download attachment with tracking
  const handleDownloadAttachment = useCallback(async (attachment: TaskAttachment) => {
    try {
      await downloadAttachment(attachment);
      
      // Update download count
      const updatedAttachments = attachments.map(att => 
        att.id === attachment.id 
          ? { ...att, downloadCount: (att.downloadCount || 0) + 1 }
          : att
      );
      setAttachments(updatedAttachments);
      saveToStorage(updatedAttachments);
    } catch (err) {
      console.error('Failed to download attachment:', err);
      setError(err instanceof Error ? err.message : 'Failed to download attachment');
      throw err; // Re-throw for component handling
    }
  }, [attachments, saveToStorage]);

  return {
    attachments,
    addAttachment,
    removeAttachment,
    downloadAttachment: handleDownloadAttachment,
    isLoading,
    error
  };
}