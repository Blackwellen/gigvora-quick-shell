import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { sdk, sdkReady } from '@/lib/gigvora-sdk';
import { CheckCircle2, Loader2, Mail, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

type State = 'idle' | 'submitting' | 'success' | 'error';

interface NewsletterSignupProps {
  className?: string;
  source?: string;
  topics?: string[];
  variant?: 'inline' | 'stacked';
  ctaLabel?: string;
}

/**
 * Public newsletter signup. Calls the marketing backend if a token/baseUrl is present;
 * otherwise stores a deferred opt-in in localStorage so we never lose the lead.
 * Domain 02 — Public Marketing & Conversion.
 */
export const NewsletterSignup: React.FC<NewsletterSignupProps> = ({
  className, source = 'site', topics = ['product'], variant = 'inline', ctaLabel = 'Subscribe',
}) => {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<State>('idle');
  const [message, setMessage] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { if (state === 'error') inputRef.current?.focus(); }, [state]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
      setState('error'); setMessage('Please enter a valid email address.'); return;
    }
    setState('submitting'); setMessage('');
    try {
      if (sdkReady()) {
        await sdk.marketing.subscribe({ email: v, topics, source });
      } else {
        // Backend not configured yet — queue locally and show success.
        try {
          const queued = JSON.parse(localStorage.getItem('gigvora.newsletter.queue') ?? '[]');
          queued.push({ email: v, topics, source, at: new Date().toISOString() });
          localStorage.setItem('gigvora.newsletter.queue', JSON.stringify(queued));
        } catch { /* ignore storage errors */ }
      }
      setState('success');
      setMessage('Check your inbox to confirm.');
      setEmail('');
    } catch (err: any) {
      setState('error');
      setMessage(err?.message?.includes('400') ? 'That email looks invalid.' : 'Something went wrong. Please try again.');
    }
  };

  return (
    <form onSubmit={submit} className={cn(variant === 'inline' ? 'flex flex-col sm:flex-row gap-2' : 'space-y-2', className)}>
      <div className="relative flex-1">
        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          aria-label="Email address"
          aria-invalid={state === 'error'}
          aria-describedby={state !== 'idle' ? 'newsletter-status' : undefined}
          placeholder="you@company.com"
          value={email}
          onChange={(e) => { setEmail(e.target.value); if (state !== 'idle') setState('idle'); }}
          disabled={state === 'submitting' || state === 'success'}
          className="pl-9 h-11 rounded-xl"
        />
      </div>
      <Button type="submit" className="h-11 rounded-xl px-5" disabled={state === 'submitting' || state === 'success'}>
        {state === 'submitting' && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
        {state === 'success' ? <><CheckCircle2 className="h-4 w-4 mr-2" />Subscribed</> : ctaLabel}
      </Button>
      {state !== 'idle' && (
        <p
          id="newsletter-status"
          role={state === 'error' ? 'alert' : 'status'}
          className={cn(
            'text-xs flex items-center gap-1.5 sm:basis-full',
            state === 'success' && 'text-[hsl(var(--state-healthy))]',
            state === 'error' && 'text-destructive',
            state === 'submitting' && 'text-muted-foreground',
          )}
        >
          {state === 'error' && <AlertCircle className="h-3.5 w-3.5" />}
          {state === 'success' && <CheckCircle2 className="h-3.5 w-3.5" />}
          {message || (state === 'submitting' ? 'Subscribing…' : '')}
        </p>
      )}
    </form>
  );
};

export default NewsletterSignup;
