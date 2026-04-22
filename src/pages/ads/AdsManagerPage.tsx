import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Megaphone, Plus, TrendingUp, Eye, MousePointer, DollarSign,
  Target, Users, BarChart3, Layers, Image, Video, FileText,
  Search, Filter, Play, Pause, Settings, Calendar, ArrowRight,
  CheckCircle2, AlertCircle, Sparkles, Star, Zap, Globe,
  Hash, Clock, Download, MoreHorizontal, Copy, Trash2,
  ChevronRight, MapPin, Smartphone, RefreshCw, X, Edit,
  PieChart, Lightbulb, Shield, Flag, ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type ATab = 'campaigns' | 'detail' | 'builder' | 'creatives' | 'audience' | 'geo' | 'forecast' | 'mobile';
type CampaignStatus = 'active' | 'paused' | 'draft' | 'review' | 'completed' | 'rejected';

interface Campaign {
  id: string; name: string; status: CampaignStatus; objective: string;
  budget: string; spent: string; remaining: string;
  impressions: string; clicks: string; ctr: string; conversions: number;
  cpc: string; cpm: string; cpa: string; roas: string;
  startDate: string; endDate: string; adSets: number; creatives: number;
}
interface Creative {
  id: string; name: string; type: 'image' | 'video' | 'text' | 'carousel';
  status: 'approved' | 'pending' | 'rejected'; usedIn: number;
  impressions: string; ctr: string; lastEdited: string;
}
interface AudienceSegment {
  id: string; name: string; type: 'custom' | 'lookalike' | 'retargeting' | 'behavioral';
  size: string; overlap?: string; campaigns: number;
}
interface GeoTarget {
  region: string; impressions: string; clicks: string; ctr: string; spend: string; conversions: number;
}

// ── Mock Data ──
const CAMPAIGNS: Campaign[] = [
  { id: 'CMP-001', name: 'Q2 Brand Awareness', status: 'active', objective: 'Awareness', budget: '$5,000', spent: '$2,340', remaining: '$2,660', impressions: '145K', clicks: '3.2K', ctr: '2.2%', conversions: 45, cpc: '$0.73', cpm: '$16.14', cpa: '$52.00', roas: '3.4x', startDate: 'Mar 15', endDate: 'May 15', adSets: 3, creatives: 8 },
  { id: 'CMP-002', name: 'Recruiter Pro Launch', status: 'active', objective: 'Conversion', budget: '$8,000', spent: '$4,120', remaining: '$3,880', impressions: '89K', clicks: '4.5K', ctr: '5.1%', conversions: 123, cpc: '$0.92', cpm: '$46.29', cpa: '$33.50', roas: '5.2x', startDate: 'Apr 1', endDate: 'Jun 1', adSets: 4, creatives: 12 },
  { id: 'CMP-003', name: 'Freelancer Retargeting', status: 'paused', objective: 'Consideration', budget: '$3,000', spent: '$1,800', remaining: '$1,200', impressions: '67K', clicks: '1.8K', ctr: '2.7%', conversions: 34, cpc: '$1.00', cpm: '$26.87', cpa: '$52.94', roas: '2.8x', startDate: 'Feb 20', endDate: 'Apr 20', adSets: 2, creatives: 5 },
  { id: 'CMP-004', name: 'Enterprise Sales Funnel', status: 'draft', objective: 'Lead Gen', budget: '$12,000', spent: '$0', remaining: '$12,000', impressions: '0', clicks: '0', ctr: '0%', conversions: 0, cpc: '-', cpm: '-', cpa: '-', roas: '-', startDate: 'Apr 15', endDate: 'Jul 15', adSets: 0, creatives: 3 },
  { id: 'CMP-005', name: 'Gig Marketplace Awareness', status: 'review', objective: 'Awareness', budget: '$4,500', spent: '$0', remaining: '$4,500', impressions: '0', clicks: '0', ctr: '0%', conversions: 0, cpc: '-', cpm: '-', cpa: '-', roas: '-', startDate: 'Apr 20', endDate: 'Jun 20', adSets: 2, creatives: 6 },
  { id: 'CMP-006', name: 'Holiday Promo Blast', status: 'completed', objective: 'Conversion', budget: '$6,000', spent: '$5,940', remaining: '$60', impressions: '210K', clicks: '7.8K', ctr: '3.7%', conversions: 198, cpc: '$0.76', cpm: '$28.29', cpa: '$30.00', roas: '6.1x', startDate: 'Dec 1', endDate: 'Dec 31', adSets: 5, creatives: 15 },
];

const CREATIVES: Creative[] = [
  { id: 'CR-01', name: 'Hero Banner — Q2 Brand', type: 'image', status: 'approved', usedIn: 2, impressions: '89K', ctr: '2.4%', lastEdited: 'Apr 5' },
  { id: 'CR-02', name: 'Product Walkthrough', type: 'video', status: 'approved', usedIn: 3, impressions: '112K', ctr: '4.1%', lastEdited: 'Apr 2' },
  { id: 'CR-03', name: 'Recruiter Pro CTA', type: 'text', status: 'approved', usedIn: 4, impressions: '56K', ctr: '5.8%', lastEdited: 'Mar 28' },
  { id: 'CR-04', name: 'Feature Carousel', type: 'carousel', status: 'approved', usedIn: 1, impressions: '34K', ctr: '3.2%', lastEdited: 'Apr 8' },
  { id: 'CR-05', name: 'Testimonial Video', type: 'video', status: 'pending', usedIn: 0, impressions: '0', ctr: '-', lastEdited: 'Apr 10' },
  { id: 'CR-06', name: 'Holiday Sale Banner', type: 'image', status: 'rejected', usedIn: 0, impressions: '0', ctr: '-', lastEdited: 'Apr 9' },
];

