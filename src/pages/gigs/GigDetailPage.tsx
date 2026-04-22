import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Star, Clock, Bookmark, BookmarkCheck,
  ShoppingCart, Package, ChevronRight, ChevronDown,
  CheckCircle2, Shield, MessageSquare, Eye,
  Award, Users, MapPin, RefreshCw,
  Flag, ThumbsUp, ThumbsDown, Image, Play, Share2,
  ArrowLeft, ExternalLink, HelpCircle,
  Link2, Sparkles, Lock, Calendar, Send, X,
  Gift, Globe,
  FileText, Heart, Repeat,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
interface GigPackage {
  tier: string; price: number; delivery: string; revisions: number;
  features: string[]; popular?: boolean;
}
interface GigReview {
  id: string; name: string; avatar: string; rating: number;
  text: string; date: string; country: string; helpful: number;
  response?: string;
}
interface FAQ { q: string; a: string; }
interface Upsell { id: string; name: string; price: number; description: string; }

const GIG_DATA = {
  id: 'g1',
  title: 'Professional Logo & Brand Identity Design — Modern, Minimalist, Timeless',
  category: 'Design', subcategory: 'Logo Design',
  status: 'active' as const,
  promoted: false,
  seller: {
    name: 'Sarah Chen', avatar: 'SC', verified: true,
    level: 'Top Rated Plus', completedOrders: 342, responseTime: '< 1 hour',
    memberSince: 'Jan 2021', lastDelivery: '2 hours ago',
    languages: ['English', 'Mandarin'], country: 'Singapore',
    description: 'Award-winning brand designer with 8+ years of experience crafting identities for startups and Fortune 500 companies.',
    specialties: ['Logo Design', 'Brand Identity', 'Visual Systems', 'Typography'],
    repeatRate: 68, rating: 4.9, onTime: 99, satisfaction: 98,
  },
  rating: 4.9, reviews: 287, orders: 342, impressions: 12400,
  startingPrice: 75,
  description: `I will design a unique, modern logo and complete brand identity package for your business. Each design is crafted from scratch — no templates, no stock graphics.

My process includes:
• Deep brand discovery questionnaire
• Mood board and style exploration
• Multiple unique concepts
• Unlimited revisions until you're thrilled
• Full ownership and commercial rights

Industries I specialize in: Tech, SaaS, E-commerce, Health & Wellness, Finance, Real Estate, and Creative Agencies.`,
  tags: ['Logo', 'Branding', 'Identity', 'Minimalist', 'Modern', 'Vector'],
  packages: [
    {
      tier: 'Basic', price: 75, delivery: '3 days', revisions: 2,
      features: ['1 logo concept', 'PNG + JPG files', 'Source file (AI/EPS)', 'Transparent background', 'Printable file'],
    },
    {
      tier: 'Standard', price: 150, delivery: '5 days', revisions: 4, popular: true,
      features: ['3 logo concepts', 'All file formats', 'Source file (AI/EPS)', 'Social media kit', 'Favicon', 'Brand color palette', 'Typography selection'],
    },
    {
      tier: 'Premium', price: 350, delivery: '7 days', revisions: 8,
      features: ['5 logo concepts', 'All file formats', 'Source file', 'Brand guidelines PDF', 'Social media kit (10 sizes)', 'Stationery design', 'Brand book (12 pages)', 'Animated logo', 'Priority support'],
    },
  ] as GigPackage[],
  gallery: [
    { type: 'image', label: 'Logo Portfolio' },
    { type: 'image', label: 'Brand Identity' },
    { type: 'image', label: 'Minimalist Logos' },
    { type: 'video', label: 'Process Video' },
    { type: 'image', label: 'Stationery Design' },
    { type: 'image', label: 'Social Media Kits' },
  ],
  faqs: [
    { q: 'What information do you need to get started?', a: 'I\'ll send a detailed questionnaire covering your business, target audience, style preferences, colors, and any inspiration references you have in mind.' },
    { q: 'Can I get a refund if I\'m not satisfied?', a: 'I offer unlimited revisions to ensure your satisfaction. If after revisions you\'re still not happy, we can discuss a partial or full refund through the platform\'s dispute resolution.' },
    { q: 'Do I get full ownership rights?', a: 'Yes! Upon delivery and payment, you receive 100% commercial rights and full ownership of the final design files.' },
    { q: 'Can you match an existing brand style?', a: 'Absolutely. If you have existing brand elements, I can create a cohesive logo that integrates seamlessly with your current visual identity.' },
    { q: 'Do you work with enterprise clients?', a: 'Yes, I frequently work with larger organizations. For enterprise projects, I recommend the Premium package or we can discuss a custom scope.' },
    { q: 'What is your revision process?', a: 'After each concept delivery, you can request changes. I typically turn around revisions within 24 hours. Each package includes a set number of revisions, but I also offer additional revision rounds as an add-on.' },
  ] as FAQ[],
  upsells: [
    { id: 'u1', name: 'Extra-Fast Delivery (24h)', price: 50, description: 'Get your deliverables within 24 hours instead of standard timeline.' },
    { id: 'u2', name: 'Additional Logo Concept', price: 25, description: 'Add one extra unique logo concept to your order.' },
    { id: 'u3', name: 'Animated Logo (GIF/MP4)', price: 75, description: 'Get a sleek animation of your chosen logo for social media and presentations.' },
    { id: 'u4', name: 'Business Card Design', price: 40, description: 'Professional business card design using your new brand identity.' },
    { id: 'u5', name: 'Social Media Kit (20 sizes)', price: 60, description: 'Extended social media kit covering all major platforms and ad sizes.' },
  ] as Upsell[],
  reviewsList: [
    { id: 'r1', name: 'Jordan K.', avatar: 'JK', rating: 5, text: 'Incredible work! Sarah delivered beyond expectations. The logo is clean, modern, and exactly what we needed for our SaaS launch. Communication was stellar throughout.', date: 'Mar 28, 2026', country: 'United States', helpful: 14, response: 'Thank you Jordan! It was a pleasure working on your brand. Wishing you a fantastic launch! 🚀' },
    { id: 'r2', name: 'Priya Mehta', avatar: 'PM', rating: 5, text: 'Fast turnaround and very professional. The brand guidelines were thorough and our dev team had zero questions during implementation.', date: 'Mar 20, 2026', country: 'India', helpful: 9 },
    { id: 'r3', name: 'Carlos Diaz', avatar: 'CD', rating: 4, text: 'Great design work. Took one extra round of revisions to nail the colors but the end result is fantastic. Would definitely work with Sarah again.', date: 'Mar 12, 2026', country: 'Mexico', helpful: 6 },
    { id: 'r4', name: 'Emma Wilson', avatar: 'EW', rating: 5, text: 'Third time ordering from Sarah — consistently exceptional quality. The animated logo was a nice bonus touch.', date: 'Mar 5, 2026', country: 'United Kingdom', helpful: 11 },
    { id: 'r5', name: 'Takeshi Yamamoto', avatar: 'TY', rating: 5, text: 'Professional, creative, and incredibly responsive. The brand book she delivered is being used as our design bible. Worth every penny.', date: 'Feb 28, 2026', country: 'Japan', helpful: 8 },
  ] as GigReview[],
};

