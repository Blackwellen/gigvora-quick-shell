import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Send, Clock, DollarSign, CheckCircle2, XCircle,
  MessageSquare, RefreshCw, Plus, Eye, Edit,
  AlertTriangle, Shield, ArrowLeft, ChevronRight,
  FileText, Package, Star, Calendar, Timer,
  ArrowRight, X, Flag, ExternalLink, Users,
  Scale, Sparkles, TrendingUp, Activity, BarChart3,
  Copy, Lock, Zap, Target, Layers, Info,
  Gift, Trash2, Search, Filter, Save,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════ */
type OfferStatus = 'requested' | 'sent' | 'revised' | 'accepted' | 'declined' | 'expired';
type ViewTab = 'all' | 'requested' | 'sent' | 'revised' | 'accepted' | 'declined' | 'expired';
type WorkbenchTab = 'offers' | 'scope-builder' | 'price-match' | 'analytics';

interface OfferItem { description: string; qty: number; rate: number; }
interface RevisionMsg {
  id: string; actor: string; avatar: string; role: 'buyer' | 'seller';
  text: string; timestamp: string; attachments?: string[];
}
interface Offer {
  id: string; title: string; status: OfferStatus;
  buyer: { name: string; avatar: string };
  seller: { name: string; avatar: string; verified: boolean };
  items: OfferItem[];
  delivery: string; revisions: number; total: number;
  created: string; expires: string; lastActivity: string;
  linkedGig?: string; linkedProject?: string;
  messages: RevisionMsg[];
  version: number;
  priceMatch?: { competitor: string; originalPrice: number; matchedPrice: number };
}

interface ScopeBlock { id: string; label: string; description: string; estimate: number; included: boolean; }

const STATUS_CFG: Record<OfferStatus, { badge: 'healthy' | 'live' | 'caution' | 'blocked' | 'review' | 'degraded'; label: string }> = {
  requested: { badge: 'review', label: 'Requested' },
  sent: { badge: 'live', label: 'Sent' },
  revised: { badge: 'caution', label: 'Revised' },
  accepted: { badge: 'healthy', label: 'Accepted' },
  declined: { badge: 'blocked', label: 'Declined' },
  expired: { badge: 'degraded', label: 'Expired' },
};

const OFFERS: Offer[] = [
  {
    id: 'of1', title: 'Custom Logo + Full Brand Kit for SaaS Launch', status: 'sent',
    buyer: { name: 'Jordan Kim', avatar: 'JK' },
    seller: { name: 'Sarah Chen', avatar: 'SC', verified: true },
    items: [
      { description: 'Primary logo design (5 concepts)', qty: 1, rate: 250 },
      { description: 'Brand guidelines document (20 pages)', qty: 1, rate: 150 },
      { description: 'Social media kit (10 sizes)', qty: 1, rate: 100 },
    ],
    delivery: '10 days', revisions: 5, total: 500,
    created: 'Apr 8, 2026', expires: 'Apr 15, 2026', lastActivity: '2 hours ago',
    linkedGig: 'Professional Logo & Brand Identity Design',
    messages: [
      { id: 'm1', actor: 'Jordan Kim', avatar: 'JK', role: 'buyer', text: 'Hi Sarah, I need a complete brand kit for my SaaS product launching next month. Can you do a custom package?', timestamp: 'Apr 8, 10:15 AM' },
      { id: 'm2', actor: 'Sarah Chen', avatar: 'SC', role: 'seller', text: "Absolutely! Based on your requirements, I've put together a custom offer. The package includes 5 logo concepts, a 20-page brand guidelines doc, and a full social media kit.", timestamp: 'Apr 8, 11:30 AM' },
    ],
    version: 1,
  },
  {
    id: 'of2', title: 'Full-Stack Dashboard with Auth & Analytics', status: 'revised',
    buyer: { name: 'Marcus Lane', avatar: 'ML' },
    seller: { name: 'Alex Morgan', avatar: 'AM', verified: true },
    items: [
      { description: 'Dashboard UI (React + TypeScript)', qty: 1, rate: 1200 },
      { description: 'Authentication system (OAuth + email)', qty: 1, rate: 400 },
      { description: 'Analytics integration', qty: 1, rate: 300 },
      { description: 'Deployment & CI/CD setup', qty: 1, rate: 200 },
    ],
    delivery: '21 days', revisions: 4, total: 2100,
    created: 'Apr 5, 2026', expires: 'Apr 12, 2026', lastActivity: '5 hours ago',
    linkedProject: 'Enterprise Dashboard Rebuild',
    messages: [
      { id: 'm1', actor: 'Marcus Lane', avatar: 'ML', role: 'buyer', text: 'Need a production-ready dashboard. Budget is around $2000.', timestamp: 'Apr 5, 2:00 PM' },
      { id: 'm2', actor: 'Alex Morgan', avatar: 'AM', role: 'seller', text: "Here's my initial proposal at $2,400. Happy to discuss scope.", timestamp: 'Apr 5, 4:15 PM' },
      { id: 'm3', actor: 'Marcus Lane', avatar: 'ML', role: 'buyer', text: 'Can we trim the analytics to basic charts and bring it to $2,100?', timestamp: 'Apr 6, 9:00 AM' },
      { id: 'm4', actor: 'Alex Morgan', avatar: 'AM', role: 'seller', text: 'Done — revised offer at $2,100. Analytics will use Recharts with 5 standard chart types.', timestamp: 'Apr 6, 10:30 AM' },
    ],
    version: 2, priceMatch: { competitor: 'DevStudio Pro', originalPrice: 2400, matchedPrice: 2100 },
  },
  {
    id: 'of3', title: 'SEO Audit + 3-Month Content Calendar', status: 'accepted',
    buyer: { name: 'Priya Mehta', avatar: 'PM' },
    seller: { name: 'Marcus Chen', avatar: 'MC', verified: true },
    items: [
      { description: 'Comprehensive SEO audit report', qty: 1, rate: 300 },
      { description: '3-month content calendar with 36 topics', qty: 1, rate: 250 },
      { description: 'Keyword research (200 keywords)', qty: 1, rate: 150 },
    ],
    delivery: '14 days', revisions: 3, total: 700,
    created: 'Apr 2, 2026', expires: 'Apr 9, 2026', lastActivity: '1 day ago',
    messages: [
      { id: 'm1', actor: 'Priya Mehta', avatar: 'PM', role: 'buyer', text: 'Looking for a full SEO overhaul with a content plan.', timestamp: 'Apr 2, 11:00 AM' },
      { id: 'm2', actor: 'Marcus Chen', avatar: 'MC', role: 'seller', text: "Here's my custom offer. Includes audit, keyword research, and a 3-month calendar.", timestamp: 'Apr 2, 2:00 PM' },
      { id: 'm3', actor: 'Priya Mehta', avatar: 'PM', role: 'buyer', text: 'Looks great, accepting!', timestamp: 'Apr 3, 9:15 AM' },
    ],
    version: 1,
  },
  {
    id: 'of4', title: 'Explainer Video — 90 Seconds', status: 'declined',
    buyer: { name: 'Emma Wilson', avatar: 'EW' },
    seller: { name: 'Jordan Blake', avatar: 'JB', verified: true },
    items: [
      { description: '90-second 2D animated explainer', qty: 1, rate: 800 },
      { description: 'Professional voiceover', qty: 1, rate: 150 },
      { description: 'Background music & SFX', qty: 1, rate: 50 },
    ],
    delivery: '14 days', revisions: 3, total: 1000,
    created: 'Mar 28, 2026', expires: 'Apr 4, 2026', lastActivity: '6 days ago',
    messages: [
      { id: 'm1', actor: 'Emma Wilson', avatar: 'EW', role: 'buyer', text: 'Can you do a 90-second explainer for $800?', timestamp: 'Mar 28, 3:00 PM' },
      { id: 'm2', actor: 'Jordan Blake', avatar: 'JB', role: 'seller', text: 'For 90 seconds with VO and music, $1,000 is the minimum I can offer.', timestamp: 'Mar 28, 5:00 PM' },
      { id: 'm3', actor: 'Emma Wilson', avatar: 'EW', role: 'buyer', text: "That's over budget unfortunately. I'll pass for now.", timestamp: 'Mar 29, 10:00 AM' },
    ],
    version: 1,
  },
  {
    id: 'of5', title: 'AI Chatbot for Customer Support Portal', status: 'expired',
    buyer: { name: 'Takeshi Yamamoto', avatar: 'TY' },
    seller: { name: 'Liam Foster', avatar: 'LF', verified: true },
    items: [
      { description: 'Custom GPT-powered chatbot', qty: 1, rate: 1500 },
      { description: 'Knowledge base training', qty: 1, rate: 400 },
      { description: 'Widget integration', qty: 1, rate: 200 },
    ],
    delivery: '21 days', revisions: 4, total: 2100,
    created: 'Mar 20, 2026', expires: 'Mar 27, 2026', lastActivity: '2 weeks ago',
    messages: [
      { id: 'm1', actor: 'Takeshi Yamamoto', avatar: 'TY', role: 'buyer', text: 'Interested in a custom chatbot. Sending requirements doc.', timestamp: 'Mar 20, 9:00 AM' },
      { id: 'm2', actor: 'Liam Foster', avatar: 'LF', role: 'seller', text: "Here's my offer. Please review and accept within 7 days.", timestamp: 'Mar 20, 3:00 PM' },
    ],
    version: 1,
  },
  {
    id: 'of6', title: 'Mobile App Design — Fitness Tracker', status: 'requested',
    buyer: { name: 'Carlos Diaz', avatar: 'CD' },
    seller: { name: 'Sarah Chen', avatar: 'SC', verified: true },
    items: [],
    delivery: '', revisions: 0, total: 0,
    created: 'Apr 11, 2026', expires: 'Apr 18, 2026', lastActivity: '30 min ago',
    messages: [
      { id: 'm1', actor: 'Carlos Diaz', avatar: 'CD', role: 'buyer', text: "Hi Sarah, I saw your UI/UX portfolio and I'd love a custom offer for a fitness tracker app. About 12 screens with workout tracking, progress charts, and social features. Budget is flexible.", timestamp: 'Apr 11, 4:30 PM' },
    ],
    version: 0,
  },
];

