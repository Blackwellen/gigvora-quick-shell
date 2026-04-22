import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings, Cloud, Key, Database, Brain, Server,
  Plus, ChevronRight, Shield, CheckCircle2, AlertTriangle,
  HardDrive, Cpu, Globe, Webhook, Code2, Link2,
} from 'lucide-react';

const STORAGE_PROVIDERS = [
  { id: 'aws', name: 'Amazon S3', icon: '🟧', status: 'not-connected', desc: 'AWS S3 buckets for file storage' },
  { id: 'r2', name: 'Cloudflare R2', icon: '🟠', status: 'not-connected', desc: 'Edge storage with S3 compatibility' },
  { id: 'gcs', name: 'Google Cloud Storage', icon: '🔵', status: 'not-connected', desc: 'GCS buckets for scalable storage' },
  { id: 'azure', name: 'Azure Blob Storage', icon: '🟦', status: 'not-connected', desc: 'Microsoft Azure storage containers' },
  { id: 'digitalocean', name: 'DigitalOcean Spaces', icon: '🔷', status: 'not-connected', desc: 'S3-compatible object storage' },
  { id: 'backblaze', name: 'Backblaze B2', icon: '🔴', status: 'not-connected', desc: 'Affordable cloud storage' },
  { id: 'minio', name: 'MinIO', icon: '⬛', status: 'not-connected', desc: 'Self-hosted S3-compatible storage' },
  { id: 'wasabi', name: 'Wasabi', icon: '🟩', status: 'not-connected', desc: 'Hot cloud storage with no egress fees' },
];

const AI_PROVIDERS = [
  { id: 'openrouter', name: 'OpenRouter', icon: '🌐', status: 'not-connected', desc: 'Access 100+ models via unified API' },
  { id: 'openai', name: 'OpenAI', icon: '🤖', status: 'not-connected', desc: 'GPT-5, DALL-E 4, Whisper' },
  { id: 'anthropic', name: 'Anthropic Claude', icon: '🟤', status: 'not-connected', desc: 'Claude 4 and Claude Instant' },
  { id: 'google', name: 'Google Gemini', icon: '🔷', status: 'not-connected', desc: 'Gemini 2.5 Pro, Flash, and Ultra' },
  { id: 'meta', name: 'Meta Llama', icon: '🦙', status: 'not-connected', desc: 'Llama 4 open-source models' },
  { id: 'mistral', name: 'Mistral AI', icon: '🌊', status: 'not-connected', desc: 'Mistral Large and Medium' },
  { id: 'kimi', name: 'Kimi (Moonshot)', icon: '🌙', status: 'not-connected', desc: 'Long-context AI from Moonshot AI' },
  { id: 'deepseek', name: 'DeepSeek', icon: '🔬', status: 'not-connected', desc: 'DeepSeek V3 and Coder models' },
  { id: 'cohere', name: 'Cohere', icon: '🟡', status: 'not-connected', desc: 'Command R+ for enterprise AI' },
  { id: 'perplexity', name: 'Perplexity', icon: '🔍', status: 'not-connected', desc: 'AI-powered search and answers' },
  { id: 'groq', name: 'Groq', icon: '⚡', status: 'not-connected', desc: 'Ultra-fast inference for LLMs' },
  { id: 'together', name: 'Together AI', icon: '🤝', status: 'not-connected', desc: 'Open-source model hosting' },
  { id: 'fireworks', name: 'Fireworks AI', icon: '🎆', status: 'not-connected', desc: 'Fast, efficient model serving' },
  { id: 'replicate', name: 'Replicate', icon: '🔄', status: 'not-connected', desc: 'Run ML models in the cloud' },
  { id: 'huggingface', name: 'Hugging Face', icon: '🤗', status: 'not-connected', desc: 'Model hub and inference API' },
  { id: 'stability', name: 'Stability AI', icon: '🎨', status: 'not-connected', desc: 'Stable Diffusion XL, SD3, SDXL Turbo' },
  { id: 'midjourney', name: 'Midjourney', icon: '🖼️', status: 'not-connected', desc: 'Premium image generation' },
  { id: 'runway', name: 'Runway ML', icon: '🎬', status: 'not-connected', desc: 'Gen-3 video generation and editing' },
  { id: 'veo', name: 'Google Veo', icon: '📹', status: 'not-connected', desc: 'Video generation from Google DeepMind' },
  { id: 'suno', name: 'Suno', icon: '🎵', status: 'not-connected', desc: 'AI music and audio generation' },
  { id: 'elevenlabs', name: 'ElevenLabs', icon: '🗣️', status: 'not-connected', desc: 'Voice synthesis and cloning' },
  { id: 'pixabay', name: 'Pixabay', icon: '📷', status: 'not-connected', desc: 'Free stock images, videos, and music' },
  { id: 'pexels', name: 'Pexels', icon: '📸', status: 'not-connected', desc: 'Free high-quality stock media' },
  { id: 'leonardo', name: 'Leonardo.ai', icon: '🎭', status: 'not-connected', desc: 'AI image generation for creatives' },
  { id: 'ideogram', name: 'Ideogram', icon: '✏️', status: 'not-connected', desc: 'AI image gen with text rendering' },
  { id: 'flux', name: 'Flux (Black Forest)', icon: '🌑', status: 'not-connected', desc: 'Flux Pro and Dev image models' },
];

