'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, ScanSearch, Code2, ListTodo, Users2 } from 'lucide-react';

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
    <aside className="hidden lg:flex w-72 flex-col border-r border-[rgba(36,200,244,0.10)] bg-[#081019]">
      <div className="border-b border-[rgba(36,200,244,0.10)] px-6 py-5">
        <div className="flex items-center gap-4">
          <div className="relative flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-[rgba(36,200,244,0.14)] bg-white/5">
            <Image
              src="/logo_qce.svg"
              alt="QCE Studio"
              fill
              className="object-contain p-2"
              sizes="56px"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
            <div className="flex h-full w-full items-center justify-center text-lg font-bold text-white">
              <span className="text-white">Q</span>
              <span className="mx-0.5 text-[#24C8F4]">{'{'}</span>
              <span className="text-white text-sm">ce</span>
              <span className="mx-0.5 text-[#24C8F4]">{'}'}</span>
            </div>
          </div>

          <div>
            <div className="text-base font-semibold tracking-tight text-white">
              Qce Studio
            </div>
            <div className="text-xs text-slate-400">Admin Control Panel</div>
          </div>
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
                    ? 'bg-[rgba(36,200,244,0.12)] text-white ring-1 ring-[rgba(36,200,244,0.20)]'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? 'text-[#24C8F4]' : 'text-slate-500'}`} />
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="border-t border-[rgba(36,200,244,0.10)] p-4">
        <div className="rounded-2xl border border-[rgba(36,200,244,0.10)] bg-[rgba(255,255,255,0.03)] p-4">
          <div className="text-xs font-semibold text-white">Extension Bridge</div>
          <div className="mt-1 text-xs text-slate-400">
            Ready to receive checkout DOM payloads from Chrome.
          </div>
        </div>
      </div>
    </aside>
  );
}