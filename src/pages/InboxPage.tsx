import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { KPICard, SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Search, Send, Phone, Video, MoreVertical, Paperclip, Smile,
  Mic, Sparkles, Pin, Archive, Loader2, FileText, Zap,
  Plus, Filter, Star, Clock, AlertTriangle, CheckCircle2,
  RefreshCw, X, Calendar, Shield, Users, Inbox,
  MessageCircle, PhoneCall, PhoneOff, Flag, Trash2,
  ChevronDown, Eye, Lock, Bell, BellOff, Image,
  ExternalLink, MoreHorizontal, CircleDot, Hash,
  Download, Play, Link2, Bookmark, Share2, UserPlus,
  ArrowRight, History, Settings, ArrowLeft,
} from 'lucide-react';
import { MOCK_THREADS, MOCK_USERS, type MockThread } from '@/data/mock';
import { useAI } from '@/hooks/useAI';
import { toast } from 'sonner';
import { useSendMessage, inboxApiConfigured } from '@/lib/api/inbox';

/* ═══════════════════════════════════════════════════════════
   Types & Constants
   ═══════════════════════════════════════════════════════════ */
type ThreadFilter = 'all' | 'work' | 'hiring' | 'gigs' | 'sales' | 'support' | 'team';
type ThreadView = 'inbox' | 'starred' | 'requests' | 'archived';
type DetailTab = 'context' | 'files' | 'actions';

interface MockMessage {
  id: string;
  from: 'them' | 'me';
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read' | 'failed';
  attachment?: { name: string; type: string; size: string };
  reactions?: string[];
}

const THREAD_FILTERS: { id: ThreadFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'work', label: 'Work' },
  { id: 'hiring', label: 'Hiring' },
  { id: 'gigs', label: 'Gigs' },
  { id: 'sales', label: 'Sales' },
  { id: 'support', label: 'Support' },
  { id: 'team', label: 'Team' },
];

const THREAD_VIEWS: { id: ThreadView; label: string; icon: React.ElementType; count?: number }[] = [
  { id: 'inbox', label: 'Inbox', icon: Inbox },
  { id: 'starred', label: 'Starred', icon: Star },
  { id: 'requests', label: 'Requests', icon: UserPlus, count: 2 },
  { id: 'archived', label: 'Archived', icon: Archive },
];

const MOCK_MESSAGES: Record<string, MockMessage[]> = {
  t1: [
    { id: 'm1', from: 'them', text: 'Hi! I reviewed the candidate profiles you sent over. The first two look excellent for the Senior Frontend role.', time: '9:30 AM', status: 'read' },
    { id: 'm2', from: 'me', text: 'Great to hear! Should we schedule interviews this week?', time: '9:45 AM', status: 'read', reactions: ['👍'] },
    { id: 'm3', from: 'them', text: 'Yes, let\'s aim for Tuesday and Thursday. I\'ll block the calendar slots. Can you also send over the portfolio links?', time: '10:00 AM', status: 'read' },
    { id: 'm4', from: 'me', text: 'Perfect. I\'ll send the calendar invites and portfolio links shortly.', time: '10:05 AM', status: 'delivered' },
    { id: 'm5', from: 'them', text: 'Great, let\'s schedule the interview for next Tuesday at 2 PM. Looking forward to it! 🎯', time: '10:12 AM', status: 'read' },
  ],
  t2: [
    { id: 'm1', from: 'them', text: 'The API integration is complete. All endpoints passing tests with 100% coverage.', time: 'Yesterday', status: 'read' },
    { id: 'm2', from: 'me', text: 'Excellent work! Can you push the deliverables to the workspace?', time: 'Yesterday', status: 'read' },
    { id: 'm3', from: 'them', text: 'I\'ve uploaded the latest deliverables to the project workspace. Everything is documented.', time: '1h ago', status: 'read', attachment: { name: 'deliverables_v3.zip', type: 'archive', size: '24.5 MB' } },
  ],
  t3: [
    { id: 'm1', from: 'them', text: 'Hey! Saw your profile and I\'m impressed with your AI/ML work. We\'re building something exciting.', time: '2d ago', status: 'read' },
    { id: 'm2', from: 'me', text: 'Thanks Alex! I\'d love to learn more about LaunchPad AI and the opportunity.', time: '2d ago', status: 'read' },
    { id: 'm3', from: 'them', text: 'Would love to discuss the partnership opportunity further! Are you free for a quick call this week?', time: '3h ago', status: 'read' },
  ],
};

