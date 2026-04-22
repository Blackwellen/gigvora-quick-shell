import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Handshake, Search, Filter, Globe, MapPin, Shield, Star,
  TrendingUp, Eye, Bookmark, UserPlus, Target, CheckCircle2,
  Sparkles, ChevronRight, Zap,
} from 'lucide-react';

type PartnerType = 'technology' | 'channel' | 'consulting' | 'referral' | 'integration';
interface Partner {
  id: string; name: string; avatar: string; type: PartnerType; sector: string;
  region: string; alignment: number; trustScore: number; revenueShare: string;
  status: 'active' | 'prospect' | 'pending'; services: string[];
}

const TYPE_COLORS: Record<PartnerType, string> = {
  technology: 'bg-accent/10 text-accent', channel: 'bg-primary/10 text-primary',
  consulting: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  referral: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  integration: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]',
};

const PARTNERS: Partner[] = [
  { id: 'P-1', name: 'CloudScale Systems', avatar: 'CS', type: 'technology', sector: 'Cloud', region: 'Asia Pacific', alignment: 94, trustScore: 88, revenueShare: '$45K/yr', status: 'active', services: ['Cloud Migration', 'Kubernetes'] },
  { id: 'P-2', name: 'DigitalBridge Consulting', avatar: 'DB', type: 'consulting', sector: 'Consulting', region: 'Europe', alignment: 89, trustScore: 91, revenueShare: '$32K/yr', status: 'active', services: ['Strategy', 'Transformation'] },
  { id: 'P-3', name: 'NexGen Integrations', avatar: 'NI', type: 'integration', sector: 'Technology', region: 'North America', alignment: 86, trustScore: 85, revenueShare: '$28K/yr', status: 'active', services: ['API Integration', 'Middleware'] },
  { id: 'P-4', name: 'MarketReach Partners', avatar: 'MR', type: 'channel', sector: 'Marketing', region: 'North America', alignment: 82, trustScore: 79, revenueShare: '$18K/yr', status: 'prospect', services: ['Lead Gen', 'Channel Sales'] },
  { id: 'P-5', name: 'TalentBridge HR', avatar: 'TB', type: 'referral', sector: 'HR Tech', region: 'Europe', alignment: 78, trustScore: 82, revenueShare: '$12K/yr', status: 'pending', services: ['Recruitment', 'Staffing'] },
  { id: 'P-6', name: 'SecureOps Inc', avatar: 'SO', type: 'technology', sector: 'Cybersecurity', region: 'North America', alignment: 91, trustScore: 93, revenueShare: '$56K/yr', status: 'active', services: ['Security Audit', 'Compliance'] },
];

const EnterprisePartnerDiscoveryPage: React.FC = () => {
  const [search, setSearch] = useState('');

  const topStrip = (
    <>
      <Handshake className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
      <span className="text-xs font-semibold">Partner Discovery</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search partners..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-48 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Sparkles className="h-3 w-3" />AI Match</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Partner Types" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {(['technology', 'channel', 'consulting', 'referral', 'integration'] as PartnerType[]).map(t => (
            <div key={t} className="flex justify-between">
              <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[t])}>{t}</Badge>
              <span className="font-semibold">{PARTNERS.filter(p => p.type === t).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="AI Recommendations" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { name: 'InfraCore Labs', match: '96%', reason: 'Strong cloud alignment' },
            { name: 'DataVault Systems', match: '92%', reason: 'Complementary analytics' },
          ].map(r => (
            <div key={r.name} className="p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer">
              <div className="flex justify-between"><span className="font-medium">{r.name}</span><Badge className="bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] text-[6px] border-0">{r.match}</Badge></div>
              <div className="text-[8px] text-muted-foreground">{r.reason}</div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Partners" value={String(PARTNERS.filter(p => p.status === 'active').length)} className="!rounded-2xl" />
        <KPICard label="Prospects" value={String(PARTNERS.filter(p => p.status === 'prospect').length)} className="!rounded-2xl" />
        <KPICard label="Revenue Share" value="$191K" change="Annual" className="!rounded-2xl" />
        <KPICard label="Avg Alignment" value="87%" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2">
        {PARTNERS.filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase())).map(p => (
          <div key={p.id} className="rounded-2xl border bg-card p-4 hover:shadow-md cursor-pointer transition-all group">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[10px] font-bold">{p.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="text-[12px] font-bold group-hover:text-accent transition-colors">{p.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize', TYPE_COLORS[p.type])}>{p.type}</Badge>
                  <Badge className={cn('text-[7px] border-0', p.status === 'active' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : p.status === 'pending' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : 'bg-muted text-muted-foreground')}>{p.status}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground">{p.sector} · <MapPin className="h-2.5 w-2.5 inline" /> {p.region}</div>
                <div className="flex gap-1 mt-1">{p.services.map(s => <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>)}</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-[9px] shrink-0">
                <div><div className="font-bold text-[hsl(var(--state-healthy))]">{p.alignment}%</div><div className="text-[7px] text-muted-foreground">Align</div></div>
                <div><div className="font-bold">{p.trustScore}</div><div className="text-[7px] text-muted-foreground">Trust</div></div>
                <div><div className="font-bold">{p.revenueShare}</div><div className="text-[7px] text-muted-foreground">Rev</div></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default EnterprisePartnerDiscoveryPage;
