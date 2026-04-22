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
  Rocket, Compass, Briefcase, Users, Award, BarChart3, BookOpen,
  ChevronRight, Sparkles, Target, Shield, GraduationCap, Calendar,
  Trophy, Star, MapPin, Clock, Play, ArrowRight, Zap,
  CheckCircle2, FolderOpen, TrendingUp, FileText,
} from 'lucide-react';

const PATHWAYS = [
  { title: 'Early Career', desc: 'Kickstart your professional journey', icon: Compass, href: '/launchpad/early-career', progress: 45, color: 'from-accent/20 to-accent/5 text-accent' },
  { title: 'Graduate', desc: 'Roles for recent graduates', icon: GraduationCap, href: '/launchpad/graduate', progress: 30, color: 'from-[hsl(var(--gigvora-amber))]/20 to-[hsl(var(--gigvora-amber))]/5 text-[hsl(var(--gigvora-amber))]' },
  { title: 'School Leaver', desc: 'Skip the degree, start building', icon: BookOpen, href: '/launchpad/school-leaver', progress: 0, color: 'from-[hsl(var(--state-healthy))]/20 to-[hsl(var(--state-healthy))]/5 text-[hsl(var(--state-healthy))]' },
  { title: 'Career Changer', desc: 'Transition to a new field', icon: Target, href: '/launchpad/career-changer', progress: 60, color: 'from-[hsl(var(--gigvora-purple))]/20 to-[hsl(var(--gigvora-purple))]/5 text-[hsl(var(--gigvora-purple))]' },
];

const RECOMMENDED_OPPS = [
  { id: 'o1', title: 'Junior Frontend Developer', company: 'TechCorp', type: 'Entry Level', match: 92, skills: ['React', 'CSS'], mentorship: true },
  { id: 'o2', title: 'Digital Marketing Intern', company: 'GrowthLab', type: 'Internship', match: 88, skills: ['Marketing', 'Analytics'], mentorship: true },
  { id: 'o3', title: 'UX Design Apprenticeship', company: 'DesignFlow', type: 'Apprenticeship', match: 85, skills: ['Figma', 'Research'], mentorship: false },
];

const RECOMMENDED_MENTORS = [
  { name: 'Sarah Chen', role: 'Senior PM at Google', avatar: 'SC', match: 95, sessions: 120, available: true },
  { name: 'James Wilson', role: 'Staff Engineer at Stripe', avatar: 'JW', match: 91, sessions: 85, available: true },
  { name: 'Priya Sharma', role: 'Design Director at Figma', avatar: 'PS', match: 88, sessions: 200, available: false },
];

const UPCOMING_EVENTS = [
  { title: 'Portfolio Review Workshop', date: 'Tomorrow 2 PM', type: 'Workshop', host: 'DesignFlow' },
  { title: 'Speed Networking: Tech Juniors', date: 'Friday 11 AM', type: 'Networking', host: 'Gigvora' },
];

const NEXT_STEPS = [
  { label: 'Complete Python assessment', done: false, priority: 'high' },
  { label: 'Upload portfolio project', done: false, priority: 'medium' },
  { label: 'Book mentor session', done: false, priority: 'medium' },
  { label: 'RSVP for portfolio review', done: true, priority: 'low' },
];

const ACTIVE_APPS = [
  { title: 'Junior Frontend Developer', company: 'TechCorp', status: 'Interview', date: '2 days ago' },
  { title: 'Software Engineering Intern', company: 'ScaleUp Inc', status: 'Applied', date: '5 days ago' },
];

