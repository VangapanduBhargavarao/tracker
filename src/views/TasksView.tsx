import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Search,
  Filter,
  Trash2,
  Edit2,
  CheckCircle2,
  Circle,
  Clock,
  Flame,
  Calendar,
  ArrowUpDown,
} from 'lucide-react';
import { Task } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { soundManager } from '../utils/audio.ts';
import { TaskModal } from '../components/TaskModal.tsx';

export const TasksView: React.FC = () => {
  const { setStreakInfo, setLevelInfo, triggerLevelUp, triggerAchievement, triggerConfetti } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const loadTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.getTasks();
      setTasks(res.tasks);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  const handleStatusChange = async (id: string, newStatus: 'todo' | 'in_progress' | 'completed') => {
    try {
      const res = await api.updateTaskStatus(id, newStatus);
      setTasks((prev) => prev.map((t) => (t.id === id ? res.task : t)));
      setStreakInfo(res.streakInfo);
      setLevelInfo(res.levelInfo);

      if (newStatus === 'completed') {
        soundManager.playComplete();
        triggerConfetti();
        if (res.leveledUp) {
          triggerLevelUp(res.newLevel);
        }
        if (res.newlyUnlockedAchievements && res.newlyUnlockedAchievements.length > 0) {
          triggerAchievement(res.newlyUnlockedAchievements[0]);
        }
      }
    } catch (err) {
      console.error('Error changing task status:', err);
    }
  };

  const handleSaveTask = async (taskData: Partial<Task>) => {
    if (editingTask) {
      const res = await api.updateTask(editingTask.id, taskData);
      setTasks((prev) => prev.map((t) => (t.id === editingTask.id ? res.task : t)));
      setStreakInfo(res.streakInfo);
      setEditingTask(null);
    } else {
      const res = await api.createTask(taskData);
      setTasks((prev) => [...prev, res.task]);
      setStreakInfo(res.streakInfo);
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await api.deleteTask(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setStreakInfo(res.streakInfo);
      setLevelInfo(res.levelInfo);
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const matchesSearch =
        t.title.toLowerCase().includes(search.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(search.toLowerCase()));
      const matchesStatus = statusFilter === 'All' || t.status === statusFilter;
      const matchesCategory = categoryFilter === 'All' || t.category === categoryFilter;
      const matchesPriority = priorityFilter === 'All' || t.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
    });
  }, [tasks, search, statusFilter, categoryFilter, priorityFilter]);

  const categories = ['All', 'Work', 'Learning', 'Fitness', 'Health', 'Personal', 'Finance', 'Other'];
  const priorities = ['All', 'High', 'Medium', 'Low'];
  const statuses = [
    { id: 'All', label: 'All Tasks' },
    { id: 'todo', label: 'To Do' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'completed', label: 'Completed' },
  ];

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white">Task Management Matrix</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Organize, prioritize, and conquer all your daily milestones.
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTask(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-purple-600/25 transition-transform active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Objective</span>
        </button>
      </div>

      {/* Filters Strip */}
      <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or description..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-purple-500 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none transition-colors"
            />
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-xl overflow-x-auto">
            {statuses.map((s) => (
              <button
                key={s.id}
                onClick={() => setStatusFilter(s.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                  statusFilter === s.id
                    ? 'bg-purple-600/20 text-purple-200 border border-purple-500/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters (Category & Priority) */}
        <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-medium">Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-purple-500"
            >
              {priorities.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <span className="text-slate-500 font-mono tabular-nums ml-auto">
            Showing {filteredTasks.length} of {tasks.length} tasks
          </span>
        </div>
      </div>

      {/* Task List / Table */}
      <div className="p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl overflow-hidden">
        {filteredTasks.length === 0 ? (
          <div className="py-16 text-center">
            <div className="inline-flex p-3 rounded-2xl bg-slate-900 border border-slate-800 text-slate-500 mb-3">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-sm font-semibold text-slate-300">No tasks match your filters</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or create a new objective.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTasks.map((task) => {
              const isCompleted = task.status === 'completed';
              return (
                <div
                  key={task.id}
                  className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors ${
                    isCompleted
                      ? 'bg-slate-900/30 border-slate-800/60 opacity-80'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      onClick={() => handleStatusChange(task.id, isCompleted ? 'todo' : 'completed')}
                      className="text-slate-500 hover:text-purple-400 transition-colors shrink-0"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4
                          className={`text-sm font-semibold text-white truncate ${
                            isCompleted ? 'line-through text-slate-400' : ''
                          }`}
                        >
                          {task.title}
                        </h4>
                      </div>

                      {/* Unboxed Metadata Discipline */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mt-1">
                        <span className="text-purple-400 font-medium">{task.category}</span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span
                          className={`font-medium ${
                            task.priority === 'High'
                              ? 'text-rose-400'
                              : task.priority === 'Medium'
                              ? 'text-amber-400'
                              : 'text-blue-400'
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono tabular-nums text-slate-300 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          {task.dueDate} {task.dueTime ? `· ${task.dueTime}` : ''}
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono tabular-nums text-slate-300 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {task.estimatedMinutes}m
                        </span>
                        <span aria-hidden="true" className="text-slate-600">·</span>
                        <span className="font-mono tabular-nums text-amber-400 font-semibold flex items-center gap-1">
                          <Flame className="w-3 h-3 fill-amber-400" />
                          +{task.xpReward} XP
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Dropdown */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <select
                      value={task.status}
                      onChange={(e) =>
                        handleStatusChange(task.id, e.target.value as 'todo' | 'in_progress' | 'completed')
                      }
                      className="px-2.5 py-1 text-xs bg-slate-950 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>

                    <button
                      onClick={() => {
                        setEditingTask(task);
                        setIsModalOpen(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Task"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Delete Task"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
      />
    </div>
  );
};