const AUDIENCES: AudienceSegment[] = [
  { id: 'AUD-1', name: 'Tech Decision Makers', type: 'custom', size: '1.2M', campaigns: 2 },
  { id: 'AUD-2', name: 'Freelancers 25-45', type: 'custom', size: '890K', campaigns: 1 },
  { id: 'AUD-3', name: 'Lookalike: Top Converters', type: 'lookalike', size: '2.1M', overlap: '18%', campaigns: 3 },
  { id: 'AUD-4', name: 'Website Retargeting', type: 'retargeting', size: '45K', campaigns: 2 },
  { id: 'AUD-5', name: 'High-Intent Job Seekers', type: 'behavioral', size: '340K', overlap: '12%', campaigns: 1 },
];

const GEO_DATA: GeoTarget[] = [
  { region: 'United States', impressions: '189K', clicks: '6.2K', ctr: '3.3%', spend: '$4,120', conversions: 134 },
  { region: 'United Kingdom', impressions: '45K', clicks: '1.4K', ctr: '3.1%', spend: '$980', conversions: 28 },
  { region: 'Canada', impressions: '32K', clicks: '890', ctr: '2.8%', spend: '$640', conversions: 19 },
  { region: 'Germany', impressions: '28K', clicks: '720', ctr: '2.6%', spend: '$520', conversions: 14 },
  { region: 'Australia', impressions: '18K', clicks: '560', ctr: '3.1%', spend: '$380', conversions: 11 },
];

const KEYWORDS = [
  { keyword: 'freelance developer', volume: '12.5K', competition: 'High', bid: '$2.40', opportunity: 85 },
  { keyword: 'hire designer', volume: '8.2K', competition: 'Medium', bid: '$1.80', opportunity: 72 },
  { keyword: 'gig marketplace', volume: '3.2K', competition: 'Low', bid: '$0.90', opportunity: 91 },
  { keyword: 'talent sourcing tool', volume: '2.1K', competition: 'Low', bid: '$1.20', opportunity: 88 },
  { keyword: 'remote jobs', volume: '45K', competition: 'Very High', bid: '$4.50', opportunity: 42 },
];

const ACTIVITY = [
  { actor: 'System', action: 'CMP-002 daily spend: $137 — on pace', time: '2h ago', type: 'spend' },
  { actor: 'Alex K.', action: 'Paused CMP-003 — diminishing returns', time: '1d ago', type: 'action' },
  { actor: 'System', action: 'CR-06 rejected — policy violation: text overlay', time: '1d ago', type: 'alert' },
  { actor: 'Growth Team', action: 'CMP-005 submitted for review', time: '2d ago', type: 'review' },
  { actor: 'System', action: 'CMP-006 completed — ROAS 6.1x', time: '3d ago', type: 'complete' },
];

const CS_MAP: Record<CampaignStatus, 'healthy' | 'caution' | 'pending' | 'blocked' | 'degraded' | 'review'> = {
  active: 'healthy', paused: 'caution', draft: 'pending', review: 'review', completed: 'degraded', rejected: 'blocked',
};
const CR_MAP: Record<string, 'healthy' | 'pending' | 'blocked'> = { approved: 'healthy', pending: 'pending', rejected: 'blocked' };
const TYPE_ICON: Record<string, typeof Image> = { image: Image, video: Video, text: FileText, carousel: Layers };

