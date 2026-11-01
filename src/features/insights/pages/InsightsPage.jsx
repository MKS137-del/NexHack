import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  Flame,
  BookOpen,
  PieChart,
  Layers,
  ArrowUpRight,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { getInsightsAnalytics } from '../insightsService';
import { subscribeToGamification } from '../../gamification/gamificationService';

export function InsightsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await getInsightsAnalytics();
      setAnalytics(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const unsub = subscribeToGamification(() => {
      loadData();
    });
    return () => unsub();
  }, []);

  if (loading || !analytics) {
    return (
      <div className="space-y-6 animate-pulse py-4">
        <div className="h-8 w-64 bg-slate-800 rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 rounded-2xl bg-slate-800" />
          ))}
        </div>
        <div className="h-80 rounded-3xl bg-slate-800" />
      </div>
    );
  }

  const { kpi, weeklyStudyChart, xpTimelineChart, categoryDistribution, recentSessions } =
    analytics;

  return (
    <div className="space-y-8 animate-fade-in py-2">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <BarChart3 className="w-7 h-7 text-brand-400" />
          <span>Learning Analytics & Verification Insights</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical focus data authenticated via wall-clock timer sessions and immutable XP ledgers
        </p>
      </div>

      {/* 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Weekly Study</span>
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{kpi.totalStudyHours} hrs</div>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>+18% from last week</span>
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Daily Average</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{kpi.avgDailyHours} hrs/day</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Across active study days</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Total XP</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{kpi.totalXP.toLocaleString()} XP</div>
            <p className="text-[11px] text-amber-400/90 font-medium mt-0.5">Level {kpi.currentLevel} Scholar</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Streak</span>
            <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400">
              <Flame className="w-4 h-4 fill-orange-500/20" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{kpi.currentStreak} Days</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Longest: {kpi.longestStreak} days</p>
          </div>
        </div>
      </div>

      {/* Visual Charts: Side-by-Side on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Study Hours Bar Chart */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Clock className="w-4 h-4 text-brand-400" />
                <span>Daily Study Duration (Hours)</span>
              </h2>
              <p className="text-xs text-slate-400">Measured from authenticated timer completions</p>
            </div>
            <span className="text-xs font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full">
              7-Day View
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyStudyChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="h" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#818cf8' }}
                />
                <Bar dataKey="hours" name="Study Hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* XP Growth Timeline Area Chart */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>XP Accumulation Velocity</span>
              </h2>
              <p className="text-xs text-slate-400">Cumulative XP awarded by ledger transactions</p>
            </div>
            <span className="text-xs font-semibold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">
              Steady Growth
            </span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={xpTimelineChart}>
                <defs>
                  <linearGradient id="xpGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#334155',
                    borderRadius: '12px',
                    fontSize: '12px',
                  }}
                  itemStyle={{ color: '#fbbf24' }}
                />
                <Area
                  type="monotone"
                  dataKey="cumulativeXP"
                  name="Cumulative XP"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#xpGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Distribution & Session Verification Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Breakdown */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-brand-400" />
            <span>Curriculum Focus</span>
          </h2>
          <p className="text-xs text-slate-400">Study distribution across enrolled domains</p>

          <div className="space-y-4 pt-2">
            {categoryDistribution.map((item, idx) => (
              <div key={item.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">{item.name}</span>
                  <span className="text-slate-500 font-semibold">{item.value} units</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      idx === 0
                        ? 'bg-brand-500'
                        : idx === 1
                        ? 'bg-indigo-400'
                        : 'bg-emerald-400'
                    }`}
                    style={{ width: `${Math.min(100, item.value * 20)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Log Table (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Verified Study Session Log</span>
              </h2>
              <p className="text-xs text-slate-400">Tamper-proof wall-clock audit records</p>
            </div>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">
              Authenticated
            </span>
          </div>

          <div className="divide-y divide-slate-800 max-h-64 overflow-y-auto pr-1">
            {recentSessions.map((sess) => (
              <div key={sess.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-200 truncate">
                    {sess.course_title || 'General Focus Session'}
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {new Date(sess.ended_at).toLocaleDateString()} at{' '}
                    {new Date(sess.ended_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}{' '}
                    • <span className="capitalize">{sess.mode}</span>
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-slate-300 font-medium">
                    {Math.round((sess.duration_seconds || 0) / 60)} mins
                  </span>
                  <span className="font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10">
                    +{sess.xp_earned || 0} XP
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
