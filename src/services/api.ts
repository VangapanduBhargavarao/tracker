import {
  User,
  Task,
  Habit,
  LevelInfo,
  StreakInfo,
  Achievement,
  XpTransaction,
  AnalyticsData,
} from '../types/index.ts';

const TOKEN_KEY = 'aurahabit_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.error || `Request failed with status ${res.status}`);
  }

  return data as T;
}

export const api = {
  // Auth
  async login(email: string, password: string) {
    const data = await request<{
      user: User;
      token: string;
      streakInfo: StreakInfo;
      levelInfo: LevelInfo;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredToken(data.token);
    return data;
  },

  async register(payload: {
    email: string;
    password: string;
    name: string;
    avatar?: string;
    timezone?: string;
    dailyGoalType?: 'count' | 'percentage';
    dailyGoalCount?: number;
    dailyGoalPercentage?: number;
  }) {
    const data = await request<{
      user: User;
      token: string;
      streakInfo: StreakInfo;
      levelInfo: LevelInfo;
    }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setStoredToken(data.token);
    return data;
  },

  async loginDemo() {
    const data = await request<{
      user: User;
      token: string;
      streakInfo: StreakInfo;
      levelInfo: LevelInfo;
    }>('/api/auth/demo', {
      method: 'POST',
    });
    setStoredToken(data.token);
    return data;
  },

  async getMe() {
    return request<{
      user: User;
      streakInfo: StreakInfo;
      levelInfo: LevelInfo;
    }>('/api/auth/me');
  },

  async updateProfile(payload: {
    name?: string;
    avatar?: string;
    preferences?: Partial<User['preferences']>;
  }) {
    return request<{
      user: User;
      streakInfo: StreakInfo;
      levelInfo: LevelInfo;
      message: string;
    }>('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Tasks
  async getTasks(params?: {
    dueDate?: string;
    category?: string;
    priority?: string;
    status?: string;
    search?: string;
  }) {
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v) query.append(k, v);
      });
    }
    const qs = query.toString();
    return request<{ tasks: Task[] }>(`/api/tasks${qs ? `?${qs}` : ''}`);
  },

  async createTask(taskData: Partial<Task>) {
    return request<{ task: Task; streakInfo: StreakInfo }>('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  },

  async updateTask(id: string, taskData: Partial<Task>) {
    return request<{ task: Task; streakInfo: StreakInfo }>(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  },

  async updateTaskStatus(id: string, status: 'todo' | 'in_progress' | 'completed') {
    return request<{
      task: Task;
      xpChange: number;
      leveledUp: boolean;
      oldLevel: number;
      newLevel: number;
      newlyUnlockedAchievements: Achievement[];
      streakInfo: StreakInfo;
      levelInfo: LevelInfo;
    }>(`/api/tasks/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  async deleteTask(id: string) {
    return request<{
      success: boolean;
      message: string;
      streakInfo: StreakInfo;
      levelInfo: LevelInfo;
    }>(`/api/tasks/${id}`, {
      method: 'DELETE',
    });
  },

  async reorderTasks(taskIds: string[]) {
    return request<{ success: boolean }>('/api/tasks/reorder', {
      method: 'POST',
      body: JSON.stringify({ taskIds }),
    });
  },

  // Habits
  async getHabits() {
    return request<{ habits: Habit[]; todayDate: string }>('/api/habits');
  },

  async createHabit(habitData: Partial<Habit>) {
    return request<{ habit: Habit }>('/api/habits', {
      method: 'POST',
      body: JSON.stringify(habitData),
    });
  },

  async updateHabit(id: string, habitData: Partial<Habit>) {
    return request<{ habit: Habit }>(`/api/habits/${id}`, {
      method: 'PUT',
      body: JSON.stringify(habitData),
    });
  },

  async toggleHabit(id: string, date?: string) {
    return request<{
      habitId: string;
      date: string;
      completed: boolean;
      xpChange: number;
      leveledUp: boolean;
      newlyUnlockedAchievements: Achievement[];
      streakInfo: StreakInfo;
      levelInfo: LevelInfo;
    }>(`/api/habits/${id}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ date }),
    });
  },

  async deleteHabit(id: string) {
    return request<{ success: boolean; message: string }>(`/api/habits/${id}`, {
      method: 'DELETE',
    });
  },

  // Gamification
  async getGamification() {
    return request<{
      levelInfo: LevelInfo;
      streakInfo: StreakInfo;
      achievements: Achievement[];
      recentTransactions: XpTransaction[];
      dailyBonusClaimed: boolean;
      newlyUnlocked: Achievement[];
      levelTitles: string[];
    }>('/api/gamification');
  },

  async claimDailyBonus() {
    return request<{
      success: boolean;
      bonusXp: number;
      newTotalXp: number;
      leveledUp: boolean;
      levelInfo: LevelInfo;
      message: string;
    }>('/api/gamification/claim-daily-bonus', {
      method: 'POST',
    });
  },

  // Analytics
  async getAnalytics(days: number = 60) {
    return request<{ analytics: AnalyticsData }>(`/api/analytics?days=${days}`);
  },
};
