import React from 'react';
import { Sparkles, Trophy, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { LEVEL_TITLES } from '../types/index.ts';

export const LevelUpModal: React.FC = () => {
  const { activeLevelUp, closeLevelUp, levelInfo } = useAuth();

  if (activeLevelUp === null) return null;

  const titleIndex = Math.min(activeLevelUp - 1, LEVEL_TITLES.length - 1);
  const rankTitle = LEVEL_TITLES[titleIndex] || 'Ascended Champion';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-amber-500/30 rounded-2xl shadow-2xl shadow-amber-500/10 text-center">
        {/* Glowing badge icon */}
        <div className="relative mx-auto mb-6 flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-tr from-amber-500/20 via-purple-500/20 to-amber-500/30 border-2 border-amber-400 shadow-lg shadow-amber-500/20">
          <Trophy className="w-12 h-12 text-amber-400 animate-bounce" />
          <div className="absolute -top-1 -right-1 p-1 bg-amber-400 text-slate-950 rounded-full shadow">
            <Sparkles className="w-4 h-4 fill-slate-950" />
          </div>
        </div>

        <div className="text-xs font-semibold tracking-wider text-amber-400 uppercase mb-1">
          Level Ascended!
        </div>
        <h2 className="text-3xl font-extrabold text-white mb-2">
          Level {activeLevelUp} Reached
        </h2>
        <p className="text-sm font-medium text-purple-300 mb-6">
          Title Unlocked: <span className="text-white font-semibold underline decoration-amber-400/50">{rankTitle}</span>
        </p>

        <div className="p-4 mb-6 bg-slate-950/60 border border-slate-800 rounded-xl text-left space-y-2">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Next Level Goal</span>
            <span className="font-mono tabular-nums text-slate-200">{levelInfo?.xpForNextLevel || 0} XP needed</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-500"
              style={{ width: `${levelInfo?.progressPercentage || 0}%` }}
            />
          </div>
        </div>

        <button
          onClick={closeLevelUp}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 rounded-xl shadow-lg shadow-amber-500/25 transition-transform active:scale-95"
        >
          <span>Claim Glory &amp; Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
