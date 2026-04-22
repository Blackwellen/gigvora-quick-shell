import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, KPIBand, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Plus, Edit, Pause, Play, XCircle, Copy, Eye, Users,
  Building2, MapPin, DollarSign, Clock, Briefcase, Globe,
  TrendingUp, AlertTriangle, Search, Filter, MoreHorizontal,
  FileText, Send, CheckCircle2, Star, Calendar, X,
  BarChart3, Zap, Shield, Lock, CreditCard, Archive,
  ChevronRight, ExternalLink, MessageSquare,
  Sparkles, Upload, Settings, Target, Megaphone,
  ListChecks, LayoutList, LayoutGrid, Layers, Trash2,
  RefreshCw, ArrowUpRight, Hash, ToggleLeft,
  type LucideIcon,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'flagged' | 'expired' | 'pending';
type MainTab = 'postings' | 'credits' | 'templates' | 'archive' | 'analytics';

const STATUS_CFG: Record<JobStatus, { label: string; badge: 'pending' | 'healthy' | 'caution' | 'blocked' | 'review' | 'degraded' | 'live' }> = {
  draft: { label: 'Draft', badge: 'pending' },
  active: { label: 'Active', badge: 'healthy' },
  paused: { label: 'Paused', badge: 'caution' },
  closed: { label: 'Closed', badge: 'degraded' },
  flagged: { label: 'Under Review', badge: 'review' },
  expired: { label: 'Expired', badge: 'blocked' },
  pending: { label: 'Pending Review', badge: 'review' },
};

interface ScreeningQuestion {
  id: string;
  question: string;
  type: 'text' | 'yesno' | 'choice';
  required: boolean;
  options?: string[];
}

interface RecruiterJob {
  id: string;
  title: string;
  location: string;
  type: string;
  salary: string;
  remote: boolean;
  status: JobStatus;
  createdDate: string;
  lastUpdate: string;
  views: number;
  applicants: number;
  shortlisted: number;
  interviews: number;
  hires: number;
  creditCost: number;
  owner: string;
  team: boolean;
  skills: string[];
  expiresAt?: string;
  visibility: 'public' | 'unlisted' | 'internal';
  boosted: boolean;
  screeningQuestions: ScreeningQuestion[];
}

const MOCK_SCREENING: ScreeningQuestion[] = [
  { id: 'sq1', question: 'How many years of React experience do you have?', type: 'text', required: true },
  { id: 'sq2', question: 'Are you authorized to work in the US?', type: 'yesno', required: true },
  { id: 'sq3', question: 'Preferred work arrangement?', type: 'choice', required: false, options: ['Remote', 'Hybrid', 'On-site'] },
];

const MOCK_REC_JOBS: RecruiterJob[] = [
  { id: 'rj1', title: 'Senior Frontend Engineer', location: 'San Francisco, CA', type: 'Full-time', salary: '$150K-$200K', remote: true, status: 'active', createdDate: 'Apr 1, 2025', lastUpdate: '2 hours ago', views: 1243, applicants: 45, shortlisted: 12, interviews: 4, hires: 0, creditCost: 3, owner: 'Sarah Chen', team: false, skills: ['React', 'TypeScript', 'CSS'], expiresAt: 'May 1, 2025', visibility: 'public', boosted: true, screeningQuestions: MOCK_SCREENING },
  { id: 'rj2', title: 'Product Designer', location: 'New York, NY', type: 'Full-time', salary: '$120K-$160K', remote: true, status: 'active', createdDate: 'Mar 28, 2025', lastUpdate: '6 hours ago', views: 892, applicants: 67, shortlisted: 18, interviews: 6, hires: 0, creditCost: 3, owner: 'Sarah Chen', team: true, skills: ['Figma', 'UX Research', 'Prototyping'], visibility: 'public', boosted: false, screeningQuestions: [MOCK_SCREENING[1]] },
  { id: 'rj3', title: 'DevOps Engineer', location: 'Austin, TX', type: 'Full-time', salary: '$140K-$180K', remote: true, status: 'paused', createdDate: 'Mar 15, 2025', lastUpdate: '3 days ago', views: 456, applicants: 23, shortlisted: 8, interviews: 2, hires: 0, creditCost: 3, owner: 'Marcus Webb', team: true, skills: ['Kubernetes', 'Terraform', 'AWS'], visibility: 'public', boosted: false, screeningQuestions: [] },
  { id: 'rj4', title: 'Data Scientist', location: 'Remote', type: 'Contract', salary: '$100/hr', remote: true, status: 'draft', createdDate: 'Apr 10, 2025', lastUpdate: '1 day ago', views: 0, applicants: 0, shortlisted: 0, interviews: 0, hires: 0, creditCost: 2, owner: 'Sarah Chen', team: false, skills: ['Python', 'ML', 'SQL'], visibility: 'unlisted', boosted: false, screeningQuestions: [] },
  { id: 'rj5', title: 'Marketing Manager', location: 'London, UK', type: 'Full-time', salary: '£70K-£90K', remote: false, status: 'closed', createdDate: 'Feb 10, 2025', lastUpdate: '2 weeks ago', views: 2100, applicants: 89, shortlisted: 22, interviews: 8, hires: 2, creditCost: 3, owner: 'Marcus Webb', team: true, skills: ['B2B Marketing', 'Content Strategy'], visibility: 'public', boosted: false, screeningQuestions: MOCK_SCREENING },
  { id: 'rj6', title: 'Mobile Developer', location: 'Berlin, DE', type: 'Full-time', salary: '€80K-€110K', remote: true, status: 'flagged', createdDate: 'Mar 20, 2025', lastUpdate: '1 day ago', views: 340, applicants: 34, shortlisted: 5, interviews: 0, hires: 0, creditCost: 3, owner: 'Sarah Chen', team: false, skills: ['React Native', 'TypeScript'], visibility: 'public', boosted: false, screeningQuestions: [] },
  { id: 'rj7', title: 'Backend Engineer', location: 'Remote', type: 'Full-time', salary: '$130K-$170K', remote: true, status: 'pending', createdDate: 'Apr 12, 2025', lastUpdate: '3 hours ago', views: 0, applicants: 0, shortlisted: 0, interviews: 0, hires: 0, creditCost: 3, owner: 'Sarah Chen', team: false, skills: ['Node.js', 'PostgreSQL', 'AWS'], visibility: 'public', boosted: false, screeningQuestions: MOCK_SCREENING.slice(0, 2) },
  { id: 'rj8', title: 'QA Lead', location: 'Chicago, IL', type: 'Full-time', salary: '$110K-$140K', remote: false, status: 'expired', createdDate: 'Jan 5, 2025', lastUpdate: '1 month ago', views: 1800, applicants: 52, shortlisted: 15, interviews: 5, hires: 1, creditCost: 3, owner: 'Marcus Webb', team: true, skills: ['Selenium', 'Cypress', 'JIRA'], visibility: 'public', boosted: false, screeningQuestions: [] },
];

