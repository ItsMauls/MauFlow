'use client';

import React from 'react';
import { GlassCard } from '../ui';
import { LoadingSpinner } from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  showCard?: boolean;
  className?: string;
}

/**
 * Generic loading state component for various features
 */
export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading...',
  size = 'md',
  showCard = true,
  className = ''
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center p-6 ${className}`}>
      <LoadingSpinner size={size === 'sm' ? 'md' : size === 'md' ? 'lg' : 'xl'} />
      <p className="text-white/70 mt-4 text-center">
        {message}
      </p>
    </div>
  );

  if (showCard) {
    return (
      <GlassCard className="text-center">
        {content}
      </GlassCard>
    );
  }

  return content;
};