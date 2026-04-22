import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Settings, Shield, Eye, EyeOff, Users, Lock, Globe, Bell, Trash2, Flag, UserX } from 'lucide-react';

const VISIBILITY_SETTINGS = [
  { label: 'Profile Visibility', value: 'Public', options: ['Public', 'Connections Only', 'Private'] },
  { label: 'Contact Info', value: 'Connections Only', options: ['Public', 'Connections Only', 'Hidden'] },
  { label: 'Activity Feed', value: 'Public', options: ['Public', 'Connections Only', 'Hidden'] },
  { label: 'Reviews', value: 'Public', options: ['Public', 'Hidden'] },
  { label: 'Earnings/Pricing', value: 'Hidden', options: ['Public', 'Connections Only', 'Hidden'] },
  { label: 'Media Gallery', value: 'Public', options: ['Public', 'Connections Only', 'Hidden'] },
];

const BLOCKED_USERS = [
  { name: 'SpamUser123', reason: 'Unsolicited messages', date: 'Apr 10, 2026' },
  { name: 'FakeAccount_99', reason: 'Impersonation', date: 'Mar 22, 2026' },
];

const REPORTS = [
  { content: 'Comment on "Design Tips" post', reason: 'Spam', status: 'resolved' as const, date: 'Apr 8, 2026' },
  { content: 'Profile image complaint', reason: 'Inappropriate', status: 'pending' as const, date: 'Apr 14, 2026' },
];

export default function PageAdminControlsPage() {
  return (
    <DashboardLayout topStrip={<><Settings className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Page Admin Controls</span><div className="flex-1" /></>}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Visibility & Privacy" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {VISIBILITY_SETTINGS.map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <span className="text-[9px] font-medium">{s.label}</span>
                <div className="flex gap-0.5">
                  {s.options.map(o => (
                    <button key={o} className={cn('px-2 py-0.5 rounded-md text-[7px] font-medium transition-colors', s.value === o ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/50')}>{o}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Security" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {[{ label: 'Two-Factor Authentication', enabled: true }, { label: 'Login Notifications', enabled: true }, { label: 'Profile Edit Alerts', enabled: false }, { label: 'Connection Request Approval', enabled: true }].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <span className="text-[9px] font-medium">{s.label}</span>
                <Badge className={cn('text-[7px] border-0 rounded-md', s.enabled ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>{s.enabled ? 'Enabled' : 'Disabled'}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <SectionCard title="Blocked Users" icon={<UserX className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-1.5">
            {BLOCKED_USERS.map((u, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <div><div className="text-[9px] font-bold">{u.name}</div><div className="text-[7px] text-muted-foreground">{u.reason} · {u.date}</div></div>
                <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-md">Unblock</Button>
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Reports & Moderation" icon={<Flag className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-1.5">
            {REPORTS.map((r, i) => (
              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <div><div className="text-[9px] font-bold">{r.content}</div><div className="text-[7px] text-muted-foreground">{r.reason} · {r.date}</div></div>
                <StatusBadge status={r.status === 'resolved' ? 'healthy' : 'pending'} label={r.status} />
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
