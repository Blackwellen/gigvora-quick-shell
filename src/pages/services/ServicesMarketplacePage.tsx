import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Store, Package, ShoppingCart, Calendar, Star, Eye, Target,
  ArrowLeft, ChevronRight, Clock, CheckCircle2,
  Plus, Search, Scale, ExternalLink, Edit, Pause, Play,
  Users, TrendingUp, DollarSign, BarChart3, MessageSquare,
  Grid3X3, List, Filter, BookOpen, Gift, Tag, Shield,
  Bookmark, Copy, RefreshCw, Archive,
} from 'lucide-react';
import { toast } from 'sonner';

type WorkbenchTab = 'catalogue' | 'detail' | 'builder' | 'bundles' | 'orders' | 'booking' | 'analytics';

interface Service {
  id: string; title: string; status: 'published' | 'paused' | 'draft' | 'archived';
  type: 'productized' | 'custom' | 'retainer' | 'consultation';
  category: string; price: number; priceModel: 'fixed' | 'hourly' | 'monthly' | 'per-project';
  rating: number; reviews: number; orders: number; revenue: number;
  impressions: number; conversion: number; seller: string;
  description: string; deliveryDays: number; revisions: number;
  tags: string[];
}

interface Bundle {
  id: string; name: string; services: string[]; discount: number;
  status: 'active' | 'draft' | 'expired'; orders: number; revenue: number;
}

const SERVICES: Service[] = [
  { id: 'S1', title: 'Brand Identity & Logo System', status: 'published', type: 'productized', category: 'Design', price: 499, priceModel: 'fixed', rating: 4.9, reviews: 87, orders: 134, revenue: 66866, impressions: 18200, conversion: 7.4, seller: 'Ava Chen', description: 'Complete brand identity including logo, color palette, typography, and brand guidelines.', deliveryDays: 7, revisions: 3, tags: ['branding', 'logo', 'identity'] },
  { id: 'S2', title: 'Technical SEO Audit & Fixes', status: 'published', type: 'productized', category: 'Marketing', price: 299, priceModel: 'fixed', rating: 4.8, reviews: 64, orders: 98, revenue: 29302, impressions: 12400, conversion: 5.2, seller: 'Marco R.', description: 'Deep technical SEO audit with actionable fix list and implementation support.', deliveryDays: 5, revisions: 2, tags: ['seo', 'audit', 'marketing'] },
  { id: 'S3', title: 'Full-Stack MVP Development', status: 'published', type: 'custom', category: 'Development', price: 2500, priceModel: 'per-project', rating: 4.9, reviews: 32, orders: 28, revenue: 70000, impressions: 8600, conversion: 3.3, seller: 'DevTeam Pro', description: 'End-to-end MVP development with React, Node.js, and cloud deployment.', deliveryDays: 21, revisions: 5, tags: ['development', 'mvp', 'fullstack'] },
  { id: 'S4', title: 'Monthly Content Strategy Retainer', status: 'published', type: 'retainer', category: 'Content', price: 1200, priceModel: 'monthly', rating: 4.7, reviews: 19, orders: 15, revenue: 18000, impressions: 5200, conversion: 2.9, seller: 'Sarah K.', description: 'Ongoing content strategy, calendar planning, and performance reporting.', deliveryDays: 30, revisions: 0, tags: ['content', 'strategy', 'retainer'] },
  { id: 'S5', title: '1-on-1 Business Strategy Session', status: 'published', type: 'consultation', category: 'Consulting', price: 150, priceModel: 'hourly', rating: 4.8, reviews: 42, orders: 56, revenue: 8400, impressions: 9800, conversion: 5.7, seller: 'James W.', description: '60-minute strategy session with actionable takeaways and follow-up notes.', deliveryDays: 1, revisions: 0, tags: ['consulting', 'strategy', 'business'] },
  { id: 'S6', title: 'E-commerce Product Photography', status: 'paused', type: 'productized', category: 'Photography', price: 350, priceModel: 'fixed', rating: 4.6, reviews: 28, orders: 42, revenue: 14700, impressions: 4100, conversion: 6.8, seller: 'Lens Studio', description: 'Professional product photography with editing, 10 images per session.', deliveryDays: 3, revisions: 2, tags: ['photography', 'ecommerce', 'product'] },
  { id: 'S7', title: 'Pitch Deck & Investor Materials', status: 'draft', type: 'productized', category: 'Design', price: 800, priceModel: 'fixed', rating: 0, reviews: 0, orders: 0, revenue: 0, impressions: 0, conversion: 0, seller: 'Ava Chen', description: 'Investor-ready pitch deck with data visualization and storytelling.', deliveryDays: 5, revisions: 3, tags: ['pitchdeck', 'investor', 'design'] },
];

