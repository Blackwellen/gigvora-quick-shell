import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Users, Wifi, Zap, Calendar, MessageSquare, UserPlus, ChevronRight,
  Globe, Radio, Star, Clock, TrendingUp, Sparkles, Heart, CreditCard,
  Handshake, BarChart3, Eye, MapPin, Briefcase, ArrowUpRight,
} from 'lucide-react';

const WORKBENCHES = [
  { label: 'Connections', icon: Users, path: '/networking/connections', desc: 'Manage your professional network', count: 342 },
  { label: 'Followers', icon: Star, path: '/networking/followers', desc: 'People following your activity', count: '1.2K' },
  { label: 'Following', icon: Heart, path: '/networking/following', desc: 'People and orgs you follow', count: 215 },
  { label: 'Digital Cards', icon: CreditCard, path: '/networking/cards', desc: 'Share and manage identity cards', count: 12 },
  { label: 'Follow-Up Center', icon: Clock, path: '/networking/follow-ups', desc: 'Track pending relationship actions', count: 5 },
  { label: 'Introductions', icon: Handshake, path: '/networking/introductions', desc: 'Request and manage warm intros' },
  { label: 'Suggestions', icon: Sparkles, path: '/networking/suggestions', desc: 'AI-powered connection recommendations' },
  { label: 'Collaboration', icon: Globe, path: '/networking/collaboration', desc: 'Find project collaborators' },
  { label: 'Rooms', icon: Radio, path: '/networking/rooms', desc: 'Live networking rooms', count: 4, live: true },
  { label: 'Speed Networking', icon: Zap, path: '/networking/speed', desc: 'Timed 1:1 intro sessions' },
  { label: 'Events', icon: Calendar, path: '/events', desc: 'Discover and host events', count: 12 },
  { label: 'Analytics', icon: BarChart3, path: '/networking/analytics', desc: 'Network growth and insights' },
];

const PENDING_INVITES = [
  { name: 'Elena Vasquez', avatar: 'EV', headline: 'VP Eng @ Cloudflare', mutual: 24, message: "Hi! We met at the SaaS conference last week." },
  { name: 'Raj Krishnan', avatar: 'RK', headline: 'Principal Architect @ AWS', mutual: 18 },
  { name: 'Sophie Larsson', avatar: 'SL', headline: 'Head of Design @ Canva', mutual: 11, message: 'Love your recent work on design systems!' },
];

const RELATIONSHIP_STREAM = [
  { name: 'Maya Chen', avatar: 'MC', action: 'accepted your connection request', time: '12 min ago', type: 'connection' as const },
  { name: 'James Rivera', avatar: 'JR', action: 'started following you', time: '2h ago', type: 'follow' as const },
  { name: 'Aisha Patel', avatar: 'AP', action: 'shared a digital card with you', time: '4h ago', type: 'card' as const },
  { name: 'Leo Tanaka', avatar: 'LT', action: 'requested an introduction to Sarah Chen', time: '6h ago', type: 'intro' as const },
  { name: 'Sara Kim', avatar: 'SK', action: 'joined your networking room "AI Leaders"', time: '1d ago', type: 'room' as const },
  { name: 'David Park', avatar: 'DP', action: 'endorsed your React skills', time: '1d ago', type: 'endorse' as const },
  { name: 'Ana Torres', avatar: 'AT', action: 'commented on your project proposal', time: '2d ago', type: 'collab' as const },
];

const FOLLOW_UP_QUEUE = [
  { name: 'Elena Vasquez', avatar: 'EV', reason: 'Post-event follow-up', due: 'Today', priority: 'high' as const },
  { name: 'Marcus Johnson', avatar: 'MJ', reason: 'Speed networking match', due: 'Tomorrow', priority: 'medium' as const },
  { name: 'Priya Patel', avatar: 'PP', reason: 'Intro request pending', due: 'In 3 days', priority: 'low' as const },
];

const TYPE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  connection: Users, follow: Star, card: CreditCard, intro: Handshake,
  room: Radio, endorse: Heart, collab: Globe,
};

