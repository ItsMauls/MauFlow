'use client';

import React from 'react';
import { GlassContainer, GlassCard } from '../ui';

export const ProjectLoadingState: React.FC = () => {
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Floating Glass Shapes */}
      <div className="absolute top-20 left-10 w-32 h-32 bg-white/3 rounded-full blur-xl animate-pulse" />
      <div className="absolute top-40 right-20 w-24 h-24 bg-white/5 rounded-full blur-lg animate-bounce" style={{ animationDuration: '3s' }} />
      <div className="absolute bottom-32 left-1/4 w-40 h-40 bg-white/2 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />

      <GlassContainer>
        <div className="relative z-10 p-4 md:p-6 lg:p-8">
          {/* Loading Breadcrumb */}
          <div className="max-w-screen-xl mx-auto mb-6">
            <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xl shadow-lg p-4">
              <div className="flex items-center space-x-2">
                <div className="h-4 bg-white/20 rounded animate-pulse w-20"></div>
                <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded animate-pulse w-16"></div>
                <div className="w-4 h-4 bg-white/20 rounded animate-pulse"></div>
                <div className="h-4 bg-white/20 rounded animate-pulse w-32"></div>
              </div>
            </div>
          </div>

          {/* Loading Header */}
          <div className="max-w-screen-xl mx-auto mb-8">
            <div className="relative rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/8 to-white/5 backdrop-blur-xl shadow-2xl shadow-black/20 p-8">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-white/10 via-white/5 to-white/10 blur-sm -z-10" />
              
              <div className="flex flex-col md:flex-row items-start justify-between mb-6 gap-4">
                <div className="flex-1">
                  <div className="h-12 bg-gradient-to-r from-white/20 to-white/10 rounded-lg animate-pulse mb-4 w-3/4"></div>
                  <div className="h-6 bg-white/15 rounded animate-pulse mb-2 w-1/2"></div>
                  <div className="h-4 bg-white/10 rounded animate-pulse w-1/3"></div>
                </div>
                <div className="flex gap-3">
                  <div className="h-10 bg-white/15 rounded-full animate-pulse w-32"></div>
                </div>
              </div>

              {/* Loading Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {[...Array(4)].map((_, index) => (
                  <div key={index} className="relative rounded-2xl bg-gradient-to-br from-white/15 to-white/5 border border-white/20 p-4">
                    <div className="h-8 bg-white/20 rounded animate-pulse mb-2 w-16"></div>
                    <div className="h-4 bg-white/15 rounded animate-pulse w-20"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Loading Filters */}
          <div className="max-w-screen-xl mx-auto mb-8">
            <div className="rounded-2xl border border-white/20 bg-gradient-to-r from-white/15 via-white/10 to-white/15 backdrop-blur-xl shadow-xl p-6">
              <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                <div className="flex gap-3 items-center">
                  <div className="h-4 bg-white/20 rounded animate-pulse w-12"></div>
                  <div className="flex gap-2">
                    {[...Array(4)].map((_, index) => (
                      <div key={index} className="h-8 bg-white/15 rounded-full animate-pulse w-16"></div>
                    ))}
                  </div>
                </div>
                <div className="flex gap-6 items-center">
                  <div className="h-8 bg-white/15 rounded animate-pulse w-32"></div>
                  <div className="h-8 bg-white/15 rounded animate-pulse w-20"></div>
                  <div className="h-4 bg-white/10 rounded animate-pulse w-16"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Loading Content */}
          <div className="max-w-screen-xl mx-auto">
            <div className="flex items-center justify-center py-16">
              <GlassCard className="text-center max-w-md">
                <div className="mb-6">
                  <div className="w-16 h-16 border-4 border-white/30 border-t-white/80 rounded-full animate-spin mx-auto"></div>
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">
                  Loading Project
                </h3>
                <p className="text-white/80 leading-relaxed">
                  Fetching project details and tasks...
                </p>
                
                {/* Loading progress indicator */}
                <div className="mt-6">
                  <div className="w-full bg-white/10 rounded-full h-2">
                    <div className="bg-gradient-to-r from-blue-400 to-purple-400 h-2 rounded-full animate-pulse" style={{ width: '60%' }}></div>
                  </div>
                  <p className="text-white/60 text-sm mt-2">Loading project data...</p>
                </div>
              </GlassCard>
            </div>
          </div>
        </div>
      </GlassContainer>
    </div>
  );
};