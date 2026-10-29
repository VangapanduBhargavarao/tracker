import { Router, Response } from 'express';
import { db, Habit, HabitLog } from '../db.ts';
import { AuthenticatedRequest, authMiddleware } from '../auth.ts';
import { getLocalDateString, calculateUserStreak } from '../streakService.ts';
import { awardXp, evaluateAchievements, getUserLevelInfo } from '../gamificationService.ts';

export const habitRouter = Router();
habitRouter.use(authMiddleware);

// Get all habits with recent 7 days completion history
habitRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const tz = user.preferences?.timezone || 'UTC';
  const todayStr = getLocalDateString(new Date(), tz);
  const [year, month, day] = todayStr.split('-').map(Number);
  const anchorDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  const habits = db.habits.filter((h) => h.userId === user.id && !h.archived);
  const userLogs = db.habitLogs.filter((l) => l.userId === user.id);

  const dates7: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dates7.push(new Date(anchorDate.getTime() - i * 86400000).toISOString().split('T')[0]);
  }

  const enrichedHabits = habits.map((habit) => {
    const isCompletedToday = userLogs.some(
      (l) => l.habitId === habit.id && l.date === todayStr && l.completed
    );

    const history7Days = dates7.map((dStr) => {
      const log = userLogs.find((l) => l.habitId === habit.id && l.date === dStr);
      return {
        date: dStr,
        completed: Boolean(log && log.completed),
      };
    });

    // Calculate current streak for this specific habit
    let habitStreak = 0;
    let checkDate = new Date(anchorDate);
    if (isCompletedToday) {
      habitStreak = 1;
      checkDate = new Date(anchorDate.getTime() - 86400000);
    } else {
      checkDate = new Date(anchorDate.getTime() - 86400000);
    }

    while (true) {
      const cStr = checkDate.toISOString().split('T')[0];
      const hadLog = userLogs.some((l) => l.habitId === habit.id && l.date === cStr && l.completed);
      if (hadLog) {
        habitStreak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        break;
      }
    }

    return {
      ...habit,
      isCompletedToday,
      history7Days,
      currentStreak: habitStreak,
    };
  });

  res.json({ habits: enrichedHabits, todayDate: todayStr });
});

// Create new habit
habitRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { title, description, category, priority, scheduleType, scheduleDays, xpReward, color } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Habit title is required.' });
  }

  const newHabit: Habit = {
    id: `hab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category || 'Health',
    priority: priority || 'Medium',
    scheduleType: scheduleType || 'daily',
    scheduleDays: Array.isArray(scheduleDays) && scheduleDays.length > 0 ? scheduleDays : [0, 1, 2, 3, 4, 5, 6],
    targetCountPerDay: 1,
    xpReward: Number(xpReward) || 15,
    color: color || '#8B5CF6',
    createdAt: new Date().toISOString(),
    archived: false,
  };

  db.habits.push(newHabit);
  db.save();

  res.status(201).json({ habit: newHabit });
});

// Update habit
habitRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const habit = db.habits.find((h) => h.id === id && h.userId === user.id);

  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  const { title, description, category, priority, scheduleType, scheduleDays, xpReward, color } = req.body;

  if (title !== undefined) habit.title = title.trim();
  if (description !== undefined) habit.description = description ? description.trim() : '';
  if (category !== undefined) habit.category = category;
  if (priority !== undefined) habit.priority = priority;
  if (scheduleType !== undefined) habit.scheduleType = scheduleType;
  if (scheduleDays !== undefined && Array.isArray(scheduleDays)) habit.scheduleDays = scheduleDays;
  if (xpReward !== undefined) habit.xpReward = Number(xpReward) || habit.xpReward;
  if (color !== undefined) habit.color = color;

  db.save();
  res.json({ habit });
});

// Toggle habit completion for a specific date
habitRouter.post('/:id/toggle', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { date } = req.body;

  const habit = db.habits.find((h) => h.id === id && h.userId === user.id);
  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  const tz = user.preferences?.timezone || 'UTC';
  const targetDate = date || getLocalDateString(new Date(), tz);

  const existingLogIndex = db.habitLogs.findIndex(
    (l) => l.habitId === habit.id && l.userId === user.id && l.date === targetDate
  );

  let completedNow = false;
  let xpChange = 0;
  let leveledUp = false;

  if (existingLogIndex >= 0) {
    // Reopening/unchecking habit: remove log and reverse XP
    db.habitLogs.splice(existingLogIndex, 1);
    xpChange = -habit.xpReward;
    awardXp(user, -habit.xpReward, 'habit_uncompleted', habit.id);
    completedNow = false;
  } else {
    // Completing habit
    const newLog: HabitLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      habitId: habit.id,
      userId: user.id,
      date: targetDate,
      completed: true,
      completedAt: new Date().toISOString(),
    };
    db.habitLogs.push(newLog);
    xpChange = habit.xpReward;
    const resAward = awardXp(user, habit.xpReward, 'habit_completed', habit.id);
    leveledUp = resAward.leveledUp;
    completedNow = true;
  }

  db.save();

  const newlyUnlockedAchievements = completedNow ? evaluateAchievements(user) : [];
  const streakInfo = calculateUserStreak(user);
  const levelInfo = getUserLevelInfo(user.xp);

  res.json({
    habitId: habit.id,
    date: targetDate,
    completed: completedNow,
    xpChange,
    leveledUp,
    newlyUnlockedAchievements,
    streakInfo,
    levelInfo,
  });
});

// Delete/Archive habit
habitRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const habit = db.habits.find((h) => h.id === id && h.userId === user.id);

  if (!habit) {
    return res.status(404).json({ error: 'Habit not found.' });
  }

  habit.archived = true;
  db.save();

  res.json({ success: true, message: 'Habit archived successfully.' });
});
