/**
 * Ads Moderation — review queue, approve/reject creatives.
 */
import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  ShieldAlert, Search, Eye, CheckCircle2, XCircle, Flag, Clock,
  Image as ImageIcon, Video, FileText, AlertTriangle, ArrowLeft,
} from 'lucide-react';
import { Link } from 'react-router-dom';

type AdStatus = 'pending' | 'approved' | 'rejected' | 'needs_changes';
type AdRisk = 'low' | 'medium' | 'high';
type AdFormat = 'image' | 'video' | 'text';

interface AdCreative {
  id: string; title: string; advertiser: string; format: AdFormat;
  status: AdStatus; risk: AdRisk; submitted: string; budget: string;
  flags: string[]; preview: string; description: string; landingUrl: string;
  audience: string; placement: string;
}

const ADS: AdCreative[] = [
  { id: 'CR-2901', title: 'Spring promo: 30% off all gigs', advertiser: 'PixelCraft Studio', format: 'image', status: 'pending', risk: 'low', submitted: '12m ago', budget: '£840', flags: [], preview: 'Banner — 1200×628 PNG', description: 'Promotional banner for limited-time spring sale across the design vertical.', landingUrl: 'pixelcraft.gigvora.com/spring', audience: 'UK + EU, 25–44, designers', placement: 'Feed + Discovery' },
  { id: 'CR-2900', title: '2x ROI in 14 days — sales coaching', advertiser: 'GrowthLab', format: 'video', status: 'pending', risk: 'high', submitted: '34m ago', budget: '£3,200', flags: ['unsubstantiated_claim', 'guaranteed_returns'], preview: 'Video — 30s MP4', description: 'Video ad making outcome-based claims about sales coaching results.', landingUrl: 'growthlab.io/coach', audience: 'Global, 25–55, sales pros', placement: 'Reels + Feed' },
  { id: 'CR-2899', title: 'Hire pre-vetted devs in 48h', advertiser: 'TalentRush', format: 'text', status: 'pending', risk: 'medium', submitted: '1h ago', budget: '£1,400', flags: ['competing_marketplace'], preview: 'Text — 2 lines + CTA', description: 'Sponsored result targeting hiring managers searching for developers.', landingUrl: 'talentrush.com', audience: 'US + UK, hiring managers', placement: 'Search results' },
  { id: 'CR-2898', title: 'Build your AI startup with us', advertiser: 'NeuroForge', format: 'image', status: 'pending', risk: 'low', submitted: '2h ago', budget: '£560', flags: [], preview: 'Banner — 728×90 PNG', description: 'Discovery placement for AI consultancy services.', landingUrl: 'neuroforge.ai', audience: 'Global, 30–55, founders', placement: 'Discovery' },
  { id: 'CR-2897', title: 'Crypto returns guaranteed', advertiser: 'CoinSpin', format: 'image', status: 'rejected', risk: 'high', submitted: '5h ago', budget: '£0', flags: ['financial_promise', 'crypto_unregistered'], preview: 'Banner — 300×250', description: 'Rejected for unregistered crypto promotion and guaranteed return claims.', landingUrl: 'coinspin.io', audience: 'Global', placement: 'All' },
  { id: 'CR-2896', title: 'Free design audit — 15 minutes', advertiser: 'Studio North', format: 'text', status: 'approved', risk: 'low', submitted: '1d ago', budget: '£420', flags: [], preview: 'Text — short form', description: 'Approved discovery placement for a free design audit lead magnet.', landingUrl: 'studionorth.co/audit', audience: 'UK only, founders', placement: 'Discovery' },
];

const STATUS_BADGE: Record<AdStatus, string> = {
  pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  rejected: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',
  needs_changes: 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30',
};

const RISK_BADGE: Record<AdRisk, string> = {
  low: 'bg-muted text-foreground/70',
  medium: 'bg-amber-500/15 text-amber-700 dark:text-amber-300',
  high: 'bg-rose-500/15 text-rose-700 dark:text-rose-300',
};

const FORMAT_ICON: Record<AdFormat, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  text: FileText,
};

