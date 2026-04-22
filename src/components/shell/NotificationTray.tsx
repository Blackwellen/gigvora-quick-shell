import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bell, Check, ArrowRight, MessageSquare, Briefcase,
  Users, AlertTriangle, Shield, DollarSign, Star,
  FileText, Activity, Pin, Archive, CheckCheck,
  Settings, ExternalLink, Bookmark, MoreHorizontal,
  Trash2, Eye, Clock, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

type NotifPriority = 'critical' | 'high' | 'normal' | 'low';

interface Notification {
  id: string;
  type: 'message' | 'job' | 'connection' | 'alert' | 'payment' | 'security' | 'project' | 'review' | 'system';
  priority: NotifPriority;
  title: string;
  body: string;
  time: string;
  read: boolean;
  pinned: boolean;
  actor?: { name: string; initials: string };
  actionLink?: string;
  actionLabel?: string;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: '1', type: 'security', priority: 'critical', title: 'Suspicious login blocked', body: 'Attempt from 203.0.x.x was blocked. Review security settings.', time: '2m', read: false, pinned: false, actionLink: '/settings', actionLabel: 'Review' },
  { id: '2', type: 'payment', priority: 'high', title: 'Payment requires approval', body: '$5,000 from Sarah Chen — Milestone 2', time: '8m', read: false, pinned: false, actor: { name: 'Sarah Chen', initials: 'SC' }, actionLink: '/finance', actionLabel: 'Approve' },
  { id: '3', type: 'connection', priority: 'normal', title: 'Jennifer Park sent a request', body: 'Senior Product Designer — 12 mutual connections', time: '15m', read: false, pinned: false, actor: { name: 'Jennifer Park', initials: 'JP' }, actionLink: '/networking', actionLabel: 'View' },
  { id: '4', type: 'message', priority: 'normal', title: 'New message from Alex Kim', body: 'Can we schedule a call to discuss the deliverables?', time: '32m', read: false, pinned: false, actor: { name: 'Alex Kim', initials: 'AK' }, actionLink: '/inbox', actionLabel: 'Reply' },
  { id: '5', type: 'job', priority: 'normal', title: 'Application viewed', body: 'Senior React Developer at InnovateCo', time: '1h', read: false, pinned: false, actionLink: '/jobs' },
  { id: '6', type: 'project', priority: 'normal', title: 'Milestone completed', body: 'E-Commerce — Phase 1 done', time: '2h', read: true, pinned: true, actionLink: '/projects' },
  { id: '7', type: 'review', priority: 'normal', title: 'New 5-star review', body: '"Outstanding work!" — Robert Chang', time: '3h', read: true, pinned: false, actor: { name: 'Robert Chang', initials: 'RC' } },
  { id: '8', type: 'payment', priority: 'normal', title: 'Invoice #1042 paid', body: '$2,500 received for UX Audit', time: '5h', read: true, pinned: false, actionLink: '/finance' },
];

const TYPE_ICONS: Record<string, React.ElementType> = {
  message: MessageSquare, job: Briefcase, connection: Users,
  alert: AlertTriangle, payment: DollarSign, security: Shield,
  project: FileText, review: Star, system: Activity,
};

const TYPE_COLORS: Record<string, string> = {
  message: 'bg-[hsl(var(--gigvora-green)/0.1)] text-[hsl(var(--gigvora-green))]',
  job: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  connection: 'bg-accent/10 text-accent',
  alert: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  payment: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  security: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]',
  project: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]',
  review: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  system: 'bg-muted text-muted-foreground',
};

const PRIORITY_DOTS: Record<NotifPriority, string> = {
  critical: 'bg-[hsl(var(--state-blocked))]',
  high: 'bg-[hsl(var(--state-caution))]',
  normal: 'bg-[hsl(var(--state-healthy))]',
  low: 'bg-muted-foreground/40',
};

