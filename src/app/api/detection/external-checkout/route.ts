import { NextRequest, NextResponse } from 'next/server';
import { cleanCheckoutHtml, parseCheckoutStructuredFallback } from '@/lib/gemini';

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
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      const fallback = parseCheckoutStructuredFallback(cleanedHtml);
      return NextResponse.json({
        success: true,
        url: url || '',
        analyzedAt: new Date().toISOString(),
        result: fallback,
        fallback: true,
        reason: 'Missing GEMINI_API_KEY',
      });
    }

    const promptText = `Tu es un moteur d'extraction DOM et d'automatisation web. Analyse le code HTML fourni d'un panier/checkout et détecte les 4 éléments suivants en utilisant STRICTEMENT les balises, attributs (id, name, class, data-*) et textes réels présents dans le code. N'invente aucun sélecteur :
1. show_form_trigger : Bouton ou lien pour afficher le champ coupon s'il est masqué au départ (ex: 'Adicionar cupom', 'Have a promo code?'). Définis required_to_click: true si le formulaire est masqué par défaut.
2. coupon_input : Balise <input> de saisie du code promo (placeholder, sélecteur CSS exact, is_hidden).
3. coupon_button : Bouton ou icône cliquable associé immédiatement au champ de coupon pour valider.
4. total_order : Sélecteur du montant total final de la commande, devise et montant extrait.

URL cible: ${url || ''}

HTML du checkout/panier à analyser:
${cleanedHtml}

Réponds strictement en JSON valide avec cette structure exacte :
{
  "show_form_trigger": {
    "exists": true,
    "required_to_click": false,
    "exact_css_selector": "",
    "inner_text": ""
  },
  "coupon_input": {
    "exists": true,
    "is_hidden": false,
    "exact_css_selector": "",
    "placeholder": ""
  },
  "coupon_button": {
    "exists": true,
    "is_hidden": false,
    "exact_css_selector": "",
    "button_type": ""
  },
  "total_order": {
    "exists": true,
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
      const fallback = parseCheckoutStructuredFallback(cleanedHtml);
      return NextResponse.json({
        success: true,
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
      const fallback = parseCheckoutStructuredFallback(cleanedHtml);
      return NextResponse.json({
        success: true,
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