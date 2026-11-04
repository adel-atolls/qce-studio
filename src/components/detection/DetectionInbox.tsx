'use client';

import { Clock, Copy, Check, AlertTriangle, MousePointerClick, BadgePercent, Send, Coins } from 'lucide-react';
import { CheckoutDetectionStructuredResult } from '@/types';
import { formatDateTime } from '@/lib/utils';

export function DetectionInbox({
  loading,
  error,
  currentUrl,
  receivedAt,
  result,
  copied,
  onCopy,
}: {
  loading: boolean;
  error: string | null;
  currentUrl: string;
  receivedAt: string;
  result: CheckoutDetectionStructuredResult | null;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="rounded-3xl border border-cyan-400/15 bg-white/[0.03] shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="border-b border-white/10 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                  loading
                    ? 'bg-amber-500/10 text-amber-300 ring-amber-400/20'
                    : 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                {loading ? 'Analyse en cours...' : 'En attente du clic extension'}
              </span>

              <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300 ring-1 ring-cyan-400/20">
                Live DOM Intake
              </span>
            </div>

            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Checkout Detection Inbox
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                Réception automatique du DOM checkout depuis l’extension Chrome et analyse structurée immédiate.
              </p>
            </div>

            <div className="space-y-1 text-sm text-slate-300">
              <div>
                <span className="text-slate-500">URL cible :</span>{' '}
                <span className="break-all font-mono text-cyan-300">{currentUrl || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-slate-500">Date/heure :</span>
                <span>{formatDateTime(receivedAt)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onCopy}
            disabled={!result}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-cyan-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? 'Copié' : 'Copier les sélecteurs'}
          </button>
        </div>

        {error && (
          <div className="mt-4 flex items-center gap-2 rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="grid gap-4 p-6 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#091321] p-5">
          <div className="mb-3 flex items-center gap-2">
            <MousePointerClick className="h-4 w-4 text-purple-300" />
            <h3 className="text-sm font-semibold text-white">Show Form Trigger</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <div>
              <span className="text-slate-500">Clic requis :</span>{' '}
              <strong>{result ? (result.show_form_trigger.required_to_click ? 'Oui' : 'Non') : '-'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Texte :</span>{' '}
              <span>{result?.show_form_trigger.inner_text || '-'}</span>
            </div>
            <div className="rounded-xl bg-black/20 p-3 font-mono text-xs text-purple-300 break-all">
              {result?.show_form_trigger.exact_css_selector || '-'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#091321] p-5">
          <div className="mb-3 flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-indigo-300" />
            <h3 className="text-sm font-semibold text-white">Coupon Input</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <div>
              <span className="text-slate-500">Visibilité :</span>{' '}
              <strong>{result ? (result.coupon_input.is_hidden ? 'Masqué' : 'Visible') : '-'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Placeholder :</span>{' '}
              <span>{result?.coupon_input.placeholder || '-'}</span>
            </div>
            <div className="rounded-xl bg-black/20 p-3 font-mono text-xs text-indigo-300 break-all">
              {result?.coupon_input.exact_css_selector || '-'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#091321] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Send className="h-4 w-4 text-fuchsia-300" />
            <h3 className="text-sm font-semibold text-white">Bouton Valider</h3>
          </div>
          <div className="space-y-2 text-sm text-slate-300">
            <div>
              <span className="text-slate-500">Type :</span>{' '}
              <span>{result?.coupon_button.button_type || '-'}</span>
            </div>
            <div>
              <span className="text-slate-500">Visibilité :</span>{' '}
              <strong>{result ? (result.coupon_button.is_hidden ? 'Masqué' : 'Visible') : '-'}</strong>
            </div>
            <div className="rounded-xl bg-black/20 p-3 font-mono text-xs text-fuchsia-300 break-all">
              {result?.coupon_button.exact_css_selector || '-'}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#091321] p-5">
          <div className="mb-3 flex items-center gap-2">
            <Coins className="h-4 w-4 text-emerald-300" />
            <h3 className="text-sm font-semibold text-white">Montant Total</h3>
          </div>
          <div className="space-y-3 text-sm text-slate-300">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                Total détecté
              </div>
              <div className="mt-2 text-3xl font-semibold tracking-tight text-white">
                {result?.total_order.raw_text || '-'}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Valeur numérique :</span>{' '}
              <strong>{result?.total_order.numeric_value ?? '-'}</strong>
            </div>
            <div>
              <span className="text-slate-500">Devise :</span>{' '}
              <strong>{result?.total_order.currency || '-'}</strong>
            </div>
            <div className="rounded-xl bg-black/20 p-3 font-mono text-xs text-emerald-300 break-all">
              {result?.total_order.exact_css_selector || '-'}
            </div>
          </div>
        </div>
      </div>

      {result && (
        <div className="border-t border-white/10 p-6">
          <div className="mb-3 text-sm font-semibold text-white">JSON structuré</div>
          <pre className="max-h-80 overflow-auto rounded-2xl border border-white/10 bg-[#07101b] p-4 text-xs text-slate-300">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}