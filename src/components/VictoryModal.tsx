import React from 'react';
import { Star, Trophy, RotateCcw, ArrowRight, Zap, Clock, ShieldCheck, Play, Heart, Sparkles, AlertCircle } from 'lucide-react';
import { generateStageCompletionFeedback, generateDefeatFeedback } from '../services/motivationalMessages';

interface VictoryModalProps {
  isOpen: boolean;
  won: boolean;
  stageId: number;
  stageName: string;
  score: number;
  stars: number;
  timeSec: number;
  parTimeSec: number;
  mistakes: number;
  hintsUsed: number;
  arrowsRemaining: number;
  totalArrows: number;
  livesRemaining: number;
  maxCombo: number;
  isNewHighRecord: boolean;
  hasNextStage: boolean;
  onNextStage: () => void;
  onRestart: () => void;
  onContinueWithAd?: () => void;
  onOpenScorecard: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({
  isOpen,
  won,
  stageId,
  stageName,
  score,
  stars,
  timeSec,
  parTimeSec,
  mistakes,
  hintsUsed,
  arrowsRemaining,
  totalArrows,
  livesRemaining,
  maxCombo,
  isNewHighRecord,
  hasNextStage,
  onNextStage,
  onRestart,
  onContinueWithAd,
  onOpenScorecard
}) => {
  if (!isOpen) return null;

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return mins > 0 ? `${mins}m ${s}s` : `${s} seconds`;
  };

  const speedBonus = Math.max(0, Math.floor((parTimeSec - timeSec) * 20));
  const comboBonus = maxCombo > 1 ? maxCombo * 100 : 0;
  const flawlessBonus = mistakes === 0 ? 500 : 0;

  // Generate dynamic motivational messages based on player's actual performance
  const completionFeedback = won
    ? generateStageCompletionFeedback(stageId, timeSec, totalArrows, livesRemaining)
    : null;

  const defeatFeedback = !won
    ? generateDefeatFeedback(stageId, arrowsRemaining, totalArrows)
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-center transition-colors">
        
        {won && completionFeedback ? (
          <>
            {/* Stars */}
            <div className="flex items-center justify-center gap-1.5 mb-2.5 text-amber-400">
              {Array.from({ length: 3 }).map((_, i) => (
                <Star
                  key={i}
                  size={30}
                  className={`transition-transform duration-300 ${
                    i < stars
                      ? 'fill-amber-400 text-amber-400 scale-100 drop-shadow-sm'
                      : 'text-slate-300 dark:text-slate-700 scale-90'
                  }`}
                />
              ))}
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
              Stage {stageId} Completed!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
              {stageName}
            </p>

            {/* Performance Summary Banner */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/30 p-3.5 mb-3.5 text-left space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold text-xs text-blue-900 dark:text-blue-300">
                <Sparkles size={14} className="text-blue-500" />
                <span>Performance Feedback</span>
              </div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                "{completionFeedback.summary}"
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {completionFeedback.encouragement}
              </p>
            </div>

            {/* Motivational Quote Card */}
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 p-3 mb-4 text-xs italic text-slate-600 dark:text-slate-300 leading-relaxed">
              "{completionFeedback.quote}"
            </div>

            {/* Key Data Clusters: Stage, Time, Arrows, Lives */}
            <div className="grid grid-cols-4 gap-2 mb-4 text-center">
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Stage</div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">#{stageId}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Time</div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{timeSec}s</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Cleared</div>
                <div className="font-mono text-sm font-bold text-slate-900 dark:text-slate-100">{totalArrows}</div>
              </div>
              <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">Lives Kept</div>
                <div className="font-mono text-sm font-bold text-rose-500 flex items-center justify-center gap-1">
                  <Heart size={12} className="fill-rose-500" />
                  <span>{livesRemaining}/3</span>
                </div>
              </div>
            </div>

            {/* Lives Carried Forward Notice */}
            <div className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 mb-4 bg-emerald-50 dark:bg-emerald-950/30 py-1.5 px-3 rounded-lg border border-emerald-200 dark:border-emerald-900/40">
              <Heart size={12} className="fill-emerald-500 text-emerald-500" />
              <span>Your remaining {livesRemaining} {livesRemaining === 1 ? 'life is' : 'lives are'} carried forward to Stage {stageId + 1}!</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {hasNextStage ? (
                <button
                  onClick={onNextStage}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
                >
                  <span>Advance to Stage {stageId + 1}</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  onClick={onRestart}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition-all shadow-md cursor-pointer"
                >
                  <span>Replay Stage</span>
                  <RotateCcw size={16} />
                </button>
              )}

              <div className="flex items-center gap-2">
                <button
                  onClick={onRestart}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  Retry Stage (3 Lives)
                </button>
                <button
                  onClick={onOpenScorecard}
                  className="flex-1 py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  View Scorecard
                </button>
              </div>
            </div>
          </>
        ) : (
          /* Game Over (Defeat) with Motivational Encouragement & Continue Option */
          defeatFeedback && (
            <>
              <div className="w-12 h-12 mx-auto rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-500 mb-2">
                <RotateCcw size={22} />
              </div>

              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 mb-1">
                Out of Lives (0/3)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                {defeatFeedback.summary}
              </p>

              {/* Motivational Tip Card (Requirement 5) */}
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/25 p-3.5 mb-3.5 text-left space-y-1">
                <span className="font-bold text-xs text-amber-900 dark:text-amber-300 block">
                  Mindset & Persistence:
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                  "{defeatFeedback.tip}"
                </p>
              </div>

              {/* Motivational Quote from collection of 30 */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 p-3 mb-4 text-xs italic text-slate-600 dark:text-slate-300 leading-relaxed">
                "{defeatFeedback.quote}"
              </div>

              {/* Continue / Restart Choices */}
              <div className="flex flex-col gap-2.5">
                {/* Option 1: Continue with Ad (Restore exact state) */}
                {onContinueWithAd && (
                  <button
                    onClick={onContinueWithAd}
                    className="w-full flex items-center justify-between p-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-sm transition-all shadow-md cursor-pointer text-left"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
                        <Play size={16} className="fill-white" />
                      </div>
                      <div>
                        <div className="text-xs font-bold leading-tight">Continue Playing</div>
                        <div className="text-[11px] font-normal text-white/80">
                          Watch Ad · Resume exact state with 3 Lives
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 uppercase font-mono font-bold tracking-wider">
                      AD
                    </span>
                  </button>
                )}

                {/* Option 2: Restart Stage */}
                <button
                  onClick={onRestart}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-semibold text-xs hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <RotateCcw size={14} />
                  <span>Restart Stage {stageId} (Fresh 3 Lives)</span>
                </button>

                {/* Option 3: Scorecard */}
                <button
                  onClick={onOpenScorecard}
                  className="py-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  View Career Scorecard
                </button>
              </div>
            </>
          )
        )}

      </div>
    </div>
  );
};
