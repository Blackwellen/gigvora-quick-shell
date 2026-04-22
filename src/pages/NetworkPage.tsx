import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Search, UserPlus, Check, X, Users, MessageSquare,
  Star, CheckCircle2, Shield, ExternalLink, MoreHorizontal,
  TrendingUp, Sparkles, Loader2, Globe, Heart, Mail,
  MapPin, Eye, Lock, CircleDot, UserMinus, Flag, BellOff,
  RefreshCw, ArrowRight, ChevronRight, Briefcase, Layers,
  Activity, Hash, Calendar, Clock, Send, Link2,
} from 'lucide-react';
import { MOCK_CONNECTIONS, MOCK_INVITATIONS, MOCK_SUGGESTED_CONNECTIONS, MOCK_USERS, type MockUser } from '@/data/mock';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type ViewTab = 'connections' | 'invitations' | 'followers' | 'following' | 'suggestions' | 'blocked';
type DegreeFilter = 'all' | '1st' | '2nd' | '3rd';
type SortOption = 'recent' | 'name' | 'mutual' | 'strength';

interface ConnectionDetail {
  id: string;
  user: MockUser | { id: string; name: string; headline: string; role: 'client' | 'professional' | 'enterprise' };
  mutual: number;
  connected: boolean;
  degree?: '1st' | '2nd' | '3rd';
  strength?: 'strong' | 'growing' | 'new';
  connectedSince?: string;
  lastInteraction?: string;
  skills?: string[];
  location?: string;
}

const VIEW_TABS: { id: ViewTab; label: string; icon: React.ElementType; count?: number }[] = [
  { id: 'connections', label: 'Connections', icon: Users, count: 85 },
  { id: 'invitations', label: 'Invitations', icon: UserPlus, count: MOCK_INVITATIONS.length },
  { id: 'followers', label: 'Followers', icon: Heart, count: 234 },
  { id: 'following', label: 'Following', icon: Eye, count: 156 },
  { id: 'suggestions', label: 'Suggestions', icon: Sparkles, count: 42 },
  { id: 'blocked', label: 'Blocked', icon: Shield, count: 2 },
];

const DEGREE_FILTERS: { id: DegreeFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: '1st', label: '1st Degree' },
  { id: '2nd', label: '2nd Degree' },
  { id: '3rd', label: '3rd Degree' },
];

const ENRICHED_CONNECTIONS: ConnectionDetail[] = MOCK_CONNECTIONS.map((c, i) => ({
  ...c,
  degree: (i < 4 ? '1st' : i < 6 ? '2nd' : '3rd') as '1st' | '2nd' | '3rd',
  strength: (i < 2 ? 'strong' : i < 5 ? 'growing' : 'new') as 'strong' | 'growing' | 'new',
  connectedSince: ['Jan 2025', 'Mar 2025', 'Nov 2024', 'Jun 2024', 'Feb 2025', 'Apr 2025', 'Dec 2024', 'Sep 2024'][i],
  lastInteraction: ['2h ago', '1d ago', '3d ago', '1w ago', '2d ago', '5d ago', '2w ago', '1m ago'][i],
  skills: [['React', 'Design'], ['Hiring', 'Talent'], ['Node.js', 'Python'], ['AI', 'Strategy'], ['Marketing', 'SEO'], ['DevOps', 'AWS'], ['UX', 'Research'], ['Content', 'Video']][i],
  location: ['San Francisco', 'New York', 'London', 'Singapore', 'Mumbai', 'Berlin', 'Seattle', 'Toronto'][i],
}));

const MOCK_FOLLOWERS = MOCK_USERS.slice(2, 7).map((u, i) => ({
  id: `fol-${i}`, user: u, followedAt: ['1d ago', '3d ago', '1w ago', '2w ago', '1m ago'][i], followBack: i < 2,
}));

const MOCK_FOLLOWING = MOCK_USERS.slice(0, 5).map((u, i) => ({
  id: `fing-${i}`, user: u, followedAt: ['2d ago', '5d ago', '2w ago', '1m ago', '3m ago'][i],
}));

