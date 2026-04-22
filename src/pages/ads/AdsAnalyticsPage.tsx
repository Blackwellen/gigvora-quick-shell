import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  BarChart3, Search, Clock, Download, TrendingUp, TrendingDown,
  DollarSign, MousePointerClick, Eye, Target, ChevronRight, Filter,
  History, AlertTriangle, Layers, Globe, Hash, ArrowUpRight, ArrowDownRight,
  Megaphone, Zap, Users, ExternalLink, RefreshCw, Image, Video, FileText,
  Smartphone, MapPin, Sparkles, PieChart, Activity, Lightbulb, Copy,
  Calendar, ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type ATab = 'overview' | 'charts' | 'creatives' | 'audience' | 'geo' | 'pacing' | 'keywords' | 'finance';
type DateRange = '7d' | '14d' | '30d' | '90d';
type ViewLevel = 'campaign' | 'adset' | 'ad';

interface KeywordRow {
  keyword: string; impressions: string; clicks: string; ctr: string;
  cpc: string; conversions: string; spend: string; quality: number;
  trend: 'up' | 'down' | 'flat';
}
interface CampaignPerf {
  id: string; name: string; spend: string; impressions: string;
  clicks: string; ctr: string; cpc: string; cpa: string;
  conversions: string; revenue: string; roas: string;
  status: 'active' | 'paused' | 'completed';
}
interface CreativePerf {
  id: string; name: string; type: 'image' | 'video' | 'text' | 'carousel';
  impressions: string; clicks: string; ctr: string; conversions: number;
  spend: string; fatigue: number; status: 'strong' | 'declining' | 'new';
}
interface GeoRow {
  region: string; impressions: string; clicks: string; ctr: string;
  spend: string; conversions: number; cpa: string; heat: number;
}
interface AttributionRow {
  channel: string; touchpoints: string; conversions: string;
  revenue: string; roas: string; share: number;
}

// ── Mock Data ──
const CAMPAIGNS_PERF: CampaignPerf[] = [
  { id: 'CAM-101', name: 'Spring Talent Drive', spend: '$3,420', impressions: '245K', clicks: '8.2K', ctr: '3.35%', cpc: '$0.42', cpa: '$24.08', conversions: '142', revenue: '$8,520', roas: '2.49x', status: 'active' },
  { id: 'CAM-102', name: 'Pro Plan Awareness', spend: '$1,875', impressions: '520K', clicks: '4.1K', ctr: '0.79%', cpc: '$0.46', cpa: '$66.96', conversions: '28', revenue: '$2,240', roas: '1.19x', status: 'active' },
  { id: 'CAM-105', name: 'Holiday Gig Blast', spend: '$2,980', impressions: '180K', clicks: '6.5K', ctr: '3.61%', cpc: '$0.46', cpa: '$14.19', conversions: '210', revenue: '$14,700', roas: '4.93x', status: 'completed' },
  { id: 'CAM-108', name: 'Agency Spotlight Q2', spend: '$640', impressions: '95K', clicks: '1.9K', ctr: '2.0%', cpc: '$0.34', cpa: '$42.67', conversions: '15', revenue: '$1,050', roas: '1.64x', status: 'paused' },
];

const KEYWORDS: KeywordRow[] = [
  { keyword: 'freelance developer', impressions: '82K', clicks: '3.1K', ctr: '3.78%', cpc: '$0.38', conversions: '68', spend: '$1,178', quality: 9, trend: 'up' },
  { keyword: 'hire designer online', impressions: '54K', clicks: '1.8K', ctr: '3.33%', cpc: '$0.52', conversions: '42', spend: '$936', quality: 8, trend: 'up' },
  { keyword: 'remote jobs platform', impressions: '120K', clicks: '2.4K', ctr: '2.0%', cpc: '$0.61', conversions: '31', spend: '$1,464', quality: 7, trend: 'flat' },
  { keyword: 'gig economy marketplace', impressions: '38K', clicks: '950', ctr: '2.5%', cpc: '$0.45', conversions: '19', spend: '$427', quality: 7, trend: 'down' },
  { keyword: 'project management freelance', impressions: '29K', clicks: '870', ctr: '3.0%', cpc: '$0.55', conversions: '15', spend: '$478', quality: 6, trend: 'flat' },
  { keyword: 'enterprise staffing', impressions: '18K', clicks: '360', ctr: '2.0%', cpc: '$1.20', conversions: '8', spend: '$432', quality: 5, trend: 'down' },
];

const CREATIVES_PERF: CreativePerf[] = [
  { id: 'CR-01', name: 'Hero Banner — Q2', type: 'image', impressions: '145K', clicks: '4.2K', ctr: '2.9%', conversions: 89, spend: '$1,820', fatigue: 22, status: 'strong' },
  { id: 'CR-02', name: 'Product Walkthrough', type: 'video', impressions: '112K', clicks: '5.6K', ctr: '5.0%', conversions: 134, spend: '$2,240', fatigue: 15, status: 'strong' },
  { id: 'CR-03', name: 'Recruiter Pro CTA', type: 'text', impressions: '89K', clicks: '3.8K', ctr: '4.3%', conversions: 67, spend: '$1,140', fatigue: 38, status: 'declining' },
  { id: 'CR-04', name: 'Feature Carousel', type: 'carousel', impressions: '67K', clicks: '2.1K', ctr: '3.1%', conversions: 45, spend: '$890', fatigue: 12, status: 'new' },
  { id: 'CR-05', name: 'Testimonial Reel', type: 'video', impressions: '34K', clicks: '1.9K', ctr: '5.6%', conversions: 38, spend: '$640', fatigue: 8, status: 'new' },
  { id: 'CR-06', name: 'Holiday Sale Banner', type: 'image', impressions: '210K', clicks: '7.8K', ctr: '3.7%', conversions: 198, spend: '$2,980', fatigue: 65, status: 'declining' },
];

