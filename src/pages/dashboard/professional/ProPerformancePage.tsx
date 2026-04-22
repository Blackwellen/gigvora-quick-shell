import React from 'react';
import { KPIBand, KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Progress } from '@/components/ui/progress';
import {
  Award, Star, CheckCircle2, Clock, Users, Target,
  TrendingUp, Zap, Eye, ArrowUpRight,
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const PERF_TREND = [
  { week: 'W1', score: 82 }, { week: 'W2', score: 85 }, { week: 'W3', score: 88 },
  { week: 'W4', score: 86 }, { week: 'W5', score: 90 }, { week: 'W6', score: 92 },
];

const METRICS = [
  { label: 'Order Completion Rate', value: 96, target: 95, icon: CheckCircle2, color: 'text-[hsl(var(--state-healthy))]' },
  { label: 'On-Time Delivery', value: 94, target: 90, icon: Clock, color: 'text-accent' },
  { label: 'Response Rate', value: 98, target: 95, icon: Zap, color: 'text-[hsl(var(--gigvora-purple))]' },
  { label: 'Client Satisfaction', value: 4.9, target: 4.5, icon: Star, color: 'text-[hsl(var(--gigvora-amber))]', isRating: true },
  { label: 'Repeat Client Rate', value: 34, target: 25, icon: Users, color: 'text-accent' },
  { label: 'Proposal Win Rate', value: 68, target: 50, icon: Target, color: 'text-[hsl(var(--state-healthy))]' },
];

export default function ProPerformancePage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Award className="h-5 w-5 text-accent" /> Performance</h1>
        <p className="text-[11px] text-muted-foreground">Your commercial performance metrics and health indicators</p>
      </div>

      <KPIBand>
        <KPICard label="Overall Score" value="92" change="+4 pts" trend="up" />
        <KPICard label="Rating" value="4.9/5" change="Top 5%" trend="up" />
        <KPICard label="Completion" value="96%" />
        <KPICard label="Win Rate" value="68%" change="+5%" trend="up" />
      </KPIBand>

      {/* Performance Trend */}
      <SectionCard title="Performance Trend" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={PERF_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 9 }} />
              <YAxis domain={[70, 100]} tick={{ fontSize: 9 }} />
              <Tooltip contentStyle={{ fontSize: 10, borderRadius: 12 }} />
              <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {METRICS.map(m => (
          <div key={m.label} className="rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2 mb-3">
              <m.icon className={`h-4 w-4 ${m.color}`} />
              <span className="text-[10px] font-semibold">{m.label}</span>
            </div>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold">{m.isRating ? m.value : `${m.value}%`}</span>
              <span className="text-[9px] text-muted-foreground mb-1">target: {m.isRating ? m.target : `${m.target}%`}</span>
            </div>
            {!m.isRating && <Progress value={m.value} className="h-2 rounded-full" />}
            {m.value >= (m.target as number) && (
              <div className="mt-2 flex items-center gap-1 text-[8px] text-[hsl(var(--state-healthy))]">
                <ArrowUpRight className="h-2.5 w-2.5" />Above target
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Alerts */}
      <SectionCard title="Performance Alerts" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { text: 'Your response time improved to < 2 hours — excellent!', type: 'positive' as const },
            { text: 'On-time delivery dipped 2% last week — monitor closely', type: 'warning' as const },
            { text: 'Proposal win rate up 5% this month — strong momentum', type: 'positive' as const },
          ].map((a, i) => (
            <div key={i} className={`rounded-xl p-3 text-[9px] flex items-center gap-2 ${a.type === 'positive' ? 'bg-[hsl(var(--state-healthy)/0.05)] text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--state-caution)/0.05)] text-[hsl(var(--state-caution))]'}`}>
              {a.type === 'positive' ? <CheckCircle2 className="h-3 w-3 shrink-0" /> : <Clock className="h-3 w-3 shrink-0" />}
              {a.text}
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
