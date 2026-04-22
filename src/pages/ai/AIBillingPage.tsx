import React, { useState } from 'react';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  CreditCard, DollarSign, TrendingUp, Key, Plus, Settings,
  AlertTriangle, Shield, Zap, Clock, BarChart3, ArrowUp,
  ArrowDown, CheckCircle2, Bot, PenLine, Image, Video,
  FileText, Mail, UserSearch, Headphones, RefreshCw,
  Calendar, Download, ChevronRight, Sparkles
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const USAGE_BY_TOOL = [
  { tool: 'AI Chat', icon: Bot, tokens: 4200, pct: 35, cost: '$4.20', credits: 42, trend: 'up' as const },
  { tool: 'AI Writer', icon: PenLine, tokens: 2800, pct: 23, cost: '$2.80', credits: 28, trend: 'up' as const },
  { tool: 'Image Studio', icon: Image, tokens: 1800, pct: 15, cost: '$5.40', credits: 54, trend: 'down' as const },
  { tool: 'Video Studio', icon: Video, tokens: 400, pct: 3, cost: '$6.00', credits: 60, trend: 'up' as const },
  { tool: 'Proposal Helper', icon: FileText, tokens: 1200, pct: 10, cost: '$1.20', credits: 12, trend: 'up' as const },
  { tool: 'Outreach', icon: Mail, tokens: 800, pct: 7, cost: '$0.80', credits: 8, trend: 'down' as const },
  { tool: 'Recruiter AI', icon: UserSearch, tokens: 600, pct: 5, cost: '$0.60', credits: 6, trend: 'up' as const },
  { tool: 'Support AI', icon: Headphones, tokens: 200, pct: 2, cost: '$0.60', credits: 6, trend: 'up' as const },
];

const DAILY_USAGE = [
  { day: 'Mon', platform: 42, byok: 18 }, { day: 'Tue', platform: 55, byok: 22 },
  { day: 'Wed', platform: 38, byok: 15 }, { day: 'Thu', platform: 67, byok: 28 },
  { day: 'Fri', platform: 82, byok: 35 }, { day: 'Sat', platform: 25, byok: 8 },
  { day: 'Sun', platform: 18, byok: 5 },
];

const COST_TREND = [
  { week: 'W1', cost: 8.2 }, { week: 'W2', cost: 12.4 }, { week: 'W3', cost: 10.8 },
  { week: 'W4', cost: 15.6 }, { week: 'W5', cost: 14.2 }, { week: 'W6', cost: 18.1 },
];

const BILLING_EVENTS = [
  { date: 'Apr 12', event: 'Credit top-up', amount: '+500 credits', type: 'credit' },
  { date: 'Apr 1', event: 'Pro subscription renewed', amount: '$29/mo', type: 'subscription' },
  { date: 'Mar 28', event: 'Auto top-up triggered', amount: '+200 credits', type: 'credit' },
  { date: 'Mar 1', event: 'Pro subscription renewed', amount: '$29/mo', type: 'subscription' },
  { date: 'Feb 15', event: 'Plan upgrade to Pro', amount: '$29/mo', type: 'subscription' },
];

const API_KEYS = [
  { name: 'OpenAI', status: 'active' as const, model: 'GPT-5', lastUsed: '2h ago', usage: '$8.40' },
  { name: 'Google', status: 'active' as const, model: 'Gemini 2.5 Pro', lastUsed: '1d ago', usage: '$3.20' },
  { name: 'Stability AI', status: 'inactive' as const, model: 'SDXL', lastUsed: 'Never', usage: '$0' },
];

