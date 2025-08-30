# Error Handling System

This document describes the comprehensive error handling system implemented for the MauFlow application, covering error boundaries, loading states, fallback UI components, and retry mechanisms.

## Overview

The error handling system provides:
- **Error Boundaries**: Catch and handle JavaScript errors in React components
- **Loading States**: Consistent loading indicators and skeleton loaders
- **Fallback UI**: User-friendly error and empty state components
- **Retry Mechanisms**: Automatic retry logic for failed operations
- **Feature-Specific Error Handling**: Contextual error handling for different features

## Components

### Error Boundaries

#### ErrorBoundary
Main error boundary component that catches JavaScript errors anywhere in the child component tree.

```tsx
import { ErrorBoundary } from '@/components/error';

<ErrorBoundary
  onError={(error, errorInfo) => {
    // Custom error handling
    console.error('Error:', error, errorInfo);
  }}
  resetOnPropsChange={true}
  resetKeys={['userId', 'projectId']}
>
  <YourComponent />
</ErrorBoundary>
```

**Features:**
- Automatic error catching and display
- Custom error reporting callbacks
- Reset functionality with prop changes
- Technical details toggle
- Copy error details to clipboard

#### FeatureErrorBoundary
Feature-specific error boundary for contextual error handling.

```tsx
import { FeatureErrorBoundary } from '@/components/error';

<FeatureErrorBoundary 
  featureName="Calendar View"
  onRetry={() => refetchData()}
  fallbackMessage="Calendar data could not be loaded."
>
  <CalendarComponent />
</FeatureErrorBoundary>
```

**Features:**
- Feature-specific error messages
- Custom retry handlers
- Contextual fallback UI
- Automatic error logging with feature context

### Loading Components

#### LoadingSpinner
Reusable loading spinner with different sizes and colors.

```tsx
import { LoadingSpinner } from '@/components/loading';

<LoadingSpinner size="lg" color="primary" />
```

#### LoadingState
Generic loading state component with message and optional card wrapper.

```tsx
import { LoadingState } from '@/components/loading';

<LoadingState 
  message="Loading calendar events..." 
  size="lg" 
  showCard={true}
/>
```

#### SkeletonLoader
Skeleton loader for better loading UX.

```tsx
import { SkeletonLoader } from '@/components/loading';

<SkeletonLoader variant="text" lines={3} />
<SkeletonLoader variant="rectangular" width={200} height={100} />
<SkeletonLoader variant="circular" width={40} height={40} />
```

### Fallback Components

#### ErrorState
Displays error information with retry and dismiss options.

```tsx
import { ErrorState } from '@/components/fallback';

<ErrorState
  title="Upload Failed"
  message="The file could not be uploaded"
  error={error}
  onRetry={() => retryUpload()}
  onDismiss={() => clearError()}
  showDetails={true}
/>
```

#### EmptyState
Shows empty state with optional action button.

```tsx
import { EmptyState } from '@/components/fallback';

<EmptyState
  title="No Comments"
  description="Be the first to add a comment"
  action={{
    label: 'Add Comment',
    onClick: () => openCommentInput()
  }}
/>
```

## Hooks

### useRetry
Custom hook for implementing retry logic with exponential backoff.

```tsx
import { useRetry } from '@/hooks/useRetry';

const { execute, isRetrying, retryCount, lastError, reset } = useRetry(
  asyncFunction,
  {
    maxRetries: 3,
    retryDelay: 1000,
    backoffMultiplier: 2,
    onRetry: (attempt, error) => {
      console.log(`Retry attempt ${attempt}:`, error);
    },
    onMaxRetriesReached: (error) => {
      console.error('All retries failed:', error);
    }
  }
);
```

**Features:**
- Configurable retry attempts and delays
- Exponential backoff
- Retry callbacks
- State management for retry status

## Enhanced Components

### FileUploadWithRetry
File upload component with comprehensive error handling and retry mechanism.

```tsx
import { FileUploadWithRetry } from '@/components/tasks';

<FileUploadWithRetry
  taskId="task-123"
  onUploadSuccess={(attachment) => handleSuccess(attachment)}
  onUploadError={(error) => handleError(error)}
  maxFileSize={10 * 1024 * 1024} // 10MB
  allowedTypes={['image/*', 'application/pdf']}
/>
```

