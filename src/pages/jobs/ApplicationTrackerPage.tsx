import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
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
  Building2, Clock, CheckCircle2, XCircle, Eye, Send, Calendar,
  MessageSquare, FileText, Upload, AlertTriangle, Bell, BellOff,
  Plus, X, ChevronRight, TrendingUp, Star, ExternalLink,
  Archive, RotateCcw, Sparkles, Video, Phone, Shield,
  Briefcase, DollarSign, MapPin, Globe, Edit, Copy,
  ListChecks, User, PenLine, BarChart3, Hash, Lock,
  ArrowUpRight, RefreshCw, Trash2, Download, Zap,
  type LucideIcon,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type AppTab = 'active' | 'interviewing' | 'offers' | 'rejected' | 'drafts' | 'archived';
type AppStatus = 'draft' | 'submitted' | 'reviewing' | 'interview_scheduled' | 'interview_complete' | 'offer' | 'rejected' | 'withdrawn' | 'archived';
type WizardStep = 'profile' | 'screening' | 'cover' | 'review';

const APP_TABS: { id: AppTab; label: string; icon: LucideIcon }[] = [
  { id: 'active', label: 'Active', icon: Send },
  { id: 'interviewing', label: 'Interviewing', icon: Video },
  { id: 'offers', label: 'Offers', icon: Star },
  { id: 'rejected', label: 'Rejected', icon: XCircle },
  { id: 'drafts', label: 'Drafts', icon: Edit },
  { id: 'archived', label: 'Archive', icon: Archive },
];

const STATUS_CONFIG: Record<AppStatus, { label: string; status: 'healthy' | 'caution' | 'blocked' | 'pending' | 'review' | 'degraded' | 'live' }> = {
  draft: { label: 'Draft', status: 'pending' },
  submitted: { label: 'Submitted', status: 'pending' },
  reviewing: { label: 'Under Review', status: 'review' },
  interview_scheduled: { label: 'Interview Scheduled', status: 'live' },
  interview_complete: { label: 'Interview Complete', status: 'healthy' },
  offer: { label: 'Offer Received', status: 'healthy' },
  rejected: { label: 'Not Selected', status: 'blocked' },
  withdrawn: { label: 'Withdrawn', status: 'degraded' },
  archived: { label: 'Archived', status: 'degraded' },
};

const WIZARD_STEPS: { id: WizardStep; label: string; icon: LucideIcon }[] = [
  { id: 'profile', label: 'Profile & CV', icon: User },
  { id: 'screening', label: 'Screening', icon: ListChecks },
  { id: 'cover', label: 'Cover Note', icon: PenLine },
  { id: 'review', label: 'Review', icon: CheckCircle2 },
];

/* ── Mock Data ── */
interface ScreeningQ {
  id: string;
  question: string;
  type: 'text' | 'yesno' | 'choice';
  required: boolean;
  options?: string[];
  answer?: string;
}

interface MockApplication {
  id: string;
  jobId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  remote: boolean;
  status: AppStatus;
  appliedDate: string;
  lastUpdate: string;
  fitScore: number;
  timeline: { date: string; event: string; detail?: string }[];
  interviewDate?: string;
  interviewType?: 'video' | 'phone' | 'onsite';
  offerAmount?: string;
  offerDeadline?: string;
  rejectionReason?: string;
  notes?: string;
  screeningQuestions: ScreeningQ[];
  coverNote?: string;
  resumeVersion?: string;
  draftSavedAt?: string;
}

const MOCK_SCREENING: ScreeningQ[] = [
  { id: 'sq1', question: 'How many years of React experience do you have?', type: 'text', required: true, answer: '5 years' },
  { id: 'sq2', question: 'Are you authorized to work in the US?', type: 'yesno', required: true, answer: 'Yes' },
  { id: 'sq3', question: 'Preferred work arrangement?', type: 'choice', required: false, options: ['Remote', 'Hybrid', 'On-site'], answer: 'Remote' },
];

