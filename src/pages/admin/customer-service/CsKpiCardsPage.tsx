import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LayoutGrid, Plus, Settings2, EyeOff, Eye, Lock } from 'lucide-react';
import { CsBackLink, CsPageHeader, CsPageShell } from './_shared';
import { useAdminAuth } from '@/lib/adminAuth';
import { toast } from 'sonner';

interface Card { id: string; label: string; metric: string; visible: boolean; ownerOnly: boolean }

const SEED: Card[] = [
  { id: 'k1', label: 'Open tickets', metric: 'count(tickets where status in [pending,active,waiting_customer])', visible: true, ownerOnly: false },
  { id: 'k2', label: 'SLA at-risk', metric: 'count(tickets where sla_due_at < now()+15m)', visible: true, ownerOnly: false },
  { id: 'k3', label: 'Avg first response', metric: 'avg(first_response_seconds 7d)', visible: true, ownerOnly: false },
  { id: 'k4', label: 'CSAT (7d)', metric: 'avg(csat_score 7d)', visible: true, ownerOnly: false },
  { id: 'k5', label: 'Refunds processed today', metric: 'sum(refund_amount today)', visible: true, ownerOnly: true },
  { id: 'k6', label: 'VIP ticket SLA', metric: 'avg(first_response_seconds where vip 7d)', visible: false, ownerOnly: true },
];

const CsKpiCardsPage: React.FC = () => {
  const { user } = useAdminAuth();
  const isSuper = user?.isSuperAdmin ?? false;
  const [cards, setCards] = useState(SEED);

  const toggleVisible = (id: string) => {
    if (!isSuper) return toast.error('Only Super Admin can change KPI card configuration');
    setCards(cards.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
    toast.success('KPI card updated');
  };

  return (
    <CsPageShell>
      <CsBackLink />
      <CsPageHeader
        eyebrow="Custom KPI Cards" title="KPI card configuration"
        subtitle="Cards exposed at the top of CS dashboards. Super-Admin gated."
        right={isSuper ? (
          <Button size="sm" className="h-8 text-xs"><Plus className="h-3.5 w-3.5 mr-1" /> New card</Button>
        ) : (
          <Badge variant="outline" className="text-[10px] inline-flex items-center gap-1"><Lock className="h-3 w-3" /> Read-only</Badge>
        )}
      />

      {!isSuper && (
        <div className="rounded-xl border bg-amber-500/5 border-amber-500/30 p-3.5 mb-4 text-xs flex items-start gap-2">
          <Lock className="h-3.5 w-3.5 text-amber-600 mt-0.5" />
          <div>
            <div className="font-medium text-amber-700 dark:text-amber-300">Super-Admin only</div>
            <div className="text-muted-foreground mt-0.5">You can preview KPI cards but not change configuration. Sign in as Super Admin to edit.</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {cards.map((c) => (
          <div key={c.id} className={cn('rounded-xl border bg-card p-4', !c.visible && 'opacity-60')}>
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-muted/60 flex items-center justify-center">
                  <LayoutGrid className="h-4 w-4 text-foreground" />
                </div>
                <div>
                  <div className="text-sm font-medium">{c.label}</div>
                  <div className="text-[10px] text-muted-foreground">{c.ownerOnly ? 'Owner only' : 'All operators'}</div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggleVisible(c.id)} disabled={!isSuper}
                  className={cn('h-7 w-7 rounded-md hover:bg-muted/60 inline-flex items-center justify-center',
                    !isSuper && 'cursor-not-allowed opacity-50')}>
                  {c.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                </button>
                <button disabled={!isSuper}
                  className={cn('h-7 w-7 rounded-md hover:bg-muted/60 inline-flex items-center justify-center',
                    !isSuper && 'cursor-not-allowed opacity-50')}>
                  <Settings2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
            <code className="block text-[10px] text-muted-foreground bg-muted/40 rounded p-2 font-mono break-all">{c.metric}</code>
          </div>
        ))}
      </div>
    </CsPageShell>
  );
};

export default CsKpiCardsPage;
