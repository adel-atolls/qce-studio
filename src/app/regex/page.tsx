export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/dashboard/AppShell';

export default function RegexPage() {
  return (
    <AppShell>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-semibold text-white">Regex Studio</h1>
        <p className="mt-3 text-slate-400">
          Module à reconstruire proprement dans la V2. La page Detection est prioritaire et déjà opérationnelle.
        </p>
      </div>
    </AppShell>
  );
}