import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle, ArrowUp, Shield, Clock, MessageSquare,
  Phone, Mail, Upload, ArrowRight, Calendar, Users,
  CreditCard, Lock, Video,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type EscCategory = 'payment' | 'access' | 'security' | 'booking' | 'content' | 'account';

interface Escalation {
  id: string; subject: string; category: EscCategory; severity: 'high' | 'critical';
  status: 'submitted' | 'reviewing' | 'action-taken' | 'resolved';
  created: string; linkedTicket?: string; response?: string;
}

const CAT_ICONS: Record<EscCategory, React.ElementType> = {
  payment: CreditCard, access: Lock, security: Shield, booking: Calendar, content: Video, account: Users,
};
const CAT_COLORS: Record<EscCategory, string> = {
  payment: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  access: 'bg-accent/10 text-accent',
  security: 'bg-destructive/10 text-destructive',
  booking: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  content: 'bg-[hsl(var(--gigvora-green))]/10 text-[hsl(var(--gigvora-green))]',
  account: 'bg-muted text-muted-foreground',
};

const ESCALATIONS: Escalation[] = [
  { id: 'ESC-001', subject: 'Double charged for webinar ticket — refund not processed', category: 'payment', severity: 'critical', status: 'reviewing', created: '2 hours ago', linkedTicket: 'TKT-2026-0142', response: 'Our finance team is reviewing the duplicate charge. Expected resolution within 24h.' },
  { id: 'ESC-002', subject: 'Mentor session recording deleted without notice', category: 'content', severity: 'high', status: 'action-taken', created: '1 day ago', linkedTicket: 'TKT-2026-0130', response: 'Recording has been recovered from backup. Access restored.' },
  { id: 'ESC-003', subject: 'Account locked after password reset — cannot access', category: 'security', severity: 'critical', status: 'submitted', created: '4 hours ago' },
  { id: 'ESC-004', subject: 'Booking confirmed but mentor says no record exists', category: 'booking', severity: 'high', status: 'resolved', created: '3 days ago', linkedTicket: 'TKT-2026-0125', response: 'Sync issue identified and fixed. Booking re-confirmed with mentor.' },
];

