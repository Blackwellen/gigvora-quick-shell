import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  BarChart3, TrendingUp, Clock, CheckCircle2, AlertTriangle, Shield,
  Star, Calendar, Eye, Target, Zap, ArrowLeft, ChevronRight,
  Activity, Users, Package, MessageSquare, Settings, Pause, Play,
  RefreshCw, ExternalLink, Search, Scale, Info, Award, Timer,
  Gauge, ToggleLeft, CalendarDays, Layers, ArrowRight, Flag,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type WorkbenchTab = 'performance' | 'capacity' | 'availability' | 'optimization' | 'conversion' | 'response' | 'benchmarking';

interface GigPerf {
  id: string; title: string; status: 'published' | 'paused' | 'draft';
  impressions: number; clicks: number; orders: number; revenue: number;
  rating: number; reviews: number; conversionRate: number;
  responseTime: string; completionRate: number; onTimeRate: number;
  category: string;
}

interface CapacitySlot {
  day: string; maxOrders: number; current: number; available: boolean;
}

const GIGS: GigPerf[] = [
  { id: 'G1', title: 'Professional Logo & Brand Identity Design', status: 'published', impressions: 12400, clicks: 890, orders: 67, revenue: 28500, rating: 4.9, reviews: 52, conversionRate: 7.5, responseTime: '< 1h', completionRate: 98, onTimeRate: 96, category: 'Design' },
  { id: 'G2', title: 'Full-Stack Web Application Development', status: 'published', impressions: 8200, clicks: 620, orders: 34, revenue: 68000, rating: 4.8, reviews: 28, conversionRate: 5.5, responseTime: '< 2h', completionRate: 97, onTimeRate: 94, category: 'Development' },
  { id: 'G3', title: 'SEO Audit & Content Strategy Package', status: 'published', impressions: 6800, clicks: 510, orders: 41, revenue: 24600, rating: 4.7, reviews: 35, conversionRate: 8.0, responseTime: '< 1h', completionRate: 100, onTimeRate: 98, category: 'Marketing' },
  { id: 'G4', title: 'Explainer Video & Motion Graphics', status: 'paused', impressions: 3200, clicks: 180, orders: 12, revenue: 7200, rating: 4.6, reviews: 10, conversionRate: 6.7, responseTime: '< 3h', completionRate: 92, onTimeRate: 83, category: 'Video' },
  { id: 'G5', title: 'AI Chatbot Integration & Training', status: 'draft', impressions: 0, clicks: 0, orders: 0, revenue: 0, rating: 0, reviews: 0, conversionRate: 0, responseTime: '—', completionRate: 0, onTimeRate: 0, category: 'AI/ML' },
];

const CAPACITY: CapacitySlot[] = [
  { day: 'Mon', maxOrders: 3, current: 2, available: true },
  { day: 'Tue', maxOrders: 3, current: 3, available: false },
  { day: 'Wed', maxOrders: 3, current: 1, available: true },
  { day: 'Thu', maxOrders: 3, current: 0, available: true },
  { day: 'Fri', maxOrders: 3, current: 2, available: true },
  { day: 'Sat', maxOrders: 1, current: 0, available: true },
  { day: 'Sun', maxOrders: 0, current: 0, available: false },
];

