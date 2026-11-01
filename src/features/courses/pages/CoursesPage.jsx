import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Play,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { getCourses } from '../courseService';
import { ImportPlaylistModal } from '../components/ImportPlaylistModal';

export function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const data = await getCourses();
      setCourses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCourses();
  }, []);

  const handleImportSuccess = (newCourse) => {
    setSuccessToast(`Successfully imported "${newCourse.title}"!`);
    loadCourses();
    setTimeout(() => setSuccessToast(null), 5000);
  };

  const categories = ['All', 'Web Development', 'Computer Science', 'Data Structures'];

  const filteredCourses = courses.filter((course) => {
    const matchesCategory =
      selectedCategory === 'All' ||
      course.category?.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      course.title?.toLowerCase().includes(search.toLowerCase()) ||
      course.channel_title?.toLowerCase().includes(search.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-brand-400" />
            <span>Course Catalog</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Import YouTube playlists into structured learning modules with verified study tracking
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all shadow-md shadow-brand-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Import YouTube Playlist</span>
        </button>
      </div>

      {/* Success Notification */}
      {successToast && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{successToast}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search courses or creators..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-2xl bg-slate-900 border border-slate-800 h-80 animate-pulse" />
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800/80 space-y-4 shadow-sm">
          <Layers className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {courses.length === 0 ? "You Haven't Imported Any Courses Yet" : "No Courses Match Your Query"}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {courses.length === 0
                ? "Paste any public YouTube playlist or video link to create a structured curriculum with verified progress and XP tracking."
                : "Try adjusting your search terms or category filter to discover imported courses."}
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-xs font-semibold text-white transition-all shadow-md shadow-brand-500/20"
          >
            <Plus className="w-4 h-4" />
            <span>Import YouTube Playlist</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const hours = Math.floor((course.total_duration_seconds || 0) / 3600);
            const minutes = Math.floor(((course.total_duration_seconds || 0) % 3600) / 60);

            return (
              <div
                key={course.id}
                className="group rounded-3xl bg-slate-900/80 border border-slate-800/80 overflow-hidden hover:border-slate-700 transition-all duration-300 flex flex-col justify-between shadow-lg hover:shadow-brand-500/5"
              >
                <div>
                  <div className="relative aspect-video w-full bg-slate-800 overflow-hidden">
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <span className="absolute bottom-3 left-3 text-[11px] font-medium px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-slate-200 border border-white/10">
                      {course.channel_title}
                    </span>
                    <span className="absolute top-3 right-3 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-500/80 backdrop-blur-md text-white">
                      {course.category}
                    </span>
                  </div>

                  <div className="p-5 space-y-3">
                    <h3 className="font-bold text-base text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                      {course.description}
                    </p>
                  </div>
                </div>

                <div className="p-5 pt-0 space-y-4">
                  {/* Progress info */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Progress</span>
                      <span className="font-semibold text-white">
                        {course.completed_lessons_count || 0} / {course.total_lessons} lessons ({course.progress_percent || 0}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-brand-500 to-emerald-400 transition-all duration-500 rounded-full"
                        style={{ width: `${course.progress_percent || 0}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      {hours > 0 ? `${hours}h ` : ''}
                      {minutes}m
                    </span>
                    <span className="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                      <Sparkles className="w-3 h-3" />
                      +50 XP/lesson
                    </span>
                  </div>

                  <Link
                    to={`/courses/${course.id}`}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 group-hover:bg-brand-600 text-slate-200 group-hover:text-white text-xs font-semibold transition-all shadow-sm"
                  >
                    <Play className="w-3.5 h-3.5 fill-current" />
                    <span>{course.progress_percent > 0 ? 'Continue Learning' : 'Start Course'}</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Playlist Import Modal */}
      <ImportPlaylistModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
}
