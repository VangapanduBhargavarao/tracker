import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  Flame,
  ListTodo,
  Plus,
  Search,
  Sparkles,
  Trophy,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { Task } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { soundManager } from '../utils/audio.ts';
import { TaskCard } from '../components/TaskCard.tsx';
import { QuickAddTask } from '../components/QuickAddTask.tsx';
import { TaskModal } from '../components/TaskModal.tsx';

export const DashboardView: React.FC = () => {
  const { user, streakInfo, levelInfo, setStreakInfo, setLevelInfo, triggerLevelUp, triggerAchievement, triggerConfetti } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [dailyBonusClaimed, setDailyBonusClaimed] = useState(false);
  const [isClaimingBonus, setIsClaimingBonus] = useState(false);
  const [xpToast, setXpToast] = useState<{ message: string; amount: number } | null>(null);

  const tz = user?.preferences?.timezone || 'UTC';
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getTasks({ dueDate: todayStr });
      setTasks(res.tasks);

      // Check daily bonus
      const gamRes = await api.getGamification();
      setDailyBonusClaimed(gamRes.dailyBonusClaimed);
    } catch (err) {
      console.error('Failed to load dashboard tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [todayStr]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Handle task status transition
  const handleStatusChange = async (id: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    try {
      const res = await api.updateTaskStatus(id, newStatus);

      // Update local task list
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
      setStreakInfo(res.streakInfo);
      setLevelInfo(res.levelInfo);

      // Audio & Visual celebratory triggers
      if (newStatus === 'completed') {
        soundManager.playComplete();
        triggerConfetti();

        if (res.xpChange > 0) {
          setXpToast({ message: 'Task Objective Mastered!', amount: res.xpChange });
          setTimeout(() => setXpToast(null), 3500);
        }

        if (res.leveledUp) {
          triggerLevelUp(res.newLevel);
        }

        if (res.newlyUnlockedAchievements && res.newlyUnlockedAchievements.length > 0) {
          triggerAchievement(res.newlyUnlockedAchievements[0]);
        }
      } else if (res.xpChange < 0) {
        setXpToast({ message: 'Task reopened (XP adjusted)', amount: res.xpChange });
        setTimeout(() => setXpToast(null), 3000);
      }
    } catch (err) {
      console.error('Error changing task status:', err);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      const res = await api.updateTask(editingTask.id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? res.task : t)));
      setStreakInfo(res.streakInfo);
      setEditingTask(null);
    } else {
      const res = await api.createTask({
        ...taskData,
        dueDate: todayStr,
      });
      setTasks((prev) => [...prev, res.task]);
      setStreakInfo(res.streakInfo);
    }
  };

  const handleDeleteTask = async (id: string) => {
    try {
      const res = await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setStreakInfo(res.streakInfo);
      setLevelInfo(res.levelInfo);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleClaimDailyBonus = async () => {
    try {
      setIsClaimingBonus(true);
      const res = await api.claimDailyBonus();
      setDailyBonusClaimed(true);
      setLevelInfo(res.levelInfo);
      triggerConfetti();
      soundManager.playLevelUp();
      setXpToast({ message: 'Daily Goal Champion Bonus!', amount: res.bonusXp });
      setTimeout(() => setXpToast(null), 4000);

      if (res.leveledUp) {
        triggerLevelUp(res.levelInfo.level);
      }
    } catch (err) {
      console.error('Failed to claim daily bonus:', err);
    } finally {
      setIsClaimingBonus(false);
    }
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCat = selectedCategory === 'All' || t.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [tasks, searchQuery, selectedCategory]);

  const todoTasks = filteredTasks.filter((t) => t.status === 'todo');
  const inProgressTasks = filteredTasks.filter((t) => t.status === 'in_progress');
  const completedTasks = filteredTasks.filter((t) => t.status === 'completed');

  // KPI metrics
  const totalTasks = tasks.length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const inProgressCount = tasks.filter((t) => t.status === 'in_progress').length;
  const pendingCount = tasks.filter((t) => t.status === 'todo').length;
  const completionPercentage = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;

  const categories = ['All', 'Work', 'Learning', 'Fitness', 'Health', 'Personal', 'Finance'];

  return (
    <div className="space-y-6">
      {/* XP Toast Notification */}
      {xpToast && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900 border border-purple-500/50 rounded-xl shadow-2xl animate-in slide-in-from-top-4 duration-200">
          <Zap className="w-4 h-4 fill-amber-400 text-amber-400 animate-pulse" />
          <span className="text-xs font-semibold text-white">{xpToast.message}</span>
          <span className={`text-xs font-mono tabular-nums font-bold ${xpToast.amount >= 0 ? 'text-amber-400' : 'text-slate-400'}`}>
            {xpToast.amount >= 0 ? `+${xpToast.amount}` : xpToast.amount} XP
          </span>
        </div>
      )}

      {/* Daily Overview KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {/* Total Tasks */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Today's Tasks</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {totalTasks}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ListTodo className="w-5 h-5" />
          </div>
        </div>

        {/* Completed */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Completed</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-emerald-400 mt-1">
              {completedCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* In Progress */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">In Progress</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-indigo-400 mt-1">
              {inProgressCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Pending */}
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Pending</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-1">
              {pendingCount}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        {/* Daily Completion Percentage Radial/Circular Dial */}
        <div className="col-span-2 lg:col-span-1 p-4 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-medium">Daily Goal Progress</div>
            <div className="text-2xl font-bold font-mono tabular-nums text-white mt-1">
              {completionPercentage}%
            </div>
          </div>
          {/* Radial SVG Gauge */}
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-purple-500 transition-all duration-700"
                strokeDasharray={`${completionPercentage}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-slate-300">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Daily Goal Bonus Banner (if goal achieved) */}
      {streakInfo?.todayGoalMet && (
        <div className="p-4 bg-gradient-to-r from-purple-950/60 via-slate-900 to-amber-950/40 border border-amber-500/30 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-400">
              <Trophy className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-sm font-bold text-white flex items-center gap-2">
                <span>Daily Quest Conquered!</span>
                <span className="text-[11px] text-amber-300 font-mono">Streak Extended to {streakInfo.currentStreak} Days</span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                You've met your daily target. Claim your +30 bonus XP reward for unwavering discipline!
              </p>
            </div>
          </div>

          <button
            onClick={handleClaimDailyBonus}
            disabled={dailyBonusClaimed || isClaimingBonus}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl shadow transition-transform ${
              dailyBonusClaimed
                ? 'bg-slate-800 text-slate-400 cursor-default'
                : 'bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 active:scale-95 shadow-amber-500/20'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>{dailyBonusClaimed ? 'Bonus Claimed Today' : isClaimingBonus ? 'Claiming...' : 'Claim +30 XP Bonus'}</span>
          </button>
        </div>
      )}

      {/* Quick Add Objective Bar */}
      <QuickAddTask onAdd={handleSaveTask} defaultDueDate={todayStr} />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Category Filter Tabs (Zero-pill discipline: clean segmented buttons) */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                selectedCategory === cat
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter objectives..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <button
            onClick={() => {
              setEditingTask(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-lg shadow transition-colors shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Task</span>
          </button>
        </div>
      </div>

      {/* 3-Column Task Management Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Column 1: To Do */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                To Do
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-slate-900 text-slate-400">
              {todoTasks.length}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {todoTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                No pending tasks for today.
              </div>
            ) : (
              todoTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 2: In Progress */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                In Progress
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-indigo-950/40 text-indigo-300">
              {inProgressTasks.length}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {inProgressTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Nothing currently in progress.
              </div>
            ) : (
              inProgressTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        </div>

        {/* Column 3: Completed */}
        <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl flex flex-col min-h-[400px]">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                Completed
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-emerald-950/40 text-emerald-300">
              {completedTasks.length}
            </span>
          </div>

          <div className="flex-1 space-y-3">
            {completedTasks.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-500">
                Complete a task to earn XP!
              </div>
            ) : (
              completedTasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  onStatusChange={handleStatusChange}
                  onEdit={(task) => {
                    setEditingTask(task);
                    setIsModalOpen(true);
                  }}
                  onDelete={handleDeleteTask}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Task Creation & Edit Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        defaultDueDate={todayStr}
      />
    </div>
  );
};