const AdsModerationPage: React.FC = () => {
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<AdCreative | null>(null);
  const [reason, setReason] = useState('');

  const filtered = useMemo(() => {
    return ADS.filter((a) => a.status === tab || (tab === 'pending' && a.status === 'needs_changes'))
      .filter((a) => !query || a.title.toLowerCase().includes(query.toLowerCase()) || a.advertiser.toLowerCase().includes(query.toLowerCase()));
  }, [tab, query]);

  const handleAction = (verb: 'approved' | 'rejected' | 'flagged' | 'requested changes on') => {
    if (!selected) return;
    toast.success(`${verb.charAt(0).toUpperCase() + verb.slice(1)} ${selected.id}`);
    if (verb === 'approved' || verb === 'rejected') setSelected(null);
    setReason('');
  };

  return (
    <div className="mx-auto w-full max-w-[1500px] px-8 py-8">
      <Link to="/admin/marketing" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to Marketing
      </Link>

      <div className="flex items-end justify-between gap-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" /> Marketing · Ads Moderation
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Ads moderation queue</h1>
          <p className="mt-1 text-sm text-muted-foreground">Review pending creatives, approve or reject with documented policy reasoning.</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="gap-1.5"><Clock className="h-3 w-3" /> SLA: 4h</Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'In queue', value: '18', tone: 'default' },
          { label: 'Approved (24h)', value: '47', tone: 'good' },
          { label: 'Rejected (24h)', value: '6', tone: 'bad' },
          { label: 'SLA breached', value: '2', tone: 'bad' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl border bg-card p-4">
            <div className="text-2xl font-semibold tabular-nums">{k.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <div className="flex items-center justify-between gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="approved">Approved</TabsTrigger>
            <TabsTrigger value="rejected">Rejected</TabsTrigger>
          </TabsList>
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search ads or advertisers" className="pl-9 h-9" />
          </div>
        </div>

        <TabsContent value={tab} className="mt-0">
          <div className="rounded-xl border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-xs text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3">Creative</th>
                  <th className="text-left px-4 py-3">Advertiser</th>
                  <th className="text-left px-4 py-3">Format</th>
                  <th className="text-left px-4 py-3">Risk</th>
                  <th className="text-left px-4 py-3">Budget</th>
                  <th className="text-left px-4 py-3">Submitted</th>
                  <th className="text-left px-4 py-3">Flags</th>
                  <th className="text-right px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="px-4 py-12 text-center text-muted-foreground text-sm">No ads in this view.</td></tr>
                )}
                {filtered.map((a) => {
                  const FormatIcon = FORMAT_ICON[a.format];
                  return (
                    <tr key={a.id} className="border-t hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">{a.title}</div>
                        <div className="text-xs text-muted-foreground font-mono">{a.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{a.advertiser}</td>
                      <td className="px-4 py-3"><span className="inline-flex items-center gap-1 text-xs"><FormatIcon className="h-3 w-3" />{a.format}</span></td>
                      <td className="px-4 py-3"><Badge variant="outline" className={cn('text-[10px] capitalize border-0', RISK_BADGE[a.risk])}>{a.risk}</Badge></td>
                      <td className="px-4 py-3 text-sm tabular-nums">{a.budget}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{a.submitted}</td>
                      <td className="px-4 py-3">
                        {a.flags.length === 0 ? (
                          <span className="text-xs text-muted-foreground">—</span>
                        ) : (
                          <div className="flex flex-wrap gap-1">
                            {a.flags.slice(0, 2).map((f) => (
                              <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-300">{f.replace(/_/g, ' ')}</span>
                            ))}
                            {a.flags.length > 2 && <span className="text-[10px] text-muted-foreground">+{a.flags.length - 2}</span>}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" onClick={() => setSelected(a)}><Eye className="h-3.5 w-3.5 mr-1" />Review</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      {/* Review drawer */}
      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShieldAlert className="h-4 w-4" /> {selected?.id}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold">{selected.title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{selected.advertiser}</p>
              </div>

              <div className="rounded-lg border bg-muted/30 p-4 flex items-center justify-center text-xs text-muted-foreground h-40">
                {selected.preview}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><div className="text-xs text-muted-foreground">Status</div><Badge variant="outline" className={cn('mt-1 border-0', STATUS_BADGE[selected.status])}>{selected.status.replace('_', ' ')}</Badge></div>
                <div><div className="text-xs text-muted-foreground">Risk</div><Badge variant="outline" className={cn('mt-1 border-0', RISK_BADGE[selected.risk])}>{selected.risk}</Badge></div>
                <div><div className="text-xs text-muted-foreground">Budget</div><div className="font-medium tabular-nums">{selected.budget}</div></div>
                <div><div className="text-xs text-muted-foreground">Format</div><div className="font-medium capitalize">{selected.format}</div></div>
                <div className="col-span-2"><div className="text-xs text-muted-foreground">Landing URL</div><div className="font-mono text-xs">{selected.landingUrl}</div></div>
                <div className="col-span-2"><div className="text-xs text-muted-foreground">Audience</div><div className="text-sm">{selected.audience}</div></div>
                <div className="col-span-2"><div className="text-xs text-muted-foreground">Placement</div><div className="text-sm">{selected.placement}</div></div>
              </div>

              {selected.flags.length > 0 && (
                <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 p-3">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 mb-2">
                    <AlertTriangle className="h-3.5 w-3.5" /> Policy flags
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {selected.flags.map((f) => (
                      <span key={f} className="text-xs px-2 py-0.5 rounded bg-background border">{f.replace(/_/g, ' ')}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-muted-foreground">Decision reasoning (logged to audit)</label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the policy basis for this decision…" className="mt-1.5 min-h-24" />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="outline" onClick={() => handleAction('requested changes on')}>Request changes</Button>
                <Button variant="outline" onClick={() => handleAction('flagged')}><Flag className="h-4 w-4 mr-1.5" />Flag for review</Button>
                <Button onClick={() => handleAction('approved')} className="bg-emerald-600 hover:bg-emerald-700"><CheckCircle2 className="h-4 w-4 mr-1.5" />Approve</Button>
                <Button onClick={() => handleAction('rejected')} variant="destructive"><XCircle className="h-4 w-4 mr-1.5" />Reject</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdsModerationPage;
