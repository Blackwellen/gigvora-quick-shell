import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Users, UserPlus, MessageSquare, MapPin, Briefcase } from 'lucide-react';

const CONNECTIONS = [
  { name: 'Jordan Mitchell', role: 'Senior Designer', company: 'Spotify', location: 'New York', mutual: 12, connected: 'Jan 2026' },
  { name: 'Priya Sharma', role: 'Design Director', company: 'Figma', location: 'London', mutual: 8, connected: 'Dec 2025' },
  { name: 'Alex Rivera', role: 'Product Manager', company: 'Stripe', location: 'San Francisco', mutual: 15, connected: 'Nov 2025' },
  { name: 'Sam Kowalski', role: 'Frontend Engineer', company: 'Vercel', location: 'Remote', mutual: 6, connected: 'Oct 2025' },
  { name: 'Dana Park', role: 'UX Researcher', company: 'Google', location: 'Seattle', mutual: 9, connected: 'Sep 2025' },
];

const SUGGESTED = [
  { name: 'Lena Müller', role: 'Brand Strategist', company: 'IDEO', mutual: 4 },
  { name: 'Tom Wright', role: 'Creative Director', company: 'Pentagram', mutual: 7 },
  { name: 'Maria Santos', role: 'UX Lead', company: 'Meta', mutual: 3 },
];

export default function ProfileNetworkTab() {
  return (
    <DashboardLayout topStrip={<><Users className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Network</span><div className="flex-1" /><Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><UserPlus className="h-3 w-3" />Find People</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Connections" value="248" className="!rounded-2xl" />
        <KPICard label="Followers" value="1.2K" className="!rounded-2xl" />
        <KPICard label="Following" value="186" className="!rounded-2xl" />
        <KPICard label="Mutual" value="42" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 space-y-2.5">
          {CONNECTIONS.map((c, i) => (
            <SectionCard key={i} className="!rounded-2xl">
              <div className="flex items-center gap-3">
                <Avatar className="h-9 w-9 rounded-xl shrink-0"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[9px] font-bold">{c.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold">{c.name}</div>
                  <div className="text-[8px] text-muted-foreground flex items-center gap-2">
                    <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{c.role} at {c.company}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{c.location}</span>
                    <span>{c.mutual} mutual</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
              </div>
            </SectionCard>
          ))}
        </div>

        <SectionCard title="Suggested" className="!rounded-2xl">
          <div className="space-y-2">
            {SUGGESTED.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/20 last:border-0">
                <Avatar className="h-7 w-7 rounded-lg"><AvatarFallback className="rounded-lg bg-muted text-muted-foreground text-[7px] font-bold">{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-bold">{s.name}</div>
                  <div className="text-[7px] text-muted-foreground">{s.role} · {s.mutual} mutual</div>
                </div>
                <Button size="sm" className="h-5 text-[7px] rounded-md gap-0.5"><UserPlus className="h-2 w-2" />Connect</Button>
              </div>
            ))}
          </div>
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
