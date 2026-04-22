import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Search, Filter, Star, Clock, DollarSign, Bookmark, BookmarkCheck,
  Layers, ShoppingCart, Package, ChevronRight, Plus, MoreHorizontal,
  BarChart3, TrendingUp, Eye, FileText, Link2, Settings, Edit,
  Sparkles, CheckCircle2, XCircle, ArrowRight, Upload, Download,
  RefreshCw, Users, Target, Zap, Award, Heart, Grid3X3,
  List, LayoutGrid, Copy, Trash2, GripVertical, Image,
} from 'lucide-react';
import { MOCK_GIGS } from '@/data/mock';
import type { MockGig } from '@/data/mock';
import { cn } from '@/lib/utils';

// ── Gig Card ──
const GigCard: React.FC<{ gig: MockGig }> = ({ gig }) => {
  const [saved, setSaved] = useState(false);
  const initials = gig.seller.name.split(' ').map(n => n[0]).join('');
  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all group">
      <div className="h-40 bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center">
        <Layers className="h-10 w-10 text-accent/30" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{initials}</AvatarFallback></Avatar>
          <span className="text-xs text-muted-foreground">{gig.seller.name}</span>
          {gig.seller.verified && <span className="text-accent text-xs">✓</span>}
        </div>
        <Link to={`/gigs/${gig.id}`} className="font-medium text-sm group-hover:text-accent transition-colors line-clamp-2 mb-2 block">{gig.title}</Link>
        <div className="flex items-center gap-2 mb-3">
          <div className="flex items-center gap-0.5"><Star className="h-3.5 w-3.5 fill-gigvora-amber text-gigvora-amber" /><span className="text-xs font-semibold">{gig.rating}</span></div>
          <span className="text-xs text-muted-foreground">({gig.reviews})</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">From ${gig.startingPrice}</span>
          <button onClick={() => setSaved(!saved)} className="text-muted-foreground hover:text-accent">
            {saved ? <BookmarkCheck className="h-4 w-4 text-accent" /> : <Bookmark className="h-4 w-4" />}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Package Builder ──
const PackageBuilder: React.FC = () => {
  const [packages, setPackages] = useState([
    { name: 'Basic', price: 50, delivery: '3 days', revisions: 1, features: ['Source file', '1 concept'] },
    { name: 'Standard', price: 100, delivery: '5 days', revisions: 3, features: ['Source file', '3 concepts', 'High resolution', 'Social media kit'] },
    { name: 'Premium', price: 200, delivery: '7 days', revisions: 5, features: ['Source file', '5 concepts', 'High resolution', 'Social media kit', 'Brand guidelines', 'Stationery design'] },
  ]);
  const [addOns, setAddOns] = useState([
    { name: 'Extra fast delivery', price: 25, checked: false },
    { name: 'Additional revision', price: 15, checked: false },
    { name: 'Source file (AI/PSD)', price: 30, checked: false },
    { name: 'Social media kit', price: 40, checked: false },
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Package Builder</h3>
        <Button size="sm" variant="outline" className="gap-1 text-xs"><Sparkles className="h-3 w-3" /> AI Suggest Pricing</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {packages.map((pkg, pi) => (
          <div key={pkg.name} className={cn('rounded-xl border p-5', pi === 1 && 'border-accent ring-1 ring-accent/20')}>
            {pi === 1 && <Badge className="mb-2 text-[10px] bg-accent text-accent-foreground">Most Popular</Badge>}
            <input className="text-lg font-bold w-full bg-transparent border-none focus:outline-none mb-1" defaultValue={pkg.name} />
            <div className="flex items-baseline gap-1 mb-3">
              <span className="text-muted-foreground text-sm">$</span>
              <input type="number" className="text-2xl font-bold w-20 bg-transparent border-none focus:outline-none" defaultValue={pkg.price} />
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-xs"><Clock className="h-3 w-3 text-muted-foreground" /> <input className="h-7 rounded border bg-background px-2 text-xs flex-1" defaultValue={pkg.delivery} /></div>
              <div className="flex items-center gap-2 text-xs"><RefreshCw className="h-3 w-3 text-muted-foreground" /> <input type="number" className="h-7 rounded border bg-background px-2 text-xs w-16" defaultValue={pkg.revisions} /> <span className="text-muted-foreground">revisions</span></div>
            </div>
            <div className="space-y-1.5">
              {pkg.features.map((f, fi) => (
                <div key={fi} className="flex items-center gap-2 text-xs">
                  <GripVertical className="h-3 w-3 text-muted-foreground/30 cursor-grab" />
                  <CheckCircle2 className="h-3 w-3 text-gigvora-green" />
                  <input className="flex-1 bg-transparent border-none focus:outline-none text-xs" defaultValue={f} />
                  <button className="text-muted-foreground/30 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                </div>
              ))}
              <button className="flex items-center gap-1 text-xs text-accent hover:underline mt-2"><Plus className="h-3 w-3" /> Add feature</button>
            </div>
          </div>
        ))}
      </div>

      {/* Add-ons */}
      <div className="rounded-xl border bg-card p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">Service Add-ons</h3>
          <Button size="sm" variant="outline" className="gap-1 text-xs"><Plus className="h-3 w-3" /> New Add-on</Button>
        </div>
        <div className="grid md:grid-cols-2 gap-2">
          {addOns.map(a => (
            <div key={a.name} className="flex items-center justify-between p-3 rounded-lg border">
              <div className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked={a.checked} />
                <span className="text-sm">{a.name}</span>
              </div>
              <span className="text-sm font-semibold">+${a.price}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> Save Packages</Button>
        <Button variant="outline">Preview</Button>
      </div>
    </div>
  );
};

// ── Gig Bundles ──
const GigBundles: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Gig Bundles</h3>
      <Button size="sm" className="gap-1"><Plus className="h-3.5 w-3.5" /> Create Bundle</Button>
    </div>
    <p className="text-sm text-muted-foreground">Combine multiple gigs into bundled offerings with discounted pricing.</p>
    <div className="space-y-3">
      {[
        { name: 'Complete Brand Identity', gigs: ['Logo Design', 'Brand Guidelines', 'Social Media Kit'], price: '$450', savings: '25%', orders: 18 },
        { name: 'Full Website Package', gigs: ['UI/UX Design', 'Frontend Development', 'SEO Optimization'], price: '$1,200', savings: '20%', orders: 12 },
        { name: 'Startup Launch Kit', gigs: ['Logo Design', 'Pitch Deck', 'Landing Page'], price: '$800', savings: '30%', orders: 24 },
      ].map(b => (
        <div key={b.name} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" />
              <h4 className="font-semibold text-sm">{b.name}</h4>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-gigvora-green/10 text-gigvora-green text-[10px]">{b.savings} off</Badge>
              <span className="text-lg font-bold">{b.price}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-2">
            {b.gigs.map(g => <Badge key={g} variant="secondary" className="text-[10px]">{g}</Badge>)}
          </div>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{b.orders} orders</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="h-6 text-xs"><Edit className="h-3 w-3 mr-1" /> Edit</Button>
              <Button variant="ghost" size="sm" className="h-6 text-xs"><Eye className="h-3 w-3 mr-1" /> Preview</Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Project-Linked Gigs ──
const ProjectLinkedGigs: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Project-Linked Gigs</h3>
      <Button size="sm" variant="outline" className="gap-1"><Link2 className="h-3.5 w-3.5" /> Link to Project</Button>
    </div>
    <p className="text-sm text-muted-foreground">Gigs linked to active projects — decompose project work into deliverable-based gig orders.</p>
    <div className="space-y-3">
      {[
        { project: 'SaaS Platform Development', gigs: [
          { title: 'UI Design — Dashboard Module', status: 'delivered', price: '$300', milestone: 'Core Features' },
          { title: 'API Integration Layer', status: 'in-progress', price: '$500', milestone: 'Core Features' },
          { title: 'Performance Audit', status: 'pending', price: '$200', milestone: 'Testing & Polish' },
        ]},
        { project: 'Mobile App Redesign', gigs: [
          { title: 'User Flow Mapping', status: 'delivered', price: '$150', milestone: 'Discovery' },
          { title: 'High-Fi Prototype', status: 'in-progress', price: '$400', milestone: 'Design' },
        ]},
      ].map(p => (
        <div key={p.project} className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Link2 className="h-4 w-4 text-accent" />
            <h4 className="font-semibold text-sm">{p.project}</h4>
          </div>
          <div className="space-y-2">
            {p.gigs.map(g => (
              <div key={g.title} className="flex items-center justify-between p-3 rounded-lg border">
                <div>
                  <div className="text-sm font-medium">{g.title}</div>
                  <div className="text-[10px] text-muted-foreground">Milestone: {g.milestone}</div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold">{g.price}</span>
                  <Badge variant="secondary" className={cn('text-[10px]',
                    g.status === 'delivered' && 'bg-gigvora-green/10 text-gigvora-green',
                    g.status === 'in-progress' && 'bg-accent/10 text-accent',
                  )}>{g.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Order Center ──
const OrderCenter: React.FC = () => {
  const orders = [
    { id: 'ORD-001', gig: 'Professional Logo Design', buyer: 'Alex Kim', package: 'Standard', price: '$100', status: 'in-progress', delivery: 'Apr 7', progress: 60 },
    { id: 'ORD-002', gig: 'SEO Audit Report', buyer: 'Dana Lee', package: 'Premium', price: '$350', status: 'delivered', delivery: 'Apr 5', progress: 100 },
    { id: 'ORD-003', gig: 'Social Media Kit', buyer: 'James T.', package: 'Basic', price: '$75', status: 'revision', delivery: 'Apr 10', progress: 80 },
    { id: 'ORD-004', gig: 'Brand Guidelines', buyer: 'Mika S.', package: 'Standard', price: '$200', status: 'pending', delivery: 'Apr 15', progress: 10 },
    { id: 'ORD-005', gig: 'Pitch Deck Design', buyer: 'Raul F.', package: 'Premium', price: '$500', status: 'completed', delivery: 'Apr 2', progress: 100 },
  ];
  const statusColors: Record<string, string> = {
    'in-progress': 'bg-accent/10 text-accent',
    delivered: 'bg-gigvora-green/10 text-gigvora-green',
    revision: 'bg-gigvora-amber/10 text-gigvora-amber',
    pending: 'bg-muted text-muted-foreground',
    completed: 'bg-gigvora-green/10 text-gigvora-green',
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Active Orders', value: '8', color: 'text-accent' },
          { label: 'In Revision', value: '2', color: 'text-gigvora-amber' },
          { label: 'Delivered', value: '3', color: 'text-gigvora-green' },
          { label: 'Revenue (MTD)', value: '$4,250', color: '' },
          { label: 'Avg Delivery', value: '4.2 days', color: '' },
        ].map(s => (
          <div key={s.label} className="rounded-xl border bg-card p-3 text-center">
            <div className={cn('text-lg font-bold', s.color)}>{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr>
            <th className="text-left px-4 py-2 text-xs font-medium">Order</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Gig</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Buyer</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Package</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Price</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Progress</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Status</th>
            <th className="text-left px-4 py-2 text-xs font-medium">Delivery</th>
          </tr></thead>
          <tbody>
            {orders.map(o => (
              <tr key={o.id} className="border-t hover:bg-muted/30 cursor-pointer">
                <td className="px-4 py-3 text-xs font-mono text-muted-foreground">{o.id}</td>
                <td className="px-4 py-3 text-xs font-medium">{o.gig}</td>
                <td className="px-4 py-3 text-xs">{o.buyer}</td>
                <td className="px-4 py-3 text-xs">{o.package}</td>
                <td className="px-4 py-3 text-xs font-semibold">{o.price}</td>
                <td className="px-4 py-3"><Progress value={o.progress} className="h-1.5 w-20" /></td>
                <td className="px-4 py-3"><Badge className={cn('text-[10px]', statusColors[o.status])}>{o.status}</Badge></td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{o.delivery}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ── Revision Center ──
const RevisionCenter: React.FC = () => (
  <div className="space-y-4">
    <div className="flex items-center justify-between">
      <h3 className="font-semibold">Revision Center</h3>
      <Badge variant="secondary">3 pending revisions</Badge>
    </div>
    <div className="space-y-3">
      {[
        { order: 'ORD-003', gig: 'Social Media Kit', buyer: 'James T.', revision: 2, total: 3, note: 'The Instagram post templates need warmer colors. Also please adjust the typography on the story templates.', files: ['stories_v2.psd', 'posts_v2.psd'], date: 'Apr 8' },
        { order: 'ORD-001', gig: 'Logo Design', buyer: 'Alex Kim', revision: 1, total: 3, note: 'Love concept 2! Can we try it in navy blue and forest green instead?', files: ['concept2_variations.ai'], date: 'Apr 6' },
        { order: 'ORD-006', gig: 'Website Mockup', buyer: 'Sara N.', revision: 3, total: 3, note: 'Final round — just the footer spacing needs adjustment and we\'re good.', files: ['homepage_v3.fig'], date: 'Apr 9' },
      ].map(r => (
        <div key={r.order} className="rounded-xl border bg-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="font-medium text-sm">{r.gig}</div>
              <div className="text-xs text-muted-foreground">{r.order} · Buyer: {r.buyer} · {r.date}</div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className={cn('text-[10px]', r.revision === r.total && 'bg-destructive/10 text-destructive')}>
                Rev {r.revision}/{r.total}
              </Badge>
            </div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 mb-3">
            <p className="text-sm">"{r.note}"</p>
          </div>
          <div className="flex items-center gap-2 mb-3">
            {r.files.map(f => (
              <Badge key={f} variant="outline" className="text-[10px] gap-1"><FileText className="h-2.5 w-2.5" /> {f}</Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="gap-1 text-xs"><Upload className="h-3 w-3" /> Upload Revision</Button>
            <Button size="sm" variant="outline" className="gap-1 text-xs"><Eye className="h-3 w-3" /> View Order</Button>
            {r.revision === r.total && <Button size="sm" variant="outline" className="gap-1 text-xs text-gigvora-amber"><RefreshCw className="h-3 w-3" /> Extra Revision ($15)</Button>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ── Seller Performance Analytics ──
const SellerAnalytics: React.FC = () => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {[
        { label: 'Impressions', value: '24,800', change: '+12%' },
        { label: 'Click Rate', value: '6.8%', change: '+0.4%' },
        { label: 'Orders', value: '234', change: '+18' },
        { label: 'Revenue', value: '$18,400', change: '+$2.3K' },
        { label: 'Avg Rating', value: '4.9', change: '+0.1' },
        { label: 'Response Time', value: '1.2h', change: '-0.3h' },
        { label: 'Completion Rate', value: '98%', change: 'Stable' },
        { label: 'Repeat Buyers', value: '42%', change: '+5%' },
      ].map(s => (
        <div key={s.label} className="rounded-xl border bg-card p-3">
          <div className="text-xs text-muted-foreground mb-1">{s.label}</div>
          <div className="text-lg font-bold">{s.value}</div>
          <div className="text-[10px] text-gigvora-green">{s.change}</div>
        </div>
      ))}
    </div>

    <div className="grid md:grid-cols-2 gap-4">
      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4 text-accent" /> Revenue by Gig</h3>
        <div className="space-y-3">
          {[
            { gig: 'Professional Logo Design', revenue: '$8,200', orders: 82, pct: 45 },
            { gig: 'Brand Guidelines Package', revenue: '$4,600', orders: 23, pct: 25 },
            { gig: 'Social Media Kit', revenue: '$3,400', orders: 68, pct: 18 },
            { gig: 'Business Card Design', revenue: '$2,200', orders: 61, pct: 12 },
          ].map(g => (
            <div key={g.gig}>
              <div className="flex justify-between text-xs mb-1">
                <span>{g.gig}</span>
                <span className="font-semibold">{g.revenue} ({g.orders})</span>
              </div>
              <Progress value={g.pct} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Conversion Funnel</h3>
        <div className="space-y-3">
          {[
            { stage: 'Impressions', value: '24,800', pct: 100 },
            { stage: 'Profile Views', value: '4,200', pct: 17 },
            { stage: 'Gig Page Views', value: '1,680', pct: 7 },
            { stage: 'Inquiries', value: '420', pct: 2 },
            { stage: 'Orders', value: '234', pct: 1 },
          ].map(s => (
            <div key={s.stage} className="flex items-center gap-3">
              <span className="text-xs w-28">{s.stage}</span>
              <Progress value={s.pct} className="h-2 flex-1" />
              <span className="text-xs font-semibold w-16 text-right">{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-sm mb-3">Top Performing Tags</h3>
        <div className="flex flex-wrap gap-2">
          {[
            { tag: 'logo-design', score: 92 },
            { tag: 'branding', score: 87 },
            { tag: 'minimalist', score: 81 },
            { tag: 'modern', score: 76 },
            { tag: 'corporate', score: 68 },
            { tag: 'creative', score: 62 },
          ].map(t => (
            <Badge key={t.tag} variant="secondary" className="text-xs gap-1">
              {t.tag} <span className="text-accent font-semibold">{t.score}</span>
            </Badge>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-card p-5">
        <h3 className="font-semibold text-sm mb-3">Buyer Demographics</h3>
        <div className="space-y-2">
          {[
            { label: 'Startups', pct: 38 },
            { label: 'Small Business', pct: 28 },
            { label: 'Enterprise', pct: 18 },
            { label: 'Individual', pct: 16 },
          ].map(d => (
            <div key={d.label}>
              <div className="flex justify-between text-xs mb-1"><span>{d.label}</span><span className="font-semibold">{d.pct}%</span></div>
              <Progress value={d.pct} className="h-1.5" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ── Gig Detail Page ──
const GigDetailPage: React.FC = () => {
  const gig = MOCK_GIGS[0];
  const [selectedPkg, setSelectedPkg] = useState(1);
  const initials = gig.seller.name.split(' ').map(n => n[0]).join('');

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{gig.category}</Badge>
              {gig.tags.map(t => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
            </div>
            <h1 className="text-2xl font-bold mb-4">{gig.title}</h1>
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-10 w-10"><AvatarFallback className="bg-accent/10 text-accent">{initials}</AvatarFallback></Avatar>
              <div>
                <div className="font-medium text-sm">{gig.seller.name} {gig.seller.verified && <span className="text-accent">✓</span>}</div>
                <div className="text-xs text-muted-foreground">{gig.seller.headline}</div>
              </div>
              <div className="flex items-center gap-1 ml-auto">
                <Star className="h-4 w-4 fill-gigvora-amber text-gigvora-amber" />
                <span className="font-semibold text-sm">{gig.rating}</span>
                <span className="text-xs text-muted-foreground">({gig.reviews} reviews)</span>
              </div>
            </div>
            <div className="h-64 rounded-lg bg-muted flex items-center justify-center text-muted-foreground mb-4">Gig gallery / images</div>
            <h2 className="font-semibold mb-2">About This Gig</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{gig.description}</p>
          </div>

          {/* Linked Projects */}
          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-3 flex items-center gap-2"><Link2 className="h-4 w-4 text-accent" /> Can Be Linked to Projects</h2>
            <p className="text-sm text-muted-foreground mb-3">This gig can be ordered as part of a project workspace deliverable.</p>
            <Button variant="outline" size="sm" className="gap-1"><Link2 className="h-3.5 w-3.5" /> Link to Your Project</Button>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h2 className="font-semibold mb-4">Reviews</h2>
            <div className="space-y-3">
              {[
                { name: 'Jordan K.', rating: 5, text: 'Incredible work! Sarah delivered beyond expectations. The logo is clean, modern, and exactly what we needed.', date: 'Mar 28' },
                { name: 'Priya M.', rating: 5, text: 'Fast turnaround and very professional. Revisions were handled smoothly.', date: 'Mar 20' },
                { name: 'Carlos D.', rating: 4, text: 'Great design work. Took one extra round of revisions to nail the colors but end result is fantastic.', date: 'Mar 12' },
              ].map(r => (
                <div key={r.name} className="p-3 rounded-lg border">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{r.name[0]}</AvatarFallback></Avatar>
                    <span className="text-sm font-medium">{r.name}</span>
                    <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-gigvora-amber text-gigvora-amber" />)}</div>
                    <span className="text-[10px] text-muted-foreground ml-auto">{r.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{r.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Packages sidebar */}
        <div className="space-y-4">
          <div className="rounded-xl border bg-card overflow-hidden sticky top-24">
            <div className="flex border-b">
              {gig.packages.map((pkg, i) => (
                <button key={pkg.name} onClick={() => setSelectedPkg(i)} className={cn('flex-1 py-3 text-sm font-medium text-center transition-colors', selectedPkg === i ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50')}>
                  {pkg.name}
                </button>
              ))}
            </div>
            <div className="p-5">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-3xl font-bold">${gig.packages[selectedPkg].price}</span>
                <span className="text-sm text-muted-foreground"><Clock className="h-3.5 w-3.5 inline mr-1" />{gig.packages[selectedPkg].delivery}</span>
              </div>
              <ul className="space-y-2 mb-6">
                {gig.packages[selectedPkg].features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm"><ChevronRight className="h-3.5 w-3.5 text-accent shrink-0" /> {f}</li>
                ))}
              </ul>
              <Button className="w-full gap-1.5"><ShoppingCart className="h-4 w-4" /> Continue (${gig.packages[selectedPkg].price})</Button>
              <Button variant="outline" className="w-full mt-2">Contact Seller</Button>
            </div>
          </div>

          {/* Bundle Upsell */}
          <div className="rounded-xl border bg-accent/5 border-accent/20 p-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-accent" />
              <h4 className="text-sm font-semibold">Save with a Bundle</h4>
            </div>
            <p className="text-xs text-muted-foreground mb-2">Get Logo + Brand Guidelines + Social Kit for $450 (25% off)</p>
            <Button size="sm" variant="outline" className="w-full text-xs">View Bundle</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Gigs Browse Page ──
const GigsBrowsePage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState('browse');
  const [view, setView] = useState<'grid' | 'list'>('grid');

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gigs</h1>
        <div className="flex gap-2">
          <Button variant="outline" asChild><Link to="/gigs/manage">Manage My Gigs</Link></Button>
          <Button asChild><Link to="/gigs/create">Create a Gig</Link></Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4 flex-wrap h-auto gap-1">
          <TabsTrigger value="browse" className="text-xs gap-1"><Search className="h-3 w-3" /> Browse</TabsTrigger>
          <TabsTrigger value="orders" className="text-xs gap-1"><ShoppingCart className="h-3 w-3" /> Orders</TabsTrigger>
          <TabsTrigger value="revisions" className="text-xs gap-1"><RefreshCw className="h-3 w-3" /> Revisions</TabsTrigger>
          <TabsTrigger value="packages" className="text-xs gap-1"><Package className="h-3 w-3" /> Package Builder</TabsTrigger>
          <TabsTrigger value="bundles" className="text-xs gap-1"><Layers className="h-3 w-3" /> Bundles</TabsTrigger>
          <TabsTrigger value="linked" className="text-xs gap-1"><Link2 className="h-3 w-3" /> Project-Linked</TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs gap-1"><BarChart3 className="h-3 w-3" /> Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="flex gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search gigs..." className="w-full h-10 rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
            <Button variant="outline" className="gap-1.5"><Filter className="h-4 w-4" /> Filters</Button>
            <div className="flex border rounded-lg overflow-hidden">
              <button onClick={() => setView('grid')} className={cn('px-2.5 py-2', view === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}><LayoutGrid className="h-4 w-4" /></button>
              <button onClick={() => setView('list')} className={cn('px-2.5 py-2', view === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}><List className="h-4 w-4" /></button>
            </div>
          </div>
          <div className={cn(view === 'grid' ? 'grid md:grid-cols-3 lg:grid-cols-4 gap-4' : 'space-y-3')}>
            {MOCK_GIGS.map(gig => view === 'grid' ? (
              <GigCard key={gig.id} gig={gig} />
            ) : (
              <div key={gig.id} className="rounded-xl border bg-card p-4 flex items-center gap-4 hover:shadow-md transition-all">
                <div className="h-20 w-28 rounded-lg bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center shrink-0"><Layers className="h-6 w-6 text-accent/30" /></div>
                <div className="flex-1 min-w-0">
                  <Link to={`/gigs/${gig.id}`} className="font-medium text-sm hover:text-accent">{gig.title}</Link>
                  <div className="text-xs text-muted-foreground">{gig.seller.name} · {gig.category}</div>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="h-3 w-3 fill-gigvora-amber text-gigvora-amber" />
                    <span className="text-xs font-semibold">{gig.rating}</span>
                    <span className="text-xs text-muted-foreground">({gig.reviews})</span>
                  </div>
                </div>
                <span className="text-lg font-bold">From ${gig.startingPrice}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="orders"><OrderCenter /></TabsContent>
        <TabsContent value="revisions"><RevisionCenter /></TabsContent>
        <TabsContent value="packages"><PackageBuilder /></TabsContent>
        <TabsContent value="bundles"><GigBundles /></TabsContent>
        <TabsContent value="linked"><ProjectLinkedGigs /></TabsContent>
        <TabsContent value="analytics"><SellerAnalytics /></TabsContent>
      </Tabs>
    </div>
  );
};

export { GigsBrowsePage, GigDetailPage };
export default GigsBrowsePage;
