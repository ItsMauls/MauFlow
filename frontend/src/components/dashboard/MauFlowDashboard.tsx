'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { GlassContainer, GlassCard, GlassButton, ResponsiveGrid, StickyBottomBar } from '../ui';
import { TaskCard, type Task } from '../tasks/TaskCard';
import { FileUploadArea } from '../tasks/FileUploadArea';
import { TaskListItem } from '../tasks/TaskListItem';
import { CalendarView } from '../calendar/CalendarView';
import { AIPrioritizeButton } from '../ai/AIPrioritizeButton';
import { OnboardingTour, useOnboarding } from '../onboarding/OnboardingTour';
import { tasksToFilteredCalendarEvents, CalendarEvent, CalendarViewMode } from '@/lib/calendar';
// import { useTasks, useCreateTask, useUpdateTask, useDeleteTask } from '@/hooks/useApi';

interface TaskFormData {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  attachments: File[];
}

export const MauFlowDashboard: React.FC = () => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'doing' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'dueDate' | 'ai'>('created');
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'calendar'>('grid');
  const [calendarViewMode, setCalendarViewMode] = useState<CalendarViewMode>('month');
  const [selectedDate, setSelectedDate] = useState<string>();
  const [formData, setFormData] = useState<TaskFormData>({
    title: '',
    description: '',
    priority: 'medium',
    dueDate: '',
    attachments: []
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

  // Load view preferences from localStorage
  useEffect(() => {
    const savedViewMode = localStorage.getItem('mauflow-view-mode') as 'grid' | 'list' | 'calendar';
    const savedCalendarViewMode = localStorage.getItem('mauflow-calendar-view-mode') as CalendarViewMode;
    
    if (savedViewMode && ['grid', 'list', 'calendar'].includes(savedViewMode)) {
      setViewMode(savedViewMode);
    }
    
    if (savedCalendarViewMode && ['month', 'week', 'day'].includes(savedCalendarViewMode)) {
      setCalendarViewMode(savedCalendarViewMode);
    }
  }, []);

  // Save view preferences to localStorage
  useEffect(() => {
    localStorage.setItem('mauflow-view-mode', viewMode);
  }, [viewMode]);

  useEffect(() => {
    localStorage.setItem('mauflow-calendar-view-mode', calendarViewMode);
  }, [calendarViewMode]);

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

  // Convert tasks to calendar events with filtering
  const calendarEvents = useMemo(() => {
    return tasksToFilteredCalendarEvents(tasks, filterStatus);
  }, [tasks, filterStatus]);

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
      aiScore: Math.floor(Math.random() * 100),
      // Note: attachments will be handled by the TaskCard's attachment system after creation
      attachments: []
    };

    setTasks(prev => [newTask, ...prev]);
    setFormData({ title: '', description: '', priority: 'medium', dueDate: '', attachments: [] });
    setShowAddForm(false);
  };

  const handleFileSelect = (files: FileList) => {
    const newFiles = Array.from(files);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newFiles]
    }));
  };

  const removeAttachment = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => {
      if (task.id === taskId) {
        const updatedTask = { ...task, ...updates };
        
        // Celebrate when task is completed
        if (updates.status === 'done' && task.status !== 'done') {
          // Add a small delay to show celebration animation
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
    }));
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

  // Calendar event handlers
  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
  };

  const handleEventClick = (event: CalendarEvent) => {
    if (event.originalTask) {
      // For now, we could show task details or navigate to task
      // This could be enhanced to show a task detail modal
      console.log('Event clicked:', event);
    }
  };

  const handleCalendarViewModeChange = (mode: CalendarViewMode) => {
    setCalendarViewMode(mode);
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
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Glass Shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/3 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-20 right-1/3 w-28 h-28 bg-white/4 rounded-full blur-xl animate-bounce" style={{ animationDuration: '4s', animationDelay: '2s' }} />

      <GlassContainer>
        <div className="relative z-10 p-4 md:p-6 lg:p-8 pb-32">
          {/* Header */}
          <div className="max-w-screen-xl mx-auto mb-8">
            <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8 text-center transform hover:scale-[1.01] transition-all duration-300">
              {/* Subtle glowing border effect */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm -z-10" />
              
              <div className="flex flex-col md:flex-row items-center justify-between mb-6 gap-4">
                <div className="text-center md:text-left">
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-slate-100 bg-clip-text text-transparent mb-2">
                    Dashboard
                  </h1>
                  <p className="text-white/80 text-lg font-light">
                    Smart task management for freelancers and small teams
                  </p>
                </div>
                <div className="flex gap-3">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={restartOnboarding}
                    className="rounded-full hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
                  >
                    Help
                  </GlassButton>
                  <AIPrioritizeButton
                    onPrioritizeComplete={handleAIPrioritize}
                    disabled={tasks.length === 0}
                    className="rounded-full"
                  />
                </div>
              </div>

              {/* Neutral Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                <div className="group relative rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 p-4 hover:scale-105 hover:shadow-xl hover:shadow-white/10 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.total}</div>
                    <div className="text-white/70 text-sm font-medium">Total Tasks</div>
                  </div>
                </div>
                
                <div className="group relative rounded-2xl bg-gradient-to-br from-white/12 to-white/6 border border-white/25 p-4 hover:scale-105 hover:shadow-xl hover:shadow-white/15 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.completed}</div>
                    <div className="text-white/70 text-sm font-medium">Completed</div>
                  </div>
                </div>
                
                <div className="group relative rounded-2xl bg-gradient-to-br from-white/12 to-white/6 border border-white/25 p-4 hover:scale-105 hover:shadow-xl hover:shadow-white/15 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.inProgress}</div>
                    <div className="text-white/70 text-sm font-medium">In Progress</div>
                  </div>
                </div>
                
                <div className="group relative rounded-2xl bg-gradient-to-br from-white/12 to-white/6 border border-white/25 p-4 hover:scale-105 hover:shadow-xl hover:shadow-white/15 transition-all duration-300 cursor-pointer">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.overdue}</div>
                    <div className="text-white/70 text-sm font-medium">Overdue</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Simplified Filters and Controls */}
          <div className="max-w-screen-xl mx-auto mb-8">
            <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-white/15 via-white/10 to-white/15 backdrop-blur-xl shadow-xl p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                {/* Status Filter Pills */}
                <div className="flex flex-wrap gap-3 items-center">
                  <span className="text-white/90 text-sm font-semibold flex items-center gap-2">
                    Filter:
                  </span>
                  <div className="flex gap-2">
                    {[
                      { key: 'all', label: 'All', gradient: 'from-gray-400 to-gray-500' },
                      { key: 'todo', label: 'To Do', gradient: 'from-slate-400 to-slate-500' },
                      { key: 'doing', label: 'Doing', gradient: 'from-zinc-400 to-zinc-500' },
                      { key: 'done', label: 'Done', gradient: 'from-gray-300 to-gray-400' }
                    ].map(status => (
                      <button
                        key={status.key}
                        onClick={() => setFilterStatus(status.key as any)}
                        className={`group relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                          filterStatus === status.key
                            ? `bg-gradient-to-r ${status.gradient} text-white shadow-lg shadow-current/25 scale-105`
                            : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                        }`}
                      >
                        <span className="relative z-10 flex items-center gap-2">
                          {status.label}
                        </span>
                        {filterStatus === status.key && (
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort Options, View Mode, and Task Count */}
                <div className="flex gap-6 items-center">
                  <div className="flex gap-3 items-center">
                    <span className="text-white/90 text-sm font-semibold flex items-center gap-2">
                      Sort:
                    </span>
                    <div className="relative">
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="appearance-none bg-gradient-to-r from-white/15 to-white/10 border border-white/30 rounded-xl px-4 py-2 pr-10 text-white text-sm font-medium backdrop-blur-sm hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/30 transition-all duration-200"
                      >
                        <option value="created" className="bg-gray-800">Created Date</option>
                        <option value="priority" className="bg-gray-800">Priority</option>
                        <option value="dueDate" className="bg-gray-800">Due Date</option>
                        <option value="ai" className="bg-gray-800">AI Score</option>
                      </select>
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="flex gap-3 items-center">
                    <span className="text-white/90 text-sm font-semibold flex items-center gap-2">
                      View:
                    </span>
                    <div className="flex gap-1 p-1 bg-white/10 rounded-xl border border-white/20">
                      {[
                        { key: 'grid', label: 'Grid' },
                        { key: 'list', label: 'List' },
                        { key: 'calendar', label: 'Calendar' }
                      ].map(view => (
                        <button
                          key={view.key}
                          onClick={() => setViewMode(view.key as any)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                            viewMode === view.key
                              ? 'bg-white/20 text-white shadow-lg'
                              : 'text-white/70 hover:text-white hover:bg-white/10'
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="hidden sm:inline">{view.label}</span>
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Task Count */}
                  <div className="text-white/60 text-sm">
                    {filteredAndSortedTasks.length} of {tasks.length} tasks
                  </div>
                </div>
              </div>
            </div>
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
            <div className="flex items-center justify-center py-16">
              <div className="text-center max-w-md mx-auto">
                <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-300">
                  {/* Animated empty state illustration */}
                  <div className="mb-6 relative">
                    <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center animate-pulse">
                      <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full flex items-center justify-center animate-bounce">
                      <div className="w-4 h-4 bg-white/30 rounded-full"></div>
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-3">
                    {tasks.length === 0 ? 'Ready to get started?' : 'No tasks match your filter'}
                  </h3>
                  <p className="text-white/80 mb-6 leading-relaxed">
                    {tasks.length === 0 
                      ? 'Create your first task and let MauFlow help you stay organized and productive!'
                      : 'Try adjusting your filters to see more tasks, or create a new one!'
                    }
                  </p>
                  <GlassButton 
                    onClick={() => setShowAddForm(true)}
                    className="rounded-full px-8 py-3"
                  >
                    <span className="flex items-center gap-2">
                      {tasks.length === 0 ? 'Create Your First Task' : 'Add New Task'}
                    </span>
                  </GlassButton>
                </div>
              </div>
            </div>
          ) : viewMode === 'calendar' ? (
            <CalendarView
              events={calendarEvents}
              selectedDate={selectedDate}
              onDateSelect={handleDateSelect}
              onEventClick={handleEventClick}
              onTaskDetailView={(taskId) => {
                // Navigate to task detail view - for now we'll focus on the task
                const taskElement = document.querySelector(`[data-task-id="${taskId}"]`);
                if (taskElement) {
                  taskElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  taskElement.classList.add('ring-4', 'ring-white/50', 'ring-offset-2');
                  setTimeout(() => {
                    taskElement.classList.remove('ring-4', 'ring-white/50', 'ring-offset-2');
                  }, 2000);
                }
              }}
              viewMode={calendarViewMode}
              onViewModeChange={handleCalendarViewModeChange}
            />
          ) : viewMode === 'grid' ? (
            <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
              {filteredAndSortedTasks.map((task, index) => (
                <div key={task.id} className="stagger-item" style={{ animationDelay: `${index * 0.1}s` }}>
                  <TaskCard
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                  />
                </div>
              ))}
            </ResponsiveGrid>
          ) : (
            <div className="space-y-2">
              {filteredAndSortedTasks.map((task, index) => (
                <div key={task.id} className="stagger-item" style={{ animationDelay: `${index * 0.05}s` }}>
                  <TaskListItem
                    task={task}
                    onUpdate={handleUpdateTask}
                    onDelete={handleDeleteTask}
                    size="medium"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

        {/* Enhanced Add Task Form Modal */}
        {showAddForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="max-w-lg w-full transform animate-in zoom-in-95 duration-300">
              <div className="relative rounded-3xl border border-white/30 bg-gradient-to-br from-white/25 via-white/15 to-white/10 backdrop-blur-2xl shadow-2xl shadow-purple-500/20 p-8">
                {/* Subtle glowing border effect */}
                <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm -z-10" />
                
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400/30 to-purple-400/30 flex items-center justify-center">
                    <div className="w-6 h-6 bg-white/30 rounded-full"></div>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">Create New Task</h2>
                    <p className="text-white/70 text-sm">Let's add something awesome to your list!</p>
                  </div>
                </div>
                
                <div className="space-y-5">
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium flex items-center gap-2">
                      Task Title
                    </label>
                    <input
                      type="text"
                      placeholder="What needs to be done?"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/30 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
                      autoFocus
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium flex items-center gap-2">
                      Description <span className="text-white/50 text-xs">(optional)</span>
                    </label>
                    <textarea
                      placeholder="Add some details..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/30 text-white placeholder-white/50 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200 resize-none"
                      rows={3}
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-white/90 text-sm font-medium flex items-center gap-2">
                        Priority
                      </label>
                      <div className="relative">
                        <select
                          value={formData.priority}
                          onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                          className="w-full appearance-none px-4 py-3 rounded-2xl bg-white/10 border border-white/30 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200"
                        >
                          <option value="low" className="bg-gray-800">Low Priority</option>
                          <option value="medium" className="bg-gray-800">Medium Priority</option>
                          <option value="high" className="bg-gray-800">High Priority</option>
                        </select>
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                          <svg className="w-5 h-5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-white/90 text-sm font-medium flex items-center gap-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={formData.dueDate}
                        onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                        className="w-full px-4 py-3 rounded-2xl bg-white/10 border border-white/30 text-white backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 transition-all duration-200"
                      />
                    </div>
                  </div>

                  {/* File Attachments */}
                  <div className="space-y-2">
                    <label className="text-white/90 text-sm font-medium flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      Attachments <span className="text-white/50 text-xs">(optional)</span>
                    </label>
                    
                    <FileUploadArea
                      onFileSelect={handleFileSelect}
                      className="border-2 border-dashed border-white/30 rounded-2xl p-4 bg-white/5 hover:border-white/50 hover:bg-white/10 transition-all duration-200"
                    />

                    {/* Selected Files Preview */}
                    {formData.attachments.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs text-white/70 font-medium">
                          Selected files ({formData.attachments.length}):
                        </div>
                        <div className="space-y-1">
                          {formData.attachments.map((file, index) => (
                            <div key={index} className="flex items-center justify-between bg-white/10 rounded-lg px-3 py-2 border border-white/20">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className="text-sm">
                                  {file.type.includes('image') ? '🖼️' : 
                                   file.type.includes('pdf') ? '📄' : 
                                   file.type.includes('text') ? '📝' : '📎'}
                                </span>
                                <span className="text-sm text-white/90 truncate">{file.name}</span>
                                <span className="text-xs text-white/60">
                                  ({(file.size / 1024).toFixed(1)} KB)
                                </span>
                              </div>
                              <button
                                onClick={() => removeAttachment(index)}
                                className="text-red-400 hover:text-red-300 transition-colors p-1"
                                title="Remove file"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-3 mt-8">
                  <GlassButton
                    variant="primary"
                    onClick={handleCreateTask}
                    disabled={!formData.title.trim()}
                    className="flex-1 rounded-2xl py-4 bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40 border-blue-400/50 shadow-lg shadow-blue-500/25"
                  >
                    <span className="flex items-center justify-center gap-2">
                      Create Task
                    </span>
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-2xl px-6 hover:bg-white/20"
                  >
                    Cancel
                  </GlassButton>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Floating Action Button */}
        <div className="fixed bottom-6 right-6 z-40">
          <div className="relative">
            {/* Main FAB */}
            <button
              onClick={() => setShowAddForm(true)}
              data-tour="add-task"
              className="group relative w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 shadow-2xl shadow-blue-500/40 hover:shadow-3xl hover:shadow-blue-500/60 transform hover:scale-110 active:scale-95 transition-all duration-300 flex items-center justify-center"
            >
              {/* Glowing ring */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Button content */}
              <div className="relative z-10 text-white text-2xl font-bold transform group-hover:rotate-90 transition-transform duration-300">
                +
              </div>
              
              {/* Ripple effect */}
              <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-active:scale-100 transition-transform duration-150" />
            </button>
            
            {/* Floating label */}
            <div className="absolute right-20 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none">
              <div className="bg-black/80 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap backdrop-blur-sm">
                Add New Task
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Sticky Bottom Bar for Desktop */}
        <div className="hidden md:block">
          {/* <StickyBottomBar>
            <div className="flex items-center gap-4">
              <GlassButton
                onClick={() => setShowAddForm(true)}
                className="rounded-full px-6 py-3 bg-gradient-to-r from-blue-500/30 to-purple-500/30 hover:from-blue-500/40 hover:to-purple-500/40 border-blue-400/50 shadow-lg shadow-blue-500/25"
              >
                <span className="flex items-center gap-2">
                  ➕ Add Task
                </span>
              </GlassButton>
              
              <AIPrioritizeButton
                onPrioritizeComplete={handleAIPrioritize}
                disabled={tasks.length === 0}
                className="rounded-full"
              />
              
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={() => setSortBy(sortBy === 'priority' ? 'created' : 'priority')}
                className="rounded-full hover:scale-105 transition-transform duration-200"
              >
                Sort
              </GlassButton>
            </div>
          </StickyBottomBar> */}
        </div>

        {/* Enhanced Onboarding Tour */}
        <OnboardingTour
          isVisible={showOnboarding}
          onComplete={completeOnboarding}
          onSkip={skipOnboarding}
          steps={[
            {
              id: 'welcome',
              title: 'Welcome to MauFlow!',
              description: 'Your smart task manager for freelancers and small teams. Ready for a quick tour to get you started? Let\'s make productivity fun!',
              position: 'center'
            },
            {
              id: 'dashboard',
              title: 'Your Command Center',
              description: 'This beautiful dashboard shows your task statistics with live updates. Watch those numbers grow as you complete tasks!',
              target: '.max-w-screen-xl',
              position: 'bottom'
            },
            {
              id: 'task-list',
              title: 'Smart Task Cards',
              description: 'Your tasks live here with gorgeous color-coded priorities and smooth animations. Swipe on mobile for quick actions!',
              target: '[data-tour="task-list"]',
              position: 'top'
            },
            {
              id: 'add-task',
              title: '➕ Create Magic',
              description: 'Tap this floating button to add new tasks with a delightful form experience. Notice the smooth animations? 🌟',
              target: '[data-tour="add-task"]',
              position: 'top'
            },
            {
              id: 'ai-prioritize',
              title: 'AI-Powered Intelligence',
              description: 'Let our smart AI analyze your tasks and suggest the perfect priority order. It\'s like having a productivity assistant!',
              target: '[data-tour="prioritize-btn"]',
              position: 'top'
            },
            {
              id: 'complete',
              title: 'You\'re All Set!',
              description: 'Start creating tasks and experience the smooth, beautiful interface we\'ve crafted for you. Welcome to smarter, more enjoyable task management!',
              position: 'center'
            }
          ]}
        />
        </GlassContainer>
      </div>
  );
};