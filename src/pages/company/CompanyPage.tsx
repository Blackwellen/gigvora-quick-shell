import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, MapPin, Globe, Users, Briefcase, Star, CheckCircle2,
  Heart, MessageSquare, Share2, MoreHorizontal, BookmarkPlus,
  ExternalLink, Calendar, TrendingUp, Shield, Clock, Eye,
  Flag, Lock, AlertTriangle, Sparkles, ArrowRight,
  ThumbsUp, MessageCircle, Plus, Edit, FileText, Camera,
  Save, X, Zap, Award, GraduationCap, Bookmark,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type CompanyTab = 'about' | 'jobs' | 'posts' | 'reviews' | 'people' | 'services';

const COMPANY_TABS: { id: CompanyTab; label: string; icon: React.ElementType }[] = [
  { id: 'about', label: 'About', icon: Building2 },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'services', label: 'Services', icon: Zap },
  { id: 'posts', label: 'Posts', icon: FileText },
  { id: 'reviews', label: 'Reviews', icon: Star },
  { id: 'people', label: 'People', icon: Users },
];

/* ── Mock Data ── */
const MOCK_COMPANY = {
  name: 'Vortex Technologies',
  tagline: 'Building the future of distributed computing',
  industry: 'Cloud Infrastructure',
  size: '500–1,000',
  founded: '2018',
  headquarters: 'San Francisco, CA',
  website: 'https://vortex.tech',
  logo: '',
  verified: true,
  hiring: true,
  followers: 12400,
  rating: 4.7,
  reviewCount: 186,
  about: 'Vortex Technologies is a leading cloud infrastructure company building next-generation distributed computing platforms. Our mission is to make scalable, resilient systems accessible to every engineering team. We serve over 2,000 enterprise clients across 40 countries, powering critical workloads from financial services to healthcare.\n\nOur culture prioritizes engineering excellence, open collaboration, and sustainable growth. We believe the best products come from diverse teams with deep autonomy.',
  specialties: ['Cloud Infrastructure', 'Distributed Systems', 'Kubernetes', 'Edge Computing', 'DevOps', 'Platform Engineering'],
  benefits: ['Remote-first', 'Unlimited PTO', 'Health & dental', 'Equity', 'Learning budget', '401(k) match'],
  techStack: ['Go', 'Rust', 'TypeScript', 'Kubernetes', 'Terraform', 'PostgreSQL'],
  values: ['Engineering Excellence', 'Radical Transparency', 'Customer Obsession', 'Sustainable Growth'],
};

const MOCK_JOBS = [
  { id: '1', title: 'Senior Platform Engineer', location: 'Remote', type: 'Full-time', salary: '$180K–$220K', posted: '2d ago', applicants: 42, urgent: true },
  { id: '2', title: 'Product Designer', location: 'San Francisco, CA', type: 'Full-time', salary: '$150K–$190K', posted: '5d ago', applicants: 78, urgent: false },
  { id: '3', title: 'DevRel Engineer', location: 'Remote', type: 'Full-time', salary: '$140K–$175K', posted: '1w ago', applicants: 31, urgent: false },
  { id: '4', title: 'Staff Backend Engineer', location: 'New York, NY', type: 'Full-time', salary: '$200K–$260K', posted: '3d ago', applicants: 55, urgent: true },
  { id: '5', title: 'Technical Writer', location: 'Remote', type: 'Contract', salary: '$90K–$120K', posted: '2w ago', applicants: 19, urgent: false },
];

const MOCK_SERVICES = [
  { id: '1', title: 'Cloud Migration Assessment', price: 'From $5,000', rating: 4.9, reviews: 42, deliveryTime: '2–4 weeks' },
  { id: '2', title: 'Kubernetes Architecture Review', price: 'From $3,500', rating: 4.8, reviews: 28, deliveryTime: '1–2 weeks' },
  { id: '3', title: 'DevOps Pipeline Setup', price: 'From $8,000', rating: 4.7, reviews: 35, deliveryTime: '3–6 weeks' },
];

const MOCK_POSTS = [
  { id: '1', title: 'Announcing Vortex Edge 2.0', excerpt: "We're thrilled to launch Edge 2.0 with sub-10ms latency across 200+ global PoPs...", date: '2d ago', likes: 342, comments: 48 },
  { id: '2', title: 'How We Scaled to 1M Concurrent Connections', excerpt: 'A deep-dive into the architecture decisions that powered our latest milestone...', date: '1w ago', likes: 891, comments: 127 },
  { id: '3', title: 'Joining the CNCF as a Silver Member', excerpt: "We're excited to deepen our commitment to the cloud-native ecosystem...", date: '2w ago', likes: 215, comments: 33 },
];

