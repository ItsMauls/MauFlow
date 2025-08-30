/**
 * @jest-environment jsdom
 */

import { performance } from 'perf_hooks';
import {
  generateMonthCalendar,
  generateWeekCalendar,
  generateDayCalendar,
  tasksToCalendarEvents,
  addEventsToCalendarDates,
  navigatePrevious,
  navigateNext
} from '@/lib/calendar';
import { Task } from '@/components/tasks/TaskCard';

// Mock performance.now if not available
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now()
  } as any;
}

// Helper function to measure execution time
const measureExecutionTime = async (fn: () => void | Promise<void>): Promise<number> => {
  const start = performance.now();
  await fn();
  const end = performance.now();
  return end - start;
};

// Generate large dataset for testing
const generateLargeTasks = (count: number): Task[] => {
  const tasks: Task[] = [];
  const statuses: ('todo' | 'doing' | 'done')[] = ['todo', 'doing', 'done'];
  const priorities: ('high' | 'medium' | 'low')[] = ['high', 'medium', 'low'];
  
  for (let i = 0; i < count; i++) {
    const date = new Date(2024, 0, 1 + (i % 365)); // Spread across a year
    tasks.push({
      id: `task-${i}`,
      title: `Task ${i}`,
      status: statuses[i % statuses.length],
      priority: priorities[i % priorities.length],
      createdAt: date.toISOString(),
      dueDate: date.toISOString().split('T')[0],
      description: `Description for task ${i}`.repeat(10) // Make descriptions longer
    });
  }
  
  return tasks;
};

