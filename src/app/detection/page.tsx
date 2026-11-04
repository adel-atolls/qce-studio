'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/dashboard/AppShell';
import { DetectionInbox } from '@/components/detection/DetectionInbox';
import { DetectionHistory } from '@/components/detection/DetectionHistory';
import {
  CheckoutDetectionHistoryItem,
  CheckoutDetectionStructuredResult,
  ExternalCheckoutPayload,
} from '@/types';
import { cleanIncomingHtml } from '@/lib/utils';

declare global {
  interface Window {
    chrome?: any;
  }
}

export default function DetectionPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentUrl, setCurrentUrl] = useState('');
  const [receivedAt, setReceivedAt] = useState('');
  const [result, setResult] = useState<CheckoutDetectionStructuredResult | null>(null);
  const [history, setHistory] = useState<CheckoutDetectionHistoryItem[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('qce-detection-history');
      if (raw) {
        setHistory(JSON.parse(raw));
      }
    } catch {
      // ignore
    }
  }, []);

  const saveHistory = useCallback((item: CheckoutDetectionHistoryItem) => {
    setHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.url !== item.url)].slice(0, 12);
      localStorage.setItem('qce-detection-history', JSON.stringify(next));
      return next;
    });
  }, []);

  const selectorsJson = useMemo(() => {
    if (!result) return '';
    return JSON.stringify(result, null, 2);
  }, [result]);

  const handleCopy = async () => {
    if (!selectorsJson) return;
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

      const res = await fetch('/api/detection/external-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: payload.url, html: cleanIncomingHtml(payload.html) }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to analyze checkout DOM.');
      }

      setResult(data.result);

      saveHistory({
        url: data.url || payload.url,
        analyzedAt: data.analyzedAt || new Date().toISOString(),
        result: data.result,
      });
    } catch (err: any) {
      setError(err?.message || 'External DOM analysis failed.');
    } finally {
      setLoading(false);
    }
  }, [saveHistory]);

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data as ExternalCheckoutPayload;
      if (!data || data.type !== 'INSPECT_CHECKOUT_HTML') return;
      if (!data.html || typeof data.html !== 'string') return;
      analyzePayload(data);
    };

    window.addEventListener('message', handleWindowMessage);

    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, [analyzePayload]);

  return (
    <AppShell>
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

      <div className="mt-6 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
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
    </AppShell>
  );
}