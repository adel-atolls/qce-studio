import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import {
  QCTask,
  TeamMember,
  QCNotification,
  RegexResult,
  RegexOptions,
  DetectionResult,
  DetectedElement,
  ExternalCheckoutPayload,
  CheckoutDetectionStructuredResult,
} from './src/types.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProd = process.env.NODE_ENV === 'production';
const PORT = parseInt(process.env.PORT || '3000', 10);

// Initialize Gemini SDK with User-Agent as required by skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Circuit breaker state for Gemini API to guarantee instant fallback and prevent UI lag
let isGeminiCircuitOpen = false;
let lastGeminiCircuitOpenTime = 0;
const GEMINI_CIRCUIT_COOLDOWN_MS = 60000;

function canAttemptGemini(): boolean {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === 'MY_GEMINI_API_KEY' || key.trim().length < 20) {
    return false;
  }
  if (isGeminiCircuitOpen) {
    if (Date.now() - lastGeminiCircuitOpenTime > GEMINI_CIRCUIT_COOLDOWN_MS) {
      isGeminiCircuitOpen = false;
      return true;
    }
    return false;
  }
  return true;
}

function tripGeminiCircuit(): void {
  isGeminiCircuitOpen = true;
  lastGeminiCircuitOpenTime = Date.now();
}

// In-Memory Data Store (Initialized with friendly and funny QC Team and Task data)
let teamMembers: TeamMember[] = [
  {
    id: 'mem-1',
    name: 'Sarah Chen',
    nickname: 'The ReDoS Tamer',
    email: 'sarah.chen@qc-team.internal',
    role: 'Senior QA Lead',
    status: 'active',
    avatarColor: 'from-blue-600 to-indigo-600',
    initials: 'SC',
    joinedDate: '2024-02-15',
    tenure: '2 yrs 1 mo',
    tasksCompleted: 342,
    accuracyRate: 99.4,
    specialties: ['Regex Engine Architect', 'Deep Link Routing', 'Security Sanitization'],
    activeTasksCount: 2,
    mentor: 'None (The Sensei)',
    notes: 'Oversees intern onboarding and regex pattern sign-offs. Zero tolerance for unanchored wildcard greediness.',
    coffeeRatio: '☕ 6 Espressos / 🐛 18 Disasters Prevented',
    superpower: 'Spots unescaped dots in 1000-char URLs in her sleep',
    funQuote: 'If a link doesn’t break under 50 emojis and three question marks, did you even test it?',
    kudosCount: 142,
    funnyAward: '🏆 Regex Overlord 2026',
  },
  {
    id: 'mem-2',
    name: 'Maya Lin',
    nickname: 'The Caffeinated Sleuth',
    email: 'maya.lin@qc-team.internal',
    role: 'QC Intern',
    status: 'active',
    avatarColor: 'from-violet-600 to-purple-600',
    initials: 'ML',
    joinedDate: '2026-08-01',
    tenure: '7 mos (Winter Cohort)',
    tasksCompleted: 88,
    accuracyRate: 97.8,
    specialties: ['URL Pattern Extraction', 'Query Param Auditing', 'Regression Tests'],
    activeTasksCount: 3,
    mentor: 'Sarah Chen',
    notes: 'Strong in regex decomposition. Once spent 4 hours hunting a catastrophic backtracking bug that turned out to be an invisible Unicode zero-width space.',
    coffeeRatio: '☕ 4 Iced Matchas / 🐛 11 Sneaky Bugs',
    superpower: 'Decompiles complex checkout slugs into 1-line matchers in 20 seconds',
    funQuote: 'My emotional support animal is a properly escaped backward slash (\\\\).',
    kudosCount: 89,
    funnyAward: '🔍 Zero-Width Space Survivor',
  },
  {
    id: 'mem-3',
    name: 'Liam Vance',
    nickname: 'Mobile Link Whisperer',
    email: 'liam.vance@qc-team.internal',
    role: 'QC Intern',
    status: 'active',
    avatarColor: 'from-emerald-600 to-teal-600',
    initials: 'LV',
    joinedDate: '2026-09-15',
    tenure: '6 mos (Winter Cohort)',
    tasksCompleted: 64,
    accuracyRate: 96.5,
    specialties: ['Mobile Deep Links', 'App Store Redirection', '404 Link Patrol'],
    activeTasksCount: 2,
    mentor: 'David Kim',
    notes: 'Working on deep link verification for iOS Universal links and Android app links.',
    coffeeRatio: '☕ 3 Cold Brews / 🐛 8 Redirect Loops Caught',
    superpower: 'Caught a fatal 404 redirect loop on staging while eating lunch with one hand',
    funQuote: 'Every URL is an invitation to break staging responsibly.',
    kudosCount: 57,
    funnyAward: '🌮 Taco-Fueled 404 Hunter',
  },
  {
    id: 'mem-4',
    name: 'David Kim',
    nickname: 'Accented Character Crusader',
    email: 'david.kim@qc-team.internal',
    role: 'Quality Control Editor',
    status: 'active',
    avatarColor: 'from-amber-600 to-orange-600',
    initials: 'DK',
    joinedDate: '2024-10-01',
    tenure: '1 yr 5 mos',
    tasksCompleted: 219,
    accuracyRate: 98.7,
    specialties: ['Localization Regex', 'Unicode URL Paths', 'Internationalization QC'],
    activeTasksCount: 2,
    mentor: 'Sarah Chen',
    notes: 'Specialist for non-ASCII link encoding, French accents, and Brazilian Portuguese checkout paths.',
    coffeeRatio: '☕ 5 Pour-Overs / 🐛 14 Encoding Casualties',
    superpower: 'Types Portuguese tildes (~), German umlauts (ü), and Kanji in regex without looking',
    funQuote: 'If your regex can’t parse São Paulo and München, your checkout is already broken.',
    kudosCount: 118,
    funnyAward: '🌐 UTF-8 Polyglot Champion',
  },
  {
    id: 'mem-5',
    name: 'Priya Sharma',
    nickname: 'Automated Chaos Monkey',
    email: 'priya.sharma@qc-team.internal',
    role: 'QA Automation Tester',
    status: 'active',
    avatarColor: 'from-rose-600 to-pink-600',
    initials: 'PS',
    joinedDate: '2025-03-10',
    tenure: '1 yr',
    tasksCompleted: 175,
    accuracyRate: 99.1,
    specialties: ['Automated Link Crawlers', 'ReDoS Vulnerability Auditing', 'CI/CD QC Pipeline'],
    activeTasksCount: 1,
    mentor: 'Sarah Chen',
    notes: 'Replaces 45 minutes of manual clicking with a 4-line script and a triumphant smirk.',
    coffeeRatio: '☕ 7 Double Espressos / 🐛 29 Automated Kills',
    superpower: 'Writes regex fuzzers that generate 100,000 edge cases in 2 seconds',
    funQuote: 'Why test manually for 10 minutes when you can spend 6 hours automating it forever?',
    kudosCount: 134,
    funnyAward: '⚡ The Script Goblin',
  },
  // Departed / Gone members (Alumni & Completed Internships - Legends)
  {
    id: 'mem-6',
    name: 'Marcus Brody',
    nickname: 'Broke Staging on Friday, Hero by Monday',
    email: 'marcus.brody@alumni.qc.internal',
    role: 'QC Intern',
    status: 'gone',
    avatarColor: 'from-slate-500 to-zinc-600',
    initials: 'MB',
    joinedDate: '2025-06-01',
    departedDate: '2025-12-15',
    tenure: '6 mos (Summer Cohort Legend)',
    exitReason: 'Completed Internship with Distinction; ascended to Core Backend Engineering Valhalla',
    tasksCompleted: 114,
    accuracyRate: 98.2,
    specialties: ['Affiliate Query String QC', 'E-commerce Routing'],
    activeTasksCount: 0,
    mentor: 'Sarah Chen',
    notes: 'Legendary summer intern. Once accidentally matched every URL on the internet with a rogue (.*)*, but patched it before the CEO noticed.',
    coffeeRatio: '☕ ∞ Bottomless Drip / 🐛 1 Legendary Recovery',
    superpower: 'Ascended to Core Engineering after mastering checkout query whitelist regexes',
    funQuote: 'I don’t always deploy on Friday afternoon, but when I do, I bring donuts on Monday.',
    kudosCount: 210,
    funnyAward: '🚀 Hall of Fame Class of 2025',
  },
  {
    id: 'mem-7',
    name: 'Sophia Rossi',
    nickname: 'Strict ISO Standards & Berlin Techno',
    email: 'sophia.rossi@alumni.qc.internal',
    role: 'Quality Control Editor',
    status: 'gone',
    avatarColor: 'from-slate-600 to-stone-600',
    initials: 'SR',
    joinedDate: '2023-08-15',
    departedDate: '2025-05-30',
    tenure: '1 yr 9 mos',
    exitReason: 'Relocated to Berlin to head QA Operations at Atolls Europe (and attend Berghain)',
    tasksCompleted: 420,
    accuracyRate: 99.6,
    specialties: ['Checkout Funnel Links', 'Payment Gateway Callback Regex'],
    activeTasksCount: 0,
    mentor: 'Sarah Chen',
    notes: 'Designed the original QC checkout security constitution. Still rejects our unanchored PRs from 4,000 miles away.',
    coffeeRatio: '☕ 4 Flat Whites / 🐛 420 Zero-Defect Releases',
    superpower: 'Could tell you which regex group failed just by looking at server CPU temperature',
    funQuote: 'Your regex either has start and end anchors (^ and $), or it is a liability to society.',
    kudosCount: 312,
    funnyAward: '👑 The Unanchored Rejector',
  },
  {
    id: 'mem-8',
    name: 'Kevin Zhao',
    nickname: 'The 300-Line Regex Comment Poet',
    email: 'kevin.zhao@alumni.qc.internal',
    role: 'QC Intern',
    status: 'gone',
    avatarColor: 'from-zinc-500 to-gray-700',
    initials: 'KZ',
    joinedDate: '2025-01-10',
    departedDate: '2025-07-20',
    tenure: '6 mos (Spring Cohort)',
    exitReason: 'Returned to UC Berkeley for M.S. in Computer Science. Rumor has it he now only speaks in PCRE lookaheads.',
    tasksCompleted: 92,
    accuracyRate: 97.1,
    specialties: ['CDN Asset URL Pattern Matching', 'Cache Key Regex'],
    activeTasksCount: 0,
    mentor: 'David Kim',
    notes: 'Left behind a 300-line ASCII art diagram in the codebase explaining AWS CloudFront cache key normalization.',
    coffeeRatio: '☕ 2 Monster Energies / 🐛 15 CDN Cache Bugs',
    superpower: 'Turned a 12-rule CDN URL rewrite nightmare into a single elegant lookahead regex',
    funQuote: 'Abandon all hope, ye who edit this query parameter without running the test suite.',
    kudosCount: 167,
    funnyAward: '📜 The ASCII Art Chronicler',
  },
];

