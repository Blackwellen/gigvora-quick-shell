import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  MessageSquare, X, Minimize2, Maximize2, Send, Paperclip,
  Smile, Phone, Video, Search, Plus, Loader2, ArrowLeft,
  Users, Hash, UserPlus, Star, MoreHorizontal, Image,
  ChevronRight, Settings, Bell, BellOff, Pin, Edit3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

/* ─── Mock Data ─── */
const RECENT_CHATS = [
  { id: '1', name: 'Sarah Chen', initials: 'SC', lastMsg: 'Sounds great! Let me know when...', time: '2m', unread: 2, online: true, type: 'dm' as const },
  { id: '2', name: 'Marcus Johnson', initials: 'MJ', lastMsg: 'The deliverables are ready for review', time: '15m', unread: 0, online: true, type: 'dm' as const },
  { id: '3', name: 'Design Team', initials: 'DT', lastMsg: 'Alex: Updated the mockups 🎨', time: '1h', unread: 5, online: false, type: 'group' as const, members: 8 },
  { id: '4', name: '#product-launch', initials: '#', lastMsg: 'Priya: Timeline confirmed for Q2', time: '2h', unread: 12, online: false, type: 'channel' as const, members: 24 },
  { id: '5', name: 'Elena Rodriguez', initials: 'ER', lastMsg: 'Invoice attached for milestone 2', time: '3h', unread: 1, online: false, type: 'dm' as const },
  { id: '6', name: 'Freelancer Hub', initials: 'FH', lastMsg: 'Jordan: New gig opportunity posted', time: '4h', unread: 3, online: false, type: 'group' as const, members: 15 },
  { id: '7', name: '#engineering', initials: '#', lastMsg: 'Build passed — deploying now', time: '5h', unread: 0, online: false, type: 'channel' as const, members: 42 },
];

const SEARCH_PEOPLE = [
  { id: 'p1', name: 'Sarah Chen', initials: 'SC', headline: 'Senior Designer · Figma', online: true },
  { id: 'p2', name: 'Marcus Johnson', initials: 'MJ', headline: 'Full-Stack Developer', online: true },
  { id: 'p3', name: 'Elena Rodriguez', initials: 'ER', headline: 'Project Manager', online: false },
  { id: 'p4', name: 'Alex Kim', initials: 'AK', headline: 'UI/UX Designer', online: true },
  { id: 'p5', name: 'Priya Sharma', initials: 'PS', headline: 'Marketing Lead', online: false },
  { id: 'p6', name: 'Jordan Lee', initials: 'JL', headline: 'Agency Lead · PixelForge', online: true },
  { id: 'p7', name: 'David Park', initials: 'DP', headline: 'Backend Engineer', online: false },
  { id: 'p8', name: 'Lisa Wang', initials: 'LW', headline: 'Content Strategist', online: true },
];

const GROUP_CHATS = [
  { id: 'g1', name: 'Design Team', initials: 'DT', members: 8, lastActive: '2m ago', description: 'UI/UX and design discussions' },
  { id: 'g2', name: 'Freelancer Hub', initials: 'FH', members: 15, lastActive: '1h ago', description: 'Gig collaborations and tips' },
  { id: 'g3', name: 'Project Alpha', initials: 'PA', members: 5, lastActive: '3h ago', description: 'Alpha project coordination' },
  { id: 'g4', name: 'Client Success', initials: 'CS', members: 12, lastActive: '30m ago', description: 'Client relationships and support' },
];

const CHANNELS = [
  { id: 'c1', name: '#product-launch', members: 24, unread: 12, description: 'Q2 product launch coordination', pinned: true },
  { id: 'c2', name: '#engineering', members: 42, unread: 0, description: 'Engineering discussions and updates', pinned: true },
  { id: 'c3', name: '#general', members: 156, unread: 8, description: 'Company-wide announcements', pinned: false },
  { id: 'c4', name: '#hiring', members: 18, unread: 3, description: 'Open roles and referrals', pinned: false },
  { id: 'c5', name: '#design-system', members: 11, unread: 0, description: 'Design tokens and component library', pinned: false },
  { id: 'c6', name: '#random', members: 134, unread: 22, description: 'Water cooler chat', pinned: false },
];

type BubbleTab = 'chats' | 'groups' | 'channels' | 'people';
type MiniChat = { id: string; name: string; initials: string; type: 'dm' | 'group' | 'channel' } | null;

