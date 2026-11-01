import React from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import { INITIAL_ACHIEVEMENTS } from '../../../lib/mockData';
import { User, Flame, Sparkles, Clock, BookOpen, Trophy } from 'lucide-react';

export function ProfilePage() {
  const { profile } = useAuth();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header Card */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-6">
        <img
          src={profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'}
          alt={profile?.username}
          className="w-24 h-24 rounded-2xl object-cover ring-2 ring-brand-500/40"
        />
        <div className="space-y-2 text-center sm:text-left flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{profile?.display_name || profile?.username}</h1>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-brand-500/20 text-brand-300 w-fit mx-auto sm:mx-0">
              Level {profile?.level || 1}
            </span>
          </div>
          <p className="text-xs text-slate-400">@{profile?.username} • Member since Nov 2026</p>
          <p className="text-sm text-slate-300 max-w-lg">
            Dedicated self-directed learner mastering modern full-stack web engineering through structured YouTube playlists.
          </p>
        </div>
      </div>

      {/* Badges Showcase */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Trophy className="w-5 h-5 text-amber-400" />
          <span>Unlocked Badges & Achievements</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {INITIAL_ACHIEVEMENTS.map((ach) => (
            <div key={ach.id} className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Trophy className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white">{ach.title}</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">{ach.description}</p>
                <span className="text-[10px] font-semibold text-amber-400 mt-1 inline-block">+{ach.xp_reward} XP</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
