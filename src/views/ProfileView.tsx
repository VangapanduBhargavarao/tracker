import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  Settings,
  Flame,
  Volume2,
  VolumeX,
  Moon,
  Sun,
  Clock,
  Target,
  Save,
  Check,
  AlertCircle,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

const AVATAR_PRESETS = [
  { id: 'warrior', label: 'Cyber Warrior', url: '/src/assets/images/avatar_default_warrior_1793290647823.jpg' },
  { id: 'beast', label: 'Beast Champion', url: '/src/assets/images/mascot_beast_mode_1793290648634.jpg' },
  { id: 'slump', label: 'Bounce-Back Chibi', url: '/src/assets/images/mascot_slump_bounce_1793290649119.jpg' },
  { id: 'trophy', label: 'Aura Master Crest', url: '/src/assets/images/badge_consistency_trophy_1793290648238.jpg' },
];

export const ProfileView: React.FC = () => {
  const { user, updateProfile, logout } = useAuth();

  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [timezone, setTimezone] = useState('UTC');
  const [dailyGoalType, setDailyGoalType] = useState<'count' | 'percentage'>('count');
  const [dailyGoalCount, setDailyGoalCount] = useState(3);
  const [dailyGoalPercentage, setDailyGoalPercentage] = useState(80);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name);
      setAvatar(user.avatar || AVATAR_PRESETS[0].url);
      setTheme(user.preferences?.theme || 'dark');
      setTimezone(user.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
      setDailyGoalType(user.preferences?.dailyGoalType || 'count');
      setDailyGoalCount(user.preferences?.dailyGoalCount || 3);
      setDailyGoalPercentage(user.preferences?.dailyGoalPercentage || 80);
      setSoundEnabled(user.preferences?.soundEnabled !== false);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Display name is required.');
      return;
    }

    try {
      setIsSaving(true);
      setError('');
      await updateProfile({
        name: name.trim(),
        avatar,
        preferences: {
          theme,
          timezone,
          dailyGoalType,
          dailyGoalCount: Number(dailyGoalCount) || 3,
          dailyGoalPercentage: Number(dailyGoalPercentage) || 80,
          soundEnabled,
          notifications: true,
        },
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleAutoDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) setTimezone(detected);
    } catch {
      // Ignore
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Top Banner */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings className="w-5 h-5 text-purple-400" />
          <span>Profile &amp; Goal Configuration</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Fine-tune your daily streak criteria, persona avatar, and motivational sensory cues.
        </p>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 shrink-0" />
          <span>Profile settings successfully saved and applied!</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Avatar Selection Card */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserIcon className="w-4 h-4 text-purple-400" />
            <span>Hero Avatar Persona</span>
          </h3>

          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-purple-500 shadow-xl shrink-0 bg-slate-950">
              <img
                src={avatar || AVATAR_PRESETS[0].url}
                alt="Selected Avatar"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-1 space-y-2">
              <span className="text-xs text-slate-400 font-medium">Select Avatar Persona:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AVATAR_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setAvatar(p.url)}
                    className={`flex items-center gap-2 p-2 rounded-xl border text-xs text-left transition-colors ${
                      avatar === p.url
                        ? 'bg-purple-600/20 border-purple-400 text-white shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <img
                      src={p.url}
                      alt={p.label}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 rounded-full object-cover shrink-0"
                    />
                    <span className="truncate">{p.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Account Details */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <h3 className="text-sm font-bold text-white">Identity &amp; Regional Coordinates</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Display Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Email (Authenticated)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-slate-400 font-mono text-xs cursor-not-allowed"
              />
            </div>

            <div className="sm:col-span-2">
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Timezone (Streak Calculation Anchor)</label>
                <button
                  type="button"
                  onClick={handleAutoDetectTimezone}
                  className="text-purple-400 hover:text-purple-300 text-[11px] underline"
                >
                  Auto-detect current
                </button>
              </div>
              <input
                type="text"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="e.g. America/Los_Angeles or UTC"
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>

        {/* Daily Streak Goal Rules Configuration */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-purple-400" />
              <span>Daily Goal &amp; Streak Validation Rule</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Configure the exact threshold required to count a day as successful and keep your streak alive.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDailyGoalType('count')}
              className={`p-3 rounded-xl border text-left transition-all ${
                dailyGoalType === 'count'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs mb-1">Task Count Rule</div>
              <div className="text-[11px] text-slate-400 leading-snug">
                Complete a minimum number of tasks (e.g. 3 tasks) regardless of total planned.
              </div>
            </button>

            <button
              type="button"
              onClick={() => setDailyGoalType('percentage')}
              className={`p-3 rounded-xl border text-left transition-all ${
                dailyGoalType === 'percentage'
                  ? 'bg-purple-600/20 border-purple-500 text-white shadow-md'
                  : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs mb-1">Percentage Rule</div>
              <div className="text-[11px] text-slate-400 leading-snug">
                Complete a target percentage of planned daily tasks (e.g. 80%).
              </div>
            </button>
          </div>

          {dailyGoalType === 'count' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Target Completed Tasks per Day</span>
                <span className="font-mono tabular-nums text-purple-300 font-bold">{dailyGoalCount} tasks</span>
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={dailyGoalCount}
                onChange={(e) => setDailyGoalCount(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>Target Daily Completion Percentage</span>
                <span className="font-mono tabular-nums text-purple-300 font-bold">{dailyGoalPercentage}%</span>
              </label>
              <input
                type="range"
                min="30"
                max="100"
                step="5"
                value={dailyGoalPercentage}
                onChange={(e) => setDailyGoalPercentage(Number(e.target.value))}
                className="w-full accent-purple-500"
              />
            </div>
          )}
        </div>

        {/* Sensory & Sound Preferences */}
        <div className="p-5 bg-slate-900/90 border border-slate-800 rounded-2xl flex items-center justify-between">
          <div>
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              {soundEnabled ? <Volume2 className="w-4 h-4 text-purple-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
              <span>Gamification Audio Feedback</span>
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Play rewarding audio chimes when tasks are completed or when ascending levels.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-colors ${
              soundEnabled
                ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                : 'bg-slate-950 border-slate-800 text-slate-500'
            }`}
          >
            {soundEnabled ? 'Enabled' : 'Muted'}
          </button>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-slate-900 border border-slate-800 hover:border-rose-900/50 rounded-xl transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition-transform active:scale-95 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
