/**
 * Encrypted Bank Details vault — gated to fin_admin / super_admin.
 * Wired to the FD-16 enterprise vault (`useFinanceVault` → NestJS bridge).
 * Reveals require a 4-500 char reason and are written to the FCA-safe audit
 * trail BEFORE plaintext reaches the client.
 */
import React, { useState } from 'react';
import { FinPageShell, FinPageHeader, FinBackLink, FinTable } from './_shared';
import { useAdminAuth } from '@/lib/adminAuth';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Lock, Eye, EyeOff, ShieldAlert, AlertTriangle, History } from 'lucide-react';
import { toast } from 'sonner';
import { useBankVault, useRevealBankRecord, type BankRecord } from '@/hooks/useFinanceVault';

const REVEAL_FIELDS = [
  { key: 'account_number',  label: 'Account number' },
  { key: 'sort_or_routing', label: 'Sort / routing' },
  { key: 'iban',            label: 'IBAN' },
  { key: 'swift_bic',       label: 'SWIFT / BIC' },
] as const;

const FinBankDetailsPage: React.FC = () => {
  const { user } = useAdminAuth();
  const isSuper = !!user?.isSuperAdmin;
  const { data: rows = [] } = useBankVault();
  const reveal = useRevealBankRecord();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [fields, setFields] = useState<string[]>(['account_number']);
  const [revealedFor, setRevealedFor] = useState<Record<string, Record<string, string | null>>>({});

  if (!isSuper) {
    return (
      <FinPageShell>
        <FinBackLink />
        <FinPageHeader eyebrow="Bank Details (Encrypted)" title="Encrypted bank vault" subtitle="AES-256-GCM at rest. FCA-safe reveal audit." />
        <div className="rounded-xl border bg-card p-10 text-center">
          <div className="mx-auto h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center mb-4">
            <ShieldAlert className="h-6 w-6 text-rose-600" />
          </div>
          <h2 className="text-lg font-semibold">Super Admin access required</h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Encrypted bank credentials are restricted to Super Admins under FCA / GDPR PII safeguards.
            Every reveal is logged to an append-only audit trail.
          </p>
        </div>
      </FinPageShell>
    );
  }

  const submitReveal = async () => {
    if (!activeId) return;
    if (reason.trim().length < 4) { toast.error('Reason must be at least 4 characters.'); return; }
    if (!fields.length)            { toast.error('Select at least one field.'); return; }
    try {
      const res = await reveal.mutateAsync({ id: activeId, reason: reason.trim(), fields });
      setRevealedFor((m) => ({ ...m, [activeId]: res.revealed }));
      toast.success('Reveal logged to audit trail.', { description: `Fields: ${fields.join(', ')}` });
      setActiveId(null); setReason(''); setFields(['account_number']);
    } catch (e: any) {
      toast.error('Reveal blocked', { description: e?.message ?? 'Server rejected the reveal request.' });
    }
  };

  const renderMasked = (r: BankRecord, key: 'account_number' | 'sort_or_routing') => {
    const plaintext = revealedFor[r.id]?.[key];
    if (plaintext) return <span className="font-mono text-xs">{plaintext}</span>;
    if (key === 'account_number') return <span className="font-mono text-xs">••••{r.account_last4}</span>;
    return <span className="font-mono text-xs">•••• ••••</span>;
  };

  return (
    <FinPageShell>
      <FinBackLink />
      <FinPageHeader
        eyebrow="Bank Details (Encrypted)"
        title="Encrypted bank vault"
        subtitle="AES-256-GCM at rest. Reveals require a written reason and are recorded with actor, IP, UA, session id."
        right={<Badge variant="destructive" className="gap-1.5"><Lock className="h-3 w-3" /> Restricted</Badge>}
      />
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 mb-6 flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
        <div className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
          You are operating on PII under FCA + GDPR. Every reveal is recorded and immutable. Do not
          screenshot. Do not transmit outside the platform. Reveals self-clear on page reload.
        </div>
      </div>

      <FinTable
        headers={['Account', 'Owner', 'Country', 'Sort / Routing', 'Account number', 'Verified', '']}
        rows={rows.map((r) => [
          <span className="font-mono text-xs">{r.id.slice(0, 8)}</span>,
          <div>
            <div className="font-medium">{r.display_label}</div>
            <div className="text-[11px] text-muted-foreground">{r.account_holder_name}</div>
          </div>,
          <Badge variant="outline" className="text-[10px]">{r.country}</Badge>,
          renderMasked(r, 'sort_or_routing'),
          renderMasked(r, 'account_number'),
          r.verified
            ? <Badge variant="secondary" className="text-[10px]">Verified</Badge>
            : <Badge variant="outline" className="text-[10px]">Pending</Badge>,
          <div className="flex items-center gap-1.5">
            <Button size="sm" variant="ghost" onClick={() => { setActiveId(r.id); setRevealedFor((m) => { const c = { ...m }; delete c[r.id]; return c; }); }}>
              {revealedFor[r.id] ? <><EyeOff className="h-3.5 w-3.5 mr-1.5" /> Hide</> : <><Eye className="h-3.5 w-3.5 mr-1.5" /> Reveal</>}
            </Button>
            <Button size="sm" variant="ghost" asChild>
              <a href={`#/audit/bank/${r.id}`}><History className="h-3.5 w-3.5" /></a>
            </Button>
          </div>,
        ])}
      />

      <Dialog open={!!activeId} onOpenChange={(v) => { if (!v) { setActiveId(null); setReason(''); }}}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reveal encrypted PII</DialogTitle>
            <DialogDescription>This reveal will be logged to the FCA-safe audit trail before plaintext is returned.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-xs">Reason (required, 4-500 chars)</Label>
              <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Payout failure investigation #INV-1042 — verifying account number with bank" rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Fields to reveal</Label>
              {REVEAL_FIELDS.map((f) => (
                <label key={f.key} className="flex items-center gap-2 text-sm">
                  <Checkbox checked={fields.includes(f.key)} onCheckedChange={(v) => {
                    setFields((cur) => v ? [...cur, f.key] : cur.filter((x) => x !== f.key));
                  }} />
                  {f.label}
                </label>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setActiveId(null); setReason(''); }}>Cancel</Button>
            <Button variant="destructive" onClick={submitReveal} disabled={reveal.isPending}>
              {reveal.isPending ? 'Revealing…' : 'Reveal & log audit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </FinPageShell>
  );
};
export default FinBankDetailsPage;
