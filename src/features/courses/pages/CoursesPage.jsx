import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { INITIAL_COURSES } from '../../../lib/mockData';
import { BookOpen, Plus, Play, Clock, Sparkles } from 'lucide-react';

export function CoursesPage() {
  const [courses] = useState(() => {
    try {
      const stored = localStorage.getItem('nexhack_courses');
      return stored ? JSON.parse(stored) : INITIAL_COURSES;
    } catch {
      return INITIAL_COURSES;
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-400" />
            <span>My Courses</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Convert YouTube playlists into structured learning journeys
          </p>
        </div>
        <button
          onClick={() => alert('Stage 4 brings full YouTube Data API playlist import!')}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-sm font-semibold transition-all shadow-md shadow-brand-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>Import Playlist</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div
            key={course.id}
            className="group rounded-2xl bg-slate-900/80 border border-slate-800 overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between"
          >
            <div className="relative aspect-video w-full bg-slate-800 overflow-hidden">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-2 left-2 text-[11px] font-medium px-2 py-0.5 rounded bg-black/60 text-slate-200">
                {course.channel_title}
              </span>
            </div>

            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div>
                <h3 className="font-semibold text-base text-white group-hover:text-brand-300 transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="space-y-3 pt-3 border-t border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    {course.total_lessons || course.lessons?.length || 0} Lessons
                  </span>
                  <span className="flex items-center gap-1 text-amber-400 font-medium">
                    <Sparkles className="w-3.5 h-3.5" />
                    +50 XP / Lesson
                  </span>
                </div>

                <Link
                  to={`/courses/${course.id}`}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-brand-600 hover:text-white text-slate-200 text-xs font-semibold transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Open Course Player</span>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
