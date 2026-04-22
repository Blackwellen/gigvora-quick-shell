import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Star, Calendar, MessageSquare, MapPin, Briefcase, Clock, Users, Shield, Video, Award, Heart, ChevronRight } from 'lucide-react';

const MENTOR = {
  name: 'Sarah Chen', role: 'Senior Product Manager', company: 'Google', location: 'Remote',
  bio: 'Passionate about helping early-career professionals break into product management. 10+ years of experience across startups and FAANG companies. I specialize in career pivots, portfolio building, and interview preparation.',
  rating: 4.9, reviews: 48, sessions: 120, mentees: 34, responseTime: '< 2h', languages: ['English', 'Mandarin'],
  expertise: ['Product Strategy', 'User Research', 'Career Growth', 'Interview Prep', 'Portfolio Review'],
  availability: ['Mon 2-5 PM', 'Wed 10 AM-1 PM', 'Fri 3-6 PM'],
  pricing: { session30: 'Free', session60: '$40', package4: '$120' },
  badges: ['Top Mentor', 'Verified', '100+ Sessions'],
};

const REVIEWS = [
  { name: 'Alex R.', rating: 5, date: 'Apr 10, 2026', text: 'Sarah helped me completely restructure my PM portfolio. Got 3 interview callbacks within a week!' },
  { name: 'Jordan M.', rating: 5, date: 'Mar 28, 2026', text: 'Incredible career advice. She helped me navigate a difficult career transition with clear, actionable steps.' },
  { name: 'Priya S.', rating: 4, date: 'Mar 15, 2026', text: 'Great session on interview prep. Would have liked more time on system design questions.' },
];

export default function MentorProfilePage() {
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Book a Session" className="!rounded-2xl">
        <div className="space-y-2">
          {Object.entries(MENTOR.pricing).map(([k, v]) => (
            <div key={k} className="flex justify-between items-center text-[9px]">
              <span className="text-muted-foreground">{k === 'session30' ? '30 min' : k === 'session60' ? '60 min' : '4-pack'}</span>
              <span className="font-bold">{v}</span>
            </div>
          ))}
          <Button className="w-full h-8 text-[10px] rounded-xl gap-1 mt-1"><Calendar className="h-3 w-3" />Book Session</Button>
          <Button variant="outline" className="w-full h-8 text-[10px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Send Message</Button>
        </div>
      </SectionCard>
      <SectionCard title="Availability" className="!rounded-2xl">
        <div className="space-y-1">
          {MENTOR.availability.map(a => (
            <div key={a} className="flex items-center gap-1.5 text-[8px]"><Clock className="h-2.5 w-2.5 text-accent" /><span>{a}</span></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Trust Signals" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {MENTOR.badges.map(b => <Badge key={b} className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{b}</Badge>)}
        </div>
        <div className="mt-2 text-[8px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" />Avg response: {MENTOR.responseTime}</div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={<><Users className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Mentor Profile</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Heart className="h-3 w-3" />Save</Button></>} rightRail={rightRail} rightRailWidth="w-56">
      <SectionCard className="!rounded-2xl mb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-2xl shrink-0"><AvatarFallback className="rounded-2xl bg-accent/10 text-accent text-lg font-bold">SC</AvatarFallback></Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-bold">{MENTOR.name}</span>
              <Shield className="h-3.5 w-3.5 text-accent" />
            </div>
            <div className="text-[10px] text-muted-foreground flex items-center gap-2 mb-2">
              <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" />{MENTOR.role} at {MENTOR.company}</span>
              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{MENTOR.location}</span>
            </div>
            <p className="text-[9px] text-muted-foreground leading-relaxed mb-2">{MENTOR.bio}</p>
            <div className="flex flex-wrap gap-1">{MENTOR.expertise.map(e => <Badge key={e} variant="outline" className="text-[7px] h-4 rounded-md">{e}</Badge>)}</div>
          </div>
        </div>
      </SectionCard>

      <KPIBand className="mb-3">
        <KPICard label="Rating" value={String(MENTOR.rating)} className="!rounded-2xl" />
        <KPICard label="Sessions" value={String(MENTOR.sessions)} className="!rounded-2xl" />
        <KPICard label="Mentees" value={String(MENTOR.mentees)} className="!rounded-2xl" />
        <KPICard label="Reviews" value={String(MENTOR.reviews)} className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Reviews" icon={<Star className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          {REVIEWS.map((r, i) => (
            <div key={i} className="py-2.5 border-b border-border/20 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold">{r.name}</span>
                  <div className="flex">{Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />)}</div>
                </div>
                <span className="text-[7px] text-muted-foreground">{r.date}</span>
              </div>
              <p className="text-[8px] text-muted-foreground">{r.text}</p>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