const BUNDLES: Bundle[] = [
  { id: 'B1', name: 'Launch Package', services: ['S1', 'S3', 'S5'], discount: 15, status: 'active', orders: 12, revenue: 32130 },
  { id: 'B2', name: 'Growth Bundle', services: ['S2', 'S4'], discount: 10, status: 'active', orders: 8, revenue: 10792 },
  { id: 'B3', name: 'Premium Brand Kit', services: ['S1', 'S6', 'S7'], discount: 20, status: 'draft', orders: 0, revenue: 0 },
];

const CATEGORIES = ['All', 'Design', 'Marketing', 'Development', 'Content', 'Consulting', 'Photography'];
const SERVICE_TYPES = ['All', 'productized', 'custom', 'retainer', 'consultation'];

const ServicesMarketplacePage: React.FC = () => {
  const [tab, setTab] = useState<WorkbenchTab>('catalogue');
  const [selected, setSelected] = useState<Service | null>(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [builderDrawer, setBuilderDrawer] = useState(false);
  const [compareDrawer, setCompareDrawer] = useState(false);
  const [bundleDrawer, setBundleDrawer] = useState(false);
  const [orderConfirm, setOrderConfirm] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterCat, setFilterCat] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const toggleCompare = (id: string) => {
    setCompareIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else if (n.size < 4) n.add(id); else toast.error('Max 4'); return n; });
  };
  const compareServices = SERVICES.filter(s => compareIds.has(s.id));

  const filtered = SERVICES.filter(s => {
    if (filterCat !== 'All' && s.category !== filterCat) return false;
    if (filterType !== 'All' && s.type !== filterType) return false;
    if (searchQuery && !s.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const totalRevenue = SERVICES.reduce((a, s) => a + s.revenue, 0);
  const totalOrders = SERVICES.reduce((a, s) => a + s.orders, 0);
  const published = SERVICES.filter(s => s.status === 'published').length;

  const priceLabel = (s: Service) => {
    const m: Record<string, string> = { fixed: '', hourly: '/hr', monthly: '/mo', 'per-project': ' est.' };
    return `$${s.price.toLocaleString()}${m[s.priceModel] || ''}`;
  };

  const typeColor = (t: string) => {
    const m: Record<string, string> = { productized: 'bg-accent/10 text-accent', custom: 'bg-blue-500/10 text-blue-600', retainer: 'bg-purple-500/10 text-purple-600', consultation: 'bg-amber-500/10 text-amber-600' };
    return m[t] || 'bg-muted text-muted-foreground';
  };

  const topStrip = (
    <>
      <Link to="/gigs" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" />Gigs</Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <Store className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Services Catalogue</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="h-3 w-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search services…" className="h-7 w-44 pl-7 pr-2 rounded-xl border bg-background text-[9px]" />
      </div>
      {compareIds.size > 0 && (
        <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setCompareDrawer(true)}>
          <Scale className="h-3 w-3" />Compare ({compareIds.size})
        </Button>
      )}
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = selected ? (
    <div className="space-y-3">
      <SectionCard title="Service Detail" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="text-[10px] font-semibold mb-1">{selected.title}</div>
          {[
            { l: 'Status', v: <StatusBadge status={selected.status === 'published' ? 'live' : selected.status === 'paused' ? 'caution' : 'pending'} label={selected.status} /> },
            { l: 'Type', v: <span className={cn('px-1.5 py-0.5 rounded text-[7px] font-medium', typeColor(selected.type))}>{selected.type}</span> },
            { l: 'Price', v: priceLabel(selected) },
            { l: 'Category', v: selected.category },
            { l: 'Rating', v: selected.rating ? `${selected.rating} ★ (${selected.reviews})` : '—' },
            { l: 'Orders', v: selected.orders },
            { l: 'Revenue', v: `$${selected.revenue.toLocaleString()}` },
            { l: 'Delivery', v: `${selected.deliveryDays}d` },
            { l: 'Seller', v: selected.seller },
          ].map(r => (
            <div key={r.l} className="flex justify-between items-center"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
          ))}
          <div className="flex flex-wrap gap-1 pt-1">{selected.tags.map(t => <Badge key={t} variant="secondary" className="text-[6px] rounded-lg">{t}</Badge>)}</div>
        </div>
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setDetailDrawer(true)}><Eye className="h-3 w-3" />Full Inspector</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setOrderConfirm(true)}><ShoppingCart className="h-3 w-3" />Order Now</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => toggleCompare(selected.id)}><Scale className="h-3 w-3" />{compareIds.has(selected.id) ? 'Remove Compare' : 'Add Compare'}</Button>
          <Link to="/messages"><Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><MessageSquare className="h-3 w-3" />Message Seller</Button></Link>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => toast.success('Saved!')}><Bookmark className="h-3 w-3" />Save</Button>
          {selected.status === 'published' && <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-[hsl(var(--state-caution))]" onClick={() => toast.info('Paused')}><Pause className="h-3 w-3" />Pause</Button>}
          {selected.status === 'paused' && <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-[hsl(var(--state-healthy))]" onClick={() => toast.info('Activated')}><Play className="h-3 w-3" />Activate</Button>}
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Catalogue Summary" icon={<Store className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Published</span><span className="font-medium">{published}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Revenue</span><span className="font-bold">${totalRevenue.toLocaleString()}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total Orders</span><span className="font-medium">{totalOrders}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Active Bundles</span><span className="font-medium">{BUNDLES.filter(b => b.status === 'active').length}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setBuilderDrawer(true)}><Plus className="h-3 w-3" />Create Service</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setBundleDrawer(true)}><Gift className="h-3 w-3" />Create Bundle</Button>
          <Link to="/offers"><Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><Tag className="h-3 w-3" />Custom Offers</Button></Link>
          <Link to="/orders"><Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><ShoppingCart className="h-3 w-3" />Orders</Button></Link>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56">
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'catalogue' as const, label: 'Catalogue', icon: Store },
          { key: 'detail' as const, label: 'Service Detail', icon: BookOpen },
          { key: 'builder' as const, label: 'Builder', icon: Edit },
          { key: 'bundles' as const, label: 'Bundles', icon: Gift },
          { key: 'orders' as const, label: 'Orders', icon: ShoppingCart },
          { key: 'booking' as const, label: 'Booking', icon: Calendar },
          { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
        ]).map(w => (
          <button key={w.key} onClick={() => setTab(w.key)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0',
            tab === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
            <w.icon className="h-3 w-3" />{w.label}
          </button>
        ))}
      </div>

      {/* CATALOGUE */}
      {tab === 'catalogue' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Published" value={published} />
            <KPICard label="Revenue (30d)" value={`$${totalRevenue.toLocaleString()}`} change="+14%" trend="up" />
            <KPICard label="Orders (30d)" value={totalOrders} change="+9%" trend="up" />
            <KPICard label="Avg Conversion" value={`${(SERVICES.filter(s => s.conversion).reduce((a, s) => a + s.conversion, 0) / SERVICES.filter(s => s.conversion).length).toFixed(1)}%`} />
          </KPIBand>

          <div className="flex items-center gap-2 flex-wrap">
            <Filter className="h-3 w-3 text-muted-foreground" />
            <span className="text-[8px] text-muted-foreground">Category:</span>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setFilterCat(c)} className={cn('px-2 py-0.5 rounded-lg text-[8px] transition-colors', filterCat === c ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:bg-muted/30')}>{c}</button>
            ))}
            <div className="border-l pl-2 flex items-center gap-1">
              <span className="text-[8px] text-muted-foreground">Type:</span>
              {SERVICE_TYPES.map(t => (
                <button key={t} onClick={() => setFilterType(t)} className={cn('px-2 py-0.5 rounded-lg text-[8px] transition-colors capitalize', filterType === t ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:bg-muted/30')}>{t}</button>
              ))}
            </div>
            <div className="flex-1" />
            <div className="flex items-center gap-1 border rounded-xl p-0.5">
              <button onClick={() => setViewMode('grid')} className={cn('p-1 rounded-lg', viewMode === 'grid' && 'bg-accent/10')}><Grid3X3 className="h-3 w-3" /></button>
              <button onClick={() => setViewMode('list')} className={cn('p-1 rounded-lg', viewMode === 'list' && 'bg-accent/10')}><List className="h-3 w-3" /></button>
            </div>
          </div>

          {viewMode === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map(s => {
                const isSel = selected?.id === s.id;
                return (
                  <div key={s.id} onClick={() => setSelected(s)} className={cn(
                    'rounded-2xl border p-3 cursor-pointer transition-all hover:shadow-md group',
                    isSel && 'ring-1 ring-accent border-accent/30',
                  )}>
                    <div className="h-24 rounded-xl bg-gradient-to-br from-accent/5 to-accent/15 mb-2 flex items-center justify-center">
                      <Store className="h-6 w-6 text-accent/30" />
                    </div>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={cn('px-1.5 py-0.5 rounded text-[7px] font-medium', typeColor(s.type))}>{s.type}</span>
                      <StatusBadge status={s.status === 'published' ? 'live' : s.status === 'paused' ? 'caution' : 'pending'} label={s.status} />
                    </div>
                    <h3 className="text-[11px] font-semibold mb-0.5 line-clamp-2 group-hover:text-accent transition-colors">{s.title}</h3>
                    <p className="text-[8px] text-muted-foreground line-clamp-2 mb-2">{s.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px] font-bold">{priceLabel(s)}</span>
                      <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                        {s.rating > 0 && <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />{s.rating}</span>}
                        <span>{s.orders} orders</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 pt-2 border-t text-[8px] text-muted-foreground">
                      <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[7px] font-bold text-accent">{s.seller[0]}</div>
                      <span>{s.seller}</span>
                      <span className="ml-auto">{s.deliveryDays}d delivery</span>
                    </div>
                    <div className="flex items-center gap-1 mt-1.5">
                      <button className={cn('h-4 w-4 rounded border transition-colors shrink-0', compareIds.has(s.id) ? 'bg-accent border-accent' : 'border-muted-foreground/30 hover:border-accent/50')} onClick={e => { e.stopPropagation(); toggleCompare(s.id); }}>
                        {compareIds.has(s.id) && <CheckCircle2 className="h-3 w-3 text-accent-foreground mx-auto" />}
                      </button>
                      <span className="text-[7px] text-muted-foreground">Compare</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <SectionCard title="Services" icon={<Store className="h-3.5 w-3.5 text-accent" />} action={<Badge variant="secondary" className="text-[7px]">{filtered.length} services</Badge>} className="!rounded-2xl">
              <div className="space-y-1.5">
                {filtered.map(s => {
                  const isSel = selected?.id === s.id;
                  return (
                    <div key={s.id} onClick={() => setSelected(s)} className={cn(
                      'rounded-2xl border px-3 py-2.5 cursor-pointer transition-all hover:shadow-sm',
                      isSel && 'ring-1 ring-accent border-accent/30',
                    )}>
                      <div className="flex items-center gap-2">
                        <button className={cn('shrink-0 h-4 w-4 rounded border transition-colors', compareIds.has(s.id) ? 'bg-accent border-accent' : 'border-muted-foreground/30')} onClick={e => { e.stopPropagation(); toggleCompare(s.id); }}>
                          {compareIds.has(s.id) && <CheckCircle2 className="h-3 w-3 text-accent-foreground mx-auto" />}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-[10px] font-semibold truncate">{s.title}</span>
                            <span className={cn('px-1.5 py-0.5 rounded text-[7px] font-medium shrink-0', typeColor(s.type))}>{s.type}</span>
                            <StatusBadge status={s.status === 'published' ? 'live' : s.status === 'paused' ? 'caution' : 'pending'} label={s.status} />
                          </div>
                          <div className="flex items-center gap-3 text-[8px] text-muted-foreground">
                            <span>{s.category}</span><span>·</span>
                            <span>{s.seller}</span><span>·</span>
                            <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{s.impressions.toLocaleString()}</span><span>·</span>
                            <span className="flex items-center gap-0.5"><Target className="h-2.5 w-2.5" />{s.conversion}%</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-[12px] font-bold">{priceLabel(s)}</div>
                          <div className="text-[8px] text-muted-foreground">{s.orders} orders</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          )}
        </div>
      )}

      {/* SERVICE DETAIL */}
      {tab === 'detail' && (
        <div className="space-y-3">
          {selected ? (
            <>
              <SectionCard title={selected.title} icon={<BookOpen className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="h-40 rounded-2xl bg-gradient-to-br from-accent/5 to-accent/15 mb-3 flex items-center justify-center"><Store className="h-10 w-10 text-accent/20" /></div>
                    <p className="text-[10px] text-muted-foreground">{selected.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">{selected.tags.map(t => <Badge key={t} variant="secondary" className="text-[7px] rounded-lg">{t}</Badge>)}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="rounded-2xl border p-3">
                      <div className="text-[8px] text-muted-foreground mb-0.5">Price</div>
                      <div className="text-xl font-bold">{priceLabel(selected)}</div>
                      <div className="text-[8px] text-muted-foreground">{selected.deliveryDays} day delivery · {selected.revisions} revisions</div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[{ l: 'Orders', v: selected.orders }, { l: 'Revenue', v: `$${selected.revenue.toLocaleString()}` }, { l: 'Rating', v: selected.rating ? `${selected.rating} ★` : '—' }, { l: 'Conversion', v: `${selected.conversion}%` }].map(m => (
                        <div key={m.l} className="rounded-2xl border p-2 text-center"><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[11px] font-bold">{m.v}</div></div>
                      ))}
                    </div>
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => setOrderConfirm(true)}><ShoppingCart className="h-3 w-3" />Order Now</Button>
                      <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Contact</Button>
                    </div>
                  </div>
                </div>
              </SectionCard>
              <SectionCard title="Seller" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">{selected.seller[0]}</div>
                  <div><div className="text-[11px] font-semibold">{selected.seller}</div><div className="text-[8px] text-muted-foreground">{selected.category} specialist · {selected.reviews} reviews</div></div>
                  <div className="ml-auto"><Link to="/profile"><Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl"><ExternalLink className="h-2.5 w-2.5" />Profile</Button></Link></div>
                </div>
              </SectionCard>
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <div className="text-[11px] font-semibold">Select a service from the catalogue</div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl mt-2" onClick={() => setTab('catalogue')}>Browse Catalogue</Button>
            </div>
          )}
        </div>
      )}

      {/* BUILDER */}
      {tab === 'builder' && (
        <div className="space-y-3">
          <SectionCard title="Service Builder" subtitle="Create or edit a productized service" icon={<Edit className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-3">
              <div><label className="text-[9px] font-medium mb-1 block">Service Title</label><input className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="e.g. Professional Logo Design" /></div>
              <div className="grid md:grid-cols-2 gap-3">
                <div><label className="text-[9px] font-medium mb-1 block">Category</label><select className="h-8 w-full rounded-xl border bg-background px-2 text-[10px]">{CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}</select></div>
                <div><label className="text-[9px] font-medium mb-1 block">Service Type</label><select className="h-8 w-full rounded-xl border bg-background px-2 text-[10px]">{SERVICE_TYPES.filter(t => t !== 'All').map(t => <option key={t} className="capitalize">{t}</option>)}</select></div>
              </div>
              <div><label className="text-[9px] font-medium mb-1 block">Description</label><textarea className="w-full rounded-xl border bg-background p-3 text-[10px] h-20 resize-none" placeholder="Describe your service…" /></div>
              <div className="grid md:grid-cols-3 gap-3">
                <div><label className="text-[9px] font-medium mb-1 block">Price ($)</label><input type="number" className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="299" /></div>
                <div><label className="text-[9px] font-medium mb-1 block">Pricing Model</label><select className="h-8 w-full rounded-xl border bg-background px-2 text-[10px]"><option>Fixed</option><option>Hourly</option><option>Monthly</option><option>Per Project</option></select></div>
                <div><label className="text-[9px] font-medium mb-1 block">Delivery (days)</label><input type="number" className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="7" /></div>
              </div>
              <div><label className="text-[9px] font-medium mb-1 block">Tags</label><input className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="branding, logo, identity" /></div>
              <div className="border-t pt-3 flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 rounded-xl"><Archive className="h-3 w-3" />Save Draft</Button>
                <Button size="sm" className="h-8 text-[10px] gap-1 rounded-xl" onClick={() => toast.success('Service published!')}><CheckCircle2 className="h-3 w-3" />Publish Service</Button>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* BUNDLES */}
      {tab === 'bundles' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Bundles" value={BUNDLES.filter(b => b.status === 'active').length} />
            <KPICard label="Bundle Revenue" value={`$${BUNDLES.reduce((a, b) => a + b.revenue, 0).toLocaleString()}`} />
            <KPICard label="Bundle Orders" value={BUNDLES.reduce((a, b) => a + b.orders, 0)} />
            <KPICard label="Avg Discount" value={`${Math.round(BUNDLES.reduce((a, b) => a + b.discount, 0) / BUNDLES.length)}%`} />
          </KPIBand>
          <SectionCard title="Service Bundles" icon={<Gift className="h-3.5 w-3.5 text-accent" />} action={<Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl" onClick={() => setBundleDrawer(true)}><Plus className="h-2.5 w-2.5" />New Bundle</Button>} className="!rounded-2xl">
            <div className="space-y-2">
              {BUNDLES.map(b => {
                const bundleServices = SERVICES.filter(s => b.services.includes(s.id));
                const tp = bundleServices.reduce((a, s) => a + s.price, 0);
                const dp = Math.round(tp * (1 - b.discount / 100));
                return (
                  <div key={b.id} className="rounded-2xl border p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Gift className="h-4 w-4 text-accent" />
                      <span className="text-[11px] font-semibold flex-1">{b.name}</span>
                      <StatusBadge status={b.status === 'active' ? 'live' : b.status === 'draft' ? 'pending' : 'blocked'} label={b.status} />
                      <Badge variant="secondary" className="text-[7px]">{b.discount}% off</Badge>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {bundleServices.map(s => (
                        <div key={s.id} className="rounded-xl border px-2 py-1 text-[8px] flex items-center gap-1"><Package className="h-2.5 w-2.5 text-accent" />{s.title.slice(0, 25)}…</div>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-[9px]">
                      <div><span className="line-through text-muted-foreground">${tp.toLocaleString()}</span> <span className="font-bold text-[hsl(var(--state-healthy))]">${dp.toLocaleString()}</span></div>
                      <span className="text-muted-foreground">{b.orders} orders · ${b.revenue.toLocaleString()}</span>
                      <div className="ml-auto flex gap-1">
                        <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5 rounded-xl"><Edit className="h-2.5 w-2.5" /></Button>
                        <Button variant="ghost" size="sm" className="h-5 text-[8px] px-1.5 rounded-xl"><Copy className="h-2.5 w-2.5" /></Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ORDERS */}
      {tab === 'orders' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Orders" value="12" />
            <KPICard label="Completed (30d)" value="34" trend="up" />
            <KPICard label="Revenue (30d)" value={`$${totalRevenue.toLocaleString()}`} />
            <KPICard label="Completion Rate" value="98%" trend="up" />
          </KPIBand>
          <SectionCard title="Service Orders" icon={<ShoppingCart className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { id: 'ORD-1001', service: 'Brand Identity & Logo System', buyer: 'TechCorp Inc.', status: 'in-progress', amount: '$499', due: '3 days' },
                { id: 'ORD-1002', service: 'Technical SEO Audit & Fixes', buyer: 'StartupXYZ', status: 'delivered', amount: '$299', due: 'Completed' },
                { id: 'ORD-1003', service: 'Launch Package (Bundle)', buyer: 'NewVenture LLC', status: 'requirements', amount: '$2,681', due: '14 days' },
                { id: 'ORD-1004', service: 'Monthly Content Retainer', buyer: 'GrowthCo', status: 'in-progress', amount: '$1,200/mo', due: 'Ongoing' },
                { id: 'ORD-1005', service: '1-on-1 Strategy Session', buyer: 'Solo Founder', status: 'completed', amount: '$150', due: 'Completed' },
              ].map(o => (
                <div key={o.id} className="rounded-2xl border px-3 py-2.5 flex items-center gap-2 hover:shadow-sm transition-all cursor-pointer" onClick={() => toast.info(`Viewing ${o.id}`)}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[9px] font-mono text-muted-foreground">{o.id}</span>
                      <span className="text-[10px] font-semibold truncate">{o.service}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground">{o.buyer} · {o.due}</div>
                  </div>
                  <StatusBadge status={o.status === 'completed' || o.status === 'delivered' ? 'healthy' : o.status === 'requirements' ? 'review' : 'live'} label={o.status} />
                  <span className="text-[10px] font-bold">{o.amount}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* BOOKING */}
      {tab === 'booking' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Upcoming Sessions" value="4" />
            <KPICard label="Active Retainers" value="2" />
            <KPICard label="Recurring Revenue" value="$2,400/mo" />
            <KPICard label="Utilization" value="72%" />
          </KPIBand>
          <div className="grid md:grid-cols-2 gap-3">
            <SectionCard title="Upcoming Bookings" icon={<Calendar className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {[
                  { time: 'Today 2:00 PM', title: 'Strategy Session – Solo Founder', type: 'consultation' },
                  { time: 'Tomorrow 10:00 AM', title: 'Brand Review – TechCorp', type: 'consultation' },
                  { time: 'Wed 3:00 PM', title: 'Content Planning – GrowthCo', type: 'retainer' },
                  { time: 'Fri 11:00 AM', title: 'SEO Walkthrough – StartupXYZ', type: 'consultation' },
                ].map((b, i) => (
                  <div key={i} className="rounded-2xl border p-2.5">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-accent shrink-0" />
                      <div className="flex-1 min-w-0"><div className="text-[9px] font-semibold truncate">{b.title}</div><div className="text-[8px] text-muted-foreground">{b.time}</div></div>
                      <span className={cn('px-1.5 py-0.5 rounded text-[7px] font-medium', typeColor(b.type))}>{b.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Active Retainers" icon={<RefreshCw className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {SERVICES.filter(s => s.type === 'retainer').map(s => (
                  <div key={s.id} className="rounded-2xl border p-2.5">
                    <div className="text-[10px] font-semibold mb-0.5">{s.title}</div>
                    <div className="text-[8px] text-muted-foreground mb-1">{priceLabel(s)} · {s.orders} months active</div>
                    <Progress value={65} className="h-1.5" />
                    <div className="text-[7px] text-muted-foreground mt-0.5">65% capacity used this month</div>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>
        </div>
      )}

      {/* ANALYTICS */}
      {tab === 'analytics' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Revenue" value={`$${totalRevenue.toLocaleString()}`} change="+22%" trend="up" />
            <KPICard label="Total Orders" value={totalOrders} change="+15%" trend="up" />
            <KPICard label="Avg Order Value" value={`$${Math.round(totalRevenue / totalOrders)}`} trend="up" />
            <KPICard label="Repeat Rate" value="38%" change="+4%" trend="up" />
          </KPIBand>
          <div className="grid md:grid-cols-2 gap-3">
            <SectionCard title="Revenue by Service" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {SERVICES.filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue).map(s => (
                  <div key={s.id} className="flex items-center gap-2 text-[9px]">
                    <span className="flex-1 truncate">{s.title}</span>
                    <div className="w-24"><Progress value={(s.revenue / Math.max(...SERVICES.map(x => x.revenue))) * 100} className="h-1.5" /></div>
                    <span className="font-bold w-16 text-right">${s.revenue.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Conversion by Type" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {['productized', 'custom', 'retainer', 'consultation'].map(t => {
                  const svcs = SERVICES.filter(s => s.type === t && s.conversion > 0);
                  const avg = svcs.length ? +(svcs.reduce((a, s) => a + s.conversion, 0) / svcs.length).toFixed(1) : 0;
                  return (
                    <div key={t} className="flex items-center gap-2 text-[9px]">
                      <span className={cn('px-1.5 py-0.5 rounded text-[7px] font-medium capitalize', typeColor(t))}>{t}</span>
                      <div className="flex-1"><Progress value={avg * 10} className="h-1.5" /></div>
                      <span className="font-bold">{avg}%</span>
                    </div>
                  );
                })}
              </div>
            </SectionCard>
          </div>
          <SectionCard title="Top Performers" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead><tr className="border-b">{['Service', 'Type', 'Revenue', 'Orders', 'Rating', 'Conv.'].map(h => <th key={h} className="text-left py-2 px-2 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {SERVICES.filter(s => s.revenue > 0).sort((a, b) => b.revenue - a.revenue).map(s => (
                    <tr key={s.id} className="border-b last:border-0 hover:bg-muted/20 cursor-pointer" onClick={() => { setSelected(s); setTab('detail'); }}>
                      <td className="py-2 px-2 font-medium">{s.title.slice(0, 30)}…</td>
                      <td className="py-2 px-2"><span className={cn('px-1.5 py-0.5 rounded text-[7px] font-medium', typeColor(s.type))}>{s.type}</span></td>
                      <td className="py-2 px-2 font-bold">${s.revenue.toLocaleString()}</td>
                      <td className="py-2 px-2">{s.orders}</td>
                      <td className="py-2 px-2">{s.rating} ★</td>
                      <td className="py-2 px-2">{s.conversion}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">Services</span><div className="text-[8px] text-muted-foreground">{published} published · ${totalRevenue.toLocaleString()}</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setBuilderDrawer(true)}><Plus className="h-3.5 w-3.5" />Create</Button>
      </div>

      {/* Detail Inspector */}
      <Sheet open={detailDrawer} onOpenChange={setDetailDrawer}>
        <SheetContent className="w-[500px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Service Inspection</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-3">
              <h3 className="text-[12px] font-bold">{selected.title}</h3>
              <div className="flex items-center gap-2"><StatusBadge status={selected.status === 'published' ? 'live' : 'caution'} label={selected.status} /><span className={cn('px-1.5 py-0.5 rounded text-[7px] font-medium', typeColor(selected.type))}>{selected.type}</span></div>
              <p className="text-[9px] text-muted-foreground">{selected.description}</p>
              <div className="grid grid-cols-3 gap-2">
                {[{ l: 'Price', v: priceLabel(selected) }, { l: 'Revenue', v: `$${selected.revenue.toLocaleString()}` }, { l: 'Orders', v: selected.orders }, { l: 'Rating', v: selected.rating ? `${selected.rating} ★` : '—' }, { l: 'Impressions', v: selected.impressions.toLocaleString() }, { l: 'Conversion', v: `${selected.conversion}%` }, { l: 'Delivery', v: `${selected.deliveryDays}d` }, { l: 'Revisions', v: selected.revisions }, { l: 'Seller', v: selected.seller }].map(d => (
                  <div key={d.l} className="rounded-2xl border p-2 text-center"><div className="text-[7px] text-muted-foreground">{d.l}</div><div className="text-[10px] font-bold">{d.v}</div></div>
                ))}
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { setDetailDrawer(false); setTab('builder'); }}><Edit className="h-3 w-3" />Edit</Button>
                <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { setDetailDrawer(false); setOrderConfirm(true); }}><ShoppingCart className="h-3 w-3" />Order</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Builder Drawer */}
      <Sheet open={builderDrawer} onOpenChange={setBuilderDrawer}>
        <SheetContent className="w-[480px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Edit className="h-4 w-4 text-accent" />Quick Service Builder</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Title</label><input className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="Service title" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Description</label><textarea className="w-full rounded-xl border bg-background p-3 text-[10px] h-16 resize-none" placeholder="Describe…" /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Price</label><input type="number" className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="299" /></div>
              <div><label className="text-[9px] font-medium mb-1 block">Delivery (days)</label><input type="number" className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="7" /></div>
            </div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setBuilderDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setBuilderDrawer(false); toast.success('Service created!'); }}><CheckCircle2 className="h-3 w-3" />Create</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Bundle Creator */}
      <Sheet open={bundleDrawer} onOpenChange={setBundleDrawer}>
        <SheetContent className="w-[480px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Gift className="h-4 w-4 text-accent" />Create Bundle</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Bundle Name</label><input className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="e.g. Launch Package" /></div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Select Services</label>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {SERVICES.filter(s => s.status === 'published').map(s => (
                  <label key={s.id} className="flex items-center gap-2 rounded-xl border p-2 cursor-pointer hover:bg-muted/20">
                    <input type="checkbox" className="rounded" />
                    <span className="text-[9px] flex-1 truncate">{s.title}</span>
                    <span className="text-[8px] font-bold">{priceLabel(s)}</span>
                  </label>
                ))}
              </div>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Discount (%)</label><input type="number" className="h-8 w-full rounded-xl border bg-background px-3 text-[10px]" placeholder="15" min={0} max={50} /></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setBundleDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setBundleDrawer(false); toast.success('Bundle created!'); }}><Gift className="h-3 w-3" />Create Bundle</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Compare Drawer */}
      <Sheet open={compareDrawer} onOpenChange={setCompareDrawer}>
        <SheetContent className="w-[620px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-accent" />Compare Services ({compareServices.length})</SheetTitle></SheetHeader>
          <div className="p-4">
            {compareServices.length === 0 ? (
              <div className="text-center py-8"><Scale className="h-6 w-6 text-muted-foreground mx-auto mb-2" /><div className="text-[11px] font-semibold">No services selected</div></div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead><tr className="border-b"><th className="text-left py-2 pr-2 text-muted-foreground font-medium">Metric</th>{compareServices.map(s => <th key={s.id} className="py-2 px-2 text-center font-medium min-w-[100px]">{s.title.slice(0, 20)}…</th>)}</tr></thead>
                  <tbody>
                    {[
                      { l: 'Type', f: (s: Service) => <span className={cn('px-1 py-0.5 rounded text-[7px]', typeColor(s.type))}>{s.type}</span> },
                      { l: 'Price', f: (s: Service) => <span className="font-bold">{priceLabel(s)}</span> },
                      { l: 'Rating', f: (s: Service) => s.rating ? `${s.rating} ★` : '—' },
                      { l: 'Orders', f: (s: Service) => s.orders },
                      { l: 'Revenue', f: (s: Service) => `$${s.revenue.toLocaleString()}` },
                      { l: 'Conversion', f: (s: Service) => `${s.conversion}%` },
                      { l: 'Delivery', f: (s: Service) => `${s.deliveryDays}d` },
                    ].map(row => (
                      <tr key={row.l} className="border-b last:border-0">
                        <td className="py-1.5 pr-2 text-muted-foreground">{row.l}</td>
                        {compareServices.map(s => <td key={s.id} className="py-1.5 px-2 text-center">{row.f(s)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Order Confirmation */}
      <Sheet open={orderConfirm} onOpenChange={setOrderConfirm}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-accent" />Confirm Order</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-3">
              <div className="rounded-2xl border p-3">
                <div className="text-[10px] font-semibold">{selected.title}</div>
                <div className="text-[8px] text-muted-foreground">{selected.seller} · {selected.deliveryDays}d delivery</div>
                <div className="text-lg font-bold mt-2">{priceLabel(selected)}</div>
              </div>
              <div className="rounded-2xl border border-[hsl(var(--state-healthy))]/20 bg-[hsl(var(--state-healthy))]/5 p-2.5">
                <div className="flex items-center gap-1.5 text-[9px] font-medium text-[hsl(var(--state-healthy))]"><Shield className="h-3 w-3" />Escrow Protection</div>
                <p className="text-[8px] text-muted-foreground mt-0.5">Payment held securely until you approve delivery.</p>
              </div>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setOrderConfirm(false)}>Cancel</Button>
                <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setOrderConfirm(false); toast.success('Order placed!'); }}><CheckCircle2 className="h-3 w-3" />Place Order</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ServicesMarketplacePage;
