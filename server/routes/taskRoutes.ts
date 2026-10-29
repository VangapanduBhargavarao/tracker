import { Router, Response } from 'express';
import { db, Task } from '../db.ts';
import { AuthenticatedRequest, authMiddleware } from '../auth.ts';
import { calculateUserStreak, getLocalDateString } from '../streakService.ts';
import { awardXp, evaluateAchievements, getUserLevelInfo } from '../gamificationService.ts';

export const taskRouter = Router();
taskRouter.use(authMiddleware);

// Get tasks for current user
taskRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { dueDate, category, priority, status, search } = req.query;

  let tasks = db.tasks.filter((t) => t.userId === user.id);

  if (dueDate && typeof dueDate === 'string') {
    tasks = tasks.filter((t) => t.dueDate === dueDate);
  }
  if (category && typeof category === 'string' && category !== 'All') {
    tasks = tasks.filter((t) => t.category.toLowerCase() === category.toLowerCase());
  }
  if (priority && typeof priority === 'string' && priority !== 'All') {
    tasks = tasks.filter((t) => t.priority.toLowerCase() === priority.toLowerCase());
  }
  if (status && typeof status === 'string' && status !== 'All') {
    tasks = tasks.filter((t) => t.status === status);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    tasks = tasks.filter(
      (t) => t.title.toLowerCase().includes(q) || (t.description && t.description.toLowerCase().includes(q))
    );
  }

  // Sort by order ascending, then priority, then dueTime
  tasks.sort((a, b) => a.order - b.order);

  res.json({ tasks });
});

// Create task
taskRouter.post('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { title, description, category, priority, dueDate, dueTime, estimatedMinutes, xpReward } = req.body;

  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ error: 'Task title is required.' });
  }

  const tz = user.preferences?.timezone || 'UTC';
  const defaultDueDate = getLocalDateString(new Date(), tz);

  // Compute default XP reward based on priority
  let defaultXp = 10;
  if (priority === 'High') defaultXp = 20;
  else if (priority === 'Medium') defaultXp = 15;

  const userTasks = db.tasks.filter((t) => t.userId === user.id);
  const maxOrder = userTasks.reduce((max, t) => Math.max(max, t.order || 0), 0);

  const newTask: Task = {
    id: `tsk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId: user.id,
    title: title.trim(),
    description: description ? description.trim() : '',
    category: category || 'Work',
    priority: priority || 'Medium',
    status: 'todo',
    dueDate: dueDate || defaultDueDate,
    dueTime: dueTime || undefined,
    estimatedMinutes: Number(estimatedMinutes) || 25,
    xpReward: Number(xpReward) || defaultXp,
    xpAwarded: false,
    order: maxOrder + 1,
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  db.tasks.push(newTask);
  db.save();

  const streakInfo = calculateUserStreak(user);

  res.status(201).json({
    task: newTask,
    streakInfo,
  });
});

// Update task details
taskRouter.put('/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const task = db.tasks.find((t) => t.id === id && t.userId === user.id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const { title, description, category, priority, dueDate, dueTime, estimatedMinutes, xpReward } = req.body;

  if (title !== undefined) task.title = title.trim();
  if (description !== undefined) task.description = description ? description.trim() : '';
  if (category !== undefined) task.category = category;
  if (priority !== undefined) task.priority = priority;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (dueTime !== undefined) task.dueTime = dueTime;
  if (estimatedMinutes !== undefined) task.estimatedMinutes = Number(estimatedMinutes) || 25;
  if (xpReward !== undefined) task.xpReward = Number(xpReward) || task.xpReward;

  db.save();

  const streakInfo = calculateUserStreak(user);
  res.json({ task, streakInfo });
});

// Move task status ('todo' | 'in_progress' | 'completed')
taskRouter.patch('/:id/status', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const { status } = req.body;

  if (!['todo', 'in_progress', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status. Must be todo, in_progress, or completed.' });
  }

  const task = db.tasks.find((t) => t.id === id && t.userId === user.id);
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const previousStatus = task.status;
  task.status = status;

  let xpChange = 0;
  let leveledUp = false;
  let oldLevel = user.level;
  let newLevel = user.level;

  // Transition to COMPLETED
  if (status === 'completed' && previousStatus !== 'completed') {
    task.completedAt = new Date().toISOString();
    if (!task.xpAwarded) {
      task.xpAwarded = true;
      xpChange = task.xpReward;
      const resAward = awardXp(user, task.xpReward, 'task_completed', task.id);
      leveledUp = resAward.leveledUp;
      oldLevel = resAward.oldLevel;
      newLevel = resAward.newLevel;
    }
  }

  // Transition away from COMPLETED back to todo/in_progress
  if (previousStatus === 'completed' && status !== 'completed') {
    task.completedAt = null;
    if (task.xpAwarded) {
      // Reversal policy: deduct previously awarded XP to prevent gaming
      task.xpAwarded = false;
      xpChange = -task.xpReward;
      const resAward = awardXp(user, -task.xpReward, 'task_reopened', task.id);
      oldLevel = resAward.oldLevel;
      newLevel = resAward.newLevel;
    }
  }

  db.save();

  // Evaluate achievements if completed
  const newlyUnlockedAchievements = status === 'completed' ? evaluateAchievements(user) : [];
  const streakInfo = calculateUserStreak(user);
  const levelInfo = getUserLevelInfo(user.xp);

  res.json({
    task,
    xpChange,
    leveledUp,
    oldLevel,
    newLevel,
    newlyUnlockedAchievements,
    streakInfo,
    levelInfo,
  });
});

// Delete task
taskRouter.delete('/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { id } = req.params;
  const index = db.tasks.findIndex((t) => t.id === id && t.userId === user.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found.' });
  }

  const task = db.tasks[index];
  // If task was completed and had XP awarded, handle reversal
  if (task.status === 'completed' && task.xpAwarded) {
    awardXp(user, -task.xpReward, 'task_deleted', task.id);
  }

  db.tasks.splice(index, 1);
  db.save();

  const streakInfo = calculateUserStreak(user);
  const levelInfo = getUserLevelInfo(user.xp);

  res.json({
    success: true,
    message: 'Task deleted successfully.',
    streakInfo,
    levelInfo,
  });
});

// Reorder tasks
taskRouter.post('/reorder', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const { taskIds } = req.body;

  if (!Array.isArray(taskIds)) {
    return res.status(400).json({ error: 'taskIds must be an array of IDs.' });
  }

  taskIds.forEach((id: string, index: number) => {
    const task = db.tasks.find((t) => t.id === id && t.userId === user.id);
    if (task) {
      task.order = index;
    }
  });

  db.save();
  res.json({ success: true });
});
