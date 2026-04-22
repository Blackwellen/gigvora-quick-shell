import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminAuth, type AdminRole } from '@/lib/adminAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import {
  Shield, Lock, KeyRound, Eye, EyeOff, AlertTriangle, Server, Users, Terminal,
  Activity, Clock, ChevronRight, Fingerprint, MonitorSmartphone, Globe, Zap,
  CheckCircle2, XCircle, RefreshCw, LogIn, ShieldAlert, ShieldCheck, Settings,
  Database, Wifi, WifiOff, Radio, AlertOctagon, Info, ArrowRight, Smartphone,
  HelpCircle, FileText, Phone, Mail, Landmark, Gavel, HeadphonesIcon, Cpu,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type TerminalStep = 'login' | 'mfa' | 'env' | 'role' | 'session' | 'lockout' | 'incident' | 'mobile';

interface InternalRole {
  id: string; label: string; icon: React.ElementType; color: string; queues: string[];
  description: string;
}

const INTERNAL_ROLES: InternalRole[] = [
  { id: 'super-admin', label: 'Super Admin', icon: Shield, color: 'text-[hsl(var(--state-blocked))]', queues: ['All queues', 'System config', 'Feature flags'], description: 'Full platform access with unrestricted authority' },
  { id: 'cs-admin', label: 'Customer Service', icon: HeadphonesIcon, color: 'text-accent', queues: ['Support tickets', 'User timeline', 'Escalations'], description: 'User-facing support and ticket resolution' },
  { id: 'finance-admin', label: 'Finance Admin', icon: Landmark, color: 'text-[hsl(var(--state-healthy))]', queues: ['Payouts', 'Refunds', 'Holds', 'Billing anomalies'], description: 'Money-moving operations and financial oversight' },
  { id: 'moderator', label: 'Moderator', icon: ShieldAlert, color: 'text-[hsl(var(--gigvora-amber))]', queues: ['Content queue', 'Reports', 'Policy actions'], description: 'Content moderation and community enforcement' },
  { id: 'trust-safety', label: 'Trust & Safety', icon: ShieldCheck, color: 'text-primary', queues: ['Fraud cases', 'Identity verification', 'Risk scoring'], description: 'Platform integrity and user safety enforcement' },
  { id: 'dispute-mgr', label: 'Dispute Manager', icon: Gavel, color: 'text-[hsl(var(--state-caution))]', queues: ['Open disputes', 'Arbitration', 'Evidence review'], description: 'Case arbitration and resolution routing' },
  { id: 'ads-ops', label: 'Ads Ops', icon: Radio, color: 'text-accent', queues: ['Campaign review', 'Creative approval', 'Policy flags'], description: 'Advertising operations and campaign governance' },
  { id: 'compliance', label: 'Compliance', icon: FileText, color: 'text-muted-foreground', queues: ['Audit trail', 'Policy review', 'Legal holds'], description: 'Regulatory compliance and audit management' },
];

