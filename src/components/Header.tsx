import React, { useState } from 'react';
import { Bell, Sparkles, User, Settings, LogOut, CheckCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';
import { StreakWidget } from './StreakWidget.tsx';

interface HeaderProps {
  onNavigate: (view: string) => void;
  currentView: string;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate }) => {
  const { user, levelInfo, streakInfo, logout } = useAuth();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Time-of-day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Formatted date
  const todayFormatted = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date());

  const notifications = [
    { id: '1', title: 'Daily Quest Active', desc: 'Complete 3 tasks to keep your 5-day streak alive!', time: 'Today' },
    { id: '2', title: 'Level 4 Unlocked', desc: 'You reached Focus Knight rank. Keep pushing!', time: 'Yesterday' },
  ];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-4 px-4 sm:px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Left: Greeting & Current Date */}
      <div className="flex flex-col min-w-0">
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-bold text-white truncate">
            {getGreeting()}, <span className="text-purple-400">{user?.name ? user.name.split(' ')[0] : 'Hero'}</span>
          </h1>
        </div>
        <div className="text-xs text-slate-400 font-medium">
          {todayFormatted}
        </div>
      </div>

      {/* Right: Level & XP, Streak Widget, Notifications, and Profile */}
      <div className="flex items-center gap-3 sm:gap-4 shrink-0">
        {/* Level & XP Capsule */}
        {levelInfo && (
          <div
            onClick={() => onNavigate('achievements')}
            className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 bg-slate-900 border border-slate-800 hover:border-purple-500/40 rounded-xl cursor-pointer transition-colors"
            title="View Achievements & XP Progression"
          >
            <div className="flex items-center gap-1 text-xs font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Lv.{levelInfo.level}</span>
            </div>

            <div className="flex flex-col w-20">
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-indigo-400"
                  style={{ width: `${levelInfo.progressPercentage}%` }}
                />
              </div>
            </div>

            <span className="font-mono tabular-nums text-[11px] text-purple-300 font-semibold">
              {levelInfo.currentLevelXp} XP
            </span>
          </div>
        )}

        {/* Streak Widget close to profile */}
        <StreakWidget />

        {/* Notification Bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-900 rounded-xl transition-colors border border-transparent hover:border-slate-800"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-purple-500" />
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 p-3 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-semibold text-slate-200">
                <span>Notifications &amp; Activity</span>
                <span className="text-[10px] text-purple-400 flex items-center gap-1 font-normal">
                  <CheckCheck className="w-3 h-3" /> All caught up
                </span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <div className="flex items-center justify-between font-medium text-slate-200 mb-0.5">
                      <span>{n.title}</span>
                      <span className="text-[10px] text-slate-500">{n.time}</span>
                    </div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">{n.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar Menu */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1 rounded-full border border-slate-800 hover:border-purple-500/50 transition-colors focus-visible:outline-none"
          >
            <img
              src={user?.avatar || '/src/assets/images/avatar_default_warrior_1793290647823.jpg'}
              alt={user?.name || 'User Profile'}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover"
            />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-52 py-1 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl z-40 text-xs animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3.5 py-2.5 border-b border-slate-800">
                <div className="font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-slate-400 truncate font-mono">{user?.email}</div>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  onNavigate('profile');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Account &amp; Goal Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-rose-400 hover:bg-slate-800 hover:text-rose-300 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
