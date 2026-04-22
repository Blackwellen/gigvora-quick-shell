import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Mail, MessageSquare, Zap, Plus, Copy, Pencil, Trash2,
  TrendingUp, Clock, Filter, BarChart3, Send,
} from 'lucide-react';

interface Template {
  id: string; name: string; type: 'email' | 'inmail' | 'sequence';
  subject?: string; preview: string; openRate: number; replyRate: number;
  sent: number; steps?: number; lastUsed: string;
}

const TEMPLATES: Template[] = [
  { id: 'T1', name: 'Senior Engineer Outreach', type: 'email', subject: 'Exciting opportunity at {{company}}', preview: 'Hi {{first_name}}, I came across your profile and was impressed by your work at {{current_company}}...', openRate: 68, replyRate: 24, sent: 342, lastUsed: '2h ago' },
  { id: 'T2', name: 'Executive InMail', type: 'inmail', preview: '{{first_name}}, your leadership at {{current_company}} caught my attention. We have a confidential C-level opportunity...', openRate: 55, replyRate: 18, sent: 87, lastUsed: '1d ago' },
  { id: 'T3', name: '3-Step Nurture Sequence', type: 'sequence', preview: 'Step 1: Initial outreach → Step 2: Value add (3 days) → Step 3: Soft close (5 days)', openRate: 72, replyRate: 31, sent: 156, steps: 3, lastUsed: '4h ago' },
  { id: 'T4', name: 'Passive Candidate Re-engage', type: 'email', subject: 'Still interested in {{role_title}}?', preview: 'Hi {{first_name}}, we spoke {{months_ago}} months ago about opportunities. I wanted to share an exciting new role...', openRate: 45, replyRate: 12, sent: 210, lastUsed: '3d ago' },
  { id: 'T5', name: '5-Step Full Funnel', type: 'sequence', preview: 'Step 1: Cold intro → Step 2: Case study → Step 3: Team intro → Step 4: Role deep-dive → Step 5: Close', openRate: 61, replyRate: 28, sent: 98, steps: 5, lastUsed: '1d ago' },
];

const TYPE_STYLES: Record<string, { icon: React.ElementType; color: string }> = {
  email: { icon: Mail, color: 'bg-accent/10 text-accent' },
  inmail: { icon: MessageSquare, color: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]' },
  sequence: { icon: Zap, color: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]' },
};

const RecruiterOutreachTemplatesPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState<'all' | 'email' | 'inmail' | 'sequence'>('all');
  const filtered = TEMPLATES.filter(t => typeFilter === 'all' || t.type === typeFilter);

  const topStrip = (
    <>
      <Mail className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Recruiter Pro — Outreach Templates</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'email', 'inmail', 'sequence'] as const).map(f => (
          <button key={f} onClick={() => setTypeFilter(f)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', typeFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Template</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Performance" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Open Rate</span><span className="font-semibold">{Math.round(TEMPLATES.reduce((s, t) => s + t.openRate, 0) / TEMPLATES.length)}%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Reply Rate</span><span className="font-semibold">{Math.round(TEMPLATES.reduce((s, t) => s + t.replyRate, 0) / TEMPLATES.length)}%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Sent</span><span className="font-semibold">{TEMPLATES.reduce((s, t) => s + t.sent, 0).toLocaleString()}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Tips" className="!rounded-2xl">
        <div className="text-[9px] text-muted-foreground space-y-1 leading-relaxed">
          <p>• Personalize with merge tags for 2x reply rates</p>
          <p>• Sequences with 3-5 steps perform best</p>
          <p>• A/B test subject lines monthly</p>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Templates" value={String(TEMPLATES.length)} change="Active" className="!rounded-2xl" />
        <KPICard label="Sequences" value={String(TEMPLATES.filter(t => t.type === 'sequence').length)} change="Multi-step" className="!rounded-2xl" />
        <KPICard label="Best Open Rate" value={`${Math.max(...TEMPLATES.map(t => t.openRate))}%`} change="Top performer" className="!rounded-2xl" />
        <KPICard label="Best Reply Rate" value={`${Math.max(...TEMPLATES.map(t => t.replyRate))}%`} change="Top performer" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(template => {
          const { icon: Icon, color } = TYPE_STYLES[template.type];
          return (
            <div key={template.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', color)}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold">{template.name}</span>
                    <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', color)}>{template.type}</Badge>
                    {template.steps && <Badge variant="outline" className="text-[7px] rounded-lg">{template.steps} steps</Badge>}
                  </div>
                  {template.subject && <div className="text-[9px] text-muted-foreground mt-0.5">Subject: {template.subject}</div>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Pencil className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Copy className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>

              <div className="text-[9px] text-muted-foreground bg-muted/30 rounded-xl p-2.5 mb-3 leading-relaxed">{template.preview}</div>

              <div className="flex items-center gap-4 text-[9px]">
                <div className="flex items-center gap-1"><TrendingUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span className="font-semibold">{template.openRate}%</span><span className="text-muted-foreground">open</span></div>
                <div className="flex items-center gap-1"><BarChart3 className="h-3 w-3 text-accent" /><span className="font-semibold">{template.replyRate}%</span><span className="text-muted-foreground">reply</span></div>
                <div className="flex items-center gap-1"><Send className="h-3 w-3 text-muted-foreground" /><span className="font-semibold">{template.sent}</span><span className="text-muted-foreground">sent</span></div>
                <div className="flex-1" />
                <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{template.lastUsed}</span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default RecruiterOutreachTemplatesPage;
