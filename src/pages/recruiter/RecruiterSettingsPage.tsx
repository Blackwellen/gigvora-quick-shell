import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Settings, Bell, Eye, Shield, Search, Mail, Calendar,
  Save, Users, Lock, Globe, Briefcase, Clock,
} from 'lucide-react';

const RecruiterSettingsPage: React.FC = () => {
  const [notifs, setNotifs] = useState({ newCandidates: true, pipelineUpdates: true, interviewReminders: true, weeklyDigest: true, teamActivity: false });
  const [privacy, setPrivacy] = useState({ showProfile: true, allowMessages: true, shareActivity: false, publicPipeline: false });
  const [search, setSearch] = useState({ defaultRadius: '50mi', autoSave: true, deduplication: true, excludeContacted: true });

  const topStrip = (
    <>
      <Settings className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Recruiter Pro — Settings</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Save className="h-3 w-3" />Save Changes</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Account" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><Badge className="bg-accent/10 text-accent text-[7px] border-0 rounded-lg">Pro</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-semibold">Admin</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Team</span><span className="font-semibold">4 members</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-1.5">
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Users className="h-3 w-3" />Seat Management</Button>
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
          <Row icon={Search} label="New Candidate Matches" desc="Get notified when new candidates match your saved searches"><Switch checked={notifs.newCandidates} onCheckedChange={v => setNotifs(p => ({ ...p, newCandidates: v }))} /></Row>
          <Row icon={Briefcase} label="Pipeline Updates" desc="Notifications when candidates move through pipeline stages"><Switch checked={notifs.pipelineUpdates} onCheckedChange={v => setNotifs(p => ({ ...p, pipelineUpdates: v }))} /></Row>
          <Row icon={Calendar} label="Interview Reminders" desc="Reminders before scheduled interviews"><Switch checked={notifs.interviewReminders} onCheckedChange={v => setNotifs(p => ({ ...p, interviewReminders: v }))} /></Row>
          <Row icon={Mail} label="Weekly Digest" desc="Weekly summary of recruiting activity and metrics"><Switch checked={notifs.weeklyDigest} onCheckedChange={v => setNotifs(p => ({ ...p, weeklyDigest: v }))} /></Row>
          <Row icon={Users} label="Team Activity" desc="Notifications about team member actions"><Switch checked={notifs.teamActivity} onCheckedChange={v => setNotifs(p => ({ ...p, teamActivity: v }))} /></Row>
        </SectionCard>

        <SectionCard title="Privacy & Visibility" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Globe} label="Recruiter Profile" desc="Show your recruiter profile to candidates"><Switch checked={privacy.showProfile} onCheckedChange={v => setPrivacy(p => ({ ...p, showProfile: v }))} /></Row>
          <Row icon={Mail} label="Accept Messages" desc="Allow candidates to message you directly"><Switch checked={privacy.allowMessages} onCheckedChange={v => setPrivacy(p => ({ ...p, allowMessages: v }))} /></Row>
          <Row icon={Eye} label="Activity Status" desc="Show when you were last active"><Switch checked={privacy.shareActivity} onCheckedChange={v => setPrivacy(p => ({ ...p, shareActivity: v }))} /></Row>
          <Row icon={Lock} label="Public Pipeline" desc="Share pipeline stats with hiring managers"><Switch checked={privacy.publicPipeline} onCheckedChange={v => setPrivacy(p => ({ ...p, publicPipeline: v }))} /></Row>
        </SectionCard>

        <SectionCard title="Search Defaults" icon={<Search className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Globe} label="Default Radius" desc="Default geographic search radius">{/* Placeholder for select */}<Badge variant="outline" className="text-[9px] rounded-lg">{search.defaultRadius}</Badge></Row>
          <Row icon={Save} label="Auto-Save Searches" desc="Automatically save your search queries"><Switch checked={search.autoSave} onCheckedChange={v => setSearch(p => ({ ...p, autoSave: v }))} /></Row>
          <Row icon={Users} label="Deduplication" desc="Remove duplicate candidates from results"><Switch checked={search.deduplication} onCheckedChange={v => setSearch(p => ({ ...p, deduplication: v }))} /></Row>
          <Row icon={Clock} label="Exclude Contacted" desc="Hide candidates you've already reached out to"><Switch checked={search.excludeContacted} onCheckedChange={v => setSearch(p => ({ ...p, excludeContacted: v }))} /></Row>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
};

export default RecruiterSettingsPage;
