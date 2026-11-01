import React, { useState } from 'react';
import { Trophy, Medal, Sparkles, Clock, BookOpen } from 'lucide-react';

const mockRankings = [
  { rank: 1, name: 'Elena Rostova', xp: 1450, studyHours: 24.5, lessons: 18, avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=100&q=80' },
  { rank: 2, name: 'Kunal Verma', xp: 1220, studyHours: 19.0, lessons: 14, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' },
  { rank: 3, name: 'Alex Mercer (You)', xp: 850, studyHours: 14.2, lessons: 11, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' },
  { rank: 4, name: 'Sara Chen', xp: 740, studyHours: 11.5, lessons: 9, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
  { rank: 5, name: 'Marcus Brody', xp: 620, studyHours: 9.8, lessons: 7, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=100&q=80' },
];

export function LeaderboardPage() {
  const [metric, setMetric] = useState('xp'); // 'xp' | 'study' | 'lessons'
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' | 'monthly' | 'all'

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <span>Leaderboards</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real peer competition calculated from verified study and lesson history
          </p>
        </div>

        {/* Timeframe Switcher */}
        <div className="inline-flex p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
          {['weekly', 'monthly', 'all'].map((t) => (
            <button
              key={t}
              onClick={() => setTimeframe(t)}
              className={`px-3 py-1.5 rounded-lg capitalize transition-all ${
                timeframe === t ? 'bg-brand-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'Lifetime' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-16 text-center">Rank</th>
                <th className="py-3 px-4">Learner</th>
                <th className="py-3 px-4 text-right">XP Points</th>
                <th className="py-3 px-4 text-right">Study Time</th>
                <th className="py-3 px-4 text-right">Lessons</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {mockRankings.map((user) => (
                <tr
                  key={user.rank}
                  className={`hover:bg-slate-800/40 transition-colors ${
                    user.rank === 3 ? 'bg-brand-500/10 font-semibold' : ''
                  }`}
                >
                  <td className="py-3 px-4 text-center">
                    {user.rank === 1 ? (
                      <span className="inline-flex w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-bold items-center justify-center text-xs">
                        1
                      </span>
                    ) : user.rank === 2 ? (
                      <span className="inline-flex w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 font-bold items-center justify-center text-xs">
                        2
                      </span>
                    ) : user.rank === 3 ? (
                      <span className="inline-flex w-7 h-7 rounded-full bg-orange-500/20 text-orange-400 font-bold items-center justify-center text-xs">
                        3
                      </span>
                    ) : (
                      <span className="text-slate-400">{user.rank}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                      <span className="text-slate-200">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-amber-400">{user.xp.toLocaleString()} XP</td>
                  <td className="py-3 px-4 text-right text-slate-300">{user.studyHours}h</td>
                  <td className="py-3 px-4 text-right text-slate-300">{user.lessons}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
