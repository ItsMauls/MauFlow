'use client';

import React, { useState } from 'react';
import { EnhancedTaskCard } from './EnhancedTaskCard';
import { Task } from './TaskCard';

/**
 * Demo component showcasing the enhanced TaskCard with comments and attachments
 * This demonstrates all the features implemented in task 12:
 * - Visual indicators for tasks with comments or attachments
 * - Expandable/collapsible sections
 * - Responsive design
 * - Integration of comment and attachment systems
 */
export const TaskCardEnhancedDemo: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: 'demo-task-1',
      title: 'Design System Implementation',
      description: 'Create a comprehensive design system with reusable components and consistent styling patterns.',
      status: 'doing',
      priority: 'high',
      dueDate: '2024-02-15',
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T14:30:00Z',
      projectId: 'project-design',
      aiScore: 85
    },
    {
      id: 'demo-task-2',
      title: 'API Integration Testing',
      description: 'Implement comprehensive testing for all API endpoints and error handling scenarios.',
      status: 'todo',
      priority: 'medium',
      dueDate: '2024-02-20',
      createdAt: '2024-01-18T09:15:00Z',
      projectId: 'project-backend'
    },
    {
      id: 'demo-task-3',
      title: 'User Documentation',
      description: 'Write user-friendly documentation and tutorials for the new features.',
      status: 'done',
      priority: 'low',
      createdAt: '2024-01-10T16:45:00Z',
      updatedAt: '2024-01-25T11:20:00Z',
      projectId: 'project-docs'
    }
  ]);

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, ...updates, updatedAt: new Date().toISOString() }
          : task
      )
    );
  };

  const handleTaskDelete = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Enhanced TaskCard Demo
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto">
            Showcasing the integrated comment and attachment system with expandable sections,
            visual indicators, and responsive design.
          </p>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <h3 className="text-white font-semibold">Comments</h3>
            </div>
            <p className="text-white/70 text-sm">
              Expandable comment sections with visual indicators and real-time updates.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              <h3 className="text-white font-semibold">Attachments</h3>
            </div>
            <p className="text-white/70 text-sm">
              File upload system with drag-and-drop, previews, and progress tracking.
            </p>
          </div>

          <div className="bg-white/10 rounded-xl p-4 border border-white/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 mb-2">
              <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
              <h3 className="text-white font-semibold">Responsive</h3>
            </div>
            <p className="text-white/70 text-sm">
              Fully responsive design that adapts to different screen sizes and devices.
            </p>
          </div>
        </div>

        {/* Task Cards */}
        <div className="space-y-6">
          {tasks.map((task) => (
            <EnhancedTaskCard
              key={task.id}
              task={task}
              onUpdate={handleTaskUpdate}
              onDelete={handleTaskDelete}
              className="transform transition-all duration-300 hover:scale-[1.01]"
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
          <h3 className="text-white font-semibold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            How to Use
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/70">
            <div>
              <h4 className="text-white font-medium mb-2">Comments</h4>
              <ul className="space-y-1">
                <li>• Click the Comments section to expand</li>
                <li>• Add new comments with the input field</li>
                <li>• Edit or delete existing comments</li>
                <li>• View comment count in visual indicators</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-medium mb-2">Attachments</h4>
              <ul className="space-y-1">
                <li>• Click the Attachments section to expand</li>
                <li>• Drag and drop files to upload</li>
                <li>• Preview and download attachments</li>
                <li>• View file count and total size</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-white/50 text-sm">
          <p>Enhanced TaskCard - Integrated Comments & Attachments System</p>
          <p className="mt-1">Task 12: Integration Complete ✅</p>
        </div>
      </div>
    </div>
  );
};