// ── Campaign Detail Drawer ──
const CampaignDrawer: React.FC<{ campaign: Campaign | null; open: boolean; onClose: () => void }> = ({ campaign, open, onClose }) => {
  if (!campaign) return null;
  const spentNum = parseFloat(campaign.spent.replace(/[$,]/g, ''));
  const budgetNum = parseFloat(campaign.budget.replace(/[$,]/g, ''));
  const pct = budgetNum > 0 ? (spentNum / budgetNum) * 100 : 0;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[460px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Megaphone className="h-4 w-4 text-accent" />{campaign.id}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="text-center py-3">
            <div className="text-lg font-bold">{campaign.name}</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">{campaign.objective}</div>
            <StatusBadge status={CS_MAP[campaign.status]} label={campaign.status} className="mt-1" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { l: 'Budget', v: campaign.budget }, { l: 'Spent', v: campaign.spent }, { l: 'Remaining', v: campaign.remaining },
              { l: 'Impressions', v: campaign.impressions }, { l: 'Clicks', v: campaign.clicks }, { l: 'CTR', v: campaign.ctr },
              { l: 'CPC', v: campaign.cpc }, { l: 'CPM', v: campaign.cpm }, { l: 'CPA', v: campaign.cpa },
              { l: 'Conversions', v: String(campaign.conversions) }, { l: 'ROAS', v: campaign.roas }, { l: 'Ad Sets', v: String(campaign.adSets) },
            ].map(m => (
              <div key={m.l} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-semibold">{m.v}</div></div>
            ))}
          </div>
          <div>
            <div className="flex justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">Budget Utilization</span><span className="font-medium">{Math.round(pct)}%</span></div>
            <Progress value={pct} className={cn('h-1.5', pct > 90 && '[&>div]:bg-destructive')} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">Start</div><div className="text-[9px] font-medium">{campaign.startDate}</div></div>
            <div className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">End</div><div className="text-[9px] font-medium">{campaign.endDate}</div></div>
          </div>
          {campaign.status === 'review' && (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-3">
              <div className="flex items-center gap-1.5 text-accent text-[10px] font-semibold mb-1"><Clock className="h-3 w-3" />Pending Review</div>
              <p className="text-[8px] text-muted-foreground">Campaign submitted for policy review. Expected approval within 24h.</p>
            </div>
          )}
          {campaign.status === 'rejected' && (
            <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 text-destructive text-[10px] font-semibold mb-1"><AlertCircle className="h-3 w-3" />Rejected</div>
              <p className="text-[8px] text-muted-foreground">Creative policy violation. Update creatives and resubmit.</p>
              <Button size="sm" className="h-5 text-[8px] mt-1.5 rounded-lg">Edit & Resubmit</Button>
            </div>
          )}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {campaign.status === 'active' && <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Paused')}><Pause className="h-2.5 w-2.5" />Pause</Button>}
            {campaign.status === 'paused' && <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.success('Resumed')}><Play className="h-2.5 w-2.5" />Resume</Button>}
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Copy className="h-2.5 w-2.5" />Duplicate</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Edit className="h-2.5 w-2.5" />Edit</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Downloading')}><Download className="h-2.5 w-2.5" />Report</Button>
            <Link to="/ads/analytics"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><BarChart3 className="h-2.5 w-2.5" />Analytics</Button></Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const AdsManagerPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<ATab>('campaigns');
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [builderStep, setBuilderStep] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [creativeDrawer, setCreativeDrawer] = useState<Creative | null>(null);

  const filteredCampaigns = CAMPAIGNS.filter(c => {
    const ms = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.id.toLowerCase().includes(search.toLowerCase());
    const mst = statusFilter === 'all' || c.status === statusFilter;
    return ms && mst;
  });

  const topStrip = (
    <>
      <Megaphone className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Ads Manager · Campaigns · Creatives · Targeting</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3" />Create Campaign</Button>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting')}><Download className="h-3 w-3" />Export</Button>
      <Link to="/ads/analytics"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><BarChart3 className="h-3 w-3" />Analytics</Button></Link>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Ad Spend" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-lg font-bold">$8,260</div>
        <div className="text-[8px] text-muted-foreground">This month · Budget: $28,500</div>
        <Progress value={29} className="h-1.5 mt-1" />
        <div className="text-[7px] text-muted-foreground mt-0.5">29% of monthly cap</div>
      </SectionCard>

      <SectionCard title="Top Performers" icon={<TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
        {CAMPAIGNS.filter(c => c.status === 'active').slice(0, 2).map(c => (
          <div key={c.id} className="flex items-center gap-2 py-1.5 border-b last:border-0 cursor-pointer" onClick={() => setSelectedCampaign(c)}>
            <div className="flex-1 min-w-0"><div className="text-[8px] font-medium truncate">{c.name}</div><div className="text-[7px] text-muted-foreground">{c.roas} ROAS · {c.ctr} CTR</div></div>
            <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
          </div>
        ))}
      </SectionCard>

      <SectionCard title="Pending Actions" icon={<AlertCircle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'CMP-005 awaiting review', badge: 'Review' },
            { label: 'CR-05 pending approval', badge: 'Creative' },
            { label: 'CR-06 rejected — update needed', badge: 'Action' },
          ].map(a => (
            <div key={a.label} className="flex items-center gap-1.5 p-1.5 rounded-lg border text-[8px]">
              <div className="flex-1">{a.label}</div>
              <Badge variant="secondary" className="text-[5px]">{a.badge}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="AI Recommendations" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { rec: 'Increase CMP-002 budget +20%', impact: '+35% conv.' },
            { rec: 'Add "gig marketplace" keyword', impact: 'Low CPC' },
            { rec: 'Test video creatives', impact: '+20% eng.' },
          ].map(r => (
            <div key={r.rec} className="rounded-lg border p-1.5">
              <div className="text-[7px] font-medium">{r.rec}</div>
              <Badge variant="secondary" className="text-[5px] mt-0.5">{r.impact}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Ads Analytics', icon: BarChart3, to: '/ads/analytics' },
            { label: 'Billing', icon: DollarSign, to: '/finance/billing' },
            { label: 'Wallet', icon: DollarSign, to: '/finance/wallet' },
          ].map(a => (
            <Link key={a.label} to={a.to}><button className="flex items-center gap-2 p-1.5 rounded-lg w-full text-left hover:bg-muted/30 transition-colors text-[8px]"><a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span><ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" /></button></Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-accent" />Ads Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3 py-2 min-w-[220px] hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-0.5"><span className="text-[9px] font-medium">{a.actor}</span><Badge variant="secondary" className="text-[6px] capitalize">{a.type}</Badge></div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Tab Nav */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'campaigns' as const, label: 'Campaign List', icon: Layers },
          { key: 'detail' as const, label: 'Campaign Detail', icon: Eye },
          { key: 'builder' as const, label: 'Builder', icon: Plus },
          { key: 'creatives' as const, label: 'Creative Library', icon: Image },
          { key: 'audience' as const, label: 'Audience Builder', icon: Users },
          { key: 'geo' as const, label: 'Geo / Keywords', icon: MapPin },
          { key: 'forecast' as const, label: 'Forecasting', icon: Sparkles },
          { key: 'mobile' as const, label: 'Mobile Monitor', icon: Smartphone },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0', tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ CAMPAIGN LIST ═══ */}
      {tab === 'campaigns' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Spend" value="$8,260" change="+12% MoM" trend="up" />
            <KPICard label="Impressions" value="301K" change="+18%" trend="up" />
            <KPICard label="Conversions" value="202" change="+24%" trend="up" />
            <KPICard label="Avg ROAS" value="4.1x" change="+0.3x" trend="up" />
          </KPIBand>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..." className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[9px]" /></div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All status</option><option value="active">Active</option><option value="paused">Paused</option><option value="draft">Draft</option><option value="review">Review</option><option value="completed">Completed</option></select>
            {(search || statusFilter !== 'all') && <Button variant="ghost" size="sm" className="h-7 text-[8px] gap-1 rounded-xl" onClick={() => { setSearch(''); setStatusFilter('all'); }}><X className="h-3 w-3" />Clear</Button>}
          </div>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[9px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">Campaign</th><th className="text-center px-3 py-2">Status</th><th className="text-right px-3 py-2">Budget</th><th className="text-right px-3 py-2">Spent</th><th className="text-right px-3 py-2">Impr.</th><th className="text-right px-3 py-2">CTR</th><th className="text-right px-3 py-2">Conv.</th><th className="text-right px-3 py-2">ROAS</th><th className="w-10"></th></tr></thead>
              <tbody>
                {filteredCampaigns.map(c => (
                  <tr key={c.id} onClick={() => setSelectedCampaign(c)} className={cn('border-t hover:bg-muted/20 transition-colors cursor-pointer text-[9px]', selectedCampaign?.id === c.id && 'bg-accent/5')}>
                    <td className="px-3 py-2"><div className="font-medium">{c.name}</div><div className="text-[7px] text-muted-foreground">{c.id} · {c.objective}</div></td>
                    <td className="px-3 py-2 text-center"><StatusBadge status={CS_MAP[c.status]} label={c.status} /></td>
                    <td className="px-3 py-2 text-right">{c.budget}</td>
                    <td className="px-3 py-2 text-right font-semibold">{c.spent}</td>
                    <td className="px-3 py-2 text-right">{c.impressions}</td>
                    <td className="px-3 py-2 text-right">{c.ctr}</td>
                    <td className="px-3 py-2 text-right">{c.conversions}</td>
                    <td className="px-3 py-2 text-right font-semibold">{c.roas}</td>
                    <td className="px-3 py-2">
                      <div className="flex gap-0.5">
                        {c.status === 'active' ? <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); toast.info('Paused'); }}><Pause className="h-2.5 w-2.5" /></Button> : c.status === 'paused' ? <Button variant="ghost" size="icon" className="h-5 w-5" onClick={e => { e.stopPropagation(); toast.success('Resumed'); }}><Play className="h-2.5 w-2.5" /></Button> : null}
                        <Button variant="ghost" size="icon" className="h-5 w-5"><MoreHorizontal className="h-2.5 w-2.5" /></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ CAMPAIGN DETAIL ═══ */}
      {tab === 'detail' && (
        <div className="space-y-3">
          {selectedCampaign ? (
            <>
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1"><div className="text-sm font-semibold">{selectedCampaign.name}</div><div className="text-[8px] text-muted-foreground">{selectedCampaign.id} · {selectedCampaign.objective} · {selectedCampaign.startDate} → {selectedCampaign.endDate}</div></div>
                <StatusBadge status={CS_MAP[selectedCampaign.status]} label={selectedCampaign.status} />
                <div className="flex gap-1">
                  {selectedCampaign.status === 'active' && <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Paused')}><Pause className="h-2.5 w-2.5" />Pause</Button>}
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Edit className="h-2.5 w-2.5" />Edit</Button>
                  <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Copy className="h-2.5 w-2.5" />Duplicate</Button>
                </div>
              </div>
              <KPIBand>
                <KPICard label="Budget" value={selectedCampaign.budget} />
                <KPICard label="Spent" value={selectedCampaign.spent} />
                <KPICard label="Impressions" value={selectedCampaign.impressions} />
                <KPICard label="ROAS" value={selectedCampaign.roas} />
              </KPIBand>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {[
                  { l: 'CPC', v: selectedCampaign.cpc }, { l: 'CPM', v: selectedCampaign.cpm },
                  { l: 'CPA', v: selectedCampaign.cpa }, { l: 'CTR', v: selectedCampaign.ctr },
                  { l: 'Clicks', v: selectedCampaign.clicks }, { l: 'Conversions', v: String(selectedCampaign.conversions) },
                  { l: 'Ad Sets', v: String(selectedCampaign.adSets) }, { l: 'Creatives', v: String(selectedCampaign.creatives) },
                ].map(m => (
                  <div key={m.l} className="rounded-2xl border p-3"><div className="text-[8px] text-muted-foreground">{m.l}</div><div className="text-sm font-bold">{m.v}</div></div>
                ))}
              </div>
              <SectionCard title="Budget Utilization" className="!rounded-2xl">
                <Progress value={(parseFloat(selectedCampaign.spent.replace(/[$,]/g, '')) / parseFloat(selectedCampaign.budget.replace(/[$,]/g, ''))) * 100} className="h-2" />
                <div className="flex justify-between text-[8px] text-muted-foreground mt-1"><span>Spent: {selectedCampaign.spent}</span><span>Remaining: {selectedCampaign.remaining}</span></div>
              </SectionCard>
              <SectionCard title="Performance Chart" className="!rounded-2xl">
                <div className="h-32 flex items-center justify-center text-[9px] text-muted-foreground bg-muted/20 rounded-xl">Impressions, Clicks, Conversions trend chart</div>
              </SectionCard>
            </>
          ) : (
            <div className="text-center py-16">
              <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <div className="text-sm font-medium">Select a campaign</div>
              <div className="text-[9px] text-muted-foreground mt-1">Click a campaign from the list to view details</div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] mt-3 rounded-xl" onClick={() => setTab('campaigns')}>Go to Campaign List</Button>
            </div>
          )}
        </div>
      )}

      {/* ═══ BUILDER ═══ */}
      {tab === 'builder' && (
        <div className="space-y-3">
          <SectionCard title="Campaign Builder" icon={<Plus className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
              {['Objective', 'Audience', 'Placements', 'Budget', 'Creatives', 'Review'].map((step, i) => (
                <React.Fragment key={step}>
                  <button onClick={() => setBuilderStep(i)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] whitespace-nowrap transition-colors', builderStep === i ? 'bg-accent text-accent-foreground' : builderStep > i ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}>
                    {builderStep > i ? <CheckCircle2 className="h-3 w-3" /> : <span className="h-4 w-4 rounded-full border flex items-center justify-center text-[7px]">{i + 1}</span>}
                    {step}
                  </button>
                  {i < 5 && <ArrowRight className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                </React.Fragment>
              ))}
            </div>

            {builderStep === 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {[
                  { name: 'Awareness', desc: 'Maximize reach', icon: Eye },
                  { name: 'Consideration', desc: 'Drive traffic', icon: MousePointer },
                  { name: 'Conversion', desc: 'Generate sales', icon: Target },
                  { name: 'Lead Generation', desc: 'Capture contacts', icon: Users },
                  { name: 'Engagement', desc: 'Boost interactions', icon: TrendingUp },
                  { name: 'Promote Content', desc: 'Boost posts/jobs/gigs', icon: Star },
                ].map(obj => (
                  <button key={obj.name} className="p-3 rounded-2xl border text-left hover:border-accent hover:bg-accent/5 transition-all" onClick={() => setBuilderStep(1)}>
                    <obj.icon className="h-6 w-6 text-accent mb-2" />
                    <div className="text-[10px] font-semibold">{obj.name}</div>
                    <div className="text-[8px] text-muted-foreground">{obj.desc}</div>
                  </button>
                ))}
              </div>
            )}
            {builderStep === 1 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[9px] font-medium mb-1 block">Location</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Add locations..." /></div>
                  <div><label className="text-[9px] font-medium mb-1 block">Age Range</label><div className="flex gap-1"><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="18" /><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="65+" /></div></div>
                  <div><label className="text-[9px] font-medium mb-1 block">Interests</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Technology, Design..." /></div>
                  <div><label className="text-[9px] font-medium mb-1 block">Behaviors</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Hiring managers..." /></div>
                </div>
                <div className="rounded-xl bg-muted/30 p-3"><div className="text-[9px] font-medium">Estimated Audience</div><div className="text-lg font-bold">2.4M – 3.1M</div></div>
              </div>
            )}
            {builderStep === 2 && (
              <div className="space-y-2">
                <div className="text-[10px] font-medium mb-1">Select Placements</div>
                {['Feed', 'Search Results', 'Explorer', 'Profile Sidebar', 'Job Listings', 'Gig Pages'].map(p => (
                  <label key={p} className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 cursor-pointer"><input type="checkbox" defaultChecked={['Feed', 'Search Results'].includes(p)} className="h-3 w-3 rounded" /><span className="text-[9px]">{p}</span></label>
                ))}
              </div>
            )}
            {builderStep === 3 && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div><label className="text-[9px] font-medium mb-1 block">Daily Budget</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="$500" /></div>
                  <div><label className="text-[9px] font-medium mb-1 block">Total Budget</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="$15,000" /></div>
                  <div><label className="text-[9px] font-medium mb-1 block">Start Date</label><input type="date" className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" /></div>
                  <div><label className="text-[9px] font-medium mb-1 block">End Date</label><input type="date" className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" /></div>
                </div>
                <div><label className="text-[9px] font-medium mb-1 block">Bid Strategy</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Automatic (Recommended)</option><option>Manual CPC</option><option>Target CPA</option><option>Target ROAS</option></select></div>
              </div>
            )}
            {builderStep === 4 && (
              <div className="space-y-2">
                <div className="text-[10px] font-medium mb-1">Select Creatives</div>
                {CREATIVES.filter(cr => cr.status === 'approved').map(cr => {
                  const Icon = TYPE_ICON[cr.type];
                  return (
                    <label key={cr.id} className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 cursor-pointer">
                      <input type="checkbox" className="h-3 w-3 rounded" />
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div className="flex-1"><div className="text-[9px] font-medium">{cr.name}</div><div className="text-[7px] text-muted-foreground">{cr.type} · {cr.impressions} impr.</div></div>
                    </label>
                  );
                })}
                <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl"><Plus className="h-2.5 w-2.5" />Upload New</Button>
              </div>
            )}
            {builderStep === 5 && (
              <div className="space-y-3">
                <div className="rounded-xl border bg-[hsl(var(--state-healthy))]/5 p-3 text-center">
                  <CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))] mx-auto mb-1" />
                  <div className="text-[10px] font-semibold">Ready to Launch</div>
                  <div className="text-[8px] text-muted-foreground">Review your campaign settings before submitting</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {[{ l: 'Objective', v: 'Conversion' }, { l: 'Audience', v: '2.4M – 3.1M' }, { l: 'Placements', v: 'Feed, Search' }, { l: 'Budget', v: '$500/day' }, { l: 'Duration', v: '30 days' }, { l: 'Creatives', v: '4 selected' }].map(m => (
                    <div key={m.l} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium">{m.v}</div></div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-4 pt-3 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" disabled={builderStep === 0} onClick={() => setBuilderStep(Math.max(0, builderStep - 1))}>Previous</Button>
              <Button size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => { if (builderStep === 5) { toast.success('Campaign submitted for review'); setBuilderStep(0); } else setBuilderStep(builderStep + 1); }}>{builderStep === 5 ? 'Launch Campaign' : 'Next'}</Button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ CREATIVE LIBRARY ═══ */}
      {tab === 'creatives' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Creatives" value={String(CREATIVES.length)} />
            <KPICard label="Approved" value={String(CREATIVES.filter(c => c.status === 'approved').length)} />
            <KPICard label="Pending" value={String(CREATIVES.filter(c => c.status === 'pending').length)} />
            <KPICard label="Rejected" value={String(CREATIVES.filter(c => c.status === 'rejected').length)} trend="down" />
          </KPIBand>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Sparkles className="h-3 w-3" />AI Generate</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Plus className="h-3 w-3" />Upload</Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CREATIVES.map(cr => {
              const Icon = TYPE_ICON[cr.type];
              return (
                <div key={cr.id} className={cn('rounded-2xl border bg-card p-3 hover:shadow-sm transition-all cursor-pointer', cr.status === 'rejected' && 'border-destructive/20')} onClick={() => setCreativeDrawer(cr)}>
                  <div className="h-20 rounded-xl bg-muted/30 flex items-center justify-center mb-2"><Icon className="h-8 w-8 text-muted-foreground" /></div>
                  <div className="flex items-center gap-1.5 mb-1"><span className="text-[9px] font-semibold flex-1 truncate">{cr.name}</span><StatusBadge status={CR_MAP[cr.status]} label={cr.status} /></div>
                  <div className="text-[7px] text-muted-foreground">{cr.type} · {cr.impressions} impr. · {cr.ctr} CTR · Used in {cr.usedIn}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ AUDIENCE BUILDER ═══ */}
      {tab === 'audience' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Saved Audiences" value={String(AUDIENCES.length)} />
            <KPICard label="Total Reach" value="4.6M" />
            <KPICard label="Active in Campaigns" value={String(AUDIENCES.filter(a => a.campaigns > 0).length)} />
            <KPICard label="Platform MAU" value="2.4M" />
          </KPIBand>

          <div className="flex items-center gap-2 mb-1">
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Create audience')}><Plus className="h-3 w-3" />Create Audience</Button>
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Sparkles className="h-3 w-3" />AI Suggest</Button>
          </div>

          <div className="space-y-2">
            {AUDIENCES.map(aud => (
              <div key={aud.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center"><Users className="h-4 w-4 text-accent" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{aud.name}</span><Badge variant="secondary" className="text-[6px] capitalize">{aud.type}</Badge></div>
                    <div className="text-[8px] text-muted-foreground">{aud.size} people · {aud.campaigns} campaign(s){aud.overlap ? ` · ${aud.overlap} overlap` : ''}</div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl">Use</Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6"><Edit className="h-2.5 w-2.5" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <SectionCard title="AI-Suggested Audiences" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { name: 'Startup Founders Hiring', size: '180K', match: 94 },
                { name: 'Design Agency Leads', size: '95K', match: 87 },
                { name: 'Remote-First Companies', size: '420K', match: 82 },
              ].map(s => (
                <div key={s.name} className="flex items-center gap-2 p-2 rounded-xl border">
                  <div className="flex-1"><div className="text-[9px] font-medium">{s.name}</div><div className="text-[7px] text-muted-foreground">{s.size} people</div></div>
                  <Badge variant="secondary" className="text-[6px]">{s.match}% match</Badge>
                  <Button size="sm" className="h-5 text-[7px] rounded-lg"><Plus className="h-2.5 w-2.5" /></Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ GEO / KEYWORDS ═══ */}
      {tab === 'geo' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Tracked Keywords" value="48" />
            <KPICard label="Avg Bid" value="$2.18" />
            <KPICard label="Geo Regions" value={String(GEO_DATA.length)} />
            <KPICard label="Opportunity Score" value="72/100" />
          </KPIBand>

          <SectionCard title="Geo Performance" icon={<MapPin className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg"><Globe className="h-2.5 w-2.5 mr-1" />Map View</Button>}>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Region</th><th className="text-right px-3 py-1.5">Impr.</th><th className="text-right px-3 py-1.5">Clicks</th><th className="text-right px-3 py-1.5">CTR</th><th className="text-right px-3 py-1.5">Spend</th><th className="text-right px-3 py-1.5">Conv.</th></tr></thead>
                <tbody>
                  {GEO_DATA.map(g => (
                    <tr key={g.region} className="border-t text-[8px] hover:bg-muted/20 transition-colors"><td className="px-3 py-1.5 font-medium">{g.region}</td><td className="px-3 py-1.5 text-right">{g.impressions}</td><td className="px-3 py-1.5 text-right">{g.clicks}</td><td className="px-3 py-1.5 text-right">{g.ctr}</td><td className="px-3 py-1.5 text-right">{g.spend}</td><td className="px-3 py-1.5 text-right font-semibold">{g.conversions}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Keyword Planner" icon={<Hash className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg"><Sparkles className="h-2.5 w-2.5" />AI Suggest</Button>}>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Keyword</th><th className="text-right px-3 py-1.5">Volume</th><th className="text-center px-3 py-1.5">Competition</th><th className="text-right px-3 py-1.5">Bid</th><th className="text-right px-3 py-1.5">Score</th><th className="w-8"></th></tr></thead>
                <tbody>
                  {KEYWORDS.map(k => (
                    <tr key={k.keyword} className="border-t text-[8px] hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-1.5 font-medium">{k.keyword}</td>
                      <td className="px-3 py-1.5 text-right">{k.volume}/mo</td>
                      <td className="px-3 py-1.5 text-center"><Badge variant="secondary" className="text-[6px]">{k.competition}</Badge></td>
                      <td className="px-3 py-1.5 text-right">{k.bid}</td>
                      <td className="px-3 py-1.5 text-right"><div className="flex items-center justify-end gap-1"><Progress value={k.opportunity} className="h-1 w-10" /><span className={cn('text-[7px] font-semibold', k.opportunity >= 80 ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}>{k.opportunity}</span></div></td>
                      <td className="px-3 py-1.5"><Button size="sm" variant="outline" className="h-4 text-[6px] rounded-lg">Add</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ FORECASTING ═══ */}
      {tab === 'forecast' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Est. Impressions" value="280K–350K" />
            <KPICard label="Est. Clicks" value="8.4K–12.6K" />
            <KPICard label="Est. Conversions" value="420–600" />
            <KPICard label="Est. ROAS" value="3.2x–4.8x" />
          </KPIBand>

          <SectionCard title="Budget Simulator" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-3 mb-3">
              <div><label className="text-[8px] font-medium mb-1 block">Daily Budget</label><input type="range" min="50" max="5000" defaultValue="500" className="w-full" /><div className="text-[10px] font-bold">$500/day</div></div>
              <div><label className="text-[8px] font-medium mb-1 block">Duration</label><input type="range" min="7" max="90" defaultValue="30" className="w-full" /><div className="text-[10px] font-bold">30 days</div></div>
              <div><label className="text-[8px] font-medium mb-1 block">Target CPA</label><input type="range" min="5" max="100" defaultValue="25" className="w-full" /><div className="text-[10px] font-bold">$25</div></div>
            </div>
            <div className="h-28 flex items-center justify-center text-[9px] text-muted-foreground bg-muted/20 rounded-xl">Projected performance chart based on simulator inputs</div>
          </SectionCard>

          <SectionCard title="AI Recommendations" icon={<Lightbulb className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { rec: 'Increase CMP-002 budget by 20%', impact: '+35% conversions', conf: 'High' },
                { rec: 'Pause CMP-003 — diminishing returns', impact: 'Save $1.2K/mo', conf: 'Medium' },
                { rec: 'Test video creatives for awareness', impact: '+20% engagement', conf: 'Medium' },
                { rec: 'Add "talent sourcing tool" keyword', impact: 'Low competition', conf: 'High' },
              ].map(r => (
                <div key={r.rec} className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 transition-colors">
                  <div className="flex-1"><div className="text-[8px] font-medium">{r.rec}</div><div className="flex gap-1 mt-0.5"><Badge variant="secondary" className="text-[5px]">{r.impact}</Badge><Badge variant="secondary" className="text-[5px]">{r.conf}</Badge></div></div>
                  <Button size="sm" className="h-5 text-[7px] rounded-lg">Apply</Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ MOBILE MONITOR ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3 max-w-sm mx-auto">
          <div className="rounded-3xl bg-gradient-to-br from-accent to-[hsl(var(--gigvora-purple))] text-white p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-8 translate-x-8" />
            <div className="text-[9px] opacity-80 mb-1">Ads Overview</div>
            <div className="text-2xl font-bold">$8,260</div>
            <div className="text-[10px] opacity-70">Total Spend This Month</div>
            <div className="flex items-center gap-4 mt-4">
              <div><div className="text-lg font-bold">301K</div><div className="text-[8px] opacity-70">Impressions</div></div>
              <div className="w-px h-8 bg-white/20" />
              <div><div className="text-lg font-bold">4.1x</div><div className="text-[8px] opacity-70">Avg ROAS</div></div>
              <div className="w-px h-8 bg-white/20" />
              <div><div className="text-lg font-bold">202</div><div className="text-[8px] opacity-70">Conversions</div></div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('campaigns')}><Layers className="h-4 w-4 text-accent" />Campaigns</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('creatives')}><Image className="h-4 w-4 text-accent" />Creatives</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('audience')}><Users className="h-4 w-4 text-accent" />Audiences</Button>
            <Button variant="outline" className="h-12 text-[10px] gap-1.5 rounded-2xl flex-col" onClick={() => setTab('forecast')}><Sparkles className="h-4 w-4 text-accent" />Forecast</Button>
          </div>

          <SectionCard title="Active Campaigns" icon={<Layers className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            {CAMPAIGNS.filter(c => c.status === 'active').map(c => (
              <div key={c.id} className="flex items-center gap-2 py-2 border-b last:border-0 cursor-pointer" onClick={() => setSelectedCampaign(c)}>
                <div className="flex-1 min-w-0"><div className="text-[9px] font-medium truncate">{c.name}</div><div className="text-[7px] text-muted-foreground">{c.spent} spent · {c.ctr} CTR</div></div>
                <div className="text-right shrink-0"><div className="text-[9px] font-semibold">{c.roas}</div><StatusBadge status="healthy" label="active" /></div>
              </div>
            ))}
          </SectionCard>

          {CREATIVES.some(c => c.status === 'rejected') && (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-3">
              <div className="flex items-center gap-1.5 text-destructive text-[9px] font-semibold mb-1"><AlertCircle className="h-3 w-3" />Action Required</div>
              <p className="text-[8px] text-muted-foreground">1 creative rejected — update to continue running ads.</p>
              <Button variant="outline" size="sm" className="h-5 text-[7px] mt-1.5 rounded-lg" onClick={() => setTab('creatives')}>Review</Button>
            </div>
          )}
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">$8,260</span><div className="text-[8px] text-muted-foreground">Spend · 4.1x ROAS</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setCreateOpen(true)}><Plus className="h-3.5 w-3.5" />Create</Button>
      </div>

      {/* Drawers */}
      <CampaignDrawer campaign={selectedCampaign} open={!!selectedCampaign} onClose={() => setSelectedCampaign(null)} />

      {/* Creative Detail Drawer */}
      <Sheet open={!!creativeDrawer} onOpenChange={() => setCreativeDrawer(null)}>
        <SheetContent className="w-[440px] overflow-y-auto">
          {creativeDrawer && (() => {
            const Icon = TYPE_ICON[creativeDrawer.type];
            return (
              <>
                <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-accent" />{creativeDrawer.id}</SheetTitle></SheetHeader>
                <div className="mt-4 space-y-4">
                  <div className="h-32 rounded-2xl bg-muted/30 flex items-center justify-center"><Icon className="h-12 w-12 text-muted-foreground" /></div>
                  <div className="text-center"><div className="text-sm font-bold">{creativeDrawer.name}</div><StatusBadge status={CR_MAP[creativeDrawer.status]} label={creativeDrawer.status} className="mt-1" /></div>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ l: 'Type', v: creativeDrawer.type }, { l: 'Impressions', v: creativeDrawer.impressions }, { l: 'CTR', v: creativeDrawer.ctr }, { l: 'Used In', v: `${creativeDrawer.usedIn} campaigns` }, { l: 'Last Edited', v: creativeDrawer.lastEdited }].map(m => (
                      <div key={m.l} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium capitalize">{m.v}</div></div>
                    ))}
                  </div>
                  {creativeDrawer.status === 'rejected' && (
                    <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3">
                      <div className="flex items-center gap-1.5 text-destructive text-[10px] font-semibold mb-1"><AlertCircle className="h-3 w-3" />Rejected</div>
                      <p className="text-[8px] text-muted-foreground">Policy violation: text overlay exceeds 20% of image area.</p>
                      <Button size="sm" className="h-5 text-[8px] mt-1.5 rounded-lg">Edit & Resubmit</Button>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1.5 border-t pt-3">
                    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Edit className="h-2.5 w-2.5" />Edit</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Copy className="h-2.5 w-2.5" />Duplicate</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Download className="h-2.5 w-2.5" />Download</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl text-destructive"><Trash2 className="h-2.5 w-2.5" />Delete</Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Create Campaign Drawer */}
      <Sheet open={createOpen} onOpenChange={setCreateOpen}>
        <SheetContent className="w-[440px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm">Quick Create Campaign</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Campaign Name</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. Q3 Awareness Push" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Objective</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Awareness</option><option>Consideration</option><option>Conversion</option><option>Lead Generation</option></select></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Daily Budget</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="$500" /></div>
              <div><label className="text-[9px] font-medium mb-1 block">Duration</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>30 days</option><option>14 days</option><option>7 days</option><option>90 days</option></select></div>
            </div>
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-2 text-[8px] text-muted-foreground flex items-start gap-1.5"><Sparkles className="h-3 w-3 text-accent mt-0.5 shrink-0" /><span>Use the full Builder for advanced targeting, placements, and creative selection.</span></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setCreateOpen(false)}>Cancel</Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => { setCreateOpen(false); setTab('builder'); }}>Open Builder</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setCreateOpen(false); toast.success('Campaign created as draft'); }}>Create Draft</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default AdsManagerPage;
