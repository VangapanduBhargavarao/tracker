import { db, User, Task, Achievement, UserAchievement, XpTransaction } from './db.ts';
import { calculateUserStreak, isDayGoalMet, getLocalDateString } from './streakService.ts';

export interface LevelInfo {
  level: number;
  currentLevelXp: number;
  xpForNextLevel: number;
  progressPercentage: number;
  totalXp: number;
  title: string;
}

export const LEVEL_TITLES = [
  'Novice Pathfinder',     // L1
  'Apprentice Achiever',   // L2
  'Discipline Journeyman', // L3
  'Focus Knight',          // L4
  'Productivity Champion', // L5
  'Aura Master',           // L6
  'Grandmaster Architect', // L7
  'Mythic Sovereign',      // L8
  'Apex Transcendence',    // L9
  'Legendary Titan',       // L10+
];

// Calculate required XP for a given level
export function getRequiredXpForLevel(level: number): number {
  if (level <= 1) return 0;
  // Progressive polynomial curve
  let total = 0;
  for (let l = 1; l < level; l++) {
    total += Math.round(150 * Math.pow(l, 1.35) + 100);
  }
  return total;
}

export function getUserLevelInfo(xp: number): LevelInfo {
  let level = 1;
  while (true) {
    const nextReq = getRequiredXpForLevel(level + 1);
    if (xp >= nextReq) {
      level++;
    } else {
      break;
    }
  }

  const currentLevelBaseXp = getRequiredXpForLevel(level);
  const nextLevelBaseXp = getRequiredXpForLevel(level + 1);
  const xpInCurrentLevel = Math.max(0, xp - currentLevelBaseXp);
  const xpNeededForNext = nextLevelBaseXp - currentLevelBaseXp;
  const pct = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / xpNeededForNext) * 100)));

  const titleIndex = Math.min(level - 1, LEVEL_TITLES.length - 1);
  const title = LEVEL_TITLES[titleIndex];

  return {
    level,
    currentLevelXp: xpInCurrentLevel,
    xpForNextLevel: xpNeededForNext,
    progressPercentage: pct,
    totalXp: xp,
    title,
  };
}

export interface GamificationResult {
  xpAwarded: number;
  newTotalXp: number;
  previousLevel: number;
  newLevel: number;
  leveledUp: boolean;
  newAchievements: Achievement[];
  bonusMessage?: string;
}

export function awardXp(
  user: User,
  amount: number,
  reason: string,
  referenceId?: string
): { leveledUp: boolean; oldLevel: number; newLevel: number } {
  const oldLevelInfo = getUserLevelInfo(user.xp);
  user.xp = Math.max(0, user.xp + amount);

  const transaction: XpTransaction = {
    id: `xp-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    userId: user.id,
    amount,
    reason,
    referenceId,
    timestamp: new Date().toISOString(),
  };
  db.xpTransactions.push(transaction);

  const newLevelInfo = getUserLevelInfo(user.xp);
  user.level = newLevelInfo.level;
  db.save();

  return {
    leveledUp: newLevelInfo.level > oldLevelInfo.level,
    oldLevel: oldLevelInfo.level,
    newLevel: newLevelInfo.level,
  };
}

// Evaluate and unlock eligible achievements
export function evaluateAchievements(user: User): Achievement[] {
  const userUnlockedIds = new Set(
    db.userAchievements.filter((ua) => ua.userId === user.id).map((ua) => ua.achievementId)
  );

  const newlyUnlocked: Achievement[] = [];
  const streakInfo = calculateUserStreak(user);
  const tz = user.preferences?.timezone || 'UTC';
  const todayStr = getLocalDateString(new Date(), tz);

  const userCompletedTasks = db.tasks.filter((t) => t.userId === user.id && t.status === 'completed');
  const todayTasks = userCompletedTasks.filter((t) => {
    return t.completedAt?.startsWith(todayStr) || t.dueDate === todayStr;
  });

  const habitsLoggedCount = db.habitLogs.filter((l) => l.userId === user.id && l.completed).length;

  for (const ach of db.achievements) {
    if (userUnlockedIds.has(ach.id)) continue;

    let shouldUnlock = false;

    switch (ach.id) {
      case 'first_task':
        if (userCompletedTasks.length >= 1) shouldUnlock = true;
        break;

      case 'early_bird': {
        const hasEarly = userCompletedTasks.some((t) => {
          if (!t.completedAt) return false;
          try {
            const date = new Date(t.completedAt);
            const hour = Number(
              new Intl.DateTimeFormat('en-US', {
                timeZone: tz,
                hour: 'numeric',
                hour12: false,
              }).format(date)
            );
            return hour < 9;
          } catch {
            return false;
          }
        });
        if (hasEarly) shouldUnlock = true;
        break;
      }

      case 'high_roller': {
        const highToday = todayTasks.filter((t) => t.priority === 'High');
        if (highToday.length >= 3) shouldUnlock = true;
        break;
      }

      case 'pentakill': {
        if (todayTasks.length >= 5) shouldUnlock = true;
        break;
      }

      case 'streak_3':
        if (streakInfo.currentStreak >= 3) shouldUnlock = true;
        break;

      case 'streak_7':
        if (streakInfo.currentStreak >= 7) shouldUnlock = true;
        break;

      case 'streak_14':
        if (streakInfo.currentStreak >= 14) shouldUnlock = true;
        break;

      case 'streak_30':
        if (streakInfo.currentStreak >= 30) shouldUnlock = true;
        break;

      case 'streak_100':
        if (streakInfo.currentStreak >= 100) shouldUnlock = true;
        break;

      case 'habit_hero':
        if (habitsLoggedCount >= 15) shouldUnlock = true;
        break;

      case 'century_club':
        if (userCompletedTasks.length >= 100) shouldUnlock = true;
        break;

      case 'perfect_week': {
        // Check if last 7 days all met goals
        let perfectDays = 0;
        const [year, month, day] = todayStr.split('-').map(Number);
        const anchor = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        for (let i = 0; i < 7; i++) {
          const dStr = new Date(anchor.getTime() - i * 86400000).toISOString().split('T')[0];
          if (isDayGoalMet(user, dStr).met) {
            perfectDays++;
          }
        }
        if (perfectDays >= 7) shouldUnlock = true;
        break;
      }
    }

    if (shouldUnlock) {
      const record: UserAchievement = {
        id: `ua-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        userId: user.id,
        achievementId: ach.id,
        unlockedAt: new Date().toISOString(),
      };
      db.userAchievements.push(record);
      newlyUnlocked.push(ach);

      // Award achievement bonus XP
      awardXp(user, ach.xpBonus, `achievement_unlocked_${ach.id}`, ach.id);
    }
  }

  if (newlyUnlocked.length > 0) {
    db.save();
  }

  return newlyUnlocked;
}
