import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Users, Check, X, MessageSquare, UserPlus, Search,
  ArrowRight, Zap, Radio, CreditCard, Clock, Star,
  Handshake, Globe, Sparkles, Eye,
} from 'lucide-react';
import { MOCK_CONNECTIONS, MOCK_INVITATIONS, MOCK_SUGGESTED_CONNECTIONS } from '@/data/mock';
import { cn } from '@/lib/utils';

const LIVE_ROOMS = [
  { name: 'AI in Product Management', host: 'Sarah K.', count: 18 },
  { name: 'Remote Leadership Forum', host: 'Mike L.', count: 24 },
];

const FOLLOW_UPS = [
  { name: 'Elena Vasquez', avatar: 'EV', reason: 'Post-event', due: 'Today' },
  { name: 'Marcus Johnson', avatar: 'MJ', reason: 'Speed match', due: 'Tomorrow' },
  { name: 'Priya Patel', avatar: 'PP', reason: 'Intro pending', due: 'In 3 days' },
];

const DIGITAL_CARDS = [
  { name: 'Professional Card', shared: 28, views: 142 },
  { name: 'Event Networking Card', shared: 8, views: 45 },
];

export const ConnectionsPopover: React.FC = () => {
  const [open, setOpen] = useState(false);
  const pendingCount = MOCK_INVITATIONS.length;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 relative">
          <Users className="h-4.5 w-4.5" />
          {pendingCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {pendingCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[420px] p-0" align="end" sideOffset={8}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">My Network</h3>
            <Badge variant="secondary" className="text-[8px] h-4">342 connections</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Link to="/networking/speed" className="text-[10px] text-accent hover:underline flex items-center gap-0.5" onClick={() => setOpen(false)}>
              <Zap className="h-3 w-3" /> Speed
            </Link>
          </div>
        </div>

        {/* Live Sessions Strip */}
        {LIVE_ROOMS.length > 0 && (
          <div className="px-4 py-2 border-b bg-[hsl(var(--state-live))]/5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Radio className="h-3 w-3 text-[hsl(var(--state-live))]" />
              <span className="text-[9px] font-bold">Live Now</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-live))] animate-pulse" />
            </div>
            <div className="flex gap-2">
              {LIVE_ROOMS.map((r, i) => (
                <Link key={i} to="/networking/rooms" onClick={() => setOpen(false)}
                  className="flex-1 p-2 rounded-lg border border-border/30 hover:border-accent/30 bg-card text-[9px] hover:bg-accent/5 transition-all">
                  <div className="font-medium">{r.name}</div>
                  <div className="text-muted-foreground">{r.host} · {r.count} people</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <Tabs defaultValue="requests" className="w-full">
          <TabsList className="w-full justify-start px-4 pt-2 bg-transparent gap-1">
            <TabsTrigger value="requests" className="text-[10px] h-6 gap-1 data-[state=active]:bg-accent/10">
              Invites
              {pendingCount > 0 && <Badge variant="destructive" className="text-[8px] px-1 py-0 h-3.5 min-w-3.5">{pendingCount}</Badge>}
            </TabsTrigger>
            <TabsTrigger value="connections" className="text-[10px] h-6">Connections</TabsTrigger>
            <TabsTrigger value="followups" className="text-[10px] h-6 gap-1">
              Follow-Ups
              <Badge className="text-[8px] px-1 h-3.5 bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))] border-0">{FOLLOW_UPS.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="cards" className="text-[10px] h-6">Cards</TabsTrigger>
            <TabsTrigger value="suggestions" className="text-[10px] h-6">Discover</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="max-h-[300px] overflow-y-auto">
            {MOCK_INVITATIONS.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">No pending requests</div>
            ) : (
              <div className="divide-y">
                {MOCK_INVITATIONS.map((inv) => (
                  <div key={inv.id} className="px-4 py-3 flex items-start gap-3 hover:bg-muted/30 transition-colors">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-accent/10 text-accent text-[10px]">{inv.user.name[0]}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-xs truncate">{inv.user.name}</div>
                      <div className="text-[10px] text-muted-foreground truncate">{inv.user.headline}</div>
                      <div className="text-[9px] text-muted-foreground">{inv.mutual} mutual</div>
                      {inv.message && (
                        <p className="text-[9px] text-muted-foreground bg-muted/50 rounded-md px-2 py-1 mt-1 line-clamp-2 italic">&ldquo;{inv.message}&rdquo;</p>
                      )}
                      <div className="flex gap-1.5 mt-2">
                        <Button size="sm" className="h-6 text-[10px] px-2 gap-1"><Check className="h-3 w-3" /> Accept</Button>
                        <Button size="sm" variant="outline" className="h-6 text-[10px] px-2 gap-1"><X className="h-3 w-3" /> Ignore</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="connections" className="max-h-[300px] overflow-y-auto">
            <div className="px-3 py-2">
              <div className="relative mb-2">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input placeholder="Search connections..." className="w-full h-7 rounded-md border bg-background pl-8 pr-3 text-xs focus:outline-none focus:ring-1 focus:ring-ring" />
              </div>
            </div>
            <div className="divide-y">
              {MOCK_CONNECTIONS.filter(c => c.connected).map((conn) => (
                <div key={conn.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-accent/10 text-accent text-[10px]">
                      {conn.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">{conn.user.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{conn.user.headline}</div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="followups" className="max-h-[300px] overflow-y-auto">
            <div className="divide-y">
              {FOLLOW_UPS.map((f, i) => (
                <div key={i} className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px] bg-muted">{f.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">{f.name}</div>
                    <div className="text-[10px] text-muted-foreground">{f.reason}</div>
                  </div>
                  <Badge className={`text-[8px] h-4 border-0 ${f.due === 'Today' ? 'bg-[hsl(var(--state-critical))]/10 text-[hsl(var(--state-critical))]' : 'bg-muted text-muted-foreground'}`}>{f.due}</Badge>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] px-2 gap-0.5 shrink-0">
                    <MessageSquare className="h-2.5 w-2.5" /> Reach Out
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="cards" className="max-h-[300px] overflow-y-auto p-4">
            <div className="space-y-2">
              {DIGITAL_CARDS.map((c, i) => (
                <div key={i} className="p-3 rounded-xl border border-border/30 bg-gradient-to-r from-accent/5 to-transparent hover:border-accent/30 transition-all">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold">{c.name}</span>
                    <CreditCard className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span>{c.shared} shared</span>
                    <span>{c.views} views</span>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Button variant="outline" size="sm" className="h-5 text-[8px] rounded-md flex-1">Share</Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[8px] rounded-md"><Eye className="h-2.5 w-2.5" /></Button>
                  </div>
                </div>
              ))}
              <Link to="/networking/cards" onClick={() => setOpen(false)}>
                <Button variant="ghost" size="sm" className="w-full h-7 text-[10px] gap-1 mt-1">
                  Manage All Cards <ArrowRight className="h-3 w-3" />
                </Button>
              </Link>
            </div>
          </TabsContent>

          <TabsContent value="suggestions" className="max-h-[300px] overflow-y-auto">
            <div className="divide-y">
              {MOCK_SUGGESTED_CONNECTIONS.map((s) => (
                <div key={s.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-muted/30 transition-colors">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-muted text-[10px]">{s.name[0]}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-xs truncate">{s.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{s.headline}</div>
                    <div className="text-[9px] text-muted-foreground">{s.mutual} mutual</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-6 text-[10px] px-2 gap-1 shrink-0">
                    <UserPlus className="h-3 w-3" /> Connect
                  </Button>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="border-t px-4 py-2.5 flex items-center justify-between gap-2 bg-muted/20">
          <Link to="/networking/connections" className="text-[10px] text-accent hover:underline flex items-center gap-1" onClick={() => setOpen(false)}>
            Connections <ArrowRight className="h-2.5 w-2.5" />
          </Link>
          <Link to="/networking/followers" className="text-[10px] text-muted-foreground hover:text-accent hover:underline flex items-center gap-1" onClick={() => setOpen(false)}>
            Followers <ArrowRight className="h-2.5 w-2.5" />
          </Link>
          <Link to="/networking/follow-ups" className="text-[10px] text-muted-foreground hover:text-accent hover:underline flex items-center gap-1" onClick={() => setOpen(false)}>
            Follow-Ups <ArrowRight className="h-2.5 w-2.5" />
          </Link>
          <Link to="/networking" className="text-[10px] text-muted-foreground hover:text-accent hover:underline flex items-center gap-1" onClick={() => setOpen(false)}>
            Hub <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};