const CRM_PROVIDERS = [
  { id: 'hubspot', name: 'HubSpot', icon: '🟧', status: 'not-connected', desc: 'CRM, marketing, sales, and service hub' },
  { id: 'salesforce', name: 'Salesforce', icon: '☁️', status: 'not-connected', desc: 'Enterprise CRM and platform' },
  { id: 'pipedrive', name: 'Pipedrive', icon: '🟢', status: 'not-connected', desc: 'Sales-focused CRM pipeline' },
  { id: 'zoho', name: 'Zoho CRM', icon: '🔴', status: 'not-connected', desc: 'All-in-one business CRM suite' },
  { id: 'freshsales', name: 'Freshsales', icon: '🟩', status: 'not-connected', desc: 'AI-powered CRM by Freshworks' },
  { id: 'close', name: 'Close CRM', icon: '⬛', status: 'not-connected', desc: 'CRM built for inside sales teams' },
  { id: 'copper', name: 'Copper', icon: '🟤', status: 'not-connected', desc: 'Google Workspace-native CRM' },
  { id: 'monday', name: 'Monday CRM', icon: '🟣', status: 'not-connected', desc: 'Work management and CRM platform' },
  { id: 'attio', name: 'Attio', icon: '🔵', status: 'not-connected', desc: 'Next-gen relationship intelligence CRM' },
  { id: 'folk', name: 'Folk', icon: '🟠', status: 'not-connected', desc: 'Lightweight CRM for teams' },
];

