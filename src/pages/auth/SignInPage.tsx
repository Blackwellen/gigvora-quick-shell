import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowRight, Eye, EyeOff, AlertTriangle, Loader2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const SignInPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/feed');
    } catch (err: any) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        navigate('/account-locked');
        return;
      }
      const msg = err.message || 'Invalid email or password';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <div className="rounded-3xl border bg-card p-7 shadow-elevated">
        <div className="text-center mb-6">
          <img src="/favicon.ico" alt="Gigvora" className="h-10 w-10 mx-auto mb-3 rounded-xl" />
          <h1 className="text-xl font-bold tracking-tight">Welcome back</h1>
          <p className="text-xs text-muted-foreground mt-1">Sign in to your Gigvora account</p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-2xl bg-[hsl(var(--state-blocked)/0.08)] border border-[hsl(var(--state-blocked)/0.15)] px-3.5 py-2.5 mb-5">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0 mt-0.5" />
            <div>
              <span className="text-xs text-[hsl(var(--state-blocked))] font-medium block">{error}</span>
              {attempts >= 3 && (
                <span className="text-[10px] text-[hsl(var(--state-blocked)/0.7)] mt-0.5 block">
                  {5 - attempts} attempt(s) remaining before account lock.
                </span>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Email</label>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full h-10 rounded-xl border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              placeholder="you@example.com"
              autoComplete="email"
            />
          </div>
          <div>
            <div className="flex justify-between mb-1.5">
              <label className="text-xs font-medium">Password</label>
              <Link to="/forgot-password" className="text-[11px] text-[hsl(var(--gigvora-blue))] hover:underline font-medium">Forgot password?</Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full h-10 rounded-xl border bg-background px-3.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Remember me */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" className="h-3.5 w-3.5 rounded border accent-[hsl(var(--gigvora-blue))]" defaultChecked />
            <span className="text-[11px] text-muted-foreground">Keep me signed in</span>
          </label>

          <Button type="submit" className="w-full h-10 text-sm gap-2 font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200" disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : <>Sign In <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Don't have an account?{' '}
          <Link to="/signup" className="text-[hsl(var(--gigvora-blue))] font-semibold hover:underline">Create account</Link>
        </p>
      </div>

      {/* Session trust indicator */}
      <div className="flex items-center justify-center gap-1.5 mt-4 text-[10px] text-muted-foreground/40">
        <Shield className="h-3 w-3" />
        <span>Secure session — your data never leaves our encrypted network</span>
      </div>
    </AuthShell>
  );
};

export default SignInPage;
