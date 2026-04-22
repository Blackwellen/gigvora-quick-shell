import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings, Lock, Users, Globe, Bell, Shield, Eye, Clock, CreditCard } from 'lucide-react';

export default function WebinarSettingsPage() {
  const topStrip = (
    <>
      <Settings className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Webinar Settings & Access Rules</span>
      <div className="flex-1" />
    </>
  );

  const Row = ({ icon: Icon, label, desc, children }: { icon: React.ElementType; label: string; desc: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
      <div className="flex-1 min-w-0"><div className="text-[11px] font-semibold">{label}</div><div className="text-[9px] text-muted-foreground">{desc}</div></div>
      {children}
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <div className="space-y-3">
        <SectionCard title="Access Control" icon={<Lock className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Globe} label="Visibility" desc="Who can discover this webinar"><Badge variant="outline" className="text-[9px]">Public</Badge></Row>
          <Row icon={Lock} label="Registration Required" desc="Require registration to attend"><Switch defaultChecked /></Row>
          <Row icon={Users} label="Capacity Limit" desc="Maximum number of attendees"><Badge variant="outline" className="text-[9px]">500</Badge></Row>
          <Row icon={Shield} label="Approval Required" desc="Manually approve registrations"><Switch /></Row>
          <Row icon={Eye} label="Replay Access" desc="Who can view the replay"><Badge variant="outline" className="text-[9px]">Registered Only</Badge></Row>
          <Row icon={Clock} label="Replay Expiry" desc="How long replay is available"><Badge variant="outline" className="text-[9px]">30 days</Badge></Row>
        </SectionCard>

        <SectionCard title="Monetization" icon={<CreditCard className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={CreditCard} label="Paid Tickets" desc="Enable paid ticket tiers"><Switch defaultChecked /></Row>
          <Row icon={CreditCard} label="Donations" desc="Allow viewer donations during webinar"><Switch defaultChecked /></Row>
          <Row icon={CreditCard} label="Replay Sales" desc="Sell replay access separately"><Switch /></Row>
        </SectionCard>

        <SectionCard title="Notifications" icon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Bell} label="Registration Confirmation" desc="Email attendees upon registration"><Switch defaultChecked /></Row>
          <Row icon={Bell} label="Reminder (24h)" desc="Send reminder 24 hours before"><Switch defaultChecked /></Row>
          <Row icon={Bell} label="Reminder (1h)" desc="Send reminder 1 hour before"><Switch defaultChecked /></Row>
          <Row icon={Bell} label="Replay Available" desc="Notify when replay is published"><Switch defaultChecked /></Row>
          <Row icon={Bell} label="Follow-up Email" desc="Send follow-up after webinar"><Switch /></Row>
        </SectionCard>

        <SectionCard title="Interaction" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Users} label="Live Chat" desc="Enable chat during webinar"><Switch defaultChecked /></Row>
          <Row icon={Users} label="Q&A Panel" desc="Enable Q&A submissions"><Switch defaultChecked /></Row>
          <Row icon={Users} label="Polls" desc="Allow host to create live polls"><Switch defaultChecked /></Row>
          <Row icon={Users} label="Hand Raise" desc="Allow attendees to raise hand"><Switch defaultChecked /></Row>
          <Row icon={Shield} label="Chat Moderation" desc="Auto-filter inappropriate messages"><Switch defaultChecked /></Row>
        </SectionCard>

        <div className="flex gap-2">
          <Button className="h-8 text-[10px] rounded-xl">Save Settings</Button>
          <Button variant="outline" className="h-8 text-[10px] rounded-xl">Cancel</Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
