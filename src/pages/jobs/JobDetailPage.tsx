import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Building2, MapPin, Briefcase, DollarSign, Globe, Clock, Users,
  CheckCircle2, Star, Send, Bookmark, BookmarkCheck, Share2,
  Heart, Sparkles, Upload, X, XCircle, AlertTriangle, Lock,
  ExternalLink, MessageSquare, Eye, TrendingUp, Calendar,
  Shield, Award, FileText, ChevronLeft, Zap, Bell,
} from 'lucide-react';
import { MOCK_JOBS } from '@/data/mock';
import type { MockJob } from '@/data/mock';
import { useRole } from '@/contexts/RoleContext';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type DetailTab = 'overview' | 'company' | 'similar';

const MOCK_FIT = {
  score: 88,
  dimensions: [
    { name: 'Skills Match', score: 92, matched: ['React', 'TypeScript', 'CSS'], missing: ['Design Systems'] },
    { name: 'Experience Level', score: 85, note: 'Your 6 yrs aligns with 5+ requirement' },
    { name: 'Location Fit', score: 100, note: 'Remote matches your preference' },
    { name: 'Salary Range', score: 75, note: 'Within your expected range' },
  ],
};

const MOCK_COMPANY_INFO = {
  name: 'TechCorp',
  size: '500-1000',
  industry: 'Developer Tools',
  founded: '2018',
  rating: 4.3,
  reviewCount: 128,
  followers: '2.4K',
  openJobs: 8,
  description: 'TechCorp builds best-in-class developer tools used by engineering teams worldwide. Our mission is to make developers 10x more productive.',
  culture: ['Remote-first', 'Async communication', 'Flat hierarchy', 'Open source contributors'],
  techStack: ['React', 'TypeScript', 'Go', 'PostgreSQL', 'AWS', 'Kubernetes'],
};

const MOCK_SIMILAR_JOBS = [
  { id: 'j2', title: 'Product Designer', company: 'DesignHub', salary: '$120K-$160K', location: 'New York', fit: 76 },
  { id: 'j3', title: 'DevOps Engineer', company: 'CloudScale', salary: '$140K-$180K', location: 'Austin', fit: 65 },
  { id: 'j6', title: 'Mobile Developer', company: 'AppWorks', salary: '€80K-€110K', location: 'Berlin', fit: 72 },
];

const MOCK_TIMELINE = [
  { date: 'Apr 5', event: 'Job posted', status: 'done' as const },
  { date: 'Apr 8', event: 'Applications open', status: 'done' as const },
  { date: 'Apr 20', event: 'First screening round', status: 'upcoming' as const },
  { date: 'May 1', event: 'Interview week', status: 'upcoming' as const },
  { date: 'May 10', event: 'Offers extended', status: 'upcoming' as const },
];

/* ═══════════════════════════════════════════════════════════
   State Banners
   ═══════════════════════════════════════════════════════════ */
const ClosedBanner: React.FC = () => (
  <div className="rounded-lg border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3 flex items-center gap-3 mb-3">
    <XCircle className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-medium">This position is closed</div>
      <div className="text-[10px] text-muted-foreground">Applications are no longer being accepted. Browse similar open roles below.</div>
    </div>
  </div>
);

const RestrictedBanner: React.FC = () => (
  <div className="rounded-lg border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-3 mb-3">
    <Lock className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-medium">Restricted Listing</div>
      <div className="text-[10px] text-muted-foreground">This role has geographic or visa restrictions that may apply to your profile.</div>
    </div>
  </div>
);

const SponsoredBadge: React.FC = () => (
  <Badge className="text-[7px] h-4 bg-[hsl(var(--state-premium)/0.1)] text-[hsl(var(--state-premium))] border-0">
    <Zap className="h-2 w-2 mr-0.5" />Sponsored
  </Badge>
);

/* ═══════════════════════════════════════════════════════════
   Application Modal
   ═══════════════════════════════════════════════════════════ */
