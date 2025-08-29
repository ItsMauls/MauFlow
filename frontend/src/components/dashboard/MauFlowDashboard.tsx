'use client';

import React, { useState, useMemo } from 'react';
import { GlassContainer, GlassCard, GlassButton, ResponsiveGrid, StickyBottomBar } from '../ui';
import { TaskCard, type Task } from '../tasks/TaskCard';
import { AIPrioritizeButton } from '../ai/AIPrioritizeButton';
import { OnboardingTour, useOnboarding } from '../onboarding/OnboardingTour';
// import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useApi';

interface TaskFormData {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

export const MauFlowDashboard: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'doing' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'dueDate' | 'ai'>('created');
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: ''
  });

  // Hardcoded mock tasks
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Complete project proposal',
      description: 'Write and submit the Q1 project proposal for the new client',
      status: 'todo',
      priority: 'high',
      dueDate: '2025-09-05',
      createdAt: '2025-08-28T10:00:00Z',
      aiScore: 85
    },
    {
      id: '2',
      title: 'Review code changes',
      description: 'Review pull requests from the development team',
      status: 'doing',
      priority: 'medium',
      dueDate: '2025-09-02',
      createdAt: '2025-08-29T14:30:00Z',
      aiScore: 70
    },
    {
      id: '3',
      title: 'Update documentation',
      description: 'Update API documentation with new endpoints',
      status: 'todo',
      priority: 'low',
      dueDate: '2025-09-10',
      createdAt: '2025-08-30T09:15:00Z',
      aiScore: 45
    },
    {
      id: '4',
      title: 'Client meeting preparation',
      description: 'Prepare slides and agenda for tomorrow\'s client meeting',
      status: 'done',
      priority: 'high',
      dueDate: '2025-08-31',
      createdAt: '2025-08-27T16:45:00Z',
      aiScore: 90
    },
    {
      id: '5',
      title: 'Bug fixes',
      description: 'Fix critical bugs reported in the latest release',
      status: 'doing',
      priority: 'high',
      dueDate: '2025-09-01',
      createdAt: '2025-08-29T11:20:00Z',
      aiScore: 95
    },
    {
      id: '6',
      title: 'Team standup',
      description: 'Daily team standup meeting',
      status: 'done',
      priority: 'medium',
      dueDate: '2025-08-30',
      createdAt: '2025-08-30T08:00:00Z',
      aiScore: 60
    }
  ]);

  const isLoading = false;
  const error = null;

  // Onboarding
  const { showOnboarding, completeOnboarding, skipOnboarding, restartOnboarding } = useOnboarding();

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = tasks;
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Sort tasks
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          return priorityOrder[b.priority] - priorityOrder[a.priority];
        case 'dueDate':
          if (!a.dueDate && !b.dueDate) return 0;
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        case 'ai':
          return (b.aiScore || 0) - (a.aiScore || 0);
        default: // created
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });
  }, [tasks, filterStatus, sortBy]);

  // Task statistics
  const taskStats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'done').length;
    const inProgress = tasks.filter(t => t.status === 'doing').length;
    const overdue = tasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.status !== 'done'
    ).length;

    return { total, completed, inProgress, overdue };
  }, [tasks]);

  const handleCreateTask = () => {
    if (!formData.title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: formData.title,
      description: formData.description || undefined,
      status: 'todo',
      priority: formData.priority,
      dueDate: formData.dueDate || undefined,
      createdAt: new Date().toISOString(),
      aiScore: Math.floor(Math.random() * 100)
    };

    setTasks(prev => [newTask, ...prev]);
    setFormData({ title: '', description: '', priority: 'medium', dueDate: '' });
    setShowAddForm(false);
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId ? { ...task, ...updates } : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  const handleAIPrioritize = (prioritizedTasks: any[]) => {
    // Update tasks with AI scores and priorities
    prioritizedTasks.forEach(aiTask => {
      const existingTask = tasks.find(t => t.id === aiTask.id);
      if (existingTask) {
        handleUpdateTask(aiTask.id, {
          priority: aiTask.priority,
          aiScore: aiTask.aiScore
        });
      }
    });
  };

  if (error) {
    return (
      <GlassContainer>
        <div className="flex items-center justify-center min-h-screen p-4">
          <GlassCard priority="high" className="max-w-md w-full text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Dashboard</h2>
            <p className="text-white/80 mb-4">
              {error instanceof Error ? error.message : 'Something went wrong'}
            </p>
            <GlassButton onClick={() => window.location.reload()}>
              Retry
            </GlassButton>
          </GlassCard>
        </div>
      </GlassContainer>
    );
  }

  return (
    <GlassContainer>
      <div className="p-4 md:p-6 lg:p-8 pb-24">
        {/* Header */}
        <div className="max-w-screen-xl mx-auto mb-8">
          <GlassCard className="text-center">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-3xl md:text-4xl font-bold text-white">
                MauFlow Dashboard
              </h1>
              <div className="flex gap-2">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={restartOnboarding}
                >
                  Help
                </GlassButton>
                <AIPrioritizeButton
                  onPrioritizeComplete={handleAIPrioritize}
                  disabled={tasks.length === 0}
                />
              </div>
            </div>
            
            <p className="text-white/80 mb-6">
              Smart task management for freelancers and small teams
            </p>

            {/* Statistics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-2xl font-bold text-white">{taskStats.total}</div>
                <div className="text-white/70 text-sm">Total Tasks</div>
              </div>
              <div className="bg-green-500/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-green-200">{taskStats.completed}</div>
                <div className="text-green-200/70 text-sm">Completed</div>
              </div>
              <div className="bg-blue-500/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-blue-200">{taskStats.inProgress}</div>
                <div className="text-blue-200/70 text-sm">In Progress</div>
              </div>
              <div className="bg-red-500/10 rounded-lg p-3">
                <div className="text-2xl font-bold text-red-200">{taskStats.overdue}</div>
                <div className="text-red-200/70 text-sm">Overdue</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Filters and Controls */}
        <div className="max-w-screen-xl mx-auto mb-6">
          <GlassCard>
            <div className="flex flex-wrap gap-4 items-center justify-between">
              {/* Status Filter */}
              <div className="flex gap-2">
                <span className="text-white/80 text-sm font-medium">Filter:</span>
                {['all', 'todo', 'doing', 'done'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status as any)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filterStatus === status
                        ? 'bg-blue-500/30 text-blue-200'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }`}
                  >
                    {status === 'all' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                  </button>
                ))}
              </div>

              {/* Sort Options */}
              <div className="flex gap-2 items-center">
                <span className="text-white/80 text-sm font-medium">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white/10 border border-white/20 rounded px-3 py-1 text-white text-sm"
                >
                  <option value="created">Created Date</option>
                  <option value="priority">Priority</option>
                  <option value="dueDate">Due Date</option>
                  <option value="ai">AI Score</option>
                </select>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Task Grid */}
        <div className="max-w-screen-xl mx-auto" data-tour="task-list">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <GlassCard className="text-center">
                <div className="w-8 h-8 border-2 border-white/50 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/80">Loading your tasks...</p>
              </GlassCard>
            </div>
          ) : filteredAndSortedTasks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <GlassCard className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-white mb-2">
                  {tasks.length === 0 ? 'No Tasks Yet' : 'No Tasks Match Filter'}
                </h3>
                <p className="text-white/80 mb-4">
                  {tasks.length === 0 
                    ? 'Create your first task to get started with MauFlow'
                    : 'Try adjusting your filters to see more tasks'
                  }
                </p>
                <GlassButton onClick={() => setShowAddForm(true)}>
                  Add Your First Task
                </GlassButton>
              </GlassCard>
            </div>
          ) : (
            <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
              {filteredAndSortedTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              ))}
            </ResponsiveGrid>
          )}
        </div>
      </div>

      {/* Add Task Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <GlassCard>
              <h2 className="text-xl font-semibold text-white mb-4">Add New Task</h2>
              
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Task title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60"
                />
                
                <textarea
                  placeholder="Description (optional)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/60 resize-none"
                  rows={3}
                />
                
                <div className="grid grid-cols-2 gap-4">
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                  
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white"
                  />
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <GlassButton
                  variant="primary"
                  onClick={handleCreateTask}
                  disabled={!formData.title.trim()}
                  className="flex-1"
                >
                  Create Task
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </GlassButton>
              </div>
            </GlassCard>
          </div>
        </div>
      )}

      {/* Sticky Bottom Bar */}
      <StickyBottomBar>
        <GlassButton
          onClick={() => setShowAddForm(true)}
          data-tour="add-task"
        >
          <span className="mr-2">+</span>
          Add Task
        </GlassButton>
        
        <AIPrioritizeButton
          onPrioritizeComplete={handleAIPrioritize}
          disabled={tasks.length === 0}
          className="hidden md:flex"
        />
        
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => setSortBy(sortBy === 'priority' ? 'created' : 'priority')}
        >
          {sortBy === 'priority' ? '📅' : '🎯'}
        </GlassButton>
      </StickyBottomBar>

      {/* Onboarding Tour */}
      <OnboardingTour
        isVisible={showOnboarding}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
        steps={[
          {
            id: 'welcome',
            title: 'Welcome to MauFlow! 👋',
            description: 'Your smart task manager for freelancers and small teams. Let\'s get you started with a quick tour!',
            position: 'center'
          },
          {
            id: 'dashboard',
            title: 'Your Dashboard',
            description: 'This is your command center. See task statistics, filter by status, and get an overview of your productivity.',
            target: '.max-w-screen-xl',
            position: 'bottom'
          },
          {
            id: 'task-list',
            title: 'Task Management',
            description: 'Your tasks appear here with color-coded priorities. Red = High, Yellow = Medium, Green = Low priority.',
            target: '[data-tour="task-list"]',
            position: 'top'
          },
          {
            id: 'add-task',
            title: 'Add New Tasks',
            description: 'Click here to create new tasks with titles, descriptions, priorities, and due dates.',
            target: '[data-tour="add-task"]',
            position: 'top'
          },
          {
            id: 'ai-prioritize',
            title: 'AI Smart Prioritization 🤖',
            description: 'Let our AI analyze your tasks and suggest the optimal priority order based on urgency and importance.',
            target: '[data-tour="prioritize-btn"]',
            position: 'top'
          },
          {
            id: 'complete',
            title: 'You\'re Ready! 🚀',
            description: 'Start adding tasks and let MauFlow help you stay organized and productive. Welcome to smarter task management!',
            position: 'center'
          }
        ]}
      />
    </GlassContainer>
  );
};