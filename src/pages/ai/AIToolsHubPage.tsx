import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Bot, PenLine, Image, Video, FileText, Briefcase, ClipboardList, Mail,
  UserSearch, Headphones, BarChart3, BookOpen, History, CreditCard,
  ChevronRight, Sparkles, Zap, Key, TrendingUp, Clock, Star,
  ArrowUpRight, Shield, CheckCircle2, Activity
} from 'lucide-react';

const TOOLS = [
  { title: 'AI Chat', desc: 'Conversational workspace for Q&A, brainstorming, and structured prompts', icon: Bot, href: '/ai/chat', color: 'from-blue-500/20 to-blue-600/5', iconColor: 'text-blue-500', access: 'Free', lastUsed: '2h ago' },
  { title: 'AI Writer', desc: 'Blog posts, emails, ad copy, social content with tone and audience controls', icon: PenLine, href: '/ai/writer', color: 'from-violet-500/20 to-violet-600/5', iconColor: 'text-violet-500', access: 'Pro', lastUsed: '5h ago' },
  { title: 'Image Studio', desc: 'Generate, edit, and refine images with style presets and brand controls', icon: Image, href: '/ai/image', color: 'from-emerald-500/20 to-emerald-600/5', iconColor: 'text-emerald-500', access: 'Credits', lastUsed: 'Yesterday' },
  { title: 'Video Studio', desc: 'Create promo reels, explainers, and social video with storyboard input', icon: Video, href: '/ai/video', color: 'from-rose-500/20 to-rose-600/5', iconColor: 'text-rose-500', access: 'Credits', lastUsed: '3d ago' },
  { title: 'Proposal Helper', desc: 'Draft winning proposals with cover letters, milestones, and pricing', icon: FileText, href: '/ai/proposal', color: 'from-amber-500/20 to-amber-600/5', iconColor: 'text-amber-500', access: 'Pro', lastUsed: '1d ago' },
  { title: 'JD Helper', desc: 'Generate inclusive job descriptions with screener suggestions', icon: Briefcase, href: '/ai/jd', color: 'from-cyan-500/20 to-cyan-600/5', iconColor: 'text-cyan-500', access: 'Pro', lastUsed: '2d ago' },
  { title: 'Brief Helper', desc: 'Build detailed project briefs with scope, milestones, and requirements', icon: ClipboardList, href: '/ai/brief', color: 'from-teal-500/20 to-teal-600/5', iconColor: 'text-teal-500', access: 'Pro', lastUsed: '4d ago' },
  { title: 'Outreach', desc: 'Sales emails, LinkedIn messages, and follow-up sequences', icon: Mail, href: '/ai/outreach', color: 'from-orange-500/20 to-orange-600/5', iconColor: 'text-orange-500', access: 'Pro', lastUsed: '1d ago' },
  { title: 'Recruiter AI', desc: 'Candidate sourcing, outreach, screening questions, and scorecards', icon: UserSearch, href: '/ai/recruiter', color: 'from-indigo-500/20 to-indigo-600/5', iconColor: 'text-indigo-500', access: 'Enterprise', lastUsed: 'Never' },
  { title: 'Support AI', desc: 'Summarize tickets, classify issues, draft customer responses', icon: Headphones, href: '/ai/support', color: 'from-pink-500/20 to-pink-600/5', iconColor: 'text-pink-500', access: 'Enterprise', lastUsed: '2d ago' },
  { title: 'Analytics AI', desc: 'Interpret metrics, detect anomalies, generate report drafts', icon: BarChart3, href: '/ai/analytics', color: 'from-sky-500/20 to-sky-600/5', iconColor: 'text-sky-500', access: 'Enterprise', lastUsed: '1w ago' },
  { title: 'Prompt Library', desc: 'Browse, save, and reuse curated prompts across all tools', icon: BookOpen, href: '/ai/prompts', color: 'from-lime-500/20 to-lime-600/5', iconColor: 'text-lime-500', access: 'Free', lastUsed: '3h ago' },
];

