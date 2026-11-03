import React, { useState } from 'react';
import {
  ScanSearch,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Code2,
  FileCode,
  Image,
  Upload,
  Layers,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Plus,
  RefreshCw,
  Eye,
  EyeOff,
  MousePointerClick,
  ChevronDown,
  Tag,
  Crosshair,
  BadgePercent,
  Coins,
  Send,
  Zap,
} from 'lucide-react';
import { DetectionResult, DetectionRequest, QCTask, TeamMember } from '../types';

interface DetectionStudioProps {
  onAddTask?: (task: Partial<QCTask>) => void;
  onSendToRegexStudio?: (url: string) => void;
  teamMembers?: TeamMember[];
}

// Preloaded realistic checkout snippets
const PRESETS = [
  {
    id: 'rua-do-cafe',
    title: 'Rua do Café (Brazilian VTEX Checkout)',
    url: 'https://ruadocafe.com.br/checkouts/cn/hWNIiPjbwVEmDsZm8QHogbkR/pt-br',
    language: 'Portuguese (BR)',
    description: 'Real Brazilian coffee merchant with "cupom", "validar", and "total a pagar" elements.',
    html: `<div class="checkout-container order-form">
  <div class="cart-items">
    <div class="item">Café Especial Arábica Mogiana 250g - R$ 64,95 (x2)</div>
  </div>

  <!-- Coupon / Discount Section -->
  <div class="discount-box container-cupom">
    <label for="cupom-input" class="label-cupom">Possui cupom ou código de desconto?</label>
    <div class="input-group">
      <input 
        type="text" 
        id="cart-cupom" 
        name="coupon_code"
        class="form-control vtex-cupom-input" 
        placeholder="Código do cupom / vale-presente" 
      />
      <button 
        type="button" 
        id="btn-apply-cupom" 
        class="btn btn-primary btn-validar"
      >
        Validar
      </button>
    </div>
  </div>

  <!-- Price Summary -->
  <div class="order-summary-totals">
    <div class="row-subtotal">
      <span class="label">Subtotal dos produtos:</span>
      <span class="val price-subtotal">R$ 129,90</span>
    </div>
    <div class="row-shipping">
      <span class="label">Frete Sedex Expresso:</span>
      <span class="val price-frete">R$ 20,00</span>
    </div>
    <div class="row-total grand-total-highlight">
      <span class="label">Total a pagar:</span>
      <span class="val price-final-total font-bold">R$ 149,90</span>
    </div>
  </div>
</div>`,
    mockBox: {
      coupon: { ymin: 300, xmin: 150, ymax: 360, xmax: 600 },
      button: { ymin: 300, xmin: 615, ymax: 360, xmax: 780 },
      total: { ymin: 660, xmin: 500, ymax: 720, xmax: 820 },
    },
  },
  {
    id: 'shopify-us',
    title: 'Shopify Modern Checkout (US / USD)',
    url: 'https://checkout.allbirds.com/checkouts/c/9941a87b12',
    language: 'English (US)',
    description: 'Standard Shopify one-page checkout with inline discount field and calculated order total.',
    html: `<aside class="sidebar order-summary" role="complementary">
  <div class="order-summary__sections">
    <form class="edit_checkout" action="/checkout" method="post">
      <div class="fieldset">
        <div class="field field--show-floating-label">
          <label class="field__label" for="checkout_reduction_code">Discount code or gift card</label>
          <div class="field__input-btn-wrapper">
            <input 
              placeholder="Discount code or gift card" 
              class="field__input" 
              id="checkout_reduction_code" 
              name="checkout[reduction_code]" 
              type="text" 
            />
            <button 
              type="submit" 
              class="field__input-btn btn btn--disabled" 
              aria-label="Apply discount code"
              id="apply_discount_button"
            >
              <span class="btn__content">Apply</span>
            </button>
          </div>
        </div>
      </div>
    </form>

    <table class="total-line-table">
      <tbody>
        <tr class="total-line total-line--subtotal">
          <th class="total-line__name">Subtotal</th>
          <td class="total-line__price">$84.00</td>
        </tr>
        <tr class="total-line total-line--shipping">
          <th class="total-line__name">Shipping (Standard Ground)</th>
          <td class="total-line__price">$10.00</td>
        </tr>
      </tbody>
      <tfoot class="total-line-table__footer">
        <tr class="total-line">
          <th class="total-line__name payment-due-label">Total</th>
          <td class="total-line__price payment-due">
            <span class="payment-due__currency">USD</span>
            <span class="payment-due__price" data-checkout-payment-due-target="9400">$94.00</span>
          </td>
        </tr>
      </tfoot>
    </table>
  </div>
</aside>`,
    mockBox: {
      coupon: { ymin: 240, xmin: 100, ymax: 300, xmax: 650 },
      button: { ymin: 240, xmin: 665, ymax: 300, xmax: 820 },
      total: { ymin: 710, xmin: 620, ymax: 760, xmax: 880 },
    },
  },
  {
    id: 'french-cdiscount',
    title: 'French E-Commerce Checkout (EUR)',
    url: 'https://panier.cdiscount.com/checkout/step3/payment.html',
    language: 'French (FR)',
    description: 'European e-commerce checkout with "code promo / remise" and strict "Montant total".',
    html: `<div class="recapitulatif-commande">
  <div class="bloc-remise">
    <span class="titre">Avez-vous un code promo ou bon d'achat ?</span>
    <div class="champ-saisie">
      <input 
        type="text" 
        id="code-promo-input" 
        name="code_remise" 
        class="input-promo" 
        placeholder="Entrez votre code avantage ou bon d'achat" 
      />
      <button 
        type="button" 
        id="btn-valider-remise" 
        class="btn-appliquer"
      >
        Appliquer
      </button>
    </div>
  </div>

  <div class="lignes-totaux">
    <p>Sous-total articles: 179,50 €</p>
    <p>Frais de livraison: 10,00 €</p>
    <div class="montant-total-final">
      <span class="libelle">Montant total à régler TTC:</span>
      <span class="valeur font-bold" id="total-ttc">189,50 €</span>
    </div>
  </div>
</div>`,
    mockBox: {
      coupon: { ymin: 280, xmin: 120, ymax: 340, xmax: 620 },
      button: { ymin: 280, xmin: 640, ymax: 340, xmax: 800 },
      total: { ymin: 680, xmin: 520, ymax: 740, xmax: 850 },
    },
  },
  {
    id: 'edge-case-missing',
    title: 'Strict Test: Express Checkout (No Coupon Allowed)',
    url: 'https://fastcheckout.example.com/pay/instant-buy',
    language: 'English',
    description: 'Negative test case: single-click direct purchase without promo code. Verifies found: false behavior.',
    html: `<div class="instant-pay-wrapper">
  <h2>Express Direct Checkout</h2>
  <div class="item-summary">Digital Subscription (Annual): $120.00</div>
  <div class="tax-line">Estimated Tax (0%): $0.00</div>
  <div class="order-grand-total">
    <span class="label">Total:</span>
    <span class="amount">$120.00</span>
  </div>
  <button id="instant-stripe-btn">Pay with Apple Pay</button>
</div>`,
    mockBox: {
      coupon: undefined,
      button: undefined,
      total: { ymin: 550, xmin: 400, ymax: 610, xmax: 750 },
    },
  },
  {
    id: 'brazil-collapsed-trigger',
    title: 'VTEX/Mercado Checkout (Collapsed + Reveal Trigger)',
    url: 'https://loja.mercadolivre.com.br/checkout/pagamento/v2',
    language: 'Portuguese (BR)',
    description: 'Collapsed coupon form: hidden input and submit button behind "Adicionar cupom de desconto" button trigger.',
    html: `<div class="checkout-payment-box">
  <!-- Trigger button to reveal collapsed coupon form -->
  <button 
    type="button"
    id="toggle-coupon-btn" 
    class="btn-toggle-cupom add-coupon-trigger" 
    aria-expanded="false" 
    data-toggle="collapse"
  >
    <svg class="icon-tag" width="16" height="16" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path><line x1="7" y1="7" x2="7.01" y2="7"></line></svg>
    Adicionar cupom de desconto
    <span class="chevron-down">▼</span>
  </button>

  <!-- Collapsed/Hidden Coupon Form Container (display: none) -->
  <div id="coupon-form-container" class="coupon-container collapse hidden" style="display: none;">
    <input 
      type="text" 
      id="input-cupom-desconto" 
      placeholder="Digite seu cupom de desconto" 
      class="form-control cupom-input" 
    />
    <button 
      type="button" 
      id="btn-aplicar-cupom" 
      class="btn btn-aplicar"
    >
      Aplicar
    </button>
  </div>

  <!-- Price Summary with Grand Total strictly separated from subtotal and shipping -->
  <div class="resumo-valores">
    <div class="linha-subtotal">Subtotal dos itens: R$ 89,90</div>
    <div class="linha-frete">Frete Expresso: R$ 0,00</div>
    <div class="linha-total-final">
      <span class="label">Total a pagar:</span>
      <span class="valor-final font-bold" id="valor-total-transacao">R$ 89,90</span>
    </div>
  </div>
</div>`,
    mockBox: {
      trigger: { ymin: 240, xmin: 120, ymax: 295, xmax: 560 },
      coupon: { ymin: 310, xmin: 120, ymax: 360, xmax: 580 },
      button: { ymin: 310, xmin: 595, ymax: 360, xmax: 760 },
      total: { ymin: 650, xmin: 480, ymax: 710, xmax: 820 },
    },
  },
];

