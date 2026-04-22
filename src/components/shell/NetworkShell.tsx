import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import {
  Users, UserPlus, Star, Radio, Zap, Calendar,
  Globe, MessageSquare, BarChart3, CreditCard, Handshake,
  Heart, Sparkles, Wifi, Clock, Eye, ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const NAV_SECTIONS = [
  {
    title: 'Network',
    items: [
      { label: 'Hub', href: '/networking', icon: Wifi },
      { label: 'Connections', href: '/networking/connections', icon: Users, count: 342 },
      { label: 'Followers', href: '/networking/followers', icon: Star, count: '1.2K' },
      { label: 'Following', href: '/networking/following', icon: Heart },
      { label: 'Suggestions', href: '/networking/suggestions', icon: Sparkles },
      { label: 'Invitations', href: '/networking/invitations', icon: Handshake, count: 5 },
    ],
  },
  {
    title: 'Engage',
    items: [
      { label: 'Digital Cards', href: '/networking/cards', icon: CreditCard },
      { label: 'Follow-Up Center', href: '/networking/follow-ups', icon: Clock },
      { label: 'Introductions', href: '/networking/introductions', icon: UserPlus },
      { label: 'Collaboration', href: '/networking/collaboration', icon: Globe },
    ],
  },
  {
    title: 'Live',
    items: [
      { label: 'Rooms', href: '/networking/rooms', icon: Radio, live: true },
      { label: 'Speed Networking', href: '/networking/speed', icon: Zap },
      { label: 'Sessions', href: '/networking/sessions', icon: Calendar },
    ],
  },
  {
    title: 'Insights',
    items: [
      { label: 'Analytics', href: '/networking/analytics', icon: BarChart3 },
    ],
  },
];

const LIVE_SESSIONS = [
  { name: 'AI in Product Management', host: 'Sarah K.', count: 18 },
  { name: 'Remote Work Leaders', host: 'Mike L.', count: 24 },
];

const COLLAB_PROMPTS = [
  { text: 'Maya Chen shared a project looking for collaborators', time: '2h ago' },
  { text: 'Speed networking: 3 unresponded follow-ups', time: '4h ago' },
];

interface NetworkShellProps {
  children: React.ReactNode;
  backLabel?: string;
  backRoute?: string;
  rightPanel?: React.ReactNode;
}

export const NetworkShell: React.FC<NetworkShellProps> = ({ children, backLabel, backRoute, rightPanel }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (href: string) => {
    if (href === '/networking') return currentPath === '/networking';
    return currentPath.startsWith(href);
  };

  return (
    <div className="flex gap-0 min-h-[calc(100vh-4rem)]">
      {/* Left Identity/Category Rail */}
      <nav className="w-48 shrink-0 border-r border-border/40 bg-card/50 py-4 px-2 overflow-y-auto hidden lg:block">
        <div className="flex items-center gap-2 px-3 mb-4">
          <Wifi className="h-4 w-4 text-accent" />
          <span className="text-xs font-bold tracking-tight">My Network</span>
        </div>

        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-3">
            <div className="text-[8px] font-semibold uppercase tracking-widest text-muted-foreground/60 px-3 mb-1">
              {section.title}
            </div>
            {section.items.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all group',
                  isActive(item.href)
                    ? 'bg-accent/10 text-accent border border-accent/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                <item.icon className={cn('h-3 w-3 shrink-0', isActive(item.href) ? 'text-accent' : 'text-muted-foreground group-hover:text-foreground')} />
                <span className="flex-1">{item.label}</span>
                {(item as any).live && (
                  <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-live))] animate-pulse" />
                )}
                {(item as any).count != null && (
                  <span className={cn(
                    'text-[8px] font-semibold min-w-[16px] text-center rounded-full px-1',
                    isActive(item.href) ? 'bg-accent/20 text-accent' : 'bg-muted text-muted-foreground'
                  )}>
                    {(item as any).count}
                  </span>
                )}
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Central Work Area */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-4">
          {backLabel && backRoute && (
            <SectionBackNav homeRoute={backRoute} homeLabel="Network" currentLabel={backLabel} icon={<Wifi className="h-3 w-3" />} />
          )}
          {children}
        </div>
      </div>

      {/* Right Live/Opportunity Rail */}
      {rightPanel ? (
        <aside className="w-56 shrink-0 border-l border-border/40 bg-card/30 p-3 overflow-y-auto hidden xl:block">
          {rightPanel}
        </aside>
      ) : (
        <aside className="w-56 shrink-0 border-l border-border/40 bg-card/30 p-3 overflow-y-auto hidden xl:block">
          {/* Live Sessions */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Radio className="h-3 w-3 text-[hsl(var(--state-live))]" />
              <span className="text-[9px] font-bold">Live Now</span>
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-live))] animate-pulse" />
            </div>
            {LIVE_SESSIONS.map((s, i) => (
              <Link key={i} to="/networking/rooms" className="block p-2.5 rounded-xl border border-border/30 hover:border-accent/30 hover:bg-accent/5 transition-all mb-2 group">
                <div className="text-[10px] font-medium group-hover:text-accent">{s.name}</div>
                <div className="text-[8px] text-muted-foreground">{s.host} · {s.count} in room</div>
                <Button variant="outline" size="sm" className="h-5 text-[8px] w-full mt-1.5 rounded-lg gap-0.5">
                  <Radio className="h-2 w-2" /> Join
                </Button>
              </Link>
            ))}
          </div>

          {/* Collaboration Prompts */}
          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-2">
              <Globe className="h-3 w-3 text-accent" />
              <span className="text-[9px] font-bold">Activity</span>
            </div>
            {COLLAB_PROMPTS.map((p, i) => (
              <div key={i} className="py-2 border-b border-border/20 last:border-0">
                <div className="text-[9px] text-foreground/80">{p.text}</div>
                <div className="text-[7px] text-muted-foreground mt-0.5">{p.time}</div>
              </div>
            ))}
          </div>

          {/* Quick Stats */}
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <BarChart3 className="h-3 w-3 text-muted-foreground" />
              <span className="text-[9px] font-bold">This Week</span>
            </div>
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">New connections</span><span className="font-semibold text-accent">+12</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Profile views</span><span className="font-semibold">89</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Follow-ups due</span><span className="font-semibold text-[hsl(var(--state-caution))]">5</span></div>
            </div>
          </div>
        </aside>
      )}
    </div>
  );
};
