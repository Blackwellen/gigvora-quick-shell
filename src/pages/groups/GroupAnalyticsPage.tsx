import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  BarChart3, Users, TrendingUp, MessageSquare, Star,
  ArrowUp, ArrowDown, Calendar, Download, Eye,
} from 'lucide-react';
import { useAnalyticsRollups, bucketSum } from '@/hooks/useAnalyticsRollups';

const GROUP_METRICS = [
  'groups.member.joined', 'groups.member.left',
  'groups.post.text', 'groups.post.poll', 'groups.post.resource', 'groups.post.event',
  'groups.comment.created', 'groups.post.viewed',
];

export default function GroupAnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const { data: rollups = [] } = useAnalyticsRollups(GROUP_METRICS, { bucket: 'day', days });
  const joined  = bucketSum(rollups, 'groups.member.joined') || 320;
  const left    = bucketSum(rollups, 'groups.member.left')   || 18;
  const text    = bucketSum(rollups, 'groups.post.text')     || 156;
  const polls   = bucketSum(rollups, 'groups.post.poll')     || 23;
  const shares  = bucketSum(rollups, 'groups.post.resource') || 45;
  const events  = bucketSum(rollups, 'groups.post.event')    || 12;
  const comments= bucketSum(rollups, 'groups.comment.created') || 1204;
  const views   = bucketSum(rollups, 'groups.post.viewed')   || 45000;

  const topStrip = (
    <>
      <BarChart3 className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">React Developers — Analytics</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['7d', '30d', '90d'] as const).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors', period === p ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{p}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Top Contributors" className="!rounded-2xl">
        <div className="space-y-1.5">
          {[{ n: 'Sarah Kim', p: 89 }, { n: 'Mike Liu', p: 67 }, { n: 'Maya Chen', p: 45 }, { n: 'James Rivera', p: 34 }].map((c, i) => (
            <div key={c.n} className="flex items-center gap-1.5 text-[9px]">
              <span className="text-[8px] font-bold text-muted-foreground w-3">{i + 1}</span>
              <span className="flex-1 truncate">{c.n}</span>
              <span className="font-semibold">{c.p}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Peak Hours" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {['10 AM — 12 PM', '2 PM — 4 PM', '7 PM — 9 PM'].map(h => (
            <div key={h} className="flex items-center gap-1"><Calendar className="h-2.5 w-2.5 text-muted-foreground" /><span>{h}</span></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <KPIBand className="mb-3">
        <KPICard label="Total Members" value="12,400" trend="up" change={`+${joined}`} className="!rounded-2xl" />
        <KPICard label="Active Members" value="3,450" trend="up" change="+8%" className="!rounded-2xl" />
        <KPICard label="Posts (period)" value={(text + polls + shares + events).toLocaleString()} trend="up" change="+15%" className="!rounded-2xl" />
        <KPICard label="Engagement Rate" value={`${views > 0 ? Math.min(100, Math.round((comments / Math.max(1, views)) * 100)) : 28}%`} trend="up" change="+3pp" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Growth" icon={<TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {[
              { label: 'New Members', value: String(joined), pct: Math.min(100, joined / 5), change: '+12%' },
              { label: 'Left / Removed', value: String(left), pct: Math.min(100, left), change: '-3%' },
              { label: 'Net Growth', value: `+${joined - left}`, pct: Math.min(100, (joined - left) / 4), change: '+15%' },
              { label: 'Invites Sent', value: '156', pct: 60, change: '+22%' },
            ].map(m => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="font-medium">{m.label}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold">{m.value}</span>
                    <span className={cn('text-[8px] flex items-center gap-0.5', m.change.startsWith('+') ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')}>
                      {m.change.startsWith('+') ? <ArrowUp className="h-2 w-2" /> : <ArrowDown className="h-2 w-2" />}{m.change}
                    </span>
                  </div>
                </div>
                <Progress value={m.pct} className="h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Content" icon={<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2.5">
            {[
              { label: 'Text Posts', value: String(text), pct: Math.min(100, text / 2) },
              { label: 'Polls', value: String(polls), pct: Math.min(100, polls * 1.5) },
              { label: 'Resource Shares', value: String(shares), pct: Math.min(100, shares * 1.2) },
              { label: 'Event Posts', value: String(events), pct: Math.min(100, events * 2) },
              { label: 'Comments', value: comments.toLocaleString(), pct: 92 },
            ].map(m => (
              <div key={m.label}>
                <div className="flex items-center justify-between text-[9px] mb-1">
                  <span className="font-medium">{m.label}</span>
                  <span className="font-semibold">{m.value}</span>
                </div>
                <Progress value={m.pct} className="h-1.5 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <SectionCard title="Engagement Breakdown" icon={<Star className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Avg Likes/Post', value: '24', icon: Star, color: 'text-[hsl(var(--gigvora-amber))]' },
            { label: 'Avg Comments/Post', value: '8.5', icon: MessageSquare, color: 'text-accent' },
            { label: 'Post Views', value: '45K', icon: Eye, color: 'text-[hsl(var(--state-healthy))]' },
            { label: 'Member Retention', value: '94%', icon: Users, color: 'text-accent' },
          ].map(s => (
            <div key={s.label} className="rounded-xl bg-muted/30 p-3 text-center">
              <s.icon className={cn('h-4 w-4 mx-auto mb-1', s.color)} />
              <div className="text-[14px] font-bold">{s.value}</div>
              <div className="text-[8px] text-muted-foreground">{s.label}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
