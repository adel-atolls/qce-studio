'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanSearch, Code2, ListTodo, Users2, Shield } from 'lucide-react';

const items = [
  { href: '/', label: 'Overview', icon: LayoutDashboard },
  { href: '/detection', label: 'Detection', icon: ScanSearch },
  { href: '/regex', label: 'Regex Studio', icon: Code2 },
  { href: '/tasks', label: 'Tasks', icon: ListTodo },
  { href: '/team', label: 'Team', icon: Users2 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex w-72 flex-col border-r border-white/10 bg-[#07111f]">
      <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/20">
          <Shield className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-white">QCE Studio</div>
          <div className="text-xs text-slate-400">Admin Control Panel</div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6">
        <div className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500">
          Workspace
        </div>

        <div className="space-y-1.5">
          {items.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  active
                    ? 'bg-cyan-500/15 text-white ring-1 ring-cyan-400/20'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-cyan-300' : 'text-slate-500'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-white/10 p-4">
        <div className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
          <div className="text-xs font-semibold text-slate-300">Extension Bridge</div>
          <div className="mt-1 text-xs text-slate-500">
            Ready to receive checkout DOM payloads from Chrome.
          </div>
        </div>
      </div>
    </aside>
  );
}