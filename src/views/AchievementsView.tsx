import React, { useState, useEffect, useCallback } from 'react';
import {
  Award,
  Trophy,
  Zap,
  Lock,
  CheckCircle2,
  Sparkles,
  Shield,
  Star,
  Repeat,
  Flame,
  ArrowRight,
} from 'lucide-react';
import { Achievement, XpTransaction } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const AchievementsView: React.FC = () => {
  const { user, levelInfo } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [transactions, setTransactions] = useState<XpTransaction[]>([]);
  const [levelTitles, setLevelTitles] = useState<string[]>([]);
  const [filterRarity, setFilterRarity] = useState('All');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getGamification();
      setAchievements(res.achievements);
      setTransactions(res.recentTransactions);
      setLevelTitles(res.levelTitles);
    } catch (err) {
      console.error('Failed to load achievements:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const rarityColor = {
    Common: 'border-slate-700 text-slate-300 bg-slate-800/40',
    Rare: 'border-blue-500/40 text-blue-300 bg-blue-950/40',
    Epic: 'border-purple-500/50 text-purple-300 bg-purple-950/50',
    Legendary: 'border-amber-500/60 text-amber-300 bg-amber-950/50',
  };

  const filteredAchievements = achievements.filter((a) => {
    if (filterRarity === 'All') return true;
    if (filterRarity === 'Unlocked') return a.unlocked;
    if (filterRarity === 'Locked') return !a.unlocked;
    return a.rarity === filterRarity;
  });

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-6">
      {/* Hero Showcase Banner */}
      <div className="p-6 bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950/60 border border-purple-500/30 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex-1 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-semibold">
            <Trophy className="w-3.5 h-3.5" />
            <span>Hall of Achievers</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Level {levelInfo?.level || 1} — {levelInfo?.title}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl leading-relaxed">
            Every task conquered and streak maintained earns XP and permanently etches your name into the Hall of Legends.
          </p>

          <div className="pt-2 flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Total XP: </span>
              <strong className="text-amber-400 font-bold tabular-nums">{levelInfo?.totalXp || 0} XP</strong>
            </div>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <div>
              <span className="text-slate-400">Badges Unlocked: </span>
              <strong className="text-purple-300 font-bold tabular-nums">
                {unlockedCount} / {achievements.length}
              </strong>
            </div>
          </div>
        </div>

        {/* 3D Trophy Emblem Preview */}
        <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-2 border-amber-400/60 shadow-2xl shadow-amber-500/20 shrink-0 bg-slate-950">
          <img
            src="/src/assets/images/badge_consistency_trophy_1793290648238.jpg"
            alt="Trophy Badge"
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 to-transparent" />
          <div className="absolute bottom-1.5 inset-x-0 text-center text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Aura Master
          </div>
        </div>
      </div>

      {/* Level Tier Ranks Ladder */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Ascension Ladder (Ranks &amp; Tiers)</span>
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
          {levelTitles.slice(0, 10).map((title, idx) => {
            const lvl = idx + 1;
            const isReached = (levelInfo?.level || 1) >= lvl;
            const isCurrent = (levelInfo?.level || 1) === lvl;

            return (
              <div
                key={title}
                className={`p-2.5 rounded-xl border transition-all ${
                  isCurrent
                    ? 'bg-purple-600/20 border-purple-400 text-white shadow-md'
                    : isReached
                    ? 'bg-slate-950/80 border-slate-700 text-slate-300'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="font-mono font-bold">Lv. {lvl}</span>
                  {isReached && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                </div>
                <div className="font-semibold truncate">{title}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rarity Filter Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-xl overflow-x-auto">
          {['All', 'Unlocked', 'Locked', 'Common', 'Rare', 'Epic', 'Legendary'].map((r) => (
            <button
              key={r}
              onClick={() => setFilterRarity(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                filterRarity === r
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono">
          Showing {filteredAchievements.length} achievements
        </span>
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((ach) => {
          const isUnlocked = ach.unlocked;

          return (
            <div
              key={ach.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between ${
                isUnlocked
                  ? 'bg-slate-900/90 border-slate-700/80 hover:border-purple-500/50 shadow-md'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-60'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                        isUnlocked
                          ? 'bg-purple-500/20 border-purple-500/40 text-purple-300'
                          : 'bg-slate-900 border-slate-800 text-slate-600'
                      }`}
                    >
                      {isUnlocked ? <Award className="w-5 h-5 text-amber-400" /> : <Lock className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white leading-snug">
                        {ach.name}
                      </h4>
                      <span className={`text-[10px] px-2 py-0.5 rounded border font-medium ${rarityColor[ach.rarity] || 'text-slate-400'}`}>
                        {ach.rarity}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs font-mono tabular-nums text-amber-400 font-bold shrink-0">
                    <Zap className="w-3.5 h-3.5 fill-amber-400" />
                    <span>+{ach.xpBonus} XP</span>
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mt-2">
                  {ach.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono">
                  {isUnlocked && ach.unlockedAt
                    ? `Unlocked ${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(ach.unlockedAt))}`
                    : 'Locked Objective'}
                </span>
                <span className="font-semibold text-slate-400">
                  {isUnlocked ? 'Completed ✓' : 'Incomplete'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* XP Transaction Ledger (Audit log) */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-white mb-1 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>XP Transaction Ledger &amp; Anti-Exploit Audit</span>
        </h3>
        <p className="text-xs text-slate-400 mb-4">
          Real-time record of all awarded and adjusted XP points across tasks, streaks, and habits.
        </p>

        <div className="divide-y divide-slate-800 text-xs">
          {transactions.map((tx) => {
            const isPositive = tx.amount >= 0;
            const timeStr = new Intl.DateTimeFormat('en-US', {
              month: 'short',
              day: 'numeric',
              hour: 'numeric',
              minute: 'numeric',
            }).format(new Date(tx.timestamp));

            return (
              <div key={tx.id} className="py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPositive ? 'bg-emerald-400' : 'bg-rose-400'
                    }`}
                  />
                  <div>
                    <span className="text-slate-200 font-medium capitalize">
                      {tx.reason.replace(/_/g, ' ')}
                    </span>
                    <span className="text-slate-500 text-[11px] ml-2 font-mono">
                      {timeStr}
                    </span>
                  </div>
                </div>

                <span
                  className={`font-mono tabular-nums font-bold ${
                    isPositive ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {isPositive ? `+${tx.amount}` : tx.amount} XP
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
