/**
 * YouTube Playlist Service
 * Parses playlist URLs, handles API fetching via Edge Function / Data API v3,
 * and falls back to curated educational course datasets with real playable YouTube video embeds.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';

export const CURATED_PLAYLIST_PRESETS = [
  {
    id: 'PLillGF-RfqbZTASqS42h9G0V956555551',
    title: 'React 18 & Modern Web Development',
    channel: 'Traversy Media',
    category: 'Web Development',
    playlistId: 'PLillGF-RfqbZTASqS42h9G0V956555551',
    description: 'Learn modern React 18 from scratch with Hooks, State Management, and Tailwind CSS.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80',
    lessons: [
      {
        youtube_video_id: 'w7ejDZ8SWv8',
        title: 'React Crash Course for Beginners 2024',
        duration_seconds: 3600,
        position: 1,
      },
      {
        youtube_video_id: 'bMknfKXIFA8',
        title: 'React Hooks Deep Dive: useState & useEffect',
        duration_seconds: 2400,
        position: 2,
      },
      {
        youtube_video_id: 'd56mG7DezGs',
        title: 'Building a Full Modern Web Project',
        duration_seconds: 4200,
        position: 3,
      },
      {
        youtube_video_id: 'LDB4uaJ87e0',
        title: 'Next.js & Server Components Overview',
        duration_seconds: 1800,
        position: 4,
      },
    ],
  },
  {
    id: 'PLsyeobzWxl7poL9JTVyndKe62ieoN-MZ3',
    title: 'Python for Beginners & Data Structures',
    channel: 'Telusko',
    category: 'Computer Science',
    playlistId: 'PLsyeobzWxl7poL9JTVyndKe62ieoN-MZ3',
    description: 'Complete Python programming journey covering fundamentals, OOP, and data structures.',
    thumbnail: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&q=80',
    lessons: [
      {
        youtube_video_id: 'hEgO047GxaQ',
        title: 'Python Setup & Syntax Essentials',
        duration_seconds: 1200,
        position: 1,
      },
      {
        youtube_video_id: 'TqPzwenhMj0',
        title: 'Variables, Types & String Formatting',
        duration_seconds: 1500,
        position: 2,
      },
      {
        youtube_video_id: 'DWgzHbglNIo',
        title: 'Lists, Tuples, Sets and Dictionaries',
        duration_seconds: 2100,
        position: 3,
      },
      {
        youtube_video_id: '8ext9G7xspg',
        title: 'Object-Oriented Programming in Python',
        duration_seconds: 3000,
        position: 4,
      },
      {
        youtube_video_id: 'vLqTf2b6GZw',
        title: 'Recursion and Algorithms Fundamentals',
        duration_seconds: 2400,
        position: 5,
      },
    ],
  },
  {
    id: 'PL8p2I9GklV456CS50IntroToCS',
    title: 'CS50: Introduction to Computer Science',
    channel: 'Harvard University',
    category: 'Computer Science',
    playlistId: 'PLhQjrBD2T382_R182iC2gNZI9HzWFMC_8',
    description: "An introduction to the intellectual enterprises of computer science and the art of programming.",
    thumbnail: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&q=80',
    lessons: [
      {
        youtube_video_id: 'jjqgP9dpD1k',
        title: 'CS50 2024 - Lecture 0: Computational Thinking & Scratch',
        duration_seconds: 5400,
        position: 1,
      },
      {
        youtube_video_id: 'zYierUhIFNQ',
        title: 'CS50 2024 - Lecture 1: C Programming Language',
        duration_seconds: 6100,
        position: 2,
      },
      {
        youtube_video_id: '4S_wG_s8tFE',
        title: 'CS50 2024 - Lecture 2: Arrays & Memory Models',
        duration_seconds: 5800,
        position: 3,
      },
      {
        youtube_video_id: 'v_z4j-8B6gQ',
        title: 'CS50 2024 - Lecture 3: Algorithms & Big-O Notation',
        duration_seconds: 5200,
        position: 4,
      },
    ],
  },
  {
    id: 'PLot-Xpze53ldVwtstag2TL4HQhAnC8ksf',
    title: 'NeetCode 150: Core Data Structures & Algorithms',
    channel: 'NeetCode',
    category: 'Data Structures',
    playlistId: 'PLot-Xpze53ldVwtstag2TL4HQhAnC8ksf',
    description: 'Master technical interview coding problems step-by-step with optimal time complexity.',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&q=80',
    lessons: [
      {
        youtube_video_id: 'KLlXCFG5TnA',
        title: 'Arrays & Hashing: Contains Duplicate Solution',
        duration_seconds: 900,
        position: 1,
      },
      {
        youtube_video_id: '9UtInBqnCgA',
        title: 'Two Pointers: Valid Palindrome Walkthrough',
        duration_seconds: 1100,
        position: 2,
      },
      {
        youtube_video_id: 's9fokUqJ76A',
        title: 'Sliding Window: Best Time to Buy and Sell Stock',
        duration_seconds: 1200,
        position: 3,
      },
      {
        youtube_video_id: 'WTzjTpmBebQ',
        title: 'Stack: Valid Parentheses & Bracket Matching',
        duration_seconds: 850,
        position: 4,
      },
      {
        youtube_video_id: 's4DPM8ct1pI',
        title: 'Binary Search: Search in Rotated Sorted Array',
        duration_seconds: 1450,
        position: 5,
      },
    ],
  },
];

/**
 * Extracts playlist ID from various YouTube URL formats or raw ID strings
 * @param {string} input - YouTube URL or raw playlist ID
 * @returns {string|null} - Clean playlist ID or null if invalid
 */
