import React from 'react';
import { X, Brain, Compass, Maximize2, Shuffle, Clock, Flame, Lightbulb, ShieldCheck } from 'lucide-react';
import { BRAIN_SKILLS } from '../services/motivationalMessages';

interface BrainTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BrainTrainingModal: React.FC<BrainTrainingModalProps> = ({
  isOpen,
  onClose
}) => {
  if (!isOpen) return null;

  const iconMap: Record<string, React.ReactNode> = {
    Maximize2: <Maximize2 size={18} className="text-blue-500" />,
    Compass: <Compass size={18} className="text-emerald-500" />,
    Shuffle: <Shuffle size={18} className="text-purple-500" />,
    Clock: <Clock size={18} className="text-amber-500" />,
    Flame: <Flame size={18} className="text-orange-500" />,
    Lightbulb: <Lightbulb size={18} className="text-rose-500" />,
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Brain size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Mental Skills & Brain Training
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                How intentional puzzle play encourages mindful, flexible problem-solving
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

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          
          {/* Main Core Philosophy Banner */}
          <div className="p-4 rounded-xl border border-blue-200 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20 text-center">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 block mb-1">
              Core Philosophy
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              "Train your brain to keep looking for possibilities, even when the obvious path is blocked."
            </h3>
          </div>

          {/* 6 Mental Skills Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            {BRAIN_SKILLS.map((skill) => (
              <div
                key={skill.id}
                className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {iconMap[skill.iconName] || <Brain size={18} />}
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-slate-100">
                    {skill.title}
                  </h4>
                </div>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {skill.shortDesc}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                  {skill.detail}
                </p>
              </div>
            ))}
          </div>

          {/* Responsible Educational Note (Required: no scientific medical claim) */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-850 text-xs text-slate-500 dark:text-slate-400">
            <ShieldCheck size={16} className="text-slate-400 shrink-0 mt-0.5" />
            <p className="text-[11px] leading-relaxed">
              <strong>Healthy Practice Note:</strong> These puzzle mechanics offer enjoyable opportunities to practice patience, perspective, and flexible thinking. They are designed for recreational mental engagement and personal encouragement, rather than guaranteed medical or cognitive enhancements.
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>

      </div>
    </div>
  );
};
