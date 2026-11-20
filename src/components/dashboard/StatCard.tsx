import { ReactNode } from 'react';

export function StatCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-[rgba(36,200,244,0.10)] bg-[#0d1722] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.01)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
            {label}
          </div>
          <div className="mt-3 text-3xl font-semibold tracking-tight text-white">
            {value}
          </div>
          <div className="mt-2 text-sm text-slate-400">{hint}</div>
        </div>

        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(36,200,244,0.14)] bg-[rgba(36,200,244,0.08)] text-[#24C8F4]">
          {icon}
        </div>
      </div>
    </div>
  );
}