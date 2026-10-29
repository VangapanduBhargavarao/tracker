/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  LayoutDashboard,
  CheckSquare,
  Repeat,
  BarChart3,
  Award,
  Settings,
} from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { LevelUpModal } from './components/LevelUpModal.tsx';
import { AchievementModal } from './components/AchievementModal.tsx';
import { DashboardView } from './views/DashboardView.tsx';
import { TasksView } from './views/TasksView.tsx';
import { HabitsView } from './views/HabitsView.tsx';
import { ProgressView } from './views/ProgressView.tsx';
import { AchievementsView } from './views/AchievementsView.tsx';
import { ProfileView } from './views/ProfileView.tsx';
import { AuthView } from './views/AuthView.tsx';

function MainApp() {
  const { user, isLoading } = useAuth();
  const [currentView, setCurrentView] = useState<'dashboard' | 'tasks' | 'habits' | 'progress' | 'achievements' | 'profile'>('dashboard');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-purple-300">Loading AuraHabit Quest Engine...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const mobileNavItems = [
    { id: 'dashboard', label: 'Home', icon: LayoutDashboard },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
    { id: 'habits', label: 'Habits', icon: Repeat },
    { id: 'progress', label: 'Stats', icon: BarChart3 },
    { id: 'achievements', label: 'Badges', icon: Award },
    { id: 'profile', label: 'Profile', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar currentView={currentView} onNavigate={(v) => setCurrentView(v as any)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <Header onNavigate={(v) => setCurrentView(v as any)} currentView={currentView} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {currentView === 'dashboard' && <DashboardView />}
          {currentView === 'tasks' && <TasksView />}
          {currentView === 'habits' && <HabitsView />}
          {currentView === 'progress' && <ProgressView />}
          {currentView === 'achievements' && <AchievementsView />}
          {currentView === 'profile' && <ProfileView />}
        </main>
      </div>

      {/* Mobile Sticky Bottom Nav Bar (conforming to the 15% mobile sticky cap rule) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 px-2 py-1.5 flex items-center justify-around">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as any)}
              className={`flex flex-col items-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
                isActive ? 'text-purple-400 font-semibold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <LevelUpModal />
      <AchievementModal />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