const MOCK_APPS: MockApplication[] = [
  {
    id: 'a1', jobId: 'j1', title: 'Senior Frontend Engineer', company: 'TechCorp', location: 'San Francisco, CA', salary: '$150K-$200K', type: 'Full-time', remote: true,
    status: 'reviewing', appliedDate: 'Apr 5, 2025', lastUpdate: '2 days ago', fitScore: 88,
    screeningQuestions: MOCK_SCREENING, coverNote: 'I am excited about this opportunity...',
    resumeVersion: 'Resume_v3_Apr2025.pdf',
    timeline: [
      { date: 'Apr 5', event: 'Application submitted' },
      { date: 'Apr 7', event: 'Application viewed by recruiter' },
      { date: 'Apr 10', event: 'Moved to review queue', detail: 'Recruiter: Sarah Chen' },
    ],
  },
  {
    id: 'a2', jobId: 'j2', title: 'Product Designer', company: 'DesignHub', location: 'New York, NY', salary: '$120K-$160K', type: 'Full-time', remote: true,
    status: 'interview_scheduled', appliedDate: 'Apr 2, 2025', lastUpdate: '1 day ago', fitScore: 76,
    interviewDate: 'Apr 18, 2025 2:00 PM', interviewType: 'video',
    screeningQuestions: [MOCK_SCREENING[1]], coverNote: 'With 6 years of design experience...',
    resumeVersion: 'Resume_Design_v2.pdf',
    timeline: [
      { date: 'Apr 2', event: 'Application submitted' },
      { date: 'Apr 4', event: 'Application reviewed' },
      { date: 'Apr 8', event: 'Phone screen completed', detail: 'With HR team' },
      { date: 'Apr 11', event: 'Interview scheduled', detail: 'Technical round via Zoom' },
    ],
  },
  {
    id: 'a3', jobId: 'j4', title: 'Data Scientist', company: 'AnalyticsPro', location: 'Remote', salary: '$100/hr', type: 'Contract', remote: true,
    status: 'submitted', appliedDate: 'Apr 8, 2025', lastUpdate: '4 hours ago', fitScore: 65,
    screeningQuestions: [], coverNote: 'I bring extensive ML experience...',
    resumeVersion: 'Resume_v3_Apr2025.pdf',
    timeline: [{ date: 'Apr 8', event: 'Application submitted' }],
  },
  {
    id: 'a4', jobId: 'j6', title: 'Mobile Developer', company: 'AppWorks', location: 'Berlin, DE', salary: '€80K-€110K', type: 'Full-time', remote: true,
    status: 'interview_complete', appliedDate: 'Mar 25, 2025', lastUpdate: '3 days ago', fitScore: 72,
    screeningQuestions: MOCK_SCREENING.slice(0, 2),
    timeline: [
      { date: 'Mar 25', event: 'Application submitted' },
      { date: 'Mar 28', event: 'Application reviewed' },
      { date: 'Apr 2', event: 'Phone screen completed' },
      { date: 'Apr 8', event: 'Technical interview completed', detail: 'Panel with engineering team' },
      { date: 'Apr 10', event: 'Awaiting decision' },
    ],
  },
  {
    id: 'a5', jobId: 'j3', title: 'DevOps Engineer', company: 'CloudScale', location: 'Austin, TX', salary: '$140K-$180K', type: 'Full-time', remote: true,
    status: 'offer', appliedDate: 'Mar 15, 2025', lastUpdate: '1 day ago', fitScore: 82,
    offerAmount: '$165,000 + equity', offerDeadline: 'Apr 20, 2025',
    screeningQuestions: MOCK_SCREENING,
    timeline: [
      { date: 'Mar 15', event: 'Application submitted' },
      { date: 'Mar 18', event: 'Application reviewed' },
      { date: 'Mar 22', event: 'Phone screen' },
      { date: 'Mar 28', event: 'Technical interview' },
      { date: 'Apr 3', event: 'Final round' },
      { date: 'Apr 10', event: 'Offer extended', detail: '$165K + equity package' },
    ],
  },
  {
    id: 'a6', jobId: 'j5', title: 'Marketing Manager', company: 'GrowthEngine', location: 'London, UK', salary: '£70K-£90K', type: 'Full-time', remote: false,
    status: 'rejected', appliedDate: 'Mar 20, 2025', lastUpdate: '1 week ago', fitScore: 45,
    rejectionReason: 'Position requires UK work authorization',
    screeningQuestions: [],
    timeline: [
      { date: 'Mar 20', event: 'Application submitted' },
      { date: 'Mar 25', event: 'Application reviewed' },
      { date: 'Mar 28', event: 'Not selected', detail: 'Visa sponsorship not available' },
    ],
  },
  {
    id: 'a7', jobId: 'j1', title: 'Backend Engineer', company: 'DataFlow', location: 'Remote', salary: '$130K-$170K', type: 'Full-time', remote: true,
    status: 'rejected', appliedDate: 'Mar 10, 2025', lastUpdate: '2 weeks ago', fitScore: 58,
    rejectionReason: 'Position filled by internal candidate',
    screeningQuestions: [],
    timeline: [
      { date: 'Mar 10', event: 'Application submitted' },
      { date: 'Mar 15', event: 'Application reviewed' },
      { date: 'Mar 20', event: 'Phone screen' },
      { date: 'Mar 25', event: 'Not selected', detail: 'Position filled internally' },
    ],
  },
  {
    id: 'a8', jobId: 'j2', title: 'UX Researcher', company: 'UserFirst', location: 'Seattle, WA', salary: '$110K-$140K', type: 'Full-time', remote: true,
    status: 'archived', appliedDate: 'Feb 15, 2025', lastUpdate: '1 month ago', fitScore: 60,
    screeningQuestions: [],
    timeline: [
      { date: 'Feb 15', event: 'Application submitted' },
      { date: 'Feb 20', event: 'No response after 30 days' },
      { date: 'Mar 18', event: 'Auto-archived' },
    ],
  },
  {
    id: 'a9', jobId: 'j9', title: 'Full-Stack Developer', company: 'StartupX', location: 'Remote', salary: '$120K-$160K', type: 'Full-time', remote: true,
    status: 'draft', appliedDate: '', lastUpdate: '3 hours ago', fitScore: 78,
    screeningQuestions: MOCK_SCREENING.slice(0, 1),
    coverNote: 'I am passionate about building...',
    draftSavedAt: 'Apr 13, 2025 10:42 AM',
    timeline: [],
  },
  {
    id: 'a10', jobId: 'j10', title: 'Platform Engineer', company: 'InfraCore', location: 'Chicago, IL', salary: '$140K-$175K', type: 'Full-time', remote: false,
    status: 'draft', appliedDate: '', lastUpdate: '1 day ago', fitScore: 71,
    screeningQuestions: [],
    draftSavedAt: 'Apr 12, 2025 4:15 PM',
    timeline: [],
  },
];

const MOCK_ALERTS = [
  { id: 'al1', query: 'Frontend Engineer, Remote', frequency: 'Daily', matches: 12, active: true, created: 'Mar 2025', lastSent: 'Apr 11, 2025' },
  { id: 'al2', query: 'Product Designer, $120K+', frequency: 'Weekly', matches: 8, active: true, created: 'Feb 2025', lastSent: 'Apr 7, 2025' },
  { id: 'al3', query: 'DevOps, Kubernetes', frequency: 'Daily', matches: 3, active: false, created: 'Jan 2025', lastSent: 'Mar 1, 2025' },
];

