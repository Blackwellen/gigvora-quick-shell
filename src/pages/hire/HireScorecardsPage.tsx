import React, { useState } from 'react';
import { HireShell } from '@/components/shell/HireShell';
import { SectionCard, KPICard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  FileText, Star, Users, ChevronRight, CheckCircle2, Clock,
  Plus, Edit, ThumbsUp, ThumbsDown, Minus, Award, Shield,
  BarChart3, MessageSquare, Download, Filter,
} from 'lucide-react';

type Recommendation = 'strong-yes' | 'yes' | 'neutral' | 'no' | 'strong-no';

interface ScorecardDimension {
  id: string; label: string; score: number; maxScore: number; weight: number;
}

interface ScorecardEntry {
  id: string; candidate: string; avatar: string; job: string; stage: string;
  evaluators: { name: string; avatar: string; submitted: boolean; recommendation?: Recommendation; score?: number }[];
  dimensions: ScorecardDimension[];
  avgScore: number; overallRecommendation?: Recommendation;
  submittedAt: string; notes: string; nextStep: string;
}

const REC_CONFIG: Record<Recommendation, { label: string; color: string; icon: React.FC<{ className?: string }> }> = {
  'strong-yes': { label: 'Strong Yes', color: 'text-[hsl(var(--state-healthy))]', icon: ThumbsUp },
  yes: { label: 'Yes', color: 'text-[hsl(var(--state-healthy))]', icon: ThumbsUp },
  neutral: { label: 'Neutral', color: 'text-muted-foreground', icon: Minus },
  no: { label: 'No', color: 'text-[hsl(var(--state-caution))]', icon: ThumbsDown },
  'strong-no': { label: 'Strong No', color: 'text-[hsl(var(--state-critical))]', icon: ThumbsDown },
};

const SCORECARDS: ScorecardEntry[] = [
  {
    id: '1', candidate: 'Ana Torres', avatar: 'AT', job: 'Senior Frontend Engineer', stage: 'Technical',
    evaluators: [
      { name: 'Sarah Kim', avatar: 'SK', submitted: true, recommendation: 'strong-yes', score: 4.8 },
      { name: 'Mike Chen', avatar: 'MC', submitted: true, recommendation: 'yes', score: 4.2 },
      { name: 'Lisa Wang', avatar: 'LW', submitted: false },
    ],
    dimensions: [
      { id: 'd1', label: 'Technical Skills', score: 4.5, maxScore: 5, weight: 30 },
      { id: 'd2', label: 'Problem Solving', score: 4.8, maxScore: 5, weight: 25 },
      { id: 'd3', label: 'System Design', score: 4.2, maxScore: 5, weight: 20 },
      { id: 'd4', label: 'Communication', score: 4.6, maxScore: 5, weight: 15 },
      { id: 'd5', label: 'Culture Fit', score: 4.4, maxScore: 5, weight: 10 },
    ],
    avgScore: 4.5, overallRecommendation: 'strong-yes',
    submittedAt: '2h ago', notes: 'Strong candidate with excellent React and TS depth. Would recommend fast-tracking.',
    nextStep: 'Move to Final Round',
  },
  {
    id: '2', candidate: 'David Kim', avatar: 'DK', job: 'Engineering Manager', stage: 'Final Round',
    evaluators: [
      { name: 'VP Engineering', avatar: 'VP', submitted: true, recommendation: 'yes', score: 4.0 },
      { name: 'CTO', avatar: 'CT', submitted: true, recommendation: 'yes', score: 4.2 },
      { name: 'HR Lead', avatar: 'HR', submitted: true, recommendation: 'neutral', score: 3.8 },
      { name: 'Team Lead', avatar: 'TL', submitted: true, recommendation: 'yes', score: 4.1 },
    ],
    dimensions: [
      { id: 'd1', label: 'Leadership', score: 4.3, maxScore: 5, weight: 30 },
      { id: 'd2', label: 'Technical Strategy', score: 3.9, maxScore: 5, weight: 25 },
      { id: 'd3', label: 'Team Building', score: 4.1, maxScore: 5, weight: 20 },
      { id: 'd4', label: 'Communication', score: 4.5, maxScore: 5, weight: 15 },
      { id: 'd5', label: 'Culture Add', score: 4.0, maxScore: 5, weight: 10 },
    ],
    avgScore: 4.1, overallRecommendation: 'yes',
    submittedAt: '1d ago', notes: 'Solid leadership experience. Some concerns about technical depth at staff level.',
    nextStep: 'Proceed to Offer',
  },
  {
    id: '3', candidate: 'Priya Patel', avatar: 'PP', job: 'ML Engineer', stage: 'Phone Screen',
    evaluators: [
      { name: 'ML Lead', avatar: 'ML', submitted: true, recommendation: 'strong-yes', score: 4.8 },
      { name: 'Data Eng', avatar: 'DE', submitted: false },
    ],
    dimensions: [
      { id: 'd1', label: 'ML Knowledge', score: 4.8, maxScore: 5, weight: 35 },
      { id: 'd2', label: 'Python Proficiency', score: 4.5, maxScore: 5, weight: 25 },
      { id: 'd3', label: 'Research Skills', score: 4.7, maxScore: 5, weight: 20 },
      { id: 'd4', label: 'Communication', score: 4.2, maxScore: 5, weight: 10 },
      { id: 'd5', label: 'Collaboration', score: 4.4, maxScore: 5, weight: 10 },
    ],
    avgScore: 4.8, overallRecommendation: 'strong-yes',
    submittedAt: '3h ago', notes: 'Exceptional ML candidate. Published research relevant to our domain.',
    nextStep: 'Schedule Technical Round',
  },
  {
    id: '4', candidate: 'James Chen', avatar: 'JC', job: 'Senior Frontend Engineer', stage: 'Technical',
    evaluators: [
      { name: 'Sarah Kim', avatar: 'SK', submitted: false },
      { name: 'Mike Chen', avatar: 'MC', submitted: false },
      { name: 'Lisa Wang', avatar: 'LW', submitted: false },
    ],
    dimensions: [],
    avgScore: 0, submittedAt: 'Pending', notes: '', nextStep: 'Awaiting evaluations',
  },
];

