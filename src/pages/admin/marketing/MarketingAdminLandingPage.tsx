/**
 * Marketing Admin Portal — landing.
 * KPI cards, sub-portal grid, recent activity. (AD-017)
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Megaphone, ShieldAlert, BarChart3, Search, Globe, MapPin,
  MessageSquare, Mail, ListTodo, Bell, ArrowRight, TrendingUp,
  TrendingDown, Eye, Activity, Sparkles,
} from 'lucide-react';

interface SubPortal {
  id: string; label: string; description: string; icon: React.ElementType;
  to: string; count: number; countLabel: string;
}

const KPIS = [
  { label: 'Pending ads review', value: '18', delta: '+4', positive: false, icon: ShieldAlert },
  { label: 'Active campaigns', value: '47', delta: '+6', positive: true, icon: Megaphone },
  { label: 'Visitors (24h)', value: '142.8K', delta: '+12.4%', positive: true, icon: Eye },
  { label: 'Conversion rate', value: '3.42%', delta: '+0.18pp', positive: true, icon: TrendingUp },
  { label: 'SEO health score', value: '87', delta: '−2', positive: false, icon: Search },
  { label: 'Open notices', value: '5', delta: '0', positive: true, icon: Bell },
];

const SUB_PORTALS: SubPortal[] = [
  { id: 'ads-mod', label: 'Ads Moderation', description: 'Review pending ad creatives, approve or reject with policy reasoning.', icon: ShieldAlert, to: '/admin/marketing/ads-moderation', count: 18, countLabel: 'pending review' },
  { id: 'campaigns', label: 'Campaigns', description: 'Internal and external campaign records, budgets, and performance.', icon: Megaphone, to: '/admin/marketing/campaigns', count: 47, countLabel: 'active campaigns' },
  { id: 'traffic', label: 'Traffic Analytics', description: 'Sessions, visitors, sources, top pages, real-time activity.', icon: BarChart3, to: '/admin/marketing/traffic', count: 142800, countLabel: 'visitors (24h)' },
  { id: 'seo', label: 'SEO Tools', description: 'Keyword rankings, indexability, sitemap, structured data audit.', icon: Search, to: '/admin/marketing/seo', count: 87, countLabel: 'health score' },
  { id: 'ip', label: 'IP Analysis', description: 'Suspicious IP clusters, geo-fenced traffic, bot detection.', icon: Globe, to: '/admin/marketing/ip-analysis', count: 12, countLabel: 'flagged IPs' },
  { id: 'location', label: 'Location Analysis', description: 'Visitor geo distribution, country/region performance, market focus.', icon: MapPin, to: '/admin/marketing/location-analysis', count: 64, countLabel: 'countries' },
  { id: 'inbox', label: 'Internal Inbox', description: 'Internal chat with marketing team, comms thread per campaign.', icon: MessageSquare, to: '/admin/marketing/inbox', count: 9, countLabel: 'unread' },
  { id: 'emails', label: 'Email Console', description: 'Outbound campaign emails, transactional templates, send logs.', icon: Mail, to: '/admin/marketing/emails', count: 23, countLabel: 'sent today' },
  { id: 'tasks', label: 'Delegated Tasks', description: 'Task delegation across the marketing team with SLA tracking.', icon: ListTodo, to: '/admin/marketing/tasks', count: 11, countLabel: 'open tasks' },
  { id: 'notices', label: 'Notices', description: 'Policy notices, public announcements, internal advisories.', icon: Bell, to: '/admin/marketing/notices', count: 5, countLabel: 'active notices' },
];

const RECENT = [
  { time: '4m ago', actor: 'Operator Lin', action: 'Approved ad creative', target: 'CR-2901 — Spring promo banner' },
  { time: '12m ago', actor: 'Operator Park', action: 'Rejected campaign', target: 'C-1184 — Misleading claims' },
  { time: '34m ago', actor: 'System', action: 'Bot traffic spike detected', target: '4 IPs added to watchlist' },
  { time: '1h ago', actor: 'Operator Rivera', action: 'Published notice', target: 'NT-0042 — Holiday delivery delays' },
  { time: '2h ago', actor: 'Operator Chen', action: 'Delegated task', target: 'Q4 SEO audit → Marketing Ops' },
];

const MarketingAdminLandingPage: React.FC = () => {
  return (
    <div className="min-h-full bg-gradient-to-b from-muted/20 via-background to-background">
      <div className="mx-auto w-full max-w-[1500px] px-8 py-10">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Marketing Admin
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">Marketing operations console</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Ads moderation, campaigns, traffic, SEO, geo & IP analysis, internal comms, tasks, and notices.
            </p>
          </div>
          <Badge variant="secondary" className="gap-1.5 rounded-full px-3 py-1 text-[11px]">
            <Activity className="h-3 w-3 text-emerald-500" /> Marketing pipeline healthy
          </Badge>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-10">
          {KPIS.map((k) => {
            const Icon = k.icon;
            return (
              <div key={k.label} className="rounded-xl border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span
                    className={cn(
                      'inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums',
                      k.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
                    )}
                  >
                    {k.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                    {k.delta}
                  </span>
                </div>
                <div className="text-xl font-semibold tracking-tight tabular-nums">{k.value}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{k.label}</div>
              </div>
            );
          })}
        </div>

        {/* Sub-portal grid + activity */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-6">
          <div>
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-3">Sub-portals</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUB_PORTALS.map((p) => {
                const Icon = p.icon;
                return (
                  <Link
                    key={p.id}
                    to={p.to}
                    className="group rounded-xl border bg-card p-4 hover:border-primary/40 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted/60">
                        <Icon className="h-4 w-4 text-foreground" />
                      </div>
                      <div className="text-right">
                        <div className="text-base font-semibold tabular-nums">{p.count.toLocaleString()}</div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{p.countLabel}</div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <div className="text-sm font-medium">{p.label}</div>
                      <div className="text-xs text-muted-foreground leading-relaxed mt-0.5">{p.description}</div>
                    </div>
                    <div className="mt-3 flex items-center justify-end text-xs text-foreground/60 group-hover:text-foreground">
                      Open <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-3">Recent activity</h2>
            <div className="rounded-xl border bg-card divide-y">
              {RECENT.map((r, i) => (
                <div key={i} className="p-3.5">
                  <div className="text-xs text-muted-foreground">{r.time} · {r.actor}</div>
                  <div className="text-sm mt-0.5">{r.action}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate">{r.target}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketingAdminLandingPage;
