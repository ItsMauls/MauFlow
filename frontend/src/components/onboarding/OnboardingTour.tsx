'use client';

import React, { useState, useEffect } from 'react';
import { GlassCard, GlassButton } from '../ui';
import { cn } from '@/lib/utils';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target?: string;
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

interface OnboardingTourProps {
  steps: OnboardingStep[];
  isVisible: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

const defaultSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to MauFlow! 👋',
    description: 'Your smart task manager for freelancers and small teams. Let\'s get you started!',
    position: 'center'
  },
  {
    id: 'task-list',
    title: 'Here\'s your task list',
    description: 'This is where all your tasks will appear. Each card shows priority with color coding.',
    target: '[data-tour="task-list"]',
    position: 'bottom'
  },
  {
    id: 'add-task',
    title: 'Add your first task',
    description: 'Click here or use the bottom bar to create new tasks quickly.',
    target: '[data-tour="add-task"]',
    position: 'top'
  },
  {
    id: 'ai-prioritize',
    title: 'AI Smart Prioritization',
    description: 'Click "Prioritize" to let our AI rank your tasks by importance and urgency.',
    target: '[data-tour="prioritize-btn"]',
    position: 'bottom'
  },
  {
    id: 'complete',
    title: 'You\'re all set! 🚀',
    description: 'Start adding tasks and let MauFlow help you stay organized and productive.',
    position: 'center'
  }
];

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  steps = defaultSteps,
  isVisible,
  onComplete,
  onSkip
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isVisible) return;

    const step = steps[currentStep];
    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      setTargetElement(element);
      
      // Scroll element into view
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight effect
        element.style.position = 'relative';
        element.style.zIndex = '1001';
        element.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.5)';
        element.style.borderRadius = '8px';
      }
    } else {
      setTargetElement(null);
    }

    return () => {
      // Clean up highlight effect
      if (targetElement) {
        targetElement.style.position = '';
        targetElement.style.zIndex = '';
        targetElement.style.boxShadow = '';
        targetElement.style.borderRadius = '';
      }
    };
  }, [currentStep, isVisible, steps, targetElement]);

  if (!isVisible) return null;

  const currentStepData = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getTooltipPosition = () => {
    if (!targetElement || currentStepData.position === 'center') {
      return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }

    const rect = targetElement.getBoundingClientRect();
    const tooltipWidth = 320;
    const tooltipHeight = 200;

    switch (currentStepData.position) {
      case 'top':
        return `fixed left-1/2 transform -translate-x-1/2` +
               ` top-[${rect.top - tooltipHeight - 16}px]`;
      case 'bottom':
        return `fixed left-1/2 transform -translate-x-1/2` +
               ` top-[${rect.bottom + 16}px]`;
      case 'left':
        return `fixed top-1/2 transform -translate-y-1/2` +
               ` left-[${rect.left - tooltipWidth - 16}px]`;
      case 'right':
        return `fixed top-1/2 transform -translate-y-1/2` +
               ` left-[${rect.right + 16}px]`;
      default:
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2';
    }
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-1000" />
      
      {/* Tooltip */}
      <div
        className={cn(
          'z-1001 w-80 max-w-[90vw]',
          currentStepData.position === 'center' 
            ? 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2'
            : getTooltipPosition()
        )}
      >
        <GlassCard className="text-center">
          {/* Progress indicator */}
          <div className="flex justify-center mb-4">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    'w-2 h-2 rounded-full transition-colors',
                    index === currentStep 
                      ? 'bg-blue-400' 
                      : index < currentStep 
                        ? 'bg-green-400' 
                        : 'bg-white/30'
                  )}
                />
              ))}
            </div>
          </div>

          {/* Content */}
          <h3 className="text-xl font-semibold text-white mb-3">
            {currentStepData.title}
          </h3>
          <p className="text-white/80 mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            {!isFirstStep && (
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={handlePrevious}
              >
                Previous
              </GlassButton>
            )}
            
            <GlassButton
              variant="primary"
              onClick={handleNext}
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </GlassButton>
            
            {!isLastStep && (
              <GlassButton
                variant="secondary"
                size="sm"
                onClick={onSkip}
              >
                Skip Tour
              </GlassButton>
            )}
          </div>

          {/* Step counter */}
          <div className="mt-4 text-white/60 text-sm">
            Step {currentStep + 1} of {steps.length}
          </div>
        </GlassCard>
      </div>
    </>
  );
};

// Hook for managing onboarding state
export const useOnboarding = () => {
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    const hasSeenOnboarding = localStorage.getItem('mauflow-onboarding-completed');
    if (!hasSeenOnboarding) {
      setIsFirstVisit(true);
      setShowOnboarding(true);
    }
  }, []);

  const completeOnboarding = () => {
    localStorage.setItem('mauflow-onboarding-completed', 'true');
    setShowOnboarding(false);
    setIsFirstVisit(false);
  };

  const skipOnboarding = () => {
    localStorage.setItem('mauflow-onboarding-completed', 'true');
    setShowOnboarding(false);
    setIsFirstVisit(false);
  };

  const restartOnboarding = () => {
    localStorage.removeItem('mauflow-onboarding-completed');
    setShowOnboarding(true);
  };

  return {
    isFirstVisit,
    showOnboarding,
    completeOnboarding,
    skipOnboarding,
    restartOnboarding
  };
};