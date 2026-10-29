import React, { useState } from 'react';
import { Flame, Shield, Trophy, ChevronRight, Award, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const StreakWidget: React.FC = () => {
  const { streakInfo, user } = useAuth();
  const [showDetails, setShowDetails] = useState(false);

  if (!streakInfo) return null;

  const {
    currentStreak,
    longestStreak,
    totalActiveDays,
    todayGoalMet,
    todayTasksCompleted,
    todayTasksTotal,
    characterState,
    characterMessage,
    characterMascotUrl,
    weeklyStrip,
    activeMilestone,
  } = streakInfo;

  return (
    <div className="relative">
      {/* Compact Main Widget Card */}
      <div
        onClick={() => setShowDetails(!showDetails)}
        className="group relative cursor-pointer flex items-center gap-3.5 p-2.5 sm:p-3 bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-2xl shadow-lg transition-all duration-200"
      >
        {/* Mascot Thumbnail with state indicator */}
        <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-700/80 bg-slate-950 shrink-0">
          <img
            src={characterMascotUrl}
            alt={characterState === 'beast' ? 'Beast Mode Mascot' : 'Bounce Back Mascot'}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <span
            className={`absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
              todayGoalMet ? 'bg-emerald-500' : currentStreak > 0 ? 'bg-amber-400' : 'bg-rose-500'
            }`}
            title={todayGoalMet ? 'Today Goal Achieved' : 'In Progress'}
          />
        </div>

        {/* Streak numbers & mini info */}
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <Flame className={`w-4 h-4 ${currentStreak > 0 ? 'text-amber-400 fill-amber-400 animate-pulse' : 'text-slate-500'}`} />
            <span className="text-base font-extrabold font-mono tabular-nums text-white tracking-tight">
              {currentStreak} <span className="text-xs font-semibold text-slate-400 font-sans">day streak</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
            <span>Best: <strong className="font-mono tabular-nums text-slate-300">{longestStreak}d</strong></span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="truncate max-w-[140px] text-purple-300/90 font-medium">
              {todayGoalMet ? '💪 Beast mode' : `${todayTasksCompleted}/${user?.preferences?.dailyGoalCount || 3} today`}
            </span>
          </div>
        </div>

        {/* Weekly Mini Strip Preview */}
        <div className="hidden lg:flex items-center gap-1 pl-2 border-l border-slate-800">
          {weeklyStrip.map((day) => {
            let color = 'bg-slate-800 border-slate-700 text-slate-500';
            if (day.status === 'completed') {
              color = 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400';
            } else if (day.isToday) {
              color = 'bg-amber-500/20 border-amber-500/60 text-amber-300 animate-pulse';
            } else if (day.status === 'missed') {
              color = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
            }

            return (
              <div
                key={day.date}
                className={`flex flex-col items-center justify-center w-6 h-8 rounded border text-[10px] font-mono ${color}`}
                title={`${day.dayName} (${day.date}): ${day.status === 'completed' ? 'Goal met' : day.isToday ? 'Today in progress' : 'Missed'}`}
              >
                <span className="text-[9px] font-sans uppercase opacity-75">{day.dayName.slice(0, 1)}</span>
                <span className="tabular-nums font-bold">{day.dayNumber}</span>
              </div>
            );
          })}
        </div>

        <ChevronRight className={`w-4 h-4 text-slate-500 transition-transform ${showDetails ? 'rotate-90' : ''}`} />
      </div>

      {/* Expandable Details Popover */}
      {showDetails && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 z-40 p-4 bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          {/* Character Message Banner */}
          <div className="flex items-start gap-3 p-3 mb-3 bg-slate-950/70 border border-slate-800 rounded-xl">
            <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-700">
              <img src={characterMascotUrl} alt="Mascot" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
            </div>
            <div>
              <div className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                {characterState === 'beast' ? 'Streak Guardian' : 'Bounce-Back Coach'}
              </div>
              <p className="text-xs text-slate-200 mt-0.5 leading-snug font-medium">
                "{characterMessage}"
              </p>
            </div>
          </div>

          {/* 7-Day Weekly Consistency Strip */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-medium">7-Day Consistency Track</span>
              <span className="font-mono tabular-nums text-slate-300">
                {todayGoalMet ? 'Goal Met Today' : 'Today in progress'}
              </span>
            </div>
            <div className="grid grid-cols-7 gap-1.5">
              {weeklyStrip.map((day) => {
                const isComplete = day.status === 'completed';
                const isMissed = day.status === 'missed';
                return (
                  <div
                    key={day.date}
                    className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all ${
                      isComplete
                        ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300'
                        : isMissed
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                        : 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                    } ${day.isToday ? 'ring-2 ring-purple-500/50' : ''}`}
                  >
                    <span className="text-[10px] uppercase font-sans text-slate-400 font-semibold">{day.dayName}</span>
                    <span className="text-xs font-bold font-mono tabular-nums mt-0.5">{day.dayNumber}</span>
                    <span className="text-[10px] mt-0.5">
                      {isComplete ? '💪' : isMissed ? '😭' : '⏳'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Milestone Status */}
          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 mb-3">
            <div className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5 text-slate-300 font-medium">
                <Trophy className="w-3.5 h-3.5 text-amber-400" />
                <span>Next Milestone: {activeMilestone.title}</span>
              </span>
              <span className="font-mono tabular-nums text-amber-400 font-bold">
                {currentStreak}/{activeMilestone.nextMilestoneDays} days
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-purple-500"
                style={{
                  width: `${Math.min(100, Math.round((currentStreak / activeMilestone.nextMilestoneDays) * 100))}%`,
                }}
              />
            </div>
          </div>

          {/* Summary counters */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800 text-center">
            <div>
              <div className="text-[11px] text-slate-400">Current Streak</div>
              <div className="text-sm font-bold font-mono tabular-nums text-amber-400">{currentStreak}d</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Longest Streak</div>
              <div className="text-sm font-bold font-mono tabular-nums text-purple-300">{longestStreak}d</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-400">Active Days</div>
              <div className="text-sm font-bold font-mono tabular-nums text-emerald-400">{totalActiveDays}d</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
