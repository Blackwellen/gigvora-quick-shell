import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  FolderOpen, StickyNote, ArrowRightLeft, Link2, MessageCircle, Eye, Lock,
  Users, Plus, Search, Filter, MoreHorizontal, ChevronRight, Clock, CheckCircle2,
  AlertTriangle, Star, Pin, Archive, Download, ExternalLink, Settings, X,
  FileText, Hash, AtSign, Bell, Paperclip, Globe, Shield, History, RefreshCw,
  Bookmark, Send, Layers, GitBranch,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/contexts/RoleContext';

type WsTab = 'workspaces' | 'notes' | 'handoffs' | 'linked' | 'discussions' | 'watchers' | 'visibility' | 'mobile';

interface Workspace {
  id: string; name: string; desc: string; members: string[]; dept: string;
  status: 'active' | 'archived' | 'restricted'; visibility: 'shared' | 'private';
  lastActivity: string; notesCount: number; filesCount: number; pinnedBy: number;
}

interface Note {
  id: string; title: string; author: string; workspace: string; content: string;
  visibility: 'shared' | 'private' | 'team-only'; status: 'draft' | 'published' | 'archived';
  updatedAt: string; tags: string[]; pinned: boolean; mentions: string[];
}

interface Handoff {
  id: string; title: string; from: string; to: string; workspace: string;
  status: 'pending' | 'accepted' | 'completed' | 'rejected' | 'expired';
  priority: 'high' | 'medium' | 'low'; createdAt: string; dueDate: string;
  linkedItems: string[]; notes: string;
}

interface Discussion {
  id: string; title: string; workspace: string; author: string; replies: number;
  lastReply: string; status: 'open' | 'resolved' | 'pinned'; tags: string[];
}

const WORKSPACES: Workspace[] = [
  { id: 'ws1', name: 'Product Launch Q2', desc: 'Cross-team coordination for Q2 product release', members: ['Olivia M', 'Liam C', 'Sophia W', 'Noah P'], dept: 'Product', status: 'active', visibility: 'shared', lastActivity: '5 min ago', notesCount: 24, filesCount: 12, pinnedBy: 3 },
  { id: 'ws2', name: 'Engineering Sprint 14', desc: 'Current sprint planning and standups', members: ['Liam C', 'Aiden K', 'Lucas G'], dept: 'Engineering', status: 'active', visibility: 'shared', lastActivity: '15 min ago', notesCount: 18, filesCount: 8, pinnedBy: 2 },
  { id: 'ws3', name: 'Client Onboarding — Acme', desc: 'Onboarding workspace for Acme Corp', members: ['Sophia W', 'Emma J', 'Mia T'], dept: 'Operations', status: 'active', visibility: 'shared', lastActivity: '1 hr ago', notesCount: 31, filesCount: 15, pinnedBy: 4 },
  { id: 'ws4', name: 'Design System v3', desc: 'Design system migration and docs', members: ['Noah P', 'Isabella B'], dept: 'Design', status: 'active', visibility: 'shared', lastActivity: '2 hrs ago', notesCount: 12, filesCount: 22, pinnedBy: 1 },
  { id: 'ws5', name: 'Sales Pipeline Review', desc: 'Weekly pipeline review notes', members: ['Mia T', 'Charlotte M'], dept: 'Sales', status: 'active', visibility: 'private', lastActivity: '3 hrs ago', notesCount: 9, filesCount: 3, pinnedBy: 0 },
  { id: 'ws6', name: 'Q1 Retrospective', desc: 'Archived Q1 retro workspace', members: ['Olivia M', 'Liam C', 'Sophia W'], dept: 'Executive', status: 'archived', visibility: 'shared', lastActivity: '3 months ago', notesCount: 14, filesCount: 5, pinnedBy: 0 },
  { id: 'ws7', name: 'HR Policy Updates', desc: 'Internal policy review — restricted', members: ['Olivia M'], dept: 'Legal', status: 'restricted', visibility: 'private', lastActivity: '1 week ago', notesCount: 6, filesCount: 2, pinnedBy: 0 },
];

