import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Scale, Clock, FileText, Shield, Gavel, CheckCircle2, AlertCircle, Eye } from 'lucide-react';

const CASES = [
  { id: 'ARB-301', dispute: 'DSP-1042', claimant: 'Emma W.', respondent: 'Tom H.', amount: '$200', status: 'under-review' as const, assigned: 'Apr 16, 2026', deadline: 'Apr 23, 2026' },
  { id: 'ARB-302', dispute: 'DSP-1038', claimant: 'Mike P.', respondent: 'Sara L.', amount: '$1,200', status: 'awaiting-evidence' as const, assigned: 'Apr 14, 2026', deadline: 'Apr 21, 2026' },
  { id: 'ARB-303', dispute: 'DSP-1035', claimant: 'Ana R.', respondent: 'James K.', amount: '$500', status: 'decision-pending' as const, assigned: 'Apr 10, 2026', deadline: 'Apr 17, 2026' },
];

const statusMap = { 'under-review': 'caution', 'awaiting-evidence': 'pending', 'decision-pending': 'review' } as const;

export default function ArbitrationReviewPage() {
  const [tab, setTab] = useState('queue');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Scale className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Arbitration Review</h1>
          <KPICard label="Active Cases" value="3" />
          <KPICard label="Avg Resolution" value="5.2 days" />
          <KPICard label="Total Value" value="$1,900" />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="queue" className="text-[10px] px-3">Case Queue</TabsTrigger>
          <TabsTrigger value="review" className="text-[10px] px-3">Under Review</TabsTrigger>
          <TabsTrigger value="decisions" className="text-[10px] px-3">Past Decisions</TabsTrigger>
          <TabsTrigger value="guidelines" className="text-[10px] px-3">Guidelines</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'queue' && (
        <SectionCard>
          {CASES.map(c => (
            <div key={c.id} className="p-4 rounded-xl border border-border/40 mb-3">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{c.id}</Badge>
                <span className="text-[11px] font-semibold">Dispute {c.dispute}</span>
                <StatusBadge status={statusMap[c.status]} label={c.status.replace('-', ' ')} />
              </div>
              <div className="flex items-center gap-4 text-[9px] text-muted-foreground mb-3">
                <span>Claimant: {c.claimant}</span>
                <span>Respondent: {c.respondent}</span>
                <span className="font-semibold text-foreground">{c.amount}</span>
                <span><Clock className="h-2.5 w-2.5 inline" /> Deadline: {c.deadline}</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-[10px] gap-1"><Eye className="h-3 w-3" /> Review Case</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><FileText className="h-3 w-3" /> View Evidence</Button>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'review' && (
        <div className="space-y-4">
          <SectionCard title="Case ARB-301 — Review Workspace">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-[10px] font-bold mb-2">Claimant Position</h4>
                <div className="p-3 rounded-lg bg-muted/30 text-[9px] text-muted-foreground">
                  "The delivered logos do not match the brief requirements. Colors are off, font choices were not discussed, and 2 of 3 concepts are unusable."
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold mb-2">Respondent Position</h4>
                <div className="p-3 rounded-lg bg-muted/30 text-[9px] text-muted-foreground">
                  "I followed the brief closely. The color variations were approved in chat. I offered a revision but the client refused."
                </div>
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Arbiter Decision">
            <div className="space-y-3">
              <div><label className="text-[10px] font-medium block mb-1">Finding</label>
                <div className="space-y-1 text-[10px]">
                  {['In favor of Claimant', 'In favor of Respondent', 'Split resolution'].map(f => (
                    <label key={f} className="flex items-center gap-2 cursor-pointer p-1.5 rounded-lg hover:bg-accent/5">
                      <input type="radio" name="finding" className="accent-accent" /><span>{f}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div><label className="text-[10px] font-medium block mb-1">Reasoning</label><Textarea placeholder="Explain your decision..." className="min-h-[80px] text-xs" /></div>
              <div><label className="text-[10px] font-medium block mb-1">Resolution Action</label><Textarea placeholder="Specify the resolution..." className="min-h-[60px] text-xs" /></div>
              <Button className="h-9 text-xs gap-1"><Gavel className="h-3 w-3" /> Issue Decision</Button>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'decisions' && (
        <SectionCard title="Past Decisions">
          {[
            { id: 'ARB-298', finding: 'Split', amount: '$800', date: 'Apr 5, 2026' },
            { id: 'ARB-295', finding: 'Claimant', amount: '$350', date: 'Mar 28, 2026' },
            { id: 'ARB-290', finding: 'Respondent', amount: '$1,500', date: 'Mar 20, 2026' },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0 text-[10px]">
              <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{d.id}</Badge>
              <span className="flex-1 font-medium">In favor of: {d.finding}</span>
              <span className="font-bold">{d.amount}</span>
              <span className="text-muted-foreground">{d.date}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'guidelines' && (
        <SectionCard title="Arbitration Guidelines">
          <div className="space-y-3 text-[10px] text-muted-foreground">
            {[
              { title: 'Evidence Standard', text: 'Decisions must be based on documented evidence. Chat logs, deliverables, and contract terms take precedence over verbal claims.' },
              { title: 'Proportionality', text: 'Resolutions should be proportional to the harm. Partial refunds are preferred when work has been partially completed.' },
              { title: 'Timeline Compliance', text: 'All decisions must be issued within 7 business days of case assignment.' },
              { title: 'Appeal Process', text: 'Either party may appeal within 3 days of a decision. Appeals are reviewed by a senior arbitrator.' },
            ].map((g, i) => (
              <div key={i} className="p-3 rounded-lg bg-muted/20">
                <div className="font-medium text-foreground mb-0.5">{g.title}</div>
                <p>{g.text}</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
