import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  BarChart3, Sparkles, TrendingUp, TrendingDown, Download,
  Zap, Calendar, Database, Target, AlertTriangle,
  CheckCircle, ArrowRight, RefreshCw, FileText, Eye
} from 'lucide-react';

const INSIGHTS = [
  { title: 'Revenue trending up 18% this quarter', type: 'Growth', confidence: 'High', detail: 'Driven primarily by enterprise plan upgrades (+34% MRR). Professional tier growing steadily at 12%. Churn remains stable at 2.3%, well below industry average of 5%.', trend: 'up' as const, metric: '+$42K', period: 'Q2 2026' },
  { title: 'Support tickets spiking on Mondays', type: 'Pattern', confidence: 'Medium', detail: 'Monday support volume is 2.4x higher than other weekdays, primarily billing and access issues. Consider pre-weekend communications or automated Monday check-in emails.', trend: 'up' as const, metric: '2.4x', period: 'Last 30 days' },
  { title: 'User activation declining for free tier', type: 'Risk', confidence: 'High', detail: 'Day-7 activation rate dropped from 34% to 28% following recent onboarding changes. A/B test the new flow against the previous version. Conversion to paid also dipped 8%.', trend: 'down' as const, metric: '-6%', period: 'Last 14 days' },
  { title: 'Campaign ROI exceeding targets', type: 'Opportunity', confidence: 'High', detail: 'LinkedIn campaigns achieving 4.2x ROI vs 2.8x target. Recommend increasing spend by 30% on top-performing segments while maintaining creative refresh cadence.', trend: 'up' as const, metric: '4.2x', period: 'This month' },
];

const DATA_SOURCES = ['Revenue', 'Users', 'Support', 'Campaigns', 'Engagement', 'Retention'];
const QUICK_QUESTIONS = ['Revenue trends', 'User retention', 'Campaign performance', 'Support metrics', 'Churn analysis', 'Growth drivers'];

export default function AIAnalyticsAssistantPage() {
  const [source, setSource] = useState('Revenue');

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {[
          { label: 'Insights Generated', value: '24', icon: Sparkles },
          { label: 'Data Sources', value: '6', icon: Database },
          { label: 'Queries Run', value: '142', icon: BarChart3 },
          { label: 'Reports Saved', value: '8', icon: FileText },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border bg-card p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <k.icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-[8px] uppercase tracking-wider text-muted-foreground font-medium">{k.label}</span>
            </div>
            <div className="text-lg font-bold">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Query input */}
      <SectionCard title="Ask About Your Data" icon={<BarChart3 className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-3">
          <div className="flex gap-2">
            <input className="flex-1 h-10 rounded-xl border bg-background px-4 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder="e.g. What's driving churn this quarter? / Show me top-performing campaigns / Compare Q1 vs Q2 revenue" />
            <Button className="h-10 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Analyze</Button>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">Source:</span>
              {DATA_SOURCES.map(s => (
                <button key={s} onClick={() => setSource(s)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-all', source === s ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/30')}>{s}</button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] text-muted-foreground">Last 30 days</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {QUICK_QUESTIONS.map(q => (
              <Badge key={q} variant="outline" className="text-[8px] cursor-pointer hover:bg-accent/10 rounded-lg transition-colors">{q}</Badge>
            ))}
          </div>
        </div>
      </SectionCard>

      {/* Insights */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold">AI-Generated Insights</h2>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export Report</Button>
        </div>
        <div className="space-y-3">
          {INSIGHTS.map((ins, i) => (
            <SectionCard key={i} className="!rounded-2xl hover:shadow-sm transition-all">
              <div className="flex items-start gap-3">
                <div className={cn('h-10 w-10 rounded-2xl flex items-center justify-center shrink-0',
                  ins.trend === 'up' && ins.type !== 'Risk' ? 'bg-[hsl(var(--state-healthy)/0.1)]' : 'bg-[hsl(var(--state-critical)/0.1)]'
                )}>
                  {ins.trend === 'up' && ins.type !== 'Risk'
                    ? <TrendingUp className="h-5 w-5 text-[hsl(var(--state-healthy))]" />
                    : <TrendingDown className="h-5 w-5 text-[hsl(var(--state-critical))]" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[12px] font-bold">{ins.title}</span>
                    <Badge variant="outline" className="text-[7px] rounded-md">{ins.type}</Badge>
                    <Badge className={cn('text-[7px] border-0 rounded-lg', ins.confidence === 'High' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]')}>{ins.confidence} confidence</Badge>
                    <span className="text-[12px] font-bold text-accent ml-auto">{ins.metric}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{ins.detail}</p>
                  <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5" />{ins.period}</span>
                    <div className="flex-1" />
                    <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg"><Eye className="h-2.5 w-2.5" />Drill Down</Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg"><Download className="h-2.5 w-2.5" />Export</Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg"><ArrowRight className="h-2.5 w-2.5" />Dashboard</Button>
                  </div>
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      </div>
    </div>
  );
}
