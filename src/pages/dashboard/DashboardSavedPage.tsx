import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Bookmark, Briefcase, FolderKanban, Layers, Film, Users,
  Clock, Heart, Trash2, ExternalLink, Search, ChevronRight,
  Building2,
} from 'lucide-react';
import { Input } from '@/components/ui/input';

type SavedType = 'all' | 'jobs' | 'projects' | 'services' | 'media' | 'profiles';

const SAVED_ITEMS = [
  { id: 's1', type: 'jobs' as const, icon: Briefcase, title: 'Senior Frontend Developer', subtitle: 'Stripe · Remote · $180k–$220k', saved: '2h ago', href: '/jobs/1' },
  { id: 's2', type: 'jobs' as const, icon: Briefcase, title: 'Product Designer', subtitle: 'Notion · Hybrid · $140k–$170k', saved: '1d ago', href: '/jobs/2' },
  { id: 's3', type: 'projects' as const, icon: FolderKanban, title: 'E-commerce Platform Redesign', subtitle: 'Budget: $15,000 · 8 proposals', saved: '2d ago', href: '/projects' },
  { id: 's4', type: 'services' as const, icon: Layers, title: 'Brand Strategy Workshop', subtitle: 'StudioLab · Starting at $450', saved: '3d ago', href: '/services/browse' },
  { id: 's5', type: 'media' as const, icon: Film, title: 'Advanced React Patterns — Tutorial', subtitle: 'By Alex Chen · 45 min · 12K views', saved: '4d ago', href: '/media/videos' },
  { id: 's6', type: 'profiles' as const, icon: Users, title: 'Elena Rodriguez — UX Consultant', subtitle: '4.9★ · 120+ projects · Top Rated', saved: '5d ago', href: '/profile' },
  { id: 's7', type: 'jobs' as const, icon: Briefcase, title: 'Engineering Manager', subtitle: 'Linear · Remote · $200k–$260k', saved: '1w ago', href: '/jobs/3' },
  { id: 's8', type: 'services' as const, icon: Layers, title: 'Logo & Visual Identity Package', subtitle: 'DesignCraft · Starting at $180', saved: '1w ago', href: '/services/browse' },
];

const TABS: { value: SavedType; label: string; icon: React.ElementType }[] = [
  { value: 'all', label: 'All', icon: Bookmark },
  { value: 'jobs', label: 'Jobs', icon: Briefcase },
  { value: 'projects', label: 'Projects', icon: FolderKanban },
  { value: 'services', label: 'Services', icon: Layers },
  { value: 'media', label: 'Media', icon: Film },
  { value: 'profiles', label: 'Profiles', icon: Users },
];

const DashboardSavedPage: React.FC = () => {
  const [tab, setTab] = useState<SavedType>('all');
  const [search, setSearch] = useState('');

  const filtered = SAVED_ITEMS.filter(i => {
    if (tab !== 'all' && i.type !== tab) return false;
    if (search && !i.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-bold flex items-center gap-2"><Bookmark className="h-5 w-5 text-accent" /> Saved Items</h1>
        <p className="text-[11px] text-muted-foreground">Everything you've saved across Gigvora in one place</p>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <Input placeholder="Search saved..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-8 text-[10px] rounded-xl" />
        </div>
      </div>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {TABS.map(t => (
          <button key={t.value} onClick={() => setTab(t.value)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-medium shrink-0 transition-all',
            tab === t.value ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/50 text-muted-foreground hover:bg-muted'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
            {t.value !== 'all' && <Badge variant="outline" className="text-[7px] h-4 rounded-md ml-0.5">{SAVED_ITEMS.filter(i => i.type === t.value).length}</Badge>}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm transition-all group">
            <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0 group-hover:bg-accent/10 transition-colors">
              <item.icon className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-semibold group-hover:text-accent transition-colors truncate">{item.title}</div>
              <div className="text-[9px] text-muted-foreground mt-0.5">{item.subtitle}</div>
              <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-1"><Clock className="h-2.5 w-2.5" />Saved {item.saved}</div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl text-muted-foreground hover:text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button>
              <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1" asChild>
                <Link to={item.href}><ExternalLink className="h-3 w-3" />View</Link>
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-2xl border-2 border-dashed p-12 text-center">
            <Bookmark className="h-8 w-8 text-muted-foreground/20 mx-auto mb-2" />
            <div className="text-xs font-semibold text-muted-foreground">No saved items</div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Items you save will appear here</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSavedPage;
