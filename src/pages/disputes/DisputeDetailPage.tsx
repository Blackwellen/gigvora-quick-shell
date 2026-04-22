import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { AlertTriangle, Clock, MessageSquare, Upload, FileText, Shield, Scale, DollarSign, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const TIMELINE = [
  { date: 'Apr 14, 2026 10:00', event: 'Dispute filed', actor: 'You', type: 'system' },
  { date: 'Apr 14, 2026 10:05', event: 'Escrow funds placed on hold ($200)', actor: 'System', type: 'system' },
  { date: 'Apr 14, 2026 14:30', event: 'Respondent notified', actor: 'System', type: 'system' },
  { date: 'Apr 15, 2026 09:15', event: 'Respondent submitted evidence', actor: 'Tom H.', type: 'evidence' },
  { date: 'Apr 15, 2026 11:00', event: 'Mediator assigned — Agent Sarah', actor: 'System', type: 'system' },
  { date: 'Apr 15, 2026 15:00', event: 'Mediation session scheduled for Apr 17', actor: 'Agent Sarah', type: 'action' },
];

export default function DisputeDetailPage() {
  const [tab, setTab] = useState('timeline');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--destructive))]" />
          <Badge variant="outline" className="text-[8px] h-3.5 font-mono">DSP-1042</Badge>
          <h1 className="text-sm font-bold">Quality Issue — Logo Design Package</h1>
          <StatusBadge status="caution" label="In Mediation" />
          <div className="flex-1" />
          <KPICard label="Amount" value="$200" />
          <KPICard label="Filed" value="Apr 14" />
          <KPICard label="Days Open" value="3" />
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Parties">
            {[
              { name: 'You (Claimant)', avatar: 'YO', role: 'Buyer' },
              { name: 'Tom H. (Respondent)', avatar: 'TH', role: 'Seller' },
              { name: 'Agent Sarah (Mediator)', avatar: 'AS', role: 'Platform' },
            ].map(p => (
              <div key={p.name} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
                <Avatar className="h-6 w-6"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{p.avatar}</AvatarFallback></Avatar>
                <div>
                  <div className="text-[9px] font-medium">{p.name}</div>
                  <div className="text-[8px] text-muted-foreground">{p.role}</div>
                </div>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Escrow Hold" icon={<DollarSign className="h-3 w-3 text-accent" />}>
            <div className="space-y-1 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Held</span><span className="font-bold">$200.00</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status="caution" label="On Hold" /></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Hold Since</span><span>Apr 14</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Actions">
            <div className="space-y-1.5">
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px] gap-1"><MessageSquare className="h-3 w-3" /> Message Mediator</Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px] gap-1"><Upload className="h-3 w-3" /> Add Evidence</Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px] gap-1"><Scale className="h-3 w-3" /> Request Arbitration</Button>
              <Button variant="outline" size="sm" className="w-full h-7 text-[10px] gap-1 text-[hsl(var(--state-healthy))]"><CheckCircle2 className="h-3 w-3" /> Accept Resolution</Button>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-52"
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="timeline" className="text-[10px] px-3">Timeline</TabsTrigger>
          <TabsTrigger value="evidence" className="text-[10px] px-3">Evidence</TabsTrigger>
          <TabsTrigger value="mediation" className="text-[10px] px-3">Mediation</TabsTrigger>
          <TabsTrigger value="resolution" className="text-[10px] px-3">Resolution</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'timeline' && (
        <SectionCard title="Dispute Timeline">
          <div className="relative pl-6">
            <div className="absolute left-2 top-0 bottom-0 w-px bg-border" />
            {TIMELINE.map((t, i) => (
              <div key={i} className="relative pb-4 last:pb-0">
                <div className={`absolute left-[-20px] h-3 w-3 rounded-full ${t.type === 'system' ? 'bg-muted-foreground/30' : t.type === 'evidence' ? 'bg-[hsl(var(--gigvora-amber))]' : 'bg-accent'}`} />
                <div className="text-[8px] text-muted-foreground mb-0.5">{t.date}</div>
                <div className="text-[10px] font-medium">{t.event}</div>
                <div className="text-[9px] text-muted-foreground">by {t.actor}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-xl border border-border/40">
            <Textarea placeholder="Add a note or update..." className="min-h-[60px] text-xs mb-2" />
            <Button size="sm" className="h-7 text-[10px]">Post Update</Button>
          </div>
        </SectionCard>
      )}

      {tab === 'evidence' && (
        <SectionCard title="Evidence Files">
          <div className="space-y-2">
            {[
              { name: 'Original_Brief.pdf', by: 'You', date: 'Apr 14', size: '240 KB' },
              { name: 'Delivered_Files.zip', by: 'Tom H.', date: 'Apr 15', size: '12 MB' },
              { name: 'Chat_Log_Export.pdf', by: 'You', date: 'Apr 14', size: '180 KB' },
              { name: 'Revision_Comparison.png', by: 'Tom H.', date: 'Apr 15', size: '2.1 MB' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1">
                  <div className="text-[10px] font-medium">{f.name}</div>
                  <div className="text-[9px] text-muted-foreground">by {f.by} · {f.date} · {f.size}</div>
                </div>
                <Button variant="ghost" size="sm" className="h-6 text-[9px]">View</Button>
              </div>
            ))}
          </div>
          <div className="mt-3 p-4 rounded-xl border-2 border-dashed border-border/50 text-center cursor-pointer hover:bg-accent/5">
            <Upload className="h-5 w-5 mx-auto text-muted-foreground mb-1" />
            <p className="text-[9px] text-muted-foreground">Upload additional evidence</p>
          </div>
        </SectionCard>
      )}

      {tab === 'mediation' && (
        <div className="space-y-4">
          <SectionCard title="Mediation Session">
            <div className="p-4 rounded-xl bg-accent/5 border border-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Scale className="h-4 w-4 text-accent" />
                <span className="text-xs font-bold">Scheduled: Apr 17, 2026 at 2:00 PM</span>
              </div>
              <p className="text-[9px] text-muted-foreground mb-3">Both parties will join a facilitated session with Mediator Agent Sarah to discuss resolution options.</p>
              <Button size="sm" className="h-7 text-[10px]">Join Session</Button>
            </div>
          </SectionCard>
          <SectionCard title="Mediator Notes">
            <div className="p-3 rounded-lg bg-muted/30 text-[10px] text-muted-foreground">
              "Initial review shows both parties have valid concerns. The delivered work matches 70% of the brief requirements. Recommending a partial refund of $60 or additional revision round. Will discuss in mediation session."
              <div className="text-[8px] mt-1">— Agent Sarah, Apr 15</div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'resolution' && (
        <SectionCard title="Proposed Resolution">
          <div className="space-y-3">
            {[
              { option: 'Partial Refund', desc: '$60 refund to buyer, remaining $140 released to seller', recommended: true },
              { option: 'Full Revision', desc: 'Seller provides one additional revision round within 5 days', recommended: false },
              { option: 'Full Refund', desc: '$200 returned to buyer, order cancelled', recommended: false },
            ].map((r, i) => (
              <div key={i} className={`p-4 rounded-xl border ${r.recommended ? 'ring-2 ring-accent/30 border-accent/30' : 'border-border/40'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold">{r.option}</span>
                  {r.recommended && <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">Recommended</Badge>}
                </div>
                <p className="text-[9px] text-muted-foreground mb-2">{r.desc}</p>
                <Button size="sm" className="h-7 text-[10px]">{r.recommended ? 'Accept' : 'Choose'}</Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
