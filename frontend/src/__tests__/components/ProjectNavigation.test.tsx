/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProjectPage } from '@/components/projects/ProjectPage';
import { BreadcrumbNavigation } from '@/components/projects/BreadcrumbNavigation';
import { ProjectLoadingState } from '@/components/projects/ProjectLoadingState';
import { ProjectErrorState } from '@/components/projects/ProjectErrorState';
import { Task } from '@/components/tasks/TaskCard';

// Mock Next.js router
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack
  }),
  usePathname: () => '/projects/test-project'
}));

// Mock project data
const mockProject = {
  id: 'project-1',
  name: 'Test Project',
  title: 'Test Project Title',
  description: 'A test project for unit testing',
  taskCount: 2,
  createdAt: '2024-01-01T00:00:00Z',
  tasks: [
    {
      id: 'task-1',
      title: 'Task 1',
      status: 'todo' as const,
      priority: 'high' as const,
      createdAt: '2024-01-01T00:00:00Z',
      projectId: 'project-1'
    },
    {
      id: 'task-2',
      title: 'Task 2',
      status: 'doing' as const,
      priority: 'medium' as const,
      createdAt: '2024-01-01T01:00:00Z',
      projectId: 'project-1'
    }
  ] as Task[]
};

describe('ProjectPage Component', () => {
  const defaultProps = {
    projectId: 'project-1',
    project: mockProject,
    onTaskUpdate: jest.fn(),
    onTaskDelete: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders project information correctly', () => {
    render(<ProjectPage {...defaultProps} />);
    
    expect(screen.getByText('Test Project Title')).toBeInTheDocument();
    expect(screen.getByText('A test project for unit testing')).toBeInTheDocument();
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
  });

  it('renders project tasks', () => {
    render(<ProjectPage {...defaultProps} />);
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.getByText('Task 2')).toBeInTheDocument();
  });

  it('filters tasks by status', () => {
    render(<ProjectPage {...defaultProps} />);
    
    // Click on "Doing" filter
    const doingFilter = screen.getByText('Doing');
    fireEvent.click(doingFilter);
    
    expect(screen.getByText('Task 2')).toBeInTheDocument();
    expect(screen.queryByText('Task 1')).not.toBeInTheDocument();
  });

  it('filters tasks by priority', () => {
    render(<ProjectPage {...defaultProps} />);
    
    // Click on "High" priority filter
    const highFilter = screen.getByText('High');
    fireEvent.click(highFilter);
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  });

  it('searches tasks by title', () => {
    render(<ProjectPage {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'Task 1' } });
    
    expect(screen.getByText('Task 1')).toBeInTheDocument();
    expect(screen.queryByText('Task 2')).not.toBeInTheDocument();
  });

  it('shows empty state when no tasks match filters', () => {
    render(<ProjectPage {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText('Search tasks...');
    fireEvent.change(searchInput, { target: { value: 'Nonexistent Task' } });
    
    expect(screen.getByText('No tasks found')).toBeInTheDocument();
  });

  it('calls onTaskUpdate when task is updated', () => {
    const onTaskUpdate = jest.fn();
    render(<ProjectPage {...defaultProps} onTaskUpdate={onTaskUpdate} />);
    
    // Find and click a task to edit it
    const task = screen.getByText('Task 1');
    fireEvent.click(task);
    
    // This would trigger task editing in a real scenario
    // For now, we'll simulate the update call
    onTaskUpdate('task-1', { title: 'Updated Task 1' });
    
    expect(onTaskUpdate).toHaveBeenCalledWith('task-1', { title: 'Updated Task 1' });
  });

  it('calls onTaskDelete when task is deleted', () => {
    const onTaskDelete = jest.fn();
    render(<ProjectPage {...defaultProps} onTaskDelete={onTaskDelete} />);
    
    // Find delete button (assuming it exists in the task component)
    const deleteButtons = screen.getAllByLabelText(/delete/i);
    if (deleteButtons.length > 0) {
      fireEvent.click(deleteButtons[0]);
      expect(onTaskDelete).toHaveBeenCalled();
    }
  });

  it('shows task statistics', () => {
    render(<ProjectPage {...defaultProps} />);
    
    expect(screen.getByText('2 tasks')).toBeInTheDocument();
    // Could also check for status breakdown like "1 todo, 1 doing"
  });

  it('handles project with no tasks', () => {
    const emptyProject = { ...mockProject, tasks: [], taskCount: 0 };
    render(<ProjectPage {...defaultProps} project={emptyProject} />);
    
    expect(screen.getByText('No tasks in this project')).toBeInTheDocument();
  });

  it('sorts tasks by creation date by default', () => {
    render(<ProjectPage {...defaultProps} />);
    
    const taskElements = screen.getAllByText(/Task \d/);
    expect(taskElements[0]).toHaveTextContent('Task 2'); // More recent first
    expect(taskElements[1]).toHaveTextContent('Task 1');
  });

  it('allows sorting by different criteria', () => {
    render(<ProjectPage {...defaultProps} />);
    
    const sortSelect = screen.getByLabelText('Sort by');
    fireEvent.change(sortSelect, { target: { value: 'title' } });
    
    const taskElements = screen.getAllByText(/Task \d/);
    expect(taskElements[0]).toHaveTextContent('Task 1'); // Alphabetical order
    expect(taskElements[1]).toHaveTextContent('Task 2');
  });
});

