export type ExternalCheckoutPayload = {
  type: 'INSPECT_CHECKOUT_HTML';
  url: string;
  html: string;
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