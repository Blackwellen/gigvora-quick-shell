import React, { useState } from 'react';
import { NetworkShell } from '@/components/shell/NetworkShell';
import { KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Heart, MapPin, Clock, UserMinus, Filter, Eye,
  MessageSquare, Bell, BellOff, ChevronDown, Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Following {
  id: string; name: string; initials: string; headline: string;
  location: string; followedSince: string; lastPost: string;
  mutual: number; notificationsOn: boolean;
  category: 'person' | 'company' | 'creator';
  industry: string;
}

const FOLLOWING: Following[] = [
  { id: 'F1', name: 'Sarah Chen', initials: 'SC', headline: 'Staff Engineer at Stripe', location: 'San Francisco, CA', followedSince: 'Jan 2025', lastPost: '2h ago', mutual: 12, notificationsOn: true, category: 'person', industry: 'Fintech' },
  { id: 'F2', name: 'TechCrunch', initials: 'TC', headline: 'Technology news and analysis', location: 'San Francisco, CA', followedSince: 'Mar 2024', lastPost: '30m ago', mutual: 0, notificationsOn: false, category: 'company', industry: 'Media' },
  { id: 'F3', name: 'Marcus Johnson', initials: 'MJ', headline: 'Product Design Lead & Creator', location: 'New York, NY', followedSince: 'Sep 2025', lastPost: '1d ago', mutual: 5, notificationsOn: true, category: 'creator', industry: 'Design' },
  { id: 'F4', name: 'DataForge Inc', initials: 'DF', headline: 'Enterprise data infrastructure', location: 'Austin, TX', followedSince: 'Nov 2025', lastPost: '3d ago', mutual: 8, notificationsOn: false, category: 'company', industry: 'Data' },
  { id: 'F5', name: 'Priya Patel', initials: 'PP', headline: 'AI/ML Researcher & Speaker', location: 'London, UK', followedSince: 'Dec 2025', lastPost: '5h ago', mutual: 3, notificationsOn: false, category: 'creator', industry: 'AI' },
  { id: 'F6', name: 'Y Combinator', initials: 'YC', headline: 'Startup accelerator', location: 'Mountain View', followedSince: 'Jun 2024', lastPost: '1h ago', mutual: 0, notificationsOn: true, category: 'company', industry: 'VC' },
  { id: 'F7', name: 'Alex Rivera', initials: 'AR', headline: 'DevRel Engineer & Educator', location: 'Remote', followedSince: 'Oct 2025', lastPost: '12h ago', mutual: 7, notificationsOn: false, category: 'creator', industry: 'Dev Tools' },
];

const CAT_COLORS: Record<string, string> = {
  person: 'bg-accent/10 text-accent',
  company: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  creator: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
};

const FILTER_CATEGORIES = [
  { label: 'Category', options: ['People', 'Companies', 'Creators'] },
  { label: 'Industry', options: ['Tech', 'Design', 'AI', 'Fintech', 'Media', 'Dev Tools'] },
  { label: 'Location', options: ['US', 'Europe', 'Asia', 'Remote'] },
  { label: 'Activity', options: ['Active today', 'This week', 'This month', 'Inactive'] },
  { label: 'Notifications', options: ['Enabled', 'Disabled'] },
  { label: 'Followed Since', options: ['Last 30 days', 'Last 90 days', '6+ months'] },
];

export default function FollowingHubPage() {
  const [catFilter, setCatFilter] = useState<'all' | 'person' | 'company' | 'creator'>('all');
  const [showFilters, setShowFilters] = useState(true);
  const filtered = FOLLOWING.filter(f => catFilter === 'all' || f.category === catFilter);

  return (
    <NetworkShell backLabel="Following" backRoute="/networking">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <Heart className="h-4 w-4 text-accent" />
        <h1 className="text-sm font-bold mr-2">Following</h1>
        <KPICard label="Total" value={String(FOLLOWING.length)} />
        <KPICard label="People" value={String(FOLLOWING.filter(f => f.category === 'person').length)} />
        <KPICard label="Companies" value={String(FOLLOWING.filter(f => f.category === 'company').length)} />
        <KPICard label="Creators" value={String(FOLLOWING.filter(f => f.category === 'creator').length)} />
        <KPICard label="Notifications On" value={String(FOLLOWING.filter(f => f.notificationsOn).length)} />
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5">
          {(['all', 'person', 'company', 'creator'] as const).map(f => (
            <button key={f} onClick={() => setCatFilter(f)} className={cn('px-2.5 py-1 rounded-lg text-[9px] font-medium transition-colors capitalize', catFilter === f ? 'bg-card shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground')}>
              {f === 'person' ? 'People' : f === 'company' ? 'Companies' : f === 'creator' ? 'Creators' : 'All'}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)} className={`h-7 text-[10px] gap-1 rounded-xl ${showFilters ? 'bg-accent/10 border-accent/30' : ''}`}>
          <Filter className="h-3 w-3" /> Filters <ChevronDown className="h-2.5 w-2.5" />
        </Button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2 mb-4 p-3 rounded-xl border border-border/40 bg-card/50">
          {FILTER_CATEGORIES.map(fc => (
            <div key={fc.label}>
              <div className="text-[8px] font-semibold text-muted-foreground mb-1">{fc.label}</div>
              <div className="flex flex-wrap gap-1">
                {fc.options.map(o => (
                  <Badge key={o} variant="outline" className="text-[7px] h-3.5 px-1.5 cursor-pointer hover:bg-accent/10 hover:border-accent/30 transition-colors">{o}</Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {filtered.map(item => (
          <div key={item.id} className="rounded-xl border border-border/40 hover:border-accent/30 p-3.5 hover:bg-accent/5 transition-all flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-accent/10">
              <AvatarFallback className="text-[10px] font-bold bg-accent/10 text-accent">{item.initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold">{item.name}</span>
                <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', CAT_COLORS[item.category])}>{item.category}</Badge>
              </div>
              <div className="text-[10px] text-muted-foreground truncate">{item.headline}</div>
              <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{item.location}</span>
                <span className="flex items-center gap-0.5"><Building2 className="h-2.5 w-2.5" />{item.industry}</span>
                <span>Since {item.followedSince}</span>
                {item.mutual > 0 && <span>{item.mutual} mutual</span>}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <span className="text-[8px] text-muted-foreground mr-1">{item.lastPost}</span>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg">{item.notificationsOn ? <Bell className="h-3 w-3 text-accent" /> : <BellOff className="h-3 w-3" />}</Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><MessageSquare className="h-3 w-3" /></Button>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Eye className="h-3 w-3" /></Button>
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg px-2 gap-0.5"><UserMinus className="h-2.5 w-2.5" />Unfollow</Button>
            </div>
          </div>
        ))}
      </div>
    </NetworkShell>
  );
}
