import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
  Hash, Plus, Search, Settings, Pin, Bell, BellOff,
  Users, Lock, Globe, Star, Send, Paperclip, Image,
  Smile, MoreVertical, Bookmark, Archive, X,
  ChevronRight, FileText, Link2, MessageSquare,
  Volume2, VolumeX, Crown, Shield, AtSign,
  TrendingUp,
} from 'lucide-react';

const CHANNELS = [
  { id: 'c1', name: '#product-launch', members: 24, unread: 12, lastMsg: 'Priya: Timeline confirmed for Q2 launch 🚀', time: '15m', pinned: true, description: 'Q2 product launch coordination', topic: 'Launch readiness & go-to-market', isPrivate: false, muted: false },
  { id: 'c2', name: '#engineering', members: 42, unread: 0, lastMsg: 'Build passed — deploying v2.4.1 to staging', time: '1h', pinned: true, description: 'Engineering discussions and updates', topic: 'Code reviews, deployments, architecture', isPrivate: false, muted: false },
  { id: 'c3', name: '#general', members: 156, unread: 8, lastMsg: 'CEO: Company town hall next Friday 📢', time: '2h', pinned: false, description: 'Company-wide announcements', topic: 'Important updates and announcements', isPrivate: false, muted: false },
  { id: 'c4', name: '#hiring', members: 18, unread: 3, lastMsg: 'New Senior Designer role posted', time: '4h', pinned: false, description: 'Open roles and referrals', topic: 'Job postings, referrals, and hiring updates', isPrivate: false, muted: false },
  { id: 'c5', name: '#design-system', members: 11, unread: 0, lastMsg: 'Updated Button component with new variants', time: '1d', pinned: false, description: 'Design tokens and component library', topic: 'Component updates, design tokens, Figma sync', isPrivate: true, muted: true },
  { id: 'c6', name: '#random', members: 134, unread: 22, lastMsg: 'Jordan: Anyone tried the new cafe on 5th?', time: '30m', pinned: false, description: 'Water cooler chat', topic: 'Off-topic, fun, and social', isPrivate: false, muted: false },
  { id: 'c7', name: '#client-updates', members: 9, unread: 1, lastMsg: 'Elena: Milestone 3 deliverables approved ✅', time: '3h', pinned: false, description: 'Client project updates', topic: 'Client communications and project milestones', isPrivate: true, muted: false },
  { id: 'c8', name: '#security', members: 6, unread: 0, lastMsg: 'Monthly security audit completed', time: '2d', pinned: false, description: 'Security and compliance', topic: 'Security alerts, audits, and compliance', isPrivate: true, muted: false },
];

const MESSAGES = [
  { id: 1, sender: 'Priya Sharma', initials: 'PS', text: 'Timeline confirmed for Q2 launch 🚀 All teams need to have deliverables finalized by April 25th.', time: '10:15 AM', pinned: true, reactions: [{ emoji: '🚀', count: 8 }, { emoji: '👍', count: 5 }] },
  { id: 2, sender: 'Marcus Johnson', initials: 'MJ', text: 'Backend APIs are ready. All endpoints passing integration tests. @Priya should we schedule the cross-team sync?', time: '10:30 AM', pinned: false, reactions: [{ emoji: '✅', count: 3 }] },
  { id: 3, sender: 'Sarah Chen', initials: 'SC', text: 'Design assets uploaded to Figma. The landing page, pricing page, and dashboard are all ready for review.', time: '10:45 AM', pinned: false, reactions: [{ emoji: '🎨', count: 4 }, { emoji: '🔥', count: 2 }] },
  { id: 4, sender: 'You', initials: 'YO', text: 'Great progress everyone! I\'ve prepared the marketing campaign timeline. Here\'s the breakdown:', time: '11:00 AM', pinned: false, reactions: [] },
  { id: 5, sender: 'Alex Kim', initials: 'AK', text: 'Just pushed the final UI updates. Dark mode is fully working now. Screenshots attached 📸', time: '11:15 AM', pinned: false, reactions: [{ emoji: '🌙', count: 6 }, { emoji: '💯', count: 3 }], attachment: { name: 'darkmode_screenshots.zip', size: '8.4 MB' } },
  { id: 6, sender: 'Jordan Lee', initials: 'JL', text: 'Content calendar is set. Blog posts, social media, and email campaigns are all aligned with the launch date.', time: '11:30 AM', pinned: false, reactions: [{ emoji: '📝', count: 2 }] },
];

const PINNED_MSGS = MESSAGES.filter(m => m.pinned);

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