const GEO_DATA: GeoRow[] = [
  { region: 'United States', impressions: '520K', clicks: '18.2K', ctr: '3.5%', spend: '$4,120', conversions: 198, cpa: '$20.81', heat: 95 },
  { region: 'United Kingdom', impressions: '145K', clicks: '4.8K', ctr: '3.3%', spend: '$1,280', conversions: 52, cpa: '$24.62', heat: 72 },
  { region: 'Canada', impressions: '98K', clicks: '3.1K', ctr: '3.2%', spend: '$840', conversions: 34, cpa: '$24.71', heat: 58 },
  { region: 'Germany', impressions: '72K', clicks: '2.2K', ctr: '3.1%', spend: '$620', conversions: 24, cpa: '$25.83', heat: 45 },
  { region: 'Australia', impressions: '56K', clicks: '1.8K', ctr: '3.2%', spend: '$480', conversions: 19, cpa: '$25.26', heat: 38 },
  { region: 'India', impressions: '89K', clicks: '2.4K', ctr: '2.7%', spend: '$320', conversions: 28, cpa: '$11.43', heat: 62 },
];

const ATTRIBUTION: AttributionRow[] = [
  { channel: 'Paid Search', touchpoints: '12,400', conversions: '142', revenue: '$8,520', roas: '2.49x', share: 35 },
  { channel: 'Display Ads', touchpoints: '8,200', conversions: '43', revenue: '$3,010', roas: '1.82x', share: 15 },
  { channel: 'Social (Paid)', touchpoints: '6,800', conversions: '67', revenue: '$4,690', roas: '3.12x', share: 22 },
  { channel: 'Retargeting', touchpoints: '3,400', conversions: '89', revenue: '$6,230', roas: '4.15x', share: 18 },
  { channel: 'Native Ads', touchpoints: '2,100', conversions: '21', revenue: '$1,470', roas: '1.96x', share: 10 },
];

const DAILY_TREND = [
  { d: 'Apr 4', imp: 32, cl: 42, conv: 28, spend: 35 },
  { d: 'Apr 5', imp: 45, cl: 50, conv: 38, spend: 42 },
  { d: 'Apr 6', imp: 58, cl: 62, conv: 52, spend: 55 },
  { d: 'Apr 7', imp: 72, cl: 75, conv: 68, spend: 70 },
  { d: 'Apr 8', imp: 85, cl: 80, conv: 75, spend: 78 },
  { d: 'Apr 9', imp: 78, cl: 72, conv: 65, spend: 68 },
  { d: 'Apr 10', imp: 90, cl: 88, conv: 82, spend: 85 },
];

const TYPE_ICON: Record<string, typeof Image> = { image: Image, video: Video, text: FileText, carousel: Layers };
const CS_MAP: Record<string, 'healthy' | 'caution' | 'degraded'> = { active: 'healthy', paused: 'caution', completed: 'degraded' };
const FATIGUE_MAP: Record<string, 'healthy' | 'caution' | 'blocked'> = { strong: 'healthy', new: 'healthy', declining: 'blocked' };

// ── Keyword Drawer ──
const KeywordDrawer: React.FC<{ kw: KeywordRow | null; open: boolean; onClose: () => void }> = ({ kw, open, onClose }) => {
  if (!kw) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Hash className="h-4 w-4 text-accent" />{kw.keyword}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[{ l: 'Impressions', v: kw.impressions }, { l: 'Clicks', v: kw.clicks }, { l: 'CTR', v: kw.ctr }, { l: 'CPC', v: kw.cpc }, { l: 'Conversions', v: kw.conversions }, { l: 'Spend', v: kw.spend }].map(m => (
              <div key={m.l} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-semibold">{m.v}</div></div>
            ))}
          </div>
          <div className="rounded-xl border p-3">
            <div className="flex justify-between text-[9px] mb-1"><span className="text-muted-foreground">Quality Score</span><span className="font-bold">{kw.quality}/10</span></div>
            <Progress value={kw.quality * 10} className="h-1.5" />
          </div>
          <div className="rounded-xl border p-3">
            <div className="text-[10px] font-semibold mb-2">7-Day Trend</div>
            <div className="h-16 flex items-end gap-1">{[40, 55, 65, 58, 72, 80, 75].map((v, i) => (<div key={i} className="flex-1 rounded-t bg-accent/60" style={{ height: `${v}%` }} />))}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Download className="h-2.5 w-2.5" />Export</Button>
            <Link to="/ads"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Megaphone className="h-2.5 w-2.5" />Campaigns</Button></Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Creative Drawer ──
