import React from 'react';
import { LaunchpadShell } from '@/components/launchpad/LaunchpadShell';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { FolderOpen, Plus, Eye, Share2, Edit, ExternalLink } from 'lucide-react';

const PORTFOLIO_ITEMS = [
  { title: 'E-commerce Dashboard Redesign', type: 'Case Study', status: 'Published', views: 124, tags: ['UX Design', 'Figma'] },
  { title: 'Market Research — Fintech Trends', type: 'Report', status: 'Draft', views: 0, tags: ['Research', 'Analysis'] },
  { title: 'React Todo App', type: 'Code Project', status: 'Published', views: 89, tags: ['React', 'TypeScript'] },
  { title: 'Social Media Campaign Results', type: 'Case Study', status: 'Published', views: 56, tags: ['Marketing', 'Analytics'] },
];

export default function PortfolioBuilderPage() {
  return (
    <LaunchpadShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-lg font-bold">Portfolio Builder</h1>
          <p className="text-[11px] text-muted-foreground">Build and showcase your experience portfolio</p>
        </div>
        <div className="flex gap-1.5">
          <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Add Project</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><ExternalLink className="h-3 w-3" />View Public</Button>
        </div>
      </div>
      <KPIBand className="mb-3">
        <KPICard label="Projects" value={String(PORTFOLIO_ITEMS.length)} className="!rounded-2xl" />
        <KPICard label="Published" value={String(PORTFOLIO_ITEMS.filter(p => p.status === 'Published').length)} className="!rounded-2xl" />
        <KPICard label="Total Views" value={String(PORTFOLIO_ITEMS.reduce((s, p) => s + p.views, 0))} className="!rounded-2xl" />
        <KPICard label="Completeness" value="72%" className="!rounded-2xl" />
      </KPIBand>

      <SectionCard title="Portfolio Completeness" className="!rounded-2xl mb-3">
        <div className="flex items-center gap-2 mb-2">
          <Progress value={72} className="h-2 rounded-full flex-1" />
          <span className="text-[10px] font-bold">72%</span>
        </div>
        <div className="flex flex-wrap gap-1.5 text-[8px]">
          {[{ label: 'Bio', done: true }, { label: 'Photo', done: true }, { label: '3+ projects', done: true }, { label: 'Skills list', done: true }, { label: 'Testimonial', done: false }, { label: 'Resume upload', done: false }].map(c => (
            <Badge key={c.label} variant="outline" className={`text-[7px] rounded-md ${c.done ? 'bg-[hsl(var(--state-healthy))]/5 border-[hsl(var(--state-healthy))]/30' : ''}`}>{c.done ? '✓ ' : ''}{c.label}</Badge>
          ))}
        </div>
      </SectionCard>

      <div className="space-y-2.5">
        {PORTFOLIO_ITEMS.map((p, i) => (
          <SectionCard key={i} className="!rounded-2xl">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold">{p.title}</span>
                  <Badge variant="outline" className="text-[7px] rounded-md">{p.type}</Badge>
                  <Badge className={`text-[7px] border-0 rounded-lg ${p.status === 'Published' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground'}`}>{p.status}</Badge>
                </div>
                <div className="flex items-center gap-2 text-[8px] text-muted-foreground mb-1">
                  {p.views > 0 && <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{p.views} views</span>}
                </div>
                <div className="flex flex-wrap gap-1">{p.tags.map(t => <Badge key={t} variant="outline" className="text-[7px] h-3.5 rounded-md">{t}</Badge>)}</div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Edit className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Share2 className="h-3 w-3" /></Button>
              </div>
            </div>
          </SectionCard>
        ))}
      </div>
    </LaunchpadShell>
  );
}
