import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BarChart3,
  Flame,
  Trophy,
  CheckCircle2,
  Calendar,
  TrendingUp,
  Zap,
  Target,
  Sparkles,
} from 'lucide-react';
import { AnalyticsData, HeatmapCell } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';

export const ProgressView: React.FC = () => {
  const { streakInfo } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [hoveredCell, setHoveredCell] = useState<HeatmapCell | null>(null);

  const loadAnalytics = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getAnalytics(60);
      setAnalytics(res.analytics);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  const heatmapIntensityClass = {
    0: 'bg-slate-900 border-slate-800 text-slate-600',
    1: 'bg-purple-950/60 border-purple-800/40 text-purple-300',
    2: 'bg-purple-800/50 border-purple-600/50 text-purple-200',
    3: 'bg-purple-600/70 border-purple-400/60 text-white',
    4: 'bg-purple-500 border-purple-300 text-white shadow-sm shadow-purple-500/30',
  };

  const dayOfWeekLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Compute maximum completed for scaling chart
  const maxTrendCompleted = useMemo(() => {
    if (!analytics) return 5;
    return Math.max(5, ...analytics.productivityTrend.map((d) => Math.max(d.completed, d.created)));
  }, [analytics]);

  if (isLoading || !analytics) {
    return (
      <div className="py-24 text-center">
        <div className="inline-block w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs text-slate-400">Synthesizing analytics and consistency heatmap...</p>
      </div>
    );
  }

  const { overview, insights, categoryBreakdown, productivityTrend, heatmap, weeklyComparison } = analytics;

  return (
    <div className="space-y-6">
      {/* Title & View Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Progress &amp; Consistency Heatmap</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              Live Data
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deep dive into your habits, velocity patterns, and milestone history.
          </p>
        </div>

        {/* View Switcher: Daily, Weekly, Monthly */}
        <div className="flex items-center gap-1 p-1 bg-slate-900 border border-slate-800 rounded-xl">
          {(['daily', 'weekly', 'monthly'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-colors ${
                timeframe === t
                  ? 'bg-purple-600/20 text-purple-200 border border-purple-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t} View
            </button>
          ))}
        </div>
      </div>

      {/* KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Completed Objectives</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {overview.totalTasksCompleted}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">
            Across {overview.totalActiveDays} recorded active days
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total XP Mastered</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-400 mt-2">
            {overview.totalXpEarned} XP
          </div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">
            {overview.completionRate}% completion rate
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current / Longest Streak</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-white mt-2">
            {overview.currentStreak}d <span className="text-sm font-normal text-slate-500">/ {overview.longestStreak}d best</span>
          </div>
          <div className="text-[11px] text-purple-300 mt-1">
            {overview.currentStreak >= 7 ? 'Legendary consistency!' : 'Keep momentum alive'}
          </div>
        </div>

        <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Weekly Momentum</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold font-mono tabular-nums text-purple-300 mt-2">
            {weeklyComparison.thisWeekCompleted} <span className="text-xs text-slate-400">tasks</span>
          </div>
          <div className="text-[11px] font-mono tabular-nums text-emerald-400 mt-1">
            {weeklyComparison.deltaPercentage >= 0 ? `+${weeklyComparison.deltaPercentage}%` : `${weeklyComparison.deltaPercentage}%`} vs previous week
          </div>
        </div>
      </div>

      {/* Calendar Heatmap Matrix */}
      <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>Activity Intensity Heatmap (Last 60 Days)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Each square represents daily task and habit completion density.
            </p>
          </div>

          {/* Intensity Legend */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>Less</span>
            <div className="flex items-center gap-1">
              <div className="w-3.5 h-3.5 rounded bg-slate-900 border border-slate-800" title="0 items" />
              <div className="w-3.5 h-3.5 rounded bg-purple-950/60 border border-purple-800/40" title="1 item" />
              <div className="w-3.5 h-3.5 rounded bg-purple-800/50 border border-purple-600/50" title="2 items" />
              <div className="w-3.5 h-3.5 rounded bg-purple-600/70 border border-purple-400/60" title="3-4 items" />
              <div className="w-3.5 h-3.5 rounded bg-purple-500 border border-purple-300" title="5+ items" />
            </div>
            <span>More</span>
          </div>
        </div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto pb-2">
          <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[500px]">
            {heatmap.map((cell) => {
              const dateObj = new Date(cell.date);
              const formattedDate = new Intl.DateTimeFormat('en-US', {
                month: 'short',
                day: 'numeric',
              }).format(dateObj);

              return (
                <div
                  key={cell.date}
                  onMouseEnter={() => setHoveredCell(cell)}
                  onMouseLeave={() => setHoveredCell(null)}
                  className={`w-4 h-4 sm:w-5 sm:h-5 rounded border transition-transform hover:scale-125 cursor-pointer ${
                    heatmapIntensityClass[cell.intensity]
                  } ${cell.goalMet ? 'ring-1 ring-amber-400/50' : ''}`}
                  title={`${formattedDate}: ${cell.count} completions (${cell.goalMet ? 'Goal Achieved' : 'Pending'})`}
                />
              );
            })}
          </div>
        </div>

        {/* Hovered Cell Info */}
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <div>
            {hoveredCell ? (
              <span className="text-white font-medium">
                {hoveredCell.date}: <strong className="text-purple-300">{hoveredCell.count} completions</strong> {hoveredCell.goalMet ? '🏆 (Goal Met)' : ''}
              </span>
            ) : (
              <span>Hover over any calendar cell to view historical day details.</span>
            )}
          </div>
          <span className="font-mono tabular-nums text-slate-500">
            60-Day Consistency Window
          </span>
        </div>
      </div>

      {/* 2-Column Section: Productivity Trend & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Productivity Over Time Chart (SVG) */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-purple-400" />
                  <span>Productivity Trend (Last 14 Days)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Daily completed vs created objectives.
                </p>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5 text-purple-300">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Completed
                </span>
                <span className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-700" /> Created
                </span>
              </div>
            </div>

            {/* Custom SVG Bar Chart */}
            <div className="h-48 flex items-end gap-2 pt-6 pb-2 border-b border-slate-800">
              {productivityTrend.map((pt) => {
                const completedHeight = Math.round((pt.completed / maxTrendCompleted) * 100);
                const createdHeight = Math.round((pt.created / maxTrendCompleted) * 100);

                return (
                  <div key={pt.date} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Created bar */}
                      <div
                        className="w-1.5 sm:w-2 bg-slate-800 rounded-t transition-all group-hover:bg-slate-700"
                        style={{ height: `${createdHeight}%` }}
                        title={`Created: ${pt.created}`}
                      />
                      {/* Completed bar */}
                      <div
                        className="w-2 sm:w-3 bg-gradient-to-t from-purple-600 to-indigo-500 rounded-t transition-all group-hover:from-purple-500 group-hover:to-indigo-400"
                        style={{ height: `${completedHeight}%` }}
                        title={`Completed: ${pt.completed} (${pt.xp} XP)`}
                      />
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono truncate w-full text-center">
                      {pt.dayLabel.split(' ')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
            <span>Average: {Math.round(overview.totalTasksCompleted / 14)} tasks / day</span>
            <span className="font-mono tabular-nums text-purple-300 font-semibold">
              Peak: {maxTrendCompleted} tasks
            </span>
          </div>
        </div>

        {/* Category-Wise Breakdown */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span>Category-Wise Productivity</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Distribution of conquered tasks and XP across domains.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              {categoryBreakdown.map((cat) => (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-200">{cat.category}</span>
                    <span className="font-mono tabular-nums text-slate-400">
                      <strong className="text-purple-300">{cat.completed}</strong> / {cat.total} completed ({cat.percentage}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-purple-600 to-indigo-500 rounded-full transition-all duration-500"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Total Categories: {categoryBreakdown.length}</span>
            <span className="text-amber-400 font-mono font-medium">
              +{categoryBreakdown.reduce((sum, c) => sum + c.xpEarned, 0)} XP Earned
            </span>
          </div>
        </div>
      </div>

      {/* Actionable Insights Panel */}
      <div className="p-5 bg-gradient-to-tr from-slate-950 via-slate-900 to-purple-950/30 border border-slate-800 rounded-2xl">
        <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Consistency &amp; Productivity Insights</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Most Productive Day</div>
            <div className="text-base font-bold text-white mt-1">{insights.mostProductiveDay}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Highest task completion velocity</p>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Consistent Domain</div>
            <div className="text-base font-bold text-purple-300 mt-1">{insights.mostConsistentCategory}</div>
            <p className="text-[11px] text-slate-500 mt-0.5">Most habitual focus area</p>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Average Completion</div>
            <div className="text-base font-bold font-mono tabular-nums text-emerald-400 mt-1">
              {insights.averageDailyCompletionRate}%
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Target closure efficiency</p>
          </div>

          <div className="p-3.5 bg-slate-950/70 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase font-semibold">Best Streak Achieved</div>
            <div className="text-base font-bold font-mono tabular-nums text-amber-400 mt-1">
              {insights.bestStreakAchieved} Days
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Personal all-time record</p>
          </div>
        </div>
      </div>
    </div>
  );
};
