import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../features/auth/context/AuthContext';
import { Flame, Sparkles, Clock, LogOut, User as UserIcon, BookOpen, Layers } from 'lucide-react';

export function Navbar() {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const xp = profile?.xp || 0;
  const level = profile?.level || 1;
  const streak = profile?.current_streak || 1;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-900/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-indigo-400 text-white shadow-lg shadow-brand-500/20 group-hover:scale-105 transition-transform">
              <Layers className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg leading-tight tracking-tight text-white group-hover:text-brand-300 transition-colors">
                NexHack
              </span>
              <span className="text-[10px] text-slate-400 font-medium -mt-0.5 tracking-wider uppercase">
                Learning OS
              </span>
            </div>
          </Link>
        </div>

        {/* User Gamification Stats Header */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Streak Flame */}
          <div
            title={`${streak} day learning streak!`}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold"
          >
            <Flame className="w-4 h-4 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{streak}d</span>
          </div>

          {/* XP Badge */}
          <div
            title={`${xp} Total XP earned`}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-semibold"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{xp.toLocaleString()} XP</span>
          </div>

          {/* Level Pill */}
          <div
            title={`Level ${level} Learner`}
            className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-bold"
          >
            <span>LVL {level}</span>
          </div>

          {/* Quick Timer Link */}
          <Link
            to="/timer"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Clock className="w-3.5 h-3.5 text-brand-400" />
            <span>Timer</span>
          </Link>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <Link
              to="/profile"
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
              title="User Profile"
            >
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.username}
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-700"
                />
              ) : (
                <div className="w-7 h-7 rounded-full bg-brand-700 flex items-center justify-center text-xs font-semibold text-white">
                  {profile?.username?.charAt(0)?.toUpperCase() || 'U'}
                </div>
              )}
              <span className="hidden md:inline text-xs font-medium text-slate-300 max-w-[100px] truncate">
                {profile?.display_name || profile?.username || 'User'}
              </span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
