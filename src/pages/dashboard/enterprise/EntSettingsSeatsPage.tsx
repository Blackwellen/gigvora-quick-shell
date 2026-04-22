import React from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings, Users, UserPlus, Shield, Building2, Mail,
  Save, Trash2, Clock, AlertTriangle, ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';

const SEATS = [
  { name: 'Sarah Kim', role: 'Hiring Manager', dept: 'Design', status: 'active' as const, initials: 'SK' },
  { name: 'Mike Torres', role: 'Tech Lead', dept: 'Engineering', status: 'active' as const, initials: 'MT' },
  { name: 'Lisa Martinez', role: 'Campaign Owner', dept: 'Marketing', status: 'active' as const, initials: 'LM' },
  { name: 'Dave Robinson', role: 'Team Manager', dept: 'Analytics', status: 'active' as const, initials: 'DR' },
  { name: 'Emma Chen', role: 'Approver', dept: 'Finance', status: 'on-leave' as const, initials: 'EC' },
  { name: 'James Wright', role: 'Enterprise Admin', dept: 'Sales', status: 'inactive' as const, initials: 'JW' },
];

const PENDING_INVITES = [
  { email: 'rachel@company.com', role: 'Team Manager', sent: '2d ago' },
  { email: 'tom@company.com', role: 'Viewer', sent: '5d ago' },
];

export default function EntSettingsSeatsPage() {
  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-accent" /> Settings & Seats</h1>
          <p className="text-[11px] text-muted-foreground">Manage organization settings, seats, roles, and access controls</p>
        </div>
        <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1"><UserPlus className="h-3.5 w-3.5" />Invite Member</Button>
      </div>

      <KPIBand>
        <KPICard label="Total Seats" value="8" />
        <KPICard label="In Use" value="6" change="75% utilized" />
        <KPICard label="Pending Invites" value="2" />
        <KPICard label="Available" value="2" />
      </KPIBand>

      {/* Seats Table */}
      <SectionCard title="Team Members" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {SEATS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/20 last:border-0 hover:bg-muted/20 rounded-lg px-1 cursor-pointer group">
              <Avatar className="h-8 w-8"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{s.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold group-hover:text-accent transition-colors">{s.name}</div>
                <div className="text-[8px] text-muted-foreground">{s.dept} · {s.role}</div>
              </div>
              <StatusBadge status={s.status === 'active' ? 'live' : s.status === 'on-leave' ? 'caution' : 'pending'} label={s.status.replace('-', ' ')} />
              <Select defaultValue={s.role.toLowerCase().replace(' ', '_')}>
                <SelectTrigger className="w-28 h-7 rounded-xl text-[9px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['Enterprise Admin', 'Hiring Manager', 'Team Manager', 'Approver', 'Campaign Owner', 'Viewer'].map(r => (
                    <SelectItem key={r} value={r.toLowerCase().replace(' ', '_')} className="text-[9px]">{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Pending Invites */}
      <SectionCard title="Pending Invites" icon={<Mail className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2">
          {PENDING_INVITES.map((inv, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-border/20 last:border-0">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="text-[10px] font-semibold">{inv.email}</div>
                <div className="text-[8px] text-muted-foreground">{inv.role} · Sent {inv.sent}</div>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg">Resend</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg text-destructive">Revoke</Button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Org Settings */}
      <SectionCard title="Organization Settings" icon={<Building2 className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-3">
          {[
            { label: 'Organization Name', value: 'Acme Corporation' },
            { label: 'Primary Domain', value: 'acme.com' },
          ].map(f => (
            <div key={f.label} className="flex items-center justify-between">
              <div><div className="text-[10px] font-medium">{f.label}</div></div>
              <Input defaultValue={f.value} className="w-52 h-8 rounded-xl text-[10px]" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Access Controls */}
      <SectionCard title="Access & Security" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          {[
            { label: 'SSO enforcement', desc: 'Require SSO for all team members', on: false },
            { label: 'Two-factor authentication', desc: 'Enforce 2FA for all seats', on: true },
            { label: 'Approval chain required', desc: 'All spend requires at least one approver', on: true },
            { label: 'Auto-remove inactive seats', desc: 'Remove seats inactive for 30+ days', on: false },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <div><div className="text-[10px] font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
              <Switch defaultChecked={s.on} />
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center justify-between pt-2">
        <Button onClick={() => toast.success('Settings saved')} className="h-8 text-[10px] rounded-xl gap-1"><Save className="h-3.5 w-3.5" />Save Changes</Button>
      </div>
    </div>
  );
}