export default function AIBillingPage() {
  const [tab, setTab] = useState<'overview' | 'tools' | 'providers' | 'history'>('overview');

  return (
    <div className="space-y-4 max-w-5xl">
      {/* Header */}
      <div className="rounded-3xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h1 className="text-lg font-bold mb-0.5 flex items-center gap-2"><CreditCard className="h-5 w-5 text-accent" /> Usage & Billing</h1>
            <p className="text-[11px] text-muted-foreground">Monitor AI usage, manage credits, and track costs across all tools and providers</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Plus className="h-3.5 w-3.5" />Buy Credits</Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><CreditCard className="h-3.5 w-3.5" />Upgrade Plan</Button>
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2.5">
        {[
          { label: 'Credits Left', value: '1,850', icon: Zap, change: 'of 3,000' },
          { label: 'Used Today', value: '47', icon: TrendingUp, change: '+12' },
          { label: 'This Month', value: '$15.60', icon: DollarSign, change: '+18%' },
          { label: 'BYOK Usage', value: '$11.60', icon: Key },
          { label: 'Platform Usage', value: '$4.00', icon: Shield },
          { label: 'Subscription', value: 'Pro', icon: Sparkles },
          { label: 'Auto Top-up', value: 'On', icon: RefreshCw },
          { label: 'Next Billing', value: 'May 1', icon: Calendar },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1 mb-1"><k.icon className="h-3 w-3 text-muted-foreground" /><span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium">{k.label}</span></div>
            <div className="text-lg font-bold">{k.value}</div>
            {k.change && <span className="text-[8px] text-muted-foreground">{k.change}</span>}
          </div>
        ))}
      </div>

      {/* Credit bar */}
      <SectionCard title="Credit Balance" className="!rounded-2xl">
        <div className="mb-2">
          <div className="flex justify-between text-[10px] mb-1"><span>1,150 / 3,000 credits used</span><span className="font-bold">38%</span></div>
          <Progress value={38} className="h-2.5 rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <div className="text-[9px] text-muted-foreground">Resets in 18 days · Next billing: May 1, 2026</div>
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><RefreshCw className="h-2.5 w-2.5" />Auto top-up: 200 credits at 10%</Button>
          </div>
        </div>
      </SectionCard>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={v => setTab(v as any)}>
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-[10px] px-3">Overview</TabsTrigger>
          <TabsTrigger value="tools" className="text-[10px] px-3">By Tool</TabsTrigger>
          <TabsTrigger value="providers" className="text-[10px] px-3">Providers</TabsTrigger>
          <TabsTrigger value="history" className="text-[10px] px-3">Billing History</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <SectionCard title="Daily Generations" icon={<BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={DAILY_USAGE}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} />
                  <Bar dataKey="platform" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Platform" stackId="a" />
                  <Bar dataKey="byok" fill="hsl(var(--gigvora-purple))" radius={[4, 4, 0, 0]} name="BYOK" stackId="a" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard title="Cost Trend (Weekly)" icon={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={COST_TREND}>
                  <defs>
                    <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0} /></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                  <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `$${v}`} />
                  <Tooltip contentStyle={{ fontSize: 11, borderRadius: 12 }} formatter={(v: number) => [`$${v}`, 'Cost']} />
                  <Area type="monotone" dataKey="cost" stroke="hsl(var(--accent))" fill="url(#costGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'tools' && (
        <SectionCard title="Usage by Tool" className="!rounded-2xl">
          <div className="space-y-3">
            {USAGE_BY_TOOL.map(u => (
              <div key={u.tool} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
                <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0"><u.icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] font-semibold">{u.tool}</span>
                    <div className="flex items-center gap-3 text-[9px]">
                      <span className="text-muted-foreground">{u.credits} credits</span>
                      <span className="font-semibold">{u.cost}</span>
                      {u.trend === 'up' ? <ArrowUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : <ArrowDown className="h-3 w-3 text-red-400" />}
                    </div>
                  </div>
                  <Progress value={u.pct} className="h-1 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'providers' && (
        <SectionCard title="Provider Usage (BYOK)" icon={<Key className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            {API_KEYS.map(k => (
              <div key={k.name} className="flex items-center gap-3 py-3 border-b border-border/20 last:border-0">
                <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0"><Bot className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold">{k.name}</span>
                    <Badge className={cn('text-[7px] border-0 rounded-lg', k.status === 'active' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>{k.status}</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground">{k.model} · Last used: {k.lastUsed}</div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] font-bold">{k.usage}</div>
                  <div className="text-[8px] text-muted-foreground">this month</div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 rounded-xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-start gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />
            <div className="text-[9px] text-muted-foreground"><strong>External billing:</strong> BYOK costs are billed directly by providers. Ensure spending limits are configured.</div>
          </div>
        </SectionCard>
      )}

      {tab === 'history' && (
        <SectionCard title="Billing History" icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Download className="h-2.5 w-2.5" />Export</Button>} className="!rounded-2xl">
          <div className="space-y-2">
            {BILLING_EVENTS.map((e, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0">
                <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', e.type === 'credit' ? 'bg-accent/10' : 'bg-violet-500/10')}>
                  {e.type === 'credit' ? <Zap className="h-3.5 w-3.5 text-accent" /> : <CreditCard className="h-3.5 w-3.5 text-violet-500" />}
                </div>
                <div className="flex-1">
                  <div className="text-[10px] font-semibold">{e.event}</div>
                  <div className="text-[8px] text-muted-foreground">{e.date}</div>
                </div>
                <Badge variant="outline" className="text-[9px] rounded-lg font-semibold">{e.amount}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
