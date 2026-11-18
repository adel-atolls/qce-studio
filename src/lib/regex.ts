import { RegexOptions, RegexResult } from '@/types/index';

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

export function generateLocalRegexFromUrl(
  urlStr: string,
  options: RegexOptions
): RegexResult {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlStr);
  } catch {
    try {
      parsedUrl = new URL('https://' + urlStr);
    } catch {
      parsedUrl = new URL('https://example.com/item/123');
    }
  }

  const protocol = parsedUrl.protocol.replace(':', '');
  const host = parsedUrl.hostname;
  const pathname = parsedUrl.pathname;
  const searchParams = Array.from(parsedUrl.searchParams.entries());
  const hash = parsedUrl.hash;

  const flavor = options.flavor || 'javascript';
  const scope = options.matchScope || 'full';
  const namedGroups = options.captureGroups;
  const strict = options.strictAnchors !== false;

  const tokens = [];
  let patternBody = '';

  const protoPattern = 'https?';
  tokens.push({
    name: 'protocol',
    pattern: protoPattern,
    description: 'Matches http or https protocol',
    example: `${protocol}://`,
  });

  const escapedHost = host.replace(/\./g, '\\.');
  const hostPattern = options.allowSubdomains
    ? `(?:[a-zA-Z0-9-]+\\.)*${escapedHost.replace(/^[^.]+\./, '')}`
    : escapedHost;

  tokens.push({
    name: 'domain',
    pattern: hostPattern,
    description: options.allowSubdomains
      ? 'Matches domain and optional subdomains'
      : 'Exact domain match',
    example: host,
  });

  const segments = pathname.split('/').filter(Boolean);
  const pathTokens: string[] = [];

  segments.forEach((seg, idx) => {
    if (/^\d+$/.test(seg)) {
      const segName = namedGroups ? `(?<id_${idx}>[0-9]+)` : '([0-9]+)';
      pathTokens.push(segName);
      tokens.push({
        name: `id_${idx}`,
        pattern: '[0-9]+',
        description: `Numeric ID segment`,
        example: seg,
      });
    } else if (/^[a-z]{2}(-[a-z]{2,4})?$/i.test(seg)) {
      const segName = namedGroups
        ? `(?<locale>[a-zA-Z]{2}(?:-[a-zA-Z]{2,4})?)`
        : '([a-zA-Z]{2}(?:-[a-zA-Z]{2,4})?)';
      pathTokens.push(segName);
      tokens.push({
        name: 'locale',
        pattern: '[a-zA-Z]{2}(?:-[a-zA-Z]{2,4})?',
        description: 'ISO locale or language-region code',
        example: seg,
      });
    } else {
      const escapedSeg = seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pathTokens.push(escapedSeg);
      tokens.push({
        name: `slug_${idx}`,
        pattern: escapedSeg,
        description: `Static route segment`,
        example: seg,
      });
    }
  });

  const pathRegex = pathTokens.length > 0 ? '\\/' + pathTokens.join('\\/') : '\\/?';

  let queryRegex = '';
  if (options.allowQueryParams && searchParams.length > 0) {
    const queryParts = searchParams.map(([k, v]) => {
      const isNum = /^\d+$/.test(v);
      const valPattern = isNum ? '[0-9]+' : '[^&\\s]+';
      const grp = namedGroups
        ? `(?<${k.replace(/[^a-zA-Z0-9_]/g, '_')}>${valPattern})`
        : `(${valPattern})`;

      tokens.push({
        name: `param_${k}`,
        pattern: `${k}=${valPattern}`,
        description: `Query parameter "${k}"`,
        example: `${k}=${v}`,
      });

      return `${k}=${grp}`;
    });

    queryRegex = '(?:\\?' + queryParts.join('&') + '(?:&[^#\\s]+)*)?';
  } else if (options.allowQueryParams) {
    queryRegex = '(?:\\?[^#\\s]*)?';
  }

  let hashRegex = '';
  if (hash) {
    hashRegex = '(?:#[a-zA-Z0-9_-]+)?';
    tokens.push({
      name: 'hash',
      pattern: '#[a-zA-Z0-9_-]+',
      description: 'Optional URL fragment anchor',
      example: hash,
    });
  }

  if (scope === 'path') {
    patternBody = `${pathRegex}${queryRegex}${hashRegex}`;
  } else if (scope === 'domain_path') {
    patternBody = `${hostPattern}${pathRegex}${queryRegex}${hashRegex}`;
  } else {
    patternBody = `https?:\\/\\/${hostPattern}${pathRegex}${queryRegex}${hashRegex}`;
  }

  const finalPattern = strict ? `^${patternBody}$` : patternBody;
  const funnel = extractInstantFunnelRegex(urlStr);

  return {
    pattern: finalPattern,
    flags: 'i',
    flavor,
    explanation: `This regex matches ${scope} URL structures based on ${host}${pathname}. It safely captures the domain, route structure, and optional query parameters according to the selected options.`,
    tokens,
    testCases: [
      { url: urlStr, shouldMatch: true, label: 'Original Target URL' },
      {
        url: urlStr.replace(/https?:\/\//, 'http://'),
        shouldMatch: true,
        label: 'HTTP Variation',
      },
      {
        url: 'https://example.com/fake-path',
        shouldMatch: false,
        label: 'Different domain / route',
      },
    ],
    funnelPattern: funnel?.dotPattern,
    cleanFunnelPattern: funnel?.escapedPattern,
    universalFunnelPattern: funnel?.universalPattern,
    extractedDomain: funnel?.domain,
    extractedKeyword: funnel?.keyword,
    codeSnippets: {
      javascript: `const regex = new RegExp(${JSON.stringify(finalPattern)}, 'i');\nconst matched = regex.test(url);`,
      python: `import re\nregex = re.compile(r"${finalPattern}", re.I)\nmatched = regex.search(url) is not None`,
      typescript: `const regex: RegExp = new RegExp(${JSON.stringify(finalPattern)}, 'i');\nconst matched = regex.test(url);`,
    },
    antiPatterns: [
      'Avoid unescaped dots in domain names.',
      'Avoid nested greedy groups like (.*)+.',
      'Avoid overly broad .* matchers when route specificity matters.',
    ],
    suggestedEdgeCases: [
      'Localized routes with locale prefixes',
      'Optional query parameters',
      'Trailing slash variations',
      'http vs https',
      'Subdomain depth variations',
    ],
  };
}

export function testRegexOnInput(pattern: string, flags: string, input: string) {
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
    return {
      matched: false,
      groups: {},
      matches: [],
      duration: 0,
    };
  }
}