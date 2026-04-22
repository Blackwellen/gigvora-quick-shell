import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/AuthShell';
import { Mail, RefreshCw, CheckCircle2, ArrowRight, Clock, Shield, Inbox, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const VerifyPage: React.FC = () => {
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const t = setTimeout(() => setCountdown(c => c - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [countdown]);

  const handleResend = () => {
    setResending(true);
    setTimeout(() => {
      setResending(false);
      setResent(true);
      setCountdown(60);
    }, 1500);
  };

  return (
    <AuthShell>
      <div className="rounded-3xl border bg-card p-7 shadow-elevated">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--gigvora-blue)/0.1)] flex items-center justify-center mx-auto mb-4">
            <Mail className="h-6 w-6 text-[hsl(var(--gigvora-blue))]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Check your email</h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            We sent a verification link to your email. Click the link to activate your account.
          </p>
        </div>

        {/* Progress steps */}
        <div className="space-y-2 mb-6">
          <div className="flex items-center gap-3 rounded-2xl bg-[hsl(var(--state-healthy)/0.06)] border border-[hsl(var(--state-healthy)/0.12)] px-4 py-3">
            <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))] shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-medium block">Account created</span>
              <span className="text-[10px] text-muted-foreground">Your account has been set up successfully</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-[hsl(var(--state-caution)/0.06)] border border-[hsl(var(--state-caution)/0.12)] px-4 py-3">
            <Clock className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0 animate-pulse" />
            <div className="flex-1">
              <span className="text-xs font-medium block">Email verification pending</span>
              <span className="text-[10px] text-muted-foreground">Click the link in your inbox to verify</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-2xl bg-muted/30 border px-4 py-3 opacity-50">
            <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30 shrink-0" />
            <div className="flex-1">
              <span className="text-xs font-medium block">Profile setup</span>
              <span className="text-[10px] text-muted-foreground">Complete your profile after verification</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <Button
            variant="outline"
            className="w-full h-10 text-xs gap-2 font-medium rounded-xl"
            onClick={handleResend}
            disabled={resending || countdown > 0}
          >
            {countdown > 0 ? (
              <>Resend available in {countdown}s</>
            ) : resending ? (
              <><RefreshCw className="h-3.5 w-3.5 animate-spin" /> Resending...</>
            ) : resent ? (
              <><CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" /> Resend verification email</>
            ) : (
              <><RefreshCw className="h-3.5 w-3.5" /> Resend verification email</>
            )}
          </Button>
          <Button variant="ghost" className="w-full h-10 text-xs rounded-xl" asChild>
            <Link to="/signin">Back to sign in</Link>
          </Button>
        </div>

        {/* Help tips */}
        <div className="mt-6 pt-5 border-t">
          <div className="text-[11px] font-medium mb-2.5 flex items-center gap-1.5">
            <HelpCircle className="h-3 w-3 text-muted-foreground" /> Didn't receive it?
          </div>
          <ul className="space-y-1.5 text-[11px] text-muted-foreground">
            <li className="flex items-start gap-2"><Inbox className="h-3 w-3 shrink-0 mt-0.5" /> Check your spam or junk folder</li>
            <li className="flex items-start gap-2"><Mail className="h-3 w-3 shrink-0 mt-0.5" /> Make sure the email address is correct</li>
            <li className="flex items-start gap-2"><Shield className="h-3 w-3 shrink-0 mt-0.5" /> Add noreply@gigvora.com to your contacts</li>
          </ul>
          <p className="text-[10px] text-muted-foreground mt-3">
            Still having trouble?{' '}
            <Link to="/support/contact" className="text-[hsl(var(--gigvora-blue))] hover:underline font-medium">Contact support</Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
};

export default VerifyPage;
