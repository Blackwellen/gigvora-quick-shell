import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  CreditCard, Plus, Eye, Share2, Copy, Download, QrCode,
  Globe, MapPin, Briefcase, Mail, ExternalLink, Star,
  Search, Filter, MoreHorizontal, Sparkles,
} from 'lucide-react';

interface DigitalCard {
  id: string; title: string; type: 'professional' | 'event' | 'creative' | 'company';
  name: string; avatar: string; headline: string; location: string;
  email: string; website: string; skills: string[];
  shared: number; views: number; saves: number; lastShared: string;
  gradient: string;
}

const MY_CARDS: DigitalCard[] = [
  {
    id: 'c1', title: 'Professional Card', type: 'professional',
    name: 'Alex Johnson', avatar: 'AJ', headline: 'Staff Engineer @ TechCorp',
    location: 'San Francisco, CA', email: 'alex@techcorp.com', website: 'alexj.dev',
    skills: ['React', 'TypeScript', 'System Design', 'Leadership'],
    shared: 28, views: 142, saves: 18, lastShared: '2h ago',
    gradient: 'from-accent/20 via-accent/5 to-transparent',
  },
  {
    id: 'c2', title: 'Event Networking', type: 'event',
    name: 'Alex Johnson', avatar: 'AJ', headline: 'Speaker & Workshop Host',
    location: 'Global', email: 'alex@events.io', website: 'alexj.dev/speaking',
    skills: ['Public Speaking', 'Workshops', 'Mentoring'],
    shared: 8, views: 45, saves: 6, lastShared: '1d ago',
    gradient: 'from-[hsl(var(--gigvora-purple))]/20 via-transparent to-transparent',
  },
  {
    id: 'c3', title: 'Creative Portfolio', type: 'creative',
    name: 'Alex Johnson', avatar: 'AJ', headline: 'Open Source Contributor',
    location: 'Remote', email: 'alex@oss.dev', website: 'github.com/alexj',
    skills: ['Open Source', 'Rust', 'Go', 'Technical Writing'],
    shared: 12, views: 89, saves: 9, lastShared: '3d ago',
    gradient: 'from-[hsl(var(--gigvora-amber))]/20 via-transparent to-transparent',
  },
];

const SAVED_CARDS: { name: string; avatar: string; headline: string; savedAt: string; from: string }[] = [
  { name: 'Maya Chen', avatar: 'MC', headline: 'Product Lead @ Stripe', savedAt: 'Today', from: 'Speed Networking' },
  { name: 'James Rivera', avatar: 'JR', headline: 'Staff Engineer @ Vercel', savedAt: 'Yesterday', from: 'AI Leaders Room' },
  { name: 'Aisha Patel', avatar: 'AP', headline: 'Design Director @ Figma', savedAt: '3d ago', from: 'Direct Share' },
  { name: 'Leo Tanaka', avatar: 'LT', headline: 'VP Eng @ Datadog', savedAt: '1w ago', from: 'Event: Cloud Summit' },
  { name: 'Sophie Larsson', avatar: 'SL', headline: 'Head of Design @ Canva', savedAt: '1w ago', from: 'Introduction' },
];

const TYPE_STYLES: Record<string, { label: string; color: string }> = {
  professional: { label: 'Professional', color: 'bg-accent/10 text-accent' },
  event: { label: 'Event', color: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]' },
  creative: { label: 'Creative', color: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' },
  company: { label: 'Company', color: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' },
};

export default function DigitalCardGalleryPage() {
  const [tab, setTab] = useState<'my-cards' | 'saved'>('my-cards');
  const [search, setSearch] = useState('');

  return (
    <NetworkShell backLabel="Digital Cards" backRoute="/networking">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <CreditCard className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Digital Cards</h1>
        <KPICard label="My Cards" value={String(MY_CARDS.length)} />
        <KPICard label="Saved Cards" value={String(SAVED_CARDS.length)} />
        <KPICard label="Total Shares" value={String(MY_CARDS.reduce((a, c) => a + c.shared, 0))} />
        <KPICard label="Total Views" value={String(MY_CARDS.reduce((a, c) => a + c.views, 0))} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="my-cards" className="text-[10px] h-5 px-2">My Cards</TabsTrigger>
            <TabsTrigger value="saved" className="text-[10px] h-5 px-2">Saved Cards</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex-1" />
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><Plus className="h-3 w-3" /> Create Card</Button>
      </div>

      {tab === 'my-cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {MY_CARDS.map(card => {
            const style = TYPE_STYLES[card.type];
            return (
              <div key={card.id} className={`rounded-2xl border border-border/40 overflow-hidden hover:shadow-lg transition-all bg-gradient-to-br ${card.gradient}`}>
                <div className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <Badge className={`text-[8px] h-4 border-0 ${style.color}`}>{style.label}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><MoreHorizontal className="h-3.5 w-3.5" /></Button>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-12 w-12 ring-2 ring-accent/20">
                      <AvatarFallback className="text-sm bg-accent/10 text-accent">{card.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold">{card.name}</div>
                      <div className="text-[10px] text-muted-foreground">{card.headline}</div>
                    </div>
                  </div>
                  <div className="space-y-1 text-[9px] text-muted-foreground mb-3">
                    <div className="flex items-center gap-1.5"><MapPin className="h-2.5 w-2.5" />{card.location}</div>
                    <div className="flex items-center gap-1.5"><Mail className="h-2.5 w-2.5" />{card.email}</div>
                    <div className="flex items-center gap-1.5"><Globe className="h-2.5 w-2.5" />{card.website}</div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {card.skills.map(s => <Badge key={s} variant="outline" className="text-[7px] h-3.5 px-1.5">{s}</Badge>)}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground pt-2 border-t border-border/30">
                    <span><Eye className="h-2.5 w-2.5 inline" /> {card.views} views</span>
                    <span><Share2 className="h-2.5 w-2.5 inline" /> {card.shared} shares</span>
                    <span><Star className="h-2.5 w-2.5 inline" /> {card.saves} saves</span>
                  </div>
                </div>
                <div className="px-5 py-2.5 border-t border-border/30 bg-card/50 flex gap-1.5">
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg flex-1 gap-0.5"><Share2 className="h-2.5 w-2.5" /> Share</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Copy className="h-2.5 w-2.5" /> Copy</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><QrCode className="h-2.5 w-2.5" /> QR</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Download className="h-2.5 w-2.5" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {tab === 'saved' && (
        <div className="space-y-2">
          <div className="relative max-w-sm mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input placeholder="Search saved cards..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs" />
          </div>
          {SAVED_CARDS.filter(c => c.name.toLowerCase().includes(search.toLowerCase())).map((c, i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="text-xs bg-accent/10 text-accent">{c.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold">{c.name}</div>
                <div className="text-[10px] text-muted-foreground">{c.headline}</div>
                <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground">
                  <span>From: {c.from}</span>
                  <span>· Saved {c.savedAt}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Eye className="h-2.5 w-2.5" /> View</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Sparkles className="h-2.5 w-2.5" /> Connect</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </NetworkShell>
  );
}
