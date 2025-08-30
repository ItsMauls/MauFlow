'use client';

import React from 'react';

export interface Project {
  id: string;
  name: string;
  title: string;
  taskCount: number;
  createdAt: string;
}

interface ProjectCardProps {
  project: Project;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => (
  <div
    className="group relative rounded-2xl bg-gradient-to-br from-blue-500/15 to-purple-500/5 border border-blue-400/20 p-4 hover:scale-105 hover:shadow-xl hover:shadow-blue-500/15 transition-all duration-300 cursor-pointer"
  >
    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/8 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    <div className="relative">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h4 className="font-semibold text-white group-hover:text-white/90 transition-colors">
            {project.title}
          </h4>
          <p className="text-sm text-white/60 font-mono">{project.name}</p>
        </div>
        <span className="text-xs bg-gradient-to-r from-blue-500/30 to-purple-500/30 px-2 py-1 rounded-full text-white/80 border border-blue-400/20">
          {project.taskCount} tasks
        </span>
      </div>
      <div className="text-xs text-white/50">
        Created {new Date(project.createdAt).toLocaleDateString()}
      </div>
    </div>
  </div>
);

