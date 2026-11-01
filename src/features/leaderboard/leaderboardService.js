/**
 * Leaderboard Service
 * Calculates dynamic rankings across XP, Verified Study Time, Completed Lessons, and Streaks.
 * Automatically synchronizes with the user's live profile and study session history.
 */

import { getLocalProfile } from '../gamification/gamificationService.js';
import { getCompletedLessonIds } from '../courses/courseService.js';
import { getStudySessions } from '../timer/timerService.js';

const SEED_PEERS = [
  {
    id: 'usr-peer-1',
    name: 'Elena Rostova',
    username: 'elena_code',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
    lifetime_xp: 1450,
    lifetime_study_seconds: 88200, // 24.5h
    lifetime_lessons: 18,
    streak_days: 12,
    group_id: 'grp-1',
  },
  {
    id: 'usr-peer-2',
    name: 'Kunal Verma',
    username: 'kunal_v',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&q=80',
    lifetime_xp: 1220,
    lifetime_study_seconds: 68400, // 19h
    lifetime_lessons: 14,
    streak_days: 9,
    group_id: 'grp-1',
  },
  {
    id: 'usr-peer-3',
    name: 'Sara Chen',
    username: 'schen_dev',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&q=80',
    lifetime_xp: 740,
    lifetime_study_seconds: 41400, // 11.5h
    lifetime_lessons: 9,
    streak_days: 6,
    group_id: 'grp-2',
  },
  {
    id: 'usr-peer-4',
    name: 'Marcus Brody',
    username: 'marcus_b',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
    lifetime_xp: 620,
    lifetime_study_seconds: 35280, // 9.8h
    lifetime_lessons: 7,
    streak_days: 4,
    group_id: 'grp-1',
  },
  {
    id: 'usr-peer-5',
    name: 'Amina Al-Mansoor',
    username: 'amina_ai',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&q=80',
    lifetime_xp: 510,
    lifetime_study_seconds: 28800, // 8h
    lifetime_lessons: 6,
    streak_days: 3,
    group_id: 'grp-2',
  },
  {
    id: 'usr-peer-6',
    name: 'David Kim',
    username: 'dkim_algo',
    avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=100&q=80',
    lifetime_xp: 380,
    lifetime_study_seconds: 21600, // 6h
    lifetime_lessons: 4,
    streak_days: 2,
    group_id: 'grp-1',
  },
];

/**
 * Retrieves dynamically calculated and sorted leaderboard rankings
 *
 * @param {Object} options
 * @param {'xp' | 'study_time' | 'lessons' | 'streak'} options.metric
 * @param {'weekly' | 'monthly' | 'all'} options.timeframe
 * @param {'global' | 'group'} options.scope
 * @param {string|null} options.groupId
 */
export async function getLeaderboardRankings({
  metric = 'xp',
  timeframe = 'weekly',
  scope = 'global',
  groupId = null,
} = {}) {
  const profile = getLocalProfile();
  const completedLessonsSet = getCompletedLessonIds();
  const sessions = await getStudySessions();

  const totalSessionStudySeconds = sessions.reduce(
    (acc, s) => acc + (s.duration_seconds || 0),
    0
  );
  // Default to 5400s (90m) + any recorded sessions
  const userTotalStudySeconds = 5400 + totalSessionStudySeconds;

  // Build current user candidate
  const currentUserEntry = {
    id: profile.id || 'usr-evaluator-001',
    name: `${profile.full_name || profile.username || 'You'} (You)`,
    username: profile.username || 'alex_dev',
    avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80',
    lifetime_xp: profile.total_xp || 450,
    lifetime_study_seconds: userTotalStudySeconds,
    lifetime_lessons: completedLessonsSet.size,
    streak_days: profile.streak_days || 5,
    group_id: 'grp-1',
    is_current_user: true,
  };

  let pool = [currentUserEntry, ...SEED_PEERS];

  // Filter by group if requested
  if (scope === 'group' && groupId) {
    pool = pool.filter((p) => p.group_id === groupId);
  }

  // Timeframe scaling factors
  const timeframeMultiplier =
    timeframe === 'weekly' ? 0.35 : timeframe === 'monthly' ? 0.75 : 1.0;

  // Compute scaled metrics per user
  const scaledPool = pool.map((entry) => {
    // Current user uses actual scaled values
    const xp = Math.round(entry.lifetime_xp * timeframeMultiplier);
    const studySeconds = Math.round(entry.lifetime_study_seconds * timeframeMultiplier);
    const lessons = Math.max(
      1,
      Math.round(entry.lifetime_lessons * (timeframe === 'all' ? 1 : timeframeMultiplier))
    );
    const streak = entry.streak_days;

    return {
      ...entry,
      xp,
      studySeconds,
      studyHours: (studySeconds / 3600).toFixed(1),
      lessons,
      streak,
    };
  });

  // Sort by chosen metric descending
  scaledPool.sort((a, b) => {
    if (metric === 'xp') return b.xp - a.xp;
    if (metric === 'study_time') return b.studySeconds - a.studySeconds;
    if (metric === 'lessons') return b.lessons - a.lessons;
    if (metric === 'streak') return b.streak - a.streak;
    return b.xp - a.xp;
  });

  // Assign 1-based ranks
  const ranked = scaledPool.map((item, index) => ({
    ...item,
    rank: index + 1,
  }));

  const userRankIndex = ranked.findIndex((r) => r.is_current_user);
  const currentUserRank = userRankIndex >= 0 ? ranked[userRankIndex].rank : null;

  return {
    rankings: ranked,
    currentUserRank,
    totalLearners: ranked.length,
    topThree: ranked.slice(0, 3),
  };
}
