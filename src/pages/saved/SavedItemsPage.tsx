import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard } from '@/components/shell/EnterprisePrimitives';
import { MOCK_USERS, MOCK_JOBS, MOCK_GIGS } from '@/data/mock';
import { cn } from '@/lib/utils';
import {
  Bookmark, BookmarkX, Clock, Briefcase, Layers, Users, FileText,
  Star, Building2, ExternalLink, Archive, ArchiveRestore, Search,
  Filter, X, ChevronRight, Eye, CheckCircle2, MapPin, Calendar,
  AlertTriangle, Trash2, MoreHorizontal, FolderOpen, History,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════
   Types & Data
   ═══════════════════════════════════════════════════════════ */
type ObjectType = 'all' | 'jobs' | 'gigs' | 'profiles' | 'projects' | 'companies';
type ViewTab = 'saved' | 'recent' | 'archived';

interface SavedItem {
  id: string;
  type: 'job' | 'gig' | 'profile' | 'project' | 'company';
  title: string;
  subtitle: string;
  savedAt: string;
  archived: boolean;
  note?: string;
  meta?: Record<string, string>;
}

interface RecentItem {
  id: string;
  type: 'job' | 'gig' | 'profile' | 'project' | 'company';
  title: string;
  subtitle: string;
  viewedAt: string;
  viewCount: number;
}

const SAVED_ITEMS: SavedItem[] = [
  { id: 's1', type: 'job', title: 'Senior Product Designer', subtitle: 'LaunchPad AI · San Francisco · $180K-$220K', savedAt: '2h ago', archived: false, meta: { status: 'Active', deadline: 'Apr 30' } },
  { id: 's2', type: 'gig', title: 'Brand Identity Package', subtitle: 'Elena Rodriguez · From $2,500 · ★4.9', savedAt: '5h ago', archived: false, meta: { delivery: '14 days' } },
  { id: 's3', type: 'profile', title: 'Sarah Chen', subtitle: 'Senior Product Designer at Figma · Verified', savedAt: '1d ago', archived: false },
  { id: 's4', type: 'project', title: 'AI-Powered Analytics Dashboard', subtitle: 'GreenFlow Tech · React, Python · $15K-$25K', savedAt: '1d ago', archived: false, meta: { status: 'Open' } },
  { id: 's5', type: 'company', title: 'DataBridge Analytics', subtitle: 'Data Analytics · London · 200-500 employees', savedAt: '2d ago', archived: false, meta: { jobs: '23 open' } },
  { id: 's6', type: 'job', title: 'Full-Stack Engineer', subtitle: 'FinServe Pro · New York · $150K-$190K', savedAt: '3d ago', archived: false, meta: { status: 'Active' } },
  { id: 's7', type: 'gig', title: 'Mobile App Prototype', subtitle: 'David Kim · From $1,800 · ★4.7', savedAt: '4d ago', archived: false, meta: { delivery: '7 days' } },
  { id: 's8', type: 'profile', title: 'Marcus Johnson', subtitle: 'Head of Talent Acquisition · TechCorp', savedAt: '5d ago', archived: true },
  { id: 's9', type: 'job', title: 'DevOps Lead', subtitle: 'CloudScale · Remote · $160K-$200K', savedAt: '1w ago', archived: true, meta: { status: 'Closed' } },
  { id: 's10', type: 'project', title: 'E-Commerce Platform Rebuild', subtitle: 'ShopWave · React, Node · $40K-$60K', savedAt: '1w ago', archived: true, meta: { status: 'Closed' } },
];

const RECENT_ITEMS: RecentItem[] = [
  { id: 'r1', type: 'job', title: 'Senior Product Designer', subtitle: 'LaunchPad AI · San Francisco', viewedAt: '10m ago', viewCount: 5 },
  { id: 'r2', type: 'profile', title: 'Elena Rodriguez', subtitle: 'Full-Stack Developer · Freelancer', viewedAt: '25m ago', viewCount: 3 },
  { id: 'r3', type: 'gig', title: 'Brand Identity Package', subtitle: 'Elena Rodriguez · From $2,500', viewedAt: '1h ago', viewCount: 2 },
  { id: 'r4', type: 'company', title: 'LaunchPad AI', subtitle: 'AI / SaaS · San Francisco', viewedAt: '2h ago', viewCount: 4 },
  { id: 'r5', type: 'project', title: 'AI-Powered Analytics Dashboard', subtitle: 'GreenFlow Tech', viewedAt: '3h ago', viewCount: 1 },
  { id: 'r6', type: 'job', title: 'Full-Stack Engineer', subtitle: 'FinServe Pro · New York', viewedAt: '5h ago', viewCount: 2 },
  { id: 'r7', type: 'profile', title: 'Sarah Chen', subtitle: 'Senior Product Designer at Figma', viewedAt: '1d ago', viewCount: 7 },
  { id: 'r8', type: 'gig', title: 'Mobile App Prototype', subtitle: 'David Kim · From $1,800', viewedAt: '1d ago', viewCount: 1 },
];

const TYPE_ICON: Record<string, React.ElementType> = {
  job: Briefcase,
  gig: Layers,
  profile: Users,
  project: FileText,
  company: Building2,
};

const TYPE_COLOR: Record<string, string> = {
  job: 'bg-[hsl(var(--gigvora-blue))]/10 text-[hsl(var(--gigvora-blue))]',
  gig: 'bg-accent/10 text-accent',
  profile: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  project: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  company: 'bg-muted text-muted-foreground',
};

const OBJECT_TABS: { id: ObjectType; label: string; icon: React.ElementType }[] = [
  { id: 'all', label: 'All', icon: FolderOpen },
  { id: 'jobs', label: 'Jobs', icon: Briefcase },
  { id: 'gigs', label: 'Gigs', icon: Layers },
  { id: 'profiles', label: 'Profiles', icon: Users },
  { id: 'projects', label: 'Projects', icon: FileText },
  { id: 'companies', label: 'Companies', icon: Building2 },
];

/* ═══════════════════════════════════════════════════════════
   Components
   ═══════════════════════════════════════════════════════════ */

const SavedRow: React.FC<{
  item: SavedItem;
  selected: boolean;
  onSelect: () => void;
  onUnsave: () => void;
  onArchive: () => void;
}> = ({ item, selected, onSelect, onUnsave, onArchive }) => {
  const Icon = TYPE_ICON[item.type];
  return (
    <div onClick={onSelect} className={cn(
      'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-all group',
      selected ? 'border-accent/30 bg-accent/5' : 'hover:bg-muted/30 border-transparent'
    )}>
      <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0', TYPE_COLOR[item.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium truncate flex items-center gap-1.5">
          {item.title}
          <Badge variant="secondary" className="text-[8px] h-3.5 capitalize">{item.type}</Badge>
          {item.meta?.status === 'Closed' && <Badge variant="outline" className="text-[8px] h-3.5 text-[hsl(var(--state-blocked))]">Closed</Badge>}
        </div>
        <div className="text-[10px] text-muted-foreground truncate">{item.subtitle}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
          <span className="flex items-center gap-0.5"><Bookmark className="h-2 w-2" />Saved {item.savedAt}</span>
          {item.meta?.deadline && <span>Deadline: {item.meta.deadline}</span>}
          {item.meta?.delivery && <span>Delivery: {item.meta.delivery}</span>}
          {item.meta?.jobs && <span>{item.meta.jobs}</span>}
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); onArchive(); }}>
          {item.archived ? <ArchiveRestore className="h-3 w-3" /> : <Archive className="h-3 w-3" />}
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-[hsl(var(--state-blocked))]" onClick={e => { e.stopPropagation(); onUnsave(); }}>
          <BookmarkX className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={e => { e.stopPropagation(); onSelect(); }}>
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const RecentRow: React.FC<{ item: RecentItem; onSave: () => void }> = ({ item, onSave }) => {
  const Icon = TYPE_ICON[item.type];
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors group">
      <div className={cn('h-8 w-8 rounded-md flex items-center justify-center shrink-0', TYPE_COLOR[item.type])}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-medium truncate flex items-center gap-1.5">
          {item.title}
          <Badge variant="secondary" className="text-[8px] h-3.5 capitalize">{item.type}</Badge>
        </div>
        <div className="text-[10px] text-muted-foreground truncate">{item.subtitle}</div>
        <div className="text-[9px] text-muted-foreground mt-0.5 flex items-center gap-2">
          <span className="flex items-center gap-0.5"><Eye className="h-2 w-2" />{item.viewedAt}</span>
          <span>{item.viewCount} views</span>
        </div>
      </div>
      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onSave}>
          <Bookmark className="h-3 w-3" />
        </Button>
        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

