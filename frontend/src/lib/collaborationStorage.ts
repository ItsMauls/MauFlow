/**
 * Local Storage Utilities for Collaboration Features
 * Handles persistence of collaboration state including delegations, notifications, and team data
 */

import { 
  TaskDelegation, 
  Notification, 
  TeamMember, 
  User,
  EnhancedTask 
} from '@/types/collaboration';

// Storage Keys
const STORAGE_KEYS = {
  DELEGATIONS: 'mauflow_delegations',
  NOTIFICATIONS: 'mauflow_notifications',
  TEAM_MEMBERS: 'mauflow_team_members',
  CURRENT_USER: 'mauflow_current_user',
  ENHANCED_TASKS: 'mauflow_enhanced_tasks',
  NOTIFICATION_PREFERENCES: 'mauflow_notification_preferences',
  COLLABORATION_STATE: 'mauflow_collaboration_state'
} as const;

// Generic Storage Utilities
class CollaborationStorage {
  private static getItem<T>(key: string, defaultValue: T): T {
    try {
      if (typeof window === 'undefined') return defaultValue;
      
      const item = localStorage.getItem(key);
      if (!item) return defaultValue;
      
      return JSON.parse(item);
    } catch (error) {
      console.warn(`Failed to parse localStorage item ${key}:`, error);
      return defaultValue;
    }
  }

