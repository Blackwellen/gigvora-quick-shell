import React, { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Unlock, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFinReleaseHold } from '@/hooks/useFinanceAdmin';

interface ReleaseHoldDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hold?: {
    id: string;
    amount_minor?: number;
    currency?: string;
    reason?: string;
    owner_id?: string;
  } | null;
}

export const ReleaseHoldDialog: React.FC<ReleaseHoldDialogProps> = ({ open, onOpenChange, hold }) => {
  const [note, setNote] = useState('');
  const release = useFinReleaseHold();

  useEffect(() => { if (!open) setNote(''); }, [open]);

  const submit = async () => {
    if (!hold?.id) return;
    if (!note.trim()) {
      toast.error('Release note is required for the audit trail');
      return;
    }
    try {
      await release.mutateAsync({ holdId: hold.id, note: note.trim() });
      toast.success(`Hold ${hold.id} released`);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to release hold');
    }
  };

  const formatted = hold?.amount_minor !== undefined && hold?.currency
    ? `${hold.currency} ${(hold.amount_minor / 100).toFixed(2)}`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Unlock className="h-4 w-4 text-accent" />
            Release hold {hold?.id ? <span className="font-mono text-xs">{hold.id}</span> : null}
          </DialogTitle>
          <DialogDescription className="text-[11px]">
            Releasing this hold will resume the underlying payout or wallet flow. The action
            is logged to the immutable audit ledger.
          </DialogDescription>
        </DialogHeader>

        {hold && (
          <div className="rounded-xl border p-3 space-y-1 text-[11px]">
            {formatted && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold">{formatted}</span>
              </div>
            )}
            {hold.reason && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reason</span>
                <span className="capitalize">{hold.reason}</span>
              </div>
            )}
            {hold.owner_id && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner</span>
                <span className="font-mono">{hold.owner_id}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="release-note" className="text-[11px]">Release note</Label>
          <Textarea
            id="release-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Why is this hold being released? (audited)"
            className="min-h-[80px] text-xs rounded-xl"
          />
        </div>

        <div className="rounded-lg border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-2.5 text-[10px] flex gap-2">
          <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))] shrink-0 mt-0.5" />
          <span>Releasing a hold cannot be undone. Confirm KYC, dispute, and risk posture before continuing.</span>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => onOpenChange(false)}
            disabled={release.isPending}
          >
            Cancel
          </Button>
          <Button
            className="rounded-xl gap-1.5"
            onClick={submit}
            disabled={release.isPending || !hold}
          >
            {release.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            Confirm release
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ReleaseHoldDialog;
