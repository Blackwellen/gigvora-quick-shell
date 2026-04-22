import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';
import { CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadCaptureFormProps {
  sourcePage?: string;
  sourceCta?: string;
  ctaLabel?: string;
  compact?: boolean;
  onSuccess?: (lead: { id: string; email: string }) => void;
  className?: string;
}

type State = 'idle' | 'submitting' | 'success' | 'error';

/**
 * Marketing lead capture (sales / demo / contact). UK GDPR posture: explicit
 * marketing consent checkbox, captured into the consent payload alongside IP+UA
 * server-side. Falls back to localStorage queue if backend isn't configured.
 */
export const LeadCaptureForm: React.FC<LeadCaptureFormProps> = ({
  sourcePage, sourceCta, ctaLabel = 'Request a demo', compact, onSuccess, className,
}) => {
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [useCase, setUseCase] = useState('');
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState('error'); setMessage('Please enter a valid email.'); return;
    }
    setState('submitting'); setMessage('');
    const payload = {
      email: email.trim().toLowerCase(),
      fullName: fullName.trim() || undefined,
      company: company.trim() || undefined,
      role: role.trim() || undefined,
      useCase: useCase.trim() || undefined,
      sourcePage: sourcePage ?? (typeof window !== 'undefined' ? window.location.pathname : undefined),
      sourceCta,
      utm: readUtm(),
      consent: { marketing: marketingConsent, terms_at: new Date().toISOString() },
    };
    try {
      let lead: { id: string; email: string } = { id: 'queued', email: payload.email };
      if (sdkReady()) {
        const r = await sdk.marketing.createLead(payload);
        lead = { id: r.id, email: r.email };
      } else {
        try {
          const q = JSON.parse(localStorage.getItem('gigvora.leads.queue') ?? '[]');
          q.push({ ...payload, at: new Date().toISOString() });
          localStorage.setItem('gigvora.leads.queue', JSON.stringify(q));
        } catch { /* ignore */ }
      }
      setState('success');
      setMessage('Thanks — our team will be in touch within one business day.');
      onSuccess?.(lead);
    } catch (err: any) {
      setState('error');
      setMessage('Something went wrong. Please try again or email hello@gigvora.com.');
    }
  };

  return (
    <form onSubmit={submit} className={cn('space-y-3', className)} aria-busy={state === 'submitting'}>
      <div className={cn('grid gap-3', compact ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2')}>
        <div>
          <Label htmlFor="lead-email">Work email *</Label>
          <Input id="lead-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="lead-name">Full name</Label>
          <Input id="lead-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="lead-company">Company</Label>
          <Input id="lead-company" value={company} onChange={(e) => setCompany(e.target.value)} className="h-10 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="lead-role">Role</Label>
          <Input id="lead-role" value={role} onChange={(e) => setRole(e.target.value)} className="h-10 rounded-xl" />
        </div>
      </div>
      {!compact && (
        <div>
          <Label htmlFor="lead-usecase">What are you trying to do?</Label>
          <Textarea id="lead-usecase" rows={3} value={useCase} onChange={(e) => setUseCase(e.target.value)} className="rounded-xl" />
        </div>
      )}
      <label className="flex items-start gap-2 text-xs text-muted-foreground">
        <Checkbox checked={marketingConsent} onCheckedChange={(v) => setMarketingConsent(v === true)} className="mt-0.5" />
        <span>I agree Gigvora may contact me about this enquiry and related products. See our <a href="/legal/privacy" className="underline">Privacy Policy</a>.</span>
      </label>
      <Button type="submit" disabled={state === 'submitting' || state === 'success'} className="h-11 rounded-xl w-full sm:w-auto gap-2">
        {state === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === 'success' ? <><CheckCircle2 className="h-4 w-4" />Sent</> : <>{ctaLabel}<ArrowRight className="h-4 w-4" /></>}
      </Button>
      {state !== 'idle' && state !== 'submitting' && (
        <p
          role={state === 'error' ? 'alert' : 'status'}
          className={cn('text-xs flex items-center gap-1.5',
            state === 'success' && 'text-[hsl(var(--state-healthy))]',
            state === 'error' && 'text-destructive')}
        >
          {state === 'error' ? <AlertCircle className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
          {message}
        </p>
      )}
    </form>
  );
};

function readUtm(): Record<string, string> {
  if (typeof window === 'undefined') return {};
  const p = new URLSearchParams(window.location.search);
  const out: Record<string, string> = {};
  ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(k => {
    const v = p.get(k); if (v) out[k] = v;
  });
  return out;
}

export default LeadCaptureForm;
