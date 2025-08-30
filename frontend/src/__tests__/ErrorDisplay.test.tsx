/**
 * Error Display Component Tests
 * Tests for error display components and user interaction
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  ErrorDisplay,
  InlineError,
  ValidationErrors,
  CollaborationErrorBoundary
} from '@/components/ui/ErrorDisplay';
import { createCollaborationError } from '@/lib/errorHandling';

// Mock the error handling utilities
jest.mock('@/lib/errorHandling', () => ({
  ...jest.requireActual('@/lib/errorHandling'),
  getErrorRecoverySuggestions: jest.fn(() => [
    'Check your internet connection',
    'Try again in a few moments'
  ])
}));

describe('ErrorDisplay Components', () => {
  describe('ErrorDisplay', () => {
    const mockError = createCollaborationError(
      'network_error',
      'NETWORK_UNAVAILABLE',
      'Network connection failed',
      { originalError: 'fetch failed' }
    );

    it('should render error message', () => {
      render(<ErrorDisplay error={mockError} />);
      
      expect(screen.getByText('Network connection failed')).toBeInTheDocument();
    });

    it('should show error icon based on type', () => {
      render(<ErrorDisplay error={mockError} />);
      
      // Network error should show network icon
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
    });

    it('should show retry button for retryable errors', () => {
      const onRetry = jest.fn();
      render(<ErrorDisplay error={mockError} onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Retry');
      expect(retryButton).toBeInTheDocument();
      expect(retryButton).not.toBeDisabled();
    });

    it('should not show retry button for non-retryable errors', () => {
      const nonRetryableError = createCollaborationError(
        'permission_denied',
        'DELEGATION_PERMISSION_DENIED'
      );
      
      render(<ErrorDisplay error={nonRetryableError} />);
      
      expect(screen.queryByText('Retry')).not.toBeInTheDocument();
    });

    it('should call onRetry when retry button is clicked', async () => {
      const onRetry = jest.fn().mockResolvedValue(undefined);
      render(<ErrorDisplay error={mockError} onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      expect(onRetry).toHaveBeenCalledTimes(1);
      
      // Button should be disabled during retry
      expect(retryButton).toBeDisabled();
      
      await waitFor(() => {
        expect(retryButton).not.toBeDisabled();
      });
    });

    it('should show dismiss button when onDismiss is provided', () => {
      const onDismiss = jest.fn();
      render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      expect(dismissButton).toBeInTheDocument();
    });

    it('should call onDismiss when dismiss button is clicked', () => {
      const onDismiss = jest.fn();
      render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);
      
      const dismissButton = screen.getByRole('button', { name: /dismiss/i });
      fireEvent.click(dismissButton);
      
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('should show recovery suggestions when enabled', () => {
      render(<ErrorDisplay error={mockError} showSuggestions={true} />);
      
      expect(screen.getByText('Try these solutions:')).toBeInTheDocument();
      expect(screen.getByText('Check your internet connection')).toBeInTheDocument();
      expect(screen.getByText('Try again in a few moments')).toBeInTheDocument();
    });

    it('should hide recovery suggestions when disabled', () => {
      render(<ErrorDisplay error={mockError} showSuggestions={false} />);
      
      expect(screen.queryByText('Try these solutions:')).not.toBeInTheDocument();
    });

    it('should show error details when clicked', () => {
      render(<ErrorDisplay error={mockError} />);
      
      const showDetailsButton = screen.getByText('Show details');
      fireEvent.click(showDetailsButton);
      
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      expect(screen.getByText('network_error')).toBeInTheDocument();
      expect(screen.getByText('NETWORK_UNAVAILABLE')).toBeInTheDocument();
      expect(screen.getByText('fetch failed')).toBeInTheDocument();
    });

    it('should hide error details when clicked again', () => {
      render(<ErrorDisplay error={mockError} />);
      
      const showDetailsButton = screen.getByText('Show details');
      fireEvent.click(showDetailsButton);
      
      expect(screen.getByText('Error Details')).toBeInTheDocument();
      
      const hideDetailsButton = screen.getByText('Hide details');
      fireEvent.click(hideDetailsButton);
      
      expect(screen.queryByText('Error Details')).not.toBeInTheDocument();
    });

    it('should render as toast variant', () => {
      const { container } = render(
        <ErrorDisplay error={mockError} variant="toast" />
      );
      
      expect(container.firstChild).toHaveClass('fixed', 'top-4', 'right-4');
    });

    it('should render as modal variant', () => {
      const { container } = render(
        <ErrorDisplay error={mockError} variant="modal" />
      );
      
      expect(container.firstChild).toHaveClass('fixed', 'inset-0', 'z-50');
    });
  });

  describe('InlineError', () => {
    it('should render error message with icon', () => {
      render(<InlineError message="This is an error" />);
      
      expect(screen.getByText('This is an error')).toBeInTheDocument();
      
      // Should have error icon
      const icon = screen.getByRole('img', { hidden: true });
      expect(icon).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <InlineError message="Test error" className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('ValidationErrors', () => {
    it('should render error messages', () => {
      const errors = ['Error 1', 'Error 2'];
      render(<ValidationErrors errors={errors} />);
      
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Error 2')).toBeInTheDocument();
    });

    it('should render warning messages', () => {
      const warnings = ['Warning 1', 'Warning 2'];
      render(<ValidationErrors errors={[]} warnings={warnings} />);
      
      expect(screen.getByText('Warning 1')).toBeInTheDocument();
      expect(screen.getByText('Warning 2')).toBeInTheDocument();
    });

    it('should render both errors and warnings', () => {
      const errors = ['Error 1'];
      const warnings = ['Warning 1'];
      render(<ValidationErrors errors={errors} warnings={warnings} />);
      
      expect(screen.getByText('Error 1')).toBeInTheDocument();
      expect(screen.getByText('Warning 1')).toBeInTheDocument();
    });

    it('should not render when no errors or warnings', () => {
      const { container } = render(<ValidationErrors errors={[]} warnings={[]} />);
      
      expect(container.firstChild).toBeNull();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <ValidationErrors errors={['Test error']} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('CollaborationErrorBoundary', () => {
    // Mock console.error to avoid noise in tests
    const originalError = console.error;
    beforeAll(() => {
      console.error = jest.fn();
    });
    
    afterAll(() => {
      console.error = originalError;
    });

    const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div>No error</div>;
    };

    it('should render children when no error', () => {
      render(
        <CollaborationErrorBoundary>
          <ThrowError shouldThrow={false} />
        </CollaborationErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });

    it('should catch and display error', () => {
      render(
        <CollaborationErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CollaborationErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong with the collaboration features')).toBeInTheDocument();
    });

    it('should use custom fallback component', () => {
      const CustomFallback = ({ error }: { error: Error }) => (
        <div>Custom error: {error.message}</div>
      );
      
      render(
        <CollaborationErrorBoundary fallback={CustomFallback}>
          <ThrowError shouldThrow={true} />
        </CollaborationErrorBoundary>
      );
      
      expect(screen.getByText('Custom error: Test error')).toBeInTheDocument();
    });

    it('should reset error state when dismiss is clicked', () => {
      const { rerender } = render(
        <CollaborationErrorBoundary>
          <ThrowError shouldThrow={true} />
        </CollaborationErrorBoundary>
      );
      
      expect(screen.getByText('Something went wrong with the collaboration features')).toBeInTheDocument();
      
      // Click dismiss button (close button)
      const dismissButton = screen.getByRole('button');
      fireEvent.click(dismissButton);
      
      // Re-render with no error
      rerender(
        <CollaborationErrorBoundary>
          <ThrowError shouldThrow={false} />
        </CollaborationErrorBoundary>
      );
      
      expect(screen.getByText('No error')).toBeInTheDocument();
    });
  });

  describe('Error Icon Types', () => {
    it('should show permission icon for permission errors', () => {
      const permissionError = createCollaborationError(
        'permission_denied',
        'DELEGATION_PERMISSION_DENIED'
      );
      
      render(<ErrorDisplay error={permissionError} />);
      
      // Should render without throwing
      expect(screen.getByText(permissionError.userMessage)).toBeInTheDocument();
    });

    it('should show user icon for user not found errors', () => {
      const userError = createCollaborationError(
        'user_not_found',
        'USER_NOT_FOUND'
      );
      
      render(<ErrorDisplay error={userError} />);
      
      expect(screen.getByText(userError.userMessage)).toBeInTheDocument();
    });

    it('should show storage icon for storage errors', () => {
      const storageError = createCollaborationError(
        'storage_error',
        'STORAGE_QUOTA_EXCEEDED'
      );
      
      render(<ErrorDisplay error={storageError} />);
      
      expect(screen.getByText(storageError.userMessage)).toBeInTheDocument();
    });

    it('should show default icon for unknown error types', () => {
      const unknownError = createCollaborationError(
        'validation_error',
        'INVALID_DELEGATION_DATA'
      );
      
      render(<ErrorDisplay error={unknownError} />);
      
      expect(screen.getByText(unknownError.userMessage)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      const onDismiss = jest.fn();
      render(<ErrorDisplay error={mockError} onDismiss={onDismiss} />);
      
      // Dismiss button should be accessible
      const dismissButton = screen.getByRole('button');
      expect(dismissButton).toBeInTheDocument();
    });

    it('should support keyboard navigation', () => {
      const onRetry = jest.fn();
      const onDismiss = jest.fn();
      render(<ErrorDisplay error={mockError} onRetry={onRetry} onDismiss={onDismiss} />);
      
      const retryButton = screen.getByText('Retry');
      const dismissButton = screen.getByText('Dismiss');
      
      // Both buttons should be focusable
      retryButton.focus();
      expect(document.activeElement).toBe(retryButton);
      
      dismissButton.focus();
      expect(document.activeElement).toBe(dismissButton);
    });

    it('should announce retry state to screen readers', async () => {
      const onRetry = jest.fn().mockResolvedValue(undefined);
      render(<ErrorDisplay error={mockError} onRetry={onRetry} />);
      
      const retryButton = screen.getByText('Retry');
      fireEvent.click(retryButton);
      
      // Button should indicate loading state
      expect(retryButton).toBeDisabled();
      
      await waitFor(() => {
        expect(retryButton).not.toBeDisabled();
      });
    });
  });
});