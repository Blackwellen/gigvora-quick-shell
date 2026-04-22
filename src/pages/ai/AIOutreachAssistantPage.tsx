import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  Mail, Sparkles, Copy, Bookmark, Send, RotateCcw, MessageSquare,
  Linkedin, Zap, Target, Users, RefreshCw, ArrowRight, Heart,
  Star, TrendingUp, Clock
} from 'lucide-react';

const GOALS = ['Cold Outreach', 'Follow-Up', 'Networking', 'Sales Pitch', 'Partnership', 'Lead Nurture', 'Re-engagement'];

const GENERATED = [
  { subject: 'Quick question about your infrastructure needs', preview: 'Hi Sarah, I noticed your team recently expanded the engineering department. Many growing teams face challenges with scaling their infrastructure, and I wanted to share how we\'ve helped similar companies reduce their ops overhead by 40%...', tone: 'Warm & Consultative', length: '120 words', channel: 'Email' },
  { subject: 'Collaboration opportunity — Acme + Gigvora', preview: 'Dear Sarah, I wanted to reach out regarding a potential partnership that could benefit both our organizations. After reviewing your company\'s growth trajectory and technical capabilities, I believe there\'s a strong alignment between our teams...', tone: 'Formal & Professional', length: '180 words', channel: 'Email' },
  { subject: 'Thought you might find this useful', preview: 'Hey Sarah, I came across your recent post about scaling challenges and it resonated with what we\'re seeing across the industry. Our platform has helped teams like yours cut onboarding time by 60% — happy to share a quick demo if you\'re curious...', tone: 'Casual & Direct', length: '95 words', channel: 'LinkedIn' },
];

export default function AIOutreachAssistantPage() {
  const [channel, setChannel] = useState('email');
  const [goal, setGoal] = useState('Cold Outreach');

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        {/* Channel tabs */}
        <Tabs value={channel} onValueChange={setChannel}>
          <TabsList className="h-9 rounded-xl bg-muted/40">
            <TabsTrigger value="email" className="text-[10px] px-4 rounded-lg gap-1.5"><Mail className="h-3 w-3" />Email</TabsTrigger>
            <TabsTrigger value="linkedin" className="text-[10px] px-4 rounded-lg gap-1.5"><Linkedin className="h-3 w-3" />LinkedIn</TabsTrigger>
            <TabsTrigger value="message" className="text-[10px] px-4 rounded-lg gap-1.5"><MessageSquare className="h-3 w-3" />DM</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Goal selector */}
        <div className="flex flex-wrap gap-1.5">
          {GOALS.map(g => (
            <button key={g} onClick={() => setGoal(g)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-medium transition-all border', goal === g ? 'border-accent bg-accent/10 text-accent shadow-sm' : 'border-border text-muted-foreground hover:bg-muted/30')}>
              {g}
            </button>
          ))}
        </div>

        {/* Prospect details */}
        <SectionCard title="Prospect Details" icon={<Target className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Name', placeholder: 'Sarah Kim' },
                { label: 'Company', placeholder: 'TechCorp' },
                { label: 'Role', placeholder: 'VP Engineering' },
                { label: 'Industry', placeholder: 'SaaS / B2B' },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[9px] font-medium mb-0.5 block">{f.label}</label>
                  <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Context, Talking Points & Personalization</label>
              <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="What do you want to discuss? Any recent activity, shared connections, or specific angles..." />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button className="h-9 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Generate 3 Variants</Button>
              <div className="flex-1" />
              <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~4 credits</span>
            </div>
          </div>
        </SectionCard>

        {/* Generated variants */}
        <div className="space-y-3">
          {GENERATED.map((g, i) => (
            <SectionCard key={i} className="!rounded-2xl hover:shadow-sm transition-all">
              <div className="flex items-start gap-3 mb-2">
                <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 text-accent font-bold text-[11px]">{i + 1}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] font-bold mb-0.5">{g.subject}</div>
                  <div className="text-[10px] text-muted-foreground leading-relaxed">{g.preview}</div>
                </div>
              </div>
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/30">
                <div className="flex gap-1.5 text-[8px] text-muted-foreground flex-wrap">
                  <Badge variant="outline" className="text-[7px] rounded-md">{g.tone}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{g.channel}</Badge>
                  <span>{g.length}</span>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Copy className="h-2.5 w-2.5" />Copy</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Bookmark className="h-2.5 w-2.5" />Save</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><RotateCcw className="h-2.5 w-2.5" />Refine</Button>
                  <Button size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Send className="h-2.5 w-2.5" />Send</Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>

      <div className="hidden lg:flex flex-col w-[200px] shrink-0 space-y-3">
        <SectionCard title="Response Rate" icon={<TrendingUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
          <div className="text-center py-2">
            <div className="text-2xl font-bold">34%</div>
            <div className="text-[8px] text-muted-foreground">AI-assisted outreach</div>
          </div>
        </SectionCard>
        <SectionCard title="Saved Templates" className="!rounded-2xl">
          <div className="space-y-1.5">
            {['Partnership intro', 'Follow-up #2', 'Warm referral', 'Event follow-up'].map(t => (
              <button key={t} className="w-full text-left text-[9px] px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground">{t}</button>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Best Practices" className="!rounded-2xl">
          <div className="space-y-2 text-[8px] text-muted-foreground">
            <p>• Keep subject lines under 50 chars</p>
            <p>• Personalize the first sentence</p>
            <p>• One clear CTA per message</p>
            <p>• Send Tuesday-Thursday AM</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
