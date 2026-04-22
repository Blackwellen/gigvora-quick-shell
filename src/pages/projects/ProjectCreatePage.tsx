import React, { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  FileText, Save, Eye, Send, ChevronRight, ChevronLeft,
  Plus, X, MapPin, DollarSign, Clock, Briefcase, Users,
  Shield, AlertTriangle, CheckCircle2, Sparkles,
  Globe, Lock, Trash2, Upload, UserPlus, Star,
  Target, Zap, Tag, GraduationCap, Search, Filter,
  ArrowLeft, Calendar, Award,
} from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type Step = 'core' | 'skills' | 'commercial' | 'location' | 'timeline' | 'requirements' | 'launchpad' | 'screening' | 'matching' | 'review';

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'core', label: 'Project Core', icon: FileText },
  { key: 'skills', label: 'Skills & Tags', icon: Tag },
  { key: 'commercial', label: 'Commercial', icon: DollarSign },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'timeline', label: 'Timeline', icon: Calendar },
  { key: 'requirements', label: 'Requirements', icon: Target },
  { key: 'launchpad', label: 'Launchpad', icon: GraduationCap },
  { key: 'screening', label: 'Screening', icon: Shield },
  { key: 'matching', label: 'Match & Invite', icon: UserPlus },
  { key: 'review', label: 'Review', icon: CheckCircle2 },
];

const PROJECT_TYPES = ['Fixed-price', 'Hourly', 'Milestone-based', 'Retained', 'Team-based'];
const SCOPE_SIZES = ['Small (<$5K)', 'Medium ($5K-$25K)', 'Large ($25K-$100K)', 'Enterprise ($100K+)'];
const EXPERTISE_LEVELS = ['Entry', 'Intermediate', 'Advanced', 'Expert', 'Specialist'];
const WORK_MODELS = ['Remote', 'Hybrid', 'On-site'];
const LAUNCHPAD_OPTIONS = ['Open to Graduates', 'Open to Career Changers', 'Open to Emerging Talent', 'Junior-Friendly', 'Mentorship Included', 'Paid Training Included'];

interface Milestone { id: string; title: string; amount: string; description: string; }
interface ScreenerQ { id: string; text: string; required: boolean; knockout: boolean; }
interface MatchCandidate { id: string; name: string; avatar: string; title: string; matchScore: number; rate: string; skills: string[]; rating: number; jobs: number; invited: boolean; }

// D33 wired: source of truth for the Match & Invite step is `useDraftMatchPreview`
// (deterministic fallback while the draft is unsaved) and `useSmartMatch(projectId)`
// once the draft has a server-side id. The constant below is kept ONLY as the
// fallback shape inside the hook; the wizard reads candidates from `matches`
// state populated by the hook in the matching step's effect.
const MOCK_MATCHES: MatchCandidate[] = [
  { id: 'm1', name: 'Sarah Chen', avatar: 'SC', title: 'Senior Full-Stack Developer', matchScore: 96, rate: '$85/hr', skills: ['React', 'Node.js', 'PostgreSQL'], rating: 4.9, jobs: 47, invited: false },
  { id: 'm2', name: 'Alex Rivera', avatar: 'AR', title: 'Product Designer & Developer', matchScore: 91, rate: '$75/hr', skills: ['React', 'Figma', 'TypeScript'], rating: 4.8, jobs: 32, invited: false },
  { id: 'm3', name: 'James Okoro', avatar: 'JO', title: 'Cloud Architecture Specialist', matchScore: 87, rate: '$95/hr', skills: ['AWS', 'Docker', 'DevOps'], rating: 5.0, jobs: 61, invited: false },
  { id: 'm4', name: 'Priya Sharma', avatar: 'PS', title: 'Data Engineer', matchScore: 82, rate: '$90/hr', skills: ['Python', 'PostgreSQL', 'AWS'], rating: 4.7, jobs: 28, invited: false },
  { id: 'm5', name: 'Marcus Thompson', avatar: 'MT', title: 'Mobile & Web Developer', matchScore: 78, rate: '$70/hr', skills: ['React Native', 'TypeScript', 'Node.js'], rating: 4.6, jobs: 19, invited: false },
  { id: 'm6', name: 'Elena Kowalski', avatar: 'EK', title: 'UX/UI Lead', matchScore: 74, rate: '$80/hr', skills: ['Figma', 'UI/UX Design', 'React'], rating: 4.9, jobs: 55, invited: false },
];

/* ═══════════════════════════════════════════════════════════
   Reusable components
   ═══════════════════════════════════════════════════════════ */
