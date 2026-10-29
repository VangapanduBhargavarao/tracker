import React, { useState } from 'react';
import { Plus, Flame } from 'lucide-react';
import { Task } from '../types/index.ts';

interface QuickAddTaskProps {
  onAdd: (taskData: Partial<Task>) => Promise<void>;
  defaultDueDate?: string;
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({ onAdd, defaultDueDate }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const xp = priority === 'High' ? 20 : priority === 'Medium' ? 15 : 10;
      await onAdd({
        title: title.trim(),
        category,
        priority,
        dueDate: defaultDueDate || new Date().toISOString().split('T')[0],
        estimatedMinutes: 25,
        xpReward: xp,
      });
      setTitle('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col sm:flex-row items-center gap-2 p-2 bg-slate-900/90 border border-slate-800 rounded-xl shadow-md"
    >
      <div className="flex-1 w-full relative">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="+ Quick add a daily objective (press Enter)..."
          className="w-full px-3.5 py-2 bg-slate-950/80 border border-slate-800 focus:border-purple-500 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none transition-colors"
        />
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500"
        >
          <option value="Work">Work</option>
          <option value="Learning">Learning</option>
          <option value="Fitness">Fitness</option>
          <option value="Health">Health</option>
          <option value="Personal">Personal</option>
          <option value="Finance">Finance</option>
          <option value="Other">Other</option>
        </select>

        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'Low' | 'Medium' | 'High')}
          className="px-2.5 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-purple-500"
        >
          <option value="Low">Low (10 XP)</option>
          <option value="Medium">Medium (15 XP)</option>
          <option value="High">High (20 XP)</option>
        </select>

        <button
          type="submit"
          disabled={!title.trim() || isSubmitting}
          className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold rounded-lg shadow transition-transform active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add</span>
        </button>
      </div>
    </form>
  );
};