const MOCK_SHARED_FILES = [
  { name: 'deliverables_v3.zip', type: 'archive', size: '24.5 MB', date: '1h ago', from: 'Elena Rodriguez' },
  { name: 'project_brief.pdf', type: 'document', size: '2.1 MB', date: '2d ago', from: 'Sarah Chen' },
  { name: 'wireframes_final.fig', type: 'design', size: '8.3 MB', date: '3d ago', from: 'You' },
  { name: 'meeting_notes.docx', type: 'document', size: '340 KB', date: '1w ago', from: 'Marcus Johnson' },
];

const MOCK_REQUESTS = [
  { id: 'r1', name: 'Jordan Lee', headline: 'Agency Lead at PixelForge', avatar: 'JL', reason: 'Wants to discuss a design project collaboration', time: '2h ago' },
  { id: 'r2', name: 'Priya Patel', headline: 'Marketing Consultant', avatar: 'PP', reason: 'Interested in your content strategy services', time: '1d ago' },
];

/* ═══════════════════════════════════════════════════════════
   Thread List Item
   ═══════════════════════════════════════════════════════════ */
const ThreadItem: React.FC<{
  thread: MockThread;
  active: boolean;
  starred: boolean;
  onClick: () => void;
  onStar: () => void;
}> = ({ thread, active, starred, onClick, onStar }) => {
  const initials = thread.participant.name.split(' ').map(n => n[0]).join('');
  return (
    <button onClick={onClick} className={cn(
      'w-full flex items-start gap-2.5 p-3 text-left transition-all duration-200 group rounded-xl mx-1',
      active ? 'bg-accent/8 ring-1 ring-accent/20' : 'hover:bg-muted/30'
    )}>
      <div className="relative shrink-0">
        <Avatar className={cn("h-9 w-9 ring-2 transition-transform group-hover:scale-105", active ? 'ring-accent/30' : 'ring-muted/40')}>
          <AvatarFallback className="bg-accent/10 text-accent text-[10px] font-bold">{initials}</AvatarFallback>
        </Avatar>
        {thread.unread && <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 bg-accent rounded-full border-2 border-card animate-pulse" />}
        <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))] border border-card" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className={cn('text-[11px] truncate transition-colors', thread.unread ? 'font-bold' : 'font-medium', active && 'text-accent')}>{thread.participant.name}</span>
          <span className="text-[8px] text-muted-foreground shrink-0 ml-1">{thread.timestamp}</span>
        </div>
        {thread.context && <Badge variant="secondary" className="text-[7px] px-1.5 py-0 h-3.5 rounded-lg mb-0.5">{thread.context.label}</Badge>}
        <p className={cn('text-[9px] truncate', thread.unread ? 'text-foreground font-medium' : 'text-muted-foreground')}>{thread.lastMessage}</p>
      </div>
      <button onClick={e => { e.stopPropagation(); onStar(); }} className="opacity-0 group-hover:opacity-100 transition-all duration-200 shrink-0 mt-0.5">
        <Star className={cn('h-3 w-3 transition-colors', starred ? 'fill-accent text-accent' : 'text-muted-foreground hover:text-accent')} />
      </button>
    </button>
  );
};

/* ═══════════════════════════════════════════════════════════
   Message Bubble
   ═══════════════════════════════════════════════════════════ */
