import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Handshake, MessageSquare, Send, Clock, ChevronRight, FileText, CheckCircle2, XCircle, ArrowUpRight, Users } from 'lucide-react';

const MESSAGES = [
  { sender: 'Mediator', initials: 'MED', time: '10:00 AM', text: 'Welcome to mediation for DSP-1001. I\'ve reviewed both parties\' submissions. Let\'s work toward a fair resolution.', isMediator: true },
  { sender: 'Alex M. (Client)', initials: 'AM', time: '10:15 AM', text: 'I\'m open to a partial refund if the remaining deliverables can be completed within 2 weeks.', isMediator: false },
  { sender: 'DesignCraft (Seller)', initials: 'DC', time: '10:22 AM', text: 'I can deliver the remaining 3 pages by April 28. I believe the work quality meets the original brief.', isMediator: false },
  { sender: 'Mediator', initials: 'MED', time: '10:30 AM', text: 'I\'d like to propose a compromise: seller completes the 3 remaining pages by April 28. If approved, client releases the remaining milestone. If not, we revisit the refund option.', isMediator: true },
];

const PROPOSALS = [
  { id: 1, title: 'Complete remaining work + release funds', description: 'Seller delivers 3 remaining pages by Apr 28. Client reviews and releases MS-003 upon approval.', status: 'proposed' },
  { id: 2, title: 'Partial refund + partial delivery', description: '50% refund ($2,000) + seller delivers 2 of 3 remaining pages.', status: 'rejected' },
];

export default function MediationViewPage() {
  const [proposalTab, setProposalTab] = useState<'chat' | 'proposals'>('chat');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-2 w-full">
          <Handshake className="h-4 w-4 text-accent" />
          <span className="text-[10px] text-muted-foreground cursor-pointer hover:text-foreground">Dispute DSP-1001</span>
          <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
          <span className="text-xs font-semibold">Mediation</span>
          <StatusBadge status="review" label="In Session" />
          <div className="flex-1" />
          <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground"><Users className="h-3 w-3" /><span>3 participants</span></div>
          <div className="flex items-center gap-1.5 text-[8px] text-[hsl(var(--gigvora-amber))]"><Clock className="h-3 w-3" /><span>Session: 45m</span></div>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Participants">
            {[
              { name: 'Alex M.', role: 'Client', initials: 'AM' },
              { name: 'DesignCraft', role: 'Seller', initials: 'DC' },
              { name: 'Maya R.', role: 'Mediator', initials: 'MR' },
            ].map((p, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5">
                <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{p.initials}</AvatarFallback></Avatar>
                <div><div className="text-[8px] font-semibold">{p.name}</div><div className="text-[7px] text-muted-foreground">{p.role}</div></div>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Documents">
            {['Original Contract', 'Client Evidence (3)', 'Seller Evidence (2)', 'Mediator Notes'].map((d, i) => (
              <div key={i} className="flex items-center gap-1.5 py-1 text-[8px] text-muted-foreground cursor-pointer hover:text-accent"><FileText className="h-2.5 w-2.5" />{d}</div>
            ))}
          </SectionCard>
        </div>
      }
      rightRailWidth="w-44"
    >
      <div className="flex gap-1 bg-muted/40 rounded-xl p-0.5 mb-3 w-fit">
        {(['chat', 'proposals'] as const).map(t => (
          <button key={t} onClick={() => setProposalTab(t)} className={`px-3 py-1 rounded-lg text-[9px] font-medium capitalize ${proposalTab === t ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>{t}</button>
        ))}
      </div>

      {proposalTab === 'chat' && (
        <>
          <SectionCard className="!rounded-2xl mb-3">
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {MESSAGES.map((m, i) => (
                <div key={i} className={`flex gap-2.5 ${m.isMediator ? '' : ''}`}>
                  <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className={`text-[6px] font-bold ${m.isMediator ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'}`}>{m.initials}</AvatarFallback></Avatar>
                  <div className={`flex-1 p-2.5 rounded-xl ${m.isMediator ? 'bg-accent/5 border border-accent/15' : 'bg-muted/20 border border-border/20'}`}>
                    <div className="flex items-center gap-2 mb-0.5"><span className="text-[9px] font-semibold">{m.sender}</span>{m.isMediator && <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-md">Mediator</Badge>}<span className="text-[7px] text-muted-foreground">{m.time}</span></div>
                    <p className="text-[9px] text-muted-foreground leading-relaxed">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard className="!rounded-2xl">
            <Textarea placeholder="Type your message..." className="min-h-[60px] text-xs mb-2" />
            <div className="flex justify-between">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><FileText className="h-3 w-3" />Attach</Button>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" />Send</Button>
            </div>
          </SectionCard>
        </>
      )}

      {proposalTab === 'proposals' && (
        <div className="space-y-3">
          {PROPOSALS.map(p => (
            <SectionCard key={p.id} className={`!rounded-2xl ${p.status === 'proposed' ? 'border-accent/30' : ''}`}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold">Proposal #{p.id}</span>
                <StatusBadge status={p.status === 'proposed' ? 'review' : 'blocked'} label={p.status} />
              </div>
              <h3 className="text-[10px] font-semibold mb-0.5">{p.title}</h3>
              <p className="text-[8px] text-muted-foreground mb-2">{p.description}</p>
              {p.status === 'proposed' && (
                <div className="flex gap-2">
                  <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><CheckCircle2 className="h-3 w-3" />Accept</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><XCircle className="h-3 w-3" />Reject</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><MessageSquare className="h-3 w-3" />Counter</Button>
                </div>
              )}
            </SectionCard>
          ))}
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 w-full"><ArrowUpRight className="h-3 w-3" />Escalate to Arbitration</Button>
        </div>
      )}
    </DashboardLayout>
  );
}
