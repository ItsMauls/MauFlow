'use client';

import React from 'react';
import { GlassCard, GlassButton } from '../ui';

interface ErrorStateProps {
  title?: string;
  message: string;
  error?: Error;
  onRetry?: () => void;
  onDismiss?: () => void;
  showDetails?: boolean;
  className?: string;
}

/**
 * Error state component for displaying operation failures
 */
export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message,
  error,
  onRetry,
  onDismiss,
  showDetails = false,
  className = ''
}) => {
  const [showErrorDetails, setShowErrorDetails] = React.useState(false);

  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="text-center">
        <div className="mb-4">
          <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-red-400/20 to-orange-400/20 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          {title}
        </h3>
        
        <p className="text-white/70 mb-4 text-sm">
          {message}
        </p>
        
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onRetry && (
            <GlassButton
              variant="primary"
              onClick={onRetry}
              className="rounded-full px-6 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </span>
            </GlassButton>
          )}
          
          {onDismiss && (
            <GlassButton
              variant="ghost"
              onClick={onDismiss}
              className="rounded-full px-6 py-2 text-sm"
            >
              Dismiss
            </GlassButton>
          )}
        </div>
        
        {showDetails && error && (
          <div className="mt-4">
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="text-white/60 hover:text-white/80 text-xs underline"
            >
              {showErrorDetails ? 'Hide' : 'Show'} Error Details
            </button>
            
            {showErrorDetails && (
              <div className="mt-3 p-3 bg-black/20 rounded-lg border border-white/10 text-left">
                <p className="text-white/60 text-xs mb-1">
                  <strong>Error:</strong> {error.name}
                </p>
                <p className="text-white/60 text-xs font-mono break-all">
                  {error.message}
                </p>
                {error.stack && (
                  <details className="mt-2">
                    <summary className="text-white/50 text-xs cursor-pointer">Stack Trace</summary>
                    <pre className="text-white/50 text-xs mt-1 overflow-auto max-h-32 whitespace-pre-wrap">
                      {error.stack}
                    </pre>
                  </details>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </GlassCard>
  );
};