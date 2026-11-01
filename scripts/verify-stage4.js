// Self-checking verification test for Stage 4 & 5 (Courses, YouTube Parsing, Gamification Engine)

import assert from 'node:assert';
import { extractPlaylistId, extractVideoId, parseIsoDuration, fetchPlaylistData, parseYouTubeFeedXml } from '../src/features/courses/youtubeService.js';
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
assert.strictEqual(extractVideoId('https://www.youtube.com/watch?v=w7ejDZ8SWv8'), 'w7ejDZ8SWv8');
assert.strictEqual(extractVideoId('https://youtu.be/bMknfKXIFA8'), 'bMknfKXIFA8');
assert.strictEqual(extractVideoId('https://www.youtube.com/embed/LDB4uaJ87e0'), 'LDB4uaJ87e0');
assert.strictEqual(extractVideoId('https://www.youtube.com/shorts/s9fokUqJ76A'), 's9fokUqJ76A');
assert.strictEqual(extractVideoId('https://www.youtube.com/playlist?list=PLillGF-RfqbZTASqS42h9G0V956555551'), null);
console.log('✓ Playlist ID and Single Video ID extractions handle full URLs, query parameters, embeds, shorts, and raw IDs.');

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

// 5. Playlist Data Fetcher & XML Feed Parser
console.log('Test 5: Preset Course Playlist Data Structure & XML Feed Parser...');
const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<feed xmlns:yt="http://www.youtube.com/xml/schemas/2015" xmlns:media="http://search.yahoo.com/mrss/" xmlns="http://www.w3.org/2005/Atom">
 <title>Distributed Systems in Go: Beginner&#x27;s Guide &amp; Raft</title>
 <author><name>MIT OpenCourseWare</name></author>
 <entry>
  <yt:videoId>v1234567890</yt:videoId>
  <title>Lecture 1: Intro to &quot;Fast&quot; Consensus</title>
  <media:description>Consensus algorithms &amp; fault tolerance</media:description>
  <media:thumbnail url="https://i.ytimg.com/vi/v1234567890/hqdefault.jpg"/>
 </entry>
</feed>`;
const parsedFeed = parseYouTubeFeedXml(sampleXml, 'PL_MIT_RAFT', 'Computer Science');
assert.strictEqual(parsedFeed.title, "Distributed Systems in Go: Beginner's Guide & Raft");
assert.strictEqual(parsedFeed.channel_title, 'MIT OpenCourseWare');
assert.strictEqual(parsedFeed.total_lessons, 1);
assert.strictEqual(parsedFeed.lessons[0].youtube_video_id, 'v1234567890');
assert.strictEqual(parsedFeed.lessons[0].title, 'Lecture 1: Intro to "Fast" Consensus');
console.log('✓ YouTube XML Feed parser reliably extracts real titles, channels, and video syllabus.');

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
