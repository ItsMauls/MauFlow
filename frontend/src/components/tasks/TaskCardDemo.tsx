'use client';

import React, { useState } from 'react';
import { EnhancedTaskCard } from './EnhancedTaskCard';
import { Task } from './TaskCard';
import { cn } from '@/lib/utils';

/**
 * Demo component untuk menunjukkan TaskCard dengan fitur attachment dan comment
 */
export const TaskCardDemo: React.FC = () => {
  // Sample tasks dengan berbagai status dan priority
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Implementasi Task Card dengan Attachment',
      description: 'Membuat komponen task card yang mendukung file attachment dan sistem komentar untuk meningkatkan kolaborasi tim.',
      status: 'doing',
      priority: 'high',
      dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 hari dari sekarang
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 hari lalu
      updatedAt: new Date().toISOString(),
      aiScore: 85,
      projectId: 'project-1'
    },
    {
      id: '2',
      title: 'Review Desain UI/UX',
      description: 'Melakukan review terhadap desain antarmuka pengguna untuk memastikan konsistensi dan kemudahan penggunaan.',
      status: 'todo',
      priority: 'medium',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 hari dari sekarang
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 hari lalu
      aiScore: 72,
      projectId: 'project-1'
    },
    {
      id: '3',
      title: 'Testing dan Bug Fixes',
      description: 'Melakukan pengujian menyeluruh dan memperbaiki bug yang ditemukan dalam sistem.',
      status: 'done',
      priority: 'low',
      dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 hari lalu (overdue tapi sudah selesai)
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 hari lalu
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(), // 6 jam lalu
      aiScore: 91,
      projectId: 'project-2'
    }
  ]);

  const [selectedView, setSelectedView] = useState<'enhanced' | 'basic'>('enhanced');

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    setTasks(prev => prev.map(task => 
      task.id === taskId 
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(prev => prev.filter(task => task.id !== taskId));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">
            Task Card Demo
          </h1>
          <p className="text-white/70 text-lg">
            Demonstrasi TaskCard dengan fitur attachment dan comment
          </p>
          
          {/* View Toggle */}
          <div className="flex items-center justify-center gap-2 p-2 bg-white/10 rounded-2xl border border-white/20 backdrop-blur-sm w-fit mx-auto">
            <button
              onClick={() => setSelectedView('enhanced')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                selectedView === 'enhanced'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              Enhanced View
            </button>
            <button
              onClick={() => setSelectedView('basic')}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200',
                selectedView === 'basic'
                  ? 'bg-white/20 text-white border border-white/30'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              Basic View
            </button>
          </div>
        </div>

        {/* Features Info */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4">Fitur yang Tersedia:</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white/90">📎 File Attachments</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Drag & drop file upload</li>
                <li>• Preview untuk gambar dan dokumen</li>
                <li>• Progress tracking saat upload</li>
                <li>• Download dan hapus attachment</li>
                <li>• Validasi tipe dan ukuran file</li>
              </ul>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white/90">💬 Comment System</h3>
              <ul className="text-sm text-white/70 space-y-1">
                <li>• Real-time comment threading</li>
                <li>• Edit dan hapus komentar</li>
                <li>• Optimistic updates</li>
                <li>• Persistent storage</li>
                <li>• Visual indicators</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Task Cards */}
        <div className="space-y-6">
          {tasks.map((task) => (
            <div key={task.id} className="space-y-4">
              {/* Task Info */}
              <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      'w-3 h-3 rounded-full',
                      task.priority === 'high' && 'bg-red-400',
                      task.priority === 'medium' && 'bg-yellow-400',
                      task.priority === 'low' && 'bg-green-400'
                    )} />
                    <span className="text-white/90 font-medium">
                      Task #{task.id} - {task.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className={cn(
                      'px-2 py-1 rounded-full',
                      task.status === 'todo' && 'bg-slate-500/30 text-slate-200',
                      task.status === 'doing' && 'bg-blue-500/30 text-blue-200',
                      task.status === 'done' && 'bg-green-500/30 text-green-200'
                    )}>
                      {task.status.toUpperCase()}
                    </span>
                    <span>Priority: {task.priority}</span>
                  </div>
                </div>
              </div>

              {/* Task Card */}
              {selectedView === 'enhanced' ? (
                <EnhancedTaskCard
                  task={task}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                />
              ) : (
                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
                  <p className="text-white/70 text-center">
                    Basic view - Switch to Enhanced View untuk melihat fitur attachment dan comment
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl p-6 border border-blue-400/30 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4">Cara Menggunakan:</h2>
          <div className="space-y-3 text-white/80">
            <div className="flex items-start gap-3">
              <span className="text-blue-300 font-bold">1.</span>
              <div>
                <strong>Attachment:</strong> Klik pada bagian "Attachments" untuk expand, lalu drag & drop file atau klik area upload untuk menambah file.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-300 font-bold">2.</span>
              <div>
                <strong>Comments:</strong> Klik pada bagian "Comments" untuk expand, lalu klik "Add a comment..." untuk menambah komentar baru.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-300 font-bold">3.</span>
              <div>
                <strong>Task Management:</strong> Gunakan traffic light buttons (merah=delete, kuning=edit, hijau=complete) untuk mengelola task.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-blue-300 font-bold">4.</span>
              <div>
                <strong>Status & Priority:</strong> Klik pada status buttons atau priority dots untuk mengubah status dan prioritas task.
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white/5 rounded-2xl p-6 border border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4">Statistik Tasks:</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">{tasks.length}</div>
              <div className="text-sm text-white/60">Total Tasks</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400">
                {tasks.filter(t => t.status === 'done').length}
              </div>
              <div className="text-sm text-white/60">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400">
                {tasks.filter(t => t.status === 'doing').length}
              </div>
              <div className="text-sm text-white/60">In Progress</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-slate-400">
                {tasks.filter(t => t.status === 'todo').length}
              </div>
              <div className="text-sm text-white/60">To Do</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};