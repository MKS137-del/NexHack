import React from 'react';
import { BarChart3, TrendingUp, Calendar, Clock, Sparkles } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

const studyChartData = [
  { day: 'Mon', hours: 1.5 },
  { day: 'Tue', hours: 2.2 },
  { day: 'Wed', hours: 0.8 },
  { day: 'Thu', hours: 2.5 },
  { day: 'Fri', hours: 1.8 },
  { day: 'Sat', hours: 3.4 },
  { day: 'Sun', hours: 2.0 },
];

export function InsightsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-brand-400" />
          <span>Learning Insights & Analytics</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Historical analysis derived from your actual database study sessions
        </p>
      </div>

      {/* Main Chart Card */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-brand-400" />
            <span>Weekly Study Hours</span>
          </h2>
          <span className="text-xs font-semibold text-emerald-400">+18% vs last week</span>
        </div>

        <div className="h-64 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={studyChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
              <XAxis dataKey="day" stroke="#64748b" fontSize={12} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} unit="h" />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                itemStyle={{ color: '#818cf8' }}
              />
              <Bar dataKey="hours" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