const EmptyState: React.FC<{ tab: ViewTab; type: ObjectType }> = ({ tab, type }) => {
  const icons: Record<ViewTab, React.ElementType> = { saved: Bookmark, recent: Clock, archived: Archive };
  const Icon = icons[tab];
  const labels: Record<ViewTab, string> = {
    saved: `No saved ${type === 'all' ? 'items' : type}`,
    recent: 'No recent activity',
    archived: `No archived ${type === 'all' ? 'items' : type}`,
  };
  return (
    <div className="text-center py-10">
      <Icon className="h-10 w-10 mx-auto mb-3 text-muted-foreground/20" />
      <div className="text-sm font-medium">{labels[tab]}</div>
      <p className="text-[11px] text-muted-foreground mt-1">
        {tab === 'saved' ? 'Save jobs, gigs, profiles, and projects to access them quickly later.' :
         tab === 'recent' ? 'Items you view across Gigvora will appear here for quick recall.' :
         'Archived items will appear here. You can restore them anytime.'}
      </p>
    </div>
  );
};

const ObjectUnavailable: React.FC = () => (
  <div className="rounded-lg border border-[hsl(var(--state-caution)/0.3)] bg-[hsl(var(--state-caution)/0.05)] p-3 flex items-center gap-3">
    <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))] shrink-0" />
    <div className="flex-1">
      <div className="text-[11px] font-medium">Some saved items may be unavailable</div>
      <div className="text-[10px] text-muted-foreground">1 listing has been closed or removed since you saved it.</div>
    </div>
    <Button variant="ghost" size="sm" className="text-[10px] h-6">Dismiss</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   Detail Inspector
   ═══════════════════════════════════════════════════════════ */
