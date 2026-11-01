// Self-checking verification test for genuine new-user defaults & data isolation
import assert from 'node:assert';
import { getLocalProfile, calculateLevel } from '../src/features/gamification/gamificationService.js';
import { getCourses, getCompletedLessonIds } from '../src/features/courses/courseService.js';
import { getStudySessions } from '../src/features/timer/timerService.js';
import { getGroups } from '../src/features/groups/groupService.js';
import { getInsightsAnalytics } from '../src/features/insights/insightsService.js';

console.log('--- RUNNING NEW-USER ZERO-STATE & DATA ISOLATION VERIFICATION SUITE ---');

async function testNewUserExperience() {
  const newUserId = 'test-new-user-' + Date.now();

  // 1. Profile must start at 0 XP, Level 1, 0 streak, 0 study time
  const profile = getLocalProfile(newUserId);
  assert.strictEqual(profile.total_xp, 0, 'New user XP must be 0');
  assert.strictEqual(profile.current_level, 1, 'New user level must be 1');
  assert.strictEqual(profile.streak_days, 0, 'New user streak must be 0');
  assert.strictEqual(profile.total_study_time, 0, 'New user study time must be 0');
  console.log('✓ New user profile initializes with exact 0 XP, Level 1, 0 streak, 0 study time.');

  // 2. Level calculation for 0 XP
  const levelInfo = calculateLevel(0);
  assert.strictEqual(levelInfo.level, 1, '0 XP must map to Level 1');
  assert.strictEqual(levelInfo.progressPercent, 0, '0 XP progress must be 0%');
  console.log('✓ Quadratic level progression maps 0 XP to Level 1 (0% progress to Level 2).');

  // 3. User courses must be empty for a new account (no hardcoded courses)
  const courses = await getCourses(newUserId);
  assert.strictEqual(courses.length, 0, 'New user must have 0 enrolled courses');
  console.log('✓ New user course catalog is strictly empty (no hardcoded seed courses).');

  // 4. Completed lessons set must be empty
  const completedLessons = getCompletedLessonIds(newUserId);
  assert.strictEqual(completedLessons.size, 0, 'New user completed lessons must be empty');
  console.log('✓ Completed lesson tracking starts with 0 completed lessons.');

  // 5. Timer sessions must be empty
  const sessions = await getStudySessions(newUserId);
  assert.strictEqual(sessions.length, 0, 'New user must have 0 recorded study sessions');
  console.log('✓ Study timer session history is empty for new accounts.');

  // 6. Cohort memberships must be empty
  const groups = await getGroups(newUserId);
  const joinedGroups = groups.filter((g) => g.is_member);
  assert.strictEqual(joinedGroups.length, 0, 'New user must belong to 0 study groups');
  console.log('✓ Cohort memberships initialize with 0 joined groups.');

  // 7. Insights analytics for new accounts must not show fabricated stats
  const insights = await getInsightsAnalytics(newUserId);
  assert.strictEqual(insights.kpi.totalXP, 0, 'KPI total XP must be 0');
  assert.strictEqual(insights.recentSessions.length, 0, 'Recent sessions log must be empty');
  console.log('✓ Learning analytics engine returns genuine zeroed KPIs and empty audit log.');

  console.log('=== ALL NEW-USER VERIFICATION TESTS PASSED SUCCESSFULLY! ===');
}

testNewUserExperience();
