import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, Clock, DollarSign, Eye, CheckCircle2, XCircle, Scale, RotateCcw } from 'lucide-react';

const HISTORY = [
  { id: 'DSP-980', type: 'Dispute', subject: 'Incomplete delivery — Logo Design', amount: 750, outcome: 'Refund (Full)', method: 'Mediation', resolved: 'Mar 28, 2026', duration: '5 days', initiator: 'Client', respondent: 'FreelancerX' },
  { id: 'DSP-964', type: 'Dispute', subject: 'Scope disagreement — Web Dev', amount: 4200, outcome: 'Partial Refund ($1,800)', method: 'Arbitration', resolved: 'Mar 15, 2026', duration: '12 days', initiator: 'Client', respondent: 'DevStudio' },
  { id: 'RFD-501', type: 'Refund', subject: 'Service cancelled before start', amount: 300, outcome: 'Refund (Full)', method: 'Auto-approved', resolved: 'Mar 10, 2026', duration: '1 day', initiator: 'Client', respondent: 'QuickDesign' },
  { id: 'DSP-948', type: 'Dispute', subject: 'Late delivery penalty', amount: 1500, outcome: 'Dismissed', method: 'Mediation', resolved: 'Feb 28, 2026', duration: '8 days', initiator: 'Seller', respondent: 'ClientCo' },
  { id: 'RFD-488', type: 'Refund', subject: 'Duplicate payment correction', amount: 200, outcome: 'Refund (Full)', method: 'Auto-approved', resolved: 'Feb 20, 2026', duration: '2 days', initiator: 'System', respondent: 'N/A' },
  { id: 'DSP-930', type: 'Dispute', subject: 'Quality standards not met', amount: 2800, outcome: 'Rework Required', method: 'Arbitration', resolved: 'Feb 10, 2026', duration: '15 days', initiator: 'Client', respondent: 'AgencyPro' },
];

const outcomeColors: Record<string, string> = {
  'Refund (Full)': 'text-[hsl(var(--state-critical))]',
  'Dismissed': 'text-muted-foreground',
  'Rework Required': 'text-[hsl(var(--gigvora-amber))]',
};

export default function ResolutionHistoryPage() {
  const [tab, setTab] = useState('all');
  const filtered = tab === 'all' ? HISTORY : HISTORY.filter(h => h.type.toLowerCase() === tab);

  return (
    <DashboardLayout topStrip={<><History className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Resolution History</span><div className="flex-1" /></>}>
      <KPIBand className="mb-3">
        <KPICard label="Total Cases" value={String(HISTORY.length)} className="!rounded-2xl" />
        <KPICard label="Disputes" value={String(HISTORY.filter(h => h.type === 'Dispute').length)} className="!rounded-2xl" />
        <KPICard label="Refunds" value={String(HISTORY.filter(h => h.type === 'Refund').length)} className="!rounded-2xl" />
        <KPICard label="Total Value" value={`$${(HISTORY.reduce((a, h) => a + h.amount, 0) / 1000).toFixed(1)}K`} className="!rounded-2xl" />
      </KPIBand>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-8">
          <TabsTrigger value="all" className="text-[10px] px-3">All ({HISTORY.length})</TabsTrigger>
          <TabsTrigger value="dispute" className="text-[10px] px-3">Disputes ({HISTORY.filter(h => h.type === 'Dispute').length})</TabsTrigger>
          <TabsTrigger value="refund" className="text-[10px] px-3">Refunds ({HISTORY.filter(h => h.type === 'Refund').length})</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(h => (
          <SectionCard key={h.id} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <Badge variant="outline" className="text-[8px] h-3.5 font-mono">{h.id}</Badge>
                  <span className="text-[11px] font-bold">{h.subject}</span>
                  <Badge variant="outline" className="text-[7px] rounded-md">{h.type}</Badge>
                  <Badge variant="outline" className="text-[7px] rounded-md">{h.method}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-1">
                  <span className="flex items-center gap-0.5"><DollarSign className="h-2.5 w-2.5" />${h.amount.toLocaleString()}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{h.duration}</span>
                  <span>Resolved {h.resolved}</span>
                  <span>{h.initiator} vs {h.respondent}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] font-medium">Outcome:</span>
                  <span className={`text-[9px] font-bold ${outcomeColors[h.outcome] || 'text-[hsl(var(--state-healthy))]'}`}>
                    {h.outcome.includes('Refund') ? <RotateCcw className="h-2.5 w-2.5 inline mr-0.5" /> : h.outcome === 'Dismissed' ? <XCircle className="h-2.5 w-2.5 inline mr-0.5" /> : <Scale className="h-2.5 w-2.5 inline mr-0.5" />}
                    {h.outcome}
                  </span>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" />View</Button>
            </div>
          </SectionCard>
        ))}
      </div>
    </DashboardLayout>
  );
}
