// Self-checking verification test for Stage 6 (Study Timer, Wall-Clock Defense, Session Persistence)

import assert from 'node:assert';
import { verifyAndSaveSession } from '../src/features/timer/timerService.js';

console.log('--- RUNNING STAGE 6 STUDY TIMER VERIFICATION SUITE ---');

// 1. Minimum Duration Threshold Check (<60s)
console.log('Test 1: Minimum session duration threshold (<60s)...');
async function testMinThreshold() {
  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.getTime() + 30000).toISOString(); // 30s elapsed

  const res = await verifyAndSaveSession({
    startedAt: start,
    endedAt: end,
    clientDurationSeconds: 30,
    mode: 'manual',
  });

  assert.strictEqual(res.success, false);
  assert.strictEqual(res.xpEarned, 0);
  assert.ok(res.reason.includes('too brief'));
  console.log('✓ Sessions under 60 seconds are safely rejected from XP awards.');
}

// 2. Anti-Tampering Check: Rejects exaggerated client claim
console.log('Test 2: Anti-Tampering Wall-Clock Delta Verification...');
async function testAntiTampering() {
  const now = new Date();
  const start = now.toISOString();
  // Real elapsed wall-clock time is 120 seconds (2 mins)
  const end = new Date(now.getTime() + 120000).toISOString();

  // Malicious/tampered client claims it studied for 3600 seconds (1 hour)
  const res = await verifyAndSaveSession({
    startedAt: start,
    endedAt: end,
    clientDurationSeconds: 3600,
    mode: 'manual',
  });

  // Verified duration must be bounded by wall-clock seconds (+5s margin)
  assert.ok(res.verifiedDurationSeconds <= 125, 'Tampered client duration was not bounded!');
  console.log(`✓ Tampered client duration clamped to verified ${res.verifiedDurationSeconds}s.`);
}

// 3. Pomodoro Completion Bonus Calculation
console.log('Test 3: Pomodoro Completion Bonus (+25 XP)...');
async function testPomodoroBonus() {
  const now = new Date();
  const start = now.toISOString();
  // 25 minutes = 1500 seconds
  const end = new Date(now.getTime() + 1500000).toISOString();

  const res = await verifyAndSaveSession({
    startedAt: start,
    endedAt: end,
    clientDurationSeconds: 1500,
    mode: 'pomodoro',
    isPomodoroComplete: true,
  });

  assert.strictEqual(res.success, true);
  // Base: 2 blocks of 10m = 20 XP. Bonus: 25 XP. Total = 45 XP.
  assert.strictEqual(res.xpEarned, 45);
  console.log('✓ 25m Pomodoro awards 20 base XP + 25 bonus XP = 45 total XP.');
}

async function runAll() {
  await testMinThreshold();
  await testAntiTampering();
  await testPomodoroBonus();
  console.log('=== ALL STAGE 6 TESTS PASSED SUCCESSFULLY! ===');
}

runAll();