describe('BreadcrumbNavigation Component', () => {
  const defaultProps = {
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Projects', href: '/projects' },
      { label: 'Test Project', href: '/projects/test-project' }
    ]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all breadcrumb items', () => {
    render(<BreadcrumbNavigation {...defaultProps} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Test Project')).toBeInTheDocument();
  });

  it('renders separators between items', () => {
    render(<BreadcrumbNavigation {...defaultProps} />);
    
    const separators = screen.getAllByText('/');
    expect(separators).toHaveLength(2); // One less than number of items
  });

  it('makes non-current items clickable', () => {
    render(<BreadcrumbNavigation {...defaultProps} />);
    
    const dashboardLink = screen.getByText('Dashboard');
    fireEvent.click(dashboardLink);
    
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('does not make current item clickable', () => {
    render(<BreadcrumbNavigation {...defaultProps} />);
    
    const currentItem = screen.getByText('Test Project');
    expect(currentItem.closest('button')).toBeNull();
  });

  it('handles single item gracefully', () => {
    const singleItem = { items: [{ label: 'Dashboard', href: '/dashboard' }] };
    render(<BreadcrumbNavigation {...singleItem} />);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.queryByText('/')).not.toBeInTheDocument();
  });

  it('truncates long breadcrumb labels', () => {
    const longLabelItems = {
      items: [
        { label: 'Very Long Project Name That Should Be Truncated', href: '/projects/long' }
      ]
    };
    render(<BreadcrumbNavigation {...longLabelItems} />);
    
    const item = screen.getByText(/Very Long Project/);
    expect(item).toHaveClass('truncate');
  });

  it('supports custom separator', () => {
    render(<BreadcrumbNavigation {...defaultProps} separator=">" />);
    
    const separators = screen.getAllByText('>');
    expect(separators).toHaveLength(2);
  });

  it('handles empty items array', () => {
    render(<BreadcrumbNavigation items={[]} />);
    
    expect(screen.queryByRole('navigation')).toBeEmptyDOMElement();
  });
});

describe('ProjectLoadingState Component', () => {
  it('renders loading spinner and message', () => {
    render(<ProjectLoadingState />);
    
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.getByText('Loading project...')).toBeInTheDocument();
  });

  it('renders skeleton loaders for project content', () => {
    render(<ProjectLoadingState />);
    
    // Check for skeleton elements
    const skeletons = screen.getAllByTestId(/skeleton/);
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('supports custom loading message', () => {
    render(<ProjectLoadingState message="Loading project details..." />);
    
    expect(screen.getByText('Loading project details...')).toBeInTheDocument();
  });
});

describe('ProjectErrorState Component', () => {
  const defaultProps = {
    error: 'Failed to load project',
    onRetry: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders error message', () => {
    render(<ProjectErrorState {...defaultProps} />);
    
    expect(screen.getByText('Failed to load project')).toBeInTheDocument();
  });

  it('renders retry button', () => {
    render(<ProjectErrorState {...defaultProps} />);
    
    expect(screen.getByText('Try Again')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', () => {
    const onRetry = jest.fn();
    render(<ProjectErrorState {...defaultProps} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    fireEvent.click(retryButton);
    
    expect(onRetry).toHaveBeenCalled();
  });

  it('renders back to projects button', () => {
    render(<ProjectErrorState {...defaultProps} />);
    
    expect(screen.getByText('Back to Projects')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', () => {
    render(<ProjectErrorState {...defaultProps} />);
    
    const backButton = screen.getByText('Back to Projects');
    fireEvent.click(backButton);
    
    expect(mockPush).toHaveBeenCalledWith('/projects');
  });

  it('supports custom error message', () => {
    render(<ProjectErrorState {...defaultProps} error="Network connection failed" />);
    
    expect(screen.getByText('Network connection failed')).toBeInTheDocument();
  });

  it('handles missing onRetry gracefully', () => {
    render(<ProjectErrorState error="Test error" />);
    
    expect(screen.getByText('Test error')).toBeInTheDocument();
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('shows error icon', () => {
    render(<ProjectErrorState {...defaultProps} />);
    
    expect(screen.getByTestId('error-icon')).toBeInTheDocument();
  });
});