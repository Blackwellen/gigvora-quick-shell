import React, { useState } from 'react';
import { HireShell } from '@/components/shell/HireShell';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Settings, Shield, Bell, Mail, Globe,
  FileText, Calendar, Briefcase, ChevronRight, Lock,
} from 'lucide-react';

const NOTIFICATION_SETTINGS = [
  { id: 'new-applicant', label: 'New applicant received', enabled: true },
  { id: 'scorecard-submitted', label: 'Scorecard submitted by team', enabled: true },
  { id: 'interview-reminder', label: 'Interview reminder (1h before)', enabled: true },
  { id: 'offer-accepted', label: 'Offer accepted/declined', enabled: true },
  { id: 'role-aging', label: 'Role aging warning (>21 days)', enabled: false },
  { id: 'candidate-withdrawal', label: 'Candidate withdrew application', enabled: true },
  { id: 'team-mention', label: '@mention in hiring team notes', enabled: true },
  { id: 'pipeline-movement', label: 'Stage change in pipeline', enabled: false },
];

const INTEGRATIONS = [
  { id: 'cal', name: 'Google Calendar', icon: Calendar, connected: true, desc: 'Interview scheduling sync' },
  { id: 'slack', name: 'Slack', icon: Mail, desc: 'Team notifications & approvals', connected: false },
  { id: 'linkedin', name: 'LinkedIn', icon: Globe, desc: 'Talent sourcing & job posting', connected: true },
  { id: 'greenhouse', name: 'Greenhouse', icon: Briefcase, desc: 'ATS data sync', connected: false },
];

export default function HireSettingsPage() {
  const [tab, setTab] = useState<'general' | 'notifications' | 'integrations' | 'templates'>('general');
  const [notifications, setNotifications] = useState(NOTIFICATION_SETTINGS);

  const toggleNotification = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, enabled: !n.enabled } : n));
  };

  return (
    <HireShell>
      <SectionBackNav homeRoute="/hire" homeLabel="Recruitment" currentLabel="Settings" icon={<Shield className="h-3 w-3" />} />

      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Settings className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold">Recruiter Settings</h1>
      </div>

      <Tabs value={tab} onValueChange={v => setTab(v as any)} className="mb-4">
        <TabsList className="h-7">
          <TabsTrigger value="general" className="text-[10px] h-5 px-2">General</TabsTrigger>
          <TabsTrigger value="notifications" className="text-[10px] h-5 px-2">Notifications</TabsTrigger>
          <TabsTrigger value="integrations" className="text-[10px] h-5 px-2">Integrations</TabsTrigger>
          <TabsTrigger value="templates" className="text-[10px] h-5 px-2">Templates</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'general' && (
        <div className="space-y-3">
          <SectionCard title="Workspace Preferences" className="!rounded-xl">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div><div className="text-[10px] font-semibold">Default Pipeline View</div><div className="text-[9px] text-muted-foreground">Board vs Table layout preference</div></div>
                <Badge variant="outline" className="text-[8px]">Board</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-[10px] font-semibold">Auto-archive after hire</div><div className="text-[9px] text-muted-foreground">Move rejected candidates to archive after 30 days</div></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-[10px] font-semibold">Candidate de-duplication</div><div className="text-[9px] text-muted-foreground">Warn when duplicate candidates detected</div></div>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <div><div className="text-[10px] font-semibold">GDPR Compliance Mode</div><div className="text-[9px] text-muted-foreground">Auto-delete candidate data after retention period</div></div>
                <Switch />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Interview Defaults" className="!rounded-xl">
            <div className="space-y-3">
              <div>
                <div className="text-[10px] font-semibold mb-1">Default Interview Duration</div>
                <Input defaultValue="45 minutes" className="h-8 text-xs" />
              </div>
              <div>
                <div className="text-[10px] font-semibold mb-1">Default Meeting Platform</div>
                <Input defaultValue="Google Meet" className="h-8 text-xs" />
              </div>
              <div>
                <div className="text-[10px] font-semibold mb-1">Reminder Lead Time</div>
                <Input defaultValue="1 hour" className="h-8 text-xs" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Team Permissions" className="!rounded-xl" icon={<Lock className="h-3 w-3 text-muted-foreground" />}>
            <div className="space-y-2">
              {['Interviewers can view all candidates', 'Coordinators can reschedule interviews', 'Sourcers can edit talent pools', 'Only managers can send offers'].map((perm, i) => (
                <div key={i} className="flex items-center justify-between py-1">
                  <span className="text-[10px]">{perm}</span>
                  <Switch defaultChecked={i < 3} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'notifications' && (
        <SectionCard title="Notification Preferences" className="!rounded-xl" icon={<Bell className="h-3 w-3 text-muted-foreground" />}>
          <div className="space-y-2">
            {notifications.map(n => (
              <div key={n.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                <span className="text-[10px]">{n.label}</span>
                <Switch checked={n.enabled} onCheckedChange={() => toggleNotification(n.id)} />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'integrations' && (
        <div className="space-y-2">
          {INTEGRATIONS.map(int => (
            <SectionCard key={int.id} className="!rounded-xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                  <int.icon className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold">{int.name}</span>
                    {int.connected ? (
                      <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0">Connected</Badge>
                    ) : (
                      <Badge variant="outline" className="text-[7px] h-3.5">Not Connected</Badge>
                    )}
                  </div>
                  <div className="text-[9px] text-muted-foreground">{int.desc}</div>
                </div>
                <Button variant={int.connected ? 'outline' : 'default'} size="sm" className="h-7 text-[9px] rounded-xl">
                  {int.connected ? 'Configure' : 'Connect'}
                </Button>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'templates' && (
        <div className="space-y-3">
          <SectionCard title="Email Templates" className="!rounded-xl">
            <div className="space-y-1.5">
              {['Interview Invitation', 'Offer Letter', 'Rejection (Post-Interview)', 'Rejection (Application)', 'Follow-up Reminder'].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/30 hover:bg-accent/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Mail className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium">{t}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Scorecard Templates" className="!rounded-xl">
            <div className="space-y-1.5">
              {['Technical Interview', 'Culture Fit', 'Leadership Assessment', 'Phone Screen'].map((t, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-lg border border-border/30 hover:bg-accent/5 transition-all cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[10px] font-medium">{t}</span>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}
    </HireShell>
  );
}
