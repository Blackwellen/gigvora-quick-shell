import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Activity, Eye, MessageSquare, UserPlus, Star, Clock, Filter,
  TrendingUp, ArrowUpRight, Bell, Bookmark, MoreHorizontal, Mail, Zap,
} from 'lucide-react';

type EngagementType = 'profile-view' | 'content-like' | 'connection-accept' | 'message-reply' | 'search-appearance' | 'content-share';

interface EngagementEvent {
  id: string; type: EngagementType; actor: string; actorInitials: string;
  actorRole: string; actorCompany: string; timestamp: string;
  description: string; leadState: 'warm' | 'cold' | 'contacted' | 'engaged';
  signalStrength: number; // 1-100
}

const EVENTS: EngagementEvent[] = [
  { id: 'E1', type: 'profile-view', actor: 'Sarah Chen', actorInitials: 'SC', actorRole: 'VP Engineering', actorCompany: 'Acme Corp', timestamp: '12m ago', description: 'Viewed your profile 3 times this week', leadState: 'warm', signalStrength: 88 },
  { id: 'E2', type: 'content-like', actor: 'James Park', actorInitials: 'JP', actorRole: 'CTO', actorCompany: 'NovaTech', timestamp: '1h ago', description: 'Liked your post about AI-powered recruiting', leadState: 'warm', signalStrength: 72 },
  { id: 'E3', type: 'connection-accept', actor: 'Lisa Rivera', actorInitials: 'LR', actorRole: 'Head of Talent', actorCompany: 'DataForge', timestamp: '3h ago', description: 'Accepted your connection request', leadState: 'contacted', signalStrength: 65 },
  { id: 'E4', type: 'message-reply', actor: 'Mike Torres', actorInitials: 'MT', actorRole: 'Director of Sales', actorCompany: 'Quantum Labs', timestamp: '6h ago', description: 'Replied to your outreach — interested in demo', leadState: 'engaged', signalStrength: 95 },
  { id: 'E5', type: 'search-appearance', actor: 'System', actorInitials: 'SY', actorRole: '', actorCompany: '', timestamp: '1d ago', description: 'You appeared in 47 searches matching "enterprise sales platform"', leadState: 'cold', signalStrength: 40 },
  { id: 'E6', type: 'content-share', actor: 'Casey Brown', actorInitials: 'CB', actorRole: 'Product Manager', actorCompany: 'Brightwave', timestamp: '2d ago', description: 'Shared your case study with their team', leadState: 'warm', signalStrength: 78 },
];

const TYPE_ICONS: Record<EngagementType, React.ElementType> = {
  'profile-view': Eye,
  'content-like': Star,
  'connection-accept': UserPlus,
  'message-reply': MessageSquare,
  'search-appearance': Activity,
  'content-share': ArrowUpRight,
};

const LEAD_COLORS: Record<string, string> = {
  warm: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  cold: 'bg-muted text-muted-foreground',
  contacted: 'bg-accent/10 text-accent',
  engaged: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
};

const NavigatorEngagementSignalsPage: React.FC = () => {
  const [leadFilter, setLeadFilter] = useState<'all' | 'warm' | 'cold' | 'contacted' | 'engaged'>('all');
  const filtered = EVENTS.filter(e => leadFilter === 'all' || e.leadState === leadFilter);

  const topStrip = (
    <>
      <Activity className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Navigator — Engagement Signals</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {(['all', 'warm', 'cold', 'contacted', 'engaged'] as const).map(f => (
          <button key={f} onClick={() => setLeadFilter(f)} className={cn('px-2 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', leadFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{f}</button>
        ))}
      </div>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bell className="h-3 w-3" />Alerts</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Lead States" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {(['warm', 'cold', 'contacted', 'engaged'] as const).map(state => (
            <div key={state} className="flex items-center gap-2">
              <Badge className={cn('text-[7px] border-0 capitalize w-16 justify-center rounded-lg', LEAD_COLORS[state])}>{state}</Badge>
              <span className="font-semibold">{EVENTS.filter(e => e.leadState === state).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Activity Types" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {Object.entries(TYPE_ICONS).map(([type, Icon]) => (
            <div key={type} className="flex items-center gap-1.5">
              <Icon className="h-3 w-3 text-muted-foreground" />
              <span className="text-muted-foreground capitalize flex-1">{type.replace(/-/g, ' ')}</span>
              <span className="font-semibold">{EVENTS.filter(e => e.type === type).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Signals Today" value={String(EVENTS.filter(e => e.timestamp.includes('m ago') || e.timestamp.includes('h ago')).length)} change="Last 24h" className="!rounded-2xl" />
        <KPICard label="Engaged Leads" value={String(EVENTS.filter(e => e.leadState === 'engaged').length)} change="Ready to act" className="!rounded-2xl" />
        <KPICard label="Warm Leads" value={String(EVENTS.filter(e => e.leadState === 'warm').length)} change="Showing interest" className="!rounded-2xl" />
        <KPICard label="Avg Signal" value={`${Math.round(EVENTS.reduce((s, e) => s + e.signalStrength, 0) / EVENTS.length)}`} change="Strength score" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {filtered.map(event => {
          const Icon = TYPE_ICONS[event.type];
          return (
            <div key={event.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10 rounded-2xl">
                    <AvatarFallback className="rounded-2xl text-[10px] font-bold">{event.actorInitials}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-lg bg-card border flex items-center justify-center">
                    <Icon className="h-2.5 w-2.5 text-accent" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold">{event.actor}</span>
                    {event.actorCompany && <span className="text-[9px] text-muted-foreground">@ {event.actorCompany}</span>}
                    <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', LEAD_COLORS[event.leadState])}>{event.leadState}</Badge>
                  </div>
                  {event.actorRole && <div className="text-[9px] text-muted-foreground">{event.actorRole}</div>}
                  <div className="text-[10px] mt-0.5">{event.description}</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{event.timestamp}</div>
                </div>
                <div className="flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-[hsl(var(--gigvora-amber))]" />
                    <span className="text-[10px] font-bold">{event.signalStrength}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 px-2"><Mail className="h-2.5 w-2.5" />Message</Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Bookmark className="h-2.5 w-2.5" /></Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorEngagementSignalsPage;
