import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Settings, Shield, Bell, Eye, Users, Lock, Globe, Building2,
  Mail, Save, UserPlus, FileText, CreditCard,
} from 'lucide-react';

const EnterpriseConnectSettingsPage: React.FC = () => {
  const [notifs, setNotifs] = useState({ signals: true, intros: true, weekly: true, events: true, procurement: false });
  const [privacy, setPrivacy] = useState({ directoryVisible: true, showProcurement: true, allowIntros: true, showActivity: false });
  const [membership, setMembership] = useState({ autoApprove: false, requireVerification: true, inviteOnly: true });

  const topStrip = (
    <>
      <Settings className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Enterprise Connect — Settings & Membership</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Save className="h-3 w-3" />Save Changes</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Membership" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><Badge className="bg-accent/10 text-accent text-[7px] border-0 rounded-lg">Enterprise</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Members</span><span className="font-semibold">24</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seat Limit</span><span className="font-semibold">50</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Renewal</span><span className="font-semibold">Jun 1, 2026</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-1.5">
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Users className="h-3 w-3" />Manage Members</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><CreditCard className="h-3 w-3" />Billing</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Shield className="h-3 w-3" />Security Log</Button>
        </div>
      </SectionCard>
    </div>
  );

  const Row = ({ icon: Icon, label, desc, children }: { icon: React.ElementType; label: string; desc: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
      <div className="flex-1 min-w-0"><div className="text-[11px] font-semibold">{label}</div><div className="text-[9px] text-muted-foreground">{desc}</div></div>
      {children}
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <div className="space-y-4">
        <SectionCard title="Notifications" icon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Bell} label="Signal Alerts" desc="Get notified when tracked accounts emit signals"><Switch checked={notifs.signals} onCheckedChange={v => setNotifs(p => ({ ...p, signals: v }))} /></Row>
          <Row icon={UserPlus} label="Intro Requests" desc="Notifications for incoming intro requests"><Switch checked={notifs.intros} onCheckedChange={v => setNotifs(p => ({ ...p, intros: v }))} /></Row>
          <Row icon={Mail} label="Weekly Digest" desc="Weekly summary of Enterprise Connect activity"><Switch checked={notifs.weekly} onCheckedChange={v => setNotifs(p => ({ ...p, weekly: v }))} /></Row>
          <Row icon={Globe} label="Event Updates" desc="Notifications about enterprise events and rooms"><Switch checked={notifs.events} onCheckedChange={v => setNotifs(p => ({ ...p, events: v }))} /></Row>
          <Row icon={FileText} label="Procurement Alerts" desc="RFP and procurement opportunity notifications"><Switch checked={notifs.procurement} onCheckedChange={v => setNotifs(p => ({ ...p, procurement: v }))} /></Row>
        </SectionCard>

        <SectionCard title="Privacy & Visibility" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Building2} label="Directory Listing" desc="Show your organization in the Enterprise Directory"><Switch checked={privacy.directoryVisible} onCheckedChange={v => setPrivacy(p => ({ ...p, directoryVisible: v }))} /></Row>
          <Row icon={FileText} label="Procurement Profile" desc="Display procurement readiness and certifications"><Switch checked={privacy.showProcurement} onCheckedChange={v => setPrivacy(p => ({ ...p, showProcurement: v }))} /></Row>
          <Row icon={UserPlus} label="Accept Intros" desc="Allow other enterprises to request introductions"><Switch checked={privacy.allowIntros} onCheckedChange={v => setPrivacy(p => ({ ...p, allowIntros: v }))} /></Row>
          <Row icon={Eye} label="Activity Status" desc="Show when your team was last active"><Switch checked={privacy.showActivity} onCheckedChange={v => setPrivacy(p => ({ ...p, showActivity: v }))} /></Row>
        </SectionCard>

        <SectionCard title="Membership Controls" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Lock} label="Invite Only" desc="New members require an invitation from existing members"><Switch checked={membership.inviteOnly} onCheckedChange={v => setMembership(p => ({ ...p, inviteOnly: v }))} /></Row>
          <Row icon={Shield} label="Require Verification" desc="Members must verify their enterprise email domain"><Switch checked={membership.requireVerification} onCheckedChange={v => setMembership(p => ({ ...p, requireVerification: v }))} /></Row>
          <Row icon={UserPlus} label="Auto-Approve" desc="Automatically approve verified domain members"><Switch checked={membership.autoApprove} onCheckedChange={v => setMembership(p => ({ ...p, autoApprove: v }))} /></Row>
        </SectionCard>

        <SectionCard title="Member Roles" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {[
              { role: 'Owner', perms: ['Full access', 'Billing', 'Settings', 'Member management'] },
              { role: 'Admin', perms: ['Directory', 'Intros', 'Events', 'Member management'] },
              { role: 'Member', perms: ['Directory', 'Intros', 'Events', 'Signals'] },
              { role: 'Observer', perms: ['Directory (read)', 'Signals (read)'] },
            ].map(r => (
              <div key={r.role} className="rounded-xl bg-muted/30 p-2.5">
                <div className="text-[10px] font-semibold mb-1">{r.role}</div>
                <div className="flex flex-wrap gap-1">
                  {r.perms.map(p => <Badge key={p} variant="outline" className="text-[7px] h-3.5 rounded-lg">{p}</Badge>)}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
};

export default EnterpriseConnectSettingsPage;
