import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Bookmark, ChevronRight, Briefcase, Users, Trophy, Calendar, MapPin, Clock, Star } from 'lucide-react';

const SAVED = [
  { title: 'Junior Frontend Developer', type: 'Entry Level', company: 'TechCorp', saved: '2d ago', match: 92 },
  { title: 'UX Design Apprenticeship', type: 'Apprenticeship', company: 'DesignFlow', saved: '3d ago', match: 85 },
  { title: 'Design Portfolio Challenge', type: 'Challenge', company: 'Gigvora', saved: '1w ago', match: 88 },
  { title: 'Graduate Product Pathway', type: 'Pathway', company: 'Gigvora Academy', saved: '1w ago', match: 95 },
  { title: 'Sarah Chen (Mentor)', type: 'Mentor', company: 'Google', saved: '5d ago', match: 95 },
  { title: 'Portfolio Review Workshop', type: 'Event', company: 'DesignFlow', saved: '2d ago', match: 90 },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  'Entry Level': Briefcase, Apprenticeship: Briefcase, Challenge: Trophy,
  Pathway: Star, Mentor: Users, Event: Calendar,
};

export default function LaunchpadSavedPage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Saved</h1>
          <p className="text-[11px] text-muted-foreground">{SAVED.length} saved items across opportunities, mentors, and events</p>
        </div>
      </div>

      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Opportunities', 'Challenges', 'Pathways', 'Mentors', 'Events'].map(t => (
          <Badge key={t} variant="outline" className="text-[9px] rounded-xl px-3 py-1.5 cursor-pointer hover:bg-accent/10 shrink-0">{t}</Badge>
        ))}
      </div>

      <div className="space-y-2.5">
        {SAVED.map((s, i) => {
          const Icon = TYPE_ICONS[s.type] || Briefcase;
          return (
            <div key={i} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{s.title}</span>
                    <Badge variant="outline" className="text-[7px] rounded-md">{s.type}</Badge>
                    <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{s.match}% match</Badge>
                  </div>
                  <div className="text-[8px] text-muted-foreground">{s.company} · Saved {s.saved}</div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <Button size="sm" className="h-7 text-[9px] rounded-xl">View</Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-accent"><Bookmark className="h-3.5 w-3.5 fill-current" /></Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </LaunchpadShell>
  );
}
