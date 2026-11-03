import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  ShieldCheck,
  Plus,
  RefreshCw,
  MousePointerClick,
  BadgePercent,
  Coins,
  Send,
  Clock,
} from 'lucide-react';
import {
  DetectionResult,
  DetectionRequest,
  QCTask,
  TeamMember,
  ExternalCheckoutPayload,
  CheckoutDetectionStructuredResult,
  CheckoutDetectionHistoryItem,
} from '../types';

interface DetectionStudioProps {
  onAddTask?: (task: Partial<QCTask>) => void;
  onSendToRegexStudio?: (url: string) => void;
  teamMembers?: TeamMember[];
}

declare global {
  interface Window {
    chrome?: any;
  }
}

function formatDateTime(dateString?: string) {
  if (!dateString) return '-';
  try {
    return new Date(dateString).toLocaleString('fr-FR');
  } catch {
    return '-';
  }
}

function cleanIncomingHtml(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .trim();
}

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
  },
  {
    id: 'brazil-collapsed-trigger',
    title: 'VTEX/Mercado Checkout (Collapsed + Reveal Trigger)',
    url: 'https://loja.mercadolivre.com.br/checkout/pagamento/v2',
    language: 'Portuguese (BR)',
    description: 'Collapsed coupon form: hidden input and submit button behind "Adicionar cupom de desconto" button trigger.',
    html: `<div class="checkout-payment-box">
  <button 
    type="button"
    id="toggle-coupon-btn" 
    class="btn-toggle-cupom add-coupon-trigger" 
    aria-expanded="false" 
    data-toggle="collapse"
  >
    <svg class="icon-tag" width="16" height="16" viewBox="0 0 24 24"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path></svg>
    Adicionar cupom de desconto
    <span class="chevron-down">▼</span>
  </button>
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
  <div class="resumo-valores">
    <div class="linha-subtotal">Subtotal dos itens: R$ 89,90</div>
    <div class="linha-frete">Frete Expresso: R$ 0,00</div>
    <div class="linha-total-final">
      <span class="label">Total a pagar:</span>
      <span class="valor-final font-bold" id="valor-total-transacao">R$ 89,90</span>
    </div>
  </div>
</div>`,
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

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<DetectionResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const [externalLoading, setExternalLoading] = useState(false);
  const [externalError, setExternalError] = useState<string | null>(null);
  const [externalCurrentUrl, setExternalCurrentUrl] = useState<string>('');
  const [externalReceivedAt, setExternalReceivedAt] = useState<string>('');
  const [externalResult, setExternalResult] = useState<CheckoutDetectionStructuredResult | null>(null);
  const [externalHistory, setExternalHistory] = useState<CheckoutDetectionHistoryItem[]>([]);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('checkout-detection-external-history');
      if (raw) setExternalHistory(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const saveExternalHistory = useCallback((item: CheckoutDetectionHistoryItem) => {
    setExternalHistory((prev) => {
      const next = [item, ...prev.filter((h) => h.url !== item.url)].slice(0, 10);
      localStorage.setItem('checkout-detection-external-history', JSON.stringify(next));
      return next;
    });
  }, []);

  const selectorsJson = useMemo(() => {
    if (!externalResult) return '';
    return JSON.stringify(externalResult, null, 2);
  }, [externalResult]);

  const handleCopySelectorsJson = async () => {
    if (!selectorsJson) return;
    navigator.clipboard.writeText(selectorsJson);
    setCopiedKey('external-json');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const analyzeExternalPayload = useCallback(async (payload: ExternalCheckoutPayload) => {
    try {
      setExternalError(null);
      setExternalLoading(true);
      setExternalCurrentUrl(payload.url || '');
      setExternalReceivedAt(new Date().toISOString());

      const res = await fetch('/api/detection/external-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: payload.url,
          html: cleanIncomingHtml(payload.html),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || 'Failed to analyze external checkout DOM.');
      }

      setExternalResult(data.result);
      saveExternalHistory({
        url: data.url || payload.url,
        analyzedAt: data.analyzedAt || new Date().toISOString(),
        result: data.result,
      });
    } catch (err: any) {
      setExternalError(err?.message || 'External DOM analysis failed.');
    } finally {
      setExternalLoading(false);
    }
  }, [saveExternalHistory]);

  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      const data = event.data as ExternalCheckoutPayload;
      if (!data || data.type !== 'INSPECT_CHECKOUT_HTML') return;
      if (!data.html || typeof data.html !== 'string') return;
      analyzeExternalPayload(data);
    };

    window.addEventListener('message', handleWindowMessage);

    const chromeRuntime = window.chrome?.runtime;
    let externalListener: any = null;

    if (chromeRuntime?.onMessageExternal?.addListener) {
      externalListener = (
        message: ExternalCheckoutPayload,
        _sender: unknown,
        sendResponse: (response: any) => void
      ) => {
        if (message?.type === 'INSPECT_CHECKOUT_HTML') {
          analyzeExternalPayload(message);
          sendResponse?.({ ok: true });
        }
      };

      try {
        chromeRuntime.onMessageExternal.addListener(externalListener);
      } catch {
        // ignore
      }
    }

    return () => {
      window.removeEventListener('message', handleWindowMessage);
      if (externalListener && chromeRuntime?.onMessageExternal?.removeListener) {
        try {
          chromeRuntime.onMessageExternal.removeListener(externalListener);
        } catch {
          // ignore
        }
      }
    };
  }, [analyzeExternalPayload]);

  const handleSelectPreset = (preset: typeof PRESETS[0]) => {
    setActivePresetId(preset.id);
    setHtmlInput(preset.html);
    setTargetUrl(preset.url);
    setErrorMsg(null);
  };

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

  useEffect(() => {
    handleRunAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

    onAddTask?.(newTask);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      <div className="rounded-2xl border border-cyan-500/20 bg-slate-900/80 shadow-xl overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  externalLoading
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    externalLoading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                  }`}
                />
                {externalLoading ? 'Analyse en cours...' : 'En attente du clic extension'}
              </span>

              <span className="text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                Chrome DOM Intake
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-white">
                Réception automatique du DOM checkout depuis l’extension
              </h2>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                La page attend un payload <code className="text-cyan-300">INSPECT_CHECKOUT_HTML</code>{' '}
                envoyé depuis une extension Chrome ou via <code className="text-cyan-300">window.postMessage</code> en local.
              </p>
            </div>

            <div className="text-xs text-slate-300 space-y-1">
              <div>
                <span className="text-slate-500">URL cible :</span>{' '}
                <span className="font-mono text-cyan-300 break-all">{externalCurrentUrl || '-'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-500">Date/heure :</span>
                <span>{formatDateTime(externalReceivedAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopySelectorsJson}
              disabled={!externalResult}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition flex items-center gap-2"
            >
              {copiedKey === 'external-json' ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copié</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier les sélecteurs</span>
                </>
              )}
            </button>
          </div>
        </div>

        {externalError && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{externalError}</span>
          </div>
        )}

        <div className="p-5 grid grid-cols-1 xl:grid-cols-4 gap-4">
          <div className="xl:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <MousePointerClick className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Showform Trigger</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="text-slate-400">
                  Clic préalable requis :{' '}
                  <span className="font-semibold text-white">
                    {externalResult ? (externalResult.show_form_trigger.required_to_click ? 'Oui' : 'Non') : '-'}
                  </span>
                </div>
                <div className="text-slate-400">
                  Texte :{' '}
                  <span className="font-medium text-slate-200">
                    {externalResult?.show_form_trigger.inner_text || '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-purple-300 break-all">
                  {externalResult?.show_form_trigger.exact_css_selector || '-'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <BadgePercent className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-white">Coupon Input</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="text-slate-400">
                  Visibilité :{' '}
                  <span className="font-semibold text-white">
                    {externalResult ? (externalResult.coupon_input.is_hidden ? 'Masqué' : 'Visible') : '-'}
                  </span>
                </div>
                <div className="text-slate-400">
                  Placeholder :{' '}
                  <span className="font-medium text-slate-200">
                    {externalResult?.coupon_input.placeholder || '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-indigo-300 break-all">
                  {externalResult?.coupon_input.exact_css_selector || '-'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Send className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">Bouton Valider</h3>
              </div>
              <div className="space-y-2 text-xs">
                <div className="text-slate-400">
                  Type / icône :{' '}
                  <span className="font-medium text-slate-200">
                    {externalResult?.coupon_button.button_type || '-'}
                  </span>
                </div>
                <div className="text-slate-400">
                  Visibilité :{' '}
                  <span className="font-semibold text-white">
                    {externalResult ? (externalResult.coupon_button.is_hidden ? 'Masqué' : 'Visible') : '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-purple-300 break-all">
                  {externalResult?.coupon_button.exact_css_selector || '-'}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Coins className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Montant Total</h3>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-emerald-950/30 border border-emerald-500/20">
                  <div className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
                    Total détecté
                  </div>
                  <div className="text-2xl font-bold text-white mt-1">
                    {externalResult?.total_order.raw_text || '-'}
                  </div>
                </div>
                <div className="text-slate-400">
                  Valeur numérique :{' '}
                  <span className="font-semibold text-white">
                    {externalResult?.total_order.numeric_value ?? '-'}
                  </span>
                </div>
                <div className="text-slate-400">
                  Devise :{' '}
                  <span className="font-semibold text-white">
                    {externalResult?.total_order.currency || '-'}
                  </span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-emerald-300 break-all">
                  {externalResult?.total_order.exact_css_selector || '-'}
                </div>
              </div>
            </div>

            {externalResult && (
              <div className="md:col-span-2 p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-300">
                    JSON structuré reçu / généré
                  </span>
                  <button
                    onClick={handleCopySelectorsJson}
                    className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Copier</span>
                  </button>
                </div>
                <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto max-h-64 leading-relaxed">
                  {JSON.stringify(externalResult, null, 2)}
                </pre>
              </div>
            )}
          </div>

          <div className="xl:col-span-1">
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 h-full">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Historique des URLs analysées</h3>
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {externalHistory.length === 0 ? (
                  <div className="text-xs text-slate-500">
                    Aucune analyse reçue depuis l’extension pour le moment.
                  </div>
                ) : (
                  externalHistory.map((item, idx) => (
                    <button
                      key={`${item.url}-${idx}`}
                      onClick={() => {
                        setExternalCurrentUrl(item.url);
                        setExternalReceivedAt(item.analyzedAt);
                        setExternalResult(item.result);
                      }}
                      className="w-full text-left p-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition"
                    >
                      <div className="text-[11px] font-mono text-cyan-300 break-all line-clamp-2">
                        {item.url}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-1">
                        {formatDateTime(item.analyzedAt)}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 pb-5">
          <div className="p-4 rounded-2xl bg-slate-950 border border-dashed border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-2">Test local</div>
            <pre className="text-[11px] text-slate-400 font-mono overflow-x-auto">
{`window.postMessage({
  type: 'INSPECT_CHECKOUT_HTML',
  url: window.location.href,
  html: document.documentElement.outerHTML
}, '*');`}
            </pre>
          </div>
        </div>
      </div>

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
              <strong className="text-indigo-300"> 1. Coupon Input</strong>,
              <strong className="text-indigo-300"> 2. Submit / Apply Button</strong>,
              <strong className="text-emerald-300"> 3. Grand Total</strong>, and
              <strong className="text-purple-300"> 4. Show Form Trigger</strong>.
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

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-4">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Input Source
              </span>
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                <button
                  onClick={() => setInputMode('html')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'html' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>HTML</span>
                </button>
                <button
                  onClick={() => setInputMode('image')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'image' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Image className="w-3.5 h-3.5" />
                  <span>Screenshot</span>
                </button>
                <button
                  onClick={() => setInputMode('combined')}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center gap-1.5 ${
                    inputMode === 'combined' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Both</span>
                </button>
              </div>
            </div>

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

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

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

        <div className="lg:col-span-7 space-y-4">
          {analysisResult ? (
            <div className="space-y-4">
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
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create QC Task</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-semibold text-slate-400 flex items-center gap-1.5">
                    <Code2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Raw Structured JSON Output</span>
                  </span>
                  <button
                    onClick={() => handleCopy(JSON.stringify(analysisResult, null, 2), 'raw-json')}
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