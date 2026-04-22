import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target, Sparkles, Star, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';

const MOCK_MATCHES = [
  { id: '1', name: 'Ana Torres', avatar: 'AT', headline: 'Staff Engineer @ Stripe', job: 'Senior Frontend Engineer', overallFit: 96, skillFit: 98, cultureFit: 92, experienceFit: 95, status: 'new' as const },
  { id: '2', name: 'James Chen', avatar: 'JC', headline: 'Senior Frontend @ Netflix', job: 'Senior Frontend Engineer', overallFit: 89, skillFit: 91, cultureFit: 85, experienceFit: 88, status: 'reviewed' as const },
  { id: '3', name: 'Priya Patel', avatar: 'PP', headline: 'ML Engineer @ DeepMind', job: 'ML Engineer', overallFit: 93, skillFit: 95, cultureFit: 90, experienceFit: 91, status: 'new' as const },
  { id: '4', name: 'David Kim', avatar: 'DK', headline: 'Engineering Manager @ Meta', job: 'Engineering Manager', overallFit: 87, skillFit: 84, cultureFit: 91, experienceFit: 89, status: 'shortlisted' as const },
];

export default function RecruiterMatchCenterPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Target className="h-4 w-4 text-[hsl(var(--state-healthy))]" />
          <h1 className="text-sm font-bold mr-4">Match Center</h1>
          <KPICard label="New Matches" value="8" change="today" trend="up" />
          <KPICard label="Avg Fit Score" value="91%" />
          <KPICard label="Shortlisted" value="12" />
        </div>
      }
    >
      <SectionCard title="Candidate Matches"
        action={
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-7">
              <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
              <TabsTrigger value="new" className="text-[10px] h-5 px-2">New</TabsTrigger>
              <TabsTrigger value="shortlisted" className="text-[10px] h-5 px-2">Shortlisted</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      >
        <div className="space-y-3">
          {MOCK_MATCHES.filter(m => tab === 'all' || m.status === tab).map(m => (
            <div key={m.id} className="p-4 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all">
              <div className="flex items-start gap-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="text-xs bg-muted">{m.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{m.name}</span>
                    <Badge variant={m.status === 'new' ? 'default' : 'secondary'} className="text-[8px] h-4">{m.status}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{m.headline}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Matched for: <span className="font-medium text-foreground">{m.job}</span></div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-[hsl(var(--state-healthy))]">{m.overallFit}%</div>
                  <div className="text-[8px] text-muted-foreground">Overall Fit</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4 mt-3 pt-3 border-t border-border/30">
                {[
                  { label: 'Skills', value: m.skillFit },
                  { label: 'Culture', value: m.cultureFit },
                  { label: 'Experience', value: m.experienceFit },
                ].map(d => (
                  <div key={d.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-muted-foreground">{d.label}</span>
                      <span className="text-[10px] font-medium">{d.value}%</span>
                    </div>
                    <Progress value={d.value} className="h-1.5" />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/30">
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><ThumbsUp className="h-3 w-3" /> Shortlist</Button>
                <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><ThumbsDown className="h-3 w-3" /> Pass</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[10px] gap-1 ml-auto"><Eye className="h-3 w-3" /> View Profile</Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