const DetailInspector: React.FC<{ item: SavedItem | null; onClose: () => void }> = ({ item, onClose }) => {
  if (!item) return null;
  const Icon = TYPE_ICON[item.type];
  return (
    <SectionCard title="Inspector" action={<button onClick={onClose}><X className="h-3 w-3 text-muted-foreground" /></button>}>
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', TYPE_COLOR[item.type])}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <div className="text-xs font-semibold">{item.title}</div>
            <div className="text-[10px] text-muted-foreground capitalize">{item.type}</div>
          </div>
        </div>
        <div className="text-[10px] text-muted-foreground">{item.subtitle}</div>
        {item.meta && (
          <div className="space-y-1">
            {Object.entries(item.meta).map(([k, v]) => (
              <div key={k} className="flex justify-between text-[10px]">
                <span className="text-muted-foreground capitalize">{k}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
        )}
        <div className="text-[9px] text-muted-foreground flex items-center gap-1">
          <Bookmark className="h-2.5 w-2.5" />Saved {item.savedAt}
        </div>
        {item.note && (
          <div className="rounded-md bg-muted/50 p-2 text-[10px]">
            <div className="text-[9px] font-semibold text-muted-foreground mb-0.5">Note</div>
            {item.note}
          </div>
        )}
        <div className="flex gap-1.5">
          <Button variant="outline" size="sm" className="flex-1 text-[9px] h-6"><Archive className="h-2.5 w-2.5 mr-1" />Archive</Button>
          <Button size="sm" className="flex-1 text-[9px] h-6"><ExternalLink className="h-2.5 w-2.5 mr-1" />Open</Button>
        </div>
      </div>
    </SectionCard>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const SavedItemsPage: React.FC = () => {
  const [viewTab, setViewTab] = useState<ViewTab>('saved');
  const [objectType, setObjectType] = useState<ObjectType>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [items, setItems] = useState(SAVED_ITEMS);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSaved = useMemo(() => {
    let list = items.filter(i => viewTab === 'archived' ? i.archived : !i.archived);
    if (objectType !== 'all') list = list.filter(i => i.type === objectType.slice(0, -1) || (objectType === 'companies' && i.type === 'company'));
    if (searchQuery) list = list.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()) || i.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [items, viewTab, objectType, searchQuery]);

  const filteredRecent = useMemo(() => {
    let list = RECENT_ITEMS;
    if (objectType !== 'all') list = list.filter(i => i.type === objectType.slice(0, -1) || (objectType === 'companies' && i.type === 'company'));
    if (searchQuery) list = list.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [objectType, searchQuery]);

  const selectedItem = items.find(i => i.id === selectedId) || null;

  const handleUnsave = (id: string) => setItems(prev => prev.filter(i => i.id !== id));
  const handleArchive = (id: string) => setItems(prev => prev.map(i => i.id === id ? { ...i, archived: !i.archived } : i));

  const activeSavedCount = items.filter(i => !i.archived).length;
  const archivedCount = items.filter(i => i.archived).length;
  const typeCounts = useMemo(() => {
    const active = items.filter(i => !i.archived);
    return { jobs: active.filter(i => i.type === 'job').length, gigs: active.filter(i => i.type === 'gig').length, profiles: active.filter(i => i.type === 'profile').length, projects: active.filter(i => i.type === 'project').length, companies: active.filter(i => i.type === 'company').length };
  }, [items]);

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2">
        <Bookmark className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Saved & Recent</span>
      </div>
      <div className="flex-1" />
      <div className="relative max-w-xs flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Filter saved items..."
          className="w-full h-7 rounded-md border bg-background pl-8 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      {searchQuery && (
        <Button variant="ghost" size="sm" className="h-7 text-[10px]" onClick={() => setSearchQuery('')}>
          <X className="h-3 w-3 mr-1" />Clear
        </Button>
      )}
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Active Saved" value={activeSavedCount} />
        <KPICard label="Archived" value={archivedCount} />
      </div>

      {selectedItem && <DetailInspector item={selectedItem} onClose={() => setSelectedId(null)} />}

      <SectionCard title="By Type">
        <div className="space-y-1">
          {Object.entries(typeCounts).map(([k, v]) => {
            const Icon = TYPE_ICON[k === 'companies' ? 'company' : k === 'jobs' ? 'job' : k === 'gigs' ? 'gig' : k === 'profiles' ? 'profile' : 'project'];
            return (
              <button key={k} onClick={() => setObjectType(k as ObjectType)} className={cn('flex items-center justify-between w-full px-2 py-1.5 rounded-md text-[10px] transition-colors', objectType === k ? 'bg-accent/10 text-accent' : 'hover:bg-muted/50')}>
                <span className="flex items-center gap-1.5 capitalize"><Icon className="h-3 w-3" />{k}</span>
                <span className="font-semibold">{v}</span>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions">
        <div className="space-y-1">
          <Button variant="ghost" size="sm" className="w-full justify-start text-[10px] h-7"><Archive className="h-3 w-3 mr-1.5" />Archive All Read</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-[10px] h-7"><Trash2 className="h-3 w-3 mr-1.5" />Clear Recent History</Button>
          <Button variant="ghost" size="sm" className="w-full justify-start text-[10px] h-7"><FolderOpen className="h-3 w-3 mr-1.5" />Manage Collections</Button>
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-semibold flex items-center gap-1"><History className="h-3.5 w-3.5 text-muted-foreground" />Activity Timeline</span>
        <span className="text-[10px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="flex gap-4 overflow-x-auto pb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d, i) => (
          <div key={d} className="text-center shrink-0">
            <div className="text-[9px] text-muted-foreground mb-1">{d}</div>
            <div className={cn('h-6 w-6 rounded-md flex items-center justify-center text-[10px] font-semibold', [3, 5, 1][i % 3] > 2 ? 'bg-accent/20 text-accent' : 'bg-muted/50 text-muted-foreground')}>
              {[3, 5, 1, 4, 2, 0, 1][i]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-64" bottomSection={bottomSection}>
      {/* Unavailable banner */}
      {items.some(i => i.meta?.status === 'Closed') && <div className="mb-3"><ObjectUnavailable /></div>}

      {/* Object Type Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 mb-2">
        {OBJECT_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setObjectType(t.id)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-medium whitespace-nowrap transition-colors shrink-0',
              objectType === t.id ? 'bg-accent text-accent-foreground' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
            )}
          >
            <t.icon className="h-3 w-3" />
            {t.label}
          </button>
        ))}
      </div>

      {/* View Tabs */}
      <Tabs value={viewTab} onValueChange={v => setViewTab(v as ViewTab)} className="mb-3">
        <TabsList className="h-7">
          <TabsTrigger value="saved" className="text-[10px] h-5">
            <Bookmark className="h-3 w-3 mr-1" />Saved ({activeSavedCount})
          </TabsTrigger>
          <TabsTrigger value="recent" className="text-[10px] h-5">
            <Clock className="h-3 w-3 mr-1" />Recent ({RECENT_ITEMS.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="text-[10px] h-5">
            <Archive className="h-3 w-3 mr-1" />Archived ({archivedCount})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Content */}
      {viewTab === 'saved' || viewTab === 'archived' ? (
        filteredSaved.length === 0 ? <EmptyState tab={viewTab} type={objectType} /> : (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">{filteredSaved.length} {viewTab === 'archived' ? 'archived' : 'saved'} items</span>
            </div>
            {filteredSaved.map(item => (
              <SavedRow
                key={item.id}
                item={item}
                selected={selectedId === item.id}
                onSelect={() => setSelectedId(item.id)}
                onUnsave={() => handleUnsave(item.id)}
                onArchive={() => handleArchive(item.id)}
              />
            ))}
          </div>
        )
      ) : (
        filteredRecent.length === 0 ? <EmptyState tab="recent" type={objectType} /> : (
          <div className="space-y-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] text-muted-foreground">{filteredRecent.length} recent items</span>
              <Button variant="ghost" size="sm" className="text-[9px] h-5 text-[hsl(var(--state-blocked))]"><Trash2 className="h-2.5 w-2.5 mr-1" />Clear History</Button>
            </div>
            {filteredRecent.map(item => (
              <RecentRow key={item.id} item={item} onSave={() => {}} />
            ))}
          </div>
        )
      )}
    </DashboardLayout>
  );
};

export default SavedItemsPage;
