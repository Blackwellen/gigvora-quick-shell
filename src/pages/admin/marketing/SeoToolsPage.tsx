/**
 * Marketing — SEO Tools. Rankings, indexability, structured data.
 */
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import {
  Search, ArrowLeft, TrendingUp, TrendingDown, CheckCircle2,
  AlertTriangle, XCircle, RefreshCw, FileText, Globe, Link2,
} from 'lucide-react';

const HEALTH = [
  { metric: 'Indexable pages', value: 1842, total: 1920, percent: 95.9, status: 'good' as const },
  { metric: 'Pages with meta description', value: 1740, total: 1842, percent: 94.5, status: 'good' as const },
  { metric: 'Pages with JSON-LD', value: 982, total: 1842, percent: 53.3, status: 'warn' as const },
  { metric: 'Pages with valid canonical', value: 1820, total: 1842, percent: 98.8, status: 'good' as const },
  { metric: 'Mobile-friendly pages', value: 1842, total: 1842, percent: 100, status: 'good' as const },
  { metric: 'Pages with broken links', value: 14, total: 1842, percent: 0.8, status: 'bad' as const },
];

const KEYWORDS = [
  { keyword: 'freelance designer hire', position: 4, prevPosition: 6, volume: 12400, traffic: 1840 },
  { keyword: 'gig marketplace uk', position: 2, prevPosition: 3, volume: 8900, traffic: 2410 },
  { keyword: 'hire developers fast', position: 8, prevPosition: 5, volume: 14800, traffic: 720 },
  { keyword: 'project marketplace', position: 6, prevPosition: 9, volume: 6200, traffic: 940 },
  { keyword: 'professional services platform', position: 11, prevPosition: 14, volume: 3400, traffic: 280 },
  { keyword: 'video production gigs', position: 3, prevPosition: 4, volume: 4800, traffic: 1120 },
];

const ISSUES = [
  { severity: 'critical', count: 2, label: 'Pages missing canonical tags', icon: XCircle },
  { severity: 'warn', count: 14, label: 'Broken outbound links', icon: AlertTriangle },
  { severity: 'warn', count: 102, label: 'Pages without JSON-LD structured data', icon: AlertTriangle },
  { severity: 'info', count: 8, label: 'Slow LCP on /jobs detail pages', icon: AlertTriangle },
];

const SeoToolsPage: React.FC = () => {
  return (
    <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
      <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
      </Link>

      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <Search className="h-3.5 w-3.5" /> Marketing · SEO Tools
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">SEO health & rankings</h1>
          <p className="mt-1 text-sm text-muted-foreground">Indexability, structured data audit, keyword rankings, and crawl issues.</p>
        </div>
        <Button variant="outline"><RefreshCw className="h-4 w-4 mr-1.5" /> Recrawl now</Button>
      </div>

      {/* Score */}
      <div className="rounded-xl border bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent p-6 mb-6">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-background shadow-sm">
            <span className="text-3xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">87</span>
          </div>
          <div className="flex-1">
            <div className="text-xs uppercase tracking-wider text-muted-foreground">Overall SEO health</div>
            <div className="text-lg font-semibold mt-0.5">Healthy with 2 critical issues to address</div>
            <div className="text-sm text-muted-foreground mt-1">Down 2 points vs last week. JSON-LD coverage is the biggest opportunity.</div>
          </div>
          <div className="text-right">
            <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-0">Healthy</Badge>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Health checks */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
            <FileText className="h-4 w-4" /> Crawl & indexability
          </h3>
          <div className="space-y-4">
            {HEALTH.map((h) => (
              <div key={h.metric} className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span>{h.metric}</span>
                  <span className="tabular-nums text-muted-foreground">{h.value.toLocaleString()} / {h.total.toLocaleString()} ({h.percent.toFixed(1)}%)</span>
                </div>
                <Progress
                  value={h.percent}
                  className={cn(
                    'h-1.5',
                    h.status === 'good' && '[&>div]:bg-emerald-500',
                    h.status === 'warn' && '[&>div]:bg-amber-500',
                    h.status === 'bad' && '[&>div]:bg-rose-500',
                  )}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Issues */}
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-sm font-semibold tracking-tight mb-4 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Open issues
          </h3>
          <div className="space-y-2">
            {ISSUES.map((i) => {
              const Icon = i.icon;
              return (
                <div key={i.label} className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border',
                  i.severity === 'critical' && 'border-rose-500/30 bg-rose-500/5',
                  i.severity === 'warn' && 'border-amber-500/30 bg-amber-500/5',
                  i.severity === 'info' && 'border-sky-500/30 bg-sky-500/5',
                )}>
                  <Icon className={cn(
                    'h-4 w-4 shrink-0',
                    i.severity === 'critical' && 'text-rose-600 dark:text-rose-400',
                    i.severity === 'warn' && 'text-amber-600 dark:text-amber-400',
                    i.severity === 'info' && 'text-sky-600 dark:text-sky-400',
                  )} />
                  <div className="flex-1 text-sm">{i.label}</div>
                  <Badge variant="outline" className="tabular-nums">{i.count}</Badge>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-4 border-t flex items-center gap-2 text-xs text-muted-foreground">
            <Link2 className="h-3.5 w-3.5" /> Last crawl: 2h 14m ago · 1,920 URLs crawled
          </div>
        </div>
      </div>

      {/* Keywords */}
      <div className="rounded-xl border bg-card overflow-hidden mt-6">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="text-sm font-semibold tracking-tight flex items-center gap-2">
            <Globe className="h-4 w-4" /> Keyword rankings (top 50)
          </h3>
          <Button variant="ghost" size="sm">Export CSV</Button>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs text-muted-foreground">
            <tr>
              <th className="text-left px-4 py-3">Keyword</th>
              <th className="text-right px-4 py-3">Position</th>
              <th className="text-right px-4 py-3">Δ</th>
              <th className="text-right px-4 py-3">Volume / mo</th>
              <th className="text-right px-4 py-3">Est. traffic</th>
            </tr>
          </thead>
          <tbody>
            {KEYWORDS.map((k) => {
              const change = k.prevPosition - k.position;
              return (
                <tr key={k.keyword} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{k.keyword}</td>
                  <td className="px-4 py-3 text-right tabular-nums">#{k.position}</td>
                  <td className={cn('px-4 py-3 text-right tabular-nums text-xs', change > 0 ? 'text-emerald-600 dark:text-emerald-400' : change < 0 ? 'text-rose-600 dark:text-rose-400' : 'text-muted-foreground')}>
                    {change > 0 ? <span className="inline-flex items-center"><TrendingUp className="h-3 w-3 mr-0.5" />+{change}</span>
                      : change < 0 ? <span className="inline-flex items-center"><TrendingDown className="h-3 w-3 mr-0.5" />{change}</span>
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{k.volume.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{k.traffic.toLocaleString()}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SeoToolsPage;
