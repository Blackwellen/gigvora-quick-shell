import React from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings, User, Bell, Calendar, DollarSign,
  Eye, Shield, Save, Trash2, Globe,
} from 'lucide-react';
import { toast } from 'sonner';

export default function ProSettingsPage() {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-accent" /> Settings</h1>
        <p className="text-[11px] text-muted-foreground">Professional account, availability, and operational preferences</p>
      </div>

      {/* Account */}
      <SectionCard title="Account" icon={<User className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-3">
          {[
            { label: 'Display Name', desc: 'Your professional display name', value: 'Alex Thompson' },
            { label: 'Professional Title', desc: 'Shown on your profile and listings', value: 'Senior UI/UX Designer' },
            { label: 'Email', desc: 'Primary contact email', value: 'alex@studio.com' },
          ].map(f => (
            <div key={f.label} className="flex items-center justify-between">
              <div><div className="text-[10px] font-medium">{f.label}</div><div className="text-[8px] text-muted-foreground">{f.desc}</div></div>
              <Input defaultValue={f.value} className="w-52 h-8 rounded-xl text-[10px]" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Availability */}
      <SectionCard title="Availability" icon={<Calendar className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          {[
            { label: 'Available for new work', desc: 'Show availability badge on your profile', on: true },
            { label: 'Accept booking requests', desc: 'Allow clients to book sessions', on: true },
            { label: 'Open to project invites', desc: 'Receive project invitations', on: true },
            { label: 'Open to job opportunities', desc: 'Appear in recruiter searches', on: false },
          ].map(s => (
            <div key={s.label} className="flex items-center justify-between py-1.5">
              <div><div className="text-[10px] font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
              <Switch defaultChecked={s.on} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Payout */}
      <SectionCard title="Payout Preferences" icon={<DollarSign className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-medium">Payout Method</div><div className="text-[8px] text-muted-foreground">How you receive earnings</div></div>
            <Select defaultValue="bank"><SelectTrigger className="w-40 h-8 rounded-xl text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>{['Bank Transfer', 'PayPal', 'Wise'].map(m => <SelectItem key={m} value={m.toLowerCase().replace(' ', '_')} className="text-[10px]">{m}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-medium">Payout Schedule</div><div className="text-[8px] text-muted-foreground">How often payouts are processed</div></div>
            <Select defaultValue="biweekly"><SelectTrigger className="w-36 h-8 rounded-xl text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>{['Weekly', 'Bi-weekly', 'Monthly'].map(s => <SelectItem key={s} value={s.toLowerCase().replace('-', '')} className="text-[10px]">{s}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-medium">Minimum Payout</div><div className="text-[8px] text-muted-foreground">Minimum balance before payout</div></div>
            <Select defaultValue="50"><SelectTrigger className="w-28 h-8 rounded-xl text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>{['$25', '$50', '$100', '$250'].map(v => <SelectItem key={v} value={v.replace('$', '')} className="text-[10px]">{v}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications" icon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          {[
            { label: 'New order alerts', desc: 'Immediate notification on new orders', on: true },
            { label: 'Booking requests', desc: 'When clients request a booking', on: true },
            { label: 'Client messages', desc: 'New messages from clients', on: true },
            { label: 'Project invites', desc: 'New project invitations', on: true },
            { label: 'Performance updates', desc: 'Weekly performance summary', on: false },
            { label: 'Promotional tips', desc: 'Tips to improve your listings', on: false },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-1.5">
              <div><div className="text-[10px] font-medium">{n.label}</div><div className="text-[8px] text-muted-foreground">{n.desc}</div></div>
              <Switch defaultChecked={n.on} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Privacy */}
      <SectionCard title="Privacy & Visibility" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          {[
            { label: 'Profile visibility', desc: 'Show your professional profile publicly', on: true },
            { label: 'Show earnings badges', desc: 'Display earnings milestones on profile', on: false },
            { label: 'Show online status', desc: 'Let clients see when you are active', on: true },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between py-1.5">
              <div><div className="text-[10px] font-medium">{p.label}</div><div className="text-[8px] text-muted-foreground">{p.desc}</div></div>
              <Switch defaultChecked={p.on} />
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="flex items-center justify-between pt-2">
        <Button onClick={() => toast.success('Settings saved')} className="h-8 text-[10px] rounded-xl gap-1"><Save className="h-3.5 w-3.5" />Save Changes</Button>
        <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1 text-destructive"><Trash2 className="h-3 w-3" />Delete Account</Button>
      </div>
    </div>
  );
}
