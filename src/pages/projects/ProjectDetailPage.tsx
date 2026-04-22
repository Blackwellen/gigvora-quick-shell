import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Send, BookmarkPlus, Bookmark, Mail, Share2, Flag, ExternalLink,
  CheckCircle2, Clock, MapPin, DollarSign, Calendar, Star,
  Shield, AlertTriangle, FileText, Users, Eye, Building2,
  Briefcase, Globe, Award, TrendingUp, BarChart3, Paperclip,
  X, Lock, ChevronRight, ThumbsUp, MessageSquare,
} from 'lucide-react';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Mock Project Data (keyed by ID)
   ═══════════════════════════════════════════════════════════ */
interface ProjectDetail {
  id: string; title: string; description: string; scopeBody: string;
  client: { name: string; avatar: string; verified: boolean; memberSince: string; projectsPosted: number; hireRate: number; avgRating: number; totalSpend: string; responseTime: string; location: string; industry: string; };
  budget: string; pricingType: 'fixed' | 'hourly'; duration: string; level: 'entry' | 'intermediate' | 'expert';
  skills: string[]; proposals: number; postedAt: string; location: string; visibility: 'public' | 'invite-only' | 'private';
  status: 'open' | 'closing-soon' | 'closed'; attachments: { name: string; size: string }[];
  deliverables: string[]; milestones: { title: string; amount: string }[];
  similarProjects: { id: string; title: string; budget: string; matchScore: number }[];
}

const PROJECT_DB: Record<string, ProjectDetail> = {
  p1: {
    id: 'p1', title: 'SaaS Platform Development — React + Node', description: 'Full-stack SaaS platform with user management, billing integration, analytics dashboard, and multi-tenant architecture.',
    scopeBody: `We are building a modern SaaS platform from the ground up and need an experienced full-stack developer to lead the technical implementation.\n\n**Core Requirements:**\n- Multi-tenant architecture with role-based access control\n- Stripe billing integration (subscriptions, metered usage, invoicing)\n- Real-time analytics dashboard with customizable widgets\n- RESTful API with comprehensive documentation\n- CI/CD pipeline setup and deployment automation\n\n**Technical Stack:**\n- Frontend: React 18+ with TypeScript, TailwindCSS\n- Backend: Node.js with Express or Fastify\n- Database: PostgreSQL with Prisma ORM\n- Infrastructure: AWS (ECS, RDS, S3, CloudFront)\n\n**Quality Requirements:**\n- 80%+ test coverage (unit + integration)\n- Performance: <2s initial load, <200ms API responses\n- WCAG 2.1 AA accessibility compliance\n- SOC 2 security considerations`,
    client: { name: 'TechVentures Inc.', avatar: 'TV', verified: true, memberSince: 'Jan 2021', projectsPosted: 28, hireRate: 92, avgRating: 4.8, totalSpend: '$340K+', responseTime: '< 2 hours', location: 'San Francisco, CA', industry: 'Enterprise SaaS' },
    budget: '$25,000 – $35,000', pricingType: 'fixed', duration: '3 months', level: 'expert',
    skills: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'TypeScript', 'AWS', 'Docker'],
    proposals: 12, postedAt: '2 days ago', location: 'Remote', visibility: 'public', status: 'open',
    attachments: [{ name: 'Technical_Requirements_v2.pdf', size: '2.4 MB' }, { name: 'Wireframes_Draft.fig', size: '8.1 MB' }, { name: 'API_Specification.yaml', size: '156 KB' }],
    deliverables: ['Multi-tenant auth system', 'Billing & subscription module', 'Analytics dashboard', 'API documentation', 'Deployment pipeline'],
    milestones: [{ title: 'Architecture & Auth', amount: '$8,000' }, { title: 'Billing & Core Features', amount: '$12,000' }, { title: 'Dashboard & Polish', amount: '$10,000' }, { title: 'Testing & Launch', amount: '$5,000' }],
    similarProjects: [{ id: 'p6', title: 'Data Pipeline & Dashboard', budget: '$30K–$45K', matchScore: 83 }, { id: 'p4', title: 'AI Chatbot Integration', budget: '$5K–$8K', matchScore: 71 }],
  },
};

