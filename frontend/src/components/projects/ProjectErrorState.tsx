'use client';

import React from 'react';
import { GlassContainer, GlassCard, GlassButton } from '../ui';

interface ProjectErrorStateProps {
  error: Error;
  onRetry: () => void;
  onGoBack: () => void;
}

export const ProjectErrorState: React.FC<ProjectErrorStateProps> = ({
  error,
  onRetry,
  onGoBack
}) => {
  const isNotFound = error.message.toLowerCase().includes('not found');
  const isNetworkError = error.message.toLowerCase().includes('network') || 
                         error.message.toLowerCase().includes('fetch');

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Glass Shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/3 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      <GlassContainer>
        <div className="relative z-10 p-4 md:p-6 lg:p-8">
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center max-w-lg mx-auto">
              <GlassCard priority="high" className="p-8">
                {/* Error Icon */}
                <div className="mb-6">
                  <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-red-400/20 to-orange-400/20 flex items-center justify-center">
                    {isNotFound ? (
                      <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.5-.935-6.086-2.455l-.233-.22C5.238 12.011 5.04 11.703 5.04 11.375V8.625c0-.328.198-.636.641-.95L12 4l6.319 3.675c.443.314.641.622.641.95v2.75c0 .328-.198.636-.641.95L12 15.675l-6.319-3.675z" />
                      </svg>
                    ) : isNetworkError ? (
                      <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                    ) : (
                      <svg className="w-10 h-10 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                </div>

                {/* Error Title */}
                <h2 className="text-3xl font-bold text-white mb-4">
                  {isNotFound ? 'Project Not Found' : 
                   isNetworkError ? 'Connection Error' : 
                   'Something Went Wrong'}
                </h2>

                {/* Error Description */}
                <p className="text-white/80 mb-6 leading-relaxed">
                  {isNotFound ? 
                    'The project you\'re looking for doesn\'t exist or may have been deleted.' :
                   isNetworkError ?
                    'Unable to connect to the server. Please check your internet connection and try again.' :
                    'An unexpected error occurred while loading the project. Please try again.'
                  }
                </p>

                {/* Error Details */}
                <div className="mb-8 p-4 bg-white/5 rounded-xl border border-white/10">
                  <p className="text-white/60 text-sm font-mono break-all">
                    {error.message}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  {!isNotFound && (
                    <GlassButton
                      variant="primary"
                      onClick={onRetry}
                      className="rounded-full px-8 py-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40 border-blue-400/50 shadow-lg shadow-blue-500/25"
                    >
                      <span className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                      </span>
                    </GlassButton>
                  )}
                  
                  <GlassButton
                    variant="secondary"
                    onClick={onGoBack}
                    className="rounded-full px-8 py-3 hover:bg-white/20"
                  >
                    <span className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Dashboard
                    </span>
                  </GlassButton>
                </div>

                {/* Additional Help */}
                <div className="mt-8 pt-6 border-t border-white/10">
                  <p className="text-white/60 text-sm">
                    Need help? Contact support or check the{' '}
                    <button 
                      onClick={() => window.open('/help', '_blank')}
                      className="text-blue-300 hover:text-blue-200 underline"
                    >
                      documentation
                    </button>
                  </p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
};