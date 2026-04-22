import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/AuthShell';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, CheckCircle2, AlertTriangle, Lock, Loader2, ShieldCheck, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'One special character' },
];

const ResetPasswordPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [sessionValid, setSessionValid] = useState<boolean | null>(null);
  const navigate = useNavigate();

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(password)).length;
  const passwordValid = passwordStrength >= 3;
  const passwordsMatch = password === confirmPassword && confirmPassword.length > 0;

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes('type=recovery')) {
      setSessionValid(true);
    } else {
      supabase.auth.getSession().then(({ data }) => {
        setSessionValid(!!data.session);
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordValid) { toast.error('Password does not meet requirements'); return; }
    if (!passwordsMatch) { toast.error('Passwords do not match'); return; }
    setError('');
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setSuccess(true);
      toast.success('Password updated successfully!');
    } catch (err: any) {
      const msg = err.message || 'Failed to update password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (sessionValid === false) {
    return (
      <AuthShell>
        <div className="rounded-3xl border bg-card p-7 shadow-elevated text-center">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-blocked)/0.1)] flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-6 w-6 text-[hsl(var(--state-blocked))]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Link Expired</h1>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
            This password reset link has expired or is invalid. Please request a new one.
          </p>
          <Button className="h-10 text-sm gap-2 font-semibold rounded-xl" asChild>
            <Link to="/forgot-password">Request New Link <ArrowRight className="h-4 w-4" /></Link>
          </Button>
        </div>
      </AuthShell>
    );
  }

  if (success) {
    return (
      <AuthShell>
        <div className="rounded-3xl border bg-card p-7 shadow-elevated text-center">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="h-6 w-6 text-[hsl(var(--state-healthy))]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight mb-2">Password Updated</h1>
          <p className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto">
            Your password has been changed successfully. You can now sign in with your new credentials.
          </p>
          <Button className="w-full h-10 text-sm gap-2 font-semibold rounded-xl shadow-md" onClick={() => navigate('/feed')}>
            Continue to Gigvora <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell>
      <div className="rounded-3xl border bg-card p-7 shadow-elevated">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--gigvora-blue)/0.1)] flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6 text-[hsl(var(--gigvora-blue))]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Set new password</h1>
          <p className="text-xs text-muted-foreground mt-1">Choose a strong password for your account</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-[hsl(var(--state-blocked)/0.08)] border border-[hsl(var(--state-blocked)/0.15)] px-3.5 py-2.5 mb-5">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
            <span className="text-xs text-[hsl(var(--state-blocked))]">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full h-10 rounded-xl border bg-background px-3.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                placeholder="Create a strong password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors',
                      i <= passwordStrength ? 'bg-[hsl(var(--state-healthy))]' : 'bg-muted'
                    )} />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                  {PASSWORD_RULES.map((rule) => (
                    <span key={rule.label} className={cn('flex items-center gap-1.5 text-[10px]', rule.test(password) ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}>
                      <CheckCircle2 className="h-3 w-3 shrink-0" /> {rule.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Confirm Password</label>
            <input
              type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required
              className={cn(
                'w-full h-10 rounded-xl border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow',
                confirmPassword && !passwordsMatch && 'border-[hsl(var(--state-blocked))] focus:ring-[hsl(var(--state-blocked)/0.3)]'
              )}
              placeholder="Repeat your password" autoComplete="new-password" />
            {confirmPassword && !passwordsMatch && (
              <p className="text-[10px] text-[hsl(var(--state-blocked))] mt-1">Passwords do not match</p>
            )}
            {passwordsMatch && (
              <p className="text-[10px] text-[hsl(var(--state-healthy))] mt-1 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Passwords match</p>
            )}
          </div>
          <Button type="submit" className="w-full h-10 text-sm font-semibold gap-2 rounded-xl shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200" disabled={loading || !passwordValid || !passwordsMatch}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating...</> : 'Update Password'}
          </Button>
        </form>
      </div>
    </AuthShell>
  );
};

export default ResetPasswordPage;