const FALLBACK: ProjectDetail = {
  id: 'unknown', title: 'Enterprise CRM Module', description: 'Custom CRM module development for enterprise client with complex workflow requirements.',
  scopeBody: 'This project involves building a custom CRM module with lead scoring, pipeline management, and reporting capabilities. The ideal candidate will have experience with enterprise-grade applications and complex data models.\n\n**Key Features:**\n- Lead scoring engine with ML-based predictions\n- Custom pipeline stages with automation rules\n- Advanced reporting with export capabilities\n- Integration with existing ERP system\n- Mobile-responsive design',
  client: { name: 'Acme Corp', avatar: 'AC', verified: true, memberSince: 'Mar 2022', projectsPosted: 15, hireRate: 87, avgRating: 4.6, totalSpend: '$180K+', responseTime: '< 4 hours', location: 'New York, NY', industry: 'Professional Services' },
  budget: '$18,000 – $25,000', pricingType: 'fixed', duration: '10 weeks', level: 'expert',
  skills: ['React', 'Python', 'PostgreSQL', 'REST API', 'Docker'], proposals: 9, postedAt: '3 days ago', location: 'Remote', visibility: 'public', status: 'open',
  attachments: [{ name: 'CRM_Requirements.pdf', size: '1.8 MB' }],
  deliverables: ['Lead scoring engine', 'Pipeline manager', 'Reporting module', 'ERP integration', 'Mobile views'],
  milestones: [{ title: 'Foundation & Data Layer', amount: '$6,000' }, { title: 'Core Features', amount: '$10,000' }, { title: 'Integration & Launch', amount: '$7,000' }],
  similarProjects: [{ id: 'p1', title: 'SaaS Platform Development', budget: '$25K–$35K', matchScore: 78 }],
};

const LEVEL_LABELS: Record<string, string> = { entry: 'Entry Level', intermediate: 'Intermediate', expert: 'Expert' };

/* ═══════════════════════════════════════════════════════════
   Proposal Modal (same 3-step)
   ═══════════════════════════════════════════════════════════ */
