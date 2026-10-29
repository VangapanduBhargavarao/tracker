import React, { useState, useEffect, useCallback } from 'react';
import {
  Repeat,
  Plus,
  Flame,
  Check,
  Calendar,
  Sparkles,
  Edit2,
  Trash2,
  Trophy,
} from 'lucide-react';
import { Habit } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { soundManager } from '../utils/audio.ts';
import { HabitModal } from '../components/HabitModal.tsx';

export const HabitsView: React.FC = () => {
  const { setStreakInfo, setLevelInfo, triggerLevelUp, triggerAchievement, triggerConfetti } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);

  const loadHabits = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getHabits();
      setHabits(res.habits);
    } catch (err) {
      console.error('Failed to load habits:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHabits();
  }, [loadHabits]);

  const handleToggleHabit = async (habitId: string) => {
    try {
      const res = await api.toggleHabit(habitId);

      // Update local habit status
      setHabits((prev) =>
        prev.map((h) => {
          if (h.id === habitId) {
            const isCompleted = res.completed;
            const updatedHistory = (h.history7Days || []).map((d) =>
              d.date === res.date ? { ...d, completed: isCompleted } : d
            );
            return {
              ...h,
              isCompletedToday: isCompleted,
              currentStreak: isCompleted ? (h.currentStreak || 0) + 1 : Math.max(0, (h.currentStreak || 1) - 1),
              history7Days: updatedHistory,
            };
          }
          return h;
        })
      );

      setStreakInfo(res.streakInfo);
      setLevelInfo(res.levelInfo);

      if (res.completed) {
        soundManager.playComplete();
        triggerConfetti();
        if (res.leveledUp) {
          triggerLevelUp(res.levelInfo.level);
        }
        if (res.newlyUnlockedAchievements && res.newlyUnlockedAchievements.length > 0) {
          triggerAchievement(res.newlyUnlockedAchievements[0]);
        }
      }
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  const handleSaveHabit = async (habitData: Partial<Habit>) => {
    if (editingHabit) {
      await api.updateHabit(editingHabit.id, habitData);
      setEditingHabit(null);
    } else {
      await api.createHabit(habitData);
    }
    await loadHabits();
  };

  const handleDeleteHabit = async (id: string) => {
    if (!window.confirm('Archive this recurring habit?')) return;
    try {
      await api.deleteHabit(id);
      setHabits((prev) => prev.filter((h) => h.id !== id));
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  };

  const scheduleLabels = {
    daily: 'Daily Routine',
    weekdays: 'Weekdays (Mon-Fri)',
    weekly: 'Weekly Cadence',
    custom_days: 'Custom Days',
  };

  const dayAbbrs = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Recurring Habit Forge</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
              {habits.length} Active
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Automatic recurrence routines that compound into life-changing mastery.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingHabit(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Recurring Habit</span>
        </button>
      </div>

      {/* Habit Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {habits.map((habit) => {
          const isDoneToday = Boolean(habit.isCompletedToday);

          return (
            <div
              key={habit.id}
              className="p-5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row with color accent bar */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 shadow"
                      style={{ backgroundColor: habit.color || '#8B5CF6' }}
                    />
                    <div>
                      <h3 className="text-base font-bold text-white leading-snug">
                        {habit.title}
                      </h3>
                      {/* Unboxed Metadata Discipline */}
                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <span className="font-medium text-slate-300">{habit.category}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span>{scheduleLabels[habit.scheduleType] || habit.scheduleType}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="flex items-center gap-1 text-amber-400 font-mono tabular-nums font-semibold">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          +{habit.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingHabit(habit);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-500 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Habit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteHabit(habit.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Archive Habit"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {habit.description && (
                  <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                    {habit.description}
                  </p>
                )}

                {/* 7-Day Consistency Bubbles */}
                <div className="mt-4 pt-3 border-t border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
                    <span className="font-medium">Past 7 Days Consistency</span>
                    <span className="flex items-center gap-1 font-mono tabular-nums text-amber-400 font-semibold">
                      <Flame className="w-3 h-3 fill-amber-400" />
                      {habit.currentStreak || 0}d streak
                    </span>
                  </div>

                  <div className="grid grid-cols-7 gap-2">
                    {(habit.history7Days || []).map((hist, idx) => {
                      const isComplete = hist.completed;
                      const dateObj = new Date(hist.date);
                      const dayName = isNaN(dateObj.getTime()) ? '' : dayAbbrs[dateObj.getUTCDay()];

                      return (
                        <div
                          key={hist.date}
                          className={`flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all ${
                            isComplete
                              ? 'bg-purple-600/20 border-purple-500/50 text-purple-300'
                              : 'bg-slate-950 border-slate-800 text-slate-500'
                          }`}
                          title={`${hist.date}: ${isComplete ? 'Completed' : 'Missed'}`}
                        >
                          <span className="text-[10px] uppercase font-semibold">{dayName}</span>
                          <span className="text-[10px] mt-0.5">
                            {isComplete ? '✓' : '·'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Today Action Button */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Today's Occurrence:
                </span>

                <button
                  onClick={() => handleToggleHabit(habit.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl border transition-all active:scale-95 ${
                    isDoneToday
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 shadow-md shadow-emerald-950/20'
                      : 'bg-purple-600 hover:bg-purple-500 text-white border-transparent shadow-lg shadow-purple-600/20'
                  }`}
                >
                  <Check className={`w-4 h-4 ${isDoneToday ? 'text-emerald-400' : 'text-white'}`} />
                  <span>{isDoneToday ? 'Checked in Today (+XP)' : 'Check in (+15 XP)'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {habits.length === 0 && !isLoading && (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Repeat className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No habits forged yet</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Establish recurring practices like reading, exercising, or deep work to level up automatically.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-purple-600 text-white rounded-xl shadow hover:bg-purple-500"
          >
            Create Your First Habit
          </button>
        </div>
      )}

      {/* Habit Modal */}
      <HabitModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingHabit(null);
        }}
        onSave={handleSaveHabit}
        initialHabit={editingHabit}
      />
    </div>
  );
};
