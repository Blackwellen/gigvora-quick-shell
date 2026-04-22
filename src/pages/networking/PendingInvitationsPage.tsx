import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Handshake, Check, X, MessageSquare, Users, MapPin,
  Briefcase, Clock, Star, Sparkles, Eye,
} from 'lucide-react';

interface Invitation {
  id: string; name: string; avatar: string; headline: string;
  location: string; mutual: number; message?: string;
  sentAt: string; relevance: number; skills: string[];
  direction: 'received' | 'sent';
}

const INVITATIONS: Invitation[] = [
  { id: '1', name: 'Elena Vasquez', avatar: 'EV', headline: 'VP Engineering @ Cloudflare', location: 'Austin', mutual: 24, message: "Hi! We met at the SaaS conference last week. Would love to stay connected.", sentAt: '2h ago', relevance: 96, skills: ['Cloud', 'Engineering', 'Leadership'], direction: 'received' },
  { id: '2', name: 'Raj Krishnan', avatar: 'RK', headline: 'Principal Architect @ AWS', location: 'Seattle', mutual: 18, sentAt: '1d ago', relevance: 92, skills: ['Architecture', 'Cloud', 'Distributed Systems'], direction: 'received' },
  { id: '3', name: 'Sophie Larsson', avatar: 'SL', headline: 'Head of Design @ Canva', location: 'Sydney', mutual: 11, message: 'Love your work on design systems! Let\u2019s connect.', sentAt: '2d ago', relevance: 88, skills: ['Design', 'Brand', 'UX'], direction: 'received' },
  { id: '4', name: 'Omar Hassan', avatar: 'OH', headline: 'ML Research Lead @ DeepMind', location: 'London', mutual: 7, sentAt: '3d ago', relevance: 85, skills: ['ML', 'Research', 'Python'], direction: 'received' },
  { id: '5', name: 'Yuki Tanaka', avatar: 'YT', headline: 'Product Director @ LINE', location: 'Tokyo', mutual: 5, sentAt: '5d ago', relevance: 81, skills: ['Product', 'Mobile', 'Growth'], direction: 'received' },
  { id: '6', name: 'Zara Thompson', avatar: 'ZT', headline: 'Founding Engineer @ Ramp', location: 'NYC', mutual: 14, sentAt: '1w ago', relevance: 79, skills: ['Fintech', 'Full-Stack'], direction: 'sent' },
  { id: '7', name: 'David Park', avatar: 'DP', headline: 'Growth Lead @ Series B', location: 'SF', mutual: 9, sentAt: '1w ago', relevance: 76, skills: ['Growth', 'Marketing'], direction: 'sent' },
];

export default function PendingInvitationsPage() {
  const [tab, setTab] = useState<'received' | 'sent'>('received');
  const filtered = INVITATIONS.filter(i => i.direction === tab);
  const received = INVITATIONS.filter(i => i.direction === 'received');
  const sent = INVITATIONS.filter(i => i.direction === 'sent');

  return (
    <NetworkShell backLabel="Invitations" backRoute="/networking">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Handshake className="h-4 w-4 text-[hsl(var(--state-caution))]" />
        <h1 className="text-sm font-bold mr-2">Pending Invitations</h1>
        <KPICard label="Received" value={String(received.length)} />
        <KPICard label="Sent" value={String(sent.length)} />
        <KPICard label="Avg Relevance" value={`${Math.round(received.reduce((a, i) => a + i.relevance, 0) / received.length)}%`} />
      </div>

      <div className="flex items-center gap-2 mb-4">
        <Tabs value={tab} onValueChange={v => setTab(v as any)}>
          <TabsList className="h-7">
            <TabsTrigger value="received" className="text-[10px] h-5 px-2 gap-1">
              Received <Badge className="text-[7px] h-3 bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))] border-0 px-1">{received.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="sent" className="text-[10px] h-5 px-2">Sent ({sent.length})</TabsTrigger>
          </TabsList>
        </Tabs>
        {tab === 'received' && (
          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1 ml-auto"><Check className="h-3 w-3" /> Accept All</Button>
        )}
      </div>

      <div className="space-y-2.5">
        {filtered.map(inv => (
          <div key={inv.id} className="p-4 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all">
            <div className="flex items-start gap-3">
              <Avatar className="h-11 w-11">
                <AvatarFallback className="text-xs bg-accent/10 text-accent">{inv.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold">{inv.name}</span>
                  <Badge className="text-[7px] h-3.5 bg-accent/10 text-accent border-0">{inv.relevance}% match</Badge>
                </div>
                <div className="text-[10px] text-muted-foreground">{inv.headline}</div>
                <div className="flex items-center gap-3 mt-0.5 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{inv.location}</span>
                  <span><Users className="h-2.5 w-2.5 inline" /> {inv.mutual} mutual</span>
                  <span><Clock className="h-2.5 w-2.5 inline" /> {inv.sentAt}</span>
                </div>
                {inv.message && (
                  <p className="text-[9px] text-muted-foreground bg-muted/40 rounded-lg px-2.5 py-1.5 mt-2 italic">&ldquo;{inv.message}&rdquo;</p>
                )}
                <div className="flex flex-wrap gap-1 mt-2">
                  {inv.skills.map(s => <Badge key={s} variant="outline" className="text-[7px] h-3.5 px-1.5">{s}</Badge>)}
                </div>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                {tab === 'received' ? (
                  <>
                    <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Check className="h-3 w-3" /> Accept</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><X className="h-3 w-3" /> Ignore</Button>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" /> View</Button>
                  </>
                ) : (
                  <>
                    <Badge variant="outline" className="text-[8px] h-5">Pending</Badge>
                    <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><X className="h-3 w-3" /> Withdraw</Button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </NetworkShell>
  );
}
