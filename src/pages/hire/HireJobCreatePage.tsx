import React, { useState, useCallback } from 'react';
import { TagInput } from '@/components/social/TagSystem';
import { HireShell } from '@/components/shell/HireShell';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Briefcase, Plus, Shield, CheckCircle2, Sparkles, ChevronRight, ChevronLeft,
  Save, Eye, Send, MapPin, DollarSign, FileText, Users, Target, Clock,
  Globe, GraduationCap, AlertTriangle, X, Star, Search, Trash2, Upload,
  Tag, Filter, Zap, Award, HelpCircle, Lock, Building2, UserPlus,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type Step = 'role' | 'location' | 'compensation' | 'description' | 'requirements' | 'tags' | 'screening' | 'timing' | 'review';
type DraftStatus = 'unsaved' | 'saving' | 'saved';

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'role', label: 'Core Role', icon: Briefcase },
  { key: 'location', label: 'Location', icon: MapPin },
  { key: 'compensation', label: 'Package', icon: DollarSign },
  { key: 'description', label: 'Description', icon: FileText },
  { key: 'requirements', label: 'Requirements', icon: Target },
  { key: 'tags', label: 'Tags', icon: Tag },
  { key: 'screening', label: 'Screening', icon: Shield },
  { key: 'timing', label: 'Timing', icon: Clock },
  { key: 'review', label: 'Review', icon: CheckCircle2 },
];

const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Apprenticeship', 'Freelance', 'Temporary', 'Graduate Role'];
const SENIORITY_LEVELS = ['Entry Level', 'Junior', 'Mid-Level', 'Senior', 'Lead', 'Principal', 'Director', 'VP', 'C-Level'];
const LAUNCHPAD_OPTIONS = ['Graduate Entry', 'School Leaver', 'Career Changer', 'Trainee Pathway', 'Returnship', 'None'];
const WORK_MODELS = ['Remote', 'Hybrid', 'On-site'];
const SCREENER_TYPES = ['Short Text', 'Long Text', 'Yes/No', 'Multiple Choice', 'Single Select', 'Number', 'Date', 'File Upload', 'Link'];
const URGENCY_LEVELS = ['Low', 'Normal', 'High', 'Urgent'];

interface ScreenerQuestion {
  id: string; text: string; type: string; required: boolean; knockout: boolean;
}

/* ═══════════════════════════════════════════════════════════
   Stepper
   ═══════════════════════════════════════════════════════════ */
