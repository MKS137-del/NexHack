// Self-checking verification test for Stage 7 (Groups & Social Leaderboard Engine)

import assert from 'node:assert';
import { generateInviteCode, createGroup, joinGroupByCode } from '../src/features/groups/groupService.js';
import { getLeaderboardRankings } from '../src/features/leaderboard/leaderboardService.js';

console.log('--- RUNNING STAGE 7 GROUPS & LEADERBOARD VERIFICATION SUITE ---');

// 1. Invite Code Format Check
console.log('Test 1: Invite Code Generation...');
const code1 = generateInviteCode();
const code2 = generateInviteCode();
assert.match(code1, /^NEX-[A-Z0-9]{4}$/);
assert.notStrictEqual(code1, code2);
console.log(`✓ Invite codes generated in expected format: ${code1}, ${code2}`);

// 2. Private vs Public Group Creation
console.log('Test 2: Group Creation & Privacy Rules...');
async function testGroupCreation() {
  const publicGroup = await createGroup({
    name: 'Open Source Apprentices',
    description: 'Community for OSS contributors',
    is_private: false,
  });
  assert.strictEqual(publicGroup.is_private, false);
  assert.strictEqual(publicGroup.invite_code, null);

  const privateGroup = await createGroup({
    name: 'Top Secret FAANG Prep',
    description: 'Invitation only sprint',
    is_private: true,
  });
  assert.strictEqual(privateGroup.is_private, true);
  assert.ok(privateGroup.invite_code);
  assert.match(privateGroup.invite_code, /^NEX-[A-Z0-9]{4}$/);
  console.log(`✓ Private group created with invite code ${privateGroup.invite_code}.`);

  // Test joining with code
  const joinResult = await joinGroupByCode(privateGroup.invite_code);
  assert.strictEqual(joinResult.success, true);
  assert.strictEqual(joinResult.group.id, privateGroup.id);
  console.log('✓ Successfully joined private group using invite code.');

  // Test joining with invalid code
  await assert.rejects(
    async () => {
      await joinGroupByCode('INVALID-CODE-999');
    },
    /No study group found with this invite code/
  );
  console.log('✓ Invalid invite codes correctly rejected with descriptive error.');
}

// 3. Leaderboard Ranking Engine
console.log('Test 3: Leaderboard Sorting & Placement Calculation...');
async function testLeaderboard() {
  // Test XP metric
  const xpData = await getLeaderboardRankings({ metric: 'xp', timeframe: 'weekly' });
  assert.ok(xpData.rankings.length >= 5);
  for (let i = 0; i < xpData.rankings.length - 1; i++) {
    assert.ok(
      xpData.rankings[i].xp >= xpData.rankings[i + 1].xp,
      `XP sorting violated at index ${i}: ${xpData.rankings[i].xp} < ${xpData.rankings[i + 1].xp}`
    );
  }
  assert.strictEqual(xpData.rankings[0].rank, 1);
  assert.ok(xpData.currentUserRank >= 1);
  console.log(`✓ Leaderboard accurately sorted by XP. Current user placed at #${xpData.currentUserRank}.`);

  // Test Study Time metric
  const studyData = await getLeaderboardRankings({ metric: 'study_time', timeframe: 'all' });
  for (let i = 0; i < studyData.rankings.length - 1; i++) {
    assert.ok(
      studyData.rankings[i].studySeconds >= studyData.rankings[i + 1].studySeconds,
      'Study time sorting violated'
    );
  }
  console.log('✓ Leaderboard accurately sorted by study duration.');
}

async function runAll() {
  await testGroupCreation();
  await testLeaderboard();
  console.log('=== ALL STAGE 7 TESTS PASSED SUCCESSFULLY! ===');
}

runAll();
