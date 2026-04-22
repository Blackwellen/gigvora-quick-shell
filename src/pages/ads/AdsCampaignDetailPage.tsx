import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Megaphone, BarChart3, DollarSign, Target, Eye, MousePointer,
  TrendingUp, Clock, Image, Users, Globe, Layers, Play, Pause,
  Edit, Copy, Settings,
} from 'lucide-react';

const AdsCampaignDetailPage: React.FC = () => {
  const topStrip = (
    <>
      <Megaphone className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Q2 Brand Awareness</span>
      <Badge className="bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] text-[7px] border-0">Active</Badge>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Edit className="h-3 w-3" />Edit</Button>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Pause className="h-3 w-3" />Pause</Button>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Copy className="h-3 w-3" />Duplicate</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Campaign Settings" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Objective', v: 'Awareness' },
            { l: 'Budget', v: '$5,000' },
            { l: 'Bid Strategy', v: 'Auto (Lowest Cost)' },
            { l: 'Schedule', v: 'Mar 15 – May 15' },
            { l: 'Placements', v: 'Feed, Stories, Sidebar' },
            { l: 'Optimization', v: 'Impressions' },
          ].map(m => (
            <div key={m.l} className="flex justify-between py-1 border-b last:border-0">
              <span className="text-muted-foreground">{m.l}</span>
              <span className="font-semibold">{m.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Delivery Health" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div><div className="flex justify-between mb-0.5"><span>Budget Used</span><span className="font-semibold">47%</span></div><Progress value={47} className="h-1" /></div>
          <div><div className="flex justify-between mb-0.5"><span>Schedule</span><span className="font-semibold">62%</span></div><Progress value={62} className="h-1" /></div>
          <div className="text-[8px] text-[hsl(var(--state-healthy))] font-medium">On pace — delivery healthy</div>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52">
      <KPIBand className="mb-3">
        <KPICard label="Impressions" value="145K" change="+12K today" trend="up" className="!rounded-2xl" />
        <KPICard label="Clicks" value="3.2K" change="CTR: 2.2%" className="!rounded-2xl" />
        <KPICard label="Conversions" value="45" change="CPA: $52" className="!rounded-2xl" />
        <KPICard label="ROAS" value="3.4x" change="+0.3x" trend="up" className="!rounded-2xl" />
      </KPIBand>

      <Tabs defaultValue="adsets">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="adsets" className="text-[10px] h-7 px-2.5 rounded-xl"><Layers className="h-3 w-3 mr-1" />Ad Sets (3)</TabsTrigger>
          <TabsTrigger value="creatives" className="text-[10px] h-7 px-2.5 rounded-xl"><Image className="h-3 w-3 mr-1" />Creatives (8)</TabsTrigger>
          <TabsTrigger value="audience" className="text-[10px] h-7 px-2.5 rounded-xl"><Users className="h-3 w-3 mr-1" />Audience</TabsTrigger>
          <TabsTrigger value="geo" className="text-[10px] h-7 px-2.5 rounded-xl"><Globe className="h-3 w-3 mr-1" />Geo</TabsTrigger>
        </TabsList>

        <TabsContent value="adsets">
          <div className="space-y-2">
            {[
              { name: 'Tech Decision Makers', budget: '$2,000', spent: '$940', impr: '62K', clicks: '1.4K', ctr: '2.3%', status: 'active' },
              { name: 'Startup Founders', budget: '$1,500', spent: '$720', impr: '48K', clicks: '1.1K', ctr: '2.3%', status: 'active' },
              { name: 'Enterprise HR Leaders', budget: '$1,500', spent: '$680', impr: '35K', clicks: '700', ctr: '2.0%', status: 'active' },
            ].map(as => (
              <div key={as.name} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="text-[11px] font-bold">{as.name}</div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">Budget: {as.budget} · Spent: {as.spent}</div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center text-[9px]">
                    <div><div className="font-bold">{as.impr}</div><div className="text-[7px] text-muted-foreground">Impr</div></div>
                    <div><div className="font-bold">{as.clicks}</div><div className="text-[7px] text-muted-foreground">Clicks</div></div>
                    <div><div className="font-bold">{as.ctr}</div><div className="text-[7px] text-muted-foreground">CTR</div></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="creatives">
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: 'Hero Banner v3', type: 'image', impr: '45K', ctr: '2.8%', status: 'strong' },
              { name: 'Product Demo 15s', type: 'video', impr: '32K', ctr: '3.1%', status: 'strong' },
              { name: 'Testimonial Carousel', type: 'carousel', impr: '28K', ctr: '2.4%', status: 'new' },
              { name: 'Feature Highlight', type: 'image', impr: '22K', ctr: '1.8%', status: 'declining' },
            ].map(cr => (
              <div key={cr.name} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-all">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary" className="text-[7px] capitalize">{cr.type}</Badge>
                  <Badge className={cn('text-[7px] border-0', cr.status === 'strong' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : cr.status === 'declining' ? 'bg-destructive/10 text-destructive' : 'bg-accent/10 text-accent')}>{cr.status}</Badge>
                </div>
                <div className="text-[11px] font-semibold">{cr.name}</div>
                <div className="flex gap-3 mt-1 text-[9px] text-muted-foreground">
                  <span>{cr.impr} impr</span><span>{cr.ctr} CTR</span>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audience">
          <SectionCard title="Target Audience" className="!rounded-2xl">
            <div className="space-y-2 text-[9px]">
              {[
                { l: 'Age', v: '25-54' }, { l: 'Gender', v: 'All' }, { l: 'Interests', v: 'Technology, Business, Recruiting' },
                { l: 'Job Titles', v: 'CTO, VP Engineering, Head of Talent' }, { l: 'Company Size', v: '50-1000+' },
                { l: 'Estimated Reach', v: '2.4M - 3.1M' },
              ].map(m => (
                <div key={m.l} className="flex justify-between py-1 border-b last:border-0">
                  <span className="text-muted-foreground">{m.l}</span><span className="font-semibold">{m.v}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        <TabsContent value="geo">
          <SectionCard title="Geographic Distribution" className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { region: 'United States', impr: '89K', spend: '$1,420', pct: 61 },
                { region: 'United Kingdom', impr: '28K', spend: '$450', pct: 19 },
                { region: 'Canada', impr: '18K', spend: '$290', pct: 13 },
                { region: 'Australia', impr: '10K', spend: '$180', pct: 7 },
              ].map(g => (
                <div key={g.region} className="rounded-xl border p-2.5">
                  <div className="flex justify-between text-[9px] mb-0.5"><span className="font-medium">{g.region}</span><span className="text-muted-foreground">{g.impr} · {g.spend}</span></div>
                  <Progress value={g.pct} className="h-1" />
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default AdsCampaignDetailPage;
