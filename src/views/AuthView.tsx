import React, { useState } from 'react';
import { Flame, Shield, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext.tsx';

export const AuthView: React.FC = () => {
  const { login, register, loginDemo } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password || (isRegister && !name)) {
      setError('Please fill in all required fields.');
      return;
    }

    try {
      setIsLoading(true);
      if (isRegister) {
        await register({
          email,
          password,
          name,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
        });
      } else {
        await login(email, password);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemo = async () => {
    try {
      setIsLoading(true);
      setError('');
      await loginDemo();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Demo login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
      {/* Background glow effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md p-6 sm:p-8 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl backdrop-blur-xl">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 shadow-lg shadow-purple-600/30 text-white mb-3">
            <Flame className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            AuraHabit
          </h1>
          <p className="text-xs text-purple-300 font-medium mt-1">
            {isRegister ? 'Begin Your Gamified Odyssey' : 'Resume Your Daily Quest'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {isRegister && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Display Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Alex Vance"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Email Address *
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="warrior@aurahabit.io"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">
              Password *
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 text-sm"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 transition-transform active:scale-95 disabled:opacity-50"
          >
            <span>{isLoading ? 'Authenticating...' : isRegister ? 'Forge Account & Enter' : 'Enter Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Fast Track Button */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <button
            type="button"
            onClick={handleDemo}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-xs font-semibold text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-xl transition-colors"
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Instant Access: Alex Vance (Demo Champion)</span>
          </button>
        </div>

        {/* Switch between Login and Register */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError('');
            }}
            className="text-xs text-slate-400 hover:text-purple-300 transition-colors"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account yet? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};
