import React, { useState, useEffect } from 'react';
import {
  RegexResult,
  RegexOptions,
  RegexTestCase,
  QCTask,
  TeamMember,
} from '../types';
import {
  Sparkles,
  Play,
  Copy,
  Check,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Plus,
  Trash2,
  ShieldAlert,
  Layers,
  Settings2,
  History,
  FileCode,
  ClipboardPaste,
} from 'lucide-react';

interface RegexStudioProps {
  onAddTaskFromRegex: (taskData: Partial<QCTask>) => void;
  teamMembers: TeamMember[];
  initialUrl?: string;
}

export function extractInstantFunnelRegex(urlStr: string) {
  try {
    let parsed: URL;
    try {
      parsed = new URL(urlStr);
    } catch {
      parsed = new URL('https://' + urlStr);
    }
    const rawHost = parsed.hostname || '';
    const cleanHost = rawHost.replace(/^www\./i, '');
    const pathname = parsed.pathname || '';
    const fullLower = urlStr.toLowerCase();

    const keywords = [
      'checkouts',
      'checkout',
      'cart',
      'carrinho',
      'panier',
      'warenkorb',
      'basket',
      'bag',
      'order',
      'pay',
      'purchase',
      'finalize',
    ];
    let foundKw = keywords.find((kw) => fullLower.includes(kw));

    if (!foundKw) {
      const parts = pathname.split('/').filter(Boolean);
      foundKw = parts[0] || 'checkout';
    }

    const dotPattern = `.*${cleanHost}.${foundKw}.*`;
    const escapedPattern = `.*${cleanHost.replace(/\./g, '\\.')}.*${foundKw}.*`;
    const universalPattern = `.*${cleanHost.replace(/\./g, '\\.')}.*(checkout|checkouts|cart|carrinho|basket).*`;

    return {
      domain: cleanHost,
      keyword: foundKw,
      dotPattern,
      escapedPattern,
      universalPattern,
    };
  } catch {
    return null;
  }
}

function localRegexFallback(urlStr: string, flavor: 'javascript' | 'python' | 'pcre' = 'javascript'): RegexResult {
  let parsed: URL;
  try {
    parsed = new URL(urlStr);
  } catch {
    parsed = new URL('https://' + urlStr);
  }

  const host = parsed.hostname.replace(/\./g, '\\.');
  const pattern = `^https?:\\/\\/${host}.*$`;

  return {
    pattern,
    flags: 'i',
    flavor,
    explanation: 'Local fallback regex generated on the client because the backend API is unavailable.',
    tokens: [
      {
        name: 'domain',
        pattern: host,
        description: 'Escaped domain matcher',
        example: parsed.hostname,
      },
    ],
    testCases: [
      { url: urlStr, shouldMatch: true, label: 'Original URL' },
      { url: `https://${parsed.hostname}/test`, shouldMatch: true, label: 'Same domain' },
      { url: 'https://example.com/', shouldMatch: false, label: 'Other domain' },
    ],
    codeSnippets: {
      javascript: `const regex = /^https?:\\/\\/${host}.*$/i;`,
      python: `import re\nregex = re.compile(r"^https?:\\/\\/${host}.*$", re.I)`,
      typescript: `const regex: RegExp = /^https?:\\/\\/${host}.*$/i;`,
    },
    antiPatterns: [
      'Do not overuse .* in the middle of patterns if you need strict route validation.',
    ],
    suggestedEdgeCases: [
      'Test http vs https',
      'Test trailing slash variations',
      'Test query string variations',
      'Test subdomain variants if applicable',
    ],
  };
}

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
    title: 'E-commerce SKU Slug',
    category: 'Product Link',
    url: 'https://shop.example.com/en-us/p/wireless-noise-cancelling-headphones-p-89412?color=matte-black&sku=SKU-99201',
  },
];

