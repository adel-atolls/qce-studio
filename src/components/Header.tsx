import React from 'react';
import {
  Code2,
  ListTodo,
  Users2,
  Bell,
  Volume2,
  VolumeX,
  Radio,
  Sparkles,
  ShieldCheck,
  ScanSearch,
} from 'lucide-react';

export type ActiveTab = 'regex' | 'inprogress' | 'team' | 'detection';

interface HeaderProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onSimulateActivity: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  inProgressCount: number;
  totalTeamCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  onOpenNotifications,
  onSimulateActivity,
  soundEnabled,
  onToggleSound,
  inProgressCount,
  totalTeamCount,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 text-white font-bold">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-base tracking-tight">
                  QC Tester Studio
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Intern & QA Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Quality Control Regex Engine & Team Operations
              </p>
            </div>
          </div>

          {/* Navigation Menus */}
          <nav className="flex items-center gap-1 sm:gap-2">
            {/* First Menu: Generate Regex from Link */}
            <button
              onClick={() => onTabChange('regex')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                activeTab === 'regex'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Code2 className="w-4 h-4" />
              <span>Link Regex Studio</span>
            </button>

            {/* Second Menu: In Progress */}
            <button
              onClick={() => onTabChange('inprogress')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer relative ${
                activeTab === 'inprogress'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <ListTodo className="w-4 h-4" />
              <span>In Progress</span>
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

            {/* Third Menu: All Team Members (Actual & Gone) */}
            <button
              onClick={() => onTabChange('team')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                activeTab === 'team'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Users2 className="w-4 h-4" />
              <span>Team Directory</span>
              <span
                className={`text-[11px] font-semibold px-1.5 py-0.2 rounded-full hidden md:inline ${
                  activeTab === 'team'
                    ? 'bg-indigo-800 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {totalTeamCount}
              </span>
            </button>

            {/* Fourth Menu: Checkout Detection */}
            <button
              onClick={() => onTabChange('detection')}
              className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition cursor-pointer ${
                activeTab === 'detection'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <ScanSearch className="w-4 h-4" />
              <span>Detection</span>
            </button>
          </nav>

          {/* Real-time actions & Notification Bell */}
          <div className="flex items-center gap-2">
            {/* Quick Simulate Live Activity Button */}
            <button
              onClick={onSimulateActivity}
              className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition shadow-xs cursor-pointer"
              title="Trigger a simulated real-time intern activity event"
            >
              <Radio className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>Simulate Update</span>
            </button>

            {/* Audio chime toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl border text-xs transition cursor-pointer ${
                soundEnabled
                  ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-400'
              }`}
              title={soundEnabled ? 'Chime sound is ON' : 'Chime sound is MUTED'}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4 text-indigo-400" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 rounded-xl bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-300 hover:text-white transition cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/50 animate-bounce">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
