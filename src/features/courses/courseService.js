/**
 * Course Management Service
 * Handles course listings, playlist imports, lesson syllabus, and completion tracking.
 * Provides user-scoped persistence and data isolation.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { fetchPlaylistData } from './youtubeService.js';
import { awardXP } from '../gamification/gamificationService.js';

/**
 * Returns current authenticated user ID for data isolation
 */
function generateUuid() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function getActiveUserId() {
  try {
    if (typeof localStorage !== 'undefined') {
      // Prioritize active Supabase token if Supabase is connected
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
          const sbRaw = localStorage.getItem(key);
          if (sbRaw) {
            const sbParsed = JSON.parse(sbRaw);
            if (sbParsed?.user?.id) return sbParsed.user.id;
          }
        }
      }
      const raw = localStorage.getItem('nexhack_auth_session');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.user?.id) return parsed.user.id;
      }
    }
  } catch {
    // ignore
  }
  return null;
}

function getCoursesStorageKey(userId) {
  const uid = userId || getActiveUserId();
  return uid ? `nexhack_${uid}_courses` : 'nexhack_courses';
}

function getCompletedLessonsStorageKey(userId) {
  const uid = userId || getActiveUserId();
  return uid ? `nexhack_${uid}_completed_lessons` : 'nexhack_completed_lessons';
}

/**
 * Returns set of completed lesson IDs for active user
 */
export function getCompletedLessonIds(userId = null) {
  try {
    const raw = localStorage.getItem(getCompletedLessonsStorageKey(userId));
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

/**
 * Saves completed lesson IDs set for active user
 */
function saveCompletedLessonIds(set, userId = null) {
  try {
    localStorage.setItem(
      getCompletedLessonsStorageKey(userId),
      JSON.stringify(Array.from(set))
    );
  } catch (err) {
    console.error('Failed to save completed lessons:', err);
  }
}

/**
 * Retrieves all courses for the active user, calculating completion percentages
 */
export async function getCourses(userId = null) {
  let coursesList = [];
  const uid = userId || getActiveUserId();

  // Try Supabase first if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const currentUid = uid || user?.id;

      if (currentUid) {
        // Query user's enrolled courses
        const { data: enrollments, error: enrollErr } = await supabase
          .from('enrollments')
          .select('course_id, courses(*, lessons(*))')
          .eq('user_id', currentUid);

        if (!enrollErr && enrollments && enrollments.length > 0) {
          coursesList = enrollments
            .map((e) => e.courses)
            .filter(Boolean);
        } else {
          // If no enrollments, check courses created by user
          const { data: createdCourses, error: courseErr } = await supabase
            .from('courses')
            .select('*, lessons(*)')
            .eq('created_by', currentUid)
            .order('created_at', { ascending: false });

          if (!courseErr && createdCourses && createdCourses.length > 0) {
            coursesList = createdCourses;
          }
        }
      }
    } catch {
      // fallback to user-isolated storage
    }
  }

  // Fallback to local storage for current user
  if (coursesList.length === 0) {
    try {
      const raw = localStorage.getItem(getCoursesStorageKey(uid));
      coursesList = raw ? JSON.parse(raw) : [];
    } catch {
      coursesList = [];
    }
  }

  const completedSet = getCompletedLessonIds(uid);

  // Enrich with live calculation
  return coursesList.map((course) => {
    const lessons = course.lessons || [];
    const total = lessons.length;
    const completedCount = lessons.filter((l) => completedSet.has(l.id)).length;
    const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

    return {
      ...course,
      total_lessons: total,
      completed_lessons_count: completedCount,
      progress_percent: progressPercent,
      is_completed: total > 0 && completedCount === total,
    };
  });
}

/**
 * Retrieves a single course by ID with its lessons
 */
export async function getCourseById(courseId, userId = null) {
  const allCourses = await getCourses(userId);
  const course = allCourses.find((c) => c.id === courseId);
  if (!course) return null;

  const completedSet = getCompletedLessonIds(userId);
  const enrichedLessons = (course.lessons || []).map((lesson) => ({
    ...lesson,
    is_completed: completedSet.has(lesson.id),
  }));

  const completedCount = enrichedLessons.filter((l) => l.is_completed).length;
  const total = enrichedLessons.length;
  const progressPercent = total > 0 ? Math.round((completedCount / total) * 100) : 0;

  return {
    ...course,
    lessons: enrichedLessons,
    total_lessons: total,
    completed_lessons_count: completedCount,
    progress_percent: progressPercent,
    is_completed: total > 0 && completedCount === total,
  };
}

