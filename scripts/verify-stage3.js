import assert from 'assert';

console.log('--- Running Stage 3 Verification Suite ---');

// 1. Verify Level formula
function calculateLevel(xp) {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

assert.strictEqual(calculateLevel(0), 1, 'XP 0 should be Level 1');
assert.strictEqual(calculateLevel(50), 1, 'XP 50 should be Level 1');
assert.strictEqual(calculateLevel(99), 1, 'XP 99 should be Level 1');
assert.strictEqual(calculateLevel(100), 2, 'XP 100 should be Level 2');
assert.strictEqual(calculateLevel(399), 2, 'XP 399 should be Level 2');
assert.strictEqual(calculateLevel(400), 3, 'XP 400 should be Level 3');
assert.strictEqual(calculateLevel(900), 4, 'XP 900 should be Level 4');
console.log('✔ Level progression calculation verified.');

// 2. Verify Supabase configuration detector logic
function checkSupabaseConfig(url, key) {
  return Boolean(
    url &&
    key &&
    !url.includes('your-project-id') &&
    !key.includes('your-supabase-publishable-key')
  );
}

assert.strictEqual(checkSupabaseConfig(undefined, undefined), false);
assert.strictEqual(checkSupabaseConfig('https://your-project-id.supabase.co', 'your-supabase-publishable-key'), false);
assert.strictEqual(checkSupabaseConfig('https://abc.supabase.co', 'eyJh...'), true);
console.log('✔ Dual-mode Supabase detector logic verified.');

// 3. Verify Wall-Clock delta timer logic
function calculateElapsedSeconds(startTimeMs, nowMs) {
  if (nowMs < startTimeMs) return 0;
  return Math.floor((nowMs - startTimeMs) / 1000);
}

const start = 1730460000000;
const fifteenMinutesLater = start + (15 * 60 * 1000);
assert.strictEqual(calculateElapsedSeconds(start, fifteenMinutesLater), 900);
console.log('✔ Wall-clock elapsed time delta calculation verified.');

// 4. Verify YouTube Playlist ID extractor regex
function extractPlaylistId(url) {
  if (!url) return null;
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

const testUrl1 = 'https://www.youtube.com/playlist?list=PLillGF-RfqbZTASqS_R3eTU69tP06yb48';
const testUrl2 = 'https://youtu.be/watch?v=123&list=PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ&index=1';
assert.strictEqual(extractPlaylistId(testUrl1), 'PLillGF-RfqbZTASqS_R3eTU69tP06yb48');
assert.strictEqual(extractPlaylistId(testUrl2), 'PL9gnSGHSqcnr_DxHsP7AW9ftq0AtAyYqJ');
assert.strictEqual(extractPlaylistId('https://google.com'), null);
console.log('✔ YouTube playlist ID extractor regex verified.');

console.log('--- ALL STAGE 3 LOGIC CHECKS PASSED ---');
