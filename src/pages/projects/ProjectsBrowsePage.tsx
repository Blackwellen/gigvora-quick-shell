import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, KPIBand, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, FilterDefinition, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { cn } from '@/lib/utils';
import {
  Search, FileText, DollarSign, Clock, Users, Plus, Star, MapPin,
  Briefcase, BookmarkPlus, Bookmark, Eye, Send, BarChart3, TrendingUp,
  Globe, Layers, Shield, AlertTriangle, ExternalLink, X, CheckCircle2,
  Building2, Zap, Mail, SlidersHorizontal, ArrowUpDown, Grid3X3,
  List, Sparkles, Target, Heart, RefreshCw, ChevronDown, Copy,
  type LucideIcon,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

const PROJECT_FILTERS: FilterDefinition[] = [
  { id: 'category', label: 'Category', type: 'multi-select', group: 'Project', options: [
    { value: 'Web Dev', label: 'Web Dev', count: 320 }, { value: 'Mobile', label: 'Mobile', count: 180 },
    { value: 'AI/ML', label: 'AI / ML', count: 220 }, { value: 'Design', label: 'Design', count: 280 },
    { value: 'Data', label: 'Data', count: 150 }, { value: 'DevOps', label: 'DevOps', count: 90 },
    { value: 'Content', label: 'Content', count: 200 }, { value: 'Marketing', label: 'Marketing', count: 170 },
  ], defaultOpen: true },
  { id: 'budgetRange', label: 'Budget Range', type: 'range', group: 'Budget', min: 0, max: 100000, step: 1000, unit: '$' },
  { id: 'pricingType', label: 'Pricing Type', type: 'single-select', group: 'Budget', options: [
    { value: 'fixed', label: 'Fixed Price' }, { value: 'hourly', label: 'Hourly' },
  ]},
  { id: 'level', label: 'Experience Level', type: 'multi-select', group: 'Requirements', options: [
    { value: 'entry', label: 'Entry Level' }, { value: 'intermediate', label: 'Intermediate' },
    { value: 'expert', label: 'Expert' },
  ]},
  { id: 'duration', label: 'Duration', type: 'single-select', group: 'Requirements', options: [
    { value: '1w', label: '< 1 Week' }, { value: '1m', label: '1 Month' },
    { value: '3m', label: '1-3 Months' }, { value: '6m', label: '3-6 Months' },
    { value: '6m+', label: '6+ Months' },
  ]},
  { id: 'skills', label: 'Skills', type: 'multi-select', group: 'Requirements', options: [
    { value: 'react', label: 'React' }, { value: 'node', label: 'Node.js' },
    { value: 'python', label: 'Python' }, { value: 'figma', label: 'Figma' },
    { value: 'typescript', label: 'TypeScript' }, { value: 'aws', label: 'AWS' },
    { value: 'sql', label: 'SQL' }, { value: 'shopify', label: 'Shopify' },
  ]},
  { id: 'location', label: 'Location', type: 'multi-select', group: 'Location', options: [
    { value: 'remote', label: 'Remote' }, { value: 'us', label: 'US Only' },
    { value: 'eu', label: 'Europe' }, { value: 'global', label: 'Global' },
  ]},
  { id: 'fundingStatus', label: 'Funding Status', type: 'multi-select', group: 'Client', options: [
    { value: 'funded', label: 'Funded' }, { value: 'escrow-held', label: 'Escrow Held' },
    { value: 'unfunded', label: 'Unfunded' },
  ]},
  { id: 'clientVerified', label: 'Verified Client Only', type: 'toggle', group: 'Client' },
  { id: 'proposalCount', label: 'Max Proposals', type: 'range', group: 'Competition', min: 0, max: 100, step: 5 },
  { id: 'matchScore', label: 'Min Match Score', type: 'range', group: 'Competition', min: 0, max: 100, step: 5 },
  { id: 'visibility', label: 'Visibility', type: 'single-select', group: 'Project', options: [
    { value: 'public', label: 'Public' }, { value: 'invite-only', label: 'Invite Only' },
  ]},
  { id: 'status', label: 'Status', type: 'multi-select', group: 'Project', options: [
    { value: 'open', label: 'Open' }, { value: 'closing-soon', label: 'Closing Soon' },
    { value: 'awarded', label: 'Awarded' }, { value: 'closed', label: 'Closed' },
  ]},
  { id: 'postedWithin', label: 'Posted Within', type: 'single-select', group: 'Project', options: [
    { value: '24h', label: 'Last 24 Hours' }, { value: '3d', label: 'Last 3 Days' },
    { value: '7d', label: 'Last 7 Days' }, { value: '30d', label: 'Last 30 Days' },
  ]},
];

/* ═══════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════ */
type BrowseTab = 'recommended' | 'all' | 'saved' | 'invited' | 'compare';
type PricingType = 'all' | 'fixed' | 'hourly';
type ViewMode = 'cards' | 'table';
type SortKey = 'match' | 'newest' | 'budget-high' | 'budget-low' | 'proposals';

interface Project {
  id: string; title: string; client: string; clientAvatar: string; clientVerified: boolean;
  description: string; budget: string; budgetNum: number; pricingType: 'fixed' | 'hourly';
  duration: string; skills: string[]; proposals: number; postedAt: string;
  location: string; matchScore: number; saved: boolean; invited: boolean;
  status: 'open' | 'closing-soon' | 'closed' | 'awarded'; level: 'entry' | 'intermediate' | 'expert';
  category: string; fundingStatus: 'funded' | 'unfunded' | 'escrow-held';
  visibility: 'public' | 'invite-only';
}

const CATEGORIES = ['All', 'Web Dev', 'Mobile', 'AI/ML', 'Design', 'Data', 'DevOps', 'Content'];
const LEVEL_LABELS: Record<Project['level'], string> = { entry: 'Entry', intermediate: 'Mid', expert: 'Expert' };
const FUNDING_CFG: Record<Project['fundingStatus'], { label: string; color: string }> = {
  funded: { label: 'Funded', color: 'text-[hsl(var(--state-healthy))]' },
  'escrow-held': { label: 'Escrow Held', color: 'text-accent' },
  unfunded: { label: 'Unfunded', color: 'text-[hsl(var(--state-caution))]' },
};

const MOCK_PROJECTS: Project[] = [
  { id:'p1', title:'SaaS Platform Development — React + Node', client:'TechVentures Inc.', clientAvatar:'TV', clientVerified:true, description:'Full-stack SaaS platform with user management, billing integration, analytics dashboard, and multi-tenant architecture. Looking for experienced full-stack developer.', budget:'$25K – $35K', budgetNum:30000, pricingType:'fixed', duration:'3 months', skills:['React','Node.js','PostgreSQL','Stripe'], proposals:12, postedAt:'2 days ago', location:'Remote', matchScore:95, saved:false, invited:false, status:'open', level:'expert', category:'Web Dev', fundingStatus:'funded', visibility:'public' },
  { id:'p2', title:'Mobile App Redesign — iOS & Android', client:'HealthFirst', clientAvatar:'HF', clientVerified:true, description:'Complete redesign of existing health tracking app. New UI/UX, improved onboarding, dark mode support, and accessibility compliance.', budget:'$80–$120/hr', budgetNum:100, pricingType:'hourly', duration:'6 weeks', skills:['React Native','Figma','UI/UX','Accessibility'], proposals:23, postedAt:'1 day ago', location:'US Only', matchScore:88, saved:true, invited:false, status:'open', level:'intermediate', category:'Mobile', fundingStatus:'escrow-held', visibility:'public' },
  { id:'p3', title:'E-Commerce Migration to Headless Architecture', client:'RetailPro', clientAvatar:'RP', clientVerified:false, description:'Migrate legacy Magento e-commerce platform to modern headless architecture using Next.js and Shopify backend. 50K+ SKU catalog.', budget:'$15K – $20K', budgetNum:17500, pricingType:'fixed', duration:'2 months', skills:['Shopify','Next.js','API Integration'], proposals:8, postedAt:'4 days ago', location:'Remote', matchScore:72, saved:false, invited:false, status:'closing-soon', level:'expert', category:'Web Dev', fundingStatus:'funded', visibility:'public' },
  { id:'p4', title:'AI Chatbot Integration for Customer Support', client:'SupportAI Labs', clientAvatar:'SA', clientVerified:true, description:'Build and integrate an AI-powered customer support chatbot with knowledge base, escalation workflows, and analytics.', budget:'$5K – $8K', budgetNum:6500, pricingType:'fixed', duration:'3 weeks', skills:['Python','OpenAI','React','NLP'], proposals:19, postedAt:'6 hours ago', location:'Remote', matchScore:91, saved:false, invited:true, status:'open', level:'intermediate', category:'AI/ML', fundingStatus:'funded', visibility:'invite-only' },
  { id:'p5', title:'Brand Identity & Website for Fintech Startup', client:'PayFlow', clientAvatar:'PF', clientVerified:true, description:'Complete brand identity including logo, color system, typography, and marketing website design and development.', budget:'$40–$70/hr', budgetNum:55, pricingType:'hourly', duration:'4 weeks', skills:['Branding','Figma','Webflow','Copywriting'], proposals:31, postedAt:'3 days ago', location:'Remote', matchScore:65, saved:true, invited:false, status:'open', level:'entry', category:'Design', fundingStatus:'unfunded', visibility:'public' },
  { id:'p6', title:'Data Pipeline & Dashboard for Analytics Platform', client:'DataMetrics', clientAvatar:'DM', clientVerified:true, description:'Build ETL pipelines and real-time analytics dashboard. Integrate with multiple data sources including Snowflake and BigQuery.', budget:'$30K – $45K', budgetNum:37500, pricingType:'fixed', duration:'4 months', skills:['Python','SQL','Snowflake','React','D3.js'], proposals:5, postedAt:'12 hours ago', location:'Remote', matchScore:83, saved:false, invited:true, status:'open', level:'expert', category:'Data', fundingStatus:'escrow-held', visibility:'invite-only' },
  { id:'p7', title:'WordPress Plugin Development', client:'ContentHub', clientAvatar:'CH', clientVerified:false, description:'Custom WordPress plugin for content scheduling, SEO optimization, and multi-site management.', budget:'$3K – $5K', budgetNum:4000, pricingType:'fixed', duration:'2 weeks', skills:['PHP','WordPress','MySQL'], proposals:42, postedAt:'5 days ago', location:'Remote', matchScore:45, saved:false, invited:false, status:'closed', level:'entry', category:'Web Dev', fundingStatus:'funded', visibility:'public' },
  { id:'p8', title:'DevOps Infrastructure Modernization', client:'CloudScale', clientAvatar:'CS', clientVerified:true, description:'Migrate from on-premise infrastructure to Kubernetes-based cloud deployment with CI/CD, monitoring, and auto-scaling.', budget:'$20K – $30K', budgetNum:25000, pricingType:'fixed', duration:'2 months', skills:['Kubernetes','Docker','Terraform','AWS'], proposals:7, postedAt:'1 day ago', location:'Remote', matchScore:79, saved:false, invited:false, status:'open', level:'expert', category:'DevOps', fundingStatus:'funded', visibility:'public' },
];

/* ═══════════════════════════════════════════════════════════
   Proposal Modal
   ═══════════════════════════════════════════════════════════ */
const ProposalModal: React.FC<{ open: boolean; onClose: () => void; project?: Project }> = ({ open, onClose, project }) => {
  const [step, setStep] = useState<'details' | 'pricing' | 'review'>('details');
  if (!open || !project) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[6vh] px-4">
        <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">Submit Proposal</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          <div className="px-6 pt-4">
            <div className="flex items-center gap-2 mb-4">
              {(['details','pricing','review'] as const).map((s, i) => (
                <React.Fragment key={s}>
                  <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors',
                    step === s ? 'border-accent bg-accent text-accent-foreground' : i < ['details','pricing','review'].indexOf(step) ? 'border-accent bg-accent/10 text-accent' : 'border-muted text-muted-foreground'
                  )}>{i+1}</div>
                  {i < 2 && <div className={cn('flex-1 h-0.5', i < ['details','pricing','review'].indexOf(step) ? 'bg-accent' : 'bg-muted')} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            {step === 'details' && (<>
              <div className="rounded-2xl bg-muted/30 p-3 text-[10px]">
                <div className="font-medium text-xs mb-1">{project.title}</div>
                <div className="text-muted-foreground">{project.client} · {project.budget} · {project.duration}</div>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Cover Letter *</label>
                <textarea className="w-full h-28 rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" placeholder="Explain why you're a great fit..." /></div>
              <div><label className="text-xs font-medium mb-1 block">Relevant Experience</label>
                <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" placeholder="Links to similar work..." /></div>
            </>)}
            {step === 'pricing' && (<>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-medium mb-1 block">Your {project.pricingType === 'hourly' ? 'Rate' : 'Bid'} *</label>
                  <input className="w-full h-9 rounded-xl border bg-background px-3 text-sm" placeholder={project.pricingType === 'hourly' ? '$85/hr' : '$28,000'} /></div>
                <div><label className="text-xs font-medium mb-1 block">Estimated Timeline *</label>
                  <input className="w-full h-9 rounded-xl border bg-background px-3 text-sm" placeholder={project.duration} /></div>
              </div>
              <div><label className="text-xs font-medium mb-1 block">Milestones (optional)</label>
                <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-sm resize-none" placeholder="Key deliverables..." /></div>
              <div><label className="text-xs font-medium mb-1 block">Attachments</label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 transition-colors">
                  <FileText className="h-5 w-5 mx-auto mb-1" />Click or drag to attach files</div></div>
            </>)}
            {step === 'review' && (
              <div className="space-y-3">
                <div className="rounded-xl border p-3 bg-muted/30 text-xs space-y-1.5">
                  {[{ l:'Project', v:project.title },{ l:'Client', v:project.client },{ l:'Your Bid', v:'—' },{ l:'Timeline', v:'—' }].map(r => (
                    <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
                  ))}
                </div>
                <div className="rounded-xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-2 text-[10px]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" />
                  <span>Once submitted, your proposal will be visible to the client. You can withdraw within 24 hours.</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between px-6 py-4 border-t">
            {step !== 'details' ? <Button variant="outline" onClick={() => setStep(step === 'review' ? 'pricing' : 'details')}>Back</Button> : <div />}
            {step === 'review' ? (
              <Button onClick={() => { toast.success('Proposal submitted!'); onClose(); }}><Send className="h-3 w-3 mr-1" />Submit Proposal</Button>
            ) : (
              <Button onClick={() => setStep(step === 'details' ? 'pricing' : 'review')}>Continue</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Compare Drawer
   ═══════════════════════════════════════════════════════════ */
const CompareDrawer: React.FC<{ projects: Project[]; onClose: () => void; onRemove: (id: string) => void }> = ({ projects, onClose, onRemove }) => (
  <Sheet open={projects.length > 0} onOpenChange={() => onClose()}>
    <SheetContent className="w-[600px] sm:max-w-[600px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4 text-accent" />Compare Projects ({projects.length})</SheetTitle></SheetHeader>
      <div className="p-5">
        {projects.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-8">Select projects to compare</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-3 font-semibold text-muted-foreground w-24">Attribute</th>
                  {projects.map(p => (
                    <th key={p.id} className="text-left py-2 px-2 font-semibold min-w-[140px]">
                      <div className="flex items-center gap-1">
                        <span className="truncate">{p.title.slice(0, 25)}...</span>
                        <Button variant="ghost" size="sm" className="h-4 w-4 p-0 shrink-0" onClick={() => onRemove(p.id)}><X className="h-2.5 w-2.5" /></Button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { label: 'Client', get: (p: Project) => <div className="flex items-center gap-1">{p.client}{p.clientVerified && <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />}</div> },
                  { label: 'Budget', get: (p: Project) => <span className="font-semibold">{p.budget}</span> },
                  { label: 'Type', get: (p: Project) => <Badge variant="secondary" className="text-[7px]">{p.pricingType}</Badge> },
                  { label: 'Duration', get: (p: Project) => p.duration },
                  { label: 'Match', get: (p: Project) => <span className={cn('font-bold', p.matchScore >= 80 ? 'text-[hsl(var(--state-healthy))]' : p.matchScore >= 60 ? 'text-accent' : 'text-muted-foreground')}>{p.matchScore}%</span> },
                  { label: 'Proposals', get: (p: Project) => String(p.proposals) },
                  { label: 'Location', get: (p: Project) => p.location },
                  { label: 'Level', get: (p: Project) => LEVEL_LABELS[p.level] },
                  { label: 'Funding', get: (p: Project) => <span className={FUNDING_CFG[p.fundingStatus].color}>{FUNDING_CFG[p.fundingStatus].label}</span> },
                  { label: 'Visibility', get: (p: Project) => <Badge variant="secondary" className="text-[7px]">{p.visibility}</Badge> },
                  { label: 'Skills', get: (p: Project) => <div className="flex flex-wrap gap-0.5">{p.skills.slice(0,3).map(s => <Badge key={s} variant="secondary" className="text-[6px]">{s}</Badge>)}</div> },
                  { label: 'Status', get: (p: Project) => <StatusBadge status={p.status === 'open' ? 'healthy' : p.status === 'closing-soon' ? 'caution' : p.status === 'awarded' ? 'live' : 'blocked'} label={p.status} /> },
                ].map(row => (
                  <tr key={row.label} className="border-b last:border-0">
                    <td className="py-2 pr-3 text-muted-foreground font-medium">{row.label}</td>
                    {projects.map(p => <td key={p.id} className="py-2 px-2">{row.get(p)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const ProjectsBrowsePage: React.FC = () => {
  const { activeRole } = useRole();
  const isClient = activeRole === 'user' || activeRole === 'enterprise';
  const [activeTab, setActiveTab] = useState<BrowseTab>('recommended');
  const [pricingFilter, setPricingFilter] = useState<PricingType>('all');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [proposalProject, setProposalProject] = useState<Project | undefined>();
  const [proposalOpen, setProposalOpen] = useState(false);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set(MOCK_PROJECTS.filter(p => p.saved).map(p => p.id)));
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [compareOpen, setCompareOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [sortKey, setSortKey] = useState<SortKey>('match');
  const [showFilters, setShowFilters] = useState(true);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [fundedOnly, setFundedOnly] = useState(false);
  const [advFilterValues, setAdvFilterValues] = useState<FilterValues>({});

  const toggleSave = (id: string) => {
    setSavedIds(prev => { const n = new Set(prev); if (n.has(id)) { n.delete(id); toast.info('Removed'); } else { n.add(id); toast.success('Saved!'); } return n; });
  };
  const toggleCompare = (id: string) => {
    setCompareIds(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else if (n.size < 4) n.add(id); else toast.info('Max 4 items'); return n; });
  };

  const filtered = useMemo(() => {
    let list = [...MOCK_PROJECTS];
    if (activeTab === 'recommended') list = list.filter(p => p.matchScore >= 60 && p.status !== 'closed');
    if (activeTab === 'saved') list = list.filter(p => savedIds.has(p.id));
    if (activeTab === 'invited') list = list.filter(p => p.invited);
    if (pricingFilter !== 'all') list = list.filter(p => p.pricingType === pricingFilter);
    if (categoryFilter !== 'All') list = list.filter(p => p.category === categoryFilter);
    if (levelFilter !== 'all') list = list.filter(p => p.level === levelFilter);
    if (remoteOnly) list = list.filter(p => p.location === 'Remote');
    if (fundedOnly) list = list.filter(p => p.fundingStatus === 'funded' || p.fundingStatus === 'escrow-held');
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.title.toLowerCase().includes(q) || p.skills.some(s => s.toLowerCase().includes(q)) || p.client.toLowerCase().includes(q));
    }
    switch (sortKey) {
      case 'match': list.sort((a, b) => b.matchScore - a.matchScore); break;
      case 'newest': break; // already in order
      case 'budget-high': list.sort((a, b) => b.budgetNum - a.budgetNum); break;
      case 'budget-low': list.sort((a, b) => a.budgetNum - b.budgetNum); break;
      case 'proposals': list.sort((a, b) => a.proposals - b.proposals); break;
    }
    return list;
  }, [activeTab, pricingFilter, categoryFilter, levelFilter, searchQuery, savedIds, sortKey, remoteOnly, fundedOnly]);

  const selected = MOCK_PROJECTS.find(p => p.id === selectedId);
  const compareProjects = MOCK_PROJECTS.filter(p => compareIds.has(p.id));

  const tabCounts: Record<BrowseTab, number> = {
    recommended: MOCK_PROJECTS.filter(p => p.matchScore >= 60 && p.status !== 'closed').length,
    all: MOCK_PROJECTS.length,
    saved: savedIds.size,
    invited: MOCK_PROJECTS.filter(p => p.invited).length,
    compare: compareIds.size,
  };

  /* ── Top Strip ── */
  const topStrip = (<>
    <div className="flex items-center gap-2.5">
      <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Briefcase className="h-3.5 w-3.5 text-accent" /></div>
      <span className="text-xs font-bold">Projects Marketplace</span>
      <StatusBadge status="live" label={`${MOCK_PROJECTS.filter(p => p.status === 'open').length} Open`} />
    </div>
    <div className="flex-1" />
    {isClient && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" asChild><Link to="/projects/create"><Plus className="h-3 w-3" />Post Project</Link></Button>}
    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="h-3 w-3" />Filters</Button>
    <div className="flex border rounded-lg overflow-hidden">
      <button onClick={() => setViewMode('cards')} className={cn('px-1.5 py-1', viewMode === 'cards' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50')}><Grid3X3 className="h-3 w-3" /></button>
      <button onClick={() => setViewMode('table')} className={cn('px-1.5 py-1', viewMode === 'table' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50')}><List className="h-3 w-3" /></button>
    </div>
  </>);

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <KPIBand className="!grid-cols-2">
        <KPICard label="Open" value={MOCK_PROJECTS.filter(p => p.status === 'open').length} change="projects" trend="neutral" />
        <KPICard label="Invited" value={tabCounts.invited} change="for you" trend="up" />
      </KPIBand>
      <KPIBand className="!grid-cols-2">
        <KPICard label="Saved" value={savedIds.size} trend="neutral" />
        <KPICard label="Comparing" value={compareIds.size} trend="neutral" />
      </KPIBand>

      <SectionCard title="AI Recommendations" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {MOCK_PROJECTS.filter(p => p.matchScore >= 85).slice(0, 3).map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-left hover:bg-muted/30 transition-all">
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{p.clientAvatar}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><div className="text-[9px] font-medium truncate">{p.title}</div><div className="text-[7px] text-muted-foreground">{p.budget}</div></div>
              <span className="text-[9px] font-bold text-[hsl(var(--state-healthy))]">{p.matchScore}%</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Saved Projects" icon={<Bookmark className="h-3.5 w-3.5 text-accent fill-accent" />} className="!rounded-2xl">
        <div className="space-y-1">
          {MOCK_PROJECTS.filter(p => savedIds.has(p.id)).slice(0, 3).map(p => (
            <button key={p.id} onClick={() => setSelectedId(p.id)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-left hover:bg-muted/30 transition-colors">
              <Bookmark className="h-3 w-3 text-accent shrink-0 fill-accent" />
              <span className="text-[9px] font-medium truncate flex-1">{p.title}</span>
            </button>
          ))}
          {savedIds.size === 0 && <div className="text-[9px] text-muted-foreground text-center py-2">No saved projects</div>}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'Post a project', icon: Plus, path: '/projects/create' },
            { label: 'My proposals', icon: Send, path: '/projects' },
            { label: 'Browse agencies', icon: Building2, path: '/explore' },
            { label: 'Skill assessments', icon: Star, path: '/profile' },
          ].map(a => (
            <Link key={a.label} to={a.path} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/50 transition-colors">
              <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}
            </Link>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Market Pulse" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1">
          {[{ l:'Avg Budget', v:'$18K' }, { l:'Remote %', v:'78%' }, { l:'Top Skill', v:'React' }, { l:'Avg Proposals', v:'19' }].map(m => (
            <div key={m.l} className="flex justify-between text-[8px]"><span className="text-muted-foreground">{m.l}</span><span className="font-semibold">{m.v}</span></div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom ── */
  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold flex items-center gap-1"><BarChart3 className="h-3.5 w-3.5 text-accent" />Market Snapshot · This week</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[{ label:'New Projects', value:'147' },{ label:'Avg Budget', value:'$18K' },{ label:'Avg Proposals', value:'19' },{ label:'Top Skill', value:'React' },{ label:'Remote %', value:'78%' },{ label:'Avg Duration', value:'6 wks' }].map(s => (
          <div key={s.label} className="text-center"><div className="text-sm font-bold">{s.value}</div><div className="text-[9px] text-muted-foreground">{s.label}</div></div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Projects" icon={<Briefcase className="h-3 w-3" />} />
      {/* Tab nav */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-3 overflow-x-auto">
        {([
          { id: 'recommended' as const, label: 'Recommended', icon: Sparkles },
          { id: 'all' as const, label: 'All Projects', icon: Globe },
          { id: 'saved' as const, label: 'Saved', icon: Bookmark },
          { id: 'invited' as const, label: 'Invited', icon: Mail },
          { id: 'compare' as const, label: 'Compare', icon: Layers },
        ]).map(t => (
          <button key={t.id} onClick={() => { if (t.id === 'compare') { setCompareOpen(true); } else setActiveTab(t.id); }} className={cn(
            'flex items-center gap-1.5 px-3 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
            {tabCounts[t.id] > 0 && <span className={cn('text-[7px] rounded-full px-1.5', activeTab === t.id ? 'bg-accent/10' : 'bg-muted')}>{tabCounts[t.id]}</span>}
          </button>
        ))}
      </div>

      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search projects, skills, clients..." className="w-full h-9 pl-9 pr-3 rounded-xl border bg-background text-xs focus:ring-2 focus:ring-ring focus:outline-none" />
        {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>}
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-1.5 mb-3 overflow-x-auto pb-1">
        {/* Categories */}
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCategoryFilter(c)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all shrink-0', categoryFilter === c ? 'bg-accent text-accent-foreground' : 'bg-muted/40 text-muted-foreground hover:bg-muted/60')}>{c}</button>
        ))}
        <div className="w-px h-5 bg-border shrink-0" />
        {(['all','fixed','hourly'] as PricingType[]).map(p => (
          <button key={p} onClick={() => setPricingFilter(p)} className={cn('px-2 py-1 rounded-xl text-[9px] font-medium transition-colors capitalize shrink-0', pricingFilter === p ? 'bg-secondary text-secondary-foreground' : 'text-muted-foreground hover:bg-muted/50')}>{p === 'all' ? 'Any Price' : p}</button>
        ))}
        <div className="w-px h-5 bg-border shrink-0" />
        <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)} className="h-6 rounded-lg border bg-background px-2 text-[9px]">
          <option value="match">Best Match</option>
          <option value="newest">Newest</option>
          <option value="budget-high">Budget ↓</option>
          <option value="budget-low">Budget ↑</option>
          <option value="proposals">Least Proposals</option>
        </select>
      </div>

      {showFilters && (
        <div className="mb-3">
          <AdvancedFilterPanel filters={PROJECT_FILTERS} values={advFilterValues} onChange={setAdvFilterValues} inline />
        </div>
      )}

      {/* Invite banner */}
      {tabCounts.invited > 0 && activeTab !== 'invited' && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3 flex items-center gap-3 mb-3">
          <Mail className="h-4 w-4 text-accent shrink-0" />
          <div className="flex-1"><div className="text-[11px] font-medium">You have {tabCounts.invited} project invitation{tabCounts.invited > 1 ? 's' : ''}</div><div className="text-[10px] text-muted-foreground">Clients have invited you to submit proposals.</div></div>
          <Button variant="outline" size="sm" className="h-6 text-[10px] rounded-xl" onClick={() => setActiveTab('invited')}>View Invitations</Button>
        </div>
      )}

      {/* Compare bar */}
      {compareIds.size > 0 && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-2.5 flex items-center gap-3 mb-3">
          <Layers className="h-4 w-4 text-accent shrink-0" />
          <div className="flex items-center gap-1 flex-1">
            {compareProjects.map(p => (
              <Badge key={p.id} variant="secondary" className="text-[8px] gap-1">
                {p.title.slice(0, 20)}...
                <button onClick={() => toggleCompare(p.id)}><X className="h-2 w-2" /></button>
              </Badge>
            ))}
          </div>
          <Button size="sm" className="h-6 text-[9px] rounded-xl gap-1" onClick={() => setCompareOpen(true)}><Layers className="h-3 w-3" />Compare ({compareIds.size})</Button>
          <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={() => setCompareIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Results count */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-muted-foreground">{filtered.length} project{filtered.length !== 1 ? 's' : ''} found</span>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border p-8 text-center">
          <Briefcase className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
          <div className="text-sm font-medium mb-1">No projects found</div>
          <div className="text-[10px] text-muted-foreground mb-3">Adjust your filters or search query.</div>
          <Button variant="outline" size="sm" onClick={() => { setSearchQuery(''); setPricingFilter('all'); setCategoryFilter('All'); setActiveTab('all'); }}>Reset Filters</Button>
        </div>
      ) : viewMode === 'table' ? (
        /* ═══ TABLE VIEW ═══ */
        <div className="rounded-2xl border overflow-hidden">
          <div className="grid grid-cols-[24px_1fr_100px_80px_60px_70px_60px_90px] gap-2 px-3 py-2 bg-muted/50 border-b text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span></span><span>Project</span><span>Budget</span><span>Duration</span><span>Match</span><span>Proposals</span><span>Status</span><span className="text-right">Actions</span>
          </div>
          {filtered.map(p => {
            const isSaved = savedIds.has(p.id);
            const isComp = compareIds.has(p.id);
            return (
              <div key={p.id} onClick={() => setSelectedId(p.id)} className={cn('grid grid-cols-[24px_1fr_100px_80px_60px_70px_60px_90px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer items-center', p.status === 'closed' && 'opacity-60', isComp && 'bg-accent/5')}>
                <input type="checkbox" checked={isComp} onChange={e => { e.stopPropagation(); toggleCompare(p.id); }} className="h-3 w-3 rounded" />
                <div className="flex items-center gap-2 min-w-0">
                  <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{p.clientAvatar}</AvatarFallback></Avatar>
                  <div className="min-w-0"><div className="text-[10px] font-medium truncate">{p.title}</div><div className="text-[8px] text-muted-foreground truncate">{p.client} · {p.location}</div></div>
                </div>
                <div className="text-[10px] font-semibold">{p.budget}</div>
                <div className="text-[9px] text-muted-foreground">{p.duration}</div>
                <div className={cn('text-[10px] font-bold', p.matchScore >= 80 ? 'text-[hsl(var(--state-healthy))]' : p.matchScore >= 60 ? 'text-accent' : 'text-muted-foreground')}>{p.matchScore}%</div>
                <div className="text-[9px] text-muted-foreground">{p.proposals}</div>
                <StatusBadge status={p.status === 'open' ? 'healthy' : p.status === 'closing-soon' ? 'caution' : p.status === 'awarded' ? 'live' : 'blocked'} label={p.status === 'closing-soon' ? 'Soon' : p.status} />
                <div className="flex justify-end gap-0.5">
                  <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => { e.stopPropagation(); toggleSave(p.id); }}>
                    {isSaved ? <Bookmark className="h-3 w-3 text-accent fill-accent" /> : <BookmarkPlus className="h-3 w-3" />}
                  </Button>
                  {p.status === 'open' && <Button size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); setProposalProject(p); setProposalOpen(true); }}><Send className="h-2 w-2" /></Button>}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* ═══ CARD VIEW ═══ */
        <div className="space-y-2">
          {filtered.map(p => {
            const isSaved = savedIds.has(p.id);
            const isComp = compareIds.has(p.id);
            return (
              <div key={p.id} onClick={() => setSelectedId(p.id)} className={cn(
                'rounded-2xl border p-3.5 hover:shadow-md transition-all cursor-pointer',
                p.status === 'closed' && 'opacity-60',
                p.invited && 'border-accent/30 bg-accent/[0.02]',
                isComp && 'ring-1 ring-accent/30',
              )}>
                <div className="flex items-start gap-3">
                  <div className="shrink-0 flex flex-col items-center gap-1.5">
                    <Avatar className="h-9 w-9 ring-1 ring-muted/30"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{p.clientAvatar}</AvatarFallback></Avatar>
                    <input type="checkbox" checked={isComp} onChange={e => { e.stopPropagation(); toggleCompare(p.id); }} className="h-3 w-3 rounded" title="Compare" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <h3 className="text-[11px] font-bold">{p.title}</h3>
                      {p.invited && <Badge className="text-[6px] bg-accent/10 text-accent">Invited</Badge>}
                      {p.visibility === 'invite-only' && <Badge variant="secondary" className="text-[6px] gap-0.5"><Shield className="h-2 w-2" />Invite Only</Badge>}
                      {p.status === 'closing-soon' && <StatusBadge status="caution" label="Closing Soon" />}
                      {p.status === 'closed' && <StatusBadge status="blocked" label="Closed" />}
                      {p.status === 'awarded' && <StatusBadge status="live" label="Awarded" />}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] text-muted-foreground mb-1.5 flex-wrap">
                      <span className="font-medium text-foreground">{p.client}</span>
                      {p.clientVerified && <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />}
                      <span>·</span><MapPin className="h-2.5 w-2.5" />{p.location}
                      <span>·</span><Clock className="h-2.5 w-2.5" />{p.postedAt}
                      <span>·</span><span className={FUNDING_CFG[p.fundingStatus].color}>{FUNDING_CFG[p.fundingStatus].label}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground line-clamp-2 mb-2">{p.description}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {p.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px] px-1.5 py-0">{s}</Badge>)}
                      <Badge variant="secondary" className="text-[7px] px-1.5 py-0">{LEVEL_LABELS[p.level]}</Badge>
                    </div>
                  </div>
                  <div className="shrink-0 text-right space-y-1">
                    <div className="text-[12px] font-bold">{p.budget}</div>
                    <div className="text-[8px] text-muted-foreground capitalize">{p.pricingType} · {p.duration}</div>
                    <div className="text-[8px] text-muted-foreground flex items-center gap-0.5 justify-end"><Users className="h-2.5 w-2.5" />{p.proposals} proposals</div>
                    <div className={cn('text-[10px] font-bold', p.matchScore >= 80 ? 'text-[hsl(var(--state-healthy))]' : p.matchScore >= 60 ? 'text-accent' : 'text-muted-foreground')}>{p.matchScore}% match</div>
                    <div className="flex items-center gap-1 justify-end mt-1">
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={e => { e.stopPropagation(); toggleSave(p.id); }}>
                        {isSaved ? <Bookmark className="h-3 w-3 text-accent fill-accent" /> : <BookmarkPlus className="h-3 w-3" />}
                      </Button>
                      {p.status === 'open' && (
                        <Button size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); setProposalProject(p); setProposalOpen(true); }}>
                          <Send className="h-2 w-2 mr-0.5" />Propose
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detail Drawer */}
      <Sheet open={!!selected} onOpenChange={() => setSelectedId(null)}>
        <SheetContent className="w-[460px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent" />Project Details</SheetTitle></SheetHeader>
          {selected && (() => {
            const isSaved = savedIds.has(selected.id);
            return (
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 ring-2 ring-accent/20 rounded-xl"><AvatarFallback className="text-xs bg-accent/10 text-accent font-bold rounded-xl">{selected.clientAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <h3 className="text-[13px] font-bold">{selected.title}</h3>
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-medium text-foreground">{selected.client}</span>
                      {selected.clientVerified && <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />}
                    </div>
                  </div>
                  <StatusBadge status={selected.status === 'open' ? 'healthy' : selected.status === 'closing-soon' ? 'caution' : selected.status === 'awarded' ? 'live' : 'blocked'} label={selected.status === 'closing-soon' ? 'Closing Soon' : selected.status} />
                </div>

                <p className="text-[10px] text-muted-foreground leading-relaxed">{selected.description}</p>

                <SectionCard title="Details" className="!rounded-2xl">
                  <div className="text-[10px] space-y-1.5">
                    {[
                      { l: 'Budget', v: selected.budget },
                      { l: 'Type', v: selected.pricingType === 'fixed' ? 'Fixed Price' : 'Hourly Rate' },
                      { l: 'Duration', v: selected.duration },
                      { l: 'Experience', v: LEVEL_LABELS[selected.level] },
                      { l: 'Location', v: selected.location },
                      { l: 'Posted', v: selected.postedAt },
                      { l: 'Proposals', v: String(selected.proposals) },
                      { l: 'Match Score', v: `${selected.matchScore}%` },
                      { l: 'Funding', v: FUNDING_CFG[selected.fundingStatus].label },
                      { l: 'Visibility', v: selected.visibility },
                      { l: 'Category', v: selected.category },
                    ].map(r => (
                      <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
                    ))}
                  </div>
                </SectionCard>

                <div>
                  <h4 className="text-xs font-semibold mb-1.5">Required Skills</h4>
                  <div className="flex flex-wrap gap-1">{selected.skills.map(s => <Badge key={s} variant="secondary" className="text-[8px]">{s}</Badge>)}</div>
                </div>

                {selected.invited && (
                  <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3 flex items-center gap-2 text-[10px]">
                    <Mail className="h-3.5 w-3.5 text-accent shrink-0" /><span>You've been invited to submit a proposal for this project.</span>
                  </div>
                )}

                {selected.fundingStatus === 'unfunded' && (
                  <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-2 text-[10px]">
                    <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" /><span>This project has not yet been funded. Proceed with caution.</span>
                  </div>
                )}

                <div className="flex flex-col gap-1.5 pt-2 border-t">
                  {selected.status === 'open' && (
                    <Button size="sm" className="h-8 text-[10px] gap-1 w-full rounded-xl" onClick={() => { setProposalProject(selected); setProposalOpen(true); setSelectedId(null); }}>
                      <Send className="h-3 w-3" />Submit Proposal
                    </Button>
                  )}
                  <div className="flex gap-1.5">
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 rounded-xl" onClick={() => toggleSave(selected.id)}>
                      {isSaved ? <><Bookmark className="h-3 w-3 fill-accent text-accent" />Saved</> : <><BookmarkPlus className="h-3 w-3" />Save</>}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 rounded-xl" onClick={() => toggleCompare(selected.id)}>
                      <Layers className="h-3 w-3" />{compareIds.has(selected.id) ? 'In Compare' : 'Compare'}
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1 h-7 text-[10px] gap-1 rounded-xl" asChild>
                      <Link to="/profile"><ExternalLink className="h-3 w-3" />Client</Link>
                    </Button>
                  </div>
                  {selected.status === 'closed' && (
                    <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-2 text-[10px] text-center text-muted-foreground">
                      This project is no longer accepting proposals.
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Compare Drawer */}
      <CompareDrawer projects={compareProjects} onClose={() => setCompareOpen(false)} onRemove={id => toggleCompare(id)} />

      {/* Proposal Modal */}
      <ProposalModal open={proposalOpen} onClose={() => { setProposalOpen(false); setProposalProject(undefined); }} project={proposalProject} />
    </DashboardLayout>
  );
};

export default ProjectsBrowsePage;
