import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Mic, Upload, Play, Settings, BarChart3, DollarSign, Users, TrendingUp,
  Plus, Eye, Clock, Calendar, Rss, FileText, Trash2, Edit, CheckCircle2,
} from 'lucide-react';

const MY_SHOWS = [
  { title: 'AI Frontiers', episodes: 78, subscribers: '32K', status: 'active', revenue: '$2,450' },
];

const EPISODES_DRAFT = [
  { title: 'The Future of Embodied AI', status: 'draft', created: 'Apr 13, 2026' },
  { title: 'Interview: CEO of Anthropic', status: 'recording', created: 'Apr 12, 2026' },
];

const PUBLISHED = [
  { title: 'Why AI Agents Will Replace SaaS', number: 78, published: 'Apr 11, 2026', plays: '12.4K', retention: 82 },
  { title: 'The State of LLM Fine-Tuning', number: 77, published: 'Apr 4, 2026', plays: '9.1K', retention: 76 },
  { title: 'Building with Multimodal Models', number: 76, published: 'Mar 28, 2026', plays: '11.2K', retention: 88 },
];

export default function PodcastCreatorStudioPage() {
  const [tab, setTab] = useState('overview');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Mic className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Creator Studio</h1>
          <KPICard label="Total Plays" value="89.2K" change="+12%" trend="up" />
          <KPICard label="Subscribers" value="32K" change="+480" trend="up" />
          <KPICard label="Revenue (MTD)" value="$2,450" change="+18%" trend="up" />
          <KPICard label="Avg. Retention" value="82%" />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-[10px] px-3">Overview</TabsTrigger>
          <TabsTrigger value="episodes" className="text-[10px] px-3">Episodes</TabsTrigger>
          <TabsTrigger value="upload" className="text-[10px] px-3">Record/Upload</TabsTrigger>
          <TabsTrigger value="analytics" className="text-[10px] px-3">Analytics</TabsTrigger>
          <TabsTrigger value="monetization" className="text-[10px] px-3">Monetization</TabsTrigger>
          <TabsTrigger value="settings" className="text-[10px] px-3">Settings</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && (
        <div className="space-y-4">
          <SectionCard title="My Shows">
            {MY_SHOWS.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl border border-border/40">
                <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center text-2xl">🤖</div>
                <div className="flex-1">
                  <div className="text-xs font-bold">{s.title}</div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                    <span>{s.episodes} episodes</span>
                    <span><Users className="h-2.5 w-2.5 inline" /> {s.subscribers}</span>
                    <span><DollarSign className="h-2.5 w-2.5 inline" /> {s.revenue}</span>
                    <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Active</Badge>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px]"><Settings className="h-3 w-3" /></Button>
              </div>
            ))}
            <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1 w-full mt-2"><Plus className="h-3 w-3" /> Create New Show</Button>
          </SectionCard>

          <SectionCard title="Drafts & In Progress">
            {EPISODES_DRAFT.map((ep, i) => (
              <div key={i} className="flex items-center gap-3 py-2.5 border-b border-border/30 last:border-0">
                <Badge variant={ep.status === 'draft' ? 'outline' : 'secondary'} className="text-[8px] h-4 w-16 justify-center">{ep.status}</Badge>
                <div className="flex-1"><div className="text-[10px] font-medium">{ep.title}</div><div className="text-[8px] text-muted-foreground">{ep.created}</div></div>
                <Button variant="ghost" size="sm" className="h-6 text-[9px] gap-1"><Edit className="h-2.5 w-2.5" /> Edit</Button>
              </div>
            ))}
          </SectionCard>
        </div>
      )}

      {tab === 'episodes' && (
        <SectionCard title="Published Episodes" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> New Episode</Button>}>
          {PUBLISHED.map((ep, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <Badge variant="outline" className="text-[8px] h-4">#{ep.number}</Badge>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-medium">{ep.title}</div>
                <div className="flex items-center gap-3 text-[8px] text-muted-foreground mt-0.5">
                  <span><Calendar className="h-2.5 w-2.5 inline" /> {ep.published}</span>
                  <span><Eye className="h-2.5 w-2.5 inline" /> {ep.plays}</span>
                  <span>Retention: {ep.retention}%</span>
                </div>
              </div>
              <div className="w-16"><Progress value={ep.retention} className="h-1.5" /></div>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'upload' && (
        <div className="space-y-4">
          <SectionCard title="Record or Upload">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-6 rounded-xl border-2 border-dashed border-accent/30 text-center cursor-pointer hover:bg-accent/5 transition-colors">
                <Mic className="h-8 w-8 mx-auto text-accent mb-2" />
                <p className="text-xs font-medium">Record Episode</p>
                <p className="text-[9px] text-muted-foreground mt-1">Record directly in browser</p>
              </div>
              <div className="p-6 rounded-xl border-2 border-dashed border-border/50 text-center cursor-pointer hover:bg-accent/5 transition-colors">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-xs font-medium">Upload Audio</p>
                <p className="text-[9px] text-muted-foreground mt-1">MP3, WAV, M4A up to 500MB</p>
              </div>
            </div>
          </SectionCard>
          <SectionCard title="Episode Details">
            <div className="space-y-3">
              <div><label className="text-[10px] font-medium block mb-1">Title</label><Input placeholder="Episode title..." className="h-9 text-sm" /></div>
              <div><label className="text-[10px] font-medium block mb-1">Description</label><Textarea placeholder="Episode description..." className="min-h-[80px] text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-[10px] font-medium block mb-1">Season</label><Input placeholder="1" className="h-9 text-sm" /></div>
                <div><label className="text-[10px] font-medium block mb-1">Episode #</label><Input placeholder="79" className="h-9 text-sm" /></div>
              </div>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Plays Over Time" icon={<BarChart3 className="h-3 w-3 text-muted-foreground" />}>
            <div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Weekly plays]</div>
          </SectionCard>
          <SectionCard title="Listener Demographics" icon={<Users className="h-3 w-3 text-muted-foreground" />}>
            <div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Demographics]</div>
          </SectionCard>
          <SectionCard title="Top Episodes" icon={<TrendingUp className="h-3 w-3 text-muted-foreground" />}>
            {PUBLISHED.slice(0, 3).map((ep, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 border-b border-border/30 last:border-0 text-[9px]">
                <span className="font-semibold w-4">{i + 1}</span>
                <span className="flex-1 truncate">{ep.title}</span>
                <span className="text-muted-foreground">{ep.plays}</span>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Retention" icon={<Clock className="h-3 w-3 text-muted-foreground" />}>
            <div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Avg retention curve]</div>
          </SectionCard>
        </div>
      )}

      {tab === 'monetization' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <SectionCard title="Subscriptions"><div className="text-center py-3"><div className="text-2xl font-bold">124</div><div className="text-[9px] text-muted-foreground">Paid subscribers</div><div className="text-sm font-semibold text-accent mt-1">$1,860/mo</div></div></SectionCard>
            <SectionCard title="Donations"><div className="text-center py-3"><div className="text-2xl font-bold">$340</div><div className="text-[9px] text-muted-foreground">This month</div><div className="text-[9px] text-muted-foreground mt-1">28 donors</div></div></SectionCard>
            <SectionCard title="Premium Content"><div className="text-center py-3"><div className="text-2xl font-bold">$250</div><div className="text-[9px] text-muted-foreground">Sales this month</div><div className="text-[9px] text-muted-foreground mt-1">18 purchases</div></div></SectionCard>
          </div>
          <SectionCard title="Monetization Settings">
            <div className="space-y-3 text-[10px]">
              <label className="flex items-center justify-between cursor-pointer"><span>Enable paid subscriptions</span><input type="checkbox" defaultChecked className="accent-accent" /></label>
              <label className="flex items-center justify-between cursor-pointer"><span>Accept donations</span><input type="checkbox" defaultChecked className="accent-accent" /></label>
              <label className="flex items-center justify-between cursor-pointer"><span>Premium episodes</span><input type="checkbox" className="accent-accent" /></label>
              <label className="flex items-center justify-between cursor-pointer"><span>Ad insertion</span><input type="checkbox" className="accent-accent" /></label>
            </div>
          </SectionCard>
        </div>
      )}

      {tab === 'settings' && (
        <SectionCard title="Show Settings">
          <div className="space-y-3">
            <div><label className="text-[10px] font-medium block mb-1">Show Title</label><Input defaultValue="AI Frontiers" className="h-9 text-sm" /></div>
            <div><label className="text-[10px] font-medium block mb-1">Description</label><Textarea defaultValue="Weekly deep dives into the latest AI research..." className="min-h-[80px] text-sm" /></div>
            <div><label className="text-[10px] font-medium block mb-1">RSS Feed URL</label><Input defaultValue="https://feeds.gigvora.com/ai-frontiers" disabled className="h-9 text-sm" /></div>
            <Button size="sm" className="h-8 text-[10px]">Save Changes</Button>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
