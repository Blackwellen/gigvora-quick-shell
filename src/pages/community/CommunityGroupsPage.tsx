import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import {
  Users, MessageSquare, Search, Plus, Lock, Eye, Globe,
  Bookmark, BookmarkCheck, ChevronRight, History, Shield,
  UserPlus, FileText, Calendar, Star, AlertTriangle,
  TrendingUp, Heart, MoreHorizontal, CheckCircle2,
  MessagesSquare, FolderOpen, Bell, Crown, Ban,
  Image as ImageIcon, Share2, Flag, Settings, Zap,
  ArrowRight, Clock, Save, Camera,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type GroupAccess = 'public' | 'private' | 'invite_only';
type GroupStatus = 'active' | 'pending' | 'suspended' | 'archived';
type MemberRole = 'owner' | 'admin' | 'moderator' | 'member' | 'pending';
type GroupTab = 'discover' | 'feed' | 'members' | 'resources' | 'events';

const GROUP_TABS: { id: GroupTab; label: string; icon: React.ElementType }[] = [
  { id: 'discover', label: 'Discover', icon: Users },
  { id: 'feed', label: 'Feed', icon: MessagesSquare },
  { id: 'members', label: 'Members', icon: UserPlus },
  { id: 'resources', label: 'Resources', icon: FolderOpen },
  { id: 'events', label: 'Events', icon: Calendar },
];

interface Group {
  id: string; name: string; avatar: string; description: string;
  access: GroupAccess; status: GroupStatus; members: number; discussions: number;
  category: string; created: string; lastActive: string; saved: boolean;
  myRole?: MemberRole; cover?: string;
}

interface Discussion {
  id: string; groupId: string; author: string; authorAvatar: string;
  title: string; replies: number; likes: number; pinned: boolean;
  time: string; preview: string; hasMedia?: boolean;
}

interface Member {
  id: string; name: string; avatar: string; role: MemberRole; joined: string; online?: boolean;
}

const GROUPS: Group[] = [
  { id: 'G-001', name: 'React & Frontend Engineers', avatar: 'RF', description: 'A community for React developers to share patterns, debug issues, and discuss the ecosystem.', access: 'public', status: 'active', members: 4250, discussions: 890, category: 'Engineering', created: 'Jan 2024', lastActive: '2m ago', saved: true, myRole: 'member' },
  { id: 'G-002', name: 'Startup Founders Circle', avatar: 'SF', description: 'Private group for founders to share experiences, ask for advice, and find co-founders.', access: 'private', status: 'active', members: 320, discussions: 210, category: 'Startups', created: 'Mar 2024', lastActive: '15m ago', saved: true, myRole: 'admin' },
  { id: 'G-003', name: 'Design Systems Guild', avatar: 'DS', description: 'Invite-only guild for design system practitioners at scale.', access: 'invite_only', status: 'active', members: 85, discussions: 67, category: 'Design', created: 'Jun 2024', lastActive: '1h ago', saved: false, myRole: 'member' },
  { id: 'G-004', name: 'Product Management Hub', avatar: 'PM', description: 'Open forum for PMs to discuss strategy, frameworks, and career growth.', access: 'public', status: 'active', members: 2800, discussions: 540, category: 'Product', created: 'Feb 2024', lastActive: '5m ago', saved: false },
  { id: 'G-005', name: 'AI/ML Research Network', avatar: 'AI', description: 'Research-focused group for sharing papers, experiments, and industry applications.', access: 'public', status: 'active', members: 1650, discussions: 320, category: 'AI & Data', created: 'Apr 2024', lastActive: '30m ago', saved: false },
  { id: 'G-006', name: 'FinTech Regulators Forum', avatar: 'FT', description: 'Private discussions on compliance, regulation, and fintech governance.', access: 'private', status: 'suspended', members: 140, discussions: 45, category: 'Finance', created: 'Aug 2024', lastActive: '2w ago', saved: false },
];

const DISCUSSIONS: Discussion[] = [
  { id: 'D-1', groupId: 'G-001', author: 'Sarah Chen', authorAvatar: 'SC', title: 'React 19 Server Components — production ready?', replies: 34, likes: 89, pinned: true, time: '2h ago', preview: 'Has anyone deployed RSC in production at scale? Curious about performance and DX trade-offs.', hasMedia: true },
  { id: 'D-2', groupId: 'G-001', author: 'Marcus T.', authorAvatar: 'MT', title: 'Best practices for state management in 2026', replies: 22, likes: 45, pinned: false, time: '5h ago', preview: 'With Zustand, Jotai, and Signals all maturing — what are teams actually using?' },
  { id: 'D-3', groupId: 'G-002', author: 'Priya Gupta', authorAvatar: 'PG', title: 'How we closed our Series A in 3 weeks', replies: 18, likes: 67, pinned: true, time: '1d ago', preview: 'Sharing the exact process, timeline, and lessons from our recent raise.', hasMedia: true },
  { id: 'D-4', groupId: 'G-001', author: 'James O.', authorAvatar: 'JO', title: 'Micro-frontends: worth the complexity?', replies: 15, likes: 28, pinned: false, time: '1d ago', preview: "We migrated to micro-frontends last quarter. Here's what we learned." },
  { id: 'D-5', groupId: 'G-004', author: 'Lina Park', authorAvatar: 'LP', title: 'Framework for prioritizing features with limited data', replies: 11, likes: 32, pinned: false, time: '3h ago', preview: "When you don't have enough data to run proper experiments, here's how we decide." },
  { id: 'D-6', groupId: 'G-005', author: 'Omar Hassan', authorAvatar: 'OH', title: 'Fine-tuning LLMs on domain-specific data', replies: 27, likes: 54, pinned: false, time: '6h ago', preview: 'A practical guide to fine-tuning with LoRA and QLoRA for production use cases.' },
];

const MEMBERS: Member[] = [
  { id: 'M-1', name: 'Sarah Chen', avatar: 'SC', role: 'owner', joined: 'Jan 2024', online: true },
  { id: 'M-2', name: 'Marcus Thompson', avatar: 'MT', role: 'admin', joined: 'Jan 2024', online: true },
  { id: 'M-3', name: 'Priya Gupta', avatar: 'PG', role: 'moderator', joined: 'Feb 2024', online: false },
  { id: 'M-4', name: "James O'Brien", avatar: 'JO', role: 'member', joined: 'Mar 2024', online: true },
  { id: 'M-5', name: 'Lina Park', avatar: 'LP', role: 'member', joined: 'Apr 2024', online: false },
  { id: 'M-6', name: 'Alex Rivera', avatar: 'AR', role: 'pending', joined: 'Pending', online: false },
  { id: 'M-7', name: 'Dana Kim', avatar: 'DK', role: 'member', joined: 'May 2024', online: true },
  { id: 'M-8', name: 'Chris Walker', avatar: 'CW', role: 'member', joined: 'Jun 2024', online: false },
];

const MOCK_EVENTS = [
  { id: 'E-1', title: 'React Server Components Deep Dive', group: 'React & Frontend Engineers', date: 'Apr 18, 2026', time: '2:00 PM EST', attendees: 124, type: 'Webinar', live: false },
  { id: 'E-2', title: 'Founder AMA: Scaling to $10M ARR', group: 'Startup Founders Circle', date: 'Apr 20, 2026', time: '11:00 AM PST', attendees: 67, type: 'AMA', live: true },
  { id: 'E-3', title: 'Design Token Workshop', group: 'Design Systems Guild', date: 'Apr 25, 2026', time: '3:00 PM EST', attendees: 38, type: 'Workshop', live: false },
  { id: 'E-4', title: 'PM Career Paths Panel', group: 'Product Management Hub', date: 'May 2, 2026', time: '1:00 PM EST', attendees: 89, type: 'Panel', live: false },
];

const ACCESS_COLORS: Record<GroupAccess, string> = {
  public: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  private: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  invite_only: 'bg-primary/10 text-primary',
};
const ACCESS_ICONS: Record<GroupAccess, React.ElementType> = { public: Globe, private: Lock, invite_only: Shield };

const ROLE_COLORS: Record<MemberRole, string> = {
  owner: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
  admin: 'bg-primary/10 text-primary',
  moderator: 'bg-accent/10 text-accent',
  member: 'bg-muted text-muted-foreground',
  pending: 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]',
};

