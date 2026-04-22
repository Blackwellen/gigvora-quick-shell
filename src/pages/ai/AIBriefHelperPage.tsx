import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  ClipboardList, Sparkles, Copy, Bookmark, Download, CheckCircle, Zap,
  Target, Users, DollarSign, Clock, MapPin, ArrowRight, RefreshCw
} from 'lucide-react';

const BRIEF_SECTIONS = ['Overview', 'Objectives & Goals', 'Scope & Deliverables', 'Timeline & Milestones', 'Budget Breakdown', 'Success Criteria', 'Risks & Dependencies', 'Ideal Candidate Profile'];

export default function AIBriefHelperPage() {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        <SectionCard title="Brief Inputs" icon={<ClipboardList className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Project Name', placeholder: 'Mobile App Redesign', icon: Target },
                { label: 'Client / Team', placeholder: 'StartupCo', icon: Users },
                { label: 'Budget', placeholder: '$15,000', icon: DollarSign },
                { label: 'Duration', placeholder: '6 weeks', icon: Clock },
                { label: 'Team Size', placeholder: '2-3 developers', icon: Users },
                { label: 'Location Model', placeholder: 'Remote', icon: MapPin },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[9px] font-medium mb-1 flex items-center gap-1"><f.icon className="h-2.5 w-2.5 text-muted-foreground" />{f.label}</label>
                  <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Objectives & Desired Outputs</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2.5 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="What are the key goals, deliverables, and success metrics?" />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Skill Tags</label>
              <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder="React, TypeScript, Mobile, UI/UX..." />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setGenerated(true)} className="h-9 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Generate Brief</Button>
              <div className="flex-1" />
              <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~6 credits</span>
            </div>
          </div>
        </SectionCard>

        {generated && (
          <SectionCard
            title="Generated Project Brief"
            action={
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Copy className="h-2.5 w-2.5" />Copy</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Bookmark className="h-2.5 w-2.5" />Save</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Download className="h-2.5 w-2.5" />Export</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><RefreshCw className="h-2.5 w-2.5" />Compare</Button>
              </div>
            }
            className="!rounded-2xl"
          >
            <div className="space-y-3.5 text-[11px] leading-relaxed">
              <h2 className="text-[16px] font-bold">Mobile App Redesign — Project Brief</h2>
              {BRIEF_SECTIONS.map(section => (
                <div key={section}>
                  <h3 className="text-[12px] font-semibold mb-1 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />{section}
                  </h3>
                  <p className="text-muted-foreground">Detailed, actionable content for {section.toLowerCase()} including specific metrics, timelines, and deliverables tailored to this project scope...</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t flex-wrap">
              <span className="text-[8px] text-muted-foreground">490 words · 8 sections · 58 tokens</span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><ArrowRight className="h-2.5 w-2.5" />Send to Project Builder</Button>
            </div>
          </SectionCard>
        )}
      </div>

      <div className="hidden lg:flex flex-col w-[200px] shrink-0 space-y-3">
        <SectionCard title="Brief Quality" className="!rounded-2xl">
          <div className="text-center py-2">
            <div className="text-2xl font-bold text-[hsl(var(--state-healthy))]">92%</div>
            <div className="text-[8px] text-muted-foreground">Completeness score</div>
          </div>
        </SectionCard>
        <SectionCard title="Suggestions" className="!rounded-2xl">
          <div className="space-y-2 text-[8px] text-muted-foreground">
            <p>• Add specific acceptance criteria per deliverable</p>
            <p>• Define communication cadence</p>
            <p>• Include NDAs or IP clauses</p>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
