import React, { useState } from 'react';
import { TeamMember, MemberRole, MemberStatus } from '../types';
import {
  Users2,
  UserCheck,
  Search,
  Plus,
  Calendar,
  GraduationCap,
  Sparkles,
  CheckCircle2,
  RotateCcw,
  X,
  ShieldCheck,
  Star,
  Coffee,
  Bug,
  Smile,
  Zap,
  Quote,
  Heart,
  Award,
} from 'lucide-react';
import { playChime } from '../utils/audio';

interface TeamDirectoryProps {
  teamMembers: TeamMember[];
  onAddMember: (newMember: Partial<TeamMember>) => void;
  onUpdateMember: (id: string, updates: Partial<TeamMember>) => void;
  onSelectMemberForTasks?: (memberId: string) => void;
}

export const TeamDirectory: React.FC<TeamDirectoryProps> = ({
  teamMembers,
  onAddMember,
  onUpdateMember,
  onSelectMemberForTasks,
}) => {
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'gone'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [kudosReactionFeedback, setKudosReactionFeedback] = useState<{
    memberId: string;
    emoji: string;
    text: string;
  } | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [departingMember, setDepartingMember] = useState<TeamMember | null>(null);
  const [exitReasonInput, setExitReasonInput] = useState('');
  const [departureDateInput, setDepartureDateInput] = useState(
    new Date().toISOString().split('T')[0]
  );

  // New Member Form with friendly/funny defaults
  const [newMemberForm, setNewMemberForm] = useState({
    name: '',
    nickname: '',
    email: '',
    role: 'QC Intern' as MemberRole,
    status: 'active' as MemberStatus,
    tenure: 'Winter Cohort (Joined Nov 2026)',
    specialties: 'Regex QC, Link Routing, Emoji-Proofing',
    mentor: 'Sarah Chen (Lead)',
    notes: 'Incoming intern ready to tame wild query strings.',
    superpower: 'Can spot missing anchors from across the office',
    funQuote: 'Keep calm and escape your forward slashes.',
    coffeeRatio: '☕ 3 Lattes / 🐛 7 Bugs Caught',
    funnyAward: '🌟 Rising QA Star',
  });

  const activeMembers = teamMembers.filter((m) => m.status === 'active');
  const goneMembers = teamMembers.filter((m) => m.status === 'gone');

  // Filtered members
  const filteredMembers = teamMembers.filter((member) => {
    if (statusFilter !== 'all' && member.status !== statusFilter) {
      return false;
    }
    if (roleFilter !== 'all' && member.role !== roleFilter) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = member.name.toLowerCase().includes(q);
      const matchNick = (member.nickname || '').toLowerCase().includes(q);
      const matchEmail = member.email.toLowerCase().includes(q);
      const matchSpec = member.specialties.some((s) => s.toLowerCase().includes(q));
      if (!matchName && !matchNick && !matchEmail && !matchSpec) return false;
    }
    return true;
  });

  // Calculate team stats
  const totalTasksCompleted = teamMembers.reduce((acc, m) => acc + m.tasksCompleted, 0);
  const totalKudos = teamMembers.reduce((acc, m) => acc + (m.kudosCount || 0), 0);
  const avgAccuracy = (
    teamMembers.reduce((acc, m) => acc + m.accuracyRate, 0) / (teamMembers.length || 1)
  ).toFixed(1);

  // Interactive Kudos / High-Five Handler
  const handleSendKudos = async (
    member: TeamMember,
    type: 'high_five' | 'espresso' | 'cookie' | 'trophy'
  ) => {
    const feedbackMap = {
      high_five: { emoji: '✋', text: '+1 High Five!' },
      espresso: { emoji: '☕', text: '+1 Espresso Boost!' },
      cookie: { emoji: '🍪', text: '+1 Bug-Free Cookie!' },
      trophy: { emoji: '🏆', text: '+1 QA Legend Award!' },
    };
    const feedback = feedbackMap[type];

    // Optimistic UI update
    const updatedCount = (member.kudosCount || 0) + 1;
    onUpdateMember(member.id, { kudosCount: updatedCount });

    setKudosReactionFeedback({
      memberId: member.id,
      emoji: feedback.emoji,
      text: feedback.text,
    });
    playChime('success');

    setTimeout(() => {
      setKudosReactionFeedback(null);
    }, 2000);

    try {
      await fetch(`/api/team/${member.id}/kudos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type }),
      });
    } catch {
      // Revert or ignore
    }
  };

  const handleAddMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberForm.name.trim()) return;

    const colors = [
      'from-blue-600 to-indigo-600',
      'from-violet-600 to-purple-600',
      'from-emerald-600 to-teal-600',
      'from-amber-600 to-orange-600',
      'from-rose-600 to-pink-600',
      'from-cyan-600 to-blue-600',
    ];
    const pickedColor = colors[Math.floor(Math.random() * colors.length)];

    onAddMember({
      name: newMemberForm.name.trim(),
      nickname: newMemberForm.nickname.trim() || 'The Regex Apprentice',
      email:
        newMemberForm.email.trim() ||
        `${newMemberForm.name.toLowerCase().replace(/\s+/g, '.')}@qc-team.internal`,
      role: newMemberForm.role,
      status: newMemberForm.status,
      avatarColor: pickedColor,
      tenure: newMemberForm.tenure,
      specialties: newMemberForm.specialties.split(',').map((s) => s.trim()).filter(Boolean),
      mentor: newMemberForm.mentor,
      notes: newMemberForm.notes,
      superpower: newMemberForm.superpower,
      funQuote: newMemberForm.funQuote,
      coffeeRatio: newMemberForm.coffeeRatio,
      funnyAward: newMemberForm.funnyAward,
      accuracyRate: 98.5,
      tasksCompleted: 0,
      activeTasksCount: 0,
      kudosCount: 1,
    });

    setIsAddModalOpen(false);
    setNewMemberForm({
      name: '',
      nickname: '',
      email: '',
      role: 'QC Intern',
      status: 'active',
      tenure: 'Winter Cohort (Joined Nov 2026)',
      specialties: 'Regex QC, Link Routing, Emoji-Proofing',
      mentor: 'Sarah Chen (Lead)',
      notes: 'Incoming intern ready to tame wild query strings.',
      superpower: 'Can spot missing anchors from across the office',
      funQuote: 'Keep calm and escape your forward slashes.',
      coffeeRatio: '☕ 3 Lattes / 🐛 7 Bugs Caught',
      funnyAward: '🌟 Rising QA Star',
    });
  };

  const handleConfirmDeparture = () => {
    if (!departingMember) return;
    onUpdateMember(departingMember.id, {
      status: 'gone',
      departedDate: departureDateInput,
      exitReason: exitReasonInput.trim() || 'Completed internship period / ascended to alumni',
      activeTasksCount: 0,
    });
    setDepartingMember(null);
    setExitReasonInput('');
  };

  const handleReactivateMember = (member: TeamMember) => {
    onUpdateMember(member.id, {
      status: 'active',
      departedDate: undefined,
      exitReason: undefined,
      tenure: 'Reactivated QA Legend',
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Friendly & Funny Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>QC Team Directory & Hall of Fame</span>
              <span className="text-sm">☕🐛</span>
            </h1>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              Actual & Gone Legends
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Meet the brave humans auditing your regexes, catching rogue 404s, and surviving Unicode edge cases.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition cursor-pointer self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Onboard New Intern / Editor</span>
        </button>
      </div>

      {/* Friendly Team Highlights & Humor Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Active on Duty (Actual)</span>
          </div>
          <div className="text-xl font-bold text-white font-mono mt-0.5">
            {activeMembers.length} humans
          </div>
          <div className="text-[10px] text-slate-500">Currently debugging links</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Alumni Hall of Fame (Gone)</span>
          </div>
          <div className="text-xl font-bold text-slate-300 font-mono mt-0.5">
            {goneMembers.length} legends
          </div>
          <div className="text-[10px] text-slate-500">Graduated & ascended</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-indigo-400 flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5" />
            <span>Total Team Kudos Sent</span>
          </div>
          <div className="text-xl font-bold text-white font-mono mt-0.5">
            {totalKudos} 🎉
          </div>
          <div className="text-[10px] text-slate-500">High-fives & espresso shots</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 shadow-xs">
          <div className="text-[11px] font-semibold text-rose-400 flex items-center gap-1.5">
            <Bug className="w-3.5 h-3.5" />
            <span>Link Disasters Averted</span>
          </div>
          <div className="text-xl font-bold text-white font-mono mt-0.5">
            {totalTasksCompleted} links
          </div>
          <div className="text-[10px] text-slate-500">{avgAccuracy}% precision rate</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-2xl p-3 shadow-md">
        {/* Status Filter Segmented Control */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span>All Humans & Legends ({teamMembers.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'active'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Actual / Active ({activeMembers.length})</span>
          </button>

          <button
            onClick={() => setStatusFilter('gone')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
              statusFilter === 'gone'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>Gone (Alumni Legends) ({goneMembers.length})</span>
          </button>
        </div>

        {/* Search and Role Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-md md:justify-end">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, nickname, or quirk..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
          >
            <option value="all">All Roles</option>
            <option value="QC Intern">QC Interns</option>
            <option value="Quality Control Editor">QC Editors</option>
            <option value="QA Automation Tester">QA Automation</option>
            <option value="Senior QA Lead">QA Leads</option>
          </select>
        </div>
      </div>

      {/* Friendly & Humorous Member Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const isActive = member.status === 'active';
          const hasFeedback = kudosReactionFeedback?.memberId === member.id;

          return (
            <div
              key={member.id}
              className={`p-5 rounded-2xl border transition shadow-lg flex flex-col justify-between relative group ${
                isActive
                  ? 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  : 'bg-slate-950/80 border-slate-800/80 hover:border-slate-700 opacity-90'
              }`}
            >
              {/* Floating Kudos celebration popover */}
              {hasFeedback && (
                <div className="absolute top-3 right-3 z-20 bg-emerald-500 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-xl animate-bounce flex items-center gap-1">
                  <span>{kudosReactionFeedback.emoji}</span>
                  <span>{kudosReactionFeedback.text}</span>
                </div>
              )}

              <div className="space-y-4">
                {/* Header: Avatar, Name, Funny Nickname, and Award Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${member.avatarColor} text-sm font-bold text-white flex items-center justify-center shadow-md`}
                      >
                        {member.initials}
                      </div>
                      <span
                        className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                          isActive ? 'bg-emerald-500' : 'bg-slate-500'
                        }`}
                        title={isActive ? 'Active on QC Duty' : 'Alumnus Legend'}
                      />
                    </div>

                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5 truncate">
                        {member.name}
                      </h3>
                      {member.nickname && (
                        <p className="text-[11px] text-amber-400 font-medium italic truncate">
                          "{member.nickname}"
                        </p>
                      )}
                      <p className="text-[11px] text-indigo-400 font-medium">{member.role}</p>
                    </div>
                  </div>

                  {/* Status / Alumni Badge */}
                  {isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Actual
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-800 text-slate-400 border border-slate-700 shrink-0">
                      <GraduationCap className="w-3 h-3 text-slate-400" />
                      Gone (Alumnus)
                    </span>
                  )}
                </div>

                {/* Funny Superlative / Award Banner */}
                {member.funnyAward && (
                  <div className="px-2.5 py-1 rounded-lg bg-indigo-950/40 border border-indigo-500/20 text-[11px] text-indigo-300 font-medium flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                    <span className="truncate">{member.funnyAward}</span>
                  </div>
                )}

                {/* Coffee-to-Bug Ratio & Superpower */}
                <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2 text-xs">
                  {member.coffeeRatio && (
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                        Fuel Ratio:
                      </span>
                      <span className="font-mono text-[11px] text-amber-300 font-medium">
                        {member.coffeeRatio}
                      </span>
                    </div>
                  )}

                  {member.superpower && (
                    <div className="pt-1.5 border-t border-slate-800/60">
                      <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-3 h-3 text-yellow-400" />
                        <span>QC Superpower:</span>
                      </div>
                      <p className="text-[11px] text-slate-200 mt-0.5 leading-snug">
                        {member.superpower}
                      </p>
                    </div>
                  )}

                  {member.funQuote && (
                    <div className="pt-1.5 border-t border-slate-800/60">
                      <p className="text-[11px] text-slate-400 italic flex items-start gap-1">
                        <Quote className="w-3 h-3 text-indigo-400 shrink-0 mt-0.5" />
                        <span>"{member.funQuote}"</span>
                      </p>
                    </div>
                  )}

                  {/* Departure story if gone */}
                  {!isActive && member.exitReason && (
                    <div className="pt-1.5 border-t border-slate-800/60">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                        Legendary Exit Destination:
                      </div>
                      <p className="text-[11px] text-slate-300 italic mt-0.5 leading-snug">
                        "{member.exitReason}"
                      </p>
                      {member.departedDate && (
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          Departed on {member.departedDate}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Performance stats & Tenure */}
                <div className="grid grid-cols-2 gap-2 text-center text-xs">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      Links Checked
                    </div>
                    <div className="text-sm font-bold text-white font-mono mt-0.5">
                      {member.tasksCompleted}
                    </div>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      QC Accuracy
                    </div>
                    <div className="text-sm font-bold text-emerald-400 font-mono mt-0.5">
                      {member.accuracyRate}%
                    </div>
                  </div>
                </div>

                {/* Specialties tags */}
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    QC Specialties:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {member.specialties.map((spec, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Kudos / High-Five Toolbar */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] text-slate-400 flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5 text-rose-400" />
                    <span>Kudos: <strong className="text-white font-mono">{member.kudosCount || 0}</strong></span>
                  </div>

                  {isActive ? (
                    <button
                      onClick={() => {
                        setDepartingMember(member);
                        setDepartureDateInput(new Date().toISOString().split('T')[0]);
                      }}
                      className="text-[10px] text-slate-400 hover:text-amber-300 transition"
                    >
                      Mark as Alumni (Gone) →
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivateMember(member)}
                      className="text-[10px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reactivate Legend</span>
                    </button>
                  )}
                </div>

                {/* Funny High-Five Reaction Buttons */}
                <div className="flex items-center justify-between gap-1 pt-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
                  <button
                    onClick={() => handleSendKudos(member, 'high_five')}
                    className="flex-1 py-1 px-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1"
                    title="Send High Five"
                  >
                    <span>✋</span>
                    <span className="hidden sm:inline text-[10px]">High-Five</span>
                  </button>

                  <button
                    onClick={() => handleSendKudos(member, 'espresso')}
                    className="flex-1 py-1 px-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1"
                    title="Send Virtual Espresso"
                  >
                    <span>☕</span>
                    <span className="hidden sm:inline text-[10px]">Espresso</span>
                  </button>

                  <button
                    onClick={() => handleSendKudos(member, 'cookie')}
                    className="flex-1 py-1 px-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1"
                    title="Send Bug-Free Cookie"
                  >
                    <span>🍪</span>
                    <span className="hidden sm:inline text-[10px]">Cookie</span>
                  </button>

                  <button
                    onClick={() => handleSendKudos(member, 'trophy')}
                    className="flex-1 py-1 px-1 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-medium transition cursor-pointer flex items-center justify-center gap-1"
                    title="Award QA Legend Trophy"
                  >
                    <span>🏆</span>
                    <span className="hidden sm:inline text-[10px]">Trophy</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add New Member Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" />
                Onboard Intern or QC Editor
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMemberSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newMemberForm.name}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, name: e.target.value })}
                    placeholder="e.g. Alex Rivera"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Funny Nickname
                  </label>
                  <input
                    type="text"
                    value={newMemberForm.nickname}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, nickname: e.target.value })}
                    placeholder="e.g. The Query String Whisperer"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Role
                  </label>
                  <select
                    value={newMemberForm.role}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, role: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="QC Intern">QC Intern</option>
                    <option value="Quality Control Editor">Quality Control Editor</option>
                    <option value="QA Automation Tester">QA Automation Tester</option>
                    <option value="Senior QA Lead">Senior QA Lead</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Status
                  </label>
                  <select
                    value={newMemberForm.status}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, status: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="active">Actual (Active on Duty)</option>
                    <option value="gone">Gone (Alumni Legend)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    QC Superpower
                  </label>
                  <input
                    type="text"
                    value={newMemberForm.superpower}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, superpower: e.target.value })}
                    placeholder="e.g. Can find broken anchors in 2 seconds"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    Coffee-to-Bug Ratio
                  </label>
                  <input
                    type="text"
                    value={newMemberForm.coffeeRatio}
                    onChange={(e) => setNewMemberForm({ ...newMemberForm, coffeeRatio: e.target.value })}
                    placeholder="☕ 3 Espressos / 🐛 9 Bugs"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Funny Quote or Catchphrase
                </label>
                <input
                  type="text"
                  value={newMemberForm.funQuote}
                  onChange={(e) => setNewMemberForm({ ...newMemberForm, funQuote: e.target.value })}
                  placeholder="e.g. My code works, it is the URLs that are wrong."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold shadow-md"
                >
                  Welcome to Team!
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mark Member as Departed / Alumni Modal */}
      {departingMember && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-amber-400" />
                Ascend {departingMember.name} to "Gone" (Alumni Legend)
              </h3>
              <button
                onClick={() => setDepartingMember(null)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Preserve {departingMember.name}'s legendary contributions in the alumni hall of fame. Record their departure destination and exit lore.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Departure Date
                </label>
                <input
                  type="date"
                  value={departureDateInput}
                  onChange={(e) => setDepartureDateInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Legendary Exit Reason & Next Destination *
                </label>
                <textarea
                  rows={3}
                  value={exitReasonInput}
                  onChange={(e) => setExitReasonInput(e.target.value)}
                  placeholder="e.g. Completed 6-mo Winter Co-op with Distinction; joined Core Backend Engineering or returned to University..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDepartingMember(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeparture}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-semibold shadow-md text-xs"
              >
                Immortalize in Alumni Hall
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