/**
 * Imports a YouTube playlist as a new course
 */
export async function importPlaylistCourse(playlistUrl, category = 'General', customTitle = null, userId = null) {
  const uid = userId || getActiveUserId();
  const playlistData = await fetchPlaylistData(playlistUrl, category);

  const newCourseId = generateUuid();
  const lessons = playlistData.lessons.map((lesson, idx) => ({
    id: generateUuid(),
    course_id: newCourseId,
    youtube_video_id: lesson.youtube_video_id,
    title: lesson.title,
    description: lesson.description || '',
    duration_seconds: lesson.duration_seconds || 1200,
    position: idx + 1,
    thumbnail_url: lesson.thumbnail_url,
  }));

  const newCourse = {
    id: newCourseId,
    youtube_playlist_id: playlistData.youtube_playlist_id,
    title: customTitle?.trim() || playlistData.title,
    description: playlistData.description,
    thumbnail_url: playlistData.thumbnail_url,
    channel_title: playlistData.channel_title,
    category: category || playlistData.category,
    total_lessons: lessons.length,
    total_duration_seconds: playlistData.total_duration_seconds,
    created_by: uid,
    created_at: new Date().toISOString(),
    lessons,
  };

  // Save to user-scoped storage
  try {
    const raw = localStorage.getItem(getCoursesStorageKey(uid));
    const existing = raw ? JSON.parse(raw) : [];
    const updated = [newCourse, ...existing];
    localStorage.setItem(getCoursesStorageKey(uid), JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to store new course in localStorage:', err);
  }

  // Attempt Supabase insert if available
  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      const effectiveUid = uid || user?.id;

      const { data: userCourse, error: courseErr } = await supabase
        .from('courses')
        .insert({
          id: newCourse.id,
          youtube_playlist_id: newCourse.youtube_playlist_id,
          title: newCourse.title,
          description: newCourse.description,
          thumbnail_url: newCourse.thumbnail_url,
          channel_title: newCourse.channel_title,
          category: newCourse.category,
          total_lessons: newCourse.total_lessons,
          total_duration_seconds: newCourse.total_duration_seconds,
          created_by: effectiveUid,
        })
        .select()
        .single();

      if (!courseErr && userCourse) {
        // Enroll current user in newly imported course
        if (effectiveUid) {
          await supabase.from('enrollments').upsert({
            user_id: effectiveUid,
            course_id: userCourse.id,
            enrolled_at: new Date().toISOString(),
          });
        }

        const dbLessons = lessons.map((l) => ({
          id: l.id,
          course_id: userCourse.id,
          youtube_video_id: l.youtube_video_id,
          title: l.title,
          description: l.description,
          duration_seconds: l.duration_seconds,
          position: l.position,
        }));
        await supabase.from('lessons').insert(dbLessons);
      }
    } catch (err) {
      console.warn('Supabase course persistence notice:', err);
    }
  }

  return newCourse;
}

/**
 * Toggles lesson completion status with strict XP deduplication
 */
export async function toggleLessonCompletion(courseId, lessonId, lessonTitle = 'Lesson', userId = null) {
  const uid = userId || getActiveUserId();
  const completedSet = getCompletedLessonIds(uid);
  const wasCompleted = completedSet.has(lessonId);

  let awardedResult = null;

  if (!wasCompleted) {
    // Mark as completed
    completedSet.add(lessonId);
    saveCompletedLessonIds(completedSet, uid);

    // Award 50 XP with deduplication
    awardedResult = await awardXP({
      amount: 50,
      source: 'lesson_complete',
      referenceId: lessonId,
      description: `Completed lesson: ${lessonTitle}`,
      userId: uid,
    });
  } else {
    // Toggle off
    completedSet.delete(lessonId);
    saveCompletedLessonIds(completedSet, uid);
  }

  // Sync with Supabase if online
  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      const effectiveUid = uid || user?.id;
      if (effectiveUid && UUID_REGEX.test(lessonId)) {
        if (!wasCompleted) {
          await supabase.from('lesson_completions').upsert({
            user_id: effectiveUid,
            lesson_id: lessonId,
            completed_at: new Date().toISOString(),
          });
        } else {
          await supabase
            .from('lesson_completions')
            .delete()
            .match({ user_id: effectiveUid, lesson_id: lessonId });
        }
      }
    } catch (err) {
      console.warn('Supabase lesson completion sync notice:', err);
    }
  }

  return {
    isCompleted: !wasCompleted,
    awardedResult,
  };
}
