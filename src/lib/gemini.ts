export function cleanCheckoutHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200000);
}

export function parseCheckoutStructuredFallback(html: string) {
  const cleaned = html || '';

  const result = {
    show_form_trigger: {
      exists: false,
      required_to_click: false,
      exact_css_selector: '',
      inner_text: '',
    },
    coupon_input: {
      exists: false,
      is_hidden: false,
      exact_css_selector: '',
      placeholder: '',
    },
    coupon_button: {
      exists: false,
      is_hidden: false,
      exact_css_selector: '',
      button_type: '',
    },
    total_order: {
      exists: false,
      exact_css_selector: '',
      raw_text: '',
      numeric_value: 0,
      currency: '',
    },
  };

  const inputMatches = cleaned.match(/<input[^>]+>/gi) || [];
  let foundInputTag = '';

  for (const tag of inputMatches) {
    if (/(coupon|cupom|promo|voucher|discount|desconto|remise|c[oó]digo)/i.test(tag)) {
      foundInputTag = tag;
      break;
    }
  }

  if (foundInputTag) {
    const idMatch = foundInputTag.match(/id=["']([^"']+)["']/i);
    const nameMatch = foundInputTag.match(/name=["']([^"']+)["']/i);
    const classMatch = foundInputTag.match(/class=["']([^"']+)["']/i);
    const placeholderMatch = foundInputTag.match(/placeholder=["']([^"']+)["']/i);

    let selector = '';
    if (idMatch) selector = `#${idMatch[1]}`;
    else if (nameMatch) selector = `input[name="${nameMatch[1]}"]`;
    else if (classMatch) selector = `input.${classMatch[1].trim().split(/\s+/)[0]}`;

    const isHidden =
      /style=["'][^"']*display:\s*none/i.test(foundInputTag) ||
      /style=["'][^"']*visibility:\s*hidden/i.test(foundInputTag) ||
      /\bhidden\b/i.test(foundInputTag) ||
      /class=["'][^"']*(hidden|collapse|collapsed|d-none|invisible)[^"']*["']/i.test(foundInputTag);

    result.coupon_input = {
      exists: true,
      is_hidden: isHidden,
      exact_css_selector: selector,
      placeholder: placeholderMatch?.[1] || '',
    };
  }

  const buttonMatches = [
    ...(cleaned.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || []),
    ...(cleaned.match(/<input[^>]+type=["'](?:submit|button)["'][^>]*>/gi) || []),
  ];

  let foundButtonTag = '';

  for (const tag of buttonMatches) {
    if (/(apply|validar|aplicar|appliquer|redeem|usar|ok)/i.test(tag)) {
      foundButtonTag = tag;
      break;
    }
  }

  if (foundButtonTag) {
    const idMatch = foundButtonTag.match(/id=["']([^"']+)["']/i);
    const classMatch = foundButtonTag.match(/class=["']([^"']+)["']/i);

    let selector = '';
    if (idMatch) selector = `#${idMatch[1]}`;
    else if (classMatch) selector = `button.${classMatch[1].trim().split(/\s+/)[0]}`;

    const isHidden =
      /style=["'][^"']*display:\s*none/i.test(foundButtonTag) ||
      /style=["'][^"']*visibility:\s*hidden/i.test(foundButtonTag) ||
      /\bhidden\b/i.test(foundButtonTag) ||
      /class=["'][^"']*(hidden|collapse|collapsed|d-none|invisible)[^"']*["']/i.test(foundButtonTag);

    const textMatch = foundButtonTag.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

    result.coupon_button = {
      exists: true,
      is_hidden: isHidden,
      exact_css_selector: selector,
      button_type: textMatch || 'button',
    };
  }

  const triggerCandidates = [
    ...(cleaned.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || []),
    ...(cleaned.match(/<a[^>]*>[\s\S]*?<\/a>/gi) || []),
    ...(cleaned.match(/<summary[^>]*>[\s\S]*?<\/summary>/gi) || []),
  ];

  for (const tag of triggerCandidates) {
    if (
      /(adicionar|add|have|promo code|coupon|cupom|discount|code promo|bon d'achat|ajouter)/i.test(tag) &&
      !/(apply|validar|aplicar|appliquer|redeem|usar|ok)/i.test(tag)
    ) {
      const idMatch = tag.match(/id=["']([^"']+)["']/i);
      const classMatch = tag.match(/class=["']([^"']+)["']/i);
      let selector = '';

      if (idMatch) selector = `#${idMatch[1]}`;
      else if (classMatch) {
        const firstClass = classMatch[1].trim().split(/\s+/)[0];
        const tagType = tag.startsWith('<a') ? 'a' : tag.startsWith('<summary') ? 'summary' : 'button';
        selector = `${tagType}.${firstClass}`;
      }

      const text = tag.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      const required =
        result.coupon_input.is_hidden ||
        result.coupon_button.is_hidden ||
        /aria-expanded=["']false["']/i.test(tag) ||
        /data-toggle=["']collapse["']/i.test(tag);

      result.show_form_trigger = {
        exists: true,
        required_to_click: required,
        exact_css_selector: selector,
        inner_text: text,
      };
      break;
    }
  }

  const totalRegexes = [
    /(?:total\s*a\s*pagar|grand\s*total|montant\s*total|payment-due|total\s*final|total)[^<0-9$€£¥R]{0,40}((?:R\$|[$€£¥]|USD|EUR|BRL)\s*[\d.,]+)/i,
    /((?:R\$|[$€£¥])\s*[\d.,]+)/i,
  ];

  let totalMatch: RegExpMatchArray | null = null;
  for (const regex of totalRegexes) {
    totalMatch = cleaned.match(regex);
    if (totalMatch) break;
  }

  if (totalMatch) {
    const raw = totalMatch[1].trim();
    const currencyMatch = raw.match(/R\$|[$€£¥]|USD|EUR|BRL/i);
    const currency = currencyMatch?.[0] || '';
    const numericText = raw.replace(/[^0-9.,]/g, '');

    let numericValue = 0;
    if (numericText.includes(',') && numericText.includes('.')) {
      numericValue =
        numericText.lastIndexOf(',') > numericText.lastIndexOf('.')
          ? parseFloat(numericText.replace(/\./g, '').replace(',', '.')) || 0
          : parseFloat(numericText.replace(/,/g, '')) || 0;
    } else if (numericText.includes(',')) {
      numericValue = parseFloat(numericText.replace(',', '.')) || 0;
    } else {
      numericValue = parseFloat(numericText) || 0;
    }

    let selector = '';
    const idMatch = cleaned.match(/id=["']([^"']*(?:total|payment-due)[^"']*)["']/i);
    const classMatch = cleaned.match(/class=["']([^"']*(?:total|payment-due|grand-total)[^"']*)["']/i);

    if (idMatch) selector = `#${idMatch[1]}`;
    else if (classMatch) selector = `.${classMatch[1].trim().split(/\s+/)[0]}`;

    result.total_order = {
      exists: true,
      exact_css_selector: selector,
      raw_text: raw,
      numeric_value: numericValue,
      currency,
    };
  }

  return result;
}