/* ═══════════════════════════════════════════════════════════
   Create Group Drawer
   ═══════════════════════════════════════════════════════════ */
const CreateGroupDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [saving, setSaving] = useState(false);
  const handleCreate = () => { setSaving(true); setTimeout(() => { setSaving(false); onClose(); toast.success('Group created successfully'); }, 800); };

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4 text-accent" />Create Group</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center"><Camera className="h-5 w-5 text-accent" /></div>
            <div>
              <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Camera className="h-3 w-3" />Upload Logo</Button>
              <p className="text-[9px] text-muted-foreground mt-1">Recommended: 200×200px</p>
            </div>
          </div>
          {[
            { label: 'Group Name', placeholder: 'e.g. React Engineers' },
            { label: 'Category', placeholder: 'e.g. Engineering, Design, Startups' },
          ].map(f => (
            <div key={f.label}>
              <label className="text-[11px] font-semibold mb-1.5 block">{f.label}</label>
              <input placeholder={f.placeholder} className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
            </div>
          ))}
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Description</label>
            <Textarea placeholder="What is this group about?" rows={3} className="rounded-xl text-[11px]" />
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Access</label>
            <div className="flex gap-2">
              {[
                { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can join' },
                { value: 'private', label: 'Private', icon: Lock, desc: 'Approval required' },
                { value: 'invite_only', label: 'Invite Only', icon: Shield, desc: 'By invitation' },
              ].map(opt => (
                <button key={opt.value} className="flex-1 p-2.5 rounded-xl border hover:bg-accent/5 hover:border-accent/30 transition-all text-center">
                  <opt.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                  <div className="text-[10px] font-semibold">{opt.label}</div>
                  <div className="text-[8px] text-muted-foreground">{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 px-5 py-4 border-t">
          <Button variant="outline" size="sm" className="rounded-xl text-[10px]" onClick={onClose}>Cancel</Button>
          <Button size="sm" className="rounded-xl text-[10px] gap-1" onClick={handleCreate} disabled={saving}><Save className="h-3 w-3" />{saving ? 'Creating...' : 'Create Group'}</Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   Group Detail Drawer
   ═══════════════════════════════════════════════════════════ */
const GroupDrawer: React.FC<{ group: Group | null; open: boolean; onClose: () => void }> = ({ group, open, onClose }) => {
  if (!group) return null;
  const AccessIcon = ACCESS_ICONS[group.access];
  const groupDiscussions = DISCUSSIONS.filter(d => d.groupId === group.id);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold flex items-center gap-2"><Users className="h-4 w-4 text-accent" />Group Detail</SheetTitle></SheetHeader>

        {/* Hero */}
        <div className="h-24 bg-gradient-to-r from-accent via-primary/60 to-primary relative">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PHBhdGggZD0iTTM2IDE4YzAtOS45NC04LjA2LTE4LTE4LTE4UzAgOC4wNiAwIDE4czguMDYgMTggMTggMTggMTgtOC4wNiAxOC0xOHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-30" />
        </div>

        <div className="px-5 pb-5 -mt-6">
          <div className="flex items-end gap-3 mb-3">
            <Avatar className="h-14 w-14 ring-4 ring-card rounded-2xl border-2 border-card shadow-md">
              <AvatarFallback className="text-sm font-bold bg-accent/10 text-accent rounded-2xl">{group.avatar}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 pb-0.5">
              <div className="text-[13px] font-bold truncate">{group.name}</div>
              <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground">
                <AccessIcon className="h-3 w-3" />{group.access.replace('_', ' ')} · {group.category}
              </div>
            </div>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed mb-3">{group.description}</p>

          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { l: 'Members', v: group.members.toLocaleString(), icon: Users },
              { l: 'Discussions', v: String(group.discussions), icon: MessagesSquare },
              { l: 'Created', v: group.created, icon: Calendar },
              { l: 'Last Active', v: group.lastActive, icon: TrendingUp },
            ].map(m => (
              <div key={m.l} className="rounded-xl border p-2.5 flex items-start gap-2 hover:bg-muted/20 transition-colors">
                <m.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <div><div className="text-[8px] text-muted-foreground">{m.l}</div><div className="text-[10px] font-semibold">{m.v}</div></div>
              </div>
            ))}
          </div>

          {group.myRole && (
            <div className="flex items-center gap-1.5 text-[9px] mb-3 p-2 rounded-xl bg-muted/20">
              <span className="text-muted-foreground">Your role:</span>
              <Badge className={cn('text-[7px] border-0 capitalize', ROLE_COLORS[group.myRole])}>{group.myRole}</Badge>
            </div>
          )}

          {/* Stacked member avatars */}
          <div className="flex items-center gap-2 mb-3 p-2.5 rounded-xl border">
            <div className="flex -space-x-1.5">
              {MEMBERS.slice(0, 5).map(m => (
                <Avatar key={m.id} className="h-6 w-6 ring-2 ring-card">
                  <AvatarFallback className="text-[6px] bg-muted font-bold">{m.avatar}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <span className="text-[9px] text-muted-foreground">+{group.members - 5} members</span>
          </div>

          {groupDiscussions.length > 0 && (
            <div className="mb-3">
              <div className="text-[11px] font-semibold mb-1.5">Recent Discussions</div>
              <div className="space-y-1">
                {groupDiscussions.slice(0, 3).map(d => (
                  <div key={d.id} className="p-2 rounded-xl border hover:bg-muted/20 transition-colors cursor-pointer">
                    <div className="flex items-center gap-1">
                      {d.pinned && <Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />}
                      <span className="text-[10px] font-medium flex-1 truncate">{d.title}</span>
                    </div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{d.author} · {d.time} · {d.replies} replies · {d.likes} likes</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {group.status === 'suspended' && (
            <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-2.5 mb-3">
              <Ban className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
              <div className="text-[9px]"><span className="font-semibold">Group Suspended.</span> This group has been suspended by moderators. Contact support for details.</div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {!group.myRole && group.status === 'active' && group.access === 'public' && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><UserPlus className="h-3 w-3" />Join Group</Button>}
            {!group.myRole && group.status === 'active' && group.access !== 'public' && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Lock className="h-3 w-3" />Request Access</Button>}
            {group.myRole && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><MessageSquare className="h-3 w-3" />Post Discussion</Button>}
            {(group.myRole === 'admin' || group.myRole === 'owner') && <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><UserPlus className="h-3 w-3" />Invite</Button>}
            {(group.myRole === 'admin' || group.myRole === 'owner') && <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Manage</Button>}
            <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toast.success(group.saved ? 'Unsaved' : 'Saved')}>
              {group.saved ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}{group.saved ? 'Saved' : 'Save'}
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Share2 className="h-3 w-3" /></Button>
            <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-1 text-destructive"><Flag className="h-3 w-3" /></Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const CommunityGroupsPage: React.FC = () => {
  const { activeRole } = useRole();
  const [activeTab, setActiveTab] = useState<GroupTab>('discover');
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createOpen, setCreateOpen] = useState(false);

  const categories = useMemo(() => ['all', ...new Set(GROUPS.map(g => g.category))], []);

  const filtered = useMemo(() => GROUPS.filter(g => {
    if (accessFilter !== 'all' && g.access !== accessFilter) return false;
    if (categoryFilter !== 'all' && g.category !== categoryFilter) return false;
    if (search && !g.name.toLowerCase().includes(search.toLowerCase()) && !g.category.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [search, accessFilter, categoryFilter]);

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><Users className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Community Groups</span>
        <Badge variant="secondary" className="text-[8px] h-4 rounded-lg">{GROUPS.length} groups</Badge>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups..." className="h-7 rounded-xl border bg-background pl-7 pr-3 text-[10px] w-44 focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
        </div>
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setCreateOpen(true)}><Plus className="h-3 w-3" />Create Group</Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <KPICard label="Joined" value="3" change="Active" trend="up" className="!rounded-2xl" />
        <KPICard label="Discussions" value="2.1K" change="This month" trend="up" className="!rounded-2xl" />
      </div>

      <SectionCard title="My Groups" className="!rounded-2xl">
        <div className="space-y-1">
          {GROUPS.filter(g => g.myRole).map(g => (
            <button key={g.id} onClick={() => setSelectedGroup(g)} className="flex items-center gap-2 p-1.5 rounded-xl w-full text-left hover:bg-muted/30 transition-all duration-200 group">
              <Avatar className="h-7 w-7 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
                <AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{g.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{g.name}</div>
                <div className="text-[7px] text-muted-foreground">{g.lastActive}</div>
              </div>
              <Badge className={cn('text-[6px] border-0 capitalize', ROLE_COLORS[g.myRole!])}>{g.myRole}</Badge>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Trending Topics" subtitle="Hot now" className="!rounded-2xl">
        <div className="space-y-1">
          {DISCUSSIONS.filter(d => d.likes > 40).slice(0, 3).map(d => (
            <div key={d.id} className="p-2 rounded-xl border hover:bg-muted/20 cursor-pointer transition-colors">
              <div className="text-[9px] font-semibold truncate">{d.title}</div>
              <div className="text-[7px] text-muted-foreground mt-0.5 flex items-center gap-2">
                <span className="flex items-center gap-0.5"><Heart className="h-2.5 w-2.5" />{d.likes}</span>
                <span className="flex items-center gap-0.5"><MessageSquare className="h-2.5 w-2.5" />{d.replies}</span>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Stats" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {[
            { l: 'Posts This Month', v: '12' },
            { l: 'Replies Given', v: '45' },
            { l: 'Likes Received', v: '234' },
            { l: 'Resources Shared', v: '8' },
          ].map(s => (
            <div key={s.l} className="flex justify-between">
              <span className="text-muted-foreground">{s.l}</span>
              <span className="font-semibold">{s.v}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Suggested Groups" subtitle="AI-matched" className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { name: 'DevOps & Cloud', members: '1.2K', match: 92 },
            { name: 'TypeScript Guild', members: '890', match: 88 },
            { name: 'Remote Work Hub', members: '2.4K', match: 84 },
          ].map(sg => (
            <div key={sg.name} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 cursor-pointer transition-all duration-200 group">
              <div className="h-7 w-7 rounded-xl bg-primary/10 flex items-center justify-center text-[8px] font-bold text-primary transition-transform group-hover:scale-105">{sg.name[0]}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{sg.name}</div>
                <div className="text-[7px] text-muted-foreground">{sg.members} members</div>
              </div>
              <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">{sg.match}%</Badge>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-accent" />Recent Activity</span>
        <span className="text-[10px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="flex gap-3 overflow-x-auto pb-1 scrollbar-none">
        {[
          { action: 'Sarah Chen posted "React 19 Server Components — production ready?" in React & Frontend Engineers', time: '2h ago', type: 'discussion' },
          { action: 'You were promoted to admin in Startup Founders Circle', time: '1d ago', type: 'role' },
          { action: 'New member request from Alex Rivera in Design Systems Guild', time: '3h ago', type: 'request' },
          { action: 'Priya Gupta\'s "How we closed our Series A" reached 67 likes', time: '1d ago', type: 'milestone' },
          { action: 'Omar Hassan shared "Fine-tuning LLMs" resource in AI/ML Research Network', time: '6h ago', type: 'resource' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[240px] hover:shadow-sm cursor-pointer transition-all duration-200">
            <Badge variant="secondary" className="text-[7px] capitalize mb-1 rounded-lg">{a.type}</Badge>
            <p className="text-[9px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[8px] text-muted-foreground mt-1 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-60" bottomSection={bottomSection}>
      {/* ── TAB NAV ── */}
      <div className="flex gap-1.5 overflow-x-auto pb-2.5 mb-3 scrollbar-none sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-1 px-1 pt-1">
        {GROUP_TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
            activeTab === t.id ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
          )}>
            <t.icon className="h-3 w-3" />{t.label}
            {t.id === 'discover' && <span className="text-[8px] ml-0.5">({GROUPS.length})</span>}
            {t.id === 'events' && <span className="text-[8px] ml-0.5">({MOCK_EVENTS.length})</span>}
          </button>
        ))}
      </div>

      {/* ── DISCOVER TAB ── */}
      {activeTab === 'discover' && (
        <div className="space-y-3">
          {/* Filter chips */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex gap-1">
              {['all', 'public', 'private', 'invite_only'].map(f => (
                <button key={f} onClick={() => setAccessFilter(f)} className={cn(
                  'px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all duration-200',
                  accessFilter === f ? 'bg-accent text-accent-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}>{f === 'all' ? 'All' : f === 'invite_only' ? 'Invite Only' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
            </div>
            <div className="h-4 w-px bg-border" />
            <div className="flex gap-1 overflow-x-auto scrollbar-none">
              {categories.map(c => (
                <button key={c} onClick={() => setCategoryFilter(c)} className={cn(
                  'px-2.5 py-1 rounded-xl text-[9px] font-semibold transition-all duration-200 whitespace-nowrap shrink-0',
                  categoryFilter === c ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted/60 text-muted-foreground hover:bg-muted'
                )}>{c === 'all' ? 'All Topics' : c}</button>
              ))}
            </div>
            <div className="flex-1" />
            <span className="text-[9px] text-muted-foreground">{filtered.length} results</span>
          </div>

          {/* Group Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {filtered.map(g => {
              const AccessIcon = ACCESS_ICONS[g.access];
              return (
                <div key={g.id} onClick={() => setSelectedGroup(g)} className={cn(
                  'rounded-2xl border bg-card overflow-hidden cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group',
                  g.status === 'suspended' && 'opacity-60'
                )}>
                  {/* Mini cover */}
                  <div className="h-16 bg-gradient-to-r from-accent/20 via-primary/10 to-muted relative">
                    {g.status === 'suspended' && (
                      <div className="absolute inset-0 bg-destructive/10 flex items-center justify-center"><Ban className="h-4 w-4 text-destructive/40" /></div>
                    )}
                  </div>
                  <div className="p-3.5 -mt-5">
                    <div className="flex items-end gap-2.5 mb-2">
                      <Avatar className="h-10 w-10 ring-3 ring-card rounded-xl shadow-sm transition-transform group-hover:scale-105">
                        <AvatarFallback className="text-[9px] font-bold bg-accent/10 text-accent rounded-xl">{g.avatar}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold flex items-center gap-1 truncate group-hover:text-accent transition-colors">
                          {g.name}
                          {g.saved && <BookmarkCheck className="h-3 w-3 text-accent shrink-0" />}
                        </div>
                        <div className="text-[8px] text-muted-foreground">{g.category}</div>
                      </div>
                    </div>
                    <p className="text-[9px] text-muted-foreground line-clamp-2 mb-2">{g.description}</p>
                    <div className="flex flex-wrap gap-1 mb-2.5">
                      <Badge className={cn('text-[7px] border-0 capitalize gap-0.5 rounded-lg', ACCESS_COLORS[g.access])}><AccessIcon className="h-2 w-2" />{g.access.replace('_', ' ')}</Badge>
                      {g.myRole && <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', ROLE_COLORS[g.myRole])}>{g.myRole}</Badge>}
                    </div>
                    <div className="flex items-center justify-between text-[8px] text-muted-foreground border-t pt-2">
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{g.members.toLocaleString()} · <MessagesSquare className="h-3 w-3" />{g.discussions}</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{g.lastActive}</span>
                    </div>
                    <div className="flex gap-1.5 mt-2.5">
                      {g.myRole ? (
                        <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Discuss</Button>
                      ) : g.access === 'public' ? (
                        <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl"><UserPlus className="h-3 w-3" />Join</Button>
                      ) : (
                        <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl"><Lock className="h-3 w-3" />Request</Button>
                      )}
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl"><Eye className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3 w-3" /></Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filtered.length === 0 && (
            <div className="rounded-2xl border bg-card p-8 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
              <div className="text-[11px] font-semibold mb-1">No Groups Found</div>
              <div className="text-[9px] text-muted-foreground mb-3">Try adjusting your filters or search terms.</div>
              <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => { setAccessFilter('all'); setCategoryFilter('all'); setSearch(''); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── FEED TAB ── */}
      {activeTab === 'feed' && (
        <div className="space-y-2.5">
          {/* Compose */}
          <div className="rounded-2xl border p-3.5 flex items-start gap-3">
            <Avatar className="h-8 w-8 ring-2 ring-muted/50"><AvatarFallback className="text-[8px] font-bold bg-accent/10 text-accent">YO</AvatarFallback></Avatar>
            <div className="flex-1">
              <Textarea placeholder="Start a discussion..." rows={2} className="rounded-xl text-[11px] mb-2" />
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><ImageIcon className="h-3 w-3" />Media</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><FileText className="h-3 w-3" />File</Button>
                </div>
                <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Zap className="h-3 w-3" />Post</Button>
              </div>
            </div>
          </div>

          {/* Feed items */}
          {DISCUSSIONS.map(d => (
            <div key={d.id} className="rounded-2xl border p-3.5 hover:shadow-sm transition-all duration-200 group cursor-pointer">
              <div className="flex items-start gap-2.5">
                <Avatar className="h-8 w-8 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
                  <AvatarFallback className="text-[8px] font-bold bg-muted">{d.authorAvatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {d.pinned && <Star className="h-3 w-3 text-[hsl(var(--gigvora-amber))] fill-[hsl(var(--gigvora-amber))]" />}
                    <span className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{d.title}</span>
                  </div>
                  <div className="text-[9px] text-muted-foreground">{d.author} · {d.time} · {GROUPS.find(g => g.id === d.groupId)?.name}</div>
                  <p className="text-[10px] text-muted-foreground mt-1.5 line-clamp-2">{d.preview}</p>
                  {d.hasMedia && (
                    <div className="mt-2 h-28 rounded-xl bg-muted/30 flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground/20" />
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[9px] text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-accent transition-colors"><Heart className="h-3 w-3" />{d.likes}</button>
                    <button className="flex items-center gap-1 hover:text-accent transition-colors"><MessageSquare className="h-3 w-3" />{d.replies}</button>
                    <button className="flex items-center gap-1 hover:text-accent transition-colors"><Share2 className="h-3 w-3" />Share</button>
                    <button className="flex items-center gap-1 hover:text-accent transition-colors"><Bookmark className="h-3 w-3" />Save</button>
                    {d.pinned && <Badge variant="secondary" className="text-[7px] rounded-lg">Pinned</Badge>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── MEMBERS TAB ── */}
      {activeTab === 'members' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">{MEMBERS.length} Members</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><UserPlus className="h-3 w-3" />Invite</Button>
            </div>
          </div>

          <div className="space-y-1.5">
            {MEMBERS.map(m => (
              <div key={m.id} className="flex items-center gap-2.5 p-2.5 rounded-2xl border hover:bg-muted/30 hover:shadow-sm cursor-pointer transition-all duration-200 group">
                <div className="relative">
                  <Avatar className="h-9 w-9 ring-2 ring-muted/50 transition-transform group-hover:scale-105">
                    <AvatarFallback className="text-[9px] bg-muted font-bold">{m.avatar}</AvatarFallback>
                  </Avatar>
                  {m.online && <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-[hsl(var(--state-healthy))] ring-2 ring-card" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{m.name}</span>
                    <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', ROLE_COLORS[m.role])}>
                      {m.role === 'owner' && <Crown className="h-2 w-2 mr-0.5" />}{m.role}
                    </Badge>
                  </div>
                  <div className="text-[9px] text-muted-foreground">Joined {m.joined}</div>
                </div>
                {m.role === 'pending' ? (
                  <div className="flex gap-1">
                    <Button size="sm" className="h-7 text-[9px] rounded-xl gap-0.5" onClick={(e) => { e.stopPropagation(); toast.success('Approved'); }}><CheckCircle2 className="h-3 w-3" />Approve</Button>
                    <Button variant="outline" size="sm" className="h-7 w-7 p-0 rounded-xl" onClick={(e) => { e.stopPropagation(); toast.info('Declined'); }}><Ban className="h-3 w-3" /></Button>
                  </div>
                ) : m.role !== 'owner' ? (
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-0.5 shrink-0"><MessageSquare className="h-3 w-3" />Message</Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><MoreHorizontal className="h-3 w-3" /></Button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>

          {MEMBERS.some(m => m.role === 'pending') && (
            <div className="rounded-2xl border border-[hsl(var(--gigvora-amber)/0.3)] bg-[hsl(var(--gigvora-amber)/0.05)] p-3 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[9px]"><span className="font-semibold">Pending Requests.</span> There are member requests awaiting your approval.</div>
            </div>
          )}
        </div>
      )}

      {/* ── RESOURCES TAB ── */}
      {activeTab === 'resources' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">Shared Resources</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Share Resource</Button>
          </div>
          {[
            { name: 'React Patterns Cheatsheet', type: 'PDF', group: 'React & Frontend Engineers', shared: '1w ago', downloads: 340, icon: FileText },
            { name: 'Series A Pitch Template', type: 'Google Slides', group: 'Startup Founders Circle', shared: '2w ago', downloads: 89, icon: FileText },
            { name: 'Design Token Spec v2', type: 'Figma', group: 'Design Systems Guild', shared: '3d ago', downloads: 45, icon: FileText },
            { name: 'PM Interview Prep Guide', type: 'Notion', group: 'Product Management Hub', shared: '1m ago', downloads: 520, icon: FileText },
            { name: 'LLM Fine-Tuning Notebook', type: 'Jupyter', group: 'AI/ML Research Network', shared: '5d ago', downloads: 178, icon: FileText },
          ].map((r, i) => (
            <div key={i} className="rounded-2xl border bg-card p-3.5 flex items-center gap-3 hover:shadow-sm hover:bg-muted/20 cursor-pointer transition-all duration-200 group">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center shrink-0 transition-transform group-hover:scale-105">
                <r.icon className="h-4 w-4 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{r.name}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5">{r.type} · {r.group} · {r.shared}</div>
              </div>
              <div className="text-center shrink-0">
                <div className="text-[10px] font-semibold">{r.downloads}</div>
                <div className="text-[7px] text-muted-foreground">downloads</div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 shrink-0"><Eye className="h-3 w-3" />View</Button>
            </div>
          ))}
        </div>
      )}

      {/* ── EVENTS TAB ── */}
      {activeTab === 'events' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold">Upcoming Events</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Event</Button>
          </div>
          {MOCK_EVENTS.map(ev => (
            <div key={ev.id} className="rounded-2xl border overflow-hidden hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all duration-200 group">
              <div className="h-20 bg-gradient-to-br from-accent/20 via-primary/10 to-muted relative flex items-center justify-center">
                <Calendar className="h-6 w-6 text-muted-foreground/20" />
                {ev.live && (
                  <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-destructive text-destructive-foreground text-[8px] font-bold animate-pulse">
                    <div className="h-1.5 w-1.5 rounded-full bg-white" /> LIVE
                  </div>
                )}
              </div>
              <div className="p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Badge variant="secondary" className="text-[7px] rounded-lg">{ev.type}</Badge>
                  <span className="text-[11px] font-semibold group-hover:text-accent transition-colors">{ev.title}</span>
                </div>
                <div className="text-[9px] text-muted-foreground mb-2">{ev.group}</div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                    <span className="flex items-center gap-0.5"><Calendar className="h-3 w-3" />{ev.date}</span>
                    <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{ev.time}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-5 w-5 rounded-full bg-muted border-2 border-card" />
                      ))}
                    </div>
                    <span className="text-[8px] text-muted-foreground">+{ev.attendees}</span>
                  </div>
                </div>
                <div className="flex gap-1.5 mt-2.5">
                  <Button size="sm" className="h-7 text-[9px] flex-1 rounded-xl gap-1"><CheckCircle2 className="h-3 w-3" />RSVP</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Share2 className="h-3 w-3" />Share</Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded-xl"><Bookmark className="h-3 w-3" /></Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drawers */}
      <GroupDrawer group={selectedGroup} open={!!selectedGroup} onClose={() => setSelectedGroup(null)} />
      <CreateGroupDrawer open={createOpen} onClose={() => setCreateOpen(false)} />
    </DashboardLayout>
  );
};

export default CommunityGroupsPage;
