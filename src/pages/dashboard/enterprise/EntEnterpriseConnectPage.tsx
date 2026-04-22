import React, { useState } from 'react';
import { KPIBand, KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import {
  Link2, ChevronRight, Building2, Star, Globe, Users,
  Handshake, Mail, Bookmark, ExternalLink, TrendingUp,
  Target, Calendar,
} from 'lucide-react';

interface Connection {
  id: string; name: string; industry: string; type: 'partner' | 'prospect' | 'vendor' | 'client';
  status: 'active' | 'pending-intro' | 'new'; match: string; location: string;
}

const CONNECTIONS: Connection[] = [
  { id: '1', name: 'TechPulse Inc', industry: 'Technology', type: 'partner', status: 'active', match: '94%', location: 'San Francisco' },
  { id: '2', name: 'GreenTech Solutions', industry: 'Sustainability', type: 'prospect', status: 'pending-intro', match: '88%', location: 'London' },
  { id: '3', name: 'DataFlow Analytics', industry: 'Data & AI', type: 'client', status: 'active', match: '92%', location: 'NYC' },
  { id: '4', name: 'CloudScale Infra', industry: 'Cloud', type: 'vendor', status: 'active', match: '85%', location: 'Berlin' },
  { id: '5', name: 'FinApp Group', industry: 'Fintech', type: 'prospect', status: 'new', match: '91%', location: 'Singapore' },
  { id: '6', name: 'MediaPulse', industry: 'Media', type: 'prospect', status: 'pending-intro', match: '78%', location: 'LA' },
];

const TYPE_COLORS: Record<string, string> = {
  partner: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  prospect: 'bg-accent/10 text-accent',
  vendor: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  client: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
};

export default function EntEnterpriseConnectPage() {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? CONNECTIONS : CONNECTIONS.filter(c => c.type === filter || c.status === filter);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold flex items-center gap-2"><Link2 className="h-5 w-5 text-accent" /> Enterprise Connect</h1>
          <p className="text-[11px] text-muted-foreground">Manage enterprise relationships, partnerships, and network opportunities</p>
        </div>
        <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><ExternalLink className="h-3.5 w-3.5" />Full Connect Hub</Button>
      </div>

      <KPIBand>
        <KPICard label="Active Connections" value="3" />
        <KPICard label="Pending Intros" value="2" change="Action needed" trend="down" />
        <KPICard label="New Opportunities" value="1" change="This week" trend="up" />
        <KPICard label="Network Score" value="87" change="+5 pts" trend="up" />
      </KPIBand>

      {/* Recommended */}
      <SectionCard title="Top Opportunity" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-3 py-1">
          <Avatar className="h-10 w-10"><AvatarFallback className="text-[10px] bg-accent/10 text-accent font-bold">FG</AvatarFallback></Avatar>
          <div className="flex-1">
            <div className="text-[10px] font-bold">FinApp Group</div>
            <div className="text-[9px] text-muted-foreground">Fintech · Singapore · 91% match · Potential partnership for payments integration</div>
          </div>
          <Button size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Handshake className="h-3 w-3" />Request Intro</Button>
        </div>
      </SectionCard>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {['all', 'partner', 'prospect', 'vendor', 'client', 'pending-intro'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={cn(
            'px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all capitalize',
            filter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>{f === 'pending-intro' ? 'Pending Intro' : f}</button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(c => (
          <div key={c.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer group">
            <Avatar className="h-10 w-10"><AvatarFallback className="text-[10px] bg-muted/50 font-bold text-muted-foreground">{c.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{c.name}</span>
                <Badge className={cn('text-[7px] rounded-lg border-0 capitalize', TYPE_COLORS[c.type])}>{c.type}</Badge>
                {c.status === 'pending-intro' && <StatusBadge status="caution" label="Intro Pending" />}
                {c.status === 'new' && <StatusBadge status="live" label="New" />}
              </div>
              <div className="text-[9px] text-muted-foreground flex items-center gap-3">
                <span>{c.industry}</span>
                <span className="flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" />{c.location}</span>
              </div>
            </div>
            <Badge className="text-[8px] bg-accent/10 text-accent border-0 rounded-lg">{c.match} match</Badge>
            <div className="flex gap-1 shrink-0">
              <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><Mail className="h-2.5 w-2.5" /></Button>
              <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><Bookmark className="h-2.5 w-2.5" /></Button>
            </div>
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
