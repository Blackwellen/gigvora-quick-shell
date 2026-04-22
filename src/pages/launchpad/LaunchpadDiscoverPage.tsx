import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Search, Compass, Briefcase, GraduationCap, Users, Calendar,
  Trophy, BookOpen, MapPin, Star, ChevronRight, Sparkles,
  Target, TrendingUp, Clock, Zap, Building2, Award,
} from 'lucide-react';

const CATEGORIES = [
  { label: 'All', icon: Compass, count: 86 },
  { label: 'Internships', icon: GraduationCap, count: 24 },
  { label: 'Apprenticeships', icon: BookOpen, count: 12 },
  { label: 'Entry Level Jobs', icon: Briefcase, count: 18 },
  { label: 'Projects', icon: Target, count: 15 },
  { label: 'Mentorship', icon: Users, count: 8 },
  { label: 'Challenges', icon: Trophy, count: 9 },
  { label: 'Events', icon: Calendar, count: 14 },
  { label: 'Pathways', icon: TrendingUp, count: 6 },
];

const FEATURED = [
  { id: 'f1', title: 'Graduate Product Pathway', type: 'Pathway', host: 'Gigvora Academy', hostAvatar: 'GA', match: 95, stages: 5, duration: '12 weeks', mentorship: true, paid: true, tags: ['Product', 'Strategy', 'UX'], audience: 'Graduates', featured: true },
  { id: 'f2', title: 'Junior Frontend Developer', type: 'Entry Level', host: 'TechCorp', hostAvatar: 'TC', match: 92, duration: 'Full-time', mentorship: true, paid: true, tags: ['React', 'CSS', 'JavaScript'], audience: 'All levels' },
  { id: 'f3', title: 'Design Portfolio Challenge', type: 'Challenge', host: 'DesignFlow', hostAvatar: 'DF', match: 88, duration: '2 weeks', mentorship: false, paid: false, tags: ['Figma', 'UI Design'], audience: 'Career changers', badge: 'Design Builder' },
];

const TRENDING = [
  { title: 'AI & Machine Learning Bootcamp', host: 'DataSphere', type: 'Bootcamp', applicants: 340 },
  { title: 'UX Research Shadowing', host: 'Figma', type: 'Shadowing', applicants: 56 },
  { title: 'Marketing Apprenticeship', host: 'GrowthLab', type: 'Apprenticeship', applicants: 89 },
  { title: 'Full-Stack Project: E-commerce', host: 'Gigvora', type: 'Project', applicants: 210 },
];

const FOR_YOU = [
  { label: 'Based on your skills', items: ['Junior React Dev', 'CSS Design Challenge', 'Frontend Mentorship'] },
  { label: 'Because you saved', items: ['UX Apprenticeship', 'Product Pathway'] },
  { label: 'Trending in your field', items: ['AI for Designers Workshop', 'Portfolio Review'] },
];

export default function LaunchpadDiscoverPage() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  return (
    <LaunchpadShell>
      {/* Hero Search */}
      <div className="rounded-3xl bg-gradient-to-br from-accent/10 via-[hsl(var(--gigvora-purple))]/5 to-background border border-accent/10 p-6 mb-4 text-center">
        <h1 className="text-xl font-bold mb-1">Discover Your Path</h1>
        <p className="text-[11px] text-muted-foreground mb-4 max-w-md mx-auto">Find opportunities, mentors, pathways, and challenges matched to your goals.</p>
        <div className="relative max-w-lg mx-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search opportunities, mentors, pathways..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 h-10 rounded-2xl text-sm" />
        </div>
      </div>

      {/* Category Chips */}
      <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORIES.map(c => (
          <button key={c.label} onClick={() => setActiveCategory(c.label)} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-medium shrink-0 transition-all', activeCategory === c.label ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
            <c.icon className="h-3 w-3" /> {c.label}
            <span className="text-[8px] opacity-70">({c.count})</span>
          </button>
        ))}
      </div>

      {/* Featured Opportunities */}
      <SectionCard title="Featured Opportunities" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl mb-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {FEATURED.map(f => (
            <div key={f.id} className="rounded-2xl border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group">
              <div className="flex items-center gap-2 mb-2">
                <Avatar className="h-8 w-8 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[7px]">{f.hostAvatar}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <span className="text-[8px] text-muted-foreground">{f.host}</span>
                  <Badge className="text-[6px] bg-accent/10 text-accent border-0 rounded-lg ml-1.5">{f.match}% match</Badge>
                </div>
              </div>
              <div className="text-[11px] font-bold group-hover:text-accent transition-colors mb-1">{f.title}</div>
              <div className="flex items-center gap-2 text-[8px] text-muted-foreground mb-2">
                <Badge variant="outline" className="text-[7px] rounded-md">{f.type}</Badge>
                <span>{f.duration}</span>
                {f.mentorship && <Badge className="text-[6px] bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))] border-0 rounded-lg">Mentored</Badge>}
                {f.paid && <Badge className="text-[6px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))] border-0 rounded-lg">Paid</Badge>}
              </div>
              <div className="flex gap-1 flex-wrap">{f.tags.map(t => <Badge key={t} variant="outline" className="text-[6px] h-3 rounded-md">{t}</Badge>)}</div>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="xl:col-span-2">
          {/* Trending */}
          <SectionCard title="Trending Now" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {TRENDING.map((t, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border border-border/30 hover:border-accent/30 transition-colors cursor-pointer">
                  <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center text-[11px] font-bold text-accent shrink-0">{i + 1}</div>
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-semibold">{t.title}</span>
                    <div className="text-[8px] text-muted-foreground">{t.host} · {t.type} · {t.applicants} applicants</div>
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div>
          {/* For You */}
          <SectionCard title="Personalized For You" icon={<Zap className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />} className="!rounded-2xl">
            <div className="space-y-3">
              {FOR_YOU.map((section, i) => (
                <div key={i}>
                  <div className="text-[8px] font-semibold text-muted-foreground mb-1">{section.label}</div>
                  <div className="space-y-1">
                    {section.items.map(item => (
                      <div key={item} className="text-[9px] py-1 px-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors flex items-center justify-between">
                        {item} <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/40" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </LaunchpadShell>
  );
}
