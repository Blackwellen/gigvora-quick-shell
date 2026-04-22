import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Users, Plus, Search, Settings, MoreVertical, Crown,
  Shield, UserPlus, Bell, BellOff, Pin, Archive,
  Image, Paperclip, Send, Phone, Video, Smile,
  Star, MessageSquare, Hash, Lock, Globe, Calendar,
  FileText, Link2, ExternalLink, ChevronRight, X,
} from 'lucide-react';

const GROUPS = [
  { id: 'g1', name: 'Design Team', initials: 'DT', members: 8, unread: 5, lastMsg: 'Alex: Updated the mockups 🎨', time: '2m', pinned: true, role: 'admin', avatar: null, description: 'UI/UX design discussions', isPrivate: false },
  { id: 'g2', name: 'Freelancer Hub', initials: 'FH', members: 15, unread: 3, lastMsg: 'Jordan: New gig opportunity posted', time: '4h', pinned: true, role: 'member', avatar: null, description: 'Freelancer collaborations', isPrivate: false },
  { id: 'g3', name: 'Project Alpha', initials: 'PA', members: 5, unread: 0, lastMsg: 'Sarah: Sprint review tomorrow', time: '1d', pinned: false, role: 'admin', avatar: null, description: 'Alpha project coordination', isPrivate: true },
  { id: 'g4', name: 'Client Success', initials: 'CS', members: 12, unread: 1, lastMsg: 'Marcus: Client feedback received', time: '6h', pinned: false, role: 'moderator', avatar: null, description: 'Client relationships', isPrivate: false },
  { id: 'g5', name: 'Hiring Pipeline', initials: 'HP', members: 4, unread: 0, lastMsg: 'Elena: Two new applications', time: '2d', pinned: false, role: 'member', avatar: null, description: 'Recruitment discussions', isPrivate: true },
  { id: 'g6', name: 'Content Creators', initials: 'CC', members: 22, unread: 8, lastMsg: 'Lisa: Blog draft ready for review', time: '30m', pinned: false, role: 'member', avatar: null, description: 'Content strategy and creation', isPrivate: false },
];

const MEMBERS = [
  { id: 'm1', name: 'Sarah Chen', initials: 'SC', role: 'admin', online: true, headline: 'Senior Designer' },
  { id: 'm2', name: 'Alex Kim', initials: 'AK', role: 'moderator', online: true, headline: 'UI/UX Designer' },
  { id: 'm3', name: 'Marcus Johnson', initials: 'MJ', role: 'member', online: false, headline: 'Developer' },
  { id: 'm4', name: 'Elena Rodriguez', initials: 'ER', role: 'member', online: true, headline: 'PM' },
  { id: 'm5', name: 'Priya Sharma', initials: 'PS', role: 'member', online: false, headline: 'Marketing' },
  { id: 'm6', name: 'Jordan Lee', initials: 'JL', role: 'member', online: true, headline: 'Agency Lead' },
  { id: 'm7', name: 'David Park', initials: 'DP', role: 'member', online: false, headline: 'Engineer' },
  { id: 'm8', name: 'Lisa Wang', initials: 'LW', role: 'member', online: true, headline: 'Content Writer' },
];

const MESSAGES = [
  { id: 1, sender: 'Alex Kim', initials: 'AK', text: 'Updated the homepage mockups — check the new hero section 🎨', time: '10:30 AM', reactions: [{ emoji: '🔥', count: 3 }, { emoji: '👍', count: 2 }] },
  { id: 2, sender: 'Sarah Chen', initials: 'SC', text: 'Love it! The gradient on the CTA really pops. Can we also explore a dark mode variant?', time: '10:35 AM', reactions: [{ emoji: '💯', count: 1 }] },
  { id: 3, sender: 'You', initials: 'YO', text: 'Great work Alex! I\'ll review the Figma file this afternoon and leave comments.', time: '10:40 AM', reactions: [] },
  { id: 4, sender: 'Marcus Johnson', initials: 'MJ', text: 'The component structure looks clean. I can start implementing the frontend after final approval.', time: '10:45 AM', reactions: [{ emoji: '🚀', count: 2 }] },
  { id: 5, sender: 'Elena Rodriguez', initials: 'ER', text: 'Timeline check — we need the design finalized by Thursday for the sprint review. @Alex can you confirm?', time: '11:00 AM', reactions: [] },
];

