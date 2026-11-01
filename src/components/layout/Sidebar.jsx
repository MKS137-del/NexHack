import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Timer,
  Users,
  Trophy,
  BarChart3,
  User,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { isSupabaseConfigured } from '../../lib/supabase';

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', label: 'My Courses', icon: BookOpen },
  { to: '/timer', label: 'Study Timer', icon: Timer },
  { to: '/groups', label: 'Study Groups', icon: Users },
  { to: '/leaderboard', label: 'Leaderboards', icon: Trophy },
  { to: '/insights', label: 'Insights', icon: BarChart3 },
  { to: '/profile', label: 'Profile', icon: User },
];

export function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-slate-800 bg-slate-900/50 backdrop-blur-sm min-h-[calc(100vh-4rem)] p-4 justify-between">
      <div className="space-y-1">
        <p className="px-3 pb-2 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Study Navigation
        </p>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Banner */}
      <div className="pt-4 border-t border-slate-800/80">
        <div className="p-3 rounded-lg bg-slate-850/80 border border-slate-800 text-xs">
          <div className="flex items-center gap-2 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${
                isSupabaseConfigured ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="font-semibold text-slate-300">
              {isSupabaseConfigured ? 'Supabase Connected' : 'Local Mock Mode'}
            </span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            {isSupabaseConfigured
              ? 'Real-time PostgreSQL RLS active'
              : 'Zero-config local persistence active for hackathon preview.'}
          </p>
        </div>
      </div>
    </aside>
  );
}