  private static setItem<T>(key: string, value: T): void {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error(`Failed to save to localStorage ${key}:`, error);
    }
  }

  private static removeItem(key: string): void {
    try {
      if (typeof window === 'undefined') return;
      
      localStorage.removeItem(key);
    } catch (error) {
      console.error(`Failed to remove from localStorage ${key}:`, error);
    }
  }

  // Delegation Storage
  static getDelegations(): TaskDelegation[] {
    return this.getItem(STORAGE_KEYS.DELEGATIONS, []);
  }

  static saveDelegations(delegations: TaskDelegation[]): void {
    this.setItem(STORAGE_KEYS.DELEGATIONS, delegations);
  }

  static addDelegation(delegation: TaskDelegation): void {
    const delegations = this.getDelegations();
    const existingIndex = delegations.findIndex(d => d.id === delegation.id);
    
    if (existingIndex >= 0) {
      delegations[existingIndex] = delegation;
    } else {
      delegations.push(delegation);
    }
    
    this.saveDelegations(delegations);
  }

  static updateDelegation(delegationId: string, updates: Partial<TaskDelegation>): void {
    const delegations = this.getDelegations();
    const index = delegations.findIndex(d => d.id === delegationId);
    
    if (index >= 0) {
      delegations[index] = { ...delegations[index], ...updates };
      this.saveDelegations(delegations);
    }
  }

  static removeDelegation(delegationId: string): void {
    const delegations = this.getDelegations();
    const filtered = delegations.filter(d => d.id !== delegationId);
    this.saveDelegations(filtered);
  }

  static getDelegationsByTaskId(taskId: string): TaskDelegation[] {
    return this.getDelegations().filter(d => d.taskId === taskId);
  }

  static getDelegationsByAssigneeId(assigneeId: string): TaskDelegation[] {
    return this.getDelegations().filter(d => d.assigneeId === assigneeId);
  }

  // Notification Storage
  static getNotifications(): Notification[] {
    return this.getItem(STORAGE_KEYS.NOTIFICATIONS, []);
  }

  static saveNotifications(notifications: Notification[]): void {
    this.setItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
  }

  static addNotification(notification: Notification): void {
    const notifications = this.getNotifications();
    notifications.unshift(notification); // Add to beginning for chronological order
    this.saveNotifications(notifications);
  }

  static markNotificationAsRead(notificationId: string): void {
    const notifications = this.getNotifications();
    const index = notifications.findIndex(n => n.id === notificationId);
    
    if (index >= 0) {
      notifications[index] = {
        ...notifications[index],
        isRead: true,
        readAt: new Date().toISOString()
      };
      this.saveNotifications(notifications);
    }
  }

  static markAllNotificationsAsRead(recipientId: string): void {
    const notifications = this.getNotifications();
    const updated = notifications.map(notification => 
      notification.recipientId === recipientId && !notification.isRead
        ? { ...notification, isRead: true, readAt: new Date().toISOString() }
        : notification
    );
    this.saveNotifications(updated);
  }

  static removeNotification(notificationId: string): void {
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => n.id !== notificationId);
    this.saveNotifications(filtered);
  }

  static getNotificationsByRecipientId(recipientId: string): Notification[] {
    return this.getNotifications().filter(n => n.recipientId === recipientId);
  }

  static getUnreadNotificationCount(recipientId: string): number {
    return this.getNotifications().filter(
      n => n.recipientId === recipientId && !n.isRead
    ).length;
  }

  static clearOldNotifications(daysOld: number = 30): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const notifications = this.getNotifications();
    const filtered = notifications.filter(n => 
      new Date(n.createdAt) > cutoffDate
    );
    
    this.saveNotifications(filtered);
  }

  // Team Members Storage
  static getTeamMembers(): TeamMember[] {
    return this.getItem(STORAGE_KEYS.TEAM_MEMBERS, []);
  }

  static saveTeamMembers(teamMembers: TeamMember[]): void {
    this.setItem(STORAGE_KEYS.TEAM_MEMBERS, teamMembers);
  }

  static updateTeamMemberStatus(memberId: string, isOnline: boolean, lastSeen?: string): void {
    const teamMembers = this.getTeamMembers();
    const index = teamMembers.findIndex(m => m.id === memberId);
    
    if (index >= 0) {
      teamMembers[index] = {
        ...teamMembers[index],
        isOnline,
        lastSeen: lastSeen || new Date().toISOString()
      };
      this.saveTeamMembers(teamMembers);
    }
  }

  static getTeamMemberById(memberId: string): TeamMember | undefined {
    return this.getTeamMembers().find(m => m.id === memberId);
  }

  static getOnlineTeamMembers(): TeamMember[] {
    return this.getTeamMembers().filter(m => m.isOnline);
  }

  // Current User Storage
  static getCurrentUser(): User | null {
    return this.getItem(STORAGE_KEYS.CURRENT_USER, null);
  }

  static saveCurrentUser(user: User): void {
    this.setItem(STORAGE_KEYS.CURRENT_USER, user);
  }

  static clearCurrentUser(): void {
    this.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  // Enhanced Tasks Storage
  static getEnhancedTasks(): EnhancedTask[] {
    return this.getItem(STORAGE_KEYS.ENHANCED_TASKS, []);
  }

  static saveEnhancedTasks(tasks: EnhancedTask[]): void {
    this.setItem(STORAGE_KEYS.ENHANCED_TASKS, tasks);
  }

  static updateEnhancedTask(taskId: string, updates: Partial<EnhancedTask>): void {
    const tasks = this.getEnhancedTasks();
    const index = tasks.findIndex(t => t.id === taskId);
    
    if (index >= 0) {
      tasks[index] = { ...tasks[index], ...updates };
      this.saveEnhancedTasks(tasks);
    }
  }

  static addEnhancedTask(task: EnhancedTask): void {
    const tasks = this.getEnhancedTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    
    this.saveEnhancedTasks(tasks);
  }

  static getEnhancedTaskById(taskId: string): EnhancedTask | undefined {
    return this.getEnhancedTasks().find(t => t.id === taskId);
  }

  // Notification Preferences Storage
  static getNotificationPreferences(): Record<string, boolean> {
    return this.getItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, {
      task_delegated: true,
      task_completed: true,
      task_updated: true,
      comment_mention: true,
      comment_reply: true,
      delegation_revoked: true
    });
  }

  static saveNotificationPreferences(preferences: Record<string, boolean>): void {
    this.setItem(STORAGE_KEYS.NOTIFICATION_PREFERENCES, preferences);
  }

  static updateNotificationPreference(type: string, enabled: boolean): void {
    const preferences = this.getNotificationPreferences();
    preferences[type] = enabled;
    this.saveNotificationPreferences(preferences);
  }

  // General Collaboration State
  static getCollaborationState(): Record<string, any> {
    return this.getItem(STORAGE_KEYS.COLLABORATION_STATE, {});
  }

  static saveCollaborationState(state: Record<string, any>): void {
    this.setItem(STORAGE_KEYS.COLLABORATION_STATE, state);
  }

  static updateCollaborationState(key: string, value: any): void {
    const state = this.getCollaborationState();
    state[key] = value;
    this.saveCollaborationState(state);
  }

  // Utility Methods
  static clearAllCollaborationData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      this.removeItem(key);
    });
  }

  static exportCollaborationData(): Record<string, any> {
    const data: Record<string, any> = {};
    
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      data[name] = this.getItem(key, null);
    });
    
    return data;
  }

  static importCollaborationData(data: Record<string, any>): void {
    Object.entries(STORAGE_KEYS).forEach(([name, key]) => {
      if (data[name] !== undefined) {
        this.setItem(key, data[name]);
      }
    });
  }

  // Data Migration Utilities
  static migrateData(fromVersion: string, toVersion: string): void {
    // Placeholder for future data migration logic
    console.log(`Migrating collaboration data from ${fromVersion} to ${toVersion}`);
    
    // Example migration logic:
    // if (fromVersion === '1.0' && toVersion === '1.1') {
    //   // Perform specific migration steps
    // }
  }

  static getDataVersion(): string {
    return this.getItem('mauflow_data_version', '1.0');
  }

  static setDataVersion(version: string): void {
    this.setItem('mauflow_data_version', version);
  }
}

export default CollaborationStorage;