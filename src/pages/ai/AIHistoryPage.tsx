import React, { useState } from 'react';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  History, Search, Copy, Trash2, Star, Bookmark, Eye, Download,
  PenLine, Image, Bot, FileText, Video, Headphones, BarChart3,
  Mail, UserSearch, Briefcase, ClipboardList, Clock, Zap,
  RotateCcw, Share2, Archive, Pin, ChevronRight, Filter,
  ArrowRight, MoreHorizontal, Sparkles, Heart
} from 'lucide-react';

type OutputStatus = 'draft' | 'final' | 'archived';
type OutputType = 'all' | 'saved' | 'draft' | 'final' | 'favorites' | 'shared' | 'archived';

interface HistoryOutput {
  id: string; title: string; tool: string; icon: React.ElementType;
  created: string; tokens: number; saved: boolean; favorited: boolean;
  status: OutputStatus; shared: boolean; pinned: boolean;
  preview?: string; workspace?: string; credits: number;
}

const OUTPUTS: HistoryOutput[] = [
  { id: 'h1', title: 'Marketing email — Product launch Q3', tool: 'AI Writer', icon: PenLine, created: '2h ago', tokens: 120, saved: true, favorited: true, status: 'draft', shared: false, pinned: true, preview: 'Subject: Introducing our newest feature...', credits: 2, workspace: 'Marketing' },
  { id: 'h2', title: 'Hero image — SaaS landing page redesign', tool: 'Image Studio', icon: Image, created: '5h ago', tokens: 45, saved: true, favorited: false, status: 'final', shared: false, pinned: false, preview: 'Photorealistic, gradient background, modern UI', credits: 8, workspace: 'Design' },
  { id: 'h3', title: 'Architecture discussion — Microservices', tool: 'AI Chat', icon: Bot, created: 'Yesterday', tokens: 340, saved: false, favorited: false, status: 'draft', shared: false, pinned: false, preview: 'Discussed trade-offs of monolith vs microservices...', credits: 5 },
  { id: 'h4', title: 'Proposal — Dashboard redesign for Acme', tool: 'Proposal Helper', icon: FileText, created: 'Yesterday', tokens: 68, saved: true, favorited: true, status: 'final', shared: true, pinned: false, preview: 'Executive Summary: We propose a comprehensive...', credits: 3, workspace: 'Sales' },
  { id: 'h5', title: 'JD — Senior React Developer', tool: 'JD Helper', icon: Briefcase, created: '3d ago', tokens: 52, saved: false, favorited: false, status: 'final', shared: false, pinned: false, preview: 'We\'re looking for a Senior React Developer...', credits: 2 },
  { id: 'h6', title: 'Outreach — Series A follow-up', tool: 'Outreach', icon: Mail, created: '3d ago', tokens: 86, saved: true, favorited: false, status: 'final', shared: true, pinned: false, preview: 'Hi [Name], following up on our conversation...', credits: 1, workspace: 'Sales' },
  { id: 'h7', title: 'Promo reel — Product demo animation', tool: 'Video Studio', icon: Video, created: '4d ago', tokens: 0, saved: true, favorited: false, status: 'final', shared: false, pinned: false, preview: '10s cinematic product demo with kinetic typography', credits: 15 },
  { id: 'h8', title: 'Candidate eval — Backend Engineer', tool: 'Recruiter AI', icon: UserSearch, created: '5d ago', tokens: 44, saved: false, favorited: false, status: 'final', shared: true, pinned: false, preview: 'Sourcing summary for 3 shortlisted candidates...', credits: 3, workspace: 'HR' },
  { id: 'h9', title: 'Support thread — Billing issue #4521', tool: 'Support AI', icon: Headphones, created: '1w ago', tokens: 92, saved: false, favorited: false, status: 'final', shared: false, pinned: false, preview: 'Issue: Customer reports duplicate charge...', credits: 2 },
  { id: 'h10', title: 'Q1 KPI analysis summary', tool: 'Analytics AI', icon: BarChart3, created: '1w ago', tokens: 156, saved: true, favorited: true, status: 'final', shared: true, pinned: false, preview: 'Revenue grew 18% QoQ, driven primarily by...', credits: 4, workspace: 'Analytics' },
  { id: 'h11', title: 'Project brief — Mobile app MVP', tool: 'Brief Helper', icon: ClipboardList, created: '2w ago', tokens: 78, saved: true, favorited: false, status: 'archived', shared: false, pinned: false, preview: 'Scope: Build a cross-platform mobile app...', credits: 2 },
  { id: 'h12', title: 'Brand manifesto draft', tool: 'AI Writer', icon: PenLine, created: '2w ago', tokens: 210, saved: false, favorited: false, status: 'archived', shared: false, pinned: false, preview: 'We believe in building technology that...', credits: 3 },
];

