import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/AuthShell';
import { ShieldAlert, Mail, ArrowLeft, Clock, Shield, AlertTriangle, CheckCircle2 } from 'lucide-react';

const AccountLockedPage: React.FC = () => {
  const [timeLeft, setTimeLeft] = useState(24 * 60);

  useEffect(() => {
    const t = setInterval(() => setTimeLeft(v => Math.max(0, v - 1)), 60000);
    return () => clearInterval(t);
  }, []);

  const hours = Math.floor(timeLeft / 60);
  const mins = timeLeft % 60;

  return (
    <AuthShell>
      <div className="rounded-3xl border bg-card p-7 shadow-elevated">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-blocked)/0.1)] flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-6 w-6 text-[hsl(var(--state-blocked))]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-1">Account Restricted</h1>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Your account has been temporarily locked due to unusual activity.
          </p>
        </div>

        {/* Countdown */}
        <div className="rounded-2xl bg-[hsl(var(--state-caution)/0.06)] border border-[hsl(var(--state-caution)/0.12)] p-4 mb-5">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-[hsl(var(--state-caution))] shrink-0" />
            <div>
              <div className="text-xs font-semibold">Auto-unlock countdown</div>
              <div className="text-[11px] text-muted-foreground">
                {hours > 0 ? `${hours}h ${mins}m remaining` : `${mins}m remaining`}
              </div>
            </div>
          </div>
        </div>

        {/* Reasons */}
        <div className="rounded-2xl bg-muted/30 border p-4 mb-5">
          <div className="text-xs font-semibold mb-2.5 flex items-center gap-1.5">
            <AlertTriangle className="h-3.5 w-3.5 text-muted-foreground" /> Possible reasons
          </div>
          <ul className="text-[11px] text-muted-foreground space-y-2">
            <li className="flex items-start gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
              Multiple failed login attempts from your account
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
              Login from an unrecognized device or location
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1 w-1 rounded-full bg-muted-foreground mt-1.5 shrink-0" />
              Suspicious account activity detected by our security systems
            </li>
          </ul>
        </div>

        {/* Recovery actions */}
        <div className="text-xs font-semibold mb-3">Recovery options</div>
        <div className="space-y-2.5">
          <Button className="w-full h-10 text-xs gap-2 font-medium rounded-xl shadow-md" asChild>
            <Link to="/support/contact"><Mail className="h-3.5 w-3.5" /> Contact Support</Link>
          </Button>
          <Button variant="outline" className="w-full h-10 text-xs gap-2 font-medium rounded-xl" asChild>
            <Link to="/forgot-password"><Shield className="h-3.5 w-3.5" /> Reset Password</Link>
          </Button>
          <Button variant="ghost" className="w-full h-10 text-xs gap-2 rounded-xl" asChild>
            <Link to="/signin"><ArrowLeft className="h-3.5 w-3.5" /> Back to sign in</Link>
          </Button>
        </div>

        {/* Security note */}
        <div className="mt-5 pt-4 border-t">
          <div className="flex items-start gap-2.5 text-[10px] text-muted-foreground">
            <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              Your data is safe. Account locks are a security precaution and do not affect your stored data, projects, or financial information.
            </span>
          </div>
        </div>
      </div>
    </AuthShell>
  );
};

export default AccountLockedPage;
