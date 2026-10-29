import React from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  BarChart3,
  Award,
  Settings,
  Sparkles,
  LogOut,
  Flame,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const { user, levelInfo, logout } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'tasks', label: 'My Tasks', icon: CheckSquare },
    { id: 'habits', label: 'Habits', icon: Repeat },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'achievements', label: 'Achievements', icon: Award },
    { id: 'profile', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-950 border-r border-slate-800/80 p-4 shrink-0 select-none">
      {/* Brand Zone */}
      <div className="flex items-center gap-2.5 px-3 py-3 mb-6">
        <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-md shadow-purple-600/30 text-white">
          <Flame className="w-5 h-5 fill-white" />
        </div>
        <div className="flex flex-col">
          <span className="text-base font-extrabold tracking-tight text-white font-sans">
            AuraHabit
          </span>
          <span className="text-[10px] text-purple-400 font-mono uppercase tracking-wider font-semibold">
            Gamified Growth
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-purple-600/15 text-purple-200 border border-purple-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/80 border border-transparent'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-purple-400' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Level & XP Mini-Bar in Sidebar */}
      {levelInfo && (
        <div className="p-3 mb-3 bg-slate-900/80 border border-slate-800/80 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Level {levelInfo.level}</span>
            </span>
            <span className="font-mono tabular-nums text-[11px] text-purple-300">
              {levelInfo.currentLevelXp} / {levelInfo.xpForNextLevel} XP
            </span>
          </div>

          <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 transition-all duration-500"
              style={{ width: `${levelInfo.progressPercentage}%` }}
            />
          </div>

          <div className="text-[10px] text-slate-400 truncate font-medium">
            Rank: <span className="text-slate-200">{levelInfo.title}</span>
          </div>
        </div>
      )}

      {/* User profile capsule at bottom */}
      {user && (
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 px-1">
          <div
            onClick={() => onNavigate('profile')}
            className="flex items-center gap-2.5 min-w-0 cursor-pointer group"
          >
            <img
              src={user.avatar || '/src/assets/images/avatar_default_warrior_1793290647823.jpg'}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-purple-400 transition-colors shrink-0"
            />
            <div className="min-w-0">
              <div className="text-xs font-semibold text-slate-200 truncate group-hover:text-purple-300 transition-colors">
                {user.name}
              </div>
              <div className="text-[10px] text-slate-500 truncate font-mono">
                {user.email}
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