const INTEGRATION_PROVIDERS = [
  { id: 'zapier', name: 'Zapier', icon: '⚡', status: 'not-connected', desc: 'Connect 6,000+ apps with automations' },
  { id: 'make', name: 'Make (Integromat)', icon: '🟣', status: 'not-connected', desc: 'Visual automation and workflows' },
  { id: 'n8n', name: 'n8n', icon: '🔗', status: 'not-connected', desc: 'Self-hostable workflow automation' },
  { id: 'webhooks', name: 'Webhooks', icon: '🪝', status: 'not-connected', desc: 'Send/receive HTTP webhook events' },
  { id: 'restapi', name: 'REST API', icon: '🔌', status: 'not-connected', desc: 'Full REST API access for custom integrations' },
  { id: 'graphql', name: 'GraphQL API', icon: '📊', status: 'not-connected', desc: 'GraphQL endpoint for flexible queries' },
  { id: 'notion', name: 'Notion', icon: '📝', status: 'not-connected', desc: 'Sync projects and docs with Notion' },
  { id: 'slack', name: 'Slack', icon: '💬', status: 'not-connected', desc: 'Notifications and commands in Slack' },
  { id: 'discord', name: 'Discord', icon: '🎮', status: 'not-connected', desc: 'Bot integration for Discord servers' },
  { id: 'teams', name: 'Microsoft Teams', icon: '🟦', status: 'not-connected', desc: 'Chat and workflow integration' },
  { id: 'jira', name: 'Jira', icon: '🔵', status: 'not-connected', desc: 'Sync tasks and projects with Jira' },
  { id: 'asana', name: 'Asana', icon: '🟠', status: 'not-connected', desc: 'Task and project management sync' },
  { id: 'linear', name: 'Linear', icon: '🟣', status: 'not-connected', desc: 'Issue tracking and project sync' },
  { id: 'trello', name: 'Trello', icon: '🔵', status: 'not-connected', desc: 'Board and card management' },
  { id: 'airtable', name: 'Airtable', icon: '🟡', status: 'not-connected', desc: 'Spreadsheet-database hybrid sync' },
  { id: 'google-sheets', name: 'Google Sheets', icon: '📗', status: 'not-connected', desc: 'Sync data with Google Sheets' },
  { id: 'google-drive', name: 'Google Drive', icon: '📁', status: 'not-connected', desc: 'File storage and sharing' },
  { id: 'dropbox', name: 'Dropbox', icon: '📦', status: 'not-connected', desc: 'File sync and collaboration' },
  { id: 'onedrive', name: 'OneDrive', icon: '☁️', status: 'not-connected', desc: 'Microsoft cloud file storage' },
  { id: 'github', name: 'GitHub', icon: '🐱', status: 'not-connected', desc: 'Repository and issue sync' },
  { id: 'gitlab', name: 'GitLab', icon: '🦊', status: 'not-connected', desc: 'DevOps platform integration' },
  { id: 'figma', name: 'Figma', icon: '🎨', status: 'not-connected', desc: 'Design file and comment sync' },
  { id: 'stripe', name: 'Stripe', icon: '💳', status: 'not-connected', desc: 'Payment processing and billing' },
  { id: 'paypal', name: 'PayPal', icon: '🅿️', status: 'not-connected', desc: 'Payment and payout integration' },
  { id: 'quickbooks', name: 'QuickBooks', icon: '📒', status: 'not-connected', desc: 'Accounting and invoicing sync' },
  { id: 'xero', name: 'Xero', icon: '📘', status: 'not-connected', desc: 'Cloud accounting integration' },
  { id: 'mailchimp', name: 'Mailchimp', icon: '📧', status: 'not-connected', desc: 'Email marketing automation' },
  { id: 'sendgrid', name: 'SendGrid', icon: '📨', status: 'not-connected', desc: 'Transactional email API' },
  { id: 'twilio', name: 'Twilio', icon: '📱', status: 'not-connected', desc: 'SMS, voice, and messaging' },
  { id: 'intercom', name: 'Intercom', icon: '💬', status: 'not-connected', desc: 'Customer messaging platform' },
  { id: 'zendesk', name: 'Zendesk', icon: '🎫', status: 'not-connected', desc: 'Support ticketing system' },
  { id: 'calendly', name: 'Calendly', icon: '📅', status: 'not-connected', desc: 'Scheduling and booking integration' },
  { id: 'cal', name: 'Cal.com', icon: '📆', status: 'not-connected', desc: 'Open-source scheduling platform' },
  { id: 'segment', name: 'Segment', icon: '📊', status: 'not-connected', desc: 'Customer data platform and analytics' },
  { id: 'mixpanel', name: 'Mixpanel', icon: '📈', status: 'not-connected', desc: 'Product analytics and tracking' },
  { id: 'amplitude', name: 'Amplitude', icon: '📉', status: 'not-connected', desc: 'Digital analytics platform' },
  { id: 'posthog', name: 'PostHog', icon: '🦔', status: 'not-connected', desc: 'Open-source product analytics' },
  { id: 'google-analytics', name: 'Google Analytics', icon: '📊', status: 'not-connected', desc: 'Web analytics and reporting' },
];

