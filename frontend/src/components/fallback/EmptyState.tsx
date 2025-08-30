'use client';

import React from 'react';
import { GlassCard, GlassButton } from '../ui';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

/**
 * Empty state component for when there's no data to display
 */
export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  className = ''
}) => {
  const defaultIcon = (
    <svg className="w-12 h-12 text-white/40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
    </svg>
  );

  return (
    <GlassCard className={`text-center p-8 ${className}`}>
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-white/5 to-white/10 flex items-center justify-center">
          {icon || defaultIcon}
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-white mb-3">
        {title}
      </h3>
      
      <p className="text-white/70 mb-6 max-w-md mx-auto leading-relaxed">
        {description}
      </p>
      
      {action && (
        <GlassButton
          variant="primary"
          onClick={action.onClick}
          className="rounded-full px-6 py-3"
        >
          {action.label}
        </GlassButton>
      )}
    </GlassCard>
  );
};