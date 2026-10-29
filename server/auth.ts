import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { db, User } from './db.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'aurahabit_jwt_super_secret_key_2026';

export interface AuthenticatedRequest extends Request {
  user?: User;
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}

export function comparePassword(password: string, hash: string): boolean {
  return bcrypt.compareSync(password, hash);
}

export function generateToken(user: User): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

export function verifyToken(token: string): { id: string; email: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { id: string; email: string };
  } catch {
    return null;
  }
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }

  const user = db.users.find((u) => u.id === decoded.id);
  if (!user) {
    return res.status(401).json({ error: 'User associated with token no longer exists.' });
  }

  req.user = user;
  next();
}

// Ensure demo user and initial state is seeded if empty
export function seedDemoDataIfEmpty() {
  if (db.users.length === 0) {
    const demoUser: User = {
      id: 'demo-user-1',
      email: 'warrior@aurahabit.io',
      passwordHash: hashPassword('aurahabit123'),
      name: 'Alex Vance',
      avatar: '/src/assets/images/avatar_default_warrior_1793290647823.jpg',
      level: 4,
      xp: 1420,
      streak: 5,
      longestStreak: 12,
      totalActiveDays: 24,
      lastActiveDate: new Date().toISOString().split('T')[0],
      preferences: {
        theme: 'dark',
        dailyGoalType: 'count',
        dailyGoalCount: 3,
        dailyGoalPercentage: 80,
        timezone: 'UTC',
        soundEnabled: true,
        notifications: true,
      },
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    };

    db.users.push(demoUser);

    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    const twoDaysAgoStr = new Date(Date.now() - 2 * 86400000).toISOString().split('T')[0];

    // Seed tasks
    db.tasks.push(
      {
        id: 'task-1',
        userId: demoUser.id,
        title: 'Review System Architecture & Microservices',
        description: 'Audit high-throughput message brokers and finalize resilience specs.',
        category: 'Work',
        priority: 'High',
        status: 'completed',
        dueDate: todayStr,
        dueTime: '10:00',
        estimatedMinutes: 45,
        xpReward: 20,
        xpAwarded: true,
        order: 1,
        createdAt: new Date().toISOString(),
        completedAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        id: 'task-2',
        userId: demoUser.id,
        title: 'Complete 45 min HIIT & Strength Workout',
        description: 'Focus on compound lifts: squats, bench press, core circuit.',
        category: 'Fitness',
        priority: 'Medium',
        status: 'completed',
        dueDate: todayStr,
        dueTime: '12:30',
        estimatedMinutes: 45,
        xpReward: 15,
        xpAwarded: true,
        order: 2,
        createdAt: new Date().toISOString(),
        completedAt: new Date(Date.now() - 1800000).toISOString(),
      },
      {
        id: 'task-3',
        userId: demoUser.id,
        title: 'Solve 2 LeetCode Graph Theory Problems',
        description: 'Practice Dijkstra and Bellman-Ford shortest path implementations.',
        category: 'Learning',
        priority: 'High',
        status: 'in_progress',
        dueDate: todayStr,
        dueTime: '16:00',
        estimatedMinutes: 60,
        xpReward: 25,
        xpAwarded: false,
        order: 3,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-4',
        userId: demoUser.id,
        title: 'Hydrate 3 Liters of Water',
        description: 'Track daily electrolyte and hydration intake throughout the day.',
        category: 'Health',
        priority: 'Low',
        status: 'in_progress',
        dueDate: todayStr,
        dueTime: '18:00',
        estimatedMinutes: 5,
        xpReward: 10,
        xpAwarded: false,
        order: 4,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-5',
        userId: demoUser.id,
        title: 'Read 20 pages of "Atomic Habits"',
        description: 'Deep dive into chapter 4 on habit stacking and environmental cues.',
        category: 'Personal',
        priority: 'Medium',
        status: 'todo',
        dueDate: todayStr,
        dueTime: '20:30',
        estimatedMinutes: 30,
        xpReward: 15,
        xpAwarded: false,
        order: 5,
        createdAt: new Date().toISOString(),
      },
      {
        id: 'task-6',
        userId: demoUser.id,
        title: 'Budget & Investment Portfolio Rebalancing',
        description: 'Check index fund allocations and monthly dollar-cost averaging.',
        category: 'Finance',
        priority: 'Medium',
        status: 'todo',
        dueDate: todayStr,
        dueTime: '21:15',
        estimatedMinutes: 20,
        xpReward: 15,
        xpAwarded: false,
        order: 6,
        createdAt: new Date().toISOString(),
      }
    );

    // Seed habits
    db.habits.push(
      {
        id: 'habit-1',
        userId: demoUser.id,
        title: 'Morning Deep Work Block (90m)',
        description: 'Zero distractions, airplane mode, high-leverage cognitive focus.',
        category: 'Work',
        priority: 'High',
        scheduleType: 'weekdays',
        scheduleDays: [1, 2, 3, 4, 5],
        targetCountPerDay: 1,
        xpReward: 20,
        color: '#8B5CF6',
        createdAt: new Date(Date.now() - 20 * 86400000).toISOString(),
        archived: false,
      },
      {
        id: 'habit-2',
        userId: demoUser.id,
        title: '10,000 Daily Steps',
        description: 'Walking breaks between work intervals to maintain metabolic health.',
        category: 'Fitness',
        priority: 'Medium',
        scheduleType: 'daily',
        scheduleDays: [0, 1, 2, 3, 4, 5, 6],
        targetCountPerDay: 1,
        xpReward: 15,
        color: '#10B981',
        createdAt: new Date(Date.now() - 25 * 86400000).toISOString(),
        archived: false,
      },
      {
        id: 'habit-3',
        userId: demoUser.id,
        title: 'Evening Digital Sunset (No screens after 10PM)',
        description: 'Wind down, read paperback, prepare sleep environment.',
        category: 'Health',
        priority: 'Medium',
        scheduleType: 'daily',
        scheduleDays: [0, 1, 2, 3, 4, 5, 6],
        targetCountPerDay: 1,
        xpReward: 15,
        color: '#06B6D4',
        createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        archived: false,
      }
    );

    // Seed habit logs for past days
    db.habitLogs.push(
      {
        id: 'log-1',
        habitId: 'habit-1',
        userId: demoUser.id,
        date: todayStr,
        completed: true,
        completedAt: new Date().toISOString(),
      },
      {
        id: 'log-2',
        habitId: 'habit-2',
        userId: demoUser.id,
        date: todayStr,
        completed: true,
        completedAt: new Date().toISOString(),
      },
      {
        id: 'log-3',
        habitId: 'habit-1',
        userId: demoUser.id,
        date: yesterdayStr,
        completed: true,
        completedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'log-4',
        habitId: 'habit-2',
        userId: demoUser.id,
        date: yesterdayStr,
        completed: true,
        completedAt: new Date(Date.now() - 86400000).toISOString(),
      },
      {
        id: 'log-5',
        habitId: 'habit-3',
        userId: demoUser.id,
        date: yesterdayStr,
        completed: true,
        completedAt: new Date(Date.now() - 86400000).toISOString(),
      }
    );

    // Seed achievements for demo user
    db.userAchievements.push(
      {
        id: 'ua-1',
        userId: demoUser.id,
        achievementId: 'first_task',
        unlockedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
      },
      {
        id: 'ua-2',
        userId: demoUser.id,
        achievementId: 'streak_3',
        unlockedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      },
      {
        id: 'ua-3',
        userId: demoUser.id,
        achievementId: 'early_bird',
        unlockedAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      }
    );

    // Seed daily summaries for the past 2 weeks
    for (let i = 14; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const ds = d.toISOString().split('T')[0];
      const isMet = i !== 6; // one missed day 6 days ago for realistic realism
      const completedCount = isMet ? 3 + (i % 3) : 1;
      const totalCount = 4 + (i % 2);

      db.dailySummaries.push({
        id: `${demoUser.id}_${ds}`,
        userId: demoUser.id,
        date: ds,
        tasksTotal: totalCount,
        tasksCompleted: completedCount,
        habitsTotal: 3,
        habitsCompleted: isMet ? 2 : 1,
        xpEarned: completedCount * 15 + (isMet ? 30 : 0),
        goalMet: isMet,
        updatedAt: d.toISOString(),
      });
    }

    db.save();
  }
}