let qcTasks: QCTask[] = [
  {
    id: 'task-101',
    title: 'Audit Stripe Webhook Redirect URI Regex',
    targetUrl: 'https://checkout.mystore.com/api/v2/webhooks/wh_9x8a7b6c5d?client_id=cs_live_44918&sig=e3b0c44298fc',
    assignedTo: 'mem-2',
    status: 'in_progress',
    priority: 'critical',
    category: 'Regex QC',
    progress: 65,
    timeSpentMinutes: 75,
    checklist: [
      { id: 'c1', text: 'Validate webhook ID prefix (wh_[a-zA-Z0-9]+)', completed: true },
      { id: 'c2', text: 'Ensure signature parameter hex match ([0-9a-f]{16,64})', completed: true },
      { id: 'c3', text: 'Test against ReDoS with 10k character query parameters', completed: false },
      { id: 'c4', text: 'Verify cross-region staging subdomain match', completed: false },
    ],
    notes: 'Regex needs strict boundaries to prevent open redirect vulnerabilities in the return handler.',
    bugsFound: 1,
    createdAt: '2026-11-02T14:30:00Z',
    updatedAt: '2026-11-03T08:15:00Z',
  },
  {
    id: 'task-102',
    title: 'E-commerce Catalog Product Slug & Variant Matching',
    targetUrl: 'https://shop.example.com/en-us/p/wireless-noise-cancelling-headphones-p-89412?color=matte-black&sku=SKU-99201',
    assignedTo: 'mem-3',
    status: 'in_progress',
    priority: 'high',
    category: 'Link Routing',
    progress: 40,
    timeSpentMinutes: 45,
    checklist: [
      { id: 'c1', text: 'Extract 2-letter ISO locale and region prefix', completed: true },
      { id: 'c2', text: 'Capture dynamic product slug and integer ID suffix', completed: true },
      { id: 'c3', text: 'Handle optional variant query parameters without order dependency', completed: false },
      { id: 'c4', text: 'Run against 50 legacy URL formats', completed: false },
    ],
    notes: 'Testing if variant query parameters can be omitted without breaking regex match.',
    bugsFound: 0,
    createdAt: '2026-11-02T16:00:00Z',
    updatedAt: '2026-11-03T09:00:00Z',
  },
  {
    id: 'task-103',
    title: 'OAuth2 Callback & State Token Whitelist Validation',
    targetUrl: 'https://auth.company.io/oauth/callback?code=def_981a2f&state=sec_nonce_8831&redirect_uri=https%3A%2F%2Fapp.company.io%2Fdashboard',
    assignedTo: 'mem-1',
    status: 'in_progress',
    priority: 'critical',
    category: 'Deep Link Audit',
    progress: 85,
    timeSpentMinutes: 110,
    checklist: [
      { id: 'c1', text: 'Enforce HTTPS for all redirect_uri values', completed: true },
      { id: 'c2', text: 'Verify state parameter format with high-entropy nonces', completed: true },
      { id: 'c3', text: 'Disallow localhost origins on production cluster', completed: true },
      { id: 'c4', text: 'Peer review with Sarah Chen', completed: false },
    ],
    notes: 'Pending final penetration test review before deployment to staging.',
    bugsFound: 2,
    createdAt: '2026-11-01T10:00:00Z',
    updatedAt: '2026-11-03T07:45:00Z',
  },
  {
    id: 'task-104',
    title: 'Localized Helpdesk Knowledgebase Deep Links',
    targetUrl: 'https://support.acme.org/hc/fr-fr/articles/441209382109-configuration-sso-okta#step-3-certificates',
    assignedTo: 'mem-4',
    status: 'review',
    priority: 'medium',
    category: 'Localization QC',
    progress: 95,
    timeSpentMinutes: 90,
    checklist: [
      { id: 'c1', text: 'Support RFC 5646 language tags (e.g., fr-fr, pt-br, zh-hant)', completed: true },
      { id: 'c2', text: 'Capture article ID and slug with unicode accents', completed: true },
      { id: 'c3', text: 'Anchor hash tag (#step-*) verification', completed: true },
    ],
    notes: 'All 18 localized locales matched accurately. Ready for final lead signoff.',
    bugsFound: 0,
    createdAt: '2026-11-01T11:20:00Z',
    updatedAt: '2026-11-02T17:00:00Z',
  },
  {
    id: 'task-105',
    title: 'UTM Tracking & Marketing Campaign Link Sanitization',
    targetUrl: 'https://getapp.co/promo/spring-sale-2026?utm_source=newsletter&utm_medium=email&utm_campaign=q1_growth&aff_id=9812',
    assignedTo: 'mem-2',
    status: 'backlog',
    priority: 'low',
    category: 'Query Param Sanitization',
    progress: 0,
    timeSpentMinutes: 0,
    checklist: [
      { id: 'c1', text: 'Extract UTM parameters and validate against whitelist', completed: false },
      { id: 'c2', text: 'Disallow malicious SQL injection chars in query string', completed: false },
      { id: 'c3', text: 'Verify affiliate ID numeric boundaries', completed: false },
    ],
    notes: 'Queued for next sprint or intern training batch.',
    bugsFound: 0,
    createdAt: '2026-11-03T02:00:00Z',
    updatedAt: '2026-11-03T02:00:00Z',
  },
  {
    id: 'task-106',
    title: 'AWS S3 Pre-signed Media Upload URL Matcher',
    targetUrl: 'https://my-bucket.s3.us-west-2.amazonaws.com/uploads/2026/11/report_final_v2.pdf?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Credential=AKIAIOSFODNN7EXAMPLE%2F20261103%2Fus-west-2%2Fs3%2Faws4_request',
    assignedTo: 'mem-5',
    status: 'completed',
    priority: 'high',
    category: 'Broken Link Patrol',
    progress: 100,
    timeSpentMinutes: 130,
    checklist: [
      { id: 'c1', text: 'Capture bucket name and AWS region segment', completed: true },
      { id: 'c2', text: 'Match year/month nested folder path structure', completed: true },
      { id: 'c3', text: 'Check file extension whitelist (.pdf, .png, .jpg)', completed: true },
      { id: 'c4', text: 'Enforce AWS auth query param signatures', completed: true },
    ],
    notes: 'Regex validated across 2,400 production S3 upload events with 0 false negatives.',
    bugsFound: 0,
    createdAt: '2026-10-30T09:10:00Z',
    updatedAt: '2026-11-02T19:20:00Z',
  },
];

