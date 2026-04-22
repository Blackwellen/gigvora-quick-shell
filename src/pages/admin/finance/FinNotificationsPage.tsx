import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink } from './_shared';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, RefreshCw, ShieldAlert, TrendingUp } from 'lucide-react';

const NOTIFS = [
  { id: 'N-9012', type: 'critical', icon: ShieldAlert, title: 'Chargeback opened on TXN-90412 (£312.00)', time: '4m ago' },
  { id: 'N-9011', type: 'warn', icon: RefreshCw, title: 'Refund RF-1841 failed at provider', time: '12m ago' },
  { id: 'N-9010', type: 'warn', icon: AlertTriangle, title: 'Payout PO-9181 held for KYC review', time: '38m ago' },
  { id: 'N-9009', type: 'info', icon: TrendingUp, title: 'Daily revenue +9.4% vs 7d avg', time: '1h ago' },
  { id: 'N-9008', type: 'critical', icon: ShieldAlert, title: 'Suspicious refund cluster on customer C-8821', time: '2h ago' },
];

const FinNotificationsPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader eyebrow="Notifications" title="Operator notifications" subtitle="Real-time finance ops alerts: chargebacks, failed payouts, KYC, anomalies." />
    <div className="rounded-xl border bg-card divide-y">
      {NOTIFS.map((n) => {
        const Icon = n.icon;
        return (
          <div key={n.id} className="p-4 flex items-start gap-3 hover:bg-muted/30">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${n.type === 'critical' ? 'bg-rose-500/10 text-rose-600' : n.type === 'warn' ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-600'}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium">{n.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{n.id} · {n.time}</div>
            </div>
            <Badge variant={n.type === 'critical' ? 'destructive' : 'secondary'} className="capitalize text-[10px]">{n.type}</Badge>
          </div>
        );
      })}
    </div>
  </FinPageShell>
);
export default FinNotificationsPage;
