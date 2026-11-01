/**
 * Study Timer Service
 * Manages verified study sessions, wall-clock calculations,
 * anti-tampering duration checks, and XP awards.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { awardXP } from '../gamification/gamificationService.js';

const STUDY_SESSIONS_STORAGE_KEY = 'nexhack_study_sessions';
const ACTIVE_TIMER_STORAGE_KEY = 'nexhack_active_timer';

const memoryStore = new Map();
const safeStorage = {
  getItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        return localStorage.getItem(key);
      }
      return memoryStore.get(key) || null;
    } catch {
      return memoryStore.get(key) || null;
    }
  },
  setItem: (key, val) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(key, val);
      }
      memoryStore.set(key, String(val));
    } catch {
      memoryStore.set(key, String(val));
    }
  },
  removeItem: (key) => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key);
      }
      memoryStore.delete(key);
    } catch {
      memoryStore.delete(key);
    }
  },
};

/**
 * Saves active session state for crash / tab-close recovery
 */
export function persistActiveTimerState(state) {
  if (!state) {
    safeStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
  } else {
    safeStorage.setItem(ACTIVE_TIMER_STORAGE_KEY, JSON.stringify(state));
  }
}

/**
 * Restores active session state if recovering from tab close or reload
 */
export function restoreActiveTimerState() {
  const raw = safeStorage.getItem(ACTIVE_TIMER_STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Clears active timer state upon session completion or reset
 */
export function clearActiveTimerState() {
  safeStorage.removeItem(ACTIVE_TIMER_STORAGE_KEY);
}

/**
 * Retrieves past study sessions
 */
export async function getStudySessions() {
  let sessions = [];

  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('study_sessions')
        .select('*')
        .order('ended_at', { ascending: false })
        .limit(20);

      if (!error && data && data.length > 0) {
        return data;
      }
    } catch {
      // fallback
    }
  }

  const raw = safeStorage.getItem(STUDY_SESSIONS_STORAGE_KEY);
  if (raw) {
    try {
      sessions = JSON.parse(raw);
    } catch {
      sessions = [];
    }
  }

  // If empty, supply default seed history for demonstration
  if (sessions.length === 0) {
    sessions = [
      {
        id: 'sess-seed-1',
        course_title: 'Full Stack Modern Web Dev',
        mode: 'pomodoro',
        duration_seconds: 1500,
        xp_earned: 45, // 20 base + 25 pomodoro
        ended_at: new Date(Date.now() - 3600000 * 3).toISOString(),
      },
      {
        id: 'sess-seed-2',
        course_title: 'Python DSA & Problem Solving',
        mode: 'manual',
        duration_seconds: 2400,
        xp_earned: 40,
        ended_at: new Date(Date.now() - 3600000 * 26).toISOString(),
      },
    ];
  }

  return sessions;
}

/**
 * Verifies study session duration against wall-clock timestamps and awards XP.
 * Anti-Tampering: Rejects client claims exceeding elapsed wall-clock seconds.
 */
export async function verifyAndSaveSession({
  courseId = null,
  courseTitle = 'Self-Directed Study',
  lessonId = null,
  mode = 'manual',
  startedAt,
  endedAt,
  clientDurationSeconds,
  isPomodoroComplete = false,
}) {
  const nowMs = Date.now();
  const startMs = new Date(startedAt).getTime();
  const rawEndMs = new Date(endedAt).getTime();

  if (isNaN(startMs) || isNaN(rawEndMs) || startMs > nowMs + 5000) {
    clearActiveTimerState();
    return {
      success: false,
      reason: 'Invalid session timestamp provided.',
      verifiedDurationSeconds: 0,
      xpEarned: 0,
    };
  }

  // Cap endedAt to current time (+2s leeway) to prevent fabricating future timestamps
  const endMs = Math.min(rawEndMs, nowMs + 2000);
  const wallClockSeconds = Math.max(0, Math.floor((endMs - startMs) / 1000));

  // Anti-tamper check: Client duration cannot exceed wall-clock duration plus 5s leeway
  const verifiedDurationSeconds = Math.min(
    Math.max(0, Math.floor(Number(clientDurationSeconds) || 0)),
    wallClockSeconds + 5
  );

  // Minimum threshold: at least 60 seconds of study needed to qualify for persistence and XP
  if (verifiedDurationSeconds < 60) {
    clearActiveTimerState();
    return {
      success: false,
      reason: 'Session too brief (under 60 seconds). No XP awarded.',
      verifiedDurationSeconds,
      xpEarned: 0,
    };
  }

  // XP Rules: 10 XP per full 10 minutes (600s) + 25 bonus XP for completed Pomodoro
  const baseMinutesBlock = Math.floor(verifiedDurationSeconds / 600);
  const baseXP = baseMinutesBlock * 10;
  const pomodoroBonus = isPomodoroComplete ? 25 : 0;
  const totalXPEarned = baseXP + pomodoroBonus;

  // Award XP if > 0
  let awardedResult = null;
  if (totalXPEarned > 0) {
    const minutesRounded = Math.round(verifiedDurationSeconds / 60);
    awardedResult = await awardXP({
      amount: totalXPEarned,
      source: isPomodoroComplete ? 'pomodoro_bonus' : 'timer_session',
      referenceId: courseId || 'timer',
      description: `Logged ${minutesRounded}m of study${isPomodoroComplete ? ' (Pomodoro 25m complete)' : ''}`,
    });
  }

  const sessionRecord = {
    id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    course_id: courseId,
    course_title: courseTitle,
    lesson_id: lessonId,
    mode,
    started_at: startedAt,
    ended_at: endedAt,
    duration_seconds: verifiedDurationSeconds,
    xp_earned: totalXPEarned,
    is_verified: true,
  };

  // Save to local sessions
  const raw = safeStorage.getItem(STUDY_SESSIONS_STORAGE_KEY);
  let existing = [];
  try {
    existing = raw ? JSON.parse(raw) : [];
  } catch {
    existing = [];
  }
  safeStorage.setItem(STUDY_SESSIONS_STORAGE_KEY, JSON.stringify([sessionRecord, ...existing]));

  // Clear active timer state
  clearActiveTimerState();

  // If Supabase is connected, insert record
  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      if (user) {
        await supabase.from('study_sessions').insert({
          user_id: user.id,
          course_id: courseId,
          lesson_id: lessonId,
          mode,
          started_at: startedAt,
          ended_at: endedAt,
          duration_seconds: verifiedDurationSeconds,
          xp_earned: totalXPEarned,
        });
      }
    } catch (err) {
      console.warn('Supabase study session sync deferred:', err);
    }
  }

  return {
    success: true,
    verifiedDurationSeconds,
    xpEarned: totalXPEarned,
    awardedResult,
    session: sessionRecord,
  };
}
