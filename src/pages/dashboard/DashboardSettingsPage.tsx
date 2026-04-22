import React from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Settings, User, Bell, Shield, Eye, CreditCard,
  Calendar, Globe, Save, Trash2, LogOut, Link2,
} from 'lucide-react';
import { toast } from 'sonner';

const DashboardSettingsPage: React.FC = () => {
  return (
    <div className="space-y-4 max-w-3xl">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-accent" /> Settings</h1>
        <p className="text-[11px] text-muted-foreground">Manage your account, privacy, and notification preferences</p>
      </div>

      {/* Account */}
      <SectionCard title="Account" icon={<User className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-medium">Display Name</div><div className="text-[8px] text-muted-foreground">How others see you on Gigvora</div></div>
            <Input defaultValue="Alex Thompson" className="w-48 h-8 rounded-xl text-[10px]" />
          </div>
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-medium">Email</div><div className="text-[8px] text-muted-foreground">Primary contact email</div></div>
            <Input defaultValue="alex@example.com" className="w-48 h-8 rounded-xl text-[10px]" />
          </div>
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-medium">Language</div><div className="text-[8px] text-muted-foreground">Interface language</div></div>
            <Select defaultValue="en">
              <SelectTrigger className="w-36 h-8 rounded-xl text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>{['English', 'Spanish', 'French', 'German'].map(l => <SelectItem key={l} value={l.toLowerCase().slice(0, 2)} className="text-[10px]">{l}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div><div className="text-[10px] font-medium">Timezone</div><div className="text-[8px] text-muted-foreground">Used for bookings and scheduling</div></div>
            <Select defaultValue="utc">
              <SelectTrigger className="w-48 h-8 rounded-xl text-[10px]"><SelectValue /></SelectTrigger>
              <SelectContent>{['UTC', 'EST (UTC-5)', 'PST (UTC-8)', 'GMT (UTC+0)', 'CET (UTC+1)'].map(t => <SelectItem key={t} value={t.toLowerCase().split(' ')[0]} className="text-[10px]">{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      {/* Notifications */}
      <SectionCard title="Notifications" icon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          {[
            { label: 'Order updates', desc: 'Notifications about order status changes', on: true },
            { label: 'Booking reminders', desc: 'Reminders before scheduled sessions', on: true },
            { label: 'Application updates', desc: 'Status changes for your applications', on: true },
            { label: 'Messages', desc: 'New messages from connections and sellers', on: true },
            { label: 'Marketing emails', desc: 'Promotional content and recommendations', on: false },
            { label: 'Weekly digest', desc: 'Weekly summary of your activity', on: false },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-1.5">
              <div><div className="text-[10px] font-medium">{n.label}</div><div className="text-[8px] text-muted-foreground">{n.desc}</div></div>
              <Switch defaultChecked={n.on} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Privacy */}
      <SectionCard title="Privacy" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          {[
            { label: 'Profile visibility', desc: 'Who can see your profile', on: true },
            { label: 'Show online status', desc: 'Let others see when you are active', on: false },
            { label: 'Activity visibility', desc: 'Show activity to connections', on: true },
            { label: 'Search engine indexing', desc: 'Allow search engines to find your profile', on: true },
          ].map(p => (
            <div key={p.label} className="flex items-center justify-between py-1.5">
              <div><div className="text-[10px] font-medium">{p.label}</div><div className="text-[8px] text-muted-foreground">{p.desc}</div></div>
              <Switch defaultChecked={p.on} />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Connected Apps */}
      <SectionCard title="Connected Apps" icon={<Link2 className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { app: 'Google Calendar', status: 'Connected', connected: true },
            { app: 'LinkedIn', status: 'Not connected', connected: false },
            { app: 'Slack', status: 'Not connected', connected: false },
          ].map(a => (
            <div key={a.app} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
              <div className="text-[10px] font-medium">{a.app}</div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] text-muted-foreground">{a.status}</span>
                <Button variant={a.connected ? 'outline' : 'default'} size="sm" className="h-6 text-[8px] rounded-lg">{a.connected ? 'Disconnect' : 'Connect'}</Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2">
        <Button onClick={() => toast.success('Settings saved')} className="h-8 text-[10px] rounded-xl gap-1"><Save className="h-3.5 w-3.5" />Save Changes</Button>
        <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1 text-destructive"><Trash2 className="h-3 w-3" />Delete Account</Button>
      </div>
    </div>
  );
};

export default DashboardSettingsPage;