const ENVIRONMENTS = [
  { id: 'production', label: 'Production', color: 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] border-[hsl(var(--state-blocked))]/30', icon: Globe, badge: 'LIVE', desc: 'Live customer-facing environment' },
  { id: 'staging', label: 'Staging', color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-[hsl(var(--gigvora-amber))]/30', icon: Server, badge: 'PRE-PROD', desc: 'Pre-production testing environment' },
  { id: 'sandbox', label: 'Sandbox', color: 'bg-accent/10 text-accent border-accent/30', icon: Database, badge: 'DEV', desc: 'Development and experimentation' },
];

const SESSION_LOGS = [
  { action: 'Login from 192.168.1.42', time: '2 min ago', status: 'success' },
  { action: 'MFA challenge passed', time: '2 min ago', status: 'success' },
  { action: 'Environment: Production', time: '1 min ago', status: 'success' },
  { action: 'Role: Finance Admin', time: '1 min ago', status: 'success' },
  { action: 'Session expires in 4h', time: 'now', status: 'info' },
];

const InternalAdminLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAdminAuth();
  const redirectTo = searchParams.get('redirect') || '/admin';

  const [step, setStep] = useState<TerminalStep>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [selectedEnv, setSelectedEnv] = useState('production');
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [rememberDevice, setRememberDevice] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [sessionDrawer, setSessionDrawer] = useState(false);

  const handleLogin = () => {
    if (!email || !password) { toast.error('Enter credentials'); return; }
    if (loginAttempts >= 4) { setStep('lockout'); return; }
    setLoginAttempts(a => a + 1);
    toast.success('Credentials verified — MFA required');
    setStep('mfa');
  };

  const handleMfa = () => {
    if (mfaCode.length < 6) { toast.error('Enter 6-digit code'); return; }
    toast.success('MFA verified');
    setStep('env');
  };

  const handleEnvSelect = () => { toast.success(`Environment: ${selectedEnv}`); setStep('role'); };
  const handleRoleSelect = async () => {
    if (!selectedRole) { toast.error('Select a role'); return; }
    try {
      await login({
        email,
        password,
        role: selectedRole as AdminRole,
        env: selectedEnv as 'production' | 'staging' | 'sandbox',
      });
      toast.success('Session established');
      setStep('session');
    } catch (e: any) {
      toast.error(e?.message ?? 'Login failed');
    }
  };

  const enterConsole = () => navigate(redirectTo, { replace: true });

  /* ── Shared Environment Ribbon ── */
  const envRibbon = (
    <div className={cn('flex items-center gap-2 px-4 py-1.5 text-[8px] font-mono border-b',
      selectedEnv === 'production' ? 'bg-[hsl(var(--state-blocked))]/5 text-[hsl(var(--state-blocked))]' :
      selectedEnv === 'staging' ? 'bg-[hsl(var(--gigvora-amber))]/5 text-[hsl(var(--gigvora-amber))]' :
      'bg-accent/5 text-accent'
    )}>
      <Radio className="h-2.5 w-2.5 animate-pulse" />
      <span className="uppercase font-bold">{selectedEnv}</span>
      <span className="text-muted-foreground">·</span>
      <span className="text-muted-foreground">Internal Terminal v4.2</span>
      <div className="flex-1" />
      <Badge variant="secondary" className="text-[6px] gap-0.5"><Wifi className="h-2 w-2" />Connected</Badge>
      <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />Session: 4h</Badge>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Security Bar */}
      <div className="bg-card border-b px-4 py-2 flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <Shield className="h-4 w-4 text-accent" />
          <span className="text-[11px] font-bold tracking-tight">GIGVORA</span>
          <span className="text-[9px] text-muted-foreground">Internal Terminal</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {(['login', 'mfa', 'env', 'role', 'session'] as const).map((s, i) => (
            <React.Fragment key={s}>
              {i > 0 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />}
              <button onClick={() => { if (['login', 'mfa', 'env', 'role', 'session', 'lockout', 'incident', 'mobile'].indexOf(step) >= i) setStep(s); }}
                className={cn('px-2 py-0.5 rounded-lg text-[7px] font-medium transition-colors capitalize',
                  step === s ? 'bg-accent/10 text-accent' : ['login', 'mfa', 'env', 'role', 'session'].indexOf(step) > i ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground/50'
                )}>{s === 'mfa' ? 'MFA' : s === 'env' ? 'Environment' : s}</button>
            </React.Fragment>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          <button onClick={() => setStep('incident')} className="p-1 rounded-lg hover:bg-muted/30 transition-colors"><AlertOctagon className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))]" /></button>
          <button onClick={() => setStep('mobile')} className="p-1 rounded-lg hover:bg-muted/30 transition-colors"><Smartphone className="h-3.5 w-3.5 text-muted-foreground" /></button>
          <button onClick={() => setSessionDrawer(true)} className="p-1 rounded-lg hover:bg-muted/30 transition-colors"><Activity className="h-3.5 w-3.5 text-muted-foreground" /></button>
        </div>
      </div>

      {step !== 'login' && step !== 'lockout' && envRibbon}

      <div className="flex-1 flex items-center justify-center p-4">
        {/* ═══ LOGIN ═══ */}
        {step === 'login' && (
          <div className="w-full max-w-md space-y-4">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
                <Terminal className="h-7 w-7 text-accent" />
              </div>
              <h1 className="text-lg font-bold">Internal Admin Login</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Secure entry for authorized operators only</p>
            </div>

            {loginAttempts > 0 && loginAttempts < 5 && (
              <div className="rounded-xl border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2 flex items-center gap-2 text-[8px]">
                <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
                <span>{5 - loginAttempts} attempts remaining before lockout</span>
              </div>
            )}

            <div className="rounded-2xl border bg-card p-5 space-y-3">
              <div>
                <Label className="text-[9px]">Admin Email</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@gigvora.com" className="pl-8 h-9 text-[10px] rounded-xl" />
                </div>
              </div>
              <div>
                <Label className="text-[9px]">Password</Label>
                <div className="relative mt-1">
                  <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" className="pl-8 pr-8 h-9 text-[10px] rounded-xl" />
                  <button onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2">{showPassword ? <EyeOff className="h-3.5 w-3.5 text-muted-foreground" /> : <Eye className="h-3.5 w-3.5 text-muted-foreground" />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Switch checked={rememberDevice} onCheckedChange={setRememberDevice} className="scale-75" />
                  <span className="text-[8px] text-muted-foreground">Remember device</span>
                </div>
                <button className="text-[8px] text-accent hover:underline">Forgot credentials?</button>
              </div>
              <Button className="w-full h-9 text-[10px] rounded-xl gap-1.5" onClick={handleLogin}><LogIn className="h-3.5 w-3.5" />Authenticate</Button>
            </div>

            <div className="rounded-2xl border bg-muted/20 p-3 space-y-1.5">
              <div className="text-[9px] font-semibold flex items-center gap-1"><Info className="h-3 w-3 text-accent" />Security Notice</div>
              <ul className="text-[8px] text-muted-foreground space-y-0.5">
                <li>• This terminal is for authorized Gigvora staff only</li>
                <li>• All sessions are logged and audited</li>
                <li>• Unauthorized access attempts are reported</li>
                <li>• Contact IT Security for access issues</li>
              </ul>
            </div>

            <div className="flex justify-center gap-3 text-[8px] text-muted-foreground">
              <button className="hover:text-accent transition-colors flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />IT Helpdesk</button>
              <span>·</span>
              <button className="hover:text-accent transition-colors flex items-center gap-0.5"><FileText className="h-2.5 w-2.5" />Security Policy</button>
              <span>·</span>
              <button className="hover:text-accent transition-colors flex items-center gap-0.5"><HelpCircle className="h-2.5 w-2.5" />Help</button>
            </div>
          </div>
        )}

        {/* ═══ MFA ═══ */}
        {step === 'mfa' && (
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
                <Fingerprint className="h-7 w-7 text-accent" />
              </div>
              <h1 className="text-lg font-bold">Multi-Factor Authentication</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Enter the code from your authenticator app</p>
            </div>

            <div className="rounded-2xl border bg-card p-5 space-y-3">
              <div>
                <Label className="text-[9px]">6-Digit Code</Label>
                <Input value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="000000" className="h-12 text-center text-xl font-mono tracking-[0.5em] rounded-xl mt-1" maxLength={6} />
              </div>
              <Progress value={(mfaCode.length / 6) * 100} className="h-1" />
              <Button className="w-full h-9 text-[10px] rounded-xl gap-1.5" onClick={handleMfa} disabled={mfaCode.length < 6}><ShieldCheck className="h-3.5 w-3.5" />Verify</Button>
              <div className="flex justify-between text-[8px] text-muted-foreground">
                <button className="hover:text-accent transition-colors">Use backup code</button>
                <button className="hover:text-accent transition-colors flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />SMS fallback</button>
              </div>
            </div>

            <div className="rounded-xl border p-2 flex items-center gap-2 text-[8px]">
              <MonitorSmartphone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground">Device: MacBook Pro · Chrome 126 · 192.168.1.42</span>
            </div>
          </div>
        )}

        {/* ═══ ENVIRONMENT ═══ */}
        {step === 'env' && (
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
                <Server className="h-7 w-7 text-accent" />
              </div>
              <h1 className="text-lg font-bold">Select Environment</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Choose the target environment for this session</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {ENVIRONMENTS.map(env => (
                <button key={env.id} onClick={() => setSelectedEnv(env.id)}
                  className={cn('rounded-2xl border p-4 text-left transition-all hover:shadow-md', selectedEnv === env.id ? 'ring-2 ring-accent/40' : 'hover:border-accent/30')}>
                  <div className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[7px] font-bold mb-2', env.color)}>
                    <env.icon className="h-2.5 w-2.5" />{env.badge}
                  </div>
                  <div className="text-[11px] font-semibold">{env.label}</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">{env.desc}</div>
                  {env.id === 'production' && (
                    <div className="mt-2 rounded-lg bg-[hsl(var(--state-blocked))]/5 border border-[hsl(var(--state-blocked))]/20 p-1.5 text-[7px] text-[hsl(var(--state-blocked))]">
                      <AlertTriangle className="h-2.5 w-2.5 inline mr-0.5" />All actions are live and audited
                    </div>
                  )}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border bg-muted/20 p-3">
              <div className="text-[9px] font-semibold mb-1.5 flex items-center gap-1"><Activity className="h-3 w-3 text-accent" />Environment Status</div>
              <div className="grid grid-cols-3 gap-2 text-[8px]">
                {[{ l: 'API Health', v: 'Healthy', s: 'healthy' }, { l: 'DB Latency', v: '12ms', s: 'healthy' }, { l: 'Queue Depth', v: '342', s: 'caution' }].map(m => (
                  <div key={m.l} className="rounded-xl border p-2">
                    <div className="text-muted-foreground">{m.l}</div>
                    <div className="font-semibold flex items-center gap-1">
                      <span className={cn('h-1.5 w-1.5 rounded-full', m.s === 'healthy' ? 'bg-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber))]')} />
                      {m.v}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full h-9 text-[10px] rounded-xl gap-1.5" onClick={handleEnvSelect}><ArrowRight className="h-3.5 w-3.5" />Continue to Role Selection</Button>
          </div>
        )}

        {/* ═══ ROLE CHOOSER ═══ */}
        {step === 'role' && (
          <div className="w-full max-w-2xl space-y-4">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-3">
                <Users className="h-7 w-7 text-accent" />
              </div>
              <h1 className="text-lg font-bold">Select Operating Role</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Your session permissions are determined by the role you select</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {INTERNAL_ROLES.map(role => (
                <button key={role.id} onClick={() => setSelectedRole(role.id)}
                  className={cn('rounded-2xl border p-3 text-left transition-all hover:shadow-sm', selectedRole === role.id ? 'ring-2 ring-accent/40 bg-accent/5' : 'hover:border-accent/30')}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center">
                      <role.icon className={cn('h-4 w-4', role.color)} />
                    </div>
                    <div>
                      <div className="text-[10px] font-semibold">{role.label}</div>
                      <div className="text-[7px] text-muted-foreground">{role.description}</div>
                    </div>
                    {selectedRole === role.id && <CheckCircle2 className="h-4 w-4 text-accent ml-auto shrink-0" />}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {role.queues.map(q => <Badge key={q} variant="secondary" className="text-[6px]">{q}</Badge>)}
                  </div>
                </button>
              ))}
            </div>

            <Button className="w-full h-9 text-[10px] rounded-xl gap-1.5" onClick={handleRoleSelect} disabled={!selectedRole}><LogIn className="h-3.5 w-3.5" />Enter Terminal</Button>
          </div>
        )}

        {/* ═══ SESSION ESTABLISHED ═══ */}
        {step === 'session' && (
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[hsl(var(--state-healthy))]/10 flex items-center justify-center mb-3">
                <CheckCircle2 className="h-7 w-7 text-[hsl(var(--state-healthy))]" />
              </div>
              <h1 className="text-lg font-bold">Session Established</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">You are now authenticated and ready to operate</p>
            </div>

            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { l: 'Role', v: INTERNAL_ROLES.find(r => r.id === selectedRole)?.label ?? '' },
                  { l: 'Environment', v: selectedEnv.charAt(0).toUpperCase() + selectedEnv.slice(1) },
                  { l: 'Session ID', v: 'SES-' + Math.random().toString(36).slice(2, 8).toUpperCase() },
                  { l: 'Expires', v: '4 hours from now' },
                ].map(m => (
                  <div key={m.l} className="rounded-xl border p-2">
                    <div className="text-[7px] text-muted-foreground">{m.l}</div>
                    <div className="text-[9px] font-semibold">{m.v}</div>
                  </div>
                ))}
              </div>
            </div>

            {selectedEnv === 'production' && (
              <div className="rounded-xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-2.5 text-[8px] flex items-center gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))] shrink-0" />
                <div><strong>Production Warning:</strong> All actions in this session affect live users and data. Proceed with caution.</div>
              </div>
            )}

            <div className="rounded-2xl border bg-muted/20 p-3">
              <div className="text-[9px] font-semibold mb-1.5">Session Audit Log</div>
              <div className="space-y-1">
                {SESSION_LOGS.map((log, i) => (
                  <div key={i} className="flex items-center gap-2 text-[8px]">
                    {log.status === 'success' ? <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] shrink-0" /> : <Info className="h-2.5 w-2.5 text-accent shrink-0" />}
                    <span className="flex-1">{log.action}</span>
                    <span className="text-muted-foreground">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={enterConsole} className="flex-1 h-9 text-[10px] rounded-xl gap-1.5"><Terminal className="h-3.5 w-3.5" />Open Admin Console</Button>
              <Button variant="outline" onClick={() => navigate('/admin/ops')} className="h-9 text-[10px] rounded-xl gap-1.5"><Activity className="h-3.5 w-3.5" />Ops Queue</Button>
              <Button variant="outline" onClick={() => navigate('/admin/finance')} className="h-9 text-[10px] rounded-xl gap-1.5"><Landmark className="h-3.5 w-3.5" />Finance</Button>
            </div>

            <div className="rounded-xl border p-2 text-center text-[8px] text-muted-foreground">
              Legal notice: Your actions are monitored and logged per the Internal Operations Policy (IOP-2026).
              <button className="text-accent hover:underline ml-1">View policy</button>
            </div>
          </div>
        )}

        {/* ═══ LOCKOUT ═══ */}
        {step === 'lockout' && (
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[hsl(var(--state-blocked))]/10 flex items-center justify-center mb-3">
                <XCircle className="h-7 w-7 text-[hsl(var(--state-blocked))]" />
              </div>
              <h1 className="text-lg font-bold">Account Locked</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Too many failed authentication attempts</p>
            </div>
            <div className="rounded-2xl border bg-card p-5 space-y-3">
              <div className="rounded-xl bg-[hsl(var(--state-blocked))]/5 border border-[hsl(var(--state-blocked))]/20 p-3 text-center">
                <div className="text-2xl font-bold text-[hsl(var(--state-blocked))]">15:00</div>
                <div className="text-[8px] text-muted-foreground">Cooldown remaining</div>
              </div>
              <div className="text-[8px] text-muted-foreground space-y-0.5">
                <p>• Your account has been temporarily locked after 5 failed attempts</p>
                <p>• This incident has been logged and reported to IT Security</p>
                <p>• Contact your supervisor or IT Helpdesk for immediate access</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1 h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Contacting IT...')}><Phone className="h-3 w-3" />IT Helpdesk</Button>
                <Button variant="outline" className="flex-1 h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Sending recovery email')}><Mail className="h-3 w-3" />Recovery Email</Button>
              </div>
              <Button variant="ghost" className="w-full h-7 text-[8px] rounded-xl" onClick={() => { setLoginAttempts(0); setStep('login'); }}><RefreshCw className="h-3 w-3 mr-1" />Try Again</Button>
            </div>
          </div>
        )}

        {/* ═══ INCIDENT MODE ═══ */}
        {step === 'incident' && (
          <div className="w-full max-w-lg space-y-4">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[hsl(var(--state-blocked))]/10 flex items-center justify-center mb-3 animate-pulse">
                <AlertOctagon className="h-7 w-7 text-[hsl(var(--state-blocked))]" />
              </div>
              <h1 className="text-lg font-bold">Incident Mode Active</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Platform is operating under elevated alert</p>
            </div>
            <div className="rounded-2xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="destructive" className="text-[7px]">SEV-1</Badge>
                <span className="text-[8px] text-muted-foreground">Started 45 min ago</span>
              </div>
              <div className="text-[10px] font-semibold">Payment Processing Degradation</div>
              <div className="text-[8px] text-muted-foreground">Elevated latency on payout processing pipeline. Finance operations may experience delays. Non-critical actions are temporarily restricted.</div>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {[{ l: 'Affected Systems', v: '3' }, { l: 'Active Responders', v: '7' }, { l: 'Est. Resolution', v: '~2h' }].map(m => (
                  <div key={m.l} className="rounded-xl border p-2 text-center">
                    <div className="text-[7px] text-muted-foreground">{m.l}</div>
                    <div className="text-[10px] font-bold">{m.v}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1 h-9 text-[10px] rounded-xl gap-1.5" onClick={() => setStep('login')}><LogIn className="h-3.5 w-3.5" />Proceed with Login</Button>
              <Button variant="outline" className="h-9 text-[10px] rounded-xl gap-1.5" onClick={() => toast.info('Opening incident channel')}><Radio className="h-3.5 w-3.5" />Join Incident</Button>
            </div>
          </div>
        )}

        {/* ═══ MOBILE RESTRICTED ═══ */}
        {step === 'mobile' && (
          <div className="w-full max-w-sm space-y-4">
            <div className="text-center">
              <div className="mx-auto h-14 w-14 rounded-2xl bg-[hsl(var(--gigvora-amber))]/10 flex items-center justify-center mb-3">
                <Smartphone className="h-7 w-7 text-[hsl(var(--gigvora-amber))]" />
              </div>
              <h1 className="text-lg font-bold">Mobile Access Restricted</h1>
              <p className="text-[10px] text-muted-foreground mt-0.5">Internal terminal requires desktop access for security</p>
            </div>
            <div className="rounded-2xl border bg-card p-4 space-y-2">
              <div className="text-[9px] text-muted-foreground">Mobile access is limited to:</div>
              <div className="space-y-1">
                {['View-only queue summaries', 'Emergency incident alerts', 'Session status checks', 'Quick MFA approvals'].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-[8px]"><CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />{f}</div>
                ))}
              </div>
              <div className="text-[9px] text-muted-foreground mt-2">Full operations require:</div>
              <div className="space-y-1">
                {['Desktop browser (Chrome/Firefox/Edge)', 'VPN or approved network', 'Hardware security key recommended'].map(f => (
                  <div key={f} className="flex items-center gap-1.5 text-[8px]"><Lock className="h-2.5 w-2.5 text-muted-foreground" />{f}</div>
                ))}
              </div>
            </div>
            <Button variant="outline" className="w-full h-9 text-[10px] rounded-xl gap-1.5" onClick={() => setStep('login')}><ArrowRight className="h-3.5 w-3.5" />Back to Login</Button>
          </div>
        )}
      </div>

      {/* Mobile Sticky */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <Shield className="h-4 w-4 text-accent" />
        <div className="flex-1 text-[9px]"><span className="font-semibold">Internal Terminal</span><div className="text-[7px] text-muted-foreground">Desktop recommended</div></div>
        <Button size="sm" className="h-8 text-[9px] rounded-xl" onClick={() => setStep('login')}>Login</Button>
      </div>

      {/* Session Drawer */}
      <Sheet open={sessionDrawer} onOpenChange={setSessionDrawer}>
        <SheetContent className="w-[400px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Activity className="h-4 w-4 text-accent" />Session Activity</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border p-3">
              <div className="text-[9px] font-semibold mb-2">Active Sessions</div>
              <div className="space-y-1.5">
                {[
                  { device: 'MacBook Pro · Chrome', ip: '192.168.1.42', time: 'Current', active: true },
                  { device: 'Windows Desktop · Firefox', ip: '10.0.0.15', time: '2h ago', active: false },
                ].map(s => (
                  <div key={s.ip} className="flex items-center gap-2 p-2 rounded-xl border text-[8px]">
                    <MonitorSmartphone className="h-3.5 w-3.5 text-muted-foreground" />
                    <div className="flex-1"><div className="font-medium">{s.device}</div><div className="text-[7px] text-muted-foreground">{s.ip} · {s.time}</div></div>
                    {s.active ? <Badge className="text-[6px]">Active</Badge> : <Button variant="ghost" size="sm" className="h-5 text-[7px]">Revoke</Button>}
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border p-3">
              <div className="text-[9px] font-semibold mb-2">Recent Audit Events</div>
              <div className="space-y-1">
                {[
                  { action: 'Viewed user profile #4821', time: '5m ago' },
                  { action: 'Approved refund REF-9032', time: '12m ago' },
                  { action: 'Escalated ticket TKT-1204', time: '28m ago' },
                  { action: 'Updated policy flag PF-88', time: '1h ago' },
                  { action: 'Exported finance report', time: '2h ago' },
                ].map((e, i) => (
                  <div key={i} className="flex items-center gap-2 text-[8px] p-1.5 rounded-lg hover:bg-muted/20">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />
                    <span className="flex-1">{e.action}</span>
                    <span className="text-muted-foreground text-[7px]">{e.time}</span>
                  </div>
                ))}
              </div>
            </div>
            <Button variant="destructive" size="sm" className="w-full h-7 text-[8px] rounded-xl gap-1" onClick={() => toast.info('Ending all sessions')}><XCircle className="h-3 w-3" />End All Sessions</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default InternalAdminLoginPage;
