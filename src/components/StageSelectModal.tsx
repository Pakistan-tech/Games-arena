import React, { useState } from 'react';
import { X, Lock, Star, Zap, Sparkles } from 'lucide-react';
import { STAGE_CONFIGS } from '../services/puzzleEngine';
import { StageRecord } from '../types/game';

interface StageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStage: (stageId: number) => void;
  currentStageId: number;
  stageProgress: Record<number, StageRecord>;
  isAdmin?: boolean;
}

export const StageSelectModal: React.FC<StageSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectStage,
  currentStageId,
  stageProgress,
  isAdmin = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Zap size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Stage Selector
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAdmin ? "Admin Testing: All stages unlocked" : "Select and play arrow stages"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stage List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAGE_CONFIGS.map((stage) => {
              const record = stageProgress[stage.id];
              // In admin mode or Stage 1 or if unlocked
              const isUnlocked = isAdmin || stage.id === 1 || Boolean(record) || Boolean(stageProgress[stage.id - 1]?.completed);
              const stars = record?.stars || 0;
              const isCurrent = stage.id === currentStageId;

              return (
                <div
                  key={stage.id}
                  onClick={() => {
                    if (isUnlocked) {
                      onSelectStage(stage.id);
                      onClose();
                    }
                  }}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isUnlocked
                      ? 'cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      : 'opacity-50 pointer-events-none bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800/60'
                  } ${isCurrent ? 'ring-2 ring-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                        #{stage.id}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                        {stage.name}
                      </h4>
                      {stage.id % 2 === 0 && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                          Shape
                        </span>
                      )}
                    </div>

                    {!isUnlocked ? (
                      <Lock size={14} className="text-slate-400" />
                    ) : (
                      <div className="flex items-center text-amber-400 text-xs font-bold">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <Star
                            key={idx}
                            size={13}
                            className={idx < stars ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-700'}
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mb-2">
                    {stage.description}
                  </p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono border-t border-slate-100 dark:border-slate-800/60 pt-2">
                    <span>Grid {stage.w}×{stage.h}</span>
                    <span className="text-slate-500 dark:text-slate-400">Timer: 1.5s/arrow</span>
                    {record?.bestScore ? (
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">
                        {record.bestScore.toLocaleString()} pts
                      </span>
                    ) : isUnlocked ? (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">Ready</span>
                    ) : (
                      <span>Locked</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-semibold hover:bg-slate-800 dark:hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
