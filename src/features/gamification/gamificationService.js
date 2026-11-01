/**
 * Gamification Engine Service
 * Manages XP transactions, Level calculations, Daily Streaks, and Milestone Badges.
 * All XP awards are backed by an immutable transaction ledger.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { INITIAL_ACHIEVEMENTS } from '../../lib/mockData.js';

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

// Event listeners for cross-component reactive updates
const listeners = new Set();

export function subscribeToGamification(callback) {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

function notifySubscribers(event) {
  listeners.forEach((cb) => {
    try {
      cb(event);
    } catch (err) {
      console.error('Gamification listener error:', err);
    }
  });
}

/**
 * Level Formula: Level = floor(sqrt(total_xp / 100)) + 1
 */
export function calculateLevel(totalXP) {
  const xp = Math.max(0, Number(totalXP) || 0);
  const level = Math.floor(Math.sqrt(xp / 100)) + 1;
  const currentLevelFloorXP = Math.pow(level - 1, 2) * 100;
  const nextLevelFloorXP = Math.pow(level, 2) * 100;
  const xpInCurrentLevel = xp - currentLevelFloorXP;
  const xpRequiredForNext = nextLevelFloorXP - currentLevelFloorXP;
  const progressPercent = Math.min(
    100,
    Math.max(0, Math.round((xpInCurrentLevel / xpRequiredForNext) * 100))
  );

  return {
    level,
    totalXP: xp,
    currentLevelFloorXP,
    nextLevelFloorXP,
    xpInCurrentLevel,
    xpRequiredForNext,
    progressPercent,
  };
}

/**
 * Calculates updated streak based on last active date
 */
export function calculateStreak(currentStreak, lastActiveDateStr) {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];

  if (!lastActiveDateStr) {
    return { streak: 1, todayAlreadyActive: false, isNewDay: true };
  }

  const lastDate = new Date(lastActiveDateStr);
  const todayDate = new Date(todayStr);
  const diffTime = todayDate.getTime() - lastDate.getTime();
  const diffDays = Math.round(diffTime / (1000 * 3600 * 24));

  if (diffDays === 0) {
    // Already active today
    return { streak: Math.max(1, currentStreak), todayAlreadyActive: true, isNewDay: false };
  } else if (diffDays === 1) {
    // Active yesterday: increment streak
    return { streak: currentStreak + 1, todayAlreadyActive: false, isNewDay: true };
  } else {
    // Broke streak: reset to 1
    return { streak: 1, todayAlreadyActive: false, isNewDay: true };
  }
}

/**
 * Retrieves the local mock profile state
 */
export function getLocalProfile() {
  const raw = safeStorage.getItem('nexhack_mock_user');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return {
    id: 'usr-evaluator-001',
    username: 'alex_dev',
    full_name: 'Alex Rivera',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&q=80',
    total_xp: 450,
    current_level: 3,
    streak_days: 5,
    longest_streak: 7,
    last_active_date: new Date().toISOString().split('T')[0],
  };
}

/**
 * Saves updated local profile state
 */
export function saveLocalProfile(profile) {
  safeStorage.setItem('nexhack_mock_user', JSON.stringify(profile));
}

/**
 * Retrieves XP transactions ledger
 */
export function getXPTransactions() {
  const raw = safeStorage.getItem('nexhack_xp_transactions');
  if (raw) {
    try {
      return JSON.parse(raw);
    } catch {
      // fallback
    }
  }
  return [
    {
      id: 'tx-1',
      amount: 50,
      source: 'lesson_complete',
      description: 'Completed Lesson 1: Introduction to HTML5',
      created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 'tx-2',
      amount: 60,
      source: 'timer_session',
      description: 'Logged 60 minutes of deep study focus',
      created_at: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 'tx-3',
      amount: 25,
      source: 'pomodoro_bonus',
      description: 'Completed 25m Pomodoro focus sprint',
      created_at: new Date().toISOString(),
    },
  ];
}

/**
 * Awards XP to user with immutable ledger logging and level/streak advancement
 */
