import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Search, Users, Briefcase, FileText, Gavel, CreditCard, Shield,
  ChevronRight, Eye, Clock, AlertTriangle, Filter, Hash, Globe,
  Mail, Phone, Building2, Activity, ExternalLink, Copy,
  ArrowRight, Star, Flag, Ban, Layers, BarChart3, X,
  CheckCircle2, XCircle, Lock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

type EntityType = 'user' | 'order' | 'dispute' | 'transaction' | 'ticket' | 'project' | 'gig';

interface SearchResult {
  id: string; type: EntityType; title: string; subtitle: string;
  status: string; risk: string; avatar: string; created: string;
  linkedIds: string[];
}

const RESULTS: SearchResult[] = [
  { id: 'USR-4821', type: 'user', title: 'Alex Rivera', subtitle: 'alex.rivera@email.com · Professional · Since Jan 2024', status: 'active', risk: 'low', avatar: 'AR', created: '6m ago', linkedIds: ['ORD-1102', 'DSP-0334'] },
  { id: 'USR-3390', type: 'user', title: 'Priya Sharma', subtitle: 'priya.s@company.com · Enterprise · Since Mar 2023', status: 'flagged', risk: 'medium', avatar: 'PS', created: '14m ago', linkedIds: ['TKT-5003'] },
  { id: 'ORD-1102', type: 'order', title: 'E-commerce Platform Redesign', subtitle: '$4,500.00 · Milestone 3 of 5 · In Progress', status: 'active', risk: 'none', avatar: 'OR', created: '2w ago', linkedIds: ['USR-4821', 'PRJ-2201'] },
  { id: 'DSP-0334', type: 'dispute', title: 'Escrow hold — milestone rejected', subtitle: '$1,250.00 · Mediation pending · High priority', status: 'open', risk: 'high', avatar: 'DS', created: '2h ago', linkedIds: ['USR-4821', 'ORD-1102'] },
  { id: 'TXN-9901', type: 'transaction', title: 'Payout #9901 — Carlos Diaz', subtitle: '$1,250.00 · Held · Trust flag on account', status: 'held', risk: 'critical', avatar: 'TX', created: '2h ago', linkedIds: ['USR-2210', 'MOD-1092'] },
  { id: 'TKT-5003', type: 'ticket', title: 'Cannot withdraw funds — account flagged', subtitle: 'Support · Assigned to Agent Kim · SLA: 1h 30m', status: 'in-progress', risk: 'medium', avatar: 'TK', created: '2h ago', linkedIds: ['USR-4821'] },
  { id: 'GIG-7820', type: 'gig', title: 'Full-Stack React Development', subtitle: '$120/hr · 4.9★ · 23 completions', status: 'active', risk: 'none', avatar: 'GG', created: '3m ago', linkedIds: ['USR-4821'] },
  { id: 'PRJ-2201', type: 'project', title: 'Mobile App for HealthTrack', subtitle: '$12,000 budget · 60% complete · 3 milestones delivered', status: 'active', risk: 'low', avatar: 'PJ', created: '1m ago', linkedIds: ['ORD-1102'] },
];

const RECENT_SEARCHES = ['USR-4821', 'payout failed', 'escrow dispute', 'trust flag', 'chargeback'];

const typeColor: Record<EntityType, string> = {
  user: 'bg-accent/10 text-accent',
  order: 'bg-primary/10 text-primary',
  dispute: 'bg-destructive/10 text-destructive',
  transaction: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  ticket: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  project: 'bg-primary/10 text-primary',
  gig: 'bg-accent/10 text-accent',
};

const typeIcon: Record<EntityType, React.ElementType> = {
  user: Users, order: Briefcase, dispute: Gavel, transaction: CreditCard,
  ticket: FileText, project: Layers, gig: Star,
};

const riskColor = (r: string) =>
  r === 'critical' ? 'bg-destructive/10 text-destructive border-destructive/30' :
  r === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-[hsl(var(--gigvora-amber))]/30' :
  r === 'medium' ? 'bg-accent/10 text-accent border-accent/30' :
  r === 'low' ? 'bg-muted text-muted-foreground border-muted' : '';

