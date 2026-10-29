import { Router, Response } from 'express';
import { db } from '../db.ts';
import { AuthenticatedRequest, authMiddleware } from '../auth.ts';
import { calculateUserStreak, getLocalDateString } from '../streakService.ts';
import { awardXp, getUserLevelInfo, evaluateAchievements, LEVEL_TITLES } from '../gamificationService.ts';

export const gamificationRouter = Router();
gamificationRouter.use(authMiddleware);

// Get gamification stats, achievements catalog, and XP transaction ledger
gamificationRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const streakInfo = calculateUserStreak(user);
  const levelInfo = getUserLevelInfo(user.xp);

  // Evaluate any achievements that might be freshly unlocked
  const newlyUnlocked = evaluateAchievements(user);

  const userAchievementsMap = new Map(
    db.userAchievements
      .filter((ua) => ua.userId === user.id)
      .map((ua) => [ua.achievementId, ua.unlockedAt])
  );

  const achievementsWithStatus = db.achievements.map((ach) => {
    const isUnlocked = userAchievementsMap.has(ach.id);
    return {
      ...ach,
      unlocked: isUnlocked,
      unlockedAt: userAchievementsMap.get(ach.id) || null,
    };
  });

  // Recent XP transactions for transparency
  const recentTransactions = db.xpTransactions
    .filter((tx) => tx.userId === user.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 15);

  const tz = user.preferences?.timezone || 'UTC';
  const todayStr = getLocalDateString(new Date(), tz);

  // Check if daily bonus already claimed today
  const dailyBonusClaimed = db.xpTransactions.some(
    (tx) => tx.userId === user.id && tx.reason === `daily_goal_bonus_${todayStr}`
  );

  res.json({
    levelInfo,
    streakInfo,
    achievements: achievementsWithStatus,
    recentTransactions,
    dailyBonusClaimed,
    newlyUnlocked,
    levelTitles: LEVEL_TITLES,
  });
});

// Claim daily goal completion bonus
gamificationRouter.post('/claim-daily-bonus', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const tz = user.preferences?.timezone || 'UTC';
  const todayStr = getLocalDateString(new Date(), tz);

  const alreadyClaimed = db.xpTransactions.some(
    (tx) => tx.userId === user.id && tx.reason === `daily_goal_bonus_${todayStr}`
  );

  if (alreadyClaimed) {
    return res.status(400).json({ error: 'Daily goal bonus already claimed for today!' });
  }

  const streakInfo = calculateUserStreak(user);
  if (!streakInfo.todayGoalMet) {
    return res.status(400).json({ error: "Today's daily goal has not yet been achieved." });
  }

  const BONUS_AMOUNT = 30;
  const result = awardXp(user, BONUS_AMOUNT, `daily_goal_bonus_${todayStr}`);
  const levelInfo = getUserLevelInfo(user.xp);

  res.json({
    success: true,
    bonusXp: BONUS_AMOUNT,
    newTotalXp: user.xp,
    leveledUp: result.leveledUp,
    levelInfo,
    message: 'Daily Goal Champion Bonus (+30 XP) unlocked!',
  });
});
