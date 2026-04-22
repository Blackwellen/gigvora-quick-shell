import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/AuthShell';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { ArrowRight, Eye, EyeOff, AlertTriangle, CheckCircle2, Users, Briefcase, Building2, Loader2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLES = [
  { id: 'client', label: 'Client', desc: 'Hire talent & manage projects', icon: Users },
  { id: 'professional', label: 'Professional', desc: 'Deliver services & grow career', icon: Briefcase },
  { id: 'enterprise', label: 'Enterprise', desc: 'Scale teams & operations', icon: Building2 },
] as const;

const PASSWORD_RULES = [
  { test: (p: string) => p.length >= 8, label: 'At least 8 characters' },
  { test: (p: string) => /[A-Z]/.test(p), label: 'One uppercase letter' },
  { test: (p: string) => /[0-9]/.test(p), label: 'One number' },
  { test: (p: string) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: 'One special character' },
];

const SignUpPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedRole, setSelectedRole] = useState(searchParams.get('role') || 'user');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { signup } = useAuth();
  const navigate = useNavigate();

  const passwordStrength = PASSWORD_RULES.filter(r => r.test(password)).length;
  const passwordValid = passwordStrength >= 3;

  const strengthLabel = passwordStrength === 0 ? '' : passwordStrength <= 1 ? 'Weak' : passwordStrength <= 2 ? 'Fair' : passwordStrength <= 3 ? 'Good' : 'Strong';
  const strengthColor = passwordStrength <= 1 ? 'text-[hsl(var(--state-blocked))]' : passwordStrength <= 2 ? 'text-[hsl(var(--state-caution))]' : 'text-[hsl(var(--state-healthy))]';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) { toast.error('Please agree to the terms'); return; }
    if (!passwordValid) { toast.error('Password does not meet requirements'); return; }
    setError('');
    setLoading(true);
    try {
      await signup(email, password, name);
      toast.success('Account created! Check your email to verify.');
      navigate('/verify');
    } catch (err: any) {
      const msg = err.message || 'Sign up failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell maxWidth="max-w-lg">
      <div className="rounded-3xl border bg-card p-7 shadow-elevated">
        <div className="text-center mb-6">
          <img src="/favicon.ico" alt="Gigvora" className="h-10 w-10 mx-auto mb-3 rounded-xl" />
          <div className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-[hsl(var(--gigvora-blue))] mb-2">
            <Sparkles className="h-3 w-3" /> Free to start • No credit card required
          </div>
          <h1 className="text-xl font-bold tracking-tight">Create your account</h1>
          <p className="text-xs text-muted-foreground mt-1">Join the Gigvora professional network</p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 rounded-2xl bg-[hsl(var(--state-blocked)/0.08)] border border-[hsl(var(--state-blocked)/0.15)] px-3.5 py-2.5 mb-5">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
            <span className="text-xs text-[hsl(var(--state-blocked))]">{error}</span>
          </div>
        )}

        {/* Role selector */}
        <div className="mb-5">
          <label className="text-xs font-medium mb-2 block">I want to</label>
          <div className="grid grid-cols-3 gap-2.5">
            {ROLES.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role.id)}
                className={cn(
                  'rounded-2xl border p-3 text-center transition-all duration-200',
                  selectedRole === role.id
                    ? 'border-accent bg-accent/5 ring-2 ring-accent/30 shadow-sm scale-[1.02]'
                    : 'hover:border-muted-foreground/30 hover:bg-muted/30 hover:-translate-y-0.5'
                )}
              >
                <role.icon className={cn('h-5 w-5 mx-auto mb-1.5 transition-colors', selectedRole === role.id ? 'text-accent' : 'text-muted-foreground')} />
                <div className="text-xs font-semibold">{role.label}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{role.desc}</div>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block">Full Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full h-10 rounded-xl border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              placeholder="Jane Doe" autoComplete="name" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Work Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full h-10 rounded-xl border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
              placeholder="you@example.com" autoComplete="email" />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full h-10 rounded-xl border bg-background px-3.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                placeholder="Create a strong password" autoComplete="new-password" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {/* Password strength */}
            {password && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1 flex-1">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className={cn(
                        'h-1.5 flex-1 rounded-full transition-colors',
                        i <= passwordStrength
                          ? passwordStrength <= 1 ? 'bg-[hsl(var(--state-blocked))]'
                            : passwordStrength <= 2 ? 'bg-[hsl(var(--state-caution))]'
                            : 'bg-[hsl(var(--state-healthy))]'
                          : 'bg-muted'
                      )} />
                    ))}
                  </div>
                  <span className={cn('text-[10px] font-semibold', strengthColor)}>{strengthLabel}</span>
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

          {/* Terms */}
          <label className="flex items-start gap-2.5 cursor-pointer">
            <input type="checkbox" checked={agreedTerms} onChange={e => setAgreedTerms(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border accent-[hsl(var(--gigvora-blue))]" />
            <span className="text-[11px] text-muted-foreground leading-relaxed">
              I agree to the <Link to="/terms" className="text-[hsl(var(--gigvora-blue))] hover:underline font-medium">Terms of Service</Link> and <Link to="/privacy" className="text-[hsl(var(--gigvora-blue))] hover:underline font-medium">Privacy Policy</Link>
            </span>
          </label>

          <Button type="submit" className="w-full h-10 text-sm gap-2 font-semibold rounded-xl shadow-md hover:shadow-lg hover:-translate-y-px transition-all duration-200" disabled={loading || !agreedTerms}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : <>Create Account <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-5">
          Already have an account?{' '}
          <Link to="/signin" className="text-[hsl(var(--gigvora-blue))] font-semibold hover:underline">Sign in</Link>
        </p>
      </div>
    </AuthShell>
  );
};

export default SignUpPage;
