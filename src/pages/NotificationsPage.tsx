import React, { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Bell, CheckCircle2, MessageSquare, Briefcase, UserPlus,
  Star, Shield, DollarSign, Settings, Archive,
  ChevronRight, Clock, AlertTriangle, X, Eye,
  Zap, FileText, Users, TrendingUp, MailOpen,
  CheckCheck, Trash2, Pin, ExternalLink, RefreshCw,
  Calendar, Activity, Inbox, Award, Trophy,
  Target, Flame, Crown, Heart, Sparkles,
  MoreHorizontal, Filter, Volume2, VolumeX,
  ArrowRight, Layers, Globe, Rocket, ArrowUpRight,
} from 'lucide-react';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

/* ════════════════════════════════════════════════════════════
   Types
   ════════════════════════════════════════════════════════════ */
type NotifPriority = 'critical' | 'high' | 'normal' | 'low';
type NotifModule = 'connection' | 'message' | 'job' | 'payment' | 'review' | 'security' | 'project' | 'system';
type NotifChannel = 'in-app' | 'email' | 'push';

interface Notification {
  id: string;
  type: NotifModule;
  priority: NotifPriority;
  title: string;
  body: string;
  time: string;
  read: boolean;
  pinned: boolean;
  archived: boolean;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  actionLabel?: string;
  actionLink?: string;
  actor?: { name: string; initials: string };
  channel: NotifChannel;
  groupKey?: string;
}

interface BadgeRecord {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  earned: boolean;
  earnedAt?: string;
  progress?: number;
  category: 'milestone' | 'streak' | 'social' | 'quality';
}

interface ActivityEvent {
  id: string;
  type: 'route_open' | 'action' | 'system' | 'achievement';
  actor: string;
  action: string;
  target?: string;
  targetLink?: string;
  timestamp: string;
  module: string;
}

/* ════════════════════════════════════════════════════════════
   Mock Data
   ════════════════════════════════════════════════════════════ */
const NOTIFICATIONS: Notification[] = [
  { id: 'n1', type: 'security', priority: 'critical', title: 'Suspicious login attempt blocked', body: 'An attempt from 203.0.x.x (Unknown) was blocked. Review your security settings.', time: '2m ago', read: false, pinned: false, archived: false, icon: Shield, color: 'text-[hsl(var(--state-blocked))]', bgColor: 'bg-[hsl(var(--state-blocked)/0.1)]', actionLabel: 'Review Security', actionLink: '/settings', channel: 'in-app', groupKey: 'security' },
  { id: 'n2', type: 'payment', priority: 'high', title: 'Milestone payment requires approval', body: 'Client Sarah Chen released $5,000 for Logo Design — Milestone 2. Approve to transfer.', time: '8m ago', read: false, pinned: false, archived: false, icon: DollarSign, color: 'text-[hsl(var(--state-healthy))]', bgColor: 'bg-[hsl(var(--state-healthy)/0.1)]', actionLabel: 'Approve Payment', actionLink: '/finance', actor: { name: 'Sarah Chen', initials: 'SC' }, channel: 'in-app', groupKey: 'payments' },
  { id: 'n3', type: 'connection', priority: 'normal', title: 'Jennifer Park sent you a connection request', body: 'Senior Product Designer at TechCorp — 12 mutual connections', time: '15m ago', read: false, pinned: false, archived: false, icon: UserPlus, color: 'text-accent', bgColor: 'bg-accent/10', actionLabel: 'View Profile', actionLink: '/networking', actor: { name: 'Jennifer Park', initials: 'JP' }, channel: 'in-app', groupKey: 'connections' },
  { id: 'n4', type: 'message', priority: 'normal', title: 'New message from Alex Kim', body: 'Re: Mobile App Redesign — "Looks great, can we schedule a call to discuss the final deliverables?"', time: '32m ago', read: false, pinned: false, archived: false, icon: MessageSquare, color: 'text-[hsl(var(--gigvora-green))]', bgColor: 'bg-[hsl(var(--gigvora-green)/0.1)]', actionLabel: 'Reply', actionLink: '/inbox', actor: { name: 'Alex Kim', initials: 'AK' }, channel: 'in-app', groupKey: 'messages' },
  { id: 'n5', type: 'job', priority: 'normal', title: 'Your application was viewed', body: 'Senior React Developer at InnovateCo — Recruiter viewed your profile 2 hours ago', time: '1h ago', read: false, pinned: false, archived: false, icon: Briefcase, color: 'text-[hsl(var(--gigvora-purple))]', bgColor: 'bg-[hsl(var(--gigvora-purple)/0.1)]', actionLabel: 'View Job', actionLink: '/jobs', channel: 'email', groupKey: 'jobs' },
  { id: 'n5b', type: 'job', priority: 'normal', title: 'New job match: Frontend Lead', body: 'TechFlow is hiring a Frontend Lead — 92% match', time: '1h ago', read: false, pinned: false, archived: false, icon: Briefcase, color: 'text-[hsl(var(--gigvora-purple))]', bgColor: 'bg-[hsl(var(--gigvora-purple)/0.1)]', actionLabel: 'View Job', actionLink: '/jobs', channel: 'email', groupKey: 'jobs' },
  { id: 'n6', type: 'project', priority: 'normal', title: 'Project milestone completed', body: 'E-Commerce Platform — Phase 1 development completed. Review deliverables.', time: '2h ago', read: true, pinned: true, archived: false, icon: FileText, color: 'text-[hsl(var(--gigvora-blue))]', bgColor: 'bg-[hsl(var(--gigvora-blue)/0.1)]', actionLabel: 'View Project', actionLink: '/projects', actor: { name: 'Dev Team', initials: 'DT' }, channel: 'in-app', groupKey: 'projects' },
  { id: 'n7', type: 'review', priority: 'normal', title: 'New 5-star review received', body: '"Outstanding work on the branding project. Highly recommend!" — Robert Chang', time: '3h ago', read: true, pinned: false, archived: false, icon: Star, color: 'text-[hsl(var(--gigvora-amber))]', bgColor: 'bg-[hsl(var(--gigvora-amber)/0.1)]', actor: { name: 'Robert Chang', initials: 'RC' }, channel: 'in-app', groupKey: 'reviews' },
  { id: 'n8', type: 'payment', priority: 'normal', title: 'Invoice #1042 paid', body: '$2,500 received for UX Audit project. Funds available in your wallet.', time: '5h ago', read: true, pinned: false, archived: false, icon: DollarSign, color: 'text-[hsl(var(--state-healthy))]', bgColor: 'bg-[hsl(var(--state-healthy)/0.1)]', channel: 'email', groupKey: 'payments' },
  { id: 'n9', type: 'connection', priority: 'low', title: 'Robert Chang accepted your request', body: 'You are now connected. Send a message to start collaborating.', time: '1d ago', read: true, pinned: false, archived: false, icon: UserPlus, color: 'text-accent', bgColor: 'bg-accent/10', actor: { name: 'Robert Chang', initials: 'RC' }, channel: 'in-app', groupKey: 'connections' },
  { id: 'n10', type: 'job', priority: 'low', title: '5 new jobs matching your skills', body: 'React, TypeScript, Node.js — posted in the last 24 hours', time: '1d ago', read: true, pinned: false, archived: false, icon: Briefcase, color: 'text-[hsl(var(--gigvora-purple))]', bgColor: 'bg-[hsl(var(--gigvora-purple)/0.1)]', channel: 'push', groupKey: 'jobs' },
  { id: 'n11', type: 'system', priority: 'low', title: 'Weekly digest available', body: 'Your activity summary for the week of Jan 6–12 is ready to review.', time: '2d ago', read: true, pinned: false, archived: false, icon: Activity, color: 'text-muted-foreground', bgColor: 'bg-muted', channel: 'email', groupKey: 'system' },
  { id: 'n12', type: 'system', priority: 'low', title: 'Platform maintenance scheduled', body: 'Brief downtime expected on Jan 15 from 2:00–4:00 AM UTC.', time: '3d ago', read: true, pinned: false, archived: true, icon: AlertTriangle, color: 'text-[hsl(var(--state-caution))]', bgColor: 'bg-[hsl(var(--state-caution)/0.1)]', channel: 'in-app', groupKey: 'system' },
];

