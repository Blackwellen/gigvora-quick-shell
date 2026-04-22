import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Mail, Plus, Copy, Edit, Trash2, Eye, BarChart3, Clock, Zap,
  MessageSquare, Send, Star, MoreHorizontal, FileText, Users,
} from 'lucide-react';

interface Template {
  id: string; name: string; subject: string; type: 'email' | 'inmail' | 'sequence';
  category: string; opens: number; replies: number; sent: number;
  status: 'active' | 'draft' | 'archived'; updated: string; steps?: number;
}

const TEMPLATES: Template[] = [
  { id: 'T1', name: 'Cold Outreach — Engineering Leaders', subject: 'Quick question about your engineering roadmap', type: 'sequence', category: 'Recruiting', opens: 342, replies: 67, sent: 480, status: 'active', updated: '1d ago', steps: 4 },
  { id: 'T2', name: 'Warm Introduction — Mutual Connection', subject: '{{mutual_name}} suggested I reach out', type: 'email', category: 'Sales', opens: 218, replies: 89, sent: 250, status: 'active', updated: '3d ago' },
  { id: 'T3', name: 'Follow-Up After Event', subject: 'Great meeting you at {{event_name}}', type: 'email', category: 'Networking', opens: 156, replies: 42, sent: 200, status: 'active', updated: '1w ago' },
  { id: 'T4', name: 'InMail — Product Demo Request', subject: 'Saw your interest in {{product_area}}', type: 'inmail', category: 'Sales', opens: 89, replies: 23, sent: 120, status: 'active', updated: '2d ago' },
  { id: 'T5', name: 'Re-engagement — Past Candidates', subject: 'Exciting update from {{company}}', type: 'sequence', category: 'Recruiting', opens: 0, replies: 0, sent: 0, status: 'draft', updated: '5d ago', steps: 3 },
];

const TYPE_COLORS: Record<string, string> = {
  email: 'bg-accent/10 text-accent',
  inmail: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  sequence: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
};

const NavigatorOutreachTemplatesPage: React.FC = () => {
  const [filter, setFilter] = useState<'all' | 'email' | 'inmail' | 'sequence'>('all');
  const filtered = TEMPLATES.filter(t => filter === 'all' || t.type === filter);
  const totalSent = TEMPLATES.reduce((s, t) => s + t.sent, 0);
  const totalReplies = TEMPLATES.reduce((s, t) => s + t.replies, 0);

  const topStrip = (
    <>
      <FileText className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Navigator — Outreach Templates</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'email', 'inmail', 'sequence'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', filter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Template</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Performance" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Total Sent</span><span className="font-semibold">{totalSent}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Open Rate</span><span className="font-semibold">{totalSent ? Math.round(TEMPLATES.reduce((s, t) => s + t.opens, 0) / totalSent * 100) : 0}%</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Reply Rate</span><span className="font-semibold">{totalSent ? Math.round(totalReplies / totalSent * 100) : 0}%</span></div>
        </div>
      </SectionCard>
      <SectionCard title="By Category" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {['Sales', 'Recruiting', 'Networking'].map(cat => (
            <div key={cat} className="flex justify-between"><span className="text-muted-foreground">{cat}</span><span className="font-semibold">{TEMPLATES.filter(t => t.category === cat).length}</span></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Variables" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {['{{first_name}}', '{{company}}', '{{role}}', '{{mutual_name}}', '{{event_name}}'].map(v => (
            <Badge key={v} variant="outline" className="text-[7px] h-4 rounded-lg font-mono">{v}</Badge>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Templates" value={String(TEMPLATES.length)} change={`${TEMPLATES.filter(t => t.status === 'active').length} active`} className="!rounded-2xl" />
        <KPICard label="Total Sent" value={String(totalSent)} change="This quarter" className="!rounded-2xl" />
        <KPICard label="Reply Rate" value={`${totalSent ? Math.round(totalReplies / totalSent * 100) : 0}%`} change="↑ 4% vs last quarter" className="!rounded-2xl" />
        <KPICard label="Sequences" value={String(TEMPLATES.filter(t => t.type === 'sequence').length)} change={`${TEMPLATES.filter(t => t.type === 'sequence').reduce((s, t) => s + (t.steps || 0), 0)} total steps`} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(tmpl => (
          <div key={tmpl.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-2.5">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', TYPE_COLORS[tmpl.type])}>
                {tmpl.type === 'sequence' ? <Zap className="h-4 w-4" /> : tmpl.type === 'inmail' ? <MessageSquare className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold truncate">{tmpl.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', TYPE_COLORS[tmpl.type])}>{tmpl.type}</Badge>
                  <StatusBadge status={tmpl.status === 'active' ? 'healthy' : tmpl.status === 'draft' ? 'pending' : 'blocked'} label={tmpl.status} />
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="font-mono truncate">{tmpl.subject}</span>
                  <span>·</span>
                  <span>{tmpl.category}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{tmpl.updated}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Edit className="h-3 w-3" />Edit</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Copy className="h-3 w-3" />Clone</Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            {tmpl.type === 'sequence' && tmpl.steps && (
              <div className="flex items-center gap-2 mb-2.5">
                {Array.from({ length: tmpl.steps }).map((_, i) => (
                  <React.Fragment key={i}>
                    <div className="h-6 w-6 rounded-lg bg-muted/50 flex items-center justify-center text-[8px] font-bold">{i + 1}</div>
                    {i < tmpl.steps! - 1 && <div className="h-px w-4 bg-border" />}
                  </React.Fragment>
                ))}
                <span className="text-[8px] text-muted-foreground ml-1">{tmpl.steps} steps</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Sent', v: tmpl.sent, icon: Send },
                { l: 'Opens', v: tmpl.opens, rate: tmpl.sent ? Math.round(tmpl.opens / tmpl.sent * 100) : 0, icon: Eye },
                { l: 'Replies', v: tmpl.replies, rate: tmpl.sent ? Math.round(tmpl.replies / tmpl.sent * 100) : 0, icon: MessageSquare },
              ].map(m => (
                <div key={m.l} className="rounded-xl bg-muted/30 p-2.5">
                  <div className="flex items-center gap-1 text-[9px] mb-0.5">
                    <m.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{m.l}</span>
                  </div>
                  <div className="text-[11px] font-bold">
                    {m.v}{m.rate !== undefined && <span className="text-[9px] text-muted-foreground font-normal ml-1">({m.rate}%)</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorOutreachTemplatesPage;
