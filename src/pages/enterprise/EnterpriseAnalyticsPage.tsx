import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, Users, Handshake, UserPlus, Eye,
  Building2, Target, Calendar, MessageSquare, Globe, Download,
} from 'lucide-react';

const EnterpriseAnalyticsPage: React.FC = () => {
  const topStrip = (
    <>
      <BarChart3 className="h-4 w-4 text-primary" />
      <span className="text-xs font-semibold">Enterprise Analytics</span>
      <div className="flex-1" />
      <select className="h-7 rounded-xl border bg-background px-2 text-[9px]">
        <option>Last 30 Days</option>
        <option>Last 90 Days</option>
        <option>This Quarter</option>
        <option>This Year</option>
      </select>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Engagement Score" className="!rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="h-14 w-14 rounded-full bg-accent/10 flex items-center justify-center">
            <span className="text-lg font-bold text-accent">87</span>
          </div>
          <div className="text-[9px] text-muted-foreground">
            <div>Top 15% of enterprises</div>
            <div className="text-[hsl(var(--state-healthy))] font-medium mt-0.5">↑ 5 from last month</div>
          </div>
        </div>
      </SectionCard>
      <SectionCard title="Top Channels" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Intros', v: '45%', pct: 45 },
            { l: 'Events', v: '28%', pct: 28 },
            { l: 'Rooms', v: '18%', pct: 18 },
            { l: 'Directory', v: '9%', pct: 9 },
          ].map(c => (
            <div key={c.l}>
              <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">{c.l}</span><span className="font-semibold">{c.v}</span></div>
              <div className="h-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${c.pct}%` }} /></div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-4">
        <KPICard label="Profile Views" value="1,245" change="+18%" trend="up" className="!rounded-2xl" />
        <KPICard label="Intro Requests" value="34" change="+8" trend="up" className="!rounded-2xl" />
        <KPICard label="Partnerships Formed" value="3" change="This quarter" className="!rounded-2xl" />
        <KPICard label="Pipeline Generated" value="$890K" change="+$210K" trend="up" className="!rounded-2xl" />
      </KPIBand>

      <Tabs defaultValue="engagement">
        <TabsList className="mb-3 h-auto gap-0.5">
          <TabsTrigger value="engagement" className="text-[10px] h-7 px-2.5 rounded-xl"><Eye className="h-3 w-3 mr-1" />Engagement</TabsTrigger>
          <TabsTrigger value="intros" className="text-[10px] h-7 px-2.5 rounded-xl"><UserPlus className="h-3 w-3 mr-1" />Intros</TabsTrigger>
          <TabsTrigger value="partnerships" className="text-[10px] h-7 px-2.5 rounded-xl"><Handshake className="h-3 w-3 mr-1" />Partnerships</TabsTrigger>
          <TabsTrigger value="pipeline" className="text-[10px] h-7 px-2.5 rounded-xl"><Target className="h-3 w-3 mr-1" />Pipeline</TabsTrigger>
        </TabsList>

        <TabsContent value="engagement">
          <div className="grid grid-cols-2 gap-3">
            <SectionCard title="Profile Performance" className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { period: 'This Week', views: 312, searches: 89, saves: 15 },
                  { period: 'Last Week', views: 278, searches: 72, saves: 12 },
                  { period: '2 Weeks Ago', views: 245, searches: 65, saves: 9 },
                  { period: '3 Weeks Ago', views: 210, searches: 58, saves: 11 },
                ].map(p => (
                  <div key={p.period} className="flex items-center gap-3 text-[9px] py-1.5 border-b last:border-0">
                    <span className="text-muted-foreground w-20">{p.period}</span>
                    <div className="flex gap-3 flex-1">
                      <span><Eye className="h-2.5 w-2.5 inline" /> {p.views}</span>
                      <span><Building2 className="h-2.5 w-2.5 inline" /> {p.searches}</span>
                      <span>★ {p.saves}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Visitor Demographics" className="!rounded-2xl">
              <div className="space-y-1.5 text-[9px]">
                {[
                  { l: 'Technology', pct: 42 }, { l: 'Finance', pct: 23 },
                  { l: 'Healthcare', pct: 18 }, { l: 'Consulting', pct: 12 },
                  { l: 'Other', pct: 5 },
                ].map(s => (
                  <div key={s.l}>
                    <div className="flex justify-between mb-0.5"><span className="text-muted-foreground">{s.l}</span><span className="font-semibold">{s.pct}%</span></div>
                    <div className="h-1 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${s.pct}%` }} /></div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </TabsContent>

        <TabsContent value="intros">
          <SectionCard title="Intro Funnel" className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { stage: 'Requests Sent', count: 34, pct: 100 },
                { stage: 'Accepted', count: 26, pct: 76 },
                { stage: 'Meeting Scheduled', count: 18, pct: 53 },
                { stage: 'Opportunity Created', count: 8, pct: 24 },
                { stage: 'Partnership Formed', count: 3, pct: 9 },
              ].map(s => (
                <div key={s.stage}>
                  <div className="flex justify-between text-[9px] mb-0.5">
                    <span className="font-medium">{s.stage}</span>
                    <span className="text-muted-foreground">{s.count} ({s.pct}%)</span>
                  </div>
                  <Progress value={s.pct} className="h-2" />
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="partnerships">
          <SectionCard title="Partnership Pipeline" className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { name: 'CloudScale — Technology', status: 'Active', revenue: '$45K/yr', health: 'Healthy' },
                { name: 'DigitalBridge — Consulting', status: 'Active', revenue: '$32K/yr', health: 'Healthy' },
                { name: 'NexGen — Integration', status: 'Active', revenue: '$28K/yr', health: 'At Risk' },
              ].map(p => (
                <div key={p.name} className="flex items-center gap-3 text-[9px] rounded-xl border p-2.5">
                  <div className="flex-1"><div className="font-semibold">{p.name}</div></div>
                  <Badge variant="secondary" className="text-[7px]">{p.status}</Badge>
                  <span className="font-bold">{p.revenue}</span>
                  <Badge className={cn('text-[7px] border-0', p.health === 'Healthy' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>{p.health}</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="pipeline">
          <SectionCard title="Revenue Pipeline" className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { stage: 'Prospecting', value: '$340K', deals: 12 },
                { stage: 'Qualification', value: '$280K', deals: 8 },
                { stage: 'Proposal', value: '$180K', deals: 5 },
                { stage: 'Negotiation', value: '$90K', deals: 2 },
              ].map(s => (
                <div key={s.stage} className="flex items-center gap-3 text-[9px] rounded-xl border p-2.5">
                  <div className="flex-1"><div className="font-semibold">{s.stage}</div><div className="text-[8px] text-muted-foreground">{s.deals} deals</div></div>
                  <span className="text-sm font-bold text-accent">{s.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default EnterpriseAnalyticsPage;
