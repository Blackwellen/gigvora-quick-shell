import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Settings, Shield, Bot, Zap, Bell, Eye, Globe, Lock, Save,
  Sparkles, Users, Crown, Palette, Type, Volume2, Trash2,
  RefreshCw, AlertTriangle, CheckCircle2, Clock, FileText
} from 'lucide-react';
import { toast } from 'sonner';

const MODELS = [
  { name: 'GPT-5 (OpenAI)', desc: 'Best all-round reasoning', tier: 'Pro' },
  { name: 'GPT-5 Mini (OpenAI)', desc: 'Fast and cost-effective', tier: 'Free' },
  { name: 'GPT-5 Nano (OpenAI)', desc: 'Fastest, basic tasks', tier: 'Free' },
  { name: 'Gemini 2.5 Pro (Google)', desc: 'Strong multimodal', tier: 'Pro' },
  { name: 'Gemini 2.5 Flash (Google)', desc: 'Balanced speed/quality', tier: 'Free' },
  { name: 'Gemini 2.5 Flash Lite (Google)', desc: 'Ultra-fast simple tasks', tier: 'Free' },
];

export default function AISettingsPage() {
  const [tab, setTab] = useState<'general' | 'safety' | 'notifications' | 'team'>('general');
  const [defaultModel, setDefaultModel] = useState('GPT-5 (OpenAI)');
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState('4096');

  return (
    <div className="space-y-4 max-w-4xl">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold mb-0.5 flex items-center gap-2"><Settings className="h-5 w-5 text-accent" /> AI Settings</h1>
            <p className="text-[11px] text-muted-foreground">Configure your AI workspace preferences, defaults, safety controls, and team policies</p>
          </div>
          <Button onClick={() => toast.success('Settings saved')} className="h-8 text-[10px] rounded-xl gap-1"><Save className="h-3.5 w-3.5" />Save All</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="h-8">
          <TabsTrigger value="general" className="text-[10px] px-3">General</TabsTrigger>
          <TabsTrigger value="safety" className="text-[10px] px-3">Safety & Content</TabsTrigger>
          <TabsTrigger value="notifications" className="text-[10px] px-3">Notifications</TabsTrigger>
          <TabsTrigger value="team" className="text-[10px] px-3">Team & Enterprise</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'general' && (
        <div className="space-y-4">
          <SectionCard title="Default Model" icon={<Bot className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {MODELS.map(m => (
                <label key={m.name} className={cn(
                  'flex items-center gap-3 py-2.5 px-3 rounded-xl transition-colors cursor-pointer',
                  defaultModel === m.name ? 'bg-accent/5 border border-accent/20' : 'hover:bg-muted/30'
                )}>
                  <input type="radio" name="model" checked={defaultModel === m.name} onChange={() => setDefaultModel(m.name)} className="accent-[hsl(var(--accent))]" />
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold">{m.name}</div>
                    <div className="text-[8px] text-muted-foreground">{m.desc}</div>
                  </div>
                  <Badge variant="outline" className="text-[7px] rounded-lg">{m.tier}</Badge>
                </label>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Generation Defaults" icon={<Settings className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-5">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div><div className="text-[10px] font-medium">Temperature</div><div className="text-[8px] text-muted-foreground">Higher = more creative</div></div>
                  <Badge variant="outline" className="text-[9px] rounded-lg font-mono">{temperature[0]}</Badge>
                </div>
                <Slider value={temperature} onValueChange={setTemperature} min={0} max={2} step={0.1} />
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-[10px] font-medium">Max Output Tokens</div><div className="text-[8px] text-muted-foreground">Maximum response length</div></div>
                <Select value={maxTokens} onValueChange={setMaxTokens}>
                  <SelectTrigger className="h-8 w-28 text-[10px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{['1024', '2048', '4096', '8192', '16384'].map(v => <SelectItem key={v} value={v} className="text-[10px]">{v}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-[10px] font-medium">Top P (Nucleus Sampling)</div><div className="text-[8px] text-muted-foreground">Controls diversity</div></div>
                <Input defaultValue="1.0" className="w-20 h-8 rounded-xl text-[10px] text-right" />
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-[10px] font-medium">Default Language</div><div className="text-[8px] text-muted-foreground">Preferred output language</div></div>
                <Select defaultValue="en">
                  <SelectTrigger className="h-8 w-32 text-[10px] rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>{['English', 'Spanish', 'French', 'German', 'Japanese'].map(l => <SelectItem key={l} value={l.toLowerCase().slice(0, 2)} className="text-[10px]">{l}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Data & Privacy" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-2.5">
              {[
                { label: 'Save conversation history', desc: 'Store all chat and generation history', on: true },
                { label: 'Allow training data usage', desc: 'Opt in to improving AI models with your data', on: false },
                { label: 'Auto-save drafts', desc: 'Automatically save in-progress generations', on: true },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2">
                  <div><div className="text-[10px] font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 mt-3 text-destructive"><Trash2 className="h-3 w-3" />Clear All History</Button>
          </SectionCard>
        </div>
      )}

      {tab === 'safety' && (
        <div className="space-y-4">
          <SectionCard title="Content Filtering" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-2.5">
              {[
                { label: 'Block harmful content', desc: 'Filter outputs that contain harmful or inappropriate content', on: true },
                { label: 'PII detection', desc: 'Warn when outputs contain personal identifiable information', on: true },
                { label: 'Bias detection', desc: 'Flag potentially biased language in outputs', on: false },
                { label: 'Factual grounding check', desc: 'Warn when outputs may contain hallucinated facts', on: false },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2">
                  <div><div className="text-[10px] font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Image & Media Safety" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-2.5">
              {[
                { label: 'Watermark AI images', desc: 'Add invisible watermark to all generated images', on: false },
                { label: 'NSFW filter', desc: 'Block generation of explicit visual content', on: true },
                { label: 'Copyright check', desc: 'Warn about potential copyright concerns in prompts', on: false },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2">
                  <div><div className="text-[10px] font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'notifications' && (
        <SectionCard title="Notification Preferences" icon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {[
              { label: 'Credit low warning', desc: 'Notify when credits drop below 10%', on: true },
              { label: 'Generation complete', desc: 'Notify when long-running generations finish', on: true },
              { label: 'BYOK key expiring', desc: 'Warn before BYOK keys need rotation', on: true },
              { label: 'Weekly usage digest', desc: 'Email summary of AI usage each week', on: false },
              { label: 'New models available', desc: 'Notify when new AI models become available', on: true },
              { label: 'Team prompt updates', desc: 'Notify when team prompts are added or updated', on: false },
            ].map(n => (
              <div key={n.label} className="flex items-center justify-between py-2">
                <div><div className="text-[10px] font-medium">{n.label}</div><div className="text-[8px] text-muted-foreground">{n.desc}</div></div>
                <Switch defaultChecked={n.on} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'team' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-accent shrink-0 mt-0.5" />
            <div>
              <div className="text-[11px] font-bold">Enterprise Features</div>
              <div className="text-[9px] text-muted-foreground mt-0.5">These controls are available on Enterprise plans. They allow org-level governance over AI usage, model access, and team permissions.</div>
            </div>
          </div>
          <SectionCard title="Team AI Policies" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="space-y-2.5">
              {[
                { label: 'Shared prompt library', desc: 'Allow team members to share and access prompt templates', on: true },
                { label: 'Org-managed model access', desc: 'Admin controls which models team members can use', on: false },
                { label: 'Usage budget per seat', desc: 'Set credit/cost limits per team member per month', on: false },
                { label: 'Approval for high-cost operations', desc: 'Require approval for generations above $5 estimated cost', on: false },
                { label: 'Audit log for AI outputs', desc: 'Track and log all AI-generated content for compliance', on: true },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between py-2">
                  <div><div className="text-[10px] font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
                  <Switch defaultChecked={s.on} />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Model Access Control" icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="text-[9px] text-muted-foreground mb-3">Control which models are available to team members.</div>
            <div className="space-y-1.5">
              {MODELS.map(m => (
                <div key={m.name} className="flex items-center justify-between py-1.5 px-2 rounded-xl hover:bg-muted/20">
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-medium">{m.name}</div>
                    <Badge variant="outline" className="text-[7px] rounded-lg">{m.tier}</Badge>
                  </div>
                  <Switch defaultChecked={true} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </div>
  );
}
