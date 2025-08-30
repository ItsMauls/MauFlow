'use client';

import { useState, useEffect, useCallback } from 'react';
import { Task } from '@/components/tasks/TaskCard';

export interface Project {
  id: string;
  name: string;
  title: string;
  description?: string;
  taskCount: number;
  createdAt: string;
  updatedAt?: string;
  settings?: {
    iconId?: string;
    color?: string;
  };
}

interface UseProjectReturn {
  project: Project | null;
  tasks: Task[] | null;
  isLoading: boolean;
  error: Error | null;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  createTask: (taskData: Omit<Task, 'id' | 'createdAt'>) => void;
  refetch: () => void;
}

// Mock data for development
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'website-redesign',
    title: 'Website Redesign Project',
    description: 'Complete overhaul of the company website with modern design and improved UX',
    taskCount: 8,
    createdAt: '2025-08-25T10:00:00Z',
    updatedAt: '2025-08-29T14:30:00Z',
    settings: {
      iconId: 'web',
      color: 'blue'
    }
  },
  {
    id: '2',
    name: 'mobile-app',
    title: 'Mobile App Development',
    description: 'Native mobile application for iOS and Android platforms',
    taskCount: 12,
    createdAt: '2025-08-20T14:30:00Z',
    settings: {
      iconId: 'mobile',
      color: 'purple'
    }
  },
  {
    id: '3',
    name: 'marketing-campaign',
    title: 'Q4 Marketing Campaign',
    description: 'Comprehensive marketing strategy for the fourth quarter',
    taskCount: 5,
    createdAt: '2025-08-28T09:15:00Z',
    settings: {
      iconId: 'marketing',
      color: 'green'
    }
  }
];

const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Design homepage mockup',
    description: 'Create wireframes and high-fidelity mockups for the new homepage',
    status: 'doing',
    priority: 'high',
    dueDate: '2025-09-05',
    createdAt: '2025-08-28T10:00:00Z',
    aiScore: 85,
    projectId: 'website-redesign'
  },
  {
    id: '2',
    title: 'Implement responsive navigation',
    description: 'Build mobile-first navigation component with accessibility features',
    status: 'todo',
    priority: 'medium',
    dueDate: '2025-09-08',
    createdAt: '2025-08-29T14:30:00Z',
    aiScore: 70,
    projectId: 'website-redesign'
  },
  {
    id: '3',
    title: 'Content migration',
    description: 'Migrate existing content to new CMS structure',
    status: 'todo',
    priority: 'low',
    dueDate: '2025-09-15',
    createdAt: '2025-08-30T09:15:00Z',
    aiScore: 45,
    projectId: 'website-redesign'
  },
  {
    id: '4',
    title: 'User authentication flow',
    description: 'Implement secure login and registration system',
    status: 'doing',
    priority: 'high',
    dueDate: '2025-09-10',
    createdAt: '2025-08-27T16:45:00Z',
    aiScore: 90,
    projectId: 'mobile-app'
  },
  {
    id: '5',
    title: 'Push notification setup',
    description: 'Configure Firebase Cloud Messaging for push notifications',
    status: 'todo',
    priority: 'medium',
    dueDate: '2025-09-12',
    createdAt: '2025-08-29T11:20:00Z',
    aiScore: 75,
    projectId: 'mobile-app'
  },
  {
    id: '6',
    title: 'App store optimization',
    description: 'Optimize app store listings and metadata',
    status: 'done',
    priority: 'medium',
    dueDate: '2025-08-30',
    createdAt: '2025-08-25T08:00:00Z',
    aiScore: 60,
    projectId: 'mobile-app'
  },
  {
    id: '7',
    title: 'Social media strategy',
    description: 'Develop comprehensive social media marketing plan',
    status: 'doing',
    priority: 'high',
    dueDate: '2025-09-03',
    createdAt: '2025-08-28T12:00:00Z',
    aiScore: 80,
    projectId: 'marketing-campaign'
  },
  {
    id: '8',
    title: 'Email campaign templates',
    description: 'Design and code responsive email templates',
    status: 'todo',
    priority: 'medium',
    dueDate: '2025-09-07',
    createdAt: '2025-08-29T15:30:00Z',
    aiScore: 65,
    projectId: 'marketing-campaign'
  }
];

export const useProject = (projectId: string): UseProjectReturn => {
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Simulate API call with loading delay
  const fetchProjectData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 800));

      // Find project by name (projectId is the project name)
      const foundProject = mockProjects.find(p => p.name === projectId);
      
      if (!foundProject) {
        throw new Error(`Project with name "${projectId}" not found`);
      }

      // Get tasks for this project
      const projectTasks = mockTasks.filter(task => task.projectId === projectId);

      // Update task count
      const updatedProject = {
        ...foundProject,
        taskCount: projectTasks.length
      };

      setProject(updatedProject);
      setTasks(mockTasks); // Return all tasks, filtering will be done in component
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch project data'));
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Initial data fetch
  useEffect(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  // Task management functions
  const updateTask = useCallback((taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => {
      if (!prevTasks) return null;
      
      return prevTasks.map(task => {
        if (task.id === taskId) {
          const updatedTask = { 
            ...task, 
            ...updates,
            updatedAt: new Date().toISOString()
          };
          
          // Celebrate when task is completed
          if (updates.status === 'done' && task.status !== 'done') {
            setTimeout(() => {
              const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
              if (taskElement) {
                taskElement.classList.add('animate-celebrate');
                setTimeout(() => {
                  taskElement.classList.remove('animate-celebrate');
                }, 600);
              }
            }, 100);
          }
          
          return updatedTask;
        }
        return task;
      });
    });

    // Update project task count if needed
    if (updates.status) {
      setProject(prevProject => {
        if (!prevProject) return null;
        
        const projectTasks = tasks?.filter(t => t.projectId === projectId) || [];
        return {
          ...prevProject,
          taskCount: projectTasks.length,
          updatedAt: new Date().toISOString()
        };
      });
    }
  }, [tasks, projectId]);

  const deleteTask = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      if (!prevTasks) return null;
      return prevTasks.filter(task => task.id !== taskId);
    });

    // Update project task count
    setProject(prevProject => {
      if (!prevProject) return null;
      
      const remainingTasks = tasks?.filter(t => t.projectId === projectId && t.id !== taskId) || [];
      return {
        ...prevProject,
        taskCount: remainingTasks.length,
        updatedAt: new Date().toISOString()
      };
    });
  }, [tasks, projectId]);

  const createTask = useCallback((taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      aiScore: Math.floor(Math.random() * 100)
    };

    setTasks(prevTasks => {
      if (!prevTasks) return [newTask];
      return [newTask, ...prevTasks];
    });

    // Update project task count
    setProject(prevProject => {
      if (!prevProject) return null;
      
      return {
        ...prevProject,
        taskCount: prevProject.taskCount + 1,
        updatedAt: new Date().toISOString()
      };
    });
  }, []);

  const refetch = useCallback(() => {
    fetchProjectData();
  }, [fetchProjectData]);

  return {
    project,
    tasks,
    isLoading,
    error,
    updateTask,
    deleteTask,
    createTask,
    refetch
  };
};