const BADGES: BadgeRecord[] = [
  { id: 'b1', label: 'First Gig', description: 'Complete your first gig order', icon: Rocket, earned: true, earnedAt: '2 weeks ago', category: 'milestone' },
  { id: 'b2', label: 'Network Builder', description: 'Connect with 50 professionals', icon: Users, earned: true, earnedAt: '1 week ago', category: 'social' },
  { id: 'b3', label: '7-Day Streak', description: 'Log in for 7 consecutive days', icon: Flame, earned: true, earnedAt: '3 days ago', category: 'streak' },
  { id: 'b4', label: 'Top Rated', description: 'Maintain 4.8+ rating on 10 reviews', icon: Crown, earned: false, progress: 72, category: 'quality' },
  { id: 'b5', label: 'Power Poster', description: 'Create 25 posts that get 10+ likes', icon: Heart, earned: false, progress: 44, category: 'social' },
  { id: 'b6', label: '30-Day Streak', description: 'Log in for 30 consecutive days', icon: Trophy, earned: false, progress: 60, category: 'streak' },
  { id: 'b7', label: '$10K Earned', description: 'Earn $10,000 through the platform', icon: DollarSign, earned: false, progress: 85, category: 'milestone' },
  { id: 'b8', label: 'Mentor', description: 'Complete 5 mentorship sessions', icon: Sparkles, earned: false, progress: 20, category: 'social' },
];

const ACTIVITY_EVENTS: ActivityEvent[] = [
  { id: 'a1', type: 'action', actor: 'You', action: 'submitted a proposal for', target: 'Enterprise Dashboard Redesign', targetLink: '/projects', timestamp: '5m ago', module: 'Projects' },
  { id: 'a2', type: 'action', actor: 'Sarah Chen', action: 'accepted your milestone on', target: 'Logo Design', targetLink: '/contracts', timestamp: '12m ago', module: 'Contracts' },
  { id: 'a3', type: 'achievement', actor: 'You', action: 'earned the badge', target: '7-Day Streak 🔥', timestamp: '32m ago', module: 'Badges' },
  { id: 'a4', type: 'route_open', actor: 'You', action: 'viewed', target: 'Senior React Developer posting', targetLink: '/jobs', timestamp: '1h ago', module: 'Jobs' },
  { id: 'a5', type: 'system', actor: 'System', action: 'processed payout of $2,500 to', target: 'your wallet', targetLink: '/finance/wallet', timestamp: '2h ago', module: 'Finance' },
  { id: 'a6', type: 'action', actor: 'Alex Kim', action: 'left a comment on', target: 'Mobile App Redesign', targetLink: '/projects', timestamp: '3h ago', module: 'Projects' },
  { id: 'a7', type: 'route_open', actor: 'You', action: 'applied to', target: 'Product Designer at DesignHub', targetLink: '/jobs', timestamp: '5h ago', module: 'Jobs' },
  { id: 'a8', type: 'system', actor: 'System', action: 'auto-archived 3 expired notifications', timestamp: '1d ago', module: 'System' },
];

