'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface StickyBottomBarProps {
  children: React.ReactNode;
  className?: string;
  show?: boolean;
}

export const StickyBottomBar: React.FC<StickyBottomBarProps> = ({
  children,
  className,
  show = true,
}) => {
  return (
    <div
      className={cn(
        // Base positioning
        'fixed bottom-0 left-0 right-0 z-50',
        // Glassmorphism styling
        'backdrop-blur-lg bg-white/10 border-t border-white/20',
        'shadow-lg shadow-black/20',
        // Padding and spacing
        'p-4 pb-safe',
        // Animation
        'transition-transform duration-300 ease-in-out',
        show ? 'translate-y-0' : 'translate-y-full',
        className
      )}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-white/5 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 max-w-screen-xl mx-auto">
        <div className="flex items-center justify-center gap-3 md:gap-4">
          {children}
        </div>
      </div>
    </div>
  );
};