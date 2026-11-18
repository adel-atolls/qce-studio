'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from 'react';
import { AppShell } from '@/components/dashboard/AppShell';
import { generateLocalRegexFromUrl, extractInstantFunnelRegex, testRegexOnInput } from '@/lib/regex';
import { RegexOptions, RegexResult, RegexTestCase } from '@/types/index';
import {
  Sparkles,
  Copy,
  Check,
  Settings2,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  XCircle,
  History,
  ClipboardPaste,
  ShieldAlert,
  FileCode,
} from 'lucide-react';

const PRESET_LINKS = [
  {
    title: 'Rua do Café Checkout',
    category: 'E-Commerce Funnel',
    url: 'https://ruadocafe.com.br/checkouts/cn/hWNIiPjbwVEmDsZm8QHogbkR/pt-br?_r=AQABsqDyHY9664KhdDQCiywoz51W1cNYbXLScUlRiXILm5QBz4LG',
  },
  {
    title: 'Stripe Webhook',
    category: 'Payment API',
    url: 'https://checkout.mystore.com/api/v2/webhooks/wh_9x8a7b6c5d?client_id=cs_live_44918&sig=e3b0c44298fc',
  },
  {
    title: 'Localized Product',
    category: 'Product Link',
    url: 'https://shop.example.com/en-us/p/wireless-noise-cancelling-headphones-p-89412?color=matte-black&sku=SKU-99201',
  },
  {
    title: 'OAuth Callback',
    category: 'Authentication',
    url: 'https://auth.company.io/oauth/callback?code=def_981a2f&state=sec_nonce_8831',
  },
];

type HistoryItem = {
  url: string;
  pattern: string;
  timestamp: string;
};

