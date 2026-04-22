import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Megaphone, Plus, Eye, Pause, Play, Trash2, TrendingUp, DollarSign, Users, Calendar } from 'lucide-react';

const PROMOTIONS = [
  { title: '20% Off Brand Packages', service: 'Brand Identity Design', type: 'Discount', status: 'active' as const, views: 1240, conversions: 34, spend: '$120', start: 'Apr 1', end: 'Apr 30' },
  { title: 'Free Consultation', service: 'SEO Strategy', type: 'Lead Gen', status: 'active' as const, views: 860, conversions: 18, spend: '$80', start: 'Apr 5', end: 'Apr 20' },
  { title: 'Bundle Deal: Logo + Website', service: 'Multiple', type: 'Bundle', status: 'paused' as const, views: 420, conversions: 8, spend: '$200', start: 'Mar 15', end: 'Apr 15' },
  { title: 'Spring Sale', service: 'All Services', type: 'Seasonal', status: 'ended' as const, views: 3200, conversions: 62, spend: '$350', start: 'Mar 1', end: 'Mar 31' },
];

const STATUS_CLASS = {
  active: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  paused: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  ended: 'bg-muted text-muted-foreground',
};

export default function ServicePromotionsPage() {
  return (
    <DashboardLayout topStrip={<><Megaphone className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Service Promotions</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Promotion</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active Promos" value="2" className="!rounded-2xl" />
        <KPICard label="Total Impressions" value="5.7K" className="!rounded-2xl" />
        <KPICard label="Conversions" value="122" className="!rounded-2xl" />
        <KPICard label="Total Spend" value="$750" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {PROMOTIONS.map((p, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{p.title}</span>
                  <Badge className={`text-[7px] border-0 rounded-lg capitalize ${STATUS_CLASS[p.status]}`}>{p.status}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{p.type}</Badge>
                </div>
                <div className="text-[8px] text-muted-foreground mb-1.5">Service: {p.service} · {p.start} — {p.end}</div>
                <div className="flex items-center gap-4 text-[8px]">
                  <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5 text-muted-foreground" />{p.views.toLocaleString()} views</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5 text-muted-foreground" />{p.conversions} conversions</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5 text-muted-foreground" />{p.spend} spent</span>
                  <span className="font-semibold text-accent">{((p.conversions / p.views) * 100).toFixed(1)}% CVR</span>
                </div>
              </div>
              <div className="flex gap-1">
                {p.status === 'active' && <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Pause className="h-2.5 w-2.5" />Pause</Button>}
                {p.status === 'paused' && <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Play className="h-2.5 w-2.5" />Resume</Button>}
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
