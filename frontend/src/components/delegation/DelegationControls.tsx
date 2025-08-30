/**
 * DelegationControls Component
 * Provides UI controls for task delegation including modal and assignee selection
 * Enhanced with comprehensive accessibility support
 */

import React, { useState, useEffect, useRef } from 'react';
import { TaskDelegation } from '@/types/collaboration';
import { Task } from '@/components/tasks/TaskCard';
import { useDelegation } from '@/hooks/useDelegation';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useTeamMembers } from '@/hooks/useTeamMembers';
import { useDelegationErrorHandling } from '@/hooks/useErrorHandling';
import { validateTaskDelegation } from '@/lib/collaborationValidation';
import { TeamMemberSelector } from '@/components/team/TeamMemberSelector';
import { GlassCard } from '@/components/ui/GlassCard';
import { GlassButton } from '@/components/ui/GlassButton';
import { ErrorDisplay, ValidationErrors } from '@/components/ui/ErrorDisplay';
import { cn } from '@/lib/utils';
import { 
  ARIA_ROLES, 
  KEYBOARD_KEYS, 
  FocusManager, 
  ScreenReaderAnnouncer,
  generateAriaLabel,
  mobileAccessibility,
  reducedMotionSupport
} from '@/lib/accessibility';

interface DelegationControlsProps {
  task: Task;
  onDelegate: (taskId: string, assigneeId: string, note?: string) => void;
  canDelegate: boolean;
  className?: string;
  showQuickDelegate?: boolean;
  isMobile?: boolean;
}

