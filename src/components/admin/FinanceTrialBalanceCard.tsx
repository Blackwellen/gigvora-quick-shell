/**
 * Trial-Balance card — per-bucket totals from the FD-16 double-entry ledger.
 * Surfaces the held-credits / commission / ad-spend separation that FCA +
 * safeguarding rules require. Reads from `/api/v1/finance-vault/ledger/trial-balance`.
 */
import React from 'react';
import { useTrialBalance } from '@/hooks/useFinanceVault';
import { Badge } from '@/components/ui/badge';
import { Wallet } from 'lucide-react';

const BUCKET_GROUPS: Array<{ title: string; buckets: string[]; tone: 'safe' | 'revenue' | 'liability' | 'ops' }> = [
  { title: 'Safeguarded',         buckets: ['safeguarded_client_funds', 'escrow', 'held_credits'],         tone: 'safe' },
  { title: 'Platform revenue',    buckets: ['commission_revenue', 'subscription_revenue', 'platform_revenue'], tone: 'revenue' },
  { title: 'Liabilities',         buckets: ['commission_payable', 'tax_payable', 'refund_payable'],        tone: 'liability' },
  { title: 'Ad spend',            buckets: ['ad_spend_prepaid', 'ad_spend_consumed'],                     tone: 'ops' },
];

const TONE: Record<string, string> = {
  safe:      'border-emerald-500/30 bg-emerald-500/5',
  revenue:   'border-sky-500/30 bg-sky-500/5',
  liability: 'border-amber-500/30 bg-amber-500/5',
  ops:       'border-violet-500/30 bg-violet-500/5',
};

function fmt(minor: number, currency: string) {
  try {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(minor / 100);
  } catch {
    return `${currency} ${(minor / 100).toFixed(2)}`;
  }
}

export const FinanceTrialBalanceCard: React.FC = () => {
  const { data: rows = [] } = useTrialBalance();
  const byBucket = new Map<string, { total_minor: number; currency: string; accounts: number }>();
  for (const r of rows) byBucket.set(r.bucket, r);

  return (
    <div className="rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Trial balance — bucket separation</h3>
        </div>
        <Badge variant="secondary" className="text-[10px]">Double-entry ledger</Badge>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {BUCKET_GROUPS.map((g) => (
          <div key={g.title} className={`rounded-xl border p-3 ${TONE[g.tone]}`}>
            <div className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground mb-2">{g.title}</div>
            <div className="space-y-1.5">
              {g.buckets.map((b) => {
                const row = byBucket.get(b);
                return (
                  <div key={b} className="flex items-baseline justify-between gap-3">
                    <span className="text-xs text-muted-foreground">{b.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-sm font-medium">
                      {row ? fmt(Number(row.total_minor), row.currency) : '—'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-[11px] text-muted-foreground leading-relaxed">
        Buckets are enforced at the database layer — funds in <em>safeguarded_client_funds</em>,
        <em> held_credits</em>, and <em>escrow</em> can never be silently rebalanced into platform
        revenue. Movements require a balanced journal entry and are append-only.
      </p>
    </div>
  );
};