const CreativeDrawer: React.FC<{ cr: CreativePerf | null; open: boolean; onClose: () => void }> = ({ cr, open, onClose }) => {
  if (!cr) return null;
  const Icon = TYPE_ICON[cr.type];
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-accent" />{cr.id}</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="h-28 rounded-2xl bg-muted/30 flex items-center justify-center"><Icon className="h-10 w-10 text-muted-foreground" /></div>
          <div className="text-center"><div className="text-sm font-bold">{cr.name}</div><StatusBadge status={FATIGUE_MAP[cr.status]} label={cr.status} className="mt-1" /></div>
          <div className="grid grid-cols-2 gap-2">
            {[{ l: 'Impressions', v: cr.impressions }, { l: 'Clicks', v: cr.clicks }, { l: 'CTR', v: cr.ctr }, { l: 'Conversions', v: String(cr.conversions) }, { l: 'Spend', v: cr.spend }, { l: 'Type', v: cr.type }].map(m => (
              <div key={m.l} className="rounded-xl border p-2"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-semibold capitalize">{m.v}</div></div>
            ))}
          </div>
          <div className="rounded-xl border p-3">
            <div className="flex justify-between text-[9px] mb-1"><span className="text-muted-foreground">Creative Fatigue</span><span className="font-bold">{cr.fatigue}%</span></div>
            <Progress value={cr.fatigue} className={cn('h-1.5', cr.fatigue > 50 && '[&>div]:bg-destructive', cr.fatigue > 30 && cr.fatigue <= 50 && '[&>div]:bg-[hsl(var(--gigvora-amber))]')} />
            <div className="text-[7px] text-muted-foreground mt-0.5">{cr.fatigue > 50 ? 'High fatigue — consider replacing' : cr.fatigue > 30 ? 'Moderate — monitor closely' : 'Fresh — performing well'}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Copy className="h-2.5 w-2.5" />Duplicate</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Download className="h-2.5 w-2.5" />Export</Button>
            <Link to="/ads"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Megaphone className="h-2.5 w-2.5" />Ads Manager</Button></Link>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const AdsAnalyticsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<ATab>('overview');
  const [dateRange, setDateRange] = useState<DateRange>('30d');
  const [viewLevel, setViewLevel] = useState<ViewLevel>('campaign');
  const [search, setSearch] = useState('');
  const [selectedKw, setSelectedKw] = useState<KeywordRow | null>(null);
  const [selectedCr, setSelectedCr] = useState<CreativePerf | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareItems, setCompareItems] = useState<string[]>([]);

  const topStrip = (
    <>
      <BarChart3 className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Ads Analytics · Performance · Creative · Geo · Forecasting</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-1 rounded-xl border p-0.5">
        {(['campaign', 'adset', 'ad'] as ViewLevel[]).map(v => (
          <button key={v} onClick={() => setViewLevel(v)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-medium transition-colors', viewLevel === v ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/30')}>{v === 'adset' ? 'Ad Set' : v.charAt(0).toUpperCase() + v.slice(1)}</button>
        ))}
      </div>
      <select value={dateRange} onChange={e => setDateRange(e.target.value as DateRange)} className="h-6 rounded-xl border bg-background px-1.5 text-[8px]">
        <option value="7d">7 days</option><option value="14d">14 days</option><option value="30d">30 days</option><option value="90d">90 days</option>
      </select>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Exporting')}><Download className="h-3 w-3" />Export</Button>
      <Link to="/ads"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Megaphone className="h-3 w-3" />Manager</Button></Link>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />~15m</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Spend Summary" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-lg font-bold">$8,915</div>
        <div className="text-[8px] text-muted-foreground">Total spend ({dateRange})</div>
        <div className="mt-1.5 space-y-0.5 text-[8px]">
          {[{ l: 'Avg CPC', v: '$0.44' }, { l: 'Avg CPA', v: '$23.20' }, { l: 'Avg CPM', v: '$8.57' }, { l: 'Avg CPI', v: '$2.15' }].map(m => (
            <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-medium">{m.v}</span></div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Top Performer" icon={<TrendingUp className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
        <div className="text-[10px] font-semibold">Holiday Gig Blast</div>
        <div className="text-[8px] text-muted-foreground">4.93x ROAS · 210 conv · $14.19 CPA</div>
        <Badge variant="secondary" className="text-[6px] mt-1">Best ROAS</Badge>
      </SectionCard>
      <SectionCard title="Alerts" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'CAM-102 at 75% budget', severity: 'caution' as const },
            { label: '"gig economy" CTR -8%', severity: 'blocked' as const },
            { label: 'CR-06 fatigue at 65%', severity: 'blocked' as const },
          ].map(a => (
            <div key={a.label} className="flex items-center gap-1.5 p-1.5 rounded-lg border text-[8px]">
              <StatusBadge status={a.severity} label={a.severity === 'caution' ? 'Warning' : 'Alert'} />
              <span className="flex-1">{a.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Ads Manager', icon: Megaphone, to: '/ads' },
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
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Analytics Events</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'Daily spend report — $892 across 4 campaigns', time: '6h ago', type: 'report' },
          { action: '"freelance developer" reached 3K clicks', time: '1d ago', type: 'milestone' },
          { action: 'CAM-105 completed — 4.93x ROAS', time: '2d ago', type: 'complete' },
          { action: 'Attribution model recalculated for Q1', time: '3d ago', type: 'system' },
          { action: 'CR-06 fatigue alert — 65% threshold', time: '3d ago', type: 'alert' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3 py-2 min-w-[220px] hover:shadow-sm transition-all">
            <Badge variant="secondary" className="text-[6px] capitalize mb-1">{a.type}</Badge>
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
          { key: 'overview' as const, label: 'KPI Overview', icon: BarChart3 },
          { key: 'charts' as const, label: 'Charts', icon: Activity },
          { key: 'creatives' as const, label: 'Creative Comparison', icon: Image },
          { key: 'audience' as const, label: 'Audience Breakdown', icon: Users },
          { key: 'geo' as const, label: 'Geo Heat', icon: MapPin },
          { key: 'pacing' as const, label: 'Delivery Pacing', icon: Sparkles },
          { key: 'keywords' as const, label: 'Keyword Performance', icon: Hash },
          { key: 'finance' as const, label: 'Finance Summary', icon: DollarSign },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0', tab === t.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30')}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ═══ KPI OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Spend" value="$8,915" change="+14% MoM" trend="up" />
            <KPICard label="Impressions" value="1.04M" change="+18%" trend="up" />
            <KPICard label="Conversions" value="395" change="+22%" trend="up" />
            <KPICard label="ROAS" value="2.87x" change="+0.3x" trend="up" />
          </KPIBand>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { l: 'CPC', v: '$0.44', d: '-$0.03', good: true }, { l: 'CPM', v: '$8.57', d: '+$0.42', good: false },
              { l: 'CPA', v: '$23.20', d: '-$1.80', good: true }, { l: 'CPI', v: '$2.15', d: '-$0.12', good: true },
              { l: 'CTR', v: '3.12%', d: '+0.4%', good: true }, { l: 'Clicks', v: '21.5K', d: '+16%', good: true },
              { l: 'Revenue', v: '$26,510', d: '+28%', good: true }, { l: 'Active Campaigns', v: '4', d: '', good: true },
            ].map(m => (
              <div key={m.l} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
                <div className="text-[8px] text-muted-foreground">{m.l}</div>
                <div className="text-sm font-bold">{m.v}</div>
                {m.d && <div className={cn('text-[7px] font-medium', m.good ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')}>{m.d}</div>}
              </div>
            ))}
          </div>

          <SectionCard title="Campaign Performance" icon={<Megaphone className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Link to="/ads"><Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">Manager</Button></Link>}>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Campaign</th><th className="text-center px-2 py-1.5">Status</th><th className="text-right px-3 py-1.5">Spend</th><th className="text-right px-3 py-1.5">CTR</th><th className="text-right px-3 py-1.5">CPA</th><th className="text-right px-3 py-1.5">Conv.</th><th className="text-right px-3 py-1.5">ROAS</th></tr></thead>
                <tbody>
                  {CAMPAIGNS_PERF.map(c => (
                    <tr key={c.id} className="border-t text-[8px] hover:bg-muted/20 transition-colors cursor-pointer">
                      <td className="px-3 py-1.5"><div className="font-medium">{c.name}</div><div className="text-[7px] text-muted-foreground">{c.id}</div></td>
                      <td className="px-2 py-1.5 text-center"><StatusBadge status={CS_MAP[c.status]} label={c.status} /></td>
                      <td className="px-3 py-1.5 text-right">{c.spend}</td>
                      <td className="px-3 py-1.5 text-right">{c.ctr}</td>
                      <td className="px-3 py-1.5 text-right">{c.cpa}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{c.conversions}</td>
                      <td className="px-3 py-1.5 text-right"><Badge variant={parseFloat(c.roas) >= 3 ? 'default' : 'secondary'} className="text-[6px]">{c.roas}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ CHARTS ═══ */}
      {tab === 'charts' && (
        <div className="space-y-3">
          <SectionCard title="Performance Trend" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Badge variant="secondary" className="text-[6px]">{dateRange}</Badge>}>
            <div className="h-40 flex items-end gap-2 px-2">
              {DAILY_TREND.map(d => (
                <div key={d.d} className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex gap-px items-end justify-center" style={{ height: '130px' }}>
                    <div className="w-2.5 rounded-t bg-accent/50 transition-all hover:bg-accent/80" style={{ height: `${d.imp}%` }} />
                    <div className="w-2.5 rounded-t bg-[hsl(var(--state-healthy))]/50 transition-all hover:bg-[hsl(var(--state-healthy))]/80" style={{ height: `${d.cl}%` }} />
                    <div className="w-2.5 rounded-t bg-primary/50 transition-all hover:bg-primary/80" style={{ height: `${d.conv}%` }} />
                  </div>
                  <span className="text-[7px] text-muted-foreground">{d.d.split(' ')[1]}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-2 justify-center text-[8px]">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-accent/50" />Impressions</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[hsl(var(--state-healthy))]/50" />Clicks</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-primary/50" />Conversions</span>
            </div>
          </SectionCard>

          <div className="grid grid-cols-3 gap-3">
            <SectionCard title="By Placement" icon={<Globe className="h-3 w-3 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1 text-[8px]">
                {[{ p: 'Feed', v: '42%', s: '$3,744' }, { p: 'Search', v: '28%', s: '$2,496' }, { p: 'Sidebar', v: '18%', s: '$1,605' }, { p: 'Native', v: '12%', s: '$1,070' }].map(r => (
                  <div key={r.p} className="flex items-center justify-between py-0.5 border-b last:border-0">
                    <span className="text-muted-foreground">{r.p}</span>
                    <div className="text-right"><span className="font-medium">{r.v}</span><span className="text-muted-foreground ml-1">{r.s}</span></div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="By Audience" icon={<Users className="h-3 w-3 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1 text-[8px]">
                {[{ a: 'Freelancers', v: '38%' }, { a: 'Buyers', v: '29%' }, { a: 'Recruiters', v: '21%' }, { a: 'Agencies', v: '12%' }].map(r => (
                  <div key={r.a} className="flex justify-between py-0.5 border-b last:border-0"><span className="text-muted-foreground">{r.a}</span><span className="font-medium">{r.v}</span></div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Cost Efficiency" icon={<Zap className="h-3 w-3 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1 text-[8px]">
                {[{ m: 'CPC', v: '$0.44', d: '-$0.03' }, { m: 'CPA', v: '$23.20', d: '-$1.80' }, { m: 'CPM', v: '$8.57', d: '+$0.42' }, { m: 'CPI', v: '$2.15', d: '-$0.12' }].map(r => (
                  <div key={r.m} className="flex justify-between py-0.5 border-b last:border-0">
                    <span className="text-muted-foreground">{r.m}</span>
                    <div><span className="font-medium">{r.v}</span><span className={cn('ml-1 text-[7px]', r.d.startsWith('-') ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')}>{r.d}</span></div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Attribution Model" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex gap-1.5 mb-3">
              {['Last Click', 'First Click', 'Linear', 'Time Decay', 'Position Based'].map(m => (
                <button key={m} className={cn('px-2 py-1 rounded-xl border text-[8px] transition-colors', m === 'Last Click' ? 'bg-accent text-accent-foreground' : 'hover:bg-muted/30')}>{m}</button>
              ))}
            </div>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Channel</th><th className="text-right px-3 py-1.5">Conv.</th><th className="text-right px-3 py-1.5">Revenue</th><th className="text-right px-3 py-1.5">ROAS</th><th className="text-left px-3 py-1.5">Share</th></tr></thead>
                <tbody>
                  {ATTRIBUTION.map(a => (
                    <tr key={a.channel} className="border-t text-[8px] hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-1.5 font-medium">{a.channel}</td>
                      <td className="px-3 py-1.5 text-right">{a.conversions}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{a.revenue}</td>
                      <td className="px-3 py-1.5 text-right"><Badge variant={parseFloat(a.roas) >= 3 ? 'default' : 'secondary'} className="text-[6px]">{a.roas}</Badge></td>
                      <td className="px-3 py-1.5"><div className="flex items-center gap-1.5"><Progress value={a.share} className="h-1.5 w-16" /><span className="text-[7px] text-muted-foreground">{a.share}%</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ CREATIVE COMPARISON ═══ */}
      {tab === 'creatives' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Creatives" value={String(CREATIVES_PERF.length)} />
            <KPICard label="Avg CTR" value="3.9%" change="+0.5%" trend="up" />
            <KPICard label="Best Performer" value="CR-02" />
            <KPICard label="Fatigued (>50%)" value={String(CREATIVES_PERF.filter(c => c.fatigue > 50).length)} trend="down" />
          </KPIBand>

          <div className="flex items-center gap-2 mb-1">
            <Button variant={compareMode ? 'default' : 'outline'} size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => { setCompareMode(!compareMode); setCompareItems([]); }}><Layers className="h-3 w-3" />{compareMode ? 'Exit Compare' : 'Compare'}</Button>
            {compareMode && compareItems.length >= 2 && <Badge variant="secondary" className="text-[7px]">{compareItems.length} selected</Badge>}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {CREATIVES_PERF.map(cr => {
              const Icon = TYPE_ICON[cr.type];
              const selected = compareItems.includes(cr.id);
              return (
                <div key={cr.id} className={cn('rounded-2xl border bg-card p-3 hover:shadow-sm transition-all cursor-pointer', selected && 'border-accent ring-1 ring-accent/30', cr.fatigue > 50 && 'border-destructive/20')}
                  onClick={() => {
                    if (compareMode) {
                      setCompareItems(prev => prev.includes(cr.id) ? prev.filter(x => x !== cr.id) : [...prev, cr.id].slice(0, 3));
                    } else { setSelectedCr(cr); }
                  }}>
                  <div className="h-16 rounded-xl bg-muted/30 flex items-center justify-center mb-2"><Icon className="h-7 w-7 text-muted-foreground" /></div>
                  <div className="flex items-center gap-1.5 mb-1"><span className="text-[9px] font-semibold flex-1 truncate">{cr.name}</span><StatusBadge status={FATIGUE_MAP[cr.status]} label={cr.status} /></div>
                  <div className="grid grid-cols-3 gap-1 text-[7px]">
                    <div><span className="text-muted-foreground">CTR</span><div className="font-semibold">{cr.ctr}</div></div>
                    <div><span className="text-muted-foreground">Conv</span><div className="font-semibold">{cr.conversions}</div></div>
                    <div><span className="text-muted-foreground">Fatigue</span><div className={cn('font-semibold', cr.fatigue > 50 ? 'text-destructive' : cr.fatigue > 30 ? 'text-[hsl(var(--gigvora-amber))]' : '')}>{cr.fatigue}%</div></div>
                  </div>
                </div>
              );
            })}
          </div>

          {compareMode && compareItems.length >= 2 && (
            <SectionCard title="Comparison" icon={<Layers className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="rounded-xl border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Metric</th>{compareItems.map(id => { const cr = CREATIVES_PERF.find(c => c.id === id); return <th key={id} className="text-right px-3 py-1.5">{cr?.name?.split(' ').slice(0, 2).join(' ')}</th>; })}</tr></thead>
                  <tbody>
                    {['impressions', 'clicks', 'ctr', 'conversions', 'spend', 'fatigue'].map(metric => (
                      <tr key={metric} className="border-t text-[8px]">
                        <td className="px-3 py-1.5 font-medium capitalize">{metric}</td>
                        {compareItems.map(id => { const cr = CREATIVES_PERF.find(c => c.id === id); const v = cr ? (cr as any)[metric] : '-'; return <td key={id} className="px-3 py-1.5 text-right">{typeof v === 'number' ? (metric === 'fatigue' ? `${v}%` : String(v)) : v}</td>; })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* ═══ AUDIENCE BREAKDOWN ═══ */}
      {tab === 'audience' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Reach" value="1.04M" change="+18%" trend="up" />
            <KPICard label="Unique Users" value="892K" />
            <KPICard label="Frequency" value="1.17x" />
            <KPICard label="Engagement Rate" value="4.2%" change="+0.6%" trend="up" />
          </KPIBand>

          <div className="grid grid-cols-2 gap-3">
            <SectionCard title="Demographics" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { seg: '25-34', pct: 38, conv: 156 }, { seg: '35-44', pct: 28, conv: 112 },
                  { seg: '18-24', pct: 18, conv: 68 }, { seg: '45-54', pct: 12, conv: 42 }, { seg: '55+', pct: 4, conv: 17 },
                ].map(d => (
                  <div key={d.seg} className="flex items-center gap-2 text-[8px]">
                    <span className="w-10 text-muted-foreground">{d.seg}</span>
                    <Progress value={d.pct} className="h-1.5 flex-1" />
                    <span className="font-medium w-8 text-right">{d.pct}%</span>
                    <span className="text-muted-foreground w-12 text-right">{d.conv} conv</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Interest Segments" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { seg: 'Technology', pct: 42, roas: '3.2x' }, { seg: 'Business', pct: 28, roas: '2.8x' },
                  { seg: 'Design', pct: 18, roas: '4.1x' }, { seg: 'Marketing', pct: 12, roas: '1.9x' },
                ].map(d => (
                  <div key={d.seg} className="flex items-center gap-2 text-[8px]">
                    <span className="w-16 text-muted-foreground">{d.seg}</span>
                    <Progress value={d.pct} className="h-1.5 flex-1" />
                    <span className="font-medium w-8 text-right">{d.pct}%</span>
                    <Badge variant="secondary" className="text-[5px]">{d.roas}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Device & Platform" icon={<Smartphone className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-4 gap-2">
              {[
                { dev: 'Mobile', pct: 62, conv: 245 }, { dev: 'Desktop', pct: 28, conv: 111 },
                { dev: 'Tablet', pct: 8, conv: 31 }, { dev: 'Other', pct: 2, conv: 8 },
              ].map(d => (
                <div key={d.dev} className="rounded-2xl border p-3 text-center">
                  <div className="text-lg font-bold">{d.pct}%</div>
                  <div className="text-[9px] font-medium">{d.dev}</div>
                  <div className="text-[7px] text-muted-foreground">{d.conv} conv</div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ GEO HEAT ═══ */}
      {tab === 'geo' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Regions" value={String(GEO_DATA.length)} />
            <KPICard label="Top Region" value="United States" />
            <KPICard label="Best CPA" value="India — $11.43" />
            <KPICard label="Total Geo Spend" value="$7,660" />
          </KPIBand>

          <SectionCard title="Geo Performance" icon={<MapPin className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg"><Globe className="h-2.5 w-2.5 mr-1" />Map View</Button>}>
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Region</th><th className="text-right px-3 py-1.5">Impr.</th><th className="text-right px-3 py-1.5">Clicks</th><th className="text-right px-3 py-1.5">CTR</th><th className="text-right px-3 py-1.5">Spend</th><th className="text-right px-3 py-1.5">Conv.</th><th className="text-right px-3 py-1.5">CPA</th><th className="text-left px-3 py-1.5">Heat</th></tr></thead>
                <tbody>
                  {GEO_DATA.map(g => (
                    <tr key={g.region} className="border-t text-[8px] hover:bg-muted/20 transition-colors cursor-pointer">
                      <td className="px-3 py-1.5 font-medium">{g.region}</td>
                      <td className="px-3 py-1.5 text-right">{g.impressions}</td>
                      <td className="px-3 py-1.5 text-right">{g.clicks}</td>
                      <td className="px-3 py-1.5 text-right">{g.ctr}</td>
                      <td className="px-3 py-1.5 text-right">{g.spend}</td>
                      <td className="px-3 py-1.5 text-right font-semibold">{g.conversions}</td>
                      <td className="px-3 py-1.5 text-right">{g.cpa}</td>
                      <td className="px-3 py-1.5"><div className="flex items-center gap-1"><Progress value={g.heat} className={cn('h-1.5 w-12', g.heat > 70 && '[&>div]:bg-[hsl(var(--state-healthy))]')} /><span className="text-[7px]">{g.heat}</span></div></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="h-40 rounded-2xl border bg-muted/20 flex items-center justify-center text-[10px] text-muted-foreground">
            <div className="text-center"><Globe className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" /><div>Interactive geo heat map visualization</div><div className="text-[8px]">Click regions to drill into city-level data</div></div>
          </div>
        </div>
      )}

      {/* ═══ DELIVERY PACING ═══ */}
      {tab === 'pacing' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Est. Impressions" value="280K–350K" />
            <KPICard label="Est. Conversions" value="420–600" />
            <KPICard label="Budget Utilization" value="72%" />
            <KPICard label="Est. ROAS" value="3.2x–4.8x" />
          </KPIBand>

          <SectionCard title="Campaign Delivery Pacing" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-3">
              {CAMPAIGNS_PERF.filter(c => c.status === 'active').map(c => {
                const spentNum = parseFloat(c.spend.replace(/[$,]/g, ''));
                const pct = Math.round((spentNum / 5000) * 100);
                return (
                  <div key={c.id} className="rounded-xl border p-3">
                    <div className="flex items-center justify-between mb-1.5">
                      <div><div className="text-[10px] font-semibold">{c.name}</div><div className="text-[7px] text-muted-foreground">{c.id}</div></div>
                      <StatusBadge status={pct > 80 ? 'caution' : 'healthy'} label={pct > 80 ? 'Near limit' : 'On pace'} />
                    </div>
                    <div className="flex justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">Budget: $5,000</span><span className="font-medium">{c.spend} ({pct}%)</span></div>
                    <Progress value={pct} className={cn('h-1.5', pct > 80 && '[&>div]:bg-[hsl(var(--gigvora-amber))]')} />
                    <div className="flex gap-3 mt-1.5 text-[7px] text-muted-foreground">
                      <span>Avg daily: ${Math.round(spentNum / 10)}</span>
                      <span>Est. end: {pct > 80 ? '3 days early' : 'On schedule'}</span>
                      <span>ROAS: {c.roas}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="AI Recommendations" icon={<Lightbulb className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { rec: 'Increase CAM-101 budget by 15%', impact: '+28 conversions', conf: 'High' },
                { rec: 'Reduce CAM-102 CPM targets', impact: 'Save $420/mo', conf: 'Medium' },
                { rec: 'Shift spend from Display to Retargeting', impact: '+0.8x ROAS', conf: 'High' },
                { rec: 'Retire CR-06 — fatigue 65%', impact: 'Freshen creative', conf: 'High' },
              ].map(r => (
                <div key={r.rec} className="flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/20 transition-colors">
                  <div className="flex-1"><div className="text-[8px] font-medium">{r.rec}</div><div className="flex gap-1 mt-0.5"><Badge variant="secondary" className="text-[5px]">{r.impact}</Badge><Badge variant="secondary" className="text-[5px]">{r.conf}</Badge></div></div>
                  <Button size="sm" className="h-5 text-[7px] rounded-lg" onClick={() => toast.success('Applied')}>Apply</Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ KEYWORD PERFORMANCE ═══ */}
      {tab === 'keywords' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Keywords" value={String(KEYWORDS.length)} />
            <KPICard label="Avg QS" value="7.0" />
            <KPICard label="Best CTR" value="3.78%" />
            <KPICard label="Total Spend" value="$4,915" />
          </KPIBand>

          <div className="flex items-center gap-2 mb-1">
            <div className="relative flex-1 max-w-xs"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search keywords..." className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[9px]" /></div>
          </div>

          <div className="rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-2">Keyword</th><th className="text-right px-3 py-2">Impr.</th><th className="text-right px-3 py-2">Clicks</th><th className="text-right px-3 py-2">CTR</th><th className="text-right px-3 py-2">CPC</th><th className="text-right px-3 py-2">Conv.</th><th className="text-right px-3 py-2">Spend</th><th className="text-center px-3 py-2">QS</th><th className="text-center px-3 py-2">Trend</th></tr></thead>
              <tbody>
                {KEYWORDS.filter(kw => !search || kw.keyword.toLowerCase().includes(search.toLowerCase())).map(kw => (
                  <tr key={kw.keyword} onClick={() => setSelectedKw(kw)} className="border-t hover:bg-muted/20 cursor-pointer text-[8px] transition-colors">
                    <td className="px-3 py-2 font-medium">{kw.keyword}</td>
                    <td className="px-3 py-2 text-right text-muted-foreground">{kw.impressions}</td>
                    <td className="px-3 py-2 text-right">{kw.clicks}</td>
                    <td className="px-3 py-2 text-right font-semibold">{kw.ctr}</td>
                    <td className="px-3 py-2 text-right">{kw.cpc}</td>
                    <td className="px-3 py-2 text-right font-semibold">{kw.conversions}</td>
                    <td className="px-3 py-2 text-right">{kw.spend}</td>
                    <td className="px-3 py-2 text-center"><Badge variant={kw.quality >= 8 ? 'default' : 'secondary'} className="text-[7px]">{kw.quality}</Badge></td>
                    <td className="px-3 py-2 text-center">
                      {kw.trend === 'up' && <ArrowUpRight className="h-3 w-3 text-[hsl(var(--state-healthy))] mx-auto" />}
                      {kw.trend === 'down' && <ArrowDownRight className="h-3 w-3 text-destructive mx-auto" />}
                      {kw.trend === 'flat' && <span className="text-[8px] text-muted-foreground">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═══ FINANCE SUMMARY ═══ */}
      {tab === 'finance' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Spend" value="$8,915" change="+14%" trend="up" />
            <KPICard label="Revenue" value="$26,510" change="+28%" trend="up" />
            <KPICard label="Net ROI" value="$17,595" change="+35%" trend="up" />
            <KPICard label="Blended ROAS" value="2.97x" change="+0.4x" trend="up" />
          </KPIBand>

          <SectionCard title="Spend by Campaign" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="rounded-xl border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/30"><tr className="text-[8px] text-muted-foreground font-medium"><th className="text-left px-3 py-1.5">Campaign</th><th className="text-right px-3 py-1.5">Spend</th><th className="text-right px-3 py-1.5">Revenue</th><th className="text-right px-3 py-1.5">ROAS</th><th className="text-right px-3 py-1.5">CPA</th><th className="text-left px-3 py-1.5">Share</th></tr></thead>
                <tbody>
                  {CAMPAIGNS_PERF.map(c => {
                    const spentNum = parseFloat(c.spend.replace(/[$,]/g, ''));
                    const share = Math.round((spentNum / 8915) * 100);
                    return (
                      <tr key={c.id} className="border-t text-[8px] hover:bg-muted/20 transition-colors">
                        <td className="px-3 py-1.5"><div className="font-medium">{c.name}</div><div className="text-[7px] text-muted-foreground">{c.id}</div></td>
                        <td className="px-3 py-1.5 text-right">{c.spend}</td>
                        <td className="px-3 py-1.5 text-right font-semibold">{c.revenue}</td>
                        <td className="px-3 py-1.5 text-right"><Badge variant={parseFloat(c.roas) >= 3 ? 'default' : 'secondary'} className="text-[6px]">{c.roas}</Badge></td>
                        <td className="px-3 py-1.5 text-right">{c.cpa}</td>
                        <td className="px-3 py-1.5"><div className="flex items-center gap-1"><Progress value={share} className="h-1.5 w-12" /><span className="text-[7px]">{share}%</span></div></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <div className="grid grid-cols-2 gap-3">
            <SectionCard title="Budget Status" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { label: 'Monthly Cap', total: '$28,500', used: '$8,915', pct: 31 },
                  { label: 'Daily Average', total: '$950', used: '$892', pct: 94 },
                ].map(b => (
                  <div key={b.label} className="rounded-xl border p-2">
                    <div className="flex justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">{b.label}</span><span className="font-medium">{b.used} / {b.total}</span></div>
                    <Progress value={b.pct} className={cn('h-1.5', b.pct > 80 && '[&>div]:bg-[hsl(var(--gigvora-amber))]')} />
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Invoices & Billing" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl" action={<Link to="/finance/billing"><Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">Billing</Button></Link>}>
              <div className="space-y-1 text-[8px]">
                {[
                  { inv: 'INV-2024-041', amount: '$3,420', status: 'Paid' },
                  { inv: 'INV-2024-042', amount: '$2,980', status: 'Paid' },
                  { inv: 'INV-2024-043', amount: '$2,515', status: 'Pending' },
                ].map(i => (
                  <div key={i.inv} className="flex items-center justify-between p-1.5 rounded-lg border">
                    <span className="font-medium">{i.inv}</span>
                    <span>{i.amount}</span>
                    <Badge variant={i.status === 'Paid' ? 'default' : 'secondary'} className="text-[6px]">{i.status}</Badge>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">$8,915</span><div className="text-[8px] text-muted-foreground">Spend · 2.87x ROAS</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => toast.info('Exporting')}><Download className="h-3.5 w-3.5" />Export</Button>
      </div>

      {/* Drawers */}
      <KeywordDrawer kw={selectedKw} open={!!selectedKw} onClose={() => setSelectedKw(null)} />
      <CreativeDrawer cr={selectedCr} open={!!selectedCr} onClose={() => setSelectedCr(null)} />
    </DashboardLayout>
  );
};

export default AdsAnalyticsPage;