const ACTIVITY = [
  { actor: 'System', action: '"Senior Frontend Engineer" moved to review queue', time: '2d ago' },
  { actor: 'TechCorp', action: 'Recruiter Sarah Chen viewed your application', time: '2d ago' },
  { actor: 'DesignHub', action: 'Interview scheduled for Apr 18', time: '1d ago' },
  { actor: 'CloudScale', action: 'Offer extended — respond by Apr 20', time: '1d ago' },
];

/* ═══════════════════════════════════════════════════════════
   Application Wizard (4-step)
   ═══════════════════════════════════════════════════════════ */
const ApplicationWizard: React.FC<{ open: boolean; onClose: () => void; draftApp?: MockApplication }> = ({ open, onClose, draftApp }) => {
  const [step, setStep] = useState<WizardStep>('profile');
  const [coverNote, setCoverNote] = useState(draftApp?.coverNote || '');
  const [selectedResume, setSelectedResume] = useState(draftApp?.resumeVersion || 'Resume_v3_Apr2025.pdf');
  const [submitting, setSubmitting] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);

  const stepIdx = WIZARD_STEPS.findIndex(s => s.id === step);
  const next = () => { if (stepIdx < WIZARD_STEPS.length - 1) setStep(WIZARD_STEPS[stepIdx + 1].id); };
  const prev = () => { if (stepIdx > 0) setStep(WIZARD_STEPS[stepIdx - 1].id); };

  const handleSubmit = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onClose();
      toast.success('Application submitted successfully!', { description: 'You will receive updates via notifications.' });
    }, 1000);
  };

  const handleAICover = () => {
    setAiGenerating(true);
    setTimeout(() => {
      setCoverNote('Dear Hiring Manager,\n\nI am writing to express my strong interest in this position. With my background in software engineering and a passion for building scalable systems, I believe I would be an excellent fit for your team.\n\nMy experience includes 5+ years of frontend development with React and TypeScript, leading cross-functional initiatives, and delivering high-impact features. I am particularly drawn to your company\'s mission and the opportunity to contribute to innovative products.\n\nI look forward to discussing how my skills align with your needs.\n\nBest regards');
      setAiGenerating(false);
      toast.success('AI cover note generated');
    }, 1200);
  };

  if (!open) return null;

  const jobTitle = draftApp?.title || 'Senior Frontend Engineer';
  const company = draftApp?.company || 'TechCorp';

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[4vh] px-4">
        <div className="w-full max-w-2xl bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <div>
              <h2 className="font-bold text-sm flex items-center gap-2"><Send className="h-4 w-4 text-accent" />Apply to {jobTitle}</h2>
              <p className="text-[9px] text-muted-foreground">{company}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>

          {/* Step indicator */}
          <div className="px-6 py-3 border-b bg-muted/20">
            <div className="flex items-center gap-1">
              {WIZARD_STEPS.map((s, i) => (
                <React.Fragment key={s.id}>
                  <button onClick={() => setStep(s.id)} className={cn('flex items-center gap-1 px-2.5 py-1 rounded-xl text-[8px] font-semibold transition-all', step === s.id ? 'bg-accent text-accent-foreground' : i < stepIdx ? 'text-accent' : 'text-muted-foreground')}>
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
            {/* Step 1: Profile & CV */}
            {step === 'profile' && (
              <>
                <div className="text-[11px] font-bold mb-1">Choose Your Profile & Resume</div>

                {/* Profile Card */}
                <div className="rounded-2xl border p-3.5 flex items-center gap-3 bg-accent/5 ring-1 ring-accent/30">
                  <Avatar className="h-10 w-10 ring-2 ring-accent/20"><AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">JD</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="text-[11px] font-bold">John Doe</div>
                    <div className="text-[9px] text-muted-foreground">Senior Software Engineer · San Francisco, CA</div>
                    <div className="flex gap-1 mt-1">
                      <Badge variant="secondary" className="text-[7px] rounded-lg">React</Badge>
                      <Badge variant="secondary" className="text-[7px] rounded-lg">TypeScript</Badge>
                      <Badge variant="secondary" className="text-[7px] rounded-lg">Node.js</Badge>
                    </div>
                  </div>
                  <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />
                </div>

                {/* Resume Selection */}
                <div>
                  <label className="text-[10px] font-semibold mb-1.5 block">Resume / CV</label>
                  <div className="space-y-1.5">
                    {[
                      { name: 'Resume_v3_Apr2025.pdf', date: 'Apr 10, 2025', size: '245 KB', active: true },
                      { name: 'Resume_Design_v2.pdf', date: 'Mar 15, 2025', size: '312 KB', active: false },
                      { name: 'CV_Academic_2024.pdf', date: 'Dec 20, 2024', size: '480 KB', active: false },
                    ].map(r => (
                      <button key={r.name} onClick={() => setSelectedResume(r.name)} className={cn('w-full rounded-2xl border p-3 flex items-center gap-3 text-left transition-all hover:shadow-sm', selectedResume === r.name ? 'border-accent bg-accent/5 ring-1 ring-accent/30' : 'hover:bg-muted/20')}>
                        <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', selectedResume === r.name ? 'bg-accent/10' : 'bg-muted')}><FileText className={cn('h-4 w-4', selectedResume === r.name ? 'text-accent' : 'text-muted-foreground')} /></div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[10px] font-semibold truncate">{r.name}</div>
                          <div className="text-[8px] text-muted-foreground">{r.date} · {r.size}</div>
                        </div>
                        {selectedResume === r.name && <CheckCircle2 className="h-3.5 w-3.5 text-accent shrink-0" />}
                      </button>
                    ))}
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] w-full mt-2 rounded-xl gap-1"><Upload className="h-3 w-3" />Upload New Resume</Button>
                </div>

                {/* Portfolio / Links */}
                <div>
                  <label className="text-[10px] font-semibold mb-1.5 block">Additional Links (optional)</label>
                  <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:ring-2 focus:ring-accent/30 focus:outline-none mb-1.5" placeholder="Portfolio URL" />
                  <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:ring-2 focus:ring-accent/30 focus:outline-none" placeholder="LinkedIn or GitHub URL" />
                </div>
              </>
            )}

            {/* Step 2: Screening Questions */}
            {step === 'screening' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold">Screening Questions</div>
                    <div className="text-[9px] text-muted-foreground">Required by the employer. Answer all required questions to proceed.</div>
                  </div>
                  <Badge variant="secondary" className="text-[7px]">{MOCK_SCREENING.filter(q => q.required).length} required</Badge>
                </div>

                {MOCK_SCREENING.length === 0 ? (
                  <div className="rounded-2xl border-2 border-dashed p-8 text-center">
                    <CheckCircle2 className="h-8 w-8 text-accent/30 mx-auto mb-2" />
                    <div className="text-[11px] font-semibold mb-1">No Screening Questions</div>
                    <div className="text-[9px] text-muted-foreground">This employer doesn't require screening. You can proceed.</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {MOCK_SCREENING.map((q, i) => (
                      <div key={q.id} className="rounded-2xl border bg-card p-3.5 space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-2">
                            <span className="text-[9px] font-bold text-muted-foreground bg-muted h-5 w-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">{i + 1}</span>
                            <div>
                              <div className="text-[10px] font-semibold">{q.question}</div>
                              <div className="text-[8px] text-muted-foreground mt-0.5">{q.type === 'yesno' ? 'Yes / No' : q.type === 'choice' ? 'Multiple choice' : 'Text response'}</div>
                            </div>
                          </div>
                          {q.required && <Badge variant="secondary" className="text-[6px] h-4 rounded-md shrink-0">Required</Badge>}
                        </div>
                        {q.type === 'text' && (
                          <Textarea className="rounded-xl text-[10px] min-h-[60px]" defaultValue={q.answer || ''} placeholder="Type your answer..." />
                        )}
                        {q.type === 'yesno' && (
                          <div className="flex gap-2">
                            {['Yes', 'No'].map(opt => (
                              <button key={opt} className={cn('px-4 py-1.5 rounded-xl text-[10px] font-semibold border transition-all', q.answer === opt ? 'bg-accent text-accent-foreground border-accent' : 'hover:bg-muted/30')}>{opt}</button>
                            ))}
                          </div>
                        )}
                        {q.type === 'choice' && q.options && (
                          <div className="flex flex-wrap gap-1.5">
                            {q.options.map(opt => (
                              <button key={opt} className={cn('px-3 py-1.5 rounded-xl text-[10px] font-semibold border transition-all', q.answer === opt ? 'bg-accent text-accent-foreground border-accent' : 'hover:bg-muted/30')}>{opt}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Step 3: Cover Note */}
            {step === 'cover' && (
              <>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-bold">Cover Note</div>
                    <div className="text-[9px] text-muted-foreground">Write a personalized note to the hiring team. AI assistance is available.</div>
                  </div>
                  <Badge variant="secondary" className="text-[7px]">Optional</Badge>
                </div>

                <div className="relative">
                  <Textarea className="rounded-xl text-[10px] min-h-[200px]" value={coverNote} onChange={e => setCoverNote(e.target.value)} placeholder="Dear Hiring Manager,&#10;&#10;I am excited to apply for this position because..." />
                  <div className="absolute bottom-2 right-2 text-[8px] text-muted-foreground">{coverNote.length} characters</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={handleAICover} disabled={aiGenerating}>
                    <Sparkles className={cn("h-3 w-3", aiGenerating && "animate-spin")} />
                    {aiGenerating ? 'Generating...' : 'AI Generate'}
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => { setCoverNote(''); toast.info('Cover note cleared'); }}>
                    <Trash2 className="h-3 w-3" />Clear
                  </Button>
                  <div className="flex-1" />
                  <div className="text-[8px] text-muted-foreground">Auto-saved</div>
                </div>

                <div className="rounded-2xl border bg-accent/5 p-3">
                  <div className="text-[9px] font-semibold text-accent mb-1 flex items-center gap-1"><Sparkles className="h-3 w-3" />AI Tips</div>
                  <div className="text-[8px] text-muted-foreground space-y-0.5">
                    <p>• Mention specific projects or achievements relevant to the role</p>
                    <p>• Reference the company's mission or recent news</p>
                    <p>• Keep it concise — 200-400 words is ideal</p>
                  </div>
                </div>
              </>
            )}

            {/* Step 4: Review & Submit */}
            {step === 'review' && (
              <div className="space-y-3">
                <div className="text-[11px] font-bold">Review Your Application</div>

                <div className="rounded-2xl border p-4 bg-muted/20 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Building2 className="h-5 w-5 text-muted-foreground/40" /></div>
                    <div>
                      <div className="text-[12px] font-bold">{jobTitle}</div>
                      <div className="text-[10px] text-muted-foreground">{company}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[9px]">
                    <div><span className="text-muted-foreground">Resume:</span> <span className="font-semibold">{selectedResume}</span></div>
                    <div><span className="text-muted-foreground">Screening:</span> <span className="font-semibold">{MOCK_SCREENING.length} answers</span></div>
                    <div><span className="text-muted-foreground">Cover Note:</span> <span className="font-semibold">{coverNote ? `${coverNote.length} chars` : 'None'}</span></div>
                    <div><span className="text-muted-foreground">Profile:</span> <span className="font-semibold">John Doe</span></div>
                  </div>
                </div>

                {/* Section previews */}
                {coverNote && (
                  <div className="rounded-2xl border p-3">
                    <div className="text-[9px] font-semibold mb-1 flex items-center gap-1"><PenLine className="h-3 w-3 text-accent" />Cover Note Preview</div>
                    <p className="text-[9px] text-muted-foreground whitespace-pre-wrap line-clamp-4">{coverNote}</p>
                    <button onClick={() => setStep('cover')} className="text-[8px] text-accent font-semibold mt-1 hover:underline">Edit</button>
                  </div>
                )}

                {MOCK_SCREENING.length > 0 && (
                  <div className="rounded-2xl border p-3">
                    <div className="text-[9px] font-semibold mb-1.5 flex items-center gap-1"><ListChecks className="h-3 w-3 text-accent" />Screening Answers</div>
                    <div className="space-y-1">
                      {MOCK_SCREENING.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-1.5 text-[8px]">
                          <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                          <span className="text-muted-foreground">{q.question}</span>
                          <span className="font-semibold ml-auto shrink-0">{q.answer || '—'}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => setStep('screening')} className="text-[8px] text-accent font-semibold mt-1 hover:underline">Edit</button>
                  </div>
                )}

                <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 flex items-start gap-2.5">
                  <Shield className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-semibold">Submission Confirmation</div>
                    <div className="text-[9px] text-muted-foreground">Once submitted, you can withdraw within 24 hours. Your application will be visible to the hiring team and tracked in your Application Tracker.</div>
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
                <Button className="rounded-xl gap-1 text-[10px]" onClick={handleSubmit} disabled={submitting}>
                  <Send className="h-3 w-3" />{submitting ? 'Submitting...' : 'Submit Application'}
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
   Withdraw Confirmation Modal
   ═══════════════════════════════════════════════════════════ */
const WithdrawModal: React.FC<{ app: MockApplication | null; onClose: () => void }> = ({ app, onClose }) => {
  const [reason, setReason] = useState('');
  if (!app) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative w-full max-w-md bg-card rounded-2xl border shadow-2xl p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 mb-3">
          <div className="h-8 w-8 rounded-xl bg-[hsl(var(--state-blocked)/0.1)] flex items-center justify-center"><XCircle className="h-4 w-4 text-[hsl(var(--state-blocked))]" /></div>
          <div>
            <div className="text-[12px] font-bold">Withdraw Application</div>
            <div className="text-[9px] text-muted-foreground">{app.title} at {app.company}</div>
          </div>
        </div>
        <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 mb-3">
          <div className="text-[9px] text-muted-foreground flex items-start gap-1.5"><AlertTriangle className="h-3 w-3 text-[hsl(var(--state-caution))] shrink-0 mt-0.5" />This action cannot be undone. The employer will be notified. You may not be able to re-apply for this role.</div>
        </div>
        <div className="mb-3">
          <label className="text-[10px] font-semibold mb-1.5 block">Reason (optional)</label>
          <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" value={reason} onChange={e => setReason(e.target.value)}>
            <option value="">Select a reason...</option>
            <option>Accepted another offer</option>
            <option>Role not a good fit</option>
            <option>Personal reasons</option>
            <option>Compensation mismatch</option>
            <option>Other</option>
          </select>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 rounded-xl" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" className="flex-1 rounded-xl gap-1" onClick={() => { toast.success('Application withdrawn'); onClose(); }}><XCircle className="h-3 w-3" />Withdraw</Button>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const ApplicationTrackerPage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<AppTab>('active');
  const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
  const [showAlerts, setShowAlerts] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [wizardDraft, setWizardDraft] = useState<MockApplication | undefined>();
  const [withdrawApp, setWithdrawApp] = useState<MockApplication | null>(null);

  const getTabApps = (tab: AppTab): MockApplication[] => {
    switch (tab) {
      case 'active': return MOCK_APPS.filter(a => ['submitted', 'reviewing'].includes(a.status));
      case 'interviewing': return MOCK_APPS.filter(a => ['interview_scheduled', 'interview_complete'].includes(a.status));
      case 'offers': return MOCK_APPS.filter(a => a.status === 'offer');
      case 'rejected': return MOCK_APPS.filter(a => ['rejected', 'withdrawn'].includes(a.status));
      case 'drafts': return MOCK_APPS.filter(a => a.status === 'draft');
      case 'archived': return MOCK_APPS.filter(a => a.status === 'archived');
    }
  };

  const tabApps = getTabApps(activeTab);
  const selectedApp = MOCK_APPS.find(a => a.id === selectedAppId);

  const activeCount = MOCK_APPS.filter(a => !['rejected', 'withdrawn', 'archived', 'draft'].includes(a.status)).length;
  const interviewCount = MOCK_APPS.filter(a => a.status === 'interview_scheduled').length;
  const offerCount = MOCK_APPS.filter(a => a.status === 'offer').length;
  const draftCount = MOCK_APPS.filter(a => a.status === 'draft').length;

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Application Tracker</span>
        <StatusBadge status="live" label={`${activeCount} Active`} />
        {draftCount > 0 && <StatusBadge status="pending" label={`${draftCount} Draft${draftCount > 1 ? 's' : ''}`} />}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => setShowAlerts(!showAlerts)}><Bell className="h-3 w-3 mr-1" />Alerts ({MOCK_ALERTS.filter(a => a.active).length})</Button>
        <Button size="sm" className="h-7 text-[9px] rounded-xl" asChild><Link to="/jobs"><Briefcase className="h-3 w-3 mr-1" />Browse Jobs</Link></Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Pipeline" subtitle="Application funnel" className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { label: 'Submitted', count: MOCK_APPS.filter(a => a.status === 'submitted').length, color: 'bg-muted-foreground/30' },
            { label: 'Reviewing', count: MOCK_APPS.filter(a => a.status === 'reviewing').length, color: 'bg-accent/50' },
            { label: 'Interviewing', count: MOCK_APPS.filter(a => ['interview_scheduled', 'interview_complete'].includes(a.status)).length, color: 'bg-accent' },
            { label: 'Offers', count: MOCK_APPS.filter(a => a.status === 'offer').length, color: 'bg-[hsl(var(--state-healthy))]' },
            { label: 'Rejected', count: MOCK_APPS.filter(a => a.status === 'rejected').length, color: 'bg-[hsl(var(--state-blocked))]' },
          ].map(stage => (
            <div key={stage.label} className="flex items-center gap-2">
              <div className={cn('h-2 w-2 rounded-full shrink-0', stage.color)} />
              <span className="text-[9px] flex-1">{stage.label}</span>
              <span className="text-[9px] font-bold">{stage.count}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Upcoming */}
      <SectionCard title="Upcoming" className="!rounded-2xl">
        <div className="space-y-1.5">
          {MOCK_APPS.filter(a => a.interviewDate).map(a => (
            <div key={a.id} className="flex items-start gap-2 p-1.5 rounded-xl bg-accent/5 cursor-pointer hover:bg-accent/10 transition-all" onClick={() => setSelectedAppId(a.id)}>
              <div className="h-5 w-5 rounded-lg flex items-center justify-center bg-accent/10 shrink-0 mt-0.5">
                {a.interviewType === 'video' ? <Video className="h-2.5 w-2.5 text-accent" /> : a.interviewType === 'phone' ? <Phone className="h-2.5 w-2.5 text-accent" /> : <Building2 className="h-2.5 w-2.5 text-accent" />}
              </div>
              <div>
                <div className="text-[9px] font-medium">{a.title}</div>
                <div className="text-[7px] text-muted-foreground">{a.interviewDate}</div>
              </div>
            </div>
          ))}
          {!MOCK_APPS.some(a => a.interviewDate) && <div className="text-[9px] text-muted-foreground text-center py-2">No upcoming interviews</div>}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Upload resume', icon: Upload },
            { label: 'Update profile', icon: User },
            { label: 'Manage alerts', icon: Bell, onClick: () => setShowAlerts(true) },
            { label: 'Export tracker', icon: Download },
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

  /* ── Bottom Section ── */
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
        <KPICard label="Active" value={activeCount} change="applications" trend="neutral" />
        <KPICard label="Interviews" value={interviewCount} change="scheduled" trend="up" />
        <KPICard label="Offers" value={offerCount} change="pending" trend="up" />
        <KPICard label="Response Rate" value="68%" change="avg 4.2 days" trend="neutral" />
      </KPIBand>

      {/* Stale banner */}
      {MOCK_APPS.some(a => a.status === 'submitted' && a.lastUpdate.includes('hours')) && (
        <div className="rounded-2xl border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3.5 flex items-center gap-3 mb-3">
          <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
          <div className="flex-1">
            <div className="text-[11px] font-semibold">Some statuses may be outdated</div>
            <div className="text-[9px] text-muted-foreground">1 application hasn't been updated in over 14 days. Consider following up.</div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Review</Button>
        </div>
      )}

      {/* Draft recovery banner */}
      {draftCount > 0 && activeTab !== 'drafts' && (
        <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3.5 flex items-center gap-3 mb-3">
          <Edit className="h-4 w-4 text-accent shrink-0" />
          <div className="flex-1">
            <div className="text-[11px] font-semibold">{draftCount} Unsaved Draft{draftCount > 1 ? 's' : ''}</div>
            <div className="text-[9px] text-muted-foreground">You have incomplete applications. Continue where you left off.</div>
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => setActiveTab('drafts')}>View Drafts</Button>
        </div>
      )}

      {/* Alerts panel */}
      {showAlerts && (
        <div className="rounded-2xl border p-3 mb-3 bg-card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold flex items-center gap-1"><Bell className="h-3.5 w-3.5 text-accent" />Job Alerts</span>
            <Button variant="ghost" size="sm" className="h-5 text-[8px]" onClick={() => setShowAlerts(false)}><X className="h-3 w-3" /></Button>
          </div>
          <div className="space-y-1.5">
            {MOCK_ALERTS.map(alert => (
              <div key={alert.id} className="flex items-center gap-3 p-2 rounded-xl border hover:bg-muted/30 transition-all">
                <div className={cn('h-7 w-7 rounded-xl flex items-center justify-center shrink-0', alert.active ? 'bg-accent/10' : 'bg-muted')}>
                  {alert.active ? <Bell className="h-3.5 w-3.5 text-accent" /> : <BellOff className="h-3.5 w-3.5 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium truncate">{alert.query}</span>
                    <StatusBadge status={alert.active ? 'healthy' : 'degraded'} label={alert.active ? 'Active' : 'Paused'} />
                  </div>
                  <div className="text-[8px] text-muted-foreground">{alert.frequency} · {alert.matches} matches · Last: {alert.lastSent}</div>
                </div>
                <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg">{alert.active ? 'Pause' : 'Resume'}</Button>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-6 text-[9px] w-full mt-2 rounded-xl"><Plus className="h-3 w-3 mr-1" />New Alert</Button>
        </div>
      )}

      {/* ── Tab Nav ── */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4 overflow-x-auto">
        {APP_TABS.map(t => {
          const count = getTabApps(t.id).length;
          return (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
              'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0',
              activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
            )}>
              <t.icon className="h-3 w-3" />{t.label}
              <span className={cn('text-[7px] rounded-full px-1.5', activeTab === t.id ? 'bg-accent/10 text-accent' : 'bg-muted')}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* ── Application List ── */}
      {tabApps.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed p-10 text-center">
          <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
          <div className="text-[11px] font-bold mb-1">No applications here</div>
          <div className="text-[9px] text-muted-foreground mb-3">
            {activeTab === 'active' ? 'Start applying to jobs to track them here.' : activeTab === 'drafts' ? 'No saved drafts.' : `No ${activeTab} applications at this time.`}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl" asChild><Link to="/jobs">Browse Jobs</Link></Button>
        </div>
      ) : (
        <div className="space-y-2">
          {tabApps.map(app => {
            const cfg = STATUS_CONFIG[app.status];
            return (
              <div key={app.id} className={cn(
                'rounded-2xl border p-3.5 hover:shadow-md transition-all cursor-pointer group',
                selectedAppId === app.id && 'ring-1 ring-accent',
                app.status === 'draft' && 'border-dashed',
              )} onClick={() => app.status === 'draft' ? (() => { setWizardDraft(app); setWizardOpen(true); })() : setSelectedAppId(app.id)}>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0 shadow-sm">
                    <Building2 className="h-5 w-5 text-muted-foreground/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{app.title}</span>
                        <StatusBadge status={cfg.status} label={cfg.label} />
                      </div>
                      <span className={cn('text-[8px] font-bold px-1.5 py-0.5 rounded-full shrink-0', app.fitScore >= 80 ? 'bg-accent/10 text-accent' : app.fitScore >= 60 ? 'bg-muted text-muted-foreground' : 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]')}>{app.fitScore}% fit</span>
                    </div>
                    <div className="text-[9px] text-muted-foreground">{app.company} · {app.salary} · {app.location}{app.remote ? ' (Remote)' : ''}</div>
                    <div className="flex items-center gap-3 mt-1.5 text-[8px] text-muted-foreground">
                      {app.appliedDate && <span className="flex items-center gap-0.5"><Calendar className="h-2.5 w-2.5" />Applied {app.appliedDate}</span>}
                      {app.draftSavedAt && <span className="flex items-center gap-0.5"><Edit className="h-2.5 w-2.5" />Draft saved {app.draftSavedAt}</span>}
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Updated {app.lastUpdate}</span>
                    </div>
                    {/* Contextual info */}
                    {app.interviewDate && (
                      <div className="mt-1.5 flex items-center gap-1.5 p-1.5 rounded-xl bg-accent/5 text-[8px]">
                        {app.interviewType === 'video' ? <Video className="h-2.5 w-2.5 text-accent" /> : <Phone className="h-2.5 w-2.5 text-accent" />}
                        <span className="font-medium text-accent">Interview: {app.interviewDate}</span>
                      </div>
                    )}
                    {app.offerAmount && (
                      <div className="mt-1.5 flex items-center gap-1.5 p-1.5 rounded-xl bg-[hsl(var(--state-healthy)/0.05)] text-[8px]">
                        <Star className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" />
                        <span className="font-medium text-[hsl(var(--state-healthy))]">Offer: {app.offerAmount}</span>
                        {app.offerDeadline && <span className="text-muted-foreground">· Deadline: {app.offerDeadline}</span>}
                      </div>
                    )}
                    {app.rejectionReason && <div className="mt-1.5 text-[8px] text-muted-foreground italic">{app.rejectionReason}</div>}
                  </div>
                </div>
                {/* Quick actions row */}
                <div className="flex items-center gap-1.5 mt-2.5 ml-[52px]">
                  {app.status === 'draft' ? (
                    <>
                      <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); setWizardDraft(app); setWizardOpen(true); }}><Edit className="h-2 w-2 mr-0.5" />Continue</Button>
                      <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg text-[hsl(var(--state-blocked))]" onClick={e => { e.stopPropagation(); toast.success('Draft deleted'); }}><Trash2 className="h-2 w-2 mr-0.5" />Delete</Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); setSelectedAppId(app.id); }}><Eye className="h-2 w-2 mr-0.5" />View</Button>
                      {!['rejected', 'withdrawn', 'archived'].includes(app.status) && (
                        <Button variant="outline" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); setWithdrawApp(app); }}><XCircle className="h-2 w-2 mr-0.5" />Withdraw</Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Message sent to recruiter'); }}><MessageSquare className="h-2 w-2 mr-0.5" />Message</Button>
                      {app.status === 'archived' && (
                        <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg" onClick={e => { e.stopPropagation(); toast.success('Restored'); }}><RotateCcw className="h-2 w-2 mr-0.5" />Restore</Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Application Detail Drawer ── */}
      <Sheet open={!!selectedApp} onOpenChange={() => setSelectedAppId(null)}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4 text-accent" />Application Details</SheetTitle></SheetHeader>
          {selectedApp && (() => {
            const cfg = STATUS_CONFIG[selectedApp.status];
            return (
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center shadow-sm"><Building2 className="h-6 w-6 text-muted-foreground/30" /></div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold">{selectedApp.title}</div>
                    <div className="text-[10px] text-muted-foreground">{selectedApp.company}</div>
                    <div className="flex items-center gap-1.5 mt-1"><StatusBadge status={cfg.status} label={cfg.label} /></div>
                  </div>
                </div>

                {/* Meta */}
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[8px] gap-0.5 rounded-lg"><MapPin className="h-2 w-2" />{selectedApp.location}</Badge>
                  <Badge variant="secondary" className="text-[8px] gap-0.5 rounded-lg"><DollarSign className="h-2 w-2" />{selectedApp.salary}</Badge>
                  <Badge variant="secondary" className="text-[8px] gap-0.5 rounded-lg"><Briefcase className="h-2 w-2" />{selectedApp.type}</Badge>
                  {selectedApp.remote && <Badge variant="secondary" className="text-[8px] gap-0.5 rounded-lg"><Globe className="h-2 w-2" />Remote</Badge>}
                </div>

                {/* Fit Score */}
                <div className="flex items-center gap-3 p-3 rounded-2xl bg-accent/5">
                  <div className="relative h-10 w-10 shrink-0">
                    <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="50" cy="50" r="42" fill="none" stroke="hsl(var(--accent))" strokeWidth="8" strokeDasharray={`${selectedApp.fitScore * 2.64} 264`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center"><span className="text-[10px] font-bold">{selectedApp.fitScore}%</span></div>
                  </div>
                  <div><div className="text-[10px] font-medium">Candidate Fit</div><div className="text-[8px] text-muted-foreground">Based on skills, experience, and preferences</div></div>
                </div>

                {/* Offer details */}
                {selectedApp.offerAmount && (
                  <div className="rounded-2xl border border-[hsl(var(--state-healthy)/0.3)] bg-[hsl(var(--state-healthy)/0.05)] p-3.5">
                    <div className="text-[11px] font-semibold flex items-center gap-1 mb-1"><Star className="h-3 w-3 text-[hsl(var(--state-healthy))]" />Offer Details</div>
                    <div className="text-sm font-bold mb-0.5">{selectedApp.offerAmount}</div>
                    {selectedApp.offerDeadline && <div className="text-[9px] text-muted-foreground">Response deadline: {selectedApp.offerDeadline}</div>}
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" className="h-7 text-[9px] flex-1 rounded-xl" onClick={() => toast.success('Offer accepted!')}><CheckCircle2 className="h-3 w-3 mr-1" />Accept</Button>
                      <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 rounded-xl" onClick={() => toast.info('Negotiate')}><MessageSquare className="h-3 w-3 mr-1" />Negotiate</Button>
                      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => toast.info('Declined')}><XCircle className="h-3 w-3" /></Button>
                    </div>
                  </div>
                )}

                {/* Interview details */}
                {selectedApp.interviewDate && (
                  <div className="rounded-2xl border border-accent/30 bg-accent/5 p-3.5">
                    <div className="text-[11px] font-semibold flex items-center gap-1 mb-1">
                      {selectedApp.interviewType === 'video' ? <Video className="h-3 w-3 text-accent" /> : <Phone className="h-3 w-3 text-accent" />}
                      Upcoming Interview
                    </div>
                    <div className="text-xs font-medium">{selectedApp.interviewDate}</div>
                    <div className="text-[9px] text-muted-foreground capitalize">{selectedApp.interviewType} interview</div>
                  </div>
                )}

                {/* Submitted Materials */}
                <SectionCard title="Submitted Materials" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
                  <div className="space-y-1.5 text-[9px]">
                    {selectedApp.resumeVersion && (
                      <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/20">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="flex-1 font-medium">{selectedApp.resumeVersion}</span>
                        <Button variant="ghost" size="sm" className="h-5 text-[7px] rounded-lg"><Download className="h-2 w-2 mr-0.5" />View</Button>
                      </div>
                    )}
                    {selectedApp.coverNote && (
                      <div className="p-2 rounded-xl bg-muted/20">
                        <div className="text-[8px] font-semibold mb-0.5 flex items-center gap-1"><PenLine className="h-2.5 w-2.5 text-accent" />Cover Note</div>
                        <p className="text-[8px] text-muted-foreground whitespace-pre-wrap line-clamp-3">{selectedApp.coverNote}</p>
                      </div>
                    )}
                  </div>
                </SectionCard>

                {/* Screening Answers */}
                {selectedApp.screeningQuestions.length > 0 && (
                  <SectionCard title={`Screening (${selectedApp.screeningQuestions.length})`} icon={<ListChecks className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
                    <div className="space-y-1">
                      {selectedApp.screeningQuestions.map((q, i) => (
                        <div key={q.id} className="flex items-start gap-1.5 text-[9px]">
                          <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                          <div className="flex-1">
                            <div className="text-muted-foreground">{q.question}</div>
                            <div className="font-semibold">{q.answer || '—'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                )}

                {/* Timeline */}
                <div>
                  <h4 className="text-[10px] font-bold mb-2">Activity Timeline</h4>
                  <div className="space-y-0">
                    {selectedApp.timeline.map((t, i) => (
                      <div key={i} className="flex gap-2.5 pb-3 relative">
                        {i < selectedApp.timeline.length - 1 && <div className="absolute left-[7px] top-4 bottom-0 w-px bg-border" />}
                        <div className="h-4 w-4 rounded-full border-2 border-accent bg-accent/10 shrink-0 mt-0.5 relative z-10" />
                        <div>
                          <div className="text-[10px] font-medium">{t.event}</div>
                          <div className="text-[8px] text-muted-foreground">{t.date}{t.detail ? ` · ${t.detail}` : ''}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 pt-2 border-t">
                  <Button variant="outline" size="sm" className="h-7 text-[10px] w-full rounded-xl" asChild><Link to={`/jobs/${selectedApp.jobId}`}><Eye className="h-3 w-3 mr-1" />View Job Listing</Link></Button>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => toast.info('Upload reference')}><Upload className="h-3 w-3 mr-1" />Upload Reference</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => toast.info('Message sent')}><MessageSquare className="h-3 w-3 mr-1" />Message</Button>
                  </div>
                  {!['rejected', 'withdrawn', 'archived'].includes(selectedApp.status) && (
                    <Button variant="outline" size="sm" className="h-7 text-[10px] w-full rounded-xl text-[hsl(var(--state-blocked))]" onClick={() => { setWithdrawApp(selectedApp); setSelectedAppId(null); }}><XCircle className="h-3 w-3 mr-1" />Withdraw Application</Button>
                  )}
                  {selectedApp.status === 'archived' && (
                    <Button variant="outline" size="sm" className="h-7 text-[10px] w-full rounded-xl" onClick={() => toast.info('Restored')}><RotateCcw className="h-3 w-3 mr-1" />Restore Application</Button>
                  )}
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      <ApplicationWizard open={wizardOpen} onClose={() => { setWizardOpen(false); setWizardDraft(undefined); }} draftApp={wizardDraft} />
      <WithdrawModal app={withdrawApp} onClose={() => setWithdrawApp(null)} />
    </DashboardLayout>
  );
};

export default ApplicationTrackerPage;