const ProposalModal: React.FC<{ open: boolean; onClose: () => void; project: ProjectDetail }> = ({ open, onClose, project }) => {
  const [step, setStep] = useState<'details' | 'pricing' | 'review'>('details');
  if (!open) return null;
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
              {['details', 'pricing', 'review'].map((s, i) => (
                <React.Fragment key={s}>
                  <div className={cn('h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors', step === s ? 'border-accent bg-accent text-accent-foreground' : i < ['details', 'pricing', 'review'].indexOf(step) ? 'border-accent bg-accent/10 text-accent' : 'border-muted text-muted-foreground')}>{i + 1}</div>
                  {i < 2 && <div className={cn('flex-1 h-0.5', i < ['details', 'pricing', 'review'].indexOf(step) ? 'bg-accent' : 'bg-muted')} />}
                </React.Fragment>
              ))}
            </div>
          </div>
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            {step === 'details' && (
              <>
                <div className="rounded-lg bg-muted/30 p-3 text-[10px]"><div className="font-medium text-xs mb-1">{project.title}</div><div className="text-muted-foreground">{project.client.name} · {project.budget} · {project.duration}</div></div>
                <div><label className="text-xs font-medium mb-1 block">Cover Letter *</label><textarea className="w-full h-28 rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" placeholder="Explain why you're a great fit..." /></div>
                <div><label className="text-xs font-medium mb-1 block">Relevant Experience</label><textarea className="w-full h-16 rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" placeholder="Links to similar work..." /></div>
              </>
            )}
            {step === 'pricing' && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-xs font-medium mb-1 block">Your {project.pricingType === 'hourly' ? 'Rate' : 'Bid'} *</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder={project.pricingType === 'hourly' ? '$85/hr' : '$28,000'} /></div>
                  <div><label className="text-xs font-medium mb-1 block">Timeline *</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder={project.duration} /></div>
                </div>
                <div><label className="text-xs font-medium mb-1 block">Milestones</label><textarea className="w-full h-16 rounded-lg border bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-ring focus:outline-none resize-none" placeholder="Key deliverables..." /></div>
              </>
            )}
            {step === 'review' && (
              <div className="space-y-3">
                <div className="rounded-lg border p-3 bg-muted/30 text-xs space-y-1.5">
                  {[{ l: 'Project', v: project.title }, { l: 'Client', v: project.client.name }, { l: 'Your Bid', v: '—' }, { l: 'Timeline', v: '—' }].map(r => (
                    <div key={r.l} className="flex justify-between"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
                  ))}
                </div>
                <div className="rounded-lg border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-2 text-[10px]">
                  <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))] shrink-0" />
                  <span>Once submitted, your proposal will be visible to the client. You can withdraw within 24 hours.</span>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-between px-6 py-4 border-t">
            {step !== 'details' ? <Button variant="outline" onClick={() => setStep(step === 'review' ? 'pricing' : 'details')}>Back</Button> : <div />}
            {step === 'review' ? (
              <Button onClick={() => { toast.success('Proposal submitted!'); onClose(); }}><Send className="h-3 w-3 mr-1" />Submit</Button>
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
   Trust Score Visual
   ═══════════════════════════════════════════════════════════ */
const TrustScore: React.FC<{ client: ProjectDetail['client'] }> = ({ client }) => {
  const score = Math.round((client.avgRating / 5) * 40 + (client.hireRate / 100) * 30 + (client.verified ? 20 : 0) + 10);
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold">Buyer Trust Score</span>
        <span className={cn('text-sm font-bold', score >= 80 ? 'text-[hsl(var(--state-healthy))]' : score >= 60 ? 'text-[hsl(var(--state-caution))]' : 'text-[hsl(var(--state-blocked))]')}>{score}/100</span>
      </div>
      <Progress value={score} className="h-2" />
      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
        {[
          { l: 'Verified', v: client.verified ? 'Yes' : 'No', ok: client.verified },
          { l: 'Hire Rate', v: `${client.hireRate}%`, ok: client.hireRate >= 80 },
          { l: 'Avg Rating', v: `${client.avgRating}/5`, ok: client.avgRating >= 4.5 },
          { l: 'Response', v: client.responseTime, ok: true },
          { l: 'Total Spend', v: client.totalSpend, ok: true },
          { l: 'Member Since', v: client.memberSince, ok: true },
        ].map(r => (
          <div key={r.l} className="flex items-center justify-between">
            <span className="text-muted-foreground">{r.l}</span>
            <span className={cn('font-medium', r.ok ? '' : 'text-[hsl(var(--state-caution))]')}>{r.v}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const project = PROJECT_DB[projectId || ''] || { ...FALLBACK, id: projectId || 'unknown' };
  const [saved, setSaved] = useState(false);
  const [proposalOpen, setProposalOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<'scope' | 'deliverables' | 'milestones' | 'attachments'>('scope');

  const isOpen = project.status === 'open' || project.status === 'closing-soon';
  const isClosed = project.status === 'closed';
  const isPrivate = project.visibility === 'private';

  // Not-found / private gate
  if (isPrivate) {
    return (
      <DashboardLayout>
        <div className="rounded-lg border p-12 text-center">
          <Lock className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-1">Private Project</h2>
          <p className="text-sm text-muted-foreground mb-4">This project is invite-only and not visible to your account.</p>
          <Button variant="outline" asChild><Link to="/projects">Back to Projects</Link></Button>
        </div>
      </DashboardLayout>
    );
  }

  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <Briefcase className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold truncate max-w-[200px]">{project.title}</span>
        {project.status === 'open' && <StatusBadge status="healthy" label="Open" />}
        {project.status === 'closing-soon' && <StatusBadge status="caution" label="Closing Soon" />}
        {isClosed && <StatusBadge status="blocked" label="Closed" />}
        {project.visibility === 'invite-only' && <Badge className="text-[6px] bg-accent/10 text-accent">Invite Only</Badge>}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={() => { setSaved(!saved); toast.success(saved ? 'Removed' : 'Saved'); }}>
          {saved ? <Bookmark className="h-3 w-3 fill-accent text-accent mr-0.5" /> : <BookmarkPlus className="h-3 w-3 mr-0.5" />}{saved ? 'Saved' : 'Save'}
        </Button>
        <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={() => toast.info('Share link copied')}><Share2 className="h-3 w-3 mr-0.5" />Share</Button>
        <Button variant="ghost" size="sm" className="h-6 text-[9px] text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Report submitted')}><Flag className="h-3 w-3 mr-0.5" />Report</Button>
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      {/* CTA */}
      <div className="rounded-lg border bg-card p-3 space-y-2">
        {isOpen ? (
          <>
            <Button className="w-full h-8 text-[10px] gap-1" onClick={() => setProposalOpen(true)}><Send className="h-3 w-3" />Submit Proposal</Button>
            <Button variant="outline" className="w-full h-7 text-[10px] gap-1" onClick={() => toast.info('Opening message...')}><Mail className="h-3 w-3" />Message Buyer</Button>
          </>
        ) : (
          <div className="rounded-lg border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3 text-center text-[10px] text-muted-foreground">
            This project is no longer accepting proposals.
          </div>
        )}
      </div>

      {/* Facts Panel */}
      <SectionCard title="Project Facts">
        <div className="text-[10px] space-y-1.5">
          {[
            { l: 'Budget', v: project.budget, icon: DollarSign },
            { l: 'Type', v: project.pricingType === 'fixed' ? 'Fixed Price' : 'Hourly', icon: Briefcase },
            { l: 'Duration', v: project.duration, icon: Clock },
            { l: 'Experience', v: LEVEL_LABELS[project.level], icon: Award },
            { l: 'Location', v: project.location, icon: MapPin },
            { l: 'Posted', v: project.postedAt, icon: Calendar },
            { l: 'Proposals', v: String(project.proposals), icon: Users },
            { l: 'Visibility', v: project.visibility, icon: Eye },
          ].map(r => (
            <div key={r.l} className="flex items-center gap-2">
              <r.icon className="h-3 w-3 text-muted-foreground shrink-0" />
              <span className="text-muted-foreground flex-1">{r.l}</span>
              <span className="font-medium capitalize">{r.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Skills */}
      <SectionCard title="Required Skills">
        <div className="flex flex-wrap gap-1">
          {project.skills.map(s => <Badge key={s} variant="secondary" className="text-[8px]">{s}</Badge>)}
        </div>
      </SectionCard>

      {/* Buyer Trust */}
      <SectionCard title="About the Buyer">
        <div className="flex items-center gap-2 mb-3">
          <Avatar className="h-8 w-8"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">{project.client.avatar}</AvatarFallback></Avatar>
          <div>
            <div className="text-[10px] font-medium flex items-center gap-1">
              {project.client.name}
              {project.client.verified && <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />}
            </div>
            <div className="text-[8px] text-muted-foreground">{project.client.industry} · {project.client.location}</div>
          </div>
        </div>
        <TrustScore client={project.client} />
        <Button variant="outline" size="sm" className="w-full h-6 text-[9px] gap-1 mt-2"><ExternalLink className="h-3 w-3" />View Profile</Button>
      </SectionCard>

      {/* Similar */}
      {project.similarProjects.length > 0 && (
        <SectionCard title="Similar Projects">
          <div className="space-y-1.5">
            {project.similarProjects.map(sp => (
              <Link key={sp.id} to={`/projects/${sp.id}`} className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted/30 transition-colors">
                <Briefcase className="h-3 w-3 text-muted-foreground shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-[9px] font-medium truncate">{sp.title}</div>
                  <div className="text-[8px] text-muted-foreground">{sp.budget}</div>
                </div>
                <span className="text-[8px] font-semibold text-accent">{sp.matchScore}%</span>
              </Link>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-accent" />Buyer Verification</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Identity', verified: project.client.verified },
          { label: 'Payment Method', verified: true },
          { label: 'Email', verified: true },
          { label: 'Phone', verified: project.client.verified },
          { label: 'Company', verified: project.client.verified },
        ].map(v => (
          <div key={v.label} className="text-center">
            {v.verified ? <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))] mx-auto mb-0.5" /> : <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))] mx-auto mb-0.5" />}
            <div className="text-[9px] text-muted-foreground">{v.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const sectionTabs = [
    { key: 'scope' as const, label: 'Scope & Details' },
    { key: 'deliverables' as const, label: 'Deliverables' },
    { key: 'milestones' as const, label: 'Milestones' },
    { key: 'attachments' as const, label: `Attachments (${project.attachments.length})` },
  ];

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-64" bottomSection={bottomSection}>
      {/* Closing soon banner */}
      {project.status === 'closing-soon' && (
        <div className="rounded-lg border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-3 mb-3">
          <Clock className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
          <div className="flex-1">
            <div className="text-[11px] font-medium">This project is closing soon</div>
            <div className="text-[10px] text-muted-foreground">Submit your proposal before the deadline passes.</div>
          </div>
          <Button size="sm" className="h-6 text-[10px]" onClick={() => setProposalOpen(true)}>Propose Now</Button>
        </div>
      )}

      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg font-bold mb-1">{project.title}</h1>
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground flex-wrap">
          <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{project.client.name}</span>
          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{project.location}</span>
          <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />{project.budget}</span>
          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{project.duration}</span>
          <span className="flex items-center gap-1"><Users className="h-3 w-3" />{project.proposals} proposals</span>
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-3 border-b pb-2">
        {sectionTabs.map(t => (
          <button key={t.key} onClick={() => setActiveSection(t.key)} className={cn(
            'px-3 py-1 rounded-md text-[10px] font-medium transition-colors',
            activeSection === t.key ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted/50'
          )}>{t.label}</button>
        ))}
      </div>

      {/* Scope */}
      {activeSection === 'scope' && (
        <div className="prose prose-sm max-w-none">
          <div className="rounded-lg border bg-card p-4">
            <div className="text-[11px] leading-relaxed whitespace-pre-line">{project.scopeBody}</div>
          </div>
        </div>
      )}

      {/* Deliverables */}
      {activeSection === 'deliverables' && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-xs font-semibold mb-3">Expected Deliverables</h3>
          <div className="space-y-2">
            {project.deliverables.map((d, i) => (
              <div key={i} className="flex items-start gap-2">
                <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />
                <span className="text-[10px]">{d}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Milestones */}
      {activeSection === 'milestones' && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-xs font-semibold mb-3">Payment Milestones</h3>
          <div className="space-y-2">
            {project.milestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
                <div className="h-6 w-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[9px] font-bold shrink-0">{i + 1}</div>
                <span className="text-[10px] font-medium flex-1">{m.title}</span>
                <span className="text-[10px] font-bold">{m.amount}</span>
              </div>
            ))}
            <div className="flex items-center justify-between pt-2 border-t mt-2">
              <span className="text-[10px] font-semibold">Total</span>
              <span className="text-[11px] font-bold">{project.budget}</span>
            </div>
          </div>
        </div>
      )}

      {/* Attachments */}
      {activeSection === 'attachments' && (
        <div className="rounded-lg border bg-card p-4">
          <h3 className="text-xs font-semibold mb-3">Attached Files</h3>
          {project.attachments.length === 0 ? (
            <div className="text-center py-4 text-[10px] text-muted-foreground"><Paperclip className="h-5 w-5 mx-auto mb-1" />No attachments</div>
          ) : (
            <div className="space-y-1.5">
              {project.attachments.map((a, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg border hover:bg-muted/20 transition-colors cursor-pointer">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate">{a.name}</div>
                    <div className="text-[8px] text-muted-foreground">{a.size}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-5 text-[8px]" onClick={() => toast.info('Downloading...')}>Download</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ProposalModal open={proposalOpen} onClose={() => setProposalOpen(false)} project={project} />
    </DashboardLayout>
  );
};

export default ProjectDetailPage;
