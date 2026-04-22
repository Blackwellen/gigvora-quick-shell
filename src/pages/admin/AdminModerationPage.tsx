import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  ShieldAlert, Eye, Flag, CheckCircle2, XCircle, AlertTriangle,
  Clock, MessageSquare, Image, Video, FileText, Users, Bell,
  Trash2, Ban, MoreHorizontal, ExternalLink, Search, Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

type MStatus = 'pending' | 'reviewing' | 'approved' | 'removed' | 'escalated';

interface FlaggedItem {
  id: string; type: 'post' | 'comment' | 'profile' | 'gig' | 'media';
  title: string; author: string; reason: string;
  status: MStatus; reports: number; flagged: string;
  aiSeverity?: 'low' | 'medium' | 'high' | 'critical';
  views?: number;
}

const STATUS_CLS: Record<MStatus, string> = {
  pending: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  reviewing: 'bg-accent/10 text-accent',
  approved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  removed: 'bg-destructive/10 text-destructive',
  escalated: 'bg-[hsl(var(--state-live))]/10 text-[hsl(var(--state-live))]',
};

const SEV_CLS: Record<string, string> = {
  low: 'text-muted-foreground', medium: 'text-[hsl(var(--gigvora-amber))]',
  high: 'text-[hsl(var(--state-live))]', critical: 'text-destructive',
};

const TYPE_ICON: Record<string, React.ElementType> = {
  post: FileText, comment: MessageSquare, profile: Users, gig: Eye, media: Image,
};

const ITEMS: FlaggedItem[] = [
  { id: 'MOD-1105', type: 'post', title: 'Flagged post containing hate speech', author: 'Anonymous42', reason: 'Hate Speech', status: 'pending', reports: 8, flagged: '5 min ago', aiSeverity: 'critical', views: 1240 },
  { id: 'MOD-1102', type: 'comment', title: 'Spam comment with external links', author: 'SpamBot99', reason: 'Spam', status: 'pending', reports: 12, flagged: '20 min ago', aiSeverity: 'high' },
  { id: 'MOD-1099', type: 'profile', title: 'Impersonation — claiming to be a celebrity', author: 'TotallyRealCEO', reason: 'Impersonation', status: 'reviewing', reports: 3, flagged: '1 hour ago', aiSeverity: 'high' },
  { id: 'MOD-1095', type: 'gig', title: 'Gig listing with misleading promises', author: 'QuickCash Pro', reason: 'Misleading Content', status: 'reviewing', reports: 5, flagged: '2 hours ago', aiSeverity: 'medium', views: 890 },
  { id: 'MOD-1092', type: 'media', title: 'Uploaded video with copyright content', author: 'ContentKing', reason: 'Copyright', status: 'escalated', reports: 2, flagged: '3 hours ago', aiSeverity: 'medium', views: 3400 },
  { id: 'MOD-1088', type: 'post', title: 'Political misinformation post', author: 'TruthSeeker', reason: 'Misinformation', status: 'removed', reports: 15, flagged: '6 hours ago', aiSeverity: 'high', views: 5600 },
  { id: 'MOD-1085', type: 'comment', title: 'Harassment in group discussion', author: 'AngryUser', reason: 'Harassment', status: 'approved', reports: 1, flagged: '1 day ago', aiSeverity: 'low' },
];

