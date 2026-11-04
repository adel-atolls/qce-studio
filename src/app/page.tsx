export const dynamic = 'force-dynamic';

import { AppShell } from '@/components/dashboard/AppShell';
import { StatCard } from '@/components/dashboard/StatCard';
import { Activity, ScanSearch, ShieldCheck, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.12),transparent_35%),rgba(255,255,255,0.03)] p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 ring-1 ring-cyan-400/20">
              <Sparkles className="h-4 w-4" />
              <span>New QCE Studio V2</span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Quality Control Admin Dashboard
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-400">
              Centralise la détection checkout, l’analyse DOM, les patterns regex et les futurs workflows QA dans une interface moderne, propre et extensible.
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/detection"
                className="rounded-2xl bg-cyan-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500"
              >
                Ouvrir Checkout Detection
              </Link>
              <Link
                href="/regex"
                className="rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Ouvrir Regex Studio
              </Link>
            </div>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Detection"
            value="Live"
            hint="Reception DOM depuis extension active"
            icon={<ScanSearch className="h-5 w-5" />}
          />
          <StatCard
            label="Structured Output"
            value="4 blocs"
            hint="Trigger, input, button, total"
            icon={<ShieldCheck className="h-5 w-5" />}
          />
          <StatCard
            label="Pipeline"
            value="Gemini"
            hint="Fallback heuristique inclus"
            icon={<Activity className="h-5 w-5" />}
          />
          <StatCard
            label="Workspace"
            value="V2"
            hint="Base propre pour les modules admin"
            icon={<Sparkles className="h-5 w-5" />}
          />
        </section>
      </div>
    </AppShell>
  );
}