import React, { useState, useMemo } from 'react';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, FilterDefinition, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Search, Star, Clock, DollarSign, Bookmark, BookmarkCheck,
  Layers, ShoppingCart, Package, ChevronRight, Filter,
  BarChart3, TrendingUp, Eye, CheckCircle2, Heart,
  LayoutGrid, List, Zap, Award, Users, MapPin,
  Sparkles, ArrowRight, Shield, Tag, RefreshCw, Globe,
  MessageSquare, ExternalLink, ThumbsUp, Repeat,
  Plus, X, Columns, Megaphone, History, Crown,
  ArrowUpRight, Flame, AlertTriangle, Send, SlidersHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
type GigStatus = 'active' | 'featured' | 'new' | 'paused' | 'premium';

interface GigSeller {
  name: string; avatar: string; verified: boolean;
  level: string; completedOrders: number; responseTime: string;
}

interface GigPackage {
  tier: string; price: number; delivery: string; revisions: number;
  features: string[]; popular?: boolean;
}

interface Gig {
  id: string; title: string; category: string; subcategory: string;
  seller: GigSeller; rating: number; reviews: number;
  startingPrice: number; status: GigStatus;
  tags: string[]; description: string;
  packages: GigPackage[];
  orders: number; impressions: number;
  recommended?: boolean; promoted?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Layers },
  { id: 'design', label: 'Design', icon: Sparkles },
  { id: 'development', label: 'Development', icon: Zap },
  { id: 'marketing', label: 'Marketing', icon: TrendingUp },
  { id: 'writing', label: 'Writing', icon: MessageSquare },
  { id: 'video', label: 'Video & Animation', icon: Eye },
  { id: 'business', label: 'Business', icon: BarChart3 },
  { id: 'ai', label: 'AI Services', icon: Sparkles },
];

