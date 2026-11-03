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
  // Quick Funnel Matchers for E-Commerce / QA
  funnelPattern?: string; // e.g. ".*ruadocafe.com.br.checkouts.*"
  cleanFunnelPattern?: string; // e.g. ".*ruadocafe\.com\.br.*checkouts.*"
  universalFunnelPattern?: string; // e.g. ".*ruadocafe\.com\.br.*(checkout|checkouts|cart).*"
  extractedDomain?: string;
  extractedKeyword?: string;
}

export type TaskStatus = 'backlog' | 'in_progress' | 'review' | 'completed' | 'blocked';
export type TaskPriority = 'low' | 'medium' | 'high' | 'critical';
export type TaskCategory =
  | 'Regex QC'
  | 'Link Routing'
  | 'Deep Link Audit'
  | 'Query Param Sanitization'
  | 'Localization QC'
  | 'Broken Link Patrol';

export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface QCTask {
  id: string;
  title: string;
  targetUrl: string;
  assignedTo: string; // Member ID
  status: TaskStatus;
  priority: TaskPriority;
  category: TaskCategory;
  progress: number; // 0-100
  timeSpentMinutes: number;
  checklist: ChecklistItem[];
  notes: string;
  bugsFound: number;
  createdAt: string;
  updatedAt: string;
}

export type MemberStatus = 'active' | 'gone';
export type MemberRole =
  | 'QC Intern'
  | 'Quality Control Editor'
  | 'QA Automation Tester'
  | 'Senior QA Lead'
  | 'Content Reviewer';

export interface TeamMember {
  id: string;
  name: string;
  nickname?: string;
  email: string;
  role: MemberRole;
  status: MemberStatus;
  avatarColor: string;
  initials: string;
  joinedDate: string;
  departedDate?: string;
  tenure: string;
  exitReason?: string;
  tasksCompleted: number;
  accuracyRate: number;
  specialties: string[];
  activeTasksCount: number;
  mentor?: string;
  notes?: string;
  // Friendly & Funny Attributes
  coffeeRatio?: string;
  superpower?: string;
  funQuote?: string;
  kudosCount?: number;
  funnyAward?: string;
}

export type NotificationType =
  | 'task_status'
  | 'task_assigned'
  | 'regex_generated'
  | 'bug_flagged'
  | 'team_update'
  | 'qc_alert';

export type NotificationSeverity = 'info' | 'success' | 'warning' | 'urgent';

export interface QCNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  taskId?: string;
  memberId?: string;
  read: boolean;
  severity: NotificationSeverity;
}

// Checkout DOM / UI Element Detection Types
export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
}

export interface DetectedElement {
  found: boolean;
  type: 'coupon_input' | 'apply_button' | 'total_amount' | 'show_form_trigger';
  name: string;
  selector?: string; // CSS selector or HTML ID/tag
  valueOrText?: string; // placeholder or button text or raw total amount
  currency?: string; // for total amount (e.g., "$", "R$", "€", "£")
  amount?: number; // parsed numeric value of grand total
  proximityConfirmed?: boolean; // for submit button
  multilingualMatch?: string; // matched keyword: e.g. "cupom", "código", "validar", "total"
  details: string; // explanation or reason if missing
  boundingBox?: BoundingBox; // 0-1000 normalized coordinates if screenshot analyzed
  is_hidden?: boolean; // visibility status (true if collapsed/hidden)
  visibility?: 'visible' | 'hidden' | 'collapsed';
  iconDescription?: string; // description of button/trigger icon (e.g., "tag icon", "arrow >", "plus +")
  needsClick?: boolean; // whether element must be clicked to reveal the coupon form
}

export interface DetectionResult {
  couponInput: DetectedElement;
  applyButton: DetectedElement;
  totalAmount: DetectedElement;
  showFormTrigger?: DetectedElement; // Show Form Trigger / Reveal Button
  show_form_trigger?: DetectedElement; // Snake-case alias for compatibility
  isFormCollapsed?: boolean; // True if coupon input & button are collapsed behind a trigger
  confidenceScore: number;
  languageDetected?: string;
  summary: string;
  analyzedAt: string;
}

export interface DetectionRequest {
  htmlSnippet?: string;
  screenshotBase64?: string;
  targetUrl?: string;
}

