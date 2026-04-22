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
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { AdvancedFilterPanel, FilterDefinition, FilterValues } from '@/components/shell/AdvancedFilterPanel';
import { cn } from '@/lib/utils';
import {
  Search, MapPin, Briefcase, Clock, DollarSign, Bookmark,
  BookmarkCheck, Building2, Globe, Star, Eye,
  FileText, Upload, Send, CheckCircle2, XCircle, AlertTriangle,
  Calendar, MessageSquare, Users,
  TrendingUp, Plus, SlidersHorizontal,
  Sparkles, Loader2, ExternalLink,
  Bell, BellOff, Filter, X, Sliders,
  ChevronDown, LayoutGrid, LayoutList, Zap,
  Heart, Share2, ThumbsUp, MoreHorizontal,
  ChevronRight, ArrowUpRight, Copy, Layers, BarChart3,
  type LucideIcon,
} from 'lucide-react';
import { MOCK_JOBS } from '@/data/mock';
import type { MockJob } from '@/data/mock';
import { useRole } from '@/contexts/RoleContext';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';

const JOB_FILTERS: FilterDefinition[] = [
  { id: 'jobType', label: 'Job Type', type: 'multi-select', group: 'Job', options: [
    { value: 'full-time', label: 'Full-Time', count: 420 }, { value: 'part-time', label: 'Part-Time', count: 85 },
    { value: 'contract', label: 'Contract', count: 180 }, { value: 'freelance', label: 'Freelance', count: 120 },
    { value: 'internship', label: 'Internship', count: 45 }, { value: 'temporary', label: 'Temporary', count: 30 },
  ], defaultOpen: true },
  { id: 'workMode', label: 'Work Mode', type: 'multi-select', group: 'Job', options: [
    { value: 'remote', label: 'Remote', count: 380 }, { value: 'hybrid', label: 'Hybrid', count: 220 },
    { value: 'onsite', label: 'On-Site', count: 250 },
  ], defaultOpen: true },
  { id: 'salary', label: 'Salary Range', type: 'range', group: 'Compensation', min: 0, max: 300000, step: 10000, unit: '$' },
  { id: 'payFrequency', label: 'Pay Frequency', type: 'single-select', group: 'Compensation', options: [
    { value: 'annual', label: 'Annual' }, { value: 'monthly', label: 'Monthly' },
    { value: 'hourly', label: 'Hourly' },
  ]},
  { id: 'experience', label: 'Experience Level', type: 'multi-select', group: 'Requirements', options: [
    { value: 'entry', label: 'Entry Level' }, { value: 'mid', label: 'Mid Level' },
    { value: 'senior', label: 'Senior' }, { value: 'lead', label: 'Lead' },
    { value: 'executive', label: 'Executive / C-Suite' },
  ]},
  { id: 'skills', label: 'Skills / Tags', type: 'multi-select', group: 'Requirements', options: [
    { value: 'react', label: 'React' }, { value: 'python', label: 'Python' },
    { value: 'typescript', label: 'TypeScript' }, { value: 'aws', label: 'AWS' },
    { value: 'node', label: 'Node.js' }, { value: 'figma', label: 'Figma' },
    { value: 'sql', label: 'SQL' }, { value: 'kubernetes', label: 'Kubernetes' },
    { value: 'java', label: 'Java' }, { value: 'go', label: 'Go' },
  ]},
  { id: 'industry', label: 'Industry', type: 'multi-select', group: 'Company', options: [
    { value: 'tech', label: 'Technology' }, { value: 'finance', label: 'Finance' },
    { value: 'healthcare', label: 'Healthcare' }, { value: 'education', label: 'Education' },
    { value: 'retail', label: 'Retail' }, { value: 'media', label: 'Media' },
  ]},
  { id: 'companySize', label: 'Company Size', type: 'single-select', group: 'Company', options: [
    { value: 'startup', label: 'Startup (1-50)' }, { value: 'small', label: 'Small (51-200)' },
    { value: 'medium', label: 'Medium (201-1000)' }, { value: 'large', label: 'Large (1000+)' },
    { value: 'enterprise', label: 'Enterprise (10,000+)' },
  ]},
  { id: 'location', label: 'Location', type: 'multi-select', group: 'Location', options: [
    { value: 'us', label: 'United States' }, { value: 'uk', label: 'United Kingdom' },
    { value: 'eu', label: 'Europe' }, { value: 'canada', label: 'Canada' },
    { value: 'asia', label: 'Asia' }, { value: 'global', label: 'Global / Anywhere' },
  ]},
  { id: 'postedDate', label: 'Posted Date', type: 'single-select', group: 'Freshness', options: [
    { value: '24h', label: 'Last 24 Hours' }, { value: '3d', label: 'Last 3 Days' },
    { value: '7d', label: 'Last 7 Days' }, { value: '14d', label: 'Last 2 Weeks' },
    { value: '30d', label: 'Last 30 Days' },
  ]},
  { id: 'benefits', label: 'Benefits', type: 'multi-select', group: 'Perks', options: [
    { value: 'health', label: 'Health Insurance' }, { value: 'equity', label: 'Equity / Stock' },
    { value: '401k', label: '401k / Retirement' }, { value: 'unlimited-pto', label: 'Unlimited PTO' },
    { value: 'remote-stipend', label: 'Remote Stipend' }, { value: 'education', label: 'Education Budget' },
  ]},
  { id: 'visa', label: 'Visa Sponsorship', type: 'toggle', group: 'Requirements' },
  { id: 'easyApply', label: 'Easy Apply Only', type: 'toggle', group: 'Application' },
  { id: 'noResume', label: 'No Resume Required', type: 'toggle', group: 'Application' },
  { id: 'verifiedCompany', label: 'Verified Company Only', type: 'toggle', group: 'Company' },
  { id: 'applicantCount', label: 'Max Applicants', type: 'range', group: 'Competition', min: 0, max: 500, step: 10 },
];

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type JobTab = 'discover' | 'saved' | 'alerts' | 'applied' | 'recommended' | 'compare';
type WorkMode = 'all' | 'remote' | 'hybrid' | 'onsite';
type SortBy = 'relevance' | 'newest' | 'salary' | 'applicants';

