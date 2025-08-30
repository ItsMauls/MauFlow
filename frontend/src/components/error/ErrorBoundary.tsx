'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { GlassContainer, GlassCard, GlassButton } from '../ui';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetOnPropsChange?: boolean;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  eventId: string | null;
}

/**
 * Error Boundary component that catches JavaScript errors anywhere in the child component tree
 * and displays a fallback UI instead of crashing the entire application
 */
export class ErrorBoundary extends Component<Props, State> {
  private resetTimeoutId: number | null = null;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Generate a unique event ID for tracking
    const eventId = `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.setState({
      error,
      errorInfo,
      eventId,
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you would send this to an error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  componentDidUpdate(prevProps: Props) {
    const { resetOnPropsChange, resetKeys } = this.props;
    const { hasError } = this.state;

    // Reset error boundary when resetKeys change
    if (hasError && resetOnPropsChange && resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (resetKey, idx) => prevProps.resetKeys?.[idx] !== resetKey
      );

      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }
  }

  resetErrorBoundary = () => {
    // Clear any existing timeout
    if (this.resetTimeoutId) {
      window.clearTimeout(this.resetTimeoutId);
    }

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      eventId: null,
    });
  };

  handleRetry = () => {
    this.resetErrorBoundary();
  };

  handleReload = () => {
    window.location.reload();
  };

  handleReportError = () => {
    const { error, errorInfo, eventId } = this.state;
    
    // In a real app, this would send the error to a reporting service
    const errorReport = {
      eventId,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      errorInfo: {
        componentStack: errorInfo?.componentStack,
      },
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    };

    console.log('Error report:', errorReport);
    
    // Copy error details to clipboard
    navigator.clipboard.writeText(JSON.stringify(errorReport, null, 2))
      .then(() => {
        alert('Error details copied to clipboard');
      })
      .catch(() => {
        alert('Failed to copy error details');
      });
  };

  render() {
    const { hasError, error, errorInfo, eventId } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Custom fallback UI
      if (fallback) {
        return fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen relative overflow-hidden">
          {/* Floating Glass Shapes */}
          <div className="absolute top-20 left-10 w-32 h-32 bg-white/3 rounded-full blur-xl animate-pulse" />
          <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }} />
          <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

          <GlassContainer>
            <div className="relative z-10 p-4 md:p-6 lg:p-8">
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center max-w-2xl mx-auto">
                  <GlassCard priority="high" className="p-8">
                    {/* Error Icon */}
                    <div className="mb-6">
                      <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-400/20 to-orange-400/20 flex items-center justify-center">
                        <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                      </div>
                    </div>

                    {/* Error Title */}
                    <h2 className="text-3xl font-bold text-white mb-4">
                      Something Went Wrong
                    </h2>

                    {/* Error Description */}
                    <p className="text-white/80 mb-6 leading-relaxed">
                      An unexpected error occurred in the application. This has been logged and our team has been notified.
                    </p>

                    {/* Error Details */}
                    <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
                      <div className="text-left">
                        <p className="text-white/60 text-sm mb-2">
                          <strong>Error:</strong> {error?.name || 'Unknown Error'}
                        </p>
                        <p className="text-white/60 text-sm mb-2 font-mono break-all">
                          {error?.message || 'No error message available'}
                        </p>
                        {eventId && (
                          <p className="text-white/40 text-xs">
                            <strong>Event ID:</strong> {eventId}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
                      <GlassButton
                        variant="primary"
                        onClick={this.handleRetry}
                        className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40 border-blue-400/50 shadow-lg shadow-blue-500/25"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Try Again
                        </span>
                      </GlassButton>
                      
                      <GlassButton
                        variant="secondary"
                        onClick={this.handleReload}
                        className="rounded-full px-8 py-3 hover:bg-white/20"
                      >
                        <span className="flex items-center gap-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          Reload Page
                        </span>
                      </GlassButton>
                    </div>

                    {/* Technical Details Toggle */}
                    <details className="text-left">
                      <summary className="cursor-pointer text-white/60 hover:text-white/80 mb-4">
                        Show Technical Details
                      </summary>
                      <div className="p-4 bg-black/20 rounded-lg border border-white/10">
                        <pre className="text-white/60 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                          {error?.stack || 'No stack trace available'}
                        </pre>
                        {errorInfo?.componentStack && (
                          <div className="mt-4">
                            <p className="text-white/60 text-sm mb-2">Component Stack:</p>
                            <pre className="text-white/60 text-xs overflow-auto max-h-40 whitespace-pre-wrap">
                              {errorInfo.componentStack}
                            </pre>
                          </div>
                        )}
                      </div>
                    </details>

                    {/* Report Error Button */}
                    <div className="mt-6 pt-6 border-t border-white/10">
                      <GlassButton
                        variant="ghost"
                        onClick={this.handleReportError}
                        className="text-sm"
                      >
                        Copy Error Details
                      </GlassButton>
                    </div>
                  </GlassCard>
                </div>
              </div>
            </div>
          </GlassContainer>
        </div>
      );
    }

    return children;
  }
}