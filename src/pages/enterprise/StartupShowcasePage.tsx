import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Rocket, Search, TrendingUp, Users, MapPin, DollarSign,
  Building2, Star, Heart, MessageSquare, ExternalLink, Filter,
  ChevronRight, Sparkles, Globe, Calendar, Award, Target,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const STARTUPS = [
  { id: '1', name: 'NeuralForge AI', tagline: 'Enterprise AI infrastructure for scaling teams', sector: 'AI/ML', stage: 'Series A', raised: '$12M', team: 24, location: 'San Francisco', founded: '2023', traction: '150+ enterprise clients', initials: 'NF', featured: true, growth: '+340%' },
  { id: '2', name: 'GreenFlow', tagline: 'Carbon accounting automation for supply chains', sector: 'CleanTech', stage: 'Seed', raised: '$3.5M', team: 12, location: 'London', founded: '2024', traction: '45 active pilots', initials: 'GF', featured: true, growth: '+180%' },
  { id: '3', name: 'PayStack Pro', tagline: 'B2B payment infrastructure for emerging markets', sector: 'FinTech', stage: 'Series B', raised: '$28M', team: 65, location: 'Lagos', founded: '2022', traction: '$2B processed', initials: 'PP', featured: false, growth: '+520%' },
  { id: '4', name: 'HealthBridge', tagline: 'AI-powered remote patient monitoring', sector: 'HealthTech', stage: 'Series A', raised: '$8M', team: 30, location: 'Berlin', founded: '2023', traction: '200+ clinics', initials: 'HB', featured: false, growth: '+210%' },
  { id: '5', name: 'DataWeave', tagline: 'Real-time data mesh for distributed teams', sector: 'Data', stage: 'Pre-Seed', raised: '$1.2M', team: 8, location: 'Toronto', founded: '2024', traction: 'Beta — 30 teams', initials: 'DW', featured: false, growth: '+90%' },
  { id: '6', name: 'LegalMind', tagline: 'Contract analysis and compliance automation', sector: 'LegalTech', stage: 'Seed', raised: '$5M', team: 18, location: 'New York', founded: '2023', traction: '80+ law firms', initials: 'LM', featured: false, growth: '+150%' },
];

const SECTORS = ['All Sectors', 'AI/ML', 'FinTech', 'CleanTech', 'HealthTech', 'LegalTech', 'Data', 'SaaS', 'EdTech'];
const STAGES = ['All Stages', 'Pre-Seed', 'Seed', 'Series A', 'Series B', 'Series C+'];

export default function StartupShowcasePage() {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All Sectors');
  const [stage, setStage] = useState('All Stages');

  const filtered = STARTUPS.filter(s =>
    (sector === 'All Sectors' || s.sector === sector) &&
    (stage === 'All Stages' || s.stage === stage) &&
    (s.name.toLowerCase().includes(search.toLowerCase()) || s.tagline.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2"><Rocket className="h-5 w-5 text-primary" /> Startup Showcase</h1>
          <p className="text-xs text-muted-foreground">Discover innovative startups, founders, and investment opportunities</p>
        </div>
        <Button className="h-9 text-xs rounded-xl gap-1.5"><Plus className="h-3.5 w-3.5" />Submit Startup</Button>
      </div>

      <KPIBand>
        <KPICard label="Featured Startups" value={String(STARTUPS.length)} />
        <KPICard label="Total Raised" value="$57.7M" change="+42% QoQ" />
        <KPICard label="Sectors" value="8" />
        <KPICard label="Avg Team Size" value="26" />
      </KPIBand>

      {/* Featured */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {STARTUPS.filter(s => s.featured).map(s => (
          <Link key={s.id} to={`/enterprise-connect/startups/${s.id}`} className="block">
            <div className="rounded-2xl border bg-gradient-to-br from-primary/5 to-transparent p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all group">
              <div className="flex items-start gap-3 mb-3">
                <Avatar className="h-12 w-12 rounded-2xl"><AvatarFallback className="rounded-2xl text-sm bg-primary/10 text-primary font-bold">{s.initials}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2"><span className="text-sm font-bold group-hover:text-primary transition-colors">{s.name}</span><Badge className="text-[8px] bg-primary/10 text-primary">{s.stage}</Badge><Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" /></div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{s.tagline}</div>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-background/60 rounded-xl p-2 text-center"><div className="text-[8px] text-muted-foreground">Raised</div><div className="text-xs font-bold">{s.raised}</div></div>
                <div className="bg-background/60 rounded-xl p-2 text-center"><div className="text-[8px] text-muted-foreground">Team</div><div className="text-xs font-bold">{s.team}</div></div>
                <div className="bg-background/60 rounded-xl p-2 text-center"><div className="text-[8px] text-muted-foreground">Growth</div><div className="text-xs font-bold text-primary">{s.growth}</div></div>
                <div className="bg-background/60 rounded-xl p-2 text-center"><div className="text-[8px] text-muted-foreground">Sector</div><div className="text-xs font-bold">{s.sector}</div></div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.location}</span>
                <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Founded {s.founded}</span>
                <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{s.traction}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input placeholder="Search startups..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9 rounded-xl text-xs" />
        </div>
        <Select value={sector} onValueChange={setSector}><SelectTrigger className="w-36 h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
        <Select value={stage} onValueChange={setStage}><SelectTrigger className="w-32 h-9 rounded-xl text-xs"><SelectValue /></SelectTrigger><SelectContent>{STAGES.map(s => <SelectItem key={s} value={s} className="text-xs">{s}</SelectItem>)}</SelectContent></Select>
      </div>

      {/* All Startups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Link key={s.id} to={`/enterprise-connect/startups/${s.id}`} className="block">
            <div className="rounded-2xl border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all group bg-card">
              <div className="flex items-start gap-2.5 mb-3">
                <Avatar className="h-10 w-10 rounded-xl"><AvatarFallback className="rounded-xl text-[10px] bg-primary/10 text-primary font-bold">{s.initials}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5"><span className="text-xs font-bold group-hover:text-primary transition-colors truncate">{s.name}</span><Badge variant="secondary" className="text-[7px]">{s.stage}</Badge></div>
                  <div className="text-[10px] text-muted-foreground line-clamp-1">{s.tagline}</div>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-1.5 mb-2.5">
                <div className="bg-muted/40 rounded-lg p-1.5 text-center"><div className="text-[7px] text-muted-foreground">Raised</div><div className="text-[10px] font-bold">{s.raised}</div></div>
                <div className="bg-muted/40 rounded-lg p-1.5 text-center"><div className="text-[7px] text-muted-foreground">Team</div><div className="text-[10px] font-bold">{s.team}</div></div>
                <div className="bg-muted/40 rounded-lg p-1.5 text-center"><div className="text-[7px] text-muted-foreground">Growth</div><div className="text-[10px] font-bold text-primary">{s.growth}</div></div>
              </div>
              <div className="flex items-center gap-2 text-[9px] text-muted-foreground">
                <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{s.location}</span>
                <span>·</span>
                <span>{s.sector}</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Plus(props: any) { return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M5 12h14"/><path d="M12 5v14"/></svg>; }
