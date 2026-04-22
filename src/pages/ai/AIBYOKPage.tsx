import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import {
  Key, Plus, Settings, Shield, CheckCircle2, AlertTriangle,
  Zap, RotateCcw, Trash2, Eye, EyeOff, Bot, Globe,
  ArrowRight, ExternalLink, Lock, Sparkles, Activity,
  PenLine, Image, Video, FileText, Mail, UserSearch,
  Headphones, BarChart3, ClipboardList
} from 'lucide-react';

type ProviderStatus = 'active' | 'inactive' | 'error';

interface Provider {
  id: string; name: string; status: ProviderStatus; models: string[];
  lastUsed: string; key: string; usage: string; validated: boolean;
}

const PROVIDERS: Provider[] = [
  { id: 'pr1', name: 'OpenAI', status: 'active', models: ['GPT-5', 'GPT-5 Mini', 'GPT-5 Nano', 'DALL-E 4'], lastUsed: '2h ago', key: 'sk-...7x4f', usage: '$8.40 this month', validated: true },
  { id: 'pr2', name: 'Google (Gemini)', status: 'active', models: ['Gemini 2.5 Pro', 'Gemini 2.5 Flash', 'Gemini 2.5 Flash Lite'], lastUsed: '1d ago', key: 'AIza...9k2', usage: '$3.20 this month', validated: true },
  { id: 'pr3', name: 'Anthropic', status: 'inactive', models: ['Claude 4', 'Claude 4 Haiku'], lastUsed: 'Never', key: '', usage: '$0', validated: false },
  { id: 'pr4', name: 'Stability AI', status: 'error', models: ['SDXL', 'SD3'], lastUsed: '3d ago', key: 'sk-...bad1', usage: '$1.80 this month', validated: false },
];

const TOOL_PREFS = [
  { tool: 'AI Chat', icon: Bot, provider: 'OpenAI (BYOK)', model: 'GPT-5' },
  { tool: 'AI Writer', icon: PenLine, provider: 'OpenAI (BYOK)', model: 'GPT-5' },
  { tool: 'Image Studio', icon: Image, provider: 'Platform', model: 'Auto' },
  { tool: 'Video Studio', icon: Video, provider: 'Platform', model: 'Auto' },
  { tool: 'Proposal Helper', icon: FileText, provider: 'Google (BYOK)', model: 'Gemini 2.5 Pro' },
  { tool: 'JD Helper', icon: FileText, provider: 'OpenAI (BYOK)', model: 'GPT-5 Mini' },
  { tool: 'Brief Helper', icon: ClipboardList, provider: 'Google (BYOK)', model: 'Gemini 2.5 Flash' },
  { tool: 'Outreach', icon: Mail, provider: 'OpenAI (BYOK)', model: 'GPT-5 Mini' },
  { tool: 'Recruiter AI', icon: UserSearch, provider: 'Platform', model: 'Auto' },
  { tool: 'Support AI', icon: Headphones, provider: 'Platform', model: 'Auto' },
  { tool: 'Analytics AI', icon: BarChart3, provider: 'Google (BYOK)', model: 'Gemini 2.5 Pro' },
];

const STATUS_CONFIG: Record<ProviderStatus, { color: string; icon: React.ElementType; label: string }> = {
  active: { color: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]', icon: CheckCircle2, label: 'Active' },
  inactive: { color: 'bg-muted text-muted-foreground', icon: Key, label: 'Not Connected' },
  error: { color: 'bg-red-500/10 text-red-500', icon: AlertTriangle, label: 'Key Invalid' },
};

