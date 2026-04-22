/**
 * Custom KPI Cards — viewable by all finance roles, configurable by Super Admin only.
 */
import React, { useState } from 'react';
import { FinPageShell, FinPageHeader, FinBackLink } from './_shared';
import { useAdminAuth } from '@/lib/adminAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Lock, LayoutGrid } from 'lucide-react';
import { toast } from 'sonner';

interface KpiCard { id: string; label: string; value: string; source: string; }

const SEED: KpiCard[] = [
  { id: 'k1', label: 'Net revenue (24h)', value: '£41,420', source: 'ledger.net_revenue' },
  { id: 'k2', label: 'Pending refunds', value: '23', source: 'refunds.pending.count' },
  { id: 'k3', label: 'Active escrow', value: '£1.42M', source: 'escrow.active.amount' },
  { id: 'k4', label: 'Held credits', value: '£184.2k', source: 'credits.held.amount' },
  { id: 'k5', label: 'Failed payouts (24h)', value: '4', source: 'payouts.failed.count' },
  { id: 'k6', label: 'Chargebacks (7d)', value: '3', source: 'chargebacks.count' },
  { id: 'k7', label: 'MRR', value: '£184,200', source: 'subscriptions.mrr' },
  { id: 'k8', label: 'Ad spend (30d)', value: '£48,600', source: 'ads.spend' },
];

const FinKpiCardsPage: React.FC = () => {
  const { user } = useAdminAuth();
  const isSuper = !!user?.isSuperAdmin;
  const [cards, setCards] = useState<KpiCard[]>(SEED);

  const remove = (id: string) => {
    if (!isSuper) return toast.error('Only Super Admins can edit KPI cards.');
    setCards((c) => c.filter((x) => x.id !== id));
    toast.success('KPI card removed.');
  };

  const add = () => {
    if (!isSuper) return toast.error('Only Super Admins can edit KPI cards.');
    const id = `k${Date.now()}`;
    setCards((c) => [...c, { id, label: 'New KPI', value: '—', source: 'custom.new' }]);
    toast.success('KPI card added — configure its source.');
  };

  return (
    <FinPageShell>
      <FinBackLink />
      <FinPageHeader
        eyebrow="Custom KPI Cards"
        title="Custom KPI cards"
        subtitle="KPI cards surfaced to the Finance dashboard. Editable by Super Admins only."
        right={
          isSuper ? (
            <Button size="sm" onClick={add}><Plus className="h-3.5 w-3.5 mr-1.5" /> Add KPI</Button>
          ) : (
            <Badge variant="outline" className="gap-1.5"><Lock className="h-3 w-3" /> Read-only</Badge>
          )
        }
      />
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {cards.map((c) => (
          <div key={c.id} className="rounded-xl border bg-card p-4 group relative">
            <div className="flex items-center justify-between mb-2">
              <LayoutGrid className="h-4 w-4 text-muted-foreground" />
              {isSuper && (
                <button onClick={() => remove(c.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/10 text-rose-600 transition">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            <div className="text-xl font-semibold tracking-tight tabular-nums">{c.value}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5">{c.label}</div>
            <div className="text-[10px] text-muted-foreground/70 mt-2 font-mono truncate">{c.source}</div>
          </div>
        ))}
      </div>
    </FinPageShell>
  );
};
export default FinKpiCardsPage;
