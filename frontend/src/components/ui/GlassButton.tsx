'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GlassButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

const variants = {
  primary: 'border-blue-400/40 bg-blue-500/20 text-blue-100 hover:bg-blue-500/30 shadow-blue-500/20',
  secondary: 'border-gray-400/40 bg-gray-500/20 text-gray-100 hover:bg-gray-500/30 shadow-gray-500/20',
  danger: 'border-red-400/40 bg-red-500/20 text-red-100 hover:bg-red-500/30 shadow-red-500/20',
  success: 'border-green-400/40 bg-green-500/20 text-green-100 hover:bg-green-500/30 shadow-green-500/20',
};

const sizes = {
  sm: 'px-3 py-2 text-sm min-h-[36px]',
  md: 'px-4 py-3 text-base min-h-[44px]',
  lg: 'px-6 py-4 text-lg min-h-[52px]',
};

export const GlassButton: React.FC<GlassButtonProps> = ({
  children,
  className,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
}) => {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(
        // Base glassmorphism styles
        'relative rounded-lg border backdrop-blur-md',
        'bg-gradient-to-br from-white/20 to-white/5',
        'shadow-lg transition-all duration-200',
        'font-medium',
        // Variant styles
        variants[variant],
        // Size styles
        sizes[size],
        // Interactive states
        'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100',
        // Loading state
        loading && 'cursor-wait',
        className
      )}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </div>
    </button>
  );
};