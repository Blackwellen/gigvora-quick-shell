import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Briefcase, Sparkles, Copy, Bookmark, Download, CheckCircle, Zap,
  Users, MapPin, Clock, GraduationCap, Shield, Heart, ArrowRight, RefreshCw
} from 'lucide-react';

const SECTIONS = ['About the Role', 'Key Responsibilities', 'Requirements', 'Nice to Have', 'Benefits & Perks', 'About the Company', 'Screener Questions'];

export default function AIJDHelperPage() {
  const [generated, setGenerated] = useState(false);

  return (
    <div className="flex gap-4">
      <div className="flex-1 min-w-0 space-y-4">
        <SectionCard title="Job Details" icon={<Briefcase className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: 'Job Title', placeholder: 'Senior React Developer', icon: Briefcase },
                { label: 'Department', placeholder: 'Engineering', icon: Users },
                { label: 'Location', placeholder: 'Remote / San Francisco', icon: MapPin },
                { label: 'Experience Level', placeholder: '5+ years', icon: Clock },
                { label: 'Employment Type', placeholder: 'Full-time', icon: GraduationCap },
                { label: 'Salary Range (optional)', placeholder: '$120k-$160k', icon: Shield },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-[9px] font-medium mb-1 flex items-center gap-1"><f.icon className="h-2.5 w-2.5 text-muted-foreground" />{f.label}</label>
                  <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder={f.placeholder} />
                </div>
              ))}
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Key Skills & Requirements</label>
              <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2.5 text-[11px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="List key skills, qualifications, and requirements..." />
            </div>
            <div>
              <label className="text-[9px] font-medium mb-1 block">Company Description (optional)</label>
              <textarea className="w-full h-14 rounded-xl border bg-background px-3 py-2 text-[10px] resize-none focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Brief company overview for the About section..." />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button onClick={() => setGenerated(true)} className="h-9 text-[11px] rounded-xl gap-1.5 px-5"><Sparkles className="h-3.5 w-3.5" />Generate JD</Button>
              <div className="flex gap-1">
                {['Inclusive', 'Technical', 'Concise', 'Engaging'].map(t => (
                  <Badge key={t} variant="outline" className="text-[8px] cursor-pointer hover:bg-accent/10 rounded-lg">{t}</Badge>
                ))}
              </div>
              <div className="flex-1" />
              <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Zap className="h-3 w-3" />~5 credits</span>
            </div>
          </div>
        </SectionCard>

        {generated && (
          <SectionCard
            title="Generated Job Description"
            action={
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Copy className="h-2.5 w-2.5" />Copy</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Bookmark className="h-2.5 w-2.5" />Save</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Download className="h-2.5 w-2.5" />Export</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><RefreshCw className="h-2.5 w-2.5" />Compare</Button>
              </div>
            }
            className="!rounded-2xl"
          >
            <div className="space-y-3.5 text-[11px] leading-relaxed">
              <h2 className="text-[16px] font-bold">Senior React Developer</h2>
              <div className="flex flex-wrap gap-2 text-[9px]">
                <Badge variant="outline" className="rounded-lg gap-1"><MapPin className="h-2.5 w-2.5" />Remote / SF</Badge>
                <Badge variant="outline" className="rounded-lg gap-1"><Clock className="h-2.5 w-2.5" />Full-time</Badge>
                <Badge variant="outline" className="rounded-lg gap-1"><GraduationCap className="h-2.5 w-2.5" />5+ years</Badge>
              </div>
              {SECTIONS.map(section => (
                <div key={section}>
                  <h3 className="text-[12px] font-semibold mb-1 flex items-center gap-1.5">
                    <CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />{section}
                  </h3>
                  <p className="text-muted-foreground">
                    {section === 'Screener Questions' 
                      ? '1. Describe a complex React architecture decision you made recently.\n2. How do you approach performance optimization in large-scale SPAs?\n3. What testing strategies do you use for React components?'
                      : `Comprehensive, inclusive, and engaging content generated for the ${section.toLowerCase()} section of this job description, tailored to attract top React talent...`
                    }
                  </p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-4 pt-3 border-t flex-wrap">
              <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-lg gap-1">
                <Heart className="h-2.5 w-2.5" />Inclusive language: Passed
              </Badge>
              <span className="text-[8px] text-muted-foreground">420 words · 7 sections · 52 tokens</span>
              <div className="flex-1" />
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><ArrowRight className="h-2.5 w-2.5" />Send to Job Builder</Button>
            </div>
          </SectionCard>
        )}
      </div>

      <div className="hidden lg:flex flex-col w-[200px] shrink-0 space-y-3">
        <SectionCard title="Inclusion Score" className="!rounded-2xl">
          <div className="text-center py-2">
            <div className="text-2xl font-bold text-[hsl(var(--state-healthy))]">A+</div>
            <div className="text-[8px] text-muted-foreground">Gender-neutral & inclusive</div>
          </div>
        </SectionCard>
        <SectionCard title="Similar JDs" className="!rounded-2xl">
          <div className="space-y-1.5">
            {['Frontend Lead', 'React Engineer', 'UI Developer', 'Web Architect'].map(j => (
              <button key={j} className="w-full text-left text-[9px] px-2 py-1.5 rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground">{j}</button>
            ))}
          </div>
        </SectionCard>
      </div>
    </div>
  );
}
