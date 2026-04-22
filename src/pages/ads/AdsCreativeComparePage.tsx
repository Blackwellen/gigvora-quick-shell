import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  PieChart, Image, Video, Trophy, TrendingUp, Eye, MousePointer,
  Target, Clock, CheckCircle2, ChevronRight,
} from 'lucide-react';

interface ABTest {
  id: string; name: string; status: 'running' | 'completed' | 'scheduled';
  startDate: string; duration: string; variants: Variant[];
  winner: string | null; confidence: string;
}
interface Variant {
  name: string; type: 'image' | 'video'; impressions: string;
  clicks: string; ctr: string; conversions: number; cpa: string;
  spend: string;
}

const TESTS: ABTest[] = [
  { id: 'AB-1', name: 'Hero Banner: Dark vs Light', status: 'completed', startDate: 'Mar 20', duration: '14 days', confidence: '96%', winner: 'Dark Theme',
    variants: [
      { name: 'Dark Theme', type: 'image', impressions: '45K', clicks: '1.26K', ctr: '2.8%', conversions: 18, cpa: '$52', spend: '$936' },
      { name: 'Light Theme', type: 'image', impressions: '44K', clicks: '880', ctr: '2.0%', conversions: 11, cpa: '$85', spend: '$935' },
    ] },
  { id: 'AB-2', name: 'Video: 15s vs 30s', status: 'running', startDate: 'Apr 5', duration: '21 days', confidence: '78%', winner: null,
    variants: [
      { name: '15s Cut', type: 'video', impressions: '22K', clicks: '682', ctr: '3.1%', conversions: 12, cpa: '$45', spend: '$540' },
      { name: '30s Full', type: 'video', impressions: '21K', clicks: '546', ctr: '2.6%', conversions: 9, cpa: '$60', spend: '$540' },
    ] },
  { id: 'AB-3', name: 'CTA Copy: "Get Started" vs "Try Free"', status: 'running', startDate: 'Apr 8', duration: '14 days', confidence: '62%', winner: null,
    variants: [
      { name: 'Get Started', type: 'image', impressions: '18K', clicks: '486', ctr: '2.7%', conversions: 8, cpa: '$56', spend: '$448' },
      { name: 'Try Free', type: 'image', impressions: '17K', clicks: '510', ctr: '3.0%', conversions: 10, cpa: '$45', spend: '$450' },
    ] },
  { id: 'AB-4', name: 'Carousel vs Single Image', status: 'scheduled', startDate: 'Apr 20', duration: '14 days', confidence: '—', winner: null,
    variants: [
      { name: 'Carousel', type: 'image', impressions: '—', clicks: '—', ctr: '—', conversions: 0, cpa: '—', spend: '—' },
      { name: 'Single Image', type: 'image', impressions: '—', clicks: '—', ctr: '—', conversions: 0, cpa: '—', spend: '—' },
    ] },
];

const STATUS_COLORS: Record<string, string> = {
  running: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]',
  completed: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  scheduled: 'bg-muted text-muted-foreground',
};

const AdsCreativeComparePage: React.FC = () => {
  const topStrip = (
    <>
      <PieChart className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Ads — Creative Comparison</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><PieChart className="h-3 w-3" />New A/B Test</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Test Summary" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Running</span><span className="font-semibold">{TESTS.filter(t => t.status === 'running').length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Completed</span><span className="font-semibold">{TESTS.filter(t => t.status === 'completed').length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Scheduled</span><span className="font-semibold">{TESTS.filter(t => t.status === 'scheduled').length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Lift</span><span className="font-semibold text-[hsl(var(--state-healthy))]">+38%</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Tests" value={String(TESTS.filter(t => t.status === 'running').length)} className="!rounded-2xl" />
        <KPICard label="Completed" value={String(TESTS.filter(t => t.status === 'completed').length)} className="!rounded-2xl" />
        <KPICard label="Avg Confidence" value="79%" className="!rounded-2xl" />
        <KPICard label="Winners Found" value="1" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-3">
        {TESTS.map(t => (
          <div key={t.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[12px] font-bold">{t.name}</span>
                <Badge className={cn('text-[7px] border-0 capitalize', STATUS_COLORS[t.status])}>{t.status}</Badge>
                {t.winner && <Badge className="bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] text-[7px] border-0 gap-0.5"><Trophy className="h-2 w-2" />Winner: {t.winner}</Badge>}
              </div>
              <div className="text-[9px] text-muted-foreground">{t.startDate} · {t.duration} · Conf: {t.confidence}</div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {t.variants.map((v, i) => (
                <div key={v.name} className={cn('rounded-xl border p-3', t.winner === v.name && 'ring-2 ring-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5')}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Badge variant="secondary" className="text-[7px]">Variant {String.fromCharCode(65 + i)}</Badge>
                    <span className="text-[10px] font-semibold">{v.name}</span>
                    {t.winner === v.name && <Trophy className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />}
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 text-center text-[9px]">
                    <div className="rounded-lg bg-muted/30 p-1.5"><div className="font-bold">{v.impressions}</div><div className="text-[7px] text-muted-foreground">Impr</div></div>
                    <div className="rounded-lg bg-muted/30 p-1.5"><div className="font-bold">{v.ctr}</div><div className="text-[7px] text-muted-foreground">CTR</div></div>
                    <div className="rounded-lg bg-muted/30 p-1.5"><div className="font-bold">{v.cpa}</div><div className="text-[7px] text-muted-foreground">CPA</div></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default AdsCreativeComparePage;