export default function AIBYOKPage() {
  const [showKey, setShowKey] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold mb-0.5 flex items-center gap-2"><Key className="h-5 w-5 text-accent" /> BYOK — Bring Your Own Key</h1>
            <p className="text-[11px] text-muted-foreground">Connect your own AI provider keys. BYOK usage may reduce or bypass Gigvora credits.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="text-[8px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-lg gap-1"><CheckCircle2 className="h-2.5 w-2.5" />2 Active</Badge>
            <Badge variant="outline" className="text-[8px] rounded-lg gap-1"><Shield className="h-2.5 w-2.5" />Encrypted</Badge>
            <Badge variant="outline" className="text-[8px] rounded-lg gap-1"><Activity className="h-2.5 w-2.5" />$11.60 BYOK spend</Badge>
          </div>
        </div>
      </div>

      {/* Connected Providers */}
      <SectionCard title="Connected Providers" icon={<Key className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setShowAddForm(!showAddForm)}><Plus className="h-3 w-3" />Add Provider</Button>} className="!rounded-2xl">
        {/* Add form */}
        {showAddForm && (
          <div className="rounded-2xl border bg-muted/20 p-4 mb-4 space-y-3">
            <div className="text-[11px] font-bold">Add New Provider</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-[9px] font-medium mb-1 block">Provider</label>
                <Select><SelectTrigger className="h-8 rounded-xl text-[10px]"><SelectValue placeholder="Select provider" /></SelectTrigger>
                  <SelectContent>
                    {['OpenAI', 'Google (Gemini)', 'Anthropic', 'Stability AI', 'Cohere', 'Mistral', 'OpenRouter'].map(p => <SelectItem key={p} value={p} className="text-[10px]">{p}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-[9px] font-medium mb-1 block">API Key</label>
                <Input placeholder="sk-..." className="h-8 rounded-xl text-[10px]" type="password" />
              </div>
              <div className="flex items-end gap-2">
                <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1"><CheckCircle2 className="h-3 w-3" />Validate & Save</Button>
                <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl" onClick={() => setShowAddForm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {PROVIDERS.map(p => {
            const SC = STATUS_CONFIG[p.status];
            return (
              <div key={p.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
                <div className="flex items-start gap-3">
                  <div className={cn('h-11 w-11 rounded-2xl flex items-center justify-center shrink-0', p.status === 'active' ? 'bg-accent/10' : p.status === 'error' ? 'bg-red-500/10' : 'bg-muted/50')}>
                    <Bot className={cn('h-5 w-5', p.status === 'active' ? 'text-accent' : p.status === 'error' ? 'text-red-500' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-bold">{p.name}</span>
                      <Badge className={cn('text-[7px] border-0 rounded-lg gap-0.5', SC.color)}><SC.icon className="h-2.5 w-2.5" />{SC.label}</Badge>
                    </div>
                    <div className="text-[9px] text-muted-foreground mb-1.5">Last used: {p.lastUsed} · {p.usage}</div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {p.models.map(m => <Badge key={m} variant="outline" className="text-[7px] rounded-md h-4">{m}</Badge>)}
                    </div>
                    {p.key && (
                      <div className="flex items-center gap-1.5">
                        <code className="text-[9px] bg-muted/50 px-2 py-0.5 rounded-lg font-mono">{showKey === p.id ? 'sk-full-key-visible-here-abc123' : p.key}</code>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setShowKey(showKey === p.id ? null : p.id)}>
                          {showKey === p.id ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        </Button>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><CheckCircle2 className="h-2.5 w-2.5" />Validate</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><RotateCcw className="h-2.5 w-2.5" />Rotate</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5 text-destructive"><Trash2 className="h-2.5 w-2.5" />Remove</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* Per-tool preferences */}
      <SectionCard title="Per-Tool Provider Preferences" icon={<Settings className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="text-[9px] text-muted-foreground mb-3">Configure which provider and model each AI tool uses by default. "Platform" uses Gigvora credits.</div>
        <div className="space-y-2">
          {TOOL_PREFS.map(t => (
            <div key={t.tool} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
              <div className="h-7 w-7 rounded-lg bg-muted/50 flex items-center justify-center shrink-0"><t.icon className="h-3 w-3 text-muted-foreground" /></div>
              <span className="text-[10px] font-medium flex-1">{t.tool}</span>
              <Badge variant={t.provider.includes('BYOK') ? 'default' : 'outline'} className={cn('text-[8px] rounded-lg', t.provider.includes('BYOK') && 'bg-accent/10 text-accent border-accent/20')}>
                {t.provider}
              </Badge>
              <Badge variant="outline" className="text-[8px] rounded-lg">{t.model}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Security & Policies */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionCard title="Security" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5 text-[10px]">
            {[
              { label: 'Keys encrypted at rest', desc: 'AES-256 encryption for all stored keys', on: true },
              { label: 'Audit logging', desc: 'Track all BYOK key usage and changes', on: true },
              { label: 'Auto-rotate reminder', desc: 'Remind to rotate keys every 90 days', on: false },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5">
                <div><div className="font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
                <Switch checked={s.on} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Enterprise Controls" icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5 text-[10px]">
            {[
              { label: 'Org-managed keys only', desc: 'Prevent individual key connections', on: false },
              { label: 'Require approval for BYOK', desc: 'Admin must approve new provider keys', on: false },
              { label: 'Enforce spending limits', desc: 'Set max BYOK spend per user/month', on: false },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5">
                <div><div className="font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
                <Switch checked={s.on} />
              </div>
            ))}
          </div>
          <Badge className="text-[8px] bg-accent/10 text-accent border-0 rounded-lg mt-2 gap-1"><Sparkles className="h-2.5 w-2.5" />Enterprise Feature</Badge>
        </SectionCard>
      </div>

      {/* Cost warning */}
      <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-4">
        <div className="flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />
          <div>
            <h4 className="text-[11px] font-bold">BYOK Cost Warning</h4>
            <p className="text-[9px] text-muted-foreground mt-0.5">When using BYOK keys, API costs are billed directly by the provider to your account. Gigvora does not control or monitor external billing. Ensure you have spending limits configured with your provider.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