const MODULE_FILTERS: { id: string; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: Inbox },
  { id: 'unread', label: 'Unread', icon: MailOpen },
  { id: 'pinned', label: 'Pinned', icon: Pin },
  { id: 'connection', label: 'Connections', icon: UserPlus },
  { id: 'message', label: 'Messages', icon: MessageSquare },
  { id: 'job', label: 'Jobs', icon: Briefcase },
  { id: 'payment', label: 'Payments', icon: DollarSign },
  { id: 'project', label: 'Projects', icon: FileText },
  { id: 'review', label: 'Reviews', icon: Star },
  { id: 'security', label: 'Security', icon: Shield },
  { id: 'system', label: 'System', icon: Activity },
];

const PRIORITY_CONFIG: Record<NotifPriority, { label: string; dot: string; bg: string }> = {
  critical: { label: 'Critical', dot: 'bg-[hsl(var(--state-blocked))]', bg: 'bg-[hsl(var(--state-blocked)/0.04)]' },
  high: { label: 'High', dot: 'bg-[hsl(var(--state-caution))]', bg: 'bg-[hsl(var(--state-caution)/0.04)]' },
  normal: { label: 'Normal', dot: 'bg-[hsl(var(--state-healthy))]', bg: '' },
  low: { label: 'Low', dot: 'bg-muted-foreground/40', bg: '' },
};

const BADGE_CATEGORY_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  milestone: { label: 'Milestone', color: 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]', icon: Target },
  streak: { label: 'Streak', color: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]', icon: Flame },
  social: { label: 'Social', color: 'bg-[hsl(var(--gigvora-green)/0.1)] text-[hsl(var(--gigvora-green))]', icon: Users },
  quality: { label: 'Quality', color: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]', icon: Crown },
};

/* ════════════════════════════════════════════════════════════
   Priority Banner
   ════════════════════════════════════════════════════════════ */
const PriorityBanner: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  const critical = notifications.filter(n => n.priority === 'critical' && !n.read);
  if (!critical.length) return null;
  return (
    <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.2)] bg-[hsl(var(--state-blocked)/0.04)] p-4 flex items-start gap-3.5 animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <div className="h-10 w-10 rounded-xl bg-[hsl(var(--state-blocked)/0.1)] flex items-center justify-center shrink-0 ring-4 ring-[hsl(var(--state-blocked)/0.05)]">
        <AlertTriangle className="h-4.5 w-4.5 text-[hsl(var(--state-blocked))]" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-bold text-[hsl(var(--state-blocked))]">{critical.length} Critical Alert{critical.length > 1 ? 's' : ''} Require Immediate Action</div>
        <div className="text-[10px] text-muted-foreground mt-0.5">{critical[0].title}</div>
      </div>
      <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl border-[hsl(var(--state-blocked)/0.3)] text-[hsl(var(--state-blocked))] hover:bg-[hsl(var(--state-blocked)/0.05)] gap-1.5">
        <Zap className="h-3 w-3" /> Review Now
      </Button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   Live Counter (animated)
   ════════════════════════════════════════════════════════════ */
const LiveCounter: React.FC<{ count: number | string; label: string; pulse?: boolean; accent?: boolean }> = ({ count, label, pulse, accent }) => (
  <div className="flex items-center gap-1.5">
    <div className="relative">
      <span className={cn('text-sm font-bold tabular-nums', accent && 'text-accent')}>{count}</span>
      {pulse && typeof count === 'number' && count > 0 && (
        <span className="absolute -top-0.5 -right-1.5 h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
      )}
    </div>
    <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{label}</span>
  </div>
);

/* ════════════════════════════════════════════════════════════
   Notification Row
   ════════════════════════════════════════════════════════════ */
