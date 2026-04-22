import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bookmark, Bell, BellOff, Download, Rss, ExternalLink } from 'lucide-react';

const SUBS = [
  { title: 'AI Frontiers', host: 'Dr. Raj Patel', image: '🤖', newEps: 2, totalEps: 48, autoDownload: true, notifications: true },
  { title: 'Code Review Radio', host: 'Mike Liu', image: '📻', newEps: 1, totalEps: 120, autoDownload: true, notifications: true },
  { title: 'Design Matters', host: 'Debbie Millman', image: '🎨', newEps: 0, totalEps: 450, autoDownload: false, notifications: true },
  { title: 'The Freelance Hour', host: 'James Rivera', image: '💼', newEps: 3, totalEps: 85, autoDownload: true, notifications: false },
  { title: 'Startup Stories', host: 'Alex Kim', image: '🚀', newEps: 0, totalEps: 64, autoDownload: false, notifications: false },
];

export default function PodcastSubscriptionsPage() {
  return (
    <DashboardLayout topStrip={<><Bookmark className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Subscriptions</span><div className="flex-1" /><KPICard label="Subscriptions" value={String(SUBS.length)} /><KPICard label="New Episodes" value={String(SUBS.reduce((s, sub) => s + sub.newEps, 0))} /><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Rss className="h-3 w-3" />Import RSS</Button></>}>
      <KPIBand className="mb-3">
        <KPICard label="Shows" value={String(SUBS.length)} className="!rounded-2xl" />
        <KPICard label="New Episodes" value={String(SUBS.reduce((s, sub) => s + sub.newEps, 0))} className="!rounded-2xl" />
        <KPICard label="Auto-Download" value={String(SUBS.filter(s => s.autoDownload).length)} className="!rounded-2xl" />
        <KPICard label="Total Episodes" value={String(SUBS.reduce((s, sub) => s + sub.totalEps, 0))} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {SUBS.map(s => (
          <div key={s.title} className="rounded-2xl border bg-card p-3.5 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-muted flex items-center justify-center text-xl shrink-0">{s.image}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold">{s.title}</span>
                  {s.newEps > 0 && <Badge className="text-[7px] h-4 bg-accent/10 text-accent border-0 rounded-lg">{s.newEps} new</Badge>}
                </div>
                <div className="text-[9px] text-muted-foreground">{s.host} · {s.totalEps} episodes</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[7px] h-3.5 rounded-md gap-0.5">{s.autoDownload ? <><Download className="h-2 w-2" />Auto</> : 'Manual'}</Badge>
                  <Badge variant="outline" className="text-[7px] h-3.5 rounded-md gap-0.5">{s.notifications ? <><Bell className="h-2 w-2" />On</> : <><BellOff className="h-2 w-2" />Off</>}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-lg gap-0.5"><ExternalLink className="h-2.5 w-2.5" />View</Button>
                <Button variant="ghost" size="sm" className="h-7 text-[8px] rounded-lg text-destructive">Unsubscribe</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
