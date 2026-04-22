import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Briefcase, ChevronRight, Award, MapPin, Clock } from 'lucide-react';

const PATHWAYS = [
  { title: 'Tech Apprenticeship', desc: 'Learn software development on the job', duration: '18 months', level: 'Level 3-4', openings: 24, progress: 0 },
  { title: 'Digital Marketing', desc: 'Master digital channels and analytics', duration: '12 months', level: 'Level 3', openings: 18, progress: 0 },
  { title: 'Business Admin', desc: 'Operations and management foundations', duration: '15 months', level: 'Level 3', openings: 32, progress: 0 },
  { title: 'Creative & Design', desc: 'Visual design and brand building', duration: '12 months', level: 'Level 3', openings: 12, progress: 0 },
];

export default function SchoolLeaverPage() {
  return (
    <DashboardLayout topStrip={<><BookOpen className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">School Leaver Pathways</span><div className="flex-1" /><Badge variant="outline" className="text-[9px] rounded-lg">No degree required</Badge></>}>
      <SectionCard title="Why Skip University?" className="!rounded-2xl mb-3">
        <div className="grid grid-cols-3 gap-3">
          {[{ stat: '£0', label: 'Student debt', icon: '💰' }, { stat: '2yr', label: 'Head start', icon: '🚀' }, { stat: '94%', label: 'Employment rate', icon: '📈' }].map(s => (
            <div key={s.label} className="text-center p-3 rounded-xl bg-muted/30">
              <div className="text-lg">{s.icon}</div>
              <div className="text-[14px] font-black">{s.stat}</div>
              <div className="text-[8px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Available Pathways" icon={<Briefcase className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          {PATHWAYS.map((p, i) => (
            <div key={i} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold">{p.title}</span>
                    <Badge variant="outline" className="text-[7px] rounded-md">{p.level}</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground mb-1">{p.desc}</div>
                  <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.duration}</span>
                    <span>{p.openings} openings</span>
                  </div>
                </div>
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><ChevronRight className="h-3 w-3" />Explore</Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
