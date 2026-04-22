import React, { useState } from 'react';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import {
  BookOpen, Search, Copy, Star, Heart, Plus, PenLine, Mail,
  FileText, BarChart3, UserSearch, Briefcase, Bot, Image,
  Video, Headphones, ClipboardList, Zap, Play, Eye,
  Sparkles, Users, Crown, Globe, Lock, ChevronRight,
  MoreHorizontal, Clock, TrendingUp, Bookmark, Edit, Trash2
} from 'lucide-react';

interface Prompt {
  id: string; title: string; category: string; tool: string;
  icon: React.ElementType; uses: number; rating: number;
  author: string; authorType: 'system' | 'user' | 'team';
  favorited: boolean; description: string; tags: string[];
  lastUsed: string; versions: number;
}

const PROMPTS: Prompt[] = [
  { id: 'p1', title: 'Professional cold outreach email', category: 'Sales', tool: 'Outreach', icon: Mail, uses: 340, rating: 4.8, author: 'Gigvora', authorType: 'system', favorited: true, description: 'Generate a compelling cold email for B2B outreach with personalization variables', tags: ['email', 'B2B', 'cold-outreach'], lastUsed: '2h ago', versions: 3 },
  { id: 'p2', title: 'Technical blog post structure', category: 'Writing', tool: 'AI Writer', icon: PenLine, uses: 280, rating: 4.7, author: 'You', authorType: 'user', favorited: false, description: 'Create an SEO-optimized technical blog post with intro, sections, code examples, and CTA', tags: ['blog', 'SEO', 'technical'], lastUsed: '5h ago', versions: 2 },
  { id: 'p3', title: 'Candidate evaluation summary', category: 'Recruiting', tool: 'Recruiter AI', icon: UserSearch, uses: 210, rating: 4.6, author: 'HR Team', authorType: 'team', favorited: false, description: 'Summarize candidate profiles with strengths, concerns, and hiring recommendation', tags: ['recruiting', 'evaluation'], lastUsed: '1d ago', versions: 1 },
  { id: 'p4', title: 'Quarterly business review', category: 'Analytics', tool: 'Analytics AI', icon: BarChart3, uses: 180, rating: 4.5, author: 'Gigvora', authorType: 'system', favorited: true, description: 'Generate a QBR report with KPI analysis, trends, and next-quarter recommendations', tags: ['QBR', 'analytics', 'reporting'], lastUsed: '3d ago', versions: 4 },
  { id: 'p5', title: 'Project scope document', category: 'Project', tool: 'Brief Helper', icon: ClipboardList, uses: 155, rating: 4.4, author: 'You', authorType: 'user', favorited: false, description: 'Build a detailed project scope with milestones, deliverables, and acceptance criteria', tags: ['scope', 'project', 'planning'], lastUsed: '1w ago', versions: 1 },
  { id: 'p6', title: 'Job description template', category: 'Recruiting', tool: 'JD Helper', icon: Briefcase, uses: 320, rating: 4.9, author: 'Gigvora', authorType: 'system', favorited: true, description: 'Generate an inclusive job description with requirements, benefits, and screener questions', tags: ['JD', 'inclusive', 'hiring'], lastUsed: '2d ago', versions: 5 },
  { id: 'p7', title: 'Product image — hero banner', category: 'Creative', tool: 'Image Studio', icon: Image, uses: 190, rating: 4.3, author: 'Design Team', authorType: 'team', favorited: false, description: 'Generate a clean SaaS hero banner with gradient background and product mockup', tags: ['hero', 'SaaS', 'banner'], lastUsed: '4d ago', versions: 2 },
  { id: 'p8', title: 'Support ticket classifier', category: 'Support', tool: 'Support AI', icon: Headphones, uses: 120, rating: 4.5, author: 'Gigvora', authorType: 'system', favorited: false, description: 'Classify incoming support tickets by urgency, category, and suggested response template', tags: ['support', 'classification'], lastUsed: '5d ago', versions: 1 },
  { id: 'p9', title: 'Sales proposal — enterprise', category: 'Sales', tool: 'Proposal Helper', icon: FileText, uses: 95, rating: 4.2, author: 'You', authorType: 'user', favorited: false, description: 'Draft a persuasive enterprise proposal with ROI projections and case studies', tags: ['enterprise', 'proposal', 'sales'], lastUsed: '1w ago', versions: 2 },
  { id: 'p10', title: 'Code architecture reviewer', category: 'Development', tool: 'AI Chat', icon: Bot, uses: 250, rating: 4.7, author: 'Gigvora', authorType: 'system', favorited: true, description: 'Review code architecture decisions, suggest improvements, and identify potential issues', tags: ['code-review', 'architecture'], lastUsed: '6h ago', versions: 3 },
];

const CATEGORIES = ['All', 'Sales', 'Writing', 'Recruiting', 'Analytics', 'Project', 'Creative', 'Support', 'Development'];
const TABS: { value: string; label: string }[] = [
  { value: 'all', label: 'All Prompts' },
  { value: 'system', label: 'Templates' },
  { value: 'user', label: 'My Prompts' },
  { value: 'team', label: 'Team' },
  { value: 'favorites', label: 'Favorites' },
];

const AUTHOR_BADGE = {
  system: { icon: Crown, color: 'bg-accent/10 text-accent', label: 'Template' },
  user: { icon: Users, color: 'bg-blue-500/10 text-blue-500', label: 'Personal' },
  team: { icon: Globe, color: 'bg-violet-500/10 text-violet-500', label: 'Team' },
};