const JOB_TABS: { id: JobTab; label: string; icon: LucideIcon; count?: number }[] = [
  { id: 'discover', label: 'Discover', icon: Search },
  { id: 'saved', label: 'Saved', icon: Bookmark, count: 3 },
  { id: 'alerts', label: 'Alerts', icon: Bell, count: 2 },
  { id: 'applied', label: 'Applied', icon: FileText, count: 4 },
  { id: 'recommended', label: 'For You', icon: Sparkles },
  { id: 'compare', label: 'Compare', icon: Layers },
];

const SALARY_RANGES = ['Any', '$50K+', '$80K+', '$100K+', '$120K+', '$150K+', '$200K+'];
const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Freelance'];
const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive'];

/* ── Mock alerts ── */
const MOCK_ALERTS = [
  { id: 'a1', query: 'Frontend Engineer, Remote', frequency: 'Daily', matches: 12, active: true, created: 'Mar 2025' },
  { id: 'a2', query: 'Product Designer, $120K+', frequency: 'Weekly', matches: 8, active: true, created: 'Feb 2025' },
  { id: 'a3', query: 'DevOps, Kubernetes', frequency: 'Daily', matches: 3, active: false, created: 'Jan 2025' },
];

/* ── Mock applications ── */
const MOCK_APPLICATIONS = [
  { id: 'ap1', jobId: 'j1', title: 'Senior Frontend Engineer', company: 'TechCorp', status: 'reviewing' as const, appliedDate: 'Apr 5, 2025', lastUpdate: '2 days ago' },
  { id: 'ap2', jobId: 'j2', title: 'Product Designer', company: 'DesignHub', status: 'interview' as const, appliedDate: 'Apr 2, 2025', lastUpdate: '1 day ago' },
  { id: 'ap3', jobId: 'j4', title: 'Data Scientist', company: 'AnalyticsPro', status: 'submitted' as const, appliedDate: 'Apr 8, 2025', lastUpdate: '4 hours ago' },
  { id: 'ap4', jobId: 'j5', title: 'Marketing Manager', company: 'GrowthEngine', status: 'rejected' as const, appliedDate: 'Mar 20, 2025', lastUpdate: '1 week ago' },
];

/* ── Mock recommendations ── */
const MOCK_RECOMMENDATIONS = MOCK_JOBS.slice(0, 4).map((j, i) => ({
  ...j,
  fitScore: [95, 88, 82, 76][i],
  fitReasons: [
    ['Skills match 5/5', 'Salary in range', 'Remote preferred'],
    ['Skills match 4/5', 'Company followed', 'Location match'],
    ['Skills match 3/5', 'Similar to saved jobs', 'Growing company'],
    ['Skills match 3/5', 'Industry match', 'Contract preferred'],
  ][i],
}));

const ACTIVITY = [
  { actor: 'System', action: '4 new jobs matching "Frontend Engineer" alert', time: '12m ago' },
  { actor: 'TechCorp', action: 'viewed your application for Senior Frontend Engineer', time: '2h ago' },
  { actor: 'DesignHub', action: 'moved your application to Interview stage', time: '1d ago' },
  { actor: 'System', action: 'Your saved search "Product Designer" has 8 new matches', time: '2d ago' },
];

/* ═══════════════════════════════════════════════════════════
   State Banners
   ═══════════════════════════════════════════════════════════ */
