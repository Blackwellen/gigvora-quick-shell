import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowDownLeft, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useFinCreateRefund } from '@/hooks/useFinanceAdmin';

interface CreateRefundDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const CATEGORIES = [
  'duplicate', 'fraud', 'dispute', 'goodwill', 'service_failure', 'cancelled', 'partial',
] as const;
const PROVIDERS = ['stripe', 'paddle', 'wallet', 'manual'] as const;

export const CreateRefundDrawer: React.FC<CreateRefundDrawerProps> = ({ open, onOpenChange }) => {
  const [customerId, setCustomerId] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState<typeof CATEGORIES[number]>('service_failure');
  const [provider, setProvider] = useState<typeof PROVIDERS[number]>('stripe');
  const [reason, setReason] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const create = useFinCreateRefund();

  const reset = () => {
    setCustomerId(''); setAmount(''); setCurrency('USD');
    setCategory('service_failure'); setProvider('stripe'); setReason(''); setPaymentRef('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerId.trim() || !amount.trim() || !reason.trim()) {
      toast.error('Customer, amount, and reason are required');
      return;
    }
    const amountMinor = Math.round(parseFloat(amount) * 100);
    if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
      toast.error('Enter a valid positive amount');
      return;
    }
    try {
      await create.mutateAsync({
        customer_id: customerId.trim(),
        amount_minor: amountMinor,
        currency,
        category,
        provider,
        reason: reason.trim(),
        payment_ref: paymentRef.trim() || undefined,
      });
      toast.success(`Refund created for ${currency} ${amount}`);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to create refund');
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-sm flex items-center gap-2">
            <ArrowDownLeft className="h-4 w-4 text-accent" />
            Create Refund
          </SheetTitle>
          <SheetDescription className="text-[10px]">
            Drafts a refund. High-value refunds require dual approval before processing.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={submit} className="mt-4 space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="customer" className="text-[10px]">Customer ID</Label>
            <Input
              id="customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              placeholder="cus_…"
              className="h-9 text-xs rounded-xl"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="amount" className="text-[10px]">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="h-9 text-xs rounded-xl"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency" className="text-[10px]">Currency</Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="h-9 w-full px-2 text-xs rounded-xl border bg-card"
              >
                {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="category" className="text-[10px]">Category</Label>
              <select
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="h-9 w-full px-2 text-xs rounded-xl border bg-card capitalize"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="provider" className="text-[10px]">Provider</Label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => setProvider(e.target.value as any)}
                className="h-9 w-full px-2 text-xs rounded-xl border bg-card capitalize"
              >
                {PROVIDERS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="paymentRef" className="text-[10px]">Payment reference (optional)</Label>
            <Input
              id="paymentRef"
              value={paymentRef}
              onChange={(e) => setPaymentRef(e.target.value)}
              placeholder="pi_… / charge id"
              className="h-9 text-xs rounded-xl"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="reason" className="text-[10px]">Reason</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the refund justification (audited)…"
              className="min-h-[80px] text-xs rounded-xl"
              required
            />
          </div>

          <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2.5 text-[10px] flex gap-2">
            <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
            <span>This action is audited. Refunds above the dual-approval threshold cannot be self-approved.</span>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1 h-9 text-xs rounded-xl"
              onClick={() => onOpenChange(false)}
              disabled={create.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-9 text-xs rounded-xl gap-1.5"
              disabled={create.isPending}
            >
              {create.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
              Create Refund
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  );
};

export default CreateRefundDrawer;
