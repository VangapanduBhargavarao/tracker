import React from 'react';
import { Award, Zap, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const AchievementModal: React.FC = () => {
  const { activeAchievement, closeAchievement } = useAuth();

  if (!activeAchievement) return null;

  const rarityColor = {
    Common: 'border-slate-500/40 text-slate-300 bg-slate-800/40',
    Rare: 'border-blue-500/40 text-blue-300 bg-blue-900/30',
    Epic: 'border-purple-500/50 text-purple-300 bg-purple-950/40',
    Legendary: 'border-amber-500/60 text-amber-300 bg-amber-950/40',
  }[activeAchievement.rarity] || 'border-purple-500/40 text-purple-300';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900 border border-purple-500/40 rounded-2xl shadow-2xl shadow-purple-500/15 text-center">
        {/* Trophy visual */}
        <div className="relative mx-auto mb-5 w-24 h-24 rounded-2xl overflow-hidden border-2 border-purple-400 shadow-xl shadow-purple-500/25 flex items-center justify-center bg-slate-950">
          <img
            src="/src/assets/images/badge_consistency_trophy_1793290648238.jpg"
            alt="Achievement Trophy"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 to-transparent" />
          <Award className="absolute bottom-2 text-amber-400 w-6 h-6 drop-shadow" />
        </div>

        <div className="inline-block px-3 py-1 mb-2 text-xs font-semibold uppercase tracking-wider rounded-md border text-purple-300 border-purple-500/30 bg-purple-500/10">
          Achievement Unlocked
        </div>

        <h2 className="text-2xl font-bold text-white mb-2">
          {activeAchievement.name}
        </h2>

        <p className="text-sm text-slate-300 mb-5 leading-relaxed">
          {activeAchievement.description}
        </p>

        {/* Bonus and rarity box */}
        <div className="flex items-center justify-between p-3.5 mb-6 bg-slate-950/70 border border-slate-800 rounded-xl">
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded border ${rarityColor} font-medium`}>
              {activeAchievement.rarity}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-sm">
            <Zap className="w-4 h-4 fill-amber-400" />
            <span className="font-mono tabular-nums">+{activeAchievement.xpBonus} XP Bonus</span>
          </div>
        </div>

        <button
          onClick={closeAchievement}
          className="w-full flex items-center justify-center gap-2 py-3 px-6 text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-xl shadow-lg shadow-purple-600/30 transition-transform active:scale-95"
        >
          <Check className="w-4 h-4" />
          <span>Collect XP &amp; Equip Badge</span>
        </button>
      </div>
    </div>
  );
};