const MAIN_TABS: { id: MainTab; label: string; icon: LucideIcon }[] = [
  { id: 'postings', label: 'My Postings', icon: Briefcase },
  { id: 'credits', label: 'Credits', icon: CreditCard },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'archive', label: 'Archive', icon: Archive },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const CREDIT_HISTORY = [
  { id: 'ch1', action: 'Posted "Senior Frontend Engineer"', credits: -3, date: 'Apr 1, 2025', balance: 8 },
  { id: 'ch2', action: 'Posted "Product Designer"', credits: -3, date: 'Mar 28, 2025', balance: 11 },
  { id: 'ch3', action: 'Boost "Senior Frontend Engineer"', credits: -2, date: 'Apr 3, 2025', balance: 6 },
  { id: 'ch4', action: 'Purchased 20 credits', credits: 20, date: 'Mar 25, 2025', balance: 14 },
  { id: 'ch5', action: 'Posted "DevOps Engineer"', credits: -3, date: 'Mar 15, 2025', balance: -6 },
];

const JOB_TEMPLATES = [
  { id: 't1', name: 'Software Engineer', uses: 12, lastUsed: 'Apr 1, 2025' },
  { id: 't2', name: 'Product Manager', uses: 8, lastUsed: 'Mar 15, 2025' },
  { id: 't3', name: 'Designer', uses: 5, lastUsed: 'Feb 20, 2025' },
];

const ACTIVITY = [
  { actor: 'System', action: '"Backend Engineer" is pending moderation review', time: '3h ago' },
  { actor: 'Sarah Chen', action: 'edited "Data Scientist" draft, added screening questions', time: '1d ago' },
  { actor: 'Marcus Webb', action: 'paused "DevOps Engineer" — budget hold', time: '3d ago' },
  { actor: 'Moderation', action: '"Mobile Developer" flagged — review required', time: '1d ago' },
];

/* ═══════════════════════════════════════════════════════════
   State Banners
   ═══════════════════════════════════════════════════════════ */
const CreditWarningBanner: React.FC<{ credits: number }> = ({ credits }) => (
  <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3.5 flex items-center gap-3 mb-3">
    <CreditCard className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-semibold">Low Posting Credits</div>
      <div className="text-[9px] text-muted-foreground">You have {credits} credits remaining. Active jobs continue but new postings require credits.</div>
    </div>
    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Buy Credits</Button>
  </div>
);

const FlaggedBanner: React.FC<{ count: number }> = ({ count }) => (
  <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3.5 flex items-center gap-3 mb-3">
    <Shield className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-semibold">{count} Job{count > 1 ? 's' : ''} Flagged for Review</div>
      <div className="text-[9px] text-muted-foreground">Moderation has flagged listings that may violate posting guidelines.</div>
    </div>
    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Review</Button>
  </div>
);

