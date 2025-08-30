'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassContainer, GlassCard, GlassButton, ResponsiveGrid } from '../ui';
import { TaskCard, type Task } from '../tasks/TaskCard';
import { TaskListItem } from '../tasks/TaskListItem';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { ProjectLoadingState } from './ProjectLoadingState';
import { ProjectErrorState } from './ProjectErrorState';
import { useProject } from '@/hooks/useProject';
import { TeamMemberSidebar } from './TeamMemberSidebar';
import { TeamActivityFeed } from './TeamActivityFeed';
import { BulkDelegationModal } from './BulkDelegationModal';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDelegation } from '@/hooks/useDelegation';
import { currentUser } from '@/lib/mockData';

interface ProjectPageProps {
  projectId: string;
}

export const ProjectPage: React.FC<ProjectPageProps> = ({ projectId }) => {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'doing' | 'done'>('all');
  const [sortBy, setSortBy] = useState<'created' | 'priority' | 'dueDate' | 'ai'>('created');
  
  // Collaboration state
  const [showTeamSidebar, setShowTeamSidebar] = useState(false);
  const [showActivityFeed, setShowActivityFeed] = useState(false);
  const [selectedTasks, setSelectedTasks] = useState<string[]>([]);
  const [showBulkDelegation, setShowBulkDelegation] = useState(false);
  const [delegationFilter, setDelegationFilter] = useState<'all' | 'delegated' | 'my_delegations' | 'assigned_to_me'>('all');

  // Use custom hook for project data management
  const {
    project,
    tasks,
    isLoading,
    error,
    updateTask,
    deleteTask,
    createTask,
    refetch
  } = useProject(projectId);

  // Collaboration hooks
  const { teamMembers, getMemberById } = useTeamMembers();
  const { delegations, delegateTask, isTaskDelegated, getActiveDelegationForTask } = useDelegation();

  // Filter and sort project-specific tasks with delegation filters
  const filteredAndSortedTasks = useMemo(() => {
    if (!tasks) return [];
    
    let filtered = tasks.filter(task => task.projectId === projectId);
    
    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(task => task.status === filterStatus);
    }

    // Filter by delegation status
    if (delegationFilter !== 'all') {
      switch (delegationFilter) {
        case 'delegated':
          filtered = filtered.filter(task => isTaskDelegated(task.id));
          break;
        case 'my_delegations':
          filtered = filtered.filter(task => {
            const delegation = getActiveDelegationForTask(task.id);
            return delegation && delegation.delegatorId === currentUser.id;
          });
          break;
        case 'assigned_to_me':
          filtered = filtered.filter(task => {
            const delegation = getActiveDelegationForTask(task.id);
            return delegation && delegation.assigneeId === currentUser.id;
          });
          break;
      }
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
  }, [tasks, projectId, filterStatus, sortBy, delegationFilter, isTaskDelegated, getActiveDelegationForTask]);

  // Task statistics for this project including delegation info
  const taskStats = useMemo(() => {
    const projectTasks = tasks?.filter(t => t.projectId === projectId) || [];
    const total = projectTasks.length;
    const completed = projectTasks.filter(t => t.status === 'done').length;
    const inProgress = projectTasks.filter(t => t.status === 'doing').length;
    const overdue = projectTasks.filter(t => 
      t.dueDate && 
      new Date(t.dueDate) < new Date() && 
      t.status !== 'done'
    ).length;
    
    // Delegation statistics
    const delegated = projectTasks.filter(t => isTaskDelegated(t.id)).length;
    const myDelegations = projectTasks.filter(t => {
      const delegation = getActiveDelegationForTask(t.id);
      return delegation && delegation.delegatorId === currentUser.id;
    }).length;
    const assignedToMe = projectTasks.filter(t => {
      const delegation = getActiveDelegationForTask(t.id);
      return delegation && delegation.assigneeId === currentUser.id;
    }).length;

    return { 
      total, 
      completed, 
      inProgress, 
      overdue, 
      delegated, 
      myDelegations, 
      assignedToMe 
    };
  }, [tasks, projectId, isTaskDelegated, getActiveDelegationForTask]);

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    updateTask(taskId, updates);
  };

  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };

  const handleCreateTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'projectId'>) => {
    createTask({
      ...taskData,
      projectId
    });
  };

  // Collaboration handlers
  const handleTaskSelection = (taskId: string, selected: boolean) => {
    setSelectedTasks(prev => 
      selected 
        ? [...prev, taskId]
        : prev.filter(id => id !== taskId)
    );
  };

  const handleSelectAllTasks = () => {
    const allTaskIds = filteredAndSortedTasks.map(task => task.id);
    setSelectedTasks(allTaskIds);
  };

  const handleDeselectAllTasks = () => {
    setSelectedTasks([]);
  };

  const handleBulkDelegate = async (assigneeId: string, note?: string) => {
    try {
      for (const taskId of selectedTasks) {
        await delegateTask(taskId, assigneeId, note);
      }
      setSelectedTasks([]);
      setShowBulkDelegation(false);
    } catch (error) {
      console.error('Failed to bulk delegate tasks:', error);
    }
  };

  // Loading state
  if (isLoading) {
    return <ProjectLoadingState />;
  }

  // Error state
  if (error) {
    return (
      <ProjectErrorState 
        error={error}
        onRetry={refetch}
        onGoBack={() => router.push('/')}
      />
    );
  }

  // Project not found
  if (!project) {
    return (
      <ProjectErrorState 
        error={new Error('Project not found')}
        onRetry={refetch}
        onGoBack={() => router.push('/')}
      />
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Glass Shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/3 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      <GlassContainer>
        <div className="relative z-10 p-4 md:p-6 lg:p-8">
          {/* Breadcrumb Navigation */}
          <BreadcrumbNavigation 
            projectName={project.name}
            projectTitle={project.title}
          />

          {/* Project Header */}
          <div className="max-w-screen-xl mx-auto mb-8">
            <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm -z-10" />
              
              <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-gray-100 to-slate-100 bg-clip-text text-transparent mb-2">
                    {project.title}
                  </h1>
                  <p className="text-white/80 text-lg font-light mb-2">
                    {project.description || 'Project tasks and management'}
                  </p>
                  <p className="text-white/60 text-sm font-mono">
                    {project.name}
                  </p>
                </div>
                <div className="flex gap-3">
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowTeamSidebar(!showTeamSidebar)}
                    className="rounded-full hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
                  >
                    {showTeamSidebar ? 'Hide Team' : 'Show Team'}
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => setShowActivityFeed(!showActivityFeed)}
                    className="rounded-full hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
                  >
                    {showActivityFeed ? 'Hide Activity' : 'Show Activity'}
                  </GlassButton>
                  <GlassButton
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/')}
                    className="rounded-full hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
                  >
                    Back to Dashboard
                  </GlassButton>
                </div>
              </div>

              {/* Project Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 md:gap-6">
                <div className="group relative rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 p-4 hover:scale-105 hover:shadow-xl hover:shadow-white/10 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.total}</div>
                    <div className="text-white/70 text-sm font-medium">Total Tasks</div>
                  </div>
                </div>
                
                <div className="group relative rounded-2xl bg-gradient-to-br from-white/12 to-white/6 border border-white/25 p-4 hover:scale-105 hover:shadow-xl hover:shadow-white/15 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.completed}</div>
                    <div className="text-white/70 text-sm font-medium">Completed</div>
                  </div>
                </div>
                
                <div className="group relative rounded-2xl bg-gradient-to-br from-white/12 to-white/6 border border-white/25 p-4 hover:scale-105 hover:shadow-xl hover:shadow-white/15 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.inProgress}</div>
                    <div className="text-white/70 text-sm font-medium">In Progress</div>
                  </div>
                </div>
                
                <div className="group relative rounded-2xl bg-gradient-to-br from-white/12 to-white/6 border border-white/25 p-4 hover:scale-105 hover:shadow-xl hover:shadow-white/15 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.overdue}</div>
                    <div className="text-white/70 text-sm font-medium">Overdue</div>
                  </div>
                </div>

                {/* Delegation Statistics */}
                <div className="group relative rounded-2xl bg-gradient-to-br from-blue-400/20 to-blue-600/10 border border-blue-400/30 p-4 hover:scale-105 hover:shadow-xl hover:shadow-blue-400/20 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.delegated}</div>
                    <div className="text-white/70 text-sm font-medium">Delegated</div>
                  </div>
                </div>

                <div className="group relative rounded-2xl bg-gradient-to-br from-purple-400/20 to-purple-600/10 border border-purple-400/30 p-4 hover:scale-105 hover:shadow-xl hover:shadow-purple-400/20 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-purple-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.myDelegations}</div>
                    <div className="text-white/70 text-sm font-medium">My Delegations</div>
                  </div>
                </div>

                <div className="group relative rounded-2xl bg-gradient-to-br from-green-400/20 to-green-600/10 border border-green-400/30 p-4 hover:scale-105 hover:shadow-xl hover:shadow-green-400/20 transition-all duration-300">
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-green-400/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-3xl font-bold text-white mb-1">{taskStats.assignedToMe}</div>
                    <div className="text-white/70 text-sm font-medium">Assigned to Me</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="max-w-screen-xl mx-auto mb-8">
            <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-white/15 via-white/10 to-white/15 backdrop-blur-xl shadow-xl p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                {/* Status Filter Pills */}
                <div className="flex flex-wrap gap-6 items-center">
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-white/90 text-sm font-semibold flex items-center gap-2">
                      Status:
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

                  {/* Delegation Filter Pills */}
                  <div className="flex flex-wrap gap-3 items-center">
                    <span className="text-white/90 text-sm font-semibold flex items-center gap-2">
                      Delegation:
                    </span>
                    <div className="flex gap-2">
                      {[
                        { key: 'all', label: 'All', gradient: 'from-gray-400 to-gray-500' },
                        { key: 'delegated', label: 'Delegated', gradient: 'from-blue-400 to-blue-500' },
                        { key: 'my_delegations', label: 'My Delegations', gradient: 'from-purple-400 to-purple-500' },
                        { key: 'assigned_to_me', label: 'Assigned to Me', gradient: 'from-green-400 to-green-500' }
                      ].map(delegation => (
                        <button
                          key={delegation.key}
                          onClick={() => setDelegationFilter(delegation.key as any)}
                          className={`group relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                            delegationFilter === delegation.key
                              ? `bg-gradient-to-r ${delegation.gradient} text-white shadow-lg shadow-current/25 scale-105`
                              : 'bg-white/10 text-white/70 hover:bg-white/20 hover:text-white border border-white/20'
                          }`}
                        >
                          <span className="relative z-10 flex items-center gap-2">
                            {delegation.label}
                          </span>
                          {delegationFilter === delegation.key && (
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-white/20 to-transparent" />
                          )}
                        </button>
                      ))}
                    </div>
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
                        { key: 'list', label: 'List' }
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

                  {/* Bulk Actions and Task Count */}
                  <div className="flex gap-4 items-center">
                    {selectedTasks.length > 0 && currentUser.role.canDelegate && (
                      <div className="flex gap-2 items-center">
                        <GlassButton
                          variant="primary"
                          size="sm"
                          onClick={() => setShowBulkDelegation(true)}
                          className="rounded-full"
                        >
                          Delegate {selectedTasks.length} task{selectedTasks.length > 1 ? 's' : ''}
                        </GlassButton>
                        <GlassButton
                          variant="secondary"
                          size="sm"
                          onClick={handleDeselectAllTasks}
                          className="rounded-full"
                        >
                          Clear
                        </GlassButton>
                      </div>
                    )}
                    
                    {selectedTasks.length === 0 && filteredAndSortedTasks.length > 0 && currentUser.role.canDelegate && (
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        onClick={handleSelectAllTasks}
                        className="rounded-full"
                      >
                        Select All
                      </GlassButton>
                    )}

                    <div className="text-white/60 text-sm">
                      {filteredAndSortedTasks.length} of {taskStats.total} tasks
                      {selectedTasks.length > 0 && (
                        <span className="ml-2 text-blue-400">
                          ({selectedTasks.length} selected)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area with Sidebar */}
          <div className="max-w-screen-xl mx-auto">
            <div className="flex gap-6">
              {/* Task Grid */}
              <div className={`flex-1 ${showTeamSidebar ? 'lg:pr-6' : ''}`}>
                {filteredAndSortedTasks.length === 0 ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center max-w-md mx-auto">
                      <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/20 via-white/10 to-white/5 backdrop-blur-xl shadow-2xl p-8 transform hover:scale-105 transition-all duration-300">
                        <div className="mb-6 relative">
                          <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 flex items-center justify-center animate-pulse">
                            <div className="w-12 h-12 bg-white/20 rounded-full"></div>
                          </div>
                        </div>
                        
                        <h3 className="text-2xl font-bold text-white mb-3">
                          {taskStats.total === 0 ? 'No tasks in this project yet' : 'No tasks match your filter'}
                        </h3>
                        <p className="text-white/80 mb-6 leading-relaxed">
                          {taskStats.total === 0 
                            ? 'Create your first task for this project to get started!'
                            : 'Try adjusting your filters to see more tasks, or create a new one!'
                          }
                        </p>
                      </div>
                    </div>
                  </div>
                ) : viewMode === 'grid' ? (
                  <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: showTeamSidebar ? 2 : 3 }} gap="md">
                    {filteredAndSortedTasks.map((task, index) => (
                      <div key={task.id} className="stagger-item relative" style={{ animationDelay: `${index * 0.1}s` }}>
                        {currentUser.role.canDelegate && (
                          <div className="absolute top-2 left-2 z-10">
                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task.id)}
                              onChange={(e) => handleTaskSelection(task.id, e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        )}
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
                      <div key={task.id} className="stagger-item relative" style={{ animationDelay: `${index * 0.05}s` }}>
                        {currentUser.role.canDelegate && (
                          <div className="absolute top-4 left-4 z-10">
                            <input
                              type="checkbox"
                              checked={selectedTasks.includes(task.id)}
                              onChange={(e) => handleTaskSelection(task.id, e.target.checked)}
                              className="w-4 h-4 text-blue-600 bg-white/20 border-white/30 rounded focus:ring-blue-500 focus:ring-2"
                            />
                          </div>
                        )}
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

              {/* Team Member Sidebar */}
              {showTeamSidebar && (
                <div className="hidden lg:block w-80 flex-shrink-0">
                  <TeamMemberSidebar 
                    projectId={projectId}
                    onMemberSelect={(memberId) => {
                      // Handle member selection for quick delegation
                      console.log('Selected member:', memberId);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Team Activity Feed */}
            {showActivityFeed && (
              <div className="mt-8">
                <TeamActivityFeed projectId={projectId} />
              </div>
            )}
          </div>

          {/* Bulk Delegation Modal */}
          {showBulkDelegation && (
            <BulkDelegationModal
              selectedTasks={selectedTasks}
              tasks={filteredAndSortedTasks.filter(task => selectedTasks.includes(task.id))}
              onDelegate={handleBulkDelegate}
              onClose={() => setShowBulkDelegation(false)}
            />
          )}
        </div>
      </GlassContainer>
    </div>
  );
};