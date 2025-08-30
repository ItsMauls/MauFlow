'use client';

import React from 'react';
import { GlassButton } from '../ui/GlassButton';
import { ProjectCard, type Project } from './ProjectCard';

interface ProjectsViewProps {
  projects: Project[];
  onCreateProject?: () => void;
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ projects, onCreateProject }) => {
  if (projects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-white/60 text-sm mb-4">No projects yet</p>
        {onCreateProject && (
          <GlassButton
            size="sm"
            onClick={onCreateProject}
            className="rounded-lg"
          >
            Create Your First Project
          </GlassButton>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {projects.map((project) => (
        <ProjectCard key={project.id} project={project} />
      ))}
    </div>
  );
};

