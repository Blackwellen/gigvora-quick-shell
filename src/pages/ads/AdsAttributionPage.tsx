import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Zap, Target, BarChart3, TrendingUp, DollarSign, Eye,
  CheckCircle2, ArrowRight, Settings, Plus, MousePointer,
  Layers, Globe,
} from 'lucide-react';

interface ConversionEvent {
  id: string; name: string; type: 'standard' | 'custom'; count: number;
  value: string; source: string; status: 'active' | 'inactive';
}

interface AttributionChannel {
  channel: string; touchpoints: string; conversions: string;
  revenue: string; roas: string; share: number;
}

const EVENTS: ConversionEvent[] = [
  { id: 'EV-1', name: 'Sign Up', type: 'standard', count: 456, value: '$0', source: 'Website', status: 'active' },
  { id: 'EV-2', name: 'Trial Start', type: 'standard', count: 234, value: '$0', source: 'Website', status: 'active' },
  { id: 'EV-3', name: 'Purchase', type: 'standard', count: 89, value: '$15,340', source: 'Website', status: 'active' },
  { id: 'EV-4', name: 'Gig Created', type: 'custom', count: 156, value: '$0', source: 'In-App', status: 'active' },
  { id: 'EV-5', name: 'Job Posted', type: 'custom', count: 67, value: '$0', source: 'In-App', status: 'active' },
  { id: 'EV-6', name: 'Pro Upgrade', type: 'custom', count: 34, value: '$6,800', source: 'Website', status: 'active' },
  { id: 'EV-7', name: 'Webinar Register', type: 'custom', count: 189, value: '$0', source: 'Landing Page', status: 'active' },
  { id: 'EV-8', name: 'Demo Request', type: 'custom', count: 23, value: '$0', source: 'Website', status: 'inactive' },
];

const CHANNELS: AttributionChannel[] = [
  { channel: 'Paid Search', touchpoints: '1,245', conversions: '89', revenue: '$8,200', roas: '4.2x', share: 38 },
  { channel: 'Social Ads', touchpoints: '2,340', conversions: '67', revenue: '$5,400', roas: '3.1x', share: 25 },
  { channel: 'Display', touchpoints: '4,560', conversions: '45', revenue: '$3,800', roas: '2.8x', share: 17 },
  { channel: 'Retargeting', touchpoints: '890', conversions: '34', revenue: '$2,900', roas: '5.8x', share: 13 },
  { channel: 'Email', touchpoints: '1,120', conversions: '18', revenue: '$1,560', roas: '6.2x', share: 7 },
];

const AdsAttributionPage: React.FC = () => {
  const topStrip = (
    <>
      <Zap className="h-4 w-4 text-[hsl(var(--state-live))]" />
      <span className="text-xs font-semibold">Ads — Attribution & Conversion Events</span>
      <div className="flex-1" />
      <select className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option>Last Click</option>
        <option>First Click</option>
        <option>Linear</option>
        <option>Time Decay</option>
        <option>Position Based</option>
      </select>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Event</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Attribution Model" className="!rounded-2xl">
        <div className="space-y-1 text-[9px] text-muted-foreground">
          <div><span className="font-medium text-foreground">Last Click</span> — 100% credit to last touchpoint</div>
          <div><span className="font-medium text-foreground">First Click</span> — 100% credit to first touchpoint</div>
          <div><span className="font-medium text-foreground">Linear</span> — equal credit across all</div>
          <div><span className="font-medium text-foreground">Time Decay</span> — more credit to recent</div>
        </div>
      </SectionCard>
      <SectionCard title="Pixel Status" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))]" /><span>Website pixel — Active</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))]" /><span>In-app events — Active</span></div>
          <div className="flex items-center gap-1.5"><div className="h-2 w-2 rounded-full bg-muted-foreground/30" /><span>Server-side — Not configured</span></div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Active Events" value={String(EVENTS.filter(e => e.status === 'active').length)} className="!rounded-2xl" />
        <KPICard label="Total Conversions" value="1,248" change="Last 30d" className="!rounded-2xl" />
        <KPICard label="Total Revenue" value="$21,860" change="Attributed" className="!rounded-2xl" />
        <KPICard label="Avg ROAS" value="4.4x" change="Blended" className="!rounded-2xl" />
      </KPIBand>

      <Tabs defaultValue="events">
        <TabsList className="mb-3 h-auto gap-0.5">
          <TabsTrigger value="events" className="text-[10px] h-7 px-2.5 rounded-xl"><Zap className="h-3 w-3 mr-1" />Events</TabsTrigger>
          <TabsTrigger value="attribution" className="text-[10px] h-7 px-2.5 rounded-xl"><Layers className="h-3 w-3 mr-1" />Attribution</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <div className="space-y-2">
            {EVENTS.map(e => (
              <div key={e.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all">
                <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', e.status === 'active' ? 'bg-[hsl(var(--state-live))]/10' : 'bg-muted')}>
                  <Zap className={cn('h-4 w-4', e.status === 'active' ? 'text-[hsl(var(--state-live))]' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold">{e.name}</span>
                    <Badge variant="secondary" className="text-[7px] capitalize">{e.type}</Badge>
                    <Badge className={cn('text-[7px] border-0', e.status === 'active' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>{e.status}</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">Source: {e.source}</div>
                </div>
                <div className="flex gap-3 text-center text-[9px] shrink-0">
                  <div><div className="font-bold">{e.count}</div><div className="text-[7px] text-muted-foreground">Count</div></div>
                  <div><div className="font-bold">{e.value}</div><div className="text-[7px] text-muted-foreground">Value</div></div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="attribution">
          <div className="space-y-2">
            {CHANNELS.map(c => (
              <div key={c.channel} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-[11px] font-bold">{c.channel}</div>
                    <div className="text-[9px] text-muted-foreground">{c.touchpoints} touchpoints</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-[9px] shrink-0">
                    <div><div className="font-bold">{c.conversions}</div><div className="text-[7px] text-muted-foreground">Conv</div></div>
                    <div><div className="font-bold">{c.revenue}</div><div className="text-[7px] text-muted-foreground">Revenue</div></div>
                    <div><div className="font-bold text-accent">{c.roas}</div><div className="text-[7px] text-muted-foreground">ROAS</div></div>
                  </div>
                </div>
                <div className="mt-2"><Progress value={c.share} className="h-1" /></div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdsAttributionPage;