export default function ChannelsPage() {
  const [activeChannel, setActiveChannel] = useState('c1');
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [showPinned, setShowPinned] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);

  const channel = CHANNELS.find(c => c.id === activeChannel);

  const filteredChannels = search
    ? CHANNELS.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.description.toLowerCase().includes(search.toLowerCase()))
    : CHANNELS;

  const pinnedChannels = filteredChannels.filter(c => c.pinned);
  const otherChannels = filteredChannels.filter(c => !c.pinned);

  const rightRail = channel ? (
    <div className="space-y-3">
      <SectionCard title="Channel Info" className="!rounded-2xl">
        <div className="text-center mb-2">
          <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-1.5"><Hash className="h-6 w-6 text-accent" /></div>
          <div className="text-[11px] font-bold">{channel.name}</div>
          <div className="text-[8px] text-muted-foreground">{channel.description}</div>
        </div>
        <div className="space-y-1.5 text-[8px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Members</span><span className="font-semibold">{channel.members}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Topic</span><span className="font-medium text-right max-w-[120px] truncate">{channel.topic}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Visibility</span><span className="font-medium">{channel.isPrivate ? 'Private' : 'Public'}</span></div>
        </div>
      </SectionCard>

      {PINNED_MSGS.length > 0 && (
        <SectionCard title="Pinned Messages" subtitle={`${PINNED_MSGS.length}`} className="!rounded-2xl">
          {PINNED_MSGS.map(pm => (
            <div key={pm.id} className="p-2 rounded-xl bg-muted/20 border border-border/20 mb-1.5">
              <div className="flex items-center gap-1.5 mb-0.5">
                <Pin className="h-2 w-2 text-accent" />
                <span className="text-[8px] font-semibold">{pm.sender}</span>
                <span className="text-[7px] text-muted-foreground">{pm.time}</span>
              </div>
              <p className="text-[8px] text-muted-foreground line-clamp-2">{pm.text}</p>
            </div>
          ))}
        </SectionCard>
      )}

      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { icon: Bell, label: channel.muted ? 'Unmute' : 'Mute', action: channel.muted ? 'Channel unmuted' : 'Channel muted' },
            { icon: Star, label: 'Star Channel', action: 'Channel starred' },
            { icon: Bookmark, label: 'Save Channel', action: 'Channel saved' },
            { icon: Users, label: 'Invite Members', action: '' },
            { icon: Settings, label: 'Channel Settings', action: '' },
            { icon: Archive, label: 'Archive', action: 'Channel archived' },
          ].map(a => (
            <button key={a.label} onClick={() => a.action && toast.success(a.action)} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all">
              <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  ) : null;

  return (
    <DashboardLayout
      topStrip={
        <>
          <Hash className="h-4 w-4 text-accent" />
          <span className="text-xs font-bold">Channels</span>
          <Badge className="bg-accent text-accent-foreground text-[7px] h-4 px-1.5 rounded-lg">{CHANNELS.reduce((a, c) => a + c.unread, 0)} unread</Badge>
          <div className="flex-1" />
          <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Channel</Button>
          <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Search className="h-3 w-3" />Browse</Button>
        </>
      }
      rightRail={rightRail}
      rightRailWidth="w-52"
    >
      <div className="flex h-[calc(100vh-200px)] rounded-2xl border overflow-hidden bg-card">
        {/* Sidebar */}
        <div className="w-60 border-r flex flex-col shrink-0">
          <div className="px-2 py-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search channels..." className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent/30" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-1">
            {pinnedChannels.length > 0 && (
              <>
                <div className="px-2 py-1 text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Pinned</div>
                {pinnedChannels.map(ch => (
                  <button key={ch.id} onClick={() => setActiveChannel(ch.id)} className={cn('w-full flex items-center gap-2 p-2 rounded-xl transition-all text-left', activeChannel === ch.id ? 'bg-accent/8 ring-1 ring-accent/20' : 'hover:bg-muted/30')}>
                    <Hash className={cn('h-4 w-4 shrink-0', activeChannel === ch.id ? 'text-accent' : 'text-muted-foreground')} />
                    <div className="flex-1 min-w-0">
                      <span className={cn('text-[10px] truncate block', ch.unread > 0 ? 'font-bold' : 'font-medium')}>{ch.name.replace('#', '')}</span>
                    </div>
                    {ch.unread > 0 && <span className="bg-accent text-accent-foreground text-[7px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 shrink-0">{ch.unread}</span>}
                    {ch.muted && <VolumeX className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
                  </button>
                ))}
              </>
            )}
            <div className="px-2 py-1 mt-1 text-[8px] font-semibold text-muted-foreground uppercase tracking-wider">Channels</div>
            {otherChannels.map(ch => (
              <button key={ch.id} onClick={() => setActiveChannel(ch.id)} className={cn('w-full flex items-center gap-2 p-2 rounded-xl transition-all text-left', activeChannel === ch.id ? 'bg-accent/8 ring-1 ring-accent/20' : 'hover:bg-muted/30')}>
                {ch.isPrivate ? <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" /> : <Hash className={cn('h-4 w-4 shrink-0', activeChannel === ch.id ? 'text-accent' : 'text-muted-foreground')} />}
                <div className="flex-1 min-w-0">
                  <span className={cn('text-[10px] truncate block', ch.unread > 0 ? 'font-bold' : 'font-medium')}>{ch.name.replace('#', '')}</span>
                </div>
                {ch.unread > 0 && <span className="bg-accent text-accent-foreground text-[7px] font-bold rounded-full h-4 min-w-[16px] flex items-center justify-center px-1 shrink-0">{ch.unread}</span>}
                {ch.muted && <VolumeX className="h-2.5 w-2.5 text-muted-foreground shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chat */}
        {channel ? (
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center justify-between px-4 py-2.5 border-b">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-accent" />
                <div>
                  <div className="text-[11px] font-bold flex items-center gap-1.5">{channel.name} {channel.isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}</div>
                  <div className="text-[8px] text-muted-foreground">{channel.topic} · {channel.members} members</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-xl gap-0.5" onClick={() => setShowPinned(!showPinned)}><Pin className="h-3 w-3" />{PINNED_MSGS.length}</Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><Users className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><Search className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><MoreVertical className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-center"><Badge variant="secondary" className="text-[7px] rounded-lg">Today</Badge></div>
              {MESSAGES.map(msg => (
                <div key={msg.id} className={cn('flex gap-2.5 group', msg.sender === 'You' ? 'flex-row-reverse' : '')}>
                  {msg.sender !== 'You' && (
                    <Avatar className="h-7 w-7 shrink-0 mt-0.5"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{msg.initials}</AvatarFallback></Avatar>
                  )}
                  <div className={cn('max-w-[70%]')}>
                    {msg.sender !== 'You' && <div className="text-[8px] font-semibold text-muted-foreground mb-0.5 px-1">{msg.sender}</div>}
                    <div className={cn('rounded-2xl px-3.5 py-2.5 text-[10px]', msg.sender === 'You' ? 'bg-accent/10 rounded-tr-sm' : 'bg-muted/40 rounded-tl-sm')}>
                      <p className="leading-relaxed">{msg.text}</p>
                      {msg.attachment && (
                        <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-2.5 py-2 cursor-pointer hover:bg-muted/20">
                          <FileText className="h-4 w-4 text-accent" />
                          <div><div className="text-[9px] font-semibold">{msg.attachment.name}</div><div className="text-[7px] text-muted-foreground">{msg.attachment.size}</div></div>
                        </div>
                      )}
                    </div>
                    {msg.pinned && <div className="flex items-center gap-0.5 mt-0.5 px-1"><Pin className="h-2 w-2 text-accent" /><span className="text-[7px] text-accent font-medium">Pinned</span></div>}
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

            {/* Composer with GIF/Sticker */}
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
                    {['Trending', 'Reactions', 'Celebrate', 'Love', 'Funny'].map(cat => (
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
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0"><Paperclip className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0"><Image className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0 text-lg" onClick={() => { setShowGifPicker(!showGifPicker); setShowStickerPicker(false); }}>🎭</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0" onClick={() => { setShowStickerPicker(!showStickerPicker); setShowGifPicker(false); }}><span className="text-lg">🏷️</span></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl shrink-0"><Smile className="h-4 w-4" /></Button>
                <input value={message} onChange={e => setMessage(e.target.value)} placeholder={`Message ${channel.name}...`} className="flex-1 h-9 rounded-2xl border bg-background px-4 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" onKeyDown={e => { if (e.key === 'Enter' && message.trim()) { toast.success('Message sent'); setMessage(''); } }} />
                <Button size="icon" className="h-9 w-9 rounded-2xl shrink-0" disabled={!message.trim()} onClick={() => { toast.success('Message sent'); setMessage(''); }}><Send className="h-4 w-4" /></Button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </DashboardLayout>
  );
}