const roleIcons: Record<string, React.ReactNode> = {
  admin: <Crown className="h-2.5 w-2.5 text-[hsl(var(--gigvora-amber))]" />,
  moderator: <Shield className="h-2.5 w-2.5 text-accent" />,
  member: null,
};

type ViewTab = 'all' | 'pinned' | 'private' | 'created';

export default function GroupChatsPage() {
  const [activeGroup, setActiveGroup] = useState<string>('g1');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [viewTab, setViewTab] = useState<ViewTab>('all');
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const group = GROUPS.find(g => g.id === activeGroup);

  const filteredGroups = GROUPS.filter(g => {
    if (search && !g.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (viewTab === 'pinned') return g.pinned;
    if (viewTab === 'private') return g.isPrivate;
    if (viewTab === 'created') return g.role === 'admin';
    return true;
  });

  const GIF_GRID = [
    { id: 'g1', label: 'Thumbs Up', emoji: '👍' },
    { id: 'g2', label: 'Celebrate', emoji: '🎉' },
    { id: 'g3', label: 'Mind Blown', emoji: '🤯' },
    { id: 'g4', label: 'Applause', emoji: '👏' },
    { id: 'g5', label: 'Fire', emoji: '🔥' },
    { id: 'g6', label: 'Love It', emoji: '❤️' },
    { id: 'g7', label: 'Rocket', emoji: '🚀' },
    { id: 'g8', label: 'Think', emoji: '🤔' },
    { id: 'g9', label: 'LOL', emoji: '😂' },
    { id: 'g10', label: 'Cool', emoji: '😎' },
    { id: 'g11', label: 'Wave', emoji: '👋' },
    { id: 'g12', label: 'Dance', emoji: '💃' },
  ];

  const STICKER_GRID = [
    { id: 's1', label: 'Happy Star', emoji: '⭐' },
    { id: 's2', label: 'Rainbow', emoji: '🌈' },
    { id: 's3', label: 'Trophy', emoji: '🏆' },
    { id: 's4', label: 'Heart Eyes', emoji: '😍' },
    { id: 's5', label: 'High Five', emoji: '🙌' },
    { id: 's6', label: 'Lightning', emoji: '⚡' },
    { id: 's7', label: 'Sparkles', emoji: '✨' },
    { id: 's8', label: 'Sunglasses', emoji: '😎' },
  ];

  const rightRail = group ? (
    <div className="space-y-3">
      <div className="rounded-2xl border p-3.5 text-center">
        <Avatar className="h-12 w-12 mx-auto mb-2 ring-2 ring-accent/20">
          <AvatarFallback className="bg-accent/10 text-accent text-sm font-bold">{group.initials}</AvatarFallback>
        </Avatar>
        <div className="text-[11px] font-bold">{group.name}</div>
        <div className="text-[8px] text-muted-foreground mb-1.5">{group.description}</div>
        <div className="flex items-center justify-center gap-2 text-[8px] text-muted-foreground mb-2">
          <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{group.members} members</span>
          {group.isPrivate ? <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg gap-0.5"><Lock className="h-2 w-2" />Private</Badge> : <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg gap-0.5"><Globe className="h-2 w-2" />Public</Badge>}
        </div>
        <div className="flex gap-1">
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1 gap-0.5"><Phone className="h-2.5 w-2.5" />Call</Button>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1 gap-0.5"><Video className="h-2.5 w-2.5" />Video</Button>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1 gap-0.5"><Settings className="h-2.5 w-2.5" /></Button>
        </div>
      </div>

      <SectionCard title="Members" subtitle={`${MEMBERS.length}`} action={<Button variant="ghost" size="sm" className="h-5 w-5 p-0"><UserPlus className="h-3 w-3" /></Button>} className="!rounded-2xl">
        <div className="space-y-0.5">
          {MEMBERS.map(m => (
            <div key={m.id} className="flex items-center gap-2 py-1.5 rounded-lg hover:bg-muted/20 px-1 cursor-pointer transition-all">
              <div className="relative shrink-0">
                <Avatar className="h-6 w-6"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{m.initials}</AvatarFallback></Avatar>
                {m.online && <span className="absolute bottom-0 right-0 h-1.5 w-1.5 rounded-full bg-[hsl(var(--state-healthy))] border border-card" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-medium truncate flex items-center gap-1">{m.name} {roleIcons[m.role]}</div>
                <div className="text-[7px] text-muted-foreground">{m.headline}</div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Shared Files" className="!rounded-2xl">
        {[
          { name: 'Homepage_v3.fig', size: '4.2 MB', date: 'Today' },
          { name: 'Brand_Guide.pdf', size: '1.8 MB', date: 'Apr 12' },
        ].map((f, i) => (
          <div key={i} className="flex items-center gap-2 py-1.5 hover:bg-muted/20 rounded-lg px-1 cursor-pointer">
            <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="text-[8px] font-medium truncate">{f.name}</div>
              <div className="text-[7px] text-muted-foreground">{f.size} · {f.date}</div>
            </div>
          </div>
        ))}
      </SectionCard>
    </div>
  ) : null;

  return (
    <DashboardLayout
      topStrip={
        <>
          <Users className="h-4 w-4 text-accent" />
          <span className="text-xs font-bold">Group Chats</span>
          <Badge className="bg-accent text-accent-foreground text-[7px] h-4 px-1.5 rounded-lg">{GROUPS.reduce((a, g) => a + g.unread, 0)} unread</Badge>
          <div className="flex-1" />
          <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />New Group</Button>
        </>
      }
      rightRail={rightRail}
      rightRailWidth="w-56"
    >
      <div className="flex h-[calc(100vh-200px)] rounded-2xl border overflow-hidden bg-card">
        {/* Sidebar */}
        <div className="w-64 border-r flex flex-col shrink-0">
          <div className="px-2 py-2 border-b">
            <div className="relative mb-1.5">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search groups..." className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent/30" />
            </div>
            <div className="flex gap-0.5">
              {(['all', 'pinned', 'private', 'created'] as ViewTab[]).map(t => (
                <button key={t} onClick={() => setViewTab(t)} className={cn('flex-1 py-1 text-[8px] font-semibold rounded-lg transition-all capitalize', viewTab === t ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/30')}>{t}</button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {filteredGroups.map(g => (
              <button key={g.id} onClick={() => setActiveGroup(g.id)} className={cn('w-full flex items-center gap-2.5 p-2.5 rounded-xl transition-all text-left', activeGroup === g.id ? 'bg-accent/8 ring-1 ring-accent/20' : 'hover:bg-muted/30')}>
                <div className="relative shrink-0">
                  <Avatar className="h-9 w-9 ring-1 ring-muted/40"><AvatarFallback className="text-[9px] font-bold bg-accent/10 text-accent">{g.initials}</AvatarFallback></Avatar>
                  {g.pinned && <Pin className="absolute -top-0.5 -right-0.5 h-3 w-3 text-accent bg-card rounded-full p-[1px]" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn('text-[10px] truncate', g.unread > 0 ? 'font-bold' : 'font-medium')}>{g.name}</span>
                    <span className="text-[7px] text-muted-foreground shrink-0 ml-1">{g.time}</span>
                  </div>
                  <p className={cn('text-[8px] truncate', g.unread > 0 ? 'text-foreground' : 'text-muted-foreground')}>{g.lastMsg}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Users className="h-2 w-2" />{g.members}</span>
                    {g.isPrivate && <Lock className="h-2 w-2 text-muted-foreground" />}
                    {g.unread > 0 && <span className="bg-accent text-accent-foreground text-[7px] font-bold rounded-full h-3.5 min-w-[14px] flex items-center justify-center px-1">{g.unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        {group ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <div className="flex items-center gap-2.5">
                <Avatar className="h-8 w-8"><AvatarFallback className="bg-accent/10 text-accent text-[9px] font-bold">{group.initials}</AvatarFallback></Avatar>
                <div>
                  <div className="text-[11px] font-bold flex items-center gap-1.5">{group.name} <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">{group.members} members</Badge></div>
                  <div className="text-[8px] text-muted-foreground">{group.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><Phone className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><Video className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><Pin className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><Settings className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-center"><Badge variant="secondary" className="text-[7px] rounded-lg">Today</Badge></div>
              {MESSAGES.map(msg => (
                <div key={msg.id} className={cn('flex gap-2.5', msg.sender === 'You' ? 'flex-row-reverse' : '')}>
                  {msg.sender !== 'You' && (
                    <Avatar className="h-7 w-7 shrink-0 mt-0.5 ring-1 ring-muted/40"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{msg.initials}</AvatarFallback></Avatar>
                  )}
                  <div className={cn('max-w-[70%]')}>
                    {msg.sender !== 'You' && <div className="text-[8px] font-semibold text-muted-foreground mb-0.5 px-1">{msg.sender}</div>}
                    <div className={cn('rounded-2xl px-3.5 py-2.5 text-[10px]', msg.sender === 'You' ? 'bg-accent/10 rounded-tr-sm' : 'bg-muted/40 rounded-tl-sm')}>
                      <p className="leading-relaxed">{msg.text}</p>
                    </div>
                    {msg.reactions.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5 px-1">
                        {msg.reactions.map((r, i) => (
                          <span key={i} className="text-[9px] bg-muted/40 rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-muted">{r.emoji} {r.count}</span>
                        ))}
                        <button className="text-[9px] text-muted-foreground hover:text-foreground px-1">+</button>
                      </div>
                    )}
                    <div className="text-[7px] text-muted-foreground mt-0.5 px-1">{msg.time}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Composer with GIF/Sticker pickers */}
            <div className="border-t px-4 py-3 relative">
              {showGifPicker && (
                <div className="absolute bottom-16 left-4 right-4 bg-card border rounded-2xl shadow-xl p-3 z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold">GIFs</span>
                    <div className="flex items-center gap-1">
                      <input placeholder="Search GIFs..." className="h-6 rounded-lg border bg-background px-2 text-[9px] w-40 focus:outline-none focus:ring-1 focus:ring-accent/30" />
                      <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={() => setShowGifPicker(false)}><X className="h-3 w-3" /></Button>
                    </div>
                  </div>
                  <div className="grid grid-cols-6 gap-1.5">
                    {GIF_GRID.map(g => (
                      <button key={g.id} onClick={() => { toast.success(`Sent ${g.label} GIF`); setShowGifPicker(false); }} className="h-14 rounded-xl bg-muted/30 hover:bg-accent/10 flex items-center justify-center text-2xl transition-all hover:scale-110">{g.emoji}</button>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-2 overflow-x-auto">
                    {['Trending', 'Reactions', 'Celebrate', 'Love', 'Funny', 'Sad'].map(cat => (
                      <Button key={cat} variant="outline" size="sm" className="h-5 text-[7px] rounded-lg shrink-0">{cat}</Button>
                    ))}
                  </div>
                </div>
              )}
              {showStickerPicker && (
                <div className="absolute bottom-16 left-4 right-4 bg-card border rounded-2xl shadow-xl p-3 z-10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold">Stickers</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 rounded-md" onClick={() => setShowStickerPicker(false)}><X className="h-3 w-3" /></Button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {STICKER_GRID.map(s => (
                      <button key={s.id} onClick={() => { toast.success(`Sent ${s.label} sticker`); setShowStickerPicker(false); }} className="h-16 rounded-xl bg-muted/20 hover:bg-accent/10 flex flex-col items-center justify-center gap-0.5 transition-all hover:scale-105">
                        <span className="text-3xl">{s.emoji}</span>
                        <span className="text-[7px] text-muted-foreground">{s.label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-1 mt-2">
                    {['Popular', 'Cute', 'Funny', 'Work'].map(cat => (
                      <Button key={cat} variant="outline" size="sm" className="h-5 text-[7px] rounded-lg shrink-0">{cat}</Button>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0"><Paperclip className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0"><Image className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0 text-lg" onClick={() => { setShowGifPicker(!showGifPicker); setShowStickerPicker(false); }}>🎭</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={() => { setShowStickerPicker(!showStickerPicker); setShowGifPicker(false); }}>
                  <span className="text-lg">🏷️</span>
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0"><Smile className="h-4 w-4" /></Button>
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type a message..." className="flex-1 h-9 rounded-2xl border bg-background px-4 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" onKeyDown={e => { if (e.key === 'Enter' && message.trim()) { toast.success('Message sent'); setMessage(''); } }} />
                <Button size="icon" className="h-9 w-9 rounded-2xl shrink-0" disabled={!message.trim()} onClick={() => { toast.success('Message sent'); setMessage(''); }}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-center">
            <div>
              <Users className="h-10 w-10 text-muted-foreground/20 mx-auto mb-3" />
              <div className="text-sm font-semibold">Select a group</div>
              <div className="text-[10px] text-muted-foreground mt-1">Choose a group chat to start messaging</div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
