import React from 'react';
import { Heart, Clock, Zap, Lightbulb, RotateCcw, Pause, Play, ZoomIn, ZoomOut, Trophy, AlertTriangle } from 'lucide-react';

interface HUDProps {
  lives: number;
  maxLives: number;
  arrowsRemaining: number;
  totalArrows: number;
  elapsedSec: number;
  timeLeft: number;
  totalStageTime: number;
  parTimeSec: number;
  score: number;
  combo: number;
  comboTimeLeftPercent: number; // 0 to 100
  hintsRemaining: number;
  onUseHint: () => void;
  onRestart: () => void;
  isPaused: boolean;
  onTogglePause: () => void;
  zoomLevel: number;
  onZoomChange: (zoom: number) => void;
  onOpenScorecard: () => void;
  onOpenBrainTraining?: () => void;
}

export const HUD: React.FC<HUDProps> = ({
  lives,
  maxLives,
  arrowsRemaining,
  totalArrows,
  elapsedSec,
  timeLeft,
  totalStageTime,
  parTimeSec,
  score,
  combo,
  comboTimeLeftPercent,
  hintsRemaining,
  onUseHint,
  onRestart,
  isPaused,
  onTogglePause,
  zoomLevel,
  onZoomChange,
  onOpenScorecard,
  onOpenBrainTraining
}) => {
  // Format MM:SS for auxiliary display
  const formatTimeMinutes = (sec: number) => {
    const safe = Math.max(0, sec);
    const mins = Math.floor(safe / 60);
    const s = Math.floor(safe % 60);
    return `${mins}:${s < 10 ? '0' : ''}${s}`;
  };

  // Timer emergency threshold calculations (20% of original stage time)
  const timeRatio = totalStageTime > 0 ? timeLeft / totalStageTime : 1;
  const isTimeWarning = timeRatio <= 0.20 && timeLeft > 0;
  const isTimeCritical = (timeRatio <= 0.10 || timeLeft <= 10) && timeLeft > 0;
  const isLivesEmergency = lives === 1;

  return (
    <div className="w-full flex flex-col gap-2 mb-3">
      {/* Escalating Emergency Warning Banners */}
      {(isTimeWarning || isLivesEmergency) && (
        <div className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-300 ${
          isTimeCritical && isLivesEmergency
            ? 'bg-rose-600 text-white border-2 border-rose-400 shadow-lg shadow-rose-600/30 animate-pulse'
            : isTimeCritical
            ? 'bg-rose-500/20 border border-rose-500 text-rose-700 dark:text-rose-300 animate-pulse shadow-md'
            : isTimeWarning
            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-800 dark:text-amber-200 animate-pulse'
            : 'bg-rose-500/15 border border-rose-500/30 text-rose-700 dark:text-rose-300 animate-pulse'
        }`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} className={`shrink-0 ${
              isTimeCritical ? 'text-rose-400 animate-bounce' : 'text-amber-500'
            }`} />
            <div>
              {isTimeCritical && isLivesEmergency ? (
                <span>CRITICAL DANGER: 1 Life Remaining & Only {timeLeft.toFixed(1)}s Left! Breathe and select guaranteed escapes.</span>
              ) : isTimeCritical ? (
                <span>CRITICAL TIME ALERT: Only {timeLeft.toFixed(1)}s Remaining (&lt; 10% stage time)! Clear open paths immediately!</span>
              ) : isTimeWarning ? (
                <span>EMERGENCY TIME WARNING: {timeLeft.toFixed(1)}s Remaining (&lt; 20% stage time)! Look for rapid exit angles.</span>
              ) : (
                <span>EMERGENCY WARNING: 1 Life Remaining! Step back and scan for secondary openings.</span>
              )}
            </div>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-wider opacity-90 hidden sm:inline ml-2 whitespace-nowrap">
            {isTimeCritical ? 'ACT NOW' : 'SCAN CAREFULLY'}
          </span>
        </div>
      )}

      {/* Top HUD bar with tabular metrics */}
      <div className={`flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 sm:py-2.5 rounded-xl bg-white dark:bg-slate-900 border transition-all ${
        isTimeCritical
          ? 'border-rose-500 shadow-rose-500/20 shadow-md ring-1 ring-rose-500/40'
          : isTimeWarning || isLivesEmergency
          ? 'border-amber-400/60 shadow-amber-500/10 shadow-sm'
          : 'border-slate-200 dark:border-slate-800 shadow-sm'
      }`}>
        {/* 3-Life Container Display */}
        <div className="flex items-center gap-2 min-w-[95px]">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Lives</span>
          <div className="flex items-center gap-1">
            {Array.from({ length: maxLives }).map((_, i) => (
              <Heart
                key={i}
                size={18}
                className={`transition-all duration-200 ${
                  i < lives
                    ? 'fill-rose-500 text-rose-500 scale-100 drop-shadow-sm'
                    : 'fill-slate-200 dark:fill-slate-800 text-slate-300 dark:text-slate-700 scale-90 opacity-60'
                }`}
              />
            ))}
          </div>
          <span className={`text-xs font-mono font-bold ml-0.5 ${
            isLivesEmergency ? 'text-rose-600 dark:text-rose-400 font-extrabold animate-pulse' : 'text-slate-700 dark:text-slate-300'
          }`}>
            ({lives}/{maxLives})
          </span>
        </div>

        {/* Arrows Remaining */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Arrows</span>
          <span className="font-mono tabular-nums text-base font-bold text-slate-900 dark:text-slate-100">
            {arrowsRemaining} <span className="text-xs font-normal text-slate-400">/ {totalArrows}</span>
          </span>
        </div>

        {/* Countdown Timer with Decimal Precision & Total Stage Time */}
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg transition-all ${
          isTimeCritical
            ? 'bg-rose-500/20 border border-rose-500 text-rose-600 dark:text-rose-400 animate-pulse'
            : isTimeWarning
            ? 'bg-amber-500/15 border border-amber-500/40 text-amber-600 dark:text-amber-400'
            : 'bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800'
        }`}>
          <Clock size={15} className={
            isTimeCritical
              ? 'text-rose-600 dark:text-rose-400 animate-spin'
              : isTimeWarning
              ? 'text-amber-500'
              : 'text-blue-500'
          } />
          <div className="flex items-baseline gap-1.5 font-mono tabular-nums">
            <span className={`text-base font-bold ${
              isTimeCritical
                ? 'text-rose-600 dark:text-rose-400 font-extrabold'
                : isTimeWarning
                ? 'text-amber-600 dark:text-amber-400 font-bold'
                : 'text-slate-900 dark:text-slate-100'
            }`}>
              {timeLeft.toFixed(1)}s
            </span>
            <span className="text-xs text-slate-400 font-normal">
              ({formatTimeMinutes(timeLeft)} / {totalStageTime.toFixed(1)}s)
            </span>
          </div>
        </div>

        {/* Score & Combo Multiplier */}
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Score</span>
            <span className="font-mono tabular-nums text-base font-bold text-blue-600 dark:text-blue-400">
              {score.toLocaleString()}
            </span>
          </div>

          {/* Dynamic Combo Badge */}
          {combo > 1 && (
            <div className="relative flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white font-mono text-xs font-bold tracking-tight shadow-sm animate-pulse">
              <Zap size={13} className="fill-white" />
              <span>{combo}x COMBO</span>
            </div>
          )}
        </div>

        {/* Quick Career Scorecard & Brain Training Buttons */}
        <div className="flex items-center gap-1.5">
          {onOpenBrainTraining && (
            <button
              onClick={onOpenBrainTraining}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
              title="Mental skills encouraged by this game"
            >
              Brain Training
            </button>
          )}

          <button
            onClick={onOpenScorecard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Open Combined Career Scorecard"
          >
            <Trophy size={14} className="text-amber-500" />
            <span className="hidden sm:inline">Scorecard</span>
          </button>
        </div>
      </div>

      {/* Dynamic Combo Bar (visible when combo > 1) */}
      {combo > 1 && (
        <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden transition-all">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-orange-500 transition-all duration-100 ease-linear"
            style={{ width: `${Math.max(0, Math.min(100, comboTimeLeftPercent))}%` }}
          />
        </div>
      )}

      {/* Control Actions Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Left: Hint, Restart, Pause */}
        <div className="flex items-center gap-2">
          <button
            onClick={onUseHint}
            disabled={hintsRemaining <= 0 || isPaused}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-blue-400 dark:hover:border-blue-500 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer font-medium"
          >
            <Lightbulb size={14} className="text-amber-500" />
            <span>Hint ({hintsRemaining})</span>
          </button>

          <button
            onClick={onRestart}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer font-medium"
            title="Restart current stage from the beginning (resets lives to 3 for this stage attempt)"
          >
            <RotateCcw size={14} />
            <span>Restart Stage</span>
          </button>

          <button
            onClick={onTogglePause}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:border-slate-400 dark:hover:border-slate-600 transition-colors cursor-pointer font-medium"
          >
            {isPaused ? <Play size={14} className="text-emerald-500" /> : <Pause size={14} />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
        </div>

        {/* Right: Zoom Controls */}
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <button
            onClick={() => onZoomChange(Math.max(12, zoomLevel - 3))}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut size={14} />
          </button>
          <input
            type="range"
            min={12}
            max={38}
            value={zoomLevel}
            onChange={(e) => onZoomChange(Number(e.target.value))}
            className="w-20 sm:w-28 accent-blue-600 cursor-pointer"
          />
          <button
            onClick={() => onZoomChange(Math.min(38, zoomLevel + 3))}
            className="p-1.5 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:text-slate-900 dark:hover:text-slate-100 cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
