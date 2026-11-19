'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/dashboard/AppShell';
import { DetectionInbox } from '@/components/detection/DetectionInbox';
import { DetectionHistory } from '@/components/detection/DetectionHistory';
import {
  CheckoutDetectionHistoryItem,
  CheckoutDetectionStructuredResult,
  ExternalCheckoutPayload,
} from '@/types/index';
import { cleanIncomingHtml } from '@/lib/utils';

declare global {
  interface Window {
    chrome?: any;
  }
}

type DetectionMode = 'gemini' | 'fallback' | '';

export default function DetectionPage() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUrl, setCurrentUrl] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [result, setResult] = useState<CheckoutDetectionStructuredResult | null>(null);
  const [history, setHistory] = useState<CheckoutDetectionHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  const [mode, setMode] = useState<DetectionMode>('');
  const [fallbackReason, setFallbackReason] = useState('');
  const [modelUsed, setModelUsed] = useState('');
  const [details, setDetails] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    try {
      const raw = window.localStorage.getItem('qce-detection-history');
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, [mounted]);

  const saveHistory = useCallback((item: CheckoutDetectionHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.url !== item.url)].slice(0, 12);

      try {
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('qce-detection-history', JSON.stringify(next));
        }
      } catch {
        // ignore
      }

      return next;
    });
  }, []);

  const selectorsJson = useMemo(() => {
    if (!result) return '';
    return JSON.stringify(result, null, 2);
  }, [result]);

  const handleCopy = async () => {
    if (!selectorsJson) return;
    if (typeof navigator === 'undefined' || !navigator.clipboard) return;

    await navigator.clipboard.writeText(selectorsJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  const analyzePayload = useCallback(async (payload: ExternalCheckoutPayload) => {
    try {
      setError(null);
      setLoading(true);
      setCurrentUrl(payload.url || '');
      setReceivedAt(new Date().toISOString());

      setMode('');
      setFallbackReason('');
      setModelUsed('');
      setDetails('');

      const res = await fetch('/api/detection/external-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: payload.url, html: cleanIncomingHtml(payload.html) }),
      });

      const responseJson = await res.json();

      if (!res.ok) {
        throw new Error(responseJson?.error || 'Failed to analyze checkout DOM.');
      }

      setResult(responseJson.result || null);
      setMode((responseJson.mode || '') as DetectionMode);
      setFallbackReason(responseJson.reason || '');
      setModelUsed(responseJson.modelUsed || responseJson.modelTried || '');

      const debugDetails =
        responseJson?.details
          ? JSON.stringify(responseJson.details, null, 2)
          : responseJson?.raw || '';

      setDetails(debugDetails);

      saveHistory({
        url: responseJson.url || payload.url,
        analyzedAt: responseJson.analyzedAt || new Date().toISOString(),
        result: responseJson.result,
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'External DOM analysis failed.');
    } finally {
      setLoading(false);
    }
  }, [saveHistory]);

  useEffect(() => {
    if (!mounted) return;

    const handleWindowMessage = (event: MessageEvent) => {
      const payload = event.data as ExternalCheckoutPayload;
      if (!payload || payload.type !== 'INSPECT_CHECKOUT_HTML') return;
      if (!payload.html || typeof payload.html !== 'string') return;
      analyzePayload(payload);
    };

    window.addEventListener('message', handleWindowMessage);

    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [mounted, analyzePayload]);

  if (!mounted) {
    return (
      <AppShell>
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-sm text-slate-400">
          Loading detection workspace...
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          {mode ? (
            <div
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ring-1 ${
                mode === 'gemini'
                  ? 'bg-cyan-500/10 text-cyan-300 ring-cyan-400/20'
                  : 'bg-amber-500/10 text-amber-300 ring-amber-400/20'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  mode === 'gemini' ? 'bg-cyan-300' : 'bg-amber-300'
                }`}
              />
              {mode === 'gemini' ? 'Mode Gemini' : 'Mode Fallback'}
            </div>
          ) : null}

          {modelUsed ? (
            <div className="rounded-full bg-white/5 px-4 py-2 text-xs text-slate-300 ring-1 ring-white/10">
              Model: {modelUsed}
            </div>
          ) : null}

          {fallbackReason ? (
            <div className="rounded-full bg-white/5 px-4 py-2 text-xs text-slate-400 ring-1 ring-white/10">
              Reason: {fallbackReason}
            </div>
          ) : null}
        </div>

        {details ? (
          <div className="rounded-2xl border border-white/10 bg-[#07101b] p-4">
            <div className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Debug details
            </div>
            <pre className="overflow-auto text-xs text-slate-300">{details}</pre>
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
          <DetectionInbox
            loading={loading}
            error={error}
            currentUrl={currentUrl}
            receivedAt={receivedAt}
            result={result}
            copied={copied}
            onCopy={handleCopy}
          />

          <DetectionHistory
            items={history}
            onSelect={(item) => {
              setCurrentUrl(item.url);
              setReceivedAt(item.analyzedAt);
              setResult(item.result);
            }}
          />
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="text-sm font-semibold text-white">Test local rapide</div>
          <p className="mt-2 text-sm text-slate-400">
            Tu peux simuler la réception depuis la console du navigateur :
          </p>
          <pre className="mt-4 overflow-auto rounded-2xl border border-white/10 bg-[#07101b] p-4 text-xs text-slate-300">
{`window.postMessage({
  type: 'INSPECT_CHECKOUT_HTML',
  url: window.location.href,
  html: document.documentElement.outerHTML
}, '*');`}
          </pre>
        </div>
      </div>
    </AppShell>
  );
}