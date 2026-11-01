import React, { useState, useEffect } from 'react';
import {
  Users,
  Lock,
  Globe,
  Plus,
  KeyRound,
  Shield,
  Clock,
  Sparkles,
  Search,
  CheckCircle2,
  Copy,
  Check,
  X,
  Layers,
  ArrowRight,
  LogOut,
} from 'lucide-react';
import {
  getGroups,
  createGroup,
  joinGroup,
  joinGroupByCode,
  leaveGroup,
} from '../groupService';

export function GroupsPage() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('my-groups'); // 'my-groups' | 'explore'
  const [search, setSearch] = useState('');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinCodeOpen, setIsJoinCodeOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Form states
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState('Full Stack');
  const [newTargetHours, setNewTargetHours] = useState('10');
  const [isPrivate, setIsPrivate] = useState(false);
  const [codeInputValue, setCodeInputValue] = useState('');

  const [feedback, setFeedback] = useState(null);
  const [copiedCode, setCopiedCode] = useState(false);

  const loadGroupsData = async () => {
    try {
      setLoading(true);
      const data = await getGroups();
      setGroups(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroupsData();
  }, []);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    try {
      const created = await createGroup({
        name: newName,
        description: newDesc,
        is_private: isPrivate,
        category: newCategory,
        weekly_target_hours: newTargetHours,
      });

      setIsCreateOpen(false);
      setNewName('');
      setNewDesc('');
      setFeedback(`Group "${created.name}" created! ${created.invite_code ? `Invite Code: ${created.invite_code}` : ''}`);
      setTimeout(() => setFeedback(null), 6000);
      await loadGroupsData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleJoinByCodeSubmit = async (e) => {
    e.preventDefault();
    if (!codeInputValue.trim()) return;

    try {
      const res = await joinGroupByCode(codeInputValue);
      setIsJoinCodeOpen(false);
      setCodeInputValue('');
      setFeedback(`Successfully joined "${res.group.name}"!`);
      setTimeout(() => setFeedback(null), 5000);
      await loadGroupsData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleQuickJoin = async (groupId, groupName) => {
    await joinGroup(groupId);
    setFeedback(`Joined "${groupName}"!`);
    setTimeout(() => setFeedback(null), 4000);
    await loadGroupsData();
  };

  const handleLeave = async (groupId) => {
    await leaveGroup(groupId);
    setSelectedGroup(null);
    setFeedback('Left group.');
    setTimeout(() => setFeedback(null), 4000);
    await loadGroupsData();
  };

  const copyCode = (code) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(code);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filteredGroups = groups.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase());
    if (activeTab === 'my-groups') return matchesSearch && g.is_member;
    return matchesSearch && !g.is_private; // explore shows public groups
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-brand-400" />
            <span>Study Groups & Cohorts</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Maintain daily peer accountability, track group goals, and study together
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsJoinCodeOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors"
          >
            <KeyRound className="w-4 h-4 text-amber-400" />
            <span>Join via Code</span>
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Group</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs animate-slide-up">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-semibold">{feedback}</span>
        </div>
      )}

      {/* Navigation Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'my-groups'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            My Cohorts ({groups.filter((g) => g.is_member).length})
          </button>
          <button
            onClick={() => setActiveTab('explore')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              activeTab === 'explore'
                ? 'bg-brand-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            Explore Public Cohorts
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search study groups..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
          />
        </div>
      </div>

      {/* Groups Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-3xl bg-slate-900 border border-slate-800 h-64 animate-pulse" />
          ))}
        </div>
      ) : filteredGroups.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-slate-900/40 border border-slate-800 space-y-4 shadow-sm">
          <Users className="w-12 h-12 text-slate-600 mx-auto" />
          <div className="max-w-md mx-auto">
            <h3 className="text-base sm:text-lg font-bold text-white">
              {activeTab === 'my-groups'
                ? "You Haven't Joined Any Study Groups Yet"
                : "No Cohorts Found in This Category"}
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              {activeTab === 'my-groups'
                ? 'Join a public peer cohort, enter a private invite code, or create your own cohort to build collective accountability.'
                : 'Try searching for different terms or create a new public cohort for your peers.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            {activeTab === 'my-groups' && (
              <button
                onClick={() => setActiveTab('explore')}
                className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all shadow-sm"
              >
                Explore Public Cohorts
              </button>
            )}
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
            >
              Create New Group
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((grp) => (
            <div
              key={grp.id}
              className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between shadow-lg space-y-4"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={grp.avatar_url}
                      alt={grp.name}
                      className="w-12 h-12 rounded-2xl object-cover ring-1 ring-slate-700 shrink-0"
                    />
                    <div>
                      <h3 className="font-bold text-base text-white">{grp.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] text-slate-400">
                          {grp.member_count || 1} members
                        </span>
                        <span className="text-slate-600">•</span>
                        <span className="text-[11px] text-brand-400 font-medium">
                          {grp.category || 'Engineering'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {grp.is_private ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 text-[10px] font-semibold border border-amber-500/20">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                  {grp.description || 'Collaborative study space.'}
                </p>

                {/* Weekly Goal Indicator */}
                <div className="p-3 rounded-2xl bg-slate-950/60 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-brand-400" />
                      Weekly Target
                    </span>
                    <span className="font-semibold text-slate-200">
                      {grp.weekly_target_hours || 10}h / week
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                {grp.is_member ? (
                  <button
                    onClick={() => setSelectedGroup(grp)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                  >
                    <span>View Cohort Details</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <button
                    onClick={() => handleQuickJoin(grp.id, grp.name)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold transition-all shadow-md shadow-brand-500/20"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Join Public Group</span>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Group Detail Modal */}
      {selectedGroup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <img
                  src={selectedGroup.avatar_url}
                  alt={selectedGroup.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-1 ring-slate-700"
                />
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedGroup.name}</h2>
                  <p className="text-xs text-slate-400">{selectedGroup.member_count} active members</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroup(null)}
                className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{selectedGroup.description}</p>

            {/* Invite Code Bar if Private */}
            {selectedGroup.invite_code && (
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
                    Cohort Invite Code
                  </p>
                  <p className="font-mono text-base font-bold text-white mt-0.5">
                    {selectedGroup.invite_code}
                  </p>
                </div>
                <button
                  onClick={() => copyCode(selectedGroup.invite_code)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition-colors"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            )}

            {/* Member Cohort List */}
            <div className="space-y-2">
              <p className="text-xs font-semibold text-slate-300">Cohort Members</p>
              <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-300">
                  <span>Alex Rivera (You)</span>
                  <span className="text-emerald-400 font-semibold">Active Member</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Elena Rostova</span>
                  <span className="text-slate-500 font-medium">9.5h studied</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Kunal Verma</span>
                  <span className="text-slate-500 font-medium">7.2h studied</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                onClick={() => handleLeave(selectedGroup.id)}
                className="flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 font-semibold"
              >
                <LogOut className="w-4 h-4" />
                <span>Leave Cohort</span>
              </button>
              <button
                onClick={() => setSelectedGroup(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Group Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Create New Study Cohort</h2>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Group Name</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. 100 Days of Code Sprint"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="What is this cohort focusing on?"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="Web Dev">Web Dev</option>
                    <option value="Algorithms">Algorithms</option>
                    <option value="CS Core">CS Core</option>
                    <option value="AI / ML">AI / ML</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Weekly Target</label>
                  <select
                    value={newTargetHours}
                    onChange={(e) => setNewTargetHours(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-brand-500"
                  >
                    <option value="5">5 Hours / wk</option>
                    <option value="10">10 Hours / wk</option>
                    <option value="15">15 Hours / wk</option>
                    <option value="20">20 Hours / wk</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4 h-4 rounded text-brand-600 bg-slate-950 border-slate-800 focus:ring-0"
                  />
                  <span className="text-xs text-slate-300 font-medium">
                    Make Group Private (Requires Invite Code)
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20"
                >
                  Create Group
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Join via Code Modal */}
      {isJoinCodeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Join Private Cohort</span>
              </h2>
              <button
                onClick={() => setIsJoinCodeOpen(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleJoinByCodeSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Enter Invite Code
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NEX-8K2"
                  value={codeInputValue}
                  onChange={(e) => setCodeInputValue(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono font-bold text-sm text-white placeholder-slate-600 focus:outline-none focus:border-brand-500 uppercase tracking-widest"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold shadow-md shadow-brand-500/20 transition-all"
              >
                Verify & Join Cohort
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