const MOCK_BLOCKED = [
  { id: 'bl1', name: 'Spam Account', headline: 'Unknown', blockedAt: '2 weeks ago', reason: 'Spam messages' },
  { id: 'bl2', name: 'John Doe', headline: 'Marketing', blockedAt: '1 month ago', reason: 'Harassment' },
];

const STRENGTH_STYLE: Record<string, string> = {
  strong: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0',
  growing: 'bg-accent/10 text-accent border-0',
  new: 'bg-muted text-muted-foreground border-0',
};

const DEGREE_RING: Record<string, string> = {
  '1st': 'ring-[hsl(var(--state-healthy))]',
  '2nd': 'ring-accent',
  '3rd': 'ring-muted-foreground/30',
};

/* ═══════════════════════════════════════════════════════════
   Connection Row — rounded-2xl, richer avatar
   ═══════════════════════════════════════════════════════════ */
const ConnectionRow: React.FC<{
  conn: ConnectionDetail;
  onSelect: () => void;
}> = ({ conn, onSelect }) => {
  const initials = conn.user.name.split(' ').map(n => n[0]).join('');
  return (
    <div onClick={onSelect} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/30 hover:shadow-sm transition-all duration-200 cursor-pointer group">
      <div className="relative shrink-0">
        <Avatar className={cn('h-10 w-10 ring-2 transition-transform group-hover:scale-105', conn.degree ? DEGREE_RING[conn.degree] : 'ring-muted/50')}>
          <AvatarFallback className="bg-accent/10 text-accent text-[10px] font-bold">{initials}</AvatarFallback>
        </Avatar>
        {conn.degree === '1st' && (
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-[hsl(var(--state-healthy))] flex items-center justify-center ring-2 ring-card">
            <Check className="h-2 w-2 text-white" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{conn.user.name}</span>
          {'verified' in conn.user && conn.user.verified && <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />}
          {conn.degree && <Badge variant="secondary" className="text-[7px] h-3.5 px-1.5 rounded-lg">{conn.degree}</Badge>}
        </div>
        <div className="text-[9px] text-muted-foreground truncate">{conn.user.headline}</div>
        <div className="flex items-center gap-2 mt-0.5 text-[8px] text-muted-foreground">
          {conn.location && <span className="flex items-center gap-0.5"><MapPin className="h-2 w-2" />{conn.location}</span>}
          <span>{conn.mutual} mutual</span>
          {conn.lastInteraction && <span>· {conn.lastInteraction}</span>}
        </div>
      </div>
      {conn.skills && conn.skills.length > 0 && (
        <div className="hidden md:flex gap-1 shrink-0">
          {conn.skills.slice(0, 2).map(s => (
            <span key={s} className="text-[8px] px-1.5 py-0.5 rounded-lg bg-muted text-muted-foreground">{s}</span>
          ))}
        </div>
      )}
      {conn.strength && <Badge className={cn('text-[7px] h-3.5 capitalize rounded-lg', STRENGTH_STYLE[conn.strength])}>{conn.strength}</Badge>}
      <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MessageSquare className="h-3 w-3" /></Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3 w-3" /></Button>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Invitation Row
   ═══════════════════════════════════════════════════════════ */
const InvitationRow: React.FC<{ inv: typeof MOCK_INVITATIONS[0] }> = ({ inv }) => (
  <div className="flex items-start gap-3 p-3 rounded-2xl border hover:bg-muted/30 hover:shadow-sm transition-all duration-200 group">
    <div className="relative shrink-0">
      <Avatar className="h-10 w-10 ring-2 ring-accent/30 transition-transform group-hover:scale-105">
        <AvatarFallback className="bg-accent/10 text-accent text-[10px] font-bold">{inv.user.name[0]}</AvatarFallback>
      </Avatar>
    </div>
    <div className="flex-1 min-w-0">
      <div className="text-[11px] font-bold">{inv.user.name}</div>
      <div className="text-[9px] text-muted-foreground">{inv.user.headline}</div>
      <div className="text-[8px] text-muted-foreground mt-0.5">{inv.mutual} mutual connections</div>
      {inv.message && (
        <p className="text-[9px] text-muted-foreground bg-muted/50 rounded-xl px-2.5 py-1.5 mt-1.5 italic">"{inv.message}"</p>
      )}
    </div>
    <div className="flex gap-1.5 shrink-0">
      <Button size="sm" className="h-7 text-[9px] px-3 rounded-xl gap-1"><Check className="h-2.5 w-2.5" />Accept</Button>
      <Button size="sm" variant="outline" className="h-7 text-[9px] px-2.5 rounded-xl"><X className="h-2.5 w-2.5" /></Button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Suggestion Card — rounded-2xl, hover lift
   ═══════════════════════════════════════════════════════════ */
const SuggestionCard: React.FC<{ s: typeof MOCK_SUGGESTED_CONNECTIONS[0] }> = ({ s }) => (
  <div className="rounded-2xl border p-3.5 text-center hover:bg-muted/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
    <div className="relative mx-auto w-fit mb-2">
      <Avatar className="h-12 w-12 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
        <AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{s.name[0]}</AvatarFallback>
      </Avatar>
    </div>
    <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{s.name}</div>
    <div className="text-[9px] text-muted-foreground truncate mb-0.5">{s.headline}</div>
    <div className="flex items-center justify-center gap-1 text-[8px] text-muted-foreground mb-2.5">
      <div className="flex -space-x-1">
        {['A', 'B'].map(l => (
          <div key={l} className="h-3.5 w-3.5 rounded-full bg-muted border border-card flex items-center justify-center text-[6px] font-bold">{l}</div>
        ))}
      </div>
      <span>{s.mutual} mutual</span>
    </div>
    <div className="flex gap-1.5">
      <Button size="sm" variant="outline" className="flex-1 h-7 text-[9px] rounded-xl gap-1"><UserPlus className="h-2.5 w-2.5" />Connect</Button>
      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 rounded-xl"><Heart className="h-2.5 w-2.5" /></Button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Profile Inspector Drawer — rounded-2xl
   ═══════════════════════════════════════════════════════════ */
const ProfileInspector: React.FC<{
  conn: ConnectionDetail | null;
  onClose: () => void;
}> = ({ conn, onClose }) => {
  if (!conn) return null;
  const initials = conn.user.name.split(' ').map(n => n[0]).join('');
  return (
    <Sheet open={!!conn} onOpenChange={() => onClose()}>
      <SheetContent className="w-[380px] sm:w-[420px] overflow-y-auto p-0">
        <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm font-bold">Profile</SheetTitle></SheetHeader>
        <div className="p-4 space-y-4">
          {/* Cover + Avatar */}
          <div className="rounded-2xl overflow-hidden">
            <div className="h-20 bg-gradient-to-r from-accent/10 via-[hsl(var(--gigvora-blue)/0.08)] to-accent/5" />
            <div className="px-4 pb-4 -mt-8">
              <Avatar className={cn('h-16 w-16 ring-4 ring-card shadow-sm', conn.degree ? DEGREE_RING[conn.degree] : '')}>
                <AvatarFallback className="bg-accent/10 text-accent text-lg font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="mt-2">
                <div className="text-sm font-bold flex items-center gap-1.5">
                  {conn.user.name}
                  {'verified' in conn.user && conn.user.verified && <CheckCircle2 className="h-3.5 w-3.5 text-accent" />}
                </div>
                <div className="text-[11px] text-muted-foreground">{conn.user.headline}</div>
                <div className="flex items-center gap-2 mt-1.5">
                  {conn.degree && <Badge variant="secondary" className="text-[8px] rounded-lg">{conn.degree} degree</Badge>}
                  {conn.strength && <Badge className={cn('text-[8px] capitalize rounded-lg', STRENGTH_STYLE[conn.strength])}>{conn.strength}</Badge>}
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-1.5">
            <Button variant="outline" size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
            <Button variant="outline" size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1"><Mail className="h-2.5 w-2.5" />Email</Button>
            <Button size="sm" className="flex-1 text-[9px] h-7 rounded-xl gap-1" asChild>
              <Link to={`/profile/${conn.user.id || conn.id}`}><ExternalLink className="h-2.5 w-2.5" />Profile</Link>
            </Button>
          </div>

          {/* Details */}
          <SectionCard title="Details" className="!rounded-2xl">
            <div className="space-y-2 text-[10px]">
              {conn.location && <div className="flex justify-between"><span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-2.5 w-2.5" />Location</span><span className="font-semibold">{conn.location}</span></div>}
              <div className="flex justify-between"><span className="text-muted-foreground">Mutual</span><span className="font-semibold">{conn.mutual} connections</span></div>
              {conn.connectedSince && <div className="flex justify-between"><span className="text-muted-foreground">Connected</span><span className="font-semibold">{conn.connectedSince}</span></div>}
              {conn.lastInteraction && <div className="flex justify-between"><span className="text-muted-foreground">Last Active</span><span className="font-semibold">{conn.lastInteraction}</span></div>}
            </div>
          </SectionCard>

          {/* Skills */}
          {conn.skills && conn.skills.length > 0 && (
            <SectionCard title="Skills" className="!rounded-2xl">
              <div className="flex flex-wrap gap-1.5">
                {conn.skills.map(s => <Badge key={s} variant="secondary" className="text-[9px] rounded-xl">{s}</Badge>)}
              </div>
            </SectionCard>
          )}

          {/* Mutual Connections */}
          <SectionCard title="Mutual Connections" subtitle={`${conn.mutual} shared`} className="!rounded-2xl">
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {['S', 'K', 'M'].map(l => (
                  <Avatar key={l} className="h-7 w-7 ring-2 ring-card">
                    <AvatarFallback className="text-[8px] bg-muted font-bold">{l}</AvatarFallback>
                  </Avatar>
                ))}
              </div>
              <span className="text-[9px] text-muted-foreground">and {conn.mutual - 3} more</span>
            </div>
          </SectionCard>

          {/* Relationship Actions */}
          <SectionCard title="Relationship" className="!rounded-2xl">
            <div className="space-y-0.5">
              {[
                { icon: Star, label: 'Add to Favorites', color: '' },
                { icon: BellOff, label: 'Mute Updates', color: '' },
                { icon: UserMinus, label: 'Remove Connection', color: 'text-[hsl(var(--state-caution))]' },
                { icon: Flag, label: 'Report', color: 'text-muted-foreground' },
                { icon: Shield, label: 'Block', color: 'text-[hsl(var(--state-blocked))]' },
              ].map(a => (
                <button key={a.label} className={cn('flex items-center gap-2.5 w-full px-2.5 py-1.5 rounded-xl text-[10px] hover:bg-muted/50 transition-colors', a.color)}>
                  <a.icon className="h-3 w-3" />{a.label}
                </button>
              ))}
            </div>
          </SectionCard>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   State Banners
   ═══════════════════════════════════════════════════════════ */
const NoInvitationsState: React.FC = () => (
  <div className="flex flex-col items-center py-10 text-center">
    <div className="h-14 w-14 rounded-3xl bg-muted/50 flex items-center justify-center mb-3">
      <UserPlus className="h-6 w-6 text-muted-foreground/20" />
    </div>
    <div className="text-[11px] font-bold">No pending invitations</div>
    <div className="text-[10px] text-muted-foreground mt-0.5">When someone sends you a connection request, it will appear here.</div>
  </div>
);

const DiscoveryRestrictedBanner: React.FC = () => (
  <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3.5 flex items-center gap-3 mb-3">
    <div className="h-8 w-8 rounded-xl bg-[hsl(var(--state-caution)/0.1)] flex items-center justify-center shrink-0">
      <Lock className="h-4 w-4 text-[hsl(var(--state-caution))]" />
    </div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Discovery restricted</div>
      <div className="text-[10px] text-muted-foreground">Your profile visibility limits suggestions. Update privacy settings to expand reach.</div>
    </div>
    <Button variant="ghost" size="sm" className="h-7 text-[10px] px-2.5 rounded-xl" asChild>
      <Link to="/settings">Settings</Link>
    </Button>
  </div>
);

const EmptyNetworkState: React.FC = () => (
  <div className="text-center py-14 rounded-3xl border bg-card">
    <div className="h-16 w-16 rounded-3xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
      <Users className="h-7 w-7 text-muted-foreground/20" />
    </div>
    <div className="text-sm font-bold">Your network is small</div>
    <p className="text-[11px] text-muted-foreground mt-1.5 max-w-sm mx-auto leading-relaxed">
      Start building your professional network by connecting with colleagues and discovering new people.
    </p>
    <div className="flex justify-center gap-2 mt-5">
      <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl gap-1.5"><Search className="h-3 w-3" />Find People</Button>
      <Button size="sm" className="text-[10px] h-8 rounded-xl gap-1.5"><UserPlus className="h-3 w-3" />Invite Contacts</Button>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const NetworkPage: React.FC = () => {
  const [viewTab, setViewTab] = useState<ViewTab>('connections');
  const [degreeFilter, setDegreeFilter] = useState<DegreeFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConn, setSelectedConn] = useState<ConnectionDetail | null>(null);

  const { loading: aiLoading, invoke: aiInvoke, result: aiResult } = useAI({ type: 'smart-match' });

  const filteredConnections = useMemo(() => {
    let list = ENRICHED_CONNECTIONS;
    if (viewTab === 'connections') list = list.filter(c => c.connected);
    if (degreeFilter !== 'all') list = list.filter(c => c.degree === degreeFilter);
    if (searchQuery) list = list.filter(c => c.user.name.toLowerCase().includes(searchQuery.toLowerCase()) || c.user.headline.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === 'name') list = [...list].sort((a, b) => a.user.name.localeCompare(b.user.name));
    if (sortBy === 'mutual') list = [...list].sort((a, b) => b.mutual - a.mutual);
    return list;
  }, [viewTab, degreeFilter, searchQuery, sortBy]);

  const getAISuggestions = async () => {
    await aiInvoke({
      action: 'connection-suggestions',
      currentNetwork: ENRICHED_CONNECTIONS.slice(0, 3).map(c => ({ name: c.user.name, skills: c.skills })),
      goals: ['expand network', 'find collaborators'],
    });
  };

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center">
          <Users className="h-3.5 w-3.5 text-accent" />
        </div>
        <span className="text-xs font-bold">Network</span>
        <Badge className="bg-accent text-accent-foreground text-[8px] h-4 px-1.5 rounded-lg">{MOCK_INVITATIONS.length} pending</Badge>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <div className="hidden sm:flex items-center gap-1.5 rounded-xl bg-[hsl(var(--state-healthy)/0.05)] px-2.5 py-1 text-[9px] text-muted-foreground">
          <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
          <span>Live · synced</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1" onClick={getAISuggestions} disabled={aiLoading}>
          {aiLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}AI Match
        </Button>
        <Link to="/networking">
          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Globe className="h-3 w-3" />Hub</Button>
        </Link>
        <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><UserPlus className="h-3 w-3" />Invite</Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Connections" value={85} change="+8 this month" trend="up" className="!rounded-2xl" />
        <KPICard label="Followers" value={234} change="+22 this month" trend="up" className="!rounded-2xl" />
      </div>

      {/* Relationship Strength */}
      <SectionCard title="Relationship Strength" className="!rounded-2xl">
        <div className="space-y-2">
          {[
            { label: 'Strong', count: 12, color: 'bg-[hsl(var(--state-healthy))]', pct: 14 },
            { label: 'Growing', count: 28, color: 'bg-accent', pct: 33 },
            { label: 'New', count: 45, color: 'bg-muted-foreground', pct: 53 },
          ].map(s => (
            <div key={s.label}>
              <div className="flex items-center gap-2 text-[10px] mb-1">
                <div className={cn('h-2 w-2 rounded-full', s.color)} />
                <span className="flex-1 text-muted-foreground">{s.label}</span>
                <span className="font-bold">{s.count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div className={cn('h-full rounded-full transition-all', s.color)} style={{ width: `${s.pct}%` }} />
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* AI Suggestions */}
      {aiResult && (
        <SectionCard title="AI Insights" className="!rounded-2xl">
          <p className="text-[10px] text-muted-foreground whitespace-pre-line">{aiResult}</p>
        </SectionCard>
      )}

      {/* Network Growth */}
      <SectionCard title="Growth" subtitle="Last 30 days" className="!rounded-2xl">
        <div className="space-y-2 text-[10px]">
          {[
            { label: 'New Connections', value: '+8', color: 'text-[hsl(var(--state-healthy))]' },
            { label: 'New Followers', value: '+22', color: 'text-[hsl(var(--state-healthy))]' },
            { label: 'Profile Views', value: '156', color: '' },
            { label: 'Search Appearances', value: '89', color: '' },
          ].map(s => (
            <div key={s.label} className="flex justify-between py-1 border-b border-transparent last:border-0">
              <span className="text-muted-foreground">{s.label}</span>
              <span className={cn('font-bold', s.color)}>{s.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Quick Interests */}
      <SectionCard title="Your Interests" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1.5">
          {['React', 'TypeScript', 'AI', 'Design', 'Startups', 'Remote'].map(t => (
            <span key={t} className="text-[9px] px-2 py-0.5 rounded-xl border cursor-pointer hover:bg-accent/10 hover:border-accent/30 hover:text-accent transition-all font-medium">{t}</span>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><Activity className="h-3.5 w-3.5 text-accent" />Network Activity</span>
        <span className="text-[10px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Requests Sent', value: '4' },
          { label: 'Requests Received', value: '7' },
          { label: 'Messages Exchanged', value: '32' },
          { label: 'Profiles Viewed', value: '19' },
          { label: 'Introductions', value: '3' },
        ].map(s => (
          <div key={s.label} className="text-center rounded-2xl border p-3 hover:shadow-sm transition-shadow">
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={bottomSection}>
      {/* View Tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
        {VIEW_TABS.map(t => (
          <button key={t.id} onClick={() => setViewTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
            viewTab === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
            {t.count !== undefined && <span className="ml-0.5 text-[8px] opacity-70 tabular-nums">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── CONNECTIONS TAB ── */}
      {viewTab === 'connections' && (
        <div className="space-y-2.5">
          {/* Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 max-w-[260px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search connections..." className="w-full h-8 rounded-xl border bg-background pl-8 pr-3 text-[10px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
            </div>
            <div className="flex gap-1">
              {DEGREE_FILTERS.map(d => (
                <button key={d.id} onClick={() => setDegreeFilter(d.id)} className={cn(
                  'px-2.5 py-1 text-[9px] rounded-xl font-medium transition-all',
                  degreeFilter === d.id ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
                )}>{d.label}</button>
              ))}
            </div>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="h-7 text-[9px] rounded-xl border bg-background px-2 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all">
              <option value="recent">Recent</option>
              <option value="name">Name</option>
              <option value="mutual">Mutual</option>
              <option value="strength">Strength</option>
            </select>
          </div>

          {/* Count */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] text-muted-foreground">{filteredConnections.length} connections</span>
            <Button variant="ghost" size="sm" className="text-[9px] h-6 rounded-lg text-muted-foreground gap-1"><RefreshCw className="h-2.5 w-2.5" />Refresh</Button>
          </div>

          {/* List */}
          {filteredConnections.length === 0 ? (
            <EmptyNetworkState />
          ) : (
            <div className="space-y-1.5">
              {filteredConnections.map(c => (
                <ConnectionRow key={c.id} conn={c} onSelect={() => setSelectedConn(c)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── INVITATIONS TAB ── */}
      {viewTab === 'invitations' && (
        <SectionCard title="Pending Invitations" subtitle={`${MOCK_INVITATIONS.length} requests`} className="!rounded-2xl">
          {MOCK_INVITATIONS.length === 0 ? (
            <NoInvitationsState />
          ) : (
            <div className="space-y-2">
              {MOCK_INVITATIONS.map(inv => <InvitationRow key={inv.id} inv={inv} />)}
            </div>
          )}
        </SectionCard>
      )}

      {/* ── FOLLOWERS TAB ── */}
      {viewTab === 'followers' && (
        <SectionCard title="Followers" subtitle={`${MOCK_FOLLOWERS.length} people follow you`} className="!rounded-2xl">
          <div className="space-y-1.5">
            {MOCK_FOLLOWERS.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-2xl border hover:bg-muted/30 hover:shadow-sm transition-all duration-200 group">
                <Avatar className="h-9 w-9 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
                  <AvatarFallback className="bg-accent/10 text-accent text-[9px] font-bold">{f.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{f.user.name}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{f.user.headline}</div>
                </div>
                <span className="text-[8px] text-muted-foreground shrink-0">{f.followedAt}</span>
                <Button variant={f.followBack ? 'secondary' : 'outline'} size="sm" className="h-7 text-[9px] shrink-0 rounded-xl">
                  {f.followBack ? <><Check className="h-2.5 w-2.5 mr-0.5" />Following</> : 'Follow Back'}
                </Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── FOLLOWING TAB ── */}
      {viewTab === 'following' && (
        <SectionCard title="Following" subtitle={`You follow ${MOCK_FOLLOWING.length} people`} className="!rounded-2xl">
          <div className="space-y-1.5">
            {MOCK_FOLLOWING.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-2.5 rounded-2xl border hover:bg-muted/30 hover:shadow-sm transition-all duration-200 group">
                <Avatar className="h-9 w-9 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
                  <AvatarFallback className="bg-accent/10 text-accent text-[9px] font-bold">{f.user.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{f.user.name}</div>
                  <div className="text-[9px] text-muted-foreground truncate">{f.user.headline}</div>
                </div>
                <span className="text-[8px] text-muted-foreground shrink-0">{f.followedAt}</span>
                <Button variant="secondary" size="sm" className="h-7 text-[9px] shrink-0 rounded-xl"><Check className="h-2.5 w-2.5 mr-0.5" />Following</Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── SUGGESTIONS TAB ── */}
      {viewTab === 'suggestions' && (
        <div className="space-y-3">
          <DiscoveryRestrictedBanner />
          <SectionCard title="People You May Know" subtitle="Based on your network" className="!rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
              {[...MOCK_SUGGESTED_CONNECTIONS, ...MOCK_CONNECTIONS.filter(c => !c.connected).map(c => ({
                id: c.id, name: c.user.name, headline: c.user.headline, mutual: c.mutual, avatar: undefined,
              }))].map(s => <SuggestionCard key={s.id} s={s} />)}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── BLOCKED TAB ── */}
      {viewTab === 'blocked' && (
        <SectionCard title="Blocked Contacts" subtitle={`${MOCK_BLOCKED.length} blocked`} className="!rounded-2xl">
          {MOCK_BLOCKED.length === 0 ? (
            <div className="flex flex-col items-center py-10 text-center">
              <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mb-3">
                <Shield className="h-5 w-5 text-muted-foreground/20" />
              </div>
              <div className="text-[11px] text-muted-foreground">No blocked contacts</div>
            </div>
          ) : (
            <div className="space-y-1.5">
              {MOCK_BLOCKED.map(b => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/30 transition-all">
                  <Avatar className="h-9 w-9"><AvatarFallback className="bg-muted text-muted-foreground text-[9px] font-bold">{b.name[0]}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold">{b.name}</div>
                    <div className="text-[9px] text-muted-foreground">Blocked {b.blockedAt} · {b.reason}</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] shrink-0 rounded-xl">Unblock</Button>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      )}

      {/* Profile Inspector */}
      <ProfileInspector conn={selectedConn} onClose={() => setSelectedConn(null)} />
    </DashboardLayout>
  );
};

export default NetworkPage;
