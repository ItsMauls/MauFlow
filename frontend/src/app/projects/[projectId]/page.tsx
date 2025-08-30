'use client';

import React from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProjectPage } from '@/components/projects/ProjectPage';

interface ProjectPageProps {
  params: Promise<{
    projectId: string;
  }>;
}

export default async function ProjectPageRoute({ params }: ProjectPageProps) {
  const { projectId } = await params;
  
  return (
    <AppLayout>
      <ProjectPage projectId={projectId} />
    </AppLayout>
  );
}