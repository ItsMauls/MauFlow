'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { IconManager } from './IconManager';
import { DEFAULT_ICONS, loadTitleIcon, saveTitleIcon } from './utils';

interface EditableTitleIconProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const EditableTitleIcon: React.FC<EditableTitleIconProps> = ({
  className,
  size = 'md'
}) => {
  const [currentIcon, setCurrentIcon] = useState<string>('');

  // Load title icon from localStorage on mount
  useEffect(() => {
    const savedIcon = loadTitleIcon();
    setCurrentIcon(savedIcon);
  }, []);

  const handleIconSelect = (iconId: string) => {
    setCurrentIcon(iconId);
    saveTitleIcon(iconId);
  };

  const sizeClasses = {
    sm: 'w-8 h-8 text-xl',
    md: 'w-10 h-10 text-2xl',
    lg: 'w-12 h-12 text-3xl'
  };

  // Find the icon config or use the emoji directly if it's a default emoji
  const selectedIcon = DEFAULT_ICONS.find(icon => icon.id === currentIcon);
  const iconEmoji = selectedIcon?.emoji || currentIcon;

  return (
    <div className={cn('inline-flex items-center', className)}>
      <IconManager
        currentIcon={currentIcon}
        availableIcons={DEFAULT_ICONS}
        onIconSelect={handleIconSelect}
        editable={true}
        className={cn(
          'transition-all duration-200 hover:scale-110',
          sizeClasses[size]
        )}
      />
    </div>
  );
};