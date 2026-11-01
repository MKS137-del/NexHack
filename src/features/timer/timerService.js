/**
 * Study Timer Service
 * Manages verified study sessions, wall-clock calculations,
 * anti-tampering duration checks, and XP awards.
 * Provides user-scoped persistence and data isolation.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { awardXP } from '../gamification/gamificationService.js';
import { getActiveUserId } from '../courses/courseService.js';

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

function getStudySessionsKey(userId) {
  const uid = userId || getActiveUserId();
  return uid ? `nexhack_${uid}_study_sessions` : 'nexhack_study_sessions';
}

function getActiveTimerKey(userId) {
  const uid = userId || getActiveUserId();
  return uid ? `nexhack_${uid}_active_timer` : 'nexhack_active_timer';
}

/**
 * Saves active session state for crash / tab-close recovery
 */
export function persistActiveTimerState(state, userId = null) {
  const key = getActiveTimerKey(userId);
  if (!state) {
    safeStorage.removeItem(key);
  } else {
    safeStorage.setItem(key, JSON.stringify(state));
  }
}

/**
 * Restores active session state if recovering from tab close or reload
 */
export function restoreActiveTimerState(userId = null) {
  const raw = safeStorage.getItem(getActiveTimerKey(userId));
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
export function clearActiveTimerState(userId = null) {
  safeStorage.removeItem(getActiveTimerKey(userId));
}

/**
 * Retrieves past study sessions scoped per user
 */
export async function getStudySessions(userId = null) {
  let sessions = [];
  const uid = userId || getActiveUserId();

  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      const effectiveUid = uid || user?.id;

      if (effectiveUid) {
        const { data, error } = await supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', effectiveUid)
          .order('end_time', { ascending: false })
          .limit(50);

        if (!error && data && data.length > 0) {
          return data;
        }
      }
    } catch {
      // fallback
    }
  }

  const raw = safeStorage.getItem(getStudySessionsKey(uid));
  if (raw) {
    try {
      sessions = JSON.parse(raw);
    } catch {
      sessions = [];
    }
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
  userId = null,
}) {
  const uid = userId || getActiveUserId();
  const nowMs = Date.now();
  const startMs = new Date(startedAt).getTime();
  const rawEndMs = new Date(endedAt).getTime();

  if (isNaN(startMs) || isNaN(rawEndMs) || startMs > nowMs + 5000) {
    clearActiveTimerState(uid);
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
    clearActiveTimerState(uid);
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
      userId: uid,
    });
  }

  const sessionRecord = {
    id: `sess-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    user_id: uid,
    course_id: courseId,
    course_title: courseTitle,
    lesson_id: lessonId,
    mode,
    started_at: startedAt,
    ended_at: endedAt,
    start_time: startedAt,
    end_time: endedAt,
    duration_seconds: verifiedDurationSeconds,
    xp_earned: totalXPEarned,
    is_verified: true,
  };

  // Save to local sessions
  const key = getStudySessionsKey(uid);
  const raw = safeStorage.getItem(key);
  let existing = [];
  try {
    existing = raw ? JSON.parse(raw) : [];
  } catch {
    existing = [];
  }
  safeStorage.setItem(key, JSON.stringify([sessionRecord, ...existing]));

  // Clear active timer state
  clearActiveTimerState(uid);

  // If Supabase is connected, insert record & update profile total_study_time
  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      const remoteUid = uid || user?.id;
      if (remoteUid) {
        await supabase.from('study_sessions').insert({
          user_id: remoteUid,
          course_id: courseId,
          course_title: courseTitle,
          timer_mode: mode,
          start_time: startedAt,
          end_time: endedAt,
          duration_seconds: verifiedDurationSeconds,
          xp_earned: totalXPEarned,
          status: 'completed',
        });

        const { data: prof } = await supabase
          .from('profiles')
          .select('total_study_time')
          .eq('id', remoteUid)
          .single();

        const currentStudy = prof?.total_study_time || 0;
        await supabase
          .from('profiles')
          .update({ total_study_time: currentStudy + verifiedDurationSeconds })
          .eq('id', remoteUid);
      }
    } catch (err) {
      console.warn('Supabase study session sync notice:', err);
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
