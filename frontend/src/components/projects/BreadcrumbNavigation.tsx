'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface BreadcrumbNavigationProps {
  projectName: string;
  projectTitle: string;
  className?: string;
}

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  projectName,
  projectTitle,
  className
}) => {
  const router = useRouter();

  const breadcrumbs = [
    {
      label: 'Dashboard',
      href: '/',
      onClick: () => router.push('/')
    },
    {
      label: 'Projects',
      href: '/projects',
      onClick: () => router.push('/')
    },
    {
      label: projectTitle,
      href: `/projects/${projectName}`,
      current: true
    }
  ];

  return (
    <div className={cn(
      'max-w-screen-xl mx-auto mb-6',
      className
    )}>
      <nav className="rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl shadow-lg p-4">
        <div className="flex items-center space-x-2 text-sm">
          {breadcrumbs.map((breadcrumb, index) => (
            <React.Fragment key={breadcrumb.href}>
              {index > 0 && (
                <svg
                  className="w-4 h-4 text-white/50 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              )}
              
              {breadcrumb.current ? (
                <span className="font-semibold text-white bg-gradient-to-r from-white/20 to-white/10 px-3 py-1 rounded-lg border border-white/20">
                  {breadcrumb.label}
                </span>
              ) : (
                <button
                  onClick={breadcrumb.onClick}
                  className="text-white/70 hover:text-white hover:bg-white/10 px-3 py-1 rounded-lg transition-all duration-200 transform hover:scale-105"
                >
                  {breadcrumb.label}
                </button>
              )}
            </React.Fragment>
          ))}
        </div>
        
        {/* Additional project info */}
        <div className="mt-2 pt-2 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/60">
            <span>Project ID:</span>
            <code className="bg-white/10 px-2 py-1 rounded font-mono text-white/80">
              {projectName}
            </code>
          </div>
        </div>
      </nav>
    </div>
  );
};