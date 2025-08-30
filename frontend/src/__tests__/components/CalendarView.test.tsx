/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CalendarView } from '@/components/calendar/CalendarView';
import { CalendarEvent, CalendarViewMode } from '@/lib/calendar';
import { Task } from '@/components/tasks/TaskCard';

// Mock calendar utilities
jest.mock('@/lib/calendar', () => ({
  ...jest.requireActual('@/lib/calendar'),
  generateMonthCalendar: jest.fn(),
  generateWeekCalendar: jest.fn(),
  generateDayCalendar: jest.fn(),
  tasksToCalendarEvents: jest.fn(),
  addEventsToCalendarDates: jest.fn(),
  navigatePrevious: jest.fn(),
  navigateNext: jest.fn(),
  getPeriodTitle: jest.fn()
}));

const mockCalendarLib = require('@/lib/calendar');

// Mock data
const mockTasks: Task[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    status: 'todo',
    priority: 'high',
    createdAt: '2024-01-01T00:00:00Z',
    dueDate: '2024-01-15'
  },
  {
    id: 'task-2',
    title: 'Task 2',
    status: 'doing',
    priority: 'medium',
    createdAt: '2024-01-01T00:00:00Z',
    dueDate: '2024-01-16'
  }
];

const mockEvents: CalendarEvent[] = [
  {
    id: 'task-1',
    title: 'Task 1',
    date: '2024-01-15',
    type: 'task',
    priority: 'high',
    status: 'todo'
  },
  {
    id: 'task-2',
    title: 'Task 2',
    date: '2024-01-16',
    type: 'task',
    priority: 'medium',
    status: 'doing'
  }
];

const mockCalendarDates = [
  {
    date: new Date('2024-01-15'),
    isCurrentMonth: true,
    isToday: false,
    isSelected: false,
    events: [mockEvents[0]]
  },
  {
    date: new Date('2024-01-16'),
    isCurrentMonth: true,
    isToday: true,
    isSelected: false,
    events: [mockEvents[1]]
  }
];

