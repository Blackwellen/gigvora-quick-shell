import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import {
  Briefcase, MapPin, DollarSign, Clock, Users, Building2,
  CheckCircle2, ChevronRight, ArrowLeft, Eye, Save, Send,
  Plus, X, Globe, Zap, Star, Shield, FileText, Layers,
} from 'lucide-react';
import { toast } from 'sonner';

type Step = 'basics' | 'details' | 'requirements' | 'compensation' | 'review';

const STEPS: { key: Step; label: string; icon: React.ElementType }[] = [
  { key: 'basics', label: 'Basics', icon: Briefcase },
  { key: 'details', label: 'Details', icon: FileText },
  { key: 'requirements', label: 'Requirements', icon: Users },
  { key: 'compensation', label: 'Compensation', icon: DollarSign },
  { key: 'review', label: 'Review', icon: Eye },
];

const JobCreatePage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('basics');
  const [form, setForm] = useState({
    title: '', company: '', location: '', remote: 'hybrid' as 'remote' | 'hybrid' | 'onsite',
    type: 'full-time' as 'full-time' | 'part-time' | 'contract' | 'freelance',
    description: '', responsibilities: '', qualifications: '',
    skills: [] as string[], newSkill: '',
    salaryMin: '', salaryMax: '', currency: 'USD', equity: false,
    benefits: [] as string[],
  });

  const stepIdx = STEPS.findIndex(s => s.key === step);
  const canNext = stepIdx < STEPS.length - 1;
  const canPrev = stepIdx > 0;

  const addSkill = () => {
    if (form.newSkill.trim() && !form.skills.includes(form.newSkill.trim())) {
      setForm(prev => ({ ...prev, skills: [...prev.skills, prev.newSkill.trim()], newSkill: '' }));
    }
  };

  const removeSkill = (s: string) => setForm(prev => ({ ...prev, skills: prev.skills.filter(sk => sk !== s) }));

  const handlePublish = () => {
    toast.success('Job posted successfully!');
    navigate('/jobs');
  };

  const handleSaveDraft = () => {
    toast.info('Draft saved');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[900px] mx-auto px-4 lg:px-8 py-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Link to="/jobs"><Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl"><ArrowLeft className="h-4 w-4" /></Button></Link>
          <div className="flex-1">
            <h1 className="text-lg font-bold">Post a Job</h1>
            <p className="text-[9px] text-muted-foreground">Create a job listing to attract top talent</p>
          </div>
          <Button variant="outline" size="sm" className="gap-1 text-xs rounded-xl" onClick={handleSaveDraft}><Save className="h-3 w-3" />Save Draft</Button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 mb-6 overflow-x-auto pb-1">
          {STEPS.map((s, i) => (
            <React.Fragment key={s.key}>
              <button
                onClick={() => setStep(s.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-medium whitespace-nowrap transition-colors',
                  step === s.key ? 'bg-accent text-accent-foreground' : i < stepIdx ? 'bg-accent/10 text-accent' : 'bg-muted text-muted-foreground'
                )}
              >
                {i < stepIdx ? <CheckCircle2 className="h-3 w-3" /> : <s.icon className="h-3 w-3" />}
                {s.label}
              </button>
              {i < STEPS.length - 1 && <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {/* Form */}
        <div className="rounded-2xl border bg-card p-5">
          {step === 'basics' && (
            <div className="space-y-4">
              <div><label className="text-[9px] font-semibold block mb-1">Job Title *</label>
                <Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior React Developer" className="rounded-xl" /></div>
              <div><label className="text-[9px] font-semibold block mb-1">Company</label>
                <Input value={form.company} onChange={e => setForm(p => ({ ...p, company: e.target.value }))} placeholder="Company name" className="rounded-xl" /></div>
              <div><label className="text-[9px] font-semibold block mb-1">Location</label>
                <Input value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))} placeholder="e.g. San Francisco, CA" className="rounded-xl" /></div>
              <div>
                <label className="text-[9px] font-semibold block mb-1">Work Type</label>
                <div className="flex gap-1.5">
                  {(['remote', 'hybrid', 'onsite'] as const).map(t => (
                    <button key={t} onClick={() => setForm(p => ({ ...p, remote: t }))} className={cn('px-3 py-1.5 rounded-xl text-[9px] font-medium border transition-colors capitalize', form.remote === t ? 'bg-accent text-accent-foreground border-accent' : 'bg-card hover:bg-muted')}>
                      {t === 'remote' && <Globe className="h-3 w-3 inline mr-1" />}{t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold block mb-1">Employment Type</label>
                <div className="flex gap-1.5 flex-wrap">
                  {(['full-time', 'part-time', 'contract', 'freelance'] as const).map(t => (
                    <button key={t} onClick={() => setForm(p => ({ ...p, type: t }))} className={cn('px-3 py-1.5 rounded-xl text-[9px] font-medium border transition-colors capitalize', form.type === t ? 'bg-accent text-accent-foreground border-accent' : 'bg-card hover:bg-muted')}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 'details' && (
            <div className="space-y-4">
              <div><label className="text-[9px] font-semibold block mb-1">Job Description *</label>
                <Textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe the role, team, and what the candidate will do..." rows={6} className="rounded-xl" /></div>
              <div><label className="text-[9px] font-semibold block mb-1">Key Responsibilities</label>
                <Textarea value={form.responsibilities} onChange={e => setForm(p => ({ ...p, responsibilities: e.target.value }))} placeholder="List the main responsibilities..." rows={4} className="rounded-xl" /></div>
            </div>
          )}

          {step === 'requirements' && (
            <div className="space-y-4">
              <div><label className="text-[9px] font-semibold block mb-1">Qualifications</label>
                <Textarea value={form.qualifications} onChange={e => setForm(p => ({ ...p, qualifications: e.target.value }))} placeholder="Required qualifications, experience, education..." rows={4} className="rounded-xl" /></div>
              <div>
                <label className="text-[9px] font-semibold block mb-1">Skills</label>
                <div className="flex gap-1.5 mb-2 flex-wrap">
                  {form.skills.map(s => (
                    <Badge key={s} variant="secondary" className="text-[8px] gap-0.5 rounded-lg">{s}<button onClick={() => removeSkill(s)}><X className="h-2 w-2" /></button></Badge>
                  ))}
                </div>
                <div className="flex gap-1.5">
                  <Input value={form.newSkill} onChange={e => setForm(p => ({ ...p, newSkill: e.target.value }))} placeholder="Add a skill" className="rounded-xl flex-1" onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())} />
                  <Button variant="outline" size="sm" className="rounded-xl" onClick={addSkill}><Plus className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          )}

          {step === 'compensation' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[9px] font-semibold block mb-1">Min Salary</label>
                  <Input value={form.salaryMin} onChange={e => setForm(p => ({ ...p, salaryMin: e.target.value }))} placeholder="80,000" className="rounded-xl" /></div>
                <div><label className="text-[9px] font-semibold block mb-1">Max Salary</label>
                  <Input value={form.salaryMax} onChange={e => setForm(p => ({ ...p, salaryMax: e.target.value }))} placeholder="120,000" className="rounded-xl" /></div>
              </div>
              <div className="rounded-xl border p-3 text-[9px]">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.equity} onChange={e => setForm(p => ({ ...p, equity: e.target.checked }))} className="rounded" />
                  <span className="font-medium">Includes equity / stock options</span>
                </label>
              </div>
            </div>
          )}

          {step === 'review' && (
            <div className="space-y-3">
              <div className="text-sm font-semibold mb-2">Review Before Publishing</div>
              {[
                { label: 'Title', value: form.title || '—' },
                { label: 'Company', value: form.company || '—' },
                { label: 'Location', value: `${form.location || '—'} · ${form.remote}` },
                { label: 'Type', value: form.type },
                { label: 'Salary', value: form.salaryMin && form.salaryMax ? `$${form.salaryMin} – $${form.salaryMax}` : '—' },
                { label: 'Skills', value: form.skills.length ? form.skills.join(', ') : '—' },
              ].map(r => (
                <div key={r.label} className="flex justify-between text-[9px] py-1.5 border-b last:border-0">
                  <span className="text-muted-foreground">{r.label}</span><span className="font-medium text-right">{r.value}</span>
                </div>
              ))}
              {form.description && <div className="rounded-xl border p-3 text-[8px] text-muted-foreground">{form.description.slice(0, 200)}{form.description.length > 200 && '...'}</div>}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mt-4">
          <Button variant="ghost" size="sm" className="rounded-xl text-xs gap-1" disabled={!canPrev} onClick={() => setStep(STEPS[stepIdx - 1].key)}>
            <ArrowLeft className="h-3 w-3" />Previous
          </Button>
          <div className="flex items-center gap-2">
            {step === 'review' ? (
              <>
                <Button variant="outline" size="sm" className="rounded-xl text-xs gap-1" onClick={() => toast.info('Preview opened')}><Eye className="h-3 w-3" />Preview</Button>
                <Button size="sm" className="rounded-xl text-xs gap-1" onClick={handlePublish}><Send className="h-3 w-3" />Publish Job</Button>
              </>
            ) : (
              <Button size="sm" className="rounded-xl text-xs gap-1" onClick={() => canNext && setStep(STEPS[stepIdx + 1].key)}>
                Next<ChevronRight className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobCreatePage;