const Stepper: React.FC<{ current: Step; onGo: (s: Step) => void }> = ({ current, onGo }) => (
  <div className="flex items-center gap-0.5 overflow-x-auto pb-1">
    {STEPS.map((s, i) => {
      const isCurrent = s.key === current;
      const isPast = STEPS.findIndex(st => st.key === current) > i;
      const Icon = s.icon;
      return (
        <React.Fragment key={s.key}>
          <button onClick={() => onGo(s.key)} className={cn(
            'flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[9px] font-semibold transition-all shrink-0',
            isCurrent ? 'bg-accent text-accent-foreground shadow-sm' :
            isPast ? 'text-[hsl(var(--state-healthy))] hover:bg-muted/50' :
            'text-muted-foreground hover:bg-muted/50'
          )}>
            {isPast ? <CheckCircle2 className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
            <span className="hidden sm:inline">{s.label}</span>
          </button>
          {i < STEPS.length - 1 && <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40 shrink-0" />}
        </React.Fragment>
      );
    })}
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Field helpers
   ═══════════════════════════════════════════════════════════ */
const FieldLabel: React.FC<{ label: string; required?: boolean; hint?: string }> = ({ label, required, hint }) => (
  <div className="mb-1">
    <label className="text-[10px] font-semibold">{label}{required && <span className="text-destructive ml-0.5">*</span>}</label>
    {hint && <p className="text-[8px] text-muted-foreground">{hint}</p>}
  </div>
);

const ChipSelect: React.FC<{ options: string[]; selected: string; onChange: (v: string) => void }> = ({ options, selected, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map(o => (
      <button key={o} onClick={() => onChange(o)} className={cn(
        'px-2.5 py-1 rounded-xl text-[9px] font-medium transition-all border',
        selected === o ? 'bg-accent text-accent-foreground border-accent shadow-sm' : 'border-border/40 hover:border-accent/50 text-muted-foreground hover:text-foreground'
      )}>{o}</button>
    ))}
  </div>
);

const MultiChipSelect: React.FC<{ options: string[]; selected: string[]; onChange: (v: string[]) => void }> = ({ options, selected, onChange }) => (
  <div className="flex flex-wrap gap-1.5">
    {options.map(o => (
      <button key={o} onClick={() => onChange(selected.includes(o) ? selected.filter(s => s !== o) : [...selected, o])} className={cn(
        'px-2.5 py-1 rounded-xl text-[9px] font-medium transition-all border',
        selected.includes(o) ? 'bg-accent/10 text-accent border-accent/30' : 'border-border/40 hover:border-accent/50 text-muted-foreground'
      )}>{o}</button>
    ))}
  </div>
);

// TagInput imported from '@/components/social/TagSystem'

/* ═══════════════════════════════════════════════════════════
   Main Page
   ═══════════════════════════════════════════════════════════ */
export default function HireJobCreatePage() {
  const [step, setStep] = useState<Step>('role');
  const [draft, setDraft] = useState<DraftStatus>('unsaved');

  // Step 1 — Role
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [department, setDepartment] = useState('');
  const [hiringManager, setHiringManager] = useState('');
  const [employmentType, setEmploymentType] = useState('Full-time');
  const [seniority, setSeniority] = useState('Mid-Level');
  const [launchpad, setLaunchpad] = useState('None');
  const [vacancies, setVacancies] = useState('1');

  // Step 2 — Location
  const [workModel, setWorkModel] = useState('Remote');
  const [primaryLocation, setPrimaryLocation] = useState('');
  const [locationNotes, setLocationNotes] = useState('');
  const [travelReq, setTravelReq] = useState('');
  const [relocation, setRelocation] = useState(false);
  const [workAuth, setWorkAuth] = useState('');
  const [timezone, setTimezone] = useState('');

  // Step 3 — Compensation
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');
  const [bonus, setBonus] = useState('');
  const [equity, setEquity] = useState('');
  const [benefits, setBenefits] = useState('');
  const [perks, setPerks] = useState('');
  const [trainingBudget, setTrainingBudget] = useState('');

  // Step 4 — Description
  const [summary, setSummary] = useState('');
  const [fullDesc, setFullDesc] = useState('');
  const [responsibilities, setResponsibilities] = useState('');
  const [dayToDay, setDayToDay] = useState('');
  const [teamContext, setTeamContext] = useState('');
  const [toolsUsed, setToolsUsed] = useState('');

  // Step 5 — Requirements
  const [requiredSkills, setRequiredSkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [requiredExp, setRequiredExp] = useState('');
  const [requiredQuals, setRequiredQuals] = useState<string[]>([]);
  const [certs, setCerts] = useState<string[]>([]);
  const [hardBlockers, setHardBlockers] = useState<string[]>([]);

  // Step 6 — Tags
  const [skillTags, setSkillTags] = useState<string[]>([]);
  const [industryTags, setIndustryTags] = useState<string[]>([]);
  const [functionTags, setFunctionTags] = useState<string[]>([]);
  const [techTags, setTechTags] = useState<string[]>([]);
  const [roleKeywords, setRoleKeywords] = useState<string[]>([]);

  // Step 7 — Screening
  const [cvRequired, setCvRequired] = useState(true);
  const [coverLetter, setCoverLetter] = useState(false);
  const [portfolio, setPortfolio] = useState(false);
  const [screeners, setScreeners] = useState<ScreenerQuestion[]>([
    { id: '1', text: 'Are you authorized to work in this country?', type: 'Yes/No', required: true, knockout: true },
  ]);

  // Step 8 — Timing
  const [closingDate, setClosingDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [urgency, setUrgency] = useState('Normal');
  const [featured, setFeatured] = useState(false);
  const [visibility, setVisibility] = useState<'public' | 'internal'>('public');

  const currentIdx = STEPS.findIndex(s => s.key === step);
  const isLast = currentIdx === STEPS.length - 1;
  const isFirst = currentIdx === 0;

  const goNext = () => { if (!isLast) setStep(STEPS[currentIdx + 1].key); };
  const goPrev = () => { if (!isFirst) setStep(STEPS[currentIdx - 1].key); };

  const saveDraft = useCallback(() => {
    setDraft('saving');
    setTimeout(() => { setDraft('saved'); toast.success('Draft saved'); }, 800);
  }, []);

  const addScreener = () => setScreeners(s => [...s, { id: String(Date.now()), text: '', type: 'Short Text', required: false, knockout: false }]);

  return (
    <HireShell>
      <SectionBackNav homeRoute="/hire/jobs" homeLabel="Jobs" currentLabel="Create Job" icon={<Shield className="h-3 w-3" />} breadcrumbs={[{ label: 'Recruitment', to: '/hire' }]} />

      {/* Header */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Briefcase className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold flex-1">Create Job Posting</h1>
        <Badge variant="outline" className="text-[8px] h-5 gap-1">{draft === 'saved' ? <><CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))]" /> Saved</> : 'Unsaved'}</Badge>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={saveDraft}><Save className="h-3 w-3" /> Save Draft</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setStep('review')}><Eye className="h-3 w-3" /> Preview</Button>
      </div>

      {/* Stepper */}
      <div className="rounded-2xl border bg-card px-4 py-2.5 mb-4 shadow-card">
        <Stepper current={step} onGo={setStep} />
      </div>

      {/* ── Step 1: Core Role ── */}
      {step === 'role' && (
        <SectionCard title="Core Role Setup" icon={<Briefcase className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Position Title" required hint="The public-facing job title" /><Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Senior Frontend Engineer" className="h-9 text-xs" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Company" /><Input value={company} onChange={e => setCompany(e.target.value)} placeholder="Company name" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Department / Team" /><Input value={department} onChange={e => setDepartment(e.target.value)} placeholder="e.g. Engineering" className="h-9 text-xs" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Hiring Manager" /><Input value={hiringManager} onChange={e => setHiringManager(e.target.value)} placeholder="Name or email" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Vacancy Count" /><Input type="number" value={vacancies} onChange={e => setVacancies(e.target.value)} min={1} className="h-9 text-xs" /></div>
            </div>
            <div><FieldLabel label="Employment Type" required /><ChipSelect options={EMPLOYMENT_TYPES} selected={employmentType} onChange={setEmploymentType} /></div>
            <div><FieldLabel label="Seniority Level" /><ChipSelect options={SENIORITY_LEVELS} selected={seniority} onChange={setSeniority} /></div>
            <div>
              <FieldLabel label="Experience Launchpad Type" hint="Make this role visible to emerging talent pathways" />
              <ChipSelect options={LAUNCHPAD_OPTIONS} selected={launchpad} onChange={setLaunchpad} />
              {launchpad !== 'None' && (
                <div className="mt-2 p-3 rounded-xl bg-accent/5 border border-accent/20 text-[9px] text-accent flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 shrink-0" />
                  <span>This role will appear in the Experience Launchpad for {launchpad.toLowerCase()} candidates.</span>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 2: Location ── */}
      {step === 'location' && (
        <SectionCard title="Location & Working Model" icon={<MapPin className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Working Model" required /><ChipSelect options={WORK_MODELS} selected={workModel} onChange={setWorkModel} /></div>
            {workModel !== 'Remote' && (
              <div><FieldLabel label="Primary Location" required /><Input value={primaryLocation} onChange={e => setPrimaryLocation(e.target.value)} placeholder="City, Country" className="h-9 text-xs" /></div>
            )}
            <div><FieldLabel label="Additional Location Notes" hint="e.g. Office days, multiple sites" /><Textarea value={locationNotes} onChange={e => setLocationNotes(e.target.value)} placeholder="Any additional location details..." className="text-xs min-h-[80px]" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Travel Requirement" /><Input value={travelReq} onChange={e => setTravelReq(e.target.value)} placeholder="e.g. 10-20%" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Time Zone Requirement" /><Input value={timezone} onChange={e => setTimezone(e.target.value)} placeholder="e.g. GMT-5 to GMT+1" className="h-9 text-xs" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Work Authorization" /><Input value={workAuth} onChange={e => setWorkAuth(e.target.value)} placeholder="e.g. Must have right to work in US" className="h-9 text-xs" /></div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={relocation} onCheckedChange={setRelocation} />
                <label className="text-[10px] font-medium">Relocation support available</label>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 3: Compensation ── */}
      {step === 'compensation' && (
        <SectionCard title="Compensation & Package" icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><FieldLabel label="Salary Min" required /><Input value={salaryMin} onChange={e => setSalaryMin(e.target.value)} placeholder="$120,000" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Salary Max" required /><Input value={salaryMax} onChange={e => setSalaryMax(e.target.value)} placeholder="$180,000" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Currency" /><Input defaultValue="USD" className="h-9 text-xs" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Bonus" hint="Annual/signing bonus details" /><Input value={bonus} onChange={e => setBonus(e.target.value)} placeholder="e.g. Up to 15% annual" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Equity / Stock Options" /><Input value={equity} onChange={e => setEquity(e.target.value)} placeholder="e.g. 0.05-0.15%" className="h-9 text-xs" /></div>
            </div>
            <div><FieldLabel label="Benefits Summary" hint="Health, retirement, time off, etc." /><Textarea value={benefits} onChange={e => setBenefits(e.target.value)} placeholder="Health insurance, 401k match, unlimited PTO, dental, vision..." className="text-xs min-h-[80px]" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Perks" /><Input value={perks} onChange={e => setPerks(e.target.value)} placeholder="e.g. Home office stipend, gym membership" className="h-9 text-xs" /></div>
              <div><FieldLabel label="Training Budget" /><Input value={trainingBudget} onChange={e => setTrainingBudget(e.target.value)} placeholder="e.g. $3,000/year" className="h-9 text-xs" /></div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 4: Description ── */}
      {step === 'description' && (
        <SectionCard title="Job Description & Responsibilities" icon={<FileText className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Role Summary" required hint="2-3 sentence overview" /><Textarea value={summary} onChange={e => setSummary(e.target.value)} placeholder="A concise summary of the role and its impact..." className="text-xs min-h-[80px]" /></div>
            <div><FieldLabel label="Full Job Description" required /><Textarea value={fullDesc} onChange={e => setFullDesc(e.target.value)} placeholder="Detailed description of the role, team, and opportunity..." className="text-xs min-h-[160px]" /></div>
            <div><FieldLabel label="Key Responsibilities" hint="List 5-7 core responsibilities" /><Textarea value={responsibilities} onChange={e => setResponsibilities(e.target.value)} placeholder="• Lead frontend architecture decisions&#10;• Mentor junior developers&#10;• Ship production features weekly" className="text-xs min-h-[120px]" /></div>
            <div><FieldLabel label="Day-to-Day Duties" /><Textarea value={dayToDay} onChange={e => setDayToDay(e.target.value)} placeholder="What a typical day/week looks like..." className="text-xs min-h-[80px]" /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Team Context" hint="Team size, structure, reporting line" /><Textarea value={teamContext} onChange={e => setTeamContext(e.target.value)} placeholder="Reports to VP Engineering, works with 8-person product team" className="text-xs min-h-[60px]" /></div>
              <div><FieldLabel label="Tools / Platforms Used" /><Textarea value={toolsUsed} onChange={e => setToolsUsed(e.target.value)} placeholder="React, TypeScript, AWS, Jira, Figma" className="text-xs min-h-[60px]" /></div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 5: Requirements ── */}
      {step === 'requirements' && (
        <SectionCard title="Candidate Requirements" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div><FieldLabel label="Required Skills" required /><TagInput tags={requiredSkills} onChange={setRequiredSkills} placeholder="e.g. React, TypeScript" /></div>
            <div><FieldLabel label="Preferred Skills" /><TagInput tags={preferredSkills} onChange={setPreferredSkills} placeholder="e.g. GraphQL, AWS" /></div>
            <div><FieldLabel label="Required Experience" /><Input value={requiredExp} onChange={e => setRequiredExp(e.target.value)} placeholder="e.g. 5+ years in frontend development" className="h-9 text-xs" /></div>
            <div><FieldLabel label="Required Qualifications" /><TagInput tags={requiredQuals} onChange={setRequiredQuals} placeholder="e.g. BS in Computer Science" /></div>
            <div><FieldLabel label="Certifications" /><TagInput tags={certs} onChange={setCerts} placeholder="e.g. AWS Solutions Architect" /></div>
            <div>
              <FieldLabel label="Hard Blockers" hint="Must-have requirements that auto-reject if not met" />
              <TagInput tags={hardBlockers} onChange={setHardBlockers} placeholder="e.g. Must have driving licence" />
              {hardBlockers.length > 0 && (
                <div className="mt-2 p-2.5 rounded-xl bg-destructive/5 border border-destructive/20">
                  <div className="flex items-center gap-1.5 text-[9px] text-destructive font-semibold mb-1"><Lock className="h-3 w-3" /> Hard Blockers Active</div>
                  <p className="text-[8px] text-muted-foreground">Candidates who don't meet these will be automatically filtered out.</p>
                </div>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 6: Tags ── */}
      {step === 'tags' && (
        <SectionCard title="Tags & Searchability" icon={<Tag className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <p className="text-[9px] text-muted-foreground mb-4">Tags improve candidate matching and search discovery. Add relevant tags to maximize visibility.</p>
          <div className="space-y-4">
            <div><FieldLabel label="Skill Tags" /><TagInput tags={skillTags} onChange={setSkillTags} placeholder="e.g. React, Node.js, System Design" /></div>
            <div><FieldLabel label="Industry Tags" /><TagInput tags={industryTags} onChange={setIndustryTags} placeholder="e.g. FinTech, SaaS, E-commerce" /></div>
            <div><FieldLabel label="Function Tags" /><TagInput tags={functionTags} onChange={setFunctionTags} placeholder="e.g. Engineering, Product, Design" /></div>
            <div><FieldLabel label="Technology Tags" /><TagInput tags={techTags} onChange={setTechTags} placeholder="e.g. AWS, Kubernetes, PostgreSQL" /></div>
            <div><FieldLabel label="Role Keywords" hint="SEO keywords for job search engines" /><TagInput tags={roleKeywords} onChange={setRoleKeywords} placeholder="e.g. senior developer, fullstack engineer" /></div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 7: Screening ── */}
      {step === 'screening' && (
        <SectionCard title="Screening & Application Setup" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Switch checked={cvRequired} onCheckedChange={setCvRequired} />
                <div><div className="text-[10px] font-semibold">CV Required</div><div className="text-[8px] text-muted-foreground">Applicants must upload a CV</div></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Switch checked={coverLetter} onCheckedChange={setCoverLetter} />
                <div><div className="text-[10px] font-semibold">Cover Letter</div><div className="text-[8px] text-muted-foreground">Request a cover letter</div></div>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Switch checked={portfolio} onCheckedChange={setPortfolio} />
                <div><div className="text-[10px] font-semibold">Portfolio</div><div className="text-[8px] text-muted-foreground">Request a portfolio link</div></div>
              </div>
            </div>

            <div>
              <FieldLabel label="Screening Questions" hint="Pre-screen applicants with custom questions" />
              <div className="space-y-2 mb-3">
                {screeners.map((q, idx) => (
                  <div key={q.id} className="p-3 rounded-xl border border-border/40 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="text-[9px] font-bold text-muted-foreground mt-1.5 shrink-0">Q{idx + 1}</span>
                      <Input value={q.text} onChange={e => setScreeners(s => s.map((x, i) => i === idx ? { ...x, text: e.target.value } : x))} placeholder="Enter question..." className="h-8 text-xs flex-1" />
                      <button onClick={() => setScreeners(s => s.filter((_, i) => i !== idx))} className="mt-1 text-muted-foreground hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                    <div className="flex items-center gap-2 ml-6">
                      <select value={q.type} onChange={e => setScreeners(s => s.map((x, i) => i === idx ? { ...x, type: e.target.value } : x))} className="h-6 rounded-lg border text-[8px] px-1.5 bg-background">
                        {SCREENER_TYPES.map(t => <option key={t}>{t}</option>)}
                      </select>
                      <label className="flex items-center gap-1 text-[8px]"><input type="checkbox" checked={q.required} onChange={e => setScreeners(s => s.map((x, i) => i === idx ? { ...x, required: e.target.checked } : x))} className="accent-accent" /> Required</label>
                      <label className="flex items-center gap-1 text-[8px] text-destructive"><input type="checkbox" checked={q.knockout} onChange={e => setScreeners(s => s.map((x, i) => i === idx ? { ...x, knockout: e.target.checked } : x))} className="accent-destructive" /> Knockout</label>
                    </div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={addScreener}><Plus className="h-3 w-3" /> Add Question</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 8: Timing ── */}
      {step === 'timing' && (
        <SectionCard title="Timing & Visibility" icon={<Clock className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><FieldLabel label="Closing Date" /><Input type="date" value={closingDate} onChange={e => setClosingDate(e.target.value)} className="h-9 text-xs" /></div>
              <div><FieldLabel label="Start Date" /><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" /></div>
            </div>
            <div><FieldLabel label="Urgency Level" /><ChipSelect options={URGENCY_LEVELS} selected={urgency} onChange={setUrgency} /></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 rounded-xl border border-border/40">
                <Switch checked={featured} onCheckedChange={setFeatured} />
                <div><div className="text-[10px] font-semibold">Featured Job</div><div className="text-[8px] text-muted-foreground">Promoted placement in search results</div></div>
              </div>
              <div className="p-3 rounded-xl border border-border/40">
                <div className="text-[10px] font-semibold mb-2">Visibility</div>
                <div className="flex gap-2">
                  {(['public', 'internal'] as const).map(v => (
                    <button key={v} onClick={() => setVisibility(v)} className={cn('px-3 py-1.5 rounded-xl text-[9px] font-medium border transition-all capitalize', visibility === v ? 'bg-accent text-accent-foreground border-accent' : 'border-border/40 text-muted-foreground')}>{v === 'public' ? <><Globe className="h-3 w-3 inline mr-1" />Public</> : <><Lock className="h-3 w-3 inline mr-1" />Internal</>}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </SectionCard>
      )}

      {/* ── Step 9: Review ── */}
      {step === 'review' && (
        <div className="space-y-4">
          <SectionCard title="Review & Publish" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-3">
              {/* Summary cards */}
              {[
                { label: 'Title', value: title || '—', step: 'role' as Step },
                { label: 'Type', value: `${employmentType} · ${seniority}`, step: 'role' as Step },
                { label: 'Location', value: workModel === 'Remote' ? 'Remote' : `${workModel} — ${primaryLocation || '—'}`, step: 'location' as Step },
                { label: 'Salary', value: salaryMin && salaryMax ? `${salaryMin} – ${salaryMax}` : '—', step: 'compensation' as Step },
                { label: 'Required Skills', value: requiredSkills.length > 0 ? requiredSkills.join(', ') : '—', step: 'requirements' as Step },
                { label: 'Screener Qs', value: `${screeners.length} questions`, step: 'screening' as Step },
                { label: 'Visibility', value: `${visibility} · ${urgency} urgency`, step: 'timing' as Step },
              ].map((item, i) => (
                <button key={i} onClick={() => setStep(item.step)} className="w-full flex items-center justify-between p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all text-left">
                  <div>
                    <div className="text-[9px] text-muted-foreground">{item.label}</div>
                    <div className="text-[10px] font-semibold truncate max-w-md">{item.value}</div>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </button>
              ))}
            </div>
          </SectionCard>

          {/* Validation */}
          <SectionCard title="Validation" className="!rounded-2xl">
            {(!title || !salaryMin) ? (
              <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/20 flex items-center gap-2 text-[9px] text-destructive">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <div><strong>Missing required fields:</strong> {!title && 'Position Title, '}{!salaryMin && 'Salary Range'}. Go back and complete them before publishing.</div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-[hsl(var(--state-healthy))]/5 border border-[hsl(var(--state-healthy))]/20 flex items-center gap-2 text-[9px] text-[hsl(var(--state-healthy))]">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                All required fields are complete. Ready to publish.
              </div>
            )}
          </SectionCard>

          {/* Talent Match Preview */}
          <SectionCard title="Talent Match Preview" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <p className="text-[9px] text-muted-foreground mb-3">Based on your job criteria, here are potential candidate matches:</p>
            <div className="space-y-2">
              {[
                { name: 'Sarah Chen', score: 96, skills: ['React', 'TypeScript', 'Node.js'], status: 'Open to work' },
                { name: 'Alex Rivera', score: 91, skills: ['React', 'Figma', 'TypeScript'], status: 'Open to work' },
                { name: 'Priya Sharma', score: 87, skills: ['Python', 'AWS', 'PostgreSQL'], status: 'Available' },
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30">
                  <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent">{c.name.split(' ').map(n => n[0]).join('')}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold">{c.name}</div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {c.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px] h-4">{s}</Badge>)}
                    </div>
                  </div>
                  <Badge className="text-[8px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0">{c.score}% match</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ── Sticky Navigation ── */}
      <div className="sticky bottom-0 z-10 mt-4 -mx-1 px-1 pb-1">
        <div className="flex items-center justify-between rounded-2xl border bg-card/95 backdrop-blur-sm px-5 py-3 shadow-lg">
          <Button variant="outline" size="sm" disabled={isFirst} onClick={goPrev} className="h-8 text-xs rounded-xl gap-1"><ChevronLeft className="h-3 w-3" /> Previous</Button>
          <div className="text-[9px] text-muted-foreground">{currentIdx + 1} of {STEPS.length}</div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="h-8 text-xs rounded-xl gap-1" onClick={saveDraft}><Save className="h-3 w-3" /> Save Draft</Button>
            {isLast ? (
              <Button size="sm" className="h-8 text-xs rounded-xl gap-1" disabled={!title || !salaryMin} onClick={() => toast.success('Job published!')}><Sparkles className="h-3 w-3" /> Publish Job</Button>
            ) : (
              <Button size="sm" onClick={goNext} className="h-8 text-xs rounded-xl gap-1">Next <ChevronRight className="h-3 w-3" /></Button>
            )}
          </div>
        </div>
      </div>
    </HireShell>
  );
}
