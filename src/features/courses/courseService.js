/**
 * Course Management Service
 * Handles course listings, playlist imports, lesson syllabus, and completion tracking.
 */

import { supabase, isSupabaseConfigured } from '../../lib/supabase.js';
import { INITIAL_COURSES } from '../../lib/mockData.js';
import { fetchPlaylistData } from './youtubeService.js';
import { awardXP } from '../gamification/gamificationService.js';

const COURSES_STORAGE_KEY = 'nexhack_courses';
const COMPLETED_LESSONS_STORAGE_KEY = 'nexhack_completed_lessons';

/**
 * Returns set of completed lesson IDs
 */
export function getCompletedLessonIds() {
  try {
    const raw = localStorage.getItem(COMPLETED_LESSONS_STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set(['l-101']);
  } catch {
    return new Set(['l-101']);
  }
}

/**
 * Saves completed lesson IDs set
 */
function saveCompletedLessonIds(set) {
  try {
    localStorage.setItem(COMPLETED_LESSONS_STORAGE_KEY, JSON.stringify(Array.from(set)));
  } catch (err) {
    console.error('Failed to save completed lessons:', err);
  }
}

/**
 * Retrieves all courses, calculating completion percentages
 */
export async function getCourses() {
  let coursesList = [];

  // Try Supabase first if configured
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*, lessons(*)')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        coursesList = data;
      }
    } catch {
      // fallback to local
    }
  }

  // Fallback to local storage or initial seed
  if (coursesList.length === 0) {
    try {
      const raw = localStorage.getItem(COURSES_STORAGE_KEY);
      coursesList = raw ? JSON.parse(raw) : INITIAL_COURSES;
    } catch {
      coursesList = INITIAL_COURSES;
    }
  }

  const completedSet = getCompletedLessonIds();

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
export async function getCourseById(courseId) {
  const allCourses = await getCourses();
  const course = allCourses.find((c) => c.id === courseId) || allCourses[0];
  if (!course) return null;

  const completedSet = getCompletedLessonIds();
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
export async function importPlaylistCourse(playlistUrl, category = 'General', customTitle = null) {
  const playlistData = await fetchPlaylistData(playlistUrl, category);

  const newCourseId = `course-${Date.now()}`;
  const lessons = playlistData.lessons.map((lesson, idx) => ({
    id: `lesson-${Date.now()}-${idx + 1}`,
    course_id: newCourseId,
    youtube_video_id: lesson.youtube_video_id,
    title: lesson.title,
    description: lesson.description || '',
    duration_seconds: lesson.duration_seconds,
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
    created_at: new Date().toISOString(),
    lessons,
  };

  // Save to localStorage
  try {
    const raw = localStorage.getItem(COURSES_STORAGE_KEY);
    const existing = raw ? JSON.parse(raw) : INITIAL_COURSES;
    const updated = [newCourse, ...existing];
    localStorage.setItem(COURSES_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to store new course in localStorage:', err);
  }

  // Attempt Supabase insert if available
  if (isSupabaseConfigured && supabase) {
    try {
      const { data: userCourse, error: courseErr } = await supabase
        .from('courses')
        .insert({
          youtube_playlist_id: newCourse.youtube_playlist_id,
          title: newCourse.title,
          description: newCourse.description,
          thumbnail_url: newCourse.thumbnail_url,
          channel_title: newCourse.channel_title,
          category: newCourse.category,
          total_lessons: newCourse.total_lessons,
          total_duration_seconds: newCourse.total_duration_seconds,
        })
        .select()
        .single();

      if (!courseErr && userCourse) {
        const dbLessons = lessons.map((l) => ({
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
      console.warn('Supabase course persistence error:', err);
    }
  }

  return newCourse;
}

/**
 * Toggles lesson completion status with strict XP deduplication
 */
export async function toggleLessonCompletion(courseId, lessonId, lessonTitle = 'Lesson') {
  const completedSet = getCompletedLessonIds();
  const wasCompleted = completedSet.has(lessonId);

  let awardedResult = null;

  if (!wasCompleted) {
    // Mark as completed
    completedSet.add(lessonId);
    saveCompletedLessonIds(completedSet);

    // Award 50 XP with deduplication
    awardedResult = await awardXP({
      amount: 50,
      source: 'lesson_complete',
      referenceId: lessonId,
      description: `Completed lesson: ${lessonTitle}`,
    });
  } else {
    // Toggle off
    completedSet.delete(lessonId);
    saveCompletedLessonIds(completedSet);
  }

  // Sync with Supabase if online
  if (isSupabaseConfigured && supabase) {
    try {
      const user = (await supabase.auth.getUser()).data?.user;
      if (user) {
        if (!wasCompleted) {
          await supabase.from('lesson_completions').upsert({
            user_id: user.id,
            lesson_id: lessonId,
            course_id: courseId,
            completed_at: new Date().toISOString(),
          });
        } else {
          await supabase
            .from('lesson_completions')
            .delete()
            .match({ user_id: user.id, lesson_id: lessonId });
        }
      }
    } catch (err) {
      console.warn('Supabase lesson completion sync deferred:', err);
    }
  }

  return {
    isCompleted: !wasCompleted,
    awardedResult,
  };
}
