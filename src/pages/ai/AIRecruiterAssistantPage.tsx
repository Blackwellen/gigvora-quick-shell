import React, { useState } from 'react';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  UserSearch, Sparkles, Copy, Bookmark, Star, MapPin, Briefcase,
  ChevronRight, Zap, Mail, Phone, Download, Users, Clock,
  Shield, Target, FileText, ArrowRight, Eye, MessageSquare
} from 'lucide-react';

const CANDIDATES = [
  { name: 'Sarah Kim', role: 'Senior React Developer', location: 'San Francisco', match: 94, skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'], experience: '7 years', availability: 'Available', avatar: 'SK' },
  { name: 'Marcus Johnson', role: 'Full Stack Engineer', location: 'Remote', match: 89, skills: ['React', 'Python', 'AWS', 'Docker'], experience: '5 years', availability: '2 weeks notice', avatar: 'MJ' },
  { name: 'Priya Patel', role: 'Frontend Architect', location: 'New York', match: 87, skills: ['React', 'Design Systems', 'GraphQL', 'Testing'], experience: '9 years', availability: 'Available', avatar: 'PP' },
  { name: 'Tom Wright', role: 'React Developer', location: 'Austin', match: 82, skills: ['React', 'JavaScript', 'Redux', 'CSS'], experience: '4 years', availability: '1 month notice', avatar: 'TW' },
  { name: 'Lisa Chen', role: 'UI Engineer', location: 'Seattle', match: 79, skills: ['React', 'Vue', 'Tailwind', 'Figma'], experience: '6 years', availability: 'Available', avatar: 'LC' },
];

const TABS = ['Candidates', 'Outreach', 'Screening', 'Interview', 'Scorecard'];

export default function AIRecruiterAssistantPage() {
  const [tab, setTab] = useState('Candidates');

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5 w-fit">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn('px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all', tab === t ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{t}</button>
        ))}
      </div>

      {/* Search criteria */}
      <SectionCard title="Search Criteria" icon={<UserSearch className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
          {[
            { label: 'Role', placeholder: 'Senior React Developer' },
            { label: 'Location', placeholder: 'Remote / US' },
            { label: 'Experience', placeholder: '5+ years' },
            { label: 'Skills', placeholder: 'React, TypeScript, Node.js' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[9px] font-medium mb-0.5 block">{f.label}</label>
              <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder={f.placeholder} />
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button className="h-9 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Find Candidates</Button>
          <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~8 credits</span>
        </div>
      </SectionCard>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {[
          { label: 'Matches', value: String(CANDIDATES.length) },
          { label: 'Avg Match', value: '86%' },
          { label: 'Shortlisted', value: '2' },
          { label: 'Contacted', value: '1' },
          { label: 'Interviews', value: '0' },
        ].map(k => (
          <div key={k.label} className="rounded-2xl border bg-card p-3 text-center">
            <div className="text-[8px] text-muted-foreground uppercase tracking-wider font-medium">{k.label}</div>
            <div className="text-lg font-bold">{k.value}</div>
          </div>
        ))}
      </div>

      {/* Candidate list */}
      {tab === 'Candidates' && (
        <div className="space-y-3">
          {CANDIDATES.map((c, i) => (
            <div key={i} className="rounded-2xl border bg-card p-4 hover:shadow-md transition-all duration-300">
              <div className="flex items-start gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center shrink-0 text-accent text-[12px] font-bold">{c.avatar}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-[13px] font-bold">{c.name}</span>
                    <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg">{c.match}% match</Badge>
                    <Badge className={cn('text-[7px] border-0 rounded-lg', c.availability === 'Available' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground')}>{c.availability}</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground flex items-center gap-3 mb-2">
                    <span className="flex items-center gap-0.5"><Briefcase className="h-3 w-3" />{c.role}</span>
                    <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.location}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{c.experience}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-2.5">
                    {c.skills.map(s => <Badge key={s} variant="outline" className="text-[8px] h-5 rounded-lg">{s}</Badge>)}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Star className="h-3 w-3" />Shortlist</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Mail className="h-3 w-3" />Outreach</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Eye className="h-3 w-3" />Full Profile</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><FileText className="h-3 w-3" />Screening Q's</Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'Screening' && (
        <SectionCard title="AI-Generated Screening Questions" icon={<Shield className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            {[
              'Describe a complex React architecture you designed. What trade-offs did you consider?',
              'How do you handle state management in large-scale SPAs? Give a specific example.',
              'Walk me through your approach to performance optimization in React applications.',
              'How do you ensure code quality and testing in your development workflow?',
              'Tell me about a time you had to refactor legacy code. What was your strategy?',
            ].map((q, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-border/20 last:border-0">
                <span className="text-[10px] font-bold text-accent shrink-0 mt-0.5">{i + 1}.</span>
                <p className="text-[11px] leading-relaxed">{q}</p>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg shrink-0"><Copy className="h-3 w-3" /></Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Copy className="h-3 w-3" />Copy All</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><ArrowRight className="h-3 w-3" />Send to Recruiter Pro</Button>
            </div>
          </div>
        </SectionCard>
      )}

      {tab === 'Interview' && (
        <SectionCard title="Interview Guide" icon={<MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3 text-[11px]">
            {['Technical Deep Dive (30 min)', 'System Design (30 min)', 'Behavioral & Culture (20 min)', 'Q&A & Close (10 min)'].map((section, i) => (
              <div key={i} className="rounded-xl border p-3">
                <h4 className="font-bold text-[11px] mb-1">{section}</h4>
                <p className="text-muted-foreground text-[10px]">Structured interview framework with specific questions, evaluation criteria, and scoring rubric...</p>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'Scorecard' && (
        <SectionCard title="Candidate Scorecard Template" className="!rounded-2xl">
          <div className="space-y-2">
            {['Technical Skills', 'Problem Solving', 'Communication', 'Culture Fit', 'Leadership Potential'].map(cat => (
              <div key={cat} className="flex items-center justify-between py-2 border-b border-border/20 last:border-0">
                <span className="text-[11px] font-medium">{cat}</span>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(n => (
                    <div key={n} className="h-7 w-7 rounded-lg border flex items-center justify-center text-[10px] cursor-pointer hover:bg-accent/10 transition-colors">{n}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
