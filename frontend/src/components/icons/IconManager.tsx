'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { IconManagerProps } from './types';
import { IconSelector } from './IconSelector';
import { getIconById } from './utils';
import { FeatureErrorBoundary } from '../error';

export const IconManager: React.FC<IconManagerProps> = ({
  currentIcon,
  availableIcons,
  onIconSelect,
  editable = true,
  className,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const selectedIconConfig = React.useMemo(() => {
    try {
      return currentIcon ? getIconById(currentIcon, availableIcons) : null;
    } catch (err) {
      console.error('Error getting icon by ID:', err);
      setError(err instanceof Error ? err : new Error('Failed to load icon'));
      return null;
    }
  }, [currentIcon, availableIcons]);

  const handleIconClick = () => {
    if (editable) {
      setIsModalOpen(true);
    }
  };

  const handleIconSelect = (iconId: string) => {
    try {
      onIconSelect(iconId);
      setIsModalOpen(false);
      setError(null);
    } catch (err) {
      console.error('Error selecting icon:', err);
      setError(err instanceof Error ? err : new Error('Failed to select icon'));
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsModalOpen(false);
  };

  return (
    <FeatureErrorBoundary 
      featureName="Icon Manager"
      onRetry={handleRetry}
      fallbackMessage="There was an issue with the icon manager. Please try again."
    >
      <div className={cn('inline-flex items-center', className)}>
        <button
          onClick={handleIconClick}
          disabled={!editable || !!error}
          className={cn(
            'relative group transition-all duration-200',
            editable && !error && 'hover:scale-110 cursor-pointer',
            (!editable || error) && 'cursor-default opacity-75'
          )}
          title={
            error 
              ? 'Icon manager error - click to retry'
              : editable 
                ? 'Click to change icon' 
                : selectedIconConfig?.name || 'Icon'
          }
        >
          <div
            className={cn(
              'flex items-center justify-center w-10 h-10 rounded-xl text-2xl transition-all duration-200',
              editable && !error && [
                'bg-gradient-to-br from-white/10 to-white/5 border border-white/20',
                'hover:from-white/20 hover:to-white/10 hover:border-white/30',
                'hover:shadow-lg hover:shadow-white/10',
                'active:scale-95'
              ],
              error && 'border border-red-400/30 bg-red-400/10'
            )}
          >
            {error ? (
              <span className="text-red-300 text-lg">⚠</span>
            ) : selectedIconConfig ? (
              <span className="transform group-hover:scale-110 transition-transform duration-200">
                {selectedIconConfig.emoji}
              </span>
            ) : (
              <span className="text-white/40 text-lg">?</span>
            )}
          </div>

          {/* Edit indicator */}
          {editable && !error && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 border border-white/20">
              <div className="absolute inset-0.5 bg-white rounded-full flex items-center justify-center">
                <span className="text-[8px] text-blue-600">✎</span>
              </div>
            </div>
          )}
        </button>

        {/* Icon name or error message */}
        {error ? (
          <span className="ml-2 text-sm text-red-300 hidden sm:inline">
            Icon Error
          </span>
        ) : selectedIconConfig ? (
          <span className="ml-2 text-sm text-white/70 hidden sm:inline">
            {selectedIconConfig.name}
          </span>
        ) : null}
      </div>

      {/* Icon Selector Modal */}
      {!error && (
        <IconSelector
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onIconSelect={handleIconSelect}
          currentIcon={currentIcon}
          availableIcons={availableIcons}
          title="Select Icon"
        />
      )}
    </FeatureErrorBoundary>
  );
};