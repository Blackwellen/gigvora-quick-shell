import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Plus, Star, Clock, Users, ChevronRight, CheckCircle2 } from 'lucide-react';

const MOCK_SCORECARDS = [
  { id: '1', candidate: 'Ana Torres', avatar: 'AT', job: 'Senior Frontend Engineer', stage: 'Technical', evaluators: 3, completed: 2, avgScore: 4.5, submitted: '2h ago' },
  { id: '2', candidate: 'David Kim', avatar: 'DK', job: 'Engineering Manager', stage: 'Final Round', evaluators: 4, completed: 4, avgScore: 4.1, submitted: '1d ago' },
  { id: '3', candidate: 'Priya Patel', avatar: 'PP', job: 'ML Engineer', stage: 'Phone Screen', evaluators: 2, completed: 1, avgScore: 4.8, submitted: '3h ago' },
  { id: '4', candidate: 'James Chen', avatar: 'JC', job: 'Senior Frontend Engineer', stage: 'Technical', evaluators: 3, completed: 0, avgScore: 0, submitted: 'Pending' },
];

export default function RecruiterScorecardsPage() {
  const [tab, setTab] = useState('all');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <FileText className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
          <h1 className="text-sm font-bold mr-4">Scorecards</h1>
          <KPICard label="Pending Reviews" value="4" />
          <KPICard label="Completed" value="15" />
          <KPICard label="Avg Score" value="4.3/5" />
        </div>
      }
    >
      <SectionCard title="Evaluation Scorecards"
        action={
          <div className="flex items-center gap-2">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList className="h-7">
                <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
                <TabsTrigger value="pending" className="text-[10px] h-5 px-2">Pending</TabsTrigger>
                <TabsTrigger value="completed" className="text-[10px] h-5 px-2">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> New Template</Button>
          </div>
        }
      >
        <div className="space-y-3">
          {MOCK_SCORECARDS.filter(s => tab === 'all' || (tab === 'pending' && s.completed < s.evaluators) || (tab === 'completed' && s.completed === s.evaluators)).map(sc => (
            <div key={sc.id} className="p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all cursor-pointer group">
              <div className="flex items-center gap-4">
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="text-[10px] bg-muted">{sc.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{sc.candidate}</span>
                    <Badge variant="outline" className="text-[8px] h-4">{sc.stage}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground">{sc.job}</div>
                </div>
                <div className="flex items-center gap-4 text-[10px]">
                  <div className="text-center">
                    <div className="flex items-center gap-1">
                      <Users className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="font-medium">{sc.completed}/{sc.evaluators}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground">evaluators</div>
                  </div>
                  {sc.avgScore > 0 && (
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />
                        <span className="font-semibold">{sc.avgScore}</span>
                      </div>
                      <div className="text-[8px] text-muted-foreground">avg score</div>
                    </div>
                  )}
                  <span className="text-[9px] text-muted-foreground">{sc.submitted}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-accent" />
                </div>
              </div>
              {sc.completed < sc.evaluators && (
                <div className="mt-2 pt-2 border-t border-border/30">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] text-muted-foreground">Completion</span>
                    <span className="text-[9px] font-medium">{Math.round((sc.completed / sc.evaluators) * 100)}%</span>
                  </div>
                  <Progress value={(sc.completed / sc.evaluators) * 100} className="h-1.5" />
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