export const DelegationControls: React.FC<DelegationControlsProps> = ({
  task,
  onDelegate,
  canDelegate,
  className = "",
  showQuickDelegate = true,
  isMobile = false
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('');
  const [delegationNote, setDelegationNote] = useState('');
  const [priority, setPriority] = useState<'normal' | 'urgent'>('normal');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);
  
  const modalRef = useRef<HTMLDivElement>(null);
  const delegateButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  const { delegateTask, getActiveDelegationForTask, delegations } = useDelegation();
  const { user } = useUserPermissions();
  const { getMemberById, getDelegatableMembers, teamMembers } = useTeamMembers();
  const { errorState, clearError, executeDelegationOperation } = useDelegationErrorHandling();

  // Get current delegation for this task
  const currentDelegation = getActiveDelegationForTask(task.id);
  const isDelegated = !!currentDelegation;
  const assignee = currentDelegation ? getMemberById(currentDelegation.assigneeId) : null;

  // Get delegatable team members (excluding current user)
  const delegatableMembers = getDelegatableMembers();

  // Focus management for modal
  useEffect(() => {
    if (showModal) {
      // Push current focus to stack and focus first element in modal
      if (delegateButtonRef.current) {
        FocusManager.pushFocus(delegateButtonRef.current);
      }
      
      // Focus first focusable element in modal after render
      setTimeout(() => {
        if (firstFocusableRef.current) {
          firstFocusableRef.current.focus();
        }
      }, 100);

      // Announce modal opening
      ScreenReaderAnnouncer.announce(
        `Delegation modal opened for task: ${task.title}`,
        'assertive'
      );
    }
  }, [showModal, task.title]);

  // Handle modal keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!showModal || !modalRef.current) return;

      if (event.key === KEYBOARD_KEYS.ESCAPE) {
        event.preventDefault();
        handleCloseModal();
      } else if (event.key === KEYBOARD_KEYS.TAB) {
        FocusManager.trapFocus(modalRef.current, event);
      }
    };

    if (showModal) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [showModal]);

  const handleOpenModal = () => {
    setShowModal(true);
    setSelectedAssigneeId('');
    setDelegationNote('');
    setPriority('normal');
    setValidationErrors([]);
    setValidationWarnings([]);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedAssigneeId('');
    setDelegationNote('');
    setPriority('normal');
    setValidationErrors([]);
    setValidationWarnings([]);
    
    // Return focus to the button that opened the modal
    FocusManager.popFocus();
    
    // Announce modal closing
    ScreenReaderAnnouncer.announce('Delegation modal closed');
  };

  const handleDelegate = async () => {
    if (!selectedAssigneeId) return;

    // Clear previous validation errors
    setValidationErrors([]);
    setValidationWarnings([]);
    clearError();

    // Validate delegation data
    const assignee = getMemberById(selectedAssigneeId);
    const validation = validateTaskDelegation(
      task.id,
      selectedAssigneeId,
      user,
      assignee,
      delegations,
      delegationNote || undefined
    );

    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      setValidationWarnings(validation.warnings || []);
      return;
    }

    // Show warnings but allow continuation
    if (validation.warnings && validation.warnings.length > 0) {
      setValidationWarnings(validation.warnings);
    }

    setIsSubmitting(true);
    try {
      await executeDelegationOperation(
        () => delegateTask(task.id, selectedAssigneeId, delegationNote || undefined),
        'delegate',
        task.id,
        selectedAssigneeId
      );
      
      const assigneeName = getMemberById(selectedAssigneeId)?.name || 'team member';
      ScreenReaderAnnouncer.announce(
        `Task "${task.title}" successfully delegated to ${assigneeName}`,
        'assertive'
      );
      
      onDelegate(task.id, selectedAssigneeId, delegationNote || undefined);
      handleCloseModal();
    } catch (error) {
      // Error is handled by the error handling hook
      console.error('Failed to delegate task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDelegate = async (assigneeId: string) => {
    // Validate quick delegation
    const assignee = getMemberById(assigneeId);
    const validation = validateTaskDelegation(
      task.id,
      assigneeId,
      user,
      assignee,
      delegations
    );

    if (!validation.isValid) {
      // Show validation errors in a toast or modal
      console.error('Quick delegation validation failed:', validation.errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await executeDelegationOperation(
        () => delegateTask(task.id, assigneeId),
        'delegate',
        task.id,
        assigneeId
      );
      
      const assigneeName = getMemberById(assigneeId)?.name || 'team member';
      ScreenReaderAnnouncer.announce(
        `Task "${task.title}" quickly delegated to ${assigneeName}`,
        'assertive'
      );
      
      onDelegate(task.id, assigneeId);
    } catch (error) {
      // Error is handled by the error handling hook
      console.error('Failed to delegate task:', error);
      ScreenReaderAnnouncer.announce('Failed to delegate task', 'assertive');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Don't render if user can't delegate
  if (!canDelegate) {
    return null;
  }

  return (
    <div className={cn("space-y-2", className)}>
      {/* Delegation Controls */}
      <div className="flex items-center space-x-2">
        {/* Compact Delegate Button with + Icon */}
        <button
          onClick={handleOpenModal}
          disabled={isSubmitting}
          className={cn(
            "w-8 h-8 rounded-full bg-white/10 border border-white/20 hover:bg-white/20",
            "transition-all duration-200 flex items-center justify-center group",
            "focus:outline-none focus:ring-2 focus:ring-white/50",
            isSubmitting && "opacity-50 cursor-not-allowed"
          )}
          aria-label={generateAriaLabel.delegationButton(task.title, isDelegated, assignee?.name)}
          aria-describedby="delegation-description"
        >
          <svg 
            className="w-4 h-4 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
        
        {/* Hidden description for screen readers */}
        <div id="delegation-description" className="sr-only">
          {isDelegated 
            ? `Task is currently assigned to ${assignee?.name}. Click to reassign to a different team member.`
            : 'Click to delegate this task to a team member.'
          }
        </div>

        {/* Show delegated members as rounded avatars */}
        {(() => {
          const delegation = getActiveDelegationForTask(task.id);
          if (delegation) {
            const assignee = getMemberById(delegation.assigneeId);
            if (assignee) {
              return (
                <div className="flex items-center space-x-1">
                  <div
                    className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-medium text-xs border-2 border-white/20"
                    title={`Delegated to ${assignee.name}`}
                  >
                    {assignee.avatar || assignee.name.charAt(0).toUpperCase()}
                  </div>
                  {delegation.priority === 'urgent' && (
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse" title="Urgent" />
                  )}
                </div>
              );
            }
          }
          return null;
        })()}
      </div>

      {/* Delegation Modal */}
      {showModal && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          style={{ padding: isMobile ? '1rem' : '1rem' }}
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleCloseModal();
            }
          }}
        >
          <GlassCard 
            ref={modalRef}
            className={cn(
              "w-full",
              isMobile ? "max-w-sm" : "max-w-md"
            )}
            role={ARIA_ROLES.DELEGATION_MODAL}
            aria-modal="true"
            aria-labelledby="delegation-modal-title"
            aria-describedby="delegation-modal-description"
          >
            <div className={cn("space-y-6", isMobile && "space-y-4")}>
              {/* Header */}
              <div className="flex items-center justify-between">
                <h3 
                  id="delegation-modal-title"
                  className={cn(
                    "font-semibold text-white",
                    isMobile ? "text-base" : "text-lg"
                  )}
                >
                  {isDelegated ? 'Reassign Task' : 'Delegate Task'}
                </h3>
                <button
                  ref={firstFocusableRef}
                  onClick={handleCloseModal}
                  className={cn(
                    "rounded-full bg-white/10 hover:bg-white/20 transition-colors duration-200",
                    "flex items-center justify-center",
                    "focus:outline-none focus:ring-2 focus:ring-white/50",
                    // Mobile-friendly touch targets
                    isMobile ? "w-11 h-11 min-h-[44px] min-w-[44px]" : "w-8 h-8"
                  )}
                  aria-label="Close delegation modal"
                >
                  <svg 
                    className={cn("text-white", isMobile ? "w-5 h-5" : "w-4 h-4")} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Hidden description for screen readers */}
              <div id="delegation-modal-description" className="sr-only">
                Modal dialog for delegating task "{task.title}". Use Tab to navigate between form fields, Escape to close.
              </div>

              {/* Task Info */}
              <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                <h4 className="text-white font-medium mb-1">{task.title}</h4>
                {task.description && (
                  <p className="text-white/70 text-sm line-clamp-2">{task.description}</p>
                )}
                <div className="flex items-center space-x-2 mt-2">
                  <span className={cn(
                    'px-2 py-1 rounded text-xs font-medium',
                    task.priority === 'high' ? 'bg-red-500/20 text-red-200' :
                    task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                    'bg-green-500/20 text-green-200'
                  )}>
                    {task.priority} priority
                  </span>
                  <span className="text-xs text-white/60">
                    Status: {task.status}
                  </span>
                </div>
              </div>

              {/* Assignee Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Assign to team member
                </label>
                <TeamMemberSelector
                  onSelect={setSelectedAssigneeId}
                  excludeUsers={[user.id]}
                  filterByRole={delegatableMembers.map(m => m.role.name)}
                  placeholder="Select team member..."
                />
              </div>

              {/* Priority Selection */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Priority
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setPriority('normal')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      priority === 'normal'
                        ? 'bg-blue-500/30 text-blue-200 border border-blue-400/50'
                        : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                    )}
                  >
                    Normal
                  </button>
                  <button
                    onClick={() => setPriority('urgent')}
                    className={cn(
                      'flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                      priority === 'urgent'
                        ? 'bg-red-500/30 text-red-200 border border-red-400/50'
                        : 'bg-white/10 text-white/70 border border-white/20 hover:bg-white/20'
                    )}
                  >
                    Urgent
                  </button>
                </div>
              </div>

              {/* Delegation Note */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Note (optional)
                </label>
                <textarea
                  value={delegationNote}
                  onChange={(e) => setDelegationNote(e.target.value)}
                  placeholder="Add any specific instructions or context..."
                  rows={3}
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200 resize-none"
                />
              </div>

              {/* Validation Errors and Warnings */}
              {(validationErrors.length > 0 || validationWarnings.length > 0) && (
                <ValidationErrors 
                  errors={validationErrors}
                  warnings={validationWarnings}
                />
              )}

              {/* Error Display */}
              {errorState.error && (
                <ErrorDisplay
                  error={errorState.error}
                  onRetry={errorState.error.retryable ? () => handleDelegate() : undefined}
                  onDismiss={clearError}
                  variant="inline"
                />
              )}

              {/* Actions */}
              <div className="flex space-x-3">
                <GlassButton
                  onClick={handleCloseModal}
                  variant="secondary"
                  className="flex-1"
                >
                  Cancel
                </GlassButton>
                <GlassButton
                  onClick={handleDelegate}
                  disabled={!selectedAssigneeId || isSubmitting}
                  loading={isSubmitting}
                  variant="primary"
                  className="flex-1"
                >
                  {isDelegated ? 'Reassign' : 'Delegate'}
                </GlassButton>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default DelegationControls;