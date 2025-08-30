# Design Document

## Overview

This design document outlines the implementation of UI enhancements for the MauFlow project management application. The enhancements focus on four key areas: icon management system, project navigation improvements, calendar view integration, and enhanced task card functionality with comments and file attachments.

The design leverages the existing Next.js 15 + React 19 architecture with TypeScript, TailwindCSS, and React Query for state management. The current glass morphism design system will be extended to accommodate new features while maintaining visual consistency.

## Architecture

### Current System Analysis
- **Frontend Framework**: Next.js 15 with React 19
- **Styling**: TailwindCSS with custom glass morphism components
- **State Management**: React hooks with local state, React Query for server state
- **Component Structure**: Modular components with clear separation of concerns
- **Current Components**: TaskCard, Sidebar, MauFlowDashboard, AppLayout

### Enhanced Architecture
The enhancements will extend the existing architecture with:
- **Icon Management Service**: Centralized icon configuration and selection
- **Project Navigation System**: Enhanced routing and project-specific views
- **Calendar Integration**: New calendar view component with date-based task organization
- **Task Enhancement System**: Comments and file attachment capabilities

## Components and Interfaces

### 1. Icon Management System

#### IconManager Component
```typescript
interface IconConfig {
  id: string;
  name: string;
  component: React.ComponentType;
  category: 'status' | 'priority' | 'general';
}

interface IconManagerProps {
  currentIcon?: string;
  availableIcons: IconConfig[];
  onIconSelect: (iconId: string) => void;
  editable?: boolean;
}
```

#### IconSelector Component
- Modal-based icon selection interface
- Categorized icon display (status, priority, general)
- Preview functionality
- Search and filter capabilities

### 2. Project Navigation Enhancement

#### ProjectPage Component
```typescript
interface Project {
  id: string;
  name: string;
  title: string;
  description?: string;
  taskCount: number;
  createdAt: string;
  tasks: Task[];
}

interface ProjectPageProps {
  projectId: string;
  project: Project;
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void;
  onTaskDelete: (taskId: string) => void;
}
```

#### Enhanced Sidebar Navigation
- Clickable project items with navigation
- Project-specific task counts
- Active project highlighting
- Breadcrumb navigation support

### 3. Calendar View System

#### CalendarView Component
```typescript
interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  type: 'task' | 'project';
  priority: 'high' | 'medium' | 'low';
  status: 'todo' | 'doing' | 'done';
}

interface CalendarViewProps {
  events: CalendarEvent[];
  selectedDate?: string;
  onDateSelect: (date: string) => void;
  onEventClick: (event: CalendarEvent) => void;
  viewMode: 'month' | 'week' | 'day';
}
```

#### Calendar Integration Points
- View mode selector in dashboard filters
- Date-based task filtering
- Task due date visualization
- Interactive date selection

### 4. Enhanced Task Card System

#### TaskComment System
```typescript
interface TaskComment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt?: string;
}

interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedAt: string;
  downloadUrl: string;
}
```

#### Enhanced TaskCard Component
- Expandable comment section
- File attachment area
- Comment input with rich text support
- File upload with drag-and-drop
- Attachment preview and download

## Data Models

### Icon Configuration Model
```typescript
interface IconSettings {
  titleIcon: string;
  defaultIcons: {
    status: Record<string, string>;
    priority: Record<string, string>;
  };
  customIcons: IconConfig[];
}
```

### Project Model Enhancement
```typescript
interface Project {
  id: string;
  name: string;
  title: string;
  description?: string;
  taskIds: string[];
  createdAt: string;
  updatedAt?: string;
  settings: {
    iconId?: string;
    color?: string;
  };
}
```

### Task Model Enhancement
```typescript
interface Task {
  // Existing properties...
  comments: TaskComment[];
  attachments: TaskAttachment[];
  projectId?: string;
}
```

### Calendar Model
```typescript
interface CalendarData {
  tasks: Task[];
  projects: Project[];
  events: CalendarEvent[];
  viewPreferences: {
    defaultView: 'month' | 'week' | 'day';
    weekStartsOn: 0 | 1; // Sunday or Monday
  };
}
```

## Error Handling

### Icon Management Errors
- Invalid icon selection fallback to default
- Icon loading failure with placeholder display
- Icon configuration corruption recovery

### Project Navigation Errors
- Non-existent project ID handling with 404 page
- Project loading failures with retry mechanism
- Navigation state corruption recovery

### Calendar View Errors
- Date parsing errors with fallback to current date
- Event loading failures with empty state display
- Calendar rendering errors with fallback to list view

### Task Enhancement Errors
- Comment submission failures with retry and local storage
- File upload errors with progress indication and retry
- Attachment download failures with error messaging
- File size and type validation with user feedback

## Testing Strategy

### Unit Testing
- Icon management utilities and components
- Project navigation logic and routing
- Calendar date calculations and event mapping
- Task comment and attachment functionality

### Integration Testing
- Icon selection flow end-to-end
- Project navigation with task filtering
- Calendar view switching and event interaction
- Task card expansion with comments and attachments

### User Experience Testing
- Icon selection usability and performance
- Project navigation flow and discoverability
- Calendar view responsiveness and interaction
- Task enhancement feature adoption and usage

### Performance Testing
- Icon loading and caching efficiency
- Project page rendering with large task lists
- Calendar view performance with many events
- File upload and attachment handling performance

## Implementation Considerations

### Icon Management
- Use React.lazy for icon component loading
- Implement icon caching strategy
- Provide fallback icons for missing selections
- Maintain backward compatibility with existing icons

### Project Navigation
- Implement proper URL routing with Next.js router
- Add loading states for project page transitions
- Cache project data to improve navigation performance
- Implement breadcrumb navigation for deep linking

### Calendar Integration
- Use date-fns or similar library for date calculations
- Implement virtual scrolling for large date ranges
- Add keyboard navigation support
- Ensure accessibility compliance for date selection

### Task Enhancements
- Implement optimistic updates for comments
- Add file upload progress indicators
- Implement comment editing and deletion
- Add attachment preview for common file types
- Implement proper file storage and retrieval system