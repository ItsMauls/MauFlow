'use client';

import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';
import { GlassCard, GlassButton } from '../ui';

interface FeatureErrorBoundaryProps {
  children: React.ReactNode;
  featureName: string;
  onRetry?: () => void;
  fallbackMessage?: string;
}

/**
 * Feature-specific error boundary that provides a more contextual error experience
 * for specific features like icon management, calendar view, etc.
 */
export const FeatureErrorBoundary: React.FC<FeatureErrorBoundaryProps> = ({
  children,
  featureName,
  onRetry,
  fallbackMessage
}) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    console.error(`Error in ${featureName}:`, error, errorInfo);
    
    // In a real app, you might want to send feature-specific error reports
    // Example: analytics.track('feature_error', { feature: featureName, error: error.message });
  };

  const fallbackUI = (
    <GlassCard className="p-6 text-center">
      <div className="mb-4">
        <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-orange-400/20 to-red-400/20 flex items-center justify-center">
          <svg className="w-6 h-6 text-orange-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-2">
        {featureName} Error
      </h3>
      
      <p className="text-white/70 mb-4 text-sm">
        {fallbackMessage || `There was an issue loading the ${featureName.toLowerCase()} feature. Please try again.`}
      </p>
      
      {onRetry && (
        <GlassButton
          variant="secondary"
          onClick={onRetry}
          className="rounded-full px-6 py-2 text-sm"
        >
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </span>
        </GlassButton>
      )}
    </GlassCard>
  );

  return (
    <ErrorBoundary
      fallback={fallbackUI}
      onError={handleError}
      resetOnPropsChange={true}
      resetKeys={[featureName]}
    >
      {children}
    </ErrorBoundary>
  );
};