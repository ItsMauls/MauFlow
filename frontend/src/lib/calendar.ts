import { Task } from '@/components/tasks/TaskCard';

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'project';
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'doing' | 'done';
  originalTask?: Task;
}

export type CalendarViewMode = 'month' | 'week' | 'day';

export interface CalendarDate {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  events: CalendarEvent[];
}

/**
 * Get the start of the week for a given date
 */
export function getStartOfWeek(date: Date, weekStartsOn: 0 | 1 = 0): Date {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the week for a given date
 */
export function getEndOfWeek(date: Date, weekStartsOn: 0 | 1 = 0): Date {
  const result = getStartOfWeek(date, weekStartsOn);
  result.setDate(result.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Get the start of the month for a given date
 */
export function getStartOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setDate(1);
  result.setHours(0, 0, 0, 0);
  return result;
}

/**
 * Get the end of the month for a given date
 */
export function getEndOfMonth(date: Date): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + 1, 0);
  result.setHours(23, 59, 59, 999);
  return result;
}

/**
 * Generate calendar dates for month view
 */
export function generateMonthCalendar(
  date: Date,
  weekStartsOn: 0 | 1 = 0
): CalendarDate[] {
  const monthStart = getStartOfMonth(date);
  const monthEnd = getEndOfMonth(date);
  const calendarStart = getStartOfWeek(monthStart, weekStartsOn);
  const calendarEnd = getEndOfWeek(monthEnd, weekStartsOn);

  const dates: CalendarDate[] = [];
  const current = new Date(calendarStart);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (current <= calendarEnd) {
    const currentDate = new Date(current);
    dates.push({
      date: currentDate,
      isCurrentMonth: currentDate.getMonth() === date.getMonth(),
      isToday: currentDate.getTime() === today.getTime(),
      isSelected: false,
      events: []
    });
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Generate calendar dates for week view
 */
export function generateWeekCalendar(
  date: Date,
  weekStartsOn: 0 | 1 = 0
): CalendarDate[] {
  const weekStart = getStartOfWeek(date, weekStartsOn);
  const dates: CalendarDate[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 7; i++) {
    const currentDate = new Date(weekStart);
    currentDate.setDate(weekStart.getDate() + i);
    
    dates.push({
      date: currentDate,
      isCurrentMonth: true, // All days in week view are considered "current"
      isToday: currentDate.getTime() === today.getTime(),
      isSelected: false,
      events: []
    });
  }

  return dates;
}

/**
 * Generate calendar date for day view
 */
export function generateDayCalendar(date: Date): CalendarDate[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  return [{
    date: targetDate,
    isCurrentMonth: true,
    isToday: targetDate.getTime() === today.getTime(),
    isSelected: false,
    events: []
  }];
}

/**
 * Convert tasks to calendar events
 */
export function tasksToCalendarEvents(tasks: Task[]): CalendarEvent[] {
  return tasks
    .filter(task => task.dueDate) // Only tasks with due dates
    .map(task => ({
      id: task.id,
      title: task.title,
      date: task.dueDate!,
      type: 'task' as const,
      priority: task.priority,
      status: task.status,
      originalTask: task
    }));
}

/**
 * Convert filtered tasks to calendar events with status filtering
 */
export function tasksToFilteredCalendarEvents(
  tasks: Task[],
  statusFilter: 'all' | 'todo' | 'doing' | 'done' = 'all'
): CalendarEvent[] {
  let filteredTasks = tasks.filter(task => task.dueDate);
  
  if (statusFilter !== 'all') {
    filteredTasks = filteredTasks.filter(task => task.status === statusFilter);
  }
  
  return filteredTasks.map(task => ({
    id: task.id,
    title: task.title,
    date: task.dueDate!,
    type: 'task' as const,
    priority: task.priority,
    status: task.status,
    originalTask: task
  }));
}

/**
 * Add events to calendar dates
 */
export function addEventsToCalendarDates(
  dates: CalendarDate[],
  events: CalendarEvent[]
): CalendarDate[] {
  return dates.map(calendarDate => {
    const dateString = calendarDate.date.toISOString().split('T')[0];
    const dayEvents = events.filter(event => event.date === dateString);
    
    return {
      ...calendarDate,
      events: dayEvents
    };
  });
}

/**
 * Format date for display
 */
export function formatDate(date: Date, format: 'short' | 'long' | 'day' = 'short'): string {
  switch (format) {
    case 'long':
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    case 'day':
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        day: 'numeric'
      });
    default:
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      });
  }
}

/**
 * Get month name
 */
export function getMonthName(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long' });
}

/**
 * Get year
 */
export function getYear(date: Date): number {
  return date.getFullYear();
}

/**
 * Navigate to previous period
 */
export function navigatePrevious(date: Date, viewMode: CalendarViewMode): Date {
  const result = new Date(date);
  
  switch (viewMode) {
    case 'month':
      result.setMonth(result.getMonth() - 1);
      break;
    case 'week':
      result.setDate(result.getDate() - 7);
      break;
    case 'day':
      result.setDate(result.getDate() - 1);
      break;
  }
  
  return result;
}

/**
 * Navigate to next period
 */
export function navigateNext(date: Date, viewMode: CalendarViewMode): Date {
  const result = new Date(date);
  
  switch (viewMode) {
    case 'month':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'week':
      result.setDate(result.getDate() + 7);
      break;
    case 'day':
      result.setDate(result.getDate() + 1);
      break;
  }
  
  return result;
}

/**
 * Get period title for display
 */
export function getPeriodTitle(date: Date, viewMode: CalendarViewMode): string {
  switch (viewMode) {
    case 'month':
      return `${getMonthName(date)} ${getYear(date)}`;
    case 'week':
      const weekStart = getStartOfWeek(date);
      const weekEnd = getEndOfWeek(date);
      return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    case 'day':
      return formatDate(date, 'long');
  }
}