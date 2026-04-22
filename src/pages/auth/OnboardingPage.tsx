import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AuthShell } from '@/components/auth/AuthShell';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import {
  ArrowRight, ArrowLeft, CheckCircle2, User, Briefcase,
  MapPin, Globe, Camera, Layers, Building2, Upload,
  Bell, BellOff, Link2, Clock, Sparkles, Loader2,
  Palette, DollarSign, Languages, Target,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STEPS = [
  { key: 'profile', label: 'Profile', icon: User },
  { key: 'expertise', label: 'Expertise', icon: Layers },
  { key: 'goals', label: 'Goals', icon: Target },
  { key: 'preferences', label: 'Preferences', icon: Palette },
];

const INDUSTRIES = [
  'Technology', 'Design', 'Marketing', 'Finance', 'Healthcare',
  'Education', 'Legal', 'Engineering', 'Media', 'Consulting',
  'Real Estate', 'E-commerce', 'Other',
];

const SKILLS = [
  'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
  'Content Writing', 'SEO/SEM', 'Data Analysis', 'Project Management',
  'Video Production', 'Social Media', 'Sales', 'Accounting',
  'DevOps', 'Machine Learning', 'Copywriting', 'Photography',
];

const GOALS = [
  { id: 'find-work', label: 'Find freelance work', icon: Briefcase, desc: 'Get hired for gigs and projects' },
  { id: 'hire-talent', label: 'Hire talent', icon: User, desc: 'Find and hire professionals' },
  { id: 'grow-network', label: 'Grow my network', icon: Link2, desc: 'Connect with professionals' },
  { id: 'build-brand', label: 'Build my brand', icon: Sparkles, desc: 'Create content and showcase work' },
  { id: 'recruit', label: 'Recruit candidates', icon: Target, desc: 'Source and hire at scale' },
  { id: 'sell', label: 'Find leads & sell', icon: DollarSign, desc: 'Discover sales opportunities' },
];

const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Portuguese', 'Chinese', 'Japanese', 'Arabic', 'Hindi', 'Korean'];

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  // Profile
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [website, setWebsite] = useState('');
  const [bio, setBio] = useState('');
  // Expertise
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<Set<string>>(new Set());
  const [experience, setExperience] = useState('');
  // Goals
  const [selectedGoals, setSelectedGoals] = useState<Set<string>>(new Set());
  // Preferences
  const [weeklyHours, setWeeklyHours] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [languages, setLanguages] = useState<Set<string>>(new Set(['English']));
  const [notifications, setNotifications] = useState(true);
  const [newsletter, setNewsletter] = useState(true);

  const progress = ((step + 1) / STEPS.length) * 100;

  const toggleSkill = (skill: string) => {
    const next = new Set(selectedSkills);
    next.has(skill) ? next.delete(skill) : next.add(skill);
    setSelectedSkills(next);
  };

  const toggleGoal = (goal: string) => {
    const next = new Set(selectedGoals);
    next.has(goal) ? next.delete(goal) : next.add(goal);
    setSelectedGoals(next);
  };

  const toggleLang = (lang: string) => {
    const next = new Set(languages);
    next.has(lang) ? next.delete(lang) : next.add(lang);
    setLanguages(next);
  };

  const handleFinish = () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('Welcome to Gigvora! Your profile is set up.');
      navigate('/dashboard');
    }, 1500);
  };

  return (
    <AuthShell maxWidth="max-w-xl" showTrust={false}>
      <div className="rounded-3xl border bg-card shadow-elevated overflow-hidden">
        {/* Top progress strip */}
        <div className="px-7 pt-6 pb-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold">Complete your profile</h2>
            <span className="text-[10px] text-muted-foreground font-medium">Step {step + 1} of {STEPS.length}</span>
          </div>
          <Progress value={progress} className="h-1.5 mb-4" />
          {/* Step indicators */}
          <div className="flex items-center gap-1 mb-5">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.key}>
                <button
                  onClick={() => i < step && setStep(i)}
                  className={cn(
                    'flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-medium transition-all',
                    i === step ? 'bg-accent text-accent-foreground shadow-sm' :
                    i < step ? 'text-[hsl(var(--state-healthy))] hover:bg-muted/50 cursor-pointer' :
                    'text-muted-foreground'
                  )}
                >
                  {i < step ? <CheckCircle2 className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                  <span className="hidden sm:inline">{s.label}</span>
                </button>
                {i < STEPS.length - 1 && (
                  <div className={cn('flex-1 h-px', i < step ? 'bg-[hsl(var(--state-healthy))]' : 'bg-muted')} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content area */}
        <div className="px-7 pb-7">

          {/* Step 1: Profile */}
          {step === 0 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-base font-bold mb-1">Set up your profile</h3>
                <p className="text-xs text-muted-foreground">Help others find and connect with you.</p>
              </div>

              {/* Avatar */}
              <div className="flex items-center gap-4 py-1">
                <div className="h-16 w-16 rounded-2xl bg-muted flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
                  <Camera className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <Button variant="outline" size="sm" className="text-[11px] h-8 gap-1.5 mb-1">
                    <Upload className="h-3 w-3" /> Upload Photo
                  </Button>
                  <p className="text-[9px] text-muted-foreground">JPG, PNG. Max 5MB.</p>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Professional Headline *</label>
                <input type="text" value={headline} onChange={e => setHeadline(e.target.value)}
                  className="w-full h-10 rounded-lg border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-shadow"
                  placeholder="e.g. Full Stack Developer | React Specialist" maxLength={100} />
                <p className="text-[9px] text-muted-foreground text-right mt-0.5">{headline.length}/100</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Location</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input type="text" value={location} onChange={e => setLocation(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-background pl-8 pr-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="City, Country" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Website</label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input type="url" value={website} onChange={e => setWebsite(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-background pl-8 pr-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="https://..." />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Bio</label>
                <textarea value={bio} onChange={e => setBio(e.target.value)}
                  className="w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm min-h-[80px] focus:outline-none focus:ring-2 focus:ring-ring resize-none transition-shadow"
                  placeholder="Tell us about yourself, your experience, and what you're passionate about..." maxLength={500} />
                <p className="text-[9px] text-muted-foreground text-right mt-0.5">{bio.length}/500</p>
              </div>
            </div>
          )}

          {/* Step 2: Expertise */}
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-base font-bold mb-1">Your expertise</h3>
                <p className="text-xs text-muted-foreground">This helps us match you with the right opportunities.</p>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Industry *</label>
                <div className="flex flex-wrap gap-1.5">
                  {INDUSTRIES.map((ind) => (
                    <button key={ind} type="button" onClick={() => setSelectedIndustry(ind)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all',
                        selectedIndustry === ind
                          ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                          : 'hover:border-muted-foreground/40 hover:bg-muted/30'
                      )}>
                      {ind}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Skills <span className="text-muted-foreground font-normal">(select up to 8)</span></label>
                <div className="flex flex-wrap gap-1.5">
                  {SKILLS.map((skill) => (
                    <button key={skill} type="button"
                      onClick={() => selectedSkills.size < 8 || selectedSkills.has(skill) ? toggleSkill(skill) : null}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all',
                        selectedSkills.has(skill)
                          ? 'bg-[hsl(var(--gigvora-teal))] text-white border-[hsl(var(--gigvora-teal))] shadow-sm'
                          : 'hover:border-muted-foreground/40 hover:bg-muted/30',
                        selectedSkills.size >= 8 && !selectedSkills.has(skill) && 'opacity-30 cursor-not-allowed'
                      )}>
                      {skill}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-1.5">{selectedSkills.size}/8 selected</p>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Years of Experience</label>
                <select value={experience} onChange={e => setExperience(e.target.value)}
                  className="w-full h-10 rounded-lg border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Select experience level</option>
                  <option value="0-1">Less than 1 year</option>
                  <option value="1-3">1–3 years</option>
                  <option value="3-5">3–5 years</option>
                  <option value="5-10">5–10 years</option>
                  <option value="10+">10+ years</option>
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-base font-bold mb-1">What are your goals?</h3>
                <p className="text-xs text-muted-foreground">Select all that apply. This customizes your dashboard and recommendations.</p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => toggleGoal(goal.id)}
                    className={cn(
                      'flex items-start gap-3 rounded-xl border p-4 text-left transition-all duration-200',
                      selectedGoals.has(goal.id)
                        ? 'border-accent bg-accent/5 ring-2 ring-accent/30 shadow-sm'
                        : 'hover:border-muted-foreground/30 hover:bg-muted/20'
                    )}
                  >
                    <goal.icon className={cn('h-5 w-5 shrink-0 mt-0.5', selectedGoals.has(goal.id) ? 'text-accent' : 'text-muted-foreground')} />
                    <div>
                      <div className="text-xs font-semibold">{goal.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">{goal.desc}</div>
                    </div>
                  </button>
                ))}
              </div>

              {selectedGoals.size > 0 && (
                <div className="rounded-lg bg-[hsl(var(--state-healthy)/0.06)] border border-[hsl(var(--state-healthy)/0.12)] p-3 flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-[hsl(var(--state-healthy))] shrink-0 mt-0.5" />
                  <span className="text-[11px] text-muted-foreground">
                    We'll personalize your dashboard, feed, and recommendations based on your {selectedGoals.size} selected goal{selectedGoals.size > 1 ? 's' : ''}.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Preferences */}
          {step === 3 && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-right-4 duration-300">
              <div>
                <h3 className="text-base font-bold mb-1">Preferences</h3>
                <p className="text-xs text-muted-foreground">Fine-tune your Gigvora experience.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Weekly Availability</label>
                  <select value={weeklyHours} onChange={e => setWeeklyHours(e.target.value)}
                    className="w-full h-10 rounded-lg border bg-background px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Select...</option>
                    <option value="<10">{'< 10 hours'}</option>
                    <option value="10-20">10–20 hours</option>
                    <option value="20-30">20–30 hours</option>
                    <option value="30-40">30–40 hours</option>
                    <option value="40+">Full-time (40+)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Hourly Rate (USD)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <input type="number" value={hourlyRate} onChange={e => setHourlyRate(e.target.value)}
                      className="w-full h-10 rounded-lg border bg-background pl-8 pr-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="0" min="0" />
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-2 block">Languages</label>
                <div className="flex flex-wrap gap-1.5">
                  {LANGUAGES.map((lang) => (
                    <button key={lang} type="button" onClick={() => toggleLang(lang)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all',
                        languages.has(lang)
                          ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                          : 'hover:border-muted-foreground/40 hover:bg-muted/30'
                      )}>
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notification toggles */}
              <div className="space-y-2">
                {[
                  { label: 'Email notifications', desc: 'Updates about opportunities, messages, and activity', value: notifications, set: setNotifications, icon: Bell, offIcon: BellOff },
                  { label: 'Newsletter', desc: 'Weekly digest of trending work and platform updates', value: newsletter, set: setNewsletter, icon: Bell, offIcon: BellOff },
                ].map(toggle => (
                  <div key={toggle.label} className="flex items-center justify-between rounded-lg border px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-3">
                      {toggle.value ? <toggle.icon className="h-4 w-4 text-accent shrink-0" /> : <toggle.offIcon className="h-4 w-4 text-muted-foreground shrink-0" />}
                      <div>
                        <div className="text-xs font-medium">{toggle.label}</div>
                        <div className="text-[10px] text-muted-foreground">{toggle.desc}</div>
                      </div>
                    </div>
                    <button type="button" onClick={() => toggle.set(!toggle.value)}
                      className={cn(
                        'h-6 w-10 rounded-full transition-colors relative shrink-0',
                        toggle.value ? 'bg-accent' : 'bg-muted'
                      )}>
                      <div className={cn('h-4 w-4 rounded-full bg-white shadow-sm absolute top-1 transition-transform', toggle.value ? 'translate-x-5' : 'translate-x-1')} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Profile summary */}
              <div className="rounded-lg bg-muted/30 border p-4">
                <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2.5">Profile Summary</div>
                <div className="space-y-1.5 text-xs">
                  {headline && <div><span className="text-muted-foreground">Headline:</span> {headline}</div>}
                  {location && <div><span className="text-muted-foreground">Location:</span> {location}</div>}
                  {selectedIndustry && <div><span className="text-muted-foreground">Industry:</span> {selectedIndustry}</div>}
                  {selectedSkills.size > 0 && <div><span className="text-muted-foreground">Skills:</span> {[...selectedSkills].join(', ')}</div>}
                  {selectedGoals.size > 0 && <div><span className="text-muted-foreground">Goals:</span> {selectedGoals.size} selected</div>}
                  {experience && <div><span className="text-muted-foreground">Experience:</span> {experience} years</div>}
                  {weeklyHours && <div><span className="text-muted-foreground">Availability:</span> {weeklyHours} hours/week</div>}
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t">
            {step > 0 ? (
              <Button variant="ghost" size="sm" className="text-xs h-9 gap-1.5" onClick={() => setStep(step - 1)}>
                <ArrowLeft className="h-3.5 w-3.5" /> Back
              </Button>
            ) : (
              <Button variant="ghost" size="sm" className="text-xs h-9 text-muted-foreground" onClick={() => navigate('/dashboard')}>
                Skip for now
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button size="sm" className="text-xs h-9 gap-1.5 font-semibold" onClick={() => setStep(step + 1)}>
                Continue <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <Button size="sm" className="text-xs h-9 gap-1.5 font-semibold" onClick={handleFinish} disabled={saving}>
                {saving ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</> : <>Finish Setup <CheckCircle2 className="h-3.5 w-3.5" /></>}
              </Button>
            )}
          </div>
        </div>
      </div>
    </AuthShell>
  );
};

export default OnboardingPage;
