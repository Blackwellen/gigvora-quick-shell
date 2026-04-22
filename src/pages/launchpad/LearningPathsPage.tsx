import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Play, Clock, CheckCircle, Lock, ChevronRight, Award } from 'lucide-react';

const PATHS = [
  {
    title: 'Frontend Development Readiness',
    modules: [
      { name: 'HTML & CSS Fundamentals', status: 'complete' as const, duration: '4h' },
      { name: 'JavaScript Essentials', status: 'complete' as const, duration: '6h' },
      { name: 'React Foundations', status: 'in-progress' as const, duration: '8h' },
      { name: 'TypeScript for React', status: 'locked' as const, duration: '5h' },
      { name: 'Portfolio Project', status: 'locked' as const, duration: '10h' },
    ],
    progress: 45,
    badge: 'Frontend Ready',
  },
  {
    title: 'Professional Skills',
    modules: [
      { name: 'Communication Skills', status: 'complete' as const, duration: '3h' },
      { name: 'Interview Preparation', status: 'in-progress' as const, duration: '4h' },
      { name: 'Networking Essentials', status: 'locked' as const, duration: '2h' },
    ],
    progress: 50,
    badge: 'Career Ready',
  },
];

export default function LearningPathsPage() {
  return (
    <DashboardLayout topStrip={<><BookOpen className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Learning & Readiness Paths</span><div className="flex-1" /><Badge variant="outline" className="text-[9px] rounded-lg">2 active paths</Badge></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active Paths" value="2" className="!rounded-2xl" />
        <KPICard label="Modules Done" value="3" className="!rounded-2xl" />
        <KPICard label="Hours Completed" value="13" className="!rounded-2xl" />
        <KPICard label="Badges Earned" value="0" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-3">
        {PATHS.map((path, i) => (
          <SectionCard key={i} title={path.title} action={<div className="flex items-center gap-1 text-[8px]"><Award className="h-3 w-3 text-accent" /><span className="font-medium">{path.badge}</span></div>} className="!rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <Progress value={path.progress} className="h-1.5 rounded-full flex-1" />
              <span className="text-[9px] font-bold">{path.progress}%</span>
            </div>
            <div className="space-y-1.5">
              {path.modules.map((mod, j) => (
                <div key={j} className="flex items-center gap-2.5 py-1.5 px-2 rounded-xl hover:bg-muted/30 transition-colors">
                  {mod.status === 'complete' && <CheckCircle className="h-4 w-4 text-[hsl(var(--state-healthy))] shrink-0" />}
                  {mod.status === 'in-progress' && <Play className="h-4 w-4 text-accent shrink-0" />}
                  {mod.status === 'locked' && <Lock className="h-4 w-4 text-muted-foreground/40 shrink-0" />}
                  <span className={`text-[10px] flex-1 ${mod.status === 'complete' ? 'line-through text-muted-foreground' : mod.status === 'locked' ? 'text-muted-foreground/50' : 'font-medium'}`}>{mod.name}</span>
                  <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{mod.duration}</span>
                  {mod.status === 'in-progress' && <Button size="sm" className="h-5 text-[7px] rounded-md px-2">Continue</Button>}
                </div>
              ))}
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
