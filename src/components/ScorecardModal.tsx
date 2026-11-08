import React, { useState } from 'react';
import { X, Trophy, Flame, Target, Clock, Star, ArrowUpRight, RotateCcw, Award } from 'lucide-react';
import { CareerScoreCard } from '../types/game';
import { ScoreService } from '../services/scoreService';

interface ScorecardModalProps {
  scoreCard: CareerScoreCard;
  isOpen: boolean;
  onClose: () => void;
  onReset: () => void;
}

export const ScorecardModal: React.FC<ScorecardModalProps> = ({
  scoreCard,
  isOpen,
  onClose,
  onReset
}) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'history'>('stats');
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  if (!isOpen) return null;

  const rankInfo = ScoreService.getRank(scoreCard);
  const winRate = scoreCard.totalGamesPlayed > 0 
    ? Math.round((scoreCard.totalGamesWon / scoreCard.totalGamesPlayed) * 100) 
    : 0;

  const totalTaps = scoreCard.totalCleanTaps + scoreCard.totalMistakes;
  const accuracy = totalTaps > 0 
    ? Math.round((scoreCard.totalCleanTaps / totalTaps) * 100) 
    : 100;

  const formatPlayTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Calculate total stage stars collected
  const totalStars = Object.values(scoreCard.stageProgress || {}).reduce((acc, s) => acc + (s.stars || 0), 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
              <Trophy size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Lifetime Career Scorecard
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Combined performance metrics across all plays ever recorded
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

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('stats')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'stats'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Career Summary
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 text-xs font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            Match Ledger ({scoreCard.recentMatches?.length || 0})
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'stats' ? (
            <>
              {/* Player Rank Card */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-blue-50/30 dark:from-slate-900 dark:to-slate-800/40">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Award size={18} className="text-blue-600 dark:text-blue-400" />
                    <span className="text-xs uppercase font-semibold tracking-wider text-slate-500 dark:text-slate-400">Tactical Rank</span>
                  </div>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400 font-mono">
                    Tier {rankInfo.tier}
                  </span>
                </div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">
                  {rankInfo.title}
                </div>
                <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mb-1.5">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300"
                    style={{ width: `${rankInfo.progress}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 font-mono">
                  <span>{scoreCard.lifetimeScore.toLocaleString()} pts accumulated</span>
                  <span>Next Rank: {rankInfo.nextThreshold.toLocaleString()} pts</span>
                </div>
              </div>

              {/* 6-Grid Lifetime Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* Lifetime Score */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Trophy size={14} className="text-amber-500" />
                    <span>Combined Score</span>
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {scoreCard.lifetimeScore.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Best Run: {scoreCard.highestSingleScore.toLocaleString()}
                  </div>
                </div>

                {/* Total Cleared & Win Rate */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Target size={14} className="text-emerald-500" />
                    <span>Wins / Played</span>
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {scoreCard.totalGamesWon} <span className="text-xs font-normal text-slate-400">/ {scoreCard.totalGamesPlayed}</span>
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5 font-medium">
                    {winRate}% Win Rate
                  </div>
                </div>

                {/* Escaped Arrows */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <ArrowUpRight size={14} className="text-blue-500" />
                    <span>Arrows Escaped</span>
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {scoreCard.totalArrowsEscaped.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Clean launches
                  </div>
                </div>

                {/* Highest Combo Streak */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Flame size={14} className="text-orange-500" />
                    <span>Best Combo</span>
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400">
                    {scoreCard.bestComboStreak > 0 ? `${scoreCard.bestComboStreak}x` : '1x'}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Max streak
                  </div>
                </div>

                {/* Stars Collected */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Star size={14} className="text-amber-400 fill-amber-400" />
                    <span>Stars Earned</span>
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {totalStars} ★
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Campaign master
                  </div>
                </div>

                {/* Total Play Time */}
                <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <Clock size={14} className="text-purple-500" />
                    <span>Total Playtime</span>
                  </div>
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-slate-100">
                    {formatPlayTime(scoreCard.totalPlayTimeSec)}
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    {accuracy}% accuracy
                  </div>
                </div>
              </div>
            </>
          ) : (
            /* Match Ledger Tab */
            <div className="space-y-3">
              {(!scoreCard.recentMatches || scoreCard.recentMatches.length === 0) ? (
                <div className="py-12 text-center text-slate-400">
                  No games recorded yet. Play a stage or puzzle to start logging matches!
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900 text-xs font-mono">
                  {scoreCard.recentMatches.map((m) => (
                    <div
                      key={m.id}
                      className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block w-2 h-2 rounded-full ${m.won ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                          <span className="font-sans font-semibold text-slate-900 dark:text-slate-100 text-xs">
                            {m.stageName}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase">
                            ({m.mode})
                          </span>
                        </div>
                        <span className="text-[11px] text-slate-400">
                          {formatDate(m.timestamp)} · Time {Math.floor(m.timeSec / 60)}:{String(m.timeSec % 60).padStart(2, '0')}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            +{m.score.toLocaleString()} pts
                          </div>
                          <div className="text-[11px] text-amber-500">
                            {'★'.repeat(m.stars)}{'☆'.repeat(3 - m.stars)}
                          </div>
                        </div>

                        {m.maxCombo > 1 && (
                          <div className="hidden sm:block text-[11px] text-orange-500 font-semibold">
                            {m.maxCombo}x streak
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer with Reset Option */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
          {!showConfirmReset ? (
            <button
              onClick={() => setShowConfirmReset(true)}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 transition-colors cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Reset Career Stats</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-rose-600 dark:text-rose-400 font-semibold">Confirm reset all data?</span>
              <button
                onClick={() => {
                  onReset();
                  setShowConfirmReset(false);
                }}
                className="px-2.5 py-1 rounded bg-rose-600 text-white font-semibold hover:bg-rose-700 cursor-pointer"
              >
                Yes, Reset
              </button>
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-2.5 py-1 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}

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
