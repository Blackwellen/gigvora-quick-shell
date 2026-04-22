import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  PenLine, Sparkles, Copy, Bookmark, Share2, Download, RotateCcw,
  FileText, Mail, MessageSquare, Megaphone, Type, Users, Target,
  Wand2, Minimize2, Maximize2, RefreshCw, ChevronDown, Zap, Globe
} from 'lucide-react';

const TEMPLATES = [
  { label: 'Blog Post', icon: FileText, desc: 'Long-form SEO content' },
  { label: 'Email', icon: Mail, desc: 'Marketing & transactional' },
  { label: 'Social Post', icon: MessageSquare, desc: 'Twitter, LinkedIn, Instagram' },
  { label: 'Ad Copy', icon: Megaphone, desc: 'PPC, display, social ads' },
  { label: 'Landing Page', icon: Globe, desc: 'Hero, features, CTA blocks' },
  { label: 'Product Copy', icon: Target, desc: 'Descriptions & listings' },
];

const TONES = ['Professional', 'Casual', 'Persuasive', 'Friendly', 'Formal', 'Witty', 'Authoritative', 'Empathetic'];
const AUDIENCES = ['General', 'Technical', 'Executive', 'Creative', 'Academic', 'B2B', 'B2C', 'Gen Z'];
const LENGTHS = [
  { label: 'Short', desc: '< 200 words' },
  { label: 'Medium', desc: '200-500 words' },
  { label: 'Long', desc: '500-1000 words' },
  { label: 'Extended', desc: '1000+ words' },
];

