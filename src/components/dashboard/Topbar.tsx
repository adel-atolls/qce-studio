'use client';

import { Bell, Search, Sparkles } from 'lucide-react';

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-white/10 bg-[#081221]/80 px-4 backdrop-blur xl:px-8">
      <div>
        <div className="text-sm font-semibold text-white">Quality Control Admin</div>
        <div className="text-xs text-slate-400">Detection, regex, tasks and team operations</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-400">
          <Search className="h-4 w-4" />
          <span>Search dashboard...</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 px-4 py-2 text-xs text-cyan-300">
          <Sparkles className="h-4 w-4" />
          <span>AI Ready</span>
        </div>

        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}