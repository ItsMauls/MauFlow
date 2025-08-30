/**
 * BulkDelegationModal Component
 * Modal for delegating multiple tasks to a team member at once
 */

import React, { useState } from 'react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { TeamMemberSelector } from '@/components/team/TeamMemberSelector';
import { Task } from '@/components/tasks/TaskCard';
import { currentUser } from '@/lib/mockData';

interface BulkDelegationModalProps {
  selectedTasks: string[];
  tasks: Task[];
  onDelegate: (assigneeId: string, note?: string) => Promise<void>;
  onClose: () => void;
}

export const BulkDelegationModal: React.FC<BulkDelegationModalProps> = ({
  selectedTasks,
  tasks,
  onDelegate,
  onClose
}) => {
  const [selectedAssignee, setSelectedAssignee] = useState<string>('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAssignee) {
      setError('Please select a team member to delegate to');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await onDelegate(selectedAssignee, note.trim() || undefined);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delegate tasks');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <GlassCard className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white">
              Bulk Delegate Tasks
            </h2>
            <button
              onClick={onClose}
              className="text-white/60 hover:text-white transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Selected Tasks Summary */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              Selected Tasks ({selectedTasks.length})
            </h3>
            <div className="bg-white/5 rounded-lg p-4 max-h-40 overflow-y-auto">
              <div className="space-y-2">
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between py-2 border-b border-white/10 last:border-b-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm truncate">
                        {task.title}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.priority === 'high' 
                            ? 'bg-red-400/20 text-red-400' 
                            : task.priority === 'medium'
                            ? 'bg-yellow-400/20 text-yellow-400'
                            : 'bg-green-400/20 text-green-400'
                        }`}>
                          {task.priority}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          task.status === 'todo'
                            ? 'bg-gray-400/20 text-gray-400'
                            : task.status === 'doing'
                            ? 'bg-blue-400/20 text-blue-400'
                            : 'bg-green-400/20 text-green-400'
                        }`}>
                          {task.status}
                        </span>
                        {task.dueDate && (
                          <span className="text-xs text-white/60">
                            Due: {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Delegation Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Team Member Selection */}
            <div>
              <label className="block text-white font-medium mb-2">
                Assign to Team Member *
              </label>
              <TeamMemberSelector
                onSelect={setSelectedAssignee}
                excludeUsers={[currentUser.id]}
                filterByRole={[]} // Allow all roles that can receive delegations
                searchable={true}
                placeholder="Search and select team member..."
                className="w-full"
              />
            </div>

            {/* Delegation Note */}
            <div>
              <label className="block text-white font-medium mb-2">
                Delegation Note (Optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the assignee about these tasks..."
                rows={4}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200 resize-none"
              />
              <div className="text-xs text-white/60 mt-1">
                This note will be visible to the assignee and included in their notification.
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-400/20 border border-red-400/30 rounded-lg p-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-red-400 text-sm">{error}</span>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <GlassButton
                type="submit"
                variant="primary"
                disabled={isSubmitting || !selectedAssignee}
                className="flex-1"
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Delegating...
                  </div>
                ) : (
                  `Delegate ${selectedTasks.length} Task${selectedTasks.length > 1 ? 's' : ''}`
                )}
              </GlassButton>
              
              <GlassButton
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-6"
              >
                Cancel
              </GlassButton>
            </div>
          </form>

          {/* Delegation Info */}
          <div className="mt-6 pt-4 border-t border-white/10">
            <div className="bg-blue-400/10 border border-blue-400/20 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <svg className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-blue-400 text-sm">
                  <div className="font-medium mb-1">About Bulk Delegation</div>
                  <ul className="text-xs space-y-1 text-blue-400/80">
                    <li>• All selected tasks will be assigned to the chosen team member</li>
                    <li>• The assignee will receive a notification for each delegated task</li>
                    <li>• You can track delegation status in the project dashboard</li>
                    <li>• Tasks can be revoked or reassigned later if needed</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default BulkDelegationModal;