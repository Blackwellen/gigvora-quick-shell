import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { User, Mic, Users, Star, Headphones, Heart, ExternalLink, Globe, Play, Clock } from 'lucide-react';

const SHOWS = [
  { title: 'AI Frontiers', episodes: 48, listeners: '12.4K', rating: 4.9, image: '🤖' },
  { title: 'Tech Talks Unplugged', episodes: 24, listeners: '5.2K', rating: 4.7, image: '🎙️' },
];

const RECENT = [
  { title: 'Why AI Agents Will Replace SaaS', show: 'AI Frontiers', date: 'May 12, 2026', plays: '4.2K' },
  { title: 'The Future of Developer Tools', show: 'Tech Talks Unplugged', date: 'May 8, 2026', plays: '1.8K' },
  { title: 'The State of LLM Fine-Tuning', show: 'AI Frontiers', date: 'May 5, 2026', plays: '3.1K' },
];

export default function PodcastHostProfilePage() {
  const topStrip = (
    <>
      <User className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Host Profile</span>
      <div className="flex-1" />
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Links" className="!rounded-2xl">
        <div className="space-y-1.5">
          {[{ label: 'Website', url: 'rajpatel.ai' }, { label: 'Twitter', url: '@drrajpatel' }, { label: 'LinkedIn', url: 'linkedin.com/in/rajpatel' }].map(l => (
            <div key={l.label} className="flex items-center gap-1.5 text-[9px]">
              <Globe className="h-2.5 w-2.5 text-muted-foreground" />
              <span className="text-muted-foreground">{l.label}:</span>
              <span className="text-accent cursor-pointer hover:underline">{l.url}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Expertise" className="!rounded-2xl">
        <div className="flex flex-wrap gap-1">
          {['AI/ML', 'React', 'System Design', 'Leadership', 'Startups'].map(t => <Badge key={t} variant="outline" className="text-[7px] h-4 rounded-md">{t}</Badge>)}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-44">
      <SectionCard className="!rounded-2xl mb-3">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 rounded-2xl"><AvatarFallback className="rounded-2xl bg-accent/10 text-accent text-lg">RP</AvatarFallback></Avatar>
          <div className="flex-1">
            <div className="text-[16px] font-bold">Dr. Raj Patel</div>
            <div className="text-[10px] text-muted-foreground mb-2">AI Researcher & Podcast Host · San Francisco, CA</div>
            <div className="text-[9px] text-muted-foreground leading-relaxed mb-3">
              AI researcher and educator passionate about making complex technology accessible. Host of AI Frontiers, one of the top-rated AI podcasts. Previously led ML teams at major tech companies.
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Heart className="h-3 w-3" />Follow</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Heart className="h-3 w-3" />Donate</Button>
            </div>
          </div>
        </div>
      </SectionCard>

      <KPIBand className="mb-3">
        <KPICard label="Shows" value={String(SHOWS.length)} className="!rounded-2xl" />
        <KPICard label="Episodes" value="72" className="!rounded-2xl" />
        <KPICard label="Listeners" value="17.6K" className="!rounded-2xl" />
        <KPICard label="Avg Rating" value="4.8" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <SectionCard title="Shows" icon={<Mic className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          {SHOWS.map(s => (
            <div key={s.title} className="flex items-center gap-2.5 py-2.5 border-b border-border/30 last:border-0 cursor-pointer hover:bg-muted/30 rounded-lg px-1 transition-colors">
              <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-lg shrink-0">{s.image}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold">{s.title}</div>
                <div className="text-[8px] text-muted-foreground">{s.episodes} episodes · {s.listeners} listeners</div>
              </div>
              <div className="flex items-center gap-0.5 text-[8px]"><Star className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />{s.rating}</div>
            </div>
          ))}
        </SectionCard>

        <SectionCard title="Recent Episodes" icon={<Play className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          {RECENT.map((ep, i) => (
            <div key={i} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-lg shrink-0"><Play className="h-3 w-3" /></Button>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium truncate">{ep.title}</div>
                <div className="text-[8px] text-muted-foreground">{ep.show} · {ep.date}</div>
              </div>
              <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Headphones className="h-2.5 w-2.5" />{ep.plays}</span>
            </div>
          ))}
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