const GIGS: Gig[] = [
  {
    id: 'g1', title: 'Professional Logo & Brand Identity Design',
    category: 'design', subcategory: 'Logo Design',
    seller: { name: 'Priya Sharma', avatar: 'PS', verified: true, level: 'Top Rated', completedOrders: 342, responseTime: '< 1 hour' },
    rating: 4.9, reviews: 287, startingPrice: 75, status: 'featured',
    tags: ['Logo', 'Branding', 'Identity', 'Minimalist'],
    description: 'I will design a unique, modern logo and complete brand identity package including color palette, typography, and brand guidelines.',
    packages: [
      { tier: 'Basic', price: 75, delivery: '3 days', revisions: 2, features: ['1 logo concept', 'PNG + JPG', 'Source file'] },
      { tier: 'Standard', price: 150, delivery: '5 days', revisions: 4, features: ['3 logo concepts', 'All formats', 'Source file', 'Social media kit', 'Favicon'], popular: true },
      { tier: 'Premium', price: 350, delivery: '7 days', revisions: 8, features: ['5 logo concepts', 'All formats', 'Source file', 'Brand guidelines', 'Social media kit', 'Stationery design', 'Brand book'] },
    ],
    orders: 342, impressions: 12400, recommended: true, promoted: true,
  },
  {
    id: 'g2', title: 'Full-Stack Web Application Development',
    category: 'development', subcategory: 'Web Development',
    seller: { name: 'Alex Morgan', avatar: 'AM', verified: true, level: 'Top Rated Plus', completedOrders: 189, responseTime: '< 2 hours' },
    rating: 5.0, reviews: 156, startingPrice: 500, status: 'premium',
    tags: ['React', 'Node.js', 'TypeScript', 'Full-Stack'],
    description: 'I will build a production-ready full-stack web application using React, Node.js, and TypeScript with clean architecture and scalable design.',
    packages: [
      { tier: 'Starter', price: 500, delivery: '7 days', revisions: 2, features: ['Landing page', 'Responsive design', 'Basic functionality', 'Deployment'] },
      { tier: 'Professional', price: 1500, delivery: '14 days', revisions: 4, features: ['Multi-page app', 'Auth system', 'Database', 'API integration', 'Admin panel', 'Testing'], popular: true },
      { tier: 'Enterprise', price: 5000, delivery: '30 days', revisions: 8, features: ['Full SaaS platform', 'Multi-tenant', 'Payment integration', 'CI/CD', 'Documentation', 'Support'] },
    ],
    orders: 189, impressions: 8900, recommended: true,
  },
  {
    id: 'g3', title: 'SEO Strategy & Content Marketing Plan',
    category: 'marketing', subcategory: 'SEO',
    seller: { name: 'Marcus Chen', avatar: 'MC', verified: true, level: 'Level 2', completedOrders: 94, responseTime: '< 3 hours' },
    rating: 4.8, reviews: 78, startingPrice: 200, status: 'active',
    tags: ['SEO', 'Content Strategy', 'Keywords', 'Analytics'],
    description: 'Comprehensive SEO audit and content marketing strategy with keyword research, competitor analysis, and actionable roadmap.',
    packages: [
      { tier: 'Audit', price: 200, delivery: '5 days', revisions: 1, features: ['SEO audit report', 'Keyword research (50)', 'Competitor analysis'] },
      { tier: 'Strategy', price: 500, delivery: '10 days', revisions: 3, features: ['Full SEO audit', 'Keyword research (200)', 'Content calendar', 'Link building plan', 'Technical SEO fixes'], popular: true },
      { tier: 'Full Service', price: 1200, delivery: '21 days', revisions: 5, features: ['Everything in Strategy', '10 blog articles', 'Meta optimization', 'Schema markup', 'Monthly reporting'] },
    ],
    orders: 94, impressions: 5200,
  },
  {
    id: 'g4', title: 'Professional Copywriting & Content Creation',
    category: 'writing', subcategory: 'Copywriting',
    seller: { name: 'Elena Rossi', avatar: 'ER', verified: false, level: 'Level 1', completedOrders: 47, responseTime: '< 4 hours' },
    rating: 4.7, reviews: 41, startingPrice: 50, status: 'new',
    tags: ['Copywriting', 'Blog', 'Website Copy', 'Email'],
    description: 'Engaging, SEO-optimized copy for websites, blogs, emails, and marketing materials that convert readers into customers.',
    packages: [
      { tier: 'Basic', price: 50, delivery: '2 days', revisions: 1, features: ['500 words', 'SEO optimized', '1 topic'] },
      { tier: 'Standard', price: 120, delivery: '4 days', revisions: 3, features: ['1500 words', 'SEO optimized', 'Research included', 'Meta descriptions'], popular: true },
      { tier: 'Premium', price: 300, delivery: '7 days', revisions: 5, features: ['5000 words', 'SEO optimized', 'Deep research', 'Images sourced', 'CTA optimization', 'Content strategy'] },
    ],
    orders: 47, impressions: 3100,
  },
  {
    id: 'g5', title: 'Explainer Video & Motion Graphics',
    category: 'video', subcategory: 'Explainer Videos',
    seller: { name: 'Jordan Blake', avatar: 'JB', verified: true, level: 'Top Rated', completedOrders: 215, responseTime: '< 2 hours' },
    rating: 4.9, reviews: 198, startingPrice: 300, status: 'featured',
    tags: ['Animation', 'Explainer', 'Motion Graphics', '2D'],
    description: 'High-quality 2D animated explainer videos with custom illustrations, professional voiceover, and background music.',
    packages: [
      { tier: 'Basic', price: 300, delivery: '5 days', revisions: 2, features: ['30 sec video', 'Custom illustration', 'Background music', 'HD delivery'] },
      { tier: 'Standard', price: 600, delivery: '7 days', revisions: 4, features: ['60 sec video', 'Custom illustration', 'Voiceover', 'Music', 'Sound effects', 'Subtitles'], popular: true },
      { tier: 'Premium', price: 1200, delivery: '14 days', revisions: 6, features: ['120 sec video', 'Premium illustration', 'Voiceover', 'Full sound design', '4K delivery', 'Source files', 'Social cuts'] },
    ],
    orders: 215, impressions: 9800, recommended: true, promoted: true,
  },
  {
    id: 'g6', title: 'AI Chatbot & Automation Solutions',
    category: 'ai', subcategory: 'AI Development',
    seller: { name: 'Liam Foster', avatar: 'LF', verified: true, level: 'Level 2', completedOrders: 63, responseTime: '< 1 hour' },
    rating: 4.8, reviews: 52, startingPrice: 400, status: 'active',
    tags: ['AI', 'Chatbot', 'Automation', 'GPT', 'LLM'],
    description: 'Custom AI chatbot and workflow automation solutions using GPT, LangChain, and modern AI frameworks for your business.',
    packages: [
      { tier: 'Basic', price: 400, delivery: '5 days', revisions: 2, features: ['Simple chatbot', 'Website integration', 'Basic FAQ training'] },
      { tier: 'Pro', price: 1000, delivery: '10 days', revisions: 4, features: ['Advanced chatbot', 'Multi-channel', 'Custom training', 'Analytics dashboard', 'API access'], popular: true },
      { tier: 'Enterprise', price: 3000, delivery: '21 days', revisions: 8, features: ['Full AI solution', 'Workflow automation', 'Custom models', 'Integration suite', 'Monitoring', 'Support'] },
    ],
    orders: 63, impressions: 4600, recommended: true,
  },
  {
    id: 'g7', title: 'Business Plan & Financial Modeling',
    category: 'business', subcategory: 'Business Plans',
    seller: { name: 'Natasha Volkov', avatar: 'NV', verified: false, level: 'Level 1', completedOrders: 28, responseTime: '< 6 hours' },
    rating: 4.6, reviews: 24, startingPrice: 150, status: 'active',
    tags: ['Business Plan', 'Financial Model', 'Startup', 'Pitch Deck'],
    description: 'Professional business plans, financial models, and pitch decks for startups seeking funding or strategic planning.',
    packages: [
      { tier: 'Basic', price: 150, delivery: '5 days', revisions: 2, features: ['Business plan (10 pages)', 'Executive summary', 'Market analysis'] },
      { tier: 'Standard', price: 400, delivery: '10 days', revisions: 4, features: ['Full business plan', 'Financial projections (3yr)', 'Competitive analysis', 'Go-to-market strategy'], popular: true },
      { tier: 'Premium', price: 1000, delivery: '14 days', revisions: 6, features: ['Business plan + pitch deck', '5-year financial model', 'Investor-ready format', 'Market sizing (TAM/SAM)', 'Advisory call'] },
    ],
    orders: 28, impressions: 2100,
  },
  {
    id: 'g8', title: 'UI/UX Design for Mobile Applications',
    category: 'design', subcategory: 'App Design',
    seller: { name: 'Sarah Chen', avatar: 'SC', verified: true, level: 'Top Rated', completedOrders: 176, responseTime: '< 1 hour' },
    rating: 4.9, reviews: 163, startingPrice: 200, status: 'active',
    tags: ['UI/UX', 'Mobile', 'Figma', 'iOS', 'Android'],
    description: 'Beautiful, user-centered mobile app designs in Figma with interactive prototypes, design system, and developer handoff.',
    packages: [
      { tier: 'Basic', price: 200, delivery: '5 days', revisions: 2, features: ['3 screens', 'Figma file', 'Mobile-first'] },
      { tier: 'Standard', price: 600, delivery: '10 days', revisions: 4, features: ['8 screens', 'Design system', 'Interactive prototype', 'Developer specs'], popular: true },
      { tier: 'Premium', price: 1500, delivery: '21 days', revisions: 8, features: ['Full app design', 'Design system', 'Prototype', 'Animations spec', 'Dev handoff', 'Usability audit'] },
    ],
    orders: 176, impressions: 7300, recommended: true,
  },
];