const BUBBLE_COLOR = 'hsl(var(--gigvora-blue-light))';

const MessagingBubble: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [tab, setTab] = useState<BubbleTab>('chats');
  const [search, setSearch] = useState('');
  const [miniChat, setMiniChat] = useState<MiniChat>(null);
  const [miniMsg, setMiniMsg] = useState('');
  const [showNewGroup, setShowNewGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const totalUnread = RECENT_CHATS.reduce((a, c) => a + c.unread, 0) + CHANNELS.reduce((a, c) => a + c.unread, 0);

  const filteredChats = search ? RECENT_CHATS.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : RECENT_CHATS;
  const filteredGroups = search ? GROUP_CHATS.filter(g => g.name.toLowerCase().includes(search.toLowerCase())) : GROUP_CHATS;
  const filteredChannels = search ? CHANNELS.filter(c => c.name.toLowerCase().includes(search.toLowerCase())) : CHANNELS;
  const filteredPeople = search ? SEARCH_PEOPLE.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.headline.toLowerCase().includes(search.toLowerCase())) : SEARCH_PEOPLE;

  const openChat = (item: { id: string; name: string; initials: string }, type: 'dm' | 'group' | 'channel') => {
    setMiniChat({ ...item, type });
    setShowNewGroup(false);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const createGroupChat = () => {
    if (!newGroupName.trim() || selectedMembers.length < 2) {
      toast.error('Enter a group name and select at least 2 members');
      return;
    }
    toast.success(`Group "${newGroupName}" created!`);
    setShowNewGroup(false);
    setNewGroupName('');
    setSelectedMembers([]);
  };

  /* ── Closed / Minimized states ── */
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="hidden md:flex fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-xl hover:shadow-2xl transition-all items-center justify-center group hover:scale-105"
        style={{ backgroundColor: BUBBLE_COLOR }}
      >
        <MessageSquare className="h-6 w-6 text-white" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
            {totalUnread}
          </span>
        )}
      </button>
    );
  }

  if (minimized) {
    return (
      <div className="hidden md:flex fixed bottom-6 right-6 z-50 items-center gap-2">
        <button
          onClick={() => setMinimized(false)}
          className="h-14 rounded-full text-white shadow-xl px-4 flex items-center gap-2 hover:shadow-2xl transition-all"
          style={{ backgroundColor: BUBBLE_COLOR }}
        >
          <MessageSquare className="h-5 w-5" />
          <span className="text-sm font-medium">Messages</span>
          {totalUnread > 0 && <Badge className="bg-destructive text-destructive-foreground h-5 px-1.5 text-[10px]">{totalUnread}</Badge>}
        </button>
        <button onClick={() => setOpen(false)} className="h-8 w-8 rounded-full bg-muted text-muted-foreground flex items-center justify-center hover:bg-destructive/10 hover:text-destructive"><X className="h-4 w-4" /></button>
      </div>
    );
  }

  /* ── Main open panel ── */
  return (
    <div className="hidden md:flex fixed bottom-6 right-6 z-50 w-[380px] h-[520px] rounded-2xl border bg-card shadow-2xl flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b text-white" style={{ backgroundColor: BUBBLE_COLOR }}>
        <div className="flex items-center gap-2">
          {miniChat ? (
            <button onClick={() => { setMiniChat(null); }} className="mr-1 hover:opacity-80"><ArrowLeft className="h-4 w-4" /></button>
          ) : showNewGroup ? (
            <button onClick={() => setShowNewGroup(false)} className="mr-1 hover:opacity-80"><ArrowLeft className="h-4 w-4" /></button>
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          <span className="font-semibold text-sm">
            {miniChat ? miniChat.name : showNewGroup ? 'New Group Chat' : 'Messages'}
          </span>
          {!miniChat && !showNewGroup && totalUnread > 0 && (
            <Badge className="bg-white/20 text-white text-[7px] h-4 px-1.5 rounded-lg">{totalUnread}</Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          {miniChat && (
            <>
              <button className="p-1.5 rounded-lg hover:bg-white/10"><Phone className="h-3.5 w-3.5" /></button>
              <button className="p-1.5 rounded-lg hover:bg-white/10"><Video className="h-3.5 w-3.5" /></button>
            </>
          )}
          <button onClick={() => setMinimized(true)} className="p-1.5 rounded-lg hover:bg-white/10"><Minimize2 className="h-3.5 w-3.5" /></button>
          <Link to="/inbox" onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10"><Maximize2 className="h-3.5 w-3.5" /></Link>
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-white/10"><X className="h-3.5 w-3.5" /></button>
        </div>
      </div>

      {/* ── Mini Chat View ── */}
      {miniChat && (
        <>
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            <div className="text-center"><Badge variant="secondary" className="text-[7px] rounded-lg">Today</Badge></div>
            {[
              { from: 'them', text: "Hey! How's the project going?", time: '10:30 AM' },
              { from: 'me', text: 'Great! Just finished the latest iteration. Want to take a look?', time: '10:35 AM' },
              { from: 'them', text: 'Yes please! Send it over 🎉', time: '10:36 AM' },
            ].map((m, i) => (
              <div key={i} className={cn('flex gap-2 max-w-[80%]', m.from === 'me' ? 'ml-auto flex-row-reverse' : '')}>
                {m.from !== 'me' && (
                  <Avatar className="h-5 w-5 shrink-0 mt-0.5">
                    <AvatarFallback className="text-[6px] bg-accent/10 text-accent">{miniChat.initials}</AvatarFallback>
                  </Avatar>
                )}
                <div>
                  <div className={cn('rounded-2xl px-3 py-1.5 text-[10px]', m.from === 'me' ? 'bg-[hsl(var(--gigvora-blue-light)/0.15)] rounded-tr-sm' : 'bg-muted/40 rounded-tl-sm')}>
                    {m.text}
                  </div>
                  <div className="text-[7px] text-muted-foreground mt-0.5 px-1">{m.time}</div>
                </div>
              </div>
            ))}
          </div>
          {/* Composer */}
          <div className="border-t px-2.5 py-2 flex items-center gap-1.5">
            <button className="p-1 text-muted-foreground hover:text-foreground"><Paperclip className="h-3.5 w-3.5" /></button>
            <button className="p-1 text-muted-foreground hover:text-foreground"><Image className="h-3.5 w-3.5" /></button>
            <button className="p-1 text-muted-foreground hover:text-foreground text-[14px]">🎭</button>
            <button className="p-1 text-muted-foreground hover:text-foreground"><Smile className="h-3.5 w-3.5" /></button>
            <input
              value={miniMsg}
              onChange={e => setMiniMsg(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 h-7 rounded-xl border bg-background px-3 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent/30"
              onKeyDown={e => { if (e.key === 'Enter' && miniMsg.trim()) { toast.success('Message sent'); setMiniMsg(''); } }}
            />
            <Button size="icon" className="h-7 w-7 rounded-xl shrink-0" disabled={!miniMsg.trim()} onClick={() => { toast.success('Message sent'); setMiniMsg(''); }}>
              <Send className="h-3 w-3" />
            </Button>
          </div>
        </>
      )}

      {/* ── New Group Chat View ── */}
      {!miniChat && showNewGroup && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-3 py-2 border-b space-y-2">
            <input
              value={newGroupName}
              onChange={e => setNewGroupName(e.target.value)}
              placeholder="Group name..."
              className="w-full h-8 rounded-xl border bg-background px-3 text-xs focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search people to add..."
              className="w-full h-7 rounded-xl border bg-background px-3 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent/30"
            />
            {selectedMembers.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedMembers.map(id => {
                  const p = SEARCH_PEOPLE.find(pp => pp.id === id);
                  return p ? (
                    <Badge key={id} variant="secondary" className="text-[8px] gap-0.5 rounded-lg cursor-pointer" onClick={() => toggleMember(id)}>
                      {p.name} <X className="h-2 w-2" />
                    </Badge>
                  ) : null;
                })}
              </div>
            )}
          </div>
          <div className="flex-1 overflow-y-auto py-1">
            {filteredPeople.map(person => (
              <button
                key={person.id}
                onClick={() => toggleMember(person.id)}
                className={cn('w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-all', selectedMembers.includes(person.id) && 'bg-accent/5')}
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-[9px] font-bold bg-accent/10 text-accent">{person.initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-[10px] font-semibold truncate">{person.name}</div>
                  <div className="text-[8px] text-muted-foreground truncate">{person.headline}</div>
                </div>
                {selectedMembers.includes(person.id) && (
                  <div className="h-5 w-5 rounded-full bg-accent flex items-center justify-center">
                    <span className="text-accent-foreground text-[8px]">✓</span>
                  </div>
                )}
              </button>
            ))}
          </div>
          <div className="border-t px-3 py-2">
            <Button size="sm" className="w-full h-8 text-xs rounded-xl gap-1" onClick={createGroupChat} disabled={!newGroupName.trim() || selectedMembers.length < 2}>
              <Users className="h-3 w-3" /> Create Group ({selectedMembers.length} selected)
            </Button>
          </div>
        </div>
      )}

      {/* ── Main Panel ── */}
      {!miniChat && !showNewGroup && (
        <>
          {/* Tabs */}
          <div className="flex gap-0.5 px-2.5 py-1.5 border-b bg-muted/5">
            {([
              { id: 'chats' as BubbleTab, label: 'Chats', icon: MessageSquare },
              { id: 'groups' as BubbleTab, label: 'Groups', icon: Users },
              { id: 'channels' as BubbleTab, label: 'Channels', icon: Hash },
              { id: 'people' as BubbleTab, label: 'People', icon: Search },
            ]).map(t => (
              <button
                key={t.id}
                onClick={() => { setTab(t.id); setSearch(''); }}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1 py-1.5 text-[9px] font-semibold rounded-lg transition-all',
                  tab === t.id ? 'bg-[hsl(var(--gigvora-blue-light)/0.15)] text-[hsl(var(--gigvora-blue))]' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
                )}
              >
                <t.icon className="h-3 w-3" />{t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="px-2.5 py-1.5 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={tab === 'people' ? 'Search people...' : tab === 'groups' ? 'Search groups...' : tab === 'channels' ? 'Search channels...' : 'Search chats...'}
                className="w-full h-7 rounded-xl border bg-background pl-7 pr-7 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent/30"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2"><X className="h-3 w-3 text-muted-foreground" /></button>
              )}
            </div>
          </div>

          {/* Actions bar */}
          <div className="px-2.5 py-1 border-b flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 flex-1" onClick={() => { setTab('people'); setSearch(''); }}>
              <Edit3 className="h-2.5 w-2.5" /> New Chat
            </Button>
            <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 flex-1" onClick={() => setShowNewGroup(true)}>
              <UserPlus className="h-2.5 w-2.5" /> New Group
            </Button>
            <Link to="/inbox" onClick={() => setOpen(false)} className="flex-1">
              <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5 w-full">
                <Maximize2 className="h-2.5 w-2.5" /> Full Inbox
              </Button>
            </Link>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Chats */}
            {tab === 'chats' && (
              <div className="py-1">
                {filteredChats.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-muted-foreground">No chats found</div>
                ) : filteredChats.map(chat => (
                  <button
                    key={chat.id}
                    onClick={() => openChat({ id: chat.id, name: chat.name, initials: chat.initials }, chat.type)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-all"
                  >
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9 ring-1 ring-muted/40">
                        <AvatarFallback className={cn('text-[9px] font-bold',
                          chat.type === 'channel' ? 'bg-[hsl(var(--gigvora-blue)/0.1)] text-[hsl(var(--gigvora-blue))]' :
                          chat.type === 'group' ? 'bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]' :
                          'bg-accent/10 text-accent'
                        )}>
                          {chat.type === 'channel' ? '#' : chat.initials}
                        </AvatarFallback>
                      </Avatar>
                      {chat.online && chat.type === 'dm' && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[hsl(var(--state-healthy))] border-2 border-card" />}
                      {chat.type === 'group' && <Users className="absolute -bottom-0.5 -right-0.5 h-3 w-3 text-muted-foreground bg-card rounded-full p-[1px]" />}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-[10px] truncate', chat.unread > 0 ? 'font-bold' : 'font-medium')}>{chat.name}</span>
                        <span className="text-[7px] text-muted-foreground shrink-0 ml-1">{chat.time}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className={cn('text-[8px] truncate', chat.unread > 0 ? 'text-foreground' : 'text-muted-foreground')}>{chat.lastMsg}</p>
                        {chat.unread > 0 && <span className="bg-accent text-accent-foreground text-[7px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 shrink-0">{chat.unread}</span>}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Groups */}
            {tab === 'groups' && (
              <div className="py-1">
                <div className="px-3 py-1.5 flex items-center justify-between">
                  <span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Your Groups</span>
                  <Button variant="ghost" size="sm" className="h-5 text-[8px] rounded-lg gap-0.5" onClick={() => setShowNewGroup(true)}><Plus className="h-2.5 w-2.5" />Create</Button>
                </div>
                {filteredGroups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => openChat({ id: group.id, name: group.name, initials: group.initials }, 'group')}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-muted/30 transition-all"
                  >
                    <Avatar className="h-9 w-9 ring-1 ring-muted/40">
                      <AvatarFallback className="text-[9px] font-bold bg-[hsl(var(--gigvora-amber)/0.1)] text-[hsl(var(--gigvora-amber))]">{group.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-[10px] font-semibold truncate">{group.name}</div>
                      <div className="text-[8px] text-muted-foreground truncate">{group.description}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Users className="h-2 w-2" />{group.members}</span>
                        <span className="text-[7px] text-muted-foreground">Active {group.lastActive}</span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Channels */}
            {tab === 'channels' && (
              <div className="py-1">
                {filteredChannels.filter(c => c.pinned).length > 0 && (
                  <>
                    <div className="px-3 py-1.5"><span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">Pinned</span></div>
                    {filteredChannels.filter(c => c.pinned).map(ch => (
                      <button key={ch.id} onClick={() => openChat({ id: ch.id, name: ch.name, initials: '#' }, 'channel')} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-all">
                        <div className="h-9 w-9 rounded-xl bg-[hsl(var(--gigvora-blue)/0.1)] flex items-center justify-center shrink-0">
                          <Hash className="h-4 w-4 text-[hsl(var(--gigvora-blue))]" />
                        </div>
                        <div className="flex-1 min-w-0 text-left">
                          <div className="flex items-center justify-between">
                            <span className={cn('text-[10px] truncate', ch.unread > 0 ? 'font-bold' : 'font-medium')}>{ch.name}</span>
                            {ch.unread > 0 && <span className="bg-accent text-accent-foreground text-[7px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 shrink-0">{ch.unread}</span>}
                          </div>
                          <div className="text-[8px] text-muted-foreground truncate">{ch.description}</div>
                          <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Users className="h-2 w-2" />{ch.members} members</span>
                        </div>
                      </button>
                    ))}
                  </>
                )}
                <div className="px-3 py-1.5"><span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">All Channels</span></div>
                {filteredChannels.filter(c => !c.pinned).map(ch => (
                  <button key={ch.id} onClick={() => openChat({ id: ch.id, name: ch.name, initials: '#' }, 'channel')} className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-all">
                    <div className="h-9 w-9 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className={cn('text-[10px] truncate', ch.unread > 0 ? 'font-bold' : 'font-medium')}>{ch.name}</span>
                        {ch.unread > 0 && <span className="bg-accent text-accent-foreground text-[7px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 shrink-0">{ch.unread}</span>}
                      </div>
                      <div className="text-[8px] text-muted-foreground truncate">{ch.description}</div>
                      <span className="text-[7px] text-muted-foreground flex items-center gap-0.5"><Users className="h-2 w-2" />{ch.members} members</span>
                    </div>
                  </button>
                ))}
                <div className="px-3 py-2 border-t">
                  <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Channel</Button>
                </div>
              </div>
            )}

            {/* People */}
            {tab === 'people' && (
              <div className="py-1">
                <div className="px-3 py-1.5"><span className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider">People</span></div>
                {filteredPeople.length === 0 ? (
                  <div className="text-center py-8 text-[10px] text-muted-foreground">No people found</div>
                ) : filteredPeople.map(person => (
                  <div key={person.id} className="flex items-center gap-2.5 px-3 py-2 hover:bg-muted/30 transition-all">
                    <div className="relative shrink-0">
                      <Avatar className="h-9 w-9 ring-1 ring-muted/40">
                        <AvatarFallback className="text-[9px] font-bold bg-accent/10 text-accent">{person.initials}</AvatarFallback>
                      </Avatar>
                      {person.online && <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[hsl(var(--state-healthy))] border-2 border-card" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] font-semibold truncate">{person.name}</div>
                      <div className="text-[8px] text-muted-foreground truncate">{person.headline}</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 text-[8px] rounded-lg shrink-0"
                      onClick={() => openChat({ id: person.id, name: person.name, initials: person.initials }, 'dm')}
                    >
                      <MessageSquare className="h-2.5 w-2.5 mr-0.5" />Chat
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MessagingBubble;
