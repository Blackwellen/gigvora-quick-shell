/**
 * Per-domain AdapterMap declarations.
 *
 * Defaults are free/OSS. Paid SDKs are opt-in only via tenant BYOK config.
 * Domains query this map at runtime: getDomainAdapters('D29').calendar
 */
export type AdapterCategory =
  | 'calendar' | 'email' | 'sms' | 'voice' | 'storage'
  | 'ats' | 'crm' | 'ai' | 'analytics' | 'payments';

export interface DomainAdapterEntry {
  category: AdapterCategory;
  default: string;          // free/OSS default id
  optIn: string[];          // BYOK provider ids
  required: boolean;        // domain hard-requires this category
}

export type DomainId =
  | 'D1' | 'D2' | 'D3' | 'D4' | 'D5' | 'D6'
  | 'D7' | 'D8' | 'D9' | 'D10' | 'D11' | 'D12'
  | 'D13' | 'D14' | 'D15' | 'D16' | 'D17' | 'D18'
  | 'D19' | 'D20' | 'D21' | 'D22' | 'D23' | 'D24'
  | 'D25' | 'D26' | 'D27' | 'D28' | 'D29' | 'D30';

export const DOMAIN_ADAPTER_MAP: Record<DomainId, DomainAdapterEntry[]> = {
  // ---- Group 1 (D1–D6): Identity & Trust ----
  D1: [
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid', 'ses'],          required: true },
    { category: 'sms',       default: 'none',             optIn: ['twilio', 'vonage'],                   required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],
  D2: [
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'sms',       default: 'none',             optIn: ['twilio', 'vonage'],                   required: false },
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2'],                           required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D3: [
    { category: 'payments',  default: 'gigvora-credits',  optIn: ['stripe', 'paddle'],                   required: true },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],
  D4: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2'],                           required: false },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: false },
  ],
  D5: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2', 'gcs'],                    required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D6: [
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: true },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],

  // ---- Group 2 (D7–D12): Social, Communities & Marketing ----
  D7: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2', 'gcs'],                    required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],
  D8: [
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D9: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2'],                           required: true },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D10: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2', 'gcs'],                    required: true },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'crm',       default: 'none',             optIn: ['hubspot', 'salesforce'],              required: false },
    { category: 'ats',       default: 'none',             optIn: ['greenhouse', 'ashby'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],
  D11: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2'],                           required: true },
    { category: 'payments',  default: 'gigvora-credits',  optIn: ['stripe', 'paddle'],                   required: true },
    { category: 'crm',       default: 'none',             optIn: ['hubspot', 'salesforce'],              required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D12: [
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid', 'ses'],          required: true },
    { category: 'sms',       default: 'none',             optIn: ['twilio', 'vonage'],                   required: false },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: true },
    { category: 'crm',       default: 'none',             optIn: ['hubspot', 'salesforce'],              required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment', 'ga4'],          required: true },
  ],

  // ---- Group 3 (D13–D18): Conversations, Calls, Calendar, Events, Webinars ----
  D13: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2', 'gcs'],                    required: true },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: false },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D14: [
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid', 'ses'],          required: true },
    { category: 'sms',       default: 'none',             optIn: ['twilio', 'vonage'],                   required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],
  D15: [
    { category: 'voice',     default: 'jitsi',            optIn: ['daily', 'zoom', 'twilio'],            required: true },
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2'],                           required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D16: [
    { category: 'calendar',  default: 'ics-native',       optIn: ['google-calendar', 'ms-graph', 'zoom'],required: true },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: false },
  ],
  D17: [
    { category: 'calendar',  default: 'ics-native',       optIn: ['google-calendar', 'ms-graph'],        required: true },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2'],                           required: true },
    { category: 'voice',     default: 'jitsi',            optIn: ['daily', 'zoom'],                      required: false },
    { category: 'payments',  default: 'gigvora-credits',  optIn: ['stripe', 'paddle'],                   required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],
  D18: [
    { category: 'voice',     default: 'jitsi',            optIn: ['daily', 'zoom', 'mux'],               required: true },
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2', 'gcs'],                    required: true },
    { category: 'payments',  default: 'gigvora-credits',  optIn: ['stripe', 'paddle'],                   required: true },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],

  // ---- Group 4 (D19–D24): Booking, Media, Podcasts, Search, Overlays, Jobs Browse ----
  D19: [
    { category: 'calendar',  default: 'ics-native',       optIn: ['google-calendar', 'ms-graph', 'zoom'],required: true },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid', 'ses'],          required: true },
    { category: 'sms',       default: 'none',             optIn: ['twilio', 'vonage'],                   required: false },
    { category: 'voice',     default: 'jitsi',            optIn: ['daily', 'zoom'],                      required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D20: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2', 'gcs'],                    required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D21: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2', 'gcs'],                    required: true },
    { category: 'voice',     default: 'jitsi',            optIn: ['daily', 'zoom'],                      required: false },
    { category: 'payments',  default: 'gigvora-credits',  optIn: ['stripe', 'paddle'],                   required: true },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],
  D22: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2', 'opensearch'],             required: true },
    { category: 'ai',        default: 'lovable-ai',       optIn: ['openai', 'anthropic'],                required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],
  D23: [
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                            required: true },
  ],
  D24: [
    { category: 'storage',   default: 'local-indexeddb',  optIn: ['s3', 'r2'],                           required: false },
    { category: 'ats',       default: 'none',             optIn: ['greenhouse', 'ashby', 'lever'],       required: false },
    { category: 'email',     default: 'smtp-local',       optIn: ['resend', 'sendgrid'],                 required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],                 required: true },
  ],

  // ---- Legacy D25–D30 (renumbered from D24–D29) ----
  D25: [
    { category: 'storage',   default: 'local-indexeddb', optIn: ['s3', 'r2', 'gcs'],            required: true },
    { category: 'payments',  default: 'gigvora-credits', optIn: ['stripe', 'paddle'],           required: true },
    { category: 'ai',        default: 'lovable-ai',      optIn: ['openai', 'anthropic'],        required: false },
  ],
  D26: [
    { category: 'email',     default: 'smtp-local',      optIn: ['resend', 'sendgrid', 'ses'],  required: true },
    { category: 'storage',   default: 'local-indexeddb', optIn: ['s3', 'r2'],                   required: true },
    { category: 'ats',       default: 'none',            optIn: ['hubspot', 'ashby', 'greenhouse'], required: false },
  ],
  D27: [
    { category: 'ats',       default: 'none',            optIn: ['greenhouse', 'ashby', 'lever'], required: false },
    { category: 'crm',       default: 'none',            optIn: ['hubspot', 'salesforce'],      required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog', 'segment'],        required: true },
  ],
  D28: [
    { category: 'email',     default: 'smtp-local',      optIn: ['resend', 'sendgrid'],         required: true },
    { category: 'sms',       default: 'none',            optIn: ['twilio', 'vonage'],           required: false },
    { category: 'crm',       default: 'none',            optIn: ['hubspot', 'salesforce'],      required: false },
    { category: 'ai',        default: 'lovable-ai',      optIn: ['openai', 'anthropic'],        required: true },
  ],
  D29: [
    { category: 'ats',       default: 'none',            optIn: ['greenhouse', 'ashby'],        required: false },
    { category: 'ai',        default: 'lovable-ai',      optIn: ['openai', 'anthropic'],        required: false },
    { category: 'analytics', default: 'analytics-python', optIn: ['posthog'],                   required: true },
  ],
  D30: [
    { category: 'calendar',  default: 'ics-native',      optIn: ['google-calendar', 'ms-graph'], required: true },
    { category: 'voice',     default: 'jitsi',           optIn: ['daily', 'zoom'],              required: true },
    { category: 'email',     default: 'smtp-local',      optIn: ['resend', 'sendgrid'],         required: true },
    { category: 'ai',        default: 'lovable-ai',      optIn: ['openai', 'anthropic'],        required: false },
  ],
};

export function getDomainAdapters(domain: DomainId) {
  const map = DOMAIN_ADAPTER_MAP[domain];
  const out: Partial<Record<AdapterCategory, DomainAdapterEntry>> = {};
  for (const e of map) out[e.category] = e;
  return out;
}
