/**
 * TeamMemberSelector Component
 * Provides a searchable dropdown for selecting team members with filtering capabilities
 * Enhanced with comprehensive accessibility support
 */

import React, { useState, useEffect, useRef } from 'react';
import { TeamMember, TeamMemberSelectorProps } from '@/types/collaboration';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { GlassCard } from '@/components/ui/GlassCard';
import { 
  ARIA_ROLES, 
  KEYBOARD_KEYS, 
  generateAriaLabel,
  mobileAccessibility,
  reducedMotionSupport
} from '@/lib/accessibility';

interface TeamMemberSelectorPropsExtended extends TeamMemberSelectorProps {
  placeholder?: string;
  className?: string;
  isMobile?: boolean;
}

export const TeamMemberSelector: React.FC<TeamMemberSelectorPropsExtended> = ({
  onSelect,
  excludeUsers = [],
  filterByRole = [],
  searchable = true,
  placeholder = "Select team member...",
  className = "",
  isMobile = false
}) => {
  const { teamMembers, isLoading, searchMembers } = useTeamMembers();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<TeamMember[]>([]);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [announceSelection, setAnnounceSelection] = useState('');
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Filter team members based on search query, exclusions, and role filters
  useEffect(() => {
    let members = teamMembers;

    // Apply search filter
    if (searchQuery.trim()) {
      members = searchMembers(searchQuery);
    }

    // Exclude specified users
    if (excludeUsers.length > 0) {
      members = members.filter(member => !excludeUsers.includes(member.id));
    }

    // Filter by roles if specified
    if (filterByRole.length > 0) {
      members = members.filter(member => 
        filterByRole.includes(member.role.name)
      );
    }

    // Sort by online status first, then by name
    members.sort((a, b) => {
      if (a.isOnline !== b.isOnline) {
        return a.isOnline ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });

    setFilteredMembers(members);
    setHighlightedIndex(-1);
  }, [teamMembers, searchQuery, excludeUsers, filterByRole, searchMembers]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Initialize option refs array
  useEffect(() => {
    optionRefs.current = optionRefs.current.slice(0, filteredMembers.length);
  }, [filteredMembers.length]);

  // Scroll highlighted option into view
  useEffect(() => {
    if (highlightedIndex >= 0 && optionRefs.current[highlightedIndex]) {
      optionRefs.current[highlightedIndex]?.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [highlightedIndex]);

  // Handle keyboard navigation
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === KEYBOARD_KEYS.ENTER || event.key === KEYBOARD_KEYS.ARROW_DOWN) {
        setIsOpen(true);
        setHighlightedIndex(0);
        event.preventDefault();
      }
      return;
    }

    switch (event.key) {
      case KEYBOARD_KEYS.ARROW_DOWN:
        event.preventDefault();
        const nextIndex = highlightedIndex < filteredMembers.length - 1 ? highlightedIndex + 1 : 0;
        setHighlightedIndex(nextIndex);
        if (filteredMembers[nextIndex]) {
          setAnnounceSelection(generateAriaLabel.teamMemberOption(filteredMembers[nextIndex]));
        }
        break;
      case KEYBOARD_KEYS.ARROW_UP:
        event.preventDefault();
        const prevIndex = highlightedIndex > 0 ? highlightedIndex - 1 : filteredMembers.length - 1;
        setHighlightedIndex(prevIndex);
        if (filteredMembers[prevIndex]) {
          setAnnounceSelection(generateAriaLabel.teamMemberOption(filteredMembers[prevIndex]));
        }
        break;
      case KEYBOARD_KEYS.HOME:
        event.preventDefault();
        setHighlightedIndex(0);
        if (filteredMembers[0]) {
          setAnnounceSelection(generateAriaLabel.teamMemberOption(filteredMembers[0]));
        }
        break;
      case KEYBOARD_KEYS.END:
        event.preventDefault();
        const lastIndex = filteredMembers.length - 1;
        setHighlightedIndex(lastIndex);
        if (filteredMembers[lastIndex]) {
          setAnnounceSelection(generateAriaLabel.teamMemberOption(filteredMembers[lastIndex]));
        }
        break;
      case KEYBOARD_KEYS.ENTER:
        event.preventDefault();
        if (highlightedIndex >= 0 && filteredMembers[highlightedIndex]) {
          handleSelectMember(filteredMembers[highlightedIndex]);
        }
        break;
      case KEYBOARD_KEYS.ESCAPE:
        event.preventDefault();
        setIsOpen(false);
        setHighlightedIndex(-1);
        inputRef.current?.focus();
        break;
    }
  };

  const handleSelectMember = (member: TeamMember) => {
    setSelectedMember(member);
    setSearchQuery(member.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    setAnnounceSelection(`Selected ${member.name}, ${member.role.name}`);
    onSelect(member.id);
    
    // Return focus to input
    setTimeout(() => {
      inputRef.current?.focus();
    }, 0);
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSearchQuery(value);
    setSelectedMember(null);
    
    if (!isOpen && value) {
      setIsOpen(true);
    }
  };

  const handleInputFocus = () => {
    setIsOpen(true);
    setHighlightedIndex(0);
  };

  const getStatusIndicator = (member: TeamMember) => {
    if (member.isOnline) {
      return (
        <div className="w-2 h-2 bg-green-400 rounded-full" title="Online" />
      );
    }
    
    if (member.lastSeen) {
      const lastSeenDate = new Date(member.lastSeen);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - lastSeenDate.getTime()) / (1000 * 60 * 60));
      
      if (diffHours < 1) {
        return (
          <div className="w-2 h-2 bg-yellow-400 rounded-full" title="Recently active" />
        );
      }
    }
    
    return (
      <div className="w-2 h-2 bg-gray-400 rounded-full" title="Offline" />
    );
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return 'Never';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  const comboboxId = `team-member-selector-${Math.random().toString(36).substr(2, 9)}`;
  const listboxId = `${comboboxId}-listbox`;

  if (isLoading) {
    return (
      <div className={cn('relative', className)}>
        <div className={cn(
          'w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg',
          isMobile ? 'px-3 py-3' : 'px-4 py-3'
        )}>
          <div 
            className={cn(
              'text-white/60',
              reducedMotionSupport.getAnimationStyles('animate-pulse', ''),
              isMobile ? 'text-base' : 'text-sm'
            )}
            role="status"
            aria-live="polite"
          >
            Loading team members...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('relative', className)} ref={dropdownRef}>
      {/* Live region for announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announceSelection}
      </div>

      <div className="relative">
        <input
          ref={inputRef}
          id={comboboxId}
          type="text"
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={handleInputFocus}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          readOnly={!searchable}
          className={cn(
            'w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-lg',
            'text-white placeholder-white/60 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50',
            // Mobile-friendly sizing
            isMobile ? 'px-3 py-3 pr-12 text-base min-h-[44px]' : 'px-4 py-3 pr-10 text-sm'
          )}
          role={ARIA_ROLES.TEAM_MEMBER_SELECTOR}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-activedescendant={
            isOpen && highlightedIndex >= 0 && filteredMembers[highlightedIndex]
              ? `${listboxId}-option-${highlightedIndex}`
              : undefined
          }
          aria-autocomplete={searchable ? 'list' : 'none'}
          aria-describedby={`${comboboxId}-description`}
        />
        
        <div className={cn(
          'absolute inset-y-0 right-0 flex items-center pointer-events-none',
          isMobile ? 'pr-3' : 'pr-3'
        )}>
          <svg
            className={cn(
              'text-white/60 transition-transform duration-200',
              isMobile ? 'w-6 h-6' : 'w-5 h-5',
              isOpen && 'rotate-180'
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Hidden description for screen readers */}
      <div id={`${comboboxId}-description`} className="sr-only">
        Team member selector. Type to search, use arrow keys to navigate options, Enter to select, Escape to close.
        {filteredMembers.length > 0 && ` ${filteredMembers.length} member${filteredMembers.length !== 1 ? 's' : ''} available.`}
      </div>

      {isOpen && (
        <GlassCard 
          ref={listboxRef}
          className={cn(
            'absolute z-50 w-full mt-2 max-h-64 overflow-y-auto',
            // Reduced motion support
            reducedMotionSupport.getAnimationStyles(
              'animate-in slide-in-from-top-2 duration-200',
              'opacity-100'
            )
          )}
        >
          {filteredMembers.length === 0 ? (
            <div 
              className={cn(
                'text-white/60 text-center',
                isMobile ? 'px-3 py-4 text-base' : 'px-4 py-3 text-sm'
              )}
              role="status"
            >
              {searchQuery ? 'No team members found' : 'No team members available'}
            </div>
          ) : (
            <div 
              id={listboxId}
              role="listbox"
              aria-label="Team members"
              className="py-1"
            >
              {filteredMembers.map((member, index) => (
                <button
                  key={member.id}
                  ref={(el) => (optionRefs.current[index] = el)}
                  id={`${listboxId}-option-${index}`}
                  onClick={() => handleSelectMember(member)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={cn(
                    'w-full text-left transition-colors duration-150',
                    'hover:bg-white/10 focus:bg-white/10 focus:outline-none',
                    // Mobile-friendly spacing and touch targets
                    isMobile ? 'px-3 py-4 min-h-[60px]' : 'px-4 py-3',
                    index === highlightedIndex && 'bg-white/10'
                  )}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  aria-label={generateAriaLabel.teamMemberOption(member)}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {member.avatar ? (
                        <span className="text-2xl">{member.avatar}</span>
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-medium text-sm">
                          {member.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="text-white font-medium truncate">
                          {member.name}
                        </p>
                        {getStatusIndicator(member)}
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-white/60">
                        <span>{member.role.name}</span>
                        {!member.isOnline && (
                          <>
                            <span>•</span>
                            <span>{formatLastSeen(member.lastSeen)}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};

export default TeamMemberSelector;