const NotificationRow: React.FC<{
  n: Notification;
  selected: boolean;
  bulkMode: boolean;
  checked: boolean;
  onSelect: () => void;
  onToggleRead: () => void;
  onTogglePin: () => void;
  onArchive: () => void;
  onCheck: () => void;
}> = ({ n, selected, bulkMode, checked, onSelect, onToggleRead, onTogglePin, onArchive, onCheck }) => (
  <div
    onClick={bulkMode ? onCheck : onSelect}
    className={cn(
      'flex items-start gap-3 px-3.5 py-3 rounded-2xl transition-all cursor-pointer group border',
      selected ? 'border-accent/30 bg-accent/5 shadow-sm' : 'border-transparent',
      !n.read ? 'bg-[hsl(var(--gigvora-blue)/0.02)]' : 'hover:bg-muted/30',
      n.priority === 'critical' && !n.read && 'border-l-[3px] border-l-[hsl(var(--state-blocked))] bg-[hsl(var(--state-blocked)/0.03)]',
      n.priority === 'high' && !n.read && 'border-l-[3px] border-l-[hsl(var(--state-caution))] bg-[hsl(var(--state-caution)/0.03)]',
    )}
  >
    {/* Bulk checkbox */}
    {bulkMode && (
      <div className="pt-1.5 shrink-0">
        <Checkbox checked={checked} onCheckedChange={() => onCheck()} onClick={e => e.stopPropagation()} className="rounded-lg" />
      </div>
    )}

    {/* Priority dot + Icon */}
    <div className="relative shrink-0 mt-0.5">
      {n.actor ? (
        <div className={cn(
          'h-10 w-10 rounded-xl flex items-center justify-center text-[11px] font-bold transition-transform group-hover:scale-105',
          !n.read ? 'bg-accent/10 text-accent ring-2 ring-accent/10' : 'bg-muted text-muted-foreground'
        )}>
          {n.actor.initials}
        </div>
      ) : (
        <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105', n.bgColor)}>
          <n.icon className={cn('h-4 w-4', n.color)} />
        </div>
      )}
      {!n.read && <div className={cn('absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-card', PRIORITY_CONFIG[n.priority].dot)} />}
      {n.pinned && <Pin className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-accent" />}
    </div>

    {/* Content */}
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-1.5">
        <span className={cn('text-[11px] leading-tight', !n.read ? 'font-bold' : 'font-medium')}>{n.title}</span>
        {n.priority === 'critical' && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))] border-0 rounded-md animate-pulse">CRITICAL</Badge>}
        {n.priority === 'high' && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))] border-0 rounded-md">HIGH</Badge>}
      </div>
      <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1 leading-relaxed">{n.body}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <span className="text-[9px] text-muted-foreground flex items-center gap-0.5">
          <Clock className="h-2.5 w-2.5" />{n.time}
        </span>
        <Badge variant="outline" className="text-[8px] h-3.5 capitalize rounded-md">{n.channel}</Badge>
        {n.actor && <span className="text-[9px] text-muted-foreground">by {n.actor.name}</span>}
      </div>

      {/* Inline CTA for unread actionable items */}
      {n.actionLabel && n.actionLink && !n.read && (
        <Link
          to={n.actionLink}
          onClick={e => e.stopPropagation()}
          className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 rounded-xl bg-accent/10 text-accent text-[9px] font-semibold hover:bg-accent/15 transition-colors"
        >
          {n.actionLabel} <ArrowUpRight className="h-2.5 w-2.5" />
        </Link>
      )}
    </div>

    {/* Quick Actions (hover) */}
    {!bulkMode && (
      <div className="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button onClick={e => { e.stopPropagation(); onToggleRead(); }} className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-muted transition-colors" title={n.read ? 'Mark unread' : 'Mark read'}>
          {n.read ? <MailOpen className="h-3 w-3 text-muted-foreground" /> : <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />}
        </button>
        <button onClick={e => { e.stopPropagation(); onTogglePin(); }} className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-muted transition-colors" title={n.pinned ? 'Unpin' : 'Pin'}>
          <Pin className={cn('h-3 w-3', n.pinned ? 'text-accent' : 'text-muted-foreground')} />
        </button>
        <button onClick={e => { e.stopPropagation(); onArchive(); }} className="h-7 w-7 rounded-xl flex items-center justify-center hover:bg-muted transition-colors" title="Archive">
          <Archive className="h-3 w-3 text-muted-foreground" />
        </button>
      </div>
    )}
  </div>
);

/* ════════════════════════════════════════════════════════════
   Notification Detail
   ════════════════════════════════════════════════════════════ */