const STATUS_MAP = {
  submitted: { cls: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', label: 'Submitted' },
  reviewing: { cls: 'bg-accent/10 text-accent', label: 'Under Review' },
  'action-taken': { cls: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', label: 'Action Taken' },
  resolved: { cls: 'bg-muted text-muted-foreground', label: 'Resolved' },
};

export default function EscalationsPage() {
  const [showForm, setShowForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<EscCategory | null>(null);

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="What Gets Escalated?">
        <div className="space-y-1.5 text-[9px] text-muted-foreground">
          <p className="flex items-center gap-1"><CreditCard className="h-2.5 w-2.5" /> Payment failures, double charges, refund delays</p>
          <p className="flex items-center gap-1"><Lock className="h-2.5 w-2.5" /> Account lockouts, access denials after purchase</p>
          <p className="flex items-center gap-1"><Shield className="h-2.5 w-2.5" /> Security breaches, unauthorized account changes</p>
          <p className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" /> Booking disputes, missing sessions</p>
          <p className="flex items-center gap-1"><Video className="h-2.5 w-2.5" /> Content removal, missing recordings</p>
        </div>
      </SectionCard>
      <SectionCard title="Contact Options">
        <div className="space-y-1.5">
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Mail className="h-3 w-3" /> Email Support</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Phone className="h-3 w-3" /> Request Callback</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><MessageSquare className="h-3 w-3" /> Live Chat</Button>
        </div>
      </SectionCard>
      <SectionCard title="Response Commitment">
        <div className="text-center py-2">
          <div className="text-xl font-bold text-destructive">&lt; 4h</div>
          <div className="text-[9px] text-muted-foreground">Critical escalations</div>
          <div className="text-lg font-bold mt-2 text-[hsl(var(--gigvora-amber))]">&lt; 12h</div>
          <div className="text-[9px] text-muted-foreground">High priority</div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={
      <>
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <span className="text-xs font-semibold">Escalations</span>
        <div className="flex-1" />
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="h-7 text-[10px] rounded-xl gap-1">
          <ArrowUp className="h-3 w-3" /> {showForm ? 'View Escalations' : 'New Escalation'}
        </Button>
        <Link to="/help/tickets" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Tickets <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    } rightRail={rightRail} rightRailWidth="w-52">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Active" value={String(ESCALATIONS.filter(e => e.status !== 'resolved').length)} />
        <KPICard label="Critical" value={String(ESCALATIONS.filter(e => e.severity === 'critical').length)} />
        <KPICard label="Resolved" value={String(ESCALATIONS.filter(e => e.status === 'resolved').length)} />
        <KPICard label="Avg. Response" value="3.5h" />
      </div>

      {showForm ? (
        <SectionCard title="Submit Escalation" icon={<ArrowUp className="h-3.5 w-3.5 text-destructive" />}>
          <div className="space-y-3">
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground">Category</label>
              <div className="grid grid-cols-3 gap-2 mt-1.5">
                {(['payment', 'access', 'security', 'booking', 'content', 'account'] as EscCategory[]).map(cat => {
                  const Icon = CAT_ICONS[cat];
                  return (
                    <button key={cat} onClick={() => setSelectedCategory(cat)} className={cn(
                      'p-3 rounded-xl border text-center transition-all capitalize',
                      selectedCategory === cat ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border/30 hover:border-accent/30'
                    )}>
                      <Icon className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                      <span className="text-[9px] font-semibold">{cat}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground">Subject</label>
              <Input placeholder="Briefly describe the issue..." className="h-8 text-xs mt-1" />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground">Detailed Description</label>
              <Textarea placeholder="Include what happened, when, and what you've already tried..." className="min-h-[100px] text-xs mt-1" />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground">Linked Ticket (optional)</label>
              <Input placeholder="TKT-2026-XXXX" className="h-8 text-xs mt-1" />
            </div>
            <div>
              <label className="text-[9px] font-semibold text-muted-foreground">Evidence (optional)</label>
              <div className="mt-1 p-4 rounded-xl border-2 border-dashed border-border/40 text-center hover:border-accent/30 transition-all cursor-pointer">
                <Upload className="h-6 w-6 text-muted-foreground/30 mx-auto mb-1" />
                <p className="text-[9px] text-muted-foreground">Screenshots, receipts, or relevant files</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowForm(false)} className="flex-1 h-9 rounded-xl text-[10px]">Cancel</Button>
              <Button className="flex-1 h-9 rounded-xl text-[10px] gap-1 bg-destructive hover:bg-destructive/80">
                <ArrowUp className="h-3.5 w-3.5" /> Submit Escalation
              </Button>
            </div>
          </div>
        </SectionCard>
      ) : (
        <div className="space-y-2">
          {ESCALATIONS.map(e => {
            const Icon = CAT_ICONS[e.category];
            const st = STATUS_MAP[e.status];
            return (
              <div key={e.id} className="p-4 rounded-2xl border border-border/30 hover:border-accent/30 transition-all bg-card">
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', CAT_COLORS[e.category])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-bold truncate">{e.subject}</span>
                      <Badge className={cn('text-[7px] h-3.5 border-0', st.cls)}>{st.label}</Badge>
                      <Badge className={cn('text-[7px] h-3.5 border-0', e.severity === 'critical' ? 'bg-destructive/10 text-destructive' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>
                        {e.severity}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                      <span className="font-mono">{e.id}</span>
                      <span className="capitalize">{e.category}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{e.created}</span>
                      {e.linkedTicket && <Badge variant="outline" className="text-[6px] h-3">{e.linkedTicket}</Badge>}
                    </div>
                  </div>
                </div>
                {e.response && (
                  <div className="ml-12 p-2.5 rounded-xl bg-[hsl(var(--state-healthy))]/5 border border-[hsl(var(--state-healthy))]/10">
                    <div className="text-[8px] font-semibold text-[hsl(var(--state-healthy))] mb-0.5 flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" /> Response</div>
                    <p className="text-[9px] text-muted-foreground">{e.response}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