export const DetectionStudio: React.FC<DetectionStudioProps> = ({
  onAddTask,
  onSendToRegexStudio,
  teamMembers = [],
}) => {
  const [inputMode, setInputMode] = useState<'html' | 'image' | 'combined'>('html');
  const [htmlInput, setHtmlInput] = useState<string>(PRESETS[0].html);
  const [targetUrl, setTargetUrl] = useState<string>(PRESETS[0].url);
  const [screenshotBase64, setScreenshotBase64] = useState<string | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>(PRESETS[0].id);

  // Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeHighlightElement, setActiveHighlightElement] = useState<string | null>(null);

  // Copy helper
  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Load a preset
  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setActivePresetId(preset.id);
    setHtmlInput(preset.html);
    setTargetUrl(preset.url);
    setErrorMsg(null);
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setScreenshotBase64(dataUrl);
      setScreenshotPreview(dataUrl);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Execute Detection Analysis
  const handleRunAnalysis = async () => {
    if (!htmlInput.trim() && !screenshotBase64) {
      setErrorMsg('Please provide an HTML snippet, a checkout screenshot, or select a preset.');
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);

    try {
      const reqPayload: DetectionRequest = {
        htmlSnippet: htmlInput.trim() || undefined,
        screenshotBase64: screenshotBase64 || undefined,
        targetUrl: targetUrl.trim() || undefined,
      };

      const res = await fetch('/api/detection/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reqPayload),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with ${res.status}`);
      }

      const result: DetectionResult = await res.json();
      setAnalysisResult(result);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to analyze checkout elements.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Initial auto-run with Preset 0 on mount if no result
  React.useEffect(() => {
    handleRunAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Convert detection result into a structured QC Verification Task on the In Progress board
  const handleCreateQCTaskFromDetection = () => {
    if (!analysisResult) return;

    const hostname = targetUrl ? new URL(targetUrl).hostname : 'checkout.merchant.com';
    const missingCount = [
      analysisResult.couponInput.found,
      analysisResult.applyButton.found,
      analysisResult.totalAmount.found,
    ].filter((f) => !f).length;

    const newTask: Partial<QCTask> = {
      title: `Checkout Elements Verification: ${hostname}`,
      targetUrl: targetUrl || 'https://checkout.mystore.com',
      assignedTo: teamMembers[0]?.id || 'mem-1',
      priority: missingCount > 0 ? 'critical' : 'high',
      category: 'Broken Link Patrol',
      progress: 40,
      checklist: [
        ...(analysisResult.isFormCollapsed
          ? [
              {
                id: 'det-0',
                text: `Verify Show Form Trigger reveals collapsed coupon form (${analysisResult.showFormTrigger?.selector || 'missing'})`,
                completed: analysisResult.showFormTrigger?.found ?? false,
              },
            ]
          : []),
        {
          id: 'det-1',
          text: `Verify Coupon Code Input (${analysisResult.couponInput.selector || 'missing'}) - ${analysisResult.couponInput.is_hidden ? 'Hidden / Collapsed' : 'Visible'}`,
          completed: analysisResult.couponInput.found,
        },
        {
          id: 'det-2',
          text: `Verify Apply Button (${analysisResult.applyButton.selector || 'missing'}) - ${analysisResult.applyButton.is_hidden ? 'Hidden / Collapsed' : 'Visible'}`,
          completed: analysisResult.applyButton.found,
        },
        {
          id: 'det-3',
          text: `Verify Grand Total strictly isolates from subtotal (${analysisResult.totalAmount.valueOrText || 'missing'})`,
          completed: analysisResult.totalAmount.found,
        },
        {
          id: 'det-4',
          text: 'Run automated end-to-end discount application test suite',
          completed: false,
        },
      ],
      notes: `Generated from Checkout Element Detection.\nForm Collapsed: ${analysisResult.isFormCollapsed ? 'YES (requires click on ' + (analysisResult.showFormTrigger?.valueOrText || 'trigger') + ')' : 'NO (Visible)'}\nCoupon Input: ${analysisResult.couponInput.found ? 'Found (' + (analysisResult.couponInput.is_hidden ? 'Hidden' : 'Visible') + ')' : 'MISSING'}\nApply Button: ${analysisResult.applyButton.found ? 'Found (' + (analysisResult.applyButton.is_hidden ? 'Hidden' : 'Visible') + ')' : 'MISSING'}\nGrand Total: ${analysisResult.totalAmount.found ? analysisResult.totalAmount.valueOrText : 'MISSING'}`,
      bugsFound: missingCount,
    };

    if (onAddTask) {
      onAddTask(newTask);
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header / Persona Directive Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 p-6 shadow-xl">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-indigo-400">
                Autonomous UI & DOM Parser
              </span>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full border border-indigo-500/30">
                Multimodal Gemini 3.8 + DOM Parser
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Checkout Element Detection
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Extract and strictly isolate key checkout elements from user input (screenshot or HTML snippet):
              <strong className="text-indigo-300"> 1. Coupon Input</strong> (placeholder & visibility status),
              <strong className="text-indigo-300"> 2. Submit / Apply Button</strong> (action/icon & visibility),
              <strong className="text-emerald-300"> 3. Grand Total</strong> (strictly isolates final transaction amount from subtotal & shipping), and
              <strong className="text-purple-300"> 4. Show Form Trigger</strong> (detects hidden/collapsed coupon forms and extracts reveal buttons).
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/30 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAnalyzing ? 'Analyzing Checkout...' : 'Re-Run Detection'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Preset Selector Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Preloaded Checkout Presets (Instant QA Verification)</span>
          </span>
          <span className="text-[11px] text-slate-500">Click any preset to test extraction heuristics</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PRESETS.map((preset) => {
            const isSelected = activePresetId === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset)}
                className={`p-3 rounded-xl text-left border transition cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-950/60 border-indigo-500 shadow-md shadow-indigo-500/10'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/60'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-400">
                      {preset.language}
                    </span>
                    {isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-ping" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-200 line-clamp-1">{preset.title}</div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {preset.description}
                  </div>
                </div>
                <div className="mt-2 text-[10px] text-slate-500 font-mono truncate">
                  {preset.url.replace(/^https?:\/\//, '')}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Input Section & Analysis Trigger */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (HTML / Screenshot) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
            {/* Input Mode Toggle */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Input Source
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setInputMode('html')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'html'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>HTML</span>
                </button>
                <button
                  onClick={() => setInputMode('image')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'image'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Screenshot</span>
                </button>
                <button
                  onClick={() => setInputMode('combined')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'combined'
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Both</span>
                </button>
              </div>
            </div>

            {/* Target URL Reference (Optional) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                <span>Target Checkout URL</span>
                {targetUrl && onSendToRegexStudio && (
                  <button
                    onClick={() => onSendToRegexStudio(targetUrl)}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                  >
                    <span>Send to Regex Studio</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://merchant.com/checkouts/..."
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            {/* HTML Snippet Field */}
            {(inputMode === 'html' || inputMode === 'combined') && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">
                    DOM / HTML Checkout Snippet
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">
                    {htmlInput.length} chars
                  </span>
                </div>
                <textarea
                  rows={9}
                  value={htmlInput}
                  onChange={(e) => {
                    setHtmlInput(e.target.value);
                    setActivePresetId('');
                  }}
                  placeholder="Paste checkout form, coupon input, and total lines here..."
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 resize-y leading-relaxed"
                />
              </div>
            )}

            {/* Screenshot Upload Field */}
            {(inputMode === 'image' || inputMode === 'combined') && (
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Checkout UI Screenshot</span>
                  {screenshotPreview && (
                    <button
                      onClick={() => {
                        setScreenshotBase64(null);
                        setScreenshotPreview(null);
                      }}
                      className="text-[11px] text-rose-400 hover:text-rose-300"
                    >
                      Clear image
                    </button>
                  )}
                </label>

                {screenshotPreview ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 max-h-56 flex items-center justify-center group">
                    <img
                      src={screenshotPreview}
                      alt="Uploaded checkout screenshot"
                      className="object-contain w-full h-auto max-h-56"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <span className="text-xs text-white font-medium bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-700">
                        Screenshot ready for multimodal scan
                      </span>
                    </div>
                  </div>
                ) : (
                  <label className="border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer transition bg-slate-950/40 hover:bg-slate-950">
                    <Upload className="w-6 h-6 text-slate-400" />
                    <span className="text-xs font-medium text-slate-300">
                      Upload Checkout Screenshot (PNG, JPG)
                    </span>
                    <span className="text-[11px] text-slate-500 text-center">
                      Enables visual bounding-box localization & OCR parsing
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            )}

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Run Button */}
            <button
              onClick={handleRunAnalysis}
              disabled={isAnalyzing}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs transition shadow-lg shadow-indigo-600/25 cursor-pointer disabled:opacity-50"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Parsing DOM & Visual Layout...</span>
                </>
              ) : (
                <>
                  <ScanSearch className="w-4 h-4" />
                  <span>Detect 3 Key Checkout Elements</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Structured Detection Results */}
        <div className="lg:col-span-7 space-y-4">
          {analysisResult ? (
            <div className="space-y-4">
              {/* Overview Metrics Ribbon */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-md ${
                      analysisResult.couponInput.found && analysisResult.totalAmount.found
                        ? 'bg-emerald-600 shadow-emerald-600/20'
                        : 'bg-amber-600 shadow-amber-600/20'
                    }`}
                  >
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-200">
                      {analysisResult.summary}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>Detected Language: <strong>{analysisResult.languageDetected || 'Auto'}</strong></span>
                      <span>•</span>
                      <span>Confidence Score: <strong className="text-emerald-400">{analysisResult.confidenceScore}%</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onAddTask && (
                    <button
                      onClick={handleCreateQCTaskFromDetection}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-xs font-semibold transition cursor-pointer"
                      title="Create a QC Verification Task on the In Progress Board"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create QC Task</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Three Strict Checkout Element Cards */}
              <div className="space-y-3">
                {/* 1. COUPON INPUT CARD */}
                <div
                  onMouseEnter={() => setActiveHighlightElement('coupon')}
                  onMouseLeave={() => setActiveHighlightElement(null)}
                  className={`p-4 rounded-2xl border transition ${
                    analysisResult.couponInput.found
                      ? 'bg-slate-900/90 border-slate-800 hover:border-indigo-500/60'
                      : 'bg-rose-950/20 border-rose-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <BadgePercent className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        1. Coupon / Promo Code Input
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        analysisResult.couponInput.found
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {analysisResult.couponInput.found ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FOUND</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>NOT FOUND</span>
                        </>
                      )}
                    </span>
                  </div>

                  {analysisResult.couponInput.found ? (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {analysisResult.couponInput.selector && (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1 flex items-center justify-between">
                              <span>CSS Selector / DOM ID</span>
                              <button
                                onClick={() =>
                                  handleCopy(analysisResult.couponInput.selector!, 'sel-coupon')
                                }
                                className="text-slate-400 hover:text-white transition"
                                title="Copy Selector"
                              >
                                {copiedKey === 'sel-coupon' ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="font-mono text-indigo-300 truncate">
                              {analysisResult.couponInput.selector}
                            </div>
                          </div>
                        )}

                        {analysisResult.couponInput.valueOrText && (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                              Placeholder / Label Text
                            </div>
                            <div className="text-slate-200 truncate font-medium">
                              "{analysisResult.couponInput.valueOrText}"
                            </div>
                          </div>
                        )}
                      </div>

                      {analysisResult.couponInput.multilingualMatch && (
                        <div className="flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="text-slate-500">Keyword Detected:</span>
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-mono">
                            {analysisResult.couponInput.multilingualMatch}
                          </span>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                        {analysisResult.couponInput.details}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-300/80">
                      {analysisResult.couponInput.details}
                    </p>
                  )}
                </div>

                {/* 2. SUBMIT / APPLY BUTTON CARD */}
                <div
                  onMouseEnter={() => setActiveHighlightElement('button')}
                  onMouseLeave={() => setActiveHighlightElement(null)}
                  className={`p-4 rounded-2xl border transition ${
                    analysisResult.applyButton.found
                      ? 'bg-slate-900/90 border-slate-800 hover:border-purple-500/60'
                      : 'bg-rose-950/20 border-rose-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        2. Submit / Apply Button
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        analysisResult.applyButton.found
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {analysisResult.applyButton.found ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>FOUND</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>NOT FOUND</span>
                        </>
                      )}
                    </span>
                  </div>

                  {analysisResult.applyButton.found ? (
                    <div className="space-y-2 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {analysisResult.applyButton.selector && (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1 flex items-center justify-between">
                              <span>Button Selector / ID</span>
                              <button
                                onClick={() =>
                                  handleCopy(analysisResult.applyButton.selector!, 'sel-btn')
                                }
                                className="text-slate-400 hover:text-white transition"
                                title="Copy Selector"
                              >
                                {copiedKey === 'sel-btn' ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="font-mono text-purple-300 truncate">
                              {analysisResult.applyButton.selector}
                            </div>
                          </div>
                        )}

                        {analysisResult.applyButton.valueOrText && (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                              Action Label / Icon
                            </div>
                            <div className="text-slate-200 truncate font-medium">
                              "{analysisResult.applyButton.valueOrText}"
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400">
                        {analysisResult.applyButton.proximityConfirmed && (
                          <span className="flex items-center gap-1 text-emerald-400">
                            <Check className="w-3 h-3" />
                            <span>Proximity Confirmed (Directly adjacent to coupon input)</span>
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                        {analysisResult.applyButton.details}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-300/80">
                      {analysisResult.applyButton.details}
                    </p>
                  )}
                </div>

                {/* 3. FINAL TOTAL AMOUNT CARD (STRICT) */}
                <div
                  onMouseEnter={() => setActiveHighlightElement('total')}
                  onMouseLeave={() => setActiveHighlightElement(null)}
                  className={`p-4 rounded-2xl border transition ${
                    analysisResult.totalAmount.found
                      ? 'bg-slate-900/90 border-slate-800 hover:border-emerald-500/60'
                      : 'bg-rose-950/20 border-rose-900/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                        <Coins className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-200">
                        3. Grand Total Amount (Strict Rule)
                      </span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        analysisResult.totalAmount.found
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      }`}
                    >
                      {analysisResult.totalAmount.found ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>STRICT TOTAL DETECTED</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-3 h-3" />
                          <span>NOT FOUND</span>
                        </>
                      )}
                    </span>
                  </div>

                  {analysisResult.totalAmount.found ? (
                    <div className="space-y-2 text-xs">
                      {/* Prominent Value Banner */}
                      <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-950 to-emerald-950/30 border border-emerald-500/30 flex items-center justify-between">
                        <div>
                          <div className="text-[10px] font-mono uppercase text-emerald-400 font-semibold">
                            Final Transaction Amount
                          </div>
                          <div className="text-xl font-bold font-mono text-white tracking-tight mt-0.5">
                            {analysisResult.totalAmount.valueOrText}
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
                            Numeric: {analysisResult.totalAmount.currency || ''} {analysisResult.totalAmount.amount?.toFixed(2) || ''}
                          </span>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Rule: Subtotal & shipping excluded
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {analysisResult.totalAmount.selector && (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1 flex items-center justify-between">
                              <span>Total DOM Selector</span>
                              <button
                                onClick={() =>
                                  handleCopy(analysisResult.totalAmount.selector!, 'sel-total')
                                }
                                className="text-slate-400 hover:text-white transition"
                                title="Copy Selector"
                              >
                                {copiedKey === 'sel-total' ? (
                                  <Check className="w-3 h-3 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                            <div className="font-mono text-emerald-300 truncate">
                              {analysisResult.totalAmount.selector}
                            </div>
                          </div>
                        )}

                        {analysisResult.totalAmount.multilingualMatch && (
                          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="text-[10px] font-mono uppercase text-slate-500 mb-1">
                              Matched Total Label
                            </div>
                            <div className="text-slate-200 truncate font-medium">
                              "{analysisResult.totalAmount.multilingualMatch}"
                            </div>
                          </div>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed bg-slate-950/50 p-2 rounded-lg border border-slate-800/60">
                        {analysisResult.totalAmount.details}
                      </p>
                    </div>
                  ) : (
                    <p className="text-xs text-rose-300/80">
                      {analysisResult.totalAmount.details}
                    </p>
                  )}
                </div>
              </div>

              {/* JSON Output Accordion / Export */}
              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Raw Structured JSON Output</span>
                  </span>
                  <button
                    onClick={() =>
                      handleCopy(JSON.stringify(analysisResult, null, 2), 'raw-json')
                    }
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
                  >
                    {copiedKey === 'raw-json' ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy JSON</span>
                      </>
                    )}
                  </button>
                </div>

                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-48 leading-relaxed">
                  {JSON.stringify(analysisResult, null, 2)}
                </pre>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[350px] p-8 rounded-2xl bg-slate-900/60 border border-slate-800 border-dashed flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <ScanSearch className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">
                  Ready for Checkout DOM & Screenshot Extraction
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mt-1">
                  Select a preloaded preset on the left or paste your HTML snippet / screenshot to detect the coupon input, submit button, and strict total amount.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
