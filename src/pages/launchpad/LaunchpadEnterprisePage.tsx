import React from 'react';
import { Link } from 'react-router-dom';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Building2, Plus, Users, Trophy, Calendar, BarChart3,
  ChevronRight, Settings, Award, Briefcase, TrendingUp,
  FileText, Eye, CheckCircle2, Clock, Map,
} from 'lucide-react';

const HOST_STATS = [
  { label: 'Active Opportunities', value: '12', change: '+3 this month', trend: 'up' as const },
  { label: 'Total Applicants', value: '342', change: '+45 this week', trend: 'up' as const },
  { label: 'Active Pathways', value: '3' },
  { label: 'Mentors Assigned', value: '8' },
];

const ACTIVE_LISTINGS = [
  { title: 'Junior Frontend Developer', type: 'Entry Level', applicants: 34, status: 'Active', posted: '2d ago' },
  { title: 'Digital Marketing Intern', type: 'Internship', applicants: 56, status: 'Active', posted: '5d ago' },
  { title: 'UX Design Apprenticeship', type: 'Apprenticeship', applicants: 22, status: 'Active', posted: '1w ago' },
  { title: 'Portfolio Website Challenge', type: 'Challenge', applicants: 89, status: 'Active', posted: '3d ago' },
];

const PIPELINE = [
  { stage: 'Applied', count: 124, color: 'bg-accent/10 text-accent' },
  { stage: 'Screening', count: 45, color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' },
  { stage: 'Interview', count: 18, color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]' },
  { stage: 'Shortlisted', count: 8, color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' },
  { stage: 'Accepted', count: 5, color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' },
];

const QUICK_ACTIONS = [
  { label: 'Create Opportunity', icon: Plus, href: '#' },
  { label: 'Create Pathway', icon: Map, href: '#' },
  { label: 'Publish Challenge', icon: Trophy, href: '#' },
  { label: 'Schedule Event', icon: Calendar, href: '#' },
  { label: 'Review Applicants', icon: Eye, href: '#' },
  { label: 'Manage Mentors', icon: Users, href: '#' },
];

export default function LaunchpadEnterprisePage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent/20 to-[hsl(var(--gigvora-purple))]/10 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-bold">Host Workspace</h1>
            <p className="text-[11px] text-muted-foreground">Manage your launchpad opportunities, pathways, and talent pipeline</p>
          </div>
        </div>
        <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" /> Create Opportunity</Button>
      </div>

      <KPIBand className="mb-4">
        {HOST_STATS.map(s => (
          <KPICard key={s.label} label={s.label} value={s.value} change={s.change} trend={s.trend} className="!rounded-2xl" />
        ))}
      </KPIBand>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-4">
        {QUICK_ACTIONS.map(a => (
          <button key={a.label} className="flex flex-col items-center gap-1.5 p-3 rounded-2xl border hover:shadow-sm hover:border-accent/20 transition-all text-center">
            <a.icon className="h-4 w-4 text-accent" />
            <span className="text-[8px] font-medium text-muted-foreground">{a.label}</span>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Active Listings */}
          <SectionCard title="Active Listings" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {ACTIVE_LISTINGS.map((l, i) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold">{l.title}</span>
                      <Badge variant="outline" className="text-[7px] rounded-md">{l.type}</Badge>
                      <Badge className="text-[7px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0 rounded-lg">{l.status}</Badge>
                    </div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{l.applicants} applicants · Posted {l.posted}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />View</Button>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Pipeline Overview */}
          <SectionCard title="Talent Pipeline" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex gap-2">
              {PIPELINE.map(p => (
                <div key={p.stage} className={cn('flex-1 rounded-2xl p-3 text-center', p.color)}>
                  <div className="text-lg font-bold">{p.count}</div>
                  <div className="text-[8px] font-medium">{p.stage}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <SectionCard title="This Month" className="!rounded-2xl">
            <div className="space-y-2 text-[9px]">
              {[
                { l: 'New applicants', v: '45' },
                { l: 'Interviews scheduled', v: '12' },
                { l: 'Offers sent', v: '3' },
                { l: 'Pathway completions', v: '8' },
                { l: 'Challenges submitted', v: '24' },
                { l: 'Events hosted', v: '2' },
              ].map(s => (
                <div key={s.l} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{s.l}</span>
                  <span className="font-semibold">{s.v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Active Mentors" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {['Sarah Chen', 'James Wilson', 'Priya Sharma'].map(m => (
                <div key={m} className="flex items-center gap-2 py-1">
                  <Avatar className="h-6 w-6 rounded-lg"><AvatarFallback className="rounded-lg text-[6px] bg-accent/10 text-accent">{m.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                  <span className="text-[9px] font-medium flex-1">{m}</span>
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))]" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </LaunchpadShell>
  );
}
