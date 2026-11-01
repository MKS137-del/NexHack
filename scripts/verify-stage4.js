// Self-checking verification test for Stage 4 & 5 (Courses, YouTube Parsing, Gamification Engine)

import assert from 'node:assert';
import { extractPlaylistId, parseIsoDuration, fetchPlaylistData } from '../src/features/courses/youtubeService.js';
import { calculateLevel, calculateStreak } from '../src/features/gamification/gamificationService.js';

console.log('--- RUNNING STAGE 4 & 5 VERIFICATION SUITE ---');

// 1. YouTube Playlist ID Extraction
console.log('Test 1: YouTube Playlist ID Extraction...');
const url1 = 'https://www.youtube.com/playlist?list=PLillGF-RfqbZTASqS42h9G0V956555551';
assert.strictEqual(extractPlaylistId(url1), 'PLillGF-RfqbZTASqS42h9G0V956555551');

const url2 = 'https://www.youtube.com/watch?v=w7ejDZ8SWv8&list=PLsyeobzWxl7poL9JTVyndKe62ieoN-MZ3&index=1';
assert.strictEqual(extractPlaylistId(url2), 'PLsyeobzWxl7poL9JTVyndKe62ieoN-MZ3');

const rawId = 'PLot-Xpze53ldVwtstag2TL4HQhAnC8ksf';
assert.strictEqual(extractPlaylistId(rawId), 'PLot-Xpze53ldVwtstag2TL4HQhAnC8ksf');
console.log('✓ Playlist ID extraction handles full URLs, query parameters, and raw IDs.');

// 2. ISO 8601 Duration Parser
console.log('Test 2: ISO 8601 Duration Parser...');
assert.strictEqual(parseIsoDuration('PT1H15M30S'), 3600 + 900 + 30);
assert.strictEqual(parseIsoDuration('PT25M'), 1500);
assert.strictEqual(parseIsoDuration('PT45S'), 45);
assert.strictEqual(parseIsoDuration(''), 600); // default
console.log('✓ ISO 8601 duration parser accurately calculates seconds.');

// 3. Streak Calculations
console.log('Test 3: Streak Engine Calculation...');
const today = new Date().toISOString().split('T')[0];
const yesterdayDate = new Date(Date.now() - 86400000);
const yesterday = yesterdayDate.toISOString().split('T')[0];
const threeDaysAgoDate = new Date(Date.now() - 86400000 * 3);
const threeDaysAgo = threeDaysAgoDate.toISOString().split('T')[0];

const sameDayRes = calculateStreak(5, today);
assert.strictEqual(sameDayRes.streak, 5);
assert.strictEqual(sameDayRes.todayAlreadyActive, true);

const nextDayRes = calculateStreak(5, yesterday);
assert.strictEqual(nextDayRes.streak, 6);
assert.strictEqual(nextDayRes.isNewDay, true);

const brokenStreakRes = calculateStreak(5, threeDaysAgo);
assert.strictEqual(brokenStreakRes.streak, 1);
assert.strictEqual(brokenStreakRes.isNewDay, true);
console.log('✓ Daily streak calculation correctly handles same-day, continuous-day, and broken-streak intervals.');

// 4. Level Calculation Formula
console.log('Test 4: Quadratic Level Formula Verification...');
assert.strictEqual(calculateLevel(0).level, 1);
assert.strictEqual(calculateLevel(99).level, 1);
assert.strictEqual(calculateLevel(100).level, 2);
assert.strictEqual(calculateLevel(399).level, 2);
assert.strictEqual(calculateLevel(400).level, 3);
assert.strictEqual(calculateLevel(900).level, 4);
console.log('✓ Level formula accurately matches L = floor(sqrt(XP / 100)) + 1.');

// 5. Playlist Data Fetcher
console.log('Test 5: Preset Course Playlist Data Structure...');
async function testFetch() {
  const data = await fetchPlaylistData('PLillGF-RfqbZTASqS42h9G0V956555551', 'Web Development');
  assert.ok(data.title.includes('React 18'));
  assert.ok(data.lessons.length > 0);
  assert.ok(data.total_duration_seconds > 0);
  assert.ok(data.lessons[0].youtube_video_id);
  console.log('✓ Playlist fetcher returns enriched syllabus structure with valid video IDs.');
}

testFetch().then(() => {
  console.log('=== ALL STAGE 4 & 5 TESTS PASSED SUCCESSFULLY! ===');
});