export default function AIWriterPage() {
  const [tone, setTone] = useState('Professional');
  const [audience, setAudience] = useState('General');
  const [length, setLength] = useState('Medium');
  const [generated, setGenerated] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState('Blog Post');

  return (
    <div className="flex gap-4">
      {/* Main area */}
      <div className="flex-1 min-w-0 space-y-4">
        {/* Template selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {TEMPLATES.map(t => (
            <button
              key={t.label}
              onClick={() => setActiveTemplate(t.label)}
              className={cn(
                'rounded-2xl border p-3 text-left transition-all hover:shadow-sm',
                activeTemplate === t.label ? 'border-accent bg-accent/5 shadow-sm' : 'hover:bg-muted/30'
              )}
            >
              <t.icon className={cn('h-4 w-4 mb-1.5', activeTemplate === t.label ? 'text-accent' : 'text-muted-foreground')} />
              <div className="text-[10px] font-bold">{t.label}</div>
              <div className="text-[8px] text-muted-foreground">{t.desc}</div>
            </button>
          ))}
        </div>

        {/* Input section */}
        <SectionCard title="Content Brief" icon={<PenLine className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Topic / Title</label>
              <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder="e.g. The Future of Remote Work for Tech Professionals" />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Context & Key Points</label>
              <textarea className="w-full h-24 rounded-xl border bg-background px-3 py-2.5 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Describe what you want to write. Include key points, data, references, or specific angles you want covered..." />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Brand Voice (optional)</label>
              <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder="e.g. Innovative, data-driven, approachable..." />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setGenerated(true)} className="h-9 text-[11px] rounded-xl gap-1.5 px-5">
                <Sparkles className="h-3.5 w-3.5" />Generate
              </Button>
              <Button variant="outline" className="h-9 text-[11px] rounded-xl gap-1.5">
                <RotateCcw className="h-3.5 w-3.5" />Regenerate
              </Button>
              <div className="flex-1" />
              <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~5 credits</span>
            </div>
          </div>
        </SectionCard>

        {/* Generated output */}
        {generated && (
          <SectionCard
            title="Generated Output"
            action={
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Copy className="h-2.5 w-2.5" />Copy</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Bookmark className="h-2.5 w-2.5" />Save</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Share2 className="h-2.5 w-2.5" />Share</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Download className="h-2.5 w-2.5" />Export</Button>
              </div>
            }
            className="!rounded-2xl"
          >
            <div className="space-y-3 text-[11px] leading-relaxed">
              <h2 className="text-[16px] font-bold">The Future of Remote Work: Why 2026 Changes Everything</h2>
              <p className="text-muted-foreground">The remote work revolution is entering its next phase. After years of adaptation, companies are discovering that the real transformation was never about location — it was about how we fundamentally organize knowledge work.</p>
              <p className="text-muted-foreground">Three key trends are reshaping the landscape: AI-augmented workflows, async-first communication, and outcome-based performance metrics. Together, they are creating a new paradigm for professional productivity that renders the office-vs-remote debate obsolete.</p>
              <h3 className="text-[13px] font-semibold mt-4">1. AI-Augmented Workflows</h3>
              <p className="text-muted-foreground">The integration of AI tools into daily workflows has fundamentally changed what individual contributors can accomplish. Tasks that once required teams of specialists — from data analysis to content creation to code review — can now be handled by individuals armed with the right AI toolkit.</p>
              <h3 className="text-[13px] font-semibold mt-4">2. Async-First Communication</h3>
              <p className="text-muted-foreground">Leading companies have embraced asynchronous communication as the default mode. Real-time meetings are reserved for creative collaboration and relationship building, while decisions are made through structured documentation and async review processes.</p>
            </div>

            {/* Inline actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t flex-wrap">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Wand2 className="h-3 w-3" />Rewrite Selection</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Minimize2 className="h-3 w-3" />Shorten</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Maximize2 className="h-3 w-3" />Expand</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><RefreshCw className="h-3 w-3" />Change Tone</Button>
              <div className="flex-1" />
              <span className="text-[8px] text-muted-foreground">324 words · ~2 min read · Professional · 42 tokens</span>
            </div>
          </SectionCard>
        )}
      </div>

      {/* Right rail */}
      <div className="hidden lg:flex flex-col w-[200px] shrink-0 space-y-3">
        <SectionCard title="Tone" icon={<Type className="h-3 w-3 text-muted-foreground" />} className="!rounded-2xl">
          <div className="flex flex-wrap gap-1">
            {TONES.map(t => (
              <button key={t} onClick={() => setTone(t)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-all border', tone === t ? 'border-accent bg-accent/10 text-accent shadow-sm' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30')}>{t}</button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Audience" icon={<Users className="h-3 w-3 text-muted-foreground" />} className="!rounded-2xl">
          <div className="flex flex-wrap gap-1">
            {AUDIENCES.map(a => (
              <button key={a} onClick={() => setAudience(a)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-all border', audience === a ? 'border-accent bg-accent/10 text-accent shadow-sm' : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30')}>{a}</button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Length" className="!rounded-2xl">
          <div className="space-y-1">
            {LENGTHS.map(l => (
              <button key={l.label} onClick={() => setLength(l.label)} className={cn('w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-[9px] transition-all', length === l.label ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:bg-muted/30')}>
                <span>{l.label}</span>
                <span className="text-[7px] opacity-60">{l.desc}</span>
              </button>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Language" className="!rounded-2xl">
          <div className="flex items-center gap-2 px-1">
            <Globe className="h-3 w-3 text-muted-foreground" />
            <span className="text-[10px] font-medium">English (US)</span>
            <ChevronDown className="h-2.5 w-2.5 text-muted-foreground ml-auto" />
          </div>
        </SectionCard>

        <SectionCard title="Version History" className="!rounded-2xl">
          <div className="space-y-1 text-[8px]">
            {['v3 — Current', 'v2 — Casual rewrite', 'v1 — Original'].map(v => (
              <div key={v} className="flex items-center gap-1.5 px-1 py-1 rounded-lg hover:bg-muted/30 cursor-pointer transition-colors">
                <div className={cn('h-1.5 w-1.5 rounded-full', v.includes('Current') ? 'bg-accent' : 'bg-muted-foreground/30')} />
                <span className="text-muted-foreground">{v}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
