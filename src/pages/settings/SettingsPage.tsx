import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/contexts/AuthContext';
import { useRole } from '@/contexts/RoleContext';
import { cn } from '@/lib/utils';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { PlanUpgradeDrawer } from '@/components/shell/PlanUpgradeDrawer';
import { PLAN_CONFIGS, ENTITLEMENT_LABELS, type FeatureEntitlement } from '@/types/role';
import {
  User, Shield, Bell, Link2, CreditCard, Eye, Trash2,
  AlertTriangle, CheckCircle2, Lock, Crown,
  Smartphone, Key, LogOut, Save, RotateCcw,
  Mail, Zap, Settings,
  Monitor, Moon, Sun, Palette, Download,
  Camera, Globe, Languages, Accessibility, History,
  Type, Volume2, Contrast,
  Clock, MapPin, DollarSign, Calendar,
  Search, ChevronRight, ExternalLink, MoreHorizontal,
  RefreshCw, Activity, Undo2, Menu, ArrowRight,
} from 'lucide-react';

/* ══════════════════════════════════════════════════════════
   Nav Items
   ══════════════════════════════════════════════════════════ */
const SECTIONS = [
  { id: 'profile', label: 'Profile', icon: User, group: 'Account' },
  { id: 'security', label: 'Security', icon: Shield, group: 'Account' },
  { id: 'privacy', label: 'Privacy', icon: Eye, group: 'Account' },
  { id: 'notifications', label: 'Notifications', icon: Bell, group: 'Preferences' },
  { id: 'appearance', label: 'Appearance', icon: Palette, group: 'Preferences' },
  { id: 'accessibility', label: 'Accessibility', icon: Accessibility, group: 'Preferences' },
  { id: 'localization', label: 'Language & Region', icon: Globe, group: 'Preferences' },
  { id: 'connected', label: 'Connected Apps', icon: Link2, group: 'Integrations' },
  { id: 'billing', label: 'Billing & Plan', icon: CreditCard, group: 'Billing' },
  { id: 'data', label: 'Data & Export', icon: Download, group: 'Data' },
  { id: 'history', label: 'Change History', icon: History, group: 'Data' },
  { id: 'danger', label: 'Danger Zone', icon: Trash2, group: 'Danger' },
] as const;

const SECTION_GROUPS = ['Account', 'Preferences', 'Integrations', 'Billing', 'Data', 'Danger'] as const;

/* ══════════════════════════════════════════════════════════
   Reusable Components
   ══════════════════════════════════════════════════════════ */
