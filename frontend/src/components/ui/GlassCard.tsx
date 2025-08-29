'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  priority?: 'high' | 'medium' | 'low';
  blur?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

const priorityColors = {
  high: 'border-red-400/30 bg-red-50/10 shadow-red-500/20',
  medium: 'border-yellow-400/30 bg-yellow-50/10 shadow-yellow-500/20',
  low: 'border-green-400/30 bg-green-50/10 shadow-green-500/20',
};

const blurLevels = {
  sm: 'backdrop-blur-sm',
  md: 'backdrop-blur-md',
  lg: 'backdrop-blur-lg',
};

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  priority,
  blur = 'md',
  onClick,
}) => {
  const priorityClass = priority ? priorityColors[priority] : 'border-white/20 bg-white/10 shadow-white/20';
  
  return (
    <div
      className={cn(
        // Base glassmorphism styles
        'relative rounded-xl border backdrop-blur-md',
        'bg-gradient-to-br from-white/20 to-white/5',
        'shadow-lg shadow-black/10',
        // Blur level
        blurLevels[blur],
        // Priority colors
        priorityClass,
        // Interactive styles
        onClick && 'cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        // Mobile-friendly touch targets
        'min-h-[44px] p-4 md:p-6',
        className
      )}
      onClick={onClick}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};