const TEMPLATES = [
  { id: 't1', name: 'Technical Interview', dimensions: 5, usedIn: 8 },
  { id: 't2', name: 'Culture Fit Screen', dimensions: 4, usedIn: 12 },
  { id: 't3', name: 'Leadership Assessment', dimensions: 6, usedIn: 3 },
  { id: 't4', name: 'Phone Screen Quick', dimensions: 3, usedIn: 15 },
];

export default function HireScorecardsPage() {
  const [tab, setTab] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'scorecards' | 'templates'>('scorecards');

  const selected = SCORECARDS.find(s => s.id === selectedId);
  const filtered = SCORECARDS.filter(s => {
    if (tab === 'pending') return s.evaluators.some(e => !e.submitted);
    if (tab === 'completed') return s.evaluators.every(e => e.submitted);
    return true;
  });

  return (
    <HireShell
      rightInspector={selected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-10 w-10"><AvatarFallback className="text-xs bg-muted">{selected.avatar}</AvatarFallback></Avatar>
            <div>
              <div className="text-xs font-bold">{selected.candidate}</div>
              <div className="text-[9px] text-muted-foreground">{selected.job} · {selected.stage}</div>
            </div>
          </div>

          {/* Dimensions Breakdown */}
          {selected.dimensions.length > 0 && (
            <SectionCard title="Score Dimensions" className="!rounded-xl">
              <div className="space-y-2">
                {selected.dimensions.map(d => (
                  <div key={d.id}>
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[9px] text-muted-foreground">{d.label} ({d.weight}%)</span>
                      <span className="text-[9px] font-bold">{d.score}/{d.maxScore}</span>
                    </div>
                    <Progress value={(d.score / d.maxScore) * 100} className="h-1.5" />
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Evaluator Breakdown */}
          <SectionCard title="Evaluators" className="!rounded-xl">
            <div className="space-y-1.5">
              {selected.evaluators.map((ev, i) => (
                <div key={i} className="flex items-center gap-2 p-1.5 rounded-lg border border-border/30">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[7px] bg-muted">{ev.avatar}</AvatarFallback></Avatar>
                  <span className="text-[9px] font-medium flex-1">{ev.name}</span>
                  {ev.submitted ? (
                    <div className="flex items-center gap-1">
                      {ev.recommendation && (
                        <span className={`text-[8px] font-semibold ${REC_CONFIG[ev.recommendation].color}`}>
                          {REC_CONFIG[ev.recommendation].label}
                        </span>
                      )}
                      {ev.score && <span className="text-[8px] font-bold">{ev.score}</span>}
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-[7px] h-3.5">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Notes & Next Step */}
          {selected.notes && (
            <SectionCard title="Notes" className="!rounded-xl">
              <p className="text-[9px] text-muted-foreground italic">{selected.notes}</p>
            </SectionCard>
          )}
          <SectionCard title="Next Step" className="!rounded-xl">
            <div className="flex items-center gap-2">
              <Badge className="text-[8px] bg-accent/10 text-accent border-0">{selected.nextStep}</Badge>
            </div>
            <div className="flex gap-1.5 mt-2">
              <Button size="sm" className="h-6 text-[8px] flex-1 rounded-lg">Approve & Move</Button>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Hold</Button>
            </div>
          </SectionCard>
        </div>
      ) : undefined}
    >
      <SectionBackNav homeRoute="/hire" homeLabel="Recruitment" currentLabel="Scorecards" icon={<Shield className="h-3 w-3" />} />

      {/* KPI Strip */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <FileText className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Scorecards</h1>
        <KPICard label="Pending Reviews" value="4" />
        <KPICard label="Completed" value="15" />
        <KPICard label="Avg Score" value="4.3/5" />
        <KPICard label="Templates" value={String(TEMPLATES.length)} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Tabs value={viewTab} onValueChange={v => setViewTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="scorecards" className="text-[10px] h-5 px-2">Evaluations</TabsTrigger>
            <TabsTrigger value="templates" className="text-[10px] h-5 px-2">Templates</TabsTrigger>
          </TabsList>
        </Tabs>
        {viewTab === 'scorecards' && (
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-7">
              <TabsTrigger value="all" className="text-[10px] h-5 px-2">All</TabsTrigger>
              <TabsTrigger value="pending" className="text-[10px] h-5 px-2">Pending</TabsTrigger>
              <TabsTrigger value="completed" className="text-[10px] h-5 px-2">Completed</TabsTrigger>
            </TabsList>
          </Tabs>
        )}
        <div className="flex-1" />
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" /> New Template</Button>
      </div>

      {viewTab === 'scorecards' ? (
        <div className="space-y-2">
          {filtered.map(sc => {
            const completionPct = sc.evaluators.length > 0 ? Math.round((sc.evaluators.filter(e => e.submitted).length / sc.evaluators.length) * 100) : 0;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedId(sc.id === selectedId ? null : sc.id)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer group ${sc.id === selectedId ? 'border-accent/40 bg-accent/5' : 'border-border/40 hover:border-accent/30 hover:bg-accent/5'}`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarFallback className="text-[10px] bg-muted">{sc.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{sc.candidate}</span>
                      <Badge variant="outline" className="text-[8px] h-4">{sc.stage}</Badge>
                      {sc.overallRecommendation && (
                        <span className={`text-[8px] font-semibold ${REC_CONFIG[sc.overallRecommendation].color}`}>
                          {REC_CONFIG[sc.overallRecommendation].label}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{sc.job}</div>
                  </div>
                  <div className="flex items-center gap-4 text-[10px]">
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <Users className="h-2.5 w-2.5 text-muted-foreground" />
                        <span className="font-medium">{sc.evaluators.filter(e => e.submitted).length}/{sc.evaluators.length}</span>
                      </div>
                      <div className="text-[8px] text-muted-foreground">evaluators</div>
                    </div>
                    {sc.avgScore > 0 && (
                      <div className="text-center">
                        <div className="flex items-center gap-1">
                          <Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />
                          <span className="font-semibold">{sc.avgScore}</span>
                        </div>
                        <div className="text-[8px] text-muted-foreground">avg</div>
                      </div>
                    )}
                    <span className="text-[9px] text-muted-foreground">{sc.submittedAt}</span>
                  </div>
                </div>
                {completionPct < 100 && (
                  <div className="mt-2 pt-2 border-t border-border/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[9px] text-muted-foreground">Completion</span>
                      <span className="text-[9px] font-medium">{completionPct}%</span>
                    </div>
                    <Progress value={completionPct} className="h-1.5" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="space-y-2">
          {TEMPLATES.map(t => (
            <SectionCard key={t.id} className="!rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <FileText className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="text-xs font-semibold">{t.name}</div>
                  <div className="text-[9px] text-muted-foreground">{t.dimensions} dimensions · Used in {t.usedIn} evaluations</div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 rounded-lg"><Edit className="h-2.5 w-2.5" /> Edit</Button>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 rounded-lg"><Download className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}
    </HireShell>
  );
}
