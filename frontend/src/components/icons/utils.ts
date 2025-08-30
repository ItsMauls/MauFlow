import { IconConfig, IconSettings } from './types';

// Default icon sets organized by category
export const DEFAULT_ICONS: IconConfig[] = [
  // Status icons
  { id: 'todo', name: 'To Do', emoji: '📝', category: 'status' },
  { id: 'in-progress', name: 'In Progress', emoji: '⚡', category: 'status' },
  { id: 'completed', name: 'Completed', emoji: '✅', category: 'status' },
  { id: 'blocked', name: 'Blocked', emoji: '🚫', category: 'status' },
  { id: 'review', name: 'Review', emoji: '👀', category: 'status' },
  { id: 'testing', name: 'Testing', emoji: '🧪', category: 'status' },

  // Priority icons
  { id: 'high-priority', name: 'High Priority', emoji: '🔴', category: 'priority' },
  { id: 'medium-priority', name: 'Medium Priority', emoji: '🟡', category: 'priority' },
  { id: 'low-priority', name: 'Low Priority', emoji: '🟢', category: 'priority' },
  { id: 'urgent', name: 'Urgent', emoji: '🚨', category: 'priority' },
  { id: 'critical', name: 'Critical', emoji: '⚠️', category: 'priority' },

  // General icons
  { id: 'star', name: 'Star', emoji: '⭐', category: 'general' },
  { id: 'heart', name: 'Heart', emoji: '❤️', category: 'general' },
  { id: 'fire', name: 'Fire', emoji: '🔥', category: 'general' },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', category: 'general' },
  { id: 'target', name: 'Target', emoji: '🎯', category: 'general' },
  { id: 'lightbulb', name: 'Lightbulb', emoji: '💡', category: 'general' },
  { id: 'gear', name: 'Gear', emoji: '⚙️', category: 'general' },
  { id: 'folder', name: 'Folder', emoji: '📁', category: 'general' },
  { id: 'document', name: 'Document', emoji: '📄', category: 'general' },
  { id: 'calendar', name: 'Calendar', emoji: '📅', category: 'general' },
  { id: 'clock', name: 'Clock', emoji: '⏰', category: 'general' },
  { id: 'flag', name: 'Flag', emoji: '🏁', category: 'general' },
];

// Default title icon for the application
export const DEFAULT_TITLE_ICON = '🌊'; // MauFlow wave icon

// Create default icon settings
export const createDefaultIconSettings = (): IconSettings => ({
  titleIcon: DEFAULT_TITLE_ICON,
  defaultIcons: {
    status: {
      todo: '📝',
      'in-progress': '⚡',
      completed: '✅',
      blocked: '🚫',
      review: '👀',
      testing: '🧪',
    },
    priority: {
      high: '🔴',
      medium: '🟡',
      low: '🟢',
      urgent: '🚨',
      critical: '⚠️',
    },
  },
  customIcons: [],
});

// Get icon by ID
export const getIconById = (iconId: string, availableIcons: IconConfig[] = DEFAULT_ICONS): IconConfig | undefined => {
  return availableIcons.find(icon => icon.id === iconId);
};

// Get icons by category
export const getIconsByCategory = (category: string, availableIcons: IconConfig[] = DEFAULT_ICONS): IconConfig[] => {
  return availableIcons.filter(icon => icon.category === category);
};

// Get all available categories
export const getAvailableCategories = (availableIcons: IconConfig[] = DEFAULT_ICONS): string[] => {
  const categories = new Set(availableIcons.map(icon => icon.category));
  return Array.from(categories).sort();
};

// Validate icon configuration
export const validateIconConfig = (config: IconConfig): boolean => {
  return !!(
    config.id &&
    config.name &&
    config.emoji &&
    config.category &&
    ['status', 'priority', 'general'].includes(config.category)
  );
};

// Search icons by name or category
export const searchIcons = (query: string, availableIcons: IconConfig[] = DEFAULT_ICONS): IconConfig[] => {
  const lowercaseQuery = query.toLowerCase();
  return availableIcons.filter(icon =>
    icon.name.toLowerCase().includes(lowercaseQuery) ||
    icon.category.toLowerCase().includes(lowercaseQuery)
  );
};

// Local storage keys for icon settings
export const ICON_STORAGE_KEYS = {
  SETTINGS: 'mauflow-icon-settings',
  TITLE_ICON: 'mauflow-title-icon',
} as const;

// Load icon settings from local storage
export const loadIconSettings = (): IconSettings => {
  try {
    const stored = localStorage.getItem(ICON_STORAGE_KEYS.SETTINGS);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Merge with defaults to ensure all required properties exist
      return {
        ...createDefaultIconSettings(),
        ...parsed,
      };
    }
  } catch (error) {
    console.warn('Failed to load icon settings from localStorage:', error);
  }
  return createDefaultIconSettings();
};

// Save icon settings to local storage
export const saveIconSettings = (settings: IconSettings): void => {
  try {
    localStorage.setItem(ICON_STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (error) {
    console.warn('Failed to save icon settings to localStorage:', error);
  }
};

// Load title icon from local storage
export const loadTitleIcon = (): string => {
  try {
    const stored = localStorage.getItem(ICON_STORAGE_KEYS.TITLE_ICON);
    return stored || DEFAULT_TITLE_ICON;
  } catch (error) {
    console.warn('Failed to load title icon from localStorage:', error);
    return DEFAULT_TITLE_ICON;
  }
};

// Save title icon to local storage
export const saveTitleIcon = (iconId: string): void => {
  try {
    localStorage.setItem(ICON_STORAGE_KEYS.TITLE_ICON, iconId);
  } catch (error) {
    console.warn('Failed to save title icon to localStorage:', error);
  }
};