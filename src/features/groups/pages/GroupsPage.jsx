import React from 'react';
import { INITIAL_GROUPS } from '../../../lib/mockData';
import { Users, Lock, Globe, Plus, Shield } from 'lucide-react';

export function GroupsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>Study Groups</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Collaborate, maintain daily accountability, and compete with peers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => alert('Stage 7 brings full group creation & invite code joining!')}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {INITIAL_GROUPS.map((grp) => (
          <div
            key={grp.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="flex items-start gap-3">
              <img
                src={grp.avatar_url}
                alt={grp.name}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-slate-700 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <h3 className="font-semibold text-base text-white truncate">{grp.name}</h3>
                  {grp.is_private ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" title="Private Group" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" title="Public Group" />
                  )}
                </div>
                <span className="text-xs text-slate-400">{grp.member_count} active members</span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">{grp.description}</p>

            <button
              onClick={() => alert(`Joined ${grp.name}!`)}
              className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              {grp.is_private ? 'Join with Invite Code' : 'Join Public Group'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
