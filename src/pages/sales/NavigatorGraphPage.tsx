import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Network, Search, Users, ArrowRight, Eye, UserPlus, MessageSquare,
  Star, ChevronRight, Zap, MapPin, Building2, GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';

interface ConnectionPath {
  id: string; target: string; targetTitle: string; targetCompany: string;
  degree: '1st' | '2nd' | '3rd'; intermediaries: string[]; strength: number;
  lastInteraction: string; mutuals: number;
}

const PATHS: ConnectionPath[] = [
  { id: 'p1', target: 'Elena Rodriguez', targetTitle: 'CTO', targetCompany: 'CloudScale', degree: '2nd', intermediaries: ['Lisa Wang'], strength: 85, lastInteraction: '3d ago', mutuals: 12 },
  { id: 'p2', target: 'Sarah Chen', targetTitle: 'VP Engineering', targetCompany: 'TechCorp', degree: '2nd', intermediaries: ['Marcus Johnson'], strength: 78, lastInteraction: '1w ago', mutuals: 8 },
  { id: 'p3', target: 'Priya Sharma', targetTitle: 'CEO', targetCompany: 'NexaFlow', degree: '3rd', intermediaries: ['David Park', 'Lisa Wang'], strength: 42, lastInteraction: 'Never', mutuals: 3 },
  { id: 'p4', target: 'Tom Richards', targetTitle: 'SVP Product', targetCompany: 'DataFlow', degree: '1st', intermediaries: [], strength: 92, lastInteraction: '2d ago', mutuals: 24 },
  { id: 'p5', target: 'James Park', targetTitle: 'CTO', targetCompany: 'ScaleUp', degree: '2nd', intermediaries: ['Amy Chen'], strength: 65, lastInteraction: '2w ago', mutuals: 6 },
];

const DEGREE_COLORS: Record<string, string> = {
  '1st': 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  '2nd': 'bg-accent/10 text-accent',
  '3rd': 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};

const NavigatorGraphPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const topStrip = (
    <>
      <Network className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Navigator — Relationship Graph</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Find connection path..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-52 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Network Stats" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: '1st Degree', v: '342', color: 'text-[hsl(var(--state-healthy))]' },
            { l: '2nd Degree', v: '4,821', color: 'text-accent' },
            { l: '3rd Degree', v: '28,459', color: 'text-[hsl(var(--gigvora-amber))]' },
          ].map(s => (
            <div key={s.l} className="flex justify-between">
              <span className="text-muted-foreground">{s.l}</span>
              <span className={cn('font-bold', s.color)}>{s.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Warm Introductions" className="!rounded-2xl">
        <div className="space-y-1">
          {['Lisa Wang', 'Marcus Johnson', 'Amy Chen'].map(n => (
            <div key={n} className="flex items-center gap-1.5 p-1.5 rounded-xl hover:bg-muted/30 cursor-pointer text-[9px]">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px]">{n.split(' ').map(w => w[0]).join('')}</AvatarFallback></Avatar>
              <span className="font-medium">{n}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Mapped Connections" value="1,247" change="Total" className="!rounded-2xl" />
        <KPICard label="Reachable via 2nd" value="4.8K" change="Prospects" className="!rounded-2xl" />
        <KPICard label="Warm Paths" value="34" change="Intro-ready" trend="up" className="!rounded-2xl" />
        <KPICard label="Avg Path Strength" value="72" change="/100" className="!rounded-2xl" />
      </KPIBand>

      {/* Visual Graph Placeholder */}
      <div className="rounded-2xl border bg-gradient-to-br from-accent/5 to-primary/5 p-8 mb-4 flex flex-col items-center justify-center min-h-[200px]">
        <GitBranch className="h-12 w-12 text-accent/20 mb-3" />
        <div className="text-[12px] font-bold text-muted-foreground">Interactive Relationship Graph</div>
        <div className="text-[10px] text-muted-foreground mt-1">Visual network map with connection paths and strength indicators</div>
        <div className="flex gap-3 mt-4">
          {[
            { l: 'You', color: 'bg-accent' },
            { l: '1st', color: 'bg-[hsl(var(--state-healthy))]' },
            { l: '2nd', color: 'bg-[hsl(var(--gigvora-amber))]' },
            { l: '3rd', color: 'bg-muted-foreground/30' },
          ].map(n => (
            <div key={n.l} className="flex items-center gap-1 text-[8px] text-muted-foreground">
              <div className={cn('h-3 w-3 rounded-full', n.color)} />
              {n.l}
            </div>
          ))}
        </div>
      </div>

      {/* Connection Paths */}
      <SectionCard title="Connection Paths" className="!rounded-2xl">
        <div className="space-y-2">
          {PATHS.filter(p => !search || p.target.toLowerCase().includes(search.toLowerCase())).map(p => (
            <div key={p.id} className="rounded-2xl border p-3.5 hover:shadow-sm cursor-pointer transition-all group">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10"><AvatarFallback className="text-[9px]">{p.target.split(' ').map(w => w[0]).join('')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{p.target}</div>
                  <div className="text-[9px] text-muted-foreground">{p.targetTitle} · {p.targetCompany}</div>
                </div>
                <Badge className={cn('text-[8px] border-0', DEGREE_COLORS[p.degree])}>{p.degree} degree</Badge>
                <div className="text-center shrink-0">
                  <div className="text-sm font-bold">{p.strength}</div>
                  <div className="text-[7px] text-muted-foreground">Strength</div>
                </div>
              </div>
              {p.intermediaries.length > 0 && (
                <div className="flex items-center gap-1.5 mt-2 pl-13 text-[9px] text-muted-foreground">
                  <span>via</span>
                  {p.intermediaries.map((int, i) => (
                    <React.Fragment key={int}>
                      <Badge variant="secondary" className="text-[8px] rounded-lg">{int}</Badge>
                      {i < p.intermediaries.length - 1 && <ArrowRight className="h-2.5 w-2.5" />}
                    </React.Fragment>
                  ))}
                  <span className="ml-auto">{p.mutuals} mutual</span>
                </div>
              )}
              <div className="flex gap-1.5 mt-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><UserPlus className="h-2.5 w-2.5" />Request Intro</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" />Profile</Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </DashboardLayout>
  );
};

export default NavigatorGraphPage;
