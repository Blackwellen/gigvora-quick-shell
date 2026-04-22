import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  FileText, Sparkles, Copy, Bookmark, Download, RotateCcw,
  CheckCircle, Zap, DollarSign, Clock, Target, Users,
  Star, TrendingUp, ArrowRight, Eye, RefreshCw
} from 'lucide-react';

const SECTIONS_GENERATED = [
  { title: 'Executive Summary', content: 'We propose a comprehensive dashboard redesign that will modernize your analytics infrastructure, improve user engagement by an estimated 40%, and deliver measurable ROI within the first quarter of deployment.' },
  { title: 'Understanding Your Challenge', content: 'Based on our analysis of your current platform, we\'ve identified three critical areas for improvement: data visualization clarity, user navigation flow, and real-time reporting capabilities.' },
  { title: 'Our Approach', content: 'We will follow an agile methodology with 2-week sprints, continuous stakeholder feedback, and progressive delivery. Each milestone will include a review checkpoint and demo session.' },
  { title: 'Timeline & Milestones', content: 'Phase 1 (Weeks 1-2): Discovery & UX Research\nPhase 2 (Weeks 3-6): Design & Prototyping\nPhase 3 (Weeks 7-10): Development\nPhase 4 (Weeks 11-12): Testing & Launch' },
  { title: 'Investment', content: 'Total project investment: $18,500\nBreakdown: Discovery $2,500 · Design $5,000 · Development $8,000 · QA & Launch $3,000\nPayment: 30% upfront, 40% at design approval, 30% at launch.' },
  { title: 'Why Choose Us', content: 'With 8+ years of enterprise dashboard experience, we\'ve delivered 50+ successful projects for companies including Fortune 500 clients. Our team brings deep expertise in data visualization, UX research, and modern frontend architectures.' },
];

export default function AIProposalHelperPage() {
  const [generated, setGenerated] = useState(false);
  const [variant, setVariant] = useState<'full' | 'short' | 'followup'>('full');

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        {/* Input form */}
        <SectionCard title="Project Details" icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Project Title', placeholder: 'e.g. Enterprise Dashboard Redesign', icon: FileText },
                { label: 'Client / Company', placeholder: 'e.g. Acme Corp', icon: Users },
                { label: 'Budget Range', placeholder: 'e.g. $10,000 - $25,000', icon: DollarSign },
                { label: 'Timeline', placeholder: 'e.g. 8-12 weeks', icon: Clock },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[9px] font-medium mb-1 flex items-center gap-1"><f.icon className="h-2.5 w-2.5 text-muted-foreground" />{f.label}</label>
                  <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Project Description & Scope</label>
              <textarea className="w-full h-24 rounded-xl border bg-background px-3 py-2.5 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Describe the project scope, deliverables, goals, and any specific requirements..." />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[9px] font-medium mb-1 block">Your Differentiators</label>
                <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder="e.g. 8 years experience, Fortune 500 clients..." />
              </div>
              <div>
                <label className="text-[9px] font-medium mb-1 block">Tone</label>
                <div className="flex gap-1 mt-1">
                  {['Professional', 'Friendly', 'Confident', 'Technical'].map(t => (
                    <Badge key={t} variant="outline" className="text-[8px] cursor-pointer hover:bg-accent/10 rounded-lg">{t}</Badge>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setGenerated(true)} className="h-9 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Generate Proposal</Button>
              <div className="flex-1" />
              <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~8 credits</span>
            </div>
          </div>
        </SectionCard>

        {/* Output */}
        {generated && (
          <>
            {/* Variant selector */}
            <div className="flex gap-1.5">
              {[
                { key: 'full' as const, label: 'Full Proposal' },
                { key: 'short' as const, label: 'Short Version' },
                { key: 'followup' as const, label: 'Follow-Up Email' },
              ].map(v => (
                <button key={v.key} onClick={() => setVariant(v.key)} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-medium border transition-all', variant === v.key ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:bg-muted/30')}>
                  {v.label}
                </button>
              ))}
            </div>

            <SectionCard
              title="Generated Proposal"
              action={
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Copy className="h-2.5 w-2.5" />Copy</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Bookmark className="h-2.5 w-2.5" />Save</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Download className="h-2.5 w-2.5" />Export PDF</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><RefreshCw className="h-2.5 w-2.5" />Compare</Button>
                </div>
              }
              className="!rounded-2xl"
            >
              <div className="space-y-4 text-[11px] leading-relaxed">
                <h2 className="text-[16px] font-bold">Enterprise Dashboard Redesign — Proposal</h2>
                <p className="text-[10px] text-muted-foreground italic">Prepared for Acme Corp · {new Date().toLocaleDateString()}</p>
                {SECTIONS_GENERATED.map(section => (
                  <div key={section.title}>
                    <h3 className="text-[12px] font-semibold mb-1 flex items-center gap-1.5">
                      <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />{section.title}
                    </h3>
                    <p className="text-muted-foreground whitespace-pre-line">{section.content}</p>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t text-[8px] text-muted-foreground flex-wrap">
                <span>580 words</span><span>·</span><span>6 sections</span><span>·</span><span>68 tokens</span>
                <div className="flex-1" />
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><ArrowRight className="h-2.5 w-2.5" />Send to Workflow</Button>
              </div>
            </SectionCard>
          </>
        )}
      </div>

      {/* Right rail */}
      <div className="hidden lg:flex flex-col w-[200px] shrink-0 space-y-3">
        <SectionCard title="Proposal Tips" icon={<Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
          <div className="space-y-2 text-[8px] text-muted-foreground">
            <p>• Lead with the client's problem, not your solution</p>
            <p>• Include specific metrics and outcomes</p>
            <p>• Break down pricing transparently</p>
            <p>• Add social proof and case studies</p>
            <p>• End with a clear next step CTA</p>
          </div>
        </SectionCard>
        <SectionCard title="Win Rate" icon={<TrendingUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
          <div className="text-center py-2">
            <div className="text-2xl font-bold">72%</div>
            <div className="text-[8px] text-muted-foreground">AI-assisted proposals</div>
          </div>
        </SectionCard>
        <SectionCard title="Recent Proposals" className="!rounded-2xl">
          <div className="space-y-1.5">
            {['Dashboard Redesign', 'Mobile App MVP', 'API Integration'].map(p => (
              <button key={p} className="w-full text-left text-[9px] px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground">{p}</button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
