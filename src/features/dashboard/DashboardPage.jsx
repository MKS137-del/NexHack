import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/context/AuthContext';
import { INITIAL_COURSES, INITIAL_ACHIEVEMENTS } from '../../lib/mockData';
import {
  Flame,
  Sparkles,
  Clock,
  BookOpen,
  PlusCircle,
  Play,
  CheckCircle2,
  Trophy,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';

export function DashboardPage() {
  const { profile } = useAuth();
  const [courses, setCourses] = useState([]);
  const [completedLessons, setCompletedLessons] = useState(new Set(['l-101'])); // 1 completed by default

  useEffect(() => {
    // Read courses from storage or fallback to curated seed fixtures
    try {
      const stored = localStorage.getItem('nexhack_courses');
      if (stored) {
        setCourses(JSON.parse(stored));
      } else {
        setCourses(INITIAL_COURSES);
        localStorage.setItem('nexhack_courses', JSON.stringify(INITIAL_COURSES));
      }

      const storedCompletions = localStorage.getItem('nexhack_completions');
      if (storedCompletions) {
        setCompletedLessons(new Set(JSON.parse(storedCompletions)));
      }
    } catch (err) {
      setCourses(INITIAL_COURSES);
    }
  }, []);

  const xp = profile?.xp || 250;
  const level = profile?.level || 2;
  const streak = profile?.current_streak || 3;
  const totalStudySeconds = profile?.total_study_time || 5400; // 90 min
  const studyHours = (totalStudySeconds / 3600).toFixed(1);

  // Level formula: Next level threshold = (level)^2 * 100
  const currentLevelFloor = Math.pow(level - 1, 2) * 100;
  const nextLevelCeil = Math.pow(level, 2) * 100;
  const levelProgress = Math.min(
    100,
    Math.max(0, Math.round(((xp - currentLevelFloor) / (nextLevelCeil - currentLevelFloor)) * 100))
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-brand-900/60 via-slate-900 to-indigo-950/40 border border-brand-500/20 p-6 sm:p-8 backdrop-blur-sm shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-brand-500/20 border border-brand-500/30 text-brand-300 text-xs font-semibold">
                Level {level} Scholar
              </span>
              <span className="text-xs text-slate-400">NexHack Active Session</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Keep the streak going, {profile?.display_name || profile?.username || 'Learner'}!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
              You are currently on a <span className="text-orange-400 font-semibold">{streak}-day learning streak</span>.
              Log a study session or finish a video lesson today to protect your rank.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/timer"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold shadow-lg shadow-brand-500/25 transition-all"
            >
              <Clock className="w-4 h-4" />
              <span>Start Timer</span>
            </Link>
            <Link
              to="/courses"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-sm font-medium transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-brand-400" />
              <span>Import Course</span>
            </Link>
          </div>
        </div>

        {/* Level Progress Bar in Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800/80">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5 font-medium">
            <span className="flex items-center gap-1.5 text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              XP to Level {level + 1}
            </span>
            <span>
              {xp} / {nextLevelCeil} XP ({levelProgress}%)
            </span>
          </div>
          <div className="w-full bg-slate-800/80 rounded-full h-2 overflow-hidden ring-1 ring-slate-700/50">
            <div
              className="bg-gradient-to-r from-brand-500 via-indigo-400 to-amber-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* 4 Stat Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total XP */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Total XP</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{xp.toLocaleString()}</div>
            <p className="text-[11px] text-slate-400 mt-0.5">+50 XP per lesson finished</p>
          </div>
        </div>

        {/* Current Streak */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Daily Streak</span>
            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400">
              <Flame className="w-4 h-4 fill-orange-500/20" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{streak} Days</div>
            <p className="text-[11px] text-orange-400/90 mt-0.5">Active today • Keep it up</p>
          </div>
        </div>

        {/* Verified Study Hours */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Study Time</span>
            <div className="p-2 rounded-lg bg-brand-500/10 text-brand-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{studyHours} hrs</div>
            <p className="text-[11px] text-slate-400 mt-0.5">Clocked via study timer</p>
          </div>
        </div>

        {/* Completed Lessons */}
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/70 border border-slate-800/90 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-medium uppercase tracking-wider">Completed Lessons</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white tracking-tight">{completedLessons.size}</div>
            <p className="text-[11px] text-emerald-400/90 mt-0.5">Across enrolled courses</p>
          </div>
        </div>
      </div>

      {/* Main Grid: Active Courses + Gamification Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Enrolled Courses (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-brand-400" />
              <span>Active Courses</span>
            </h2>
            <Link
              to="/courses"
              className="text-xs text-brand-400 hover:text-brand-300 font-semibold flex items-center gap-1 transition-colors"
            >
              <span>View all courses</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {courses.slice(0, 4).map((course) => {
              const lessons = course.lessons || [];
              const completedCount = lessons.filter((l) => completedLessons.has(l.id)).length;
              const percent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

              return (
                <div
                  key={course.id}
                  className="group rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-video w-full overflow-hidden bg-slate-800">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className="absolute bottom-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded bg-black/60 text-slate-200 backdrop-blur-sm">
                      {course.channel_title}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h3 className="font-semibold text-sm text-white line-clamp-1 group-hover:text-brand-300 transition-colors">
                        {course.title}
                      </h3>
                      <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {course.description}
                      </p>
                    </div>

                    <div className="space-y-2 pt-2 border-t border-slate-800/80">
                      <div className="flex justify-between text-xs text-slate-400">
                        <span>Progress</span>
                        <span className="font-semibold text-slate-200">
                          {completedCount}/{lessons.length} lessons ({percent}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-brand-500 h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${percent}%` }}
                        />
                      </div>

                      <Link
                        to={`/courses/${course.id}`}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-200 text-xs font-semibold transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>Continue Studying</span>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Milestones & Badges Sidebar (1 Col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-400" />
              <span>Milestones</span>
            </h2>
            <Link to="/profile" className="text-xs text-brand-400 hover:text-brand-300 font-semibold">
              See all
            </Link>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            {INITIAL_ACHIEVEMENTS.slice(0, 4).map((ach) => (
              <div
                key={ach.id}
                className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60"
              >
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                  <Trophy className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-semibold text-slate-200 truncate">{ach.title}</h4>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                      +{ach.xp_reward} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{ach.description}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Quick Study Prompt Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-brand-900/40 to-slate-900 border border-brand-500/20 text-xs text-slate-300 space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-brand-400" />
              <span>Ready for a study sprint?</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Launch a 25-minute Pomodoro timer. Your time is verified and directly earns study XP.
            </p>
            <Link
              to="/timer"
              className="inline-flex items-center gap-1.5 font-semibold text-brand-400 hover:text-brand-300 pt-1"
            >
              <span>Open Study Timer</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