const DEFAULT_SCOPE_BLOCKS: ScopeBlock[] = [
  { id: 'sb1', label: 'Discovery & Requirements', description: 'Initial consultation, requirements gathering, scope definition', estimate: 200, included: true },
  { id: 'sb2', label: 'Design / Core Deliverable', description: 'Primary creative or development work', estimate: 800, included: true },
  { id: 'sb3', label: 'Revisions & Refinement', description: 'Up to 3 rounds of revisions based on feedback', estimate: 150, included: true },
  { id: 'sb4', label: 'Documentation & Handoff', description: 'Source files, style guides, deployment docs', estimate: 100, included: true },
  { id: 'sb5', label: 'Extended Support (30 days)', description: 'Post-delivery bug fixes and minor adjustments', estimate: 200, included: false },
  { id: 'sb6', label: 'Rush Delivery Surcharge', description: 'Priority queue, 50% faster delivery', estimate: 300, included: false },
];

const PRICE_MATCH_COMPETITORS = [
  { name: 'DesignPro Studio', service: 'Logo + Brand Kit', price: 550, delivery: '12 days', rating: 4.7 },
  { name: 'CreativeForge', service: 'Logo + Brand Kit', price: 480, delivery: '14 days', rating: 4.5 },
  { name: 'BrandWorks Agency', service: 'Logo + Brand Kit', price: 620, delivery: '8 days', rating: 4.9 },
  { name: 'QuickDesigns', service: 'Logo + Brand Kit', price: 350, delivery: '7 days', rating: 4.2 },
];

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const OffersPage: React.FC = () => {
  const [workbench, setWorkbench] = useState<WorkbenchTab>('offers');
  const [tab, setTab] = useState<ViewTab>('all');
  const [selected, setSelected] = useState<Offer | null>(null);
  const [createDrawer, setCreateDrawer] = useState(false);
  const [reviseDrawer, setReviseDrawer] = useState(false);
  const [detailInspector, setDetailInspector] = useState(false);
  const [compareDrawer, setCompareDrawer] = useState(false);
  const [acceptConfirm, setAcceptConfirm] = useState(false);
  const [declineConfirm, setDeclineConfirm] = useState(false);

  // Create offer form
  const [newTitle, setNewTitle] = useState('');
  const [newItems, setNewItems] = useState<OfferItem[]>([{ description: '', qty: 1, rate: 0 }]);
  const [newDelivery, setNewDelivery] = useState('7 days');
  const [newRevisions, setNewRevisions] = useState(3);
  const [newMessage, setNewMessage] = useState('');

  // Scope builder
  const [scopeBlocks, setScopeBlocks] = useState<ScopeBlock[]>(DEFAULT_SCOPE_BLOCKS);
  const [scopeTitle, setScopeTitle] = useState('');

  // Price match
  const [matchSearch, setMatchSearch] = useState('');

  // Compare
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  const filtered = OFFERS.filter(o => tab === 'all' || o.status === tab);
  const counts: Record<string, number> = {
    all: OFFERS.length,
    requested: OFFERS.filter(o => o.status === 'requested').length,
    sent: OFFERS.filter(o => o.status === 'sent').length,
    revised: OFFERS.filter(o => o.status === 'revised').length,
    accepted: OFFERS.filter(o => o.status === 'accepted').length,
    declined: OFFERS.filter(o => o.status === 'declined').length,
    expired: OFFERS.filter(o => o.status === 'expired').length,
  };

  const newTotal = newItems.reduce((s, i) => s + i.qty * i.rate, 0);
  const scopeTotal = scopeBlocks.filter(b => b.included).reduce((s, b) => s + b.estimate, 0);
  const compareOffers = OFFERS.filter(o => compareIds.has(o.id));

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else if (next.size < 4) next.add(id);
      return next;
    });
  };

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <Link to="/gigs" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3 w-3" />Gigs
      </Link>
      <ChevronRight className="h-3 w-3 text-muted-foreground" />
      <FileText className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Custom Offers & Price Matching</span>
      <div className="flex-1" />
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
      {compareIds.size > 0 && (
        <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1" onClick={() => setCompareDrawer(true)}>
          <Scale className="h-3 w-3" />Compare ({compareIds.size})
        </Button>
      )}
      <Button size="sm" className="h-6 text-[9px] gap-1" onClick={() => setCreateDrawer(true)}><Plus className="h-3 w-3" />New Offer</Button>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = selected ? (
    <div className="space-y-3">
      <SectionCard title="Offer Details" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Status', v: <StatusBadge status={STATUS_CFG[selected.status].badge} label={STATUS_CFG[selected.status].label} /> },
            { l: 'Version', v: `v${selected.version}` },
            { l: 'Created', v: selected.created },
            { l: 'Expires', v: selected.expires },
            { l: 'Total', v: `$${selected.total.toLocaleString()}` },
            { l: 'Delivery', v: selected.delivery || '—' },
            { l: 'Revisions', v: selected.revisions || '—' },
          ].map(r => (
            <div key={r.l} className="flex justify-between items-center"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Parties" className="!rounded-2xl">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px]">{selected.buyer.avatar}</AvatarFallback></Avatar>
            <div><div className="text-[9px] font-medium">{selected.buyer.name}</div><div className="text-[7px] text-muted-foreground">Buyer</div></div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{selected.seller.avatar}</AvatarFallback></Avatar>
            <div><div className="text-[9px] font-medium flex items-center gap-0.5">{selected.seller.name}{selected.seller.verified && <CheckCircle2 className="h-2.5 w-2.5 text-accent" />}</div><div className="text-[7px] text-muted-foreground">Seller</div></div>
          </div>
        </div>
      </SectionCard>

      {selected.priceMatch && (
        <SectionCard title="Price Match" icon={<Scale className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-1 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Competitor</span><span className="font-medium">{selected.priceMatch.competitor}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Original</span><span className="line-through text-muted-foreground">${selected.priceMatch.originalPrice}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Matched</span><span className="font-bold text-[hsl(var(--state-healthy))]">${selected.priceMatch.matchedPrice}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Savings</span><Badge className="text-[6px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]">${selected.priceMatch.originalPrice - selected.priceMatch.matchedPrice} saved</Badge></div>
          </div>
        </SectionCard>
      )}

      {selected.linkedGig && (
        <SectionCard title="Linked Gig" icon={<Package className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="text-[9px] text-muted-foreground">{selected.linkedGig}</div>
          <Link to="/gigs"><Button variant="ghost" size="sm" className="h-5 text-[8px] mt-1 gap-0.5 p-0"><ExternalLink className="h-2.5 w-2.5" />View Gig</Button></Link>
        </SectionCard>
      )}
      {selected.linkedProject && (
        <SectionCard title="Linked Project" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="text-[9px] text-muted-foreground">{selected.linkedProject}</div>
          <Link to="/projects"><Button variant="ghost" size="sm" className="h-5 text-[8px] mt-1 gap-0.5 p-0"><ExternalLink className="h-2.5 w-2.5" />View Project</Button></Link>
        </SectionCard>
      )}

      {/* Actions */}
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setDetailInspector(true)}><Eye className="h-3 w-3" />Full Inspection</Button>
          {selected.status === 'sent' && (
            <>
              <Button size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setAcceptConfirm(true)}><CheckCircle2 className="h-3 w-3" />Accept Offer</Button>
              <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setReviseDrawer(true)}><Edit className="h-3 w-3" />Request Revision</Button>
              <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 text-destructive" onClick={() => setDeclineConfirm(true)}><XCircle className="h-3 w-3" />Decline</Button>
            </>
          )}
          {selected.status === 'requested' && (
            <Button size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setCreateDrawer(true)}><Send className="h-3 w-3" />Send Offer</Button>
          )}
          {selected.status === 'revised' && (
            <>
              <Button size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setAcceptConfirm(true)}><CheckCircle2 className="h-3 w-3" />Accept Revised</Button>
              <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => setReviseDrawer(true)}><RefreshCw className="h-3 w-3" />Revise Again</Button>
            </>
          )}
          {selected.status === 'expired' && (
            <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => toast.info('Offer resent')}><RefreshCw className="h-3 w-3" />Resend</Button>
          )}
          {selected.status === 'accepted' && (
            <Link to="/orders"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1"><ArrowRight className="h-3 w-3" />Go to Order</Button></Link>
          )}
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1"><MessageSquare className="h-3 w-3" />Message</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1" onClick={() => toggleCompare(selected.id)}>
            <Scale className="h-3 w-3" />{compareIds.has(selected.id) ? 'Remove from Compare' : 'Add to Compare'}
          </Button>
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Summary" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Pending action</span><span className="font-medium">{counts.requested + counts.sent + counts.revised}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Accepted</span><span className="font-medium text-[hsl(var(--state-healthy))]">{counts.accepted}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Declined / Expired</span><span className="font-medium">{counts.declined + counts.expired}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Total value (active)</span><span className="font-bold">${OFFERS.filter(o => ['sent', 'revised', 'requested'].includes(o.status)).reduce((s, o) => s + o.total, 0).toLocaleString()}</span></div>
        </div>
      </SectionCard>

      {/* Expiry alerts */}
      {OFFERS.filter(o => o.status === 'sent' || o.status === 'revised').length > 0 && (
        <SectionCard title="Expiry Alerts" icon={<Timer className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
          <div className="space-y-1.5">
            {OFFERS.filter(o => o.status === 'sent' || o.status === 'revised').map(o => (
              <div key={o.id} className="flex items-center gap-2 text-[8px] cursor-pointer hover:text-accent" onClick={() => { setSelected(o); setTab('all'); }}>
                <div className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-caution))]" />
                <span className="flex-1 truncate">{o.title}</span>
                <span className="text-muted-foreground shrink-0">exp. {o.expires}</span>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      <SectionCard title="Quick Tips" icon={<Star className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1 text-[8px] text-muted-foreground">
          <p>• Respond to requests within 4 hours for best conversion</p>
          <p>• Offers expire after 7 days by default</p>
          <p>• Accepted offers auto-create an escrow-protected order</p>
          <p>• Use Scope Builder for complex bespoke projects</p>
          <p>• Price Match helps you stay competitive</p>
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = selected ? (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5 text-accent" />Negotiation Thread · v{selected.version}</div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {selected.messages.map(m => (
          <div key={m.id} className={cn('shrink-0 w-[280px] rounded-2xl border p-2.5', m.role === 'seller' ? 'bg-accent/5 border-accent/10' : 'bg-card')}>
            <div className="flex items-center gap-1.5 mb-1">
              <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{m.avatar}</AvatarFallback></Avatar>
              <span className="text-[9px] font-medium">{m.actor}</span>
              <Badge variant="secondary" className="text-[6px] px-1 rounded-lg">{m.role}</Badge>
              <span className="text-[7px] text-muted-foreground ml-auto">{m.timestamp}</span>
            </div>
            <p className="text-[9px] text-muted-foreground line-clamp-3">{m.text}</p>
          </div>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Workbench Tabs */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2">
        {([
          { key: 'offers' as const, label: 'Offers', icon: FileText },
          { key: 'scope-builder' as const, label: 'Scope Builder', icon: Layers },
          { key: 'price-match' as const, label: 'Price Match', icon: Scale },
          { key: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
        ]).map(w => (
          <button key={w.key} onClick={() => setWorkbench(w.key)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors',
            workbench === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
            <w.icon className="h-3 w-3" />{w.label}
          </button>
        ))}
      </div>

      {/* ═══ TAB: OFFERS ═══ */}
      {workbench === 'offers' && (
        <Tabs value={tab} onValueChange={v => { setTab(v as ViewTab); setSelected(null); }}>
          <TabsList className="h-8 mb-3 flex-wrap">
            {([['all', 'All'], ['requested', 'Requested'], ['sent', 'Sent'], ['revised', 'Revised'], ['accepted', 'Accepted'], ['declined', 'Declined'], ['expired', 'Expired']] as const).map(([k, l]) => (
              <TabsTrigger key={k} value={k} className="text-[10px] h-6 px-2.5 gap-1 rounded-xl">
                {l}
                {counts[k] > 0 && <Badge variant="secondary" className="text-[7px] px-1 ml-0.5 rounded-lg">{counts[k]}</Badge>}
              </TabsTrigger>
            ))}
          </TabsList>

          {['all', 'requested', 'sent', 'revised', 'accepted', 'declined', 'expired'].map(t => (
            <TabsContent key={t} value={t}>
              <KPIBand className="mb-3">
                <KPICard label="Offers" value={filtered.length} />
                <KPICard label="Total Value" value={`$${filtered.reduce((s, o) => s + o.total, 0).toLocaleString()}`} />
                <KPICard label="Avg Value" value={filtered.length ? `$${Math.round(filtered.reduce((s, o) => s + o.total, 0) / filtered.length)}` : '—'} />
                <KPICard label="Conversion" value={`${OFFERS.length ? Math.round((counts.accepted / OFFERS.length) * 100) : 0}%`} trend="up" />
              </KPIBand>

              {filtered.length === 0 ? (
                <div className="rounded-2xl border bg-card p-8 text-center">
                  <FileText className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                  <div className="text-[11px] font-semibold">No offers in this view</div>
                  <div className="text-[9px] text-muted-foreground mb-2">Create a new offer or adjust filters</div>
                  <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setCreateDrawer(true)}><Plus className="h-3 w-3" />New Offer</Button>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {filtered.map(o => {
                    const scfg = STATUS_CFG[o.status];
                    const isSelected = selected?.id === o.id;
                    const inCompare = compareIds.has(o.id);
                    return (
                      <div key={o.id} onClick={() => setSelected(o)} className={cn(
                        'rounded-2xl border bg-card px-4 py-3 cursor-pointer transition-all hover:shadow-sm',
                        isSelected && 'ring-1 ring-accent border-accent/30',
                        inCompare && !isSelected && 'border-accent/20',
                      )}>
                        <div className="flex items-center gap-3">
                          <button className={cn('shrink-0 h-4 w-4 rounded border transition-colors', inCompare ? 'bg-accent border-accent' : 'border-muted-foreground/30 hover:border-accent/50')} onClick={e => { e.stopPropagation(); toggleCompare(o.id); }}>
                            {inCompare && <CheckCircle2 className="h-3 w-3 text-accent-foreground mx-auto" />}
                          </button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-[11px] font-semibold truncate">{o.title}</span>
                              <StatusBadge status={scfg.badge} label={scfg.label} />
                              {o.version > 1 && <Badge variant="outline" className="text-[6px] px-1 rounded-lg">v{o.version}</Badge>}
                              {o.priceMatch && <Badge className="text-[5px] px-1 bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] rounded-lg">Price Matched</Badge>}
                            </div>
                            <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Avatar className="h-3.5 w-3.5"><AvatarFallback className="text-[5px]">{o.buyer.avatar}</AvatarFallback></Avatar>
                                {o.buyer.name}
                              </span>
                              <span>↔</span>
                              <span className="flex items-center gap-1">
                                <Avatar className="h-3.5 w-3.5"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{o.seller.avatar}</AvatarFallback></Avatar>
                                {o.seller.name}
                              </span>
                              <span>·</span>
                              <span>{o.items.length} items</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{o.lastActivity}</span>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-[12px] font-bold">${o.total.toLocaleString()}</div>
                            <div className="text-[8px] text-muted-foreground">{o.delivery || 'TBD'}</div>
                          </div>
                        </div>
                        {isSelected && o.items.length > 0 && (
                          <div className="mt-2 pt-2 border-t">
                            <table className="w-full text-[9px]">
                              <thead><tr className="text-muted-foreground"><th className="text-left py-0.5 font-medium">Item</th><th className="text-center py-0.5 font-medium w-12">Qty</th><th className="text-right py-0.5 font-medium w-16">Rate</th><th className="text-right py-0.5 font-medium w-16">Total</th></tr></thead>
                              <tbody>
                                {o.items.map((item, i) => (
                                  <tr key={i} className="border-t border-dashed"><td className="py-1">{item.description}</td><td className="text-center py-1">{item.qty}</td><td className="text-right py-1">${item.rate}</td><td className="text-right py-1 font-medium">${item.qty * item.rate}</td></tr>
                                ))}
                                <tr className="border-t font-semibold"><td className="py-1">Total</td><td /><td /><td className="text-right py-1">${o.total.toLocaleString()}</td></tr>
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      )}

      {/* ═══ TAB: SCOPE BUILDER ═══ */}
      {workbench === 'scope-builder' && (
        <div className="space-y-3">
          <SectionCard title="Bespoke Scope Designer" icon={<Layers className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <p className="text-[9px] text-muted-foreground mb-3">Build a custom scope from reusable blocks. Toggle modules on/off, adjust estimates, and convert to an offer.</p>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Project Title</label>
              <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" placeholder="e.g. Complete Brand Identity Package" value={scopeTitle} onChange={e => setScopeTitle(e.target.value)} />
            </div>
          </SectionCard>

          <div className="space-y-1.5">
            {scopeBlocks.map((b, i) => (
              <div key={b.id} className={cn('rounded-2xl border p-3 transition-all', b.included ? 'bg-card hover:shadow-sm' : 'bg-muted/20 opacity-60')}>
                <div className="flex items-start gap-2">
                  <input type="checkbox" className="mt-1 h-3.5 w-3.5 rounded" checked={b.included} onChange={e => setScopeBlocks(prev => prev.map((bl, idx) => idx === i ? { ...bl, included: e.target.checked } : bl))} />
                  <div className="flex-1 min-w-0">
                    <input className="w-full text-[10px] font-semibold bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none mb-0.5" value={b.label} onChange={e => setScopeBlocks(prev => prev.map((bl, idx) => idx === i ? { ...bl, label: e.target.value } : bl))} />
                    <input className="w-full text-[9px] text-muted-foreground bg-transparent border-b border-transparent hover:border-border focus:border-accent focus:outline-none" value={b.description} onChange={e => setScopeBlocks(prev => prev.map((bl, idx) => idx === i ? { ...bl, description: e.target.value } : bl))} />
                  </div>
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-0.5">
                      <span className="text-[8px] text-muted-foreground">$</span>
                      <input type="number" className="w-16 h-6 rounded-xl border bg-background px-1.5 text-[10px] font-bold text-right" value={b.estimate} onChange={e => setScopeBlocks(prev => prev.map((bl, idx) => idx === i ? { ...bl, estimate: Number(e.target.value) } : bl))} min={0} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setScopeBlocks(prev => [...prev, { id: `sb${Date.now()}`, label: '', description: '', estimate: 0, included: true }])}>
              <Plus className="h-3 w-3" />Add Block
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Sparkles className="h-3 w-3" />AI Suggest Blocks</Button>
          </div>

          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-semibold">Scope Total</span>
              <span className="text-lg font-bold">${scopeTotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[8px] text-muted-foreground mb-2">
              <Info className="h-2.5 w-2.5" />
              <span>{scopeBlocks.filter(b => b.included).length} of {scopeBlocks.length} blocks included</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl"><Save className="h-3 w-3" />Save Template</Button>
              <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" disabled={!scopeTitle || scopeTotal === 0} onClick={() => {
                setNewTitle(scopeTitle);
                setNewItems(scopeBlocks.filter(b => b.included).map(b => ({ description: b.label, qty: 1, rate: b.estimate })));
                setWorkbench('offers');
                setCreateDrawer(true);
                toast.success('Scope converted to offer');
              }}><Send className="h-3 w-3" />Convert to Offer</Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══ TAB: PRICE MATCH ═══ */}
      {workbench === 'price-match' && (
        <div className="space-y-3">
          <SectionCard title="Price Matching Engine" icon={<Scale className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <p className="text-[9px] text-muted-foreground mb-2">Compare your pricing against competitors and offer price-matching to win buyers.</p>
            <div className="relative mb-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input className="w-full h-8 pl-8 rounded-xl border bg-background px-3 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Search service or competitor..." value={matchSearch} onChange={e => setMatchSearch(e.target.value)} />
            </div>
          </SectionCard>

          <div className="space-y-1.5">
            {PRICE_MATCH_COMPETITORS.filter(c => !matchSearch || c.name.toLowerCase().includes(matchSearch.toLowerCase()) || c.service.toLowerCase().includes(matchSearch.toLowerCase())).map((comp, i) => (
              <div key={i} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-all">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-muted">{comp.name.slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold truncate">{comp.name}</div>
                    <div className="text-[8px] text-muted-foreground">{comp.service}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="flex items-center gap-0.5 text-[8px]"><Star className="h-2.5 w-2.5 text-amber-500 fill-amber-500" />{comp.rating}</div>
                      <span className="text-[8px] text-muted-foreground">·</span>
                      <span className="text-[8px] text-muted-foreground">{comp.delivery}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[12px] font-bold">${comp.price}</div>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5 mt-1 rounded-xl" onClick={() => toast.success(`Price match applied: $${comp.price}`)}>
                      <Target className="h-2 w-2" />Match
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <SectionCard title="Your Competitive Position" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {['Logo + Brand Kit', 'Web Development', 'SEO Audit'].map((svc, i) => {
                const yourPrice = [500, 2100, 700][i];
                const marketAvg = [500, 1800, 650][i];
                const position = yourPrice <= marketAvg ? 'competitive' : 'above';
                return (
                  <div key={svc}>
                    <div className="flex justify-between text-[9px] mb-0.5">
                      <span className="font-medium">{svc}</span>
                      <Badge className={cn('text-[6px] rounded-lg', position === 'competitive' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]')}>
                        {position === 'competitive' ? 'Competitive' : 'Above Avg'}
                      </Badge>
                    </div>
                    <div className="relative h-2 rounded-full bg-muted overflow-hidden">
                      <div className="absolute h-full bg-accent/20 rounded-full" style={{ width: `${(marketAvg / (yourPrice * 1.5)) * 100}%` }} />
                      <div className="absolute h-full w-1 bg-foreground rounded-full" style={{ left: `${Math.min((yourPrice / (yourPrice * 1.5)) * 100, 95)}%` }} />
                    </div>
                    <div className="flex justify-between text-[7px] text-muted-foreground mt-0.5">
                      <span>You: ${yourPrice}</span>
                      <span>Market avg: ${marketAvg}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ TAB: ANALYTICS ═══ */}
      {workbench === 'analytics' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Offers" value={OFFERS.length} />
            <KPICard label="Acceptance Rate" value={`${Math.round((counts.accepted / OFFERS.length) * 100)}%`} trend="up" />
            <KPICard label="Avg Response Time" value="3.2h" trend="up" />
            <KPICard label="Total Revenue" value={`$${OFFERS.filter(o => o.status === 'accepted').reduce((s, o) => s + o.total, 0).toLocaleString()}`} />
            <KPICard label="Avg Offer Value" value={`$${Math.round(OFFERS.reduce((s, o) => s + o.total, 0) / OFFERS.length)}`} />
          </KPIBand>

          <div className="grid md:grid-cols-2 gap-3">
            <SectionCard title="Offer Status Distribution" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-1.5">
                {(['requested', 'sent', 'revised', 'accepted', 'declined', 'expired'] as OfferStatus[]).map(s => {
                  const count = counts[s];
                  const pct = OFFERS.length ? Math.round((count / OFFERS.length) * 100) : 0;
                  return (
                    <div key={s}>
                      <div className="flex justify-between text-[9px] mb-0.5">
                        <span className="flex items-center gap-1"><StatusBadge status={STATUS_CFG[s].badge} label={STATUS_CFG[s].label} /></span>
                        <span className="font-medium">{count} ({pct}%)</span>
                      </div>
                      <Progress value={pct} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </SectionCard>

            <SectionCard title="Negotiation Efficiency" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { label: 'Avg. revisions to close', value: '1.4', target: '< 2', ok: true },
                  { label: 'Avg. time to accept', value: '2.1 days', target: '< 3 days', ok: true },
                  { label: 'Price match conversion', value: '67%', target: '> 50%', ok: true },
                  { label: 'Expiry rate', value: '16%', target: '< 20%', ok: true },
                  { label: 'Decline rate', value: '16%', target: '< 25%', ok: true },
                ].map(m => (
                  <div key={m.label} className="flex items-center gap-2 text-[9px]">
                    {m.ok ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))] shrink-0" /> : <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))] shrink-0" />}
                    <span className="flex-1">{m.label}</span>
                    <span className="font-bold">{m.value}</span>
                    <span className="text-[7px] text-muted-foreground">{m.target}</span>
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Recent Activity" icon={<Activity className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { time: '30 min ago', action: 'Carlos Diaz requested custom offer', type: 'request' },
                { time: '2 hours ago', action: 'Offer sent to Jordan Kim', type: 'sent' },
                { time: '5 hours ago', action: 'Alex Morgan revised offer for Marcus Lane', type: 'revision' },
                { time: '1 day ago', action: 'Priya Mehta accepted SEO offer', type: 'accept' },
                { time: '6 days ago', action: 'Emma Wilson declined video offer', type: 'decline' },
              ].map((e, i) => (
                <div key={i} className="flex items-center gap-2 text-[8px]">
                  <div className={cn('h-1.5 w-1.5 rounded-full shrink-0',
                    e.type === 'accept' ? 'bg-[hsl(var(--state-healthy))]' :
                    e.type === 'decline' ? 'bg-[hsl(var(--state-blocked))]' :
                    e.type === 'revision' ? 'bg-[hsl(var(--state-caution))]' : 'bg-accent'
                  )} />
                  <span className="text-muted-foreground w-16 shrink-0">{e.time}</span>
                  <span className="flex-1">{e.action}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Mobile Sticky CTA ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        {selected ? (
          <>
            <div className="flex-1 min-w-0">
              <div className="text-[8px] text-muted-foreground truncate">{selected.title}</div>
              <div className="text-[11px] font-bold">${selected.total.toLocaleString()}</div>
            </div>
            {(selected.status === 'sent' || selected.status === 'revised') && (
              <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-5" onClick={() => setAcceptConfirm(true)}><CheckCircle2 className="h-3.5 w-3.5" />Accept</Button>
            )}
            {selected.status === 'requested' && (
              <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-5" onClick={() => setCreateDrawer(true)}><Send className="h-3.5 w-3.5" />Send Offer</Button>
            )}
          </>
        ) : (
          <>
            <div className="flex-1"><span className="text-[10px] font-semibold">{OFFERS.length} Offers</span></div>
            <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-5" onClick={() => setCreateDrawer(true)}><Plus className="h-3.5 w-3.5" />New Offer</Button>
          </>
        )}
      </div>

      {/* ── Create / Send Offer Drawer ── */}
      <Sheet open={createDrawer} onOpenChange={setCreateDrawer}>
        <SheetContent className="w-[480px] sm:w-[520px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Create Custom Offer</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div>
              <label className="text-[9px] font-medium mb-1 block">Offer Title</label>
              <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px] focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Custom logo design for..." value={newTitle} onChange={e => setNewTitle(e.target.value)} />
            </div>

            <div>
              <label className="text-[9px] font-medium mb-1 block">Line Items</label>
              <div className="space-y-1.5">
                {newItems.map((item, i) => (
                  <div key={i} className="flex gap-1.5 items-start">
                    <input className="flex-1 h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Description..." value={item.description} onChange={e => setNewItems(prev => prev.map((it, idx) => idx === i ? { ...it, description: e.target.value } : it))} />
                    <input type="number" className="w-12 h-7 rounded-xl border bg-background px-1.5 text-[9px] text-center" placeholder="Qty" min={1} value={item.qty} onChange={e => setNewItems(prev => prev.map((it, idx) => idx === i ? { ...it, qty: Number(e.target.value) } : it))} />
                    <div className="relative">
                      <span className="absolute left-1.5 top-1/2 -translate-y-1/2 text-[8px] text-muted-foreground">$</span>
                      <input type="number" className="w-16 h-7 rounded-xl border bg-background pl-4 pr-1.5 text-[9px]" placeholder="Rate" min={0} value={item.rate || ''} onChange={e => setNewItems(prev => prev.map((it, idx) => idx === i ? { ...it, rate: Number(e.target.value) } : it))} />
                    </div>
                    {newItems.length > 1 && <button className="mt-1.5 text-muted-foreground hover:text-destructive" onClick={() => setNewItems(prev => prev.filter((_, idx) => idx !== i))}><X className="h-3 w-3" /></button>}
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5" onClick={() => setNewItems(prev => [...prev, { description: '', qty: 1, rate: 0 }])}><Plus className="h-2.5 w-2.5" />Add Item</Button>
                <span className="text-[10px] font-bold">Total: ${newTotal}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[9px] font-medium mb-1 block">Delivery</label>
                <select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" value={newDelivery} onChange={e => setNewDelivery(e.target.value)}>
                  {['3 days', '5 days', '7 days', '10 days', '14 days', '21 days', '30 days'].map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-medium mb-1 block">Revisions</label>
                <select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" value={newRevisions} onChange={e => setNewRevisions(Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 8, -1].map(r => <option key={r} value={r}>{r === -1 ? 'Unlimited' : r}</option>)}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[9px] font-medium mb-1 block">Message to Buyer</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[9px] resize-none focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Describe the scope and what's included..." value={newMessage} onChange={e => setNewMessage(e.target.value)} />
            </div>

            <div className="rounded-2xl border p-2.5 bg-muted/20">
              <div className="flex items-center gap-1.5 text-[9px] mb-1"><Shield className="h-3 w-3 text-accent" /><span className="font-medium">Offer terms</span></div>
              <ul className="space-y-0.5 text-[8px] text-muted-foreground">
                <li>• Offer expires in 7 days</li>
                <li>• Payment is escrow-protected</li>
                <li>• Buyer can request up to 3 revisions of the offer</li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setCreateDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" disabled={!newTitle || newTotal === 0} onClick={() => { setCreateDrawer(false); toast.success('Offer sent!'); }}><Send className="h-3 w-3" />Send Offer</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Revise Offer Drawer ── */}
      <Sheet open={reviseDrawer} onOpenChange={setReviseDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Request Revision</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-3">
              <div className="rounded-2xl border p-2.5">
                <div className="text-[10px] font-semibold mb-1">{selected.title}</div>
                <div className="text-[9px] text-muted-foreground">Current total: ${selected.total} · {selected.delivery} · v{selected.version}</div>
              </div>

              <div>
                <label className="text-[9px] font-medium mb-1 block">What would you like changed?</label>
                <textarea className="w-full h-24 rounded-xl border bg-background px-3 py-2 text-[9px] resize-none focus:ring-2 focus:ring-ring focus:outline-none" placeholder="Describe the changes you'd like to the scope, pricing, or delivery..." />
              </div>

              <div className="rounded-2xl border border-[hsl(var(--state-caution))]/20 bg-[hsl(var(--state-caution))]/5 p-2.5">
                <div className="flex items-center gap-1.5 text-[9px]"><AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))]" /><span className="font-medium">Revision limits</span></div>
                <p className="text-[8px] text-muted-foreground mt-0.5">You can request up to 3 revisions per offer. This would be revision {selected.version + 1} of 3.</p>
              </div>

              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setReviseDrawer(false)}>Cancel</Button>
                <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setReviseDrawer(false); toast.success('Revision requested'); }}><RefreshCw className="h-3 w-3" />Submit Revision</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Detail Inspector ── */}
      <Sheet open={detailInspector} onOpenChange={setDetailInspector}>
        <SheetContent className="w-[520px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Offer Inspection</SheetTitle></SheetHeader>
          {selected && (
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <StatusBadge status={STATUS_CFG[selected.status].badge} label={STATUS_CFG[selected.status].label} />
                {selected.version > 1 && <Badge variant="outline" className="text-[7px] rounded-lg">v{selected.version}</Badge>}
                {selected.priceMatch && <Badge className="text-[6px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] rounded-lg">Price Matched</Badge>}
              </div>
              <h3 className="text-[12px] font-bold">{selected.title}</h3>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-2xl border p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px]">{selected.buyer.avatar}</AvatarFallback></Avatar>
                    <div><div className="text-[9px] font-medium">{selected.buyer.name}</div><div className="text-[7px] text-muted-foreground">Buyer</div></div>
                  </div>
                </div>
                <div className="rounded-2xl border p-2.5">
                  <div className="flex items-center gap-2 mb-1">
                    <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{selected.seller.avatar}</AvatarFallback></Avatar>
                    <div><div className="text-[9px] font-medium flex items-center gap-0.5">{selected.seller.name}{selected.seller.verified && <CheckCircle2 className="h-2.5 w-2.5 text-accent" />}</div><div className="text-[7px] text-muted-foreground">Seller</div></div>
                  </div>
                </div>
              </div>

              {selected.items.length > 0 && (
                <div className="rounded-2xl border overflow-hidden">
                  <table className="w-full text-[9px]">
                    <thead className="bg-muted/30"><tr><th className="text-left p-2 font-medium">Item</th><th className="text-center p-2 font-medium w-12">Qty</th><th className="text-right p-2 font-medium w-16">Rate</th><th className="text-right p-2 font-medium w-16">Total</th></tr></thead>
                    <tbody>
                      {selected.items.map((item, i) => (
                        <tr key={i} className="border-t"><td className="p-2">{item.description}</td><td className="text-center p-2">{item.qty}</td><td className="text-right p-2">${item.rate}</td><td className="text-right p-2 font-medium">${item.qty * item.rate}</td></tr>
                      ))}
                      <tr className="border-t bg-muted/10 font-semibold"><td className="p-2">Total</td><td /><td /><td className="text-right p-2">${selected.total.toLocaleString()}</td></tr>
                    </tbody>
                  </table>
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl border p-2 text-center"><div className="text-[7px] text-muted-foreground">Delivery</div><div className="text-[10px] font-bold">{selected.delivery || 'TBD'}</div></div>
                <div className="rounded-2xl border p-2 text-center"><div className="text-[7px] text-muted-foreground">Revisions</div><div className="text-[10px] font-bold">{selected.revisions || '—'}</div></div>
                <div className="rounded-2xl border p-2 text-center"><div className="text-[7px] text-muted-foreground">Expires</div><div className="text-[10px] font-bold">{selected.expires}</div></div>
              </div>

              {/* Negotiation Thread */}
              <div>
                <div className="text-[10px] font-semibold mb-1.5">Negotiation Thread</div>
                <div className="space-y-1.5">
                  {selected.messages.map(m => (
                    <div key={m.id} className={cn('rounded-2xl border p-2.5', m.role === 'seller' ? 'bg-accent/5 border-accent/10' : 'bg-card')}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <Avatar className="h-4 w-4"><AvatarFallback className="text-[5px]">{m.avatar}</AvatarFallback></Avatar>
                        <span className="text-[9px] font-medium">{m.actor}</span>
                        <Badge variant="secondary" className="text-[6px] px-1 rounded-lg">{m.role}</Badge>
                        <span className="text-[7px] text-muted-foreground ml-auto">{m.timestamp}</span>
                      </div>
                      <p className="text-[9px] text-muted-foreground">{m.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ── Compare Drawer ── */}
      <Sheet open={compareDrawer} onOpenChange={setCompareDrawer}>
        <SheetContent className="w-[600px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4 text-accent" />Compare Offers ({compareOffers.length})</SheetTitle></SheetHeader>
          <div className="p-4">
            {compareOffers.length === 0 ? (
              <div className="text-center py-8">
                <Scale className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                <div className="text-[11px] font-semibold">No offers selected</div>
                <div className="text-[9px] text-muted-foreground">Use the checkboxes to add offers for comparison</div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead><tr className="border-b"><th className="text-left py-2 pr-2 text-muted-foreground font-medium">Attribute</th>{compareOffers.map(o => <th key={o.id} className="py-2 px-2 text-center font-medium min-w-[120px]">{o.title.slice(0, 25)}...</th>)}</tr></thead>
                  <tbody>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Status</td>{compareOffers.map(o => <td key={o.id} className="py-1.5 px-2 text-center"><StatusBadge status={STATUS_CFG[o.status].badge} label={STATUS_CFG[o.status].label} /></td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Total</td>{compareOffers.map(o => <td key={o.id} className="py-1.5 px-2 text-center font-bold">${o.total.toLocaleString()}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Delivery</td>{compareOffers.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.delivery || 'TBD'}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Revisions</td>{compareOffers.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.revisions || '—'}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Items</td>{compareOffers.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.items.length}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Version</td>{compareOffers.map(o => <td key={o.id} className="py-1.5 px-2 text-center">v{o.version}</td>)}</tr>
                    <tr className="border-b"><td className="py-1.5 pr-2 text-muted-foreground">Seller</td>{compareOffers.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.seller.name}</td>)}</tr>
                    <tr><td className="py-1.5 pr-2 text-muted-foreground">Price Match</td>{compareOffers.map(o => <td key={o.id} className="py-1.5 px-2 text-center">{o.priceMatch ? `$${o.priceMatch.matchedPrice}` : '—'}</td>)}</tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* ── Accept Confirmation ── */}
      {acceptConfirm && selected && (
        <div className="fixed inset-0 z-[100]" onClick={() => setAcceptConfirm(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative flex justify-center items-start pt-[15vh] px-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-sm bg-card rounded-3xl border shadow-2xl overflow-hidden p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-[hsl(var(--state-healthy))]/10 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="h-6 w-6 text-[hsl(var(--state-healthy))]" />
              </div>
              <h2 className="text-sm font-bold mb-1">Accept This Offer?</h2>
              <p className="text-[10px] text-muted-foreground mb-3">You're about to accept an offer for <strong>${selected.total}</strong> from <strong>{selected.seller.name}</strong>.</p>
              <div className="rounded-2xl bg-muted/20 p-3 mb-4 text-left space-y-1 text-[9px]">
                <div className="flex justify-between"><span className="text-muted-foreground">Total</span><span className="font-bold">${selected.total.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="font-medium">{selected.delivery}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Revisions</span><span className="font-medium">{selected.revisions}</span></div>
              </div>
              <div className="rounded-2xl border border-accent/20 bg-accent/5 p-2 mb-4">
                <div className="flex items-center gap-1.5 text-[9px]"><Shield className="h-3 w-3 text-accent" /><span className="font-medium">Payment will be held in escrow until delivery is approved.</span></div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setAcceptConfirm(false)}>Cancel</Button>
                <Button size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setAcceptConfirm(false); toast.success('Offer accepted! Order created.'); }}>
                  <CheckCircle2 className="h-3 w-3" />Accept & Pay
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Decline Confirmation ── */}
      {declineConfirm && selected && (
        <div className="fixed inset-0 z-[100]" onClick={() => setDeclineConfirm(false)}>
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
          <div className="relative flex justify-center items-start pt-[15vh] px-4" onClick={e => e.stopPropagation()}>
            <div className="w-full max-w-sm bg-card rounded-3xl border shadow-2xl overflow-hidden p-6 text-center">
              <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center mx-auto mb-3">
                <XCircle className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-sm font-bold mb-1">Decline This Offer?</h2>
              <p className="text-[10px] text-muted-foreground mb-3">This will notify the seller that you've declined. You can still request a new offer later.</p>
              <div>
                <label className="text-[9px] font-medium mb-1 block text-left">Reason (optional)</label>
                <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-[9px] resize-none focus:ring-2 focus:ring-ring focus:outline-none mb-3" placeholder="e.g. Budget too high, found another seller..." />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8 text-[10px] flex-1 rounded-xl" onClick={() => setDeclineConfirm(false)}>Cancel</Button>
                <Button variant="destructive" size="sm" className="h-8 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setDeclineConfirm(false); toast.info('Offer declined'); }}>
                  <XCircle className="h-3 w-3" />Decline
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default OffersPage;