const STATUS_CFG: Record<GigStatus, { badge: 'healthy' | 'live' | 'caution' | 'premium' | 'review'; label: string }> = {
  active: { badge: 'healthy', label: 'Active' },
  featured: { badge: 'live', label: 'Featured' },
  new: { badge: 'review', label: 'New' },
  paused: { badge: 'caution', label: 'Paused' },
  premium: { badge: 'premium', label: 'Premium' },
};

// ── Compare Drawer ──
const CompareDrawer: React.FC<{ gigs: Gig[]; open: boolean; onClose: () => void; onRemove: (id: string) => void }> = ({ gigs, open, onClose, onRemove }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[600px] sm:w-[700px] overflow-y-auto p-0">
      <SheetHeader className="p-4 border-b">
        <SheetTitle className="text-sm flex items-center gap-2"><Columns className="h-4 w-4 text-accent" />Compare Gigs ({gigs.length})</SheetTitle>
      </SheetHeader>
      {gigs.length === 0 ? (
        <div className="p-8 text-center"><Columns className="h-8 w-8 text-muted-foreground mx-auto mb-2" /><div className="text-[10px] font-medium">No gigs to compare</div><div className="text-[8px] text-muted-foreground">Save gigs to add them to comparison</div></div>
      ) : (
        <div className="p-4">
          {/* Header row */}
          <div className="grid gap-2" style={{ gridTemplateColumns: `120px repeat(${gigs.length}, 1fr)` }}>
            <div />
            {gigs.map(g => (
              <div key={g.id} className="rounded-2xl border p-3 relative">
                <button className="absolute top-1 right-1 h-4 w-4 rounded-full bg-muted flex items-center justify-center" onClick={() => onRemove(g.id)}><X className="h-2.5 w-2.5" /></button>
                <div className="text-[9px] font-semibold line-clamp-2 mb-1">{g.title}</div>
                <div className="flex items-center gap-1 text-[7px] text-muted-foreground">
                  <Avatar className="h-4 w-4"><AvatarFallback className="text-[4px]">{g.seller.avatar}</AvatarFallback></Avatar>
                  {g.seller.name}
                </div>
              </div>
            ))}
          </div>

          {/* Comparison rows */}
          {[
            { label: 'Rating', render: (g: Gig) => <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-accent text-accent" />{g.rating}</span> },
            { label: 'Reviews', render: (g: Gig) => g.reviews },
            { label: 'Starting Price', render: (g: Gig) => <span className="font-bold">${g.startingPrice}</span> },
            { label: 'Delivery', render: (g: Gig) => g.packages[0]?.delivery },
            { label: 'Seller Level', render: (g: Gig) => g.seller.level },
            { label: 'Orders', render: (g: Gig) => g.orders },
            { label: 'Response Time', render: (g: Gig) => g.seller.responseTime },
            { label: 'Verified', render: (g: Gig) => g.seller.verified ? <CheckCircle2 className="h-3 w-3 text-accent" /> : <X className="h-3 w-3 text-muted-foreground" /> },
            { label: 'Packages', render: (g: Gig) => g.packages.length },
          ].map(row => (
            <div key={row.label} className="grid gap-2 border-t py-2 items-center text-[9px]" style={{ gridTemplateColumns: `120px repeat(${gigs.length}, 1fr)` }}>
              <div className="text-muted-foreground font-medium">{row.label}</div>
              {gigs.map(g => <div key={g.id}>{row.render(g)}</div>)}
            </div>
          ))}

          {/* Package compare */}
          <div className="mt-3 pt-3 border-t">
            <div className="text-[10px] font-semibold mb-2">Package Breakdown</div>
            {['Basic', 'Standard', 'Premium'].map((tier, ti) => (
              <div key={tier} className="grid gap-2 border-t py-1.5 items-start text-[8px]" style={{ gridTemplateColumns: `120px repeat(${gigs.length}, 1fr)` }}>
                <div className="text-muted-foreground font-medium">{tier} / Tier {ti + 1}</div>
                {gigs.map(g => {
                  const pkg = g.packages[ti];
                  return pkg ? (
                    <div key={g.id}>
                      <div className="font-semibold">${pkg.price} · {pkg.delivery}</div>
                      <div className="text-[6px] text-muted-foreground">{pkg.revisions} revisions · {pkg.features.length} features</div>
                    </div>
                  ) : <div key={g.id} className="text-muted-foreground">—</div>;
                })}
              </div>
            ))}
          </div>

          <div className="flex gap-2 mt-4 pt-3 border-t">
            {gigs.map(g => (
              <Button key={g.id} size="sm" className="flex-1 h-7 text-[9px] gap-1" onClick={() => toast.success(`Order placed for ${g.title}`)}><ShoppingCart className="h-3 w-3" />Order {g.seller.name.split(' ')[0]}</Button>
            ))}
          </div>
        </div>
      )}
    </SheetContent>
  </Sheet>
);

// ── Custom Offer Modal ──
const CustomOfferModal: React.FC<{ open: boolean; onClose: () => void; seller?: string }> = ({ open, onClose, seller }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[8vh] px-4" onClick={e => e.stopPropagation()}>
        <div className="w-full max-w-md bg-card rounded-2xl border shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h2 className="font-semibold text-sm flex items-center gap-2"><Send className="h-4 w-4 text-accent" />Request Custom Offer</h2>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3.5 w-3.5" /></Button>
          </div>
          <div className="p-5 space-y-3">
            {seller && <div className="text-[9px] text-muted-foreground">To: <span className="font-medium text-foreground">{seller}</span></div>}
            <div>
              <label className="text-[10px] font-semibold mb-1 block">What do you need?</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none" placeholder="Describe your requirements in detail..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block">Budget</label>
                <input type="number" className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" placeholder="$0.00" />
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block">Deadline</label>
                <input type="date" className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">Attachments (optional)</label>
              <div className="border-2 border-dashed rounded-xl p-3 text-center cursor-pointer hover:border-accent/50 transition-colors">
                <div className="text-[8px] text-muted-foreground">Click to upload · PDF, images, ZIP up to 25MB</div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 px-5 py-3 border-t">
            <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl" onClick={onClose}>Cancel</Button>
            <Button size="sm" className="h-8 text-[10px] gap-1 rounded-xl" onClick={() => { toast.success('Custom offer request sent'); onClose(); }}><Send className="h-3 w-3" />Send Request</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Promoted Section ──
const PromotedSection: React.FC<{ gigs: Gig[]; onSelect: (g: Gig) => void }> = ({ gigs, onSelect }) => {
  const promoted = gigs.filter(g => g.promoted);
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Megaphone className="h-4 w-4 text-accent" />
        <h3 className="text-[11px] font-semibold">Promoted Placements</h3>
        <Badge className="text-[7px] bg-accent/10 text-accent">{promoted.length} active</Badge>
      </div>
      {promoted.length > 0 ? promoted.map(g => (
        <div key={g.id} className="rounded-2xl border border-accent/30 bg-accent/5 p-4 hover:shadow-sm transition-all hover:-translate-y-px">
          <div className="flex items-start gap-3">
            <div className="h-16 w-24 rounded-xl bg-gradient-to-br from-accent/20 to-primary/10 flex items-center justify-center shrink-0"><Layers className="h-6 w-6 text-accent/30" /></div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Badge className="text-[6px] bg-accent/20 text-accent gap-0.5"><Megaphone className="h-2 w-2" />Promoted</Badge>
                <StatusBadge status={STATUS_CFG[g.status].badge} label={STATUS_CFG[g.status].label} />
              </div>
              <div className="text-[10px] font-semibold cursor-pointer hover:text-accent" onClick={() => onSelect(g)}>{g.title}</div>
              <div className="text-[8px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                <Avatar className="h-4 w-4"><AvatarFallback className="text-[4px]">{g.seller.avatar}</AvatarFallback></Avatar>
                {g.seller.name} · <Star className="h-2.5 w-2.5 fill-accent text-accent" />{g.rating} ({g.reviews})
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] font-bold">From ${g.startingPrice}</span>
                <Badge variant="secondary" className="text-[6px]">{g.impressions.toLocaleString()} views</Badge>
                <Badge variant="secondary" className="text-[6px]">{((g.orders / g.impressions) * 100).toFixed(1)}% conv</Badge>
              </div>
            </div>
            <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl shrink-0" onClick={() => onSelect(g)}><Eye className="h-3 w-3" />View</Button>
          </div>
        </div>
      )) : (
        <div className="rounded-2xl border p-8 text-center">
          <Megaphone className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
          <div className="text-[10px] font-medium">No Promoted Gigs</div>
          <div className="text-[8px] text-muted-foreground">Boost your gig visibility with promoted placements.</div>
        </div>
      )}
    </div>
  );
};

