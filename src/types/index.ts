export interface User {
  id: string;
  email: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  streak: number;
  longestStreak: number;
  totalActiveDays: number;
  lastActiveDate: string | null;
  preferences: {
    theme: 'dark' | 'light';
    dailyGoalType: 'count' | 'percentage';
    dailyGoalCount: number;
    dailyGoalPercentage: number;
    timezone: string;
    soundEnabled: boolean;
    notifications: boolean;
  };
  createdAt: string;
}

export interface Task {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'todo' | 'in_progress' | 'completed';
  dueDate: string;
  dueTime?: string;
  estimatedMinutes: number;
  xpReward: number;
  xpAwarded: boolean;
  order: number;
  habitId?: string;
  createdAt: string;
  completedAt?: string | null;
}

export interface Habit {
  id: string;
  userId: string;
  title: string;
  description: string;
  category: string;
  priority: 'Low' | 'Medium' | 'High';
  scheduleType: 'daily' | 'weekdays' | 'weekly' | 'custom_days';
  scheduleDays: number[];
  targetCountPerDay: number;
  xpReward: number;
  color: string;
  createdAt: string;
  archived: boolean;
  isCompletedToday?: boolean;
  currentStreak?: number;
  history7Days?: { date: string; completed: boolean }[];
}

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercentage: number;
  totalXp: number;
  title: string;
}

export const LEVEL_TITLES = [
  'Novice Pathfinder',
  'Apprentice Achiever',
  'Discipline Journeyman',
  'Focus Knight',
  'Productivity Champion',
  'Aura Master',
  'Grandmaster Architect',
  'Mythic Sovereign',
  'Apex Transcendence',
  'Legendary Titan',
];

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  todayGoalMet: boolean;
  todayTasksCompleted: number;
  todayTasksTotal: number;
  todayCompletionPercentage: number;
  characterState: 'beast' | 'bounce_back' | 'neutral';
  characterMessage: string;
  characterMascotUrl: string;
  weeklyStrip: {
    date: string;
    dayName: string;
    dayNumber: number;
    status: 'completed' | 'missed' | 'pending' | 'future';
    tasksCompleted: number;
    tasksTotal: number;
    isToday: boolean;
  }[];
  activeMilestone: {
    days: number;
    title: string;
    unlocked: boolean;
    nextMilestoneDays: number;
  };
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpBonus: number;
  category: 'starter' | 'streak' | 'productivity' | 'mastery';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  unlocked?: boolean;
  unlockedAt?: string | null;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  timestamp: string;
}

export interface HeatmapCell {
  date: string;
  count: number;
  intensity: 0 | 1 | 2 | 3 | 4;
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
