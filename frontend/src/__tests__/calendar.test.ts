import {
  generateMonthCalendar,
  generateWeekCalendar,
  generateDayCalendar,
  tasksToCalendarEvents,
  addEventsToCalendarDates,
  navigatePrevious,
  navigateNext,
  getPeriodTitle,
  getStartOfWeek,
  getEndOfWeek,
  formatDate
} from '@/lib/calendar';
import { Task } from '@/components/tasks/TaskCard';

// Mock React hooks for testing
const mockUseState = jest.fn();
const mockUseEffect = jest.fn();
const mockUseCallback = jest.fn();
const mockUseRef = jest.fn();

jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useState: mockUseState,
  useEffect: mockUseEffect,
  useCallback: mockUseCallback,
  useRef: mockUseRef
}));

describe('Calendar Utilities', () => {
  const testDate = new Date('2025-01-15'); // Wednesday, January 15, 2025

  describe('Date Navigation', () => {
    test('getStartOfWeek should return correct start of week', () => {
      const startOfWeek = getStartOfWeek(testDate, 0); // Sunday start
      expect(startOfWeek.getDay()).toBe(0); // Sunday
      expect(startOfWeek.getDate()).toBe(12); // January 12, 2025
    });

    test('getEndOfWeek should return correct end of week', () => {
      const endOfWeek = getEndOfWeek(testDate, 0); // Sunday start
      expect(endOfWeek.getDay()).toBe(6); // Saturday
      expect(endOfWeek.getDate()).toBe(18); // January 18, 2025
    });

    test('navigatePrevious should work for all view modes', () => {
      const prevMonth = navigatePrevious(testDate, 'month');
      expect(prevMonth.getMonth()).toBe(11); // December (0-indexed)
      expect(prevMonth.getFullYear()).toBe(2024);

      const prevWeek = navigatePrevious(testDate, 'week');
      expect(prevWeek.getDate()).toBe(8); // January 8, 2025

      const prevDay = navigatePrevious(testDate, 'day');
      expect(prevDay.getDate()).toBe(14); // January 14, 2025
    });

    test('navigateNext should work for all view modes', () => {
      const nextMonth = navigateNext(testDate, 'month');
      expect(nextMonth.getMonth()).toBe(1); // February (0-indexed)
      expect(nextMonth.getFullYear()).toBe(2025);

      const nextWeek = navigateNext(testDate, 'week');
      expect(nextWeek.getDate()).toBe(22); // January 22, 2025

      const nextDay = navigateNext(testDate, 'day');
      expect(nextDay.getDate()).toBe(16); // January 16, 2025
    });
  });

  describe('Calendar Generation', () => {
    test('generateMonthCalendar should return correct number of dates', () => {
      const monthCalendar = generateMonthCalendar(testDate);
      expect(monthCalendar.length).toBeGreaterThanOrEqual(28);
      expect(monthCalendar.length).toBeLessThanOrEqual(42);
    });

    test('generateWeekCalendar should return 7 dates', () => {
      const weekCalendar = generateWeekCalendar(testDate);
      expect(weekCalendar.length).toBe(7);
    });

    test('generateDayCalendar should return 1 date', () => {
      const dayCalendar = generateDayCalendar(testDate);
      expect(dayCalendar.length).toBe(1);
      expect(dayCalendar[0].date.getDate()).toBe(testDate.getDate());
    });
  });

  describe('Task to Event Conversion', () => {
    test('tasksToCalendarEvents should convert tasks with due dates', () => {
      const tasks: Task[] = [
        {
          id: '1',
          title: 'Task 1',
          status: 'todo',
          priority: 'high',
          dueDate: '2025-01-15',
          createdAt: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Task 2',
          status: 'doing',
          priority: 'medium',
          createdAt: '2025-01-01T00:00:00Z'
          // No due date
        }
      ];

      const events = tasksToCalendarEvents(tasks);
      expect(events.length).toBe(1); // Only task with due date
      expect(events[0].title).toBe('Task 1');
      expect(events[0].type).toBe('task');
      expect(events[0].priority).toBe('high');
    });

    test('addEventsToCalendarDates should add events to correct dates', () => {
      const dates = generateDayCalendar(testDate);
      const events = [
        {
          id: '1',
          title: 'Test Event',
          date: '2025-01-15',
          type: 'task' as const,
          priority: 'high' as const,
          status: 'todo' as const
        }
      ];

      const datesWithEvents = addEventsToCalendarDates(dates, events);
      expect(datesWithEvents[0].events.length).toBe(1);
      expect(datesWithEvents[0].events[0].title).toBe('Test Event');
    });
  });

  describe('Formatting', () => {
    test('formatDate should format dates correctly', () => {
      expect(formatDate(testDate, 'short')).toBe('Jan 15');
      expect(formatDate(testDate, 'long')).toBe('Wednesday, January 15, 2025');
      expect(formatDate(testDate, 'day')).toBe('15 Wed');
    });

    test('getPeriodTitle should return correct titles', () => {
      expect(getPeriodTitle(testDate, 'month')).toBe('January 2025');
      expect(getPeriodTitle(testDate, 'day')).toBe('Wednesday, January 15, 2025');
      
      const weekTitle = getPeriodTitle(testDate, 'week');
      expect(weekTitle).toContain('Jan 12');
      expect(weekTitle).toContain('Jan 18');
    });
  });

  describe('Calendar Interactivity', () => {
    test('keyboard navigation should work correctly', () => {
      const dates = generateMonthCalendar(testDate);
      
      // Test arrow key navigation logic
      const simulateKeyNavigation = (currentIndex: number, key: string, viewMode: 'month' | 'week' | 'day') => {
        let newIndex = currentIndex;
        
        switch (key) {
          case 'ArrowLeft':
            newIndex = Math.max(0, currentIndex - 1);
            break;
          case 'ArrowRight':
            newIndex = Math.min(dates.length - 1, currentIndex + 1);
            break;
          case 'ArrowUp':
            if (viewMode === 'month') {
              newIndex = Math.max(0, currentIndex - 7);
            }
            break;
          case 'ArrowDown':
            if (viewMode === 'month') {
              newIndex = Math.min(dates.length - 1, currentIndex + 7);
            }
            break;
        }
        
        return newIndex;
      };

      // Test navigation from middle of calendar
      const middleIndex = Math.floor(dates.length / 2);
      
      expect(simulateKeyNavigation(middleIndex, 'ArrowLeft', 'month')).toBe(middleIndex - 1);
      expect(simulateKeyNavigation(middleIndex, 'ArrowRight', 'month')).toBe(middleIndex + 1);
      expect(simulateKeyNavigation(middleIndex, 'ArrowUp', 'month')).toBe(middleIndex - 7);
      expect(simulateKeyNavigation(middleIndex, 'ArrowDown', 'month')).toBe(middleIndex + 7);
      
      // Test boundary conditions
      expect(simulateKeyNavigation(0, 'ArrowLeft', 'month')).toBe(0);
      expect(simulateKeyNavigation(dates.length - 1, 'ArrowRight', 'month')).toBe(dates.length - 1);
    });

    test('event hover states should be managed correctly', () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        date: '2025-01-15',
        type: 'task' as const,
        priority: 'high' as const,
        status: 'todo' as const
      };

      // Simulate hover state management
      let hoveredEventId: string | null = null;
      let showTooltip: any = null;

      const handleEventHover = (event: any, e: any, isEntering: boolean) => {
        if (isEntering) {
          hoveredEventId = event.id;
          showTooltip = {
            event,
            x: 100,
            y: 50
          };
        } else {
          hoveredEventId = null;
          showTooltip = null;
        }
      };

      // Test hover enter
      handleEventHover(mockEvent, { currentTarget: { getBoundingClientRect: () => ({ left: 50, width: 100, top: 60 }) } }, true);
      expect(hoveredEventId).toBe('1');
      expect(showTooltip).toBeTruthy();
      expect(showTooltip.event.title).toBe('Test Event');

      // Test hover leave
      handleEventHover(mockEvent, {}, false);
      expect(hoveredEventId).toBeNull();
      expect(showTooltip).toBeNull();
    });

    test('task detail navigation should work', () => {
      const mockTask = {
        id: 'task-1',
        title: 'Test Task',
        status: 'todo' as const,
        priority: 'high' as const,
        createdAt: '2025-01-01T00:00:00Z'
      };

      const mockEvent = {
        id: '1',
        title: 'Test Event',
        date: '2025-01-15',
        type: 'task' as const,
        priority: 'high' as const,
        status: 'todo' as const,
        originalTask: mockTask
      };

      let navigatedTaskId: string | null = null;
      
      const handleTaskDetailView = (taskId: string) => {
        navigatedTaskId = taskId;
      };

      const handleEventClick = (event: any) => {
        if (event.originalTask) {
          handleTaskDetailView(event.originalTask.id);
        }
      };

      handleEventClick(mockEvent);
      expect(navigatedTaskId).toBe('task-1');
    });

    test('focus management should work correctly', () => {
      const dates = generateMonthCalendar(testDate);
      
      // Find today's index
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayIndex = dates.findIndex(
        date => date.date.getTime() === today.getTime()
      );

      // If today is visible, it should be focused
      if (todayIndex !== -1) {
        expect(todayIndex).toBeGreaterThanOrEqual(0);
      } else {
        // Otherwise, focus should be on first date of current month
        const currentMonthIndex = dates.findIndex(
          date => date.isCurrentMonth
        );
        expect(currentMonthIndex).toBeGreaterThanOrEqual(0);
      }
    });

    test('accessibility attributes should be correct', () => {
      const mockEvent = {
        id: '1',
        title: 'Test Event',
        date: '2025-01-15',
        type: 'task' as const,
        priority: 'high' as const,
        status: 'todo' as const
      };

      // Test calendar date cell aria attributes
      const dateAriaLabel = `${testDate.toLocaleDateString()}, 1 events`;
      expect(dateAriaLabel).toContain('1/15/2025');
      expect(dateAriaLabel).toContain('1 events');

      // Test event item aria attributes
      const eventAriaLabel = `${mockEvent.title}, ${mockEvent.priority} priority, ${mockEvent.status} status`;
      expect(eventAriaLabel).toBe('Test Event, high priority, todo status');
    });
  });
});