export const RegexStudio: React.FC<RegexStudioProps> = ({
  onAddTaskFromRegex,
  teamMembers,
  initialUrl,
}) => {
  const [targetUrl, setTargetUrl] = useState(
    initialUrl || PRESET_LINKS[0].url
  );
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

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<RegexResult | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const instantFunnel = extractInstantFunnelRegex(targetUrl);

  const [customTestInput, setCustomTestInput] = useState('');
  const [testCasesList, setTestCasesList] = useState<RegexTestCase[]>([]);
  const [activeCodeTab, setActiveCodeTab] = useState<'javascript' | 'python' | 'typescript'>('javascript');

  const [history, setHistory] = useState<{ url: string; pattern: string; timestamp: string }[]>([]);

  useEffect(() => {
    if (!targetUrl.trim()) return;
    const timer = setTimeout(() => {
      handleGenerateRegex();
    }, 400);
    return () => clearTimeout(timer);
  }, [targetUrl, options]);

  useEffect(() => {
    if (initialUrl) {
      setTargetUrl(initialUrl);
    }
  }, [initialUrl]);

  const testRegexOnInput = (pattern: string, flags: string, input: string) => {
    try {
      const reg = new RegExp(pattern, flags);
      const start = performance.now();
      const match = reg.exec(input);
      const end = performance.now();
      return {
        matched: match !== null,
        groups: match?.groups || {},
        matches: match ? Array.from(match).slice(1) : [],
        duration: Math.round((end - start) * 100) / 100,
      };
    } catch {
      return { matched: false, groups: {}, matches: [], duration: 0 };
    }
  };

  const handleGenerateRegex = async () => {
    if (!targetUrl.trim()) {
      setError('Please enter a target URL or select a preset link.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/regex/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetUrl.trim(), sampleUrls, options }),
      });

      const contentType = res.headers.get('content-type') || '';
      let data: RegexResult;

      if (!res.ok || !contentType.includes('application/json')) {
        data = localRegexFallback(targetUrl.trim(), options.flavor);
      } else {
        data = await res.json();
      }

      setResult(data);

      const initialTests: RegexTestCase[] = (data.testCases || []).map((tc) => {
        const tested = testRegexOnInput(data.pattern, data.flags || 'i', tc.url);
        return {
          ...tc,
          matched: tested.matched,
          groups: tested.groups,
          executionMs: tested.duration,
        };
      });

      setTestCasesList(initialTests);
      setHistory((prev) => [
        {
          url: targetUrl,
          pattern: data.pattern,
          timestamp: new Date().toLocaleTimeString(),
        },
        ...prev.slice(0, 9),
      ]);
    } catch {
      const data = localRegexFallback(targetUrl.trim(), options.flavor);
      setResult(data);

      const initialTests: RegexTestCase[] = (data.testCases || []).map((tc) => {
        const tested = testRegexOnInput(data.pattern, data.flags || 'i', tc.url);
        return {
          ...tc,
          matched: tested.matched,
          groups: tested.groups,
          executionMs: tested.duration,
        };
      });

      setTestCasesList(initialTests);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCustomTest = () => {
    if (!customTestInput.trim() || !result) return;
    const testResult = testRegexOnInput(result.pattern, result.flags || 'i', customTestInput.trim());
    const newCase: RegexTestCase = {
      url: customTestInput.trim(),
      shouldMatch: true,
      label: 'Custom QA Test Link',
      matched: testResult.matched,
      groups: testResult.groups,
      executionMs: testResult.duration,
    };
    setTestCasesList([newCase, ...testCasesList]);
    setCustomTestInput('');
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <span>Link Regex Studio</span>
            <span className="text-[11px] font-normal text-indigo-400 font-mono">v2.4</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            AI-powered URL pattern synthesizer and edge case validator for Quality Control.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition cursor-pointer ${
              showConfig
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Config Rules</span>
          </button>
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="text-[11px] font-medium text-slate-400 flex items-center justify-between">
          <span>Common Quality Control URL Patterns</span>
          <span className="text-slate-500 text-[10px]">Select to inspect</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {PRESET_LINKS.map((preset) => (
            <button
              key={preset.title}
              onClick={() => {
                setTargetUrl(preset.url);
                setError(null);
              }}
              className={`p-2.5 rounded-xl border text-left transition group cursor-pointer ${
                targetUrl === preset.url
                  ? 'bg-slate-900 border-indigo-500/80 text-white shadow-xs'
                  : 'bg-slate-950/70 border-slate-800/90 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <div className="text-[10px] text-slate-500 font-medium">{preset.category}</div>
              <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate group-hover:text-white">
                {preset.title}
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xl space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-2">
            Target Link / Sample URL
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://example.com/path/to/verify?query=param"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs sm:text-sm font-mono text-indigo-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition pr-20"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  className="px-2 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 transition"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  Paste
                </button>
              </div>
            </div>

            <button
              onClick={handleGenerateRegex}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition cursor-pointer shrink-0"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Synthesizing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Generate Regex</span>
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {instantFunnel && (
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-emerald-500/30 shadow-xl space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Automatic Funnel Regex Generated</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  Extracted domain <strong className="text-indigo-300 font-mono">"{instantFunnel.domain}"</strong> and action <strong className="text-emerald-300 font-mono">"{instantFunnel.keyword}"</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Concise QA Matcher:
              </div>
              <div className="font-mono text-sm sm:text-base font-bold text-emerald-300 tracking-wide mt-1 truncate select-all">
                {instantFunnel.dotPattern}
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => handleCopy(instantFunnel.dotPattern, 'funnel-dot')}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shadow-sm"
              >
                {copiedKey === 'funnel-dot' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === 'funnel-dot' ? 'Copied!' : 'Copy Regex'}</span>
              </button>

              <button
                onClick={() =>
                  onAddTaskFromRegex({
                    title: `QC Funnel: ${instantFunnel.domain} (${instantFunnel.keyword})`,
                    targetUrl: targetUrl,
                    category: 'Regex QC',
                    priority: 'high',
                    notes: `Auto-generated funnel regex:\n${instantFunnel.dotPattern}`,
                  })
                }
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>To Tasks</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-indigo-500/30 shadow-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Ready for QC Testing
                </span>
                <span className="text-xs text-slate-400">
                  Flavor: <strong className="text-slate-200">{result.flavor}</strong>
                </span>
                <span className="text-xs text-slate-400">
                  Flags: <strong className="text-slate-200">/{result.flags || 'i'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopy(result.pattern, 'pattern')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
                >
                  {copiedKey === 'pattern' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'pattern' ? 'Copied!' : 'Copy Regex'}</span>
                </button>

                <button
                  onClick={() =>
                    onAddTaskFromRegex({
                      title: `QC Regex Verification: ${targetUrl.slice(0, 45)}...`,
                      targetUrl: targetUrl,
                      category: 'Regex QC',
                      priority: 'high',
                      notes: `Auto-generated pattern:\n/${result.pattern}/${result.flags}\n\nExplanation:\n${result.explanation}`,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Send to In Progress</span>
                </button>
              </div>
            </div>

            <div className="relative p-4 rounded-xl bg-slate-950 border border-slate-800 overflow-x-auto">
              <div className="flex items-center gap-2 font-mono text-xs sm:text-sm text-indigo-300">
                <span className="text-slate-500">/</span>
                <span className="break-all font-semibold select-all text-white">{result.pattern}</span>
                <span className="text-slate-500">/{result.flags}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">{result.explanation}</p>

            {result.tokens && result.tokens.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-400" />
                  Token Breakdown & Extracted Segments
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {result.tokens.map((tok, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-indigo-400 font-mono">{tok.name}</span>
                        <span className="text-[10px] text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                          {tok.example}
                        </span>
                      </div>
                      <div className="text-[11px] font-mono text-emerald-400/90 mt-1 truncate">
                        {tok.pattern}
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                        {tok.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                  Live Testing Sandbox & Edge Case Runner
                </h3>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                type="text"
                value={customTestInput}
                onChange={(e) => setCustomTestInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCustomTest()}
                placeholder="Paste candidate URL to test against this pattern..."
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                onClick={handleAddCustomTest}
                className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-medium border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Test Candidate</span>
              </button>
            </div>

            <div className="space-y-2.5">
              {testCasesList.map((tc, idx) => (
                <div
                  key={idx}
                  className={`p-3.5 rounded-xl border transition ${
                    tc.matched
                      ? 'bg-emerald-950/20 border-emerald-500/30'
                      : 'bg-rose-950/20 border-rose-500/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {tc.matched ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                              tc.matched
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {tc.matched ? 'MATCH' : 'NO MATCH'}
                          </span>
                          <span className="text-xs font-medium text-slate-300 truncate">
                            {tc.label}
                          </span>
                        </div>
                        <div className="text-xs font-mono text-slate-400 mt-1 break-all select-all">
                          {tc.url}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
                      {tc.executionMs !== undefined && (
                        <span className="text-[11px] text-slate-500">⏱ {tc.executionMs} ms</span>
                      )}
                      <button
                        onClick={() => setTestCasesList(testCasesList.filter((_, i) => i !== idx))}
                        className="text-slate-500 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {history.length > 0 && (
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                <History className="w-3.5 h-3.5 text-indigo-400" />
                <span>Recent Patterns Generated This Session</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {history.map((h, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setTargetUrl(h.url);
                      handleGenerateRegex();
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-slate-300 hover:text-white transition flex items-center gap-1.5"
                  >
                    <span className="max-w-[180px] truncate">{h.url}</span>
                    <span className="text-[10px] text-slate-500">({h.timestamp})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-500/20 text-xs text-amber-200">
            Backend regex API indisponible sur ce déploiement Netlify. Le studio utilise un fallback local côté navigateur.
          </div>
        </div>
      )}
    </div>
  );
};