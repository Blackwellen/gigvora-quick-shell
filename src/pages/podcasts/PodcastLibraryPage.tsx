import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Library, Play, Clock, Download, Heart, ListMusic, Bookmark, History, DollarSign, CreditCard } from 'lucide-react';

const QUEUE = [
  { title: 'The State of LLM Fine-Tuning', show: 'AI Frontiers', duration: '38 min', added: 'Today' },
  { title: 'React 21 Deep Dive', show: 'Code Review Radio', duration: '55 min', added: 'Yesterday' },
  { title: 'Salary Negotiation Tips', show: 'The Freelance Hour', duration: '42 min', added: '2d ago' },
];

const HISTORY = [
  { title: 'Why AI Agents Will Replace SaaS', show: 'AI Frontiers', duration: '42 min', played: '2h ago', progress: 83 },
  { title: 'Design Systems at Scale', show: 'Design Matters', duration: '48 min', played: 'Yesterday', progress: 100 },
  { title: 'Remote Team Culture', show: 'The Freelance Hour', duration: '35 min', played: '3d ago', progress: 100 },
];

const SUBSCRIPTIONS = [
  { title: 'AI Frontiers', host: 'Dr. Raj Patel', image: '🤖', newEps: 2 },
  { title: 'Code Review Radio', host: 'Mike Liu', image: '📻', newEps: 1 },
  { title: 'Design Matters', host: 'Debbie Millman', image: '🎨', newEps: 0 },
  { title: 'The Freelance Hour', host: 'James Rivera', image: '💼', newEps: 3 },
];

const PURCHASES = [
  { title: 'AI Masterclass Series', type: 'Premium Series', price: '$29.99', date: 'Mar 15, 2026', episodes: 12 },
  { title: 'Startup Playbook Audio', type: 'Audiobook', price: '$14.99', date: 'Feb 28, 2026', episodes: 8 },
];

export default function PodcastLibraryPage() {
  const [tab, setTab] = useState('queue');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Library className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">My Library</h1>
          <KPICard label="Queue" value={String(QUEUE.length)} />
          <KPICard label="Subscriptions" value={String(SUBSCRIPTIONS.length)} />
          <KPICard label="Downloads" value="14" />
          <KPICard label="Purchases" value={String(PURCHASES.length)} />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="queue" className="text-[10px] px-3 gap-1"><ListMusic className="h-3 w-3" /> Queue</TabsTrigger>
          <TabsTrigger value="history" className="text-[10px] px-3 gap-1"><History className="h-3 w-3" /> History</TabsTrigger>
          <TabsTrigger value="subscriptions" className="text-[10px] px-3 gap-1"><Bookmark className="h-3 w-3" /> Subscriptions</TabsTrigger>
          <TabsTrigger value="downloads" className="text-[10px] px-3 gap-1"><Download className="h-3 w-3" /> Downloads</TabsTrigger>
          <TabsTrigger value="purchases" className="text-[10px] px-3 gap-1"><DollarSign className="h-3 w-3" /> Purchases</TabsTrigger>
          <TabsTrigger value="donations" className="text-[10px] px-3 gap-1"><Heart className="h-3 w-3" /> Donations</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'queue' && (
        <SectionCard title="Up Next" subtitle={`${QUEUE.length} episodes`}>
          {QUEUE.map((ep, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <span className="text-[10px] text-muted-foreground w-4 text-center">{i + 1}</span>
              <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-full shrink-0"><Play className="h-3.5 w-3.5" /></Button>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium">{ep.title}</div>
                <div className="text-[9px] text-muted-foreground">{ep.show} · <Clock className="h-2.5 w-2.5 inline" /> {ep.duration}</div>
              </div>
              <span className="text-[8px] text-muted-foreground">{ep.added}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'history' && (
        <SectionCard title="Recently Played">
          {HISTORY.map((ep, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full shrink-0"><Play className="h-3.5 w-3.5" /></Button>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium">{ep.title}</div>
                <div className="text-[9px] text-muted-foreground">{ep.show} · {ep.duration}</div>
                <div className="w-full max-w-[120px] mt-1"><div className="h-1 bg-muted rounded-full overflow-hidden"><div className="h-full bg-accent rounded-full" style={{ width: `${ep.progress}%` }} /></div></div>
              </div>
              <span className="text-[8px] text-muted-foreground">{ep.played}</span>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'subscriptions' && (
        <SectionCard title="Subscribed Shows">
          {SUBSCRIPTIONS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">{s.image}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold">{s.title}</div>
                <div className="text-[9px] text-muted-foreground">{s.host}</div>
              </div>
              {s.newEps > 0 && <Badge className="text-[8px] h-4 bg-accent/10 text-accent border-0">{s.newEps} new</Badge>}
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'downloads' && (
        <SectionCard title="Downloaded Episodes" subtitle="Available offline">
          <div className="text-center py-8 text-muted-foreground">
            <Download className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-[10px]">14 episodes downloaded</p>
            <p className="text-[9px]">1.2 GB total</p>
          </div>
        </SectionCard>
      )}

      {tab === 'purchases' && (
        <SectionCard title="Purchased Content">
          {PURCHASES.map((p, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <CreditCard className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium">{p.title}</div>
                <div className="text-[9px] text-muted-foreground">{p.type} · {p.episodes} episodes</div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[10px] font-semibold">{p.price}</div>
                <div className="text-[8px] text-muted-foreground">{p.date}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'donations' && (
        <SectionCard title="Your Donations" subtitle="Support creators you love">
          {[
            { show: 'AI Frontiers', amount: '$5.00', date: 'Apr 10, 2026', recurring: true },
            { show: 'Code Review Radio', amount: '$10.00', date: 'Mar 22, 2026', recurring: false },
          ].map((d, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <Heart className="h-4 w-4 text-[hsl(var(--destructive))] shrink-0" />
              <div className="flex-1"><div className="text-[11px] font-medium">{d.show}</div><div className="text-[9px] text-muted-foreground">{d.date}</div></div>
              <div className="text-right">
                <div className="text-[10px] font-semibold">{d.amount}</div>
                {d.recurring && <Badge variant="secondary" className="text-[7px] h-3.5">Monthly</Badge>}
              </div>
            </div>
          ))}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
