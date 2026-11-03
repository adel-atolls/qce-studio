import React, { useState, useEffect } from 'react';
import { Search, Code2, ListTodo, Users2, X, ArrowRight, Clock, Plus, ScanSearch } from 'lucide-react';
import { QCTask, TeamMember } from '../types';
import { ActiveTab } from './Header';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tab: ActiveTab) => void;
  onSelectTask: (task: QCTask) => void;
  onSelectMember: (member: TeamMember) => void;
  tasks: QCTask[];
  teamMembers: TeamMember[];
  onOpenRegexWithUrl: (url: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onSelectTask,
  onSelectMember,
  tasks,
  teamMembers,
  onOpenRegexWithUrl,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredTasks = tasks.filter(
    (t) =>
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.targetUrl.toLowerCase().includes(query.toLowerCase())
  );

  const filteredMembers = teamMembers.filter(
    (m) =>
      m.name.toLowerCase().includes(query.toLowerCase()) ||
      m.role.toLowerCase().includes(query.toLowerCase()) ||
      m.specialties.some((s) => s.toLowerCase().includes(query.toLowerCase()))
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Input Bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-slate-800 gap-3">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks, team members, or links... (Esc to close)"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-500 hover:text-slate-300 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-3 text-xs">
          {/* Quick Nav Actions */}
          <div className="space-y-1">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
              Quick Navigation
            </div>
            <button
              onClick={() => {
                onNavigate('regex');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 text-indigo-400" />
                <span className="font-medium">Open Link Regex Studio</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Jump →</span>
            </button>

            <button
              onClick={() => {
                onNavigate('inprogress');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-4 h-4 text-purple-400" />
                <span className="font-medium">View In Progress QC Tasks</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Jump →</span>
            </button>

            <button
              onClick={() => {
                onNavigate('team');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <Users2 className="w-4 h-4 text-emerald-400" />
                <span className="font-medium">Team Directory (Actual & Gone)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Jump →</span>
            </button>

            <button
              onClick={() => {
                onNavigate('detection');
                onClose();
              }}
              className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <ScanSearch className="w-4 h-4 text-cyan-400" />
                <span className="font-medium">Checkout Element Detection (Coupon, Button, Total)</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Jump →</span>
            </button>
          </div>

          {/* Tasks Results */}
          {filteredTasks.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
                QC Tasks ({filteredTasks.length})
              </div>
              {filteredTasks.slice(0, 4).map((task) => (
                <button
                  key={task.id}
                  onClick={() => {
                    onSelectTask(task);
                    onNavigate('inprogress');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition text-left cursor-pointer group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-slate-200 truncate group-hover:text-indigo-300">
                      {task.title}
                    </div>
                    <div className="text-[11px] font-mono text-slate-500 truncate">
                      {task.targetUrl}
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded shrink-0 border border-slate-800">
                    {task.status.replace('_', ' ')}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Members Results */}
          {filteredMembers.length > 0 && (
            <div className="space-y-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 px-2 py-1">
                Team Directory ({filteredMembers.length})
              </div>
              {filteredMembers.slice(0, 3).map((member) => (
                <button
                  key={member.id}
                  onClick={() => {
                    onSelectMember(member);
                    onNavigate('team');
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-slate-300 hover:bg-slate-800/80 hover:text-white transition text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-tr ${member.avatarColor} text-[10px] font-bold text-white flex items-center justify-center`}
                    >
                      {member.initials}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{member.name}</div>
                      <div className="text-[11px] text-slate-400">{member.role}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {member.status === 'gone' ? 'Alumnus' : 'Active'}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
          <span>Tip: Press ESC to close palette</span>
          <span>Quality Control Command Palette</span>
        </div>
      </div>
    </div>
  );
};