const NOTES: Note[] = [
  { id: 'n1', title: 'Sprint 14 Goals & Blockers', author: 'Liam C', workspace: 'Engineering Sprint 14', content: 'Key objectives for sprint 14...', visibility: 'shared', status: 'published', updatedAt: '15 min ago', tags: ['sprint', 'planning'], pinned: true, mentions: ['Aiden K', 'Lucas G'] },
  { id: 'n2', title: 'Client Requirements — Acme Phase 2', author: 'Sophia W', workspace: 'Client Onboarding — Acme', content: 'Phase 2 requirements gathering notes...', visibility: 'team-only', status: 'published', updatedAt: '1 hr ago', tags: ['client', 'requirements'], pinned: true, mentions: ['Emma J'] },
  { id: 'n3', title: 'Launch Checklist', author: 'Olivia M', workspace: 'Product Launch Q2', content: 'Pre-launch checklist items...', visibility: 'shared', status: 'published', updatedAt: '2 hrs ago', tags: ['launch', 'checklist'], pinned: false, mentions: ['Noah P', 'Liam C'] },
  { id: 'n4', title: 'Design Token Migration Plan', author: 'Noah P', workspace: 'Design System v3', content: 'Token migration strategy...', visibility: 'shared', status: 'draft', updatedAt: '3 hrs ago', tags: ['design', 'migration'], pinned: false, mentions: [] },
  { id: 'n5', title: 'Competitive Analysis Notes', author: 'Mia T', workspace: 'Sales Pipeline Review', content: 'Competitor pricing review...', visibility: 'private', status: 'published', updatedAt: '1 day ago', tags: ['sales', 'analysis'], pinned: false, mentions: [] },
  { id: 'n6', title: 'Q1 Lessons Learned', author: 'Olivia M', workspace: 'Q1 Retrospective', content: 'Key takeaways from Q1...', visibility: 'shared', status: 'archived', updatedAt: '3 months ago', tags: ['retro'], pinned: false, mentions: [] },
];

const HANDOFFS: Handoff[] = [
  { id: 'h1', title: 'API Integration — Acme', from: 'Sophia W', to: 'Liam C', workspace: 'Client Onboarding — Acme', status: 'pending', priority: 'high', createdAt: '2 hrs ago', dueDate: 'Tomorrow', linkedItems: ['Acme Onboarding Doc', 'API Specs'], notes: 'Backend integration needs review before handoff to engineering' },
  { id: 'h2', title: 'Design Specs for Feature X', from: 'Noah P', to: 'Aiden K', workspace: 'Product Launch Q2', status: 'accepted', priority: 'medium', createdAt: '1 day ago', dueDate: 'Apr 18', linkedItems: ['Figma Link', 'Requirements Doc'], notes: 'Final designs ready for implementation' },
  { id: 'h3', title: 'Sales Deck Review', from: 'Mia T', to: 'Olivia M', workspace: 'Sales Pipeline Review', status: 'completed', priority: 'low', createdAt: '3 days ago', dueDate: 'Apr 14', linkedItems: ['Sales Deck v3'], notes: 'Approved with minor edits' },
  { id: 'h4', title: 'Security Audit Findings', from: 'Liam C', to: 'Sophia W', workspace: 'Engineering Sprint 14', status: 'pending', priority: 'high', createdAt: '4 hrs ago', dueDate: 'Apr 16', linkedItems: ['Audit Report'], notes: 'Critical findings need ops review' },
  { id: 'h5', title: 'Content Migration Signoff', from: 'Isabella B', to: 'Noah P', workspace: 'Design System v3', status: 'rejected', priority: 'medium', createdAt: '2 days ago', dueDate: 'Apr 15', linkedItems: ['Content Inventory'], notes: 'Needs revision — missing 12 components' },
  { id: 'h6', title: 'Budget Approval — Q2 Tools', from: 'Charlotte M', to: 'Olivia M', workspace: 'Product Launch Q2', status: 'expired', priority: 'medium', createdAt: '2 weeks ago', dueDate: 'Apr 5', linkedItems: ['Budget Sheet'], notes: 'Expired — needs resubmission' },
];

