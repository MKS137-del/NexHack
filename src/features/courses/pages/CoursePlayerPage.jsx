import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Play,
  BookOpen,
  Clock,
  Sparkles,
  Timer,
  ChevronRight,
  ChevronLeft,
  Award,
  Layers,
} from 'lucide-react';
import { getCourseById, toggleLessonCompletion } from '../courseService';

export function CoursePlayerPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeLesson, setActiveLesson] = useState(null);
  const [xpCelebration, setXpCelebration] = useState(null);

  const loadCourseData = async () => {
    try {
      setLoading(true);
      const data = await getCourseById(id);
      setCourse(data);
      if (data && data.lessons?.length > 0) {
        // default to first incomplete lesson or first lesson
        const firstIncomplete = data.lessons.find((l) => !l.is_completed);
        setActiveLesson(firstIncomplete || data.lessons[0]);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourseData();
  }, [id]);

  const handleToggleComplete = async (lesson) => {
    if (!course || !lesson) return;
    const res = await toggleLessonCompletion(course.id, lesson.id, lesson.title);

    if (res.isCompleted && res.awardedResult) {
      setXpCelebration(`+50 XP Earned! ${res.awardedResult.unlockedBadges?.length ? '🏆 New Badge Unlocked!' : ''}`);
      setTimeout(() => setXpCelebration(null), 4000);
    }

    // Refresh course state
    const refreshed = await getCourseById(id);
    setCourse(refreshed);
    const updatedActive = refreshed.lessons.find((l) => l.id === lesson.id);
    if (updatedActive) setActiveLesson(updatedActive);
  };

  const handleNextLesson = () => {
    if (!course || !activeLesson) return;
    const currentIndex = course.lessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIndex < course.lessons.length - 1) {
      setActiveLesson(course.lessons[currentIndex + 1]);
    }
  };

  const handlePrevLesson = () => {
    if (!course || !activeLesson) return;
    const currentIndex = course.lessons.findIndex((l) => l.id === activeLesson.id);
    if (currentIndex > 0) {
      setActiveLesson(course.lessons[currentIndex - 1]);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-36 bg-slate-800 rounded-lg" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="aspect-video w-full rounded-3xl bg-slate-800" />
            <div className="h-28 rounded-2xl bg-slate-800" />
          </div>
          <div className="h-96 rounded-2xl bg-slate-800" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <Layers className="w-10 h-10 text-slate-600 mx-auto" />
        <h3 className="text-lg font-bold text-white">Course not found</h3>
        <p className="text-xs text-slate-400">The requested learning module could not be loaded.</p>
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Catalog</span>
        </Link>
      </div>
    );
  }

  const currentIndex = course.lessons.findIndex((l) => l.id === activeLesson?.id);
  const hasNext = currentIndex < course.lessons.length - 1;
  const hasPrev = currentIndex > 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          to="/courses"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Course Catalog</span>
        </Link>

        {/* XP Celebration Banner */}
        {xpCelebration && (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{xpCelebration}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Main Video Player & Lesson Details */}
        <div className="lg:col-span-2 space-y-4">
          {/* YouTube Responsive Embed */}
          <div className="aspect-video w-full rounded-3xl overflow-hidden bg-black border border-slate-800 shadow-2xl relative">
            {activeLesson?.youtube_video_id ? (
              <iframe
                key={activeLesson.id}
                title={activeLesson.title}
                src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtube_video_id}?autoplay=0&rel=0&modestbranding=1`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Play className="w-8 h-8" />
                <span className="text-xs">Select a video lesson from the syllabus to begin</span>
              </div>
            )}
          </div>

          {/* Lesson Action Header */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-brand-400 px-2.5 py-0.5 rounded-full bg-brand-500/10">
                    Lesson {activeLesson?.position || 1} of {course.total_lessons}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {Math.round((activeLesson?.duration_seconds || 600) / 60)} minutes
                  </span>
                </div>
                <h1 className="text-xl font-bold text-white mt-1.5 leading-snug">
                  {activeLesson?.title}
                </h1>
              </div>

              {activeLesson && (
                <button
                  onClick={() => handleToggleComplete(activeLesson)}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 shadow-md ${
                    activeLesson.is_completed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>
                    {activeLesson.is_completed ? 'Completed (+50 XP)' : 'Mark Lesson Complete'}
                  </span>
                </button>
              )}
            </div>

            {/* Navigation & Study Timer Quick Launcher */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-800">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevLesson}
                  disabled={!hasPrev}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-xs font-medium text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
                <button
                  onClick={handleNextLesson}
                  disabled={!hasNext}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 text-xs font-medium text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                >
                  <span>Next Lesson</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                onClick={() => navigate('/timer')}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-semibold transition-colors"
              >
                <Timer className="w-3.5 h-3.5 text-amber-400" />
                <span>Track Study Time For This Lesson</span>
              </button>
            </div>

            {/* Description */}
            {activeLesson?.description && (
              <div className="pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed whitespace-pre-line">
                {activeLesson.description}
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Course Syllabus Checklist */}
        <div className="space-y-4">
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-5 shadow-lg">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base font-bold text-white">Course Syllabus</h2>
                <span className="text-xs font-semibold text-emerald-400">
                  {course.progress_percent}%
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {course.completed_lessons_count} of {course.total_lessons} lessons finished
              </p>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden mt-3">
                <div
                  className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${course.progress_percent}%` }}
                />
              </div>
            </div>

            {/* Lessons List */}
            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {course.lessons.map((lesson) => {
                const isSelected = activeLesson?.id === lesson.id;
                const isDone = lesson.is_completed;

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-3.5 rounded-2xl border text-xs font-medium transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500 text-white shadow-sm'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isDone ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-4 h-4 fill-emerald-500/20 text-emerald-400" />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-slate-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`line-clamp-2 leading-relaxed ${
                          isSelected ? 'text-white font-semibold' : ''
                        }`}
                      >
                        {lesson.position}. {lesson.title}
                      </p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                        <span>{Math.round(lesson.duration_seconds / 60)}m</span>
                        {isDone && <span className="text-emerald-400 font-medium">+50 XP</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