export const NotificationTray: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<'all' | 'unread' | 'pinned'>('all');

  const unreadCount = notifications.filter(n => !n.read).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;

  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  const markRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  const togglePin = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const archiveNotif = (id: string) => setNotifications(prev => prev.filter(n => n.id !== id));

  const filtered = notifications.filter(n => {
    if (activeFilter === 'unread') return !n.read;
    if (activeFilter === 'pinned') return n.pinned;
    return true;
  });

  const pinnedItems = filtered.filter(n => n.pinned && !n.read);
  const unreadItems = filtered.filter(n => !n.read && !n.pinned);
  const readItems = filtered.filter(n => n.read && !n.pinned);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl relative hover:bg-muted/80 transition-all">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className={cn(
              'absolute -top-0.5 -right-0.5 h-4.5 min-w-[18px] rounded-full text-[9px] font-bold flex items-center justify-center px-1 ring-2 ring-card transition-all',
              criticalCount > 0
                ? 'bg-[hsl(var(--state-blocked))] text-white animate-pulse'
                : 'bg-destructive text-destructive-foreground'
            )}>
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0 rounded-2xl shadow-2xl border" align="end" sideOffset={8}>
        {/* Header */}
        <div className="px-4 py-3 border-b">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <Badge className="text-[8px] h-4.5 bg-accent text-accent-foreground rounded-lg border-0">{unreadCount} new</Badge>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button onClick={markAllRead} className="text-[10px] text-accent hover:text-accent/80 flex items-center gap-1 font-medium transition-colors">
                <CheckCheck className="h-3 w-3" /> Mark all
              </button>
            </div>
          </div>

          {/* Filter chips */}
          <div className="flex items-center gap-1">
            {(['all', 'unread', 'pinned'] as const).map(f => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={cn(
                  'px-2.5 py-1 rounded-xl text-[10px] font-medium capitalize transition-all',
                  activeFilter === f
                    ? 'bg-accent text-accent-foreground shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                )}
              >
                {f}
                {f === 'unread' && unreadCount > 0 && (
                  <span className="ml-1 text-[8px] opacity-80">{unreadCount}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Critical banner */}
        {criticalCount > 0 && (
          <div className="mx-3 mt-3 px-3 py-2.5 rounded-xl border border-[hsl(var(--state-blocked)/0.2)] bg-[hsl(var(--state-blocked)/0.04)] flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="h-7 w-7 rounded-lg bg-[hsl(var(--state-blocked)/0.1)] flex items-center justify-center shrink-0">
              <Shield className="h-3.5 w-3.5 text-[hsl(var(--state-blocked))]" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[10px] font-bold text-[hsl(var(--state-blocked))]">{criticalCount} critical alert{criticalCount > 1 ? 's' : ''}</span>
              <span className="text-[9px] text-muted-foreground ml-1.5">Require action</span>
            </div>
            <Button variant="outline" size="sm" className="text-[9px] h-6 rounded-lg border-[hsl(var(--state-blocked)/0.3)] text-[hsl(var(--state-blocked))] hover:bg-[hsl(var(--state-blocked)/0.05)]">
              <Zap className="h-2.5 w-2.5 mr-1" /> Review
            </Button>
          </div>
        )}

        <ScrollArea className="max-h-[420px]">
          <div className="p-2">
            {/* Pinned */}
            {pinnedItems.length > 0 && (
              <div className="mb-1">
                <div className="px-2 pt-1 pb-1.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                    <Pin className="h-2.5 w-2.5" /> Pinned
                  </span>
                </div>
                {pinnedItems.map(n => (
                  <NotifRow key={n.id} n={n} onRead={() => markRead(n.id)} onPin={() => togglePin(n.id)} onArchive={() => archiveNotif(n.id)} onClose={() => setOpen(false)} />
                ))}
              </div>
            )}

            {/* Unread */}
            {unreadItems.length > 0 && (
              <div className="mb-1">
                <div className="px-2 pt-1 pb-1.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">New</span>
                </div>
                {unreadItems.map(n => (
                  <NotifRow key={n.id} n={n} onRead={() => markRead(n.id)} onPin={() => togglePin(n.id)} onArchive={() => archiveNotif(n.id)} onClose={() => setOpen(false)} />
                ))}
              </div>
            )}

            {/* Read */}
            {readItems.length > 0 && (
              <div>
                <div className="px-2 pt-1 pb-1.5">
                  <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">Earlier</span>
                </div>
                {readItems.slice(0, 4).map(n => (
                  <NotifRow key={n.id} n={n} onRead={() => markRead(n.id)} onPin={() => togglePin(n.id)} onArchive={() => archiveNotif(n.id)} onClose={() => setOpen(false)} />
                ))}
              </div>
            )}

            {/* Empty */}
            {filtered.length === 0 && (
              <div className="text-center py-10">
                <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                  <Bell className="h-5 w-5 text-muted-foreground/30" />
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {activeFilter === 'unread' ? 'All caught up!' : activeFilter === 'pinned' ? 'No pinned notifications' : 'No notifications yet'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="border-t px-4 py-2.5 flex items-center justify-between">
          <Link
            to="/notifications"
            className="text-[11px] text-accent hover:text-accent/80 font-medium flex items-center gap-1.5 transition-colors"
            onClick={() => setOpen(false)}
          >
            View all notifications <ArrowRight className="h-3 w-3" />
          </Link>
          <Link
            to="/settings"
            className="h-7 w-7 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            onClick={() => setOpen(false)}
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
};

/* ── Individual notification row ── */
const NotifRow: React.FC<{
  n: Notification;
  onRead: () => void;
  onPin: () => void;
  onArchive: () => void;
  onClose: () => void;
}> = ({ n, onRead, onPin, onArchive, onClose }) => {
  const Icon = TYPE_ICONS[n.type] || AlertTriangle;
  const colorClass = TYPE_COLORS[n.type] || 'bg-muted text-muted-foreground';

  return (
    <div
      className={cn(
        'px-2.5 py-2.5 flex items-start gap-2.5 rounded-xl transition-all cursor-pointer group relative',
        !n.read && 'bg-accent/[0.03]',
        n.priority === 'critical' && !n.read && 'bg-[hsl(var(--state-blocked)/0.03)] border border-[hsl(var(--state-blocked)/0.1)]',
        n.priority === 'high' && !n.read && 'border border-[hsl(var(--state-caution)/0.1)]',
        n.read && 'hover:bg-muted/30',
        !n.read && n.priority !== 'critical' && 'hover:bg-accent/[0.06]',
      )}
      onClick={() => { if (!n.read) onRead(); }}
    >
      {/* Icon with status ring */}
      <div className="relative shrink-0 mt-0.5">
        {n.actor ? (
          <div className={cn(
            'h-9 w-9 rounded-xl flex items-center justify-center text-[10px] font-bold',
            !n.read ? 'bg-accent/10 text-accent ring-2 ring-accent/10' : 'bg-muted text-muted-foreground'
          )}>
            {n.actor.initials}
          </div>
        ) : (
          <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center', colorClass)}>
            <Icon className="h-4 w-4" />
          </div>
        )}
        {!n.read && (
          <div className={cn('absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full ring-2 ring-card', PRIORITY_DOTS[n.priority])} />
        )}
        {n.pinned && <Pin className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-accent" />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className={cn('text-[11px] truncate leading-tight', !n.read && 'font-bold')}>{n.title}</span>
            {n.priority === 'critical' && (
              <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))] border-0 rounded-md shrink-0 animate-pulse">!</Badge>
            )}
          </div>
          <span className="text-[9px] text-muted-foreground shrink-0 flex items-center gap-0.5">
            <Clock className="h-2 w-2" />{n.time}
          </span>
        </div>
        <p className="text-[10px] text-muted-foreground truncate mt-0.5 leading-relaxed">{n.body}</p>

        {/* Inline action CTA */}
        {n.actionLabel && n.actionLink && !n.read && (
          <Link
            to={n.actionLink}
            onClick={(e) => { e.stopPropagation(); onClose(); }}
            className="inline-flex items-center gap-1 mt-1.5 px-2.5 py-1 rounded-lg bg-accent/10 text-accent text-[9px] font-semibold hover:bg-accent/15 transition-colors"
          >
            {n.actionLabel} <ArrowRight className="h-2.5 w-2.5" />
          </Link>
        )}
      </div>

      {/* Hover quick actions */}
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0 absolute top-1.5 right-1.5">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-6 w-6 rounded-lg flex items-center justify-center bg-card hover:bg-muted shadow-sm border transition-all">
              <MoreHorizontal className="h-3 w-3 text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40 rounded-xl p-1">
            <DropdownMenuItem className="text-[10px] gap-2 rounded-lg" onClick={(e) => { e.stopPropagation(); onRead(); }}>
              <Eye className="h-3 w-3" /> {n.read ? 'Mark unread' : 'Mark read'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[10px] gap-2 rounded-lg" onClick={(e) => { e.stopPropagation(); onPin(); }}>
              <Pin className="h-3 w-3" /> {n.pinned ? 'Unpin' : 'Pin'}
            </DropdownMenuItem>
            <DropdownMenuItem className="text-[10px] gap-2 rounded-lg" onClick={(e) => { e.stopPropagation(); onArchive(); }}>
              <Archive className="h-3 w-3" /> Archive
            </DropdownMenuItem>
            {n.actionLink && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-[10px] gap-2 rounded-lg" asChild>
                  <Link to={n.actionLink} onClick={() => onClose()}>
                    <ExternalLink className="h-3 w-3" /> Open related
                  </Link>
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