const PendingBanner: React.FC<{ count: number }> = ({ count }) => (
  <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3.5 flex items-center gap-3 mb-3">
    <Clock className="h-4 w-4 text-accent shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-semibold">{count} Job{count > 1 ? 's' : ''} Pending Moderation</div>
      <div className="text-[9px] text-muted-foreground">Typically reviewed within 1-2 hours during business hours.</div>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Post Job Wizard (5-step)
   ═══════════════════════════════════════════════════════════ */
type WizardStep = 'basics' | 'screening' | 'visibility' | 'credits' | 'review';
const WIZARD_STEPS: { id: WizardStep; label: string; icon: LucideIcon }[] = [
  { id: 'basics', label: 'Job Details', icon: FileText },
  { id: 'screening', label: 'Screening', icon: ListChecks },
  { id: 'visibility', label: 'Visibility', icon: Eye },
  { id: 'credits', label: 'Credits & Boost', icon: CreditCard },
  { id: 'review', label: 'Review', icon: CheckCircle2 },
];

const PostJobWizard: React.FC<{ open: boolean; onClose: () => void; editJob?: RecruiterJob }> = ({ open, onClose, editJob }) => {
  const [step, setStep] = useState<WizardStep>('basics');
  const [questions, setQuestions] = useState<ScreeningQuestion[]>(editJob?.screeningQuestions || []);
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'internal'>(editJob?.visibility || 'public');
  const [boosted, setBoosted] = useState(editJob?.boosted || false);
  const [publishing, setPublishing] = useState(false);

  const stepIdx = WIZARD_STEPS.findIndex(s => s.id === step);
  const next = () => { if (stepIdx < WIZARD_STEPS.length - 1) setStep(WIZARD_STEPS[stepIdx + 1].id); };
  const prev = () => { if (stepIdx > 0) setStep(WIZARD_STEPS[stepIdx - 1].id); };

  const addQuestion = () => setQuestions(q => [...q, { id: `sq-${Date.now()}`, question: '', type: 'text', required: false }]);
  const removeQuestion = (id: string) => setQuestions(q => q.filter(x => x.id !== id));

  const handlePublish = () => {
    setPublishing(true);
    setTimeout(() => {
      setPublishing(false);
      onClose();
      toast.success(editJob ? 'Job updated successfully' : 'Job submitted for review!');
    }, 800);
  };

  if (!open) return null;

  const creditCost = 3 + (boosted ? 2 : 0);

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[4vh] px-4">
        <div className="w-full max-w-2xl bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-bold text-sm flex items-center gap-2">
              <Plus className="h-4 w-4 text-accent" />
              {editJob ? 'Edit Job Posting' : 'Create Job Posting'}
            </h2>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>

          {/* Step indicator */}
          <div className="px-6 py-3 border-b bg-muted/20">
            <div className="flex items-center gap-1">
              {WIZARD_STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <button onClick={() => setStep(s.id)} className={cn('flex items-center gap-1 px-2 py-1 rounded-xl text-[8px] font-semibold transition-all', step === s.id ? 'bg-accent text-accent-foreground' : i < stepIdx ? 'text-accent' : 'text-muted-foreground')}>
                    <div className={cn('h-4 w-4 rounded-full flex items-center justify-center text-[7px]', step === s.id ? 'bg-accent-foreground/20' : i < stepIdx ? 'bg-accent/10' : 'bg-muted')}>
                      {i < stepIdx ? <CheckCircle2 className="h-2.5 w-2.5" /> : i + 1}
                    </div>
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                  {i < WIZARD_STEPS.length - 1 && <div className={cn('flex-1 h-px', i < stepIdx ? 'bg-accent' : 'bg-muted')} />}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 max-h-[55vh] overflow-y-auto space-y-4">
            {step === 'basics' && (
              <>
                <div><label className="text-[10px] font-semibold mb-1.5 block">Job Title *</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:ring-2 focus:ring-accent/30 focus:outline-none" defaultValue={editJob?.title || ''} placeholder="e.g. Senior Frontend Engineer" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-semibold mb-1.5 block">Location</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:ring-2 focus:ring-accent/30 focus:outline-none" defaultValue={editJob?.location || ''} placeholder="City, State" /></div>
                  <div><label className="text-[10px] font-semibold mb-1.5 block">Job Type</label>
                    <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" defaultValue={editJob?.type || 'Full-time'}>
                      <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Freelance</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-semibold mb-1.5 block">Salary Range</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" defaultValue={editJob?.salary || ''} placeholder="$100K - $150K" /></div>
                  <div className="flex items-end gap-2 pb-1"><label className="flex items-center gap-2 text-[11px] cursor-pointer"><input type="checkbox" className="rounded" defaultChecked={editJob?.remote} /> Remote eligible</label></div>
                </div>
                <div><label className="text-[10px] font-semibold mb-1.5 block">Description *</label><Textarea className="rounded-xl text-[11px]" rows={4} placeholder="Describe the role, responsibilities, and ideal candidate..." /></div>
                <div><label className="text-[10px] font-semibold mb-1.5 block">Required Skills</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" defaultValue={editJob?.skills.join(', ') || ''} placeholder="React, TypeScript, CSS (comma-separated)" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-semibold mb-1.5 block">Requirements</label><Textarea className="rounded-xl text-[11px]" rows={3} placeholder="One requirement per line" /></div>
                  <div><label className="text-[10px] font-semibold mb-1.5 block">Benefits</label><Textarea className="rounded-xl text-[11px]" rows={3} placeholder="One benefit per line" /></div>
                </div>
              </>
            )}

            {step === 'screening' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold">Screening Questions</div>
                    <div className="text-[9px] text-muted-foreground">Add questions applicants must answer before submitting.</div>
                  </div>
                  <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={addQuestion}><Plus className="h-3 w-3" />Add Question</Button>
                </div>
                {questions.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed p-8 text-center">
                    <ListChecks className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                    <div className="text-[11px] font-semibold mb-1">No Screening Questions</div>
                    <div className="text-[9px] text-muted-foreground mb-3">Adding screening questions helps filter candidates and saves review time.</div>
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={addQuestion}><Plus className="h-3 w-3" />Add First Question</Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {questions.map((q, i) => (
                      <div key={q.id} className="rounded-2xl border bg-card p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[9px] font-bold text-muted-foreground">Question {i + 1}</span>
                          <button onClick={() => removeQuestion(q.id)}><Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" /></button>
                        </div>
                        <input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]" defaultValue={q.question} placeholder="Enter your question..." />
                        <div className="flex items-center gap-3">
                          <select className="h-7 rounded-xl border bg-background px-2 text-[9px]" defaultValue={q.type}>
                            <option value="text">Text</option><option value="yesno">Yes/No</option><option value="choice">Multiple Choice</option>
                          </select>
                          <label className="flex items-center gap-1 text-[9px]"><input type="checkbox" className="rounded" defaultChecked={q.required} /> Required</label>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <div className="rounded-2xl border bg-accent/5 p-3">
                  <div className="text-[9px] font-semibold text-accent mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" />AI Suggestion</div>
                  <div className="text-[8px] text-muted-foreground mb-2">Based on the role, consider adding: work authorization, years of experience, salary expectations.</div>
                  <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-1" onClick={() => { setQuestions(q => [...q, ...MOCK_SCREENING]); toast.success('AI questions added'); }}><Sparkles className="h-2.5 w-2.5" />Add Suggested</Button>
                </div>
              </>
            )}

            {step === 'visibility' && (
              <>
                <div className="text-[11px] font-bold mb-1">Distribution & Visibility</div>
                <div className="space-y-2">
                  {[
                    { id: 'public' as const, label: 'Public', desc: 'Visible on marketplace, search engines, and social shares', icon: Globe },
                    { id: 'unlisted' as const, label: 'Unlisted', desc: 'Only accessible via direct link — not indexed or browsable', icon: Lock },
                    { id: 'internal' as const, label: 'Internal Only', desc: 'Only visible to your organization members', icon: Building2 },
                  ].map(v => (
                    <button key={v.id} onClick={() => setVisibility(v.id)} className={cn('w-full rounded-2xl border p-3.5 flex items-start gap-3 text-left transition-all hover:shadow-sm', visibility === v.id ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'hover:bg-muted/20')}>
                      <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', visibility === v.id ? 'bg-accent/10' : 'bg-muted')}><v.icon className={cn('h-4 w-4', visibility === v.id ? 'text-accent' : 'text-muted-foreground')} /></div>
                      <div>
                        <div className="text-[11px] font-bold">{v.label}</div>
                        <div className="text-[9px] text-muted-foreground">{v.desc}</div>
                      </div>
                      {visibility === v.id && <CheckCircle2 className="h-4 w-4 text-accent ml-auto shrink-0 mt-0.5" />}
                    </button>
                  ))}
                </div>
                <div className="rounded-2xl border p-3.5 space-y-2 mt-2">
                  <div className="text-[11px] font-bold">Distribution Channels</div>
                  {['Gigvora Marketplace', 'Google Jobs', 'LinkedIn Feed', 'Email to talent pool'].map(ch => (
                    <label key={ch} className="flex items-center gap-2 text-[10px]">
                      <input type="checkbox" className="rounded" defaultChecked={visibility === 'public'} disabled={visibility !== 'public'} />
                      <span className={visibility !== 'public' ? 'text-muted-foreground' : ''}>{ch}</span>
                    </label>
                  ))}
                  {visibility !== 'public' && <div className="text-[8px] text-muted-foreground italic">Distribution channels require Public visibility.</div>}
                </div>
              </>
            )}

            {step === 'credits' && (
              <>
                <div className="rounded-2xl border p-4 bg-card">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[11px] font-bold">Posting Cost</div>
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="h-4 w-4 text-accent" />
                      <span className="text-lg font-bold">{creditCost}</span>
                      <span className="text-[9px] text-muted-foreground">credits</span>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-[9px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Base listing (30 days)</span><span className="font-semibold">3 credits</span></div>
                    {boosted && <div className="flex justify-between"><span className="text-muted-foreground">Priority boost</span><span className="font-semibold text-accent">+2 credits</span></div>}
                    <div className="border-t pt-1.5 flex justify-between font-bold"><span>Total</span><span>{creditCost} credits</span></div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 px-1">
                  <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">Your balance: <span className="font-bold text-foreground">8 credits</span></span>
                  {creditCost > 8 && <Badge variant="destructive" className="text-[7px] ml-1">Insufficient</Badge>}
                </div>

                <div className="rounded-2xl border p-3.5 mt-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-[11px] font-bold flex items-center gap-1"><Megaphone className="h-3.5 w-3.5 text-accent" />Priority Boost</div>
                      <div className="text-[9px] text-muted-foreground">2× visibility, featured badge, top of search results</div>
                    </div>
                    <button onClick={() => setBoosted(!boosted)} className={cn('h-6 w-11 rounded-full transition-all relative', boosted ? 'bg-accent' : 'bg-muted')}>
                      <div className={cn('h-4.5 w-4.5 bg-white rounded-full absolute top-[3px] transition-all shadow-sm', boosted ? 'left-[22px]' : 'left-[3px]')} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { label: 'Featured Listing', desc: 'Highlighted in discovery', cost: '+1 credit', icon: Star },
                    { label: 'Urgent Badge', desc: 'Priority hiring signal', cost: '+1 credit', icon: Zap },
                  ].map(opt => (
                    <div key={opt.label} className="rounded-2xl border p-3 flex items-start gap-2 hover:bg-muted/10 transition-all cursor-pointer">
                      <input type="checkbox" className="rounded mt-0.5" />
                      <div>
                        <div className="text-[10px] font-semibold flex items-center gap-1"><opt.icon className="h-3 w-3 text-accent" />{opt.label}</div>
                        <div className="text-[8px] text-muted-foreground">{opt.desc}</div>
                        <div className="text-[8px] font-medium text-accent mt-0.5">{opt.cost}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 'review' && (
              <div className="space-y-3">
                <div className="rounded-2xl border p-4 bg-muted/20">
                  <div className="text-[11px] font-bold mb-2">Summary</div>
                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div><span className="text-muted-foreground">Title:</span> <span className="font-semibold">{editJob?.title || 'New Job'}</span></div>
                    <div><span className="text-muted-foreground">Visibility:</span> <span className="font-semibold capitalize">{visibility}</span></div>
                    <div><span className="text-muted-foreground">Screening:</span> <span className="font-semibold">{questions.length} questions</span></div>
                    <div><span className="text-muted-foreground">Boost:</span> <span className="font-semibold">{boosted ? 'Yes' : 'No'}</span></div>
                    <div><span className="text-muted-foreground">Cost:</span> <span className="font-bold text-accent">{creditCost} credits</span></div>
                    <div><span className="text-muted-foreground">Duration:</span> <span className="font-semibold">30 days</span></div>
                  </div>
                </div>
                <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-semibold">Moderation Review</div>
                    <div className="text-[9px] text-muted-foreground">Your job posting will be reviewed by our moderation team before going live. This typically takes 1-2 hours during business hours.</div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between px-6 py-4 border-t">
            {stepIdx > 0 ? <Button variant="outline" className="rounded-xl" onClick={prev}>Back</Button> : <div />}
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl text-[10px]" onClick={() => { toast.info('Draft saved'); onClose(); }}>Save Draft</Button>
              {step === 'review' ? (
                <Button className="rounded-xl gap-1 text-[10px]" onClick={handlePublish} disabled={publishing || creditCost > 8}>
                  <Send className="h-3 w-3" />{publishing ? 'Submitting...' : editJob ? 'Update Job' : 'Submit for Review'}
                </Button>
              ) : (
                <Button className="rounded-xl text-[10px]" onClick={next}>Continue</Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const RecruiterJobsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [mainTab, setMainTab] = useState<MainTab>('postings');
  const [statusFilter, setStatusFilter] = useState<'all' | JobStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [postModalOpen, setPostModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<RecruiterJob | undefined>();
  const [ownerFilter, setOwnerFilter] = useState<'all' | 'mine' | 'team'>('all');

  const remainingCredits = 8;
  const flaggedCount = MOCK_REC_JOBS.filter(j => j.status === 'flagged').length;
  const pendingCount = MOCK_REC_JOBS.filter(j => j.status === 'pending').length;

  const filteredJobs = useMemo(() => {
    let jobs = [...MOCK_REC_JOBS].filter(j => j.status !== 'expired' && j.status !== 'closed');
    if (statusFilter !== 'all') jobs = jobs.filter(j => j.status === statusFilter);
    if (ownerFilter === 'mine') jobs = jobs.filter(j => j.owner === 'Sarah Chen');
    if (ownerFilter === 'team') jobs = jobs.filter(j => j.team);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.location.toLowerCase().includes(q));
    }
    return jobs;
  }, [statusFilter, ownerFilter, searchQuery]);

  const archivedJobs = MOCK_REC_JOBS.filter(j => j.status === 'closed' || j.status === 'expired');
  const selectedJob = MOCK_REC_JOBS.find(j => j.id === selectedJobId);

  const totalActive = MOCK_REC_JOBS.filter(j => j.status === 'active').length;
  const totalApplicants = MOCK_REC_JOBS.reduce((s, j) => s + j.applicants, 0);
  const totalHires = MOCK_REC_JOBS.reduce((s, j) => s + j.hires, 0);

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Briefcase className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Job Posting Studio</span>
        <StatusBadge status="live" label={`${totalActive} Active`} />
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-muted/50 text-[9px]">
          <CreditCard className="h-3 w-3 text-accent" />
          <span className="font-bold">{remainingCredits}</span>
          <span className="text-muted-foreground">credits</span>
        </div>
        <div className="relative w-36">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search jobs..." className="w-full h-7 pl-7 pr-3 rounded-xl border bg-background text-[9px] focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => { setEditingJob(undefined); setPostModalOpen(true); }}><Plus className="h-3 w-3" />Post Job</Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Posting Credits" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-lg font-bold">{remainingCredits}</span>
          <span className="text-[9px] text-muted-foreground">remaining</span>
        </div>
        <Progress value={(remainingCredits / 20) * 100} className="h-1.5 mb-2" />
        <div className="text-[8px] text-muted-foreground mb-2">Each posting costs 2-5 credits based on visibility.</div>
        <Button variant="outline" size="sm" className="h-6 text-[9px] w-full rounded-xl">Buy Credits</Button>
      </SectionCard>

      <SectionCard title="Filter by Owner" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {(['all', 'mine', 'team'] as const).map(f => (
            <button key={f} onClick={() => setOwnerFilter(f)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-semibold capitalize transition-all', ownerFilter === f ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted')}>{f === 'mine' ? 'My Jobs' : f === 'team' ? 'Team Shared' : 'All'}</button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Post new job', icon: Plus, onClick: () => { setEditingJob(undefined); setPostModalOpen(true); } },
            { label: 'View all applicants', icon: Users },
            { label: 'Buy credits', icon: CreditCard, onClick: () => setMainTab('credits') },
            { label: 'Export report', icon: FileText },
            { label: 'Posting guidelines', icon: Shield },
          ].map(a => (
            <button key={a.label} onClick={a.onClick || (() => toast.info(a.label))} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" /><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom ── */
  const bottomSection = (
    <div className="px-1">
      <div className="text-[10px] font-bold mb-2 flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY.map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[200px] hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-0.5"><Avatar className="h-4 w-4 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{a.actor[0]}</AvatarFallback></Avatar><span className="text-[9px] font-semibold">{a.actor}</span></div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <KPIBand className="mb-4">
        <KPICard label="Active Jobs" value={totalActive} change="listings" trend="up" />
        <KPICard label="Applicants" value={totalApplicants} change="total" trend="up" />
        <KPICard label="Interviews" value={MOCK_REC_JOBS.reduce((s, j) => s + j.interviews, 0)} change="scheduled" />
        <KPICard label="Hires" value={totalHires} change="this quarter" trend="up" />
        <KPICard label="Credits" value={remainingCredits} change="remaining" trend={remainingCredits < 5 ? 'down' : 'neutral'} />
      </KPIBand>

      {remainingCredits <= 5 && <CreditWarningBanner credits={remainingCredits} />}
      {flaggedCount > 0 && <FlaggedBanner count={flaggedCount} />}
      {pendingCount > 0 && <PendingBanner count={pendingCount} />}

      {/* ── Main Tab Nav ── */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4 overflow-x-auto">
        {MAIN_TABS.map(t => (
          <button key={t.id} onClick={() => setMainTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0',
            mainTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
          </button>
        ))}
      </div>

      {/* ═══ POSTINGS TAB ═══ */}
      {mainTab === 'postings' && (
        <>
          {/* Status filter chips */}
          <div className="flex gap-1 overflow-x-auto pb-2 mb-2">
            {(['all', 'draft', 'active', 'paused', 'pending', 'flagged'] as const).map(t => {
              const count = t === 'all' ? filteredJobs.length : MOCK_REC_JOBS.filter(j => j.status === t).length;
              return (
                <button key={t} onClick={() => setStatusFilter(t)} className={cn(
                  'px-2.5 py-1 rounded-xl text-[9px] font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 capitalize transition-all',
                  statusFilter === t ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}>
                  {t}
                  <span className={cn('text-[7px] rounded-full px-1', statusFilter === t ? 'bg-accent-foreground/20' : 'bg-muted')}>{count}</span>
                </button>
              );
            })}
          </div>

          {filteredJobs.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center">
              <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No jobs found</div>
              <div className="text-[9px] text-muted-foreground mb-3">Adjust your filters or post a new job.</div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => { setEditingJob(undefined); setPostModalOpen(true); }}><Plus className="h-3 w-3" />Post Job</Button>
            </div>
          ) : (
            <div className="rounded-2xl border overflow-hidden">
              <div className="grid grid-cols-[1fr_80px_55px_55px_55px_110px] gap-2 px-3 py-2 bg-muted/50 border-b text-[7px] font-bold text-muted-foreground uppercase tracking-wider">
                <span>Job</span><span>Status</span><span className="text-right">Views</span><span className="text-right">Apps</span><span className="text-right">Hires</span><span className="text-right">Actions</span>
              </div>
              {filteredJobs.map(job => {
                const cfg = STATUS_CFG[job.status];
                return (
                  <div key={job.id} className={cn('grid grid-cols-[1fr_80px_55px_55px_55px_110px] gap-2 px-3 py-2.5 border-b last:border-0 hover:bg-muted/20 transition-all cursor-pointer items-center group', job.status === 'flagged' && 'bg-[hsl(var(--state-blocked)/0.02)]')} onClick={() => setSelectedJobId(job.id)}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-muted-foreground/40" /></div>
                      <div className="min-w-0">
                        <div className="text-[10px] font-bold truncate group-hover:text-accent transition-colors flex items-center gap-1">
                          {job.title}
                          {job.boosted && <Zap className="h-2.5 w-2.5 text-accent shrink-0" />}
                          {job.visibility !== 'public' && <Lock className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                        </div>
                        <div className="text-[8px] text-muted-foreground truncate">{job.location}{job.remote ? ' · Remote' : ''} · {job.salary}</div>
                      </div>
                    </div>
                    <StatusBadge status={cfg.badge} label={cfg.label} />
                    <div className="text-[10px] text-right font-medium">{job.views > 999 ? `${(job.views / 1000).toFixed(1)}K` : job.views}</div>
                    <div className="text-[10px] text-right font-medium">{job.applicants}</div>
                    <div className="text-[10px] text-right font-medium">{job.hires}</div>
                    <div className="flex items-center justify-end gap-1">
                      {job.status === 'draft' && <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); setEditingJob(job); setPostModalOpen(true); }}><Edit className="h-2 w-2 mr-0.5" />Edit</Button>}
                      {job.status === 'active' && <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Job paused'); }}><Pause className="h-2 w-2 mr-0.5" />Pause</Button>}
                      {job.status === 'paused' && <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.success('Job resumed'); }}><Play className="h-2 w-2 mr-0.5" />Resume</Button>}
                      {job.status === 'pending' && <Badge variant="secondary" className="text-[7px] h-5">In Queue</Badge>}
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 rounded-lg" onClick={e => e.stopPropagation()}><MoreHorizontal className="h-3 w-3" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ═══ CREDITS TAB ═══ */}
      {mainTab === 'credits' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl border bg-card p-4 text-center">
              <CreditCard className="h-6 w-6 text-accent mx-auto mb-1" />
              <div className="text-2xl font-bold">{remainingCredits}</div>
              <div className="text-[9px] text-muted-foreground">Available Credits</div>
            </div>
            <div className="rounded-2xl border bg-card p-4 text-center">
              <TrendingUp className="h-6 w-6 text-[hsl(var(--state-healthy))] mx-auto mb-1" />
              <div className="text-2xl font-bold">14</div>
              <div className="text-[9px] text-muted-foreground">Used This Month</div>
            </div>
            <div className="rounded-2xl border bg-card p-4 text-center">
              <Calendar className="h-6 w-6 text-muted-foreground mx-auto mb-1" />
              <div className="text-2xl font-bold">May 1</div>
              <div className="text-[9px] text-muted-foreground">Next Refill</div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[
              { credits: 10, price: '$19', badge: '' },
              { credits: 25, price: '$39', badge: 'Popular' },
              { credits: 50, price: '$69', badge: 'Best Value' },
            ].map(pkg => (
              <div key={pkg.credits} className={cn('rounded-2xl border p-4 text-center hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer relative', pkg.badge === 'Best Value' && 'border-accent ring-1 ring-accent/30')}>
                {pkg.badge && <Badge className="absolute -top-2 left-1/2 -translate-x-1/2 text-[7px] rounded-lg">{pkg.badge}</Badge>}
                <div className="text-2xl font-bold mt-1">{pkg.credits}</div>
                <div className="text-[9px] text-muted-foreground mb-2">credits</div>
                <div className="text-sm font-bold mb-2">{pkg.price}</div>
                <Button size="sm" className="h-7 text-[9px] w-full rounded-xl">Purchase</Button>
              </div>
            ))}
          </div>

          <SectionCard title="Credit History" icon={<Clock className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {CREDIT_HISTORY.map(h => (
                <div key={h.id} className="flex items-center justify-between py-1.5 border-b last:border-0 text-[9px]">
                  <div className="flex-1">
                    <div className="font-medium">{h.action}</div>
                    <div className="text-[8px] text-muted-foreground">{h.date}</div>
                  </div>
                  <div className={cn('font-bold', h.credits > 0 ? 'text-[hsl(var(--state-healthy))]' : 'text-[hsl(var(--state-blocked))]')}>
                    {h.credits > 0 ? '+' : ''}{h.credits}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ TEMPLATES TAB ═══ */}
      {mainTab === 'templates' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">Job Templates</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Template</Button>
          </div>
          {JOB_TEMPLATES.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No Templates</div>
              <div className="text-[9px] text-muted-foreground">Save time by creating reusable job templates.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {JOB_TEMPLATES.map(t => (
                <div key={t.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer group">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-muted-foreground/50" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold group-hover:text-accent transition-colors">{t.name}</div>
                    <div className="text-[9px] text-muted-foreground">Used {t.uses} times · Last: {t.lastUsed}</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1" onClick={() => { setEditingJob(undefined); setPostModalOpen(true); toast.info('Template loaded'); }}><Copy className="h-2.5 w-2.5" />Use</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Edit className="h-2.5 w-2.5" />Edit</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ ARCHIVE TAB ═══ */}
      {mainTab === 'archive' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{archivedJobs.length} Archived Jobs</span>
          </div>
          {archivedJobs.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center">
              <Archive className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No Archived Jobs</div>
              <div className="text-[9px] text-muted-foreground">Closed and expired jobs will appear here.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {archivedJobs.map(job => {
                const cfg = STATUS_CFG[job.status];
                return (
                  <div key={job.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-md transition-all cursor-pointer group opacity-80 hover:opacity-100" onClick={() => setSelectedJobId(job.id)}>
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-muted-foreground/40" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{job.title}</div>
                      <div className="text-[9px] text-muted-foreground">{job.location} · {job.applicants} applicants · {job.hires} hires</div>
                    </div>
                    <StatusBadge status={cfg.badge} label={cfg.label} />
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5" onClick={e => { e.stopPropagation(); toast.success('Job duplicated for reposting'); }}><Copy className="h-2 w-2" />Repost</Button>
                      <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><RefreshCw className="h-2 w-2" />Reopen</Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ ANALYTICS TAB ═══ */}
      {mainTab === 'analytics' && (
        <div className="space-y-4">
          <SectionCard title="Hiring Performance" subtitle="Last 30 days" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="grid grid-cols-6 gap-3">
              {[
                { label: 'Views', value: `${(MOCK_REC_JOBS.reduce((s, j) => s + j.views, 0) / 1000).toFixed(1)}K` },
                { label: 'Applications', value: String(totalApplicants) },
                { label: 'Shortlisted', value: String(MOCK_REC_JOBS.reduce((s, j) => s + j.shortlisted, 0)) },
                { label: 'Interviews', value: String(MOCK_REC_JOBS.reduce((s, j) => s + j.interviews, 0)) },
                { label: 'Offers', value: '4' },
                { label: 'Hires', value: String(totalHires) },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-lg font-bold">{s.value}</div>
                  <div className="text-[8px] text-muted-foreground">{s.label}</div>
                </div>
              ))}
            </div>
          </SectionCard>

          <div className="grid grid-cols-2 gap-3">
            <SectionCard title="Conversion Funnel" className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { stage: 'Views → Apps', pct: 4.2 },
                  { stage: 'Apps → Shortlist', pct: 28.7 },
                  { stage: 'Shortlist → Interview', pct: 42.5 },
                  { stage: 'Interview → Hire', pct: 25.0 },
                ].map(f => (
                  <div key={f.stage}>
                    <div className="flex justify-between text-[9px] mb-0.5"><span className="text-muted-foreground">{f.stage}</span><span className="font-bold">{f.pct}%</span></div>
                    <Progress value={f.pct} className="h-1" />
                  </div>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Credits Usage" className="!rounded-2xl">
              <div className="space-y-2">
                {[
                  { label: 'Job Postings', value: 9, total: 14 },
                  { label: 'Boosts', value: 3, total: 14 },
                  { label: 'Featured', value: 2, total: 14 },
                ].map(u => (
                  <div key={u.label}>
                    <div className="flex justify-between text-[9px] mb-0.5"><span className="text-muted-foreground">{u.label}</span><span className="font-bold">{u.value} credits</span></div>
                    <Progress value={(u.value / u.total) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </SectionCard>
          </div>

          <SectionCard title="Top Performing Jobs" className="!rounded-2xl">
            <div className="space-y-1.5">
              {MOCK_REC_JOBS.filter(j => j.status === 'active').sort((a, b) => b.applicants - a.applicants).slice(0, 3).map((j, i) => (
                <div key={j.id} className="flex items-center gap-2 py-1.5 border-b last:border-0 text-[9px] cursor-pointer hover:bg-muted/20 rounded-lg px-1" onClick={() => setSelectedJobId(j.id)}>
                  <span className="text-[8px] font-bold text-muted-foreground w-4">#{i + 1}</span>
                  <span className="flex-1 font-medium truncate">{j.title}</span>
                  <span className="text-muted-foreground">{j.applicants} apps</span>
                  <span className="text-muted-foreground">{j.views} views</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Job Detail Drawer ── */}
      <Sheet open={!!selectedJob} onOpenChange={() => setSelectedJobId(null)}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent" />Job Details</SheetTitle></SheetHeader>
          {selectedJob && (() => {
            const cfg = STATUS_CFG[selectedJob.status];
            return (
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center shadow-sm"><Building2 className="h-6 w-6 text-muted-foreground/30" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-[13px] font-bold">{selectedJob.title}</h3>
                      {selectedJob.boosted && <Badge className="text-[7px] gap-0.5 rounded-lg bg-accent/10 text-accent border-0"><Zap className="h-2 w-2" />Boosted</Badge>}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{selectedJob.location}{selectedJob.remote ? ' · Remote' : ''}</div>
                    <div className="flex items-center gap-1.5 mt-1">
                      <StatusBadge status={cfg.badge} label={cfg.label} />
                      <Badge variant="secondary" className="text-[7px] capitalize rounded-lg">{selectedJob.visibility}</Badge>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[8px] gap-1 rounded-lg"><Briefcase className="h-2.5 w-2.5" />{selectedJob.type}</Badge>
                  <Badge variant="secondary" className="text-[8px] gap-1 rounded-lg"><DollarSign className="h-2.5 w-2.5" />{selectedJob.salary}</Badge>
                  <Badge variant="secondary" className="text-[8px] gap-1 rounded-lg"><CreditCard className="h-2.5 w-2.5" />{selectedJob.creditCost} credits</Badge>
                  <Badge variant="secondary" className="text-[8px] gap-1 rounded-lg">Owner: {selectedJob.owner}</Badge>
                  {selectedJob.team && <Badge variant="secondary" className="text-[8px] gap-1 rounded-lg"><Users className="h-2.5 w-2.5" />Team</Badge>}
                </div>

                {/* Performance */}
                <SectionCard title="Performance" className="!rounded-2xl">
                  <div className="grid grid-cols-4 gap-2 text-center">
                    {[
                      { label: 'Views', value: selectedJob.views },
                      { label: 'Apps', value: selectedJob.applicants },
                      { label: 'Short', value: selectedJob.shortlisted },
                      { label: 'Hires', value: selectedJob.hires },
                    ].map(s => (
                      <div key={s.label}><div className="text-sm font-bold">{s.value}</div><div className="text-[8px] text-muted-foreground">{s.label}</div></div>
                    ))}
                  </div>
                </SectionCard>

                {/* Pipeline */}
                <SectionCard title="Candidate Pipeline" className="!rounded-2xl">
                  <div className="space-y-1.5">
                    {[
                      { stage: 'Applied', count: selectedJob.applicants, pct: 100 },
                      { stage: 'Shortlisted', count: selectedJob.shortlisted, pct: selectedJob.applicants > 0 ? (selectedJob.shortlisted / selectedJob.applicants) * 100 : 0 },
                      { stage: 'Interviewing', count: selectedJob.interviews, pct: selectedJob.applicants > 0 ? (selectedJob.interviews / selectedJob.applicants) * 100 : 0 },
                      { stage: 'Hired', count: selectedJob.hires, pct: selectedJob.applicants > 0 ? (selectedJob.hires / selectedJob.applicants) * 100 : 0 },
                    ].map(s => (
                      <div key={s.stage}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px]">{s.stage}</span>
                          <span className="text-[9px] font-bold">{s.count}</span>
                        </div>
                        <Progress value={s.pct} className="h-1" />
                      </div>
                    ))}
                  </div>
                </SectionCard>

                {/* Screening */}
                {selectedJob.screeningQuestions.length > 0 && (
                  <SectionCard title={`Screening (${selectedJob.screeningQuestions.length})`} icon={<ListChecks className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
                    <div className="space-y-1">
                      {selectedJob.screeningQuestions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-1.5 text-[9px]">
                          <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                          <span>{q.question}</span>
                          {q.required && <Badge variant="secondary" className="text-[6px] h-3 shrink-0">Req</Badge>}
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Skills */}
                <div>
                  <h4 className="text-[10px] font-bold mb-1.5">Required Skills</h4>
                  <div className="flex flex-wrap gap-1">{selectedJob.skills.map(s => <span key={s} className="text-[8px] bg-accent/10 text-accent rounded-lg px-2 py-0.5 font-medium">{s}</span>)}</div>
                </div>

                {/* Meta */}
                <div className="text-[9px] space-y-1 rounded-2xl border p-3 bg-muted/10">
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{selectedJob.createdDate}</span></div>
                  <div><span className="text-muted-foreground">Last Updated:</span> <span className="font-medium">{selectedJob.lastUpdate}</span></div>
                  {selectedJob.expiresAt && <div><span className="text-muted-foreground">Expires:</span> <span className="font-medium">{selectedJob.expiresAt}</span></div>}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 pt-2 border-t">
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => { setEditingJob(selectedJob); setPostModalOpen(true); setSelectedJobId(null); }}><Edit className="h-3 w-3 mr-1" />Edit</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => toast.success('Job duplicated')}><Copy className="h-3 w-3 mr-1" />Duplicate</Button>
                  </div>
                  <div className="flex gap-1.5">
                    {selectedJob.status === 'active' && <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => toast.info('Job paused')}><Pause className="h-3 w-3 mr-1" />Pause</Button>}
                    {selectedJob.status === 'paused' && <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => toast.success('Job resumed')}><Play className="h-3 w-3 mr-1" />Resume</Button>}
                    {selectedJob.status !== 'closed' && selectedJob.status !== 'expired' && <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl text-[hsl(var(--state-blocked))]" onClick={() => toast.info('Job closed')}><XCircle className="h-3 w-3 mr-1" />Close</Button>}
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[10px] w-full rounded-xl" onClick={() => toast.info('Viewing applicants')}><Users className="h-3 w-3 mr-1" />View {selectedJob.applicants} Applicants</Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      <PostJobWizard open={postModalOpen} onClose={() => { setPostModalOpen(false); setEditingJob(undefined); }} editJob={editingJob} />
    </DashboardLayout>
  );
};

export default RecruiterJobsPage;
