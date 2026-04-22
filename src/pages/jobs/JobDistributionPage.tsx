import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Share2, Plus, Globe, Zap, Building2, Users, CheckCircle, AlertTriangle, RefreshCcw, DollarSign } from 'lucide-react';

const CHANNELS = [
  { name: 'Gigvora Job Board', type: 'Organic', status: 'live' as const, impressions: 3200, applications: 28, cost: 'Free', autoRenew: true },
  { name: 'LinkedIn', type: 'Premium', status: 'live' as const, impressions: 8400, applications: 12, cost: '$150', autoRenew: true },
  { name: 'Indeed', type: 'Sponsored', status: 'live' as const, impressions: 5600, applications: 18, cost: '$80', autoRenew: false },
  { name: 'Internal Referrals', type: 'Organic', status: 'live' as const, impressions: 0, applications: 4, cost: 'Free', autoRenew: false },
  { name: 'University Boards', type: 'Organic', status: 'pending' as const, impressions: 0, applications: 0, cost: 'Free', autoRenew: false },
  { name: 'Niche Tech Board', type: 'Premium', status: 'review' as const, impressions: 0, applications: 0, cost: '$200', autoRenew: false },
];

export default function JobDistributionPage() {
  return (
    <DashboardLayout topStrip={<><Share2 className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Job Distribution & Sourcing</span><div className="flex-1" /><Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Add Channel</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Active Channels" value="4" className="!rounded-2xl" />
        <KPICard label="Total Impressions" value="17.2K" className="!rounded-2xl" />
        <KPICard label="Applications" value="62" className="!rounded-2xl" />
        <KPICard label="Sourcing Spend" value="$430" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Distribution Channels" className="!rounded-2xl mb-3">
        <div className="space-y-2">
          {CHANNELS.map((c, i) => (
            <div key={i} className="rounded-2xl border p-3 flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                {c.type === 'Organic' ? <Globe className="h-4 w-4 text-muted-foreground" /> : <Zap className="h-4 w-4 text-accent" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[10px] font-bold">{c.name}</span>
                  <StatusBadge status={c.status === 'live' ? 'healthy' : c.status === 'pending' ? 'pending' : 'review'} label={c.status} />
                  <Badge variant="outline" className="text-[7px] rounded-md">{c.type}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                  <span>{c.impressions.toLocaleString()} impressions</span>
                  <span>{c.applications} applications</span>
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />{c.cost}</span>
                  {c.autoRenew && <span className="flex items-center gap-0.5"><RefreshCcw className="h-2.5 w-2.5" />Auto-renew</span>}
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Manage</Button>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Credits & Budget" className="!rounded-2xl">
          <div className="space-y-2">
            <div className="flex justify-between text-[9px]"><span>Job posting credits</span><span className="font-bold">12/50 used</span></div>
            <Progress value={24} className="h-1.5 rounded-full" />
            <div className="flex justify-between text-[9px]"><span>Sponsorship budget</span><span className="font-bold">$430 / $1,000</span></div>
            <Progress value={43} className="h-1.5 rounded-full" />
            <Button variant="outline" className="w-full h-7 text-[9px] rounded-xl mt-1">Buy More Credits</Button>
          </div>
        </SectionCard>
        <SectionCard title="Source Quality" className="!rounded-2xl">
          <div className="space-y-1.5">
            {[{ source: 'Gigvora', quality: 82 }, { source: 'LinkedIn', quality: 74 }, { source: 'Indeed', quality: 68 }, { source: 'Referrals', quality: 91 }].map(s => (
              <div key={s.source}>
                <div className="flex justify-between text-[8px] mb-0.5"><span className="font-medium">{s.source}</span><span className="font-bold">{s.quality}%</span></div>
                <Progress value={s.quality} className="h-1 rounded-full" />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
