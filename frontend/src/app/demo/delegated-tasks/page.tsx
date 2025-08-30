'use client';

import React from 'react';
import { DelegatedTasksView } from '@/components/delegation/DelegatedTasksView';

export default function DelegatedTasksDemo() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Delegated Tasks Dashboard Demo
          </h1>
          <p className="text-white/70 text-lg">
            View and manage tasks assigned to you by team members with filtering, sorting, and status updates.
          </p>
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl p-6">
          <DelegatedTasksView />
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <div className="text-2xl mb-3">🎯</div>
            <h3 className="text-lg font-semibold text-white mb-2">Smart Filtering</h3>
            <p className="text-white/70 text-sm">
              Filter by status, delegator, or search across task content and notes.
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <div className="text-2xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Flexible Sorting</h3>
            <p className="text-white/70 text-sm">
              Sort by delegation date, due date, priority, status, or title with ascending/descending options.
            </p>
          </div>

          <div className="bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
            <div className="text-2xl mb-3">🔔</div>
            <h3 className="text-lg font-semibold text-white mb-2">Real-time Updates</h3>
            <p className="text-white/70 text-sm">
              Status updates automatically notify delegators and track delegation history.
            </p>
          </div>
        </div>

        {/* Usage Instructions */}
        <div className="mt-8 bg-white/5 rounded-xl p-6 border border-white/10 backdrop-blur-sm">
          <h3 className="text-lg font-semibold text-white mb-4">How to Use</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-2">Filtering & Search</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Use the search bar to find specific tasks or delegators</li>
                <li>• Filter by status: All, Active, Completed, or Overdue</li>
                <li>• Filter by specific delegator to see tasks from one person</li>
                <li>• Clear all filters with the "Clear Filters" button</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-white mb-2">Task Management</h4>
              <ul className="text-white/70 text-sm space-y-1">
                <li>• Click "Start" to move a task from To Do to In Progress</li>
                <li>• Click "Complete" to mark a task as done</li>
                <li>• View delegation notes and history for context</li>
                <li>• See priority levels and due dates at a glance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}