import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3, Users, Clock, Star, Zap, Radio, TrendingUp,
  Calendar, UserPlus, Target, ArrowUp,
  ArrowDown, Award, Activity, Crown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const SESSION_HISTORY = [
  { id: '1', name: 'AI in Product Management', date: 'Today', duration: '48 min', participants: 18, connections: 5, rating: 4.8, type: 'room' as const },
  { id: '2', name: 'Speed Networking — Tech Leaders', date: 'Yesterday', duration: '25 min', participants: 12, connections: 4, rating: 4.5, type: 'speed' as const },
  { id: '3', name: 'Design Systems Workshop', date: '3d ago', duration: '1h 15min', participants: 24, connections: 8, rating: 4.9, type: 'room' as const },
  { id: '4', name: 'Startup Pitch Practice', date: '1w ago', duration: '35 min', participants: 8, connections: 3, rating: 4.2, type: 'room' as const },
  { id: '5', name: 'Speed Networking — Remote Work', date: '1w ago', duration: '20 min', participants: 16, connections: 6, rating: 4.6, type: 'speed' as const },
];

const TOP_CONNECTIONS = [
  { name: 'Elena Vasquez', avatar: 'EV', sessions: 3, lastSeen: 'Today', score: 96 },
  { name: 'Raj Krishnan', avatar: 'RK', sessions: 2, lastSeen: 'Yesterday', score: 92 },
  { name: 'Sophie Larsson', avatar: 'SL', sessions: 2, lastSeen: '3d ago', score: 88 },
  { name: 'Maya Chen', avatar: 'MC', sessions: 1, lastSeen: 'Today', score: 85 },
];

export default function SessionAnalyticsPage() {
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter'>('month');

  return (
    <NetworkShell backLabel="Session Analytics" backRoute="/networking">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Activity className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Session Analytics</h1>
        <div className="flex-1" />
        <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5">
          {(['week', 'month', 'quarter'] as const).map(p => (
            <button key={p} onClick={() => setPeriod(p)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', period === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{p}</button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-3 mb-4">
        {[
          { label: 'Sessions Attended', value: '14', change: '+3 vs last month', trend: 'up' as const, icon: Calendar },
          { label: 'Total Time', value: '8.5h', change: '+2.1h', trend: 'up' as const, icon: Clock },
          { label: 'Connections Made', value: '26', change: '+8', trend: 'up' as const, icon: UserPlus },
          { label: 'Follow-Up Rate', value: '72%', change: '+5%', trend: 'up' as const, icon: Target },
          { label: 'Avg Rating Given', value: '4.6', change: '/5.0', trend: 'up' as const, icon: Star },
          { label: 'Rooms Hosted', value: '3', change: 'This month', trend: 'up' as const, icon: Crown },
        ].map(kpi => (
          <div key={kpi.label} className="p-3 rounded-xl border border-border/40 bg-card">
            <div className="flex items-center gap-1.5 mb-1">
              <kpi.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[8px] text-muted-foreground">{kpi.label}</span>
            </div>
            <div className="text-lg font-bold">{kpi.value}</div>
            <div className="flex items-center gap-0.5 text-[8px] text-muted-foreground mt-0.5">
              {kpi.trend === 'up' ? <ArrowUp className="h-2 w-2 text-[hsl(var(--state-healthy))]" /> : <ArrowDown className="h-2 w-2 text-destructive" />}
              {kpi.change}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2 space-y-4">
          {/* Session History */}
          <SectionCard title="Session History" icon={<Radio className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-2">
              {SESSION_HISTORY.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
                  <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', s.type === 'speed' ? 'bg-[hsl(var(--gigvora-amber))]/10' : 'bg-accent/10')}>
                    {s.type === 'speed' ? <Zap className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" /> : <Radio className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{s.name}</span>
                      <Badge variant="secondary" className="text-[7px] h-3.5 capitalize">{s.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                      <span>{s.date}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {s.duration}</span>
                      <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" /> {s.participants}</span>
                      <span className="flex items-center gap-0.5"><UserPlus className="h-2.5 w-2.5" /> {s.connections} connections</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={cn('h-3 w-3', i <= Math.round(s.rating) ? 'text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]' : 'text-muted-foreground/30')} />
                    ))}
                    <span className="text-[9px] font-semibold ml-1">{s.rating}</span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Engagement Breakdown */}
          <SectionCard title="Engagement Breakdown" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-2.5">
              {[
                { label: 'Room Discussions', value: 8, pct: 57 },
                { label: 'Speed Networking', value: 4, pct: 29 },
                { label: 'Hosted Sessions', value: 2, pct: 14 },
              ].map(b => (
                <div key={b.label}>
                  <div className="flex justify-between text-[9px] mb-1">
                    <span className="font-medium">{b.label}</span>
                    <span className="text-muted-foreground">{b.value} sessions ({b.pct}%)</span>
                  </div>
                  <Progress value={b.pct} className="h-1.5" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <SectionCard title="Top Connections from Sessions" icon={<Award className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />}>
            <div className="space-y-2">
              {TOP_CONNECTIONS.map(c => (
                <div key={c.name} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/30">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{c.avatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold">{c.name}</div>
                    <div className="text-[8px] text-muted-foreground">{c.sessions} sessions · Last: {c.lastSeen}</div>
                  </div>
                  <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">{c.score}%</Badge>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Insights" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-2 text-[9px]">
              {[
                { title: 'Best Session Type', value: 'Room Discussions', detail: 'Higher connection rate' },
                { title: 'Peak Activity Day', value: 'Tuesday', detail: '32% of sessions' },
                { title: 'Avg Session Length', value: '38 min', detail: '↑ 5 min vs last month' },
                { title: 'Connection-to-Follow-Up', value: '72%', detail: 'Above average' },
              ].map(insight => (
                <div key={insight.title} className="p-2 rounded-lg bg-muted/30">
                  <div className="text-[8px] text-muted-foreground">{insight.title}</div>
                  <div className="font-bold text-xs">{insight.value}</div>
                  <div className="text-[8px] text-muted-foreground">{insight.detail}</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </NetworkShell>
  );
}