describe('Calendar Rendering Performance Tests', () => {
  const PERFORMANCE_THRESHOLD = {
    SMALL_DATASET: 50, // 50ms for small datasets
    MEDIUM_DATASET: 200, // 200ms for medium datasets
    LARGE_DATASET: 500, // 500ms for large datasets
    CALENDAR_GENERATION: 10, // 10ms for calendar generation
    EVENT_CONVERSION: 100, // 100ms for event conversion
    DATE_NAVIGATION: 5 // 5ms for date navigation
  };

  describe('Calendar Generation Performance', () => {
    it('should generate month calendar quickly', async () => {
      const testDate = new Date(2024, 0, 15);
      
      const executionTime = await measureExecutionTime(() => {
        generateMonthCalendar(testDate);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.CALENDAR_GENERATION);
    });

    it('should generate week calendar quickly', async () => {
      const testDate = new Date(2024, 0, 15);
      
      const executionTime = await measureExecutionTime(() => {
        generateWeekCalendar(testDate);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.CALENDAR_GENERATION);
    });

    it('should generate day calendar quickly', async () => {
      const testDate = new Date(2024, 0, 15);
      
      const executionTime = await measureExecutionTime(() => {
        generateDayCalendar(testDate);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.CALENDAR_GENERATION);
    });

    it('should handle multiple calendar generations efficiently', async () => {
      const testDate = new Date(2024, 0, 15);
      const iterations = 100;
      
      const executionTime = await measureExecutionTime(() => {
        for (let i = 0; i < iterations; i++) {
          generateMonthCalendar(testDate);
        }
      });
      
      const averageTime = executionTime / iterations;
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLD.CALENDAR_GENERATION);
    });
  });

  describe('Task to Event Conversion Performance', () => {
    it('should convert small dataset quickly', async () => {
      const tasks = generateLargeTasks(100);
      
      const executionTime = await measureExecutionTime(() => {
        tasksToCalendarEvents(tasks);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.SMALL_DATASET);
    });

    it('should convert medium dataset efficiently', async () => {
      const tasks = generateLargeTasks(1000);
      
      const executionTime = await measureExecutionTime(() => {
        tasksToCalendarEvents(tasks);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.MEDIUM_DATASET);
    });

    it('should convert large dataset within acceptable time', async () => {
      const tasks = generateLargeTasks(10000);
      
      const executionTime = await measureExecutionTime(() => {
        tasksToCalendarEvents(tasks);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.LARGE_DATASET);
    });

    it('should handle tasks without due dates efficiently', async () => {
      const tasks = generateLargeTasks(1000).map(task => ({
        ...task,
        dueDate: Math.random() > 0.5 ? task.dueDate : undefined // 50% without due dates
      }));
      
      const executionTime = await measureExecutionTime(() => {
        tasksToCalendarEvents(tasks);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.EVENT_CONVERSION);
    });
  });

  describe('Event Addition Performance', () => {
    it('should add events to calendar dates quickly', async () => {
      const testDate = new Date(2024, 0, 15);
      const calendarDates = generateMonthCalendar(testDate);
      const tasks = generateLargeTasks(500);
      const events = tasksToCalendarEvents(tasks);
      
      const executionTime = await measureExecutionTime(() => {
        addEventsToCalendarDates(calendarDates, events);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.MEDIUM_DATASET);
    });

    it('should handle dense event distribution efficiently', async () => {
      const testDate = new Date(2024, 0, 15);
      const calendarDates = generateMonthCalendar(testDate);
      
      // Create many events for the same dates
      const events = [];
      for (let i = 0; i < 1000; i++) {
        events.push({
          id: `event-${i}`,
          title: `Event ${i}`,
          date: '2024-01-15', // All on same date
          type: 'task' as const,
          priority: 'medium' as const,
          status: 'todo' as const
        });
      }
      
      const executionTime = await measureExecutionTime(() => {
        addEventsToCalendarDates(calendarDates, events);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.MEDIUM_DATASET);
    });
  });

  describe('Date Navigation Performance', () => {
    it('should navigate to previous period quickly', async () => {
      const testDate = new Date(2024, 0, 15);
      
      const executionTime = await measureExecutionTime(() => {
        navigatePrevious(testDate, 'month');
        navigatePrevious(testDate, 'week');
        navigatePrevious(testDate, 'day');
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.DATE_NAVIGATION);
    });

    it('should navigate to next period quickly', async () => {
      const testDate = new Date(2024, 0, 15);
      
      const executionTime = await measureExecutionTime(() => {
        navigateNext(testDate, 'month');
        navigateNext(testDate, 'week');
        navigateNext(testDate, 'day');
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.DATE_NAVIGATION);
    });

    it('should handle rapid navigation efficiently', async () => {
      let testDate = new Date(2024, 0, 15);
      const iterations = 100;
      
      const executionTime = await measureExecutionTime(() => {
        for (let i = 0; i < iterations; i++) {
          testDate = navigateNext(testDate, 'day');
        }
      });
      
      const averageTime = executionTime / iterations;
      expect(averageTime).toBeLessThan(PERFORMANCE_THRESHOLD.DATE_NAVIGATION / 10);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not create excessive objects during calendar generation', () => {
      const testDate = new Date(2024, 0, 15);
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Generate many calendars
      for (let i = 0; i < 1000; i++) {
        generateMonthCalendar(testDate);
      }
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });

    it('should efficiently handle large event arrays', () => {
      const testDate = new Date(2024, 0, 15);
      const calendarDates = generateMonthCalendar(testDate);
      const tasks = generateLargeTasks(10000);
      
      const initialMemory = process.memoryUsage().heapUsed;
      
      const events = tasksToCalendarEvents(tasks);
      addEventsToCalendarDates(calendarDates, events);
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be proportional to data size
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });
  });

  describe('Stress Tests', () => {
    it('should handle extreme dataset sizes', async () => {
      const tasks = generateLargeTasks(50000); // Very large dataset
      
      const executionTime = await measureExecutionTime(() => {
        const events = tasksToCalendarEvents(tasks);
        expect(events.length).toBeGreaterThan(0);
      });
      
      // Should complete within 2 seconds even for extreme datasets
      expect(executionTime).toBeLessThan(2000);
    });

    it('should handle concurrent calendar operations', async () => {
      const testDate = new Date(2024, 0, 15);
      const tasks = generateLargeTasks(1000);
      
      const executionTime = await measureExecutionTime(async () => {
        const promises = [];
        
        // Simulate concurrent operations
        for (let i = 0; i < 10; i++) {
          promises.push(Promise.resolve().then(() => {
            const calendarDates = generateMonthCalendar(testDate);
            const events = tasksToCalendarEvents(tasks);
            return addEventsToCalendarDates(calendarDates, events);
          }));
        }
        
        await Promise.all(promises);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.LARGE_DATASET);
    });

    it('should maintain performance with repeated operations', async () => {
      const testDate = new Date(2024, 0, 15);
      const tasks = generateLargeTasks(1000);
      const iterations = 50;
      
      const times: number[] = [];
      
      for (let i = 0; i < iterations; i++) {
        const time = await measureExecutionTime(() => {
          const calendarDates = generateMonthCalendar(testDate);
          const events = tasksToCalendarEvents(tasks);
          addEventsToCalendarDates(calendarDates, events);
        });
        times.push(time);
      }
      
      // Performance should not degrade significantly over time
      const firstHalf = times.slice(0, iterations / 2);
      const secondHalf = times.slice(iterations / 2);
      
      const firstHalfAvg = firstHalf.reduce((a, b) => a + b) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((a, b) => a + b) / secondHalf.length;
      
      // Second half should not be more than 50% slower than first half
      expect(secondHalfAvg).toBeLessThan(firstHalfAvg * 1.5);
    });
  });

  describe('Edge Case Performance', () => {
    it('should handle empty datasets efficiently', async () => {
      const executionTime = await measureExecutionTime(() => {
        const events = tasksToCalendarEvents([]);
        const testDate = new Date(2024, 0, 15);
        const calendarDates = generateMonthCalendar(testDate);
        addEventsToCalendarDates(calendarDates, events);
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.SMALL_DATASET);
    });

    it('should handle date edge cases efficiently', async () => {
      const edgeDates = [
        new Date(2024, 0, 1), // Start of year
        new Date(2024, 11, 31), // End of year
        new Date(2024, 1, 29), // Leap year
        new Date(2023, 1, 28), // Non-leap year
      ];
      
      const executionTime = await measureExecutionTime(() => {
        edgeDates.forEach(date => {
          generateMonthCalendar(date);
          generateWeekCalendar(date);
          generateDayCalendar(date);
        });
      });
      
      expect(executionTime).toBeLessThan(PERFORMANCE_THRESHOLD.SMALL_DATASET);
    });
  });
});