const RECENT_OUTPUTS = [
  { title: 'Marketing email — Product launch', tool: 'AI Writer', icon: PenLine, time: '2h ago', tokens: 120, status: 'draft' },
  { title: 'Hero image — SaaS landing page', tool: 'Image Studio', icon: Image, time: '5h ago', tokens: 45, status: 'final' },
  { title: 'Architecture discussion', tool: 'AI Chat', icon: Bot, time: 'Yesterday', tokens: 340, status: 'saved' },
  { title: 'Proposal — Dashboard redesign', tool: 'Proposal Helper', icon: FileText, time: 'Yesterday', tokens: 68, status: 'final' },
];

const ROLE_RECS = {
  professional: ['Proposal Helper', 'Outreach', 'AI Writer', 'Image Studio'],
  enterprise: ['Recruiter AI', 'Support AI', 'Analytics AI', 'JD Helper'],
  user: ['AI Chat', 'Brief Helper', 'Image Studio', 'Support AI'],
};

export default function AIToolsHubPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      {/* Hero header */}
      <div className="rounded-3xl bg-gradient-to-br from-accent/10 via-accent/5 to-transparent border p-5 md:p-7">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent to-accent/70 flex items-center justify-center shadow-lg">
                <Sparkles className="h-5 w-5 text-accent-foreground" />
              </div>
              <div>
                <h1 className="text-lg md:text-xl font-bold tracking-tight">AI Tools Hub</h1>
                <p className="text-[11px] text-muted-foreground">Your AI-powered workspace for content, creative, and business intelligence</p>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="rounded-xl text-[9px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" />BYOK Connected
            </Badge>
            <Badge className="rounded-xl text-[9px] bg-accent/10 text-accent border-0 gap-1">
              <Shield className="h-2.5 w-2.5" />Pro Subscription
            </Badge>
            <Badge variant="outline" className="rounded-xl text-[9px] gap-1">
              <Zap className="h-2.5 w-2.5 text-accent" />1,850 credits
            </Badge>
          </div>
        </div>
      </div>

      {/* KPI band */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2.5">
        {[
          { label: 'Generations Today', value: '24', icon: Activity, trend: '+8' },
          { label: 'Credits Left', value: '1,850', icon: Zap },
          { label: 'Saved Outputs', value: '142', icon: Star },
          { label: 'Active Models', value: '3', icon: Bot },
          { label: 'Providers', value: '2', icon: Key },
          { label: 'Est. Spend', value: '$15.60', icon: TrendingUp },
          { label: 'Success Rate', value: '98.2%', icon: CheckCircle2 },
        ].map(kpi => (
          <div key={kpi.label} className="rounded-2xl border bg-card p-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium">{kpi.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg font-bold">{kpi.value}</span>
              {kpi.trend && <span className="text-[9px] text-[hsl(var(--state-healthy))] font-medium">↑ {kpi.trend}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Tool launch grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold">All AI Tools</h2>
          <span className="text-[9px] text-muted-foreground">{TOOLS.length} tools available</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {TOOLS.map(t => (
            <div
              key={t.title}
              onClick={() => navigate(t.href)}
              className="rounded-2xl border bg-card p-4 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 cursor-pointer group relative overflow-hidden"
            >
              <div className={cn('absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300', t.color)} />
              <div className="relative">
                <div className="flex items-start justify-between mb-3">
                  <div className={cn('h-11 w-11 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300', t.iconColor)}>
                    <t.icon className="h-5 w-5" />
                  </div>
                  <Badge variant="outline" className={cn('text-[7px] rounded-lg', t.access === 'Free' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-[hsl(var(--state-healthy)/0.3)]' : t.access === 'Enterprise' ? 'bg-accent/10 text-accent border-accent/30' : 'border-muted-foreground/30')}>
                    {t.access}
                  </Badge>
                </div>
                <div className="text-[12px] font-bold group-hover:text-accent transition-colors mb-0.5">{t.title}</div>
                <div className="text-[9px] text-muted-foreground leading-relaxed mb-3 line-clamp-2">{t.desc}</div>
                <div className="flex items-center justify-between">
                  <span className="text-[8px] text-muted-foreground/60 flex items-center gap-1">
                    <Clock className="h-2.5 w-2.5" />{t.lastUsed}
                  </span>
                  <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-0.5 px-2 rounded-lg group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                    Open <ArrowUpRight className="h-2.5 w-2.5" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two-column: Recent Work + Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Recent work */}
        <div className="lg:col-span-3">
          <SectionCard title="Recent Work" subtitle="Your latest generations and saved outputs" icon={<History className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button variant="ghost" size="sm" className="h-6 text-[9px] gap-0.5 rounded-lg" onClick={() => navigate('/ai/history')}>View All <ChevronRight className="h-2.5 w-2.5" /></Button>} className="!rounded-2xl">
            <div className="space-y-2">
              {RECENT_OUTPUTS.map((o, i) => (
                <div key={i} className="flex items-center gap-3 py-2 px-1 rounded-xl hover:bg-muted/30 transition-colors cursor-pointer">
                  <div className="h-9 w-9 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                    <o.icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-medium truncate">{o.title}</div>
                    <div className="text-[8px] text-muted-foreground">{o.tool} · {o.time} · {o.tokens} tokens</div>
                  </div>
                  <Badge className={cn('text-[7px] border-0 rounded-lg capitalize', o.status === 'final' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : o.status === 'saved' ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground')}>{o.status}</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Credit & BYOK status */}
          <SectionCard title="Usage & Credits" icon={<Zap className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[9px] mb-1"><span className="text-muted-foreground">Platform credits</span><span className="font-semibold">1,150 / 3,000</span></div>
                <Progress value={38} className="h-2 rounded-full" />
              </div>
              <div className="flex items-center gap-2 text-[9px]">
                <div className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))]" />
                <span className="text-muted-foreground">BYOK: 2 providers connected</span>
              </div>
              <div className="flex items-center gap-2 text-[9px]">
                <div className="h-2 w-2 rounded-full bg-accent" />
                <span className="text-muted-foreground">Est. cost today: $2.40</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1" onClick={() => navigate('/ai/billing')}>
                  <CreditCard className="h-3 w-3" />View Billing
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1" onClick={() => navigate('/ai/byok')}>
                  <Key className="h-3 w-3" />Manage Keys
                </Button>
              </div>
            </div>
          </SectionCard>

          {/* Role-specific recommendations */}
          <SectionCard title="Recommended For You" subtitle="Based on your Professional role" icon={<Star className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {ROLE_RECS.professional.map(name => {
                const tool = TOOLS.find(t => t.title === name);
                if (!tool) return null;
                return (
                  <button key={name} onClick={() => navigate(tool.href)} className="w-full flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-muted/40 transition-colors text-left">
                    <tool.icon className={cn('h-4 w-4', tool.iconColor)} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-medium">{tool.title}</div>
                      <div className="text-[8px] text-muted-foreground truncate">{tool.desc}</div>
                    </div>
                    <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* Prompt highlights */}
          <SectionCard title="Popular Prompts" icon={<BookOpen className="h-3.5 w-3.5 text-muted-foreground" />} action={<Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5 rounded-lg" onClick={() => navigate('/ai/prompts')}>Browse All</Button>} className="!rounded-2xl">
            <div className="space-y-1.5">
              {['Professional cold outreach email', 'Technical blog post structure', 'Job description template'].map(p => (
                <div key={p} className="flex items-center gap-2 py-1.5 px-1 rounded-lg hover:bg-muted/30 transition-colors cursor-pointer">
                  <BookOpen className="h-3 w-3 text-muted-foreground/50" />
                  <span className="text-[9px] font-medium">{p}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
