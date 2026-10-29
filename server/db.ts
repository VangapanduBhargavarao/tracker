import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
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
  dueDate: string; // YYYY-MM-DD
  dueTime?: string; // HH:MM
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
  scheduleDays: number[]; // 0: Sun, 1: Mon, ... 6: Sat
  targetCountPerDay: number;
  xpReward: number;
  color: string;
  createdAt: string;
  archived: boolean;
}

export interface HabitLog {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  completed: boolean;
  completedAt: string;
}

export interface XpTransaction {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  referenceId?: string;
  timestamp: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  xpBonus: number;
  category: 'starter' | 'streak' | 'productivity' | 'mastery';
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
}

export interface UserAchievement {
  id: string;
  userId: string;
  achievementId: string;
  unlockedAt: string;
}

export interface DailySummary {
  id: string;
  userId: string;
  date: string; // YYYY-MM-DD
  tasksTotal: number;
  tasksCompleted: number;
  habitsTotal: number;
  habitsCompleted: number;
  xpEarned: number;
  goalMet: boolean;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  tasks: Task[];
  habits: Habit[];
  habitLogs: HabitLog[];
  xpTransactions: XpTransaction[];
  achievements: Achievement[];
  userAchievements: UserAchievement[];
  dailySummaries: DailySummary[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Standard achievement definitions
export const STANDARD_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_task',
    name: 'First Victory',
    description: 'Complete your first task and take the first step.',
    icon: 'Sword',
    xpBonus: 50,
    category: 'starter',
    rarity: 'Common',
  },
  {
    id: 'early_bird',
    name: 'Dawn Raider',
    description: 'Complete a task before 9:00 AM.',
    icon: 'Sunrise',
    xpBonus: 40,
    category: 'productivity',
    rarity: 'Common',
  },
  {
    id: 'high_roller',
    name: 'Heavy Hitter',
    description: 'Complete 3 High-Priority tasks in a single day.',
    icon: 'Flame',
    xpBonus: 80,
    category: 'productivity',
    rarity: 'Rare',
  },
  {
    id: 'pentakill',
    name: 'Pentakill',
    description: 'Complete 5 tasks in one single day.',
    icon: 'Zap',
    xpBonus: 100,
    category: 'productivity',
    rarity: 'Rare',
  },
  {
    id: 'streak_3',
    name: 'Consistency Starter',
    description: 'Maintain an unbroken 3-day active streak.',
    icon: 'Shield',
    xpBonus: 80,
    category: 'streak',
    rarity: 'Common',
  },
  {
    id: 'streak_7',
    name: 'Weekly Warrior',
    description: 'Maintain an unbroken 7-day active streak.',
    icon: 'Trophy',
    xpBonus: 160,
    category: 'streak',
    rarity: 'Rare',
  },
  {
    id: 'streak_14',
    name: 'Discipline Builder',
    description: 'Hold a 14-day streak of unrelenting focus.',
    icon: 'Award',
    xpBonus: 350,
    category: 'streak',
    rarity: 'Epic',
  },
  {
    id: 'streak_30',
    name: 'Consistency Master',
    description: 'Achieve a 30-day streak of excellence.',
    icon: 'Crown',
    xpBonus: 800,
    category: 'streak',
    rarity: 'Epic',
  },
  {
    id: 'streak_100',
    name: 'Legendary Achiever',
    description: 'Reach a legendary 100-day streak!',
    icon: 'Sparkles',
    xpBonus: 2500,
    category: 'streak',
    rarity: 'Legendary',
  },
  {
    id: 'habit_hero',
    name: 'Routine Architect',
    description: 'Log 15 recurring habit check-ins.',
    icon: 'Repeat',
    xpBonus: 150,
    category: 'productivity',
    rarity: 'Rare',
  },
  {
    id: 'century_club',
    name: 'Centurion',
    description: 'Complete 100 total tasks.',
    icon: 'Medal',
    xpBonus: 600,
    category: 'mastery',
    rarity: 'Epic',
  },
  {
    id: 'perfect_week',
    name: 'Flawless Orbit',
    description: 'Reach 100% of your daily goals for 7 consecutive days.',
    icon: 'CheckCircle2',
    xpBonus: 300,
    category: 'mastery',
    rarity: 'Epic',
  },
];

class Database {
  private data: DatabaseSchema;

  constructor() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        // Ensure standard achievements are synced
        this.syncAchievements();
      } catch (err) {
        console.error('Error reading database file, initializing clean DB:', err);
        this.data = this.getDefaultData();
        this.save();
      }
    } else {
      this.data = this.getDefaultData();
      this.save();
    }
  }

  private getDefaultData(): DatabaseSchema {
    return {
      users: [],
      tasks: [],
      habits: [],
      habitLogs: [],
      xpTransactions: [],
      achievements: STANDARD_ACHIEVEMENTS,
      userAchievements: [],
      dailySummaries: [],
    };
  }

  private syncAchievements() {
    const existingIds = new Set(this.data.achievements.map((a) => a.id));
    for (const ach of STANDARD_ACHIEVEMENTS) {
      if (!existingIds.has(ach.id)) {
        this.data.achievements.push(ach);
      }
    }
  }

  public save() {
    try {
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error saving database:', err);
    }
  }

  public get users() {
    return this.data.users;
  }
  public get tasks() {
    return this.data.tasks;
  }
  public get habits() {
    return this.data.habits;
  }
  public get habitLogs() {
    return this.data.habitLogs;
  }
  public get xpTransactions() {
    return this.data.xpTransactions;
  }
  public get achievements() {
    return this.data.achievements;
  }
  public get userAchievements() {
    return this.data.userAchievements;
  }
  public get dailySummaries() {
    return this.data.dailySummaries;
  }
}

export const db = new Database();
