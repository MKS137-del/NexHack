import React, { useState, useEffect } from 'react';
import {
  Trophy,
  Medal,
  Sparkles,
  Clock,
  BookOpen,
  Flame,
  Crown,
  Users,
  ArrowUp,
  Award,
} from 'lucide-react';
import { getLeaderboardRankings } from '../leaderboardService';
import { subscribeToGamification } from '../../gamification/gamificationService';

export function LeaderboardPage() {
  const [metric, setMetric] = useState('xp'); // 'xp' | 'study_time' | 'lessons' | 'streak'
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' | 'monthly' | 'all'
  const [rankingsData, setRankingsData] = useState({
    rankings: [],
    currentUserRank: null,
    totalLearners: 0,
    topThree: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchRankings = async () => {
    try {
      setLoading(true);
      const data = await getLeaderboardRankings({ metric, timeframe });
      setRankingsData(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRankings();
    const unsub = subscribeToGamification(() => {
      fetchRankings();
    });
    return () => unsub();
  }, [metric, timeframe]);

  const { rankings, currentUserRank, totalLearners, topThree } = rankingsData;

  // Podium order: 2nd place on left, 1st place in center, 3rd place on right
  const podium = [
    topThree[1] || null, // 2nd
    topThree[0] || null, // 1st
    topThree[2] || null, // 3rd
  ];

  return (
    <div className="space-y-8 animate-fade-in py-2">
      {/* Header & Timeframe Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <Trophy className="w-7 h-7 text-amber-400" />
            <span>Peer Leaderboards</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real peer competition calculated strictly from verified study sessions and lesson history
          </p>
        </div>

        {/* Timeframe Filter Tabs */}
        <div className="inline-flex p-1.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs font-semibold self-start sm:self-auto">
          {[
            { id: 'weekly', label: 'This Week' },
            { id: 'monthly', label: 'This Month' },
            { id: 'all', label: 'All-Time' },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTimeframe(t.id)}
              className={`px-4 py-2 rounded-xl transition-all ${
                timeframe === t.id
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'xp', label: 'Total XP Points', icon: Sparkles, color: 'text-amber-400' },
          { id: 'study_time', label: 'Verified Study Time', icon: Clock, color: 'text-brand-400' },
          { id: 'lessons', label: 'Lessons Completed', icon: BookOpen, color: 'text-emerald-400' },
          { id: 'streak', label: 'Daily Streak', icon: Flame, color: 'text-orange-400' },
        ].map((m) => {
          const Icon = m.icon;
          const isSelected = metric === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setMetric(m.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                isSelected
                  ? 'bg-slate-800 border-brand-500/80 text-white shadow-sm'
                  : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              <span>{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* User Current Rank Banner */}
      {currentUserRank && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-gradient-to-r from-brand-900/40 via-slate-900 to-amber-950/20 border border-brand-500/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 text-brand-300 font-bold flex items-center justify-center text-sm">
              #{currentUserRank}
            </div>
            <div>
              <p className="text-xs font-bold text-white">
                Your Current Placement: #{currentUserRank} of {totalLearners} Learners
              </p>
              <p className="text-[11px] text-slate-400">
                Keep studying to climb into the top 3 podium!
              </p>
            </div>
          </div>
          <span className="hidden sm:inline-flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full">
            <ArrowUp className="w-3.5 h-3.5" />
            In Competition
          </span>
        </div>
      )}

      {/* Visual Podium for Top 3 */}
      {topThree.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 sm:gap-6 pt-4 max-w-2xl mx-auto items-end text-center">
          {/* 2nd Place */}
          {podium[0] && (
            <div className="flex flex-col items-center space-y-2 order-1">
              <div className="relative">
                <img
                  src={podium[0].avatar}
                  alt={podium[0].name}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-full object-cover ring-2 ring-slate-400 shadow-lg"
                />
                <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-slate-400 text-slate-950 font-bold text-xs flex items-center justify-center shadow">
                  2
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                  {podium[0].name}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {metric === 'xp'
                    ? `${podium[0].xp} XP`
                    : metric === 'study_time'
                    ? `${podium[0].studyHours}h`
                    : metric === 'lessons'
                    ? `${podium[0].lessons} lessons`
                    : `${podium[0].streak}d`}
                </p>
              </div>
              <div className="w-full h-24 sm:h-28 rounded-t-2xl bg-slate-800/80 border-t-2 border-slate-400 flex items-center justify-center text-slate-400 text-xs font-bold">
                Silver
              </div>
            </div>
          )}

          {/* 1st Place */}
          {podium[1] && (
            <div className="flex flex-col items-center space-y-2 order-2">
              <div className="relative">
                <Crown className="w-6 h-6 text-amber-400 mx-auto mb-1 animate-bounce" />
                <img
                  src={podium[1].avatar}
                  alt={podium[1].name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover ring-4 ring-amber-400 shadow-xl"
                />
                <span className="absolute -bottom-2 -right-1 w-7 h-7 rounded-full bg-amber-400 text-amber-950 font-black text-xs flex items-center justify-center shadow">
                  1
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate max-w-[100px] sm:max-w-[150px]">
                  {podium[1].name}
                </p>
                <p className="text-xs text-amber-400 font-bold">
                  {metric === 'xp'
                    ? `${podium[1].xp} XP`
                    : metric === 'study_time'
                    ? `${podium[1].studyHours}h`
                    : metric === 'lessons'
                    ? `${podium[1].lessons} lessons`
                    : `${podium[1].streak}d`}
                </p>
              </div>
              <div className="w-full h-32 sm:h-36 rounded-t-2xl bg-gradient-to-t from-amber-500/20 to-amber-500/10 border-t-4 border-amber-400 flex items-center justify-center text-amber-300 text-xs font-bold shadow-lg">
                Champion
              </div>
            </div>
          )}

          {/* 3rd Place */}
          {podium[2] && (
            <div className="flex flex-col items-center space-y-2 order-3">
              <div className="relative">
                <img
                  src={podium[2].avatar}
                  alt={podium[2].name}
                  className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover ring-2 ring-amber-600 shadow-lg"
                />
                <span className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-amber-700 text-white font-bold text-xs flex items-center justify-center shadow">
                  3
                </span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-white truncate max-w-[90px] sm:max-w-[130px]">
                  {podium[2].name}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  {metric === 'xp'
                    ? `${podium[2].xp} XP`
                    : metric === 'study_time'
                    ? `${podium[2].studyHours}h`
                    : metric === 'lessons'
                    ? `${podium[2].lessons} lessons`
                    : `${podium[2].streak}d`}
                </p>
              </div>
              <div className="w-full h-18 sm:h-20 rounded-t-2xl bg-slate-800/80 border-t-2 border-amber-600 flex items-center justify-center text-amber-500 text-xs font-bold">
                Bronze
              </div>
            </div>
          )}
        </div>
      )}

      {/* Leaderboard Table */}
      <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider border-b border-slate-800 font-semibold text-[11px]">
              <tr>
                <th className="py-4 px-4 w-16 text-center">Rank</th>
                <th className="py-4 px-4">Learner</th>
                <th className="py-4 px-4 text-right">XP Points</th>
                <th className="py-4 px-4 text-right">Study Time</th>
                <th className="py-4 px-4 text-right">Lessons</th>
                <th className="py-4 px-4 text-right">Streak</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {rankings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    No leaderboard rankings recorded yet. Complete a study session or finish a lesson to appear on the leaderboard!
                  </td>
                </tr>
              ) : (
                rankings.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-800/40 transition-colors ${
                      user.is_current_user
                        ? 'bg-brand-600/10 border-l-4 border-l-brand-500 font-semibold'
                        : ''
                    }`}
                  >
                    <td className="py-3.5 px-4 text-center">
                      {user.rank === 1 ? (
                        <span className="inline-flex w-7 h-7 rounded-full bg-amber-500/20 text-amber-400 font-black items-center justify-center text-xs">
                          1
                        </span>
                      ) : user.rank === 2 ? (
                        <span className="inline-flex w-7 h-7 rounded-full bg-slate-400/20 text-slate-300 font-bold items-center justify-center text-xs">
                          2
                        </span>
                      ) : user.rank === 3 ? (
                        <span className="inline-flex w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 font-bold items-center justify-center text-xs">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">#{user.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-700 shrink-0"
                        />
                        <div>
                          <span className="text-slate-200 font-medium">{user.name}</span>
                          <span className="text-[10px] text-slate-500 block">@{user.username}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-amber-400">
                      {user.xp.toLocaleString()} XP
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300 font-medium">
                      {user.studyHours}h
                    </td>
                    <td className="py-3.5 px-4 text-right text-slate-300 font-medium">
                      {user.lessons}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1 text-orange-400 font-semibold">
                        <Flame className="w-3.5 h-3.5 fill-current" />
                        {user.streak}d
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
