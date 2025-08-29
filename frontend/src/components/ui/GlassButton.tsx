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
  primary: 'border-white/40 bg-gradient-to-r from-white/20 to-gray-100/15 text-white hover:from-white/30 hover:to-gray-100/25 shadow-lg shadow-white/15 hover:shadow-xl hover:shadow-white/25',
  secondary: 'border-white/30 bg-gradient-to-r from-white/15 to-white/10 text-white hover:from-white/25 hover:to-white/20 shadow-lg shadow-white/10 hover:shadow-xl hover:shadow-white/20',
  danger: 'border-white/40 bg-gradient-to-r from-white/20 to-gray-200/15 text-white hover:from-white/30 hover:to-gray-200/25 shadow-lg shadow-white/15 hover:shadow-xl hover:shadow-white/25',
  success: 'border-white/40 bg-gradient-to-r from-white/20 to-gray-100/15 text-white hover:from-white/30 hover:to-gray-100/25 shadow-lg shadow-white/15 hover:shadow-xl hover:shadow-white/25',
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
        'group relative rounded-xl border backdrop-blur-xl overflow-hidden',
        'font-semibold transition-all duration-300 transform-gpu',
        // Variant styles
        variants[variant],
        // Size styles
        sizes[size],
        // Interactive states
        'hover:scale-[1.05] active:scale-[0.95]',
        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent',
        // Disabled state
        disabled && 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100',
        // Loading state
        loading && 'cursor-wait',
        className
      )}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
      
      {/* Subtle inner glow */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
      
      {/* Ripple effect container */}
      <div className="absolute inset-0 rounded-xl overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-white/20 scale-0 group-active:scale-100 rounded-full transition-transform duration-300 opacity-0 group-active:opacity-100" />
      </div>
      
      {/* Content */}
      <div className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        <span className="transform group-hover:scale-105 transition-transform duration-200">
          {children}
        </span>
      </div>
    </button>
  );
};