const RATING_DIST = [
  { stars: 5, count: 241, pct: 84 },
  { stars: 4, count: 32, pct: 11 },
  { stars: 3, count: 10, pct: 3 },
  { stars: 2, count: 3, pct: 1 },
  { stars: 1, count: 1, pct: 0.3 },
];

const RELATED_GIGS = [
  { id: 'rg1', title: 'Modern App Icon Design', seller: 'Alex M.', price: 50, rating: 4.8, reviews: 92 },
  { id: 'rg2', title: 'Brand Guidelines Document', seller: 'Lina P.', price: 200, rating: 4.7, reviews: 63 },
  { id: 'rg3', title: 'Social Media Branding Kit', seller: 'Omar S.', price: 120, rating: 4.9, reviews: 148 },
];

/* ═══════════════════════════════════════════════════════════
   Custom Offer Modal
   ═══════════════════════════════════════════════════════════ */
const CustomOfferModal: React.FC<{ open: boolean; onClose: () => void; seller: string }> = ({ open, onClose, seller }) => {
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
            <div className="text-[9px] text-muted-foreground">To: <span className="font-medium text-foreground">{seller}</span></div>
            <div>
              <label className="text-[10px] font-semibold mb-1 block">What do you need?</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none focus:ring-1 focus:ring-ring focus:outline-none" placeholder="Describe your requirements in detail..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-semibold mb-1 block">Budget</label>
                <input type="number" className="w-full h-8 rounded-xl border bg-background px-3 text-[10px] focus:ring-1 focus:ring-ring focus:outline-none" placeholder="$0.00" />
              </div>
              <div>
                <label className="text-[10px] font-semibold mb-1 block">Deadline</label>
                <input type="date" className="w-full h-8 rounded-xl border bg-background px-3 text-[10px] focus:ring-1 focus:ring-ring focus:outline-none" />
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

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const GigDetailPage: React.FC = () => {
  const { gigId: _gigId } = useParams();
  const g = GIG_DATA;
  const [selectedPkg, setSelectedPkg] = useState(1);
  const [saved, setSaved] = useState(false);
  const [galleryIdx, setGalleryIdx] = useState(0);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [reviewDrawer, setReviewDrawer] = useState(false);
  const [compareDrawer, setCompareDrawer] = useState(false);
  const [customOfferOpen, setCustomOfferOpen] = useState(false);
  const [reviewSort, setReviewSort] = useState<'recent' | 'helpful'>('recent');
  const [selectedUpsells, setSelectedUpsells] = useState<Set<string>>(new Set());
  const pkg = g.packages[selectedPkg];

  const toggleUpsell = (id: string) => setSelectedUpsells(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const upsellTotal = g.upsells.filter(u => selectedUpsells.has(u.id)).reduce((s, u) => s + u.price, 0);

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <Link to="/gigs" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" />Gigs
      </Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] text-muted-foreground">{g.category}</span>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <span className="text-[10px] font-medium truncate max-w-[200px]">{g.subcategory}</span>
      <div className="flex-1" />
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Updated 2h ago</Badge>
      <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1" onClick={() => { setSaved(!saved); toast.success(saved ? 'Removed from saved' : 'Saved to collection'); }}>
        {saved ? <BookmarkCheck className="h-3 w-3 text-accent" /> : <Bookmark className="h-3 w-3" />}
        {saved ? 'Saved' : 'Save'}
      </Button>
      <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1"><Share2 className="h-3 w-3" />Share</Button>
      <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1"><Flag className="h-3 w-3" />Report</Button>
    </>
  );

  /* ── Right Rail — Sticky Order Panel ── */
  const rightRail = (
    <div className="space-y-3">
      {/* Package Selector */}
      <SectionCard title="Select Package" className="!rounded-2xl">
        <div className="flex rounded-xl border overflow-hidden mb-2">
          {g.packages.map((p, i) => (
            <button key={p.tier} onClick={() => setSelectedPkg(i)} className={cn(
              'flex-1 py-1.5 text-[9px] font-medium transition-colors',
              selectedPkg === i ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50',
            )}>
              {p.tier}
              {p.popular && <Sparkles className="h-2 w-2 inline ml-0.5" />}
            </button>
          ))}
        </div>

        <div className="flex items-baseline justify-between mb-1">
          <span className="text-lg font-bold">${pkg.price}</span>
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{pkg.delivery}</span>
        </div>
        <div className="text-[8px] text-muted-foreground mb-2">{pkg.revisions} revisions included</div>

        <ul className="space-y-1 mb-3">
          {pkg.features.map(f => (
            <li key={f} className="text-[9px] flex items-start gap-1">
              <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] mt-0.5 shrink-0" />{f}
            </li>
          ))}
        </ul>

        {/* Upsell quick-add */}
        {selectedUpsells.size > 0 && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-2 mb-2">
            <div className="text-[8px] font-medium text-accent mb-0.5">Add-ons: +${upsellTotal}</div>
            <div className="text-[7px] text-muted-foreground">{selectedUpsells.size} extra{selectedUpsells.size > 1 ? 's' : ''} selected</div>
          </div>
        )}

        <Button size="sm" className="h-8 text-[10px] w-full gap-1 mb-1.5 rounded-xl" onClick={() => toast.success(`${pkg.tier} package added to order`)}>
          <ShoppingCart className="h-3 w-3" />Order Now — ${pkg.price + upsellTotal}
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] w-full gap-1 rounded-xl">
          <MessageSquare className="h-3 w-3" />Message Seller
        </Button>
        <div className="flex gap-1 mt-1.5">
          <button className="text-[8px] text-accent hover:underline flex-1 text-center" onClick={() => setCompareDrawer(true)}>
            Compare packages →
          </button>
          <button className="text-[8px] text-accent hover:underline flex-1 text-center" onClick={() => setCustomOfferOpen(true)}>
            Custom offer →
          </button>
        </div>
      </SectionCard>

      {/* Trust Panel */}
      <SectionCard title="Buyer Protection" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { icon: Shield, text: 'Escrow-protected payment' },
            { icon: RefreshCw, text: `${pkg.revisions} revisions included` },
            { icon: Clock, text: `Delivery by ${pkg.delivery}` },
            { icon: CheckCircle2, text: 'Satisfaction guarantee' },
            { icon: Lock, text: 'Full commercial rights' },
            { icon: Globe, text: '24/7 support available' },
          ].map(t => (
            <div key={t.text} className="flex items-center gap-1.5">
              <t.icon className="h-3 w-3 text-[hsl(var(--state-healthy))]" />
              <span>{t.text}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Seller Card */}
      <SectionCard title="About the Seller" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Avatar className="h-8 w-8 ring-2 ring-accent/20"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{g.seller.avatar}</AvatarFallback></Avatar>
          <div>
            <div className="text-[10px] font-semibold flex items-center gap-1">{g.seller.name}{g.seller.verified && <CheckCircle2 className="h-3 w-3 text-accent" />}</div>
            <div className="text-[8px] text-muted-foreground">{g.seller.level}</div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-1 mb-2">
          {[
            { l: 'Rating', v: g.seller.rating },
            { l: 'On-time', v: `${g.seller.onTime}%` },
            { l: 'Repeat', v: `${g.seller.repeatRate}%` },
          ].map(s => (
            <div key={s.l} className="rounded-xl bg-muted/30 p-1.5 text-center">
              <div className="text-[10px] font-bold">{s.v}</div>
              <div className="text-[6px] text-muted-foreground">{s.l}</div>
            </div>
          ))}
        </div>
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'From', v: g.seller.country },
            { l: 'Member since', v: g.seller.memberSince },
            { l: 'Response time', v: g.seller.responseTime },
            { l: 'Last delivery', v: g.seller.lastDelivery },
          ].map(r => (
            <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
          ))}
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[8px] w-full mt-2 gap-1 rounded-xl">
          <ExternalLink className="h-2.5 w-2.5" />View Full Profile
        </Button>
      </SectionCard>

      {/* Bundle Upsell */}
      <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Package className="h-3 w-3 text-accent" />
          <span className="text-[9px] font-semibold">Save with a Bundle</span>
          <Badge className="text-[6px] px-1 ml-auto">-25%</Badge>
        </div>
        <p className="text-[8px] text-muted-foreground mb-1.5">Logo + Brand Guidelines + Social Kit for $450</p>
        <Button size="sm" variant="outline" className="h-5 text-[8px] w-full rounded-xl">View Bundle</Button>
      </div>

      {/* Related Gigs */}
      <SectionCard title="Related Gigs" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-2">
          {RELATED_GIGS.map(rg => (
            <Link key={rg.id} to={`/gigs/${rg.id}`} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 transition-colors">
              <div className="h-8 w-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Sparkles className="h-3 w-3 text-accent/30" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[9px] font-medium truncate">{rg.title}</div>
                <div className="text-[7px] text-muted-foreground flex items-center gap-1">
                  {rg.seller} · <Star className="h-2 w-2 fill-accent text-accent" />{rg.rating} ({rg.reviews})
                </div>
              </div>
              <span className="text-[9px] font-bold shrink-0">${rg.price}</span>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section — Reviews Summary + Related ── */
  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold">Reviews</span>
          <div className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" /><span className="text-[11px] font-bold">{g.rating}</span></div>
          <span className="text-[9px] text-muted-foreground">({g.reviews} reviews)</span>
        </div>
        <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1" onClick={() => setReviewDrawer(true)}>
          See all reviews <ChevronRight className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {g.reviewsList.slice(0, 4).map(r => (
          <div key={r.id} className="shrink-0 w-[260px] rounded-2xl border bg-card p-3 hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-1">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px]">{r.avatar}</AvatarFallback></Avatar>
              <span className="text-[9px] font-medium">{r.name}</span>
              <div className="flex gap-0.5 ml-auto">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-2 w-2 fill-accent text-accent" />)}</div>
            </div>
            <p className="text-[9px] text-muted-foreground line-clamp-2">{r.text}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[7px] text-muted-foreground">{r.country}</span>
              <span className="text-[7px] text-muted-foreground">· {r.date}</span>
              <span className="text-[7px] text-muted-foreground ml-auto flex items-center gap-0.5"><ThumbsUp className="h-2 w-2" />{r.helpful}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* ── Gallery ── */}
      <div className="rounded-2xl border bg-card overflow-hidden mb-3">
        <div className="h-52 bg-gradient-to-br from-accent/15 to-primary/10 flex items-center justify-center relative">
          {g.gallery[galleryIdx].type === 'video'
            ? <Play className="h-10 w-10 text-accent/40" />
            : <Image className="h-10 w-10 text-accent/20" />
          }
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
            {g.gallery.map((_, i) => (
              <button key={i} onClick={() => setGalleryIdx(i)} className={cn(
                'h-1.5 rounded-full transition-all',
                galleryIdx === i ? 'w-4 bg-accent' : 'w-1.5 bg-muted-foreground/30',
              )} />
            ))}
          </div>
          {g.gallery[galleryIdx].type === 'video' && (
            <Badge className="absolute top-2 right-2 text-[7px] rounded-xl"><Play className="h-2 w-2 mr-0.5" />Video</Badge>
          )}
          <div className="absolute top-2 left-2">
            <Badge variant="secondary" className="text-[7px] rounded-xl">{galleryIdx + 1} / {g.gallery.length}</Badge>
          </div>
        </div>
        <div className="flex gap-1 p-1.5 overflow-x-auto">
          {g.gallery.map((item, i) => (
            <button key={i} onClick={() => setGalleryIdx(i)} className={cn(
              'shrink-0 h-12 w-16 rounded-xl flex items-center justify-center text-[7px] transition-all border',
              galleryIdx === i ? 'border-accent ring-1 ring-accent/20 bg-accent/5' : 'bg-muted/30 border-transparent hover:border-muted-foreground/20',
            )}>
              {item.type === 'video' ? <Play className="h-3 w-3 text-muted-foreground" /> : <Image className="h-3 w-3 text-muted-foreground" />}
            </button>
          ))}
        </div>
      </div>

      {/* ── Title & Meta ── */}
      <div className="mb-3">
        <div className="flex items-center gap-1.5 mb-1">
          <Badge variant="secondary" className="text-[7px] rounded-lg">{g.category}</Badge>
          <Badge variant="outline" className="text-[7px] rounded-lg">{g.subcategory}</Badge>
          {g.promoted && <Badge className="text-[6px] bg-amber-100 text-amber-700 rounded-lg">Promoted</Badge>}
          <StatusBadge status="healthy" label="Active" />
        </div>
        <h1 className="text-sm font-bold leading-snug mb-1.5">{g.title}</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Avatar className="h-5 w-5 ring-1 ring-accent/20"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{g.seller.avatar}</AvatarFallback></Avatar>
            <span className="text-[10px] font-medium">{g.seller.name}</span>
            {g.seller.verified && <CheckCircle2 className="h-3 w-3 text-accent" />}
            <Badge variant="secondary" className="text-[6px] px-1 rounded-lg">{g.seller.level}</Badge>
          </div>
          <div className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" /><span className="text-[10px] font-bold">{g.rating}</span><span className="text-[9px] text-muted-foreground">({g.reviews})</span></div>
          <span className="text-[9px] text-muted-foreground">{g.orders} orders</span>
          <span className="text-[9px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{g.impressions.toLocaleString()} views</span>
        </div>
      </div>

      <KPIBand className="mb-3">
        <KPICard label="Starting" value={`$${g.startingPrice}`} />
        <KPICard label="Rating" value={g.rating} trend="up" />
        <KPICard label="Orders" value={g.orders} />
        <KPICard label="Repeat Rate" value={`${g.seller.repeatRate}%`} trend="up" />
        <KPICard label="Satisfaction" value={`${g.seller.satisfaction}%`} trend="up" />
      </KPIBand>

      {/* ── Content Tabs ── */}
      <Tabs defaultValue="about">
        <TabsList className="h-8 mb-3 flex-wrap gap-0.5">
          <TabsTrigger value="about" className="text-[9px] h-6 px-2.5 gap-1"><FileText className="h-3 w-3" />About</TabsTrigger>
          <TabsTrigger value="packages" className="text-[9px] h-6 px-2.5 gap-1"><Package className="h-3 w-3" />Packages</TabsTrigger>
          <TabsTrigger value="upsells" className="text-[9px] h-6 px-2.5 gap-1"><Gift className="h-3 w-3" />Extras</TabsTrigger>
          <TabsTrigger value="faq" className="text-[9px] h-6 px-2.5 gap-1"><HelpCircle className="h-3 w-3" />FAQ</TabsTrigger>
          <TabsTrigger value="reviews" className="text-[9px] h-6 px-2.5 gap-1"><Star className="h-3 w-3" />Reviews</TabsTrigger>
          <TabsTrigger value="seller" className="text-[9px] h-6 px-2.5 gap-1"><Award className="h-3 w-3" />Seller</TabsTrigger>
        </TabsList>

        {/* About */}
        <TabsContent value="about">
          <SectionCard title="About This Gig" className="!rounded-2xl">
            <div className="text-[10px] text-muted-foreground whitespace-pre-line leading-relaxed">{g.description}</div>
            <div className="flex flex-wrap gap-1 mt-3">
              {g.tags.map(t => <Badge key={t} variant="secondary" className="text-[7px] rounded-lg">{t}</Badge>)}
            </div>
          </SectionCard>

          <SectionCard title="Link to Project" icon={<Link2 className="h-3.5 w-3.5 text-accent" />} className="mt-2 !rounded-2xl">
            <p className="text-[9px] text-muted-foreground mb-1.5">This gig can be ordered as part of a project workspace deliverable.</p>
            <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl"><Link2 className="h-2.5 w-2.5" />Link to Your Project</Button>
          </SectionCard>

          {/* Trust signals strip */}
          <div className="grid grid-cols-4 gap-2 mt-3">
            {[
              { icon: Shield, label: 'Escrow Protected', detail: 'Funds held safely' },
              { icon: Clock, label: 'Fast Delivery', detail: `As quick as ${g.packages[0].delivery}` },
              { icon: RefreshCw, label: 'Free Revisions', detail: `Up to ${g.packages[2].revisions}` },
              { icon: Award, label: 'Top Rated', detail: `${g.rating} avg rating` },
            ].map(t => (
              <div key={t.label} className="rounded-2xl border bg-card p-3 text-center hover:shadow-sm transition-all">
                <t.icon className="h-4 w-4 text-accent mx-auto mb-1" />
                <div className="text-[9px] font-semibold">{t.label}</div>
                <div className="text-[7px] text-muted-foreground">{t.detail}</div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Packages Comparison */}
        <TabsContent value="packages">
          <SectionCard title="Compare Packages" className="!rounded-2xl">
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Feature</th>
                    {g.packages.map(p => (
                      <th key={p.tier} className={cn('py-2 px-3 text-center', p.popular ? 'bg-accent/5' : '')}>
                        <div className="font-semibold">{p.tier}</div>
                        <div className="text-[11px] font-bold mt-0.5">${p.price}</div>
                        {p.popular && <Badge className="text-[5px] px-1 mt-0.5">Most Popular</Badge>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b"><td className="py-1.5 pr-3 text-muted-foreground">Delivery</td>{g.packages.map(p => <td key={p.tier} className={cn('py-1.5 px-3 text-center font-medium', p.popular ? 'bg-accent/5' : '')}>{p.delivery}</td>)}</tr>
                  <tr className="border-b"><td className="py-1.5 pr-3 text-muted-foreground">Revisions</td>{g.packages.map(p => <td key={p.tier} className={cn('py-1.5 px-3 text-center font-medium', p.popular ? 'bg-accent/5' : '')}>{p.revisions}</td>)}</tr>
                  {(() => {
                    const allFeatures = [...new Set(g.packages.flatMap(p => p.features))];
                    return allFeatures.map(f => (
                      <tr key={f} className="border-b">
                        <td className="py-1.5 pr-3 text-muted-foreground">{f}</td>
                        {g.packages.map(p => (
                          <td key={p.tier} className={cn('py-1.5 px-3 text-center', p.popular ? 'bg-accent/5' : '')}>
                            {p.features.includes(f) ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                          </td>
                        ))}
                      </tr>
                    ));
                  })()}
                  <tr>
                    <td className="py-2" />
                    {g.packages.map((p, i) => (
                      <td key={p.tier} className={cn('py-2 px-3', p.popular ? 'bg-accent/5' : '')}>
                        <Button size="sm" className={cn('h-7 text-[8px] w-full rounded-xl')} variant={selectedPkg === i ? 'default' : 'outline'} onClick={() => { setSelectedPkg(i); toast.success(`${p.tier} selected`); }}>
                          {selectedPkg === i ? '✓ Selected' : `Select $${p.price}`}
                        </Button>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </SectionCard>

          {/* Value comparison */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            {g.packages.map((p, i) => (
              <div key={p.tier} className={cn('rounded-2xl border p-3 text-center', p.popular ? 'border-accent/30 bg-accent/5 ring-1 ring-accent/10' : '', selectedPkg === i && 'ring-2 ring-accent')}>
                {p.popular && <Badge className="text-[6px] px-1 mb-1">Best Value</Badge>}
                <div className="text-[10px] font-semibold">{p.tier}</div>
                <div className="text-lg font-bold mt-0.5">${p.price}</div>
                <div className="text-[8px] text-muted-foreground">{p.delivery} · {p.revisions} rev</div>
                <div className="text-[8px] text-muted-foreground mt-1">{p.features.length} features</div>
                <Button size="sm" className="h-6 text-[8px] w-full mt-2 rounded-xl" variant={selectedPkg === i ? 'default' : 'outline'} onClick={() => setSelectedPkg(i)}>
                  <ShoppingCart className="h-2.5 w-2.5 mr-1" />Select
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Extras / Upsells */}
        <TabsContent value="upsells">
          <SectionCard title="Gig Extras & Add-ons" icon={<Gift className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {g.upsells.map(u => {
                const selected = selectedUpsells.has(u.id);
                return (
                  <div key={u.id} className={cn('rounded-2xl border p-3 flex items-start gap-3 cursor-pointer transition-all hover:shadow-sm', selected ? 'border-accent/30 bg-accent/5' : 'hover:border-muted-foreground/20')} onClick={() => toggleUpsell(u.id)}>
                    <div className={cn('h-5 w-5 rounded-lg border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors', selected ? 'border-accent bg-accent' : 'border-muted-foreground/30')}>
                      {selected && <CheckCircle2 className="h-3 w-3 text-accent-foreground" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold">{u.name}</div>
                      <div className="text-[9px] text-muted-foreground">{u.description}</div>
                    </div>
                    <span className="text-[11px] font-bold shrink-0">+${u.price}</span>
                  </div>
                );
              })}
            </div>
            {selectedUpsells.size > 0 && (
              <div className="mt-3 pt-3 border-t flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-semibold">{selectedUpsells.size} extra{selectedUpsells.size > 1 ? 's' : ''} selected</div>
                  <div className="text-[8px] text-muted-foreground">Added to your {g.packages[selectedPkg].tier} package</div>
                </div>
                <div className="text-right">
                  <div className="text-[8px] text-muted-foreground line-through">${pkg.price + upsellTotal}</div>
                  <div className="text-[12px] font-bold">${pkg.price + upsellTotal}</div>
                </div>
              </div>
            )}
          </SectionCard>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq">
          <SectionCard title="Frequently Asked Questions" icon={<HelpCircle className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {g.faqs.map((faq, i) => (
                <div key={i} className="rounded-xl border overflow-hidden">
                  <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full flex items-center justify-between px-3 py-2.5 text-[10px] font-medium text-left hover:bg-muted/30 transition-colors">
                    <span className="flex items-center gap-2"><HelpCircle className="h-3 w-3 text-accent shrink-0" />{faq.q}</span>
                    <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform shrink-0', expandedFaq === i && 'rotate-180')} />
                  </button>
                  {expandedFaq === i && (
                    <div className="px-3 pb-3 text-[9px] text-muted-foreground border-t pt-2 ml-5">{faq.a}</div>
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t rounded-2xl bg-muted/20 p-3 text-center">
              <div className="text-[10px] font-semibold mb-1">Still have questions?</div>
              <div className="text-[9px] text-muted-foreground mb-2">Contact the seller directly for custom inquiries</div>
              <div className="flex gap-2 justify-center">
                <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl"><MessageSquare className="h-2.5 w-2.5" />Message Seller</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-xl" onClick={() => setCustomOfferOpen(true)}><Send className="h-2.5 w-2.5" />Custom Offer</Button>
              </div>
            </div>
          </SectionCard>
        </TabsContent>

        {/* Reviews */}
        <TabsContent value="reviews">
          <SectionCard title={`Reviews (${g.reviews})`} className="!rounded-2xl">
            {/* Rating Distribution */}
            <div className="flex gap-4 mb-3 p-3 rounded-xl bg-muted/20">
              <div className="text-center">
                <div className="text-2xl font-bold">{g.rating}</div>
                <div className="flex gap-0.5 justify-center">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className={cn('h-2.5 w-2.5', i < Math.round(g.rating) ? 'fill-accent text-accent' : 'text-muted-foreground/20')} />)}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{g.reviews} reviews</div>
              </div>
              <div className="flex-1 space-y-0.5">
                {RATING_DIST.map(d => (
                  <div key={d.stars} className="flex items-center gap-1.5">
                    <span className="text-[8px] w-6 text-right">{d.stars}★</span>
                    <Progress value={d.pct} className="h-1.5 flex-1" />
                    <span className="text-[8px] text-muted-foreground w-6">{d.count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Highlights */}
            <div className="flex gap-2 mb-3">
              {[
                { label: 'Communication', score: 4.9 },
                { label: 'Quality', score: 5.0 },
                { label: 'Value', score: 4.8 },
                { label: 'Timeliness', score: 4.9 },
              ].map(h => (
                <div key={h.label} className="flex-1 rounded-xl bg-muted/20 p-2 text-center">
                  <div className="text-[10px] font-bold">{h.score}</div>
                  <div className="text-[7px] text-muted-foreground">{h.label}</div>
                </div>
              ))}
            </div>

            {/* Sort */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[9px] text-muted-foreground">Sort by:</span>
              {(['recent', 'helpful'] as const).map(s => (
                <Button key={s} variant={reviewSort === s ? 'secondary' : 'ghost'} size="sm" className="h-5 text-[8px] px-2 rounded-xl" onClick={() => setReviewSort(s)}>
                  {s === 'recent' ? 'Most Recent' : 'Most Helpful'}
                </Button>
              ))}
            </div>

            {/* Review List */}
            <div className="space-y-2">
              {(reviewSort === 'helpful' ? [...g.reviewsList].sort((a, b) => b.helpful - a.helpful) : g.reviewsList).map(r => (
                <div key={r.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Avatar className="h-5 w-5 ring-1 ring-muted-foreground/10"><AvatarFallback className="text-[6px]">{r.avatar}</AvatarFallback></Avatar>
                    <span className="text-[10px] font-medium">{r.name}</span>
                    <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-2 w-2 fill-accent text-accent" />)}</div>
                    <span className="text-[7px] text-muted-foreground ml-auto flex items-center gap-0.5"><MapPin className="h-2 w-2" />{r.country}</span>
                    <span className="text-[7px] text-muted-foreground">{r.date}</span>
                  </div>
                  <p className="text-[9px] text-muted-foreground">{r.text}</p>
                  {r.response && (
                    <div className="mt-1.5 ml-4 p-2 rounded-xl bg-accent/5 border border-accent/10">
                      <div className="text-[8px] font-medium text-accent mb-0.5">Seller Response:</div>
                      <p className="text-[8px] text-muted-foreground">{r.response}</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-1.5">
                    <button className="text-[7px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground"><ThumbsUp className="h-2 w-2" />Helpful ({r.helpful})</button>
                    <button className="text-[7px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground"><ThumbsDown className="h-2 w-2" />Not helpful</button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </TabsContent>

        {/* Seller */}
        <TabsContent value="seller">
          <SectionCard title="About the Seller" icon={<Award className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-12 w-12 ring-2 ring-accent/20"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{g.seller.avatar}</AvatarFallback></Avatar>
              <div>
                <div className="text-[11px] font-semibold flex items-center gap-1">{g.seller.name}{g.seller.verified && <CheckCircle2 className="h-3 w-3 text-accent" />}</div>
                <Badge variant="secondary" className="text-[7px] rounded-lg">{g.seller.level}</Badge>
              </div>
            </div>
            <p className="text-[9px] text-muted-foreground mb-3">{g.seller.description}</p>

            {/* Seller stats */}
            <div className="grid grid-cols-4 gap-2 mb-3">
              {[
                { l: 'Rating', v: g.seller.rating, icon: Star },
                { l: 'On-time', v: `${g.seller.onTime}%`, icon: Clock },
                { l: 'Repeat', v: `${g.seller.repeatRate}%`, icon: Repeat },
                { l: 'Satisfaction', v: `${g.seller.satisfaction}%`, icon: Heart },
              ].map(s => (
                <div key={s.l} className="rounded-xl bg-muted/20 p-2 text-center">
                  <s.icon className="h-3 w-3 text-accent mx-auto mb-0.5" />
                  <div className="text-[10px] font-bold">{s.v}</div>
                  <div className="text-[6px] text-muted-foreground">{s.l}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3">
              {[
                { l: 'From', v: g.seller.country, icon: MapPin },
                { l: 'Member since', v: g.seller.memberSince, icon: Calendar },
                { l: 'Response time', v: g.seller.responseTime, icon: Clock },
                { l: 'Last delivery', v: g.seller.lastDelivery, icon: CheckCircle2 },
                { l: 'Completed orders', v: g.seller.completedOrders, icon: ShoppingCart },
                { l: 'Languages', v: g.seller.languages.join(', '), icon: Globe },
              ].map(r => (
                <div key={r.l} className="flex items-center gap-1.5 text-[9px]">
                  <r.icon className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="text-muted-foreground">{r.l}:</span>
                  <span className="font-medium">{String(r.v)}</span>
                </div>
              ))}
            </div>
            <div className="mb-3">
              <div className="text-[9px] font-semibold mb-1">Specialties</div>
              <div className="flex flex-wrap gap-1">{g.seller.specialties.map(s => <Badge key={s} variant="outline" className="text-[7px] rounded-lg">{s}</Badge>)}</div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[8px] flex-1 gap-1 rounded-xl"><MessageSquare className="h-2.5 w-2.5" />Contact Seller</Button>
              <Button variant="outline" size="sm" className="h-7 text-[8px] flex-1 gap-1 rounded-xl"><ExternalLink className="h-2.5 w-2.5" />Full Profile</Button>
            </div>
          </SectionCard>
        </TabsContent>
      </Tabs>

      {/* ── Related Services Cross-Link ── */}
      <SectionCard title="Related Services by This Seller" icon={<Globe className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl mt-4" action={<Link to="/services" className="text-[8px] text-accent hover:underline flex items-center gap-0.5">Browse All Services <ChevronRight className="h-2.5 w-2.5" /></Link>}>
        <p className="text-[8px] text-muted-foreground mb-2">Looking for something more comprehensive? This seller also offers full professional services.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { title: 'Brand Identity Design', price: 'From $500', delivery: '5-7 days', rating: 4.9, reviews: 28 },
            { title: 'Website Redesign', price: 'From $1,200', delivery: '14-21 days', rating: 5.0, reviews: 8 },
          ].map(s => (
            <Link key={s.title} to="/services" className="block">
              <div className="p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="text-[6px] bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))] border-0">Service</Badge>
                  <span className="text-[10px] font-semibold truncate">{s.title}</span>
                </div>
                <div className="flex items-center gap-2 text-[8px] text-muted-foreground">
                  <span>{s.price}</span>
                  <span className="flex items-center gap-0.5"><Star className="h-2 w-2 text-[hsl(var(--gigvora-amber))]" />{s.rating} ({s.reviews})</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" />{s.delivery}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </SectionCard>

      {/* ── Mobile Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1 min-w-0">
          <div className="text-[8px] text-muted-foreground">{pkg.tier} Package</div>
          <div className="text-sm font-bold">${pkg.price + upsellTotal}</div>
        </div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-5" onClick={() => toast.success(`${pkg.tier} package added to order`)}>
          <ShoppingCart className="h-3.5 w-3.5" />Order Now
        </Button>
      </div>

      {/* ── Compare Drawer ── */}
      <Sheet open={compareDrawer} onOpenChange={setCompareDrawer}>
        <SheetContent className="w-[480px] sm:w-[520px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Package Comparison</SheetTitle></SheetHeader>
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-[9px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-medium text-muted-foreground">Feature</th>
                  {g.packages.map(p => (
                    <th key={p.tier} className={cn('py-2 px-2 text-center', p.popular ? 'bg-accent/5' : '')}>
                      <div className="font-semibold">{p.tier}</div>
                      <div className="font-bold text-[11px]">${p.price}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-b"><td className="py-1.5 pr-3 text-muted-foreground">Delivery</td>{g.packages.map(p => <td key={p.tier} className={cn('py-1.5 px-2 text-center', p.popular ? 'bg-accent/5' : '')}>{p.delivery}</td>)}</tr>
                <tr className="border-b"><td className="py-1.5 pr-3 text-muted-foreground">Revisions</td>{g.packages.map(p => <td key={p.tier} className={cn('py-1.5 px-2 text-center', p.popular ? 'bg-accent/5' : '')}>{p.revisions}</td>)}</tr>
                {[...new Set(g.packages.flatMap(p => p.features))].map(f => (
                  <tr key={f} className="border-b">
                    <td className="py-1.5 pr-3 text-muted-foreground">{f}</td>
                    {g.packages.map(p => (
                      <td key={p.tier} className={cn('py-1.5 px-2 text-center', p.popular ? 'bg-accent/5' : '')}>
                        {p.features.includes(f) ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] mx-auto" /> : <span className="text-muted-foreground/30">—</span>}
                      </td>
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="py-2" />
                  {g.packages.map((p, i) => (
                    <td key={p.tier} className={cn('py-2 px-2', p.popular ? 'bg-accent/5' : '')}>
                      <Button size="sm" className="h-6 text-[8px] w-full rounded-xl" variant={selectedPkg === i ? 'default' : 'outline'} onClick={() => { setSelectedPkg(i); setCompareDrawer(false); toast.success(`${p.tier} selected`); }}>
                        Select
                      </Button>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Review Drawer ── */}
      <Sheet open={reviewDrawer} onOpenChange={setReviewDrawer}>
        <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">All Reviews ({g.reviews})</SheetTitle></SheetHeader>
          <div className="p-4 space-y-2">
            {g.reviewsList.map(r => (
              <div key={r.id} className="rounded-2xl border p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px]">{r.avatar}</AvatarFallback></Avatar>
                  <span className="text-[10px] font-medium">{r.name}</span>
                  <div className="flex gap-0.5">{Array.from({ length: r.rating }).map((_, i) => <Star key={i} className="h-2 w-2 fill-accent text-accent" />)}</div>
                  <span className="text-[7px] text-muted-foreground ml-auto">{r.date}</span>
                </div>
                <p className="text-[9px] text-muted-foreground">{r.text}</p>
                {r.response && (
                  <div className="mt-1.5 ml-4 p-2 rounded-xl bg-accent/5 border border-accent/10">
                    <div className="text-[8px] font-medium text-accent mb-0.5">Seller Response:</div>
                    <p className="text-[8px] text-muted-foreground">{r.response}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Custom Offer Modal */}
      <CustomOfferModal open={customOfferOpen} onClose={() => setCustomOfferOpen(false)} seller={g.seller.name} />
    </DashboardLayout>
  );
};

export default GigDetailPage;
