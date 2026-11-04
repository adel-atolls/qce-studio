import { AppShell } from '@/components/dashboard/AppShell';

export default function TasksPage() {
  return (
    <AppShell>
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8">
        <h1 className="text-2xl font-semibold text-white">Tasks</h1>
        <p className="mt-3 text-slate-400">
          Future board de suivi QA / QC. On le branchera après la stabilisation du module Detection.
        </p>
      </div>
    </AppShell>
  );
}