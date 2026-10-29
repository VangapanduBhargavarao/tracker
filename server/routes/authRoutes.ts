import { Router, Response } from 'express';
import { db, User } from '../db.ts';
import {
  AuthenticatedRequest,
  authMiddleware,
  hashPassword,
  comparePassword,
  generateToken,
} from '../auth.ts';
import { calculateUserStreak } from '../streakService.ts';
import { getUserLevelInfo } from '../gamificationService.ts';

export const authRouter = Router();

// Register new user
authRouter.post('/register', (req, res) => {
  const { email, password, name, avatar, timezone, dailyGoalType, dailyGoalCount, dailyGoalPercentage } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ error: 'Email, password, and name are required.' });
  }

  const existing = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const newUser: User = {
    id: `usr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    email: email.toLowerCase().trim(),
    passwordHash: hashPassword(password),
    name: name.trim(),
    avatar: avatar || '/src/assets/images/avatar_default_warrior_1793290647823.jpg',
    level: 1,
    xp: 0,
    streak: 0,
    longestStreak: 0,
    totalActiveDays: 0,
    lastActiveDate: null,
    preferences: {
      theme: 'dark',
      dailyGoalType: dailyGoalType === 'percentage' ? 'percentage' : 'count',
      dailyGoalCount: Number(dailyGoalCount) || 3,
      dailyGoalPercentage: Number(dailyGoalPercentage) || 80,
      timezone: timezone || 'UTC',
      soundEnabled: true,
      notifications: true,
    },
    createdAt: new Date().toISOString(),
  };

  db.users.push(newUser);
  db.save();

  const token = generateToken(newUser);
  const streakInfo = calculateUserStreak(newUser);
  const levelInfo = getUserLevelInfo(newUser.xp);

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json({
    user: safeUser,
    token,
    streakInfo,
    levelInfo,
  });
});

// Login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  const user = db.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  if (!user || !comparePassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  const streakInfo = calculateUserStreak(user);
  const levelInfo = getUserLevelInfo(user.xp);

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    user: safeUser,
    token,
    streakInfo,
    levelInfo,
  });
});

// Quick demo login
authRouter.post('/demo', (_req, res) => {
  const demoUser = db.users.find((u) => u.email === 'warrior@aurahabit.io') || db.users[0];
  if (!demoUser) {
    return res.status(500).json({ error: 'Demo account not initialized.' });
  }

  const token = generateToken(demoUser);
  const streakInfo = calculateUserStreak(demoUser);
  const levelInfo = getUserLevelInfo(demoUser.xp);

  const { passwordHash: _, ...safeUser } = demoUser;
  res.json({
    user: safeUser,
    token,
    streakInfo,
    levelInfo,
  });
});

// Get current user profile & live gamification status
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const streakInfo = calculateUserStreak(user);
  const levelInfo = getUserLevelInfo(user.xp);

  const { passwordHash: _, ...safeUser } = user;
  res.json({
    user: safeUser,
    streakInfo,
    levelInfo,
  });
});

// Update user profile & settings
authRouter.put('/profile', authMiddleware, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { name, avatar, preferences } = req.body;

  if (name && typeof name === 'string') {
    user.name = name.trim();
  }
  if (avatar && typeof avatar === 'string') {
    user.avatar = avatar;
  }
  if (preferences && typeof preferences === 'object') {
    user.preferences = {
      ...user.preferences,
      ...preferences,
      dailyGoalCount: Math.max(1, Number(preferences.dailyGoalCount) || user.preferences.dailyGoalCount),
      dailyGoalPercentage: Math.min(100, Math.max(10, Number(preferences.dailyGoalPercentage) || user.preferences.dailyGoalPercentage)),
    };
  }

  db.save();

  const streakInfo = calculateUserStreak(user);
  const levelInfo = getUserLevelInfo(user.xp);
  const { passwordHash: _, ...safeUser } = user;

  res.json({
    user: safeUser,
    streakInfo,
    levelInfo,
    message: 'Profile settings updated successfully.',
  });
});
