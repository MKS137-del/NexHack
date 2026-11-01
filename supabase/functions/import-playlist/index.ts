// Supabase Edge Function: import-playlist
// Securely proxies YouTube Data API v3 queries server-side

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function parseDuration(isoDuration: string): number {
  if (!isoDuration) return 0;
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);
  return hours * 3600 + minutes * 60 + seconds;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { playlistId, customCategory } = await req.json();

    if (!playlistId) {
      return new Response(JSON.stringify({ error: 'Playlist ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('YOUTUBE_API_KEY');
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'YOUTUBE_API_KEY environment variable is not configured on server',
          fallback_mode: true,
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 1. Fetch Playlist Metadata
    const playlistRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&id=${playlistId}&key=${apiKey}`
    );
    const playlistData = await playlistRes.json();

    if (!playlistData.items || playlistData.items.length === 0) {
      return new Response(JSON.stringify({ error: 'Playlist not found on YouTube' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const pl = playlistData.items[0];
    const playlistSnippet = pl.snippet;

    // 2. Fetch Playlist Items (videos)
    const itemsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&maxResults=50&playlistId=${playlistId}&key=${apiKey}`
    );
    const itemsData = await itemsRes.json();

    const videoIds = (itemsData.items || [])
      .map((item: any) => item.contentDetails?.videoId)
      .filter(Boolean)
      .join(',');

    // 3. Fetch Video Content Details for accurate durations
    let durationsMap: Record<string, number> = {};
    if (videoIds) {
      const videosRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails&id=${videoIds}&key=${apiKey}`
      );
      const videosData = await videosRes.json();
      (videosData.items || []).forEach((vid: any) => {
        durationsMap[vid.id] = parseDuration(vid.contentDetails?.duration);
      });
    }

    const lessons = (itemsData.items || []).map((item: any, index: number) => {
      const vId = item.contentDetails?.videoId;
      return {
        youtube_video_id: vId,
        title: item.snippet?.title || `Lesson ${index + 1}`,
        description: item.snippet?.description || '',
        position: index + 1,
        duration_seconds: durationsMap[vId] || 600,
        thumbnail_url:
          item.snippet?.thumbnails?.medium?.url ||
          item.snippet?.thumbnails?.default?.url ||
          `https://img.youtube.com/vi/${vId}/hqdefault.jpg`,
      };
    });

    const coursePayload = {
      youtube_playlist_id: playlistId,
      title: playlistSnippet.title,
      description: playlistSnippet.description || 'Imported YouTube Course',
      thumbnail_url:
        playlistSnippet.thumbnails?.high?.url ||
        playlistSnippet.thumbnails?.medium?.url ||
        `https://img.youtube.com/vi/${lessons[0]?.youtube_video_id}/hqdefault.jpg`,
      channel_title: playlistSnippet.channelTitle,
      category: customCategory || 'Programming',
      total_lessons: lessons.length,
      total_duration_seconds: lessons.reduce((acc: number, l: any) => acc + l.duration_seconds, 0),
      lessons,
    };

    return new Response(JSON.stringify({ success: true, data: coursePayload }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