const NoResultsBanner: React.FC = () => (
  <div className="rounded-2xl border p-10 text-center">
    <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
    <div className="text-[11px] font-bold mb-1">No jobs match your filters</div>
    <div className="text-[9px] text-muted-foreground mb-3">Try adjusting your search criteria or broadening your filters.</div>
    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl">Clear All Filters</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Application Modal
   ═══════════════════════════════════════════════════════════ */
const ApplicationModal: React.FC<{ job: MockJob; open: boolean; onClose: () => void }> = ({ job, open, onClose }) => {
  const [step, setStep] = useState<'info' | 'resume' | 'cover' | 'submitted'>('info');
  const [coverLetter, setCoverLetter] = useState('');
  const { loading: aiLoading, invoke: aiInvoke } = useAI({ type: 'writing-assist' });

  const handleAICover = async () => {
    const result = await aiInvoke({ text: `Job: ${job.title} at ${job.company}`, action: 'Write a professional cover letter' });
    if (result) setCoverLetter(result);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[8vh] px-4">
        <div className="w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <h2 className="font-semibold text-sm">Apply to {job.title}</h2>
            <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
          </div>
          {/* Steps indicator */}
          <div className="flex items-center gap-1 px-6 py-2 border-b bg-muted/20">
            {['info', 'resume', 'cover'].map((s, i) => (
              <div key={s} className="flex items-center gap-1">
                <div className={cn('h-5 w-5 rounded-full flex items-center justify-center text-[8px] font-bold', step === s ? 'bg-accent text-accent-foreground' : i < ['info', 'resume', 'cover'].indexOf(step) ? 'bg-[hsl(var(--state-healthy))] text-white' : 'bg-muted text-muted-foreground')}>{i + 1}</div>
                <span className={cn('text-[8px] capitalize', step === s ? 'font-semibold' : 'text-muted-foreground')}>{s === 'cover' ? 'Cover Letter' : s === 'info' ? 'Details' : 'Resume'}</span>
                {i < 2 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground mx-0.5" />}
              </div>
            ))}
          </div>

          {step === 'submitted' ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="h-12 w-12 text-[hsl(var(--state-healthy))] mx-auto mb-3" />
              <div className="text-lg font-semibold mb-1">Application Submitted!</div>
              <p className="text-sm text-muted-foreground mb-4">Your application for {job.title} at {job.company} has been sent.</p>
              <div className="flex justify-center gap-2">
                <Button onClick={onClose}>Done</Button>
                <Button variant="outline" onClick={() => toast.info('View in Applications tab')}><FileText className="h-3 w-3 mr-1" />View Applications</Button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {step === 'info' && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-[10px] font-semibold mb-1 block">Full Name</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:ring-2 focus:ring-accent/30 focus:outline-none" defaultValue="Demo User" /></div>
                    <div><label className="text-[10px] font-semibold mb-1 block">Email</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:ring-2 focus:ring-accent/30 focus:outline-none" defaultValue="demo@gigvora.com" /></div>
                  </div>
                  <div><label className="text-[10px] font-semibold mb-1 block">Phone (optional)</label><input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:ring-2 focus:ring-accent/30 focus:outline-none" placeholder="+1 (555) 000-0000" /></div>
                  <div className="flex justify-end gap-2 pt-2"><Button className="rounded-xl" onClick={() => setStep('resume')}>Continue</Button></div>
                </>
              )}
              {step === 'resume' && (
                <>
                  <div className="border-2 border-dashed border-accent/30 rounded-2xl p-6 text-center bg-accent/5 hover:border-accent/50 transition-all cursor-pointer">
                    <Upload className="h-6 w-6 mx-auto mb-2 text-accent/40" />
                    <div className="text-[11px] font-semibold">Upload Resume</div>
                    <div className="text-[9px] text-muted-foreground">PDF, DOC, or DOCX up to 5MB</div>
                  </div>
                  <div className="flex justify-between pt-2"><Button variant="outline" className="rounded-xl" onClick={() => setStep('info')}>Back</Button><Button className="rounded-xl" onClick={() => setStep('cover')}>Continue</Button></div>
                </>
              )}
              {step === 'cover' && (
                <>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-semibold">Cover Letter</label>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={handleAICover} disabled={aiLoading}><Sparkles className="h-3 w-3" />{aiLoading ? 'Generating...' : 'AI Generate'}</Button>
                  </div>
                  <Textarea value={coverLetter} onChange={e => setCoverLetter(e.target.value)} rows={6} placeholder="Why are you a great fit for this role?" className="rounded-xl text-[11px]" />
                  <div className="flex justify-between pt-2"><Button variant="outline" className="rounded-xl" onClick={() => setStep('resume')}>Back</Button><Button className="rounded-xl gap-1" onClick={() => { setStep('submitted'); toast.success('Application submitted'); }}><Send className="h-3 w-3" />Submit</Button></div>
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
   Set Alert Modal
   ═══════════════════════════════════════════════════════════ */
const SetAlertModal: React.FC<{ open: boolean; onClose: () => void; query: string }> = ({ open, onClose, query }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div className="relative flex justify-center items-start pt-[15vh] px-4">
        <div className="w-full max-w-sm bg-card rounded-2xl border shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between px-5 py-3 border-b">
            <h3 className="font-semibold text-sm flex items-center gap-1.5"><Bell className="h-3.5 w-3.5 text-accent" />Create Job Alert</h3>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose}><X className="h-3 w-3" /></Button>
          </div>
          <div className="p-5 space-y-3">
            <div><label className="text-[10px] font-semibold mb-1 block">Search Query</label><input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px] focus:ring-2 focus:ring-accent/30 focus:outline-none" defaultValue={query} /></div>
            <div><label className="text-[10px] font-semibold mb-1 block">Location (optional)</label><input className="w-full h-8 rounded-xl border bg-background px-3 text-[10px] focus:ring-2 focus:ring-accent/30 focus:outline-none" placeholder="e.g. Remote, San Francisco" /></div>
            <div><label className="text-[10px] font-semibold mb-1 block">Frequency</label>
              <select className="w-full h-8 rounded-xl border bg-background px-3 text-[10px]">
                <option>Instant</option><option>Daily</option><option>Weekly</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-1"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={onClose}>Cancel</Button><Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => { toast.success('Alert created'); onClose(); }}><Bell className="h-3 w-3" />Create Alert</Button></div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Post Job Drawer (Enterprise/Recruiter)
   ═══════════════════════════════════════════════════════════ */
const PostJobDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [saving, setSaving] = useState(false);
  const handleCreate = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose(); toast.success('Job posted!'); }, 800); };
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-accent" />Post a Job</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          {[{ label: 'Job Title', placeholder: 'e.g. Senior Frontend Engineer' }, { label: 'Company', placeholder: 'e.g. TechCorp' }].map(f => (
            <div key={f.label}><label className="text-[10px] font-semibold mb-1.5 block">{f.label}</label><input placeholder={f.placeholder} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" /></div>
          ))}
          <div><label className="text-[10px] font-semibold mb-1.5 block">Description</label><Textarea placeholder="Describe the role, responsibilities, and expectations..." rows={4} className="rounded-xl text-[11px]" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-[10px] font-semibold mb-1.5 block">Location</label><input placeholder="San Francisco, CA" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
            <div><label className="text-[10px] font-semibold mb-1.5 block">Work Mode</label>
              <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]"><option>Remote</option><option>Hybrid</option><option>On-site</option></select>
            </div>
            <div><label className="text-[10px] font-semibold mb-1.5 block">Salary Range</label><input placeholder="$120K – $180K" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
            <div><label className="text-[10px] font-semibold mb-1.5 block">Type</label>
              <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Freelance</option></select>
            </div>
          </div>
          <div><label className="text-[10px] font-semibold mb-1.5 block">Required Skills</label><input placeholder="React, TypeScript, Node.js..." className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]" /></div>
          <div><label className="text-[10px] font-semibold mb-1.5 block">Experience Level</label>
            <div className="flex gap-2">{EXPERIENCE_LEVELS.map(l => <button key={l} className="flex-1 p-2 rounded-xl border hover:bg-accent/5 hover:border-accent/30 transition-all text-center text-[9px] font-semibold">{l}</button>)}</div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 p-2.5 rounded-xl border"><input type="checkbox" className="rounded" /><div><div className="text-[9px] font-semibold">Featured Listing</div><div className="text-[7px] text-muted-foreground">5 credits</div></div></div>
            <div className="flex items-center gap-2 p-2.5 rounded-xl border"><input type="checkbox" className="rounded" /><div><div className="text-[9px] font-semibold">Urgent Hire</div><div className="text-[7px] text-muted-foreground">Priority badge</div></div></div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="sm" className="rounded-xl text-[10px]" onClick={onClose}>Cancel</Button>
          <Button variant="outline" size="sm" className="rounded-xl text-[10px]" onClick={() => { onClose(); toast.info('Draft saved'); }}>Save Draft</Button>
          <Button size="sm" className="rounded-xl text-[10px] gap-1" onClick={handleCreate} disabled={saving}><Send className="h-3 w-3" />{saving ? 'Posting...' : 'Publish Job'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const JobsBrowsePage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<JobTab>('discover');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [workMode, setWorkMode] = useState<WorkMode>('all');
  const [salaryRange, setSalaryRange] = useState('Any');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortBy>('relevance');
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set(['j1', 'j3', 'j6']));
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [applyJob, setApplyJob] = useState<MockJob | null>(null);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [postJobOpen, setPostJobOpen] = useState(false);
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());
  const [showAdvFilters, setShowAdvFilters] = useState(true);
  const [advFilterValues, setAdvFilterValues] = useState<FilterValues>({});

  const toggleSave = (id: string) => {
    setSavedJobs(prev => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); toast.info('Job removed from saved'); } else { next.add(id); toast.success('Job saved'); }
      return next;
    });
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else if (next.size < 3) next.add(id);
      else toast.info('Max 3 jobs to compare');
      return next;
    });
  };

  const toggleType = (t: string) => setSelectedTypes(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  /* ── Filtered Jobs ── */
  const filteredJobs = useMemo(() => {
    let jobs = [...MOCK_JOBS];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.company.toLowerCase().includes(q) || j.skills.some(s => s.toLowerCase().includes(q)));
    }
    if (locationQuery) {
      const lq = locationQuery.toLowerCase();
      jobs = jobs.filter(j => j.location.toLowerCase().includes(lq));
    }
    if (workMode === 'remote') jobs = jobs.filter(j => j.remote);
    if (workMode === 'onsite') jobs = jobs.filter(j => !j.remote);
    if (selectedTypes.length) jobs = jobs.filter(j => selectedTypes.some(t => t.toLowerCase() === j.type));
    if (sortBy === 'newest') jobs.sort((a, b) => a.postedAt.localeCompare(b.postedAt));
    if (sortBy === 'applicants') jobs.sort((a, b) => a.applicants - b.applicants);
    return jobs;
  }, [searchQuery, locationQuery, workMode, selectedTypes, sortBy]);

  const savedJobsList = useMemo(() => MOCK_JOBS.filter(j => savedJobs.has(j.id)), [savedJobs]);
  const compareJobs = useMemo(() => MOCK_JOBS.filter(j => compareIds.has(j.id)), [compareIds]);

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Briefcase className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Jobs Discovery</span>
        <StatusBadge status="live" label="Live" />
        <Badge variant="secondary" className="text-[7px] rounded-lg">{MOCK_JOBS.length} listings</Badge>
      </div>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search jobs, skills, companies..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[9px] w-48 focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <div className="relative w-32 ml-1">
        <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={locationQuery} onChange={e => setLocationQuery(e.target.value)} placeholder="Location..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[9px] w-full focus:outline-none focus:ring-2 focus:ring-accent/30" />
      </div>
      <div className="flex gap-1 ml-1.5">
        <button onClick={() => setViewMode('list')} className={cn('h-7 w-7 rounded-xl border flex items-center justify-center transition-all', viewMode === 'list' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted')}><LayoutList className="h-3 w-3" /></button>
        <button onClick={() => setViewMode('grid')} className={cn('h-7 w-7 rounded-xl border flex items-center justify-center transition-all', viewMode === 'grid' ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-muted')}><LayoutGrid className="h-3 w-3" /></button>
      </div>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 ml-1.5" onClick={() => setAlertModalOpen(true)}><Bell className="h-3 w-3" />Alert</Button>
      {(activeRole === 'enterprise' || activeRole === 'professional') && (
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 ml-1" onClick={() => setPostJobOpen(true)}><Plus className="h-3 w-3" />Post Job</Button>
      )}
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      {/* Filters */}
      <SectionCard title="Filters" icon={<Filter className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-2.5">
          <div>
            <label className="text-[8px] font-semibold text-muted-foreground block mb-1">Work Mode</label>
            <div className="flex flex-wrap gap-1">
              {(['all', 'remote', 'hybrid', 'onsite'] as WorkMode[]).map(m => (
                <button key={m} onClick={() => setWorkMode(m)} className={cn('px-2 py-0.5 rounded-lg text-[7px] font-semibold capitalize transition-all', workMode === m ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted')}>{m}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[8px] font-semibold text-muted-foreground block mb-1">Job Type</label>
            <div className="flex flex-wrap gap-1">
              {JOB_TYPES.map(t => (
                <button key={t} onClick={() => toggleType(t)} className={cn('px-2 py-0.5 rounded-lg text-[7px] font-semibold transition-all', selectedTypes.includes(t) ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted')}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[8px] font-semibold text-muted-foreground block mb-1">Min Salary</label>
            <select value={salaryRange} onChange={e => setSalaryRange(e.target.value)} className="w-full h-6 rounded-lg border bg-background px-2 text-[8px]">
              {SALARY_RANGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[8px] font-semibold text-muted-foreground block mb-1">Sort By</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortBy)} className="w-full h-6 rounded-lg border bg-background px-2 text-[8px]">
              <option value="relevance">Relevance</option><option value="newest">Newest</option><option value="salary">Salary</option><option value="applicants">Fewest Applicants</option>
            </select>
          </div>
          {(workMode !== 'all' || selectedTypes.length > 0 || salaryRange !== 'Any') && (
            <Button variant="ghost" size="sm" className="h-5 text-[7px] w-full rounded-lg" onClick={() => { setWorkMode('all'); setSelectedTypes([]); setSalaryRange('Any'); }}>Clear Filters</Button>
          )}
        </div>
      </SectionCard>

      {/* Quick Actions */}
      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { label: 'Upload resume', icon: Upload, action: () => toast.info('Upload resume') },
            { label: 'Set job preferences', icon: Sliders, action: () => toast.info('Preferences') },
            { label: 'View applications', icon: FileText, action: () => setActiveTab('applied') },
            { label: 'Manage alerts', icon: Bell, action: () => setActiveTab('alerts') },
            { label: 'Compare jobs', icon: Layers, action: () => setActiveTab('compare') },
          ].map(a => (
            <button key={a.label} onClick={a.action} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" /><span className="group-hover:text-accent transition-colors">{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>

      {/* Your Stats */}
      <SectionCard title="Your Stats" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[{ l: 'Saved Jobs', v: String(savedJobs.size) }, { l: 'Applications', v: '4' }, { l: 'Interviews', v: '1' }, { l: 'Profile Views', v: '23' }].map(s => (
            <div key={s.l} className="flex justify-between"><span className="text-muted-foreground">{s.l}</span><span className="font-bold">{s.v}</span></div>
          ))}
        </div>
      </SectionCard>

      {compareIds.size > 0 && (
        <SectionCard title="Compare List" icon={<Layers className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-1">
            {compareJobs.map(j => (
              <div key={j.id} className="flex items-center gap-1.5 text-[8px]">
                <Building2 className="h-3 w-3 text-muted-foreground shrink-0" />
                <span className="truncate flex-1 font-medium">{j.title}</span>
                <button onClick={() => toggleCompare(j.id)}><X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" /></button>
              </div>
            ))}
            <Button size="sm" className="w-full h-6 text-[8px] rounded-xl mt-1" onClick={() => setActiveTab('compare')}>Compare {compareIds.size} Jobs</Button>
          </div>
        </SectionCard>
      )}
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
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Jobs" icon={<Briefcase className="h-3 w-3" />} />

      <div className="flex items-center gap-2 mb-3">
        <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1 rounded-xl" onClick={() => setShowAdvFilters(!showAdvFilters)}>
          <SlidersHorizontal className="h-3 w-3" /> Advanced Filters
          {Object.keys(advFilterValues).length > 0 && (
            <Badge className="text-[7px] h-3.5 px-1 ml-0.5 bg-accent text-accent-foreground">{Object.keys(advFilterValues).length}</Badge>
          )}
        </Button>
      </div>

      {showAdvFilters && (
        <div className="mb-3">
          <AdvancedFilterPanel filters={JOB_FILTERS} values={advFilterValues} onChange={setAdvFilterValues} inline />
        </div>
      )}

      <KPIBand className="mb-4">
        <KPICard label="Total Jobs" value={String(MOCK_JOBS.length)} change="this week" trend="up" />
        <KPICard label="Saved" value={String(savedJobs.size)} change="jobs" />
        <KPICard label="Applied" value={String(MOCK_APPLICATIONS.length)} change="active" />
        <KPICard label="Alerts" value={String(MOCK_ALERTS.filter(a => a.active).length)} change="active" />
        <KPICard label="Interviews" value="1" change="scheduled" trend="up" />
      </KPIBand>

      {/* ── Tab Nav ── */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4 overflow-x-auto">
        {JOB_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}>
            <t.icon className="h-3 w-3" />
            {t.label}
            {t.count && <span className={cn('text-[7px] rounded-full px-1.5', activeTab === t.id ? 'bg-accent/10' : 'bg-muted')}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Active filters chips */}
      {(workMode !== 'all' || selectedTypes.length > 0 || searchQuery || locationQuery) && activeTab === 'discover' && (
        <div className="flex flex-wrap gap-1 mb-3">
          {searchQuery && <Badge variant="secondary" className="text-[7px] h-5 gap-1 rounded-lg">{searchQuery}<button onClick={() => setSearchQuery('')}><X className="h-2 w-2" /></button></Badge>}
          {locationQuery && <Badge variant="secondary" className="text-[7px] h-5 gap-1 rounded-lg"><MapPin className="h-2 w-2" />{locationQuery}<button onClick={() => setLocationQuery('')}><X className="h-2 w-2" /></button></Badge>}
          {workMode !== 'all' && <Badge variant="secondary" className="text-[7px] h-5 gap-1 rounded-lg capitalize">{workMode}<button onClick={() => setWorkMode('all')}><X className="h-2 w-2" /></button></Badge>}
          {selectedTypes.map(t => <Badge key={t} variant="secondary" className="text-[7px] h-5 gap-1 rounded-lg">{t}<button onClick={() => toggleType(t)}><X className="h-2 w-2" /></button></Badge>)}
        </div>
      )}

      {/* ═══ DISCOVER TAB ═══ */}
      {activeTab === 'discover' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-muted-foreground">{filteredJobs.length} jobs found</span>
          </div>

          {filteredJobs.length === 0 ? <NoResultsBanner /> : (
            <div className={cn(viewMode === 'grid' ? 'grid grid-cols-2 gap-3' : 'space-y-2')}>
              {filteredJobs.map(job => (
                <div key={job.id} className={cn('rounded-2xl border bg-card p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group', selectedJobId === job.id && 'ring-2 ring-accent/40', compareIds.has(job.id) && 'border-accent/40')} onClick={() => setSelectedJobId(job.id)}>
                  <div className="flex items-start gap-2.5 mb-2">
                    <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4.5 w-4.5 text-muted-foreground/50" /></div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{job.title}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-1">
                          <button onClick={e => { e.stopPropagation(); toggleCompare(job.id); }} className={cn('text-muted-foreground hover:text-accent', compareIds.has(job.id) && 'text-accent')} title="Compare">
                            <Layers className="h-3 w-3" />
                          </button>
                          <button onClick={e => { e.stopPropagation(); toggleSave(job.id); }} className="text-muted-foreground hover:text-accent">
                            {savedJobs.has(job.id) ? <BookmarkCheck className="h-3.5 w-3.5 text-accent" /> : <Bookmark className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div className="text-[9px] text-muted-foreground">{job.company} · {job.location}</div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    <Badge variant="secondary" className="text-[7px] h-4 gap-0.5 rounded-lg"><Briefcase className="h-2 w-2" />{job.type}</Badge>
                    <Badge variant="secondary" className="text-[7px] h-4 gap-0.5 rounded-lg"><DollarSign className="h-2 w-2" />{job.salary}</Badge>
                    {job.remote && <Badge className="text-[7px] h-4 gap-0.5 rounded-lg bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0"><Globe className="h-2 w-2" />Remote</Badge>}
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {job.skills.slice(0, 3).map(s => <span key={s} className="text-[7px] bg-accent/10 text-accent rounded-lg px-1.5 py-0.5 font-medium">{s}</span>)}
                    {job.skills.length > 3 && <span className="text-[7px] text-muted-foreground">+{job.skills.length - 3}</span>}
                  </div>
                  <div className="flex items-center justify-between text-[7px] text-muted-foreground border-t pt-1.5">
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{job.postedAt}</span>
                    <span>{job.applicants} applicants</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ SAVED TAB ═══ */}
      {activeTab === 'saved' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{savedJobsList.length} Saved Jobs</span>
          </div>
          {savedJobsList.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center">
              <Bookmark className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No saved jobs</div>
              <div className="text-[9px] text-muted-foreground">Save jobs to review them later.</div>
            </div>
          ) : (
            <div className="space-y-2">
              {savedJobsList.map(job => (
                <div key={job.id} onClick={() => setSelectedJobId(job.id)} className="rounded-2xl border bg-card p-3.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-3 group">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-muted-foreground/50" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{job.title}</div>
                    <div className="text-[9px] text-muted-foreground">{job.company} · {job.salary} · {job.location}</div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1" onClick={e => { e.stopPropagation(); setApplyJob(job); }}><Send className="h-2.5 w-2.5" />Apply</Button>
                  <button onClick={e => { e.stopPropagation(); toggleSave(job.id); }}><BookmarkCheck className="h-3.5 w-3.5 text-accent" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ ALERTS TAB ═══ */}
      {activeTab === 'alerts' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">Job Alerts</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setAlertModalOpen(true)}><Plus className="h-3 w-3" />New Alert</Button>
          </div>
          <div className="space-y-2">
            {MOCK_ALERTS.map(alert => (
              <div key={alert.id} className="rounded-2xl border bg-card p-3.5 hover:shadow-md transition-all flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0', alert.active ? 'bg-accent/10' : 'bg-muted')}>
                  {alert.active ? <Bell className="h-4 w-4 text-accent" /> : <BellOff className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold truncate">{alert.query}</span>
                    <StatusBadge status={alert.active ? 'healthy' : 'degraded'} label={alert.active ? 'Active' : 'Paused'} />
                  </div>
                  <div className="text-[9px] text-muted-foreground">{alert.frequency} · {alert.matches} matches · Since {alert.created}</div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl">{alert.active ? 'Pause' : 'Resume'}</Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ APPLIED TAB ═══ */}
      {activeTab === 'applied' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{MOCK_APPLICATIONS.length} Applications</span>
          </div>
          {/* Pipeline summary */}
          <div className="grid grid-cols-4 gap-2 mb-2">
            {[
              { label: 'Submitted', count: 1, color: 'bg-muted' },
              { label: 'Reviewing', count: 1, color: 'bg-accent/10' },
              { label: 'Interview', count: 1, color: 'bg-[hsl(var(--state-healthy)/0.1)]' },
              { label: 'Rejected', count: 1, color: 'bg-[hsl(var(--state-blocked)/0.1)]' },
            ].map(s => (
              <div key={s.label} className={cn('rounded-xl p-2 text-center', s.color)}>
                <div className="text-[12px] font-bold">{s.count}</div>
                <div className="text-[7px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          <div className="space-y-2">
            {MOCK_APPLICATIONS.map(app => (
              <div key={app.id} className="rounded-2xl border bg-card p-3.5 hover:shadow-md transition-all flex items-center gap-3 cursor-pointer group" onClick={() => { const j = MOCK_JOBS.find(j => j.id === app.jobId); if (j) setSelectedJobId(j.id); }}>
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
                  app.status === 'interview' ? 'bg-[hsl(var(--state-healthy)/0.1)]' : app.status === 'rejected' ? 'bg-[hsl(var(--state-blocked)/0.1)]' : app.status === 'reviewing' ? 'bg-accent/10' : 'bg-muted'
                )}>
                  {app.status === 'interview' && <CheckCircle2 className="h-4 w-4 text-[hsl(var(--state-healthy))]" />}
                  {app.status === 'rejected' && <XCircle className="h-4 w-4 text-[hsl(var(--state-blocked))]" />}
                  {app.status === 'reviewing' && <Eye className="h-4 w-4 text-accent" />}
                  {app.status === 'submitted' && <Clock className="h-4 w-4 text-muted-foreground" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{app.title}</span>
                    <StatusBadge
                      status={app.status === 'interview' ? 'healthy' : app.status === 'rejected' ? 'blocked' : app.status === 'reviewing' ? 'review' : 'pending'}
                      label={app.status === 'interview' ? 'Interview' : app.status === 'rejected' ? 'Rejected' : app.status === 'reviewing' ? 'Reviewing' : 'Submitted'}
                    />
                  </div>
                  <div className="text-[9px] text-muted-foreground">{app.company} · Applied {app.appliedDate} · Updated {app.lastUpdate}</div>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><MessageSquare className="h-2.5 w-2.5" />Message</Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ RECOMMENDED TAB ═══ */}
      {activeTab === 'recommended' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span className="text-[11px] font-bold">AI-Matched Jobs</span>
            <span className="text-[9px] text-muted-foreground">Based on your profile and activity</span>
          </div>
          <div className="space-y-2">
            {MOCK_RECOMMENDATIONS.map(job => (
              <div key={job.id} className="rounded-2xl border bg-card p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group" onClick={() => setSelectedJobId(job.id)}>
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-muted-foreground/50" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold group-hover:text-accent transition-colors">{job.title}</span>
                      <div className={cn('text-[9px] font-bold px-2 py-0.5 rounded-lg', job.fitScore >= 90 ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : job.fitScore >= 80 ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground')}>
                        {job.fitScore}% fit
                      </div>
                    </div>
                    <div className="text-[9px] text-muted-foreground">{job.company} · {job.salary}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 mb-2">
                  {job.fitReasons.map((r, i) => <span key={i} className="text-[7px] bg-accent/5 text-accent/80 rounded-lg px-1.5 py-0.5 font-medium">{r}</span>)}
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <div className="flex gap-1">
                    {job.skills.slice(0, 3).map(s => <span key={s} className="text-[7px] bg-muted rounded-lg px-1.5 py-0.5">{s}</span>)}
                  </div>
                  <Button size="sm" className="h-7 text-[8px] rounded-xl gap-1" onClick={e => { e.stopPropagation(); setApplyJob(job); }}><Zap className="h-2.5 w-2.5" />Quick Apply</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ COMPARE TAB ═══ */}
      {activeTab === 'compare' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">Compare Jobs ({compareJobs.length}/3)</span>
            {compareJobs.length > 0 && <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg" onClick={() => setCompareIds(new Set())}>Clear All</Button>}
          </div>
          {compareJobs.length === 0 ? (
            <div className="rounded-2xl border p-10 text-center">
              <Layers className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-bold mb-1">No Jobs to Compare</div>
              <div className="text-[9px] text-muted-foreground mb-3">Click the compare icon on job cards to add up to 3 jobs.</div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl" onClick={() => setActiveTab('discover')}>Browse Jobs</Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-[9px]">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-2 text-muted-foreground font-semibold w-24">Attribute</th>
                    {compareJobs.map(j => (
                      <th key={j.id} className="text-left py-2 px-2 min-w-[140px]">
                        <div className="font-bold text-[10px]">{j.title}</div>
                        <div className="text-[8px] text-muted-foreground font-normal">{j.company}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Salary', fn: (j: MockJob) => j.salary },
                    { label: 'Location', fn: (j: MockJob) => j.location },
                    { label: 'Type', fn: (j: MockJob) => j.type },
                    { label: 'Remote', fn: (j: MockJob) => j.remote ? 'Yes' : 'No' },
                    { label: 'Applicants', fn: (j: MockJob) => String(j.applicants) },
                    { label: 'Posted', fn: (j: MockJob) => j.postedAt },
                    { label: 'Skills', fn: (j: MockJob) => j.skills.join(', ') },
                  ].map(row => (
                    <tr key={row.label} className="border-b hover:bg-muted/20">
                      <td className="py-2 px-2 font-semibold text-muted-foreground">{row.label}</td>
                      {compareJobs.map(j => <td key={j.id} className="py-2 px-2">{row.fn(j)}</td>)}
                    </tr>
                  ))}
                  <tr>
                    <td className="py-2 px-2 font-semibold text-muted-foreground">Action</td>
                    {compareJobs.map(j => (
                      <td key={j.id} className="py-2 px-2">
                        <div className="flex gap-1">
                          <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => setApplyJob(j)}><Send className="h-2 w-2" />Apply</Button>
                          <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg" onClick={() => setSelectedJobId(j.id)}>Detail</Button>
                        </div>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Job Detail Drawer ── */}
      <Sheet open={!!selectedJobId} onOpenChange={() => setSelectedJobId(null)}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Briefcase className="h-4 w-4 text-accent" />Job Details</SheetTitle></SheetHeader>
          {selectedJobId && (() => {
            const job = MOCK_JOBS.find(j => j.id === selectedJobId);
            if (!job) return <div className="p-4 text-sm text-muted-foreground">Job not found</div>;
            return (
              <div className="p-5 space-y-4">
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 rounded-2xl bg-muted flex items-center justify-center shadow-sm"><Building2 className="h-7 w-7 text-muted-foreground/30" /></div>
                  <div className="flex-1">
                    <div className="text-[13px] font-bold">{job.title}</div>
                    <div className="text-[10px] text-muted-foreground">{job.company}</div>
                    <div className="text-[9px] text-muted-foreground">{job.location} · {job.postedAt}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <Badge variant="secondary" className="text-[8px] gap-1 rounded-lg"><Briefcase className="h-2.5 w-2.5" />{job.type}</Badge>
                  <Badge variant="secondary" className="text-[8px] gap-1 rounded-lg"><DollarSign className="h-2.5 w-2.5" />{job.salary}</Badge>
                  {job.remote && <Badge className="text-[8px] gap-1 rounded-lg bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0"><Globe className="h-2.5 w-2.5" />Remote</Badge>}
                  <Badge variant="secondary" className="text-[8px] gap-1 rounded-lg"><Users className="h-2.5 w-2.5" />{job.applicants} applicants</Badge>
                </div>
                <div className="flex gap-2">
                  <Button className="flex-1 h-9 text-[10px] rounded-xl gap-1" onClick={() => setApplyJob(job)}><Send className="h-3 w-3" />Apply Now</Button>
                  <Button variant="outline" className="h-9 text-[10px] rounded-xl gap-1" onClick={() => toggleSave(job.id)}>
                    {savedJobs.has(job.id) ? <><BookmarkCheck className="h-3 w-3" />Saved</> : <><Bookmark className="h-3 w-3" />Save</>}
                  </Button>
                  <Button variant="outline" className="h-9 text-[10px] rounded-xl gap-1" onClick={() => { toggleCompare(job.id); toast.success('Added to compare'); }}>
                    <Layers className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" className="h-9 w-9 p-0 rounded-xl"><Share2 className="h-3 w-3" /></Button>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold mb-1.5">Description</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{job.description}</p>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold mb-1.5">Requirements</h4>
                  <ul className="space-y-1">{job.requirements.map((r, i) => <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5"><CheckCircle2 className="h-3 w-3 text-accent shrink-0 mt-0.5" />{r}</li>)}</ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold mb-1.5">Benefits</h4>
                  <ul className="space-y-1">{job.benefits.map((b, i) => <li key={i} className="text-[10px] text-muted-foreground flex items-start gap-1.5"><Star className="h-3 w-3 text-accent shrink-0 mt-0.5" />{b}</li>)}</ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold mb-1.5">Skills</h4>
                  <div className="flex flex-wrap gap-1">{job.skills.map(s => <span key={s} className="text-[8px] bg-accent/10 text-accent rounded-lg px-2 py-0.5 font-medium">{s}</span>)}</div>
                </div>
                {/* Company quick info */}
                <div className="rounded-2xl border p-3">
                  <h4 className="text-[10px] font-bold mb-2">About {job.company}</h4>
                  <div className="grid grid-cols-2 gap-2 text-[8px]">
                    <div className="rounded-lg bg-muted/30 p-2"><div className="text-muted-foreground">Industry</div><div className="font-semibold">Technology</div></div>
                    <div className="rounded-lg bg-muted/30 p-2"><div className="text-muted-foreground">Size</div><div className="font-semibold">500-1000</div></div>
                    <div className="rounded-lg bg-muted/30 p-2"><div className="text-muted-foreground">Founded</div><div className="font-semibold">2018</div></div>
                    <div className="rounded-lg bg-muted/30 p-2"><div className="text-muted-foreground">Rating</div><div className="font-semibold flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />4.3</div></div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] w-full mt-2 rounded-lg gap-1"><ExternalLink className="h-2.5 w-2.5" />View Company Page</Button>
                </div>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* Modals */}
      {applyJob && <ApplicationModal job={applyJob} open={!!applyJob} onClose={() => setApplyJob(null)} />}
      <SetAlertModal open={alertModalOpen} onClose={() => setAlertModalOpen(false)} query={searchQuery} />
      <PostJobDrawer open={postJobOpen} onClose={() => setPostJobOpen(false)} />
    </DashboardLayout>
  );
};

export default JobsBrowsePage;