const DISCUSSIONS: Discussion[] = [
  { id: 'd1', title: 'Should we migrate to the new API version?', workspace: 'Engineering Sprint 14', author: 'Liam C', replies: 8, lastReply: '10 min ago', status: 'open', tags: ['api', 'decision'] },
  { id: 'd2', title: 'Acme onboarding timeline concerns', workspace: 'Client Onboarding — Acme', author: 'Sophia W', replies: 5, lastReply: '45 min ago', status: 'open', tags: ['client', 'timeline'] },
  { id: 'd3', title: 'Launch date — are we on track?', workspace: 'Product Launch Q2', author: 'Olivia M', replies: 12, lastReply: '2 hrs ago', status: 'pinned', tags: ['launch', 'milestone'] },
  { id: 'd4', title: 'Token naming convention resolved', workspace: 'Design System v3', author: 'Noah P', replies: 6, lastReply: '1 day ago', status: 'resolved', tags: ['design', 'resolved'] },
];

const HANDOFF_STATUS: Record<string, { badge: 'pending' | 'healthy' | 'blocked' | 'caution' | 'live'; label: string }> = {
  pending: { badge: 'pending', label: 'Pending' }, accepted: { badge: 'healthy', label: 'Accepted' },
  completed: { badge: 'healthy', label: 'Completed' }, rejected: { badge: 'blocked', label: 'Rejected' }, expired: { badge: 'caution', label: 'Expired' },
};
const PRIORITY_COLORS: Record<string, string> = { high: 'text-[hsl(var(--state-blocked))]', medium: 'text-accent', low: 'text-muted-foreground' };

