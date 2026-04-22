import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Settings, Mic, MicOff, Video, Users, MessageSquare,
  Hand, Shield, AlertTriangle, Volume2, Monitor, Radio,
  Play, Pause, SkipForward,
} from 'lucide-react';

const EventHostControlsPage: React.FC = () => {
  const topStrip = (
    <>
      <Settings className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Host Controls — Tech Leaders Summit 2026</span>
      <div className="flex-1" />
      <Badge className="bg-destructive/10 text-destructive text-[9px] border-0 rounded-lg gap-1 animate-pulse"><div className="h-1.5 w-1.5 rounded-full bg-destructive" />LIVE</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Quick Stats" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Attendees</span><span className="font-semibold">187</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Peak</span><span className="font-semibold">203</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Chat messages</span><span className="font-semibold">342</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Hands raised</span><span className="font-semibold">5</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold">01:23:45</span></div>
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
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <div className="space-y-3">
        <SectionCard title="Stream Controls" icon={<Radio className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="flex gap-2 mb-3">
            <Button variant="destructive" size="sm" className="h-8 text-[10px] rounded-xl gap-1 flex-1"><Pause className="h-3 w-3" />Pause Stream</Button>
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1 flex-1"><SkipForward className="h-3 w-3" />Next Segment</Button>
          </div>
          <Row icon={Monitor} label="Screen Share" desc="Allow presenters to share screen"><Switch defaultChecked /></Row>
          <Row icon={Video} label="Recording" desc="Record this session for replay"><Switch defaultChecked /></Row>
        </SectionCard>

        <SectionCard title="Audience Controls" icon={<Users className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Mic} label="Mute All" desc="Mute all attendee microphones"><Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg px-2"><MicOff className="h-2.5 w-2.5 mr-0.5" />Mute All</Button></Row>
          <Row icon={MessageSquare} label="Chat" desc="Enable live chat for attendees"><Switch defaultChecked /></Row>
          <Row icon={Hand} label="Hand Raise" desc="Allow attendees to raise hands"><Switch defaultChecked /></Row>
          <Row icon={Volume2} label="Q&A" desc="Enable Q&A panel"><Switch defaultChecked /></Row>
        </SectionCard>

        <SectionCard title="Moderation" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <Row icon={Shield} label="Auto-Moderate Chat" desc="Filter inappropriate messages"><Switch defaultChecked /></Row>
          <Row icon={AlertTriangle} label="Slow Mode" desc="Limit chat to 1 message per 10s"><Switch /></Row>
          <Row icon={Users} label="Lock Room" desc="Prevent new attendees from joining"><Switch /></Row>
        </SectionCard>

        <SectionCard title="Raised Hands (5)" icon={<Hand className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-1.5">
            {['Sarah Chen', 'Marcus Johnson', 'Priya Patel', 'Tom Wright', 'Lisa Park'].map((n, i) => (
              <div key={n} className="flex items-center gap-2 text-[9px]">
                <Hand className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />
                <span className="flex-1 font-medium">{n}</span>
                <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-md px-1.5"><Mic className="h-2 w-2 mr-0.5" />Unmute</Button>
                <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-md px-1.5">Dismiss</Button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
};

export default EventHostControlsPage;
