import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  FileText, PenTool, Film, Mic, Mail, Megaphone, Radio, Rocket, Globe,
  Package, Search, Filter, Clock, Edit, Trash2, MoreHorizontal, Eye,
  Calendar, ChevronRight, CheckCircle2, AlertTriangle, Layers, Tv,
  ArrowRight, Play, Pause, Archive, Copy, Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type DraftStatus = 'draft' | 'in-review' | 'scheduled' | 'blocked' | 'archived';
type ContentType = 'post' | 'article' | 'podcast' | 'webinar' | 'reel' | 'video' | 'newsletter' | 'campaign';

interface DraftItem {
  id: string; title: string; type: ContentType; status: DraftStatus;
  updatedAt: string; wordCount?: number; progress: number;
  destination: string; version: number; issues: number;
  collaborators: string[];
}

const TYPE_ICONS: Record<ContentType, React.ElementType> = {
  post: FileText, article: PenTool, podcast: Mic, webinar: Tv,
  reel: Film, video: Film, newsletter: Mail, campaign: Megaphone,
};
const TYPE_COLORS: Record<ContentType, string> = {
  post: 'bg-accent/10 text-accent', article: 'bg-accent/10 text-accent',
  podcast: 'bg-[hsl(var(--gigvora-green))]/10 text-[hsl(var(--gigvora-green))]',
  webinar: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  reel: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  video: 'bg-accent/10 text-accent', newsletter: 'bg-muted text-muted-foreground',
  campaign: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};
const STATUS_STYLES: Record<DraftStatus, { cls: string; label: string }> = {
  draft: { cls: 'bg-muted text-muted-foreground', label: 'Draft' },
  'in-review': { cls: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]', label: 'In Review' },
  scheduled: { cls: 'bg-accent/10 text-accent', label: 'Scheduled' },
  blocked: { cls: 'bg-destructive/10 text-destructive', label: 'Blocked' },
  archived: { cls: 'bg-muted text-muted-foreground', label: 'Archived' },
};

const DRAFTS: DraftItem[] = [
  { id: 'd1', title: 'AI Tools for Developers Guide', type: 'article', status: 'draft', updatedAt: '2 hours ago', wordCount: 1240, progress: 65, destination: 'Feed', version: 3, issues: 0, collaborators: ['YO'] },
  { id: 'd2', title: 'Design Systems Deep Dive — Season 2', type: 'podcast', status: 'in-review', updatedAt: '4 hours ago', progress: 90, destination: 'Media', version: 2, issues: 1, collaborators: ['YO', 'SK'] },
  { id: 'd3', title: 'React Best Practices Short', type: 'reel', status: 'draft', updatedAt: '1 day ago', progress: 40, destination: 'Feed', version: 1, issues: 0, collaborators: ['YO'] },
  { id: 'd4', title: 'Q2 Brand Campaign: Future of Work', type: 'campaign', status: 'blocked', updatedAt: '2 days ago', progress: 80, destination: 'Ads', version: 4, issues: 3, collaborators: ['YO', 'ML', 'AR'] },
  { id: 'd5', title: 'Building Remote Teams Workshop', type: 'webinar', status: 'scheduled', updatedAt: '3 days ago', progress: 100, destination: 'Events', version: 1, issues: 0, collaborators: ['YO'] },
  { id: 'd6', title: 'Weekly Tech Newsletter #43', type: 'newsletter', status: 'draft', updatedAt: '5 hours ago', wordCount: 680, progress: 55, destination: 'Subscribers', version: 1, issues: 0, collaborators: ['YO'] },
  { id: 'd7', title: 'Freelance Income Strategies', type: 'video', status: 'draft', updatedAt: '1 week ago', progress: 20, destination: 'Media', version: 1, issues: 2, collaborators: ['YO'] },
  { id: 'd8', title: 'Portfolio Tips & Tricks', type: 'post', status: 'archived', updatedAt: '2 weeks ago', wordCount: 450, progress: 100, destination: 'Feed', version: 2, issues: 0, collaborators: ['YO'] },
];

export default function StudioDraftsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const navigate = useNavigate();

  const filtered = DRAFTS.filter(d => {
    if (statusFilter !== 'all' && d.status !== statusFilter) return false;
    if (typeFilter !== 'all' && d.type !== typeFilter) return false;
    if (search && !d.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <DashboardLayout topStrip={
      <>
        <Layers className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Drafts & Work in Progress</span>
        <div className="flex-1" />
        <div className="relative max-w-xs flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search drafts..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px]" />
        </div>
        <Link to="/creation-studio" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Studio Home <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    }>
      {/* KPI Strip */}
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Total Drafts" value={String(DRAFTS.filter(d => d.status === 'draft').length)} />
        <KPICard label="In Review" value={String(DRAFTS.filter(d => d.status === 'in-review').length)} />
        <KPICard label="Scheduled" value={String(DRAFTS.filter(d => d.status === 'scheduled').length)} />
        <KPICard label="Blocked" value={String(DRAFTS.filter(d => d.status === 'blocked').length)} />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="flex gap-1">
          {['all', 'draft', 'in-review', 'scheduled', 'blocked', 'archived'].map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-medium transition-all capitalize', statusFilter === s ? 'bg-accent text-accent-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
              {s === 'all' ? 'All Status' : s.replace('-', ' ')}
            </button>
          ))}
        </div>
        <div className="h-4 w-px bg-border mx-1" />
        <div className="flex gap-1">
          {['all', 'article', 'post', 'podcast', 'video', 'reel', 'webinar', 'newsletter', 'campaign'].map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-medium transition-all capitalize', typeFilter === t ? 'bg-accent text-accent-foreground' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>
              {t === 'all' ? 'All Types' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Draft List */}
      <div className="space-y-2">
        {filtered.map(d => {
          const Icon = TYPE_ICONS[d.type];
          const st = STATUS_STYLES[d.status];
          return (
            <div key={d.id} className="flex items-center gap-3 p-4 rounded-2xl border border-border/30 hover:border-accent/30 transition-all group bg-card">
              <div className={cn('h-11 w-11 rounded-xl flex items-center justify-center shrink-0', TYPE_COLORS[d.type])}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] font-bold group-hover:text-accent transition-colors truncate">{d.title}</span>
                  <Badge className={cn('text-[7px] h-4 border-0', st.cls)}>{st.label}</Badge>
                  {d.issues > 0 && <Badge className="text-[7px] h-4 bg-destructive/10 text-destructive border-0 gap-0.5"><AlertTriangle className="h-2 w-2" />{d.issues}</Badge>}
                  <Badge variant="outline" className="text-[7px] h-3.5">v{d.version}</Badge>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{d.updatedAt}</span>
                  {d.wordCount && <span>{d.wordCount} words</span>}
                  <span>→ {d.destination}</span>
                  <span className="capitalize">{d.type}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <Progress value={d.progress} className="h-1 flex-1 max-w-[160px]" />
                  <span className="text-[8px] text-muted-foreground">{d.progress}%</span>
                  <div className="flex -space-x-1.5 ml-2">
                    {d.collaborators.map(c => (
                      <Avatar key={c} className="h-4 w-4 ring-1 ring-background"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{c}</AvatarFallback></Avatar>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button variant="ghost" size="sm" className="h-7 text-[9px] gap-1 rounded-lg"><Edit className="h-3 w-3" />Edit</Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg"><Copy className="h-3 w-3" /></Button>
                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