**Features:**
- File validation (size, type)
- Upload progress indication
- Automatic retry on failure
- Drag and drop support
- Error state display

### CommentInputWithRetry
Comment input component with retry mechanism for submission failures.

```tsx
import { CommentInputWithRetry } from '@/components/tasks';

<CommentInputWithRetry
  taskId="task-123"
  onSubmit={async (taskId, content) => {
    await submitComment(taskId, content);
  }}
  maxLength={1000}
/>
```

**Features:**
- Character count validation
- Automatic retry on submission failure
- Optimistic updates
- Error state handling
- Content preservation on failure

## Implementation Guidelines

### 1. Error Boundary Placement

Place error boundaries at strategic levels:

```tsx
// App level - catches all errors
<ErrorBoundary>
  <App />
</ErrorBoundary>

// Feature level - catches feature-specific errors
<FeatureErrorBoundary featureName="Task Management">
  <TaskList />
</FeatureErrorBoundary>

// Component level - catches component-specific errors
<FeatureErrorBoundary featureName="File Upload">
  <FileUploadComponent />
</FeatureErrorBoundary>
```

### 2. Loading State Management

Use consistent loading patterns:

```tsx
const MyComponent = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState(null);

  if (isLoading) {
    return <LoadingState message="Loading data..." />;
  }

  if (error) {
    return (
      <ErrorState
        message={error.message}
        onRetry={() => refetchData()}
      />
    );
  }

  if (!data || data.length === 0) {
    return (
      <EmptyState
        title="No Data"
        description="No items found"
      />
    );
  }

  return <DataDisplay data={data} />;
};
```

### 3. Retry Logic Implementation

Implement retry logic for critical operations:

```tsx
const useDataFetching = (url: string) => {
  const fetchData = useCallback(async () => {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }, [url]);

  const {
    execute: refetch,
    isRetrying,
    retryCount,
    lastError
  } = useRetry(fetchData, {
    maxRetries: 3,
    retryDelay: 1000
  });

  return { refetch, isRetrying, retryCount, lastError };
};
```

### 4. Error Reporting

Implement error reporting for production:

```tsx
const reportError = (error: Error, errorInfo?: ErrorInfo) => {
  // In production, send to error reporting service
  if (process.env.NODE_ENV === 'production') {
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }
  
  // Always log to console for development
  console.error('Application Error:', error, errorInfo);
};

<ErrorBoundary onError={reportError}>
  <App />
</ErrorBoundary>
```

## Testing

The error handling system includes comprehensive tests:

```bash
# Run error handling tests
npm test -- --testPathPattern=error-handling.test.tsx
```

Test coverage includes:
- Error boundary functionality
- Loading state rendering
- Retry mechanism behavior
- Fallback UI interactions
- Integration scenarios

## Best Practices

### 1. Error Messages
- Use clear, user-friendly error messages
- Provide actionable information when possible
- Include technical details in development mode only

### 2. Loading States
- Show loading indicators for operations > 200ms
- Use skeleton loaders for better perceived performance
- Provide progress indicators for long operations

### 3. Retry Logic
- Implement exponential backoff for retries
- Limit retry attempts to prevent infinite loops
- Provide manual retry options for users

### 4. Accessibility
- Include proper ARIA labels for loading states
- Ensure error messages are announced by screen readers
- Provide keyboard navigation for error actions

### 5. Performance
- Lazy load error boundary components
- Use React.memo for loading components
- Implement proper cleanup for retry timers

## Monitoring and Analytics

Track error handling effectiveness:

```tsx
const trackError = (error: Error, context: string) => {
  // Track error occurrence
  analytics.track('error_occurred', {
    error_message: error.message,
    error_context: context,
    user_id: getCurrentUserId(),
    timestamp: new Date().toISOString()
  });
};

const trackRetry = (attempt: number, success: boolean) => {
  // Track retry attempts
  analytics.track('retry_attempt', {
    attempt_number: attempt,
    success,
    timestamp: new Date().toISOString()
  });
};
```

This comprehensive error handling system ensures a robust and user-friendly experience even when things go wrong, with proper fallbacks, retry mechanisms, and clear communication to users about what's happening in the application.