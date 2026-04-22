import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  StickyNote, Zap, Lock, Eye, Plus, Clock, User,
  ThumbsUp, ThumbsDown, AlertTriangle, Star, Filter, Search,
} from 'lucide-react';

type NoteVisibility = 'private' | 'team' | 'hiring-manager';
type SignalType = 'strong-yes' | 'yes' | 'maybe' | 'no' | 'strong-no';

interface CandidateNote {
  id: string; candidateName: string; candidateInitials: string; role: string;
  author: string; authorRole: string; content: string;
  visibility: NoteVisibility; signal: SignalType;
  timestamp: string; tags: string[];
}

const NOTES: CandidateNote[] = [
  { id: 'N1', candidateName: 'Sarah Chen', candidateInitials: 'SC', role: 'Senior Frontend Engineer', author: 'You', authorRole: 'Recruiter', content: 'Excellent technical depth. 8 years React/TS experience. Currently at Stripe, open to new opportunities. Salary expectation: $180-200K. Available to start in 4 weeks.', visibility: 'team', signal: 'strong-yes', timestamp: '1h ago', tags: ['technical', 'compensation', 'availability'] },
  { id: 'N2', candidateName: 'Marcus Johnson', candidateInitials: 'MJ', role: 'Engineering Manager', author: 'Lisa Park', authorRole: 'Hiring Manager', content: 'Strong leadership signals from panel interview. Team felt he would be a culture add. Concerns about gap in distributed systems experience. Schedule follow-up with VP Eng.', visibility: 'hiring-manager', signal: 'yes', timestamp: '3h ago', tags: ['interview-feedback', 'culture', 'follow-up'] },
  { id: 'N3', candidateName: 'Priya Patel', candidateInitials: 'PP', role: 'Staff Engineer', author: 'You', authorRole: 'Recruiter', content: 'Passive candidate. Responded positively to initial outreach. Currently at Google L6. Would need significant comp uplift to move. Consider equity-heavy package.', visibility: 'private', signal: 'maybe', timestamp: '1d ago', tags: ['passive', 'compensation', 'sourcing'] },
  { id: 'N4', candidateName: 'Alex Rivera', candidateInitials: 'AR', role: 'Senior Backend Engineer', author: 'Tom Wright', authorRole: 'Technical Interviewer', content: 'Struggled with system design question. Good coding skills but lacks architecture depth for senior level. Might be better fit for mid-level role.', visibility: 'team', signal: 'no', timestamp: '2d ago', tags: ['interview-feedback', 'level-mismatch'] },
];

const SIGNAL_CONFIG: Record<SignalType, { label: string; icon: React.ElementType; color: string }> = {
  'strong-yes': { label: 'Strong Yes', icon: ThumbsUp, color: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' },
  'yes': { label: 'Yes', icon: ThumbsUp, color: 'bg-accent/10 text-accent' },
  'maybe': { label: 'Maybe', icon: AlertTriangle, color: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]' },
  'no': { label: 'No', icon: ThumbsDown, color: 'bg-destructive/10 text-destructive' },
  'strong-no': { label: 'Strong No', icon: ThumbsDown, color: 'bg-destructive/20 text-destructive' },
};

const VIS_CONFIG: Record<NoteVisibility, { label: string; icon: React.ElementType; color: string }> = {
  private: { label: 'Private', icon: Lock, color: 'bg-muted text-muted-foreground' },
  team: { label: 'Team', icon: Eye, color: 'bg-accent/10 text-accent' },
  'hiring-manager': { label: 'Hiring Manager', icon: User, color: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]' },
};

const RecruiterCandidateNotesPage: React.FC = () => {
  const [visFilter, setVisFilter] = useState<'all' | NoteVisibility>('all');
  const filtered = NOTES.filter(n => visFilter === 'all' || n.visibility === visFilter);

  const topStrip = (
    <>
      <StickyNote className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Recruiter Pro — Candidate Notes & Signals</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'private', 'team', 'hiring-manager'] as const).map(f => (
          <button key={f} onClick={() => setVisFilter(f)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', visFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f === 'hiring-manager' ? 'HM Only' : f}</button>
        ))}
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Add Note</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Signal Summary" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(Object.entries(SIGNAL_CONFIG) as [SignalType, typeof SIGNAL_CONFIG[SignalType]][]).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <Badge className={cn('text-[7px] border-0 rounded-lg w-16 justify-center', cfg.color)}>{cfg.label}</Badge>
              <span className="font-semibold">{NOTES.filter(n => n.signal === key).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Permissions" className="!rounded-2xl">
        <div className="text-[9px] text-muted-foreground space-y-1 leading-relaxed">
          <p><Lock className="h-2.5 w-2.5 inline mr-0.5" />Private notes visible only to you</p>
          <p><Eye className="h-2.5 w-2.5 inline mr-0.5" />Team notes shared with hiring team</p>
          <p><User className="h-2.5 w-2.5 inline mr-0.5" />HM notes visible to hiring managers</p>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Total Notes" value={String(NOTES.length)} change="This month" className="!rounded-2xl" />
        <KPICard label="Strong Yes" value={String(NOTES.filter(n => n.signal === 'strong-yes').length)} change="Top candidates" className="!rounded-2xl" />
        <KPICard label="Private" value={String(NOTES.filter(n => n.visibility === 'private').length)} change="Your eyes only" className="!rounded-2xl" />
        <KPICard label="Candidates" value={String(new Set(NOTES.map(n => n.candidateName)).size)} change="With notes" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(note => {
          const sig = SIGNAL_CONFIG[note.signal];
          const vis = VIS_CONFIG[note.visibility];
          const SigIcon = sig.icon;
          const VisIcon = vis.icon;
          return (
            <div key={note.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3 mb-2.5">
                <Avatar className="h-10 w-10 rounded-2xl"><AvatarFallback className="rounded-2xl text-[10px] font-bold bg-accent/10 text-accent">{note.candidateInitials}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[12px] font-bold">{note.candidateName}</span>
                    <Badge className={cn('text-[7px] border-0 rounded-lg gap-0.5', sig.color)}><SigIcon className="h-2 w-2" />{sig.label}</Badge>
                    <Badge className={cn('text-[7px] border-0 rounded-lg gap-0.5', vis.color)}><VisIcon className="h-2 w-2" />{vis.label}</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{note.role}</div>
                </div>
                <div className="text-right">
                  <div className="text-[9px] font-medium">{note.author}</div>
                  <div className="text-[8px] text-muted-foreground">{note.authorRole}</div>
                </div>
              </div>

              <div className="text-[10px] bg-muted/30 rounded-xl p-3 mb-2.5 leading-relaxed">{note.content}</div>

              <div className="flex items-center gap-2 flex-wrap">
                {note.tags.map(tag => <Badge key={tag} variant="outline" className="text-[7px] h-4 rounded-lg">{tag}</Badge>)}
                <div className="flex-1" />
                <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{note.timestamp}</span>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default RecruiterCandidateNotesPage;
