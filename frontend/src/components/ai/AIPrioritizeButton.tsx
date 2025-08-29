'use client';

import React, { useState } from 'react';
import { GlassButton } from '../ui';
import { useApiMutation } from '@/hooks/useApi';

interface AIPrioritizeButtonProps {
  onPrioritizeComplete?: (prioritizedTasks: any[]) => void;
  disabled?: boolean;
  className?: string;
}

interface PrioritizeResponse {
  prioritizedTasks: Array<{
    id: string;
    title: string;
    priority: 'high' | 'medium' | 'low';
    aiScore: number;
    reasoning: string;
  }>;
  summary: string;
}

export const AIPrioritizeButton: React.FC<AIPrioritizeButtonProps> = ({
  onPrioritizeComplete,
  disabled = false,
  className
}) => {
  const [showResults, setShowResults] = useState(false);
  const [aiResults, setAiResults] = useState<PrioritizeResponse | null>(null);

  const prioritizeMutation = useApiMutation<PrioritizeResponse, void>(
    '/api/prioritize',
    'POST',
    {
      onSuccess: (data) => {
        setAiResults(data);
        setShowResults(true);
        onPrioritizeComplete?.(data.prioritizedTasks);
      },
      onError: (error) => {
        console.error('AI Prioritization failed:', error);
        // Could show a toast notification here
      }
    }
  );

  const handlePrioritize = () => {
    prioritizeMutation.mutate();
  };

  return (
    <>
      <GlassButton
        variant="primary"
        onClick={handlePrioritize}
        loading={prioritizeMutation.isPending}
        disabled={disabled || prioritizeMutation.isPending}
        className={className}
        data-tour="prioritize-btn"
      >
        {prioritizeMutation.isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
            AI Analyzing...
          </>
        ) : (
          <>
            <span className="mr-2">🤖</span>
            AI Prioritize
          </>
        )}
      </GlassButton>

      {/* AI Results Modal */}
      {showResults && aiResults && (
        <AIPrioritizeResults
          results={aiResults}
          onClose={() => setShowResults(false)}
        />
      )}
    </>
  );
};

interface AIPrioritizeResultsProps {
  results: PrioritizeResponse;
  onClose: () => void;
}

const AIPrioritizeResults: React.FC<AIPrioritizeResultsProps> = ({
  results,
  onClose
}) => {
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="bg-white/10 backdrop-blur-lg rounded-xl border border-white/20 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <span>🤖</span>
              AI Prioritization Results
            </h2>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={onClose}
            >
              ✕
            </GlassButton>
          </div>

          {/* Summary */}
          <div className="mb-6 p-4 rounded-lg bg-blue-500/10 border border-blue-400/20">
            <h3 className="font-semibold text-blue-200 mb-2">AI Summary</h3>
            <p className="text-white/80 text-sm leading-relaxed">
              {results.summary}
            </p>
          </div>

          {/* Prioritized Tasks */}
          <div className="space-y-3">
            <h3 className="font-semibold text-white mb-3">Recommended Priority Order</h3>
            {results.prioritizedTasks.map((task, index) => (
              <div
                key={task.id}
                className={`p-4 rounded-lg border backdrop-blur-sm ${
                  task.priority === 'high' 
                    ? 'bg-red-500/10 border-red-400/30' 
                    : task.priority === 'medium'
                      ? 'bg-yellow-500/10 border-yellow-400/30'
                      : 'bg-green-500/10 border-green-400/30'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                    <h4 className="font-medium text-white">{task.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      task.priority === 'high' ? 'bg-red-500/20 text-red-200' :
                      task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-200' :
                      'bg-green-500/20 text-green-200'
                    }`}>
                      {task.priority}
                    </div>
                    <div className="text-white/60 text-xs">
                      Score: {task.aiScore}/100
                    </div>
                  </div>
                </div>
                <p className="text-white/70 text-sm pl-9">
                  {task.reasoning}
                </p>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6">
            <GlassButton
              variant="secondary"
              onClick={onClose}
            >
              Keep Current Order
            </GlassButton>
            <GlassButton
              variant="primary"
              onClick={() => {
                // Apply the AI prioritization
                onClose();
                // This would trigger a re-sort of tasks in the parent component
              }}
            >
              Apply AI Priority
            </GlassButton>
          </div>
        </div>
      </div>
    </div>
  );
};