const MOCK_REVIEWS = [
  { author: 'Former Employee', role: 'Senior Engineer', rating: 5, date: 'Mar 2025', title: 'Best engineering culture', text: 'Incredible autonomy, strong technical leadership, and real impact on the product. Remote-first done right.', pros: 'Engineering culture, compensation, growth', cons: 'Fast pace can be intense' },
  { author: 'Current Employee', role: 'Product Manager', rating: 4, date: 'Feb 2025', title: 'Great product team', text: 'Collaborative PM culture with real ownership. Leadership is accessible and supportive.', pros: 'Product ownership, transparent leadership', cons: 'Some processes still maturing' },
  { author: 'Former Contractor', role: 'Designer', rating: 4, date: 'Jan 2025', title: 'Solid design practice', text: 'Good design systems, fast iteration cycles. Contract experience was positive overall.', pros: 'Design maturity, tooling', cons: 'Contractor integration could improve' },
];

const MOCK_PEOPLE = [
  { name: 'Sarah Chen', role: 'CEO & Co-founder', connected: true, badge: 'Founder' },
  { name: 'Marcus Webb', role: 'CTO & Co-founder', connected: false, badge: 'Founder' },
  { name: 'Priya Sharma', role: 'VP Engineering', connected: true, badge: 'Leadership' },
  { name: 'David Kim', role: 'Head of Design', connected: false, badge: 'Leadership' },
  { name: 'Elena Rodriguez', role: 'Head of Talent', connected: false, badge: 'Hiring' },
];

const VERIFICATION_CHECKS = [
  { label: 'Business Verified', done: true, icon: Shield },
  { label: 'Domain Verified', done: true, icon: Globe },
  { label: 'Background Checked', done: false, icon: FileText },
  { label: 'Payment Verified', done: true, icon: CheckCircle2 },
];

/* ═══════════════════════════════════════════════════════════
   Edit Drawer
   ═══════════════════════════════════════════════════════════ */
const CompanyEditDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [saving, setSaving] = useState(false);
  const handleSave = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose(); toast.success('Company page updated'); }, 800); };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold">Edit Company Page</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-xl font-bold text-accent">VT</div>
            <div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Camera className="h-3 w-3" />Change Logo</Button>
              <p className="text-[9px] text-muted-foreground mt-1">SVG, PNG or JPG. Max 2MB.</p>
            </div>
          </div>
          {[
            { label: 'Company Name', placeholder: 'Vortex Technologies' },
            { label: 'Tagline', placeholder: 'Building the future of...' },
            { label: 'Industry', placeholder: 'Cloud Infrastructure' },
            { label: 'Headquarters', placeholder: 'San Francisco, CA' },
            { label: 'Website', placeholder: 'https://...' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[11px] font-semibold mb-1.5 block">{f.label}</label>
              <input defaultValue={f.placeholder} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
            </div>
          ))}
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">About</label>
            <Textarea defaultValue={MOCK_COMPANY.about} rows={5} className="rounded-xl text-[11px]" />
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
const ArchivedBanner: React.FC = () => (
  <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3.5 flex items-center gap-3 mb-3">
    <div className="h-8 w-8 rounded-xl bg-[hsl(var(--state-caution)/0.1)] flex items-center justify-center shrink-0"><AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))]" /></div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Archived Company</div>
      <div className="text-[10px] text-muted-foreground">This company page is no longer actively maintained. Information may be outdated.</div>
    </div>
  </div>
);

