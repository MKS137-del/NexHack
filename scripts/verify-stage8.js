// Self-checking verification test for Stage 8 (Insights Analytics & User Profile)

import assert from 'node:assert';
import { getInsightsAnalytics } from '../src/features/insights/insightsService.js';
import { getLocalProfile, saveLocalProfile, getAllAchievementsWithStatus } from '../src/features/gamification/gamificationService.js';

console.log('--- RUNNING STAGE 8 INSIGHTS & PROFILE VERIFICATION SUITE ---');

// 1. Insights Analytics Engine
console.log('Test 1: Insights Analytics Aggregation...');
async function testInsights() {
  const data = await getInsightsAnalytics();
  assert.ok(data.weeklyStudyChart.length === 7, 'Weekly chart must have 7 days');
  assert.ok(data.xpTimelineChart.length === 7, 'XP timeline must have 7 days');
  assert.ok(Number(data.kpi.totalStudyHours) > 0, 'Total study hours must be positive');
  assert.ok(Number(data.kpi.avgDailyHours) > 0, 'Average daily hours must be positive');
  assert.ok(data.categoryDistribution.length > 0, 'Category distribution must exist');

  console.log(`✓ Analytics calculated: Total ${data.kpi.totalStudyHours}h study, ${data.kpi.totalXP} XP.`);
}

// 2. Profile Persistence & Edits
console.log('Test 2: Profile Persistence & Mutation Integrity...');
async function testProfile() {
  const original = getLocalProfile();
  const testBio = 'Senior Software Engineer building NexHack full stack.';
  saveLocalProfile({
    ...original,
    bio: testBio,
  });

  const reloaded = getLocalProfile();
  assert.strictEqual(reloaded.bio, testBio);
  console.log('✓ Profile changes correctly persisted and reloaded.');
}

// 3. Achievement Badges Status
console.log('Test 3: Achievement Badges Status...');
function testBadges() {
  const badges = getAllAchievementsWithStatus();
  assert.ok(badges.length >= 6);
  const firstStep = badges.find((b) => b.code === 'first_step');
  assert.ok(firstStep, 'first_step badge exists');
  assert.strictEqual(firstStep.is_unlocked, true);
  console.log('✓ Badges structure verified with unlocked and in-progress states.');
}

async function runAll() {
  await testInsights();
  await testProfile();
  testBadges();
  console.log('=== ALL STAGE 8 TESTS PASSED SUCCESSFULLY! ===');
}

runAll();
