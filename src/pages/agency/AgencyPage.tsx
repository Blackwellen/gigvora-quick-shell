import React, { useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, MapPin, Globe, Users, Star, CheckCircle2,
  Heart, MessageSquare, Share2, MoreHorizontal, BookmarkPlus,
  ExternalLink, TrendingUp, Shield, Eye, Calendar,
  Flag, AlertTriangle, ArrowRight, Bookmark,
  ThumbsUp, MessageCircle, Plus, Edit, FileText,
  Layers, Award, Briefcase, Clock, Zap, Camera, Save,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';
import {
  useAgency, useAgencyServices, useAgencyTeam, useAgencyCaseStudies,
  useAgencyReviews, useAgencyFollow, useUpdateAgency,
  agencyEnabled,
} from '@/hooks/useAgency';


/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type AgencyTab = 'about' | 'services' | 'team' | 'case-studies' | 'reviews' | 'projects';

const AGENCY_TABS: { id: AgencyTab; label: string; icon: React.ElementType }[] = [
  { id: 'about', label: 'About', icon: Layers },
  { id: 'services', label: 'Services', icon: Zap },
  { id: 'projects', label: 'Projects', icon: Briefcase },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'case-studies', label: 'Case Studies', icon: FileText },
  { id: 'reviews', label: 'Reviews', icon: Star },
];

const MOCK_AGENCY = {
  name: 'Apex Digital Studio',
  tagline: 'Full-stack product design and engineering for ambitious startups',
  industry: 'Digital Agency',
  size: '25–50',
  founded: '2019',
  headquarters: 'Austin, TX',
  website: 'https://apexdigital.studio',
  verified: true,
  accepting: true,
  followers: 3200,
  rating: 4.8,
  reviewCount: 94,
  completedProjects: 187,
  about: "Apex Digital Studio is a boutique product agency specialising in end-to-end design and engineering for early-stage and growth-stage startups. We partner with founders to ship MVPs, scale platforms, and build design systems that last.\n\nOur team blends deep technical expertise with strategic product thinking. We've helped over 40 companies raise follow-on funding after launch, and our client retention rate exceeds 85%.",
  specialties: ['Product Design', 'React / Next.js', 'Mobile (React Native)', 'Design Systems', 'Brand Identity', 'Growth Engineering'],
  languages: ['English', 'Spanish', 'Portuguese'],
  engagement: ['Project-based', 'Retainer', 'Staff augmentation', 'Fractional CTO'],
  values: ['Founder-First', 'Craft Over Speed', 'Radical Ownership', 'Ship & Iterate'],
};

const MOCK_SERVICES = [
  { id: '1', name: 'Product Design Sprint', description: 'Five-day design sprint from problem framing to validated prototype.', price: '$15K–$25K', duration: '1 week', popular: true },
  { id: '2', name: 'MVP Development', description: 'End-to-end build from wireframe to production-ready launch.', price: '$40K–$80K', duration: '6–12 weeks', popular: true },
  { id: '3', name: 'Design System Build', description: 'Component library, tokens, documentation, and Figma kit.', price: '$20K–$35K', duration: '4–8 weeks', popular: false },
  { id: '4', name: 'Staff Augmentation', description: 'Embedded senior engineers and designers for your team.', price: '$12K–$18K/mo', duration: 'Ongoing', popular: false },
  { id: '5', name: 'Growth Engineering', description: 'Conversion optimisation, analytics, and experiment infrastructure.', price: '$8K–$15K/mo', duration: 'Ongoing', popular: false },
];

const MOCK_PROJECTS = [
  { id: '1', title: 'E-commerce Platform Rebuild', client: 'RetailNow', status: 'Active', budget: '$65K', progress: 72 },
  { id: '2', title: 'SaaS Dashboard MVP', client: 'MetricFlow', status: 'Completed', budget: '$48K', progress: 100 },
  { id: '3', title: 'Mobile Banking App', client: 'FinVault', status: 'Active', budget: '$82K', progress: 45 },
];

