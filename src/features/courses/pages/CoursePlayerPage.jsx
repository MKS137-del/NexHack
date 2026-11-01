import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { INITIAL_COURSES } from '../../../lib/mockData';
import { ArrowLeft, CheckCircle2, Play, BookOpen, Clock, Sparkles } from 'lucide-react';

export function CoursePlayerPage() {
  const { id } = useParams();
  const courses = INITIAL_COURSES;
  const course = courses.find((c) => c.id === id) || courses[0];

  const lessons = course.lessons || [];
  const [activeLesson, setActiveLesson] = useState(lessons[0] || null);
  const [completed, setCompleted] = useState(new Set(['l-101']));

  const toggleComplete = (lessonId) => {
    setCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(lessonId)) {
        next.delete(lessonId);
      } else {
        next.add(lessonId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-6">
      <Link
        to="/courses"
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Courses</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Video Player */}
        <div className="lg:col-span-2 space-y-4">
          <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black border border-slate-800 shadow-2xl">
            {activeLesson?.youtube_video_id ? (
              <iframe
                title={activeLesson.title}
                src={`https://www.youtube-nocookie.com/embed/${activeLesson.youtube_video_id}?autoplay=0&rel=0`}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-slate-500">
                No video lesson selected
              </div>
            )}
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-semibold text-brand-400">Lesson {activeLesson?.position || 1}</span>
                <h1 className="text-xl font-bold text-white mt-0.5">{activeLesson?.title}</h1>
              </div>

              {activeLesson && (
                <button
                  onClick={() => toggleComplete(activeLesson.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 ${
                    completed.has(activeLesson.id)
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-brand-600 hover:bg-brand-500 text-white shadow-md shadow-brand-500/20'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{completed.has(activeLesson.id) ? 'Completed (+50 XP)' : 'Mark Lesson Complete'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Lesson Checklist Sidebar */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
            <div>
              <h2 className="text-base font-bold text-white">Course Syllabus</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {completed.size}/{lessons.length} lessons finished
              </p>
            </div>

            <div className="space-y-2">
              {lessons.map((lesson) => {
                const isSelected = activeLesson?.id === lesson.id;
                const isDone = completed.has(lesson.id);

                return (
                  <button
                    key={lesson.id}
                    onClick={() => setActiveLesson(lesson)}
                    className={`w-full text-left p-3 rounded-xl border text-xs font-medium transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-brand-600/15 border-brand-500 text-white'
                        : 'bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                        isDone ? 'text-emerald-400' : 'text-slate-600'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4 fill-current" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`line-clamp-2 leading-relaxed ${isSelected ? 'text-white font-semibold' : ''}`}>
                        {lesson.position}. {lesson.title}
                      </p>
                      <span className="text-[10px] text-slate-500 mt-1 block">
                        {Math.round(lesson.duration_seconds / 60)} mins
                      </span>
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
