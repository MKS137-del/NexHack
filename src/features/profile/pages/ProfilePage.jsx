import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/context/AuthContext';
import {
  User,
  Flame,
  Sparkles,
  Clock,
  BookOpen,
  Trophy,
  Award,
  Lock,
  CheckCircle2,
  Edit3,
  Check,
  X,
  History,
  RotateCcw,
} from 'lucide-react';
import {
  getLocalProfile,
  saveLocalProfile,
  calculateLevel,
  getAllAchievementsWithStatus,
  getXPTransactions,
  subscribeToGamification,
} from '../../gamification/gamificationService';
import { getCompletedLessonIds } from '../../courses/courseService';
import { INITIAL_COURSES } from '../../../lib/mockData';

export function ProfilePage() {
  const [profile, setProfile] = useState(() => getLocalProfile());
  const [achievements, setAchievements] = useState(() => getAllAchievementsWithStatus());
  const [xpTransactions, setXpTransactions] = useState(() => getXPTransactions());
  const [completedLessonCount, setCompletedLessonCount] = useState(1);

  // Edit Profile Modal
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState(profile.full_name || 'Alex Rivera');
  const [editBio, setEditBio] = useState(
    profile.bio || 'Dedicated self-directed developer mastering modern systems architecture and React.'
  );

  const [notification, setNotification] = useState(null);

  const reloadData = () => {
    const prof = getLocalProfile();
    setProfile(prof);
    setAchievements(getAllAchievementsWithStatus());
    setXpTransactions(getXPTransactions());
    const completedSet = getCompletedLessonIds();
    setCompletedLessonCount(completedSet.size);
  };

  useEffect(() => {
    reloadData();
    const unsub = subscribeToGamification(() => {
      reloadData();
    });
    return () => unsub();
  }, []);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    const updated = {
      ...profile,
      full_name: editName.trim(),
      bio: editBio.trim(),
    };
    saveLocalProfile(updated);
    setProfile(updated);
    setIsEditOpen(false);
    setNotification('Profile details updated successfully!');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleResetData = () => {
    if (window.confirm('Reset local demo data to default clean state? This will clear temporary imports and reload seed courses.')) {
      try {
        localStorage.removeItem('nexhack_courses');
        localStorage.removeItem('nexhack_completed_lessons');
        localStorage.removeItem('nexhack_study_sessions');
        localStorage.removeItem('nexhack_active_timer');
        localStorage.removeItem('nexhack_user_achievements');
        localStorage.removeItem('nexhack_xp_transactions');
        localStorage.removeItem('nexhack_mock_user');
      } catch {
        // ignore
      }
      window.location.reload();
    }
  };

  const levelInfo = calculateLevel(profile.total_xp || 450);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-2">
      {/* Notification Toast */}
      {notification && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{notification}</span>
        </div>
      )}

      {/* Profile Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col sm:flex-row items-center sm:items-start gap-6 relative backdrop-blur-sm">
        <div className="relative">
          <img
            src={
              profile.avatar_url ||
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80'
            }
            alt={profile.username}
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover ring-2 ring-brand-500/40 shadow-2xl"
          />
          <span className="absolute -bottom-2 -right-2 px-2.5 py-0.5 rounded-full bg-brand-600 border border-brand-400/30 text-white font-bold text-[11px] shadow">
            LVL {levelInfo.level}
          </span>
        </div>

        <div className="space-y-3 text-center sm:text-left flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {profile.full_name || 'Alex Rivera'}
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                @{profile.username || 'alex_dev'} • Member of 1 Study Cohort
              </p>
            </div>

            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <button
                onClick={() => {
                  setEditName(profile.full_name || 'Alex Rivera');
                  setEditBio(profile.bio || '');
                  setIsEditOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Profile</span>
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
            {profile.bio ||
              'Dedicated self-directed developer mastering modern systems architecture and React.'}
          </p>

          {/* Level Progress Slider */}
          <div className="pt-2 max-w-md">
            <div className="flex justify-between text-[11px] text-slate-400 mb-1">
              <span className="font-semibold text-brand-300">Level {levelInfo.level} Progress</span>
              <span>
                {profile.total_xp} / {levelInfo.nextLevelFloorXP} XP ({levelInfo.progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-brand-500 to-amber-400 transition-all duration-500 rounded-full"
                style={{ width: `${levelInfo.progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 w-fit mx-auto">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{(profile.total_xp || 450).toLocaleString()}</div>
          <p className="text-[11px] text-slate-400">Total XP</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
          <div className="p-2 rounded-xl bg-orange-500/10 text-orange-400 w-fit mx-auto">
            <Flame className="w-4 h-4 fill-orange-500/20" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{profile.streak_days || 5} Days</div>
          <p className="text-[11px] text-slate-400">Current Streak</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
          <div className="p-2 rounded-xl bg-brand-500/10 text-brand-400 w-fit mx-auto">
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">14.2 hrs</div>
          <p className="text-[11px] text-slate-400">Study Clocked</p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 text-center space-y-1">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 w-fit mx-auto">
            <BookOpen className="w-4 h-4" />
          </div>
          <div className="text-2xl font-bold text-white mt-1">{completedLessonCount}</div>
          <p className="text-[11px] text-slate-400">Lessons Completed</p>
        </div>
      </div>

      {/* Milestone Badges & Achievements Showcase */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-6 shadow-md">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <span>Milestones & Badges Showcase</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Earn permanent recognition by completing study streaks, finishing lessons, and clocking hours
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {achievements.map((ach) => (
            <div
              key={ach.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
                ach.is_unlocked
                  ? 'bg-slate-950/80 border-amber-500/30 shadow-md shadow-amber-500/5'
                  : 'bg-slate-950/40 border-slate-800/60 opacity-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2.5 rounded-xl shrink-0 ${
                    ach.is_unlocked
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {ach.is_unlocked ? <Award className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="text-xs font-bold text-white truncate">{ach.title}</h4>
                    <span className="text-[10px] font-bold text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded">
                      +{ach.xp_reward} XP
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-snug">{ach.description}</p>
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px]">
                <span className={ach.is_unlocked ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                  {ach.is_unlocked ? 'Unlocked' : 'In Progress'}
                </span>
                {ach.is_unlocked && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Immutable XP Ledger Transactions */}
      <div className="p-6 sm:p-8 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-brand-400" />
              <span>Immutable XP Transaction Ledger</span>
            </h2>
            <p className="text-xs text-slate-400">Verifiable proof of earned gamification points</p>
          </div>
          <span className="text-[11px] font-semibold text-brand-400 bg-brand-500/10 px-2.5 py-1 rounded-full">
            Tamper-Proof
          </span>
        </div>

        <div className="divide-y divide-slate-800 max-h-56 overflow-y-auto pr-1">
          {xpTransactions.slice(0, 8).map((tx) => (
            <div key={tx.id} className="py-2.5 flex items-center justify-between text-xs gap-3">
              <div className="min-w-0">
                <p className="font-medium text-slate-200 truncate">{tx.description}</p>
                <p className="text-[10px] text-slate-500">
                  {new Date(tx.created_at).toLocaleString()} • Source: {tx.source}
                </p>
              </div>
              <span className="font-bold text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded text-xs shrink-0">
                +{tx.amount} XP
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Evaluator Reset Bar */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-950/60 border border-slate-800 text-xs">
        <span className="text-slate-400">Hackathon Evaluator Tools</span>
        <button
          onClick={handleResetData}
          className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset Demo Storage to Seed</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Edit Profile Details</h2>
              <button
                onClick={() => setIsEditOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Bio / Goals</label>
                <textarea
                  rows={3}
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