const ApplicationModal: React.FC<{ job: MockJob; open: boolean; onClose: () => void; easyApply?: boolean }> = ({ job, open, onClose, easyApply }) => {
  const [step, setStep] = useState<'info' | 'resume' | 'cover' | 'submitted'>('info');
  const [coverLetter, setCoverLetter] = useState('');
  const { loading: aiLoading, invoke: aiInvoke } = useAI({ type: 'writing-assist' });

  const handleAICover = async () => {
    const result = await aiInvoke({ text: `Job: ${job.title} at ${job.company}. Requirements: ${job.requirements.join(', ')}`, action: 'Write a professional, personalized cover letter.' });
    if (result) setCoverLetter(result);
  };

  if (!open) return null;

  if (easyApply) {
    return (
      <div className="fixed inset-0 z-[100]" onClick={onClose}>
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
        <div className="relative flex justify-center items-start pt-[12vh] px-4">
          <div className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-5 py-3 border-b">
              <div className="flex items-center gap-2"><Zap className="h-4 w-4 text-accent" /><h3 className="font-semibold text-sm">Easy Apply</h3></div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3 w-3" /></Button>
            </div>
            {step === 'submitted' ? (
              <div className="p-6 text-center">
                <CheckCircle2 className="h-10 w-10 text-[hsl(var(--state-healthy))] mx-auto mb-2" />
                <div className="text-sm font-semibold mb-1">Applied!</div>
                <p className="text-[10px] text-muted-foreground mb-3">Your profile and resume have been sent to {job.company}.</p>
                <Button size="sm" onClick={onClose}>Done</Button>
              </div>
            ) : (
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/50">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[9px] bg-accent/10 text-accent">DU</AvatarFallback></Avatar>
                  <div><div className="text-[11px] font-medium">Demo User</div><div className="text-[9px] text-muted-foreground">demo@gigvora.com</div></div>
                </div>
                <div className="flex items-center gap-2 p-2.5 rounded-lg border">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div className="flex-1"><div className="text-[10px] font-medium">Resume_DemoUser.pdf</div><div className="text-[8px] text-muted-foreground">Last updated Mar 2025</div></div>
                  <Button variant="ghost" size="sm" className="h-5 text-[8px]">Change</Button>
                </div>
                <p className="text-[9px] text-muted-foreground">Your Gigvora profile, resume, and contact info will be shared with {job.company}.</p>
                <Button className="w-full h-8 text-xs" onClick={() => { setStep('submitted'); toast.success('Application submitted'); }}><Send className="h-3 w-3 mr-1" />Submit Application</Button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[8vh] px-4">
        <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-lg">Apply to {job.title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          {step === 'submitted' ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-[hsl(var(--state-healthy))] mx-auto mb-3" />
              <div className="text-lg font-semibold mb-1">Application Submitted!</div>
              <p className="text-sm text-muted-foreground mb-4">Your application for {job.title} at {job.company} has been sent.</p>
              <Button onClick={onClose}>Done</Button>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {step === 'info' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs font-medium mb-1 block">Full Name</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" defaultValue="Demo User" /></div>
                    <div><label className="text-xs font-medium mb-1 block">Email</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" defaultValue="demo@gigvora.com" /></div>
                  </div>
                  <div><label className="text-xs font-medium mb-1 block">Phone</label><input className="w-full h-9 rounded-lg border bg-background px-3 text-sm focus:ring-2 focus:ring-ring focus:outline-none" placeholder="+1 (555) 000-0000" /></div>
                  <div className="flex justify-end"><Button onClick={() => setStep('resume')}>Continue</Button></div>
                </>
              )}
              {step === 'resume' && (
                <>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm font-medium">Upload Resume</div>
                    <div className="text-[10px] text-muted-foreground">PDF, DOC, or DOCX up to 5MB</div>
                  </div>
                  <div className="flex justify-between"><Button variant="outline" onClick={() => setStep('info')}>Back</Button><Button onClick={() => setStep('cover')}>Continue</Button></div>
                </>
              )}
              {step === 'cover' && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-sm font-medium">Cover Letter</label>
                    <Button variant="ghost" size="sm" className="h-6 text-[9px]" onClick={handleAICover} disabled={aiLoading}><Sparkles className="h-3 w-3 mr-1" />{aiLoading ? 'Generating...' : 'AI Generate'}</Button>
                  </div>
                  <Textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={6} placeholder="Why are you a great fit?" />
                  <div className="flex justify-between"><Button variant="outline" onClick={() => setStep('resume')}>Back</Button><Button onClick={() => { setStep('submitted'); toast.success('Application submitted'); }}><Send className="h-3 w-3 mr-1" />Submit</Button></div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const JobDetailPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [saved, setSaved] = useState(false);
  const [following, setFollowing] = useState(false);
  const [applyOpen, setApplyOpen] = useState(false);
  const [easyApply, setEasyApply] = useState(false);

  const job = MOCK_JOBS.find(j => j.id === jobId) || MOCK_JOBS[0];
  const isSponsored = job.id === 'j1';
  const isClosed = false; // Toggle for demo
  const isRestricted = job.id === 'j5';

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <Link to="/jobs" className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors">
        <ChevronLeft className="h-3 w-3" />Jobs
      </Link>
      <div className="flex items-center gap-2 ml-2">
        <span className="text-xs font-semibold truncate max-w-[200px]">{job.title}</span>
        {isSponsored && <SponsoredBadge />}
        <StatusBadge status={isClosed ? 'blocked' : 'live'} label={isClosed ? 'Closed' : 'Active'} />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-6 text-[10px]" onClick={() => { setEasyApply(false); setApplyOpen(true); }} disabled={isClosed}><Send className="h-3 w-3 mr-1" />Apply Now</Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => { setEasyApply(true); setApplyOpen(true); }} disabled={isClosed}><Zap className="h-3 w-3 mr-1" />Easy Apply</Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => { setSaved(!saved); toast.success(saved ? 'Removed from saved' : 'Job saved'); }}>
          {saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
        </Button>
        <Button variant="outline" size="sm" className="h-6 text-[10px]" onClick={() => toast.info('Share link copied')}><Share2 className="h-3 w-3" /></Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      {/* Fit Score */}
      <SectionCard title="Candidate Fit" subtitle="AI-assessed match">
        <div className="flex items-center gap-3 mb-3">
          <div className="relative h-14 w-14 shrink-0">
            <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
              <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--accent))" strokeWidth="8" strokeDasharray={`${MOCK_FIT.score * 2.64} 264`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-bold">{MOCK_FIT.score}%</span></div>
          </div>
          <div className="flex-1">
            <div className="text-[10px] font-medium mb-0.5">Strong Match</div>
            <p className="text-[8px] text-muted-foreground">You match 4 of 5 key requirements for this role.</p>
          </div>
        </div>
        <div className="space-y-2">
          {MOCK_FIT.dimensions.map(d => (
            <div key={d.name}>
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-medium">{d.name}</span>
                <span className={cn('text-[9px] font-bold', d.score >= 90 ? 'text-[hsl(var(--state-healthy))]' : d.score >= 70 ? 'text-accent' : 'text-[hsl(var(--state-caution))]')}>{d.score}%</span>
              </div>
              <Progress value={d.score} className="h-1" />
              {'note' in d && <div className="text-[7px] text-muted-foreground mt-0.5">{d.note}</div>}
              {'matched' in d && (
                <div className="flex flex-wrap gap-0.5 mt-0.5">
                  {d.matched?.map(s => <span key={s} className="text-[6px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] rounded px-1 py-px">✓ {s}</span>)}
                  {d.missing?.map(s => <span key={s} className="text-[6px] bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))] rounded px-1 py-px">✗ {s}</span>)}
                </div>
              )}
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Company Card */}
      <SectionCard title="About the Company">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
          <div>
            <Link to={`/companies/${job.company.toLowerCase()}`} className="text-[10px] font-medium hover:text-accent transition-colors">{MOCK_COMPANY_INFO.name}</Link>
            <div className="text-[8px] text-muted-foreground">{MOCK_COMPANY_INFO.industry} &middot; {MOCK_COMPANY_INFO.size} employees</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-[8px] text-muted-foreground mb-2">
          <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-accent" />{MOCK_COMPANY_INFO.rating} ({MOCK_COMPANY_INFO.reviewCount})</span>
          <span>{MOCK_COMPANY_INFO.followers} followers</span>
          <span>{MOCK_COMPANY_INFO.openJobs} open jobs</span>
        </div>
        <Button variant="outline" size="sm" className="h-6 text-[9px] w-full" onClick={() => { setFollowing(!following); toast.success(following ? 'Unfollowed' : 'Following'); }}>
          {following ? <><CheckCircle2 className="h-3 w-3 mr-1" />Following</> : <><Heart className="h-3 w-3 mr-1" />Follow Company</>}
        </Button>
      </SectionCard>

      {/* Hiring Timeline */}
      <SectionCard title="Hiring Timeline">
        <div className="space-y-2">
          {MOCK_TIMELINE.map((t, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={cn('h-4 w-4 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5', t.status === 'done' ? 'border-accent bg-accent' : 'border-muted')}>
                {t.status === 'done' && <CheckCircle2 className="h-2 w-2 text-accent-foreground" />}
              </div>
              <div>
                <div className="text-[9px] font-medium">{t.event}</div>
                <div className="text-[7px] text-muted-foreground">{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions">
        <div className="space-y-1">
          {[
            { label: 'Message recruiter', icon: MessageSquare },
            { label: 'Set alert for similar', icon: Bell },
            { label: 'Report listing', icon: AlertTriangle },
            { label: 'View company page', icon: ExternalLink },
          ].map(a => (
            <button key={a.label} onClick={() => toast.info(a.label)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-md text-[9px] hover:bg-muted/50 transition-colors">
              <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom ── */
  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold flex items-center gap-1"><Eye className="h-3.5 w-3.5 text-accent" />Job Insights</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Views', value: '1.2K' },
          { label: 'Applicants', value: String(job.applicants) },
          { label: 'Avg. Fit Score', value: '74%' },
          { label: 'Response Rate', value: '68%' },
          { label: 'Days Open', value: '12' },
        ].map(s => (
          <div key={s.label} className="text-center">
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[9px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={bottomSection}>
      {isClosed && <ClosedBanner />}
      {isRestricted && <RestrictedBanner />}

      {/* ── Job Hero ── */}
      <div className="rounded-lg border p-4 mb-3 bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-start gap-3 mb-3">
          <div className="h-14 w-14 rounded-xl bg-muted flex items-center justify-center shrink-0"><Building2 className="h-7 w-7 text-muted-foreground" /></div>
          <div className="flex-1">
            <h1 className="text-base font-bold mb-0.5">{job.title}</h1>
            <div className="text-xs text-muted-foreground">{job.company}</div>
            <div className="flex flex-wrap gap-1.5 mt-1.5">
              <Badge variant="secondary" className="text-[8px] h-5 gap-1"><MapPin className="h-2.5 w-2.5" />{job.location}</Badge>
              <Badge variant="secondary" className="text-[8px] h-5 gap-1"><Briefcase className="h-2.5 w-2.5" />{job.type}</Badge>
              <Badge variant="secondary" className="text-[8px] h-5 gap-1"><DollarSign className="h-2.5 w-2.5" />{job.salary}</Badge>
              {job.remote && <Badge variant="secondary" className="text-[8px] h-5 gap-1"><Globe className="h-2.5 w-2.5" />Remote</Badge>}
              <Badge variant="secondary" className="text-[8px] h-5 gap-1"><Clock className="h-2.5 w-2.5" />{job.postedAt}</Badge>
              <Badge variant="secondary" className="text-[8px] h-5 gap-1"><Users className="h-2.5 w-2.5" />{job.applicants} applicants</Badge>
            </div>
          </div>
        </div>

        {/* Sticky Apply CTA */}
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-card border">
          <Button className="h-8 text-xs flex-1" onClick={() => { setEasyApply(false); setApplyOpen(true); }} disabled={isClosed}><Send className="h-3 w-3 mr-1" />Apply Now</Button>
          <Button variant="outline" className="h-8 text-xs" onClick={() => { setEasyApply(true); setApplyOpen(true); }} disabled={isClosed}><Zap className="h-3 w-3 mr-1" />Easy Apply</Button>
          <Button variant="outline" className="h-8 text-xs" onClick={() => { setSaved(!saved); toast.success(saved ? 'Removed' : 'Saved'); }}>
            {saved ? <BookmarkCheck className="h-3.5 w-3.5 text-accent" /> : <Bookmark className="h-3.5 w-3.5" />}
          </Button>
          <Button variant="outline" className="h-8 text-xs" onClick={() => toast.info('Link copied')}><Share2 className="h-3.5 w-3.5" /></Button>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <div className="flex gap-1 pb-2 mb-2">
        {([
          { id: 'overview' as DetailTab, label: 'Overview' },
          { id: 'company' as DetailTab, label: 'Company' },
          { id: 'similar' as DetailTab, label: 'Similar Jobs' },
        ]).map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors',
            activeTab === t.id ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
          )}>{t.label}</button>
        ))}
      </div>

      {/* ═══ OVERVIEW TAB ═══ */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          <SectionCard title="About this Role">
            <p className="text-[11px] text-muted-foreground leading-relaxed">{job.description}</p>
          </SectionCard>

          <SectionCard title="Requirements">
            <ul className="space-y-1.5">
              {job.requirements.map((r, i) => (
                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                  <CheckCircle2 className={cn('h-3.5 w-3.5 shrink-0 mt-0.5', MOCK_FIT.dimensions[0]?.matched?.some(s => r.toLowerCase().includes(s.toLowerCase())) ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground/40')} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Skills">
            <div className="flex flex-wrap gap-1.5">
              {job.skills.map(s => {
                const matched = MOCK_FIT.dimensions[0]?.matched?.includes(s);
                return (
                  <span key={s} className={cn('text-[9px] rounded-full px-2 py-0.5', matched ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>
                    {matched && '✓ '}{s}
                  </span>
                );
              })}
            </div>
          </SectionCard>

          <SectionCard title="Benefits & Perks">
            <ul className="space-y-1.5">
              {job.benefits.map((b, i) => (
                <li key={i} className="text-[11px] text-muted-foreground flex items-start gap-2">
                  <Star className="h-3.5 w-3.5 text-accent shrink-0 mt-0.5" />{b}
                </li>
              ))}
            </ul>
          </SectionCard>

          <SectionCard title="Role Facts">
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Seniority', value: 'Senior' },
                { label: 'Team Size', value: '8-12' },
                { label: 'Reports To', value: 'VP Engineering' },
                { label: 'Start Date', value: 'ASAP' },
                { label: 'Visa Sponsorship', value: job.id === 'j5' ? 'No' : 'Yes' },
                { label: 'Equity', value: 'Included' },
              ].map(f => (
                <div key={f.label} className="text-[10px]">
                  <span className="text-muted-foreground">{f.label}: </span>
                  <span className="font-medium">{f.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ COMPANY TAB ═══ */}
      {activeTab === 'company' && (
        <div className="space-y-3">
          <SectionCard title="Company Overview">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center"><Building2 className="h-6 w-6 text-muted-foreground" /></div>
              <div>
                <div className="text-sm font-semibold">{MOCK_COMPANY_INFO.name}</div>
                <div className="text-[10px] text-muted-foreground">{MOCK_COMPANY_INFO.industry} &middot; Founded {MOCK_COMPANY_INFO.founded} &middot; {MOCK_COMPANY_INFO.size} employees</div>
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">{MOCK_COMPANY_INFO.description}</p>
          </SectionCard>

          <SectionCard title="Company Rating">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl font-bold">{MOCK_COMPANY_INFO.rating}</div>
              <div>
                <div className="flex gap-0.5">{[...Array(5)].map((_, i) => <Star key={i} className={cn('h-3 w-3', i < Math.round(MOCK_COMPANY_INFO.rating) ? 'fill-accent text-accent' : 'text-muted')} />)}</div>
                <div className="text-[9px] text-muted-foreground">{MOCK_COMPANY_INFO.reviewCount} reviews</div>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Culture & Values">
            <div className="flex flex-wrap gap-1.5">
              {MOCK_COMPANY_INFO.culture.map(c => <Badge key={c} variant="secondary" className="text-[8px]">{c}</Badge>)}
            </div>
          </SectionCard>

          <SectionCard title="Tech Stack">
            <div className="flex flex-wrap gap-1.5">
              {MOCK_COMPANY_INFO.techStack.map(t => <span key={t} className="text-[9px] bg-accent/10 text-accent rounded-full px-2 py-0.5">{t}</span>)}
            </div>
          </SectionCard>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1" asChild><Link to={`/companies/${job.company.toLowerCase()}`}><Building2 className="h-3 w-3 mr-1" />View Full Company Page</Link></Button>
            <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => { setFollowing(!following); toast.success(following ? 'Unfollowed' : 'Following'); }}>
              {following ? 'Following' : 'Follow'}
            </Button>
          </div>
        </div>
      )}

      {/* ═══ SIMILAR JOBS TAB ═══ */}
      {activeTab === 'similar' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-semibold">Similar Open Positions</span>
          </div>
          <div className="space-y-1.5">
            {MOCK_SIMILAR_JOBS.map(sj => (
              <Link key={sj.id} to={`/jobs/${sj.id}`} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-muted/30 transition-colors block">
                <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium truncate">{sj.title}</div>
                  <div className="text-[9px] text-muted-foreground">{sj.company} &middot; {sj.salary} &middot; {sj.location}</div>
                </div>
                <div className={cn('text-[9px] font-bold px-1.5 py-0.5 rounded-full', sj.fit >= 75 ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground')}>{sj.fit}% fit</div>
              </Link>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] w-full" asChild><Link to="/jobs">Browse All Jobs</Link></Button>
        </div>
      )}

      {/* Apply Modal */}
      <ApplicationModal job={job} open={applyOpen} onClose={() => setApplyOpen(false)} easyApply={easyApply} />
    </DashboardLayout>
  );
};

export default JobDetailPage;