const SharedWorkspacesPage: React.FC = () => {
  const { activeRole } = useRole();
  const [tab, setTab] = useState<WsTab>('workspaces');
  const [selectedWs, setSelectedWs] = useState<Workspace | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [searchQ, setSearchQ] = useState('');
  const [filterVis, setFilterVis] = useState<string>('all');
  const [createDrawer, setCreateDrawer] = useState(false);
  const [noteDrawer, setNoteDrawer] = useState(false);
  const [handoffDrawer, setHandoffDrawer] = useState(false);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailItem, setDetailItem] = useState<{ type: string; title: string; detail: string } | null>(null);

  const openDetail = (type: string, title: string, detail: string) => { setDetailItem({ type, title, detail }); setDetailDrawer(true); };

  const topStrip = (
    <>
      <FolderOpen className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Shared Workspaces · Collaboration</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <Badge variant="outline" className="text-[7px]">{WORKSPACES.filter(w => w.status === 'active').length} active workspaces</Badge>
      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setCreateDrawer(true)}><Plus className="h-3 w-3" />New Workspace</Button>
      <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setNoteDrawer(true)}><StickyNote className="h-3 w-3" />New Note</Button>
    </>
  );

  const rightRail = selectedWs ? (
    <div className="space-y-3">
      <SectionCard title="Workspace" icon={<FolderOpen className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="text-[11px] font-semibold">{selectedWs.name}</div>
          <div className="text-[8px] text-muted-foreground">{selectedWs.desc}</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Department</span><span>{selectedWs.dept}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={selectedWs.status === 'active' ? 'healthy' : selectedWs.status === 'archived' ? 'pending' : 'blocked'} label={selectedWs.status} /></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Visibility</span><span className="flex items-center gap-1">{selectedWs.visibility === 'private' ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}{selectedWs.visibility}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Last Activity</span><span>{selectedWs.lastActivity}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Notes</span><span>{selectedWs.notesCount}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Files</span><span>{selectedWs.filesCount}</span></div>
        </div>
        <div className="mt-2 pt-2 border-t">
          <div className="text-[8px] text-muted-foreground mb-1">Members</div>
          <div className="flex -space-x-2">{selectedWs.members.slice(0, 5).map(m => <Avatar key={m} className="h-6 w-6 border-2 border-background"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{m.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>)}</div>
        </div>
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => setNoteDrawer(true)}><StickyNote className="h-3 w-3" />Add Note</Button>
          <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => setHandoffDrawer(true)}><ArrowRightLeft className="h-3 w-3" />Create Handoff</Button>
          <Link to="/inbox"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><MessageCircle className="h-3 w-3" />Open Discussion</Button></Link>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => toast.info('Pinned')}><Pin className="h-3 w-3" />Pin Workspace</Button>
          {selectedWs.status === 'active' && <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl text-muted-foreground" onClick={() => toast.info('Archive flow')}><Archive className="h-3 w-3" />Archive</Button>}
        </div>
      </SectionCard>
    </div>
  ) : selectedNote ? (
    <div className="space-y-3">
      <SectionCard title="Note Detail" icon={<StickyNote className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="text-[11px] font-semibold">{selectedNote.title}</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Author</span><span>{selectedNote.author}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Workspace</span><span>{selectedNote.workspace}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Visibility</span><span className="flex items-center gap-1">{selectedNote.visibility === 'private' ? <Lock className="h-2.5 w-2.5" /> : <Globe className="h-2.5 w-2.5" />}{selectedNote.visibility}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="secondary" className="text-[6px]">{selectedNote.status}</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Updated</span><span>{selectedNote.updatedAt}</span></div>
          {selectedNote.mentions.length > 0 && <div><span className="text-muted-foreground">Mentions:</span> {selectedNote.mentions.join(', ')}</div>}
          <div className="flex flex-wrap gap-1 mt-1">{selectedNote.tags.map(t => <Badge key={t} variant="outline" className="text-[6px]"><Hash className="h-2 w-2 mr-0.5" />{t}</Badge>)}</div>
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Activity" icon={<Clock className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { text: 'Liam C updated Sprint 14 Goals', time: '15 min ago' },
            { text: 'Sophia W created handoff for Acme API', time: '2 hrs ago' },
            { text: 'Noah P shared Design Token Plan', time: '3 hrs ago' },
            { text: 'Olivia M pinned Launch Checklist', time: '5 hrs ago' },
          ].map((a, i) => (
            <div key={i} className="text-[8px] flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted/20 cursor-pointer" onClick={() => openDetail('activity', a.text, a.time)}>
              <div className="h-1.5 w-1.5 rounded-full bg-accent shrink-0" />
              <span className="flex-1">{a.text}</span>
              <span className="text-muted-foreground shrink-0">{a.time}</span>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Pending Handoffs" icon={<ArrowRightLeft className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {HANDOFFS.filter(h => h.status === 'pending').map(h => (
            <div key={h.id} className="text-[8px] flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted/20 cursor-pointer" onClick={() => openDetail('handoff', h.title, `${h.from} → ${h.to}`)}>
              <span className={cn('font-semibold', PRIORITY_COLORS[h.priority])}>●</span>
              <span className="flex-1 truncate">{h.title}</span>
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Pinned Notes" icon={<Pin className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {NOTES.filter(n => n.pinned).map(n => (
            <div key={n.id} className="text-[8px] flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted/20 cursor-pointer" onClick={() => setSelectedNote(n)}>
              <StickyNote className="h-2.5 w-2.5 text-accent shrink-0" />
              <span className="flex-1 truncate">{n.title}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Cross-Team Activity Feed</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {[
          { actor: 'Sophia W', action: 'accepted handoff', target: 'API Integration — Acme', time: '30 min ago' },
          { actor: 'Liam C', action: 'published note', target: 'Sprint 14 Goals', time: '1 hr ago' },
          { actor: 'Noah P', action: 'created discussion', target: 'Token naming convention', time: '3 hrs ago' },
          { actor: 'Olivia M', action: 'archived workspace', target: 'Q1 Retrospective', time: '1 day ago' },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-xl border bg-card text-[8px]">
            <GitBranch className="h-3 w-3 text-accent shrink-0" />
            <div><div className="font-medium">{e.actor}: {e.action}</div><div className="text-muted-foreground">{e.target} · {e.time}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'workspaces' as const, label: 'Workspaces', icon: FolderOpen },
          { key: 'notes' as const, label: 'Notes', icon: StickyNote },
          { key: 'handoffs' as const, label: 'Handoffs', icon: ArrowRightLeft },
          { key: 'linked' as const, label: 'Linked Records', icon: Link2 },
          { key: 'discussions' as const, label: 'Discussions', icon: MessageCircle },
          { key: 'watchers' as const, label: 'Watchers', icon: Eye },
          { key: 'visibility' as const, label: 'Visibility', icon: Shield },
          { key: 'mobile' as const, label: 'Summary', icon: Layers },
        ]).map(w => (
          <button key={w.key} onClick={() => { setTab(w.key); setSelectedWs(null); setSelectedNote(null); }} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0',
            tab === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}><w.icon className="h-3 w-3" />{w.label}</button>
        ))}
      </div>

      {/* ═══ WORKSPACES ═══ */}
      {tab === 'workspaces' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Workspaces" value={String(WORKSPACES.length)} />
            <KPICard label="Active" value={String(WORKSPACES.filter(w => w.status === 'active').length)} />
            <KPICard label="Total Notes" value={String(NOTES.length)} />
            <KPICard label="Pending Handoffs" value={String(HANDOFFS.filter(h => h.status === 'pending').length)} change="Action needed" />
          </KPIBand>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[160px] max-w-xs"><Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><input value={searchQ} onChange={e => setSearchQ(e.target.value)} className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[9px]" placeholder="Search workspaces..." /></div>
            <select value={filterVis} onChange={e => setFilterVis(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="all">All Visibility</option><option value="shared">Shared</option><option value="private">Private</option></select>
            {(filterVis !== 'all' || searchQ) && <Button variant="ghost" size="sm" className="h-7 text-[8px] gap-1 rounded-xl" onClick={() => { setFilterVis('all'); setSearchQ(''); }}><X className="h-3 w-3" />Clear</Button>}
          </div>
          <div className="space-y-1.5">
            {WORKSPACES.filter(w => {
              if (filterVis !== 'all' && w.visibility !== filterVis) return false;
              if (searchQ && !w.name.toLowerCase().includes(searchQ.toLowerCase())) return false;
              return true;
            }).map(w => (
              <div key={w.id} onClick={() => { setSelectedWs(w); setSelectedNote(null); }} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', selectedWs?.id === w.id && 'ring-1 ring-accent', w.status === 'archived' && 'opacity-60')}>
                <div className="flex items-center gap-3">
                  <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', w.status === 'active' ? 'bg-accent/10' : 'bg-muted')}>
                    <FolderOpen className={cn('h-4 w-4', w.status === 'active' ? 'text-accent' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{w.name}</span>{w.visibility === 'private' && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}<StatusBadge status={w.status === 'active' ? 'healthy' : w.status === 'archived' ? 'pending' : 'blocked'} label={w.status} /></div>
                    <div className="text-[8px] text-muted-foreground">{w.dept} · {w.members.length} members · {w.notesCount} notes · {w.filesCount} files · {w.lastActivity}</div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="flex -space-x-1.5">{w.members.slice(0, 3).map(m => <Avatar key={m} className="h-5 w-5 border-2 border-background"><AvatarFallback className="text-[5px] bg-accent/10 text-accent">{m.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>)}</div>
                    {w.members.length > 3 && <span className="text-[7px] text-muted-foreground">+{w.members.length - 3}</span>}
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); openDetail('workspace', w.name, w.desc); }}><MoreHorizontal className="h-3 w-3" /></Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ NOTES ═══ */}
      {tab === 'notes' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Notes" value={String(NOTES.length)} />
            <KPICard label="Published" value={String(NOTES.filter(n => n.status === 'published').length)} />
            <KPICard label="Drafts" value={String(NOTES.filter(n => n.status === 'draft').length)} />
            <KPICard label="Pinned" value={String(NOTES.filter(n => n.pinned).length)} />
          </KPIBand>
          <div className="space-y-1.5">
            {NOTES.map(n => (
              <div key={n.id} onClick={() => { setSelectedNote(n); setSelectedWs(null); }} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', selectedNote?.id === n.id && 'ring-1 ring-accent')}>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    {n.pinned ? <Pin className="h-4 w-4 text-accent" /> : <StickyNote className="h-4 w-4 text-accent" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{n.title}</span>{n.visibility === 'private' && <Lock className="h-2.5 w-2.5 text-muted-foreground" />}<Badge variant="secondary" className="text-[6px]">{n.status}</Badge></div>
                    <div className="text-[8px] text-muted-foreground">{n.author} · {n.workspace} · {n.updatedAt}</div>
                    <div className="flex gap-1 mt-0.5">{n.tags.map(t => <Badge key={t} variant="outline" className="text-[6px]">{t}</Badge>)}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg" onClick={e => { e.stopPropagation(); openDetail('note', n.title, n.content); }}><MoreHorizontal className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setNoteDrawer(true)}><Plus className="h-3 w-3" />New Note</Button>
        </div>
      )}

      {/* ═══ HANDOFFS ═══ */}
      {tab === 'handoffs' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total" value={String(HANDOFFS.length)} />
            <KPICard label="Pending" value={String(HANDOFFS.filter(h => h.status === 'pending').length)} change="Needs action" />
            <KPICard label="Completed" value={String(HANDOFFS.filter(h => h.status === 'completed').length)} />
            <KPICard label="Rejected/Expired" value={String(HANDOFFS.filter(h => h.status === 'rejected' || h.status === 'expired').length)} />
          </KPIBand>
          <div className="space-y-1.5">
            {HANDOFFS.map(h => {
              const hs = HANDOFF_STATUS[h.status];
              return (
                <div key={h.id} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', h.status === 'pending' && 'border-accent/30')} onClick={() => openDetail('handoff', h.title, `${h.from} → ${h.to} · ${h.notes}`)}>
                  <div className="flex items-center gap-3">
                    <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', h.status === 'pending' ? 'bg-accent/10' : 'bg-muted')}>
                      <ArrowRightLeft className={cn('h-4 w-4', h.status === 'pending' ? 'text-accent' : 'text-muted-foreground')} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn('text-[8px] font-bold', PRIORITY_COLORS[h.priority])}>●</span>
                        <span className="text-[10px] font-semibold">{h.title}</span>
                        <StatusBadge status={hs.badge} label={hs.label} />
                      </div>
                      <div className="text-[8px] text-muted-foreground">{h.from} → {h.to} · {h.workspace} · Due: {h.dueDate}</div>
                      <div className="flex gap-1 mt-0.5">{h.linkedItems.map(l => <Badge key={l} variant="outline" className="text-[6px]"><Paperclip className="h-2 w-2 mr-0.5" />{l}</Badge>)}</div>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      {h.status === 'pending' && <>
                        <Button size="sm" className="h-6 text-[8px] rounded-lg" onClick={e => { e.stopPropagation(); toast.success('Accepted'); }}><CheckCircle2 className="h-3 w-3" /></Button>
                        <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg text-destructive" onClick={e => { e.stopPropagation(); toast.info('Rejected'); }}><X className="h-3 w-3" /></Button>
                      </>}
                      {h.status === 'expired' && <Button variant="outline" size="sm" className="h-6 text-[8px] gap-1 rounded-lg" onClick={e => { e.stopPropagation(); toast.info('Resubmitted'); }}><RefreshCw className="h-3 w-3" />Resend</Button>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setHandoffDrawer(true)}><Plus className="h-3 w-3" />New Handoff</Button>
        </div>
      )}

      {/* ═══ LINKED RECORDS ═══ */}
      {tab === 'linked' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Linked Items" value="47" />
            <KPICard label="Projects" value="8" />
            <KPICard label="Gigs" value="5" />
            <KPICard label="Support Tickets" value="3" />
          </KPIBand>
          <SectionCard title="Linked Records by Workspace" icon={<Link2 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {WORKSPACES.filter(w => w.status === 'active').map(w => (
                <div key={w.id} className="rounded-xl border p-2">
                  <div className="text-[10px] font-semibold mb-1">{w.name}</div>
                  <div className="flex flex-wrap gap-1">
                    {['Project Plan', 'API Docs', 'Design Specs', 'Budget Sheet'].slice(0, Math.floor(Math.random() * 3) + 2).map(item => (
                      <Badge key={item} variant="outline" className="text-[7px] cursor-pointer hover:bg-accent/10" onClick={() => openDetail('linked', item, `Linked from ${w.name}`)}><FileText className="h-2 w-2 mr-0.5" />{item}</Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3 flex items-center gap-2">
            <Link2 className="h-4 w-4 text-accent" />
            <div className="text-[9px]"><span className="font-semibold">Smart linking</span> <span className="text-muted-foreground">— Records from projects, gigs, jobs, and support are automatically linked when referenced in notes or discussions.</span></div>
          </div>
        </div>
      )}

      {/* ═══ DISCUSSIONS ═══ */}
      {tab === 'discussions' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Threads" value={String(DISCUSSIONS.length)} />
            <KPICard label="Open" value={String(DISCUSSIONS.filter(d => d.status === 'open').length)} />
            <KPICard label="Resolved" value={String(DISCUSSIONS.filter(d => d.status === 'resolved').length)} />
            <KPICard label="Pinned" value={String(DISCUSSIONS.filter(d => d.status === 'pinned').length)} />
          </KPIBand>
          <div className="space-y-1.5">
            {DISCUSSIONS.map(d => (
              <div key={d.id} className={cn('rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer', d.status === 'pinned' && 'border-accent/30')} onClick={() => openDetail('discussion', d.title, `${d.author} · ${d.replies} replies`)}>
                <div className="flex items-center gap-3">
                  <div className={cn('h-8 w-8 rounded-xl flex items-center justify-center shrink-0', d.status === 'pinned' ? 'bg-accent/10' : 'bg-muted')}>
                    <MessageCircle className={cn('h-4 w-4', d.status === 'pinned' ? 'text-accent' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{d.title}</span>{d.status === 'pinned' && <Pin className="h-2.5 w-2.5 text-accent" />}<StatusBadge status={d.status === 'resolved' ? 'healthy' : d.status === 'pinned' ? 'live' : 'pending'} label={d.status} /></div>
                    <div className="text-[8px] text-muted-foreground">{d.author} · {d.workspace} · {d.replies} replies · {d.lastReply}</div>
                    <div className="flex gap-1 mt-0.5">{d.tags.map(t => <Badge key={t} variant="outline" className="text-[6px]">{t}</Badge>)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ WATCHERS ═══ */}
      {tab === 'watchers' && (
        <div className="space-y-3">
          <SectionCard title="Workspace Watchers & Owners" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {WORKSPACES.filter(w => w.status === 'active').map(w => (
                <div key={w.id} className="rounded-xl border p-2">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-semibold">{w.name}</span>
                    <Badge variant="secondary" className="text-[6px]">{w.members.length} members</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">{w.members.map(m => <Avatar key={m} className="h-6 w-6 border-2 border-background"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{m.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>)}</div>
                    <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 rounded-lg ml-auto"><Bell className="h-2.5 w-2.5" />Watch</Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ VISIBILITY ═══ */}
      {tab === 'visibility' && (
        <div className="space-y-3">
          <SectionCard title="Visibility Controls" icon={<Shield className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-2">
              {WORKSPACES.map(w => (
                <div key={w.id} className="rounded-xl border p-2 flex items-center justify-between">
                  <div><div className="text-[10px] font-semibold">{w.name}</div><div className="text-[8px] text-muted-foreground">{w.dept}</div></div>
                  <div className="flex items-center gap-2">
                    <Badge variant={w.visibility === 'shared' ? 'default' : 'secondary'} className="text-[7px] gap-1">{w.visibility === 'shared' ? <Globe className="h-2.5 w-2.5" /> : <Lock className="h-2.5 w-2.5" />}{w.visibility}</Badge>
                    <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-lg" onClick={() => toast.info('Toggle visibility')}><Settings className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
          <div className="rounded-2xl border border-[hsl(var(--state-caution))]/30 bg-[hsl(var(--state-caution))]/5 p-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-caution))]" />
            <div className="text-[9px]"><span className="font-semibold">Private workspaces</span> <span className="text-muted-foreground">are only visible to members. Changing visibility affects all notes, files, and discussions within.</span></div>
          </div>
        </div>
      )}

      {/* ═══ MOBILE SUMMARY ═══ */}
      {tab === 'mobile' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active" value={String(WORKSPACES.filter(w => w.status === 'active').length)} />
            <KPICard label="Pending" value={String(HANDOFFS.filter(h => h.status === 'pending').length)} change="Handoffs" />
            <KPICard label="Notes Today" value="3" />
            <KPICard label="Discussions" value={String(DISCUSSIONS.filter(d => d.status === 'open').length)} />
          </KPIBand>
          <SectionCard title="Quick Actions" className="!rounded-2xl">
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-9 text-[9px] gap-1 rounded-xl" onClick={() => setCreateDrawer(true)}><Plus className="h-3.5 w-3.5" />New Workspace</Button>
              <Button variant="outline" size="sm" className="h-9 text-[9px] gap-1 rounded-xl" onClick={() => setNoteDrawer(true)}><StickyNote className="h-3.5 w-3.5" />New Note</Button>
              <Button variant="outline" size="sm" className="h-9 text-[9px] gap-1 rounded-xl" onClick={() => setHandoffDrawer(true)}><ArrowRightLeft className="h-3.5 w-3.5" />Handoff</Button>
              <Link to="/inbox"><Button variant="outline" size="sm" className="h-9 text-[9px] gap-1 rounded-xl w-full"><MessageCircle className="h-3.5 w-3.5" />Messages</Button></Link>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">Workspaces</span><div className="text-[8px] text-muted-foreground">{WORKSPACES.filter(w => w.status === 'active').length} active · {HANDOFFS.filter(h => h.status === 'pending').length} pending</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setCreateDrawer(true)}><Plus className="h-3.5 w-3.5" />New</Button>
      </div>

      {/* Create Workspace Drawer */}
      <Sheet open={createDrawer} onOpenChange={setCreateDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">New Workspace</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Name</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. Q3 Campaign" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Description</label><textarea className="w-full h-16 rounded-xl border bg-background px-2 py-1 text-[9px]" placeholder="What is this workspace for?" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Department</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Product</option><option>Engineering</option><option>Design</option><option>Sales</option><option>Operations</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Visibility</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="shared">Shared — visible to org</option><option value="private">Private — invite only</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Invite Members</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Search by name or email" /></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setCreateDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setCreateDrawer(false); toast.success('Workspace created!'); }}><CheckCircle2 className="h-3 w-3" />Create</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* New Note Drawer */}
      <Sheet open={noteDrawer} onOpenChange={setNoteDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">New Note</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Title</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Note title" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Workspace</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">{WORKSPACES.filter(w => w.status === 'active').map(w => <option key={w.id}>{w.name}</option>)}</select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Content</label><textarea className="w-full h-24 rounded-xl border bg-background px-2 py-1 text-[9px]" placeholder="Write your note... Use @mentions to tag team members" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Visibility</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="shared">Shared</option><option value="team-only">Team Only</option><option value="private">Private</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Tags</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. sprint, planning" /></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setNoteDrawer(false)}>Cancel</Button>
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => toast.info('Saved as draft')}>Save Draft</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setNoteDrawer(false); toast.success('Note published!'); }}><Send className="h-3 w-3" />Publish</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Handoff Drawer */}
      <Sheet open={handoffDrawer} onOpenChange={setHandoffDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Create Handoff</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Title</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="What is being handed off?" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Workspace</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]">{WORKSPACES.filter(w => w.status === 'active').map(w => <option key={w.id}>{w.name}</option>)}</select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Hand Off To</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Search team member" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Priority</label><select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></div>
            <div><label className="text-[9px] font-medium mb-1 block">Due Date</label><input type="date" className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Notes</label><textarea className="w-full h-16 rounded-xl border bg-background px-2 py-1 text-[9px]" placeholder="Context and instructions" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Linked Items</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="Link docs, projects, gigs..." /></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setHandoffDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setHandoffDrawer(false); toast.success('Handoff created!'); }}><ArrowRightLeft className="h-3 w-3" />Create</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Drawer */}
      <Sheet open={detailDrawer} onOpenChange={setDetailDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Detail Inspector</SheetTitle></SheetHeader>
          {detailItem && (
            <div className="p-4 space-y-3">
              <Badge variant="secondary" className="text-[7px] capitalize">{detailItem.type}</Badge>
              <h3 className="text-[12px] font-bold">{detailItem.title}</h3>
              <p className="text-[9px] text-muted-foreground">{detailItem.detail}</p>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 rounded-xl" onClick={() => setDetailDrawer(false)}>Close</Button>
                <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { setDetailDrawer(false); toast.success('Action taken!'); }}><CheckCircle2 className="h-3 w-3" />Take Action</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default SharedWorkspacesPage;
