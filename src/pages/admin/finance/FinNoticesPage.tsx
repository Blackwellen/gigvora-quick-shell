import React from 'react';
import { FinPageShell, FinPageHeader, FinBackLink } from './_shared';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, AlertTriangle, Info } from 'lucide-react';

const NOTICES = [
  { id: 'NT-219', severity: 'warn', title: 'EU SEPA payouts delayed by ~24h', body: 'Our payments processor is reporting delays on EUR SEPA payouts. New ETA: tomorrow 12:00 UTC.', active: true },
  { id: 'NT-218', severity: 'info', title: 'Q3 invoice consolidation rolled out', body: 'Customers on annual plans will now receive a single consolidated quarterly invoice.', active: true },
  { id: 'NT-217', severity: 'warn', title: 'Card decline rates elevated for AmEx', body: 'Investigating elevated decline rates on AmEx for UK cardholders.', active: false },
];

const FinNoticesPage: React.FC = () => (
  <FinPageShell>
    <FinBackLink />
    <FinPageHeader
      eyebrow="Notices"
      title="Customer-facing finance notices"
      subtitle="Banners and advisories shown to customers in their billing area."
      right={<Button size="sm"><Plus className="h-3.5 w-3.5 mr-1.5" /> New notice</Button>}
    />
    <div className="grid gap-3">
      {NOTICES.map((n) => (
        <div key={n.id} className="rounded-xl border bg-card p-4">
          <div className="flex items-start gap-3">
            <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${n.severity === 'warn' ? 'bg-amber-500/10 text-amber-600' : 'bg-sky-500/10 text-sky-600'}`}>
              {n.severity === 'warn' ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-muted-foreground">{n.id}</span>
                <Badge variant={n.active ? 'secondary' : 'outline'} className="text-[10px]">{n.active ? 'Active' : 'Archived'}</Badge>
              </div>
              <div className="text-sm font-medium mt-1">{n.title}</div>
              <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{n.body}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </FinPageShell>
);
export default FinNoticesPage;
