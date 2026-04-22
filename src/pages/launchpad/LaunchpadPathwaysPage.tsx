import React from 'react';
import { Link } from 'react-router-dom';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Map, ChevronRight, Clock, Users, Award, Star, GraduationCap,
  Target, BookOpen, Briefcase, CheckCircle2, ArrowRight, Compass,
} from 'lucide-react';

const PATHWAYS = [
  { id: 'p1', title: 'Graduate Product Pathway', host: 'Gigvora Academy', avatar: 'GA', audience: 'Graduates', stages: 5, duration: '12 weeks', completions: 240, rating: 4.9, mentors: 8, outcomes: ['PM Certificate', 'Portfolio project', '3 mentor sessions'], skills: ['Product Strategy', 'UX', 'Analytics'], description: 'A structured pathway into product management for recent graduates.' },
  { id: 'p2', title: 'Career Changer Into Cybersecurity', host: 'SecurePath', avatar: 'SP', audience: 'Career changers', stages: 7, duration: '16 weeks', completions: 120, rating: 4.8, mentors: 5, outcomes: ['Security+ prep', 'Lab portfolio', 'Mentorship'], skills: ['Network Security', 'Linux', 'Python'], description: 'Transition into cybersecurity from any background.' },
  { id: 'p3', title: 'Junior Marketing Launchpad', host: 'GrowthLab', avatar: 'GL', audience: 'School leavers', stages: 4, duration: '8 weeks', completions: 380, rating: 4.7, mentors: 6, outcomes: ['Campaign portfolio', 'Analytics badge', 'Job referrals'], skills: ['Content', 'SEO', 'Analytics'], description: 'Build marketing skills and a campaign portfolio.' },
  { id: 'p4', title: 'Enterprise Early Talent Program', host: 'TechCorp', avatar: 'TC', audience: 'All levels', stages: 6, duration: '6 months', completions: 90, rating: 4.9, mentors: 12, outcomes: ['Full-time offer potential', 'Rotation experience', 'Executive mentorship'], skills: ['Engineering', 'Product', 'Design'], description: 'Multi-rotation program across engineering, product, and design.' },
  { id: 'p5', title: 'Returnship: Back to Tech', host: 'CloudScale', avatar: 'CS', audience: 'Returners', stages: 4, duration: '10 weeks', completions: 45, rating: 4.8, mentors: 4, outcomes: ['Updated portfolio', 'Skills refresher', 'Interview coaching'], skills: ['JavaScript', 'React', 'System Design'], description: 'Re-enter the tech workforce with guided support and mentorship.' },
  { id: 'p6', title: 'Design Foundations Track', host: 'DesignFlow', avatar: 'DF', audience: 'Career changers', stages: 5, duration: '10 weeks', completions: 200, rating: 4.6, mentors: 7, outcomes: ['Figma certificate', 'Case study portfolio', '2 mentor sessions'], skills: ['Figma', 'UI Design', 'UX Research'], description: 'Master design fundamentals and build a portfolio from scratch.' },
];

export default function LaunchpadPathwaysPage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Pathways</h1>
          <p className="text-[11px] text-muted-foreground">Structured tracks to build skills, experience, and credibility</p>
        </div>
      </div>

      <KPIBand className="mb-4">
        <KPICard label="Available Pathways" value={String(PATHWAYS.length)} className="!rounded-2xl" />
        <KPICard label="Active Enrollments" value="1,200+" className="!rounded-2xl" />
        <KPICard label="Avg Completion" value="78%" trend="up" className="!rounded-2xl" />
        <KPICard label="Available Mentors" value="42" className="!rounded-2xl" />
      </KPIBand>

      {/* Audience Filter */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {['All', 'Graduates', 'School leavers', 'Career changers', 'Returners', 'All levels'].map(a => (
          <Badge key={a} variant="outline" className="text-[9px] rounded-xl px-3 py-1.5 cursor-pointer hover:bg-accent/10 hover:border-accent/30 shrink-0 transition-colors">{a}</Badge>
        ))}
      </div>

      <div className="space-y-3">
        {PATHWAYS.map(p => (
          <div key={p.id} className="rounded-2xl border bg-card p-5 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start gap-4">
              <Avatar className="h-12 w-12 rounded-2xl shrink-0"><AvatarFallback className="rounded-2xl bg-gradient-to-br from-accent/20 to-[hsl(var(--gigvora-purple))]/10 text-accent text-[10px] font-bold">{p.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[13px] font-bold group-hover:text-accent transition-colors">{p.title}</span>
                  <Badge variant="outline" className="text-[7px] rounded-lg"><GraduationCap className="h-2 w-2 mr-0.5" />{p.audience}</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground mb-2">{p.description}</div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-2">
                  <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{p.host}</span>
                  <span className="flex items-center gap-0.5"><Map className="h-2.5 w-2.5" />{p.stages} stages</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.duration}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{p.mentors} mentors</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{p.rating}</span>
                  <span>{p.completions} completed</span>
                </div>
                <div className="flex gap-1 flex-wrap mb-2">{p.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px] h-3.5 rounded-md">{s}</Badge>)}</div>
                <div className="flex items-center gap-1.5 text-[8px]">
                  <Award className="h-3 w-3 text-accent" />
                  <span className="text-muted-foreground">Outcomes:</span>
                  {p.outcomes.map(o => <Badge key={o} className="text-[6px] bg-accent/5 text-accent border-accent/20 rounded-lg">{o}</Badge>)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1">Join Pathway <ArrowRight className="h-3 w-3" /></Button>
                <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl">Learn More</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LaunchpadShell>
  );
}