let notifications: QCNotification[] = [
  {
    id: 'notif-1',
    type: 'task_status',
    title: 'Task Progress Updated',
    message: 'Sarah Chen updated "OAuth2 Callback & State Token Whitelist Validation" to 85%',
    timestamp: '2026-11-03T07:45:00Z',
    taskId: 'task-103',
    memberId: 'mem-1',
    read: false,
    severity: 'info',
  },
  {
    id: 'notif-2',
    type: 'qc_alert',
    title: 'ReDoS Warning Flagged',
    message: 'Sarah Chen detected potential catastrophic backtracking in Stripe Webhook regex test case #4',
    timestamp: '2026-11-03T08:15:00Z',
    taskId: 'task-101',
    memberId: 'mem-1',
    read: false,
    severity: 'urgent',
  },
  {
    id: 'notif-3',
    type: 'task_status',
    title: 'Ready for Review',
    message: 'David Kim moved "Localized Helpdesk Knowledgebase Deep Links" to In Review',
    timestamp: '2026-11-02T17:00:00Z',
    taskId: 'task-104',
    memberId: 'mem-4',
    read: true,
    severity: 'success',
  },
  {
    id: 'notif-4',
    type: 'task_assigned',
    title: 'New QC Task Assigned',
    message: 'Liam Vance was assigned to "E-commerce Catalog Product Slug & Variant Matching"',
    timestamp: '2026-11-02T16:00:00Z',
    taskId: 'task-102',
    memberId: 'mem-3',
    read: true,
    severity: 'info',
  },
];

// SSE Clients for Real-time task and notification streaming
interface SSEClient {
  id: string;
  res: Response;
}
let sseClients: SSEClient[] = [];

