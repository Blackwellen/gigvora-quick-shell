/**
 * Marketing — Traffic Analytics. Sources, top pages, real-time.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  BarChart3, ArrowLeft, TrendingUp, TrendingDown, Eye, Users,
  Clock, MousePointerClick,
} from 'lucide-react';

const KPIS = [
  { label: 'Visitors (24h)', value: '142,820', delta: '+12.4%', positive: true, icon: Users },
  { label: 'Sessions (24h)', value: '198,440', delta: '+8.7%', positive: true, icon: Eye },
  { label: 'Avg. session', value: '4m 32s', delta: '+18s', positive: true, icon: Clock },
  { label: 'Bounce rate', value: '38.2%', delta: '−2.1pp', positive: true, icon: MousePointerClick },
];

const SOURCES = [
  { source: 'Direct', visitors: 48420, share: 33.9, delta: 4.2 },
  { source: 'Organic search', visitors: 36180, share: 25.3, delta: 8.1 },
  { source: 'Paid search', visitors: 22840, share: 16.0, delta: -2.4 },
  { source: 'Referrals', visitors: 14920, share: 10.4, delta: 1.8 },
  { source: 'Social', visitors: 12480, share: 8.7, delta: 22.0 },
  { source: 'Email', visitors: 7980, share: 5.6, delta: -3.6 },
];

const PAGES = [
  { path: '/', visitors: 38420, avgTime: '1m 12s', bounce: 42 },
  { path: '/discover/gigs', visitors: 22180, avgTime: '3m 48s', bounce: 28 },
  { path: '/jobs', visitors: 18920, avgTime: '4m 22s', bounce: 31 },
  { path: '/services', visitors: 14260, avgTime: '5m 02s', bounce: 24 },
  { path: '/pricing', visitors: 11880, avgTime: '2m 38s', bounce: 48 },
  { path: '/sign-up', visitors: 9420, avgTime: '1m 48s', bounce: 22 },
  { path: '/about', visitors: 6240, avgTime: '2m 12s', bounce: 56 },
];

const REALTIME = [
  { country: 'United Kingdom', active: 1240, page: '/discover/gigs' },
  { country: 'United States', active: 982, page: '/jobs' },
  { country: 'Germany', active: 412, page: '/services' },
  { country: 'France', active: 298, page: '/' },
  { country: 'Netherlands', active: 184, page: '/discover/services' },
  { country: 'Spain', active: 142, page: '/jobs' },
  { country: 'Other', active: 720, page: 'various' },
];

const TrafficAnalyticsPage: React.FC = () => {
  const totalRealtime = REALTIME.reduce((s, r) => s + r.active, 0);

  return (
    <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
      <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
      </Link>

      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <BarChart3 className="h-3.5 w-3.5" /> Marketing · Traffic Analytics
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Traffic & engagement</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sessions, visitors, top sources, and real-time activity across the platform.</p>
        </div>
        <Badge variant="secondary" className="gap-1.5">
          <span className="relative inline-flex h-2 w-2"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>
          {totalRealtime.toLocaleString()} active now
        </Badge>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {KPIS.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-xl border bg-card p-4">
              <div className="flex items-center justify-between">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className={cn('inline-flex items-center gap-0.5 text-[10px] font-medium tabular-nums', k.positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                  {k.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {k.delta}
                </span>
              </div>
              <div className="text-2xl font-semibold tabular-nums mt-2">{k.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{k.label}</div>
            </div>
          );
        })}
      </div>

      <Tabs defaultValue="sources">
        <TabsList className="mb-4">
          <TabsTrigger value="sources">Sources</TabsTrigger>
          <TabsTrigger value="pages">Top pages</TabsTrigger>
          <TabsTrigger value="realtime">Real-time</TabsTrigger>
        </TabsList>

        <TabsContent value="sources" className="mt-0">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-sm font-semibold tracking-tight mb-4">Traffic sources (last 24h)</h3>
            <div className="space-y-3">
              {SOURCES.map((s) => (
                <div key={s.source} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-medium w-32">{s.source}</span>
                      <span className="text-muted-foreground tabular-nums">{s.visitors.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground tabular-nums text-xs">{s.share.toFixed(1)}%</span>
                      <span className={cn('inline-flex items-center gap-0.5 text-xs font-medium tabular-nums w-14 justify-end', s.delta >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400')}>
                        {s.delta >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {Math.abs(s.delta).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${s.share * 2.95}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="pages" className="mt-0">
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Path</th>
                  <th className="text-right px-4 py-3">Visitors (24h)</th>
                  <th className="text-right px-4 py-3">Avg. time</th>
                  <th className="text-right px-4 py-3">Bounce rate</th>
                </tr>
              </thead>
              <tbody>
                {PAGES.map((p) => (
                  <tr key={p.path} className="border-t hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{p.path}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.visitors.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{p.avgTime}</td>
                    <td className="px-4 py-3 text-right tabular-nums">{p.bounce}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="realtime" className="mt-0">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-sm font-semibold tracking-tight mb-4">Active visitors right now — by country</h3>
            <div className="space-y-2">
              {REALTIME.map((r) => (
                <div key={r.country} className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/40 transition-colors">
                  <div>
                    <div className="text-sm font-medium">{r.country}</div>
                    <div className="text-xs text-muted-foreground font-mono">{r.page}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-semibold tabular-nums">{r.active.toLocaleString()}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">active</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrafficAnalyticsPage;
