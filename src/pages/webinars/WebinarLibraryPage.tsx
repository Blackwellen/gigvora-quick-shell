import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Library, Search, Play, Clock, Users, Star, Filter, Bookmark } from 'lucide-react';

const WEBINARS = [
  { id: '1', title: 'Scaling React at Enterprise', host: 'Sarah Kim', date: 'May 15, 2026', duration: '90 min', views: 1247, rating: 4.8, category: 'Engineering', saved: true },
  { id: '2', title: 'Design Systems That Scale', host: 'Lisa Park', date: 'May 10, 2026', duration: '60 min', views: 890, rating: 4.6, category: 'Design', saved: false },
  { id: '3', title: 'AI in Product Development', host: 'Maya Chen', date: 'May 5, 2026', duration: '75 min', views: 2100, rating: 4.9, category: 'Product', saved: true },
  { id: '4', title: 'Remote Team Leadership', host: 'James Rivera', date: 'Apr 28, 2026', duration: '45 min', views: 650, rating: 4.3, category: 'Leadership', saved: false },
  { id: '5', title: 'Security Best Practices', host: 'Tom Wright', date: 'Apr 20, 2026', duration: '60 min', views: 430, rating: 4.5, category: 'Engineering', saved: false },
  { id: '6', title: 'Building Developer Communities', host: 'Alex Torres', date: 'Apr 15, 2026', duration: '50 min', views: 780, rating: 4.7, category: 'Community', saved: true },
];

export default function WebinarLibraryPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const categories = ['all', ...new Set(WEBINARS.map(w => w.category))];
  const filtered = WEBINARS.filter(w => (category === 'all' || w.category === category) && w.title.toLowerCase().includes(search.toLowerCase()));

  const topStrip = (
    <>
      <Library className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Webinar Library</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-0.5">
        {categories.map(c => (
          <button key={c} onClick={() => setCategory(c)} className={cn('px-2 py-1 rounded-lg text-[8px] font-medium transition-colors capitalize', category === c ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>{c}</button>
        ))}
      </div>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <KPIBand className="mb-3">
        <KPICard label="Total Webinars" value={String(WEBINARS.length)} className="!rounded-2xl" />
        <KPICard label="Total Views" value={String(WEBINARS.reduce((s, w) => s + w.views, 0).toLocaleString())} className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.6" className="!rounded-2xl" />
        <KPICard label="Saved" value={String(WEBINARS.filter(w => w.saved).length)} className="!rounded-2xl" />
      </KPIBand>

      <div className="relative max-w-sm mb-3">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <Input placeholder="Search webinars..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs rounded-xl" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(w => (
          <div key={w.id} className="rounded-2xl border bg-card overflow-hidden hover:shadow-sm transition-all cursor-pointer group">
            <div className="aspect-video bg-muted/50 flex items-center justify-center relative">
              <Play className="h-8 w-8 text-muted-foreground/30 group-hover:text-accent transition-colors" />
              <Badge className="absolute top-2 right-2 text-[7px] bg-black/60 text-white border-0 rounded-lg">{w.duration}</Badge>
            </div>
            <div className="p-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold truncate group-hover:text-accent transition-colors">{w.title}</div>
                  <div className="text-[9px] text-muted-foreground mt-0.5">{w.host} · {w.date}</div>
                  <div className="flex items-center gap-2 mt-1 text-[8px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{w.views.toLocaleString()}</span>
                    <span className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{w.rating}</span>
                    <Badge variant="outline" className="text-[7px] h-3.5 rounded-md">{w.category}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className={cn('h-6 w-6 p-0 rounded-lg', w.saved && 'text-accent')}><Bookmark className="h-3 w-3" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
