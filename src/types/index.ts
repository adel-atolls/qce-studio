export type ExternalCheckoutSignalInput = {
  selector: string;
  placeholder: string;
  name: string;
  id: string;
  hidden: boolean;
  outerHTML: string;
};

export type ExternalCheckoutSignalButton = {
  selector: string;
  text: string;
  hidden: boolean;
  outerHTML: string;
};

export type ExternalCheckoutSignalTrigger = {
  selector: string;
  text: string;
  hidden: boolean;
  outerHTML: string;
};

export type ExternalCheckoutSignalTotal = {
  selector: string;
  text: string;
  hidden: boolean;
  outerHTML: string;
};

export type ExternalCheckoutSignals = {
  couponInputs: ExternalCheckoutSignalInput[];
  couponButtons: ExternalCheckoutSignalButton[];
  showFormTriggers: ExternalCheckoutSignalTrigger[];
  totalCandidates: ExternalCheckoutSignalTotal[];
};

export type ExternalCheckoutPayload = {
  type: 'INSPECT_CHECKOUT_HTML';
  url: string;
  html: string;
  signals?: ExternalCheckoutSignals;
};

export type CheckoutDetectionStructuredResult = {
  show_form_trigger: {
    exists: boolean;
    required_to_click: boolean;
    exact_css_selector: string;
    inner_text: string;
  };
  coupon_input: {
    exists: boolean;
    is_hidden: boolean;
    exact_css_selector: string;
    placeholder: string;
  };
  coupon_button: {
    exists: boolean;
    is_hidden: boolean;
    exact_css_selector: string;
    button_type: string;
  };
  total_order: {
    exists: boolean;
    exact_css_selector: string;
    raw_text: string;
    numeric_value: number;
    currency: string;
  };
};

export type CheckoutDetectionHistoryItem = {
  url: string;
  analyzedAt: string;
  result: CheckoutDetectionStructuredResult;
};

export type RegexFlavor = 'javascript' | 'python' | 'pcre';
export type MatchScope = 'full' | 'path' | 'domain_path' | 'query';

export interface RegexOptions {
  flavor: RegexFlavor;
  matchScope: MatchScope;
  captureGroups: boolean;
  strictAnchors: boolean;
  allowSubdomains: boolean;
  allowQueryParams: boolean;
  detectDynamicSegments: boolean;
}

export interface RegexToken {
  name: string;
  pattern: string;
  description: string;
  example: string;
}

export interface RegexTestCase {
  url: string;
  shouldMatch: boolean;
  label: string;
  matched?: boolean;
  groups?: Record<string, string>;
  executionMs?: number;
}

export interface RegexResult {
  pattern: string;
  flags: string;
  flavor: RegexFlavor;
  explanation: string;
  tokens: RegexToken[];
  testCases: RegexTestCase[];
  codeSnippets: {
    javascript: string;
    python: string;
    typescript: string;
  };
  antiPatterns: string[];
  suggestedEdgeCases: string[];
  funnelPattern?: string;
  cleanFunnelPattern?: string;
  universalFunnelPattern?: string;
  extractedDomain?: string;
  extractedKeyword?: string;
}