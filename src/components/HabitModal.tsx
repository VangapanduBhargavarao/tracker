import React, { useState, useEffect } from 'react';
import { X, Repeat, Flame, AlertCircle } from 'lucide-react';
import { Habit } from '../types/index.ts';

interface HabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (habitData: Partial<Habit>) => Promise<void>;
  initialHabit?: Habit | null;
}

const CATEGORIES = ['Work', 'Learning', 'Fitness', 'Health', 'Personal', 'Finance', 'Other'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const COLORS = ['#8B5CF6', '#10B981', '#06B6D4', '#F59E0B', '#EC4899', '#3B82F6'];

export const HabitModal: React.FC<HabitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialHabit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Fitness');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [scheduleType, setScheduleType] = useState<'daily' | 'weekdays' | 'weekly' | 'custom_days'>('daily');
  const [scheduleDays, setScheduleDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [xpReward, setXpReward] = useState(15);
  const [color, setColor] = useState('#8B5CF6');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialHabit) {
      setTitle(initialHabit.title);
      setDescription(initialHabit.description || '');
      setCategory(initialHabit.category);
      setPriority(initialHabit.priority);
      setScheduleType(initialHabit.scheduleType);
      setScheduleDays(initialHabit.scheduleDays);
      setXpReward(initialHabit.xpReward);
      setColor(initialHabit.color);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Fitness');
      setPriority('Medium');
      setScheduleType('daily');
      setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
      setXpReward(15);
      setColor('#8B5CF6');
    }
    setError('');
  }, [initialHabit, isOpen]);

  if (!isOpen) return null;

  const handleScheduleTypeChange = (type: 'daily' | 'weekdays' | 'weekly' | 'custom_days') => {
    setScheduleType(type);
    if (type === 'daily') setScheduleDays([0, 1, 2, 3, 4, 5, 6]);
    else if (type === 'weekdays') setScheduleDays([1, 2, 3, 4, 5]);
    else if (type === 'weekly') setScheduleDays([1]); // Monday default
  };

  const toggleDay = (dayIndex: number) => {
    if (scheduleType !== 'custom_days') {
      setScheduleType('custom_days');
    }
    if (scheduleDays.includes(dayIndex)) {
      if (scheduleDays.length > 1) {
        setScheduleDays(scheduleDays.filter((d) => d !== dayIndex));
      }
    } else {
      setScheduleDays([...scheduleDays, dayIndex].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Habit title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        scheduleType,
        scheduleDays,
        xpReward: Number(xpReward) || 15,
        color,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save habit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Repeat className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-bold text-white">
              {initialHabit ? 'Edit Habit' : 'Forge New Recurring Habit'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-sm">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Habit Name *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Read 20 pages or Solve 2 DSA problems"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description / Cue (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Right after morning coffee before opening Slack"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-purple-500"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Color Accent
              </label>
              <div className="flex items-center gap-2 pt-1">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-transform ${
                      color === c ? 'scale-110 border-white shadow' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Schedule Configuration */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Recurrence Schedule
            </label>
            <div className="grid grid-cols-4 gap-2 mb-2">
              {[
                { id: 'daily', label: 'Every Day' },
                { id: 'weekdays', label: 'Mon - Fri' },
                { id: 'weekly', label: 'Once / Wk' },
                { id: 'custom_days', label: 'Custom' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleScheduleTypeChange(s.id as any)}
                  className={`py-2 px-2 text-xs font-medium rounded-xl border transition-colors ${
                    scheduleType === s.id
                      ? 'bg-purple-600/20 border-purple-500 text-purple-200'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            {/* Day Selector Buttons */}
            <div className="flex items-center justify-between gap-1 p-2 bg-slate-950 border border-slate-800 rounded-xl">
              {DAYS.map((dayName, idx) => {
                const isSelected = scheduleDays.includes(idx);
                return (
                  <button
                    key={dayName}
                    type="button"
                    onClick={() => toggleDay(idx)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      isSelected
                        ? 'bg-purple-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    {dayName}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
              <span>XP Reward per Check-in</span>
              <span className="text-xs font-mono tabular-nums text-amber-400 font-bold">+{xpReward} XP</span>
            </label>
            <input
              type="number"
              min="5"
              max="50"
              step="5"
              value={xpReward}
              onChange={(e) => setXpReward(Math.max(5, Number(e.target.value)))}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono tabular-nums text-xs focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 disabled:opacity-50 rounded-xl shadow-lg shadow-purple-600/25 transition-transform active:scale-95"
            >
              {isSubmitting ? 'Saving...' : initialHabit ? 'Update Habit' : 'Build Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
