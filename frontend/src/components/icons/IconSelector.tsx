'use client';

import React, { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { GlassButton } from '../ui/GlassButton';
import { IconSelectorProps, IconConfig, IconCategory } from './types';
import { getIconsByCategory, getAvailableCategories, searchIcons } from './utils';

export const IconSelector: React.FC<IconSelectorProps> = ({
  isOpen,
  onClose,
  onIconSelect,
  currentIcon,
  availableIcons,
  title = 'Select Icon',
}) => {
  const [selectedCategory, setSelectedCategory] = useState<IconCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const categories = useMemo(() => getAvailableCategories(availableIcons), [availableIcons]);

  const filteredIcons = useMemo(() => {
    let icons = availableIcons;

    // Filter by search query
    if (searchQuery.trim()) {
      icons = searchIcons(searchQuery, icons);
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      icons = getIconsByCategory(selectedCategory, icons);
    }

    return icons;
  }, [availableIcons, searchQuery, selectedCategory]);

  const handleIconSelect = (iconId: string) => {
    onIconSelect(iconId);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300"
      onClick={handleBackdropClick}
    >
      <div className="max-w-2xl w-full max-h-[80vh] transform animate-in zoom-in-95 duration-300">
        <div className="relative rounded-3xl border border-blue-400/30 bg-gradient-to-br from-blue-500/25 via-purple-500/15 to-blue-500/10 backdrop-blur-2xl shadow-2xl shadow-blue-500/20 overflow-hidden">
          {/* Subtle glowing border effect */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-blue-400/10 via-purple-400/5 to-blue-400/10 blur-sm -z-10" />
          
          {/* Header */}
          <div className="p-6 border-b border-blue-400/20">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-bold text-white">
                {title}
              </h3>
              <button
                onClick={onClose}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all duration-300 hover:scale-105"
              >
                ×
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6 border-b border-blue-400/10 space-y-4">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search icons..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-blue-500/15 to-purple-500/10 border border-blue-400/30 text-white placeholder-white/50 backdrop-blur-sm hover:from-blue-500/20 hover:to-purple-500/15 focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory('all')}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                  selectedCategory === 'all'
                    ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/50'
                    : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                )}
              >
                All
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category as IconCategory)}
                  className={cn(
                    'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 capitalize',
                    selectedCategory === category
                      ? 'bg-gradient-to-r from-blue-500/30 to-purple-500/30 text-white border border-blue-400/50'
                      : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Icon Grid */}
          <div className="p-6 max-h-96 overflow-y-auto">
            {filteredIcons.length > 0 ? (
              <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-3">
                {filteredIcons.map((icon) => (
                  <button
                    key={icon.id}
                    onClick={() => handleIconSelect(icon.id)}
                    className={cn(
                      'aspect-square p-3 rounded-xl text-2xl transition-all duration-200 group relative',
                      'hover:scale-110 hover:shadow-lg',
                      currentIcon === icon.id
                        ? 'bg-gradient-to-br from-blue-500/40 to-purple-500/40 border-2 border-blue-400/60 shadow-lg shadow-blue-500/30'
                        : 'bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40'
                    )}
                    title={icon.name}
                  >
                    <span className="block transform group-hover:scale-110 transition-transform duration-200">
                      {icon.emoji}
                    </span>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-black/80 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      {icon.name}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-white/60 text-lg mb-2">No icons found</p>
                <p className="text-white/40 text-sm">
                  {searchQuery ? 'Try a different search term' : 'No icons available in this category'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-blue-400/10">
            <div className="flex justify-end gap-3">
              <GlassButton
                variant="secondary"
                onClick={onClose}
                className="rounded-2xl px-6"
              >
                Cancel
              </GlassButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};