const MessageBubble: React.FC<{ msg: MockMessage; participantName: string }> = ({ msg, participantName }) => {
  const isMe = msg.from === 'me';
  return (
    <div className={cn('flex gap-2 max-w-[75%] group', isMe ? 'ml-auto flex-row-reverse' : '')}>
      {!isMe && (
        <Avatar className="h-6 w-6 shrink-0 mt-0.5 ring-1 ring-muted/40"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{participantName[0]}</AvatarFallback></Avatar>
      )}
      <div>
        <div className={cn(
          'rounded-2xl px-3.5 py-2.5 text-[11px] transition-all duration-200',
          isMe ? 'bg-accent/10 rounded-tr-sm' : 'bg-muted/40 rounded-tl-sm'
        )}>
          <p className="leading-relaxed">{msg.text}</p>
          {msg.attachment && (
            <div className="mt-2 flex items-center gap-2 rounded-xl border bg-background px-2.5 py-2 hover:bg-muted/20 transition-colors cursor-pointer">
              <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-accent" /></div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-semibold truncate">{msg.attachment.name}</div>
                <div className="text-[8px] text-muted-foreground">{msg.attachment.size}</div>
              </div>
              <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-accent transition-colors shrink-0" />
            </div>
          )}
        </div>
        {msg.reactions && msg.reactions.length > 0 && (
          <div className="flex gap-0.5 mt-0.5 px-1">
            {msg.reactions.map((r, i) => <span key={i} className="text-[10px] bg-muted/40 rounded-full px-1.5 py-0.5 cursor-pointer hover:bg-muted transition-colors">{r}</span>)}
          </div>
        )}
        <div className="flex items-center gap-1.5 mt-0.5 px-1">
          <span className="text-[8px] text-muted-foreground">{msg.time}</span>
          {isMe && msg.status && (
            <span className={cn('text-[7px] font-medium', msg.status === 'failed' ? 'text-[hsl(var(--state-blocked))]' : msg.status === 'read' ? 'text-accent' : 'text-muted-foreground')}>
              {msg.status === 'failed' ? '✕ Failed' : msg.status === 'read' ? '✓✓ Read' : msg.status === 'delivered' ? '✓✓' : '✓'}
            </span>
          )}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-0.5 ml-1">
            <button className="text-[10px] hover:bg-muted rounded px-0.5">😊</button>
            <button className="text-muted-foreground hover:text-foreground"><MoreHorizontal className="h-2.5 w-2.5" /></button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════
   Typing Indicator
   ═══════════════════════════════════════════════════════════ */
const TypingIndicator: React.FC<{ name: string }> = ({ name }) => (
  <div className="flex items-center gap-2 px-1">
    <Avatar className="h-5 w-5"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{name[0]}</AvatarFallback></Avatar>
    <div className="flex items-center gap-1 bg-muted/40 rounded-2xl px-3 py-1.5">
      <div className="flex gap-0.5">
        {[0, 1, 2].map(i => <div key={i} className="h-1.5 w-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />)}
      </div>
      <span className="text-[8px] text-muted-foreground ml-1">{name} is typing</span>
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   State Banners
   ═══════════════════════════════════════════════════════════ */
const SendFailedBanner: React.FC = () => (
  <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3 flex items-center gap-2.5 mx-3 mt-2">
    <AlertTriangle className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
    <div className="flex-1 text-[10px]">
      <span className="font-semibold">Message failed to send.</span>
      <span className="text-muted-foreground ml-1">Check your connection and retry.</span>
    </div>
    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl gap-0.5"><RefreshCw className="h-2.5 w-2.5" />Retry</Button>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   New Message Sheet
   ═══════════════════════════════════════════════════════════ */
const NewMessageSheet: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4 text-accent" />New Message</SheetTitle></SheetHeader>
      <div className="p-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">To</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input placeholder="Search contacts..." className="w-full h-9 rounded-xl border bg-background pl-8 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
          </div>
        </div>
        <div className="space-y-1">
          {MOCK_USERS.slice(0, 6).map(u => (
            <button key={u.id} className="flex items-center gap-2.5 w-full p-2.5 rounded-xl hover:bg-muted/30 transition-all duration-200 group" onClick={() => { onClose(); toast.info(`Thread started with ${u.name}`); }}>
              <Avatar className="h-8 w-8 ring-2 ring-muted/40 transition-transform group-hover:scale-105">
                <AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{u.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
              </Avatar>
              <div className="text-left flex-1 min-w-0">
                <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{u.name}</div>
                <div className="text-[8px] text-muted-foreground truncate">{u.headline}</div>
              </div>
              <span className="h-2 w-2 rounded-full bg-[hsl(var(--state-healthy))]" />
            </button>
          ))}
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const InboxPage: React.FC = () => {
  const [activeThread, setActiveThread] = useState<string | null>(MOCK_THREADS[0].id);
  const [threadFilter, setThreadFilter] = useState<ThreadFilter>('all');
  const [threadView, setThreadView] = useState<ThreadView>('inbox');
  const [message, setMessage] = useState('');
  const [starredThreads, setStarredThreads] = useState<Set<string>>(new Set(['t1']));
  const [showAISuggestion, setShowAISuggestion] = useState(false);
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [detailTab, setDetailTab] = useState<DetailTab>('context');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTyping, setShowTyping] = useState(true);

  const thread = MOCK_THREADS.find(t => t.id === activeThread);
  const messages = activeThread ? MOCK_MESSAGES[activeThread] || [] : [];

  const apiOn = inboxApiConfigured();
  const sendLive = useSendMessage(activeThread ?? '');
  const handleSendMessage = () => {
    const body = message.trim();
    if (!body || !activeThread) return;
    if (!apiOn) { toast.success('Sent (preview mode — set VITE_GIGVORA_API_URL to deliver)'); setMessage(''); return; }
    sendLive.mutate({ body }, { onSuccess: () => setMessage('') });
  };

  const { loading: aiDraftLoading, invoke: aiDraft, result: aiDraftResult, setResult: setAIDraft } = useAI({ type: 'message-draft' });
  const { loading: aiSummaryLoading, invoke: aiSummarize, result: aiSummary } = useAI({ type: 'thread-summary' });

  const filteredThreads = useMemo(() => {
    let list = MOCK_THREADS;
    if (threadView === 'starred') list = list.filter(t => starredThreads.has(t.id));
    if (threadView === 'requests') return []; // handled separately
    if (threadFilter !== 'all') list = list.filter(t => t.context?.type === threadFilter);
    if (searchQuery) list = list.filter(t => t.participant.name.toLowerCase().includes(searchQuery.toLowerCase()) || t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));
    return list;
  }, [threadFilter, threadView, starredThreads, searchQuery]);

  const unreadCount = MOCK_THREADS.filter(t => t.unread).length;

  const toggleStar = (id: string) => setStarredThreads(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleAIDraft = async () => {
    if (!thread) return;
    const result = await aiDraft({ context: thread.context?.type || 'general', lastMessage: thread.lastMessage, participant: thread.participant.name, participantRole: thread.participant.headline });
    if (result) setShowAISuggestion(true);
  };

  const acceptDraft = () => { if (aiDraftResult) { setMessage(aiDraftResult); setShowAISuggestion(false); setAIDraft(null); } };

  const handleSummarize = async () => {
    if (!thread) return;
    await aiSummarize({ messages: messages.map(m => ({ from: m.from === 'me' ? 'You' : thread.participant.name, text: m.text })), context: thread.context });
  };

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><MessageCircle className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Inbox</span>
        {unreadCount > 0 && <Badge className="bg-accent text-accent-foreground text-[7px] h-4 px-1.5 rounded-lg">{unreadCount} unread</Badge>}
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Link to="/inbox/groups"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Users className="h-3 w-3" />Groups</Button></Link>
        <Link to="/inbox/channels"><Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Hash className="h-3 w-3" />Channels</Button></Link>
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setShowNewMessage(true)}><Plus className="h-3 w-3" />New Message</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><PhoneCall className="h-3 w-3" />Schedule Call</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Calendar className="h-3 w-3" />Book Meeting</Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = thread ? (
    <div className="space-y-3">
      {/* Contact Card */}
      <div className="rounded-2xl border p-3.5 text-center">
        <Avatar className="h-14 w-14 mx-auto mb-2 ring-3 ring-accent/20">
          <AvatarFallback className="bg-accent/10 text-accent text-sm font-bold">{thread.participant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
        </Avatar>
        <div className="text-[12px] font-bold">{thread.participant.name}</div>
        <div className="text-[9px] text-muted-foreground mb-1">{thread.participant.headline}</div>
        <div className="flex items-center justify-center gap-1 mb-2">
          {thread.participant.verified && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-lg gap-0.5"><CheckCircle2 className="h-2 w-2" />Verified</Badge>}
          <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg gap-0.5"><CircleDot className="h-2 w-2 text-[hsl(var(--state-healthy))]" />Online</Badge>
        </div>
        <div className="flex gap-1 justify-center">
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1"><Phone className="h-2.5 w-2.5" /></Button>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1"><Video className="h-2.5 w-2.5" /></Button>
          <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1"><ExternalLink className="h-2.5 w-2.5" /></Button>
        </div>
      </div>

      {/* Detail Tabs */}
      <div className="flex gap-0.5 p-0.5 rounded-xl bg-muted/40">
        {([
          { id: 'context' as DetailTab, label: 'Context', icon: Link2 },
          { id: 'files' as DetailTab, label: 'Files', icon: FileText },
          { id: 'actions' as DetailTab, label: 'Actions', icon: Settings },
        ]).map(t => (
          <button key={t.id} onClick={() => setDetailTab(t.id)} className={cn(
            'flex-1 flex items-center justify-center gap-1 py-1.5 text-[8px] font-semibold rounded-lg transition-all duration-200',
            detailTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground'
          )}><t.icon className="h-2.5 w-2.5" />{t.label}</button>
        ))}
      </div>

      {/* Context Tab */}
      {detailTab === 'context' && (
        <div className="space-y-2">
          {thread.context && (
            <SectionCard title="Linked Object" className="!rounded-2xl">
              <div className="rounded-xl border p-2.5">
                <Badge variant="secondary" className="text-[7px] h-3.5 capitalize mb-1 rounded-lg">{thread.context.type}</Badge>
                <div className="text-[10px] font-semibold">{thread.context.label}</div>
                <Button variant="ghost" size="sm" className="h-5 text-[8px] px-0 mt-1 gap-0.5"><ExternalLink className="h-2.5 w-2.5" />Open</Button>
              </div>
            </SectionCard>
          )}
          <SectionCard title="Thread Stats" className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Messages</span><span className="font-semibold">{messages.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Attachments</span><span className="font-semibold">{messages.filter(m => m.attachment).length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Started</span><span className="font-semibold">3 days ago</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Avg. Response</span><span className="font-semibold text-[hsl(var(--state-healthy))]">&lt; 1h</span></div>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Files Tab */}
      {detailTab === 'files' && (
        <SectionCard title="Shared Files" subtitle={`${MOCK_SHARED_FILES.length} files`} className="!rounded-2xl">
          <div className="space-y-1">
            {MOCK_SHARED_FILES.map((f, i) => (
              <div key={i} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/30 transition-all cursor-pointer group">
                <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><FileText className="h-3 w-3 text-accent" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{f.name}</div>
                  <div className="text-[7px] text-muted-foreground">{f.size} · {f.date}</div>
                </div>
                <Download className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all" />
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {/* Actions Tab */}
      {detailTab === 'actions' && (
        <SectionCard title="Thread Actions" className="!rounded-2xl">
          <div className="space-y-0.5">
            {[
              { icon: Pin, label: 'Pin Thread', action: 'Thread pinned' },
              { icon: Star, label: starredThreads.has(activeThread || '') ? 'Unstar' : 'Star Thread', action: 'Updated' },
              { icon: BellOff, label: 'Mute Notifications', action: 'Notifications muted' },
              { icon: Bookmark, label: 'Save Thread', action: 'Thread saved' },
              { icon: Archive, label: 'Archive Thread', action: 'Thread archived' },
              { icon: Flag, label: 'Report Thread', action: '' },
              { icon: Shield, label: 'Block Contact', action: '' },
            ].map(a => (
              <button key={a.label} onClick={() => a.action && toast.success(a.action)} className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-xl text-[9px] hover:bg-muted/30 transition-all duration-200 group">
                <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="group-hover:text-accent transition-colors">{a.label}</span>
              </button>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  ) : null;

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-accent" />Communication Summary</span>
        <span className="text-[10px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="grid grid-cols-5 gap-3">
        {[
          { label: 'Messages Sent', value: '47' },
          { label: 'Avg Response', value: '23m' },
          { label: 'Active Threads', value: '12' },
          { label: 'Calls Made', value: '5' },
          { label: 'Files Shared', value: '18' },
        ].map(s => (
          <div key={s.label} className="text-center rounded-xl border p-2.5">
            <div className="text-sm font-bold">{s.value}</div>
            <div className="text-[8px] text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      <div className="flex h-[calc(100vh-260px)] rounded-2xl border overflow-hidden bg-card shadow-sm">
        {/* ── Thread Sidebar ── */}
        <div className={cn(
          'border-r flex flex-col shrink-0',
          activeThread ? 'hidden md:flex w-full md:w-72' : 'w-full md:w-72'
        )}>
          {/* View Tabs */}
          <div className="flex gap-0.5 p-1.5 mx-1.5 mt-1.5 rounded-xl bg-muted/40">
            {THREAD_VIEWS.map(v => (
              <button key={v.id} onClick={() => setThreadView(v.id)} className={cn(
                'flex-1 flex items-center justify-center gap-1 py-1.5 text-[8px] font-semibold rounded-lg transition-all duration-200',
                threadView === v.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground'
              )}>
                <v.icon className="h-2.5 w-2.5" />{v.label}
                {v.count && <span className="text-[7px] bg-accent text-accent-foreground rounded-full px-1">{v.count}</span>}
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="px-2 py-2 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search messages..." className="w-full h-7 rounded-xl border bg-background pl-7 pr-2 text-[10px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
            </div>
            <div className="flex gap-0.5 overflow-x-auto mt-1.5 pb-0.5 scrollbar-none">
              {THREAD_FILTERS.map(f => (
                <button key={f.id} onClick={() => setThreadFilter(f.id)} className={cn(
                  'px-2 py-0.5 text-[8px] rounded-lg whitespace-nowrap transition-all duration-200 shrink-0 font-semibold',
                  threadFilter === f.id ? 'bg-accent text-accent-foreground shadow-sm' : 'text-muted-foreground hover:bg-muted/50'
                )}>{f.label}</button>
              ))}
            </div>
          </div>

          {/* Thread List / Requests */}
          <div className="flex-1 overflow-y-auto p-1">
            {threadView === 'requests' ? (
              <div className="space-y-1.5 p-1">
                <div className="text-[10px] font-semibold text-muted-foreground mb-1 px-1">Message Requests ({MOCK_REQUESTS.length})</div>
                {MOCK_REQUESTS.map(r => (
                  <div key={r.id} className="rounded-2xl border p-3 hover:shadow-sm transition-all duration-200">
                    <div className="flex items-center gap-2.5 mb-2">
                      <Avatar className="h-9 w-9 ring-2 ring-muted/40"><AvatarFallback className="text-[9px] bg-accent/10 text-accent font-bold">{r.avatar}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] font-semibold">{r.name}</div>
                        <div className="text-[8px] text-muted-foreground truncate">{r.headline}</div>
                      </div>
                      <span className="text-[7px] text-muted-foreground">{r.time}</span>
                    </div>
                    <p className="text-[9px] text-muted-foreground mb-2 line-clamp-2">{r.reason}</p>
                    <div className="flex gap-1.5">
                      <Button size="sm" className="h-6 text-[8px] rounded-xl flex-1 gap-0.5" onClick={() => toast.success('Request accepted')}><CheckCircle2 className="h-2.5 w-2.5" />Accept</Button>
                      <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1" onClick={() => toast.info('Request declined')}>Decline</Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center py-8 text-[10px] text-muted-foreground">
                <Inbox className="h-6 w-6 mb-1.5 opacity-30" />
                No conversations found
              </div>
            ) : (
              filteredThreads.map(t => (
                <ThreadItem key={t.id} thread={t} active={activeThread === t.id} starred={starredThreads.has(t.id)} onClick={() => { setActiveThread(t.id); setShowAISuggestion(false); setShowTyping(true); setTimeout(() => setShowTyping(false), 3000); }} onStar={() => toggleStar(t.id)} />
              ))
            )}
          </div>
        </div>

        {/* ── Message Pane ── */}
        {thread ? (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Thread Header */}
            <div className="flex items-center justify-between px-3 md:px-4 py-2.5 border-b">
              <div className="flex items-center gap-2 md:gap-2.5 min-w-0">
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl md:hidden shrink-0" onClick={() => setActiveThread(null)}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Avatar className="h-8 w-8 shrink-0 ring-2 ring-muted/40"><AvatarFallback className="bg-accent/10 text-accent text-[9px] font-bold">{thread.participant.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold flex items-center gap-1.5">
                    {thread.participant.name}
                    {thread.participant.verified && <CheckCircle2 className="h-3 w-3 text-accent" />}
                    <span className="flex items-center gap-0.5 text-[7px] font-medium text-[hsl(var(--state-healthy))]"><CircleDot className="h-2 w-2" />Online</span>
                  </div>
                  <div className="text-[8px] text-muted-foreground truncate">{thread.participant.headline}</div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-1 rounded-xl hidden sm:flex" onClick={handleSummarize} disabled={aiSummaryLoading}>
                  {aiSummaryLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}Summarize
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hidden sm:flex"><Phone className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><Video className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl hidden sm:flex"><Pin className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><MoreVertical className="h-3.5 w-3.5" /></Button>
              </div>
            </div>

            {/* AI Summary */}
            {aiSummary && (
              <div className="mx-3 mt-2 rounded-2xl border bg-accent/5 px-3.5 py-2.5">
                <div className="flex items-center gap-1 text-[10px] font-bold text-accent mb-0.5"><Sparkles className="h-3 w-3" />AI Summary</div>
                <p className="text-[9px] text-muted-foreground leading-relaxed">{aiSummary}</p>
              </div>
            )}

            {/* Context Card */}
            {thread.context && (
              <div className="mx-3 mt-2 rounded-xl border bg-muted/15 px-3 py-2 flex items-center gap-2">
                <Badge variant="secondary" className="text-[7px] h-3.5 capitalize rounded-lg">{thread.context.type}</Badge>
                <span className="text-[9px] font-semibold">{thread.context.label}</span>
                <Button variant="ghost" size="sm" className="h-4 text-[7px] ml-auto px-1.5 rounded-lg gap-0.5"><ExternalLink className="h-2.5 w-2.5" />Open</Button>
              </div>
            )}

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              <div className="text-center">
                <Badge variant="secondary" className="text-[7px] rounded-lg">Today</Badge>
              </div>
              {messages.length === 0 ? (
                <div className="flex flex-col items-center py-8 text-[10px] text-muted-foreground">
                  <MessageCircle className="h-6 w-6 mb-1.5 opacity-30" />
                  No messages yet. Start the conversation.
                </div>
              ) : (
                messages.map(msg => <MessageBubble key={msg.id} msg={msg} participantName={thread.participant.name} />)
              )}
              {showTyping && <TypingIndicator name={thread.participant.name} />}
            </div>

            {/* AI Draft Suggestion */}
            {showAISuggestion && aiDraftResult && (
              <div className="mx-3 mb-2 rounded-2xl border border-accent/30 bg-accent/5 px-3.5 py-2.5">
                <div className="flex items-center gap-1 text-[9px] font-bold text-accent mb-1"><Sparkles className="h-3 w-3" />AI Draft</div>
                <p className="text-[9px] leading-relaxed mb-2">{aiDraftResult}</p>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-6 text-[8px] px-2.5 rounded-xl gap-0.5" onClick={acceptDraft}><Zap className="h-2.5 w-2.5" />Use</Button>
                  <Button size="sm" variant="ghost" className="h-6 text-[8px] px-2.5 rounded-xl" onClick={() => setShowAISuggestion(false)}>Dismiss</Button>
                </div>
              </div>
            )}

            {/* Composer */}
            <div className="border-t px-4 py-3">
              <div className="flex items-center gap-1 md:gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl hidden sm:flex"><Paperclip className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl hidden sm:flex"><Image className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl hidden md:flex text-lg" onClick={() => toast.info('GIF picker')}>🎭</Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 rounded-xl hidden md:flex" onClick={() => toast.info('Sticker picker')}><span className="text-lg">🏷️</span></Button>
                <div className="flex-1 relative min-w-0">
                  <input
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder={apiOn ? 'Type a message…' : 'Type a message… (preview mode)'}
                    className="w-full h-9 rounded-2xl border bg-background px-4 pr-20 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all"
                    onKeyDown={e => { if (e.key === 'Enter' && message.trim()) { e.preventDefault(); handleSendMessage(); } }}
                  />
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    <button className="p-0.5 text-muted-foreground hover:text-foreground transition-colors"><Smile className="h-4 w-4" /></button>
                    <button className="p-0.5 text-muted-foreground hover:text-foreground transition-colors hidden sm:block"><Mic className="h-4 w-4" /></button>
                    <button className="p-0.5 text-accent hover:text-accent/80 transition-colors" onClick={handleAIDraft} disabled={aiDraftLoading}>
                      {aiDraftLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <Button size="icon" className="h-9 w-9 shrink-0 rounded-2xl" disabled={!message.trim() || sendLive.isPending} onClick={handleSendMessage}>
                  {sendLive.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center py-16 text-center">
            <MessageCircle className="h-10 w-10 text-muted-foreground/20 mb-3" />
            <div className="text-sm font-semibold">No conversation selected</div>
            <div className="text-[10px] text-muted-foreground mt-1 max-w-[240px]">Choose a thread or start a new message to connect.</div>
            <Button size="sm" className="mt-3 h-7 text-[9px] rounded-xl gap-1" onClick={() => setShowNewMessage(true)}><Plus className="h-3 w-3" />New Message</Button>
          </div>
        )}
      </div>

      <NewMessageSheet open={showNewMessage} onClose={() => setShowNewMessage(false)} />
    </DashboardLayout>
  );
};

export default InboxPage;
