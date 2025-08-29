'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassContainerProps {
  children: React.ReactNode;
  className?: string;
  background?: 'gradient' | 'solid' | 'mesh';
}

const backgrounds = {
  gradient: 'bg-gradient-to-br from-purple-600/20 via-blue-600/20 to-cyan-600/20',
  solid: 'bg-slate-900/50',
  mesh: 'bg-gradient-to-br from-indigo-900/30 via-purple-900/30 to-pink-900/30',
};

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  className,
  background = 'gradient',
}) => {
  return (
    <div
      className={cn(
        // Base container styles
        'min-h-screen relative overflow-hidden',
        // Background
        backgrounds[background],
        className
      )}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-500" />
      </div>
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};