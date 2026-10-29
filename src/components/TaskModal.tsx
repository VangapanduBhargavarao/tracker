import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Flame, Tag, AlertCircle } from 'lucide-react';
import { Task } from '../types/index.ts';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: Partial<Task>) => Promise<void>;
  initialTask?: Task | null;
  defaultDueDate?: string;
}

const CATEGORIES = ['Work', 'Learning', 'Fitness', 'Health', 'Personal', 'Finance', 'Other'];
const PRIORITIES: ('Low' | 'Medium' | 'High')[] = ['Low', 'Medium', 'High'];

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  defaultDueDate,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [estimatedMinutes, setEstimatedMinutes] = useState(25);
  const [xpReward, setXpReward] = useState(15);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description || '');
      setCategory(initialTask.category);
      setPriority(initialTask.priority);
      setDueDate(initialTask.dueDate);
      setDueTime(initialTask.dueTime || '');
      setEstimatedMinutes(initialTask.estimatedMinutes);
      setXpReward(initialTask.xpReward);
    } else {
      setTitle('');
      setDescription('');
      setCategory('Work');
      setPriority('Medium');
      const today = defaultDueDate || new Date().toISOString().split('T')[0];
      setDueDate(today);
      setDueTime('17:00');
      setEstimatedMinutes(25);
      setXpReward(15);
    }
    setError('');
  }, [initialTask, defaultDueDate, isOpen]);

  // Adjust default XP when priority changes
  const handlePriorityChange = (p: 'Low' | 'Medium' | 'High') => {
    setPriority(p);
    if (!initialTask) {
      if (p === 'High') setXpReward(20);
      else if (p === 'Medium') setXpReward(15);
      else setXpReward(10);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Task title is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      await onSave({
        title: title.trim(),
        description: description.trim(),
        category,
        priority,
        dueDate,
        dueTime: dueTime || undefined,
        estimatedMinutes: Number(estimatedMinutes) || 25,
        xpReward: Number(xpReward) || 15,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to save task.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <h3 className="text-lg font-bold text-white">
            {initialTask ? 'Edit Task' : 'Create Daily Objective'}
          </h3>
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
          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Task Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Complete high-intensity workout session"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Description (Optional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add key milestones, links, or notes..."
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors resize-none"
            />
          </div>

          {/* Category & Priority Grid */}
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
                Priority
              </label>
              <div className="flex rounded-xl bg-slate-950 border border-slate-700 p-0.5">
                {PRIORITIES.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => handlePriorityChange(p)}
                    className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      priority === p
                        ? p === 'High'
                          ? 'bg-rose-500/20 text-rose-300 font-semibold'
                          : p === 'Medium'
                          ? 'bg-amber-500/20 text-amber-300 font-semibold'
                          : 'bg-blue-500/20 text-blue-300 font-semibold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Due Date & Time Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Due Date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Due Time (Optional)
              </label>
              <input
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Duration & XP Reward */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Estimated Duration (min)
              </label>
              <input
                type="number"
                min="1"
                max="720"
                value={estimatedMinutes}
                onChange={(e) => setEstimatedMinutes(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono tabular-nums text-xs focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1 flex items-center justify-between">
                <span>XP Reward</span>
                <span className="text-[11px] text-amber-400 font-semibold font-mono tabular-nums">+{xpReward} XP</span>
              </label>
              <input
                type="number"
                min="5"
                max="100"
                step="5"
                value={xpReward}
                onChange={(e) => setXpReward(Math.max(5, Number(e.target.value)))}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-white font-mono tabular-nums text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Footer Actions */}
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
              {isSubmitting ? 'Saving...' : initialTask ? 'Update Task' : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
