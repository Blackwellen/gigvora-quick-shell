import React, { useState } from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  GraduationCap, MapPin, Clock, Users, Star, Bookmark,
  BookmarkCheck, ChevronRight, Search, Briefcase, Award,
  CheckCircle2, SlidersHorizontal,
} from 'lucide-react';

const JOBS = [
  { id: 'j1', title: 'Junior Frontend Developer', company: 'TechCorp', avatar: 'TC', location: 'San Francisco, CA', salary: '$75-90K', type: 'Full-time', audience: 'Graduates', mentorship: true, training: true, skills: ['React', 'CSS', 'JavaScript'], match: 92, applicants: 34, posted: '2d ago' },
  { id: 'j2', title: 'Graduate Data Analyst', company: 'DataSphere', avatar: 'DS', location: 'Remote', salary: '$65-80K', type: 'Full-time', audience: 'Graduates', mentorship: true, training: false, skills: ['SQL', 'Python', 'Excel'], match: 85, applicants: 67, posted: '3d ago' },
  { id: 'j3', title: 'Junior Product Manager', company: 'ProductPro', avatar: 'PP', location: 'London, UK', salary: '£35-45K', type: 'Full-time', audience: 'Career changers', mentorship: true, training: true, skills: ['Product', 'Strategy', 'Analytics'], match: 88, applicants: 45, posted: '1d ago' },
  { id: 'j4', title: 'Marketing Coordinator', company: 'GrowthLab', avatar: 'GL', location: 'Austin, TX', salary: '$50-60K', type: 'Full-time', audience: 'School leavers', mentorship: false, training: true, skills: ['Content', 'SEO', 'Social'], match: 76, applicants: 89, posted: '5d ago' },
  { id: 'j5', title: 'QA Engineer Trainee', company: 'CloudScale', avatar: 'CS', location: 'Remote', salary: '$55-65K', type: 'Full-time', audience: 'All levels', mentorship: true, training: true, skills: ['Testing', 'Selenium', 'Git'], match: 72, applicants: 28, posted: '4d ago' },
];

export default function LaunchpadJobsPage() {
  const [search, setSearch] = useState('');
  const filtered = JOBS.filter(j => !search || j.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Launchpad Jobs</h1>
          <p className="text-[11px] text-muted-foreground">Jobs marked as launchpad-friendly with mentorship, training, and beginner support</p>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search jobs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-[10px] rounded-xl w-48" />
        </div>
      </div>

      <KPIBand className="mb-4">
        <KPICard label="Launchpad Jobs" value={String(JOBS.length)} className="!rounded-2xl" />
        <KPICard label="With Mentorship" value={String(JOBS.filter(j => j.mentorship).length)} className="!rounded-2xl" />
        <KPICard label="With Training" value={String(JOBS.filter(j => j.training).length)} className="!rounded-2xl" />
        <KPICard label="Avg Match" value="83%" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {filtered.map(j => (
          <div key={j.id} className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all cursor-pointer group">
            <div className="flex items-start gap-3">
              <Avatar className="h-10 w-10 rounded-xl shrink-0"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[9px] font-bold">{j.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{j.title}</span>
                  <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{j.match}% match</Badge>
                  <Badge className="text-[6px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0 rounded-lg"><GraduationCap className="h-2 w-2 mr-0.5" />Launchpad</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground flex items-center gap-2 mb-1.5">
                  <span>{j.company}</span>
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{j.location}</span>
                  <span className="font-medium text-foreground">{j.salary}</span>
                  <span>{j.type}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap mb-2">
                  <Badge variant="outline" className="text-[7px] rounded-lg">{j.audience}</Badge>
                  {j.mentorship && <Badge className="text-[6px] bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))] border-0 rounded-lg">Mentored</Badge>}
                  {j.training && <Badge className="text-[6px] bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-0 rounded-lg">Training</Badge>}
                </div>
                <div className="flex gap-1 flex-wrap">{j.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px] h-3.5 rounded-md">{s}</Badge>)}</div>
                <div className="flex items-center gap-3 mt-2 text-[8px] text-muted-foreground">
                  <span><Users className="h-2.5 w-2.5 inline mr-0.5" />{j.applicants} applicants</span>
                  <span>{j.posted}</span>
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <Button size="sm" className="h-7 text-[9px] rounded-xl">Apply</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Bookmark className="h-3 w-3" />Save</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </LaunchpadShell>
  );
}