const NotificationDetail: React.FC<{ n: Notification; onClose: () => void }> = ({ n, onClose }) => (
  <div className="space-y-4">
    <div className="flex items-start gap-3.5">
      <div className={cn('h-12 w-12 rounded-2xl flex items-center justify-center ring-4', n.bgColor, `ring-${n.bgColor}/50`)}>
        <n.icon className={cn('h-5 w-5', n.color)} />
      </div>
      <div className="flex-1">
        <div className="text-xs font-bold">{n.title}</div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{n.time}</span>
          <Badge variant="outline" className="text-[8px] h-3.5 capitalize rounded-md">{n.type}</Badge>
          <Badge variant="outline" className="text-[8px] h-3.5 capitalize rounded-md">{n.channel}</Badge>
          {n.priority !== 'normal' && (
            <Badge className={cn('text-[8px] h-3.5 border-0 rounded-md',
              n.priority === 'critical' && 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]',
              n.priority === 'high' && 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
              n.priority === 'low' && 'bg-muted text-muted-foreground',
            )}>{PRIORITY_CONFIG[n.priority].label}</Badge>
          )}
        </div>
      </div>
    </div>

    <div className="rounded-2xl border p-4 bg-muted/20">
      <p className="text-[11px] leading-relaxed">{n.body}</p>
    </div>

    {n.actor && (
      <div className="flex items-center gap-3 p-3 rounded-2xl border bg-muted/20">
        <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent ring-2 ring-accent/10">{n.actor.initials}</div>
        <div>
          <div className="text-[11px] font-semibold">{n.actor.name}</div>
          <div className="text-[9px] text-muted-foreground">Actor</div>
        </div>
        <Button variant="ghost" size="sm" className="ml-auto text-[10px] h-7 rounded-xl" asChild>
          <Link to="/profile">View Profile <ExternalLink className="h-2.5 w-2.5 ml-1" /></Link>
        </Button>
      </div>
    )}

    <div className="flex gap-2">
      {n.actionLabel && n.actionLink && (
        <Button size="sm" className="text-[10px] h-8 flex-1 rounded-xl gap-1.5" asChild>
          <Link to={n.actionLink}>{n.actionLabel} <ChevronRight className="h-3 w-3" /></Link>
        </Button>
      )}
      <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl gap-1.5">
        <Archive className="h-3 w-3" /> Archive
      </Button>
      <Button variant="ghost" size="sm" className="text-[10px] h-8 text-[hsl(var(--state-blocked))] rounded-xl gap-1.5">
        <Trash2 className="h-3 w-3" /> Delete
      </Button>
    </div>

    <SectionCard title="Activity Trail">
      <div className="space-y-0">
        {[
          { action: 'Notification delivered', time: n.time, status: 'healthy' },
          { action: `Sent via ${n.channel}`, time: n.time, status: 'healthy' },
          { action: n.read ? 'Marked as read' : 'Unread', time: n.read ? '1h ago' : '—', status: n.read ? 'healthy' : 'pending' },
        ].map((trail, i) => (
          <div key={i} className="flex items-center gap-3 py-1.5">
            <div className={cn('h-2 w-2 rounded-full shrink-0',
              trail.status === 'healthy' ? 'bg-[hsl(var(--state-healthy))]' : 'bg-muted-foreground/30'
            )} />
            <span className="flex-1 text-[10px]">{trail.action}</span>
            <span className="text-[9px] text-muted-foreground">{trail.time}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  </div>
);

/* ════════════════════════════════════════════════════════════
   Badge Card
   ════════════════════════════════════════════════════════════ */
const BadgeCard: React.FC<{ badge: BadgeRecord }> = ({ badge }) => {
  const Icon = badge.icon;
  const catCfg = BADGE_CATEGORY_CONFIG[badge.category];
  return (
    <div className={cn(
      'rounded-2xl border p-4 transition-all hover:shadow-md group',
      badge.earned ? 'bg-card hover:border-accent/20' : 'bg-muted/20 opacity-80',
    )}>
      <div className="flex items-start gap-3">
        <div className={cn(
          'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
          badge.earned ? 'bg-accent/10 ring-4 ring-accent/5' : 'bg-muted',
        )}>
          <Icon className={cn('h-5 w-5', badge.earned ? 'text-accent' : 'text-muted-foreground')} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold">{badge.label}</span>
            {badge.earned && <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{badge.description}</p>
          <div className="flex items-center gap-2 mt-2">
            <Badge className={cn('text-[7px] h-3.5 border-0 rounded-md', catCfg.color)}>{catCfg.label}</Badge>
            {badge.earned && badge.earnedAt && (
              <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />Earned {badge.earnedAt}</span>
            )}
          </div>
          {!badge.earned && badge.progress !== undefined && (
            <div className="mt-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[9px] text-muted-foreground">Progress</span>
                <span className="text-[9px] font-bold">{badge.progress}%</span>
              </div>
              <Progress value={badge.progress} className="h-1.5 rounded-lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   Activity Event Row
   ════════════════════════════════════════════════════════════ */
const ActivityRow: React.FC<{ event: ActivityEvent }> = ({ event }) => {
  const isAchievement = event.type === 'achievement';
  return (
    <div className={cn(
      'flex items-start gap-3 py-2.5 px-3 rounded-xl transition-all hover:bg-muted/30',
      isAchievement && 'bg-accent/5 border border-accent/10 rounded-2xl',
    )}>
      <div className="flex flex-col items-center shrink-0">
        <div className={cn(
          'h-2.5 w-2.5 rounded-full mt-1.5 ring-2 ring-card',
          event.type === 'achievement' ? 'bg-accent' :
          event.type === 'action' ? 'bg-[hsl(var(--state-healthy))]' :
          event.type === 'system' ? 'bg-muted-foreground/40' :
          'bg-[hsl(var(--gigvora-blue))]',
        )} />
        <div className="flex-1 w-px bg-border/50 mt-1" />
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <div className="text-[11px]">
          <span className="font-semibold">{event.actor}</span>{' '}
          <span className="text-muted-foreground">{event.action}</span>{' '}
          {event.target && (
            event.targetLink ? (
              <Link to={event.targetLink} className="font-semibold text-accent hover:underline">{event.target}</Link>
            ) : (
              <span className="font-semibold">{event.target}</span>
            )
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2 w-2" />{event.timestamp}</span>
          <Badge variant="outline" className="text-[7px] h-3.5 rounded-md">{event.module}</Badge>
        </div>
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   Preferences Drawer
   ════════════════════════════════════════════════════════════ */
const PreferencesDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[360px] sm:w-[420px] overflow-y-auto">
      <SheetHeader>
        <SheetTitle className="text-sm font-bold">Notification Preferences</SheetTitle>
      </SheetHeader>
      <div className="space-y-4 mt-4">
        <SectionCard title="Channels">
          {[
            { label: 'In-App Notifications', desc: 'Show notifications inside Gigvora', on: true },
            { label: 'Email Notifications', desc: 'Receive email for important updates', on: true },
            { label: 'Push Notifications', desc: 'Browser push for real-time alerts', on: false },
          ].map(ch => (
            <div key={ch.label} className="flex items-center justify-between py-2.5 border-b last:border-0">
              <div>
                <div className="text-[11px] font-semibold">{ch.label}</div>
                <div className="text-[10px] text-muted-foreground">{ch.desc}</div>
              </div>
              <Switch defaultChecked={ch.on} />
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Module Preferences">
          {['Connections', 'Messages', 'Jobs', 'Payments', 'Projects', 'Reviews', 'Security', 'System'].map(m => (
            <div key={m} className="flex items-center justify-between py-2 border-b last:border-0">
              <span className="text-[11px]">{m}</span>
              <Switch defaultChecked />
            </div>
          ))}
        </SectionCard>
        <SectionCard title="Do Not Disturb">
          <div className="flex items-center justify-between py-2">
            <div>
              <div className="text-[11px] font-semibold flex items-center gap-1"><VolumeX className="h-3 w-3" /> Enable DND</div>
              <div className="text-[10px] text-muted-foreground">Mute all non-critical notifications</div>
            </div>
            <Switch />
          </div>
        </SectionCard>
        <SectionCard title="Digest">
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold block">Email Digest Frequency</label>
            <select className="w-full h-9 rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-2 focus:ring-accent/30">
              <option>Real-time</option>
              <option>Daily digest</option>
              <option>Weekly digest</option>
            </select>
          </div>
        </SectionCard>
        <Button className="w-full text-xs h-9 rounded-xl" onClick={onClose}>Save Preferences</Button>
      </div>
    </SheetContent>
  </Sheet>
);

/* ════════════════════════════════════════════════════════════
   Bulk Action Bar
   ════════════════════════════════════════════════════════════ */
const BulkActionBar: React.FC<{
  count: number;
  onMarkRead: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onClear: () => void;
}> = ({ count, onMarkRead, onArchive, onDelete, onClear }) => {
  if (count === 0) return null;
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border bg-accent/5 border-accent/20 animate-in slide-in-from-top-2 duration-200">
      <Badge className="text-[9px] h-5 bg-accent text-accent-foreground rounded-lg">{count} selected</Badge>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="text-[10px] h-7 rounded-xl gap-1.5" onClick={onMarkRead}>
        <CheckCheck className="h-3 w-3" /> Mark Read
      </Button>
      <Button variant="outline" size="sm" className="text-[10px] h-7 rounded-xl gap-1.5" onClick={onArchive}>
        <Archive className="h-3 w-3" /> Archive
      </Button>
      <Button variant="ghost" size="sm" className="text-[10px] h-7 rounded-xl gap-1.5 text-[hsl(var(--state-blocked))]" onClick={onDelete}>
        <Trash2 className="h-3 w-3" /> Delete
      </Button>
      <button onClick={onClear} className="h-6 w-6 rounded-xl flex items-center justify-center hover:bg-muted transition-colors">
        <X className="h-3 w-3" />
      </button>
    </div>
  );
};

/* ════════════════════════════════════════════════════════════
   Main Page
   ════════════════════════════════════════════════════════════ */
const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState(NOTIFICATIONS);
  const [filter, setFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [prefsOpen, setPrefsOpen] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkSelected, setBulkSelected] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('notifications');
  const [badgeFilter, setBadgeFilter] = useState<string>('all');

  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setLiveTick(t => t + 1), 30000);
    return () => clearInterval(iv);
  }, []);

  const toggleRead = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  const togglePin = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  const archiveNotif = (id: string) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, archived: true } : n));
  const markAllRead = () => setNotifications(prev => prev.map(n => ({ ...n, read: true })));

  const toggleBulkItem = (id: string) => {
    setBulkSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const bulkMarkRead = () => { setNotifications(prev => prev.map(n => bulkSelected.has(n.id) ? { ...n, read: true } : n)); setBulkSelected(new Set()); };
  const bulkArchive = () => { setNotifications(prev => prev.map(n => bulkSelected.has(n.id) ? { ...n, archived: true } : n)); setBulkSelected(new Set()); };
  const bulkDelete = () => { setNotifications(prev => prev.filter(n => !bulkSelected.has(n.id))); setBulkSelected(new Set()); };

  const filtered = useMemo(() => {
    let list = notifications.filter(n => showArchived ? n.archived : !n.archived);
    if (filter === 'unread') list = list.filter(n => !n.read);
    else if (filter === 'pinned') list = list.filter(n => n.pinned);
    else if (filter !== 'all') list = list.filter(n => n.type === filter);
    if (priorityFilter !== 'all') list = list.filter(n => n.priority === priorityFilter);
    const prio: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
    list.sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      if (a.read !== b.read) return a.read ? 1 : -1;
      return prio[a.priority] - prio[b.priority];
    });
    return list;
  }, [notifications, filter, priorityFilter, showArchived]);

  const grouped = useMemo(() => {
    const groups: { label: string; items: Notification[] }[] = [];
    const today: Notification[] = [];
    const yesterday: Notification[] = [];
    const older: Notification[] = [];
    for (const n of filtered) {
      if (n.time.includes('m ago') || n.time.includes('h ago')) today.push(n);
      else if (n.time.includes('1d ago')) yesterday.push(n);
      else older.push(n);
    }
    if (today.length) groups.push({ label: 'Today', items: today });
    if (yesterday.length) groups.push({ label: 'Yesterday', items: yesterday });
    if (older.length) groups.push({ label: 'Older', items: older });
    return groups;
  }, [filtered]);

  const filteredBadges = useMemo(() => {
    if (badgeFilter === 'all') return BADGES;
    if (badgeFilter === 'earned') return BADGES.filter(b => b.earned);
    if (badgeFilter === 'in-progress') return BADGES.filter(b => !b.earned);
    return BADGES.filter(b => b.category === badgeFilter);
  }, [badgeFilter]);

  const selected = notifications.find(n => n.id === selectedId) || null;
  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;
  const criticalCount = notifications.filter(n => n.priority === 'critical' && !n.read).length;
  const todayCount = notifications.filter(n => !n.archived && (n.time.includes('m ago') || n.time.includes('h ago'))).length;
  const earnedBadgesCount = BADGES.filter(b => b.earned).length;

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center">
          <Bell className="h-4 w-4 text-accent" />
        </div>
        <div>
          <span className="text-xs font-bold">Activity Centre</span>
          <div className="hidden sm:flex items-center gap-4 mt-0.5">
            <LiveCounter count={unreadCount} label="unread" pulse accent />
            <LiveCounter count={criticalCount} label="critical" pulse={criticalCount > 0} />
            <LiveCounter count={todayCount} label="today" />
            <LiveCounter count={`${earnedBadgesCount}/${BADGES.length}`} label="badges" />
          </div>
        </div>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="h-8 rounded-xl border bg-background px-2.5 text-[10px] focus:outline-none focus:ring-2 focus:ring-accent/30"
        >
          <option value="all">All priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="normal">Normal</option>
          <option value="low">Low</option>
        </select>
        <Button variant={bulkMode ? 'secondary' : 'ghost'} size="sm" className="text-[10px] h-8 rounded-xl gap-1.5" onClick={() => { setBulkMode(!bulkMode); setBulkSelected(new Set()); }}>
          <Layers className="h-3 w-3" />{bulkMode ? 'Cancel' : 'Bulk'}
        </Button>
        <Button variant={showArchived ? 'secondary' : 'ghost'} size="sm" className="text-[10px] h-8 rounded-xl gap-1.5" onClick={() => setShowArchived(!showArchived)}>
          <Archive className="h-3 w-3" />{showArchived ? 'Inbox' : 'Archive'}
        </Button>
        <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl gap-1.5" onClick={markAllRead}>
          <CheckCheck className="h-3 w-3" /> Mark All Read
        </Button>
        <Button variant="outline" size="sm" className="text-[10px] h-8 rounded-xl gap-1.5" onClick={() => setPrefsOpen(true)}>
          <Settings className="h-3 w-3" /> Preferences
        </Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Unread" value={unreadCount} trend={unreadCount > 0 ? 'up' : 'neutral'} change={unreadCount > 0 ? 'Action needed' : 'All clear'} />
        <KPICard label="Critical" value={criticalCount} trend={criticalCount > 0 ? 'down' : 'neutral'} change={criticalCount > 0 ? 'Immediate' : 'None'} />
        <KPICard label="Today" value={todayCount} />
        <KPICard label="Badges" value={`${earnedBadgesCount}/${BADGES.length}`} />
      </div>

      {selected ? (
        <SectionCard title="Notification Detail" action={
          <button onClick={() => setSelectedId(null)} className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-muted transition-colors"><X className="h-3 w-3 text-muted-foreground" /></button>
        }>
          <NotificationDetail n={selected} onClose={() => setSelectedId(null)} />
        </SectionCard>
      ) : (
        <SectionCard title="Quick Actions">
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="w-full justify-start text-[10px] h-8 rounded-xl gap-2" onClick={markAllRead}>
              <CheckCheck className="h-3 w-3" /> Mark all as read
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-[10px] h-8 rounded-xl gap-2" onClick={() => setPrefsOpen(true)}>
              <Settings className="h-3 w-3" /> Manage preferences
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-[10px] h-8 rounded-xl gap-2" onClick={() => { setBulkMode(true); setActiveTab('notifications'); }}>
              <Layers className="h-3 w-3" /> Bulk select mode
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start text-[10px] h-8 rounded-xl gap-2" asChild>
              <Link to="/settings"><Bell className="h-3 w-3" /> Notification settings</Link>
            </Button>
          </div>
        </SectionCard>
      )}

      {BADGES.filter(b => b.earned).length > 0 && (
        <SectionCard title="Latest Badge">
          <BadgeCard badge={BADGES.filter(b => b.earned)[BADGES.filter(b => b.earned).length - 1]} />
        </SectionCard>
      )}

      <SectionCard title="Connection Status">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--state-healthy))] animate-pulse" />
            <span className="text-[10px] font-medium">Real-time — connected</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Last sync</span>
            <span className="text-muted-foreground">Just now</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">Channel</span>
            <span className="flex items-center gap-1 text-[hsl(var(--state-healthy))]">
              <Globe className="h-2.5 w-2.5" /> WebSocket
            </span>
          </div>
        </div>
        <Button variant="ghost" size="sm" className="w-full text-[10px] h-7 mt-2 rounded-xl gap-1.5">
          <RefreshCw className="h-3 w-3" /> Force Refresh
        </Button>
      </SectionCard>
    </div>
  );

  /* ── Empty State ── */
  const EmptyState = () => (
    <div className="text-center py-16">
      <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
        <Inbox className="h-6 w-6 text-muted-foreground/20" />
      </div>
      <div className="text-sm font-bold">
        {showArchived ? 'No archived notifications' : filter === 'unread' ? 'All caught up!' : 'No notifications'}
      </div>
      <p className="text-[11px] text-muted-foreground mt-1.5 max-w-xs mx-auto">
        {showArchived ? 'Archived items will appear here' : 'New activity will appear here as it happens'}
      </p>
    </div>
  );

  return (
    <>
      <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-80">
        <PriorityBanner notifications={notifications} />

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-3">
          <TabsList className="h-9 bg-muted/50 p-0.5 rounded-xl">
            <TabsTrigger value="notifications" className="text-[10px] h-8 gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Bell className="h-3 w-3" /> Notifications
              {unreadCount > 0 && <span className="text-[8px] bg-accent text-accent-foreground rounded-full px-1.5 min-w-4 text-center font-bold">{unreadCount}</span>}
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-[10px] h-8 gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Activity className="h-3 w-3" /> Activity Feed
            </TabsTrigger>
            <TabsTrigger value="badges" className="text-[10px] h-8 gap-1.5 rounded-lg data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Award className="h-3 w-3" /> Badges
              <span className="text-[8px] bg-muted-foreground/10 text-muted-foreground rounded-full px-1.5 font-medium">{earnedBadgesCount}/{BADGES.length}</span>
            </TabsTrigger>
          </TabsList>

          {/* ── Notifications Tab ── */}
          <TabsContent value="notifications" className="mt-3 space-y-2">
            {/* Module Filters */}
            <div className="flex gap-1.5 overflow-x-auto py-1 scrollbar-none">
              {MODULE_FILTERS.map(f => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap transition-all shrink-0',
                    filter === f.id
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  <f.icon className="h-3 w-3" />
                  {f.label}
                  {f.id === 'unread' && unreadCount > 0 && (
                    <span className="text-[8px] ml-0.5 bg-background/30 rounded-full px-1">{unreadCount}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Bulk Action Bar */}
            {bulkMode && (
              <BulkActionBar
                count={bulkSelected.size}
                onMarkRead={bulkMarkRead}
                onArchive={bulkArchive}
                onDelete={bulkDelete}
                onClear={() => setBulkSelected(new Set())}
              />
            )}

            {/* Grouped Notification List */}
            {grouped.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {grouped.map(group => (
                  <div key={group.label}>
                    <div className="flex items-center gap-2 mb-2 px-1">
                      <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{group.label}</span>
                      <div className="flex-1 h-px bg-border/50" />
                      <span className="text-[9px] text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded-md">{group.items.length}</span>
                    </div>
                    <SectionCard>
                      <div className="space-y-1">
                        {group.items.map(n => (
                          <NotificationRow
                            key={n.id}
                            n={n}
                            selected={selectedId === n.id}
                            bulkMode={bulkMode}
                            checked={bulkSelected.has(n.id)}
                            onSelect={() => setSelectedId(n.id === selectedId ? null : n.id)}
                            onToggleRead={() => toggleRead(n.id)}
                            onTogglePin={() => togglePin(n.id)}
                            onArchive={() => archiveNotif(n.id)}
                            onCheck={() => toggleBulkItem(n.id)}
                          />
                        ))}
                      </div>
                    </SectionCard>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* ── Activity Feed Tab ── */}
          <TabsContent value="activity" className="mt-3">
            <SectionCard title="Recent Activity" subtitle={`${ACTIVITY_EVENTS.length} events`}>
              <div className="space-y-0">
                {ACTIVITY_EVENTS.map(event => (
                  <ActivityRow key={event.id} event={event} />
                ))}
              </div>
            </SectionCard>

            {/* Activity Stats */}
            <div className="grid grid-cols-3 gap-2 mt-3">
              {[
                { label: 'Actions Today', value: '24', color: '' },
                { label: 'This Week', value: '142', color: '' },
                { label: 'vs Last Week', value: '+18%', color: 'text-[hsl(var(--state-healthy))]' },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border bg-card p-4 text-center hover:shadow-sm transition-shadow">
                  <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
                </div>
              ))}
            </div>

            {/* Module breakdown */}
            <SectionCard title="Activity by Module" className="mt-3">
              <div className="space-y-3">
                {[
                  { module: 'Projects', count: 42, pct: 35 },
                  { module: 'Jobs', count: 28, pct: 23 },
                  { module: 'Messages', count: 24, pct: 20 },
                  { module: 'Finance', count: 15, pct: 12 },
                  { module: 'Other', count: 12, pct: 10 },
                ].map(m => (
                  <div key={m.module}>
                    <div className="flex items-center justify-between text-[10px] mb-1">
                      <span className="font-medium">{m.module}</span>
                      <span className="text-muted-foreground">{m.count} events ({m.pct}%)</span>
                    </div>
                    <Progress value={m.pct} className="h-1.5 rounded-lg" />
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          {/* ── Badges Tab ── */}
          <TabsContent value="badges" className="mt-3">
            {/* Badge filters */}
            <div className="flex gap-1.5 overflow-x-auto py-1 mb-3 scrollbar-none">
              {[
                { id: 'all', label: 'All Badges' },
                { id: 'earned', label: 'Earned' },
                { id: 'in-progress', label: 'In Progress' },
                { id: 'milestone', label: 'Milestone' },
                { id: 'streak', label: 'Streak' },
                { id: 'social', label: 'Social' },
                { id: 'quality', label: 'Quality' },
              ].map(f => (
                <button
                  key={f.id}
                  onClick={() => setBadgeFilter(f.id)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-[10px] font-medium whitespace-nowrap transition-all shrink-0',
                    badgeFilter === f.id
                      ? 'bg-accent text-accent-foreground shadow-sm'
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted'
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Badge progress summary */}
            <div className="rounded-2xl border bg-card p-5 mb-3">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs font-bold">Badge Progress</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">{earnedBadgesCount} of {BADGES.length} earned</div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-accent">{Math.round((earnedBadgesCount / BADGES.length) * 100)}%</div>
                  <div className="text-[9px] text-muted-foreground">Complete</div>
                </div>
              </div>
              <Progress value={(earnedBadgesCount / BADGES.length) * 100} className="h-2.5 rounded-lg" />
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {filteredBadges.map(badge => (
                <BadgeCard key={badge.id} badge={badge} />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </DashboardLayout>

      <PreferencesDrawer open={prefsOpen} onClose={() => setPrefsOpen(false)} />
    </>
  );
};

export default NotificationsPage;