export default function NetworkingHomePage() {
  const navigate = useNavigate();

  return (
    <NetworkShell>
      {/* KPI Strip */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3.5 shadow-card mb-4">
        <Wifi className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Networking Hub</h1>
        <KPICard label="Connections" value="342" change="+12 this week" trend="up" />
        <KPICard label="Followers" value="1.2K" change="+48" trend="up" />
        <KPICard label="Pending" value="5" />
        <KPICard label="Follow-Ups" value="3" change="Due today" trend="neutral" />
        <KPICard label="Cards Shared" value="28" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left Column — Main content */}
        <div className="xl:col-span-2 space-y-4">
          {/* Pending Invitations Preview */}
          {PENDING_INVITES.length > 0 && (
            <SectionCard title="Pending Invitations" icon={<Handshake className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />}
              action={<Link to="/networking/invitations"><Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1">View All <ChevronRight className="h-2.5 w-2.5" /></Button></Link>}
            >
              <div className="space-y-2">
                {PENDING_INVITES.map((inv, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="text-xs bg-accent/10 text-accent">{inv.avatar}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold">{inv.name}</div>
                      <div className="text-[10px] text-muted-foreground">{inv.headline}</div>
                      <div className="text-[9px] text-muted-foreground">{inv.mutual} mutual connections</div>
                      {inv.message && (
                        <p className="text-[9px] text-muted-foreground bg-muted/40 rounded-lg px-2 py-1 mt-1 italic">&ldquo;{inv.message}&rdquo;</p>
                      )}
                    </div>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-7 text-[9px] rounded-xl">Accept</Button>
                      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Ignore</Button>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
          )}

          {/* Workbenches */}
          <SectionCard title="Workbenches">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
              {WORKBENCHES.map(wb => (
                <button key={wb.label} onClick={() => navigate(wb.path)}
                  className="flex items-start gap-2.5 p-3 rounded-xl border border-border/40 hover:border-accent/30 hover:bg-accent/5 transition-all text-left group">
                  <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <wb.icon className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold">{wb.label}</span>
                      {wb.count && <Badge variant="secondary" className="text-[7px] h-3.5 px-1">{wb.count}</Badge>}
                      {(wb as any).live && <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-live))] animate-pulse" />}
                    </div>
                    <p className="text-[8px] text-muted-foreground mt-0.5 line-clamp-1">{wb.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Relationship Stream */}
          <SectionCard title="Relationship Activity" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-0.5">
              {RELATIONSHIP_STREAM.map((a, i) => {
                const Icon = TYPE_ICONS[a.type] || MessageSquare;
                return (
                  <div key={i} className="flex items-center gap-2.5 py-2 border-b border-border/20 last:border-0">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="text-[8px] bg-muted">{a.avatar}</AvatarFallback>
                    </Avatar>
                    <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px]">
                        <span className="font-semibold">{a.name}</span>{' '}
                        <span className="text-muted-foreground">{a.action}</span>
                      </span>
                    </div>
                    <span className="text-[8px] text-muted-foreground shrink-0">{a.time}</span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Follow-Up Queue */}
          <SectionCard title="Follow-Up Queue" icon={<Clock className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />}
            action={<Link to="/networking/follow-ups"><Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1">All <ChevronRight className="h-2.5 w-2.5" /></Button></Link>}
          >
            <div className="space-y-2">
              {FOLLOW_UP_QUEUE.map((f, i) => (
                <div key={i} className="flex items-center gap-2.5 p-2.5 rounded-xl border border-border/30">
                  <Avatar className="h-7 w-7">
                    <AvatarFallback className="text-[8px] bg-muted">{f.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold">{f.name}</div>
                    <div className="text-[8px] text-muted-foreground">{f.reason}</div>
                  </div>
                  <div className="text-right">
                    <Badge className={`text-[7px] h-3.5 border-0 ${f.priority === 'high' ? 'bg-[hsl(var(--state-critical))]/10 text-[hsl(var(--state-critical))]' : f.priority === 'medium' ? 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]' : 'bg-muted text-muted-foreground'}`}>
                      {f.due}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Network Growth */}
          <SectionCard title="Network Growth" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-2.5">
              {[
                { label: 'Connection Rate', value: '72%', bar: 72 },
                { label: 'Response Rate', value: '85%', bar: 85 },
                { label: 'Follow-Up Completion', value: '60%', bar: 60 },
                { label: 'Intro Success', value: '48%', bar: 48 },
              ].map((m, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] text-muted-foreground">{m.label}</span>
                    <span className="text-[9px] font-semibold">{m.value}</span>
                  </div>
                  <Progress value={m.bar} className="h-1.5" />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Digital Cards Preview */}
          <SectionCard title="My Digital Cards" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />}
            action={<Link to="/networking/cards"><Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1">Manage <ChevronRight className="h-2.5 w-2.5" /></Button></Link>}
          >
            <div className="space-y-2">
              {[
                { title: 'Professional Card', shared: 28, views: 142 },
                { title: 'Event Card', shared: 8, views: 45 },
              ].map((c, i) => (
                <div key={i} className="p-2.5 rounded-xl border border-border/30 bg-gradient-to-r from-accent/5 to-transparent">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold">{c.title}</span>
                    <Badge variant="outline" className="text-[7px] h-3.5">{c.shared} shared</Badge>
                  </div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">{c.views} views</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </NetworkShell>
  );
}