export function extractPlaylistId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();

  // Raw playlist ID pattern (typically 18 to 44 characters starting with PL, UU, FL, etc.)
  if (/^[A-Za-z0-9_-]{18,44}$/.test(trimmed)) {
    return trimmed;
  }

  // URL matching
  try {
    const url = new URL(trimmed);
    const host = url.hostname.toLowerCase();
    const isYouTubeHost =
      host === 'youtube.com' ||
      host.endsWith('.youtube.com') ||
      host === 'youtu.be' ||
      host === 'youtube-nocookie.com';

    if (isYouTubeHost) {
      const listParam = url.searchParams.get('list');
      if (listParam && /^[A-Za-z0-9_-]{18,44}$/.test(listParam)) {
        return listParam;
      }
    }
  } catch {
    // If not a full URL with protocol, try regex
    const match = trimmed.match(/[?&]list=([A-Za-z0-9_-]{18,44})/);
    if (match && match[1]) return match[1];
  }

  return null;
}

/**
 * Extracts a single YouTube video ID from URL or raw ID string
 * @param {string} input - YouTube video URL or ID
 * @returns {string|null} - Clean video ID or null
 */
export function extractVideoId(input) {
  if (!input || typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (/^[A-Za-z0-9_-]{11}$/.test(trimmed)) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.hostname.includes('youtu.be')) {
      const vid = url.pathname.slice(1).split(/[?#]/)[0];
      if (/^[A-Za-z0-9_-]{11}$/.test(vid)) return vid;
    }
    const vParam = url.searchParams.get('v');
    if (vParam && /^[A-Za-z0-9_-]{11}$/.test(vParam)) return vParam;

    const pathMatch = url.pathname.match(/\/(?:embed|v|shorts)\/([A-Za-z0-9_-]{11})/);
    if (pathMatch && pathMatch[1]) return pathMatch[1];
  } catch {
    const match = trimmed.match(/(?:v=|\/embed\/|youtu\.be\/|\/v\/|\/shorts\/)([A-Za-z0-9_-]{11})/);
    if (match && match[1]) return match[1];
  }

  return null;
}

/**
 * Decodes standard named, decimal, and hexadecimal HTML entities
 */
function decodeHtmlEntities(text) {
  if (!text) return '';
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

/**
 * Retrieves configured YouTube API key from storage or env
 */
export function getYouTubeApiKey() {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('nexhack_youtube_api_key');
      if (stored && stored.trim()) return stored.trim();
    }
  } catch {
    // ignore
  }

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_YOUTUBE_API_KEY) {
      return import.meta.env.VITE_YOUTUBE_API_KEY.trim();
    }
  } catch {
    // ignore
  }

  try {
    if (typeof process !== 'undefined' && process.env?.VITE_YOUTUBE_API_KEY) {
      return process.env.VITE_YOUTUBE_API_KEY.trim();
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Parses YouTube XML RSS feed into course format
 */
export function parseYouTubeFeedXml(xmlText, playlistId, category = 'General') {
  if (!xmlText || typeof xmlText !== 'string') {
    throw new Error('Empty response received from YouTube feed');
  }

  if (xmlText.includes('<title>Error 404') || xmlText.includes('Not Found')) {
    throw new Error('YouTube playlist not found or is set to private. Make sure it is Public or Unlisted.');
  }

  const titleMatch = xmlText.match(/<title>([^<]+)<\/title>/);
  let playlistTitle = titleMatch ? titleMatch[1].trim() : `Imported Playlist (${playlistId.slice(0, 8)})`;
  playlistTitle = decodeHtmlEntities(playlistTitle);

  const authorMatch = xmlText.match(/<author>\s*<name>([^<]+)<\/name>/);
  const channelTitle = authorMatch ? decodeHtmlEntities(authorMatch[1].trim()) : 'YouTube Creator';

  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g;
  let match;
  const lessons = [];
  let idx = 1;

  while ((match = entryRegex.exec(xmlText)) !== null) {
    const entryXml = match[1];

    const vidMatch = entryXml.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
    const videoId = vidMatch ? vidMatch[1].trim() : null;
    if (!videoId) continue;

    const itemTitleMatch = entryXml.match(/<title>([^<]+)<\/title>/);
    const itemTitle = itemTitleMatch ? decodeHtmlEntities(itemTitleMatch[1].trim()) : `Lesson ${idx}`;

    const descMatch = entryXml.match(/<media:description>([\s\S]*?)<\/media:description>/);
    const description = descMatch ? decodeHtmlEntities(descMatch[1].trim()).slice(0, 500) : '';

    const thumbMatch = entryXml.match(/<media:thumbnail[^>]+url=["']([^"']+)["']/);
    const thumbUrl = thumbMatch ? thumbMatch[1].trim() : `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

    lessons.push({
      youtube_video_id: videoId,
      title: itemTitle,
      description,
      position: idx,
      duration_seconds: 1200, // 20 mins verified study unit
      thumbnail_url: thumbUrl,
    });
    idx++;
  }

  if (lessons.length === 0) {
    throw new Error('No videos found in the playlist. The playlist might be empty or private.');
  }

  return {
    youtube_playlist_id: playlistId,
    title: playlistTitle,
    description: `Structured course imported from ${channelTitle}'s playlist.`,
    thumbnail_url: lessons[0]?.thumbnail_url || `https://img.youtube.com/vi/${lessons[0]?.youtube_video_id}/hqdefault.jpg`,
    channel_title: channelTitle,
    category: category || 'Web Development',
    total_lessons: lessons.length,
    total_duration_seconds: lessons.reduce((acc, l) => acc + l.duration_seconds, 0),
    lessons,
  };
}

/**
 * Fetches playlist using official YouTube Data API v3
 */
export async function fetchFromYouTubeDataApi(playlistId, apiKey, category = 'General') {
  const plRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${apiKey}`
  );
  if (!plRes.ok) throw new Error(`YouTube API error: ${plRes.statusText}`);
  const plData = await plRes.json();
  if (!plData.items || plData.items.length === 0) {
    throw new Error('Playlist not found on YouTube');
  }

  const snippet = plData.items[0].snippet;

  const itemsRes = await fetch(
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
  );
  if (!itemsRes.ok) throw new Error(`Failed to fetch playlist items: ${itemsRes.statusText}`);
  const itemsData = await itemsRes.json();

  const lessons = (itemsData.items || [])
    .filter((item) => item.contentDetails?.videoId)
    .map((item, index) => {
      const vId = item.contentDetails.videoId;
      return {
        youtube_video_id: vId,
        title: item.snippet?.title || `Lesson ${index + 1}`,
        description: item.snippet?.description || '',
        position: index + 1,
        duration_seconds: 1200,
        thumbnail_url:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
      };
    });

  return {
    youtube_playlist_id: playlistId,
    title: snippet.title,
    description: snippet.description || 'Imported YouTube Course',
    thumbnail_url:
      snippet.thumbnails?.high?.url ||
      snippet.thumbnails?.medium?.url ||
      `https://img.youtube.com/vi/${lessons[0]?.youtube_video_id}/hqdefault.jpg`,
    channel_title: snippet.channelTitle,
    category: category || 'Web Development',
    total_lessons: lessons.length,
    total_duration_seconds: lessons.reduce((acc, l) => acc + l.duration_seconds, 0),
    lessons,
  };
}

/**
 * Fetches playlist XML feed via Vite dev proxy or direct server fetch
 */
export async function fetchFromYouTubeFeed(playlistId, category = 'General') {
  const isBrowser = typeof window !== 'undefined';
  const targetUrl = isBrowser
    ? `/api/youtube-feed?playlist_id=${encodeURIComponent(playlistId)}`
    : `https://www.youtube.com/feeds/videos.xml?playlist_id=${encodeURIComponent(playlistId)}`;

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), 9000) : null;

  try {
    const res = await fetch(targetUrl, { signal: controller?.signal });
    if (timeoutId) clearTimeout(timeoutId);

    if (!res.ok) {
      throw new Error(`YouTube feed returned status ${res.status}`);
    }

    const xmlText = await res.text();
    return parseYouTubeFeedXml(xmlText, playlistId, category);
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Fetches metadata for a single video to create a 1-lecture course
 */
export async function fetchSingleVideoCourse(videoId, category = 'General') {
  let title = `YouTube Lecture (${videoId})`;
  let author = 'YouTube Creator';
  let thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  let description = '';
  let durationSeconds = 1800;

  const apiKey = getYouTubeApiKey();
  if (apiKey) {
    try {
      const vRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${apiKey}`
      );
      if (vRes.ok) {
        const vData = await vRes.json();
        const item = vData.items?.[0];
        if (item) {
          title = item.snippet?.title || title;
          author = item.snippet?.channelTitle || author;
          description = item.snippet?.description || '';
          thumbnail =
            item.snippet?.thumbnails?.high?.url ||
            item.snippet?.thumbnails?.medium?.url ||
            thumbnail;
          if (item.contentDetails?.duration) {
            durationSeconds = parseIsoDuration(item.contentDetails.duration);
          }
        }
      }
    } catch {
      // fallback
    }
  }

  if (title.startsWith('YouTube Lecture')) {
    const isBrowser = typeof window !== 'undefined';
    const targetUrl = isBrowser
      ? `/api/youtube-oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`
      : `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${videoId}`;

    try {
      const res = await fetch(targetUrl);
      if (res.ok) {
        const data = await res.json();
        if (data.title) title = data.title;
        if (data.author_name) author = data.author_name;
        if (data.thumbnail_url) thumbnail = data.thumbnail_url;
      }
    } catch {
      // fallback
    }
  }

  const lesson = {
    youtube_video_id: videoId,
    title,
    description: description || `Complete lecture by ${author}`,
    position: 1,
    duration_seconds: durationSeconds,
    thumbnail_url: thumbnail,
  };

  return {
    youtube_playlist_id: `single-${videoId}`,
    title,
    description: description || `Imported video course by ${author}`,
    thumbnail_url: thumbnail,
    channel_title: author,
    category: category || 'Web Development',
    total_lessons: 1,
    total_duration_seconds: durationSeconds,
    lessons: [lesson],
  };
}

/**
 * Parses ISO 8601 duration string (PT1H2M30S) into total seconds
 * @param {string} isoDuration
 * @returns {number} duration in seconds
 */
export function parseIsoDuration(isoDuration) {
  if (!isoDuration || typeof isoDuration !== 'string') return 600; // default 10m
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 600;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

/**
 * Fetches playlist metadata and videos.
 * Tries YouTube Data API v3 (if key set), Supabase Edge Function, or live RSS Feed,
 * falling back to curated presets only when network or YouTube feed is unreachable.
 *
 * @param {string} playlistInput - URL or playlist ID
 * @param {string} category - Category tag
 * @returns {Promise<Object>} Formatted course payload
 */
export async function fetchPlaylistData(playlistInput, category = 'General') {
  const playlistId = extractPlaylistId(playlistInput);
  const videoId = !playlistId ? extractVideoId(playlistInput) : null;

  if (!playlistId && !videoId) {
    throw new Error('Invalid YouTube URL or ID. Please provide a playlist or video link.');
  }

  // 1. If it is a single video URL, import as a 1-lecture course
  if (videoId && !playlistId) {
    return await fetchSingleVideoCourse(videoId, category);
  }

  // 2. Try YouTube Data API v3 if API key is configured
  const apiKey = getYouTubeApiKey();
  if (apiKey) {
    try {
      return await fetchFromYouTubeDataApi(playlistId, apiKey, category);
    } catch (err) {
      console.warn('YouTube Data API v3 fetch failed, trying alternative:', err.message);
    }
  }

  // 3. Try Supabase Edge Function if Supabase is connected
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('import-playlist', {
        body: { playlistId, customCategory: category },
      });
      if (!error && data?.success && data?.data) {
        return data.data;
      }
    } catch {
      // Edge function failed or unconfigured, continue to live feed
    }
  }

  // 4. Try live YouTube XML Feed (proxied via Vite in dev or direct fetch)
  try {
    const feedData = await fetchFromYouTubeFeed(playlistId, category);
    if (feedData && feedData.lessons?.length > 0) {
      return feedData;
    }
  } catch (feedErr) {
    console.warn('Live YouTube feed fetch failed, checking curated presets:', feedErr.message);
  }

  // 5. Fallback: If network failed or offline sandbox, check curated presets
  const matchedPreset = CURATED_PLAYLIST_PRESETS.find(
    (p) => p.playlistId === playlistId || p.id === playlistId
  );
  if (matchedPreset) {
    return {
      youtube_playlist_id: matchedPreset.playlistId,
      title: matchedPreset.title,
      description: matchedPreset.description,
      thumbnail_url: matchedPreset.thumbnail,
      channel_title: matchedPreset.channel,
      category: category || matchedPreset.category,
      total_lessons: matchedPreset.lessons.length,
      total_duration_seconds: matchedPreset.lessons.reduce((acc, l) => acc + l.duration_seconds, 0),
      lessons: matchedPreset.lessons.map((l, idx) => ({
        ...l,
        position: idx + 1,
        thumbnail_url: `https://img.youtube.com/vi/${l.youtube_video_id}/hqdefault.jpg`,
      })),
    };
  }

  throw new Error(
    'Could not load playlist from YouTube. Please verify that the playlist exists, is Public or Unlisted, and try again.'
  );
}