const BENCHMARKS = [
  { metric: 'Response Time', you: '< 1h', top10: '< 30min', category: '< 2h', ok: true },
  { metric: 'Completion Rate', you: '98%', top10: '99%', category: '94%', ok: true },
  { metric: 'On-time Delivery', you: '96%', top10: '98%', category: '89%', ok: true },
  { metric: 'Conversion Rate', you: '7.5%', top10: '12%', category: '5.2%', ok: false },
  { metric: 'Avg Rating', you: '4.9', top10: '4.95', category: '4.6', ok: true },
  { metric: 'Repeat Buyer Rate', you: '34%', top10: '45%', category: '22%', ok: false },
  { metric: 'Order Cancellation', you: '2%', top10: '< 1%', category: '5%', ok: true },
  { metric: 'Dispute Rate', you: '1.5%', top10: '< 0.5%', category: '3.8%', ok: false },
];

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const SellerPerformancePage: React.FC = () => {
  const [tab, setTab] = useState<WorkbenchTab>('performance');
  const [selectedGig, setSelectedGig] = useState<GigPerf | null>(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [capacityDrawer, setCapacityDrawer] = useState(false);
  const [optimizeDrawer, setOptimizeDrawer] = useState(false);
  const [compareDrawer, setCompareDrawer] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [availabilityOn, setAvailabilityOn] = useState(true);
  const [vacationMode, setVacationMode] = useState(false);

  const publishedGigs = GIGS.filter(g => g.status === 'published');
  const totalRevenue = GIGS.reduce((s, g) => s + g.revenue, 0);
  const totalOrders = GIGS.reduce((s, g) => s + g.orders, 0);
  const avgRating = publishedGigs.length ? +(publishedGigs.reduce((s, g) => s + g.rating, 0) / publishedGigs.length).toFixed(1) : 0;

  const compareGigs = GIGS.filter(g => compareIds.has(g.id));
  const toggleCompare = (id: string) => {
    setCompareIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.size < 4 ? n.add(id) : null; return n; });
  };

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <Link to="/gigs" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" />Gigs</Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <Gauge className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Seller Performance & Capacity</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5 text-[9px]">
        <span className="text-muted-foreground">Availability</span>
        <Switch checked={availabilityOn} onCheckedChange={v => { setAvailabilityOn(v); toast.success(v ? 'You are now available' : 'Availability paused'); }} className="h-4 w-7" />
        <StatusBadge status={availabilityOn ? 'healthy' : 'blocked'} label={availabilityOn ? 'Online' : 'Offline'} />
      </div>
      {compareIds.size > 0 && (
        <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setCompareDrawer(true)}>
          <Scale className="h-3 w-3" />Compare ({compareIds.size})
        </Button>
      )}
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = selectedGig ? (
    <div className="space-y-3">
      <SectionCard title="Gig Details" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="text-[10px] font-semibold mb-1">{selectedGig.title}</div>
          {[
            { l: 'Status', v: <StatusBadge status={selectedGig.status === 'published' ? 'live' : selectedGig.status === 'paused' ? 'caution' : 'pending'} label={selectedGig.status} /> },
            { l: 'Category', v: selectedGig.category },
            { l: 'Revenue', v: `$${selectedGig.revenue.toLocaleString()}` },
            { l: 'Orders', v: selectedGig.orders },
            { l: 'Rating', v: `${selectedGig.rating} ★ (${selectedGig.reviews})` },
            { l: 'Conversion', v: `${selectedGig.conversionRate}%` },
            { l: 'Response', v: selectedGig.responseTime },
            { l: 'On-time', v: `${selectedGig.onTimeRate}%` },
          ].map(r => (
            <div key={r.l} className="flex justify-between items-center"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setDetailDrawer(true)}><Eye className="h-3 w-3" />Full Inspection</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setOptimizeDrawer(true)}><Zap className="h-3 w-3" />Optimize Tips</Button>
          <Link to="/gigs"><Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><ExternalLink className="h-3 w-3" />View Gig</Button></Link>
          <Link to="/orders"><Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><Package className="h-3 w-3" />View Orders</Button></Link>
          {selectedGig.status === 'published' && (
            <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-[hsl(var(--state-caution))]" onClick={() => toast.info('Gig paused')}><Pause className="h-3 w-3" />Pause Gig</Button>
          )}
          {selectedGig.status === 'paused' && (
            <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-[hsl(var(--state-healthy))]" onClick={() => toast.info('Gig activated')}><Play className="h-3 w-3" />Activate Gig</Button>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => toggleCompare(selectedGig.id)}>
            <Scale className="h-3 w-3" />{compareIds.has(selectedGig.id) ? 'Remove Compare' : 'Add to Compare'}
          </Button>
        </div>
      </SectionCard>

      <SectionCard title="Health Score" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="text-center py-1">
          <div className="text-2xl font-bold text-[hsl(var(--state-healthy))]">92</div>
          <div className="text-[8px] text-muted-foreground">out of 100</div>
          <Progress value={92} className="h-1.5 mt-2" />
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Seller Summary" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Published Gigs</span><span className="font-medium">{publishedGigs.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Revenue</span><span className="font-bold">${totalRevenue.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-medium">{totalOrders}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Avg Rating</span><span className="font-medium">{avgRating} ★</span></div>
          <div className="border-t pt-1 flex justify-between"><span className="text-muted-foreground">Seller Level</span><StatusBadge status="premium" label="Level 2" /></div>
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setCapacityDrawer(true)}><Settings className="h-3 w-3" />Edit Capacity</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => { setVacationMode(!vacationMode); toast.success(vacationMode ? 'Vacation mode off' : 'Vacation mode on'); }}><CalendarDays className="h-3 w-3" />{vacationMode ? 'End Vacation' : 'Vacation Mode'}</Button>
          <Link to="/gigs/new"><Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><Package className="h-3 w-3" />Create New Gig</Button></Link>
          <Link to="/offers"><Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><Layers className="h-3 w-3" />Manage Offers</Button></Link>
        </div>
      </SectionCard>

      {vacationMode && (
        <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-2.5">
          <div className="flex items-center gap-1.5 text-[9px] font-medium text-[hsl(var(--state-caution))]"><CalendarDays className="h-3 w-3" />Vacation Mode Active</div>
          <p className="text-[8px] text-muted-foreground mt-0.5">All gigs are paused. New orders cannot be placed.</p>
        </div>
      )}

      {/* Alerts */}
      {GIGS.some(g => g.onTimeRate < 90) && (
        <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-2.5">
          <div className="flex items-center gap-1 text-[9px] font-medium text-[hsl(var(--state-caution))]"><AlertTriangle className="h-3 w-3" />On-Time Alert</div>
          <p className="text-[8px] text-muted-foreground mt-0.5">Some gigs have on-time delivery below 90%. This affects your seller level.</p>
        </div>
      )}
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56">
      {/* Workbench Tabs */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'performance' as const, label: 'Performance', icon: BarChart3 },
          { key: 'capacity' as const, label: 'Capacity', icon: Gauge },
          { key: 'availability' as const, label: 'Availability', icon: CalendarDays },
          { key: 'optimization' as const, label: 'Optimization', icon: Zap },
          { key: 'conversion' as const, label: 'Conversion', icon: Target },
          { key: 'response' as const, label: 'Response', icon: Timer },
          { key: 'benchmarking' as const, label: 'Benchmarks', icon: Award },
        ]).map(w => (
          <button key={w.key} onClick={() => setTab(w.key)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0',
            tab === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
            <w.icon className="h-3 w-3" />{w.label}
          </button>
        ))}
      </div>

      {/* ═══ PERFORMANCE ═══ */}
      {tab === 'performance' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Revenue (30d)" value={`$${totalRevenue.toLocaleString()}`} change="+18% vs last month" trend="up" />
            <KPICard label="Orders (30d)" value={totalOrders} change="+12%" trend="up" />
            <KPICard label="Avg Rating" value={`${avgRating} ★`} trend="up" />
            <KPICard label="Completion Rate" value="98%" trend="up" />
            <KPICard label="On-time Rate" value="96%" change="-1%" trend="down" />
          </KPIBand>

          <SectionCard title="Gig Performance" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} action={<Badge variant="secondary" className="text-[7px]">{GIGS.length} gigs</Badge>} className="!rounded-2xl">
            <div className="space-y-1.5">
              {GIGS.map(g => {
                const isSel = selectedGig?.id === g.id;
                return (
                  <div key={g.id} onClick={() => setSelectedGig(g)} className={cn(
                    'rounded-2xl border px-3 py-2.5 cursor-pointer transition-all hover:shadow-sm',
                    isSel && 'ring-1 ring-accent border-accent/30',
                  )}>
                    <div className="flex items-center gap-2">
                      <button className={cn('shrink-0 h-4 w-4 rounded border transition-colors', compareIds.has(g.id) ? 'bg-accent border-accent' : 'border-muted-foreground/30 hover:border-accent/50')} onClick={e => { e.stopPropagation(); toggleCompare(g.id); }}>
                        {compareIds.has(g.id) && <CheckCircle2 className="h-3 w-3 text-accent-foreground mx-auto" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-semibold truncate">{g.title}</span>
                          <StatusBadge status={g.status === 'published' ? 'live' : g.status === 'paused' ? 'caution' : 'pending'} label={g.status} />
                        </div>
                        <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                          <span>{g.category}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{g.impressions.toLocaleString()}</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Target className="h-2.5 w-2.5" />{g.conversionRate}%</span>
                          <span>·</span>
                          <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5" />{g.rating} ({g.reviews})</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[12px] font-bold">${g.revenue.toLocaleString()}</div>
                        <div className="text-[8px] text-muted-foreground">{g.orders} orders</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ CAPACITY ═══ */}
      {tab === 'capacity' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Orders" value={CAPACITY.reduce((s, c) => s + c.current, 0)} />
            <KPICard label="Max Weekly" value={CAPACITY.reduce((s, c) => s + c.maxOrders, 0)} />
            <KPICard label="Utilization" value={`${Math.round(CAPACITY.reduce((s, c) => s + c.current, 0) / CAPACITY.reduce((s, c) => s + c.maxOrders, 0) * 100)}%`} />
            <KPICard label="Available Slots" value={CAPACITY.reduce((s, c) => s + (c.available ? c.maxOrders - c.current : 0), 0)} />
          </KPIBand>

          <SectionCard title="Weekly Capacity" icon={<Gauge className="h-3.5 w-3.5 text-accent" />} action={<Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl" onClick={() => setCapacityDrawer(true)}><Settings className="h-2.5 w-2.5" />Edit</Button>} className="!rounded-2xl">
            <div className="grid grid-cols-7 gap-1.5">
              {CAPACITY.map(c => {
                const pct = c.maxOrders ? Math.round((c.current / c.maxOrders) * 100) : 0;
                return (
                  <div key={c.day} className={cn('rounded-2xl border p-2 text-center', !c.available && 'opacity-40')}>
                    <div className="text-[9px] font-semibold mb-1">{c.day}</div>
                    <div className={cn('text-lg font-bold', pct >= 100 ? 'text-destructive' : pct >= 75 ? 'text-[hsl(var(--state-caution))]' : 'text-[hsl(var(--state-healthy))]')}>{c.current}</div>
                    <div className="text-[7px] text-muted-foreground">/ {c.maxOrders}</div>
                    <Progress value={pct} className="h-1 mt-1" />
                    <div className="mt-1">
                      <StatusBadge status={!c.available ? 'blocked' : pct >= 100 ? 'blocked' : 'healthy'} label={!c.available ? 'Off' : pct >= 100 ? 'Full' : 'Open'} />
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Queue Health" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { label: 'Active orders in queue', value: '8', status: 'healthy' as const },
                { label: 'Overdue deliveries', value: '0', status: 'healthy' as const },
                { label: 'Due within 24h', value: '2', status: 'caution' as const },
                { label: 'Pending requirements', value: '1', status: 'review' as const },
              ].map(q => (
                <div key={q.label} className="flex items-center gap-2 text-[9px]">
                  <StatusBadge status={q.status} label={q.value} />
                  <span className="flex-1">{q.label}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ AVAILABILITY ═══ */}
      {tab === 'availability' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Status" value={availabilityOn ? 'Online' : 'Offline'} />
            <KPICard label="Vacation" value={vacationMode ? 'Active' : 'Off'} />
            <KPICard label="Response SLA" value="< 1h" />
            <KPICard label="Active Gigs" value={publishedGigs.length} />
          </KPIBand>

          <div className="grid md:grid-cols-2 gap-3">
            <SectionCard title="Availability Controls" icon={<ToggleLeft className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-2xl border p-3">
                  <div><div className="text-[10px] font-semibold">Online Status</div><div className="text-[8px] text-muted-foreground">Accept new orders</div></div>
                  <Switch checked={availabilityOn} onCheckedChange={v => { setAvailabilityOn(v); toast.success(v ? 'Now available' : 'Availability paused'); }} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border p-3">
                  <div><div className="text-[10px] font-semibold">Vacation Mode</div><div className="text-[8px] text-muted-foreground">Pause all gigs temporarily</div></div>
                  <Switch checked={vacationMode} onCheckedChange={v => { setVacationMode(v); toast.success(v ? 'Vacation mode enabled' : 'Vacation mode disabled'); }} />
                </div>
                <div className="flex items-center justify-between rounded-2xl border p-3">
                  <div><div className="text-[10px] font-semibold">Auto-Response</div><div className="text-[8px] text-muted-foreground">Auto-reply when unavailable</div></div>
                  <Switch defaultChecked />
                </div>
              </div>
            </SectionCard>

            <SectionCard title="Gig-Level Status" icon={<Package className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {GIGS.map(g => (
                  <div key={g.id} className="flex items-center gap-2 rounded-2xl border p-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-[9px] font-medium truncate">{g.title}</div>
                      <div className="text-[7px] text-muted-foreground">{g.category}</div>
                    </div>
                    <StatusBadge status={g.status === 'published' ? 'live' : g.status === 'paused' ? 'caution' : 'pending'} label={g.status} />
                    {g.status !== 'draft' && (
                      <Button variant="ghost" size="sm" className="h-5 text-[7px] px-1.5 rounded-xl" onClick={() => toast.info(`${g.status === 'published' ? 'Paused' : 'Activated'}: ${g.title}`)}>
                        {g.status === 'published' ? <Pause className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ═══ OPTIMIZATION ═══ */}
      {tab === 'optimization' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Health Score" value="92/100" trend="up" />
            <KPICard label="Optimization Tips" value="6" />
            <KPICard label="Implemented" value="4/6" />
            <KPICard label="Est. Revenue Lift" value="+$4,200/mo" trend="up" />
          </KPIBand>

          <SectionCard title="Offer Optimization Suggestions" icon={<Zap className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { title: 'Add a third package tier', desc: 'Sellers with 3 tiers convert 23% higher. Your "Logo Design" gig only has 2 tiers.', impact: 'High', done: false },
                { title: 'Improve response time on Video gig', desc: 'Your Explainer Video gig has a 3h response time. Bringing it under 1h could improve ranking.', impact: 'High', done: false },
                { title: 'Add FAQ section to AI Chatbot gig', desc: 'Gigs with 5+ FAQs have 15% higher conversion. Your draft gig has none.', impact: 'Medium', done: false },
                { title: 'Update portfolio images', desc: 'Fresh portfolio samples improve click-through by up to 30%.', impact: 'Medium', done: true },
                { title: 'Enable upsell add-ons', desc: 'Add-ons increase average order value by 40%. Currently active on 2/4 gigs.', impact: 'High', done: true },
                { title: 'Respond to all reviews', desc: 'Replying to reviews boosts trust signals. 3 unanswered reviews found.', impact: 'Low', done: true },
              ].map((tip, i) => (
                <div key={i} className={cn('rounded-2xl border p-3 transition-all', tip.done && 'opacity-50')}>
                  <div className="flex items-center gap-2 mb-1">
                    {tip.done ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] shrink-0" /> : <Zap className="h-3.5 w-3.5 text-accent shrink-0" />}
                    <span className="text-[10px] font-semibold flex-1">{tip.title}</span>
                    <Badge variant={tip.impact === 'High' ? 'default' : 'secondary'} className="text-[7px] rounded-lg">{tip.impact}</Badge>
                  </div>
                  <p className="text-[8px] text-muted-foreground ml-5">{tip.desc}</p>
                  {!tip.done && (
                    <div className="ml-5 mt-1.5">
                      <Button size="sm" className="h-5 text-[8px] gap-0.5 rounded-xl" onClick={() => toast.success('Tip applied!')}><ArrowRight className="h-2.5 w-2.5" />Apply Now</Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ CONVERSION ═══ */}
      {tab === 'conversion' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Avg Conversion" value="7.5%" change="+0.8% vs last month" trend="up" />
            <KPICard label="Total Impressions" value={GIGS.reduce((s, g) => s + g.impressions, 0).toLocaleString()} />
            <KPICard label="Total Clicks" value={GIGS.reduce((s, g) => s + g.clicks, 0).toLocaleString()} />
            <KPICard label="Click→Order Rate" value="8.2%" />
          </KPIBand>

          <SectionCard title="Conversion Funnel by Gig" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {publishedGigs.map(g => (
                <div key={g.id} className="rounded-2xl border p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-semibold flex-1 truncate">{g.title}</span>
                    <Badge variant="secondary" className="text-[7px]">{g.conversionRate}%</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-[8px]">
                    <div className="flex-1 text-center">
                      <div className="font-bold">{g.impressions.toLocaleString()}</div>
                      <div className="text-muted-foreground">Impressions</div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 text-center">
                      <div className="font-bold">{g.clicks.toLocaleString()}</div>
                      <div className="text-muted-foreground">Clicks</div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 text-center">
                      <div className="font-bold">{g.orders}</div>
                      <div className="text-muted-foreground">Orders</div>
                    </div>
                    <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />
                    <div className="flex-1 text-center">
                      <div className="font-bold">${g.revenue.toLocaleString()}</div>
                      <div className="text-muted-foreground">Revenue</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ RESPONSE ═══ */}
      {tab === 'response' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Avg Response" value="52 min" trend="up" change="Improved 15%" />
            <KPICard label="First Response" value="< 1h" />
            <KPICard label="Response Rate" value="99%" trend="up" />
            <KPICard label="Missed Messages" value="1" trend="down" />
          </KPIBand>

          <div className="grid md:grid-cols-2 gap-3">
            <SectionCard title="Response Times by Gig" icon={<Timer className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {GIGS.filter(g => g.status !== 'draft').map(g => (
                  <div key={g.id} className="flex items-center gap-2 text-[9px]">
                    {g.responseTime === '< 1h' ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" /> : <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))] shrink-0" />}
                    <span className="flex-1 truncate">{g.title}</span>
                    <span className="font-bold">{g.responseTime}</span>
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="Response Quality" icon={<MessageSquare className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { label: 'Messages answered within 1h', value: '94%', ok: true },
                  { label: 'Messages answered within 24h', value: '99%', ok: true },
                  { label: 'Custom offer response rate', value: '87%', ok: false },
                  { label: 'Average conversation length', value: '4.2 messages', ok: true },
                  { label: 'Buyer satisfaction with communication', value: '4.9/5', ok: true },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2 text-[9px]">
                    {m.ok ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" /> : <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))] shrink-0" />}
                    <span className="flex-1">{m.label}</span>
                    <span className="font-bold">{m.value}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ═══ BENCHMARKING ═══ */}
      {tab === 'benchmarking' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Seller Score" value="92/100" />
            <KPICard label="Category Rank" value="#12" />
            <KPICard label="Top 10% Metrics" value="5/8" />
            <KPICard label="Improvement Areas" value="3" />
          </KPIBand>

          <SectionCard title="Category Benchmarks" subtitle="Your performance vs. top sellers and category average" icon={<Award className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 text-muted-foreground font-medium">Metric</th>
                    <th className="py-2 px-3 text-center font-medium">You</th>
                    <th className="py-2 px-3 text-center font-medium text-accent">Top 10%</th>
                    <th className="py-2 px-3 text-center font-medium text-muted-foreground">Category Avg</th>
                    <th className="py-2 pl-3 text-center font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {BENCHMARKS.map(b => (
                    <tr key={b.metric} className="border-b last:border-0">
                      <td className="py-2 pr-3 font-medium">{b.metric}</td>
                      <td className="py-2 px-3 text-center font-bold">{b.you}</td>
                      <td className="py-2 px-3 text-center text-accent">{b.top10}</td>
                      <td className="py-2 px-3 text-center text-muted-foreground">{b.category}</td>
                      <td className="py-2 pl-3 text-center">{b.ok ? <CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))] mx-auto" /> : <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>

          <SectionCard title="Improvement Recommendations" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {BENCHMARKS.filter(b => !b.ok).map(b => (
                <div key={b.metric} className="rounded-2xl border border-[hsl(var(--state-caution))]/20 bg-[hsl(var(--state-caution))]/5 p-2.5">
                  <div className="flex items-center gap-1.5 text-[9px]"><AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" /><span className="font-medium">{b.metric}: {b.you} → Target: {b.top10}</span></div>
                  <p className="text-[8px] text-muted-foreground mt-0.5">Improving this metric will help reach top-seller status and increase visibility.</p>
                  <Button size="sm" className="h-5 text-[8px] gap-0.5 rounded-xl mt-1" onClick={() => { setTab('optimization'); }}><ArrowRight className="h-2.5 w-2.5" />View Tips</Button>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Mobile Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1">
          <span className="text-[10px] font-semibold">Seller Dashboard</span>
          <div className="text-[8px] text-muted-foreground">{publishedGigs.length} active gigs · ${totalRevenue.toLocaleString()} revenue</div>
        </div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setCapacityDrawer(true)}><Settings className="h-3.5 w-3.5" />Capacity</Button>
      </div>

      {/* ── Detail Inspector ── */}
      <Sheet open={detailDrawer} onOpenChange={setDetailDrawer}>
        <SheetContent className="w-[500px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Gig Performance Inspection</SheetTitle></SheetHeader>
          {selectedGig && (
            <div className="p-4 space-y-3">
              <h3 className="text-[12px] font-bold">{selectedGig.title}</h3>
              <StatusBadge status={selectedGig.status === 'published' ? 'live' : 'caution'} label={selectedGig.status} />
              <div className="grid grid-cols-3 gap-2">
                {[
                  { l: 'Revenue', v: `$${selectedGig.revenue.toLocaleString()}` },
                  { l: 'Orders', v: selectedGig.orders },
                  { l: 'Rating', v: `${selectedGig.rating} ★` },
                  { l: 'Impressions', v: selectedGig.impressions.toLocaleString() },
                  { l: 'Clicks', v: selectedGig.clicks.toLocaleString() },
                  { l: 'Conversion', v: `${selectedGig.conversionRate}%` },
                  { l: 'Response', v: selectedGig.responseTime },
                  { l: 'Completion', v: `${selectedGig.completionRate}%` },
                  { l: 'On-time', v: `${selectedGig.onTimeRate}%` },
                ].map(d => (
                  <div key={d.l} className="rounded-2xl border p-2 text-center"><div className="text-[7px] text-muted-foreground">{d.l}</div><div className="text-[10px] font-bold">{d.v}</div></div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Link to="/gigs" className="flex-1"><Button variant="outline" size="sm" className="h-7 text-[9px] w-full gap-1 rounded-xl"><ExternalLink className="h-3 w-3" />Edit Gig</Button></Link>
                <Link to="/orders" className="flex-1"><Button size="sm" className="h-7 text-[9px] w-full gap-1 rounded-xl"><Package className="h-3 w-3" />View Orders</Button></Link>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Capacity Editor Drawer ── */}
      <Sheet open={capacityDrawer} onOpenChange={setCapacityDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Edit Capacity</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div className="text-[9px] text-muted-foreground mb-2">Set max concurrent orders per day.</div>
            {CAPACITY.map(c => (
              <div key={c.day} className="flex items-center gap-3 rounded-2xl border p-2.5">
                <span className="text-[10px] font-semibold w-8">{c.day}</span>
                <input type="number" min={0} max={10} defaultValue={c.maxOrders} className="h-7 w-16 rounded-xl border bg-background px-2 text-[10px] text-center" />
                <span className="text-[8px] text-muted-foreground flex-1">max orders</span>
                <Switch defaultChecked={c.available} />
              </div>
            ))}
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setCapacityDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setCapacityDrawer(false); toast.success('Capacity updated!'); }}><CheckCircle2 className="h-3 w-3" />Save</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Optimize Drawer ── */}
      <Sheet open={optimizeDrawer} onOpenChange={setOptimizeDrawer}>
        <SheetContent className="w-[480px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4 text-accent" />Optimization Tips</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            {selectedGig && (
              <>
                <div className="rounded-2xl border p-2.5">
                  <div className="text-[10px] font-semibold">{selectedGig.title}</div>
                  <div className="text-[8px] text-muted-foreground">Current conversion: {selectedGig.conversionRate}% · Rating: {selectedGig.rating} ★</div>
                </div>
                <div className="space-y-2">
                  {[
                    { tip: 'Add video preview to increase engagement by 40%', cta: 'Upload Video' },
                    { tip: 'Update pricing to match market benchmarks', cta: 'Review Pricing' },
                    { tip: 'Add more portfolio samples (current: 3, recommended: 6+)', cta: 'Add Samples' },
                    { tip: 'Write longer gig description (current: 120 words, target: 300+)', cta: 'Edit Description' },
                  ].map((t, i) => (
                    <div key={i} className="rounded-2xl border p-2.5">
                      <p className="text-[9px] mb-1.5">{t.tip}</p>
                      <Button size="sm" className="h-5 text-[8px] gap-0.5 rounded-xl"><ArrowRight className="h-2.5 w-2.5" />{t.cta}</Button>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Compare Drawer ── */}
      <Sheet open={compareDrawer} onOpenChange={setCompareDrawer}>
        <SheetContent className="w-[600px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-accent" />Compare Gigs ({compareGigs.length})</SheetTitle></SheetHeader>
          <div className="p-4">
            {compareGigs.length === 0 ? (
              <div className="text-center py-8">
                <Scale className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-[11px] font-semibold">No gigs selected</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead><tr className="border-b"><th className="text-left py-2 pr-2 text-muted-foreground font-medium">Metric</th>{compareGigs.map(g => <th key={g.id} className="py-2 px-2 text-center font-medium min-w-[100px]">{g.title.slice(0, 20)}...</th>)}</tr></thead>
                  <tbody>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Status</td>{compareGigs.map(g => <td key={g.id} className="py-1.5 px-2 text-center"><StatusBadge status={g.status === 'published' ? 'live' : 'caution'} label={g.status} /></td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Revenue</td>{compareGigs.map(g => <td key={g.id} className="py-1.5 px-2 text-center font-bold">${g.revenue.toLocaleString()}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Orders</td>{compareGigs.map(g => <td key={g.id} className="py-1.5 px-2 text-center">{g.orders}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Rating</td>{compareGigs.map(g => <td key={g.id} className="py-1.5 px-2 text-center">{g.rating} ★</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Conversion</td>{compareGigs.map(g => <td key={g.id} className="py-1.5 px-2 text-center">{g.conversionRate}%</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Response</td>{compareGigs.map(g => <td key={g.id} className="py-1.5 px-2 text-center">{g.responseTime}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">On-time</td>{compareGigs.map(g => <td key={g.id} className="py-1.5 px-2 text-center">{g.onTimeRate}%</td>)}</tr>
                    <tr><td className="py-1.5 pr-2 text-muted-foreground">Completion</td>{compareGigs.map(g => <td key={g.id} className="py-1.5 px-2 text-center">{g.completionRate}%</td>)}</tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default SellerPerformancePage;
