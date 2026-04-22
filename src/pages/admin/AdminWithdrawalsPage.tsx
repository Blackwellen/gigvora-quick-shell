import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Wallet, Clock, CheckCircle2, XCircle, AlertTriangle,
  DollarSign, ArrowRight, Shield, Settings, Users, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type WStatus = 'pending' | 'processing' | 'approved' | 'rejected' | 'completed';

interface Withdrawal {
  id: string; user: string; amount: string; method: string;
  status: WStatus; requested: string; processed?: string;
  riskFlag?: boolean; reason?: string;
}

const STATUS_CLS: Record<WStatus, string> = {
  pending: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  processing: 'bg-accent/10 text-accent',
  approved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  rejected: 'bg-destructive/10 text-destructive',
  completed: 'bg-muted text-muted-foreground',
};

const WITHDRAWALS: Withdrawal[] = [
  { id: 'WD-8841', user: 'Sarah Chen', amount: '$2,450', method: 'Bank Transfer (ACH)', status: 'pending', requested: '15 min ago', riskFlag: false },
  { id: 'WD-8839', user: 'DevCraft Studio', amount: '$8,200', method: 'Wire Transfer', status: 'pending', requested: '1 hour ago', riskFlag: true, reason: 'Amount exceeds $5K threshold' },
  { id: 'WD-8836', user: 'Priya Sharma', amount: '$680', method: 'PayPal', status: 'processing', requested: '3 hours ago' },
  { id: 'WD-8832', user: 'Marcus Johnson', amount: '$1,100', method: 'Bank Transfer (ACH)', status: 'approved', requested: '6 hours ago', processed: '2 hours ago' },
  { id: 'WD-8828', user: 'Growth Hackers', amount: '$12,500', method: 'Wire Transfer', status: 'completed', requested: '1 day ago', processed: '12 hours ago' },
  { id: 'WD-8825', user: 'Lena Müller', amount: '$340', method: 'PayPal', status: 'rejected', requested: '1 day ago', processed: '18 hours ago', reason: 'Incomplete KYC verification' },
];

export default function AdminWithdrawalsPage() {
  const [tab, setTab] = useState('all');
  const [autoApprove, setAutoApprove] = useState(true);
  const [autoThreshold, setAutoThreshold] = useState(1000);

  const filtered = WITHDRAWALS.filter(w => tab === 'all' || w.status === tab);

  return (
    <DashboardLayout topStrip={
      <>
        <Wallet className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Withdrawal Management</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px]">{WITHDRAWALS.filter(w => w.status === 'pending').length} Pending</Badge>
      </>
    } rightRail={
      <div className="space-y-3">
        <SectionCard title="Auto-Approve Settings" icon={<Settings className="h-3.5 w-3.5 text-accent" />}>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold">Auto-Approve</div>
                <div className="text-[8px] text-muted-foreground">Automatically approve low-risk withdrawals</div>
              </div>
              <Switch checked={autoApprove} onCheckedChange={setAutoApprove} />
            </div>
            <div>
              <div className="text-[9px] font-semibold mb-1">Auto-Approve Threshold</div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-muted-foreground">Under</span>
                <Badge className="text-[9px] bg-accent/10 text-accent border-0">${autoThreshold.toLocaleString()}</Badge>
              </div>
              <div className="flex gap-1 mt-1.5">
                {[500, 1000, 2500, 5000].map(v => (
                  <Button key={v} variant={autoThreshold === v ? 'default' : 'outline'} size="sm" className="h-6 text-[8px] rounded-lg flex-1" onClick={() => setAutoThreshold(v)}>${v >= 1000 ? `${v / 1000}K` : v}</Button>
                ))}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold">Require KYC</div>
                <div className="text-[8px] text-muted-foreground">Block withdrawals without verified identity</div>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[9px] font-semibold">Fraud Detection</div>
                <div className="text-[8px] text-muted-foreground">AI-powered risk scoring</div>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </SectionCard>
        <SectionCard title="Today's Summary">
          <div className="space-y-1.5 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Total Requests</span><span className="font-bold">14</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Auto-Approved</span><span className="font-bold text-[hsl(var(--state-healthy))]">8</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Manual Review</span><span className="font-bold text-[hsl(var(--gigvora-amber))]">4</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Rejected</span><span className="font-bold text-destructive">2</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Total Volume</span><span className="font-bold text-accent">$42.8K</span></div>
          </div>
        </SectionCard>
      </div>
    } rightRailWidth="w-56">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Pending" value={String(WITHDRAWALS.filter(w => w.status === 'pending').length)} />
        <KPICard label="Processing" value={String(WITHDRAWALS.filter(w => w.status === 'processing').length)} />
        <KPICard label="Today Volume" value="$25.3K" />
        <KPICard label="Avg Processing" value="4.2h" />
        <KPICard label="Risk Flags" value={String(WITHDRAWALS.filter(w => w.riskFlag).length)} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-7">
          {['all', 'pending', 'processing', 'approved', 'completed', 'rejected'].map(t => (
            <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(w => (
          <div key={w.id} className="p-4 rounded-2xl border border-border/30 bg-card hover:border-accent/30 transition-all">
            <div className="flex items-center gap-3">
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', STATUS_CLS[w.status])}>
                {w.status === 'pending' ? <Clock className="h-4 w-4" /> : w.status === 'approved' || w.status === 'completed' ? <CheckCircle2 className="h-4 w-4" /> : w.status === 'rejected' ? <XCircle className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{w.user}</span>
                  <Badge className={cn('text-[7px] h-3.5 border-0 capitalize', STATUS_CLS[w.status])}>{w.status}</Badge>
                  {w.riskFlag && <Badge className="text-[6px] h-3 bg-destructive/10 text-destructive border-0 gap-0.5"><AlertTriangle className="h-2 w-2" /> Risk</Badge>}
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span className="font-mono">{w.id}</span>
                  <span>{w.method}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{w.requested}</span>
                  {w.reason && <span className="text-destructive">{w.reason}</span>}
                </div>
              </div>
              <span className="text-sm font-bold text-accent">{w.amount}</span>
              {w.status === 'pending' && (
                <div className="flex gap-1">
                  <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5 text-destructive"><XCircle className="h-3 w-3" /> Reject</Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
