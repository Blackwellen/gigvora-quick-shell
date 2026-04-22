import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Settings, Shield, Bell, Eye, Users, Lock, Globe, Zap,
  Mail, MapPin, Building2, Filter, Clock, Save,
} from 'lucide-react';

const NavigatorSettingsPage: React.FC = () => {
  const [notifications, setNotifications] = useState({ signals: true, leads: true, weekly: true, mentions: false, teamActivity: true });
  const [privacy, setPrivacy] = useState({ profileVisible: true, showActivity: false, searchAppearance: true });
  const [search, setSearch] = useState({ defaultRegion: 'global', defaultIndustry: 'all', resultsPerPage: '25', autoSave: true });

  const topStrip = (
    <>
      <Settings className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Navigator — Settings & Permissions</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Save className="h-3 w-3" />Save Changes</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Account" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><Badge className="bg-accent/10 text-accent text-[7px] border-0 rounded-lg">Team Pro</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Role</span><span className="font-semibold">Admin</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span className="font-semibold">4 / 10</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Renewal</span><span className="font-semibold">May 1</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-1.5">
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Users className="h-3 w-3" />Manage Seats</Button>
          <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1 justify-start"><Shield className="h-3 w-3" />Security Log</Button>
        </div>
      </SectionCard>
    </div>
  );

  const SettingRow = ({ icon: Icon, label, description, children }: { icon: React.ElementType; label: string; description: string; children: React.ReactNode }) => (
    <div className="flex items-center gap-3 py-2.5 border-b last:border-0">
      <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center shrink-0"><Icon className="h-3.5 w-3.5 text-muted-foreground" /></div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-semibold">{label}</div>
        <div className="text-[9px] text-muted-foreground">{description}</div>
      </div>
      {children}
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <div className="space-y-4">
        {/* Notifications */}
        <SectionCard title="Notifications" icon={<Bell className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <SettingRow icon={Zap} label="Signal Alerts" description="Get notified when new buying or hiring signals appear">
            <Switch checked={notifications.signals} onCheckedChange={v => setNotifications(p => ({ ...p, signals: v }))} />
          </SettingRow>
          <SettingRow icon={Users} label="Lead Activity" description="Notifications for lead state changes">
            <Switch checked={notifications.leads} onCheckedChange={v => setNotifications(p => ({ ...p, leads: v }))} />
          </SettingRow>
          <SettingRow icon={Mail} label="Weekly Digest" description="Receive a weekly summary of Navigator activity">
            <Switch checked={notifications.weekly} onCheckedChange={v => setNotifications(p => ({ ...p, weekly: v }))} />
          </SettingRow>
          <SettingRow icon={Users} label="Team Activity" description="Get updates on team member actions">
            <Switch checked={notifications.teamActivity} onCheckedChange={v => setNotifications(p => ({ ...p, teamActivity: v }))} />
          </SettingRow>
        </SectionCard>

        {/* Privacy */}
        <SectionCard title="Privacy & Visibility" icon={<Eye className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <SettingRow icon={Eye} label="Profile Visible to Leads" description="Allow prospects to see your Navigator profile">
            <Switch checked={privacy.profileVisible} onCheckedChange={v => setPrivacy(p => ({ ...p, profileVisible: v }))} />
          </SettingRow>
          <SettingRow icon={Clock} label="Show Activity Status" description="Display when you were last active">
            <Switch checked={privacy.showActivity} onCheckedChange={v => setPrivacy(p => ({ ...p, showActivity: v }))} />
          </SettingRow>
          <SettingRow icon={Globe} label="Appear in Searches" description="Allow your profile to appear in Navigator searches">
            <Switch checked={privacy.searchAppearance} onCheckedChange={v => setPrivacy(p => ({ ...p, searchAppearance: v }))} />
          </SettingRow>
        </SectionCard>

        {/* Search Defaults */}
        <SectionCard title="Search Defaults" icon={<Filter className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <SettingRow icon={Globe} label="Default Region" description="Set your default geographic scope">
            <select className="h-7 rounded-xl border bg-muted/30 px-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent" value={search.defaultRegion} onChange={e => setSearch(p => ({ ...p, defaultRegion: e.target.value }))}>
              <option value="global">Global</option>
              <option value="north-america">North America</option>
              <option value="europe">Europe</option>
              <option value="asia-pacific">Asia Pacific</option>
            </select>
          </SettingRow>
          <SettingRow icon={Building2} label="Default Industry" description="Pre-filter results by industry">
            <select className="h-7 rounded-xl border bg-muted/30 px-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent" value={search.defaultIndustry} onChange={e => setSearch(p => ({ ...p, defaultIndustry: e.target.value }))}>
              <option value="all">All Industries</option>
              <option value="tech">Technology</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
            </select>
          </SettingRow>
          <SettingRow icon={Filter} label="Results Per Page" description="Number of results to show per search">
            <select className="h-7 rounded-xl border bg-muted/30 px-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent" value={search.resultsPerPage} onChange={e => setSearch(p => ({ ...p, resultsPerPage: e.target.value }))}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </SettingRow>
          <SettingRow icon={Save} label="Auto-Save Searches" description="Automatically save your search queries">
            <Switch checked={search.autoSave} onCheckedChange={v => setSearch(p => ({ ...p, autoSave: v }))} />
          </SettingRow>
        </SectionCard>

        {/* Permissions */}
        <SectionCard title="Team Permissions" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-2">
            {[
              { role: 'Admin', perms: ['Full access', 'Manage seats', 'Billing', 'Settings'] },
              { role: 'Sales', perms: ['Lead search', 'Outreach', 'Lists', 'Signals'] },
              { role: 'Recruiter', perms: ['Talent search', 'Outreach', 'Lists', 'Hiring signals'] },
            ].map(r => (
              <div key={r.role} className="rounded-xl bg-muted/30 p-2.5">
                <div className="text-[10px] font-semibold mb-1">{r.role}</div>
                <div className="flex flex-wrap gap-1">
                  {r.perms.map(p => (
                    <Badge key={p} variant="outline" className="text-[7px] h-3.5 rounded-lg">{p}</Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
};

export default NavigatorSettingsPage;
