import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Eye, Shield, Bell, Globe, Trash2 } from 'lucide-react';

export default function LaunchpadSettingsPage() {
  return (
    <LaunchpadShell>
      <div className="mb-4"><h1 className="text-lg font-bold">Launchpad Settings</h1><p className="text-[11px] text-muted-foreground">Manage your preferences and privacy</p></div>
      <div className="space-y-3 max-w-2xl">
        <SectionCard title="Profile Visibility" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            {[
              { label: 'Show profile to employers', desc: 'Let partner companies view your portfolio and readiness score', default: true },
              { label: 'Show badges publicly', desc: 'Display earned badges on your public profile', default: true },
              { label: 'Allow mentor recommendations', desc: 'Let mentors write visible endorsements', default: true },
              { label: 'Show activity in community', desc: 'Your posts and achievements visible to community members', default: false },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between py-1">
                <div><div className="text-[10px] font-medium">{s.label}</div><div className="text-[8px] text-muted-foreground">{s.desc}</div></div>
                <Switch defaultChecked={s.default} />
              </div>
            ))}
          </div>
        </SectionCard>

        <SectionCard title="Eligibility" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {[{ label: 'Current Status', value: 'Active' }, { label: 'Pathway', value: 'Early Career — Frontend Dev' }, { label: 'Enrolled Since', value: 'Feb 12, 2026' }, { label: 'Eligibility Tier', value: 'Standard (Free)' }].map(f => (
              <div key={f.label} className="flex justify-between text-[9px]">
                <span className="text-muted-foreground">{f.label}</span>
                <span className="font-semibold">{f.value}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" className="h-7 text-[9px] rounded-xl mt-3 gap-0.5 w-full">Upgrade to Pro Launchpad</Button>
        </SectionCard>

        <SectionCard title="Notifications" icon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          {[
            { label: 'New opportunity matches', default: true },
            { label: 'Mentor session reminders', default: true },
            { label: 'Badge earned notifications', default: true },
            { label: 'Community mentions', default: false },
            { label: 'Weekly progress digest', default: true },
          ].map(n => (
            <div key={n.label} className="flex items-center justify-between py-1.5">
              <span className="text-[10px]">{n.label}</span>
              <Switch defaultChecked={n.default} />
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Data & Privacy" className="!rounded-2xl">
          <div className="space-y-2">
            <Button variant="outline" className="h-7 text-[9px] rounded-xl gap-0.5 w-full"><Globe className="h-3 w-3" />Download My Data</Button>
            <Button variant="outline" className="h-7 text-[9px] rounded-xl gap-0.5 w-full text-destructive border-destructive/30"><Trash2 className="h-3 w-3" />Delete Launchpad Account</Button>
          </div>
        </SectionCard>

        <div className="text-center py-2">
          <Button size="sm" className="h-8 text-[10px] rounded-xl px-8">Save Changes</Button>
        </div>
      </div>
    </LaunchpadShell>
  );
}
