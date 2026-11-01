import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Flame,
  Coffee,
  BookOpen,
  Award,
  Layers,
  History,
  Check,
} from 'lucide-react';
import { getCourses } from '../../courses/courseService';
import {
  verifyAndSaveSession,
  getStudySessions,
  persistActiveTimerState,
  restoreActiveTimerState,
  clearActiveTimerState,
} from '../timerService';

const POMODORO_DURATIONS = {
  pomodoro: 25 * 60,
  shortBreak: 5 * 60,
  longBreak: 15 * 60,
};

export function TimerPage() {
  const [searchParams] = useSearchParams();
  const preselectedCourseId = searchParams.get('courseId');

  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId || '');
  const [mode, setMode] = useState('pomodoro'); // 'pomodoro' | 'shortBreak' | 'longBreak' | 'manual'
  const [isRunning, setIsRunning] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0); // For manual or active focus
  const [secondsRemaining, setSecondsRemaining] = useState(POMODORO_DURATIONS.pomodoro);

  const [startTime, setStartTime] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [completedSummary, setCompletedSummary] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  // Interval reference
  const timerRef = useRef(null);
  const lastTickRef = useRef(Date.now());

  // 1. Initial Load: Courses & Sessions & Recovery
  useEffect(() => {
    getCourses().then((data) => {
      setCourses(data);
      if (!selectedCourseId && data.length > 0) {
        setSelectedCourseId(preselectedCourseId || data[0].id);
      }
    });

    getStudySessions().then(setRecentSessions);

    // Attempt recovery from localStorage if user reloaded during active study
    const saved = restoreActiveTimerState();
    if (saved && saved.isRunning) {
      const now = Date.now();
      const elapsedSinceStart = Math.floor((now - new Date(saved.startedAt).getTime()) / 1000);
      setMode(saved.mode || 'pomodoro');
      setSelectedCourseId(saved.courseId || '');
      setStartTime(saved.startedAt);
      setIsRunning(true);

      if (saved.mode === 'manual') {
        setSecondsElapsed(elapsedSinceStart);
      } else {
        const totalTarget = POMODORO_DURATIONS[saved.mode] || 25 * 60;
        const remaining = Math.max(0, totalTarget - elapsedSinceStart);
        setSecondsRemaining(remaining);
      }
    }
  }, [preselectedCourseId]);

  // 2. Wall-clock resilient timer loop
  useEffect(() => {
    if (isRunning) {
      lastTickRef.current = Date.now();
      timerRef.current = setInterval(() => {
        const now = Date.now();
        const delta = Math.floor((now - lastTickRef.current) / 1000);

        if (delta >= 1) {
          lastTickRef.current = now;

          if (mode === 'manual') {
            setSecondsElapsed((prev) => prev + delta);
          } else {
            setSecondsRemaining((prev) => {
              if (prev <= delta) {
                // Timer finished!
                handleTimerFinished();
                return 0;
              }
              return prev - delta;
            });
            setSecondsElapsed((prev) => prev + delta);
          }
        }
      }, 500);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  // Handle auto-finish when Pomodoro hits 0
  const handleTimerFinished = async () => {
    setIsRunning(false);
    if (timerRef.current) clearInterval(timerRef.current);

    if (mode === 'pomodoro') {
      await logCurrentSession(true);
    }
  };

  const startTimer = () => {
    const now = new Date().toISOString();
    if (!startTime) setStartTime(now);
    setIsRunning(true);
    lastTickRef.current = Date.now();

    persistActiveTimerState({
      isRunning: true,
      mode,
      courseId: selectedCourseId,
      startedAt: startTime || now,
    });
  };

  const pauseTimer = () => {
    setIsRunning(false);
    persistActiveTimerState({
      isRunning: false,
      mode,
      courseId: selectedCourseId,
      startedAt: startTime,
    });
  };

  const resetTimer = () => {
    setIsRunning(false);
    clearActiveTimerState();
    setStartTime(null);
    setSecondsElapsed(0);
    setSecondsRemaining(POMODORO_DURATIONS[mode] || 25 * 60);
  };

  const handleModeChange = (newMode) => {
    setIsRunning(false);
    clearActiveTimerState();
    setStartTime(null);
    setSecondsElapsed(0);
    setMode(newMode);
    setSecondsRemaining(POMODORO_DURATIONS[newMode] || 0);
  };

  const logCurrentSession = async (isPomodoroComplete = false) => {
    const course = courses.find((c) => c.id === selectedCourseId);
    const courseTitle = course?.title || 'Self-Directed Study';
    const effectiveStart = startTime || new Date(Date.now() - secondsElapsed * 1000).toISOString();
    const effectiveEnd = new Date().toISOString();

    const duration = mode === 'manual' ? secondsElapsed : POMODORO_DURATIONS[mode] - secondsRemaining;

    const result = await verifyAndSaveSession({
      courseId: selectedCourseId || null,
      courseTitle,
      mode,
      startedAt: effectiveStart,
      endedAt: effectiveEnd,
      clientDurationSeconds: duration,
      isPomodoroComplete,
    });

    if (result.success) {
      setCompletedSummary(result);
      const updated = await getStudySessions();
      setRecentSessions(updated);
      resetTimer();
    } else {
      setToastMessage(result.reason || 'Session was too short to record XP (<60s).');
      setTimeout(() => setToastMessage(null), 5000);
      resetTimer();
    }
  };

  // Time formatters
  const displaySeconds = mode === 'manual' ? secondsElapsed : secondsRemaining;
  const minutes = Math.floor(displaySeconds / 60);
  const seconds = displaySeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  const currentCourse = courses.find((c) => c.id === selectedCourseId);

  // Progress percentage
  const totalTarget = POMODORO_DURATIONS[mode] || 1;
  const progressPercent =
    mode === 'manual'
      ? Math.min(100, Math.round((secondsElapsed / 3600) * 100))
      : Math.min(100, Math.max(0, Math.round(((totalTarget - secondsRemaining) / totalTarget) * 100)));

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-2">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight text-white flex items-center justify-center gap-2.5">
          <Clock className="w-7 h-7 text-brand-400" />
          <span>Verified Study Timer</span>
        </h1>
        <p className="text-sm text-slate-400 max-w-md mx-auto">
          Prevent tab-throttling with wall-clock verified intervals and earn authenticated XP rewards
        </p>
      </div>

      {/* Inline Toast Notification */}
      {toastMessage && (
        <div className="flex items-center justify-center gap-2 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-semibold animate-slide-up max-w-md mx-auto shadow-md">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Focus Control Card */}
      <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden backdrop-blur-sm">
        {/* Course Assignment Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Current Learning Goal
              </p>
              <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md">
                {currentCourse?.title || 'Self-Directed Study Focus'}
              </p>
            </div>
          </div>

          <div className="sm:w-64">
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-brand-500"
            >
              <option value="">General / Self-Directed</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex justify-center">
          <div className="inline-flex p-1.5 rounded-2xl bg-slate-950/80 border border-slate-800">
            <button
              onClick={() => handleModeChange('pomodoro')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'pomodoro'
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Pomodoro (25m)</span>
            </button>
            <button
              onClick={() => handleModeChange('shortBreak')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'shortBreak'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-emerald-300" />
              <span>Short Break (5m)</span>
            </button>
            <button
              onClick={() => handleModeChange('longBreak')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'longBreak'
                  ? 'bg-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Coffee className="w-3.5 h-3.5 text-teal-300" />
              <span>Long Break (15m)</span>
            </button>
            <button
              onClick={() => handleModeChange('manual')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === 'manual'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5 text-indigo-300" />
              <span>Stopwatch</span>
            </button>
          </div>
        </div>

        {/* Timer Display Face */}
        <div className="text-center space-y-4">
          <div className="text-7xl sm:text-8xl font-mono font-bold tracking-wider text-white select-none">
            {timeFormatted}
          </div>

          <div className="flex items-center justify-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>{isRunning ? 'Session Active • Tracking Time' : 'Session Paused'}</span>
            </span>
          </div>

          {/* Progress Indicator */}
          <div className="max-w-md mx-auto h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-brand-500 to-indigo-400 transition-all duration-500 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
          {!isRunning ? (
            <button
              onClick={startTimer}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-bold shadow-lg shadow-brand-500/25 transition-all hover:scale-102"
            >
              <Play className="w-5 h-5 fill-current" />
              <span>{secondsElapsed > 0 ? 'Resume Focus' : 'Start Focus Session'}</span>
            </button>
          ) : (
            <button
              onClick={pauseTimer}
              className="flex items-center gap-2.5 px-8 py-3.5 rounded-2xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold shadow-lg shadow-amber-500/25 transition-all"
            >
              <Pause className="w-5 h-5 fill-current" />
              <span>Pause Timer</span>
            </button>
          )}

          {secondsElapsed > 0 && (
            <button
              onClick={() => logCurrentSession(mode === 'pomodoro' && secondsRemaining === 0)}
              className="flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all"
            >
              <Check className="w-5 h-5" />
              <span>Finish & Award XP</span>
            </button>
          )}

          <button
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>

        {/* XP Rate Information */}
        <div className="flex flex-wrap items-center justify-center gap-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-amber-400">
            <Sparkles className="w-4 h-4" />
            +10 XP per 10 mins verified study
          </span>
          <span className="flex items-center gap-1.5 text-orange-400">
            <Flame className="w-4 h-4" />
            +25 XP Pomodoro completion bonus
          </span>
        </div>
      </div>

      {/* Session Completion Modal */}
      {completedSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-white">Study Session Complete!</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your focus time has been authenticated and awarded to your profile.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-[11px] text-slate-400">Verified Study Time</p>
                <p className="text-lg font-bold text-white mt-0.5">
                  {Math.round(completedSummary.verifiedDurationSeconds / 60)} mins
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-400">XP Earned</p>
                <p className="text-lg font-bold text-amber-400 mt-0.5">
                  +{completedSummary.xpEarned} XP
                </p>
              </div>
            </div>

            <button
              onClick={() => setCompletedSummary(null)}
              className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all shadow-md shadow-brand-500/25"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}

      {/* Recent Study Sessions Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <History className="w-5 h-5 text-brand-400" />
            <span>Recent Study Sessions</span>
          </h2>
          <span className="text-xs text-slate-400">Past verified sessions</span>
        </div>

        <div className="rounded-3xl bg-slate-900/80 border border-slate-800 overflow-hidden shadow-md">
          {recentSessions.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No previous sessions recorded yet. Start your first session above!
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {recentSessions.map((session) => (
                <div
                  key={session.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 gap-3 hover:bg-slate-850/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-white">
                        {session.course_title || 'General Study'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {new Date(session.ended_at).toLocaleDateString()} at{' '}
                        {new Date(session.ended_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        • <span className="capitalize">{session.mode}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-auto">
                    <span className="text-xs font-medium text-slate-300">
                      {Math.round((session.duration_seconds || 0) / 60)} mins
                    </span>
                    <span className="text-xs font-bold text-amber-400 px-2 py-0.5 rounded bg-amber-400/10">
                      +{session.xp_earned || 0} XP
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
