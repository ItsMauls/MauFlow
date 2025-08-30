/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { EnhancedTaskCard } from '@/components/tasks/EnhancedTaskCard';
import { Task } from '@/components/tasks/TaskCard';

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

// Mock file APIs
Object.defineProperty(global, 'File', {
  value: class MockFile {
    constructor(public parts: any[], public name: string, public options: any = {}) {
      this.type = options.type || '';
      this.size = parts.reduce((acc, part) => acc + part.length, 0);
    }
    type: string;
    size: number;
  }
});

Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'blob:mock-url'),
    revokeObjectURL: jest.fn()
  }
});

// Mock DOM methods
Object.defineProperty(document, 'createElement', {
  value: jest.fn((tagName) => {
    if (tagName === 'a') {
      return {
        href: '',
        download: '',
        style: { display: '' },
        click: jest.fn()
      };
    }
    return document.createElement(tagName);
  })
});

const mockTask: Task = {
  id: 'task-1',
  title: 'Complete Project Documentation',
  status: 'todo',
  priority: 'high',
  createdAt: '2024-01-01T00:00:00Z',
  description: 'Write comprehensive documentation for the project including API docs and user guides'
};

describe('Task Enhancement End-to-End Flow', () => {
  let user: ReturnType<typeof userEvent.setup>;

  beforeEach(() => {
    jest.clearAllMocks();
    user = userEvent.setup();
    
    // Setup localStorage mocks
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'mauflow_comments') return JSON.stringify([]);
      if (key === 'mauflow_task_attachments') return JSON.stringify([]);
      return null;
    });
  });

  it('should complete full task enhancement workflow', async () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // 1. Verify initial task display
    expect(screen.getByText('Complete Project Documentation')).toBeInTheDocument();
    expect(screen.getByText('Write comprehensive documentation')).toBeInTheDocument();

    // 2. Add first comment
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    await user.type(commentInput, 'Started working on the API documentation');
    
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Started working on the API documentation')).toBeInTheDocument();
    });

    // 3. Add file attachment
    const fileInput = screen.getByLabelText('File upload');
    const mockFile = new File(['API documentation content'], 'api-docs.md', { type: 'text/markdown' });
    
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByText('api-docs.md')).toBeInTheDocument();
    });

    // 4. Add second comment with reference to attachment
    await user.type(commentInput, 'Uploaded the initial API documentation draft');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Uploaded the initial API documentation draft')).toBeInTheDocument();
    });

    // 5. Add image attachment
    const imageFile = new File(['image data'], 'architecture-diagram.png', { type: 'image/png' });
    await user.upload(fileInput, imageFile);

    await waitFor(() => {
      expect(screen.getByText('architecture-diagram.png')).toBeInTheDocument();
    });

    // 6. Edit existing comment
    const editButtons = screen.getAllByLabelText('Edit comment');
    await user.click(editButtons[0]);

    const editInput = screen.getByDisplayValue('Started working on the API documentation');
    await user.clear(editInput);
    await user.type(editInput, 'Completed the API documentation section');

    const saveButton = screen.getByText('Save');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Completed the API documentation section')).toBeInTheDocument();
    });

    // 7. Preview image attachment
    const previewButtons = screen.getAllByLabelText('Preview');
    const imagePreviewButton = previewButtons.find(button => 
      button.closest('[data-testid="attachment-item"]')?.textContent?.includes('architecture-diagram.png')
    );
    
    if (imagePreviewButton) {
      await user.click(imagePreviewButton);
      
      await waitFor(() => {
        expect(screen.getByTestId('file-preview-modal')).toBeInTheDocument();
      });

      // Close preview
      const closeButton = screen.getByLabelText('Close preview');
      await user.click(closeButton);
    }

    // 8. Download file attachment
    const downloadButtons = screen.getAllByLabelText('Download');
    await user.click(downloadButtons[0]);

    // Verify download was triggered (mocked)
    expect(document.createElement).toHaveBeenCalledWith('a');

    // 9. Add final comment
    await user.type(commentInput, 'Documentation is complete and ready for review');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Documentation is complete and ready for review')).toBeInTheDocument();
    });

    // 10. Verify final state
    expect(screen.getByText('Comments (3)')).toBeInTheDocument();
    expect(screen.getByText('Attachments (2)')).toBeInTheDocument();
    
    // Verify all comments are present
    expect(screen.getByText('Completed the API documentation section')).toBeInTheDocument();
    expect(screen.getByText('Uploaded the initial API documentation draft')).toBeInTheDocument();
    expect(screen.getByText('Documentation is complete and ready for review')).toBeInTheDocument();
    
    // Verify all attachments are present
    expect(screen.getByText('api-docs.md')).toBeInTheDocument();
    expect(screen.getByText('architecture-diagram.png')).toBeInTheDocument();
  });

  it('should handle error recovery workflow', async () => {
    // Mock localStorage to throw error initially
    let shouldThrowError = true;
    mockLocalStorage.setItem.mockImplementation(() => {
      if (shouldThrowError) {
        throw new Error('Storage quota exceeded');
      }
    });

    render(<EnhancedTaskCard task={mockTask} />);

    // Try to add comment (should fail)
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    await user.type(commentInput, 'This comment should fail initially');
    
    const submitButton = screen.getByText('Submit');
    await user.click(submitButton);

    // Should show error
    await waitFor(() => {
      expect(screen.getByText(/failed to save/i)).toBeInTheDocument();
    });

    // Fix the storage issue
    shouldThrowError = false;
    mockLocalStorage.setItem.mockImplementation(() => {});

    // Retry the operation
    const retryButton = screen.getByText('Try Again');
    await user.click(retryButton);

    // Should succeed now
    await waitFor(() => {
      expect(screen.getByText('This comment should fail initially')).toBeInTheDocument();
    });
  });

  it('should handle file upload validation and retry', async () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // Try to upload file that's too large
    const fileInput = screen.getByLabelText('File upload');
    const largeFile = new File(['x'.repeat(10000000)], 'large-file.txt', { type: 'text/plain' });
    
    await user.upload(fileInput, largeFile);

    // Should show validation error
    await waitFor(() => {
      expect(screen.getByText(/file size exceeds/i)).toBeInTheDocument();
    });

    // Upload valid file
    const validFile = new File(['valid content'], 'valid-file.txt', { type: 'text/plain' });
    await user.upload(fileInput, validFile);

    await waitFor(() => {
      expect(screen.getByText('valid-file.txt')).toBeInTheDocument();
    });
  });

  it('should handle concurrent operations gracefully', async () => {
    render(<EnhancedTaskCard task={mockTask} />);

    const commentInput = screen.getByPlaceholderText('Add a comment...');
    const submitButton = screen.getByText('Submit');
    const fileInput = screen.getByLabelText('File upload');

    // Start multiple operations simultaneously
    const operations = [
      // Add comment
      user.type(commentInput, 'First comment').then(() => user.click(submitButton)),
      
      // Upload file
      user.upload(fileInput, new File(['content1'], 'file1.txt', { type: 'text/plain' })),
      
      // Add another comment after clearing
      user.clear(commentInput).then(() => 
        user.type(commentInput, 'Second comment').then(() => user.click(submitButton))
      ),
      
      // Upload another file
      user.upload(fileInput, new File(['content2'], 'file2.txt', { type: 'text/plain' }))
    ];

    await Promise.all(operations);

    // Verify all operations completed
    await waitFor(() => {
      expect(screen.getByText('First comment')).toBeInTheDocument();
      expect(screen.getByText('Second comment')).toBeInTheDocument();
      expect(screen.getByText('file1.txt')).toBeInTheDocument();
      expect(screen.getByText('file2.txt')).toBeInTheDocument();
    });
  });

  it('should handle drag and drop file upload workflow', async () => {
    render(<EnhancedTaskCard task={mockTask} />);

    const uploadArea = screen.getByText('Drop files here or click to browse');
    const mockFile = new File(['dragged content'], 'dragged-file.txt', { type: 'text/plain' });

    // Simulate drag enter
    fireEvent.dragEnter(uploadArea, {
      dataTransfer: {
        items: [{ kind: 'file', type: 'text/plain' }]
      }
    });

    // Should show drag over state
    expect(uploadArea).toHaveClass('border-blue-400');

    // Simulate drop
    fireEvent.drop(uploadArea, {
      dataTransfer: {
        files: [mockFile]
      }
    });

    await waitFor(() => {
      expect(screen.getByText('dragged-file.txt')).toBeInTheDocument();
    });
  });

  it('should handle comment editing and deletion workflow', async () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // Add initial comment
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    await user.type(commentInput, 'Initial comment to be edited');
    await user.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByText('Initial comment to be edited')).toBeInTheDocument();
    });

    // Edit the comment
    const editButton = screen.getByLabelText('Edit comment');
    await user.click(editButton);

    const editInput = screen.getByDisplayValue('Initial comment to be edited');
    await user.clear(editInput);
    await user.type(editInput, 'Edited comment content');
    await user.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Edited comment content')).toBeInTheDocument();
      expect(screen.queryByText('Initial comment to be edited')).not.toBeInTheDocument();
    });

    // Delete the comment
    const deleteButton = screen.getByLabelText('Delete comment');
    await user.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByText('Delete');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText('Edited comment content')).not.toBeInTheDocument();
    });
  });

  it('should handle attachment removal workflow', async () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // Upload file
    const fileInput = screen.getByLabelText('File upload');
    const mockFile = new File(['content to be removed'], 'file-to-remove.txt', { type: 'text/plain' });
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByText('file-to-remove.txt')).toBeInTheDocument();
    });

    // Remove the file
    const removeButton = screen.getByLabelText('Remove');
    await user.click(removeButton);

    // Confirm removal
    const confirmButton = screen.getByText('Remove');
    await user.click(confirmButton);

    await waitFor(() => {
      expect(screen.queryByText('file-to-remove.txt')).not.toBeInTheDocument();
    });
  });

  it('should handle expandable sections workflow', async () => {
    render(<EnhancedTaskCard task={mockTask} />);

    // Add comment and attachment first
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    await user.type(commentInput, 'Test comment for expansion');
    await user.click(screen.getByText('Submit'));

    const fileInput = screen.getByLabelText('File upload');
    const mockFile = new File(['test content'], 'test-file.txt', { type: 'text/plain' });
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByText('Test comment for expansion')).toBeInTheDocument();
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });

    // Collapse comments section
    const commentsHeader = screen.getByText('Comments (1)');
    await user.click(commentsHeader);

    await waitFor(() => {
      expect(screen.queryByText('Test comment for expansion')).not.toBeInTheDocument();
    });

    // Expand comments section
    await user.click(commentsHeader);

    await waitFor(() => {
      expect(screen.getByText('Test comment for expansion')).toBeInTheDocument();
    });

    // Collapse attachments section
    const attachmentsHeader = screen.getByText('Attachments (1)');
    await user.click(attachmentsHeader);

    await waitFor(() => {
      expect(screen.queryByText('test-file.txt')).not.toBeInTheDocument();
    });

    // Expand attachments section
    await user.click(attachmentsHeader);

    await waitFor(() => {
      expect(screen.getByText('test-file.txt')).toBeInTheDocument();
    });
  });

  it('should persist data across component remounts', async () => {
    const { unmount, rerender } = render(<EnhancedTaskCard task={mockTask} />);

    // Add comment and attachment
    const commentInput = screen.getByPlaceholderText('Add a comment...');
    await user.type(commentInput, 'Persistent comment');
    await user.click(screen.getByText('Submit'));

    const fileInput = screen.getByLabelText('File upload');
    const mockFile = new File(['persistent content'], 'persistent-file.txt', { type: 'text/plain' });
    await user.upload(fileInput, mockFile);

    await waitFor(() => {
      expect(screen.getByText('Persistent comment')).toBeInTheDocument();
      expect(screen.getByText('persistent-file.txt')).toBeInTheDocument();
    });

    // Unmount and remount component
    unmount();
    
    // Mock localStorage to return saved data
    mockLocalStorage.getItem.mockImplementation((key) => {
      if (key === 'mauflow_comments') {
        return JSON.stringify([{
          id: 'comment-1',
          taskId: 'task-1',
          content: 'Persistent comment',
          author: 'Current User',
          createdAt: new Date().toISOString()
        }]);
      }
      if (key === 'mauflow_task_attachments') {
        return JSON.stringify([{
          id: 'att-1',
          taskId: 'task-1',
          fileName: 'persistent-file.txt',
          fileSize: 1024,
          fileType: 'text/plain',
          uploadedAt: new Date().toISOString(),
          downloadUrl: 'blob:mock-url',
          isSecure: false,
          downloadCount: 0
        }]);
      }
      return null;
    });

    rerender(<EnhancedTaskCard task={mockTask} />);

    // Verify data persisted
    await waitFor(() => {
      expect(screen.getByText('Persistent comment')).toBeInTheDocument();
      expect(screen.getByText('persistent-file.txt')).toBeInTheDocument();
    });
  });
});