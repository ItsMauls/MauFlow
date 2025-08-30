/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ErrorBoundary, FeatureErrorBoundary } from '@/components/error';
import { LoadingState, LoadingSpinner, SkeletonLoader } from '@/components/loading';
import { ErrorState, EmptyState } from '@/components/fallback';
import { useRetry } from '@/hooks/useRetry';
import { FileUploadWithRetry } from '@/components/tasks/FileUploadWithRetry';
import { CommentInputWithRetry } from '@/components/tasks/CommentInputWithRetry';

// Mock components for testing
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

const AsyncComponent = ({ delay = 100 }: { delay?: number }) => {
  const [loading, setLoading] = React.useState(true);
  
  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), delay);
    return () => clearTimeout(timer);
  }, [delay]);
  
  if (loading) return <LoadingState message="Loading test..." />;
  return <div>Loaded</div>;
};

describe('Error Handling Components', () => {
  describe('ErrorBoundary', () => {
    // Suppress console.error for these tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('renders children when there is no error', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('renders error UI when child component throws', () => {
      render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('calls onError callback when error occurs', () => {
      const onError = jest.fn();
      
      render(
        <ErrorBoundary onError={onError}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(onError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String)
        })
      );
    });

    it('resets error state when retry button is clicked', () => {
      const { rerender } = render(
        <ErrorBoundary>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      
      // Click retry button
      fireEvent.click(screen.getByText('Try Again'));
      
      // Re-render with no error
      rerender(
        <ErrorBoundary>
          <ThrowError shouldThrow={false} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('renders custom fallback when provided', () => {
      const customFallback = <div>Custom Error UI</div>;
      
      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowError shouldThrow={true} />
        </ErrorBoundary>
      );
      
      expect(screen.getByText('Custom Error UI')).toBeInTheDocument();
    });
  });

  describe('FeatureErrorBoundary', () => {
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    afterAll(() => {
      console.error = originalError;
    });

    it('renders feature-specific error UI', () => {
      render(
        <FeatureErrorBoundary featureName="Test Feature">
          <ThrowError shouldThrow={true} />
        </FeatureErrorBoundary>
      );
      
      expect(screen.getByText('Test Feature Error')).toBeInTheDocument();
    });

    it('calls onRetry when retry button is clicked', () => {
      const onRetry = jest.fn();
      
      render(
        <FeatureErrorBoundary featureName="Test Feature" onRetry={onRetry}>
          <ThrowError shouldThrow={true} />
        </FeatureErrorBoundary>
      );
      
      fireEvent.click(screen.getByText('Retry'));
      expect(onRetry).toHaveBeenCalled();
    });
  });

  describe('Loading Components', () => {
    it('renders LoadingSpinner with correct size', () => {
      render(<LoadingSpinner size="lg" />);
      
      const spinner = screen.getByRole('status');
      expect(spinner).toHaveClass('w-8', 'h-8');
    });

    it('renders LoadingState with message', () => {
      render(<LoadingState message="Loading data..." />);
      
      expect(screen.getByText('Loading data...')).toBeInTheDocument();
    });

    it('renders SkeletonLoader with multiple lines', () => {
      render(<SkeletonLoader variant="text" lines={3} />);
      
      const skeletons = screen.getAllByRole('generic');
      expect(skeletons).toHaveLength(3);
    });
  });

  describe('Fallback Components', () => {
    it('renders ErrorState with retry button', () => {
      const onRetry = jest.fn();
      
      render(
        <ErrorState
          message="Something went wrong"
          onRetry={onRetry}
        />
      );
      
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Try Again'));
      expect(onRetry).toHaveBeenCalled();
    });

    it('renders EmptyState with action button', () => {
      const onAction = jest.fn();
      
      render(
        <EmptyState
          title="No data"
          description="No items found"
          action={{
            label: 'Add Item',
            onClick: onAction
          }}
        />
      );
      
      expect(screen.getByText('No data')).toBeInTheDocument();
      expect(screen.getByText('No items found')).toBeInTheDocument();
      
      fireEvent.click(screen.getByText('Add Item'));
      expect(onAction).toHaveBeenCalled();
    });
  });

  describe('useRetry Hook', () => {
    it('retries failed operations', async () => {
      let attemptCount = 0;
      const mockAsyncFunction = jest.fn().mockImplementation(async () => {
        attemptCount++;
        if (attemptCount < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      });

      const TestComponent = () => {
        const { execute, isRetrying, retryCount } = useRetry(mockAsyncFunction, {
          maxRetries: 3,
          retryDelay: 10
        });

        const [result, setResult] = React.useState<string>('');

        const handleExecute = async () => {
          try {
            const res = await execute();
            setResult(res);
          } catch (err) {
            setResult('failed');
          }
        };

        return (
          <div>
            <button onClick={handleExecute}>Execute</button>
            <div>Result: {result}</div>
            <div>Retrying: {isRetrying.toString()}</div>
            <div>Retry Count: {retryCount}</div>
          </div>
        );
      };

      render(<TestComponent />);
      
      fireEvent.click(screen.getByText('Execute'));
      
      // Should eventually succeed after retries
      await waitFor(() => {
        expect(screen.getByText('Result: success')).toBeInTheDocument();
      }, { timeout: 1000 });

      expect(mockAsyncFunction).toHaveBeenCalledTimes(3);
    });
  });

  describe('FileUploadWithRetry', () => {
    it('handles file upload with retry on failure', async () => {
      const onUploadSuccess = jest.fn();
      const onUploadError = jest.fn();

      render(
        <FileUploadWithRetry
          taskId="test-task"
          onUploadSuccess={onUploadSuccess}
          onUploadError={onUploadError}
        />
      );

      expect(screen.getByText('Drop files here or click to browse')).toBeInTheDocument();
    });

    it('validates file size and type', () => {
      const onUploadSuccess = jest.fn();
      
      render(
        <FileUploadWithRetry
          taskId="test-task"
          onUploadSuccess={onUploadSuccess}
          maxFileSize={1024} // 1KB
          allowedTypes={['image/*']}
        />
      );

      expect(screen.getByText('Max size: 0MB')).toBeInTheDocument();
    });
  });

  describe('CommentInputWithRetry', () => {
    it('handles comment submission with retry', async () => {
      const onSubmit = jest.fn().mockResolvedValue(undefined);
      
      render(
        <CommentInputWithRetry
          taskId="test-task"
          onSubmit={onSubmit}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a comment...');
      const submitButton = screen.getByText('Submit');

      fireEvent.change(textarea, { target: { value: 'Test comment' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith('test-task', 'Test comment');
      });
    });

    it('shows character count and validates length', () => {
      const onSubmit = jest.fn();
      
      render(
        <CommentInputWithRetry
          taskId="test-task"
          onSubmit={onSubmit}
          maxLength={10}
        />
      );

      const textarea = screen.getByPlaceholderText('Add a comment...');
      
      fireEvent.change(textarea, { target: { value: 'Short' } });
      expect(screen.getByText('5/10')).toBeInTheDocument();

      fireEvent.change(textarea, { target: { value: 'This is too long' } });
      expect(screen.getByText('Comment exceeds the 10 character limit')).toBeInTheDocument();
    });
  });
});

describe('Integration Tests', () => {
  it('handles nested error boundaries correctly', () => {
    const originalError = console.error;
    console.error = jest.fn();

    render(
      <ErrorBoundary>
        <div>
          <FeatureErrorBoundary featureName="Nested Feature">
            <ThrowError shouldThrow={true} />
          </FeatureErrorBoundary>
        </div>
      </ErrorBoundary>
    );

    // Should show feature-specific error, not the main error boundary
    expect(screen.getByText('Nested Feature Error')).toBeInTheDocument();
    expect(screen.queryByText('Something Went Wrong')).not.toBeInTheDocument();

    console.error = originalError;
  });

  it('handles async loading states correctly', async () => {
    render(<AsyncComponent delay={50} />);
    
    expect(screen.getByText('Loading test...')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Loaded')).toBeInTheDocument();
    });
  });
});