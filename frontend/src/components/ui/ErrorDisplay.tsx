/**
 * Error Display Components for Collaboration Features
 * Provides user-friendly error messages, retry buttons, and recovery suggestions
 */

import React, { useState } from 'react';
import { CollaborationError, getErrorRecoverySuggestions } from '@/lib/errorHandling';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { cn } from '@/lib/utils';

// Error display props
export interface ErrorDisplayProps {
  error: CollaborationError;
  onRetry?: () => Promise<void>;
  onDismiss?: () => void;
  showSuggestions?: boolean;
  className?: string;
  variant?: 'inline' | 'modal' | 'toast';
}

// Error icon component
const ErrorIcon: React.FC<{ type: CollaborationError['type'] }> = ({ type }) => {
  const getIcon = () => {
    switch (type) {
      case 'permission_denied':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H10m9-7a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'user_not_found':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'network_error':
      case 'timeout_error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
        );
      case 'storage_error':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  return (
    <div className="flex-shrink-0 text-red-400">
      {getIcon()}
    </div>
  );
};

// Main error display component
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onDismiss,
  showSuggestions = true,
  className = "",
  variant = 'inline'
}) => {
  const [isRetrying, setIsRetrying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const suggestions = getErrorRecoverySuggestions(error);

  const handleRetry = async () => {
    if (!onRetry || !error.retryable) return;
    
    setIsRetrying(true);
    try {
      await onRetry();
    } catch (err) {
      // Error will be handled by parent component
    } finally {
      setIsRetrying(false);
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'modal':
        return 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm';
      case 'toast':
        return 'fixed top-4 right-4 z-50 max-w-md';
      default:
        return '';
    }
  };

  const getContentStyles = () => {
    switch (variant) {
      case 'toast':
        return 'bg-red-500/10 border-red-500/20 text-red-200';
      default:
        return 'bg-red-500/5 border-red-500/20';
    }
  };

  const content = (
    <GlassCard className={cn(getContentStyles(), className)}>
      <div className="space-y-4">
        {/* Error Header */}
        <div className="flex items-start space-x-3">
          <ErrorIcon type={error.type} />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-white">
              {error.userMessage}
            </h3>
            {error.details && (
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-white/60 hover:text-white/80 transition-colors duration-200 mt-1"
              >
                {showDetails ? 'Hide details' : 'Show details'}
              </button>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 w-6 h-6 rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200 flex items-center justify-center"
            >
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Error Details */}
        {showDetails && error.details && (
          <div className="bg-white/5 rounded-lg p-3 border border-white/10">
            <h4 className="text-xs font-medium text-white/80 mb-2">Error Details</h4>
            <div className="space-y-1">
              <div className="text-xs text-white/60">
                <span className="font-medium">Type:</span> {error.type}
              </div>
              <div className="text-xs text-white/60">
                <span className="font-medium">Code:</span> {error.code}
              </div>
              {error.details.originalError && (
                <div className="text-xs text-white/60">
                  <span className="font-medium">Original:</span> {error.details.originalError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Recovery Suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-white/80">Try these solutions:</h4>
            <ul className="space-y-1">
              {suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start space-x-2 text-xs text-white/70">
                  <span className="flex-shrink-0 w-1 h-1 bg-white/40 rounded-full mt-2"></span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end space-x-2">
          {onDismiss && variant !== 'toast' && (
            <GlassButton
              onClick={onDismiss}
              variant="secondary"
              size="sm"
            >
              Dismiss
            </GlassButton>
          )}
          {onRetry && error.retryable && (
            <GlassButton
              onClick={handleRetry}
              disabled={isRetrying}
              loading={isRetrying}
              variant="primary"
              size="sm"
            >
              Retry
            </GlassButton>
          )}
        </div>
      </div>
    </GlassCard>
  );

  if (variant === 'modal' || variant === 'toast') {
    return (
      <div className={getVariantStyles()}>
        {content}
      </div>
    );
  }

  return content;
};

// Inline error message component
export const InlineError: React.FC<{
  message: string;
  className?: string;
}> = ({ message, className = "" }) => (
  <div className={cn("flex items-center space-x-2 text-red-400 text-sm", className)}>
    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
    <span>{message}</span>
  </div>
);

// Validation error list component
export const ValidationErrors: React.FC<{
  errors: string[];
  warnings?: string[];
  className?: string;
}> = ({ errors, warnings = [], className = "" }) => {
  if (errors.length === 0 && warnings.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((error, index) => (
            <InlineError key={`error-${index}`} message={error} />
          ))}
        </div>
      )}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((warning, index) => (
            <div key={`warning-${index}`} className="flex items-center space-x-2 text-yellow-400 text-sm">
              <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Error boundary component for collaboration features
export class CollaborationErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error }> },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Collaboration Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback;
      
      if (FallbackComponent) {
        return <FallbackComponent error={this.state.error!} />;
      }

      return (
        <div className="p-4">
          <ErrorDisplay
            error={{
              type: 'validation_error',
              code: 'COMPONENT_ERROR',
              message: this.state.error?.message || 'An unexpected error occurred',
              userMessage: 'Something went wrong with the collaboration features',
              retryable: false
            } as CollaborationError}
            onDismiss={() => this.setState({ hasError: false, error: null })}
          />
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorDisplay;