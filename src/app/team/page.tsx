import { AppShell } from '@/components/dashboard/AppShell';

export default function TeamPage() {
  return (
    <AppShell>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-semibold text-white">Team</h1>
        <p className="mt-3 text-slate-400">
          Future annuaire équipe / QA Ops. On le reconstruira sur une base propre dans les prochaines étapes.
        </p>
      </div>
    </AppShell>
  );
}