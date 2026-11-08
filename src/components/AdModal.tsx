import React, { useState, useEffect } from 'react';
import { Play, Sparkles, CheckCircle2, ShieldAlert, FastForward } from 'lucide-react';

interface AdModalProps {
  isOpen: boolean;
  isAdmin: boolean;
  onAdCompleted: () => void;
  onCancel: () => void;
}

export const AdModal: React.FC<AdModalProps> = ({
  isOpen,
  isAdmin,
  onAdCompleted,
  onCancel
}) => {
  const [secondsLeft, setSecondsLeft] = useState<number>(5);
  const [isRewardReady, setIsRewardReady] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setSecondsLeft(5);
      setIsRewardReady(false);
      return;
    }

    setSecondsLeft(5);
    setIsRewardReady(false);

    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRewardReady(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const progressPercent = ((5 - secondsLeft) / 5) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-7 text-center overflow-hidden transition-colors">
        
        {/* Top Ad Sponsor Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100 dark:border-slate-800 text-xs text-slate-400">
          <div className="flex items-center gap-1.5 font-medium">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-500 font-bold text-[10px]">AD</span>
            <span>Sponsored Reward Partner</span>
          </div>

          {/* Admin Instant Skip */}
          {isAdmin && !isRewardReady && (
            <button
              onClick={onAdCompleted}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-600 text-white text-[11px] font-semibold hover:bg-blue-700 cursor-pointer"
            >
              <FastForward size={12} />
              <span>Skip (Admin Test)</span>
            </button>
          )}
        </div>

        {/* Ad Video Preview Simulator */}
        <div className="relative h-44 rounded-xl bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 flex flex-col items-center justify-center p-4 text-white overflow-hidden shadow-inner mb-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(99,102,241,0.25),transparent_70%)]" />
          
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-indigo-600/30 border border-indigo-400/40 flex items-center justify-center mb-2 animate-pulse">
              <Sparkles size={24} className="text-indigo-300" />
            </div>
            <h4 className="font-bold text-base tracking-wide text-white">
              HyperGlide Velocity 3D
            </h4>
            <p className="text-xs text-indigo-200/80 mt-1 max-w-[260px]">
              Tap to dodge obstacles at supersonic speed. Free on mobile!
            </p>
          </div>

          {/* Countdown timer badge inside video */}
          <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-sm text-[11px] font-mono font-bold text-white flex items-center gap-1.5">
            {!isRewardReady ? (
              <span>Reward in {secondsLeft}s</span>
            ) : (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 size={12} /> Ready
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mb-5">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-emerald-500 transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Status Message */}
        <div className="mb-5">
          {isRewardReady ? (
            <div className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center justify-center gap-1.5">
              <CheckCircle2 size={16} />
              <span>Ad Completed! +3 Extra Lives Granted</span>
            </div>
          ) : (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Watch this brief message to resume your exact game state...
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          {isRewardReady ? (
            <button
              onClick={onAdCompleted}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Play size={16} className="fill-white" />
              <span>Claim +3 Lives & Resume</span>
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 px-4 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 font-semibold text-sm cursor-not-allowed"
            >
              Reward unlocks in {secondsLeft}s...
            </button>
          )}

          <button
            onClick={onCancel}
            className="py-1.5 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
          >
            Cancel and Return to Game Over
          </button>
        </div>

      </div>
    </div>
  );
};
