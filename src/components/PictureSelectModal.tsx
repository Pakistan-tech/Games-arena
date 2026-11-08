import React from 'react';
import { X, Image as ImageIcon } from 'lucide-react';
import { PICTURE_SHAPES } from '../services/puzzleEngine';

interface PictureSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPicture: (index: number) => void;
  currentPicIndex: number;
}

export const PictureSelectModal: React.FC<PictureSelectModalProps> = ({
  isOpen,
  onClose,
  onSelectPicture,
  currentPicIndex
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl max-h-[85vh] flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <ImageIcon size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Picture Silhouette Puzzles
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Interlocking arrows configured within artistic rasterized silhouettes
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

        {/* Grid of 12 pictures */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {PICTURE_SHAPES.map((pic, idx) => {
              const isSelected = idx === currentPicIndex;

              return (
                <button
                  key={pic.n}
                  onClick={() => {
                    onSelectPicture(idx);
                    onClose();
                  }}
                  className={`p-4 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50/40 dark:bg-blue-900/20 ring-2 ring-blue-500'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                  }`}
                >
                  <span className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {pic.n}
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">
                    {pic.w}×{pic.h} grid
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
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