export default function AdminModerationPage() {
  const [tab, setTab] = useState('all');

  const filtered = ITEMS.filter(item => {
    if (tab === 'all') return true;
    if (tab === 'action-needed') return ['pending', 'reviewing', 'escalated'].includes(item.status);
    return item.status === tab;
  });

  return (
    <DashboardLayout topStrip={
      <>
        <ShieldAlert className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Content Moderation</span>
        <div className="flex-1" />
        <Badge className="text-[9px] bg-destructive/10 text-destructive border-0">{ITEMS.filter(i => i.status === 'pending').length} Pending</Badge>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Bell className="h-3 w-3" /> Alerts</Button>
      </>
    } rightRail={
      <div className="space-y-3">
        <SectionCard title="AI Detection">
          <div className="space-y-1.5 text-[9px]">
            <div className="flex justify-between"><span className="text-muted-foreground">Auto-Flagged (24h)</span><span className="font-bold">42</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">User Reports (24h)</span><span className="font-bold">28</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">AI Accuracy</span><span className="font-bold text-[hsl(var(--state-healthy))]">94.2%</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">False Positives</span><span className="font-bold text-[hsl(var(--gigvora-amber))]">5.8%</span></div>
          </div>
        </SectionCard>
        <SectionCard title="Reason Breakdown">
          <div className="space-y-1.5">
            {[{ reason: 'Spam', count: 18 }, { reason: 'Hate Speech', count: 8 }, { reason: 'Harassment', count: 6 }, { reason: 'Misleading', count: 5 }, { reason: 'Copyright', count: 4 }, { reason: 'Other', count: 3 }].map(r => (
              <div key={r.reason} className="flex items-center justify-between text-[9px]">
                <span className="text-muted-foreground">{r.reason}</span>
                <span className="font-semibold">{r.count}</span>
              </div>
            ))}
          </div>
        </SectionCard>
        <SectionCard title="Quick Actions">
          <div className="space-y-1.5">
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><Search className="h-3 w-3" /> Search Content</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><Flag className="h-3 w-3" /> View Reports</Button>
            <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl justify-start gap-1"><Ban className="h-3 w-3" /> Banned Users</Button>
          </div>
        </SectionCard>
      </div>
    } rightRailWidth="w-52">
      <div className="flex items-center gap-3 flex-wrap rounded-2xl border bg-card px-5 py-3 shadow-card mb-4">
        <KPICard label="Pending" value={String(ITEMS.filter(i => i.status === 'pending').length)} />
        <KPICard label="Reviewing" value={String(ITEMS.filter(i => i.status === 'reviewing').length)} />
        <KPICard label="Removed (24h)" value="14" />
        <KPICard label="Escalated" value={String(ITEMS.filter(i => i.status === 'escalated').length)} />
        <KPICard label="Avg Response" value="18m" />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-7">
          {['all', 'action-needed', 'pending', 'reviewing', 'escalated', 'removed', 'approved'].map(t => (
            <TabsTrigger key={t} value={t} className="text-[9px] h-5 px-2 capitalize">{t.replace('-', ' ')}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="space-y-2">
        {filtered.map(item => {
          const TypeIcon = TYPE_ICON[item.type] || FileText;
          return (
            <div key={item.id} className="p-4 rounded-2xl border border-border/30 bg-card hover:border-accent/30 transition-all">
              <div className="flex items-center gap-3">
                <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center shrink-0', STATUS_CLS[item.status])}>
                  <TypeIcon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold truncate">{item.title}</span>
                    <Badge className={cn('text-[7px] h-3.5 border-0 capitalize', STATUS_CLS[item.status])}>{item.status}</Badge>
                    <Badge variant="outline" className="text-[7px] h-3.5 capitalize">{item.type}</Badge>
                    {item.aiSeverity && (
                      <span className={cn('text-[8px] font-semibold flex items-center gap-0.5', SEV_CLS[item.aiSeverity])}>
                        <Sparkles className="h-2.5 w-2.5" /> {item.aiSeverity}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span className="font-mono">{item.id}</span>
                    <span>by {item.author}</span>
                    <span>{item.reason}</span>
                    <span className="flex items-center gap-0.5"><Flag className="h-2.5 w-2.5" /> {item.reports} reports</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{item.flagged}</span>
                    {item.views && <span className="flex items-center gap-0.5"><Eye className="h-2.5 w-2.5" />{item.views.toLocaleString()} views</span>}
                  </div>
                </div>
                {(item.status === 'pending' || item.status === 'reviewing') && (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><Eye className="h-3 w-3" /> Review</Button>
                    <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5"><CheckCircle2 className="h-3 w-3" /> Approve</Button>
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5 text-destructive"><Trash2 className="h-3 w-3" /> Remove</Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
