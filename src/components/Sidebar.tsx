import React from 'react';
import {
  Code2,
  ListTodo,
  Users2,
  Clock,
  Layers,
  GraduationCap,
  Play,
  Pause,
  Command,
  ChevronDown,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Radio,
  Volume2,
  VolumeX,
  ScanSearch,
} from 'lucide-react';
import { ActiveTab } from './Header';
import { QCTask } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  inProgressCount: number;
  totalTeamCount: number;
  onOpenCommandPalette: () => void;
  activeTimerTask?: QCTask;
  timerSeconds: number;
  isTimerRunning: boolean;
  onToggleTimer: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  inProgressCount,
  totalTeamCount,
  onOpenCommandPalette,
  activeTimerTask,
  timerSeconds,
  isTimerRunning,
  onToggleTimer,
  soundEnabled,
  onToggleSound,
}) => {
  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <aside className="w-64 bg-slate-900/95 border-r border-slate-800 flex flex-col justify-between shrink-0 select-none hidden lg:flex h-screen sticky top-0 z-30">
      {/* Top Workspace Header */}
      <div className="flex flex-col">
        {/* Workspace Brand Lockup */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 shrink-0 font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="text-xs font-bold text-white tracking-tight truncate flex items-center gap-1.5">
                <span>QC Tester Studio</span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                Quality Ops & Intern Hub
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search / Command Palette Trigger */}
        <div className="px-3 pt-3">
          <button
            onClick={onOpenCommandPalette}
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition group cursor-pointer shadow-xs"
          >
            <span className="flex items-center gap-2">
              <Command className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 transition" />
              <span>Quick Jump...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500">
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Navigation Categories */}
        <div className="px-3 py-4 space-y-6 overflow-y-auto">
          {/* Section 1: Core Workbench */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              QC Workbench
            </div>

            {/* Menu 1: Link Regex Studio */}
            <button
              onClick={() => onTabChange('regex')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'regex'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Code2 className="w-4 h-4 shrink-0" />
                <span>Link Regex Studio</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  activeTab === 'regex'
                    ? 'bg-indigo-700 text-indigo-100'
                    : 'text-slate-500 bg-slate-950 border border-slate-800'
                }`}
              >
                AI+
              </span>
            </button>

            {/* Menu 2: In Progress */}
            <button
              onClick={() => onTabChange('inprogress')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'inprogress'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ListTodo className="w-4 h-4 shrink-0" />
                <span>In Progress Queue</span>
              </div>
              {inProgressCount > 0 && (
                <span
                  className={`text-[11px] font-bold px-1.5 py-0.2 rounded-full ${
                    activeTab === 'inprogress'
                      ? 'bg-indigo-800 text-white'
                      : 'bg-indigo-500/20 text-indigo-300'
                  }`}
                >
                  {inProgressCount}
                </span>
              )}
            </button>

            {/* Menu 3: Checkout Detection */}
            <button
              onClick={() => onTabChange('detection')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'detection'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ScanSearch className="w-4 h-4 shrink-0" />
                <span>Checkout Detection</span>
              </div>
              <span
                className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  activeTab === 'detection'
                    ? 'bg-indigo-700 text-indigo-100'
                    : 'text-slate-500 bg-slate-950 border border-slate-800'
                }`}
              >
                DOM
              </span>
            </button>
          </div>

          {/* Section 2: Team Operations (Actual & Gone) */}
          <div className="space-y-1">
            <div className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Team & Cohorts
            </div>

            {/* Menu 3: Team Directory */}
            <button
              onClick={() => onTabChange('team')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users2 className="w-4 h-4 shrink-0" />
                <span>Team Directory</span>
              </div>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  activeTab === 'team'
                    ? 'bg-indigo-700 text-white'
                    : 'text-slate-500 bg-slate-950 border border-slate-800'
                }`}
              >
                {totalTeamCount}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Pinned Bottom: Live Session Stopwatch Card & User Info */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-900/60 space-y-3">
        {/* Live QC Session Timer Card */}
        <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'
                }`}
              />
              <span>QC Session Timer</span>
            </div>
            <button
              onClick={onToggleTimer}
              className={`p-1.5 rounded-lg text-white transition cursor-pointer ${
                isTimerRunning
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-emerald-600 hover:bg-emerald-500'
              }`}
              title={isTimerRunning ? 'Pause session timer' : 'Start session timer'}
            >
              {isTimerRunning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3 fill-white" />}
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-sm font-mono font-bold text-white tracking-wider">
              {formatTimer(timerSeconds)}
            </div>
            <span className="text-[10px] text-slate-500">
              {isTimerRunning ? 'Running' : 'Paused'}
            </span>
          </div>

          {activeTimerTask && (
            <div className="text-[11px] text-indigo-300 truncate font-medium">
              {activeTimerTask.title}
            </div>
          )}
        </div>

        {/* User Card */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-[10px] font-bold text-white flex items-center justify-center">
              SC
            </div>
            <div className="text-xs">
              <div className="font-semibold text-slate-200">Sarah Chen</div>
              <div className="text-[10px] text-slate-500">Senior QA Lead</div>
            </div>
          </div>

          <button
            onClick={onToggleSound}
            className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
              soundEnabled
                ? 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'
                : 'bg-slate-950 border-slate-800 text-slate-600 hover:text-slate-400'
            }`}
            title={soundEnabled ? 'Chime sound is ON' : 'Chime sound is MUTED'}
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-indigo-400" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </aside>
  );
};
