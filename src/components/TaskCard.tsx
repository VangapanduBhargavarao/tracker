import React from 'react';
import { CheckCircle2, Circle, Clock, Flame, MoreVertical, Edit2, Trash2, ArrowRightCircle, ArrowLeftCircle } from 'lucide-react';
import { Task } from '../types/index.ts';

interface TaskCardProps {
  task: Task;
  onStatusChange: (id: string, status: 'todo' | 'in_progress' | 'completed') => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onStatusChange, onEdit, onDelete }) => {
  const [showMenu, setShowMenu] = React.useState(false);

  const priorityColor = {
    High: 'text-rose-400',
    Medium: 'text-amber-400',
    Low: 'text-blue-400',
  }[task.priority] || 'text-slate-400';

  const categoryColor = {
    Work: 'text-purple-400',
    Learning: 'text-indigo-400',
    Fitness: 'text-emerald-400',
    Health: 'text-teal-400',
    Personal: 'text-pink-400',
    Finance: 'text-amber-400',
  }[task.category] || 'text-slate-400';

  const isCompleted = task.status === 'completed';
  const isInProgress = task.status === 'in_progress';

  return (
    <div
      className={`group relative p-4 rounded-xl border transition-all duration-200 ${
        isCompleted
          ? 'bg-slate-900/40 border-slate-800/80 opacity-75 hover:opacity-100'
          : isInProgress
          ? 'bg-slate-900/90 border-purple-500/30 hover:border-purple-500/60 shadow-lg shadow-purple-950/20'
          : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Checkbox / Quick Toggle */}
        <button
          onClick={() => onStatusChange(task.id, isCompleted ? 'todo' : 'completed')}
          className="mt-0.5 text-slate-500 hover:text-purple-400 transition-colors shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400 rounded"
          title={isCompleted ? 'Mark as incomplete' : 'Mark as completed'}
        >
          {isCompleted ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 fill-emerald-500/20" />
          ) : (
            <Circle className="w-5 h-5" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4
            className={`text-sm font-semibold text-slate-100 leading-snug transition-colors ${
              isCompleted ? 'line-through text-slate-400' : ''
            }`}
          >
            {task.title}
          </h4>

          {task.description && (
            <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Unboxed Metadata Discipline */}
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-slate-400">
            <span className={`font-medium ${categoryColor}`}>{task.category}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className={`font-medium ${priorityColor}`}>{task.priority} Priority</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 font-mono tabular-nums text-slate-300">
              <Clock className="w-3 h-3 text-slate-500" />
              {task.estimatedMinutes}m
            </span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="flex items-center gap-1 font-mono tabular-nums text-amber-300 font-semibold">
              <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
              +{task.xpReward} XP
            </span>
          </div>
        </div>

        {/* Dropdown Options */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded transition-colors"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute right-0 top-full mt-1 w-36 z-30 py-1 bg-slate-900 border border-slate-700 rounded-lg shadow-xl text-xs">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onEdit(task);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-slate-300 hover:bg-slate-800 hover:text-white"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Task</span>
              </button>
              <button
                onClick={() => {
                  setShowMenu(false);
                  onDelete(task.id);
                }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-rose-400 hover:bg-slate-800 hover:text-rose-300"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Quick Move Status Strip */}
      <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="font-mono tabular-nums text-[11px] text-slate-500">
          {task.dueTime ? `Due ${task.dueTime}` : `Due ${task.dueDate}`}
        </span>

        <div className="flex items-center gap-1">
          {task.status !== 'todo' && (
            <button
              onClick={() => onStatusChange(task.id, 'todo')}
              className="px-2 py-0.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded transition-colors"
              title="Move to To Do"
            >
              To Do
            </button>
          )}

          {task.status !== 'in_progress' && (
            <button
              onClick={() => onStatusChange(task.id, 'in_progress')}
              className="px-2 py-0.5 text-[11px] font-medium text-purple-300 hover:text-purple-100 hover:bg-purple-950/50 rounded border border-purple-500/20 transition-colors"
              title="Move to In Progress"
            >
              In Progress
            </button>
          )}

          {task.status !== 'completed' && (
            <button
              onClick={() => onStatusChange(task.id, 'completed')}
              className="px-2 py-0.5 text-[11px] font-medium text-emerald-300 hover:text-emerald-100 hover:bg-emerald-950/50 rounded border border-emerald-500/20 transition-colors"
              title="Complete Task"
            >
              Complete
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
