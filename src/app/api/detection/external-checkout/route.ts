import { NextRequest, NextResponse } from 'next/server';
import { cleanCheckoutHtml, parseCheckoutStructuredFallback } from '@/lib/gemini';

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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, html } = body || {};

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
      const fallback = parseCheckoutStructuredFallback(focusedHtml);
      return NextResponse.json({
        success: true,
        mode: 'fallback',
        url: url || '',
        analyzedAt: new Date().toISOString(),
        result: fallback,
        fallback: true,
        reason: 'Missing GEMINI_API_KEY',
      });
    }

    const promptText = `Tu es un moteur d'extraction DOM et d'automatisation web spécialisé en checkout e-commerce.

Analyse STRICTEMENT le HTML fourni et détecte les 4 éléments suivants en utilisant uniquement des éléments réellement présents dans le code. N'invente aucun sélecteur CSS.

IMPORTANT :
- Base-toi uniquement sur les balises, attributs réels (id, class, name, data-*), et textes visibles présents dans le HTML.
- N'invente jamais un sélecteur si tu ne peux pas le déduire du code.
- Si l'élément n'existe pas, mets exists: false.
- Si plusieurs montants existent, retourne STRICTEMENT le total final de commande, pas le subtotal, pas le shipping, pas la taxe si séparée.
- Si le formulaire coupon est masqué derrière un bouton/lien/accordion, détecte show_form_trigger et mets required_to_click: true.
- Si le champ coupon ou le bouton d'application est masqué/collapsed, mets is_hidden: true.

Éléments à extraire :
1. show_form_trigger
   - Bouton/lien/accordion qui révèle le formulaire coupon
   - Champs:
     {
       "exists": boolean,
       "required_to_click": boolean,
       "exact_css_selector": string,
       "inner_text": string
     }

2. coupon_input
   - Champ input du code promo
   - Champs:
     {
       "exists": boolean,
       "is_hidden": boolean,
       "exact_css_selector": string,
       "placeholder": string
     }

3. coupon_button
   - Bouton ou action associée immédiatement au champ coupon
   - Champs:
     {
       "exists": boolean,
       "is_hidden": boolean,
       "exact_css_selector": string,
       "button_type": string
     }

4. total_order
   - Total final de commande uniquement
   - Champs:
     {
       "exists": boolean,
       "exact_css_selector": string,
       "raw_text": string,
       "numeric_value": number,
       "currency": string
     }

URL cible:
${url || ''}

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

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: promptText }],
            },
          ],
          generationConfig: {
            temperature: 0,
            responseMimeType: 'application/json',
          },
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      const fallback = parseCheckoutStructuredFallback(focusedHtml);
      return NextResponse.json({
        success: true,
        mode: 'fallback',
        url: url || '',
        analyzedAt: new Date().toISOString(),
        result: fallback,
        fallback: true,
        reason: 'Gemini request failed',
        details: data,
      });
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      const fallback = parseCheckoutStructuredFallback(focusedHtml);
      return NextResponse.json({
        success: true,
        mode: 'fallback',
        url: url || '',
        analyzedAt: new Date().toISOString(),
        result: fallback,
        fallback: true,
        reason: 'Empty Gemini response',
      });
    }

    const parsed = JSON.parse(text);

    return NextResponse.json({
      success: true,
      mode: 'gemini',
      url: url || '',
      analyzedAt: new Date().toISOString(),
      result: parsed,
    });
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