'use client';

import React, { useState } from 'react';
import { GlassContainer } from './ui/GlassContainer';
import { GlassCard } from './ui/GlassCard';
import { GlassButton } from './ui/GlassButton';
import { ResponsiveGrid } from './ui/ResponsiveGrid';
import { StickyBottomBar } from './ui/StickyBottomBar';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, type Task } from '@/hooks/useApi';

export const TaskBoard: React.FC = () => {
  const [showBottomBar, setShowBottomBar] = useState(true);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  
  // API hooks
  const { data: tasks = [], isLoading, error } = useTasks();
  const createTaskMutation = useCreateTask();
  const updateTaskMutation = useUpdateTask();
  const deleteTaskMutation = useDeleteTask();

  const handleCreateTask = () => {
    if (!newTaskTitle.trim()) return;
    
    createTaskMutation.mutate({
      title: newTaskTitle,
      priority: 'medium',
    }, {
      onSuccess: () => {
        setNewTaskTitle('');
      },
    });
  };

  const handleToggleTask = (task: Task) => {
    updateTaskMutation.mutate({
      id: task.id,
      completed: !task.completed,
    });
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTaskMutation.mutate({ id: taskId });
  };

  if (error) {
    return (
      <GlassContainer>
        <div className="flex items-center justify-center min-h-screen p-4">
          <GlassCard priority="high" className="max-w-md w-full text-center">
            <h2 className="text-xl font-semibold text-white mb-2">Error Loading Tasks</h2>
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
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Task Board
            </h1>
            <p className="text-white/80">
              Manage your tasks with glassmorphism style
            </p>
          </GlassCard>
        </div>

        {/* Task Grid */}
        <div className="max-w-screen-xl mx-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <GlassCard className="text-center">
                <div className="w-8 h-8 border-2 border-white/50 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-white/80">Loading tasks...</p>
              </GlassCard>
            </div>
          ) : tasks.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <GlassCard className="text-center max-w-md">
                <h3 className="text-xl font-semibold text-white mb-2">No Tasks Yet</h3>
                <p className="text-white/80 mb-4">
                  Create your first task using the button below
                </p>
                <GlassButton onClick={() => setShowBottomBar(true)}>
                  Get Started
                </GlassButton>
              </GlassCard>
            </div>
          ) : (
            <ResponsiveGrid
              columns={{ mobile: 1, tablet: 2, desktop: 3 }}
              gap="md"
            >
              {tasks.map((task) => (
                <GlassCard
                  key={task.id}
                  priority={task.priority}
                  className={task.completed ? 'opacity-60' : ''}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-semibold text-white ${task.completed ? 'line-through' : ''}`}>
                      {task.title}
                    </h3>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-500/20 text-red-200' :
                      task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                      'bg-green-500/20 text-green-200'
                    }`}>
                      {task.priority}
                    </div>
                  </div>
                  
                  {task.description && (
                    <p className="text-white/80 text-sm mb-4">
                      {task.description}
                    </p>
                  )}
                  
                  <div className="flex gap-2">
                    <GlassButton
                      size="sm"
                      variant={task.completed ? 'secondary' : 'success'}
                      onClick={() => handleToggleTask(task)}
                      loading={updateTaskMutation.isPending}
                    >
                      {task.completed ? 'Undo' : 'Complete'}
                    </GlassButton>
                    <GlassButton
                      size="sm"
                      variant="danger"
                      onClick={() => handleDeleteTask(task.id)}
                      loading={deleteTaskMutation.isPending}
                    >
                      Delete
                    </GlassButton>
                  </div>
                </GlassCard>
              ))}
            </ResponsiveGrid>
          )}
        </div>
      </div>

      {/* Sticky Bottom Bar */}
      <StickyBottomBar show={showBottomBar}>
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Add a new task..."
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleCreateTask()}
            className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 
                     text-white placeholder-white/60 backdrop-blur-md
                     focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-white/40
                     min-h-[44px]"
          />
        </div>
        <GlassButton
          onClick={handleCreateTask}
          loading={createTaskMutation.isPending}
          disabled={!newTaskTitle.trim()}
        >
          Add Task
        </GlassButton>
        <GlassButton
          variant="secondary"
          size="sm"
          onClick={() => setShowBottomBar(!showBottomBar)}
        >
          {showBottomBar ? '−' : '+'}
        </GlassButton>
      </StickyBottomBar>
    </GlassContainer>
  );
};