'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { MentionDropdownProps, MentionUser } from '@/types/comments';
import { 
  ARIA_ROLES, 
  KEYBOARD_KEYS, 
  generateAriaLabel,
  mobileAccessibility,
  reducedMotionSupport
} from '@/lib/accessibility';

export const MentionDropdown: React.FC<MentionDropdownProps> = ({
  users,
  onSelect,
  onClose,
  position,
  query,
  className,
  isMobile = false
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  const dropdownId = `mention-dropdown-${Math.random().toString(36).substr(2, 9)}`;

  // Reset selected index when users change
  useEffect(() => {
    setSelectedIndex(0);
    itemRefs.current = itemRefs.current.slice(0, users.length);
  }, [users]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case KEYBOARD_KEYS.ARROW_DOWN:
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % users.length);
          break;
        case KEYBOARD_KEYS.ARROW_UP:
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + users.length) % users.length);
          break;
        case KEYBOARD_KEYS.HOME:
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case KEYBOARD_KEYS.END:
          e.preventDefault();
          setSelectedIndex(users.length - 1);
          break;
        case KEYBOARD_KEYS.ENTER:
          e.preventDefault();
          if (users[selectedIndex]) {
            onSelect(users[selectedIndex]);
          }
          break;
        case KEYBOARD_KEYS.ESCAPE:
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [users, selectedIndex, onSelect, onClose]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedItem = itemRefs.current[selectedIndex];
    if (selectedItem) {
      selectedItem.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedIndex]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  if (users.length === 0) {
    return (
      <div
        ref={dropdownRef}
        id={dropdownId}
        style={{
          position: 'absolute',
          top: position.top,
          left: position.left,
          zIndex: 1000
        }}
        className={cn(
          'rounded-xl border backdrop-blur-xl',
          'bg-white/10 border-white/20 shadow-2xl shadow-black/20',
          'text-center',
          // Mobile-friendly sizing
          isMobile ? 'min-w-[250px] max-w-[350px] p-4' : 'min-w-[200px] max-w-[300px] p-3',
          className
        )}
        role="status"
        aria-live="polite"
      >
        <div className={cn(
          'text-white/60',
          isMobile ? 'text-base' : 'text-sm'
        )}>
          No users found for "{query}"
        </div>
      </div>
    );
  }

  return (
    <div
      ref={dropdownRef}
      id={dropdownId}
      style={{
        position: 'absolute',
        top: position.top,
        left: position.left,
        zIndex: 1000
      }}
      className={cn(
        'overflow-y-auto rounded-xl border backdrop-blur-xl',
        'bg-white/10 border-white/20 shadow-2xl shadow-black/20',
        // Mobile-friendly sizing
        isMobile 
          ? 'min-w-[250px] max-w-[350px] max-h-[300px] py-2' 
          : 'min-w-[200px] max-w-[300px] max-h-[240px] py-2',
        // Reduced motion support
        reducedMotionSupport.getAnimationStyles(
          'animate-in slide-in-from-top-2 duration-200',
          'opacity-100'
        ),
        className
      )}
      role={ARIA_ROLES.MENTION_DROPDOWN}
      aria-label={`Mention suggestions for "${query}"`}
      aria-activedescendant={users[selectedIndex] ? `${dropdownId}-option-${selectedIndex}` : undefined}
    >
      {users.map((user, index) => (
        <button
          key={user.id}
          id={`${dropdownId}-option-${index}`}
          ref={el => itemRefs.current[index] = el}
          onClick={() => onSelect(user)}
          onMouseEnter={() => setSelectedIndex(index)}
          className={cn(
            'w-full text-left transition-all duration-150',
            'hover:bg-white/15 focus:bg-white/15 focus:outline-none',
            'focus:ring-2 focus:ring-white/50 focus:ring-inset',
            'flex items-center gap-3',
            // Mobile-friendly spacing and touch targets
            isMobile ? 'px-4 py-3 min-h-[60px]' : 'px-3 py-2',
            selectedIndex === index && 'bg-white/15'
          )}
          role="option"
          aria-selected={selectedIndex === index}
          aria-label={generateAriaLabel.mentionSuggestion(user)}
        >
          {/* User Avatar */}
          <div className={cn(
            'rounded-full bg-gradient-to-br from-white/30 to-gray-300/20',
            'border border-white/20 flex items-center justify-center flex-shrink-0',
            isMobile ? 'w-10 h-10' : 'w-8 h-8'
          )}>
            {user.avatar ? (
              <span className={cn(isMobile ? 'text-base' : 'text-sm')} aria-hidden="true">
                {user.avatar}
              </span>
            ) : (
              <span className={cn(
                'font-bold text-white',
                isMobile ? 'text-sm' : 'text-xs'
              )}>
                {user.name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          {/* User Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className={cn(
                'font-medium text-white truncate',
                isMobile ? 'text-base' : 'text-sm'
              )}>
                {user.name}
              </span>
              {user.role && (
                <span className={cn(
                  'text-white/60 bg-white/10 px-2 py-0.5 rounded-full flex-shrink-0',
                  isMobile ? 'text-sm' : 'text-xs'
                )}>
                  {user.role}
                </span>
              )}
            </div>
            {user.email && (
              <div className={cn(
                'text-white/50 truncate',
                isMobile ? 'text-sm' : 'text-xs'
              )}>
                {user.email}
              </div>
            )}
          </div>

          {/* Mention Preview */}
          <div className={cn(
            'text-white/40 flex-shrink-0',
            isMobile ? 'text-sm' : 'text-xs'
          )}>
            @{user.name.replace(/\s+/g, '')}
          </div>
        </button>
      ))}

      {/* Footer with navigation hint */}
      <div className={cn(
        'border-t border-white/10 mt-2',
        isMobile ? 'px-4 py-3' : 'px-3 py-2'
      )}>
        <div className={cn(
          'text-white/40 text-center',
          isMobile ? 'text-sm' : 'text-xs'
        )}>
          ↑↓ Navigate • Home/End Jump • Enter Select • Esc Close
        </div>
      </div>
    </div>
  );
};