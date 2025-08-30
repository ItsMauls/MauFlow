'use client';

import React, { useState } from 'react';
import { EnhancedTaskCard } from './EnhancedTaskCard';
import { Task } from './TaskCard';

/**
 * Contoh penggunaan TaskCard dengan attachment dan comment
 * Komponen ini menunjukkan cara mengintegrasikan TaskCard dalam aplikasi
 */
export const TaskCardExample: React.FC = () => {
  // Sample task dengan data lengkap
  const [task, setTask] = useState<Task>({
    id: 'example-task-1',
    title: 'Implementasi Fitur Upload File',
    description: 'Membuat sistem upload file yang mendukung drag & drop, preview, dan validasi. Sistem harus dapat menangani berbagai tipe file dan memberikan feedback yang baik kepada pengguna.',
    status: 'doing',
    priority: 'high',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 hari dari sekarang
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 hari lalu
    updatedAt: new Date().toISOString(),
    aiScore: 88,
    projectId: 'project-ui-enhancement'
  });

  const handleUpdateTask = (taskId: string, updates: Partial<Task>) => {
    if (taskId === task.id) {
      setTask(prev => ({
        ...prev,
        ...updates,
        updatedAt: new Date().toISOString()
      }));
    }
  };

  const handleDeleteTask = (taskId: string) => {
    if (taskId === task.id) {
      alert('Task akan dihapus dalam implementasi nyata');
      // Dalam implementasi nyata, ini akan menghapus task dari state management
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-white">
          TaskCard dengan Attachment & Comment
        </h2>
        <p className="text-white/70">
          Contoh implementasi TaskCard yang terintegrasi dengan sistem file attachment dan comment
        </p>
      </div>

      {/* Task Card Enhanced */}
      <EnhancedTaskCard
        task={task}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        className="shadow-2xl"
      />

      {/* Usage Instructions */}
      <div className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-3">Fitur yang Tersedia:</h3>
        <div className="space-y-2 text-sm text-white/80">
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Upload file dengan drag & drop atau klik</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Preview file gambar dan dokumen</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Sistem komentar dengan edit dan delete</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Visual indicators untuk task dengan attachment/comment</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Expandable/collapsible sections</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-green-400">✓</span>
            <span>Persistent storage menggunakan localStorage</span>
          </div>
        </div>
      </div>

      {/* Code Example */}
      <div className="bg-slate-900/50 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
        <h3 className="text-lg font-semibold text-white mb-3">Cara Penggunaan:</h3>
        <pre className="text-xs text-green-300 overflow-x-auto">
{`import { EnhancedTaskCard } from '@/components/tasks';

// Dalam komponen React
<EnhancedTaskCard
  task={task}
  onUpdate={handleUpdateTask}
  onDelete={handleDeleteTask}
/>`}
        </pre>
      </div>
    </div>
  );
};