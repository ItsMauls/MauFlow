'use client';

import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { GlassCard, GlassButton } from '../ui';
import { FeatureErrorBoundary } from '../error';
import { LoadingState } from '../loading';
import { ErrorState } from '../fallback';
import { cn } from '@/lib/utils';
import {
  CalendarEvent,
  CalendarViewMode,
  CalendarDate,
  generateMonthCalendar,
  generateWeekCalendar,
  generateDayCalendar,
  addEventsToCalendarDates,
  navigatePrevious,
  navigateNext,
  getPeriodTitle,
  formatDate
} from '@/lib/calendar';

interface CalendarViewProps {
  events: CalendarEvent[];
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  viewMode: CalendarViewMode;
  onViewModeChange: (mode: CalendarViewMode) => void;
  onTaskDetailView?: (taskId: string) => void;
  className?: string;
  isLoading?: boolean;
  error?: Error | null;
  onRetry?: () => void;
}

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const CalendarView: React.FC<CalendarViewProps> = ({
  events,
  selectedDate,
  onDateSelect,
  onEventClick,
  viewMode,
  onViewModeChange,
  onTaskDetailView,
  className,
  isLoading = false,
  error = null,
  onRetry
}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [focusedDateIndex, setFocusedDateIndex] = useState<number>(0);
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [showTooltip, setShowTooltip] = useState<{
    event: CalendarEvent;
    x: number;
    y: number;
  } | null>(null);

  // Generate calendar dates based on view mode
  const calendarDates = useMemo(() => {
    try {
      let dates: CalendarDate[];
      
      switch (viewMode) {
        case 'month':
          dates = generateMonthCalendar(currentDate);
          break;
        case 'week':
          dates = generateWeekCalendar(currentDate);
          break;
        case 'day':
          dates = generateDayCalendar(currentDate);
          break;
        default:
          throw new Error(`Invalid view mode: ${viewMode}`);
      }
      
      return addEventsToCalendarDates(dates, events);
    } catch (err) {
      console.error('Error generating calendar dates:', err);
      // Return empty array to prevent crashes
      return [];
    }
  }, [currentDate, viewMode, events]);

  const handlePrevious = () => {
    setCurrentDate(navigatePrevious(currentDate, viewMode));
  };

  const handleNext = () => {
    setCurrentDate(navigateNext(currentDate, viewMode));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (date: Date, dateIndex?: number) => {
    const dateString = date.toISOString().split('T')[0];
    onDateSelect(dateString);
    if (dateIndex !== undefined) {
      setFocusedDateIndex(dateIndex);
    }
  };

  const handleEventClick = useCallback((event: CalendarEvent, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    
    // Enhanced event click with navigation to task detail
    if (onTaskDetailView && event.originalTask) {
      onTaskDetailView(event.originalTask.id);
    } else {
      onEventClick(event);
    }
  }, [onEventClick, onTaskDetailView]);

  const handleEventHover = useCallback((event: CalendarEvent, e: React.MouseEvent, isEntering: boolean) => {
    if (isEntering) {
      setHoveredEvent(event.id);
      const rect = e.currentTarget.getBoundingClientRect();
      setShowTooltip({
        event,
        x: rect.left + rect.width / 2,
        y: rect.top - 10
      });
    } else {
      setHoveredEvent(null);
      setShowTooltip(null);
    }
  }, []);

  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (!calendarDates.length) return;

    let newIndex = focusedDateIndex;
    const currentFocusedDate = calendarDates[focusedDateIndex];

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault();
        newIndex = Math.max(0, focusedDateIndex - 1);
        break;
      case 'ArrowRight':
        e.preventDefault();
        newIndex = Math.min(calendarDates.length - 1, focusedDateIndex + 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        if (viewMode === 'month') {
          newIndex = Math.max(0, focusedDateIndex - 7);
        } else if (viewMode === 'week') {
          newIndex = Math.max(0, focusedDateIndex - 1);
        }
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (viewMode === 'month') {
          newIndex = Math.min(calendarDates.length - 1, focusedDateIndex + 7);
        } else if (viewMode === 'week') {
          newIndex = Math.min(calendarDates.length - 1, focusedDateIndex + 1);
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        if (currentFocusedDate) {
          handleDateClick(currentFocusedDate.date, focusedDateIndex);
          
          // If there are events on this date, focus on the first one
          if (currentFocusedDate.events.length > 0) {
            handleEventClick(currentFocusedDate.events[0]);
          }
        }
        break;
      case 'Home':
        e.preventDefault();
        newIndex = 0;
        break;
      case 'End':
        e.preventDefault();
        newIndex = calendarDates.length - 1;
        break;
      case 'PageUp':
        e.preventDefault();
        handlePrevious();
        break;
      case 'PageDown':
        e.preventDefault();
        handleNext();
        break;
      case 'Escape':
        e.preventDefault();
        setShowTooltip(null);
        setHoveredEvent(null);
        break;
    }

    if (newIndex !== focusedDateIndex) {
      setFocusedDateIndex(newIndex);
      if (calendarDates[newIndex]) {
        handleDateClick(calendarDates[newIndex].date, newIndex);
      }
    }
  }, [focusedDateIndex, calendarDates, viewMode, handleDateClick, handleEventClick, handlePrevious, handleNext]);

  // Focus management
  useEffect(() => {
    if (calendarRef.current) {
      calendarRef.current.focus();
    }
  }, [viewMode, currentDate]);

  // Update focused date when calendar changes
  useEffect(() => {
    if (calendarDates.length > 0) {
      // Try to maintain focus on the same date when switching views
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayIndex = calendarDates.findIndex(
        date => date.date.getTime() === today.getTime()
      );
      
      if (todayIndex !== -1) {
        setFocusedDateIndex(todayIndex);
      } else {
        // Focus on the first date of the current month if today is not visible
        const currentMonthIndex = calendarDates.findIndex(
          date => date.isCurrentMonth
        );
        setFocusedDateIndex(Math.max(0, currentMonthIndex));
      }
    }
  }, [calendarDates]);

  const renderCalendarHeader = () => (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-4">
        <h2 className="text-2xl font-bold text-white">
          {getPeriodTitle(currentDate, viewMode)}
        </h2>
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={handleToday}
          className="rounded-full"
        >
          Today
        </GlassButton>
      </div>
      
      <div className="flex items-center gap-3">
        {/* View Mode Selector */}
        <div className="flex gap-1 p-1 bg-white/10 rounded-xl border border-white/20">
          {(['month', 'week', 'day'] as CalendarViewMode[]).map(mode => (
            <button
              key={mode}
              onClick={() => onViewModeChange(mode)}
              className={cn(
                'px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize',
                viewMode === mode
                  ? 'bg-white/20 text-white shadow-lg'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {mode}
            </button>
          ))}
        </div>
        
        {/* Navigation */}
        <div className="flex gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handlePrevious}
            className="rounded-full w-10 h-10 p-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </GlassButton>
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={handleNext}
            className="rounded-full w-10 h-10 p-0"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </GlassButton>
        </div>
      </div>
    </div>
  );

  const renderMonthView = () => (
    <div className="space-y-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-white/70 text-sm font-medium py-2"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-2" role="grid">
        {calendarDates.map((calendarDate, index) => (
          <CalendarDateCell
            key={index}
            calendarDate={calendarDate}
            isSelected={selectedDate === calendarDate.date.toISOString().split('T')[0]}
            isFocused={focusedDateIndex === index}
            onClick={() => handleDateClick(calendarDate.date, index)}
            onEventClick={handleEventClick}
            onEventHover={handleEventHover}
            hoveredEventId={hoveredEvent}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="space-y-4">
      {/* Week day headers */}
      <div className="grid grid-cols-7 gap-4">
        {calendarDates.map((calendarDate, index) => (
          <div key={index} className="text-center">
            <div className="text-white/70 text-sm font-medium mb-1">
              {weekDays[calendarDate.date.getDay()]}
            </div>
            <div className={cn(
              'text-lg font-semibold',
              calendarDate.isToday ? 'text-white' : 'text-white/80'
            )}>
              {calendarDate.date.getDate()}
            </div>
          </div>
        ))}
      </div>
      
      {/* Week calendar grid */}
      <div className="grid grid-cols-7 gap-4" role="grid">
        {calendarDates.map((calendarDate, index) => (
          <CalendarDateCell
            key={index}
            calendarDate={calendarDate}
            isSelected={selectedDate === calendarDate.date.toISOString().split('T')[0]}
            isFocused={focusedDateIndex === index}
            onClick={() => handleDateClick(calendarDate.date, index)}
            onEventClick={handleEventClick}
            onEventHover={handleEventHover}
            hoveredEventId={hoveredEvent}
            viewMode={viewMode}
          />
        ))}
      </div>
    </div>
  );

  const renderDayView = () => {
    const dayDate = calendarDates[0];
    
    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-white/70 text-lg mb-2">
            {weekDays[dayDate.date.getDay()]}
          </div>
          <div className="text-4xl font-bold text-white mb-4">
            {dayDate.date.getDate()}
          </div>
        </div>
        
        <CalendarDateCell
          calendarDate={dayDate}
          isSelected={selectedDate === dayDate.date.toISOString().split('T')[0]}
          isFocused={focusedDateIndex === 0}
          onClick={() => handleDateClick(dayDate.date, 0)}
          onEventClick={handleEventClick}
          onEventHover={handleEventHover}
          hoveredEventId={hoveredEvent}
          viewMode={viewMode}
          className="min-h-96"
        />
      </div>
    );
  };

  // Handle loading state
  if (isLoading) {
    return (
      <GlassCard className={cn('p-6', className)}>
        <LoadingState 
          message="Loading calendar events..." 
          size="lg" 
          showCard={false}
        />
      </GlassCard>
    );
  }

  // Handle error state
  if (error) {
    return (
      <GlassCard className={cn('p-6', className)}>
        <ErrorState
          title="Calendar Error"
          message={error.message || 'Failed to load calendar data'}
          error={error}
          onRetry={onRetry}
          showDetails={true}
        />
      </GlassCard>
    );
  }

  // Handle empty calendar dates (error in generation)
  if (calendarDates.length === 0) {
    return (
      <GlassCard className={cn('p-6', className)}>
        <ErrorState
          title="Calendar Generation Error"
          message="Unable to generate calendar view. Please try refreshing or switching view modes."
          onRetry={() => {
            setCurrentDate(new Date());
            onRetry?.();
          }}
        />
      </GlassCard>
    );
  }

  return (
    <FeatureErrorBoundary 
      featureName="Calendar View"
      onRetry={() => {
        setCurrentDate(new Date());
        onRetry?.();
      }}
      fallbackMessage="There was an issue with the calendar display. Please try again."
    >
      <div className="relative">
        <GlassCard 
          className={cn('p-6', className)}
          ref={calendarRef}
          tabIndex={0}
          onKeyDown={handleKeyDown}
          role="grid"
          aria-label={`Calendar in ${viewMode} view, ${getPeriodTitle(currentDate, viewMode)}`}
        >
          {renderCalendarHeader()}
          
          {viewMode === 'month' && renderMonthView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'day' && renderDayView()}
        </GlassCard>

      {/* Event Tooltip */}
      {showTooltip && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full"
          style={{
            left: showTooltip.x,
            top: showTooltip.y
          }}
        >
          <div className="bg-black/90 backdrop-blur-md rounded-lg border border-white/20 px-3 py-2 shadow-xl max-w-xs">
            <div className="text-white font-medium text-sm mb-1">
              {showTooltip.event.title}
            </div>
            <div className="text-white/70 text-xs space-y-1">
              <div className="flex items-center gap-2">
                <span className="capitalize">{showTooltip.event.priority} priority</span>
                <span>•</span>
                <span className="capitalize">{showTooltip.event.status}</span>
              </div>
              {showTooltip.event.originalTask?.description && (
                <div className="text-white/60 text-xs mt-1 line-clamp-2">
                  {showTooltip.event.originalTask.description}
                </div>
              )}
              <div className="text-white/50 text-xs mt-1">
                Click to view details
              </div>
            </div>
            {/* Tooltip arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black/90"></div>
            </div>
          </div>
        </div>
      )}
      </div>
    </FeatureErrorBoundary>
  );
};

interface CalendarDateCellProps {
  calendarDate: CalendarDate;
  isSelected: boolean;
  isFocused: boolean;
  onClick: () => void;
  onEventClick: (event: CalendarEvent, e?: React.MouseEvent) => void;
  onEventHover: (event: CalendarEvent, e: React.MouseEvent, isEntering: boolean) => void;
  hoveredEventId: string | null;
  viewMode: CalendarViewMode;
  className?: string;
}

const CalendarDateCell: React.FC<CalendarDateCellProps> = ({
  calendarDate,
  isSelected,
  isFocused,
  onClick,
  onEventClick,
  onEventHover,
  hoveredEventId,
  viewMode,
  className
}) => {
  const { date, isCurrentMonth, isToday, events } = calendarDate;
  
  const getCellHeight = () => {
    switch (viewMode) {
      case 'month':
        return 'min-h-24';
      case 'week':
        return 'min-h-32';
      case 'day':
        return 'min-h-96';
    }
  };

  return (
    <div
      className={cn(
        'relative rounded-xl border backdrop-blur-md cursor-pointer transition-all duration-200',
        'bg-gradient-to-br from-white/10 to-white/5 hover:from-white/15 hover:to-white/10',
        getCellHeight(),
        isToday && 'border-white/40 bg-gradient-to-br from-white/20 to-white/10',
        isSelected && 'border-white/50 bg-gradient-to-br from-white/25 to-white/15 shadow-lg shadow-white/20',
        isFocused && 'ring-2 ring-white/50 ring-offset-2 ring-offset-transparent',
        !isCurrentMonth && 'opacity-50',
        'border-white/20 hover:border-white/30 hover:shadow-lg hover:shadow-white/10',
        'focus:outline-none focus:ring-2 focus:ring-white/50',
        className
      )}
      onClick={onClick}
      tabIndex={isFocused ? 0 : -1}
      role="gridcell"
      aria-selected={isSelected}
      aria-label={`${date.toLocaleDateString()}, ${events.length} events`}
    >
      {/* Date number */}
      <div className="absolute top-2 left-2">
        <span className={cn(
          'text-sm font-medium',
          isToday ? 'text-white font-bold' : 'text-white/80',
          !isCurrentMonth && 'text-white/40'
        )}>
          {date.getDate()}
        </span>
      </div>
      
      {/* Events */}
      <div className="absolute inset-0 p-2 pt-8 overflow-hidden">
        <div className="space-y-1">
          {events.slice(0, viewMode === 'day' ? 10 : 3).map((event, index) => (
            <CalendarEventItem
              key={event.id}
              event={event}
              onClick={(e) => onEventClick(event, e)}
              onHover={(e, isEntering) => onEventHover(event, e, isEntering)}
              isHovered={hoveredEventId === event.id}
              compact={viewMode === 'month'}
            />
          ))}
          
          {events.length > (viewMode === 'day' ? 10 : 3) && (
            <div className="text-xs text-white/60 font-medium">
              +{events.length - (viewMode === 'day' ? 10 : 3)} more
            </div>
          )}
        </div>
      </div>
      
      {/* Today indicator */}
      {isToday && (
        <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full shadow-lg" />
      )}
    </div>
  );
};

interface CalendarEventItemProps {
  event: CalendarEvent;
  onClick: (e: React.MouseEvent) => void;
  onHover: (e: React.MouseEvent, isEntering: boolean) => void;
  isHovered: boolean;
  compact?: boolean;
}

const CalendarEventItem: React.FC<CalendarEventItemProps> = ({
  event,
  onClick,
  onHover,
  isHovered,
  compact = false
}) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-gradient-to-r from-white/30 to-gray-200/20 border-white/40';
      case 'medium':
        return 'bg-gradient-to-r from-white/20 to-white/15 border-white/30';
      case 'low':
        return 'bg-gradient-to-r from-white/15 to-white/10 border-white/20';
      default:
        return 'bg-gradient-to-r from-white/15 to-white/10 border-white/20';
    }
  };

  const getStatusIndicator = (status: string) => {
    switch (status) {
      case 'done':
        return '✓';
      case 'doing':
        return '◐';
      default:
        return '○';
    }
  };

  return (
    <div
      className={cn(
        'rounded-lg border backdrop-blur-sm cursor-pointer transition-all duration-200',
        'hover:scale-105 hover:shadow-lg hover:shadow-white/20',
        'focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1',
        getPriorityColor(event.priority),
        isHovered && 'scale-105 shadow-lg shadow-white/30 z-10',
        compact ? 'px-2 py-1' : 'px-3 py-2'
      )}
      onClick={onClick}
      onMouseEnter={(e) => onHover(e, true)}
      onMouseLeave={(e) => onHover(e, false)}
      tabIndex={0}
      role="button"
      aria-label={`${event.title}, ${event.priority} priority, ${event.status} status`}
    >
      <div className="flex items-center gap-2">
        <span className="text-xs text-white/80">
          {getStatusIndicator(event.status)}
        </span>
        <span className={cn(
          'font-medium text-white truncate',
          compact ? 'text-xs' : 'text-sm'
        )}>
          {event.title}
        </span>
      </div>
    </div>
  );
};