const FieldLabel: React.FC<{ label: string; required?: boolean; hint?: string }> = ({ label, required, hint }) => (
  <div className="mb-1"><label className="text-[10px] font-semibold">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>{hint && <p className="text-[8px] text-muted-foreground">{hint}</p>}</div>
);

const ChipSelect: React.FC<{ options: string[]; selected: string; onChange: (v: string) => void }> = ({ options, selected, onChange }) => (
  <div className="flex flex-wrap gap-1.5">{options.map(o => (
    <button key={o} onClick={() => onChange(o)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-medium border transition-all', selected === o ? 'bg-accent text-accent-foreground border-accent shadow-sm' : 'border-border/40 hover:border-accent/50 text-muted-foreground')}>{o}</button>
  ))}</div>
);

const MultiChipSelect: React.FC<{ options: string[]; selected: string[]; onChange: (v: string[]) => void }> = ({ options, selected, onChange }) => (
  <div className="flex flex-wrap gap-1.5">{options.map(o => (
    <button key={o} onClick={() => onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o])} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-medium border transition-all', selected.includes(o) ? 'bg-accent/10 text-accent border-accent/30' : 'border-border/40 hover:border-accent/50 text-muted-foreground')}>{o}</button>
  ))}</div>
);

const TagInput: React.FC<{ tags: string[]; onChange: (t: string[]) => void; placeholder?: string }> = ({ tags, onChange, placeholder }) => {
  const [input, setInput] = useState('');
  const add = () => { if (input.trim() && !tags.includes(input.trim())) { onChange([...tags, input.trim()]); setInput(''); } };
  return (
    <div>
      <div className="flex gap-1.5 mb-1.5 flex-wrap">{tags.map(t => (<Badge key={t} variant="secondary" className="text-[8px] h-5 gap-0.5 rounded-lg">{t}<button onClick={() => onChange(tags.filter(x => x !== t))}><X className="h-2.5 w-2.5" /></button></Badge>))}</div>
      <div className="flex gap-1.5"><Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())} placeholder={placeholder} className="h-8 text-xs flex-1" /><Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl" onClick={add}><Plus className="h-3 w-3" /></Button></div>
    </div>
  );
};

