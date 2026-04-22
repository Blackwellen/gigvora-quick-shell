import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/AuthShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ArrowLeft, Mail, CheckCircle2, AlertTriangle, Loader2, KeyRound, Shield } from 'lucide-react';

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success('Reset link sent!');
    } catch (err: any) {
      const msg = err.message || 'Failed to send reset link';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-3xl border bg-card p-7 shadow-elevated">
        <Link to="/signin" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to sign in
        </Link>

        {sent ? (
          <div className="text-center py-4">
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))]" />
            </div>
            <h1 className="text-xl font-bold tracking-tight mb-2">Reset link sent</h1>
            <p className="text-xs text-muted-foreground mb-2 max-w-xs mx-auto leading-relaxed">
              We've sent a password reset link to:
            </p>
            <p className="text-sm font-semibold mb-5">{email}</p>

            <div className="rounded-2xl bg-muted/30 border p-4 mb-5 text-left">
              <div className="text-[11px] font-medium mb-2">Next steps:</div>
              <ol className="text-[11px] text-muted-foreground space-y-1.5 list-decimal list-inside">
                <li>Open the email from Gigvora</li>
                <li>Click the "Reset Password" button</li>
                <li>Choose a new secure password</li>
              </ol>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full h-10 text-xs font-medium rounded-xl" onClick={() => { setSent(false); setEmail(''); }}>
                <Mail className="h-3.5 w-3.5 mr-1.5" /> Try a different email
              </Button>
              <Button variant="ghost" className="w-full h-10 text-xs rounded-xl" asChild>
                <Link to="/signin">Return to sign in</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--gigvora-blue)/0.1)] flex items-center justify-center mx-auto mb-4">
                <KeyRound className="h-6 w-6 text-[hsl(var(--gigvora-blue))]" />
              </div>
              <h1 className="text-xl font-bold tracking-tight">Reset your password</h1>
              <p className="text-xs text-muted-foreground mt-1">Enter your email and we'll send a reset link</p>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 rounded-2xl bg-[hsl(var(--state-blocked)/0.08)] border border-[hsl(var(--state-blocked)/0.15)] px-3.5 py-2.5 mb-5">
                <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
                <span className="text-xs text-[hsl(var(--state-blocked))]">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Email address</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full h-10 rounded-xl border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  placeholder="you@example.com" autoComplete="email" />
              </div>
              <Button type="submit" className="w-full h-10 text-sm gap-2 font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200" disabled={loading}>
                {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending...</> : <><Mail className="h-4 w-4" /> Send Reset Link</>}
              </Button>
            </form>

            <div className="flex items-center justify-center gap-1.5 mt-5 text-[10px] text-muted-foreground">
              <Shield className="h-3 w-3" /> We'll never share your email with third parties
            </div>
          </>
        )}
      </div>
    </AuthShell>
  );
};

export default ForgotPasswordPage;