export default function RegexPage() {
  const [targetUrl, setTargetUrl] = useState(PRESET_LINKS[0].url);
  const [sampleUrls, setSampleUrls] = useState<string[]>([]);
  const [showAdvancedSamples, setShowAdvancedSamples] = useState(false);
  const [showConfig, setShowConfig] = useState(false);

  const [options, setOptions] = useState<RegexOptions>({
    flavor: 'javascript',
    matchScope: 'full',
    captureGroups: true,
    strictAnchors: true,
    allowSubdomains: false,
    allowQueryParams: true,
    detectDynamicSegments: true,
  });

  const [result, setResult] = useState<RegexResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [customTestInput, setCustomTestInput] = useState('');
  const [testCasesList, setTestCasesList] = useState<RegexTestCase[]>([]);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeCodeTab, setActiveCodeTab] = useState<'javascript' | 'python' | 'typescript'>('javascript');

  const instantFunnel = useMemo(() => extractInstantFunnelRegex(targetUrl), [targetUrl]);

  useEffect(() => {
    if (!targetUrl.trim()) return;
    const timer = setTimeout(() => {
      handleGenerateRegex();
    }, 350);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetUrl, options]);

  const handleGenerateRegex = async () => {
    if (!targetUrl.trim()) return;

    setLoading(true);

    const generated = generateLocalRegexFromUrl(targetUrl.trim(), options);
    setResult(generated);

    const initialTests: RegexTestCase[] = (generated.testCases || []).map((tc: RegexTestCase) => {
      const tested = testRegexOnInput(generated.pattern, generated.flags || 'i', tc.url);
      return {
        ...tc,
        matched: tested.matched,
        groups: tested.groups,
        executionMs: tested.duration,
      };
    });

    setTestCasesList(initialTests);

    setHistory((prev: HistoryItem[]) => [
      {
        url: targetUrl,
        pattern: generated.pattern,
        timestamp: new Date().toLocaleTimeString(),
      },
      ...prev.slice(0, 9),
    ]);

    setLoading(false);
  };

  const handleAddCustomTest = () => {
    if (!customTestInput.trim() || !result) return;

    const tested = testRegexOnInput(result.pattern, result.flags || 'i', customTestInput.trim());

    const newCase: RegexTestCase = {
      url: customTestInput.trim(),
      shouldMatch: true,
      label: 'Custom QA Test Link',
      matched: tested.matched,
      groups: tested.groups,
      executionMs: tested.duration,
    };

    setTestCasesList([newCase, ...testCasesList]);
    setCustomTestInput('');
  };

  const handleCopy = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1600);
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setTargetUrl(text.trim());
    } catch {
      // ignore
    }
  };

  return (
    <AppShell>
      <div className="space-y-8">
        <section className="rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_35%),rgba(255,255,255,0.03)] p-8">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-400/20">
              <Sparkles className="h-4 w-4" />
              <span>Regex Synthesis Workspace</span>
            </div>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white">
              Link Regex Studio
            </h1>
            <p className="mt-3 text-base leading-7 text-slate-400">
              Génère des regex QA propres à partir d’une URL cible, visualise les cas de test, copie les patterns et prépare les validations multi-routes.
            </p>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between text-[11px] font-medium text-slate-400">
            <span>Preset URL Library</span>
            <span className="text-slate-500">Select a common test case</span>
          </div>

          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {PRESET_LINKS.map((preset) => (
              <button
                key={preset.title}
                onClick={() => setTargetUrl(preset.url)}
                className={`rounded-2xl border p-4 text-left transition ${
                  targetUrl === preset.url
                    ? 'border-indigo-400/30 bg-indigo-500/10'
                    : 'border-white/10 bg-white/[0.03] hover:bg-white/[0.05]'
                }`}
              >
                <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{preset.category}</div>
                <div className="mt-2 text-sm font-semibold text-white">{preset.title}</div>
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-white">Target URL Input</div>
              <button
                onClick={() => setShowConfig((v) => !v)}
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-xs text-slate-300 transition hover:bg-white/10"
              >
                <Settings2 className="h-4 w-4" />
                <span>Config Rules</span>
              </button>
            </div>

            <div className="flex flex-col gap-3 xl:flex-row">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  placeholder="https://example.com/path/to/verify"
                  className="w-full rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 pr-24 text-sm text-white outline-none transition focus:border-indigo-400/30"
                />
                <button
                  onClick={handlePasteClipboard}
                  className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-xl bg-white/5 px-3 py-2 text-xs text-slate-300 transition hover:bg-white/10"
                >
                  <ClipboardPaste className="h-3.5 w-3.5" />
                  Paste
                </button>
              </div>

              <button
                onClick={handleGenerateRegex}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
              >
                <Sparkles className={`h-4 w-4 ${loading ? 'animate-pulse' : ''}`} />
                <span>{loading ? 'Generating...' : 'Generate Regex'}</span>
              </button>
            </div>

            <div className="border-t border-white/10 pt-4">
              <button
                onClick={() => setShowAdvancedSamples((v) => !v)}
                className="text-sm text-slate-400 transition hover:text-indigo-300"
              >
                {showAdvancedSamples ? '▲ Hide' : '▼ Add'} Additional Sample URLs
              </button>

              {showAdvancedSamples && (
                <div className="mt-4 space-y-2">
                  {sampleUrls.map((url: string, index: number) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={url}
                        onChange={(e) => {
                          const updated = [...sampleUrls];
                          updated[index] = e.target.value;
                          setSampleUrls(updated);
                        }}
                        className="flex-1 rounded-xl border border-white/10 bg-[#08111d] px-3 py-2 text-sm text-white outline-none"
                        placeholder={`Sample URL #${index + 2}`}
                      />
                      <button
                        onClick={() => setSampleUrls(sampleUrls.filter((_, i) => i !== index))}
                        className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-rose-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={() => setSampleUrls([...sampleUrls, ''])}
                    className="inline-flex items-center gap-2 text-sm text-indigo-300"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add another sample link</span>
                  </button>
                </div>
              )}
            </div>

            {showConfig && (
              <div className="grid gap-4 rounded-2xl border border-white/10 bg-[#08111d] p-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Flavor
                  </label>
                  <select
                    value={options.flavor}
                    onChange={(e) => setOptions({ ...options, flavor: e.target.value as RegexOptions['flavor'] })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="javascript">JavaScript</option>
                    <option value="python">Python</option>
                    <option value="pcre">PCRE</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Match Scope
                  </label>
                  <select
                    value={options.matchScope}
                    onChange={(e) => setOptions({ ...options, matchScope: e.target.value as RegexOptions['matchScope'] })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="full">Full URL</option>
                    <option value="path">Path Only</option>
                    <option value="domain_path">Domain + Path</option>
                    <option value="query">Query Only</option>
                  </select>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={options.captureGroups}
                      onChange={(e) => setOptions({ ...options, captureGroups: e.target.checked })}
                    />
                    <span>Named capture groups</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={options.strictAnchors}
                      onChange={(e) => setOptions({ ...options, strictAnchors: e.target.checked })}
                    />
                    <span>Strict anchors</span>
                  </label>
                </div>

                <div className="space-y-3 pt-1">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={options.allowSubdomains}
                      onChange={(e) => setOptions({ ...options, allowSubdomains: e.target.checked })}
                    />
                    <span>Allow subdomains</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={options.allowQueryParams}
                      onChange={(e) => setOptions({ ...options, allowQueryParams: e.target.checked })}
                    />
                    <span>Allow query params</span>
                  </label>
                </div>
              </div>
            )}
          </div>
        </section>

        {instantFunnel && (
          <section className="rounded-3xl border border-emerald-400/20 bg-emerald-500/[0.04] p-6">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <div className="text-sm font-semibold text-white">Automatic Funnel Matchers</div>
                <div className="mt-1 text-sm text-slate-400">
                  Domain <span className="font-mono text-indigo-300">{instantFunnel.domain}</span> + action <span className="font-mono text-emerald-300">{instantFunnel.keyword}</span>
                </div>
              </div>

              <button
                onClick={() => handleCopy(instantFunnel.dotPattern, 'funnel')}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-500"
              >
                {copiedKey === 'funnel' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                <span>{copiedKey === 'funnel' ? 'Copied' : 'Copy Funnel Regex'}</span>
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl border border-white/10 bg-[#08111d] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Requested Format</div>
                <div className="mt-2 break-all font-mono text-sm text-emerald-300">{instantFunnel.dotPattern}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#08111d] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Escaped</div>
                <div className="mt-2 break-all font-mono text-sm text-indigo-300">{instantFunnel.escapedPattern}</div>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#08111d] p-4">
                <div className="text-xs uppercase tracking-[0.18em] text-slate-500">Universal</div>
                <div className="mt-2 break-all font-mono text-sm text-fuchsia-300">{instantFunnel.universalPattern}</div>
              </div>
            </div>
          </section>
        )}

        {result && (
          <>
            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div>
                  <div className="text-sm font-semibold text-white">Generated Pattern</div>
                  <div className="mt-1 text-sm text-slate-400">
                    Flavor: <span className="text-slate-200">{result.flavor}</span> · Flags: <span className="text-slate-200">/{result.flags}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCopy(result.pattern, 'pattern')}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                >
                  {copiedKey === 'pattern' ? <Check className="h-4 w-4 text-emerald-300" /> : <Copy className="h-4 w-4" />}
                  <span>{copiedKey === 'pattern' ? 'Copied' : 'Copy Regex'}</span>
                </button>
              </div>

              <div className="mt-4 rounded-2xl border border-white/10 bg-[#08111d] p-4 font-mono text-sm text-indigo-300 break-all">
                /{result.pattern}/{result.flags}
              </div>

              <p className="mt-4 text-sm leading-7 text-slate-400">{result.explanation}</p>
            </section>

            <section className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <Play className="h-4 w-4 text-emerald-300" />
                  <span>Testing Sandbox</span>
                </div>

                <div className="mt-4 flex flex-col gap-3 xl:flex-row">
                  <input
                    type="text"
                    value={customTestInput}
                    onChange={(e) => setCustomTestInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTest()}
                    placeholder="Paste candidate URL to test..."
                    className="flex-1 rounded-2xl border border-white/10 bg-[#08111d] px-4 py-3 text-sm text-white outline-none"
                  />
                  <button
                    onClick={handleAddCustomTest}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/5 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Test Candidate</span>
                  </button>
                </div>

                <div className="mt-4 space-y-3">
                  {testCasesList.map((tc: RegexTestCase, idx: number) => (
                    <div
                      key={idx}
                      className={`rounded-2xl border p-4 ${
                        tc.matched
                          ? 'border-emerald-400/20 bg-emerald-500/5'
                          : 'border-rose-400/20 bg-rose-500/5'
                      }`}
                    >
                      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            {tc.matched ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
                            ) : (
                              <XCircle className="h-4 w-4 text-rose-300" />
                            )}
                            <span className="text-sm font-semibold text-white">{tc.label}</span>
                          </div>
                          <div className="mt-2 break-all font-mono text-xs text-slate-400">{tc.url}</div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-xs text-slate-500">⏱ {tc.executionMs ?? 0} ms</span>
                          <button
                            onClick={() => setTestCasesList(testCasesList.filter((_, i) => i !== idx))}
                            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 transition hover:text-rose-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <FileCode className="h-4 w-4 text-indigo-300" />
                    <span>Code Snippet</span>
                  </div>

                  <div className="mt-4 flex items-center gap-2">
                    {(['javascript', 'python', 'typescript'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveCodeTab(tab)}
                        className={`rounded-xl px-3 py-2 text-xs font-medium transition ${
                          activeCodeTab === tab
                            ? 'bg-indigo-600 text-white'
                            : 'bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>

                  <pre className="mt-4 overflow-auto rounded-2xl border border-white/10 bg-[#08111d] p-4 text-xs text-slate-300">
                    {result.codeSnippets[activeCodeTab]}
                  </pre>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                  <div className="flex items-center gap-2 text-sm font-semibold text-white">
                    <ShieldAlert className="h-4 w-4 text-amber-300" />
                    <span>QC Pitfalls</span>
                  </div>

                  <ul className="mt-4 space-y-2 text-sm text-slate-400">
                    {result.antiPatterns.map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>

                  <div className="mt-5 text-sm font-semibold text-white">Suggested Edge Cases</div>
                  <ul className="mt-3 space-y-2 text-sm text-slate-400">
                    {result.suggestedEdgeCases.map((item: string, i: number) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </section>

            {history.length > 0 && (
              <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-white">
                  <History className="h-4 w-4 text-cyan-300" />
                  <span>Recent Patterns</span>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {history.map((item: HistoryItem, i: number) => (
                    <button
                      key={i}
                      onClick={() => setTargetUrl(item.url)}
                      className="rounded-2xl border border-white/10 bg-[#08111d] px-3 py-2 text-xs text-slate-300 transition hover:border-indigo-400/20 hover:text-white"
                    >
                      {item.url} <span className="text-slate-500">({item.timestamp})</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </AppShell>
  );
}