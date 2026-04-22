import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, Star, MessageSquare, Calendar, Sparkles, MapPin, Briefcase, ChevronRight } from 'lucide-react';

const MENTORS = [
  { name: 'Sarah Chen', role: 'Senior Product Manager', company: 'Google', location: 'Remote', match: 95, rating: 4.9, sessions: 120, expertise: ['Product Strategy', 'User Research', 'Career Growth'] },
  { name: 'James Wilson', role: 'Staff Engineer', company: 'Stripe', location: 'San Francisco', match: 91, rating: 4.8, sessions: 85, expertise: ['System Design', 'React', 'Career Transition'] },
  { name: 'Priya Sharma', role: 'Design Director', company: 'Figma', location: 'London', match: 88, rating: 4.9, sessions: 200, expertise: ['UX Design', 'Design Systems', 'Portfolio Review'] },
  { name: 'Marcus Johnson', role: 'Data Science Lead', company: 'Netflix', location: 'Remote', match: 84, rating: 4.7, sessions: 64, expertise: ['Machine Learning', 'Python', 'Interview Prep'] },
];

export default function MentorMatchingPage() {
  return (
    <LaunchpadShell>
      <div className="mb-4"><h1 className="text-lg font-bold">Mentors</h1><p className="text-[11px] text-muted-foreground">Find mentors matched to your goals and career path</p></div>
      <KPIBand className="mb-3">
        <KPICard label="Available Mentors" value="86" className="!rounded-2xl" />
        <KPICard label="Your Matches" value={String(MENTORS.length)} className="!rounded-2xl" />
        <KPICard label="Sessions Booked" value="2" className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.8" className="!rounded-2xl" />
      </KPIBand>
      <div className="space-y-2.5">
        {MENTORS.map((m, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11 rounded-xl shrink-0"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[11px] font-bold">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] font-bold">{m.name}</span>
                  <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{m.match}% match</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-2 mb-1">
                  <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{m.role} at {m.company}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{m.location}</span>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-1.5">
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{m.rating}</span>
                  <span>{m.sessions} sessions</span>
                </div>
                <div className="flex flex-wrap gap-1">{m.expertise.map(e => <Badge key={e} variant="outline" className="text-[7px] h-3.5 rounded-md">{e}</Badge>)}</div>
              </div>
              <div className="flex flex-col gap-1">
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Calendar className="h-3 w-3" />Book</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><MessageSquare className="h-3 w-3" />Message</Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </LaunchpadShell>
  );
}
