'use client';

import { Clock } from 'lucide-react';
import { CheckoutDetectionHistoryItem } from '@/types';
import { formatDateTime } from '@/lib/utils';

export function DetectionHistory({
  items,
  onSelect,
}: {
  items: CheckoutDetectionHistoryItem[];
  onSelect: (item: CheckoutDetectionHistoryItem) => void;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-4 flex items-center gap-2">
        <Clock className="h-4 w-4 text-cyan-300" />
        <h3 className="text-sm font-semibold text-white">Historique des URLs analysées</h3>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-black/10 p-4 text-sm text-slate-500">
            Aucune analyse reçue depuis l’extension pour le moment.
          </div>
        ) : (
          items.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              onClick={() => onSelect(item)}
              className="w-full rounded-2xl border border-white/10 bg-[#08111d] p-4 text-left transition hover:border-cyan-400/20 hover:bg-[#0a1522]"
            >
              <div className="line-clamp-2 break-all font-mono text-xs text-cyan-300">
                {item.url}
              </div>
              <div className="mt-2 text-xs text-slate-500">
                {formatDateTime(item.analyzedAt)}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}