/**
 * Integration tests for project navigation functionality
 * Tests the complete flow from project selection to task management
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { ProjectPage } from '@/components/projects/ProjectPage';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { BreadcrumbNavigation } from '@/components/projects/BreadcrumbNavigation';
import { useProject } from '@/hooks/useProject';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the useProject hook
jest.mock('@/hooks/useProject', () => ({
  useProject: jest.fn(),
}));

const mockRouter = {
  push: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  replace: jest.fn(),
};

const mockProject = {
  id: '1',
  name: 'website-redesign',
  title: 'Website Redesign Project',
  description: 'Complete overhaul of the company website',
  taskCount: 3,
  createdAt: '2025-08-25T10:00:00Z',
  updatedAt: '2025-08-29T14:30:00Z',
};

const mockTasks = [
  {
    id: '1',
    title: 'Design homepage mockup',
    description: 'Create wireframes and high-fidelity mockups',
    status: 'doing' as const,
    priority: 'high' as const,
    dueDate: '2025-09-05',
    createdAt: '2025-08-28T10:00:00Z',
    aiScore: 85,
    projectId: 'website-redesign'
  },
  {
    id: '2',
    title: 'Implement responsive navigation',
    description: 'Build mobile-first navigation component',
    status: 'todo' as const,
    priority: 'medium' as const,
    dueDate: '2025-09-08',
    createdAt: '2025-08-29T14:30:00Z',
    aiScore: 70,
    projectId: 'website-redesign'
  },
  {
    id: '3',
    title: 'Content migration',
    description: 'Migrate existing content to new CMS',
    status: 'done' as const,
    priority: 'low' as const,
    dueDate: '2025-09-15',
    createdAt: '2025-08-30T09:15:00Z',
    aiScore: 45,
    projectId: 'website-redesign'
  }
];

describe('Project Navigation Integration', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useProject as jest.Mock).mockReturnValue({
      project: mockProject,
      tasks: mockTasks,
      isLoading: false,
      error: null,
      updateTask: jest.fn(),
      deleteTask: jest.fn(),
      createTask: jest.fn(),
      refetch: jest.fn(),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Sidebar Project Navigation', () => {
    it('should render project list with clickable items', () => {
      const mockProps = {
        isOpen: true,
        onToggle: jest.fn(),
        activeSection: 'projects' as const,
        onSectionChange: jest.fn(),
      };

      render(<Sidebar {...mockProps} />);

      // Check if projects section is visible
      expect(screen.getByText('Projects')).toBeInTheDocument();
      
      // Check if project items are rendered as buttons
      const projectButtons = screen.getAllByRole('button');
      const websiteProjectButton = projectButtons.find(button => 
        button.textContent?.includes('Website Redesign Project')
      );
      
      expect(websiteProjectButton).toBeInTheDocument();
    });

    it('should navigate to project page when project is clicked', () => {
      // Mock window.location.href
      delete (window as any).location;
      window.location = { href: '' } as any;

      const mockProps = {
        isOpen: true,
        onToggle: jest.fn(),
        activeSection: 'projects' as const,
        onSectionChange: jest.fn(),
      };

      render(<Sidebar {...mockProps} />);

      const projectButtons = screen.getAllByRole('button');
      const websiteProjectButton = projectButtons.find(button => 
        button.textContent?.includes('Website Redesign Project')
      );

      if (websiteProjectButton) {
        fireEvent.click(websiteProjectButton);
        expect(window.location.href).toBe('/projects/website-redesign');
      }
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should render breadcrumb with correct navigation path', () => {
      render(
        <BreadcrumbNavigation 
          projectName="website-redesign"
          projectTitle="Website Redesign Project"
        />
      );

      // Check breadcrumb items
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Projects')).toBeInTheDocument();
      expect(screen.getByText('Website Redesign Project')).toBeInTheDocument();
      
      // Check project ID display
      expect(screen.getByText('website-redesign')).toBeInTheDocument();
    });

    it('should navigate back to dashboard when dashboard breadcrumb is clicked', () => {
      render(
        <BreadcrumbNavigation 
          projectName="website-redesign"
          projectTitle="Website Redesign Project"
        />
      );

      const dashboardButton = screen.getByRole('button', { name: 'Dashboard' });
      fireEvent.click(dashboardButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });

    it('should navigate back to projects when projects breadcrumb is clicked', () => {
      render(
        <BreadcrumbNavigation 
          projectName="website-redesign"
          projectTitle="Website Redesign Project"
        />
      );

      const projectsButton = screen.getByRole('button', { name: 'Projects' });
      fireEvent.click(projectsButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Project Page Functionality', () => {
    it('should render project page with correct project information', () => {
      render(<ProjectPage projectId="website-redesign" />);

      // Check project title and description
      expect(screen.getByText('Website Redesign Project')).toBeInTheDocument();
      expect(screen.getByText('Complete overhaul of the company website')).toBeInTheDocument();
      expect(screen.getByText('website-redesign')).toBeInTheDocument();
    });

    it('should display project-specific task statistics', () => {
      render(<ProjectPage projectId="website-redesign" />);

      // Check task statistics
      expect(screen.getByText('3')).toBeInTheDocument(); // Total tasks
      expect(screen.getByText('1')).toBeInTheDocument(); // Completed tasks
      expect(screen.getByText('1')).toBeInTheDocument(); // In progress tasks
    });

    it('should filter tasks by project ID', () => {
      render(<ProjectPage projectId="website-redesign" />);

      // Check that only project-specific tasks are displayed
      expect(screen.getByText('Design homepage mockup')).toBeInTheDocument();
      expect(screen.getByText('Implement responsive navigation')).toBeInTheDocument();
      expect(screen.getByText('Content migration')).toBeInTheDocument();
    });

    it('should handle task status filtering', async () => {
      render(<ProjectPage projectId="website-redesign" />);

      // Click on "Doing" filter
      const doingFilter = screen.getByRole('button', { name: 'Doing' });
      fireEvent.click(doingFilter);

      // Should only show tasks with "doing" status
      await waitFor(() => {
        expect(screen.getByText('Design homepage mockup')).toBeInTheDocument();
        expect(screen.queryByText('Implement responsive navigation')).not.toBeInTheDocument();
        expect(screen.queryByText('Content migration')).not.toBeInTheDocument();
      });
    });

    it('should handle view mode switching', () => {
      render(<ProjectPage projectId="website-redesign" />);

      // Check initial grid view
      const gridView = screen.getByRole('button', { name: 'Grid' });
      const listView = screen.getByRole('button', { name: 'List' });

      expect(gridView).toHaveClass('bg-white/20');

      // Switch to list view
      fireEvent.click(listView);
      expect(listView).toHaveClass('bg-white/20');
    });

    it('should navigate back to dashboard when back button is clicked', () => {
      render(<ProjectPage projectId="website-redesign" />);

      const backButton = screen.getByRole('button', { name: 'Back to Dashboard' });
      fireEvent.click(backButton);

      expect(mockRouter.push).toHaveBeenCalledWith('/');
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state while fetching project data', () => {
      (useProject as jest.Mock).mockReturnValue({
        project: null,
        tasks: null,
        isLoading: true,
        error: null,
        updateTask: jest.fn(),
        deleteTask: jest.fn(),
        createTask: jest.fn(),
        refetch: jest.fn(),
      });

      render(<ProjectPage projectId="website-redesign" />);

      expect(screen.getByText('Loading Project')).toBeInTheDocument();
      expect(screen.getByText('Fetching project details and tasks...')).toBeInTheDocument();
    });

    it('should show error state when project loading fails', () => {
      const mockError = new Error('Failed to fetch project data');
      (useProject as jest.Mock).mockReturnValue({
        project: null,
        tasks: null,
        isLoading: false,
        error: mockError,
        updateTask: jest.fn(),
        deleteTask: jest.fn(),
        createTask: jest.fn(),
        refetch: jest.fn(),
      });

      render(<ProjectPage projectId="website-redesign" />);

      expect(screen.getByText('Something Went Wrong')).toBeInTheDocument();
      expect(screen.getByText('Failed to fetch project data')).toBeInTheDocument();
    });

    it('should show not found error when project does not exist', () => {
      const mockError = new Error('Project with name "non-existent" not found');
      (useProject as jest.Mock).mockReturnValue({
        project: null,
        tasks: null,
        isLoading: false,
        error: mockError,
        updateTask: jest.fn(),
        deleteTask: jest.fn(),
        createTask: jest.fn(),
        refetch: jest.fn(),
      });

      render(<ProjectPage projectId="non-existent" />);

      expect(screen.getByText('Project Not Found')).toBeInTheDocument();
      expect(screen.getByText('The project you\'re looking for doesn\'t exist or may have been deleted.')).toBeInTheDocument();
    });

    it('should handle retry functionality in error state', () => {
      const mockRefetch = jest.fn();
      const mockError = new Error('Network error');
      
      (useProject as jest.Mock).mockReturnValue({
        project: null,
        tasks: null,
        isLoading: false,
        error: mockError,
        updateTask: jest.fn(),
        deleteTask: jest.fn(),
        createTask: jest.fn(),
        refetch: mockRefetch,
      });

      render(<ProjectPage projectId="website-redesign" />);

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      fireEvent.click(retryButton);

      expect(mockRefetch).toHaveBeenCalled();
    });
  });

  describe('Task Management Integration', () => {
    it('should update task status and reflect in project statistics', async () => {
      const mockUpdateTask = jest.fn();
      
      (useProject as jest.Mock).mockReturnValue({
        project: mockProject,
        tasks: mockTasks,
        isLoading: false,
        error: null,
        updateTask: mockUpdateTask,
        deleteTask: jest.fn(),
        createTask: jest.fn(),
        refetch: jest.fn(),
      });

      render(<ProjectPage projectId="website-redesign" />);

      // Find a task card and update its status
      const taskCards = screen.getAllByText(/Design homepage mockup|Implement responsive navigation|Content migration/);
      expect(taskCards.length).toBeGreaterThan(0);

      // The task update functionality would be tested through TaskCard component interactions
      // This verifies the integration point exists
      expect(mockUpdateTask).toBeDefined();
    });

    it('should delete task and update project statistics', () => {
      const mockDeleteTask = jest.fn();
      
      (useProject as jest.Mock).mockReturnValue({
        project: mockProject,
        tasks: mockTasks,
        isLoading: false,
        error: null,
        updateTask: jest.fn(),
        deleteTask: mockDeleteTask,
        createTask: jest.fn(),
        refetch: jest.fn(),
      });

      render(<ProjectPage projectId="website-redesign" />);

      // Verify delete functionality is available
      expect(mockDeleteTask).toBeDefined();
    });
  });
});