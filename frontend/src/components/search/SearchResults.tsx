'use client';

import React from 'react';
import { Task } from '../tasks/TaskCard';

interface Project {
  id: string;
  name: string;
  title: string;
  taskCount: number;
}

interface SearchResultsProps {
  query: string;
  tasks: Task[];
  projects: Project[];
  onTaskSelect?: (task: Task) => void;
  onProjectSelect?: (project: Project) => void;
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  query,
  tasks,
  projects,
  onTaskSelect,
  onProjectSelect,
}) => {
  const filteredTasks = tasks.filter(task =>
    task.title.toLowerCase().includes(query.toLowerCase()) ||
    task.description?.toLowerCase().includes(query.toLowerCase())
  );

  const filteredProjects = projects.filter(project =>
    project.title.toLowerCase().includes(query.toLowerCase()) ||
    project.name.toLowerCase().includes(query.toLowerCase())
  );

  const hasResults = filteredTasks.length > 0 || filteredProjects.length > 0;

  if (!query) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🔍</div>
        <h3 className="text-xl font-semibold text-white mb-2">Search Everything</h3>
        <p className="text-white/60">Find tasks, projects, and more across your workspace</p>
      </div>
    );
  }

  if (!hasResults) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">🤔</div>
        <h3 className="text-xl font-semibold text-white mb-2">No results found</h3>
        <p className="text-white/60">Try adjusting your search terms</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tasks Results */}
      {filteredTasks.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            📝 Tasks ({filteredTasks.length})
          </h3>
          <div className="space-y-2">
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                onClick={() => onTaskSelect?.(task)}
                className="p-4 rounded-xl bg-gradient-to-r from-white/15 to-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white group-hover:text-white/90 transition-colors">
                    {task.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.priority === 'high' ? 'bg-red-500/20 text-red-300' :
                      task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-green-500/20 text-green-300'
                    }`}>
                      {task.priority}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      task.status === 'done' ? 'bg-green-500/20 text-green-300' :
                      task.status === 'doing' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-500/20 text-gray-300'
                    }`}>
                      {task.status}
                    </span>
                  </div>
                </div>
                {task.description && (
                  <p className="text-sm text-white/70 mb-2">{task.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-white/50">
                  {task.dueDate && (
                    <span>📅 Due {new Date(task.dueDate).toLocaleDateString()}</span>
                  )}
                  {task.aiScore && (
                    <span>🤖 AI Score: {task.aiScore}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Results */}
      {filteredProjects.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            📁 Projects ({filteredProjects.length})
          </h3>
          <div className="space-y-2">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onProjectSelect?.(project)}
                className="p-4 rounded-xl bg-gradient-to-r from-white/15 to-white/10 border border-white/20 hover:bg-white/20 transition-all duration-200 cursor-pointer group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h4 className="font-semibold text-white group-hover:text-white/90 transition-colors">
                      {project.title}
                    </h4>
                    <p className="text-sm text-white/60 font-mono">{project.name}</p>
                  </div>
                  <span className="text-xs bg-white/20 px-2 py-1 rounded-full text-white/80">
                    {project.taskCount} tasks
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};