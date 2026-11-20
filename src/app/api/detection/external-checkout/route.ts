import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { cleanCheckoutHtml, parseCheckoutStructuredFallback } from '@/lib/gemini';
import { ExternalCheckoutSignals } from '@/types/index';

function isolateCheckoutRelevantHtml(html: string): string {
  const lowered = html.toLowerCase();

  const keywords = [
    'coupon',
    'cupom',
    'promo',
    'discount',
    'voucher',
    'checkout',
    'cart',
    'bag',
    'panier',
    'total',
    'payment',
    'subtotal',
    'shipping',
    'aplicar',
    'validar',
    'apply',
    'code promo',
    'Code','Aktion','Rabatt','Gutschein','Gutschein','Gutschein','Gesamt',
    'Código','Promoção','Desconto','Cupom','Vale','Voucher','Total',
    'Code','Promo','Réduction','Coupon','Bon','Voucher','Total',
    'Code','Aktion','Rabatt','Gutschein','Gutschein','Gutschein','Gesamt',
    'Codice','Promo','Sconto','Coupon','Buono','Voucher','Totale',
    'Código','Promo','Descuento','Cupón','Bono','Vale','Total',
    'Code','Actie','Korting','Kortingsbon','Waardebon','Voucher','Totaal',
    'Kod','Promocja','Rabat','Kupon','Bon','Voucher','Razem',
    'Código','Promo','Descuento','Cupón','Vale','Bono','Total',
    'Kod','Kampanj','Rabatt','Kupong','Värdecheck','Presentkort','Totalt'
  ];

  let firstIndex = -1;
  for (const keyword of keywords) {
    const idx = lowered.indexOf(keyword);
    if (idx !== -1 && (firstIndex === -1 || idx < firstIndex)) {
      firstIndex = idx;
    }
  }

  if (firstIndex === -1) {
    return html.slice(0, 120000);
  }

  const start = Math.max(0, firstIndex - 30000);
  const end = Math.min(html.length, firstIndex + 90000);
  return html.slice(start, end);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function applySignalsToFallback(
  fallbackResult: any,
  signals?: ExternalCheckoutSignals | null
) {
  if (!signals) return fallbackResult;

  const result = { ...fallbackResult };

  if (!result.coupon_input.exists && signals.couponInputs?.length > 0) {
    const first = signals.couponInputs[0];
    result.coupon_input = {
      exists: true,
      is_hidden: !!first.hidden,
      exact_css_selector: first.selector || '',
      placeholder: first.placeholder || '',
    };
  }

  if (!result.coupon_button.exists && signals.couponButtons?.length > 0) {
    const first = signals.couponButtons[0];
    result.coupon_button = {
      exists: true,
      is_hidden: !!first.hidden,
      exact_css_selector: first.selector || '',
      button_type: first.text || '',
    };
  }

  if (!result.show_form_trigger.exists && signals.showFormTriggers?.length > 0) {
    const first = signals.showFormTriggers[0];
    result.show_form_trigger = {
      exists: true,
      required_to_click: !!first.hidden || result.coupon_input.is_hidden || result.coupon_button.is_hidden,
      exact_css_selector: first.selector || '',
      inner_text: first.text || '',
    };
  }

  if (!result.total_order.exists && signals.totalCandidates?.length > 0) {
    const first = signals.totalCandidates.find((item) =>
      /\$|€|£|r\$|usd|eur|brl|total/i.test(item.text)
    ) || signals.totalCandidates[0];

    result.total_order = {
      exists: true,
      exact_css_selector: first?.selector || '',
      raw_text: first?.text || '',
      numeric_value: 0,
      currency: '',
    };
  }

  return result;
}

export async function POST(req: NextRequest) {
  try {
    const requestBody = await req.json();
    const { url, html, signals } = requestBody || {};

    if (!html || typeof html !== 'string') {
      return NextResponse.json(
        { error: 'Payload invalide. html requis.' },
        { status: 400 }
      );
    }

    const cleanedHtml = cleanCheckoutHtml(html);
    const focusedHtml = isolateCheckoutRelevantHtml(cleanedHtml);
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const baseFallback = parseCheckoutStructuredFallback(focusedHtml);
      const fallbackResult = applySignalsToFallback(baseFallback, signals);
      return NextResponse.json({
        success: true,
        mode: 'fallback',
        url: url || '',
        analyzedAt: new Date().toISOString(),
        result: fallbackResult,
        fallback: true,
        reason: 'Missing GEMINI_API_KEY',
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'qce-studio-v2',
        },
      },
    });

    const promptText = `Tu es un moteur d'extraction DOM et d'automatisation web spécialisé en checkout e-commerce.

Analyse STRICTEMENT le HTML fourni et détecte les 4 éléments suivants en utilisant uniquement des éléments réellement présents dans le code. N'invente aucun sélecteur CSS.

IMPORTANT :
- Base-toi uniquement sur les balises, attributs réels (id, class, name, data-*), et textes visibles présents dans le HTML.
- Utilise aussi les signaux locaux fournis par l'extension comme indices prioritaires.
- Si les signaux locaux donnent déjà un sélecteur réel présent dans le DOM, privilégie-le.
- N'invente jamais un sélecteur si tu ne peux pas le déduire du code.
- Si l'élément n'existe pas, mets exists: false.
- Si plusieurs montants existent, retourne STRICTEMENT le total final de commande, pas le subtotal, pas le shipping, pas la taxe si séparée.
- Si le formulaire coupon est masqué derrière un bouton/lien/accordion, détecte show_form_trigger et mets required_to_click: true.
- Si le champ coupon ou le bouton d'application est masqué/collapsed, mets is_hidden: true.

Éléments à extraire :
1. show_form_trigger
2. coupon_input
3. coupon_button
4. total_order

URL cible:
${url || ''}

SIGNAUX LOCAUX DE L'EXTENSION:
${JSON.stringify(signals || {}, null, 2)}

HTML à analyser:
${focusedHtml}

Retourne exclusivement ce JSON valide :
{
  "show_form_trigger": {
    "exists": false,
    "required_to_click": false,
    "exact_css_selector": "",
    "inner_text": ""
  },
  "coupon_input": {
    "exists": false,
    "is_hidden": false,
    "exact_css_selector": "",
    "placeholder": ""
  },
  "coupon_button": {
    "exists": false,
    "is_hidden": false,
    "exact_css_selector": "",
    "button_type": ""
  },
  "total_order": {
    "exists": false,
    "exact_css_selector": "",
    "raw_text": "",
    "numeric_value": 0,
    "currency": ""
  }
}`;

    const modelName = 'gemini-3.8-flash';

    const tryGemini = async () => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      });

      return response.text;
    };

    try {
      let rawText = '';

      try {
        rawText = (await tryGemini()) || '';
      } catch (firstError: any) {
        const message =
          typeof firstError?.message === 'string'
            ? firstError.message
            : JSON.stringify(firstError);

        const shouldRetry =
          message.includes('503') ||
          message.includes('UNAVAILABLE') ||
          message.includes('high demand');

        if (!shouldRetry) {
          throw firstError;
        }

        await sleep(1200);
        rawText = (await tryGemini()) || '';
      }

      if (!rawText) {
        const baseFallback = parseCheckoutStructuredFallback(focusedHtml);
        const fallbackResult = applySignalsToFallback(baseFallback, signals);

        return NextResponse.json({
          success: true,
          mode: 'fallback',
          url: url || '',
          analyzedAt: new Date().toISOString(),
          result: fallbackResult,
          fallback: true,
          reason: 'Empty Gemini SDK response',
          modelTried: modelName,
        });
      }

      let parsedResult;
      try {
        parsedResult = JSON.parse(rawText);
      } catch {
        const baseFallback = parseCheckoutStructuredFallback(focusedHtml);
        const fallbackResult = applySignalsToFallback(baseFallback, signals);

        return NextResponse.json({
          success: true,
          mode: 'fallback',
          url: url || '',
          analyzedAt: new Date().toISOString(),
          result: fallbackResult,
          fallback: true,
          reason: 'Invalid Gemini JSON response',
          raw: rawText,
          modelTried: modelName,
        });
      }

      return NextResponse.json({
        success: true,
        mode: 'gemini',
        modelUsed: modelName,
        url: url || '',
        analyzedAt: new Date().toISOString(),
        result: parsedResult,
      });
    } catch (geminiError) {
      const baseFallback = parseCheckoutStructuredFallback(focusedHtml);
      const fallbackResult = applySignalsToFallback(baseFallback, signals);

      return NextResponse.json({
        success: true,
        mode: 'fallback',
        url: url || '',
        analyzedAt: new Date().toISOString(),
        result: fallbackResult,
        fallback: true,
        reason: geminiError instanceof Error ? geminiError.message : 'Gemini SDK request failed',
        modelTried: modelName,
      });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Server error',
        details: error instanceof Error ? error.message : 'unknown',
      },
      { status: 500 }
    );
  }
}