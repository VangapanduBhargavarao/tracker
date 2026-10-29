import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import confetti from 'canvas-confetti';
import { User, LevelInfo, StreakInfo, Achievement } from '../types/index.ts';
import { api, getStoredToken, clearStoredToken } from '../services/api.ts';
import { soundManager } from '../utils/audio.ts';

interface AuthContextType {
  user: User | null;
  levelInfo: LevelInfo | null;
  streakInfo: StreakInfo | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (payload: { email: string; password: string; name: string; avatar?: string; timezone?: string }) => Promise<void>;
  loginDemo: () => Promise<void>;
  logout: () => void;
  updateProfile: (data: { name?: string; avatar?: string; preferences?: Partial<User['preferences']> }) => Promise<void>;
  refreshUserData: () => Promise<void>;
  setLevelInfo: React.Dispatch<React.SetStateAction<LevelInfo | null>>;
  setStreakInfo: React.Dispatch<React.SetStateAction<StreakInfo | null>>;
  activeLevelUp: number | null;
  closeLevelUp: () => void;
  activeAchievement: Achievement | null;
  closeAchievement: () => void;
  triggerLevelUp: (level: number) => void;
  triggerAchievement: (ach: Achievement) => void;
  triggerConfetti: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [streakInfo, setStreakInfo] = useState<StreakInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [activeLevelUp, setActiveLevelUp] = useState<number | null>(null);
  const [activeAchievement, setActiveAchievement] = useState<Achievement | null>(null);

  const triggerConfetti = useCallback(() => {
    try {
      confetti({
        particleCount: 70,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#A855F7', '#3B82F6', '#10B981', '#F59E0B'],
      });
    } catch {
      // Ignore if canvas-confetti fails
    }
  }, []);

  const triggerLevelUp = useCallback((level: number) => {
    setActiveLevelUp(level);
    soundManager.playLevelUp();
    try {
      confetti({
        particleCount: 120,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#F59E0B', '#EAB308', '#A855F7', '#3B82F6'],
      });
    } catch {
      // Ignore
    }
  }, []);

  const triggerAchievement = useCallback((ach: Achievement) => {
    setActiveAchievement(ach);
    soundManager.playComplete();
    try {
      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.65 },
        colors: ['#8B5CF6', '#EC4899', '#3B82F6'],
      });
    } catch {
      // Ignore
    }
  }, []);

  const refreshUserData = useCallback(async () => {
    try {
      const data = await api.getMe();
      setUser(data.user);
      setLevelInfo(data.levelInfo);
      setStreakInfo(data.streakInfo);
      if (data.user.preferences) {
        soundManager.setEnabled(Boolean(data.user.preferences.soundEnabled));
        if (data.user.preferences.theme === 'light') {
          document.documentElement.classList.remove('dark');
        } else {
          document.documentElement.classList.add('dark');
        }
      }
    } catch (err) {
      console.warn('Failed to refresh user data:', err);
      clearStoredToken();
      setUser(null);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      const token = getStoredToken();
      if (token) {
        await refreshUserData();
      } else {
        // Auto-login to demo account so user is instantly welcomed to full dashboard experience
        try {
          const res = await api.loginDemo();
          setUser(res.user);
          setLevelInfo(res.levelInfo);
          setStreakInfo(res.streakInfo);
        } catch (e) {
          console.warn('Demo login initialization notice:', e);
        }
      }
      setIsLoading(false);
    };
    init();
  }, [refreshUserData]);

  const login = async (email: string, pass: string) => {
    const res = await api.login(email, pass);
    setUser(res.user);
    setLevelInfo(res.levelInfo);
    setStreakInfo(res.streakInfo);
    if (res.user.preferences) {
      soundManager.setEnabled(Boolean(res.user.preferences.soundEnabled));
    }
  };

  const register = async (payload: { email: string; password: string; name: string; avatar?: string; timezone?: string }) => {
    const res = await api.register(payload);
    setUser(res.user);
    setLevelInfo(res.levelInfo);
    setStreakInfo(res.streakInfo);
  };

  const loginDemo = async () => {
    const res = await api.loginDemo();
    setUser(res.user);
    setLevelInfo(res.levelInfo);
    setStreakInfo(res.streakInfo);
  };

  const logout = () => {
    clearStoredToken();
    setUser(null);
    setLevelInfo(null);
    setStreakInfo(null);
  };

  const updateProfile = async (data: { name?: string; avatar?: string; preferences?: Partial<User['preferences']> }) => {
    const res = await api.updateProfile(data);
    setUser(res.user);
    setLevelInfo(res.levelInfo);
    setStreakInfo(res.streakInfo);
    if (res.user.preferences) {
      soundManager.setEnabled(Boolean(res.user.preferences.soundEnabled));
      if (res.user.preferences.theme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        levelInfo,
        streakInfo,
        isLoading,
        login,
        register,
        loginDemo,
        logout,
        updateProfile,
        refreshUserData,
        setLevelInfo,
        setStreakInfo,
        activeLevelUp,
        closeLevelUp: () => setActiveLevelUp(null),
        activeAchievement,
        closeAchievement: () => setActiveAchievement(null),
        triggerLevelUp,
        triggerAchievement,
        triggerConfetti,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