const ToggleRow: React.FC<{
  label: string; desc: string; checked: boolean; onChange: (v: boolean) => void;
  locked?: boolean; premium?: boolean;
}> = ({ label, desc, checked, onChange, locked, premium }) => (
  <div className="flex items-center justify-between py-3 border-b last:border-0 group">
    <div>
      <div className="text-[11px] font-medium flex items-center gap-1.5">
        {label}
        {premium && <Badge className="text-[8px] h-3.5 bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))] border-0 rounded-md">PRO</Badge>}
        {locked && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
      </div>
      <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
    </div>
    <Switch checked={checked} onCheckedChange={onChange} disabled={locked} className="shrink-0" />
  </div>
);

const FieldRow: React.FC<{
  label: string; value: string; type?: string; readOnly?: boolean; governed?: boolean;
}> = ({ label, value, type = 'text', readOnly, governed }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-medium flex items-center gap-1">
      {label}
      {governed && <Badge variant="outline" className="text-[8px] h-3.5 rounded-md">Governed</Badge>}
      {readOnly && <Badge variant="secondary" className="text-[8px] h-3.5 rounded-md">Read-only</Badge>}
    </label>
    <input
      type={type}
      defaultValue={value}
      readOnly={readOnly}
      className={cn(
        'w-full h-9 rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all',
        readOnly && 'bg-muted cursor-not-allowed'
      )}
    />
  </div>
);

const SelectRow: React.FC<{
  label: string; desc?: string; value: string; options: { value: string; label: string }[];
  onChange: (v: string) => void;
}> = ({ label, desc, value, options, onChange }) => (
  <div className="space-y-1">
    <label className="text-[11px] font-medium block">{label}</label>
    {desc && <p className="text-[9px] text-muted-foreground">{desc}</p>}
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="w-full h-9 rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </div>
);

const UnsavedBanner: React.FC<{ show: boolean; onSave: () => void; onDiscard: () => void }> = ({ show, onSave, onDiscard }) => {
  if (!show) return null;
  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="flex items-center gap-3 rounded-2xl border bg-card shadow-2xl px-5 py-3">
        <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />
        <span className="text-[11px] font-medium">You have unsaved changes</span>
        <Button variant="ghost" size="sm" className="text-[10px] h-7 rounded-xl" onClick={onDiscard}>
          <RotateCcw className="h-3 w-3 mr-1" /> Discard
        </Button>
        <Button size="sm" className="text-[10px] h-7 rounded-xl" onClick={onSave}>
          <Save className="h-3 w-3 mr-1" /> Save Changes
        </Button>
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Section Card Wrapper (rounded-2xl override)
   ══════════════════════════════════════════════════════════ */
const SettingsCard: React.FC<React.ComponentProps<typeof SectionCard>> = (props) => (
  <SectionCard {...props} className={cn('!rounded-2xl', props.className)} />
);

/* ══════════════════════════════════════════════════════════
   Profile Section
   ══════════════════════════════════════════════════════════ */
const ProfileSection: React.FC = () => {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <SettingsCard title="Personal Information" subtitle="Your public profile details">
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="relative group">
            <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center ring-4 ring-muted/50 transition-transform group-hover:scale-105">
              <Camera className="h-5 w-5 text-muted-foreground" />
            </div>
            <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-xl bg-accent text-accent-foreground flex items-center justify-center shadow-sm transition-transform hover:scale-110">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div>
            <div className="text-xs font-bold">{user?.name || 'User'}</div>
            <div className="text-[10px] text-muted-foreground">{user?.email || 'email@example.com'}</div>
            <Button variant="outline" size="sm" className="text-[10px] h-7 mt-1.5 rounded-xl">Change Photo</Button>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3 pt-4">
          <FieldRow label="Full Name" value={user?.name || ''} />
          <FieldRow label="Email" value={user?.email || ''} governed />
          <FieldRow label="Headline" value="" />
          <FieldRow label="Location" value="" />
          <FieldRow label="Website" value="" type="url" />
          <FieldRow label="Phone" value="" type="tel" />
        </div>
      </SettingsCard>
      <SettingsCard title="Bio" subtitle="Short description for your profile">
        <textarea
          className="w-full rounded-xl border bg-background px-3 py-2.5 text-xs min-h-[80px] focus:outline-none focus:ring-2 focus:ring-accent/30 resize-none transition-all"
          placeholder="Tell others about yourself..."
          maxLength={300}
        />
        <p className="text-[9px] text-muted-foreground text-right mt-1">0/300</p>
      </SettingsCard>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Security Section
   ══════════════════════════════════════════════════════════ */
const SecuritySection: React.FC = () => {
  const sessions = [
    { device: 'Chrome on macOS', location: 'San Francisco, US', time: 'Active now', current: true },
    { device: 'Safari on iPhone', location: 'New York, US', time: '2 hours ago', current: false },
    { device: 'Firefox on Windows', location: 'London, UK', time: '3 days ago', current: false },
  ];

  return (
    <div className="space-y-4">
      <SettingsCard title="Password" subtitle="Change your password">
        <div className="grid md:grid-cols-2 gap-3">
          <FieldRow label="Current Password" value="" type="password" />
          <div />
          <FieldRow label="New Password" value="" type="password" />
          <FieldRow label="Confirm New Password" value="" type="password" />
        </div>
        <Button size="sm" className="text-xs h-8 mt-3 rounded-xl">Update Password</Button>
      </SettingsCard>

      <SettingsCard title="Two-Factor Authentication" subtitle="Add an extra layer of security">
        <div className="flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[hsl(var(--state-caution)/0.1)] flex items-center justify-center">
              <Smartphone className="h-4 w-4 text-[hsl(var(--state-caution))]" />
            </div>
            <div>
              <div className="text-[11px] font-semibold">Authenticator App</div>
              <div className="text-[10px] text-muted-foreground">Not configured</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl">Enable</Button>
        </div>
        <div className="flex items-center justify-between p-3.5 rounded-2xl border mt-2 transition-all hover:shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center">
              <Key className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <div className="text-[11px] font-semibold">Recovery Codes</div>
              <div className="text-[10px] text-muted-foreground">Generate backup codes</div>
            </div>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl" disabled>Generate</Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Active Sessions" subtitle="Manage your logged-in devices">
        <div className="space-y-2">
          {sessions.map((s, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-2xl border transition-all hover:shadow-sm group">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold flex items-center gap-1.5">
                    {s.device}
                    {s.current && <Badge className="text-[8px] h-3.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-md">Current</Badge>}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{s.location} · {s.time}</div>
                </div>
              </div>
              {!s.current && (
                <Button variant="ghost" size="sm" className="text-[10px] h-7 text-[hsl(var(--state-blocked))] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                  <LogOut className="h-3 w-3 mr-1" /> Revoke
                </Button>
              )}
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="text-[10px] h-8 mt-2 text-[hsl(var(--state-blocked))] rounded-xl">
          <LogOut className="h-3 w-3 mr-1" /> Sign out all other sessions
        </Button>
      </SettingsCard>

      <SettingsCard title="Login Activity" subtitle="Recent sign-in events">
        <div className="rounded-2xl border overflow-hidden">
          <table className="w-full">
            <thead><tr className="bg-muted/50">
              <th className="text-left text-[10px] font-semibold p-2.5">Event</th>
              <th className="text-left text-[10px] font-semibold p-2.5 hidden sm:table-cell">Location</th>
              <th className="text-left text-[10px] font-semibold p-2.5 hidden md:table-cell">IP</th>
              <th className="text-left text-[10px] font-semibold p-2.5">Time</th>
            </tr></thead>
            <tbody>
              {[
                { event: 'Sign in', location: 'San Francisco, US', ip: '192.168.1.x', time: 'Just now', ok: true },
                { event: 'Sign in', location: 'New York, US', ip: '10.0.0.x', time: '2h ago', ok: true },
                { event: 'Failed sign in', location: 'Unknown', ip: '203.0.x.x', time: '1d ago', ok: false },
                { event: 'Password changed', location: 'San Francisco, US', ip: '192.168.1.x', time: '5d ago', ok: true },
              ].map((log, i) => (
                <tr key={i} className="border-t hover:bg-muted/20 transition-colors">
                  <td className="p-2.5 text-[10px] flex items-center gap-1.5">
                    {log.ok
                      ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
                      : <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-blocked))]" />}
                    {log.event}
                  </td>
                  <td className="p-2.5 text-[10px] text-muted-foreground hidden sm:table-cell">{log.location}</td>
                  <td className="p-2.5 text-[10px] font-mono text-muted-foreground hidden md:table-cell">{log.ip}</td>
                  <td className="p-2.5 text-[10px] text-muted-foreground">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SettingsCard>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Privacy Section
   ══════════════════════════════════════════════════════════ */
const PrivacySection: React.FC = () => {
  const [profileVisibility, setProfileVisibility] = useState(true);
  const [showEmail, setShowEmail] = useState(false);
  const [showPhone, setShowPhone] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const [allowIndexing, setAllowIndexing] = useState(true);

  return (
    <div className="space-y-4">
      <SettingsCard title="Profile Visibility" subtitle="Control who can see your profile and activity">
        <ToggleRow label="Public Profile" desc="Allow anyone to view your profile page" checked={profileVisibility} onChange={setProfileVisibility} />
        <ToggleRow label="Show Email" desc="Display your email address on your profile" checked={showEmail} onChange={setShowEmail} />
        <ToggleRow label="Show Phone" desc="Display your phone number on your profile" checked={showPhone} onChange={setShowPhone} />
        <ToggleRow label="Activity Feed" desc="Show your activity in the public feed" checked={showActivity} onChange={setShowActivity} />
        <ToggleRow label="Search Engine Indexing" desc="Allow search engines to index your profile" checked={allowIndexing} onChange={setAllowIndexing} />
      </SettingsCard>

      <SettingsCard title="Blocking & Muting" subtitle="Manage blocked and muted users">
        <div className="text-center py-6">
          <div className="h-10 w-10 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-2">
            <Shield className="h-4 w-4 text-muted-foreground/30" />
          </div>
          <div className="text-[11px] text-muted-foreground">No blocked or muted users</div>
        </div>
      </SettingsCard>

      <SettingsCard title="Data Sharing" subtitle="Control how your data is used">
        <ToggleRow label="Analytics" desc="Help improve Gigvora with anonymized usage data" checked={true} onChange={() => {}} />
        <ToggleRow label="Personalized Recommendations" desc="Use your activity to personalize content" checked={true} onChange={() => {}} />
        <ToggleRow label="Third-Party Sharing" desc="Share data with approved partners" checked={false} onChange={() => {}} />
      </SettingsCard>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Notifications Section
   ══════════════════════════════════════════════════════════ */
const NotificationsSection: React.FC = () => {
  const [emailMessages, setEmailMessages] = useState(true);
  const [emailJobs, setEmailJobs] = useState(true);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [pushMessages, setPushMessages] = useState(true);
  const [pushMentions, setPushMentions] = useState(true);

  return (
    <div className="space-y-4">
      <SettingsCard title="Email Notifications" subtitle="Choose which emails you receive" icon={<Mail className="h-4 w-4" />}>
        <ToggleRow label="Messages" desc="New messages and replies" checked={emailMessages} onChange={setEmailMessages} />
        <ToggleRow label="Job Alerts" desc="New jobs matching your profile" checked={emailJobs} onChange={setEmailJobs} />
        <ToggleRow label="Gig Orders" desc="Order updates and delivery notifications" checked={true} onChange={() => {}} />
        <ToggleRow label="Project Updates" desc="Milestones, reviews, and team activity" checked={true} onChange={() => {}} />
        <ToggleRow label="Network Activity" desc="Connection requests and endorsements" checked={true} onChange={() => {}} />
        <ToggleRow label="Marketing" desc="Product updates and promotional content" checked={emailMarketing} onChange={setEmailMarketing} />
      </SettingsCard>

      <SettingsCard title="Push Notifications" subtitle="Real-time alerts on your device" icon={<Smartphone className="h-4 w-4" />}>
        <ToggleRow label="Messages" desc="Instant alerts for new messages" checked={pushMessages} onChange={setPushMessages} />
        <ToggleRow label="Mentions" desc="When someone mentions you" checked={pushMentions} onChange={setPushMentions} />
        <ToggleRow label="Calendar Reminders" desc="Upcoming meetings and events" checked={true} onChange={() => {}} />
        <ToggleRow label="Payment Alerts" desc="Escrow releases and payment received" checked={true} onChange={() => {}} />
      </SettingsCard>

      <SettingsCard title="Digest Settings" subtitle="Batch notifications into summaries">
        <div className="space-y-2">
          <div>
            <label className="text-[11px] font-medium mb-1.5 block">Email Digest Frequency</label>
            <select className="w-full h-9 rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option>Real-time</option>
              <option>Daily digest</option>
              <option>Weekly digest</option>
              <option>Never</option>
            </select>
          </div>
        </div>
      </SettingsCard>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Connected Apps Section
   ══════════════════════════════════════════════════════════ */
const ConnectedAppsSection: React.FC = () => {
  const apps = [
    { name: 'Google', desc: 'Sign in and calendar sync', status: 'connected', icon: '🔗' },
    { name: 'GitHub', desc: 'Code portfolio and repositories', status: 'connected', icon: '🔗' },
    { name: 'Slack', desc: 'Notification forwarding', status: 'disconnected', icon: '🔗' },
    { name: 'Zoom', desc: 'Video meeting integration', status: 'disconnected', icon: '🔗' },
    { name: 'Stripe', desc: 'Payment processing', status: 'connected', icon: '🔗' },
    { name: 'Dropbox', desc: 'File storage and sharing', status: 'disconnected', icon: '🔗' },
  ];

  return (
    <SettingsCard title="Connected Applications" subtitle="Manage third-party integrations">
      <div className="space-y-2">
        {apps.map((app) => (
          <div key={app.name} className="flex items-center justify-between p-3.5 rounded-2xl border transition-all hover:shadow-sm group">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-sm transition-transform group-hover:scale-105">{app.icon}</div>
              <div>
                <div className="text-[11px] font-semibold">{app.name}</div>
                <div className="text-[10px] text-muted-foreground">{app.desc}</div>
              </div>
            </div>
            {app.status === 'connected' ? (
              <div className="flex items-center gap-2">
                <Badge className="text-[8px] h-3.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-md">Connected</Badge>
                <Button variant="ghost" size="sm" className="text-[10px] h-7 text-[hsl(var(--state-blocked))] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">Disconnect</Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl">Connect</Button>
            )}
          </div>
        ))}
      </div>
    </SettingsCard>
  );
};

/* ══════════════════════════════════════════════════════════
   Billing Section
   ══════════════════════════════════════════════════════════ */
const BillingSection: React.FC = () => {
  const { currentPlan, entitlements, hasEntitlement } = useRole();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const planCfg = PLAN_CONFIGS[currentPlan];

  return (
    <div className="space-y-4">
      <SettingsCard title="Current Plan" subtitle="Your subscription details">
        <div className="flex items-center justify-between p-4 rounded-2xl border bg-[hsl(var(--gigvora-blue)/0.03)] transition-all hover:shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className={cn(
              'h-12 w-12 rounded-2xl flex items-center justify-center ring-4',
              currentPlan === 'free' ? 'bg-muted ring-muted/50' : 'bg-[hsl(var(--state-premium)/0.1)] ring-[hsl(var(--state-premium)/0.05)]'
            )}>
              {currentPlan === 'free' ? <Shield className="h-5 w-5 text-muted-foreground" /> : <Crown className="h-5 w-5 text-[hsl(var(--state-premium))]" />}
            </div>
            <div>
              <div className="text-sm font-bold flex items-center gap-2">
                {planCfg.label} Plan
                {currentPlan !== 'free' && <Badge className="text-[8px] h-3.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-md">Active</Badge>}
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{planCfg.description}</div>
            </div>
          </div>
          <Button size="sm" className="text-[10px] h-8 gap-1.5 rounded-xl" onClick={() => setShowUpgrade(true)}>
            <Zap className="h-3 w-3" /> {currentPlan === 'free' ? 'Upgrade' : 'Manage Plan'}
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
          {[
            { label: 'Proposals', used: 2, limit: planCfg.limits.proposals },
            { label: 'Projects', used: 1, limit: planCfg.limits.projects },
            { label: 'Gig Slots', used: 0, limit: planCfg.limits.gigSlots },
            { label: 'Team', used: 1, limit: planCfg.limits.teamMembers },
            { label: 'Storage', used: 0, limit: -1, display: `0 / ${planCfg.limits.storage}` },
          ].map((metric) => {
            const pct = metric.limit > 0 ? (metric.used / metric.limit) * 100 : 0;
            return (
              <div key={metric.label} className="rounded-2xl border p-3 hover:shadow-sm transition-shadow">
                <div className="text-[10px] text-muted-foreground mb-1">{metric.label}</div>
                <div className="text-xs font-bold">
                  {metric.display || (metric.limit === -1 ? '∞' : `${metric.used}/${metric.limit}`)}
                </div>
                {metric.limit > 0 && (
                  <div className="h-1.5 rounded-full bg-muted mt-2">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all',
                        pct > 80 ? 'bg-[hsl(var(--state-blocked))]' : pct > 50 ? 'bg-[hsl(var(--state-caution))]' : 'bg-[hsl(var(--state-healthy))]'
                      )}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SettingsCard>

      <SettingsCard title="Active Entitlements" subtitle="Features included in your plan">
        {entitlements.size === 0 ? (
          <div className="text-center py-6">
            <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Lock className="h-5 w-5 text-muted-foreground/30" />
            </div>
            <p className="text-[11px] text-muted-foreground mb-2">No premium entitlements on the Free plan</p>
            <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1.5 rounded-xl" onClick={() => setShowUpgrade(true)}>
              <Zap className="h-3 w-3" /> View Available Features
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-2">
            {Array.from(entitlements).map((ent) => {
              const meta = ENTITLEMENT_LABELS[ent];
              return (
                <div key={ent} className="flex items-center gap-2.5 p-3 rounded-2xl border bg-[hsl(var(--state-healthy)/0.02)] hover:shadow-sm transition-shadow">
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))] shrink-0" />
                  <div>
                    <div className="text-[11px] font-medium">{meta?.label || ent}</div>
                    <div className="text-[9px] text-muted-foreground">{meta?.description || ''}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </SettingsCard>

      {entitlements.size < Object.keys(ENTITLEMENT_LABELS).length && (
        <SettingsCard title="Available Upgrades" subtitle="Features you can unlock">
          <div className="grid md:grid-cols-2 gap-2">
            {(Object.entries(ENTITLEMENT_LABELS) as [FeatureEntitlement, typeof ENTITLEMENT_LABELS[FeatureEntitlement]][])
              .filter(([key]) => !hasEntitlement(key))
              .slice(0, 6)
              .map(([key, meta]) => (
                <div key={key} className="flex items-center gap-2.5 p-3 rounded-2xl border border-dashed opacity-60 hover:opacity-80 transition-opacity">
                  <Lock className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div>
                    <div className="text-[11px] font-medium">{meta.label}</div>
                    <div className="text-[9px] text-muted-foreground">From {PLAN_CONFIGS[meta.minPlan].label}</div>
                  </div>
                </div>
              ))}
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-8 gap-1.5 mt-3 w-full rounded-xl" onClick={() => setShowUpgrade(true)}>
            Compare All Plans
          </Button>
        </SettingsCard>
      )}

      <SettingsCard title="Payment Methods" subtitle="Manage your payment information">
        <div className="text-center py-6">
          <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
            <CreditCard className="h-5 w-5 text-muted-foreground/30" />
          </div>
          <p className="text-[11px] text-muted-foreground">No payment methods added</p>
          <Button variant="outline" size="sm" className="text-[10px] h-8 mt-2 rounded-xl">Add Payment Method</Button>
        </div>
      </SettingsCard>

      <SettingsCard title="Billing History" subtitle="Past invoices and receipts">
        <div className="text-center py-6 text-[11px] text-muted-foreground">
          No billing history
        </div>
      </SettingsCard>

      <PlanUpgradeDrawer open={showUpgrade} onOpenChange={setShowUpgrade} />
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Appearance Section
   ══════════════════════════════════════════════════════════ */
const AppearanceSection: React.FC = () => (
  <SettingsCard title="Appearance" subtitle="Customize your visual experience">
    <div className="space-y-4">
      <div>
        <label className="text-[11px] font-medium mb-2 block">Theme</label>
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { id: 'light', label: 'Light', icon: Sun },
            { id: 'dark', label: 'Dark', icon: Moon },
            { id: 'system', label: 'System', icon: Monitor },
          ].map((t) => (
            <button key={t.id} className={cn(
              'rounded-2xl border p-4 text-center transition-all hover:shadow-sm',
              t.id === 'light' && 'border-accent ring-2 ring-accent/20 bg-accent/5'
            )}>
              <t.icon className="h-5 w-5 mx-auto mb-1.5 text-muted-foreground" />
              <div className="text-[10px] font-medium">{t.label}</div>
            </button>
          ))}
        </div>
      </div>
      <div>
        <label className="text-[11px] font-medium mb-1.5 block">Density</label>
        <select className="w-full h-9 rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30">
          <option>Compact (Professional)</option>
          <option>Comfortable</option>
          <option>Spacious</option>
        </select>
      </div>
    </div>
  </SettingsCard>
);

/* ══════════════════════════════════════════════════════════
   Accessibility Section
   ══════════════════════════════════════════════════════════ */
const AccessibilitySection: React.FC = () => {
  const [fontSize, setFontSize] = useState([100]);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [highContrast, setHighContrast] = useState(false);
  const [screenReader, setScreenReader] = useState(false);
  const [focusIndicators, setFocusIndicators] = useState(true);
  const [autoplayMedia, setAutoplayMedia] = useState(true);
  const [captionsDefault, setCaptionsDefault] = useState(false);

  return (
    <div className="space-y-4">
      <SettingsCard title="Visual Accessibility" subtitle="Adjust how content appears on screen">
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <div className="text-[11px] font-medium flex items-center gap-1.5">
                  <Type className="h-3 w-3" /> Font Size
                </div>
                <div className="text-[10px] text-muted-foreground">Adjust text size across the platform</div>
              </div>
              <Badge variant="outline" className="text-[9px] h-5 tabular-nums rounded-lg">{fontSize[0]}%</Badge>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground shrink-0">A</span>
              <Slider value={fontSize} onValueChange={setFontSize} min={75} max={150} step={5} className="flex-1" />
              <span className="text-sm font-bold text-muted-foreground shrink-0">A</span>
            </div>
            <div className="flex gap-2 mt-2.5">
              {[75, 100, 125, 150].map(v => (
                <button
                  key={v}
                  onClick={() => setFontSize([v])}
                  className={cn(
                    'px-2.5 py-1 rounded-xl text-[9px] font-medium transition-all',
                    fontSize[0] === v ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {v}%
                </button>
              ))}
            </div>
          </div>
          <ToggleRow label="High Contrast Mode" desc="Increase contrast for better readability" checked={highContrast} onChange={setHighContrast} />
        </div>
      </SettingsCard>

      <SettingsCard title="Motion & Animation" subtitle="Control motion and animation behavior">
        <ToggleRow label="Reduce Motion" desc="Minimize animations and transitions throughout the platform" checked={reducedMotion} onChange={setReducedMotion} />
        <ToggleRow label="Autoplay Media" desc="Automatically play videos and animated content" checked={autoplayMedia} onChange={setAutoplayMedia} />
      </SettingsCard>

      <SettingsCard title="Assistive Technology" subtitle="Configure screen reader and keyboard navigation">
        <ToggleRow label="Screen Reader Optimizations" desc="Enhanced ARIA labels and landmarks for screen readers" checked={screenReader} onChange={setScreenReader} />
        <ToggleRow label="Enhanced Focus Indicators" desc="Show larger, more visible focus rings when navigating by keyboard" checked={focusIndicators} onChange={setFocusIndicators} />
        <ToggleRow label="Default Captions" desc="Show captions by default on all video content" checked={captionsDefault} onChange={setCaptionsDefault} />
      </SettingsCard>

      <SettingsCard title="Keyboard Shortcuts" subtitle="Quick reference for navigation shortcuts">
        <div className="space-y-1">
          {[
            { keys: '⌘ + K', desc: 'Open command palette' },
            { keys: '⌘ + /', desc: 'Show all shortcuts' },
            { keys: 'G then D', desc: 'Go to dashboard' },
            { keys: 'G then I', desc: 'Go to inbox' },
            { keys: 'G then N', desc: 'Go to notifications' },
            { keys: 'G then S', desc: 'Go to settings' },
            { keys: 'Esc', desc: 'Close active overlay' },
          ].map(s => (
            <div key={s.keys} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-[10px] text-muted-foreground">{s.desc}</span>
              <kbd className="text-[9px] bg-muted px-2 py-0.5 rounded-lg font-mono shadow-sm border">{s.keys}</kbd>
            </div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="text-[10px] h-8 mt-3 w-full rounded-xl">
          View All Shortcuts
        </Button>
      </SettingsCard>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Localization Section
   ══════════════════════════════════════════════════════════ */
const LocalizationSection: React.FC = () => {
  const [language, setLanguage] = useState('en-US');
  const [region, setRegion] = useState('US');
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY');
  const [timeFormat, setTimeFormat] = useState('12h');
  const [timezone, setTimezone] = useState('America/Los_Angeles');
  const [currency, setCurrency] = useState('USD');
  const [startOfWeek, setStartOfWeek] = useState('sunday');

  const previewDate = dateFormat === 'MM/DD/YYYY' ? '04/13/2026' : dateFormat === 'DD/MM/YYYY' ? '13/04/2026' : '2026-04-13';
  const previewTime = timeFormat === '12h' ? '2:45 PM' : '14:45';
  const previewCurrency = currency === 'USD' ? '$1,250.00' : currency === 'EUR' ? '€1,250.00' : currency === 'GBP' ? '£1,250.00' : '¥1,250';

  return (
    <div className="space-y-4">
      <SettingsCard title="Language" subtitle="Choose your preferred language">
        <SelectRow
          label="Display Language"
          desc="The language used for the Gigvora interface"
          value={language}
          onChange={setLanguage}
          options={[
            { value: 'en-US', label: 'English (United States)' },
            { value: 'en-GB', label: 'English (United Kingdom)' },
            { value: 'es', label: 'Español' },
            { value: 'fr', label: 'Français' },
            { value: 'de', label: 'Deutsch' },
            { value: 'pt-BR', label: 'Português (Brasil)' },
            { value: 'ja', label: '日本語' },
            { value: 'zh-CN', label: '中文 (简体)' },
            { value: 'ko', label: '한국어' },
            { value: 'ar', label: 'العربية' },
          ]}
        />
        <p className="text-[9px] text-muted-foreground mt-1.5">
          <Languages className="h-2.5 w-2.5 inline mr-0.5" />
          Translation quality may vary. Help us improve translations by contributing.
        </p>
      </SettingsCard>

      <SettingsCard title="Region & Formats" subtitle="Date, time, and number formatting">
        <div className="grid md:grid-cols-2 gap-3">
          <SelectRow label="Region" value={region} onChange={setRegion} options={[
            { value: 'US', label: 'United States' }, { value: 'GB', label: 'United Kingdom' },
            { value: 'CA', label: 'Canada' }, { value: 'AU', label: 'Australia' },
            { value: 'DE', label: 'Germany' }, { value: 'FR', label: 'France' },
            { value: 'JP', label: 'Japan' }, { value: 'BR', label: 'Brazil' },
          ]} />
          <SelectRow label="Timezone" value={timezone} onChange={setTimezone} options={[
            { value: 'America/Los_Angeles', label: 'Pacific Time (UTC-8)' },
            { value: 'America/New_York', label: 'Eastern Time (UTC-5)' },
            { value: 'America/Chicago', label: 'Central Time (UTC-6)' },
            { value: 'UTC', label: 'UTC' },
            { value: 'Europe/London', label: 'London (UTC+0)' },
            { value: 'Europe/Berlin', label: 'Berlin (UTC+1)' },
            { value: 'Asia/Tokyo', label: 'Tokyo (UTC+9)' },
            { value: 'Asia/Shanghai', label: 'Shanghai (UTC+8)' },
          ]} />
          <SelectRow label="Date Format" value={dateFormat} onChange={setDateFormat} options={[
            { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
            { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
            { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (ISO)' },
          ]} />
          <SelectRow label="Time Format" value={timeFormat} onChange={setTimeFormat} options={[
            { value: '12h', label: '12-hour (2:45 PM)' },
            { value: '24h', label: '24-hour (14:45)' },
          ]} />
          <SelectRow label="Currency" value={currency} onChange={setCurrency} options={[
            { value: 'USD', label: 'US Dollar ($)' }, { value: 'EUR', label: 'Euro (€)' },
            { value: 'GBP', label: 'British Pound (£)' }, { value: 'JPY', label: 'Japanese Yen (¥)' },
            { value: 'CAD', label: 'Canadian Dollar (C$)' }, { value: 'AUD', label: 'Australian Dollar (A$)' },
          ]} />
          <SelectRow label="First Day of Week" value={startOfWeek} onChange={setStartOfWeek} options={[
            { value: 'sunday', label: 'Sunday' }, { value: 'monday', label: 'Monday' }, { value: 'saturday', label: 'Saturday' },
          ]} />
        </div>
      </SettingsCard>

      <SettingsCard title="Format Preview" subtitle="See how your settings look in practice">
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { icon: Calendar, label: 'Date', value: previewDate },
            { icon: Clock, label: 'Time', value: previewTime },
            { icon: DollarSign, label: 'Currency', value: previewCurrency },
          ].map(p => (
            <div key={p.label} className="rounded-2xl border p-4 text-center hover:shadow-sm transition-shadow">
              <p.icon className="h-4 w-4 mx-auto mb-2 text-muted-foreground" />
              <div className="text-[10px] text-muted-foreground mb-0.5">{p.label}</div>
              <div className="text-xs font-bold">{p.value}</div>
            </div>
          ))}
        </div>
      </SettingsCard>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Data Export Section
   ══════════════════════════════════════════════════════════ */
const DataExportSection: React.FC = () => (
  <div className="space-y-4">
    <SettingsCard title="Export Your Data" subtitle="Download a copy of your Gigvora data">
      <div className="space-y-2">
        {[
          { label: 'Profile & Settings', desc: 'Your profile information, preferences, and settings', size: '~2 KB' },
          { label: 'Messages', desc: 'All conversations and message history', size: '~50 KB' },
          { label: 'Activity History', desc: 'Login history, actions, and audit log', size: '~10 KB' },
          { label: 'Documents', desc: 'Uploaded files and documents', size: '~500 KB' },
          { label: 'Complete Archive', desc: 'Everything above in a single download', size: '~600 KB' },
        ].map((item) => (
          <div key={item.label} className="flex items-center justify-between p-3 rounded-2xl border hover:shadow-sm transition-shadow group">
            <div>
              <div className="text-[11px] font-semibold">{item.label}</div>
              <div className="text-[10px] text-muted-foreground">{item.desc}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[9px] text-muted-foreground">{item.size}</span>
              <Button variant="outline" size="sm" className="text-[10px] h-7 rounded-xl">
                <Download className="h-3 w-3 mr-1" /> Export
              </Button>
            </div>
          </div>
        ))}
      </div>
    </SettingsCard>
  </div>
);

/* ══════════════════════════════════════════════════════════
   Change History Section
   ══════════════════════════════════════════════════════════ */
const ChangeHistorySection: React.FC = () => {
  const [filterType, setFilterType] = useState<string>('all');

  const changeLog = [
    { id: '1', action: 'Password changed', section: 'Security', actor: 'You', timestamp: 'Today, 10:23 AM', type: 'security', revertable: false },
    { id: '2', action: 'Email digest set to "Daily"', section: 'Notifications', actor: 'You', timestamp: 'Today, 9:15 AM', type: 'preference', revertable: true },
    { id: '3', action: 'Profile photo updated', section: 'Profile', actor: 'You', timestamp: 'Yesterday, 4:02 PM', type: 'profile', revertable: true },
    { id: '4', action: 'Two-factor auth enabled', section: 'Security', actor: 'You', timestamp: 'Yesterday, 2:30 PM', type: 'security', revertable: false },
    { id: '5', action: 'Google integration connected', section: 'Connected Apps', actor: 'You', timestamp: 'Jan 10, 11:00 AM', type: 'integration', revertable: true },
    { id: '6', action: 'Theme changed to "Dark"', section: 'Appearance', actor: 'You', timestamp: 'Jan 9, 8:45 PM', type: 'preference', revertable: true },
    { id: '7', action: 'Headline updated', section: 'Profile', actor: 'You', timestamp: 'Jan 8, 3:15 PM', type: 'profile', revertable: true },
    { id: '8', action: 'Privacy: search indexing disabled', section: 'Privacy', actor: 'You', timestamp: 'Jan 7, 10:00 AM', type: 'preference', revertable: true },
    { id: '9', action: 'Language changed to English (US)', section: 'Localization', actor: 'You', timestamp: 'Jan 5, 2:20 PM', type: 'preference', revertable: true },
    { id: '10', action: 'Account created', section: 'System', actor: 'System', timestamp: 'Dec 28, 9:00 AM', type: 'system', revertable: false },
  ];

  const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
    security: { label: 'Security', color: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]' },
    preference: { label: 'Preference', color: 'bg-accent/10 text-accent' },
    profile: { label: 'Profile', color: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]' },
    integration: { label: 'Integration', color: 'bg-[hsl(var(--gigvora-green)/0.1)] text-[hsl(var(--gigvora-green))]' },
    system: { label: 'System', color: 'bg-muted text-muted-foreground' },
  };

  const filtered = filterType === 'all' ? changeLog : changeLog.filter(c => c.type === filterType);

  return (
    <div className="space-y-4">
      <SettingsCard title="Settings Change History" subtitle="Audit trail of all settings modifications">
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {[
            { id: 'all', label: 'All Changes' },
            { id: 'security', label: 'Security' },
            { id: 'preference', label: 'Preferences' },
            { id: 'profile', label: 'Profile' },
            { id: 'integration', label: 'Integrations' },
            { id: 'system', label: 'System' },
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              className={cn(
                'px-2.5 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap transition-all shrink-0',
                filterType === f.id
                  ? 'bg-accent text-accent-foreground shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="space-y-0">
          {filtered.map((entry, i) => (
            <div key={entry.id} className="flex items-start gap-3 py-2.5 border-b last:border-0 group">
              <div className="flex flex-col items-center shrink-0">
                <div className={cn(
                  'h-2.5 w-2.5 rounded-full mt-1.5 ring-2 ring-card',
                  entry.type === 'security' ? 'bg-[hsl(var(--state-caution))]' :
                  entry.type === 'system' ? 'bg-muted-foreground/40' :
                  'bg-accent',
                )} />
                {i < filtered.length - 1 && <div className="flex-1 w-px bg-border/50 mt-1" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-medium">{entry.action}</span>
                  <Badge className={cn('text-[7px] h-3.5 border-0 rounded-md', TYPE_CONFIG[entry.type]?.color)}>
                    {TYPE_CONFIG[entry.type]?.label}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                  <span>{entry.section}</span>
                  <span>•</span>
                  <span>{entry.actor}</span>
                  <span>•</span>
                  <span>{entry.timestamp}</span>
                </div>
              </div>
              {entry.revertable && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden group-hover:flex text-[9px] h-6 text-muted-foreground hover:text-accent rounded-xl"
                >
                  <Undo2 className="h-2.5 w-2.5 mr-0.5" /> Revert
                </Button>
              )}
            </div>
          ))}
        </div>
      </SettingsCard>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Total Changes', value: changeLog.length },
          { label: 'Security Events', value: changeLog.filter(c => c.type === 'security').length },
          { label: 'Today', value: changeLog.filter(c => c.timestamp.startsWith('Today')).length },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border bg-card p-4 text-center hover:shadow-sm transition-shadow">
            <div className="text-lg font-bold">{s.value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════
   Danger Zone
   ══════════════════════════════════════════════════════════ */
const DangerZoneSection: React.FC = () => (
  <div className="space-y-4">
    <SettingsCard title="Danger Zone" subtitle="Irreversible actions" className="!border-[hsl(var(--state-blocked)/0.3)]">
      <div className="space-y-3">
        <div className="flex items-center justify-between p-4 rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.03)]">
          <div>
            <div className="text-[11px] font-semibold">Deactivate Account</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Temporarily disable your account. You can reactivate later.</div>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-8 text-[hsl(var(--state-caution))] border-[hsl(var(--state-caution)/0.3)] rounded-xl">
            Deactivate
          </Button>
        </div>
        <div className="flex items-center justify-between p-4 rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.03)]">
          <div>
            <div className="text-[11px] font-semibold text-[hsl(var(--state-blocked))]">Delete Account</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Permanently delete your account and all data. This cannot be undone.</div>
          </div>
          <Button variant="outline" size="sm" className="text-[10px] h-8 text-[hsl(var(--state-blocked))] border-[hsl(var(--state-blocked)/0.3)] hover:bg-[hsl(var(--state-blocked))] hover:text-white rounded-xl gap-1.5">
            <Trash2 className="h-3 w-3" /> Delete Account
          </Button>
        </div>
      </div>

      <div className="mt-3 rounded-2xl bg-muted/30 p-4">
        <div className="text-[10px] font-semibold mb-1.5">Before deleting your account:</div>
        <ul className="text-[9px] text-muted-foreground space-y-1">
          <li className="flex items-center gap-1.5"><AlertTriangle className="h-2.5 w-2.5 text-[hsl(var(--state-blocked))] shrink-0" /> All active orders will be cancelled and refunded</li>
          <li className="flex items-center gap-1.5"><AlertTriangle className="h-2.5 w-2.5 text-[hsl(var(--state-blocked))] shrink-0" /> Your profile and content will be permanently removed</li>
          <li className="flex items-center gap-1.5"><AlertTriangle className="h-2.5 w-2.5 text-[hsl(var(--state-blocked))] shrink-0" /> You'll lose access to all messages and connections</li>
          <li className="flex items-center gap-1.5"><CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] shrink-0" /> Account deletion has a 30-day cancellation window</li>
        </ul>
      </div>
    </SettingsCard>
  </div>
);

/* ══════════════════════════════════════════════════════════
   Main Settings Page
   ══════════════════════════════════════════════════════════ */
const SECTION_COMPONENTS: Record<string, React.FC> = {
  profile: ProfileSection,
  security: SecuritySection,
  privacy: PrivacySection,
  notifications: NotificationsSection,
  connected: ConnectedAppsSection,
  billing: BillingSection,
  appearance: AppearanceSection,
  accessibility: AccessibilitySection,
  localization: LocalizationSection,
  data: DataExportSection,
  history: ChangeHistorySection,
  danger: DangerZoneSection,
};

const SettingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSection = searchParams.get('tab') || 'profile';
  const [unsaved, setUnsaved] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const ActiveComponent = SECTION_COMPONENTS[activeSection] || ProfileSection;
  const activeMeta = SECTIONS.find(s => s.id === activeSection);

  const navContent = (
    <nav className="py-1">
      {SECTION_GROUPS.map(group => {
        const items = SECTIONS.filter(s => s.group === group);
        return (
          <div key={group}>
            <div className="px-3 pt-3 pb-1.5">
              <span className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground">{group}</span>
            </div>
            {items.map(s => (
              <button
                key={s.id}
                onClick={() => { setSearchParams({ tab: s.id }); setMobileNavOpen(false); }}
                className={cn(
                  'flex items-center gap-2.5 w-full px-3 py-2 text-[11px] font-medium transition-all rounded-r-xl',
                  activeSection === s.id
                    ? 'bg-accent/10 text-accent border-l-2 border-accent'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                  s.id === 'danger' && activeSection !== s.id && 'text-[hsl(var(--state-blocked))]'
                )}
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
                {activeSection === s.id && <ArrowRight className="h-2.5 w-2.5 ml-auto opacity-50" />}
              </button>
            ))}
          </div>
        );
      })}
    </nav>
  );

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        {/* Mobile nav trigger */}
        <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden h-8 w-8 rounded-xl">
              <Menu className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[280px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="text-sm font-bold flex items-center gap-2">
                <Settings className="h-4 w-4 text-accent" /> Settings
              </SheetTitle>
            </SheetHeader>
            {navContent}
          </SheetContent>
        </Sheet>

        <Settings className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold">Settings</span>
        {activeMeta && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground" />
            <span className="text-[11px] text-muted-foreground">{activeMeta.label}</span>
          </>
        )}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1.5 mr-2 text-[9px] text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
          Synced
        </div>
        <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl hidden sm:flex" asChild>
          <Link to="/profile"><User className="h-3 w-3 mr-1" /> View Profile</Link>
        </Button>
        <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl" asChild>
          <Link to="/help"><ExternalLink className="h-3 w-3 mr-1" /> Help</Link>
        </Button>
      </div>
    </>
  );

  /* ── Side Nav (Desktop) ── */
  const sideNav = (
    <div className="space-y-3">
      <SettingsCard title="Settings" className="!p-0 overflow-hidden">
        {navContent}
      </SettingsCard>

      <SettingsCard title="Quick Links">
        <div className="space-y-1">
          {[
            { to: '/profile', icon: User, label: 'My Profile' },
            { to: '/finance/billing', icon: CreditCard, label: 'Billing Portal' },
            { to: '/notifications', icon: Bell, label: 'Notification Centre' },
            { to: '/help', icon: ExternalLink, label: 'Support' },
          ].map(link => (
            <Button key={link.to} variant="ghost" size="sm" className="w-full justify-start text-[10px] h-7 rounded-xl" asChild>
              <Link to={link.to}><link.icon className="h-3 w-3 mr-2" /> {link.label}</Link>
            </Button>
          ))}
        </div>
      </SettingsCard>
    </div>
  );

  return (
    <>
      <DashboardLayout topStrip={topStrip}>
        <div className="flex gap-5">
          <aside className="hidden lg:block w-56 shrink-0">
            {sideNav}
          </aside>
          <div className="flex-1 min-w-0">
            <ActiveComponent />
          </div>
        </div>
      </DashboardLayout>
      <UnsavedBanner show={unsaved} onSave={() => setUnsaved(false)} onDiscard={() => setUnsaved(false)} />
    </>
  );
};

export default SettingsPage;