const LimitedDataBanner: React.FC = () => (
  <div className="rounded-2xl border border-muted bg-muted/20 p-3.5 flex items-center gap-3 mb-3">
    <div className="h-8 w-8 rounded-xl bg-muted/30 flex items-center justify-center shrink-0"><Lock className="h-4 w-4 text-muted-foreground" /></div>
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Limited Public Data</div>
      <div className="text-[10px] text-muted-foreground">This company hasn't completed their profile. Some sections may be unavailable.</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const CompanyPage: React.FC = () => {
  const { slug } = useParams();
  const { activeRole } = useRole();
  const isManager = activeRole === 'enterprise';
  const [activeTab, setActiveTab] = useState<CompanyTab>('about');
  const [following, setFollowing] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [jobFilter, setJobFilter] = useState<'all' | 'remote' | 'onsite'>('all');

  const c = MOCK_COMPANY;
  const initials = c.name.split(' ').map(w => w[0]).join('').slice(0, 2);

  const filteredJobs = useMemo(() => {
    if (jobFilter === 'all') return MOCK_JOBS;
    if (jobFilter === 'remote') return MOCK_JOBS.filter(j => j.location === 'Remote');
    return MOCK_JOBS.filter(j => j.location !== 'Remote');
  }, [jobFilter]);

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Building2 className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Company</span>
        {c.verified && <Badge variant="secondary" className="text-[8px] h-4 rounded-lg"><CheckCircle2 className="h-2.5 w-2.5 mr-0.5" />Verified</Badge>}
        {c.hiring && <StatusBadge status="live" label="Hiring" />}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-7 text-[9px] rounded-xl" variant={following ? 'secondary' : 'default'} onClick={() => { setFollowing(!following); toast.success(following ? 'Unfollowed' : 'Following'); }}>
          <Heart className={cn('h-2.5 w-2.5 mr-1', following && 'fill-current')} />{following ? 'Following' : 'Follow'}
        </Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-2.5 w-2.5" />Contact</Button>
        {isManager && <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setEditOpen(true)}><Edit className="h-2.5 w-2.5" />Manage</Button>}
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={() => setShowActions(true)}><MoreHorizontal className="h-3.5 w-3.5" /></Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Followers" value={c.followers.toLocaleString()} change="+340" trend="up" className="!rounded-2xl" />
        <KPICard label="Open Roles" value={MOCK_JOBS.length} change="2 urgent" trend="up" className="!rounded-2xl" />
      </div>

      <SectionCard title="Company Facts" className="!rounded-2xl">
        <div className="space-y-1.5 text-[10px]">
          {[
            { label: 'Industry', value: c.industry },
            { label: 'Size', value: `${c.size} employees` },
            { label: 'Founded', value: c.founded },
            { label: 'Headquarters', value: c.headquarters },
          ].map(f => (
            <div key={f.label} className="flex justify-between">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-semibold">{f.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Tech Stack" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {c.techStack.map(t => <Badge key={t} variant="secondary" className="text-[8px] h-4 rounded-lg">{t}</Badge>)}
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

      <SectionCard title="Similar Companies" subtitle="AI-matched" className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { name: 'CloudScale Inc.', industry: 'Cloud · 200-500', match: 92 },
            { name: 'NebulaSys', industry: 'Infrastructure · 100-200', match: 88 },
            { name: 'Horizon Labs', industry: 'DevTools · 50-100', match: 85 },
          ].map(sc => (
            <div key={sc.name} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 cursor-pointer transition-all duration-200 group">
              <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent transition-transform group-hover:scale-105">{sc.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate group-hover:text-accent transition-colors">{sc.name}</div>
                <div className="text-[8px] text-muted-foreground">{sc.industry}</div>
              </div>
              <Badge variant="secondary" className="text-[7px] h-3.5 shrink-0 rounded-lg">{sc.match}%</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5 text-accent" />Company Analytics</span>
        <span className="text-[10px] text-muted-foreground">Last 30 days</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Page Views', value: '8,432' },
          { label: 'Job Views', value: '3,291' },
          { label: 'Applications', value: '247' },
          { label: 'Followers Gained', value: '340' },
          { label: 'Avg. Time on Page', value: '2m 18s' },
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
        <div className="h-36 bg-gradient-to-r from-primary via-primary/80 to-accent relative overflow-hidden">
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
              {c.verified && (
                <div className="absolute -bottom-0.5 -right-0.5 h-5 w-5 rounded-full bg-[hsl(var(--state-healthy))] flex items-center justify-center ring-2 ring-card">
                  <CheckCircle2 className="h-3 w-3 text-white" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0 pb-1">
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold truncate">{c.name}</h1>
              </div>
              <p className="text-[12px] text-muted-foreground">{c.tagline}</p>
              <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground flex-wrap">
                <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.headquarters}</span>
                <span className="flex items-center gap-0.5"><Users className="h-3 w-3" />{c.size}</span>
                <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-accent text-accent" />{c.rating} ({c.reviewCount})</span>
                <a href={c.website} target="_blank" rel="noopener" className="flex items-center gap-0.5 text-accent hover:underline"><Globe className="h-3 w-3" />Website</a>
              </div>
            </div>
          </div>

          <div className="flex gap-1.5 mt-3">
            <Badge className="bg-accent/10 text-accent text-[8px] h-5 rounded-xl">{c.industry}</Badge>
            {c.hiring && <Badge variant="secondary" className="text-[8px] h-5 rounded-xl bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]">Actively Hiring</Badge>}
            <Badge variant="secondary" className="text-[8px] h-5 rounded-xl">{c.followers.toLocaleString()} followers</Badge>
          </div>

          {/* Visitor CTA row */}
          {!isManager && (
            <div className="flex gap-2 mt-3">
              <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1.5" variant={following ? 'secondary' : 'default'} onClick={() => { setFollowing(!following); toast.success(following ? 'Unfollowed' : 'Following'); }}>
                <Heart className={cn('h-3 w-3', following && 'fill-current')} />{following ? 'Following' : 'Follow'}
              </Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1.5"><MessageSquare className="h-3 w-3" />Contact</Button>
              <Button variant="outline" size="sm" className="h-8 text-[10px] rounded-xl gap-1.5"><Briefcase className="h-3 w-3" />View Jobs</Button>
              <Button variant="ghost" size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Share2 className="h-3 w-3" /></Button>
            </div>
          )}
        </div>
      </div>

      {/* ── TAB NAV ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
        {COMPANY_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
            {t.id === 'jobs' && <span className="text-[8px] ml-0.5">({MOCK_JOBS.length})</span>}
          </button>
        ))}
      </div>

      {/* ── ABOUT TAB ── */}
      {activeTab === 'about' && (
        <div className="space-y-3">
          <SectionCard title="About" className="!rounded-2xl">
            <p className="text-[11px] text-muted-foreground leading-relaxed whitespace-pre-line">{c.about}</p>
          </SectionCard>

          <SectionCard title="Specialties" className="!rounded-2xl">
            <div className="flex flex-wrap gap-1.5">
              {c.specialties.map(s => <Badge key={s} variant="secondary" className="text-[9px] py-1 px-2.5 rounded-xl hover:bg-accent/10 hover:text-accent cursor-pointer transition-all">{s}</Badge>)}
            </div>
          </SectionCard>

          <SectionCard title="Company Values" className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              {c.values.map((v, i) => (
                <div key={v} className="flex items-center gap-2 p-2.5 rounded-xl border hover:bg-muted/20 transition-colors">
                  <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Sparkles className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <span className="text-[10px] font-medium">{v}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Benefits & Perks" className="!rounded-2xl">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-1.5">
              {c.benefits.map(b => (
                <div key={b} className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl bg-accent/5 text-[9px] hover:bg-accent/10 transition-colors">
                  <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />
                  <span className="font-medium">{b}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title={`Life at ${c.name}`} className="!rounded-2xl">
            <div className="grid grid-cols-3 gap-2.5">
              {[1, 2, 3].map(i => (
                <div key={i} className="aspect-video rounded-2xl bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center group cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                  <FileText className="h-5 w-5 text-muted-foreground/30 group-hover:text-muted-foreground/50 transition-colors" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── JOBS TAB ── */}
      {activeTab === 'jobs' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(['all', 'remote', 'onsite'] as const).map(f => (
                <button key={f} onClick={() => setJobFilter(f)} className={cn(
                  'px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all duration-200',
                  jobFilter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}>{f === 'all' ? 'All' : f === 'remote' ? 'Remote' : 'On-site'}</button>
              ))}
            </div>
            <div className="flex-1" />
            <span className="text-[10px] text-muted-foreground">{filteredJobs.length} positions</span>
          </div>

          <div className="space-y-1.5">
            {filteredJobs.map(job => (
              <div key={job.id} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <Briefcase className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{job.title}</span>
                    {job.urgent && <Badge className="text-[7px] h-3.5 rounded-lg bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]">Urgent</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{job.location}</span>
                    <span>{job.type}</span>
                    <span className="font-medium text-foreground/70">{job.salary}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[9px] text-muted-foreground">{job.posted}</div>
                  <div className="text-[8px] text-muted-foreground">{job.applicants} applicants</div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Apply</Button>
              </div>
            ))}
          </div>

          {filteredJobs.length === 0 && (
            <div className="text-center py-10 rounded-2xl border">
              <Briefcase className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <div className="text-[11px] font-medium">No positions match this filter</div>
              <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl mt-2" onClick={() => setJobFilter('all')}>Show all jobs</Button>
            </div>
          )}
        </div>
      )}

      {/* ── SERVICES TAB ── */}
      {activeTab === 'services' && (
        <SectionCard title="Services & Offerings" className="!rounded-2xl">
          <div className="space-y-2">
            {MOCK_SERVICES.map(s => (
              <div key={s.id} className="flex items-center gap-3 p-3 rounded-2xl border hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                  <Zap className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{s.title}</div>
                  <div className="flex items-center gap-2 text-[9px] text-muted-foreground mt-0.5">
                    <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 fill-accent text-accent" />{s.rating}</span>
                    <span>({s.reviews} reviews)</span>
                    <span><Clock className="h-2.5 w-2.5 inline mr-0.5" />{s.deliveryTime}</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[10px] font-bold">{s.price}</div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity shrink-0">View</Button>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── POSTS TAB ── */}
      {activeTab === 'posts' && (
        <SectionCard title="Company Updates" className="!rounded-2xl" action={isManager ? <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl gap-1"><Plus className="h-2.5 w-2.5" />New Post</Button> : undefined}>
          <div className="space-y-2">
            {MOCK_POSTS.map(post => (
              <div key={post.id} className="p-3 rounded-2xl border hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
                <div className="text-[11px] font-semibold mb-0.5 group-hover:text-accent transition-colors">{post.title}</div>
                <p className="text-[10px] text-muted-foreground line-clamp-2">{post.excerpt}</p>
                <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><ThumbsUp className="h-2.5 w-2.5" />{post.likes}</span>
                  <span className="flex items-center gap-0.5"><MessageCircle className="h-2.5 w-2.5" />{post.comments}</span>
                  <span>{post.date}</span>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div className="space-y-3">
          <SectionCard title="Employer Rating" className="!rounded-2xl">
            <div className="flex items-center gap-4 mb-3.5 pb-3.5 border-b">
              <div className="text-center">
                <div className="text-2xl font-bold">{c.rating}</div>
                <div className="flex gap-0.5 mt-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={cn('h-3 w-3', i < Math.round(c.rating) ? 'fill-accent text-accent' : 'text-muted')} />)}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{c.reviewCount} reviews</div>
              </div>
              <div className="flex-1 space-y-0.5">
                {[5, 4, 3, 2, 1].map(star => {
                  const pct = star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : star === 2 ? 3 : 2;
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
                    <div className="text-[10px] font-semibold">{r.author} · {r.role}</div>
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

      {/* ── PEOPLE TAB ── */}
      {activeTab === 'people' && (
        <SectionCard title="Key People" className="!rounded-2xl">
          <div className="space-y-1.5">
            {MOCK_PEOPLE.map(p => (
              <div key={p.name} className="flex items-center gap-2.5 p-2.5 rounded-2xl border hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
                <Avatar className="h-9 w-9 ring-2 ring-muted/50 transition-transform group-hover:scale-105"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{p.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{p.name}</span>
                    <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">{p.badge}</Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground">{p.role}</div>
                </div>
                {p.connected ? (
                  <Badge variant="secondary" className="text-[8px] h-5 rounded-xl">Connected</Badge>
                ) : (
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Plus className="h-2.5 w-2.5" />Connect</Button>
                )}
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Actions Sheet */}
      <Sheet open={showActions} onOpenChange={setShowActions}>
        <SheetContent className="w-[340px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm font-bold">Company Actions</SheetTitle></SheetHeader>
          <div className="p-3 space-y-0.5">
            {[
              { icon: Share2, label: 'Share Company' },
              { icon: BookmarkPlus, label: 'Save to List' },
              { icon: Flag, label: 'Report Company' },
              { icon: ExternalLink, label: 'Visit Website' },
              { icon: Calendar, label: 'Schedule Meeting' },
              { icon: Bookmark, label: 'Add to Watchlist' },
            ].map(a => (
              <button key={a.label} className="flex items-center gap-2.5 w-full px-3 py-2 rounded-xl text-[11px] hover:bg-muted/50 transition-colors" onClick={() => { toast.info(a.label); setShowActions(false); }}>
                <a.icon className="h-3.5 w-3.5 text-muted-foreground" />{a.label}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Drawer */}
      <CompanyEditDrawer open={editOpen} onClose={() => setEditOpen(false)} />
    </DashboardLayout>
  );
};

export default CompanyPage;
