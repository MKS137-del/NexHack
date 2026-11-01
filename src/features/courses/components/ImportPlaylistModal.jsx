import React, { useState } from 'react';
import { X, Youtube, Sparkles, Loader2, BookOpen, AlertCircle, CheckCircle2, Key, ChevronDown, ChevronUp } from 'lucide-react';
import { CURATED_PLAYLIST_PRESETS, extractPlaylistId, extractVideoId, getYouTubeApiKey } from '../youtubeService';
import { importPlaylistCourse } from '../courseService';

export function ImportPlaylistModal({ isOpen, onClose, onImportSuccess }) {
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState('Web Development');
  const [customTitle, setCustomTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [apiKey, setApiKey] = useState(() => getYouTubeApiKey() || '');

  if (!isOpen) return null;

  const detectedPlaylistId = extractPlaylistId(url);
  const detectedVideoId = !detectedPlaylistId ? extractVideoId(url) : null;
  const isValidTarget = Boolean(detectedPlaylistId || detectedVideoId);

  const handleApiKeyChange = (val) => {
    setApiKey(val);
    try {
      if (val.trim()) {
        localStorage.setItem('nexhack_youtube_api_key', val.trim());
      } else {
        localStorage.removeItem('nexhack_youtube_api_key');
      }
    } catch {
      // ignore
    }
  };

  const handleSelectPreset = (preset) => {
    setUrl(`https://www.youtube.com/playlist?list=${preset.playlistId}`);
    setCategory(preset.category);
    setCustomTitle(preset.title);
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a valid YouTube playlist or video URL.');
      return;
    }

    if (!isValidTarget) {
      setError('Could not extract a valid YouTube playlist or video ID from the provided URL.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newCourse = await importPlaylistCourse(url, category, customTitle);
      setLoading(false);
      onImportSuccess(newCourse);
      onClose();
    } catch (err) {
      setLoading(false);
      setError(err.message || 'Failed to import playlist. Please verify the URL.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800/80 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
              <Youtube className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Import YouTube Playlist</h2>
              <p className="text-xs text-slate-400">Transform public video lectures into trackable study courses</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} id="import-form" className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                YouTube Playlist Link or Video URL
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://www.youtube.com/playlist?list=PL..."
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all pr-32"
                  required
                />
                {detectedPlaylistId && (
                  <span className="absolute right-3 top-3.5 inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Playlist Detected
                  </span>
                )}
                {detectedVideoId && (
                  <span className="absolute right-3 top-3.5 inline-flex items-center gap-1 text-[11px] font-medium text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-md">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Single Lecture
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-brand-500 transition-all"
                >
                  <option value="Web Development">Web Development</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Data Structures">Data Structures & Algos</option>
                  <option value="AI & Machine Learning">AI & Machine Learning</option>
                  <option value="System Design">System Design</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Course Title <span className="text-slate-500 font-normal">(optional override)</span>
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Leave empty to use YouTube title"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 transition-all"
                />
              </div>
            </div>

            {/* Optional Custom API Key */}
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="text-[11px] text-slate-400 hover:text-slate-200 inline-flex items-center gap-1.5 transition-colors"
              >
                <Key className="w-3 h-3 text-brand-400" />
                <span>Google YouTube Data API v3 Key (Optional)</span>
                {showApiKey ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showApiKey && (
                <div className="mt-2 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl space-y-1 animate-fade-in">
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => handleApiKeyChange(e.target.value)}
                    placeholder="AIzaSy... (leave blank to use automatic zero-key feed proxy)"
                    className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/70 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
                  />
                  <p className="text-[10px] text-slate-400">
                    NexHack automatically fetches YouTube feeds without requiring an API key. If you have your own Google API key, you can enter it here.
                  </p>
                </div>
              )}
            </div>
          </form>

          {/* Evaluator Quick Presets */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Or Select an Instant Curated Demo Course</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CURATED_PLAYLIST_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className="text-left p-3 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-800 hover:border-slate-700 transition-all group"
                >
                  <p className="text-xs font-semibold text-white group-hover:text-brand-300 transition-colors line-clamp-1">
                    {preset.title}
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{preset.channel}</span>
                    <span className="text-brand-400 font-medium">{preset.lessons.length} lessons</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-800/80 bg-slate-950/40">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="import-form"
            disabled={loading || !url.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-50 text-white text-xs font-semibold transition-all shadow-md shadow-brand-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Importing Live Course...</span>
              </>
            ) : (
              <>
                <BookOpen className="w-4 h-4" />
                <span>Import Course</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
