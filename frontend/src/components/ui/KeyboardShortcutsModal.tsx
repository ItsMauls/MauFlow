'use client';

import React from 'react';
import { GlassCard, GlassButton } from './index';
import { useModalAccessibility } from '@/hooks/useAccessibility';
import { useShortcutsHelp, type KeyboardShortcut } from '@/hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  shortcuts: KeyboardShortcut[];
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  shortcuts
}) => {
  const { modalRef, handleKeyDown } = useModalAccessibility(isOpen);
  const { formatShortcut, groupedShortcuts } = useShortcutsHelp(shortcuts);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm backdrop-enter"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div
        ref={modalRef}
        className="relative w-full max-w-2xl max-h-[80vh] modal-enter"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-title"
        aria-describedby="shortcuts-description"
      >
        <GlassCard className="p-6 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 
                id="shortcuts-title"
                className="text-2xl font-bold text-white mb-2"
              >
                Keyboard Shortcuts
              </h2>
              <p 
                id="shortcuts-description"
                className="text-white/70 text-sm"
              >
                Use these keyboard shortcuts to navigate and interact with the application more efficiently.
              </p>
            </div>
            <GlassButton
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="rounded-full w-10 h-10 p-0"
              aria-label="Close keyboard shortcuts modal"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </GlassButton>
          </div>

          {/* Shortcuts List */}
          <div className="overflow-y-auto max-h-96 space-y-6">
            {Object.entries(groupedShortcuts).map(([category, categoryShortcuts]) => (
              <div key={category} className="space-y-3">
                <h3 className="text-lg font-semibold text-white/90 border-b border-white/20 pb-2">
                  {category}
                </h3>
                <div className="space-y-2">
                  {categoryShortcuts.map((shortcut, index) => (
                    <div
                      key={`${category}-${index}`}
                      className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                    >
                      <span className="text-white/80 text-sm">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {formatShortcut(shortcut).split(' + ').map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            {keyIndex > 0 && (
                              <span className="text-white/50 text-xs mx-1">+</span>
                            )}
                            <kbd className="px-2 py-1 text-xs font-mono bg-white/20 border border-white/30 rounded text-white">
                              {key}
                            </kbd>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="mt-6 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between">
              <p className="text-white/60 text-xs">
                Press <kbd className="px-1 py-0.5 text-xs bg-white/20 rounded">Esc</kbd> to close this modal
              </p>
              <GlassButton
                variant="primary"
                size="sm"
                onClick={onClose}
                className="rounded-lg"
              >
                Got it
              </GlassButton>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};