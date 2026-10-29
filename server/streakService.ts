import { db, User } from './db.ts';

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

// Format date in specified timezone
export function getLocalDateString(date: Date = new Date(), timezone: string = 'UTC'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

// Check if a specific date met the daily goal
export function isDayGoalMet(user: User, dateStr: string): { met: boolean; completed: number; total: number } {
  const userTasks = db.tasks.filter((t) => t.userId === user.id && t.dueDate === dateStr);
  const completed = userTasks.filter((t) => t.status === 'completed').length;
  const total = userTasks.length;

  const { dailyGoalType, dailyGoalCount, dailyGoalPercentage } = user.preferences;

  if (dailyGoalType === 'percentage') {
    if (total === 0) return { met: false, completed, total };
    const pct = (completed / total) * 100;
    return { met: pct >= dailyGoalPercentage, completed, total };
  } else {
    // Count-based
    return { met: completed >= dailyGoalCount, completed, total };
  }
}

// Calculate streak across calendar history
export function calculateUserStreak(user: User): StreakInfo {
  const tz = user.preferences?.timezone || 'UTC';
  const todayStr = getLocalDateString(new Date(), tz);

  // Parse today into a date object anchored at noon
  const [year, month, day] = todayStr.split('-').map(Number);
  const todayDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const yesterdayDate = new Date(todayDate.getTime() - 86400000);
  const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

  const todayStatus = isDayGoalMet(user, todayStr);
  const yesterdayStatus = isDayGoalMet(user, yesterdayStr);

  // Build the 7-day strip (from 6 days ago up to today)
  const weeklyStrip: StreakInfo['weeklyStrip'] = [];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(todayDate.getTime() - i * 86400000);
    const dStr = d.toISOString().split('T')[0];
    const isToday = dStr === todayStr;
    const statusResult = isDayGoalMet(user, dStr);

    let status: 'completed' | 'missed' | 'pending' | 'future' = 'missed';
    if (isToday) {
      status = statusResult.met ? 'completed' : 'pending';
    } else {
      status = statusResult.met ? 'completed' : 'missed';
    }

    weeklyStrip.push({
      date: dStr,
      dayName: dayNames[d.getUTCDay()],
      dayNumber: d.getUTCDate(),
      status,
      tasksCompleted: statusResult.completed,
      tasksTotal: statusResult.total,
      isToday,
    });
  }

  // Calculate current streak backwards from yesterday (or today if met)
  let currentStreak = 0;
  let checkDate = new Date(todayDate);

  if (todayStatus.met) {
    currentStreak = 1;
    // count backwards from yesterday
    checkDate = new Date(todayDate.getTime() - 86400000);
  } else {
    // Today not met yet: do not penalize today. Count backwards starting from yesterday
    checkDate = new Date(todayDate.getTime() - 86400000);
  }

  // Traverse backwards up to 365 days
  while (true) {
    const dateStr = checkDate.toISOString().split('T')[0];
    const res = isDayGoalMet(user, dateStr);
    if (res.met) {
      currentStreak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      break;
    }
  }

  // Total active days count (any day with goal met or at least 1 completed task)
  const allUserTasks = db.tasks.filter((t) => t.userId === user.id && t.status === 'completed');
  const uniqueActiveDates = new Set<string>();
  for (const t of allUserTasks) {
    if (t.completedAt) {
      uniqueActiveDates.add(t.completedAt.split('T')[0]);
    } else if (t.dueDate) {
      uniqueActiveDates.add(t.dueDate);
    }
  }
  const totalActiveDays = Math.max(user.totalActiveDays || 0, uniqueActiveDates.size);

  const longestStreak = Math.max(user.longestStreak || 0, currentStreak);

  // Update user in DB
  user.streak = currentStreak;
  user.longestStreak = longestStreak;
  user.totalActiveDays = totalActiveDays;
  if (todayStatus.met) {
    user.lastActiveDate = todayStr;
  }
  db.save();

  // Character Mascot and Messaging
  let characterState: 'beast' | 'bounce_back' | 'neutral' = 'neutral';
  let characterMessage = "Let's crush today's objectives!";
  let characterMascotUrl = '/src/assets/images/mascot_beast_mode_1793290648634.jpg';

  if (todayStatus.met) {
    characterState = 'beast';
    characterMessage = currentStreak >= 7 ? 'Beast Mode Activated! Unstoppable force!' : 'Another Day Strong! Goal achieved!';
    characterMascotUrl = '/src/assets/images/mascot_beast_mode_1793290648634.jpg';
  } else if (!yesterdayStatus.met && currentStreak === 0) {
    characterState = 'bounce_back';
    characterMessage = "Yesterday slipped. Let's bounce back today!";
    characterMascotUrl = '/src/assets/images/mascot_slump_bounce_1793290649119.jpg';
  } else if (currentStreak > 0) {
    characterState = 'beast';
    characterMessage = `Streak alive (${currentStreak}d)! Complete ${Math.max(1, (user.preferences.dailyGoalCount || 3) - todayStatus.completed)} more to extend.`;
    characterMascotUrl = '/src/assets/images/mascot_beast_mode_1793290648634.jpg';
  }

  // Milestones: 3, 7, 14, 30, 100
  const milestones = [
    { days: 3, title: 'Consistency Starter' },
    { days: 7, title: 'Weekly Warrior' },
    { days: 14, title: 'Discipline Builder' },
    { days: 30, title: 'Consistency Master' },
    { days: 100, title: 'Legendary Achiever' },
  ];

  let activeMilestone = {
    days: 3,
    title: 'Consistency Starter',
    unlocked: currentStreak >= 3,
    nextMilestoneDays: 3,
  };

  for (let i = 0; i < milestones.length; i++) {
    if (currentStreak >= milestones[i].days) {
      activeMilestone = {
        days: milestones[i].days,
        title: milestones[i].title,
        unlocked: true,
        nextMilestoneDays: milestones[i + 1] ? milestones[i + 1].days : 100,
      };
    } else {
      activeMilestone.nextMilestoneDays = milestones[i].days;
      break;
    }
  }

  const completionPct = todayStatus.total > 0 ? Math.round((todayStatus.completed / todayStatus.total) * 100) : 0;

  return {
    currentStreak,
    longestStreak,
    totalActiveDays,
    todayGoalMet: todayStatus.met,
    todayTasksCompleted: todayStatus.completed,
    todayTasksTotal: todayStatus.total,
    todayCompletionPercentage: completionPct,
    characterState,
    characterMessage,
    characterMascotUrl,
    weeklyStrip,
    activeMilestone,
  };
}
