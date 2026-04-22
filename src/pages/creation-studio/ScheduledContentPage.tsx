import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Calendar, Clock, Search, FileText, Film, Mic, Tv, Mail, Megaphone,
  ArrowRight, Edit, Eye, Pause, Play, Trash2, ChevronRight, AlertTriangle,
  CheckCircle2, Globe, Users, BarChart3, Layers,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ScheduledItem {
  id: string; title: string; type: string; scheduledAt: string;
  destination: string; status: 'queued' | 'processing' | 'ready' | 'paused';
  audience: string; icon: React.ElementType;
}

const SCHEDULED: ScheduledItem[] = [
  { id: 's1', title: 'Portfolio Review Live Session', type: 'Webinar', scheduledAt: 'Today, 3:00 PM', destination: 'Events', status: 'ready', audience: '342 registered', icon: Tv },
  { id: 's2', title: 'Weekly Tech Newsletter #43', type: 'Newsletter', scheduledAt: 'Tomorrow, 9:00 AM', destination: 'Subscribers', status: 'queued', audience: '1.2K subscribers', icon: Mail },
  { id: 's3', title: 'AI Prompt Engineering Tips', type: 'Reel', scheduledAt: 'Apr 16, 12:00 PM', destination: 'Feed + Media', status: 'processing', audience: 'Public', icon: Film },
  { id: 's4', title: 'Freelancing Income Masterclass', type: 'Video', scheduledAt: 'Apr 17, 2:00 PM', destination: 'Media', status: 'queued', audience: 'Followers', icon: Film },
  { id: 's5', title: 'Design Systems Ep. 15', type: 'Podcast', scheduledAt: 'Apr 18, 8:00 AM', destination: 'Media', status: 'ready', audience: '5.6K listeners', icon: Mic },
  { id: 's6', title: 'Q2 Campaign Launch', type: 'Campaign', scheduledAt: 'Apr 20, 10:00 AM', destination: 'Ads', status: 'paused', audience: 'Targeted', icon: Megaphone },
];

const STATUS_MAP = {
  queued: { cls: 'bg-muted text-muted-foreground', label: 'Queued' },
  processing: { cls: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', label: 'Processing' },
  ready: { cls: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]', label: 'Ready' },
  paused: { cls: 'bg-destructive/10 text-destructive', label: 'Paused' },
};

// Group by day
const TODAY = SCHEDULED.filter(s => s.scheduledAt.startsWith('Today'));
const TOMORROW = SCHEDULED.filter(s => s.scheduledAt.startsWith('Tomorrow'));
const LATER = SCHEDULED.filter(s => !s.scheduledAt.startsWith('Today') && !s.scheduledAt.startsWith('Tomorrow'));

export default function ScheduledContentPage() {
  const [search, setSearch] = useState('');

  return (
    <DashboardLayout topStrip={
      <>
        <Calendar className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Scheduled Content</span>
        <div className="flex-1" />
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search scheduled..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
        <Link to="/creation-studio" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Studio <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    }>
      {/* KPIs */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Scheduled" value={String(SCHEDULED.length)} />
        <KPICard label="Today" value={String(TODAY.length)} />
        <KPICard label="Ready" value={String(SCHEDULED.filter(s => s.status === 'ready').length)} />
        <KPICard label="Paused" value={String(SCHEDULED.filter(s => s.status === 'paused').length)} />
      </div>

      {/* Timeline groups */}
      {[
        { label: 'Today', items: TODAY, color: 'text-[hsl(var(--state-live))]' },
        { label: 'Tomorrow', items: TOMORROW, color: 'text-accent' },
        { label: 'Upcoming', items: LATER, color: 'text-muted-foreground' },
      ].filter(g => g.items.length > 0).map(group => (
        <SectionCard key={group.label} title={group.label} icon={<Clock className={cn('h-3.5 w-3.5', group.color)} />} className="mb-3">
          <div className="space-y-2">
            {group.items.map(item => {
              const st = STATUS_MAP[item.status];
              return (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all group">
                  <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <item.icon className="h-4.5 w-4.5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold truncate">{item.title}</span>
                      <Badge className={cn('text-[7px] h-3.5 border-0', st.cls)}>{st.label}</Badge>
                    </div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">
                      {item.type} · {item.scheduledAt} · {item.destination} · {item.audience}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Edit className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
                    {item.status === 'paused' ? (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-[hsl(var(--state-healthy))]"><Play className="h-3 w-3" /></Button>
                    ) : (
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Pause className="h-3 w-3" /></Button>
                    )}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </SectionCard>
      ))}

      {/* Calendar Preview */}
      <SectionCard title="Publishing Calendar" icon={<Calendar className="h-3.5 w-3.5 text-accent" />} className="mt-3">
        <div className="grid grid-cols-7 gap-1">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => (
            <div key={d} className="text-[8px] font-semibold text-muted-foreground text-center py-1">{d}</div>
          ))}
          {Array.from({ length: 28 }, (_, i) => {
            const day = i + 1;
            const hasContent = [14, 15, 16, 17, 18, 20].includes(day);
            const isToday = day === 14;
            return (
              <div key={i} className={cn(
                'h-10 rounded-lg flex flex-col items-center justify-center text-[9px] transition-all cursor-pointer',
                isToday ? 'bg-accent/10 ring-1 ring-accent/30 font-bold text-accent' :
                hasContent ? 'bg-muted/30 hover:bg-muted/50' : 'hover:bg-muted/20 text-muted-foreground'
              )}>
                <span>{day}</span>
                {hasContent && <div className="h-1 w-1 rounded-full bg-accent mt-0.5" />}
              </div>
            );
          })}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
}
