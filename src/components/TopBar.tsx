import React from 'react';
import {
  Bell,
  Search,
  Radio,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  ChevronRight,
  Code2,
  ListTodo,
  Users2,
  Menu,
  ScanSearch,
} from 'lucide-react';
import { ActiveTab } from './Header';

interface TopBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  unreadCount: number;
  onOpenNotifications: () => void;
  onSimulateActivity: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenCommandPalette: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleMobileMenu: () => void;
  inProgressCount: number;
}

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  onOpenNotifications,
  onSimulateActivity,
  soundEnabled,
  onToggleSound,
  onOpenCommandPalette,
  theme,
  onToggleTheme,
  onToggleMobileMenu,
  inProgressCount,
}) => {
  const getBreadcrumbTitle = () => {
    switch (activeTab) {
      case 'regex':
        return 'Link Regex Studio & Synthesizer';
      case 'inprogress':
        return `In Progress QC Queue (${inProgressCount} Active)`;
      case 'team':
        return 'Team Directory (Actual & Gone)';
      case 'detection':
        return 'Checkout Element Detection Studio';
      default:
        return 'Dashboard';
    }
  };

  const getBreadcrumbIcon = () => {
    switch (activeTab) {
      case 'regex':
        return <Code2 className="w-3.5 h-3.5 text-indigo-400" />;
      case 'inprogress':
        return <ListTodo className="w-3.5 h-3.5 text-purple-400" />;
      case 'team':
        return <Users2 className="w-3.5 h-3.5 text-emerald-400" />;
      case 'detection':
        return <ScanSearch className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-4 sm:px-6">
      {/* Left: Mobile Menu Toggle & Breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleMobileMenu}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          title="Open Navigation"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Clean Contextual Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs">
          <span className="text-slate-400 font-medium hidden sm:inline">Workspace</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
          <div className="flex items-center gap-1.5 text-slate-200 font-semibold">
            {getBreadcrumbIcon()}
            <span>{getBreadcrumbTitle()}</span>
          </div>
        </nav>
      </div>

      {/* Right: Actions, Search, Audio, Theme, and Notifications */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Command Palette search trigger */}
        <button
          onClick={onOpenCommandPalette}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400 hover:text-slate-200 hover:border-slate-700 transition"
        >
          <Search className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden md:inline">Search...</span>
          <kbd className="px-1 py-0.5 rounded bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-500">
            /
          </kbd>
        </button>

        {/* Real-time SSE Connection Indicator */}
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800/80">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Live SSE</span>
        </div>

        {/* Simulate Activity quick button */}
        <button
          onClick={onSimulateActivity}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition cursor-pointer shadow-xs"
          title="Simulate incoming intern task update"
        >
          <Radio className="w-3 h-3 text-indigo-400" />
          <span className="hidden sm:inline">Simulate Activity</span>
        </button>

        {/* Sound toggle */}
        <button
          onClick={onToggleSound}
          className={`p-2 rounded-lg border text-xs transition cursor-pointer ${
            soundEnabled
              ? 'bg-slate-800 border-slate-700 text-slate-200 hover:text-white'
              : 'bg-slate-950 border-slate-800 text-slate-500 hover:text-slate-400'
          }`}
          title={soundEnabled ? 'Chime sound is ON' : 'Chime sound is MUTED'}
        >
          {soundEnabled ? (
            <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
          ) : (
            <VolumeX className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200 transition cursor-pointer"
          title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />}
        </button>

        {/* Notification Bell with unread counter badge */}
        <button
          onClick={onOpenNotifications}
          className="relative p-2 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 hover:text-white transition cursor-pointer"
          title="Notifications"
        >
          <Bell className="w-3.5 h-3.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-indigo-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-md">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
