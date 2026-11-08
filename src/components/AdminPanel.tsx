import React, { useState } from 'react';
import { ShieldCheck, Zap, Skull, Tv, Trophy, Eye, Heart, ChevronDown, ChevronUp } from 'lucide-react';
import { STAGE_CONFIGS } from '../services/puzzleEngine';

interface AdminPanelProps {
  isAdmin: boolean;
  onToggleAdmin: () => void;
  currentStageId: number;
  onSelectStage: (stageId: number) => void;
  onSimulateDefeat: () => void;
  onSimulateAdContinue: () => void;
  onSimulateVictory: () => void;
  unlimitedLives: boolean;
  onToggleUnlimitedLives: () => void;
  revealFreeArrows: boolean;
  onToggleRevealFreeArrows: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isAdmin,
  onToggleAdmin,
  currentStageId,
  onSelectStage,
  onSimulateDefeat,
  onSimulateAdContinue,
  onSimulateVictory,
  unlimitedLives,
  onToggleUnlimitedLives,
  revealFreeArrows,
  onToggleRevealFreeArrows
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  if (!isAdmin) return null;

  return (
    <div className="fixed bottom-3 right-3 left-3 sm:left-auto sm:max-w-md z-40 bg-slate-900/95 text-white border border-amber-500/50 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden text-xs transition-all">
      {/* Admin Panel Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-amber-500/20 border-b border-amber-500/30">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <span className="font-bold text-amber-300 tracking-wide font-mono uppercase text-[11px]">
            Admin Testing Controls
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded text-amber-300 hover:text-white hover:bg-white/10 cursor-pointer"
            title={isCollapsed ? "Expand Admin Dock" : "Collapse"}
          >
            {isCollapsed ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          <button
            onClick={onToggleAdmin}
            className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/30 text-red-300 hover:bg-red-500/50 cursor-pointer"
            title="Exit Admin Testing Mode"
          >
            Exit
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="p-3 space-y-2.5">
          {/* Stage Fast Switching */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Switch Stage (No Locks)
            </div>
            <div className="grid grid-cols-2 gap-2 mb-2">
              <button
                onClick={() => onSelectStage(1)}
                className={`py-1.5 px-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  currentStageId === 1
                    ? 'bg-blue-600 border-blue-400 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Zap size={13} className="text-amber-400" />
                <span>Stage 1 (Easy)</span>
              </button>

              <button
                onClick={() => onSelectStage(2)}
                className={`py-1.5 px-2.5 rounded-lg border font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                  currentStageId === 2
                    ? 'bg-purple-600 border-purple-400 text-white shadow-sm'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Zap size={13} className="text-purple-400" />
                <span>Stage 2 (Difficult)</span>
              </button>
            </div>

            {/* Jump to Any Stage 1-50 */}
            <div className="flex items-center gap-2 bg-slate-800/80 p-1.5 rounded-lg border border-slate-700">
              <span className="text-[10px] text-slate-400 shrink-0">Jump Stage (1–50):</span>
              <select
                value={currentStageId}
                onChange={(e) => onSelectStage(Number(e.target.value))}
                className="bg-slate-900 text-amber-300 text-xs rounded px-2 py-1 font-mono font-bold border border-slate-700 w-full cursor-pointer"
              >
                {STAGE_CONFIGS.map((stg) => (
                  <option key={stg.id} value={stg.id}>
                    Stage {stg.id}: {stg.name} {stg.id % 2 === 0 ? '★ [Shape]' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Test Continue & Restart State Triggers */}
          <div>
            <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Test Loss / Continue Flow
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              <button
                onClick={onSimulateDefeat}
                className="py-1 px-1.5 rounded bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                title="Force lives to 0 and trigger the Continue / Restart stage prompt"
              >
                <Skull size={12} />
                <span>Test Defeat</span>
              </button>

              <button
                onClick={onSimulateAdContinue}
                className="py-1 px-1.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-200 font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                title="Simulate ad view and test exact state restore"
              >
                <Tv size={12} />
                <span>Test Ad</span>
              </button>

              <button
                onClick={onSimulateVictory}
                className="py-1 px-1.5 rounded bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 text-emerald-200 font-medium text-[11px] flex items-center justify-center gap-1 cursor-pointer"
                title="Test clearing stage and star rating"
              >
                <Trophy size={12} />
                <span>Test Win</span>
              </button>
            </div>
          </div>

          {/* Testing Toggles */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <button
              onClick={onToggleUnlimitedLives}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
                unlimitedLives
                  ? 'bg-rose-500 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Heart size={12} className={unlimitedLives ? 'fill-white' : ''} />
              <span>Unlimited Lives: {unlimitedLives ? 'ON' : 'OFF'}</span>
            </button>

            <button
              onClick={onToggleRevealFreeArrows}
              className={`flex items-center gap-1.5 px-2 py-1 rounded transition-colors cursor-pointer ${
                revealFreeArrows
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Eye size={12} />
              <span>God Mode: {revealFreeArrows ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