const Stepper: React.FC<{ current: Step; onGo: (s: Step) => void }> = ({ current, onGo }) => (
  <div className="flex items-center gap-0.5 overflow-x-auto pb-1">{STEPS.map((s, i) => {
    const isCurrent = s.key === current; const isPast = STEPS.findIndex(st => st.key === current) > i; const Icon = s.icon;
    return (<React.Fragment key={s.key}>
      <button onClick={() => onGo(s.key)} className={cn('flex items-center gap-1 px-2 py-1.5 rounded-xl text-[9px] font-semibold transition-all shrink-0', isCurrent ? 'bg-accent text-accent-foreground shadow-sm' : isPast ? 'text-[hsl(var(--state-healthy))] hover:bg-muted/50' : 'text-muted-foreground hover:bg-muted/50')}>{isPast ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}<span className="hidden md:inline">{s.label}</span></button>
      {i < STEPS.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />}
    </React.Fragment>);
  })}</div>
);

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */
const ProjectCreatePage: React.FC = () => {
  const { activeRole: _activeRole } = useRole();
  const [step, setStep] = useState<Step>('core');

  // Core
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [subcategory, setSubcategory] = useState('');
  const [projectType, setProjectType] = useState('Fixed-price');
  const [scopeSize, setScopeSize] = useState('Medium ($5K-$25K)');
  const [expertiseLevel, setExpertiseLevel] = useState('Intermediate');

  // Skills & Tags
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [categoryTags, setCategoryTags] = useState<string[]>([]);
  const [toolTags, setToolTags] = useState<string[]>([]);
  const [industryTags, setIndustryTags] = useState<string[]>([]);
  const [roleTags, setRoleTags] = useState<string[]>([]);

  // Commercial
  const [budgetMin, setBudgetMin] = useState('');
  const [budgetMax, setBudgetMax] = useState('');
  const [budgetType, setBudgetType] = useState('Fixed-price');
  const [milestoneEnabled, setMilestoneEnabled] = useState(true);
  const [escrow, setEscrow] = useState(true);
  const [milestones, setMilestones] = useState<Milestone[]>([{ id: '1', title: '', amount: '', description: '' }]);

  // Location
  const [workModel, setWorkModel] = useState('Remote');
  const [primaryLocation, setPrimaryLocation] = useState('');
  const [regionRestriction, setRegionRestriction] = useState('');
  const [timezonePreference, setTimezonePreference] = useState('');
  const [travelRequired, setTravelRequired] = useState(false);

  // Timeline
  const [startDate, setStartDate] = useState('');
  const [duration, setDuration] = useState('');
  const [deadline, setDeadline] = useState('');
  const [freelancersNeeded, setFreelancersNeeded] = useState('1');

  // Requirements
  const [requiredExp, setRequiredExp] = useState('');
  const [preferredExp, setPreferredExp] = useState('');
  const [qualifications, setQualifications] = useState<string[]>([]);
  const [certs, setCerts] = useState<string[]>([]);
  const [portfolioReq, setPortfolioReq] = useState(false);
  const [languageReq, setLanguageReq] = useState('');
  const [hardBlockers, setHardBlockers] = useState<string[]>([]);

  // Launchpad
  const [launchpadOptions, setLaunchpadOptions] = useState<string[]>([]);

  // Screening
  const [screeners, setScreeners] = useState<ScreenerQ[]>([
    { id: '1', text: 'Describe a similar project you have completed.', required: true, knockout: false },
    { id: '2', text: 'What is your availability for this project?', required: true, knockout: false },
  ]);

  // Matching
  const [matches, setMatches] = useState<MatchCandidate[]>(MOCK_MATCHES);
  const [matchFilter, setMatchFilter] = useState('');

  const currentIdx = STEPS.findIndex(s => s.key === step);
  const isLast = currentIdx === STEPS.length - 1;
  const isFirst = currentIdx === 0;
  const goNext = () => { if (!isLast) setStep(STEPS[currentIdx + 1].key); };
  const goPrev = () => { if (!isFirst) setStep(STEPS[currentIdx - 1].key); };
  const saveDraft = useCallback(() => toast.success('Draft saved'), []);

  const toggleInvite = (id: string) => setMatches(m => m.map(c => c.id === id ? { ...c, invited: !c.invited } : c));
  const invitedCount = matches.filter(m => m.invited).length;

  return (
    <DashboardLayout topStrip={
      <>
        <Link to="/projects/mine" className="flex items-center gap-1 text-muted-foreground hover:text-foreground"><ArrowLeft className="h-3 w-3" /><span className="text-[10px]">Projects</span></Link>
        <div className="h-4 w-px bg-border mx-1" />
        <Briefcase className="h-4 w-4 text-accent" />
        <span className="text-xs font-bold">Create Project</span>
        <div className="flex-1" />
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={saveDraft}><Save className="h-3 w-3" /> Draft</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setStep('review')}><Eye className="h-3 w-3" /> Preview</Button>
      </>
    }>
      <div className="rounded-2xl border bg-card px-4 py-2.5 mb-4 shadow-card"><Stepper current={step} onGo={setStep} /></div>

      {/* ── Step 1: Core ── */}
      {step === 'core' && (
        <SectionCard title="Project Core" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Project Title" required /><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Build a SaaS Dashboard MVP" className="h-9 text-xs" /></div>
            <div><FieldLabel label="Project Description" required /><Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the project scope, goals, and deliverables..." className="text-xs min-h-[120px]" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Category" /><Input value={category} onChange={e => setCategory(e.target.value)} placeholder="e.g. Web Development" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Subcategory" /><Input value={subcategory} onChange={e => setSubcategory(e.target.value)} placeholder="e.g. Full-Stack" className="h-9 text-xs" /></div>
            </div>
            <div><FieldLabel label="Project Type" /><ChipSelect options={PROJECT_TYPES} selected={projectType} onChange={setProjectType} /></div>
            <div><FieldLabel label="Scope Size" /><ChipSelect options={SCOPE_SIZES} selected={scopeSize} onChange={setScopeSize} /></div>
            <div><FieldLabel label="Expertise Level" /><ChipSelect options={EXPERTISE_LEVELS} selected={expertiseLevel} onChange={setExpertiseLevel} /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 2: Skills & Tags ── */}
      {step === 'skills' && (
        <SectionCard title="Skills & Tags" icon={<Tag className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Skill Tags" required /><TagInput tags={skillTags} onChange={setSkillTags} placeholder="e.g. React, Node.js, TypeScript" /></div>
            <div><FieldLabel label="Category Tags" /><TagInput tags={categoryTags} onChange={setCategoryTags} placeholder="e.g. Web Development" /></div>
            <div><FieldLabel label="Tool Tags" /><TagInput tags={toolTags} onChange={setToolTags} placeholder="e.g. Figma, AWS, Docker" /></div>
            <div><FieldLabel label="Industry Tags" /><TagInput tags={industryTags} onChange={setIndustryTags} placeholder="e.g. FinTech, Healthcare" /></div>
            <div><FieldLabel label="Role Tags" /><TagInput tags={roleTags} onChange={setRoleTags} placeholder="e.g. Full-Stack Developer, Designer" /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 3: Commercial ── */}
      {step === 'commercial' && (
        <SectionCard title="Commercial Structure" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Budget Type" /><ChipSelect options={['Fixed-price', 'Hourly', 'Milestone-based']} selected={budgetType} onChange={setBudgetType} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Budget Min" required /><Input value={budgetMin} onChange={e => setBudgetMin(e.target.value)} placeholder="$5,000" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Budget Max" required /><Input value={budgetMax} onChange={e => setBudgetMax(e.target.value)} placeholder="$15,000" className="h-9 text-xs" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40"><Switch checked={milestoneEnabled} onCheckedChange={setMilestoneEnabled} /><div><div className="text-[10px] font-semibold">Milestone Payments</div><div className="text-[8px] text-muted-foreground">Split payment across milestones</div></div></div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40"><Switch checked={escrow} onCheckedChange={setEscrow} /><div><div className="text-[10px] font-semibold">Escrow Required</div><div className="text-[8px] text-muted-foreground">Funds held in escrow until delivery</div></div></div>
            </div>
            {milestoneEnabled && (
              <div>
                <FieldLabel label="Milestones" />
                <div className="space-y-2 mb-2">
                  {milestones.map((m, idx) => (
                    <div key={m.id} className="p-3 rounded-xl border border-border/40 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-muted-foreground">M{idx + 1}</span>
                        <Input value={m.title} onChange={e => setMilestones(ms => ms.map((x, i) => i === idx ? { ...x, title: e.target.value } : x))} placeholder="Milestone title" className="h-7 text-[10px] flex-1" />
                        <Input value={m.amount} onChange={e => setMilestones(ms => ms.map((x, i) => i === idx ? { ...x, amount: e.target.value } : x))} placeholder="$2,500" className="h-7 text-[10px] w-24" />
                        <button onClick={() => setMilestones(ms => ms.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                      </div>
                      <Input value={m.description} onChange={e => setMilestones(ms => ms.map((x, i) => i === idx ? { ...x, description: e.target.value } : x))} placeholder="Description..." className="h-6 text-[9px]" />
                    </div>
                  ))}
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setMilestones(m => [...m, { id: String(Date.now()), title: '', amount: '', description: '' }])}><Plus className="h-3 w-3" /> Add Milestone</Button>
              </div>
            )}
          </div>
        </SectionCard>
      )}

      {/* ── Step 4: Location ── */}
      {step === 'location' && (
        <SectionCard title="Working Model & Location" icon={<MapPin className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Working Model" /><ChipSelect options={WORK_MODELS} selected={workModel} onChange={setWorkModel} /></div>
            {workModel !== 'Remote' && <div><FieldLabel label="Primary Location" /><Input value={primaryLocation} onChange={e => setPrimaryLocation(e.target.value)} placeholder="City, Country" className="h-9 text-xs" /></div>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Region/Country Restriction" /><Input value={regionRestriction} onChange={e => setRegionRestriction(e.target.value)} placeholder="e.g. US/EU only" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Time Zone Preference" /><Input value={timezonePreference} onChange={e => setTimezonePreference(e.target.value)} placeholder="e.g. UTC-5 to UTC+1" className="h-9 text-xs" /></div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40"><Switch checked={travelRequired} onCheckedChange={setTravelRequired} /><div><div className="text-[10px] font-semibold">Travel Required</div><div className="text-[8px] text-muted-foreground">Some on-site visits may be needed</div></div></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 5: Timeline ── */}
      {step === 'timeline' && (
        <SectionCard title="Timeline & Team Size" icon={<Calendar className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><FieldLabel label="Start Date" /><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" /></div>
              <div><FieldLabel label="Duration" /><Input value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 3 months" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Deadline" /><Input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} className="h-9 text-xs" /></div>
            </div>
            <div><FieldLabel label="Number of Freelancers Needed" /><Input type="number" value={freelancersNeeded} onChange={e => setFreelancersNeeded(e.target.value)} min={1} className="h-9 text-xs" /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 6: Requirements ── */}
      {step === 'requirements' && (
        <SectionCard title="Candidate Requirements" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Required Experience" /><Input value={requiredExp} onChange={e => setRequiredExp(e.target.value)} placeholder="e.g. 5+ years React development" className="h-9 text-xs" /></div>
            <div><FieldLabel label="Preferred Experience" /><Input value={preferredExp} onChange={e => setPreferredExp(e.target.value)} placeholder="e.g. SaaS, marketplace, B2B" className="h-9 text-xs" /></div>
            <div><FieldLabel label="Qualifications" /><TagInput tags={qualifications} onChange={setQualifications} placeholder="e.g. CS degree, MBA" /></div>
            <div><FieldLabel label="Certifications" /><TagInput tags={certs} onChange={setCerts} placeholder="e.g. AWS Solutions Architect" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40"><Switch checked={portfolioReq} onCheckedChange={setPortfolioReq} /><div><div className="text-[10px] font-semibold">Portfolio Required</div></div></div>
              <div><FieldLabel label="Language Requirement" /><Input value={languageReq} onChange={e => setLanguageReq(e.target.value)} placeholder="e.g. English (fluent)" className="h-9 text-xs" /></div>
            </div>
            <div><FieldLabel label="Hard Blockers" hint="Auto-reject if not met" /><TagInput tags={hardBlockers} onChange={setHardBlockers} placeholder="e.g. Must have NDA clearance" /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 7: Launchpad ── */}
      {step === 'launchpad' && (
        <SectionCard title="Experience Launchpad Options" icon={<GraduationCap className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground mb-4">Make this project accessible to emerging talent. Select all that apply:</p>
          <MultiChipSelect options={LAUNCHPAD_OPTIONS} selected={launchpadOptions} onChange={setLaunchpadOptions} />
          {launchpadOptions.length > 0 && (
            <div className="mt-4 p-3 rounded-xl bg-accent/5 border border-accent/20 text-[9px] text-accent flex items-center gap-2">
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>This project will be featured in the Experience Launchpad for {launchpadOptions.length} categories of emerging talent.</span>
            </div>
          )}
        </SectionCard>
      )}

      {/* ── Step 8: Screening ── */}
      {step === 'screening' && (
        <SectionCard title="Screening Questions" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-2 mb-3">
            {screeners.map((q, idx) => (
              <div key={q.id} className="p-3 rounded-xl border border-border/40 space-y-1.5">
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-bold text-muted-foreground mt-1.5">Q{idx + 1}</span>
                  <Input value={q.text} onChange={e => setScreeners(s => s.map((x, i) => i === idx ? { ...x, text: e.target.value } : x))} placeholder="Question..." className="h-8 text-xs flex-1" />
                  <button onClick={() => setScreeners(s => s.filter((_, i) => i !== idx))}><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                </div>
                <div className="flex items-center gap-3 ml-6">
                  <label className="flex items-center gap-1 text-[8px]"><input type="checkbox" checked={q.required} onChange={e => setScreeners(s => s.map((x, i) => i === idx ? { ...x, required: e.target.checked } : x))} className="accent-accent" /> Required</label>
                  <label className="flex items-center gap-1 text-[8px] text-destructive"><input type="checkbox" checked={q.knockout} onChange={e => setScreeners(s => s.map((x, i) => i === idx ? { ...x, knockout: e.target.checked } : x))} className="accent-destructive" /> Knockout</label>
                </div>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setScreeners(s => [...s, { id: String(Date.now()), text: '', required: false, knockout: false }])}><Plus className="h-3 w-3" /> Add Question</Button>
        </SectionCard>
      )}

      {/* ── Step 9: Match & Invite ── */}
      {step === 'matching' && (
        <div className="space-y-4">
          <SectionCard title="Match & Invite Talent" icon={<UserPlus className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><Input value={matchFilter} onChange={e => setMatchFilter(e.target.value)} placeholder="Filter matched talent..." className="pl-8 h-8 text-xs" /></div>
              <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Filter className="h-3 w-3" /> Filters</Button>
              <Badge className="text-[8px] bg-accent/10 text-accent border-0">{invitedCount} invited</Badge>
            </div>
            <div className="space-y-2">
              {matches.filter(m => !matchFilter || m.name.toLowerCase().includes(matchFilter.toLowerCase()) || m.skills.some(s => s.toLowerCase().includes(matchFilter.toLowerCase()))).map(c => (
                <div key={c.id} className={cn('p-3 rounded-xl border transition-all', c.invited ? 'border-accent bg-accent/5 ring-1 ring-accent/20' : 'border-border/30 hover:border-accent/30')}>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 rounded-xl"><AvatarFallback className="rounded-xl text-[9px] font-bold bg-accent/10 text-accent">{c.avatar}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[11px] font-bold">{c.name}</span>
                        <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0">{c.matchScore}% match</Badge>
                        <span className="text-[8px] text-muted-foreground ml-auto">{c.rate}</span>
                      </div>
                      <div className="text-[9px] text-muted-foreground">{c.title}</div>
                      <div className="flex items-center gap-1.5 mt-1 flex-wrap">{c.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px] h-4">{s}</Badge>)}<span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Star className="h-2 w-2" />{c.rating} · {c.jobs} jobs</span></div>
                    </div>
                    <Button variant={c.invited ? 'default' : 'outline'} size="sm" className="h-7 text-[9px] rounded-xl gap-0.5 shrink-0" onClick={() => toggleInvite(c.id)}>{c.invited ? <><CheckCircle2 className="h-3 w-3" /> Invited</> : <><UserPlus className="h-3 w-3" /> Invite</>}</Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl">Continue Without Invites</Button>
            <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Save className="h-3 w-3" /> Save Talent List</Button>
          </div>
        </div>
      )}

      {/* ── Step 10: Review ── */}
      {step === 'review' && (
        <div className="space-y-4">
          <SectionCard title="Review & Publish" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-3">
              {[
                { label: 'Title', value: title || '—', go: 'core' as Step },
                { label: 'Type', value: `${projectType} · ${scopeSize} · ${expertiseLevel}`, go: 'core' as Step },
                { label: 'Budget', value: budgetMin && budgetMax ? `${budgetMin} – ${budgetMax}` : '—', go: 'commercial' as Step },
                { label: 'Location', value: workModel, go: 'location' as Step },
                { label: 'Timeline', value: duration || 'Not set', go: 'timeline' as Step },
                { label: 'Skills', value: skillTags.length > 0 ? skillTags.join(', ') : '—', go: 'skills' as Step },
                { label: 'Launchpad', value: launchpadOptions.length > 0 ? launchpadOptions.join(', ') : 'None', go: 'launchpad' as Step },
                { label: 'Screening', value: `${screeners.length} questions`, go: 'screening' as Step },
                { label: 'Invites', value: `${invitedCount} freelancers invited`, go: 'matching' as Step },
              ].map((item, i) => (
                <button key={i} onClick={() => setStep(item.go)} className="w-full flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all text-left">
                  <div><div className="text-[9px] text-muted-foreground">{item.label}</div><div className="text-[10px] font-semibold truncate max-w-md">{item.value}</div></div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Validation" className="!rounded-2xl">
            {(!title || !budgetMin) ? (
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 flex items-center gap-2 text-[9px] text-destructive"><AlertTriangle className="h-4 w-4" /> <div><strong>Missing:</strong> {!title && 'Project Title, '}{!budgetMin && 'Budget'}. Complete before publishing.</div></div>
            ) : (
              <div className="p-3 rounded-xl bg-[hsl(var(--state-healthy))]/5 border border-[hsl(var(--state-healthy))]/20 flex items-center gap-2 text-[9px] text-[hsl(var(--state-healthy))]"><CheckCircle2 className="h-4 w-4" /> Ready to publish.</div>
            )}
          </SectionCard>
        </div>
      )}

      {/* ── Sticky Navigation ── */}
      <div className="sticky bottom-0 z-10 mt-4 -mx-1 px-1 pb-1">
        <div className="flex items-center justify-between rounded-2xl border bg-card/95 backdrop-blur-sm px-5 py-3 shadow-lg">
          <Button variant="outline" size="sm" disabled={isFirst} onClick={goPrev} className="h-8 text-xs rounded-xl gap-1"><ChevronLeft className="h-3 w-3" /> Back</Button>
          <div className="text-[9px] text-muted-foreground">{currentIdx + 1} of {STEPS.length}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1" onClick={saveDraft}><Save className="h-3 w-3" /> Save</Button>
            {isLast ? (
              <Button size="sm" className="h-8 text-xs rounded-xl gap-1" disabled={!title || !budgetMin} onClick={() => toast.success('Project published!')}><Sparkles className="h-3 w-3" /> Publish</Button>
            ) : (
              <Button size="sm" onClick={goNext} className="h-8 text-xs rounded-xl gap-1">Next <ChevronRight className="h-3 w-3" /></Button>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProjectCreatePage;