const TOOL_OPTIONS = ['All Tools', 'AI Chat', 'AI Writer', 'Image Studio', 'Video Studio', 'Proposal Helper', 'JD Helper', 'Brief Helper', 'Outreach', 'Recruiter AI', 'Support AI', 'Analytics AI'];

export default function AIHistoryPage() {
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<OutputType>('all');
  const [toolFilter, setToolFilter] = useState('All Tools');
  const [selectedId, setSelectedId] = useState<string | null>('h1');
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set(OUTPUTS.filter(o => o.pinned).map(o => o.id)));
  const [favIds, setFavIds] = useState<Set<string>>(new Set(OUTPUTS.filter(o => o.favorited).map(o => o.id)));

  const filtered = OUTPUTS.filter(o => {
    if (search && !o.title.toLowerCase().includes(search.toLowerCase()) && !o.tool.toLowerCase().includes(search.toLowerCase())) return false;
    if (toolFilter !== 'All Tools' && o.tool !== toolFilter) return false;
    switch (tab) {
      case 'saved': return o.saved;
      case 'draft': return o.status === 'draft';
      case 'final': return o.status === 'final';
      case 'favorites': return favIds.has(o.id);
      case 'shared': return o.shared;
      case 'archived': return o.status === 'archived';
      default: return o.status !== 'archived';
    }
  }).sort((a, b) => (pinnedIds.has(b.id) ? 1 : 0) - (pinnedIds.has(a.id) ? 1 : 0));

  const selected = OUTPUTS.find(o => o.id === selectedId);

  const togglePin = (id: string) => setPinnedIds(p => { const s = new Set(p); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  const toggleFav = (id: string) => setFavIds(p => { const s = new Set(p); if (s.has(id)) s.delete(id); else s.add(id); return s; });

  return (
    <div className="flex gap-4 h-[calc(100vh-180px)]">
      {/* Main list */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Controls */}
        <div className="flex flex-col gap-2.5 mb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-accent shrink-0" />
            <span className="text-sm font-bold">History & Saved</span>
            <div className="flex-1" />
            <Select value={toolFilter} onValueChange={setToolFilter}>
              <SelectTrigger className="h-7 w-36 text-[9px] rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>{TOOL_OPTIONS.map(t => <SelectItem key={t} value={t} className="text-[10px]">{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="Search outputs..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 text-[10px] rounded-xl" />
            </div>
          </div>
          <Tabs value={tab} onValueChange={v => setTab(v as OutputType)}>
            <TabsList className="h-7 w-full justify-start">
              {(['all', 'saved', 'favorites', 'draft', 'final', 'shared', 'archived'] as const).map(t => (
                <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t}</TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* KPI strip */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          <div className="rounded-xl border bg-card p-2 text-center"><div className="text-lg font-bold">{OUTPUTS.length}</div><div className="text-[8px] text-muted-foreground">Total</div></div>
          <div className="rounded-xl border bg-card p-2 text-center"><div className="text-lg font-bold">{OUTPUTS.filter(o => o.saved).length}</div><div className="text-[8px] text-muted-foreground">Saved</div></div>
          <div className="rounded-xl border bg-card p-2 text-center"><div className="text-lg font-bold">{OUTPUTS.reduce((s, o) => s + o.credits, 0)}</div><div className="text-[8px] text-muted-foreground">Credits Used</div></div>
          <div className="rounded-xl border bg-card p-2 text-center"><div className="text-lg font-bold">{favIds.size}</div><div className="text-[8px] text-muted-foreground">Favorites</div></div>
        </div>

        {/* Output list */}
        <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
          {filtered.length === 0 && (
            <div className="rounded-2xl border-2 border-dashed p-8 text-center">
              <History className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <div className="text-xs font-semibold text-muted-foreground">No outputs found</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Try adjusting your filters or search</div>
            </div>
          )}
          {filtered.map(o => (
            <button key={o.id} onClick={() => setSelectedId(o.id)} className={cn(
              'w-full text-left rounded-2xl border bg-card p-3 transition-all group',
              selectedId === o.id ? 'border-accent bg-accent/5 shadow-sm' : 'hover:shadow-sm hover:bg-muted/20'
            )}>
              <div className="flex items-center gap-2.5">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', selectedId === o.id ? 'bg-accent/10' : 'bg-muted/50')}>
                  <o.icon className={cn('h-4 w-4', selectedId === o.id ? 'text-accent' : 'text-muted-foreground')} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {pinnedIds.has(o.id) && <Pin className="h-2.5 w-2.5 text-accent shrink-0" />}
                    <span className={cn('text-[10px] font-semibold truncate', selectedId === o.id && 'text-accent')}>{o.title}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 text-[8px] text-muted-foreground">
                    <span>{o.tool}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2 w-2" />{o.created}</span>
                    <span>·</span>
                    <span className="flex items-center gap-0.5"><Zap className="h-2 w-2" />{o.credits} cr</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {o.saved && <Bookmark className="h-3 w-3 text-accent" />}
                  {favIds.has(o.id) && <Heart className="h-3 w-3 text-red-400 fill-red-400" />}
                  {o.shared && <Share2 className="h-3 w-3 text-blue-400" />}
                  <Badge className={cn('text-[7px] border-0 rounded-lg capitalize',
                    o.status === 'final' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' :
                    o.status === 'archived' ? 'bg-muted text-muted-foreground' :
                    'bg-accent/10 text-accent'
                  )}>{o.status}</Badge>
                </div>
              </div>
              {o.preview && <div className="text-[9px] text-muted-foreground mt-1.5 line-clamp-1 pl-11">{o.preview}</div>}
            </button>
          ))}
        </div>
      </div>

      {/* Detail inspector */}
      <div className="w-[300px] shrink-0 rounded-2xl border bg-card overflow-hidden flex flex-col hidden lg:flex">
        {selected ? (
          <>
            <div className="p-4 border-b">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                  <selected.icon className="h-5 w-5 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate">{selected.title}</div>
                  <div className="text-[9px] text-muted-foreground">{selected.tool} · {selected.created}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge variant="outline" className="text-[7px] rounded-lg capitalize">{selected.status}</Badge>
                {selected.workspace && <Badge variant="outline" className="text-[7px] rounded-lg">{selected.workspace}</Badge>}
                <Badge variant="outline" className="text-[7px] rounded-lg gap-0.5"><Zap className="h-2 w-2" />{selected.credits} credits</Badge>
                {selected.tokens > 0 && <Badge variant="outline" className="text-[7px] rounded-lg">{selected.tokens} tokens</Badge>}
              </div>
            </div>

            {/* Preview */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="text-[9px] font-semibold mb-1.5 text-muted-foreground uppercase tracking-wider">Preview</div>
              <div className="rounded-xl bg-muted/30 p-3 text-[10px] leading-relaxed whitespace-pre-wrap">{selected.preview || 'No preview available'}</div>
            </div>

            {/* Actions */}
            <div className="p-3 border-t space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toggleFav(selected.id)}>
                  <Heart className={cn('h-3 w-3', favIds.has(selected.id) && 'fill-red-400 text-red-400')} />{favIds.has(selected.id) ? 'Unfavorite' : 'Favorite'}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => togglePin(selected.id)}>
                  <Pin className={cn('h-3 w-3', pinnedIds.has(selected.id) && 'text-accent')} />{pinnedIds.has(selected.id) ? 'Unpin' : 'Pin'}
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Copy className="h-3 w-3" />Copy</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Download className="h-3 w-3" />Export</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><RotateCcw className="h-3 w-3" />Reopen</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Share2 className="h-3 w-3" />Share</Button>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><Archive className="h-3 w-3" />Archive</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 text-destructive"><Trash2 className="h-3 w-3" />Delete</Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <Eye className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
              <div className="text-xs font-semibold text-muted-foreground">Select an output</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">Click any item to preview details</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