describe('CalendarView Component', () => {
  const defaultProps = {
    tasks: mockTasks,
    selectedDate: '2024-01-15',
    onDateSelect: jest.fn(),
    onEventClick: jest.fn(),
    viewMode: 'month' as CalendarViewMode
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockCalendarLib.generateMonthCalendar.mockReturnValue(mockCalendarDates);
    mockCalendarLib.generateWeekCalendar.mockReturnValue(mockCalendarDates);
    mockCalendarLib.generateDayCalendar.mockReturnValue([mockCalendarDates[0]]);
    mockCalendarLib.tasksToCalendarEvents.mockReturnValue(mockEvents);
    mockCalendarLib.addEventsToCalendarDates.mockReturnValue(mockCalendarDates);
    mockCalendarLib.navigatePrevious.mockReturnValue(new Date('2023-12-15'));
    mockCalendarLib.navigateNext.mockReturnValue(new Date('2024-02-15'));
    mockCalendarLib.getPeriodTitle.mockReturnValue('January 2024');
  });

  it('renders calendar with correct title', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('January 2024')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByLabelText('Previous period')).toBeInTheDocument();
    expect(screen.getByLabelText('Next period')).toBeInTheDocument();
  });

  it('renders view mode selector', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Week')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
  });

  it('renders calendar dates', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument();
  });

  it('renders events on calendar dates', () => {
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('highlights today', () => {
    render(<CalendarView {...defaultProps} />);
    
    const todayCell = screen.getByText('16').closest('[data-testid="calendar-date"]');
    expect(todayCell).toHaveClass('bg-blue-100');
  });

  it('highlights selected date', () => {
    render(<CalendarView {...defaultProps} />);
    
    const selectedCell = screen.getByText('15').closest('[data-testid="calendar-date"]');
    expect(selectedCell).toHaveClass('ring-2');
  });

  it('calls onDateSelect when date is clicked', () => {
    const onDateSelect = jest.fn();
    render(<CalendarView {...defaultProps} onDateSelect={onDateSelect} />);
    
    const dateCell = screen.getByText('15');
    fireEvent.click(dateCell);
    
    expect(onDateSelect).toHaveBeenCalledWith('2024-01-15');
  });

  it('calls onEventClick when event is clicked', () => {
    const onEventClick = jest.fn();
    render(<CalendarView {...defaultProps} onEventClick={onEventClick} />);
    
    const event = screen.getByText('Task 1');
    fireEvent.click(event);
    
    expect(onEventClick).toHaveBeenCalledWith(mockEvents[0]);
  });

  it('navigates to previous period', () => {
    render(<CalendarView {...defaultProps} />);
    
    const prevButton = screen.getByLabelText('Previous period');
    fireEvent.click(prevButton);
    
    expect(mockCalendarLib.navigatePrevious).toHaveBeenCalledWith(
      expect.any(Date),
      'month'
    );
  });

  it('navigates to next period', () => {
    render(<CalendarView {...defaultProps} />);
    
    const nextButton = screen.getByLabelText('Next period');
    fireEvent.click(nextButton);
    
    expect(mockCalendarLib.navigateNext).toHaveBeenCalledWith(
      expect.any(Date),
      'month'
    );
  });

  it('changes view mode', () => {
    const { rerender } = render(<CalendarView {...defaultProps} />);
    
    const weekButton = screen.getByText('Week');
    fireEvent.click(weekButton);
    
    rerender(<CalendarView {...defaultProps} viewMode="week" />);
    
    expect(mockCalendarLib.generateWeekCalendar).toHaveBeenCalled();
  });

  it('handles keyboard navigation', () => {
    render(<CalendarView {...defaultProps} />);
    
    const calendar = screen.getByRole('grid');
    fireEvent.keyDown(calendar, { key: 'ArrowRight' });
    
    // Should navigate to next date
    expect(defaultProps.onDateSelect).toHaveBeenCalled();
  });

  it('shows event tooltips on hover', async () => {
    render(<CalendarView {...defaultProps} />);
    
    const event = screen.getByText('Task 1');
    fireEvent.mouseEnter(event);
    
    await waitFor(() => {
      expect(screen.getByText('High priority')).toBeInTheDocument();
    });
  });

  it('handles empty tasks array', () => {
    render(<CalendarView {...defaultProps} tasks={[]} />);
    
    expect(mockCalendarLib.tasksToCalendarEvents).toHaveBeenCalledWith([]);
  });

  it('filters events by status', () => {
    render(<CalendarView {...defaultProps} statusFilter="todo" />);
    
    expect(mockCalendarLib.tasksToCalendarEvents).toHaveBeenCalledWith(
      mockTasks.filter(task => task.status === 'todo')
    );
  });

  it('renders month view correctly', () => {
    render(<CalendarView {...defaultProps} viewMode="month" />);
    
    expect(mockCalendarLib.generateMonthCalendar).toHaveBeenCalled();
    expect(screen.getByText('Sun')).toBeInTheDocument();
    expect(screen.getByText('Mon')).toBeInTheDocument();
  });

  it('renders week view correctly', () => {
    render(<CalendarView {...defaultProps} viewMode="week" />);
    
    expect(mockCalendarLib.generateWeekCalendar).toHaveBeenCalled();
  });

  it('renders day view correctly', () => {
    render(<CalendarView {...defaultProps} viewMode="day" />);
    
    expect(mockCalendarLib.generateDayCalendar).toHaveBeenCalled();
  });

  it('shows loading state', () => {
    render(<CalendarView {...defaultProps} isLoading={true} />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading calendar...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<CalendarView {...defaultProps} error="Failed to load calendar" />);
    
    expect(screen.getByText('Failed to load calendar')).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('handles retry from error state', () => {
    const onRetry = jest.fn();
    render(<CalendarView {...defaultProps} error="Failed to load" onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalled();
  });

  it('shows event count indicator', () => {
    render(<CalendarView {...defaultProps} />);
    
    const dateWithEvents = screen.getByText('15').closest('[data-testid="calendar-date"]');
    expect(dateWithEvents).toContainHTML('1 event');
  });

  it('handles multiple events on same date', () => {
    const multipleEventsDate = {
      ...mockCalendarDates[0],
      events: [mockEvents[0], mockEvents[1]]
    };
    
    mockCalendarLib.addEventsToCalendarDates.mockReturnValue([multipleEventsDate]);
    
    render(<CalendarView {...defaultProps} />);
    
    expect(screen.getByText('2 events')).toBeInTheDocument();
  });

  it('supports custom event colors by priority', () => {
    render(<CalendarView {...defaultProps} />);
    
    const highPriorityEvent = screen.getByText('Task 1');
    expect(highPriorityEvent).toHaveClass('bg-red-100');
    
    const mediumPriorityEvent = screen.getByText('Task 2');
    expect(mediumPriorityEvent).toHaveClass('bg-yellow-100');
  });

  it('handles focus management', () => {
    render(<CalendarView {...defaultProps} />);
    
    const firstDate = screen.getByText('15');
    firstDate.focus();
    
    expect(document.activeElement).toBe(firstDate);
  });

  it('supports accessibility features', () => {
    render(<CalendarView {...defaultProps} />);
    
    const calendar = screen.getByRole('grid');
    expect(calendar).toHaveAttribute('aria-label', 'Calendar');
    
    const dateCell = screen.getByText('15').closest('[role="gridcell"]');
    expect(dateCell).toHaveAttribute('aria-label');
  });

  it('handles responsive design', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 640
    });

    render(<CalendarView {...defaultProps} />);
    
    // Should adapt layout for mobile
    expect(screen.getByTestId('calendar-container')).toHaveClass('mobile-layout');
  });
});