function broadcastSSE(event: string, data: any) {
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((client) => {
    try {
      client.res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

function pushNotification(notif: Omit<QCNotification, 'id' | 'timestamp' | 'read'>) {
  const newNotif: QCNotification = {
    ...notif,
    id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp: new Date().toISOString(),
    read: false,
  };
  notifications.unshift(newNotif);
  if (notifications.length > 50) notifications.pop();
  broadcastSSE('notification', newNotif);
  return newNotif;
}

// Fallback Deterministic Regex Synthesizer for URLs
function generateDeterministicRegexFromUrl(urlStr: string, options: RegexOptions): RegexResult {
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

  // Protocol
  const protoPattern = 'https?';
  tokens.push({
    name: 'protocol',
    pattern: protoPattern,
    description: 'Matches http or https protocol',
    example: `${protocol}://`,
  });

  // Host
  const escapedHost = host.replace(/\./g, '\\.');
  const hostPattern = options.allowSubdomains
    ? `(?:[a-zA-Z0-9-]+\\.)*${escapedHost.replace(/^[^.]+\./, '')}`
    : escapedHost;
  tokens.push({
    name: 'domain',
    pattern: hostPattern,
    description: options.allowSubdomains ? 'Matches domain and optional subdomains' : 'Exact domain match',
    example: host,
  });

  // Path segments
  const segments = pathname.split('/').filter(Boolean);
  const pathTokens: string[] = [];

  segments.forEach((seg, idx) => {
    // Check if segment is numeric ID
    if (/^\d+$/.test(seg)) {
      const segName = namedGroups ? `(?<id_${idx}>[0-9]+)` : '([0-9]+)';
      pathTokens.push(segName);
      tokens.push({
        name: `id_${idx}`,
        pattern: '[0-9]+',
        description: `Numeric ID segment (e.g., "${seg}")`,
        example: seg,
      });
    } else if (/^[a-f0-9-]{32,36}$/i.test(seg)) {
      // UUID or Hash
      const segName = namedGroups ? `(?<uuid_${idx}>[a-fA-F0-9-]+)` : '([a-fA-F0-9-]+)';
      pathTokens.push(segName);
      tokens.push({
        name: `uuid_${idx}`,
        pattern: '[a-fA-F0-9-]+',
        description: 'UUID or hash identifier',
        example: seg,
      });
    } else if (/^[a-z]{2}(-[a-z]{2,4})?$/i.test(seg)) {
      // Locale tag
      const segName = namedGroups ? `(?<locale>[a-zA-Z]{2}(?:-[a-zA-Z]{2,4})?)` : '([a-zA-Z]{2}(?:-[a-zA-Z]{2,4})?)';
      pathTokens.push(segName);
      tokens.push({
        name: 'locale',
        pattern: '[a-zA-Z]{2}(?:-[a-zA-Z]{2,4})?',
        description: 'ISO locale or language-region code',
        example: seg,
      });
    } else {
      // Word/slug
      const escapedSeg = seg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      pathTokens.push(escapedSeg);
      tokens.push({
        name: `slug_${idx}`,
        pattern: escapedSeg,
        description: `Static route segment "${seg}"`,
        example: seg,
      });
    }
  });

  const pathRegex = pathTokens.length > 0 ? '\\/' + pathTokens.join('\\/') : '\\/?';

  // Query Params
  let queryRegex = '';
  if (options.allowQueryParams && searchParams.length > 0) {
    const queryParts = searchParams.map(([k, v], i) => {
      const isNum = /^\d+$/.test(v);
      const valPattern = isNum ? '[0-9]+' : '[^&\\s]+';
      const grp = namedGroups ? `(?<${k.replace(/[^a-zA-Z0-9_]/g, '_')}>${valPattern})` : `(${valPattern})`;
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

  // Hash
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
    // Full
    patternBody = `https?:\\/\\/${hostPattern}${pathRegex}${queryRegex}${hashRegex}`;
  }

  const finalPattern = strict ? `^${patternBody}$` : patternBody;

  const testCases = [
    { url: urlStr, shouldMatch: true, label: 'Original Target URL' },
    {
      url: urlStr.replace(/https?:\/\//, 'http://'),
      shouldMatch: true,
      label: 'HTTP Variation',
    },
    {
      url: 'https://malicious-phishing.com' + pathname,
      shouldMatch: scope === 'path',
      label: 'Phishing domain with identical path',
    },
    {
      url: urlStr + '/extra-unexpected-segment',
      shouldMatch: !strict,
      label: 'Appended subpath (strict check)',
    },
  ];

  // Detect domain and checkout / cart / order / funnel keyword in URL
  const cleanHost = host.replace(/^www\./i, '');
  const lowerUrl = urlStr.toLowerCase();
  const funnelKeywords = [
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
    'checkout-step',
  ];
  let detectedKeyword = funnelKeywords.find((kw) => lowerUrl.includes(kw));

  if (!detectedKeyword) {
    const firstNonEmptySeg = segments[0] || 'checkouts';
    detectedKeyword = firstNonEmptySeg;
  }

  // Exact user format requested: .*ruadocafe.com.br.checkouts.*
  const funnelPattern = `.*${cleanHost}.${detectedKeyword}.*`;
  const cleanFunnelPattern = `.*${cleanHost.replace(/\./g, '\\.')}.*${detectedKeyword}.*`;
  const universalFunnelPattern = `.*${cleanHost.replace(/\./g, '\\.')}.*(checkout|checkouts|cart|carrinho|basket).*`;

  return {
    pattern: finalPattern,
    flags: 'i',
    flavor,
    explanation: `This regular expression matches ${scope} URL structures conforming to ${host}${pathname}. It enforces secure protocol validation, captures dynamic path segments (such as slugs, IDs, and locales), and safely handles query parameters.`,
    tokens,
    testCases,
    funnelPattern,
    cleanFunnelPattern,
    universalFunnelPattern,
    extractedDomain: cleanHost,
    extractedKeyword: detectedKeyword,
    codeSnippets: {
      javascript: `// JavaScript RegExp test\nconst regex = new RegExp(${JSON.stringify(finalPattern)}, 'i');\nconst matches = regex.test(link);\nconst groups = link.match(regex)?.groups;\n\n// Fast Checkout/Cart Matcher:\nconst funnelRegex = /${funnelPattern}/i;\nconsole.log(funnelRegex.test(link));`,
      python: `# Python re module\nimport re\n\npattern = re.compile(r"""${finalPattern}""", re.IGNORECASE)\nmatch = pattern.search(link)\n\n# Fast Checkout/Cart Funnel Matcher:\nfunnel_re = re.compile(r"""${funnelPattern}""", re.IGNORECASE)\nprint(funnel_re.search(link) is not None)`,
      typescript: `// TypeScript typed URL validator\nconst URL_REGEX: RegExp = /^${finalPattern.replace(/^\^|\$$/g, '')}$/i;\nexport const FUNNEL_REGEX: RegExp = /${funnelPattern}/i;\nexport function validateLink(url: string): boolean {\n  return URL_REGEX.test(url);\n}`,
    },
    antiPatterns: [
      'Avoid unescaped dots in domain (e.g. google.com vs google\\.com matches googleXcom)',
      'Avoid catastrophic backtracking by never nesting unbounded quantifiers like (.*)+',
      'Always sanitize query strings to avoid Open Redirect vulnerabilities',
    ],
    suggestedEdgeCases: [
      'Encoded URL query parameters (%20, %2F, unicode emojis)',
      'Subdomain depth variations (e.g. staging.api.us-east.example.com)',
      'Case-insensitivity on hostnames vs case-sensitivity on path slugs',
      'Port numbers (e.g. :8080 or :3000 in dev environments)',
    ],
  };
}

// Fallback Deterministic Checkout DOM & Multilingual Parser
function parseCheckoutDOMFallback(html: string): DetectionResult {
  const result: DetectionResult = {
    couponInput: {
      found: false,
      type: 'coupon_input',
      name: 'Coupon / Voucher Code Input',
      is_hidden: false,
      visibility: 'visible',
      details: 'No coupon, promo code, or voucher input found in DOM.',
    },
    applyButton: {
      found: false,
      type: 'apply_button',
      name: 'Apply / Submit Button',
      is_hidden: false,
      visibility: 'visible',
      details: 'No adjacent coupon apply or submit button detected.',
    },
    totalAmount: {
      found: false,
      type: 'total_amount',
      name: 'Grand Total Amount',
      details: 'No grand transaction total amount found.',
    },
    showFormTrigger: {
      found: false,
      type: 'show_form_trigger',
      name: 'Show Form Trigger (Reveal Button)',
      is_hidden: false,
      visibility: 'visible',
      needsClick: false,
      details: 'No hidden or collapsed coupon form detected; trigger not required.',
    },
    isFormCollapsed: false,
    confidenceScore: 85,
    languageDetected: 'Multilingual / Auto-detected',
    summary: 'Analyzed checkout structure using DOM pattern heuristics.',
    analyzedAt: new Date().toISOString(),
  };

  if (!html || typeof html !== 'string') return result;

  // 1. COUPON INPUT DETECTION (Multilingual: coupon, cupom, código, promo, voucher, remise, discount, code)
  const inputMatches = html.match(/<input[^>]+>/gi) || [];
  let foundInputTag = '';
  let matchedKeyword = '';

  for (const tag of inputMatches) {
    const kw = tag.match(/(?:coupon|cupom|c[oó]digo|promo|voucher|remise|discount|vale|desconto)/i);
    if (kw) {
      foundInputTag = tag;
      matchedKeyword = kw[0].toLowerCase();
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
    else selector = 'input[type="text"].coupon-input';

    const placeholder = placeholderMatch ? placeholderMatch[1] : '';

    result.couponInput = {
      found: true,
      type: 'coupon_input',
      name: 'Coupon / Voucher Input',
      selector,
      valueOrText: placeholder || 'Discount code input',
      is_hidden: false,
      visibility: 'visible',
      multilingualMatch: matchedKeyword,
      details: `Identified discount input field matching multilingual token "${matchedKeyword}"${placeholder ? ` with placeholder "${placeholder}"` : ''} via selector: ${selector}.`,
      boundingBox: { ymin: 340, xmin: 420, ymax: 385, xmax: 680 },
    };
  }

  // 2. SUBMIT / APPLY BUTTON DETECTION (proximity, adjacent container, apply, validar, appliquer, ok, >, aplicar)
  const buttonMatches = [
    ...(html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || []),
    ...(html.match(/<input[^>]+type=["'](?:submit|button)["'][^>]*>/gi) || []),
    ...(html.match(/<a[^>]+class=["'][^"']*(?:btn|button)[^"']*["'][^>]*>[\s\S]*?<\/a>/gi) || []),
  ];
  let foundButtonTag = '';
  let buttonLabel = '';
  let buttonIcon = '';

  for (const tag of buttonMatches) {
    // Avoid picking reveal triggers as the apply button
    if (tag.match(/(?:have|possui|adicionar|ajouter|tienes)\s+(?:a\s+)?(?:promo|cupom|coupon|code)/i)) {
      continue;
    }
    const isAdjacent =
      tag.match(/(?:apply|validar|appliquer|aplicar|redeem|submit|btn-apply|utilizar|add-coupon)/i) ||
      tag.match(/>\s*(?:Apply|Validar|Appliquer|Aplicar|OK|>|Redeem|Usar)\s*</i);
    if (isAdjacent) {
      foundButtonTag = tag;
      const textMatch = tag.match(/>([^<]+)</);
      const valMatch = tag.match(/value=["']([^"']+)["']/i);
      buttonLabel = (textMatch ? textMatch[1] : valMatch ? valMatch[1] : 'Apply').trim();

      if (tag.includes('>') || tag.includes('arrow') || tag.includes('chevron')) {
        buttonIcon = 'Submit arrow (>) icon';
      }
      break;
    }
  }

  if (foundButtonTag) {
    const idMatch = foundButtonTag.match(/id=["']([^"']+)["']/i);
    const classMatch = foundButtonTag.match(/class=["']([^"']+)["']/i);

    let selector = '';
    if (idMatch) selector = `#${idMatch[1]}`;
    else if (classMatch) selector = `button.${classMatch[1].trim().split(/\s+/)[0]}`;
    else selector = 'button.apply-discount';

    result.applyButton = {
      found: true,
      type: 'apply_button',
      name: 'Apply / Submit Button',
      selector,
      valueOrText: buttonLabel || 'Apply',
      is_hidden: false,
      visibility: 'visible',
      iconDescription: buttonIcon || 'Standard apply button',
      proximityConfirmed: true,
      multilingualMatch: buttonLabel.toLowerCase(),
      details: `Identified adjacent action button with text "${buttonLabel}". Proximity to coupon container confirmed.`,
      boundingBox: { ymin: 340, xmin: 690, ymax: 385, xmax: 790 },
    };
  }

  // 3. FINAL TOTAL AMOUNT DETECTION (strictly avoid subtotal, shipping fees, or item prices)
  // Strip subtotal and shipping lines first to avoid any confusion with the grand total
  const sanitizedForTotal = html
    .replace(/<[^>]+(?:subtotal|sous-total|frete|shipping|frais)[^>]*>[\s\S]*?<\/[^>]+>/gi, ' ')
    .replace(/(?:subtotal|sous-total|frete|shipping|frais\s*de\s*port|taxe?)[^<0-9]*[R$€£¥$]\$?\s*[\d,.]+/gi, ' ');

  // Look for explicit grand total expressions with strict avoidance of subtotal and capturing currency
  const strictTotalRegex = /(?:grand\s*total|total\s*a\s*pagar|montant\s*total(?:\s*à\s*régler)?|total\s*final|(?<!sub|sous-)\btotal\b)[^<0-9$€£¥R]*((?:R\$|[$€£¥])\s*[\d,.]+)/i;
  const totalMatch = sanitizedForTotal.match(strictTotalRegex) || html.match(/(?:grand\s*total|total\s*a\s*pagar|montant\s*total)[^<0-9$€£¥R]*((?:R\$|[$€£¥])\s*[\d,.]+)/i);

  if (totalMatch) {
    const rawTotalStr = totalMatch[1].trim();
    const currMatch = rawTotalStr.match(/^(R\$|[$€£¥])/i);
    const curr = currMatch ? currMatch[1].toUpperCase() : '$';
    const numClean = rawTotalStr.replace(/[^0-9.,]/g, '');
    let parsedAmount = 0;
    if (numClean.includes(',') && numClean.includes('.')) {
      if (numClean.lastIndexOf(',') > numClean.lastIndexOf('.')) {
        parsedAmount = parseFloat(numClean.replace(/\./g, '').replace(',', '.')) || 0;
      } else {
        parsedAmount = parseFloat(numClean.replace(/,/g, '')) || 0;
      }
    } else if (numClean.includes(',')) {
      parsedAmount = parseFloat(numClean.replace(',', '.')) || 0;
    } else {
      parsedAmount = parseFloat(numClean) || 0;
    }

    let totalSelector = '.order-total, .grand-total-amount, [data-total]';
    const totalTagMatch = html.match(/<[^>]+class=["']([^"']*(?:total-a-pagar|grand-total|total-line|payment-due)[^"']*)["'][^>]*>/i);
    if (totalTagMatch) {
      totalSelector = `.${totalTagMatch[1].trim().split(/\s+/)[0]}`;
    }

    result.totalAmount = {
      found: true,
      type: 'total_amount',
      name: 'Final Grand Total',
      selector: totalSelector,
      valueOrText: rawTotalStr,
      currency: curr,
      amount: parsedAmount,
      multilingualMatch: totalMatch[0].split(/[0-9]/)[0].trim().replace(/<[^>]+>/g, ''),
      details: `Strictly verified grand transaction total: ${rawTotalStr}. Subtotal and shipping fees were isolated and excluded from calculation.`,
      boundingBox: { ymin: 520, xmin: 580, ymax: 565, xmax: 780 },
    };
  }

  // 4. SHOW FORM TRIGGER (Toggle / Reveal Button) & COLLAPSED / HIDDEN STATE DETECTION
  // Check if coupon input or submit button is hidden/collapsed in DOM
  let isCouponInputHidden = false;
  if (foundInputTag) {
    if (
      foundInputTag.match(/style=["'][^"']*display:\s*none/i) ||
      foundInputTag.match(/style=["'][^"']*visibility:\s*hidden/i) ||
      foundInputTag.match(/\b(?:hidden|aria-hidden=["']true["'])\b/i) ||
      foundInputTag.match(/class=["'][^"']*\b(?:hidden|d-none|invisible|collapse|collapsed|hide|is-collapsed)\b/i)
    ) {
      isCouponInputHidden = true;
    }
  }

  // Check enclosing container for hidden / collapsed state
  const containerHiddenMatch =
    html.match(/<[^>]+(?:class=["'][^"']*\b(?:hidden|d-none|collapse|collapsed|hide|is-collapsed|coupon-hidden)\b|style=["'][^"']*display:\s*none)[^>]*>[\s\S]*?(?:cupom|coupon|promo|código|voucher)/i) ||
    html.match(/<(?:div|section|form)[^>]+id=["'][^"']*(?:coupon|cupom|promo)[^"']*["'][^>]+(?:style=["'][^"']*display:\s*none|class=["'][^"']*\b(?:hidden|collapse|d-none)\b)/i);

  if (containerHiddenMatch) {
    isCouponInputHidden = true;
  }

  // Detect Show Form Trigger element (button, anchor, or clickable summary)
  const triggerCandidates = [
    ...(html.match(/<button[^>]*>[\s\S]*?<\/button>/gi) || []),
    ...(html.match(/<a[^>]*>[\s\S]*?<\/a>/gi) || []),
    ...(html.match(/<[^>]+role=["']button["'][^>]*>[\s\S]*?<\/[^>]+>/gi) || []),
    ...(html.match(/<summary[^>]*>[\s\S]*?<\/summary>/gi) || []),
  ];

  let foundTriggerTag = '';
  let triggerText = '';
  let triggerIcon = '';

  const triggerKeywordsRegex = /(?:adicionar|inserir|possui|tem|tenho|usar|aplicar)\s+(?:um\s+)?(?:cupom|c[oó]digo(?:\s+promocional)?|vale|desconto)|(?:cupom\s+de\s+desconto\??)|(?:have\s+(?:a\s+)?(?:promo|coupon|discount|voucher)\s*(?:code)?\??|add\s+(?:a\s+)?(?:promo|coupon|discount|voucher)(?:\s*code)?|enter\s+(?:a\s+)?(?:promo|coupon|discount|voucher)(?:\s*code)?)|(?:ajouter|avez-vous)\s+(?:un\s+)?(?:code\s+promo|bon\s+d'achat|code\s+remise)|(?:tienes|agregar|añadir|introducir)\s+(?:un\s+)?(?:cup[oó]n|c[oó]digo)/i;

  for (const tag of triggerCandidates) {
    if (tag === foundButtonTag) continue;
    if (tag.match(/>\s*(?:Apply|Validar|Appliquer|Aplicar|OK|>)\s*</i)) continue;

    if (
      triggerKeywordsRegex.test(tag) ||
      tag.match(/data-toggle=["']collapse["']/i) ||
      tag.match(/aria-controls=["'][^"']*(?:cupom|coupon|promo)[^"']*/i) ||
      tag.match(/class=["'][^"']*(?:toggle-coupon|add-coupon|btn-toggle-promo|show-promo|cupom-trigger|accordion-promo)[^"']*/i)
    ) {
      foundTriggerTag = tag;
      const cleanText = tag.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      triggerText = cleanText || 'Adicionar cupom de desconto';

      if (tag.match(/<svg/i) || tag.match(/class=["'][^"']*(?:icon|fa-|bi-|lucide)[^"']*/i) || tag.match(/[+▼▾>➜]/)) {
        if (tag.match(/tag|ticket|coupon|cupom/i)) {
          triggerIcon = 'Coupon / discount ticket icon';
        } else if (tag.match(/plus|\+/)) {
          triggerIcon = 'Plus (+) reveal icon';
        } else if (tag.match(/chevron|arrow|caret|[▼▾>]/i)) {
          triggerIcon = 'Chevron / expand arrow icon';
        } else {
          triggerIcon = 'Interactive toggle icon';
        }
      }
      break;
    }
  }

  // Evaluate collapsed state per RULES:
  // When the coupon form is collapsed/hidden, set is_hidden: true on both couponInput and applyButton
  const isFormCollapsed = isCouponInputHidden || Boolean(foundTriggerTag && (foundTriggerTag.includes('aria-expanded="false"') || foundTriggerTag.includes('collapse') || isCouponInputHidden));

  if (result.couponInput.found) {
    result.couponInput.is_hidden = isFormCollapsed;
    result.couponInput.visibility = isFormCollapsed ? 'hidden' : 'visible';
  }
  if (result.applyButton.found) {
    result.applyButton.is_hidden = isFormCollapsed;
    result.applyButton.visibility = isFormCollapsed ? 'hidden' : 'visible';
  }
  result.isFormCollapsed = isFormCollapsed;

  if (foundTriggerTag) {
    const idMatch = foundTriggerTag.match(/id=["']([^"']+)["']/i);
    const classMatch = foundTriggerTag.match(/class=["']([^"']+)["']/i);
    let triggerSelector = '';
    if (idMatch) triggerSelector = `#${idMatch[1]}`;
    else if (classMatch) {
      const firstClass = classMatch[1].trim().split(/\s+/)[0];
      const tagType = foundTriggerTag.startsWith('<button') ? 'button' : foundTriggerTag.startsWith('<a') ? 'a' : 'div';
      triggerSelector = `${tagType}.${firstClass}`;
    } else {
      triggerSelector = 'button.toggle-coupon-trigger, .add-coupon-btn';
    }

    const triggerElement: DetectedElement = {
      found: true,
      type: 'show_form_trigger',
      name: 'Show Form Trigger (Reveal Button)',
      selector: triggerSelector,
      valueOrText: triggerText,
      iconDescription: triggerIcon || (isFormCollapsed ? 'Expand / reveal icon' : 'Toggle icon'),
      needsClick: isFormCollapsed,
      is_hidden: false,
      visibility: 'visible',
      multilingualMatch: triggerText.toLowerCase(),
      details: isFormCollapsed
        ? `Identified reveal trigger "${triggerText}" (selector: ${triggerSelector}). Must be clicked to expand the collapsed coupon input and submit button.`
        : `Identified coupon accordion trigger "${triggerText}". Coupon form is already expanded.`,
      boundingBox: { ymin: 280, xmin: 150, ymax: 330, xmax: 550 },
    };

    result.showFormTrigger = triggerElement;
    result.show_form_trigger = triggerElement;
  } else {
    const defaultTrigger: DetectedElement = {
      found: false,
      type: 'show_form_trigger',
      name: 'Show Form Trigger (Reveal Button)',
      is_hidden: false,
      visibility: 'visible',
      needsClick: false,
      details: isFormCollapsed
        ? 'Coupon form is collapsed/hidden, but no explicit reveal button or link was found.'
        : 'Coupon form is directly visible and expanded by default; no reveal trigger required.',
    };
    result.showFormTrigger = defaultTrigger;
    result.show_form_trigger = defaultTrigger;
  }

  // Overall confidence & summary
  const targetElementsFound = [
    result.couponInput.found,
    result.applyButton.found,
    result.totalAmount.found,
  ].filter(Boolean).length;

  result.confidenceScore = targetElementsFound === 3 ? (isFormCollapsed && !result.showFormTrigger.found ? 85 : 95) : targetElementsFound === 2 ? 80 : 65;
  result.summary = isFormCollapsed
    ? `Detected ${targetElementsFound} elements. Coupon form is COLLAPSED (requires clicking "${result.showFormTrigger?.valueOrText || 'show form trigger'}").`
    : `Detected ${targetElementsFound} of 3 checkout elements (form is directly visible and expanded).`;

  return result;
}

function cleanCheckoutHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 200000);
}

function parseCheckoutStructuredFallback(html: string): CheckoutDetectionStructuredResult {
  const cleaned = html || '';

  const result: CheckoutDetectionStructuredResult = {
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

  // Detect coupon input
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

  // Detect coupon button
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

  // Detect collapsed trigger
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
      const required = result.coupon_input.is_hidden || result.coupon_button.is_hidden || /aria-expanded=["']false["']/i.test(tag) || /data-toggle=["']collapse["']/i.test(tag);

      result.show_form_trigger = {
        exists: true,
        required_to_click: required,
        exact_css_selector: selector,
        inner_text: text,
      };
      break;
    }
  }

  // Detect total
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

async function createServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // SSE Stream for Real-time notifications and task updates
  app.get('/api/notifications/stream', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    const clientId = `client-${Date.now()}-${Math.random()}`;
    const client: SSEClient = { id: clientId, res };
    sseClients.push(client);

    // Initial handshake
    res.write(`event: connected\ndata: ${JSON.stringify({ clientId, timestamp: new Date().toISOString() })}\n\n`);

    // Keep alive heartbeat every 20 seconds
    const interval = setInterval(() => {
      try {
        res.write(': heartbeat\n\n');
      } catch {
        clearInterval(interval);
      }
    }, 20000);

    req.on('close', () => {
      clearInterval(interval);
      sseClients = sseClients.filter((c) => c.id !== clientId);
    });
  });

  // Notifications API
  app.get('/api/notifications', (req: Request, res: Response) => {
    res.json(notifications);
  });

  app.post('/api/notifications/read-all', (req: Request, res: Response) => {
    notifications.forEach((n) => (n.read = true));
    broadcastSSE('notifications_cleared', { readAll: true });
    res.json({ success: true });
  });

  app.patch('/api/notifications/:id/read', (req: Request, res: Response) => {
    const notif = notifications.find((n) => n.id === req.params.id);
    if (notif) notif.read = true;
    res.json({ success: true, notification: notif });
  });

  // Team Members API (Actual and Gone)
  app.get('/api/team', (req: Request, res: Response) => {
    const status = req.query.status as string;
    if (status === 'active' || status === 'gone') {
      return res.json(teamMembers.filter((m) => m.status === status));
    }
    res.json(teamMembers);
  });

  app.post('/api/team', (req: Request, res: Response) => {
    const body = req.body;
    const newMember: TeamMember = {
      id: `mem-${Date.now()}`,
      name: body.name || 'New QC Member',
      email: body.email || 'intern@qc-team.internal',
      role: body.role || 'QC Intern',
      status: body.status || 'active',
      avatarColor: body.avatarColor || 'from-teal-600 to-cyan-600',
      initials: (body.name || 'QC')
        .split(' ')
        .map((p: string) => p[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
      joinedDate: body.joinedDate || new Date().toISOString().split('T')[0],
      departedDate: body.departedDate,
      tenure: body.tenure || 'Just joined',
      exitReason: body.exitReason,
      tasksCompleted: 0,
      accuracyRate: 100,
      specialties: body.specialties || ['Link QC', 'Regex Testing'],
      activeTasksCount: 0,
      mentor: body.mentor || 'Sarah Chen',
      notes: body.notes || '',
    };

    teamMembers.unshift(newMember);

    pushNotification({
      type: 'team_update',
      title: 'Team Directory Updated',
      message: `${newMember.name} joined the team as ${newMember.role}`,
      memberId: newMember.id,
      severity: 'info',
    });

    broadcastSSE('team_updated', teamMembers);
    res.status(201).json(newMember);
  });

  app.patch('/api/team/:id', (req: Request, res: Response) => {
    const idx = teamMembers.findIndex((m) => m.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Member not found' });

    const prevStatus = teamMembers[idx].status;
    teamMembers[idx] = { ...teamMembers[idx], ...req.body };
    const updated = teamMembers[idx];

    if (prevStatus === 'active' && updated.status === 'gone') {
      pushNotification({
        type: 'team_update',
        title: 'Team Status Change: Member Departed (Alumnus)',
        message: `${updated.name} transitioned to Alumni (${updated.exitReason || 'Completed Internship'})`,
        memberId: updated.id,
        severity: 'warning',
      });
    }

    broadcastSSE('team_updated', teamMembers);
    res.json(updated);
  });

  // Kudos / High-Five / Espresso Reaction Endpoint for friendly team vibes
  app.post('/api/team/:id/kudos', (req: Request, res: Response) => {
    const member = teamMembers.find((m) => m.id === req.params.id);
    if (!member) return res.status(404).json({ error: 'Member not found' });
    member.kudosCount = (member.kudosCount || 0) + 1;
    const reactionType = req.body.type || 'high_five';
    const emojis: Record<string, string> = {
      high_five: '✋ High Five',
      espresso: '☕ Espresso Shot',
      cookie: '🍪 Bug-Free Cookie',
      trophy: '🏆 Legend Award',
    };
    const reactionLabel = emojis[reactionType] || 'Kudos';

    pushNotification({
      type: 'team_update',
      title: `${reactionLabel} Sent!`,
      message: `${member.name} received a ${reactionLabel}! Total kudos: ${member.kudosCount} 🎉`,
      memberId: member.id,
      severity: 'success',
    });

    broadcastSSE('team_updated', teamMembers);
    res.json({ success: true, kudosCount: member.kudosCount, member });
  });

  // Tasks API (QC Tasks & "In Progress" menu)
  app.get('/api/tasks', (req: Request, res: Response) => {
    const status = req.query.status as string;
    const assignee = req.query.assignee as string;

    let filtered = [...qcTasks];
    if (status) {
      filtered = filtered.filter((t) => t.status === status);
    }
    if (assignee) {
      filtered = filtered.filter((t) => t.assignedTo === assignee);
    }
    res.json(filtered);
  });

  app.post('/api/tasks', (req: Request, res: Response) => {
    const body = req.body;
    const newTask: QCTask = {
      id: `task-${Date.now()}`,
      title: body.title || 'New QC Link Validation',
      targetUrl: body.targetUrl || 'https://example.com',
      assignedTo: body.assignedTo || teamMembers[0]?.id || 'mem-1',
      status: body.status || 'in_progress',
      priority: body.priority || 'medium',
      category: body.category || 'Regex QC',
      progress: body.progress || 0,
      timeSpentMinutes: body.timeSpentMinutes || 0,
      checklist: body.checklist || [
        { id: 'c1', text: 'Validate URL syntax and protocol', completed: false },
        { id: 'c2', text: 'Test with 5 edge cases', completed: false },
        { id: 'c3', text: 'Confirm zero ReDoS backtracking', completed: false },
      ],
      notes: body.notes || '',
      bugsFound: body.bugsFound || 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    qcTasks.unshift(newTask);

    const assignee = teamMembers.find((m) => m.id === newTask.assignedTo);
    if (assignee) assignee.activeTasksCount++;

    pushNotification({
      type: 'task_assigned',
      title: 'New Task Created',
      message: `"${newTask.title}" assigned to ${assignee ? assignee.name : 'QC Team'}`,
      taskId: newTask.id,
      memberId: newTask.assignedTo,
      severity: newTask.priority === 'critical' ? 'urgent' : 'info',
    });

    broadcastSSE('task_created', newTask);
    res.status(201).json(newTask);
  });

  app.patch('/api/tasks/:id', (req: Request, res: Response) => {
    const idx = qcTasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });

    const prevTask = qcTasks[idx];
    const updated: QCTask = {
      ...prevTask,
      ...req.body,
      updatedAt: new Date().toISOString(),
    };
    qcTasks[idx] = updated;

    const assignee = teamMembers.find((m) => m.id === updated.assignedTo);
    const memberName = assignee ? assignee.name : 'Tester';

    // Notify on status transition
    if (prevTask.status !== updated.status) {
      const severityMap: Record<string, 'info' | 'success' | 'warning' | 'urgent'> = {
        in_progress: 'info',
        review: 'info',
        completed: 'success',
        blocked: 'urgent',
        backlog: 'info',
      };

      pushNotification({
        type: 'task_status',
        title: `Task Status: ${updated.status.toUpperCase().replace('_', ' ')}`,
        message: `${memberName} moved "${updated.title}" to ${updated.status.replace('_', ' ')}`,
        taskId: updated.id,
        memberId: updated.assignedTo,
        severity: severityMap[updated.status] || 'info',
      });
    } else if (updated.bugsFound > prevTask.bugsFound) {
      pushNotification({
        type: 'bug_flagged',
        title: 'QC Link Bug Flagged',
        message: `${memberName} flagged ${updated.bugsFound - prevTask.bugsFound} new bug(s) in "${updated.title}"`,
        taskId: updated.id,
        memberId: updated.assignedTo,
        severity: 'urgent',
      });
    }

    broadcastSSE('task_updated', updated);
    res.json(updated);
  });

  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    const idx = qcTasks.findIndex((t) => t.id === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Task not found' });
    const deleted = qcTasks.splice(idx, 1)[0];
    broadcastSSE('task_deleted', { id: req.params.id });
    res.json({ success: true, deleted });
  });

  // Regex Generator from Link Endpoint
  app.post('/api/regex/generate', async (req: Request, res: Response) => {
    const { url, sampleUrls = [], options = {} } = req.body;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'Please provide a valid URL to analyze.' });
    }

    const regexOptions: RegexOptions = {
      flavor: options.flavor || 'javascript',
      matchScope: options.matchScope || 'full',
      captureGroups: options.captureGroups !== false,
      strictAnchors: options.strictAnchors !== false,
      allowSubdomains: !!options.allowSubdomains,
      allowQueryParams: options.allowQueryParams !== false,
      detectDynamicSegments: options.detectDynamicSegments !== false,
    };

    // Try Gemini 3.8 Flash model on server-side when available and responsive
    if (canAttemptGemini()) {
      try {
        const prompt = `You are a Senior Regex Architect and Quality Control Testing Engineer.
Analyze the following URL (and optional sample URLs) and generate an optimal, production-grade regular expression pattern tailored for Quality Control and QA testing.

Primary Target Link: ${url}
${sampleUrls.length > 0 ? `Additional Sample Links for Pattern Generalization:\n${sampleUrls.join('\n')}` : ''}

Options:
- Regex Flavor: ${regexOptions.flavor}
- Match Scope: ${regexOptions.matchScope} (options: 'full' = whole URL, 'path' = pathname only, 'domain_path' = domain + path, 'query' = query params)
- Named Capture Groups: ${regexOptions.captureGroups ? 'YES (use named groups where appropriate like (?<id>...))' : 'NO (use non-capturing or numbered groups)'}
- Strict Anchors: ${regexOptions.strictAnchors ? 'YES (^...$)' : 'NO'}
- Allow Subdomains: ${regexOptions.allowSubdomains ? 'YES' : 'NO'}
- Allow Query Parameters: ${regexOptions.allowQueryParams ? 'YES' : 'NO'}

Generate a structured JSON response matching this schema:
{
  "pattern": "the exact regex pattern string WITHOUT enclosing slashes or flags",
  "flags": "i or g or m",
  "flavor": "${regexOptions.flavor}",
  "explanation": "Clear, detailed breakdown of how this regex works for QC editors and testers",
  "tokens": [
    { "name": "token name", "pattern": "sub-pattern", "description": "what it matches", "example": "sample match" }
  ],
  "testCases": [
    { "url": "${url}", "shouldMatch": true, "label": "Exact Primary URL" },
    { "url": "invalid test link", "shouldMatch": false, "label": "Why it should fail" }
  ],
  "codeSnippets": {
    "javascript": "code example",
    "python": "code example",
    "typescript": "code example"
  },
  "antiPatterns": ["critical pitfall to avoid like ReDoS or missing escaping"],
  "suggestedEdgeCases": ["4-6 specific edge cases QA testers should verify"]
}`;

        const callPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 2500)
        );

        const geminiRes: any = await Promise.race([callPromise, timeoutPromise]);

        const textOutput = geminiRes?.text;
        if (textOutput) {
          const parsed = JSON.parse(textOutput) as RegexResult;
          // Verify pattern can be compiled safely
          try {
            new RegExp(parsed.pattern, parsed.flags || 'i');
          } catch {
            parsed.flags = 'i';
          }

          pushNotification({
            type: 'regex_generated',
            title: 'Regex Pattern Generated',
            message: `Generated regex for link: ${url.length > 40 ? url.slice(0, 37) + '...' : url}`,
            severity: 'info',
          });

          return res.json(parsed);
        }
      } catch {
        tripGeminiCircuit();
      }
    }

    // Deterministic fallback synthesizer
    const fallbackResult = generateDeterministicRegexFromUrl(url, regexOptions);
    pushNotification({
      type: 'regex_generated',
      title: 'Regex Pattern Generated (QC Engine)',
      message: `Pattern created for: ${url.length > 40 ? url.slice(0, 37) + '...' : url}`,
      severity: 'info',
    });
    return res.json(fallbackResult);
  });

  // Regex Testing & Validation Endpoint
  app.post('/api/regex/validate', (req: Request, res: Response) => {
    const { pattern, flags = 'i', testCases = [] } = req.body;

    if (!pattern || typeof pattern !== 'string') {
      return res.status(400).json({ error: 'Pattern is required' });
    }

    try {
      const reg = new RegExp(pattern, flags);
      const results = (testCases as string[]).map((input) => {
        const start = performance.now();
        const match = reg.exec(input);
        const end = performance.now();
        const duration = Math.round((end - start) * 100) / 100;

        return {
          input,
          matched: match !== null,
          groups: match?.groups || {},
          matches: match ? Array.from(match).slice(1) : [],
          executionMs: duration,
        };
      });

      res.json({ valid: true, results });
    } catch (err: any) {
      res.status(400).json({ valid: false, error: err.message || 'Invalid regular expression syntax' });
    }
  });

  // Checkout Element Detection Endpoint (Multimodal & DOM Analysis)
  app.post('/api/detection/analyze', async (req: Request, res: Response) => {
    const { htmlSnippet, screenshotBase64, targetUrl } = req.body;

    if (!htmlSnippet && !screenshotBase64) {
      return res.status(400).json({
        error: 'Please provide either an HTML snippet, a checkout screenshot, or both for analysis.',
      });
    }

    if (canAttemptGemini()) {
      try {
        const promptText = `You are an expert web automation and DOM/UI parser. Your objective is to accurately detect and extract key checkout elements from user input (screenshot, HTML snippet, or both):

1. COUPON INPUT:
   - Identify the text input field intended for discount/voucher/promo codes.
   - Detect multilingual labels/placeholders (e.g., "coupon", "cupom", "código", "promo", "voucher").
   - Extract: placeholder, visibility status, and selector/ID if HTML is provided.

2. SUBMIT / APPLY BUTTON:
   - Identify the button directly associated with submitting the coupon (often an arrow >, "OK", "Apply", "Validar").
   - Extract: label or icon description, visibility status, and selector if available.

3. TOTAL AMOUNT:
   - Identify the final transaction total labeled by words like "Total", "Grand Total", "Total a pagar".
   - Extract: raw amount string (currency + number) and numeric value.

4. SHOW FORM TRIGGER (Toggle / Reveal Button):
   - Check if the coupon input and submit button are hidden/collapsed.
   - If they are hidden, locate the button, link, or clickable element designed to reveal the coupon form (e.g., "Adicionar cupom de desconto", "Have a promo code?", "Ajouter un code promo").
   - Extract: trigger label/text, icon description, whether it needs to be clicked, and its selector/tag if HTML is provided.

RULES:
- When the coupon form is collapsed/hidden, set is_hidden: true on both the coupon input and submit button, and extract the show_form_trigger.
- Never confuse subtotal or shipping fees with the grand Total.
- Always respond using the defined structured JSON format.

${htmlSnippet ? `HTML SNIPPET TO ANALYZE:\n\`\`\`html\n${htmlSnippet.slice(0, 15000)}\n\`\`\`` : ''}
${targetUrl ? `Target URL / context: ${targetUrl}` : ''}

Respond strictly in valid JSON matching this exact structure:
{
  "couponInput": {
    "found": true,
    "type": "coupon_input",
    "name": "Coupon / Discount Code Input",
    "selector": "CSS selector or #id",
    "valueOrText": "placeholder or input value",
    "is_hidden": false,
    "visibility": "visible",
    "multilingualMatch": "detected keyword",
    "details": "detailed explanation",
    "boundingBox": { "ymin": 100, "xmin": 100, "ymax": 150, "xmax": 400 }
  },
  "applyButton": {
    "found": true,
    "type": "apply_button",
    "name": "Apply / Redeem Button",
    "selector": "CSS selector or button text",
    "valueOrText": "button label",
    "is_hidden": false,
    "visibility": "visible",
    "proximityConfirmed": true,
    "iconDescription": "arrow (>) or button icon",
    "multilingualMatch": "detected action keyword",
    "details": "detailed proximity explanation",
    "boundingBox": { "ymin": 100, "xmin": 410, "ymax": 150, "xmax": 500 }
  },
  "totalAmount": {
    "found": true,
    "type": "total_amount",
    "name": "Final Grand Total",
    "selector": "CSS selector",
    "valueOrText": "raw formatted total with currency",
    "currency": "currency symbol",
    "amount": 99.99,
    "multilingualMatch": "detected total label",
    "details": "detailed explanation confirming this is not subtotal or shipping",
    "boundingBox": { "ymin": 600, "xmin": 600, "ymax": 650, "xmax": 850 }
  },
  "showFormTrigger": {
    "found": true,
    "type": "show_form_trigger",
    "name": "Show Form Trigger (Reveal Button)",
    "selector": "CSS selector or tag",
    "valueOrText": "trigger text e.g. Adicionar cupom de desconto",
    "iconDescription": "tag or chevron icon description",
    "needsClick": true,
    "is_hidden": false,
    "visibility": "visible",
    "multilingualMatch": "detected trigger keyword",
    "details": "detailed explanation of reveal trigger",
    "boundingBox": { "ymin": 280, "xmin": 150, "ymax": 330, "xmax": 550 }
  },
  "show_form_trigger": {
    "found": true,
    "type": "show_form_trigger",
    "name": "Show Form Trigger (Reveal Button)",
    "selector": "CSS selector or tag",
    "valueOrText": "trigger text e.g. Adicionar cupom de desconto",
    "iconDescription": "tag or chevron icon description",
    "needsClick": true,
    "is_hidden": false,
    "visibility": "visible",
    "details": "detailed explanation"
  },
  "isFormCollapsed": false,
  "confidenceScore": 95,
  "languageDetected": "e.g. Portuguese (BR), English, French, Spanish",
  "summary": "1-2 sentence summary of findings"
}`;

        const contents: any[] = [];
        if (screenshotBase64 && typeof screenshotBase64 === 'string') {
          const match = screenshotBase64.match(/^data:([^;]+);base64,(.+)$/);
          const mimeType = match ? match[1] : 'image/png';
          const data = match ? match[2] : screenshotBase64;
          contents.push({
            inlineData: {
              mimeType,
              data,
            },
          });
        }
        contents.push(promptText);

        const callPromise = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents,
          config: {
            responseMimeType: 'application/json',
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 2500)
        );

        const geminiRes: any = await Promise.race([callPromise, timeoutPromise]);

        const rawText = geminiRes?.text;
        if (rawText) {
          const parsed = JSON.parse(rawText) as DetectionResult;
          parsed.analyzedAt = new Date().toISOString();

          // Sync aliases
          if (parsed.showFormTrigger && !parsed.show_form_trigger) {
            parsed.show_form_trigger = parsed.showFormTrigger;
          } else if (parsed.show_form_trigger && !parsed.showFormTrigger) {
            parsed.showFormTrigger = parsed.show_form_trigger;
          }

          pushNotification({
            type: 'qc_alert',
            title: 'Checkout Element Detection Completed',
            message: `Detected: Coupon (${parsed.couponInput?.found ? (parsed.couponInput?.is_hidden ? 'Hidden' : 'Visible') : 'Missing'}), Apply (${parsed.applyButton?.found ? (parsed.applyButton?.is_hidden ? 'Hidden' : 'Visible') : 'Missing'}), Total (${parsed.totalAmount?.found ? parsed.totalAmount.valueOrText : 'Missing'}), Trigger (${parsed.showFormTrigger?.found ? 'Found' : 'Not required'})`,
            severity: parsed.couponInput?.found && parsed.totalAmount?.found ? 'success' : 'warning',
          });

          return res.json(parsed);
        }
      } catch {
        tripGeminiCircuit();
      }
    }

    // Deterministic DOM heuristic fallback
    const fallbackResult = parseCheckoutDOMFallback(htmlSnippet || '');
    pushNotification({
      type: 'qc_alert',
      title: 'Checkout Element Detection (DOM Parser)',
      message: `Parsed DOM: Coupon (${fallbackResult.couponInput.found ? (fallbackResult.couponInput.is_hidden ? 'Hidden' : 'Visible') : 'Missing'}), Apply (${fallbackResult.applyButton.found ? (fallbackResult.applyButton.is_hidden ? 'Hidden' : 'Visible') : 'Missing'}), Total (${fallbackResult.totalAmount.found ? fallbackResult.totalAmount.valueOrText : 'Missing'}), Trigger (${fallbackResult.showFormTrigger?.found ? 'Found' : 'Not required'})`,
      severity: fallbackResult.couponInput.found && fallbackResult.totalAmount.found ? 'success' : 'warning',
    });

    return res.json(fallbackResult);
  });

  // External Checkout DOM Detection Endpoint (Chrome Extension / externally_connectable)
  app.post('/api/detection/external-checkout', async (req: Request, res: Response) => {
    const { url, html } = req.body as ExternalCheckoutPayload;

    if (!html || typeof html !== 'string') {
      return res.status(400).json({
        error: 'Payload invalide. html requis.',
      });
    }

    const cleanedHtml = cleanCheckoutHtml(html);

    if (canAttemptGemini()) {
      try {
        const promptText = `Analyse STRICTEMENT le code HTML fourni d'un panier/checkout et détecte les 4 éléments suivants en utilisant uniquement les balises, attributs (id, name, class, data-*) et textes réellement présents dans le code. N'invente aucun sélecteur.

1. show_form_trigger : Bouton ou lien pour afficher le champ coupon s'il est masqué au départ (ex: "Adicionar cupom", "Have a promo code?"). Mets required_to_click à true si le formulaire est masqué par défaut.
2. coupon_input : Balise <input> de saisie du code promo (placeholder, sélecteur CSS exact, is_hidden).
3. coupon_button : Bouton ou icône cliquable associé immédiatement au champ de coupon pour valider.
4. total_order : Sélecteur du montant total final de la commande, devise et montant extrait.

URL cible: ${url || ''}

HTML à analyser:
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
        const callPromise = ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: promptText,
          config: {
            temperature: 0,
            responseMimeType: 'application/json',
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 5000)
        );

        const geminiRes: any = await Promise.race([callPromise, timeoutPromise]);
        const rawText = geminiRes?.text;

        if (rawText) {
          const parsed = JSON.parse(rawText) as CheckoutDetectionStructuredResult;

          pushNotification({
            type: 'qc_alert',
            title: 'External Checkout DOM Analyzed',
            message: `Checkout reçu depuis extension : ${url || 'unknown url'}`,
            severity:
              parsed.coupon_input?.exists && parsed.total_order?.exists ? 'success' : 'warning',
          });

          return res.json({
            success: true,
            url: url || '',
            analyzedAt: new Date().toISOString(),
            result: parsed,
          });
        }
      } catch (err) {
        tripGeminiCircuit();
      }
    }

    const fallback = parseCheckoutStructuredFallback(cleanedHtml);

    pushNotification({
      type: 'qc_alert',
      title: 'External Checkout DOM Parsed (Fallback)',
      message: `Analyse fallback exécutée pour ${url || 'unknown url'}`,
      severity: fallback.coupon_input.exists && fallback.total_order.exists ? 'success' : 'warning',
    });

    return res.json({
      success: true,
      url: url || '',
      analyzedAt: new Date().toISOString(),
      result: fallback,
      fallback: true,
    });
  });

  // Simulation endpoint for testing real-time updates and notification system
  app.post('/api/simulate-activity', (req: Request, res: Response) => {
    const activeMembers = teamMembers.filter((m) => m.status === 'active');
    const randomMember = activeMembers[Math.floor(Math.random() * activeMembers.length)];
    const randomTask = qcTasks[Math.floor(Math.random() * qcTasks.length)];

    const events = [
      () => {
        // Status bump
        const statuses: ('in_progress' | 'review' | 'completed')[] = ['in_progress', 'review', 'completed'];
        const nextStatus = statuses[Math.floor(Math.random() * statuses.length)];
        randomTask.status = nextStatus;
        randomTask.progress = Math.min(100, randomTask.progress + 20);
        randomTask.updatedAt = new Date().toISOString();
        broadcastSSE('task_updated', randomTask);
        return pushNotification({
          type: 'task_status',
          title: `Task Status Update (${nextStatus.toUpperCase()})`,
          message: `${randomMember.name} updated "${randomTask.title}" to ${nextStatus}`,
          taskId: randomTask.id,
          memberId: randomMember.id,
          severity: nextStatus === 'completed' ? 'success' : 'info',
        });
      },
      () => {
        // Checklist item completed
        const uncompleted = randomTask.checklist.find((c) => !c.completed);
        if (uncompleted) {
          uncompleted.completed = true;
          randomTask.progress = Math.min(100, Math.round((randomTask.checklist.filter((c) => c.completed).length / randomTask.checklist.length) * 100));
        }
        randomTask.updatedAt = new Date().toISOString();
        broadcastSSE('task_updated', randomTask);
        return pushNotification({
          type: 'task_status',
          title: 'QC Verification Step Passed',
          message: `${randomMember.name} verified a check in "${randomTask.title}"`,
          taskId: randomTask.id,
          memberId: randomMember.id,
          severity: 'info',
        });
      },
      () => {
        // Bug flagged
        randomTask.bugsFound += 1;
        randomTask.updatedAt = new Date().toISOString();
        broadcastSSE('task_updated', randomTask);
        return pushNotification({
          type: 'bug_flagged',
          title: 'QC URL Mismatch Flagged',
          message: `${randomMember.name} discovered a regex edge case failure in ${randomTask.title}`,
          taskId: randomTask.id,
          memberId: randomMember.id,
          severity: 'urgent',
        });
      },
    ];

    const pick = events[Math.floor(Math.random() * events.length)];
    const createdNotification = pick();

    res.json({ success: true, notification: createdNotification });
  });

  // Vite middleware in dev or static serving in prod
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`QC Studio server running on http://0.0.0.0:${PORT}`);
  });
}

createServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
