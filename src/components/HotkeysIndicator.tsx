import React, { useState } from 'react';
import { Keyboard, X, Command, Activity, Shield, Layers, Zap } from 'lucide-react';

interface HotkeysIndicatorProps {
  onTriggerAnalysis: () => void;
  onCycleTab: () => void;
  onJumpToCompliance: () => void;
  onCloseModals: () => void;
  activeTab: string;
}

export function HotkeysIndicator({
  onTriggerAnalysis,
  onCycleTab,
  onJumpToCompliance,
  onCloseModals,
  activeTab,
}: HotkeysIndicatorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    {
      key: 'Space',
      description: 'Trigger Institutional Order Flow Analysis',
      actionName: 'Run Analysis',
      icon: Zap,
      action: () => {
        onTriggerAnalysis();
        setIsOpen(false);
      },
    },
    {
      key: 'Tab',
      description: 'Cycle Dashboard Views (Workspace → Compliance → Signal Data)',
      actionName: `Next View (${activeTab.replace('_', ' ').toUpperCase()})`,
      icon: Layers,
      action: () => {
        onCycleTab();
      },
    },
    {
      key: 'R',
      description: 'Jump directly to Risk & Portfolio Compliance Monitor',
      actionName: 'Risk Compliance',
      icon: Shield,
      action: () => {
        onJumpToCompliance();
        setIsOpen(false);
      },
    },
    {
      key: 'Esc',
      description: 'Close all open floating modals & drawer inspectors',
      actionName: 'Dismiss Modals',
      icon: X,
      action: () => {
        onCloseModals();
        setIsOpen(false);
      },
    },
  ];

  return (
    <>
      {/* Floating Hotkeys Indicator Button (Bottom-Right) */}
      <div className="fixed bottom-5 right-5 z-40">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle Keyboard Shortcuts"
          className="group flex items-center gap-2 px-3 py-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-700/80 hover:border-cyan-500/50 shadow-2xl backdrop-blur-xl transition-all active:scale-95"
        >
          <div className="w-5 h-5 rounded-md bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:bg-cyan-500/20 transition-colors">
            <Keyboard className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-mono font-semibold tracking-tight text-neutral-200">
            Hotkeys
          </span>
          <div className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 bg-neutral-950/80 px-1.5 py-0.5 rounded border border-neutral-800">
            <span>Space</span>
            <span>•</span>
            <span>Tab</span>
          </div>
        </button>
      </div>

      {/* Hotkey Guide Modal / Popover */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end sm:justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="w-full max-w-md rounded-2xl bg-neutral-900/95 border border-neutral-800 shadow-2xl backdrop-blur-2xl p-5 space-y-4 font-mono sm:mr-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Keyboard className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-neutral-100 flex items-center gap-1.5">
                    <span>Global Keyboard Navigation</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                      Active
                    </span>
                  </h3>
                  <p className="text-[11px] text-neutral-400">
                    High-speed hotkeys available across all views
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of Shortcuts */}
            <div className="space-y-2.5">
              {shortcuts.map((sc) => {
                const IconComponent = sc.icon;
                return (
                  <div
                    key={sc.key}
                    onClick={sc.action}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-neutral-950/70 hover:bg-neutral-800/80 border border-neutral-800/90 hover:border-cyan-500/40 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded bg-neutral-900 border border-neutral-700 flex items-center justify-center text-neutral-400 group-hover:text-cyan-300 group-hover:border-cyan-500/40 transition-colors">
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold text-neutral-200 group-hover:text-cyan-200 transition-colors">
                          {sc.description}
                        </div>
                        <div className="text-[10px] text-neutral-500">
                          Click to test: <strong className="text-neutral-300">{sc.actionName}</strong>
                        </div>
                      </div>
                    </div>

                    <kbd className="px-2 py-1 text-xs font-bold text-cyan-300 bg-neutral-900 rounded-md border border-neutral-700 shadow-inner group-hover:border-cyan-400 transition-colors shrink-0">
                      {sc.key}
                    </kbd>
                  </div>
                );
              })}
            </div>

            {/* Footer Tip */}
            <div className="pt-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
              <span>Press <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-300 border border-neutral-700 text-[10px]">Esc</kbd> anytime to dismiss</span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
