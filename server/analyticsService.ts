import { db, User } from './db.ts';
import { calculateUserStreak, getLocalDateString } from './streakService.ts';

export interface HeatmapCell {
  date: string; // YYYY-MM-DD
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4; // 0=none, 1=low, 2=med, 3=high, 4=max
  goalMet: boolean;
  dayOfWeek: number;
}

export interface AnalyticsData {
  overview: {
    totalTasksCompleted: number;
    totalTasksCreated: number;
    completionRate: number;
    totalXpEarned: number;
    currentStreak: number;
    longestStreak: number;
    totalActiveDays: number;
  };
  insights: {
    mostProductiveDay: string;
    mostConsistentCategory: string;
    averageDailyCompletionRate: number;
    bestStreakAchieved: number;
    totalHabitsLogged: number;
  };
  categoryBreakdown: {
    category: string;
    completed: number;
    total: number;
    percentage: number;
    xpEarned: number;
  }[];
  productivityTrend: {
    date: string;
    dayLabel: string;
    completed: number;
    created: number;
    xp: number;
  }[];
  heatmap: HeatmapCell[];
  weeklyComparison: {
    thisWeekCompleted: number;
    lastWeekCompleted: number;
    deltaPercentage: number;
  };
}

export function getUserAnalytics(user: User, rangeDays: number = 60): AnalyticsData {
  const tz = user.preferences?.timezone || 'UTC';
  const todayStr = getLocalDateString(new Date(), tz);
  const [year, month, day] = todayStr.split('-').map(Number);
  const anchorDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const allUserTasks = db.tasks.filter((t) => t.userId === user.id);
  const completedTasks = allUserTasks.filter((t) => t.status === 'completed');

  // Overview metrics
  const totalTasksCreated = allUserTasks.length;
  const totalTasksCompleted = completedTasks.length;
  const completionRate = totalTasksCreated > 0 ? Math.round((totalTasksCompleted / totalTasksCreated) * 100) : 0;
  const streakInfo = calculateUserStreak(user);

  // Category breakdown
  const categoryMap = new Map<string, { completed: number; total: number; xp: number }>();
  const defaultCategories = ['Work', 'Learning', 'Fitness', 'Health', 'Personal', 'Finance', 'Other'];
  for (const cat of defaultCategories) {
    categoryMap.set(cat, { completed: 0, total: 0, xp: 0 });
  }

  for (const t of allUserTasks) {
    const cat = t.category || 'Other';
    if (!categoryMap.has(cat)) {
      categoryMap.set(cat, { completed: 0, total: 0, xp: 0 });
    }
    const entry = categoryMap.get(cat)!;
    entry.total++;
    if (t.status === 'completed') {
      entry.completed++;
      entry.xp += t.xpReward || 10;
    }
  }

  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, stats]) => ({
      category,
      completed: stats.completed,
      total: stats.total,
      percentage: stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0,
      xpEarned: stats.xp,
    }))
    .filter((c) => c.total > 0 || defaultCategories.includes(c.category))
    .sort((a, b) => b.completed - a.completed);

  // Most consistent category
  let mostConsistentCategory = 'Work';
  let highestCompletedCat = 0;
  for (const c of categoryBreakdown) {
    if (c.completed > highestCompletedCat) {
      highestCompletedCat = c.completed;
      mostConsistentCategory = c.category;
    }
  }

  // Day of week analysis
  const dayOfWeekCounts = [0, 0, 0, 0, 0, 0, 0]; // Sun-Sat
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  for (const t of completedTasks) {
    const dateStr = t.completedAt ? t.completedAt.split('T')[0] : t.dueDate;
    if (dateStr) {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        dayOfWeekCounts[d.getUTCDay()]++;
      }
    }
  }

  let mostProductiveDayIndex = 1; // default Monday
  let maxDayCount = -1;
  for (let i = 0; i < 7; i++) {
    if (dayOfWeekCounts[i] > maxDayCount) {
      maxDayCount = dayOfWeekCounts[i];
      mostProductiveDayIndex = i;
    }
  }
  const mostProductiveDay = dayNames[mostProductiveDayIndex];

  // Productivity Trend (last 14 days)
  const productivityTrend: AnalyticsData['productivityTrend'] = [];
  for (let i = 13; i >= 0; i--) {
    const curDate = new Date(anchorDate.getTime() - i * 86400000);
    const curDateStr = curDate.toISOString().split('T')[0];
    const createdForDay = allUserTasks.filter((t) => t.createdAt?.startsWith(curDateStr) || t.dueDate === curDateStr).length;
    const completedForDay = completedTasks.filter((t) => t.completedAt?.startsWith(curDateStr) || (t.dueDate === curDateStr && t.status === 'completed')).length;

    const dayXp = completedTasks
      .filter((t) => t.completedAt?.startsWith(curDateStr))
      .reduce((acc, curr) => acc + (curr.xpReward || 10), 0);

    const dayAbbr = dayNames[curDate.getUTCDay()].slice(0, 3);
    productivityTrend.push({
      date: curDateStr,
      dayLabel: `${dayAbbr} ${curDate.getUTCDate()}`,
      completed: completedForDay,
      created: createdForDay,
      xp: dayXp,
    });
  }

  // Heatmap generation (past rangeDays, e.g. 60 or 90 days)
  const heatmap: HeatmapCell[] = [];
  for (let i = rangeDays - 1; i >= 0; i--) {
    const d = new Date(anchorDate.getTime() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const dayTasks = completedTasks.filter((t) => t.completedAt?.startsWith(dStr) || (t.dueDate === dStr && t.status === 'completed'));
    const dayHabits = db.habitLogs.filter((l) => l.userId === user.id && l.date === dStr && l.completed);
    const count = dayTasks.length + dayHabits.length;

    let intensity: 0 | 1 | 2 | 3 | 4 = 0;
    if (count >= 5) intensity = 4;
    else if (count >= 3) intensity = 3;
    else if (count >= 2) intensity = 2;
    else if (count >= 1) intensity = 1;

    const goalMet = user.preferences.dailyGoalType === 'percentage'
      ? dayTasks.length >= 1
      : dayTasks.length >= (user.preferences.dailyGoalCount || 3);

    heatmap.push({
      date: dStr,
      count,
      intensity,
      goalMet,
      dayOfWeek: d.getUTCDay(),
    });
  }

  // Weekly Comparison
  let thisWeekCompleted = 0;
  let lastWeekCompleted = 0;
  for (let i = 0; i < 7; i++) {
    const curDateStr = new Date(anchorDate.getTime() - i * 86400000).toISOString().split('T')[0];
    thisWeekCompleted += completedTasks.filter((t) => t.completedAt?.startsWith(curDateStr) || (t.dueDate === curDateStr && t.status === 'completed')).length;
  }
  for (let i = 7; i < 14; i++) {
    const curDateStr = new Date(anchorDate.getTime() - i * 86400000).toISOString().split('T')[0];
    lastWeekCompleted += completedTasks.filter((t) => t.completedAt?.startsWith(curDateStr) || (t.dueDate === curDateStr && t.status === 'completed')).length;
  }

  const deltaPercentage = lastWeekCompleted > 0
    ? Math.round(((thisWeekCompleted - lastWeekCompleted) / lastWeekCompleted) * 100)
    : thisWeekCompleted > 0 ? 100 : 0;

  const totalHabitsLogged = db.habitLogs.filter((l) => l.userId === user.id && l.completed).length;

  return {
    overview: {
      totalTasksCompleted,
      totalTasksCreated,
      completionRate,
      totalXpEarned: user.xp,
      currentStreak: streakInfo.currentStreak,
      longestStreak: streakInfo.longestStreak,
      totalActiveDays: streakInfo.totalActiveDays,
    },
    insights: {
      mostProductiveDay,
      mostConsistentCategory,
      averageDailyCompletionRate: completionRate,
      bestStreakAchieved: streakInfo.longestStreak,
      totalHabitsLogged,
    },
    categoryBreakdown,
    productivityTrend,
    heatmap,
    weeklyComparison: {
      thisWeekCompleted,
      lastWeekCompleted,
      deltaPercentage,
    },
  };
}
