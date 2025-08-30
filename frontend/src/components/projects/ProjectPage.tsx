'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { GlassContainer, GlassCard, GlassButton, ResponsiveGrid, ProjectControls, TeamModal, ActivityModal, type TeamMember, type ActivityItem } from '../ui';
import { TaskCard, type Task } from '../tasks/TaskCard';
import { TaskListItem } from '../tasks/TaskListItem';
import { BreadcrumbNavigation } from './BreadcrumbNavigation';
import { ProjectLoadingState } from './ProjectLoadingState';
import { ProjectErrorState } from './ProjectErrorState';
import { useProject } from '@/hooks/useProject';
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
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
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
  const { teamMembers: hookTeamMembers, getMemberById } = useTeamMembers();
  const { delegations, delegateTask, isTaskDelegated, getActiveDelegationForTask } = useDelegation();

  // Mock data for modals
  const teamMembers: TeamMember[] = [
    {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com',
      role: 'Project Manager',
      status: 'online',
      tasksAssigned: 5,
      tasksCompleted: 3
    },
    {
      id: '2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      role: 'Developer',
      status: 'away',
      tasksAssigned: 8,
      tasksCompleted: 6
    },
    {
      id: '3',
      name: 'Mike Johnson',
      email: 'mike@example.com',
      role: 'Designer',
      status: 'offline',
      tasksAssigned: 3,
      tasksCompleted: 2
    }
  ];

  const mockActivities: ActivityItem[] = [
    {
      id: '1',
      type: 'task_completed',
      title: 'Task Completed',
      description: 'Design wireframes task has been completed',
      user: { id: '2', name: 'Jane Smith' },
      timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
      metadata: { taskTitle: 'Design wireframes', fromStatus: 'doing', toStatus: 'done' }
    },
    {
      id: '2',
      type: 'task_delegated',
      title: 'Task Delegated',
      description: 'Backend API development task has been delegated',
      user: { id: '1', name: 'John Doe' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      metadata: { taskTitle: 'Backend API development', assigneeName: 'Mike Johnson' }
    },
    {
      id: '3',
      type: 'task_created',
      title: 'New Task Created',
      description: 'User authentication feature task has been created',
      user: { id: '1', name: 'John Doe' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hours ago
      metadata: { taskTitle: 'User authentication feature' }
    },
    {
      id: '4',
      type: 'comment_added',
      title: 'Comment Added',
      description: 'Added feedback on the database schema design',
      user: { id: '3', name: 'Mike Johnson' },
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
      metadata: { taskTitle: 'Database schema design' }
    }
  ];

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

          {/* Compact Project Header */}
          <div className="max-w-screen-xl mx-auto mb-8">
            <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-xl shadow-xl shadow-black/10 p-4 transform hover:scale-[1.005] transition-all duration-300">
              {/* Subtle glowing border effect */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm -z-10" />
              
              <div className="space-y-6">
                {/* Title and Actions */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="text-center md:text-left">
                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white via-gray-100 to-slate-100 bg-clip-text text-transparent mb-1">
                      {project.title}
                    </h1>
                    <p className="text-white/70 text-sm font-light">
                      {project.description || 'Project tasks and management'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {/* Information Button with Statistics */}
                    <div className="relative group">
                      <GlassButton
                        variant="secondary"
                        size="sm"
                        className="rounded-full hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </GlassButton>
                      
                      {/* Statistics Tooltip */}
                      <div className="absolute bottom-full right-0 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50">
                        <div className="bg-gradient-to-br from-white/20 via-white/15 to-white/10 backdrop-blur-xl border border-white/30 rounded-xl p-4 shadow-2xl min-w-[320px]">
                          <h3 className="text-white font-semibold mb-3 text-sm">Project Statistics</h3>
                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{taskStats.total}</div>
                              <div className="text-white/70 text-xs">Total Tasks</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{taskStats.completed}</div>
                              <div className="text-white/70 text-xs">Completed</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{taskStats.inProgress}</div>
                              <div className="text-white/70 text-xs">In Progress</div>
                            </div>
                            <div className="text-center">
                              <div className="text-xl font-bold text-white">{taskStats.overdue}</div>
                              <div className="text-white/70 text-xs">Overdue</div>
                            </div>
                          </div>
                          <div className="border-t border-white/20 pt-3">
                            <h4 className="text-white/90 font-medium mb-2 text-xs">Delegation</h4>
                            <div className="grid grid-cols-3 gap-2">
                              <div className="text-center">
                                <div className="text-lg font-bold text-blue-400">{taskStats.delegated}</div>
                                <div className="text-white/70 text-xs">Delegated</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-purple-400">{taskStats.myDelegations}</div>
                                <div className="text-white/70 text-xs">My Delegations</div>
                              </div>
                              <div className="text-center">
                                <div className="text-lg font-bold text-green-400">{taskStats.assignedToMe}</div>
                                <div className="text-white/70 text-xs">Assigned to Me</div>
                              </div>
                            </div>
                          </div>
                          {/* Arrow pointing down */}
                          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white/20"></div>
                        </div>
                      </div>
                    </div>

                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowTeamModal(true)}
                      className="rounded-full hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
                    >
                      Team
                    </GlassButton>
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowActivityModal(true)}
                      className="rounded-full hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
                    >
                      Activity
                    </GlassButton>
                    <GlassButton
                      variant="secondary"
                      size="sm"
                      onClick={() => router.push('/')}
                      className="rounded-full hover:shadow-lg hover:shadow-white/10 transition-all duration-300"
                    >
                      Back
                    </GlassButton>
                  </div>
                </div>

                {/* Project Controls */}
                <ProjectControls
                  filterStatus={filterStatus}
                  onFilterChange={setFilterStatus}
                  delegationFilter={delegationFilter}
                  onDelegationFilterChange={setDelegationFilter}
                  sortBy={sortBy}
                  onSortChange={setSortBy}
                  viewMode={viewMode}
                  onViewModeChange={setViewMode}
                  filteredCount={filteredAndSortedTasks.length}
                  totalCount={taskStats.total}
                  selectedCount={selectedTasks.length}
                  onSelectAll={handleSelectAllTasks}
                  onDeselectAll={handleDeselectAllTasks}
                  onBulkDelegate={() => setShowBulkDelegation(true)}
                  canDelegate={currentUser.role.canDelegate}
                />
              </div>
            </div>
          </div>



          {/* Main Content Area */}
          <div className="max-w-screen-xl mx-auto">
            {/* Task Grid */}
            <div>
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
                  <ResponsiveGrid columns={{ mobile: 1, tablet: 2, desktop: 3 }} gap="md">
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

            </div>
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

          {/* Team Modal */}
          <TeamModal
            isOpen={showTeamModal}
            onClose={() => setShowTeamModal(false)}
            projectId={projectId}
            teamMembers={teamMembers}
            onMemberSelect={(memberId) => {
              console.log('Selected member:', memberId);
              // Handle member selection for quick delegation
            }}
          />

          {/* Activity Modal */}
          <ActivityModal
            isOpen={showActivityModal}
            onClose={() => setShowActivityModal(false)}
            projectId={projectId}
            activities={mockActivities}
          />
        </GlassContainer>
      </div>
  );
};