export default function LaunchpadHomePage() {
  return (
    <LaunchpadShell>
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-br from-accent/10 via-[hsl(var(--gigvora-purple))]/5 to-background border border-accent/10 p-6 mb-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-bold">Welcome back! 🚀</h1>
              <Badge className="text-[8px] bg-accent/10 text-accent border-0 rounded-lg"><Shield className="h-2.5 w-2.5 mr-0.5" />Verified</Badge>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">You're making great progress. Here's what to focus on today.</p>
            <div className="flex items-center gap-3 text-[10px]">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent/10 text-accent font-semibold"><TrendingUp className="h-3 w-3" /> 72% Career Ready</div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground font-medium"><Briefcase className="h-3 w-3" /> 2 Active Applications</div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted text-muted-foreground font-medium"><Award className="h-3 w-3" /> 6 Badges Earned</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Band */}
      <KPIBand className="mb-4">
        <KPICard label="Active Pathway" value="Early Career" className="!rounded-2xl" />
        <KPICard label="Mentor Sessions" value="4" change="This month" className="!rounded-2xl" />
        <KPICard label="Projects Done" value="3" trend="up" className="!rounded-2xl" />
        <KPICard label="Badges Earned" value="6" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Main Column */}
        <div className="xl:col-span-2 space-y-4">
          {/* Pathways */}
          <SectionCard title="Your Pathways" icon={<Compass className="h-3.5 w-3.5 text-muted-foreground" />} action={<Link to="/launchpad/pathways" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">All Pathways <ChevronRight className="h-2.5 w-2.5" /></Link>} className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2.5">
              {PATHWAYS.map(p => (
                <Link key={p.title} to={p.href} className="rounded-2xl border bg-card p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
                  <div className={cn('h-10 w-10 rounded-xl bg-gradient-to-br flex items-center justify-center mb-2', p.color)}>
                    <p.icon className="h-5 w-5" />
                  </div>
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors mb-0.5">{p.title}</div>
                  <div className="text-[8px] text-muted-foreground mb-2">{p.desc}</div>
                  {p.progress > 0 ? (
                    <div>
                      <div className="flex justify-between text-[7px] mb-0.5"><span className="text-muted-foreground">{p.progress}% complete</span></div>
                      <Progress value={p.progress} className="h-1 rounded-full" />
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[7px] rounded-lg">Not started</Badge>
                  )}
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Recommended Opportunities */}
          <SectionCard title="Recommended For You" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} action={<Link to="/launchpad/opportunities" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">Browse All <ChevronRight className="h-2.5 w-2.5" /></Link>} className="!rounded-2xl">
            <div className="space-y-2">
              {RECOMMENDED_OPPS.map(o => (
                <Link key={o.id} to="/launchpad/opportunities" className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 hover:shadow-sm transition-all">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Briefcase className="h-4 w-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-semibold">{o.title}</span>
                      <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{o.match}% match</Badge>
                      {o.mentorship && <Badge className="text-[6px] bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))] border-0 rounded-lg">Mentored</Badge>}
                    </div>
                    <div className="text-[9px] text-muted-foreground">{o.company} · {o.type}</div>
                    <div className="flex gap-1 mt-1">{o.skills.map(s => <Badge key={s} variant="outline" className="text-[6px] h-3 rounded-md">{s}</Badge>)}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                </Link>
              ))}
            </div>
          </SectionCard>

          {/* Active Applications */}
          <SectionCard title="Active Applications" icon={<FileText className="h-3.5 w-3.5 text-muted-foreground" />} action={<Link to="/launchpad/applications" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">View All <ChevronRight className="h-2.5 w-2.5" /></Link>} className="!rounded-2xl">
            <div className="space-y-2">
              {ACTIVE_APPS.map((a, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold">{a.title}</span>
                    <div className="text-[8px] text-muted-foreground">{a.company} · Applied {a.date}</div>
                  </div>
                  <Badge className={cn('text-[7px] rounded-lg border-0', a.status === 'Interview' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-accent/10 text-accent')}>{a.status}</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Next Steps */}
          <SectionCard title="Next Steps" icon={<Zap className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {NEXT_STEPS.map((step, i) => (
                <div key={i} className={cn('flex items-center gap-2 py-1.5 text-[9px]', step.done && 'opacity-50')}>
                  {step.done ? (
                    <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))] shrink-0" />
                  ) : (
                    <div className={cn('h-4 w-4 rounded-full border-2 shrink-0', step.priority === 'high' ? 'border-accent' : 'border-muted-foreground/30')} />
                  )}
                  <span className={step.done ? 'line-through' : ''}>{step.label}</span>
                  {step.priority === 'high' && !step.done && <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-lg ml-auto">Priority</Badge>}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recommended Mentors */}
          <SectionCard title="Mentors For You" icon={<Users className="h-3.5 w-3.5 text-accent" />} action={<Link to="/launchpad/mentors" className="text-[9px] text-accent font-medium hover:underline">View All</Link>} className="!rounded-2xl">
            <div className="space-y-2">
              {RECOMMENDED_MENTORS.map(m => (
                <div key={m.name} className="flex items-center gap-2.5 py-1.5">
                  <Avatar className="h-8 w-8 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[8px] font-bold">{m.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-semibold flex items-center gap-1">{m.name}{m.available && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))]" />}</div>
                    <div className="text-[7px] text-muted-foreground">{m.role}</div>
                  </div>
                  <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{m.match}%</Badge>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Upcoming Events */}
          <SectionCard title="Upcoming Events" icon={<Calendar className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} action={<Link to="/launchpad/events" className="text-[9px] text-accent font-medium hover:underline">View All</Link>} className="!rounded-2xl">
            <div className="space-y-2">
              {UPCOMING_EVENTS.map((e, i) => (
                <div key={i} className="p-2.5 rounded-xl border border-border/30 hover:border-accent/30 transition-colors cursor-pointer">
                  <div className="text-[10px] font-semibold mb-0.5">{e.title}</div>
                  <div className="text-[8px] text-muted-foreground flex items-center gap-2">
                    <span>{e.date}</span>
                    <Badge variant="outline" className="text-[6px] h-3 rounded-md">{e.type}</Badge>
                    <span>{e.host}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Find Mentor', icon: Users, href: '/launchpad/mentors' },
              { label: 'Projects', icon: Briefcase, href: '/launchpad/projects' },
              { label: 'Portfolio', icon: FolderOpen, href: '/launchpad/portfolio' },
              { label: 'Challenges', icon: Trophy, href: '/launchpad/challenges' },
            ].map(a => (
              <Link key={a.label} to={a.href} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border hover:shadow-sm hover:border-accent/20 transition-all text-center">
                <a.icon className="h-4 w-4 text-muted-foreground" />
                <span className="text-[9px] font-medium">{a.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </LaunchpadShell>
  );
}
