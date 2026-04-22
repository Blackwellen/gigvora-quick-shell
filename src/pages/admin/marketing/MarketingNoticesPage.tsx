import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Bell, Plus, Globe, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Notice {
  id: string; title: string; body: string; visibility: 'public' | 'internal'; severity: 'info' | 'warn' | 'critical';
  publishedAt: string; expiresAt: string; author: string;
}

const NOTICES: Notice[] = [
  { id: 'NT-0042', title: 'Holiday delivery delays — affecting EU shipments', body: 'Carrier capacity issues across mainland Europe. Sellers should set realistic delivery windows for orders placed Apr 18 onward.', visibility: 'public', severity: 'warn', publishedAt: '1h ago', expiresAt: 'Apr 30', author: 'Operator Rivera' },
  { id: 'NT-0041', title: 'Ads moderation SLA temporarily extended to 6h', body: 'Higher-than-normal volume of submissions ahead of the spring promo. Standard 4h SLA returns Monday.', visibility: 'internal', severity: 'info', publishedAt: '4h ago', expiresAt: 'Apr 22', author: 'Lin Park' },
  { id: 'NT-0040', title: 'Mandatory creative refresh — old logo assets', body: 'All campaigns using pre-Q4 logo must refresh by Apr 25. Auto-pause enforcement begins Apr 26.', visibility: 'public', severity: 'critical', publishedAt: '1d ago', expiresAt: 'Apr 25', author: 'Marcus Rivera' },
  { id: 'NT-0039', title: 'New attribution model rollout', body: 'Switching to data-driven attribution for paid campaigns from May 1. See internal doc for migration steps.', visibility: 'internal', severity: 'info', publishedAt: '2d ago', expiresAt: 'May 01', author: 'Priya Patel' },
  { id: 'NT-0038', title: 'Suspicious traffic from AS14061 — added to watchlist', body: '4 IPs flagged and rate-limited. Marketing team should expect ~3% short-term dip in raw session metrics.', visibility: 'internal', severity: 'warn', publishedAt: '3d ago', expiresAt: 'Apr 21', author: 'System' },
];

const SEVERITY = {
  info: 'bg-sky-500/15 text-sky-700 dark:text-sky-300',
  warn: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  critical: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const MarketingNoticesPage: React.FC = () => (
  <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
    <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
      <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
    </Link>
    <div className="flex items-end justify-between gap-6 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground"><Bell className="h-3.5 w-3.5" /> Marketing · Notices</div>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Active notices</h1>
        <p className="mt-1 text-sm text-muted-foreground">Public announcements and internal advisories from the marketing team.</p>
      </div>
      <Button><Plus className="h-4 w-4 mr-1.5" /> Publish notice</Button>
    </div>

    <div className="space-y-3">
      {NOTICES.map((n) => (
        <div key={n.id} className="rounded-xl border bg-card p-5 hover:shadow-sm transition-shadow">
          <div className="flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className={cn('text-[10px] capitalize border-0', SEVERITY[n.severity])}>{n.severity}</Badge>
                <Badge variant="outline" className="text-[10px] gap-1">
                  {n.visibility === 'public' ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}
                  {n.visibility}
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">{n.id}</span>
              </div>
              <h3 className="text-base font-semibold tracking-tight">{n.title}</h3>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{n.body}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-3">
                <span>Published {n.publishedAt} by <span className="text-foreground/80">{n.author}</span></span>
                <span>·</span>
                <span>Expires {n.expiresAt}</span>
              </div>
            </div>
            <Button variant="outline" size="sm">Edit</Button>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default MarketingNoticesPage;