// ── Seller Analytics Strip ──
const SellerStrip: React.FC = () => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <BarChart3 className="h-4 w-4 text-accent" />
      <h3 className="text-[11px] font-semibold">Marketplace Analytics</h3>
    </div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {[
        { l: 'Avg Gig Price', v: '$387', change: '+12%', trend: 'up' as const },
        { l: 'Avg Delivery', v: '8.4 days', change: '-5%', trend: 'up' as const },
        { l: 'Buyer Satisfaction', v: '94.2%', change: '+2.1%', trend: 'up' as const },
        { l: 'Repeat Buyers', v: '38%', change: '+4%', trend: 'up' as const },
      ].map(m => (
        <div key={m.l} className="rounded-2xl border bg-card p-3">
          <div className="text-[7px] text-muted-foreground">{m.l}</div>
          <div className="text-sm font-bold mt-0.5">{m.v}</div>
          <div className={cn('text-[7px] flex items-center gap-0.5 mt-0.5', m.trend === 'up' ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')}>
            <ArrowUpRight className={cn('h-2 w-2', m.trend !== 'up' && 'rotate-90')} />{m.change}
          </div>
        </div>
      ))}
    </div>
    <div className="rounded-2xl border p-3">
      <div className="text-[9px] font-semibold mb-2">Category Performance</div>
      <div className="space-y-1.5">
        {[
          { cat: 'Design', share: 32, orders: 518, trend: 'up' },
          { cat: 'Development', share: 24, orders: 389, trend: 'up' },
          { cat: 'Video & Animation', share: 18, orders: 215, trend: 'up' },
          { cat: 'Marketing', share: 12, orders: 94, trend: 'down' },
          { cat: 'AI Services', share: 8, orders: 63, trend: 'up' },
          { cat: 'Writing', share: 4, orders: 47, trend: 'down' },
          { cat: 'Business', share: 2, orders: 28, trend: 'down' },
        ].map(c => (
          <div key={c.cat} className="flex items-center gap-2 text-[8px]">
            <span className="w-20 text-muted-foreground">{c.cat}</span>
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-accent" style={{ width: `${c.share}%` }} /></div>
            <span className="w-6 text-right font-medium">{c.share}%</span>
            <span className="w-12 text-right text-muted-foreground">{c.orders}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ── Main Page ──
const GIG_FILTERS: FilterDefinition[] = [
  { id: 'category', label: 'Category', type: 'multi-select', group: 'Gig', options: [
    { value: 'design', label: 'Design', count: 280 }, { value: 'development', label: 'Development', count: 350 },
    { value: 'marketing', label: 'Marketing', count: 190 }, { value: 'writing', label: 'Writing', count: 220 },
    { value: 'video', label: 'Video & Animation', count: 150 }, { value: 'music', label: 'Music & Audio', count: 80 },
    { value: 'data', label: 'Data', count: 120 }, { value: 'ai', label: 'AI Services', count: 170 },
  ], defaultOpen: true },
  { id: 'priceRange', label: 'Price Range', type: 'range', group: 'Pricing', min: 0, max: 5000, step: 50, unit: '$' },
  { id: 'deliveryTime', label: 'Delivery Time', type: 'single-select', group: 'Pricing', options: [
    { value: '24h', label: '24 Hours' }, { value: '3d', label: '1-3 Days' },
    { value: '7d', label: 'Up to 7 Days' }, { value: '14d', label: 'Up to 14 Days' },
    { value: '30d', label: 'Up to 30 Days' },
  ]},
  { id: 'sellerLevel', label: 'Seller Level', type: 'multi-select', group: 'Seller', options: [
    { value: 'top-rated', label: 'Top Rated' }, { value: 'level-2', label: 'Level 2' },
    { value: 'level-1', label: 'Level 1' }, { value: 'new', label: 'New Seller' },
  ]},
  { id: 'sellerVerified', label: 'Verified Seller Only', type: 'toggle', group: 'Seller' },
  { id: 'minRating', label: 'Min Rating', type: 'range', group: 'Quality', min: 1, max: 5, step: 0.5 },
  { id: 'minReviews', label: 'Min Reviews', type: 'range', group: 'Quality', min: 0, max: 500, step: 10 },
  { id: 'minOrders', label: 'Min Completed Orders', type: 'range', group: 'Quality', min: 0, max: 1000, step: 25 },
  { id: 'responseTime', label: 'Response Time', type: 'single-select', group: 'Seller', options: [
    { value: '1h', label: '< 1 Hour' }, { value: '4h', label: '< 4 Hours' },
    { value: '24h', label: '< 24 Hours' },
  ]},
  { id: 'revisions', label: 'Min Revisions', type: 'range', group: 'Package', min: 0, max: 10, step: 1 },
  { id: 'hasSource', label: 'Includes Source Files', type: 'toggle', group: 'Package' },
  { id: 'hasCommercialUse', label: 'Commercial Use', type: 'toggle', group: 'Package' },
  { id: 'promoted', label: 'Show Promoted Only', type: 'toggle', group: 'Visibility' },
  { id: 'tags', label: 'Tags', type: 'multi-select', group: 'Gig', options: [
    { value: 'react', label: 'React' }, { value: 'figma', label: 'Figma' },
    { value: 'branding', label: 'Branding' }, { value: 'seo', label: 'SEO' },
    { value: 'ai', label: 'AI' }, { value: 'typescript', label: 'TypeScript' },
    { value: 'animation', label: 'Animation' }, { value: 'wordpress', label: 'WordPress' },
  ]},
  { id: 'languages', label: 'Seller Language', type: 'multi-select', group: 'Seller', options: [
    { value: 'en', label: 'English' }, { value: 'es', label: 'Spanish' },
    { value: 'fr', label: 'French' }, { value: 'de', label: 'German' },
  ]},
];

const GigsBrowsePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('recommended');
  const [category, setCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [selectedGig, setSelectedGig] = useState<Gig | null>(null);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<'all' | 'under100' | '100-500' | '500plus'>('all');
  const [compareOpen, setCompareOpen] = useState(false);
  const [customOfferOpen, setCustomOfferOpen] = useState(false);
  const [customOfferSeller, setCustomOfferSeller] = useState<string | undefined>();
  const [showAdvFilters, setShowAdvFilters] = useState(true);
  const [advFilterValues, setAdvFilterValues] = useState<FilterValues>({});

  const toggleSave = (id: string) => setSavedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleCompare = (id: string) => setCompareIds(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); } else if (n.size < 4) { n.add(id); } else { toast.error('Max 4 gigs for comparison'); } return n; });

  const filtered = useMemo(() => GIGS.filter(g => {
    if (category !== 'all' && g.category !== category) return false;
    if (searchQuery && !g.title.toLowerCase().includes(searchQuery.toLowerCase()) && !g.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    if (priceRange === 'under100' && g.startingPrice >= 100) return false;
    if (priceRange === '100-500' && (g.startingPrice < 100 || g.startingPrice > 500)) return false;
    if (priceRange === '500plus' && g.startingPrice < 500) return false;
    if (activeTab === 'recommended' && !g.recommended) return false;
    if (activeTab === 'saved' && !savedIds.has(g.id)) return false;
    return true;
  }), [category, searchQuery, priceRange, activeTab, savedIds]);

  const compareGigs = GIGS.filter(g => compareIds.has(g.id));

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Layers className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Gigs Marketplace</span>
        <Badge variant="secondary" className="text-[7px]">{GIGS.length} gigs</Badge>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input className="h-7 w-52 rounded-xl border bg-background pl-7 pr-3 text-[10px] focus:ring-1 focus:ring-ring focus:outline-none" placeholder="Search gigs, skills, sellers..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
      </div>
      <div className="flex items-center gap-1 ml-1">
        {([['all', 'All'], ['under100', '< $100'], ['100-500', '$100–500'], ['500plus', '$500+']] as const).map(([k, l]) => (
          <Button key={k} variant={priceRange === k ? 'secondary' : 'ghost'} size="sm" className="h-6 text-[8px] px-2 rounded-xl" onClick={() => setPriceRange(k)}>{l}</Button>
        ))}
      </div>
      <div className="flex border rounded-xl overflow-hidden ml-1">
        <button onClick={() => setView('grid')} className={cn('px-1.5 py-1', view === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}><LayoutGrid className="h-3 w-3" /></button>
        <button onClick={() => setView('list')} className={cn('px-1.5 py-1', view === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground')}><List className="h-3 w-3" /></button>
      </div>
      {compareIds.size > 0 && (
        <Button size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => setCompareOpen(true)}>
          <Columns className="h-3 w-3" />Compare ({compareIds.size})
        </Button>
      )}
      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => setShowAdvFilters(!showAdvFilters)}>
        <SlidersHorizontal className="h-3 w-3" />Filters
      </Button>
      <Button size="sm" variant="outline" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => { setCustomOfferSeller(undefined); setCustomOfferOpen(true); }}>
        <Send className="h-3 w-3" />Custom Offer
      </Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Categories" className="!rounded-2xl">
        <div className="space-y-0.5">
          {CATEGORIES.map(c => {
            const count = c.id === 'all' ? GIGS.length : GIGS.filter(g => g.category === c.id).length;
            return (
              <button key={c.id} onClick={() => setCategory(c.id)} className={cn(
                'w-full flex items-center gap-2 px-2 py-1.5 rounded-xl text-[10px] transition-colors',
                category === c.id ? 'bg-accent/10 text-accent font-medium' : 'hover:bg-muted/50 text-muted-foreground',
              )}>
                <c.icon className="h-3 w-3" />
                <span className="flex-1 text-left">{c.label}</span>
                <Badge variant="secondary" className="text-[7px] px-1">{count}</Badge>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Top Sellers" icon={<Award className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-2">
          {GIGS.filter(g => g.seller.level.includes('Top')).slice(0, 4).map(g => (
            <div key={g.id} className="flex items-center gap-2">
              <Avatar className="h-6 w-6 ring-2 ring-accent/20"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{g.seller.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium truncate">{g.seller.name}</div>
                <div className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Star className="h-2 w-2 fill-accent text-accent" />{g.rating} · {g.seller.completedOrders} orders</div>
              </div>
              {g.seller.verified && <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />}
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Trending" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {['AI', 'React', 'Branding', 'SEO', 'Animation', 'TypeScript', 'Figma', 'Chatbot'].map(t => (
            <Badge key={t} variant="outline" className="text-[7px] px-1.5 cursor-pointer hover:bg-accent/10 rounded-xl" onClick={() => setSearchQuery(t)}>{t}</Badge>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Buyer Protection" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>Escrow-protected payments</span></div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>Free revisions included</span></div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>Satisfaction guarantee</span></div>
          <div className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>Dispute resolution</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'My Orders', icon: ShoppingCart, href: '/orders' },
            { label: 'Seller Dashboard', icon: BarChart3, href: '/gigs' },
            { label: 'Services', icon: Globe, href: '/services' },
            { label: 'Support', icon: MessageSquare, href: '/help' },
          ].map(a => (
            <Link key={a.label} to={a.href} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-accent/5 transition-colors text-[8px] font-medium">
              <a.icon className="h-3 w-3 text-accent" />{a.label}
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><Sparkles className="h-3.5 w-3.5 text-accent" />Recently Viewed</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {GIGS.slice(0, 5).map(g => (
          <div key={g.id} className="flex items-center gap-2 px-3 py-2 rounded-xl border bg-card shrink-0 min-w-[200px] cursor-pointer hover:bg-muted/10 hover:shadow-sm transition-all" onClick={() => setSelectedGig(g)}>
            <div className="h-8 w-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0"><Layers className="h-4 w-4" /></div>
            <div className="min-w-0">
              <div className="text-[10px] font-medium truncate max-w-[140px]">{g.title}</div>
              <div className="text-[8px] text-muted-foreground">{g.seller.name} · ${g.startingPrice}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderGigCard = (g: Gig) => {
    const scfg = STATUS_CFG[g.status];
    const saved = savedIds.has(g.id);
    const comparing = compareIds.has(g.id);

    if (view === 'list') {
      return (
        <div key={g.id} className="rounded-2xl border bg-card flex items-center gap-3 px-4 py-3 hover:shadow-sm transition-all hover:-translate-y-px">
          <div className="h-16 w-24 rounded-xl bg-gradient-to-br from-accent/15 to-primary/10 flex items-center justify-center shrink-0"><Layers className="h-5 w-5 text-accent/30" /></div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold truncate cursor-pointer hover:text-accent" onClick={() => setSelectedGig(g)}>{g.title}</span>
              {g.status !== 'active' && <StatusBadge status={scfg.badge} label={scfg.label} />}
              {g.promoted && <Badge className="text-[5px] bg-accent/20 text-accent gap-0.5 px-1"><Megaphone className="h-1.5 w-1.5" />Ad</Badge>}
            </div>
            <div className="text-[9px] text-muted-foreground flex items-center gap-2 mt-0.5">
              <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{g.seller.avatar}</AvatarFallback></Avatar>
              <span>{g.seller.name}</span>
              {g.seller.verified && <CheckCircle2 className="h-2.5 w-2.5 text-accent" />}
              <span>·</span>
              <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-accent text-accent" />{g.rating} ({g.reviews})</span>
              <span>·</span>
              <span>{g.subcategory}</span>
            </div>
            <div className="flex gap-1 mt-1">{g.tags.slice(0, 3).map(t => <Badge key={t} variant="secondary" className="text-[7px] px-1 rounded-lg">{t}</Badge>)}</div>
          </div>
          <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
            <div className="text-[12px] font-bold">From ${g.startingPrice}</div>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className={cn('h-5 w-5 p-0', comparing ? 'text-accent' : '')} onClick={() => toggleCompare(g.id)}>
                <Columns className="h-3 w-3" />
              </Button>
              <Button variant="ghost" size="sm" className={cn('h-5 w-5 p-0', saved ? 'text-accent' : '')} onClick={() => toggleSave(g.id)}>
                {saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
              </Button>
              <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setSelectedGig(g)}><Eye className="h-3 w-3" />View</Button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div key={g.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-sm transition-all group hover:-translate-y-px">
        <div className="h-28 bg-gradient-to-br from-accent/15 to-primary/10 flex items-center justify-center relative">
          <Layers className="h-8 w-8 text-accent/20" />
          {g.status !== 'active' && <div className="absolute top-2 left-2"><StatusBadge status={scfg.badge} label={scfg.label} /></div>}
          {g.promoted && <Badge className="absolute top-2 left-2 mt-5 text-[5px] bg-accent/20 text-accent gap-0.5 px-1"><Megaphone className="h-1.5 w-1.5" />Promoted</Badge>}
          <div className="absolute top-2 right-2 flex gap-1">
            <button className={cn('h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center', comparing && 'bg-accent/20')} onClick={() => toggleCompare(g.id)}>
              <Columns className={cn('h-3 w-3', comparing ? 'text-accent' : 'text-muted-foreground')} />
            </button>
            <button className="h-6 w-6 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center" onClick={() => toggleSave(g.id)}>
              {saved ? <BookmarkCheck className="h-3 w-3 text-accent" /> : <Bookmark className="h-3 w-3 text-muted-foreground" />}
            </button>
          </div>
        </div>
        <div className="p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Avatar className="h-5 w-5 ring-1 ring-accent/20"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{g.seller.avatar}</AvatarFallback></Avatar>
            <span className="text-[9px] text-muted-foreground truncate">{g.seller.name}</span>
            {g.seller.verified && <CheckCircle2 className="h-2.5 w-2.5 text-accent" />}
            <Badge variant="secondary" className="text-[6px] px-1 ml-auto rounded-lg">{g.seller.level}</Badge>
          </div>
          <div className="text-[10px] font-semibold line-clamp-2 mb-1.5 cursor-pointer hover:text-accent min-h-[2.5em]" onClick={() => setSelectedGig(g)}>{g.title}</div>
          <div className="flex items-center gap-1.5 mb-2">
            <Star className="h-3 w-3 fill-accent text-accent" />
            <span className="text-[10px] font-semibold">{g.rating}</span>
            <span className="text-[9px] text-muted-foreground">({g.reviews})</span>
          </div>
          <div className="flex items-center justify-between border-t pt-2">
            <span className="text-[8px] text-muted-foreground">Starting at</span>
            <span className="text-[11px] font-bold">${g.startingPrice}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Gigs Marketplace" icon={<Layers className="h-3 w-3" />} />

      {showAdvFilters && (
        <div className="mb-3">
          <AdvancedFilterPanel filters={GIG_FILTERS} values={advFilterValues} onChange={setAdvFilterValues} inline />
        </div>
      )}

      <KPIBand className="mb-3">
        <KPICard label="Total Gigs" value={String(GIGS.length)} />
        <KPICard label="Avg Rating" value={(GIGS.reduce((s, g) => s + g.rating, 0) / GIGS.length).toFixed(1)} trend="up" />
        <KPICard label="Featured" value={String(GIGS.filter(g => g.status === 'featured').length)} change="Active" />
        <KPICard label="Verified Sellers" value={String(GIGS.filter(g => g.seller.verified).length)} trend="up" />
        <KPICard label="Total Orders" value={GIGS.reduce((s, g) => s + g.orders, 0).toLocaleString()} trend="up" />
      </KPIBand>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8 mb-3 flex-wrap gap-0.5">
          <TabsTrigger value="recommended" className="text-[10px] h-6 px-3 gap-1"><Sparkles className="h-3 w-3" />Recommended</TabsTrigger>
          <TabsTrigger value="all" className="text-[10px] h-6 px-3 gap-1"><Layers className="h-3 w-3" />All Gigs</TabsTrigger>
          <TabsTrigger value="saved" className="text-[10px] h-6 px-3 gap-1"><Bookmark className="h-3 w-3" />Saved{savedIds.size > 0 && ` (${savedIds.size})`}</TabsTrigger>
          <TabsTrigger value="promoted" className="text-[10px] h-6 px-3 gap-1"><Megaphone className="h-3 w-3" />Promoted</TabsTrigger>
          <TabsTrigger value="analytics" className="text-[10px] h-6 px-3 gap-1"><BarChart3 className="h-3 w-3" />Analytics</TabsTrigger>
          <TabsTrigger value="recent" className="text-[10px] h-6 px-3 gap-1"><Clock className="h-3 w-3" />Recent</TabsTrigger>
        </TabsList>

        {['recommended', 'all', 'saved', 'recent'].map(tab => (
          <TabsContent key={tab} value={tab}>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border bg-card p-8 text-center">
                {tab === 'saved' ? <Bookmark className="h-6 w-6 text-muted-foreground mx-auto mb-2" /> : <Search className="h-6 w-6 text-muted-foreground mx-auto mb-2" />}
                <div className="text-[11px] font-semibold">{tab === 'saved' ? 'No saved gigs' : 'No gigs found'}</div>
                <div className="text-[9px] text-muted-foreground">{tab === 'saved' ? 'Bookmark gigs to compare later' : 'Adjust your filters or search query'}</div>
              </div>
            ) : (
              <div className={cn(view === 'grid' ? 'grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2' : 'space-y-2')}>
                {filtered.map(renderGigCard)}
              </div>
            )}
          </TabsContent>
        ))}

        <TabsContent value="promoted"><PromotedSection gigs={GIGS} onSelect={setSelectedGig} /></TabsContent>
        <TabsContent value="analytics"><SellerStrip /></TabsContent>
      </Tabs>

      {/* Detail Drawer */}
      <Sheet open={!!selectedGig} onOpenChange={() => setSelectedGig(null)}>
        <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto p-0">
          {selectedGig && (() => {
            const g = selectedGig;
            const scfg = STATUS_CFG[g.status];
            return (
              <>
                <SheetHeader className="p-4 border-b">
                  <SheetTitle className="text-sm">{g.title}</SheetTitle>
                </SheetHeader>
                <div className="p-4 space-y-3">
                  {/* Seller */}
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 ring-2 ring-accent/20"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{g.seller.avatar}</AvatarFallback></Avatar>
                    <div>
                      <div className="text-[11px] font-semibold flex items-center gap-1">{g.seller.name}{g.seller.verified && <CheckCircle2 className="h-3 w-3 text-accent" />}</div>
                      <div className="text-[9px] text-muted-foreground">{g.seller.level} · {g.seller.completedOrders} orders · {g.seller.responseTime}</div>
                    </div>
                    <div className="ml-auto"><StatusBadge status={scfg.badge} label={scfg.label} /></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Star className="h-3.5 w-3.5 fill-accent text-accent" />
                    <span className="text-[11px] font-bold">{g.rating}</span>
                    <span className="text-[10px] text-muted-foreground">({g.reviews} reviews)</span>
                    <span className="text-[10px] text-muted-foreground">· {g.orders} orders</span>
                  </div>

                  <div className="rounded-2xl border p-3">
                    <h4 className="text-[10px] font-semibold mb-1">About this gig</h4>
                    <p className="text-[10px] text-muted-foreground">{g.description}</p>
                    <div className="flex flex-wrap gap-1 mt-2">{g.tags.map(t => <Badge key={t} variant="secondary" className="text-[7px] rounded-lg">{t}</Badge>)}</div>
                  </div>

                  {/* Packages */}
                  <div>
                    <h4 className="text-[11px] font-semibold mb-2">Packages</h4>
                    <div className="space-y-1.5">
                      {g.packages.map(p => (
                        <div key={p.tier} className={cn('rounded-2xl border p-3', p.popular ? 'border-accent/30 bg-accent/5' : '')}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-semibold">{p.tier}</span>
                              {p.popular && <Badge className="text-[6px] px-1 rounded-lg">Popular</Badge>}
                            </div>
                            <span className="text-[12px] font-bold">${p.price}</span>
                          </div>
                          <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-1.5">
                            <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{p.delivery}</span>
                            <span className="flex items-center gap-0.5"><RefreshCw className="h-2.5 w-2.5" />{p.revisions} revisions</span>
                          </div>
                          <ul className="space-y-0.5">
                            {p.features.map(f => (
                              <li key={f} className="text-[9px] flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />{f}</li>
                            ))}
                          </ul>
                          <Button size="sm" className="h-6 text-[9px] w-full mt-2 gap-1 rounded-xl" onClick={() => toast.success(`Added ${p.tier} package to cart`)}><ShoppingCart className="h-3 w-3" />Select {p.tier} — ${p.price}</Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="rounded-2xl border p-3 text-[10px] space-y-1.5">
                    {[
                      { l: 'Category', v: `${g.category} / ${g.subcategory}` },
                      { l: 'Total Orders', v: g.orders },
                      { l: 'Impressions', v: g.impressions.toLocaleString() },
                      { l: 'Conversion', v: `${((g.orders / g.impressions) * 100).toFixed(1)}%` },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{String(r.v)}</span></div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl"><ShoppingCart className="h-3 w-3" />Order Now</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Contact</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => { setCustomOfferSeller(g.seller.name); setCustomOfferOpen(true); }}><Send className="h-3 w-3" />Custom Offer</Button>
                    <Button variant="ghost" size="sm" className={cn('h-7 text-[10px] gap-1 rounded-xl', savedIds.has(g.id) ? 'text-accent' : '')} onClick={() => toggleSave(g.id)}>
                      {savedIds.has(g.id) ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                    </Button>
                    <Button variant="ghost" size="sm" className={cn('h-7 text-[10px] gap-1 rounded-xl', compareIds.has(g.id) ? 'text-accent' : '')} onClick={() => toggleCompare(g.id)}>
                      <Columns className="h-3 w-3" />{compareIds.has(g.id) ? 'Remove' : 'Compare'}
                    </Button>
                  </div>
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      <CompareDrawer gigs={compareGigs} open={compareOpen} onClose={() => setCompareOpen(false)} onRemove={id => toggleCompare(id)} />
      <CustomOfferModal open={customOfferOpen} onClose={() => setCustomOfferOpen(false)} seller={customOfferSeller} />
    </DashboardLayout>
  );
};

export default GigsBrowsePage;