export async function awardXP({
  amount,
  source,
  referenceId = null,
  description = 'Earned XP',
  userId = null,
}) {
  const numericAmount = Math.max(0, Math.floor(Number(amount) || 0));
  if (numericAmount <= 0) return null;

  // Strict deduplication check for lesson completion rewards
  if (source === 'lesson_complete' && referenceId) {
    const existingLedger = getXPTransactions();
    const alreadyAwarded = existingLedger.some(
      (tx) => tx.source === 'lesson_complete' && String(tx.reference_id) === String(referenceId)
    );
    if (alreadyAwarded) {
      return null;
    }
  }

  const profile = getLocalProfile();
  const currentXP = (profile.total_xp || 0) + numericAmount;
  const levelInfo = calculateLevel(currentXP);

  const streakCheck = calculateStreak(profile.streak_days || 0, profile.last_active_date);
  const updatedStreak = streakCheck.streak;
  const longestStreak = Math.max(profile.longest_streak || 0, updatedStreak);
  const todayStr = new Date().toISOString().split('T')[0];

  const updatedProfile = {
    ...profile,
    total_xp: currentXP,
    current_level: levelInfo.level,
    streak_days: updatedStreak,
    longest_streak: longestStreak,
    last_active_date: todayStr,
  };

  saveLocalProfile(updatedProfile);

  // Record in XP ledger
  const tx = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    user_id: userId || profile.id,
    amount,
    source,
    reference_id: referenceId,
    description,
    created_at: new Date().toISOString(),
  };

  const existingTxs = getXPTransactions();
  const updatedTxs = [tx, ...existingTxs];
  safeStorage.setItem('nexhack_xp_transactions', JSON.stringify(updatedTxs));

  // Check milestone badge achievements
  const unlockedBadges = await evaluateAchievements({
    totalXP: currentXP,
    streak: updatedStreak,
    profile: updatedProfile,
  });

  // Notify listeners (UI components)
  notifySubscribers({
    type: 'XP_AWARDED',
    amount,
    source,
    description,
    levelInfo,
    profile: updatedProfile,
    unlockedBadges,
  });

  // If Supabase is connected, sync remotely
  if (isSupabaseConfigured && supabase) {
    try {
      const activeUser = (await supabase.auth.getUser()).data?.user;
      if (activeUser) {
        await supabase.from('xp_transactions').insert({
          user_id: activeUser.id,
          amount,
          source,
          reference_id: referenceId,
          description,
        });
        await supabase
          .from('profiles')
          .update({
            total_xp: currentXP,
            current_level: levelInfo.level,
            streak_days: updatedStreak,
            longest_streak: longestStreak,
            last_active_date: todayStr,
          })
          .eq('id', activeUser.id);
      }
    } catch (err) {
      console.warn('Supabase remote sync deferred:', err);
    }
  }

  return {
    awardedXP: amount,
    newTotalXP: currentXP,
    levelInfo,
    unlockedBadges,
    updatedProfile,
  };
}

/**
 * Checks and awards user achievements
 */
export async function evaluateAchievements({ totalXP, streak, profile }) {
  let earnedBadges = [];
  const raw = safeStorage.getItem('nexhack_user_achievements');
  if (raw) {
    try {
      earnedBadges = JSON.parse(raw);
    } catch {
      earnedBadges = ['first_step'];
    }
  } else {
    earnedBadges = ['first_step'];
  }

  const newlyUnlocked = [];

  const checkBadge = (code) => {
    if (!earnedBadges.includes(code)) {
      earnedBadges.push(code);
      newlyUnlocked.push(code);
    }
  };

  if (totalXP >= 100) checkBadge('century_club');
  if (streak >= 3) checkBadge('streak_starter');
  if (streak >= 7) checkBadge('streak_master');

  if (newlyUnlocked.length > 0) {
    safeStorage.setItem('nexhack_user_achievements', JSON.stringify(earnedBadges));
  }

  return newlyUnlocked;
}

/**
 * Fetches all available badges merged with user unlocked status
 */
export function getAllAchievementsWithStatus() {
  let unlocked = [];
  const raw = safeStorage.getItem('nexhack_user_achievements');
  if (raw) {
    try {
      unlocked = JSON.parse(raw);
    } catch {
      unlocked = ['first_step'];
    }
  } else {
    unlocked = ['first_step'];
  }

  return INITIAL_ACHIEVEMENTS.map((badge) => {
    const code = badge.code || badge.id;
    return {
      ...badge,
      code,
      is_unlocked: unlocked.includes(code),
      unlocked_at: unlocked.includes(code) ? 'Recently Unlocked' : null,
    };
  });
}