export default function AIPromptLibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [tab, setTab] = useState('all');
  const [favIds, setFavIds] = useState<Set<string>>(new Set(PROMPTS.filter(p => p.favorited).map(p => p.id)));
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const toggleFav = (id: string) => setFavIds(p => { const s = new Set(p); if (s.has(id)) s.delete(id); else s.add(id); return s; });

  const filtered = PROMPTS.filter(p => {
    if (search && !p.title.toLowerCase().includes(search.toLowerCase()) && !p.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))) return false;
    if (category !== 'All' && p.category !== category) return false;
    if (tab === 'favorites') return favIds.has(p.id);
    if (tab !== 'all' && p.authorType !== tab) return false;
    return true;
  });

  const selected = PROMPTS.find(p => p.id === selectedId);

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="h-4 w-4 text-accent" />
          <span className="text-sm font-bold">Prompt Library</span>
          <Badge variant="outline" className="text-[8px] rounded-lg">{PROMPTS.length} prompts</Badge>
          <div className="flex-1" />
          <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Prompt</Button>
        </div>

        {/* Search & tabs */}
        <div className="flex items-center gap-2 mb-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Search prompts, tags..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px] rounded-xl" />
          </div>
        </div>
        <Tabs value={tab} onValueChange={setTab} className="mb-2.5">
          <TabsList className="h-7">
            {TABS.map(t => <TabsTrigger key={t.value} value={t.value} className="text-[9px] h-5 px-2">{t.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>

        {/* Category chips */}
        <div className="flex items-center gap-1 mb-3 overflow-x-auto pb-1">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCategory(c)} className={cn('px-2.5 py-1 rounded-xl text-[9px] font-medium shrink-0 transition-all', category === c ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted')}>{c}</button>
          ))}
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filtered.map(p => {
              const AB = AUTHOR_BADGE[p.authorType];
              return (
                <button key={p.id} onClick={() => setSelectedId(p.id)} className={cn(
                  'text-left rounded-2xl border bg-card p-3.5 transition-all group',
                  selectedId === p.id ? 'border-accent bg-accent/5 shadow-sm' : 'hover:shadow-sm hover:bg-muted/20'
                )}>
                  <div className="flex items-start gap-3">
                    <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', selectedId === p.id ? 'bg-accent/10' : 'bg-muted/50')}>
                      <p.icon className={cn('h-4 w-4', selectedId === p.id ? 'text-accent' : 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-bold group-hover:text-accent transition-colors truncate">{p.title}</div>
                      <div className="text-[9px] text-muted-foreground mt-0.5 line-clamp-1">{p.description}</div>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge className={cn('text-[7px] border-0 rounded-lg gap-0.5', AB.color)}><AB.icon className="h-2 w-2" />{AB.label}</Badge>
                        <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><TrendingUp className="h-2 w-2" />{p.uses} uses</span>
                        <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Star className="h-2 w-2 text-[hsl(var(--gigvora-amber))]" />{p.rating}</span>
                        {p.versions > 1 && <span className="text-[8px] text-muted-foreground">v{p.versions}</span>}
                      </div>
                      <div className="flex gap-1 mt-1.5">
                        {p.tags.map(t => <Badge key={t} variant="outline" className="text-[7px] rounded-md h-4">{t}</Badge>)}
                      </div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); toggleFav(p.id); }} className="shrink-0">
                      <Heart className={cn('h-3.5 w-3.5 transition-colors', favIds.has(p.id) ? 'text-red-400 fill-red-400' : 'text-muted-foreground/30 hover:text-red-400')} />
                    </button>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      <div className="w-[280px] shrink-0 rounded-2xl border bg-card overflow-hidden flex flex-col hidden lg:flex">
        {selected ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <selected.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold">{selected.title}</div>
                  <div className="text-[9px] text-muted-foreground">{selected.tool} · {selected.category}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Badge className={cn('text-[7px] border-0 rounded-lg', AUTHOR_BADGE[selected.authorType].color)}>{selected.author}</Badge>
                <Badge variant="outline" className="text-[7px] rounded-lg gap-0.5"><Star className="h-2 w-2" />{selected.rating}</Badge>
                <Badge variant="outline" className="text-[7px] rounded-lg">{selected.uses} uses</Badge>
                <Badge variant="outline" className="text-[7px] rounded-lg">v{selected.versions}</Badge>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Description</div>
                <div className="text-[10px] leading-relaxed">{selected.description}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Tags</div>
                <div className="flex flex-wrap gap-1">{selected.tags.map(t => <Badge key={t} variant="secondary" className="text-[8px] rounded-lg">{t}</Badge>)}</div>
              </div>
              <div>
                <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Last Used</div>
                <div className="text-[10px] flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{selected.lastUsed}</div>
              </div>
            </div>
            <div className="p-3 border-t space-y-1.5">
              <Button size="sm" className="w-full h-8 text-[10px] rounded-xl gap-1"><Play className="h-3.5 w-3.5" />Run in {selected.tool}</Button>
              <div className="grid grid-cols-3 gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><Copy className="h-2.5 w-2.5" />Copy</Button>
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><Edit className="h-2.5 w-2.5" />Edit</Button>
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><Bookmark className="h-2.5 w-2.5" />Save</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <Sparkles className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <div className="text-xs font-semibold text-muted-foreground">Select a prompt</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Click to preview and run</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