const statusBadge = (s: string) =>
  s === 'active' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' :
  s === 'flagged' ? 'bg-destructive/10 text-destructive' :
  s === 'held' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' :
  s === 'open' ? 'bg-accent/10 text-accent' :
  s === 'in-progress' ? 'bg-primary/10 text-primary' :
  'bg-muted text-muted-foreground';

const InternalSearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<'all' | EntityType>('all');
  const [previewEntity, setPreviewEntity] = useState<SearchResult | null>(null);
  const [compareEntities, setCompareEntities] = useState<SearchResult[]>([]);
  const [showCompare, setShowCompare] = useState(false);

  const filtered = RESULTS.filter(r => {
    if (activeType !== 'all' && r.type !== activeType) return false;
    if (query && !r.title.toLowerCase().includes(query.toLowerCase()) && !r.id.toLowerCase().includes(query.toLowerCase()) && !r.subtitle.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  const toggleCompare = (r: SearchResult) => {
    setCompareEntities(prev =>
      prev.find(e => e.id === r.id)
        ? prev.filter(e => e.id !== r.id)
        : prev.length < 3 ? [...prev, r] : prev
    );
  };

  return (
    <div className="max-w-[1200px] mx-auto px-4 lg:px-6 py-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="text-lg font-bold flex items-center gap-2"><Search className="h-5 w-5 text-accent" />Internal Search & Entity Lookup</h1>
        <p className="text-[10px] text-muted-foreground mt-0.5">Search across users, orders, disputes, transactions, tickets, projects, and gigs</p>
      </div>

      {/* Search bar */}
      <div className="rounded-2xl border bg-card p-3 mb-4">
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by ID, name, email, keyword..."
            className="pl-10 h-10 text-sm rounded-xl"
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Type filters */}
        <div className="flex flex-wrap gap-1">
          {(['all', 'user', 'order', 'dispute', 'transaction', 'ticket', 'project', 'gig'] as const).map(t => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-[8px] font-semibold transition-all capitalize',
                activeType === t ? 'bg-accent/10 text-accent' : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
              )}
            >
              {t === 'all' ? `All (${RESULTS.length})` : `${t}s (${RESULTS.filter(r => r.type === t).length})`}
            </button>
          ))}
        </div>

        {/* Recent searches */}
        {!query && (
          <div className="mt-2 pt-2 border-t">
            <div className="text-[7px] uppercase tracking-wider text-muted-foreground font-bold mb-1 flex items-center gap-1">
              <Clock className="h-2.5 w-2.5" />Recent Searches
            </div>
            <div className="flex flex-wrap gap-1">
              {RECENT_SEARCHES.map(s => (
                <button
                  key={s}
                  onClick={() => setQuery(s)}
                  className="text-[8px] px-2 py-1 rounded-lg bg-muted/20 hover:bg-muted/40 text-foreground/70 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Compare bar */}
      {compareEntities.length > 0 && (
        <div className="rounded-xl border bg-accent/5 p-2 mb-3 flex items-center gap-2">
          <Eye className="h-3.5 w-3.5 text-accent shrink-0" />
          <span className="text-[9px] font-medium">{compareEntities.length} selected for compare</span>
          <div className="flex-1 flex gap-1">
            {compareEntities.map(e => (
              <Badge key={e.id} variant="outline" className="text-[7px] gap-0.5">
                {e.id}
                <button onClick={() => toggleCompare(e)}><X className="h-2 w-2" /></button>
              </Badge>
            ))}
          </div>
          <Button size="sm" className="h-6 text-[8px] rounded-lg gap-1" onClick={() => setShowCompare(true)}>
            <Eye className="h-2.5 w-2.5" />Compare
          </Button>
        </div>
      )}

      {/* Results */}
      <div className="space-y-1.5">
        {filtered.map(result => {
          const TypeIcon = typeIcon[result.type];
          return (
            <div
              key={result.id}
              className="rounded-xl border bg-card p-3 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => setPreviewEntity(result)}
            >
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 shrink-0">
                  <AvatarFallback className={cn('text-[9px] font-bold', typeColor[result.type])}>{result.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn('text-[6px] border-0 rounded-md capitalize', typeColor[result.type])}>{result.type}</Badge>
                    <span className="text-[8px] font-mono text-muted-foreground">{result.id}</span>
                    <Badge className={cn('text-[6px] border-0 rounded-md capitalize', statusBadge(result.status))}>{result.status}</Badge>
                    {result.risk !== 'none' && (
                      <Badge className={cn('text-[6px] border rounded-md', riskColor(result.risk))}>
                        <AlertTriangle className="h-2 w-2 mr-0.5" />Risk: {result.risk}
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] font-semibold mt-0.5">{result.title}</div>
                  <div className="text-[8px] text-muted-foreground mt-0.5">{result.subtitle}</div>
                  {result.linkedIds.length > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-[7px] text-muted-foreground">Linked:</span>
                      {result.linkedIds.map(id => (
                        <button key={id} onClick={e => { e.stopPropagation(); setQuery(id); }} className="text-[7px] text-accent hover:underline">{id}</button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={e => { e.stopPropagation(); toggleCompare(result); }}
                    className={cn('p-1 rounded-lg transition-colors', compareEntities.find(e => e.id === result.id) ? 'bg-accent/10 text-accent' : 'hover:bg-muted/30 text-muted-foreground')}
                  >
                    <Eye className="h-3 w-3" />
                  </button>
                  <button onClick={e => { e.stopPropagation(); navigator.clipboard.writeText(result.id); toast.success(`Copied ${result.id}`); }} className="p-1 rounded-lg hover:bg-muted/30 text-muted-foreground transition-colors">
                    <Copy className="h-3 w-3" />
                  </button>
                  <ChevronRight className="h-3 w-3 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" />
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && query && (
          <div className="text-center py-12">
            <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm font-medium">No results for "{query}"</p>
            <p className="text-[10px] text-muted-foreground">Try searching by ID, email, or keyword</p>
          </div>
        )}
      </div>

      {/* ═══ Case Preview Drawer ═══ */}
      <Sheet open={!!previewEntity} onOpenChange={() => setPreviewEntity(null)}>
        <SheetContent className="w-[400px] p-0">
          {previewEntity && (
            <>
              <SheetHeader className="px-4 pt-4 pb-3 border-b">
                <SheetTitle className="text-sm flex items-center gap-2">
                  <Badge className={cn('text-[7px] border-0 capitalize', typeColor[previewEntity.type])}>{previewEntity.type}</Badge>
                  {previewEntity.id}
                </SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-4">
                {/* Entity card */}
                <div className="rounded-xl border bg-muted/20 p-3">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className={cn('text-[10px] font-bold', typeColor[previewEntity.type])}>{previewEntity.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm font-bold">{previewEntity.title}</div>
                      <div className="text-[9px] text-muted-foreground">{previewEntity.subtitle}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg border p-2">
                      <div className="text-[7px] text-muted-foreground">Status</div>
                      <Badge className={cn('text-[7px] border-0 capitalize mt-0.5', statusBadge(previewEntity.status))}>{previewEntity.status}</Badge>
                    </div>
                    <div className="rounded-lg border p-2">
                      <div className="text-[7px] text-muted-foreground">Risk</div>
                      {previewEntity.risk !== 'none' ? (
                        <Badge className={cn('text-[7px] border mt-0.5 capitalize', riskColor(previewEntity.risk))}>{previewEntity.risk}</Badge>
                      ) : (
                        <span className="text-[8px] text-muted-foreground">None</span>
                      )}
                    </div>
                    <div className="rounded-lg border p-2">
                      <div className="text-[7px] text-muted-foreground">Created</div>
                      <div className="text-[9px] font-medium mt-0.5">{previewEntity.created}</div>
                    </div>
                    <div className="rounded-lg border p-2">
                      <div className="text-[7px] text-muted-foreground">Linked</div>
                      <div className="text-[9px] font-medium mt-0.5">{previewEntity.linkedIds.length} entities</div>
                    </div>
                  </div>
                </div>

                {/* Linked entities */}
                {previewEntity.linkedIds.length > 0 && (
                  <div>
                    <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Linked Entities</div>
                    <div className="space-y-1">
                      {previewEntity.linkedIds.map(id => {
                        const linked = RESULTS.find(r => r.id === id);
                        return (
                          <button
                            key={id}
                            onClick={() => linked && setPreviewEntity(linked)}
                            className="w-full flex items-center gap-2 p-2 rounded-xl border hover:bg-muted/30 transition-colors text-left"
                          >
                            <Hash className="h-3 w-3 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-[9px] font-semibold">{id}</div>
                              {linked && <div className="text-[7px] text-muted-foreground truncate">{linked.title}</div>}
                            </div>
                            <ChevronRight className="h-3 w-3 text-muted-foreground/30" />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Mock timeline */}
                <div>
                  <div className="text-[8px] font-bold uppercase tracking-wider text-muted-foreground mb-1.5">Activity Timeline</div>
                  <div className="space-y-2">
                    {[
                      { action: 'Entity created', actor: 'System', time: previewEntity.created, icon: Activity },
                      { action: 'Status updated', actor: 'Agent Kim', time: '1h ago', icon: CheckCircle2 },
                      { action: 'Note added', actor: 'Trust Ops', time: '45m ago', icon: FileText },
                      { action: 'Risk assessment updated', actor: 'System', time: '30m ago', icon: Shield },
                    ].map((event, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="h-5 w-5 rounded-full bg-muted/50 flex items-center justify-center shrink-0 mt-0.5">
                          <event.icon className="h-2.5 w-2.5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="text-[9px] font-medium">{event.action}</div>
                          <div className="text-[7px] text-muted-foreground">{event.actor} · {event.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-7 text-[9px] rounded-lg gap-1"><Eye className="h-3 w-3" />Full Detail</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[9px] rounded-lg gap-1"><Flag className="h-3 w-3" />Flag</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[9px] rounded-lg gap-1"><Ban className="h-3 w-3" />Suspend</Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ═══ Compare Drawer ═══ */}
      <Sheet open={showCompare} onOpenChange={setShowCompare}>
        <SheetContent className="w-[600px] sm:max-w-[600px] p-0">
          <SheetHeader className="px-4 pt-4 pb-3 border-b">
            <SheetTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-accent" />Compare Entities ({compareEntities.length})</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <div className={cn('grid gap-3', compareEntities.length === 2 ? 'grid-cols-2' : 'grid-cols-3')}>
              {compareEntities.map(entity => (
                <div key={entity.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn('text-[8px] font-bold', typeColor[entity.type])}>{entity.avatar}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Badge className={cn('text-[6px] border-0 capitalize', typeColor[entity.type])}>{entity.type}</Badge>
                      <div className="text-[8px] font-mono text-muted-foreground">{entity.id}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-semibold mb-1">{entity.title}</div>
                  <div className="text-[8px] text-muted-foreground mb-2">{entity.subtitle}</div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[8px]">
                      <span className="text-muted-foreground">Status</span>
                      <Badge className={cn('text-[6px] border-0 capitalize', statusBadge(entity.status))}>{entity.status}</Badge>
                    </div>
                    <div className="flex justify-between text-[8px]">
                      <span className="text-muted-foreground">Risk</span>
                      <span className="font-medium capitalize">{entity.risk}</span>
                    </div>
                    <div className="flex justify-between text-[8px]">
                      <span className="text-muted-foreground">Created</span>
                      <span className="font-medium">{entity.created}</span>
                    </div>
                    <div className="flex justify-between text-[8px]">
                      <span className="text-muted-foreground">Linked</span>
                      <span className="font-medium">{entity.linkedIds.length}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default InternalSearchPage;
