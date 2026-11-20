'use client';

import { Bell, Search, Sparkles } from 'lucide-react';

export function Topbar() {
  return (
    <header className="sticky top-0 z-30 flex h-20 items-center justify-between border-b border-[rgba(36,200,244,0.10)] bg-[#09131d]/90 px-4 backdrop-blur xl:px-8">
      <div>
        <div className="text-sm font-semibold text-white">Qce Studio Admin</div>
        <div className="text-xs text-slate-400">Detection, regex, tasks and team operations</div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden md:flex items-center gap-2 rounded-2xl border border-[rgba(36,200,244,0.10)] bg-white/[0.03] px-4 py-2 text-sm text-slate-400">
          <Search className="h-4 w-4 text-slate-500" />
          <span>Search dashboard...</span>
        </div>

        <div className="hidden sm:flex items-center gap-2 rounded-2xl border border-[rgba(36,200,244,0.16)] bg-[rgba(36,200,244,0.08)] px-4 py-2 text-xs text-[#24C8F4]">
          <Sparkles className="h-4 w-4" />
          <span>AI Ready</span>
        </div>

        <button className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(36,200,244,0.10)] bg-white/[0.03] text-slate-300 transition hover:bg-white/[0.07] hover:text-white">
          <Bell className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}