const MOCK_TEAM = [
  { name: 'Jordan Lee', role: 'Founder & Creative Director', skills: ['Strategy', 'Design', 'Leadership'], available: true, badge: 'Founder' },
  { name: 'Maya Torres', role: 'Lead Engineer', skills: ['React', 'TypeScript', 'Node.js'], available: true, badge: 'Lead' },
  { name: 'Alex Nguyen', role: 'Senior Product Designer', skills: ['UI/UX', 'Figma', 'Research'], available: false, badge: 'Senior' },
  { name: 'Sam Patel', role: 'Full-Stack Developer', skills: ['Next.js', 'PostgreSQL', 'AWS'], available: true, badge: 'Mid' },
  { name: 'Chris Walker', role: 'Mobile Engineer', skills: ['React Native', 'iOS', 'Android'], available: false, badge: 'Senior' },
  { name: 'Dana Kim', role: 'Brand Strategist', skills: ['Branding', 'Copywriting', 'Go-to-market'], available: true, badge: 'Senior' },
];

const MOCK_CASE_STUDIES = [
  { id: '1', title: 'FinVault — Neobank MVP', client: 'FinVault Inc.', outcome: 'Launched in 10 weeks, raised $4.2M Seed', tags: ['Fintech', 'MVP', 'React Native'], views: '1.2K' },
  { id: '2', title: 'GreenGrid — Energy Dashboard', client: 'GreenGrid Energy', outcome: '3x user engagement after redesign', tags: ['CleanTech', 'Dashboard', 'Design System'], views: '890' },
  { id: '3', title: 'Luma Health — Patient Portal', client: 'Luma Health', outcome: 'HIPAA-compliant portal serving 50K patients', tags: ['HealthTech', 'Compliance', 'Next.js'], views: '2.1K' },
  { id: '4', title: 'TradeLoop — Marketplace Rebuild', client: 'TradeLoop', outcome: '40% conversion lift, 2s faster load', tags: ['Marketplace', 'Performance', 'Growth'], views: '645' },
];

const MOCK_REVIEWS = [
  { author: 'Emily Chen', company: 'FinVault Inc.', rating: 5, date: 'Mar 2025', title: 'Exceptional execution', text: 'Apex delivered our MVP ahead of schedule with outstanding quality. The team felt like an extension of our own.', pros: 'Speed, communication, technical depth', cons: 'Wish they had more capacity' },
  { author: 'David Park', company: 'GreenGrid Energy', rating: 5, date: 'Feb 2025', title: 'Design excellence', text: 'The design system they built is still serving us two years later. Truly world-class design thinking.', pros: 'Design quality, documentation', cons: 'Premium pricing' },
  { author: 'Rachel Morris', company: 'Luma Health', rating: 4, date: 'Jan 2025', title: 'Reliable partner', text: 'Navigated complex compliance requirements with ease. Strong project management throughout.', pros: 'Compliance expertise, PM discipline', cons: 'Onboarding took a bit long' },
];

const VERIFICATION_CHECKS = [
  { label: 'Business Verified', done: true, icon: Shield },
  { label: 'Portfolio Verified', done: true, icon: FileText },
  { label: 'Payment Secured', done: true, icon: CheckCircle2 },
  { label: 'NDA on File', done: false, icon: Globe },
];

/* ═══════════════════════════════════════════════════════════
   Edit Drawer
   ═══════════════════════════════════════════════════════════ */
const AgencyEditDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [saving, setSaving] = useState(false);
  const handleSave = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose(); toast.success('Agency page updated'); }, 800); };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold">Edit Agency Page</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-xl font-bold text-accent">AD</div>
            <div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Camera className="h-3 w-3" />Change Logo</Button>
              <p className="text-[9px] text-muted-foreground mt-1">SVG, PNG or JPG. Max 2MB.</p>
            </div>
          </div>
          {[
            { label: 'Agency Name', placeholder: 'Apex Digital Studio' },
            { label: 'Tagline', placeholder: 'Full-stack product design...' },
            { label: 'Industry', placeholder: 'Digital Agency' },
            { label: 'Headquarters', placeholder: 'Austin, TX' },
            { label: 'Website', placeholder: 'https://...' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[11px] font-semibold mb-1.5 block">{f.label}</label>
              <input defaultValue={f.placeholder} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
            </div>
          ))}
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">About</label>
            <Textarea defaultValue={MOCK_AGENCY.about} rows={5} className="rounded-xl text-[11px]" />
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="sm" className="rounded-xl text-[10px]" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="rounded-xl text-[10px] gap-1" onClick={handleSave} disabled={saving}><Save className="h-3 w-3" />{saving ? 'Saving...' : 'Save Changes'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   State Banners — rounded-2xl
   ═══════════════════════════════════════════════════════════ */
const PausedBanner: React.FC = () => (
  <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3.5 flex items-center gap-3 mb-3">
    <div className="h-8 w-8 rounded-xl bg-[hsl(var(--state-caution)/0.1)] flex items-center justify-center shrink-0"><AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))]" /></div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Agency Paused</div>
      <div className="text-[10px] text-muted-foreground">This agency is not currently accepting new projects.</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const AgencyPage: React.FC = () => {
  const { slug } = useParams();
  const { activeRole } = useRole();
  const isManager = activeRole === 'enterprise';
  const [activeTab, setActiveTab] = useState<AgencyTab>('about');
  const [following, setFollowing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [serviceFilter, setServiceFilter] = useState<'all' | 'popular'>('all');

  // Live envelopes (Domain 13). When the API base isn't configured,
  // `agencyEnabled` is false and queries are disabled — UI stays on mocks.
  const { data: liveAgency, isLoading: agencyLoading, isError: agencyError } = useAgency(slug);
  const { data: liveServices } = useAgencyServices(liveAgency?.id);
  const { data: liveTeam }     = useAgencyTeam(liveAgency?.id);
  const { data: liveCases }    = useAgencyCaseStudies(liveAgency?.id);
  const { data: liveReviews }  = useAgencyReviews(liveAgency?.id);
  const followMutation         = useAgencyFollow(liveAgency?.id);
  const updateMutation         = useUpdateAgency(liveAgency?.id);

  // Adapter: live envelope → existing UI shape. Falls back to MOCK_AGENCY
  // when no API or while loading so the journey is always renderable.
  const a = useMemo(() => {
    if (!liveAgency) return MOCK_AGENCY;
    return {
      ...MOCK_AGENCY,
      name:               liveAgency.name,
      tagline:            liveAgency.tagline ?? MOCK_AGENCY.tagline,
      industry:           liveAgency.industry ?? MOCK_AGENCY.industry,
      size:               liveAgency.size ?? MOCK_AGENCY.size,
      founded:            liveAgency.founded ?? MOCK_AGENCY.founded,
      headquarters:       liveAgency.headquarters ?? MOCK_AGENCY.headquarters,
      website:            liveAgency.website ?? MOCK_AGENCY.website,
      verified:           liveAgency.verified,
      accepting:          liveAgency.acceptingProjects,
      followers:          liveAgency.followerCount,
      rating:             liveAgency.ratingAvg / 100,
      reviewCount:        liveAgency.ratingCount,
      completedProjects:  liveAgency.completedProjects,
      about:              liveAgency.about ?? MOCK_AGENCY.about,
      specialties:        liveAgency.specialties.length ? liveAgency.specialties : MOCK_AGENCY.specialties,
      languages:          liveAgency.languages.length ? liveAgency.languages : MOCK_AGENCY.languages,
      engagement:         liveAgency.engagementModels.length ? liveAgency.engagementModels : MOCK_AGENCY.engagement,
      values:             liveAgency.values.length ? liveAgency.values : MOCK_AGENCY.values,
    };
  }, [liveAgency]);

  const initials = a.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  const services = useMemo(() => {
    if (liveServices?.items?.length) {
      return liveServices.items.map(s => ({
        id: s.id, name: s.name, description: s.description ?? '',
        price: s.priceFromCents != null
          ? `$${(s.priceFromCents/100).toLocaleString()}${s.priceToCents ? `–$${(s.priceToCents/100).toLocaleString()}` : ''}`
          : '—',
        duration: s.duration ?? '—',
        popular: s.popular,
      }));
    }
    return MOCK_SERVICES;
  }, [liveServices]);

  const filteredServices = useMemo(() => {
    if (serviceFilter === 'all') return services;
    return services.filter(s => s.popular);
  }, [serviceFilter, services]);

  // Side effects: follow / unfollow against the live envelope when available.
  const onFollowToggle = () => {
    const next = !following;
    setFollowing(next);
    if (agencyEnabled && liveAgency?.id) {
      followMutation.mutate(next, {
        onError: () => { setFollowing(!next); toast.error('Could not update follow state'); },
      });
    }
  };


  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Layers className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Agency</span>
        {a.verified && <Badge variant="secondary" className="text-[8px] h-4 rounded-lg"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Verified</Badge>}
        {a.accepting && <StatusBadge status="live" label="Accepting Projects" />}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Award className="h-2.5 w-2.5" />Request Proposal</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
        {isManager && <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setEditOpen(true)}><Edit className="h-2.5 w-2.5" />Manage</Button>}
        <Button variant={following ? 'secondary' : 'ghost'} size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={() => { setFollowing(!following); toast.success(following ? 'Unfollowed' : 'Following'); }}>
          <Heart className={cn('h-3 w-3', following && 'fill-current')} />
        </Button>
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={() => setShowActions(true)}><MoreHorizontal className="h-3.5 w-3.5" /></Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Projects Done" value={a.completedProjects} change="+12 this Q" trend="up" className="!rounded-2xl" />
        <KPICard label="Avg. Rating" value={a.rating} change={`${a.reviewCount} reviews`} trend="up" className="!rounded-2xl" />
      </div>

      <SectionCard title="Agency Facts" className="!rounded-2xl">
        <div className="space-y-1.5 text-[10px]">
          {[
            { label: 'Type', value: a.industry },
            { label: 'Team Size', value: `${a.size} people` },
            { label: 'Founded', value: a.founded },
            { label: 'Location', value: a.headquarters },
            { label: 'Languages', value: a.languages.join(', ') },
          ].map(f => (
            <div key={f.label} className="flex justify-between">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-semibold text-right">{f.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Engagement Models" className="!rounded-2xl">
        <div className="space-y-1">
          {a.engagement.map(e => (
            <div key={e} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-accent/5 text-[9px] hover:bg-accent/10 transition-colors">
              <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />
              <span className="font-medium">{e}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Trust & Verification" className="!rounded-2xl">
        <div className="space-y-1">
          {VERIFICATION_CHECKS.map(v => (
            <div key={v.label} className={cn('flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] transition-colors', v.done ? 'bg-[hsl(var(--state-healthy)/0.05)]' : 'bg-muted/30')}>
              <v.icon className={cn('h-3 w-3', v.done ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground/40')} />
              <span className={v.done ? 'font-medium' : 'text-muted-foreground'}>{v.label}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Similar Agencies" subtitle="AI-matched" className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { name: 'Pixel Forge', focus: 'Product Design · 15–30', match: 91 },
            { name: 'LaunchPad Dev', focus: 'MVP Studio · 10–25', match: 87 },
            { name: 'Mosaic Creative', focus: 'Brand + Dev · 20–40', match: 83 },
          ].map(sa => (
            <div key={sa.name} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 cursor-pointer transition-all duration-200 group">
              <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent transition-transform group-hover:scale-105">{sa.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate group-hover:text-accent transition-colors">{sa.name}</div>
                <div className="text-[8px] text-muted-foreground">{sa.focus}</div>
              </div>
              <Badge variant="secondary" className="text-[7px] h-3.5 shrink-0 rounded-lg">{sa.match}%</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section (manager-only analytics) ── */
  const bottomSection = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-accent" />Agency Analytics</span>
        <span className="text-[10px] text-muted-foreground">Last 30 days</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Page Views', value: '4,218' },
          { label: 'Service Views', value: '1,847' },
          { label: 'Inquiries', value: '23' },
          { label: 'Proposals Sent', value: '8' },
          { label: 'Conversion', value: '34.8%' },
        ].map(s => (
          <div key={s.label} className="text-center rounded-2xl border p-3 hover:shadow-sm transition-shadow">
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[9px] text-muted-foreground mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={isManager ? bottomSection : undefined}>
      {/* ── BRAND HERO ── */}
      <div className="mb-4 rounded-3xl overflow-hidden border shadow-sm">
        <div className="h-36 bg-gradient-to-r from-accent via-primary/70 to-primary relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
          {isManager && (
            <button className="absolute bottom-2.5 right-2.5 h-7 px-2.5 rounded-xl bg-background/80 backdrop-blur-sm text-[9px] font-medium flex items-center gap-1 hover:bg-background transition-all shadow-sm">
              <Camera className="h-3 w-3" /> Edit cover
            </button>
          )}
        </div>

        <div className="bg-card px-5 pb-5 relative">
          <div className="flex items-end gap-4 -mt-10">
            <div className="relative">
              <div className="h-20 w-20 rounded-2xl border-4 border-card shadow-lg bg-card flex items-center justify-center">
                <span className="text-xl font-bold text-accent">{initials}</span>
              </div>
              {a.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[hsl(var(--state-healthy))] flex items-center justify-center ring-2 ring-card">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold truncate">{a.name}</h1>
              </div>
              <p className="text-[12px] text-muted-foreground">{a.tagline}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{a.headquarters}</span>
                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{a.size}</span>
                <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" />{a.rating} ({a.reviewCount})</span>
                <a href={a.website} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-accent hover:underline"><Globe className="h-3 w-3" />Website</a>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 mt-3">
            <Badge className="bg-accent/10 text-accent text-[8px] h-5 rounded-xl">{a.industry}</Badge>
            {a.accepting && <Badge variant="secondary" className="text-[8px] h-5 rounded-xl bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]">Accepting Projects</Badge>}
            <Badge variant="secondary" className="text-[8px] h-5 rounded-xl">{a.completedProjects} projects completed</Badge>
            <Badge variant="secondary" className="text-[8px] h-5 rounded-xl">{a.followers.toLocaleString()} followers</Badge>
          </div>

          {/* Visitor CTA row */}
          {!isManager && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1.5"><Award className="h-3 w-3" />Request Proposal</Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1.5"><MessageSquare className="h-3 w-3" />Message</Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1.5" onClick={() => { setFollowing(!following); toast.success(following ? 'Unfollowed' : 'Following'); }}>
                <Heart className={cn('h-3 w-3', following && 'fill-current')} />{following ? 'Following' : 'Follow'}
              </Button>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Share2 className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
        {AGENCY_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
            {t.id === 'services' && <span className="text-[8px] ml-0.5">({MOCK_SERVICES.length})</span>}
            {t.id === 'team' && <span className="text-[8px] ml-0.5">({MOCK_TEAM.length})</span>}
          </button>
        ))}
      </div>

      {/* ── ABOUT TAB ── */}
      {activeTab === 'about' && (
        <div className="space-y-3">
          <SectionCard title="About" className="!rounded-2xl">
            <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">{a.about}</p>
          </SectionCard>

          <SectionCard title="Capabilities" className="!rounded-2xl">
            <div className="flex flex-wrap gap-1.5">
              {a.specialties.map(s => <Badge key={s} variant="secondary" className="text-[9px] py-1 px-2.5 rounded-xl hover:bg-accent/10 hover:text-accent cursor-pointer transition-all">{s}</Badge>)}
            </div>
          </SectionCard>

          <SectionCard title="Agency Values" className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              {a.values.map(v => (
                <div key={v} className="flex items-center gap-2 p-2.5 rounded-xl border hover:bg-muted/20 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Zap className="h-3.5 w-3.5 text-accent" /></div>
                  <span className="text-[10px] font-medium">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Highlight Numbers */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label: 'Projects Completed', value: '187', icon: Briefcase },
              { label: 'Client Retention', value: '85%', icon: Heart },
              { label: 'Avg. Delivery', value: '8 weeks', icon: Clock },
            ].map(h => (
              <div key={h.label} className="rounded-2xl border bg-card p-3.5 text-center hover:shadow-sm transition-shadow">
                <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-2"><h.icon className="h-4 w-4 text-accent" /></div>
                <div className="text-sm font-bold">{h.value}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{h.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── SERVICES TAB ── */}
      {activeTab === 'services' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['all', 'popular'] as const).map(f => (
                <button key={f} onClick={() => setServiceFilter(f)} className={cn(
                  'px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all duration-200',
                  serviceFilter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}>{f === 'all' ? 'All Services' : 'Popular'}</button>
              ))}
            </div>
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground">{filteredServices.length} services</span>
          </div>

          <div className="space-y-2">
            {filteredServices.map(svc => (
              <div key={svc.id} className="rounded-2xl border p-3.5 hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
                <div className="flex items-start justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105"><Zap className="h-4 w-4 text-accent" /></div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{svc.name}</span>
                        {svc.popular && <Badge className="text-[7px] h-3.5 rounded-lg bg-accent/10 text-accent">Popular</Badge>}
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{svc.description}</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-2 pl-11">
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{svc.price}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{svc.duration}</span>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">Inquire</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PROJECTS TAB ── */}
      {activeTab === 'projects' && (
        <SectionCard title="Active & Recent Projects" className="!rounded-2xl">
          <div className="space-y-2">
            {MOCK_PROJECTS.map(proj => (
              <div key={proj.id} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <Briefcase className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{proj.title}</span>
                    <Badge variant="secondary" className={cn('text-[7px] h-3.5 rounded-lg', proj.status === 'Active' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted')}>{proj.status}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span>{proj.client}</span>
                    <span className="font-medium text-foreground/70">{proj.budget}</span>
                  </div>
                </div>
                <div className="w-16 shrink-0">
                  <div className="text-[9px] text-right text-muted-foreground mb-0.5">{proj.progress}%</div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${proj.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── TEAM TAB ── */}
      {activeTab === 'team' && (
        <SectionCard title="Team Members" className="!rounded-2xl">
          <div className="space-y-1.5">
            {MOCK_TEAM.map(m => (
              <div key={m.name} className="flex items-center gap-2.5 p-2.5 rounded-2xl border hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
                <Avatar className="h-9 w-9 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
                  <AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{m.name}</span>
                    {m.available ? (
                      <div className="h-2.5 w-2.5 rounded-full bg-[hsl(var(--state-healthy))] ring-2 ring-card" title="Available" />
                    ) : (
                      <div className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30 ring-2 ring-card" title="Unavailable" />
                    )}
                    <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">{m.badge}</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground">{m.role}</div>
                  <div className="flex gap-1 mt-0.5">
                    {m.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px] h-3.5 rounded-lg">{s}</Badge>)}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl shrink-0 gap-0.5"><Plus className="h-2.5 w-2.5" />Connect</Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── CASE STUDIES TAB ── */}
      {activeTab === 'case-studies' && (
        <SectionCard title="Case Studies" className="!rounded-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {MOCK_CASE_STUDIES.map(cs => (
              <div key={cs.id} className="rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group">
                <div className="aspect-[2/1] bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center relative">
                  <FileText className="h-6 w-6 text-muted-foreground/20" />
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/5 transition-colors flex items-center justify-center">
                    <ExternalLink className="h-4 w-4 text-foreground/0 group-hover:text-foreground/60 transition-all" />
                  </div>
                </div>
                <div className="p-3">
                  <div className="text-[11px] font-semibold mb-0.5 group-hover:text-accent transition-colors">{cs.title}</div>
                  <div className="text-[9px] text-muted-foreground mb-1.5">{cs.client}</div>
                  <div className="flex items-center gap-1 mb-2">
                    <Zap className="h-2.5 w-2.5 text-accent shrink-0" />
                    <span className="text-[9px] font-medium text-accent">{cs.outcome}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex gap-1">{cs.tags.map(t => <Badge key={t} variant="secondary" className="text-[7px] h-3.5 rounded-lg">{t}</Badge>)}</div>
                    <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{cs.views}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          <SectionCard title="Client Rating" className="!rounded-2xl">
            <div className="flex items-center gap-4 mb-3.5 pb-3.5 border-b">
              <div className="text-center">
                <div className="text-2xl font-bold">{a.rating}</div>
                <div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={cn('h-3 w-3', i < Math.round(a.rating) ? 'fill-accent text-accent' : 'text-muted')} />)}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{a.reviewCount} reviews</div>
              </div>
              <div className="flex-1 space-y-0.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const pct = star === 5 ? 65 : star === 4 ? 25 : star === 3 ? 7 : star === 2 ? 2 : 1;
                  return (
                    <div key={star} className="flex items-center gap-1.5 text-[9px]">
                      <span className="w-2">{star}</span>
                      <Star className="h-2.5 w-2.5 text-accent" />
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-accent rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          </SectionCard>

          <div className="space-y-2">
            {MOCK_REVIEWS.map((r, i) => (
              <div key={i} className="rounded-2xl border p-3.5 hover:shadow-sm transition-shadow">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Avatar className="h-7 w-7 ring-2 ring-muted/50"><AvatarFallback className="text-[8px] bg-muted font-bold">{r.author[0]}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="text-[10px] font-semibold">{r.author} · {r.company}</div>
                    <div className="text-[8px] text-muted-foreground">{r.date}</div>
                  </div>
                  <div className="flex gap-0.5">{[...Array(5)].map((_, j) => <Star key={j} className={cn('h-2.5 w-2.5', j < r.rating ? 'fill-accent text-accent' : 'text-muted')} />)}</div>
                </div>
                <div className="text-[11px] font-semibold mb-0.5">{r.title}</div>
                <p className="text-[10px] text-muted-foreground mb-2">{r.text}</p>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="rounded-xl bg-[hsl(var(--state-healthy)/0.05)] p-2"><span className="text-[hsl(var(--state-healthy))] font-semibold">Pros:</span> <span className="text-muted-foreground">{r.pros}</span></div>
                  <div className="rounded-xl bg-[hsl(var(--state-blocked)/0.05)] p-2"><span className="text-[hsl(var(--state-blocked))] font-semibold">Cons:</span> <span className="text-muted-foreground">{r.cons}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions Sheet */}
      <Sheet open={showActions} onOpenChange={setShowActions}>
        <SheetContent className="w-[340px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm font-bold">Agency Actions</SheetTitle></SheetHeader>
          <div className="p-3 space-y-0.5">
            {[
              { icon: Share2, label: 'Share Agency' },
              { icon: BookmarkPlus, label: 'Save to List' },
              { icon: Flag, label: 'Report Agency' },
              { icon: ExternalLink, label: 'Visit Website' },
              { icon: Award, label: 'Request Proposal' },
              { icon: Bookmark, label: 'Add to Watchlist' },
              { icon: Calendar, label: 'Schedule Meeting' },
            ].map(act => (
              <button key={act.label} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[11px] hover:bg-muted/50 transition-colors" onClick={() => { toast.info(act.label); setShowActions(false); }}>
                <act.icon className="h-3.5 w-3.5 text-muted-foreground" />{act.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Drawer */}
      <AgencyEditDrawer open={editOpen} onClose={() => setEditOpen(false)} />
    </DashboardLayout>
  );
};

export default AgencyPage;