type TabValue = 'ai' | 'crm' | 'integrations' | 'storage';

const TAB_CONFIGS: Record<TabValue, { data: typeof AI_PROVIDERS; icon: React.ElementType; bannerIcon: React.ElementType; title: string; bannerDesc: string }> = {
  ai: { data: AI_PROVIDERS, icon: Brain, bannerIcon: Brain, title: 'AI Providers (BYOK)', bannerDesc: 'Bring Your Own Key — Connect your own AI API keys to use your preferred models across the platform.' },
  crm: { data: CRM_PROVIDERS, icon: Database, bannerIcon: Database, title: 'CRM & Sales', bannerDesc: 'Connect your CRM to sync contacts, deals, and pipeline data with Gigvora.' },
  integrations: { data: INTEGRATION_PROVIDERS, icon: Link2, bannerIcon: Link2, title: 'Apps & Integrations', bannerDesc: 'Connect productivity, communication, and developer tools to extend your workflows.' },
  storage: { data: STORAGE_PROVIDERS, icon: Cloud, bannerIcon: HardDrive, title: 'Storage Providers', bannerDesc: 'Connect your own cloud storage for file uploads and asset management.' },
};

export default function IntegrationsSettingsPage() {
  const [tab, setTab] = useState<TabValue>('ai');
  const [search, setSearch] = useState('');
  const config = TAB_CONFIGS[tab];
  const totalProviders = Object.values(TAB_CONFIGS).reduce((s, c) => s + c.data.length, 0);
  const filtered = config.data.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.desc.toLowerCase().includes(search.toLowerCase()));

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Settings className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Integrations</h1>
          <KPICard label="Connected" value="0" />
          <KPICard label="Available" value={String(totalProviders)} />
        </div>
      }
    >
      <SectionBackNav homeRoute="/settings" homeLabel="Settings" currentLabel="Integrations" icon={<Settings className="h-3 w-3" />} />

      <Tabs value={tab} onValueChange={v => setTab(v as TabValue)} className="mb-4">
        <TabsList className="h-7 flex-wrap">
          <TabsTrigger value="ai" className="text-[10px] h-5 px-3 gap-1"><Brain className="h-3 w-3" /> AI ({AI_PROVIDERS.length})</TabsTrigger>
          <TabsTrigger value="crm" className="text-[10px] h-5 px-3 gap-1"><Database className="h-3 w-3" /> CRM ({CRM_PROVIDERS.length})</TabsTrigger>
          <TabsTrigger value="integrations" className="text-[10px] h-5 px-3 gap-1"><Link2 className="h-3 w-3" /> Apps ({INTEGRATION_PROVIDERS.length})</TabsTrigger>
          <TabsTrigger value="storage" className="text-[10px] h-5 px-3 gap-1"><Cloud className="h-3 w-3" /> Storage ({STORAGE_PROVIDERS.length})</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Search */}
      <div className="relative mb-3">
        <Globe className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input placeholder={`Search ${config.title.toLowerCase()}...`} value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-[10px] rounded-xl" />
      </div>

      {/* Info banner */}
      <div className="p-3 rounded-2xl bg-accent/5 border border-accent/20 mb-3">
        <div className="flex items-center gap-2 text-[10px]">
          <config.bannerIcon className="h-3.5 w-3.5 text-accent" />
          <span className="font-semibold">{config.title}</span>
          <span className="text-muted-foreground">— {config.bannerDesc}</span>
        </div>
      </div>

      {/* Provider grid */}
      <div className="space-y-2">
        {filtered.map(p => (
          <SectionCard key={p.id} className="!rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">{p.icon}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{p.name}</span>
                  <Badge variant="outline" className="text-[7px] h-3.5 text-muted-foreground">Not Connected</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground">{p.desc}</div>
              </div>
              <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Key className="h-3 w-3" /> Connect</Button>
            </div>
          </SectionCard>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-8 text-muted-foreground text-[11px]">No integrations matching "{search}"</div>
        )}
      </div>
    </DashboardLayout>
  );
}
