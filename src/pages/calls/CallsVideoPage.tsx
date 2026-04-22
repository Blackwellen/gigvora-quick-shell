import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Phone, Video, Mic, MicOff, VideoOff, PhoneOff, PhoneCall,
  Monitor, Users, Clock, Calendar, Search, Plus, Filter,
  Star, Archive, MoreVertical, Settings, Volume2, VolumeX,
  Maximize2, Minimize2, MessageCircle, ExternalLink,
  CheckCircle2, AlertTriangle, RefreshCw, Download,
  ArrowRight, History, Shield, CircleDot, Sparkles,
  ChevronDown, Bookmark, Share2, X, Wifi, WifiOff,
  ScreenShare, ScreenShareOff, Hand, Smile, FileText,
} from 'lucide-react';
import { MOCK_USERS } from '@/data/mock';
import { toast } from 'sonner';

/* ═══════════════════════════════════════════════════════════
   Types & Mock Data
   ═══════════════════════════════════════════════════════════ */
type MainTab = 'overview' | 'history' | 'contacts' | 'scheduled' | 'devices';
type CallState = 'idle' | 'pre-join' | 'ringing' | 'active' | 'ended' | 'failed';

interface CallRecord {
  id: string; participant: string; initials: string; type: 'voice' | 'video';
  direction: 'inbound' | 'outbound'; duration: string; time: string;
  status: 'completed' | 'missed' | 'declined' | 'failed';
  context?: string; recording?: boolean;
}

interface ScheduledCall {
  id: string; participant: string; initials: string; type: 'voice' | 'video';
  date: string; time: string; context?: string; status: 'confirmed' | 'pending' | 'rescheduled';
}

const CALL_HISTORY: CallRecord[] = [
  { id: 'c1', participant: 'Sarah Chen', initials: 'SC', type: 'video', direction: 'outbound', duration: '32:15', time: '2h ago', status: 'completed', context: 'Project: Brand Refresh', recording: true },
  { id: 'c2', participant: 'Marcus Johnson', initials: 'MJ', type: 'voice', direction: 'inbound', duration: '8:42', time: '4h ago', status: 'completed', context: 'Hiring: Frontend Dev' },
  { id: 'c3', participant: 'Elena Rodriguez', initials: 'ER', type: 'video', direction: 'outbound', duration: '-', time: '5h ago', status: 'missed' },
  { id: 'c4', participant: 'Alex Kim', initials: 'AK', type: 'voice', direction: 'inbound', duration: '-', time: 'Yesterday', status: 'declined' },
  { id: 'c5', participant: 'Jordan Lee', initials: 'JL', type: 'video', direction: 'outbound', duration: '1:05:30', time: 'Yesterday', status: 'completed', context: 'Sales: Enterprise Demo', recording: true },
  { id: 'c6', participant: 'Priya Patel', initials: 'PP', type: 'voice', direction: 'inbound', duration: '-', time: '2d ago', status: 'failed' },
];

const SCHEDULED_CALLS: ScheduledCall[] = [
  { id: 's1', participant: 'Sarah Chen', initials: 'SC', type: 'video', date: 'Today', time: '3:00 PM', context: 'Project Review', status: 'confirmed' },
  { id: 's2', participant: 'Alex Kim', initials: 'AK', type: 'video', date: 'Tomorrow', time: '10:00 AM', context: 'Partnership Discussion', status: 'confirmed' },
  { id: 's3', participant: 'Marcus Johnson', initials: 'MJ', type: 'voice', date: 'Thu, Jun 19', time: '2:30 PM', context: 'Interview Debrief', status: 'pending' },
  { id: 's4', participant: 'Elena Rodriguez', initials: 'ER', type: 'video', date: 'Fri, Jun 20', time: '11:00 AM', status: 'rescheduled' },
];

const ONLINE_CONTACTS = MOCK_USERS.slice(0, 8);

/* ═══════════════════════════════════════════════════════════
   Sub-Components
   ═══════════════════════════════════════════════════════════ */
const StatusDot: React.FC<{ status: 'online' | 'away' | 'busy' | 'offline' }> = ({ status }) => {
  const colors = { online: 'bg-[hsl(var(--state-healthy))]', away: 'bg-yellow-400', busy: 'bg-[hsl(var(--state-blocked))]', offline: 'bg-muted-foreground/30' };
  return <span className={cn('h-2.5 w-2.5 rounded-full border-2 border-card', colors[status])} />;
};

const CallStatusBadge: React.FC<{ status: CallRecord['status'] }> = ({ status }) => {
  const map = {
    completed: { label: 'Completed', cls: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' },
    missed: { label: 'Missed', cls: 'bg-[hsl(var(--state-warning)/0.1)] text-[hsl(var(--state-warning))]' },
    declined: { label: 'Declined', cls: 'bg-muted text-muted-foreground' },
    failed: { label: 'Failed', cls: 'bg-[hsl(var(--state-blocked)/0.1)] text-[hsl(var(--state-blocked))]' },
  };
  const s = map[status];
  return <Badge className={cn('text-[7px] h-4 border-0 rounded-lg', s.cls)}>{s.label}</Badge>;
};

/* ── Pre-Join Window ── */
const PreJoinDrawer: React.FC<{ open: boolean; onClose: () => void; participant?: string; type?: 'voice' | 'video' }> = ({ open, onClose, participant = 'Sarah Chen', type = 'video' }) => {
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(type === 'video');
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[460px] sm:w-[500px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold flex items-center gap-2"><Video className="h-4 w-4 text-accent" />Join Call</SheetTitle></SheetHeader>
        <div className="p-5 space-y-5">
          {/* Preview */}
          <div className="rounded-3xl bg-muted/30 aspect-video flex items-center justify-center relative overflow-hidden border">
            {camOn ? (
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 flex items-center justify-center">
                <Avatar className="h-20 w-20 ring-4 ring-accent/20"><AvatarFallback className="bg-accent/10 text-accent text-xl font-bold">You</AvatarFallback></Avatar>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <VideoOff className="h-8 w-8 text-muted-foreground/30" />
                <span className="text-[10px] text-muted-foreground">Camera off</span>
              </div>
            )}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              <Button variant={micOn ? 'outline' : 'destructive'} size="icon" className="h-10 w-10 rounded-2xl" onClick={() => setMicOn(!micOn)}>
                {micOn ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
              <Button variant={camOn ? 'outline' : 'destructive'} size="icon" className="h-10 w-10 rounded-2xl" onClick={() => setCamOn(!camOn)}>
                {camOn ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" className="h-10 w-10 rounded-2xl"><Settings className="h-4 w-4" /></Button>
            </div>
          </div>

          {/* Participant Info */}
          <div className="rounded-2xl border p-3.5 flex items-center gap-3">
            <Avatar className="h-10 w-10 ring-2 ring-accent/20"><AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{participant.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="text-[12px] font-bold">{participant}</div>
              <div className="text-[9px] text-muted-foreground flex items-center gap-1"><CircleDot className="h-2 w-2 text-[hsl(var(--state-healthy))]" />Online · Ready to join</div>
            </div>
            <Badge variant="secondary" className="text-[7px] h-4 rounded-lg capitalize">{type}</Badge>
          </div>

          {/* Device Check */}
          <SectionCard title="Device Check" className="!rounded-2xl">
            <div className="space-y-2">
              {[
                { label: 'Microphone', icon: Mic, status: micOn ? 'Ready' : 'Muted', ok: true },
                { label: 'Camera', icon: Video, status: camOn ? 'Ready' : 'Off', ok: camOn },
                { label: 'Network', icon: Wifi, status: 'Excellent (42ms)', ok: true },
                { label: 'Speaker', icon: Volume2, status: 'Default - System', ok: true },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-2.5 text-[10px]">
                  <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center"><d.icon className="h-3 w-3 text-accent" /></div>
                  <span className="font-semibold flex-1">{d.label}</span>
                  <span className={cn('text-[8px]', d.ok ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}>{d.status}</span>
                  {d.ok ? <CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /> : <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-warning))]" />}
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Actions */}
          <div className="flex gap-2">
            <Button className="flex-1 h-10 rounded-2xl gap-1.5 text-[11px]" onClick={() => { onClose(); toast.success('Joining call...'); }}>
              <Phone className="h-4 w-4" />Join Now
            </Button>
            <Button variant="outline" className="h-10 rounded-2xl text-[11px]" onClick={onClose}>Cancel</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ── Call Ended Summary Drawer ── */
const CallEndedDrawer: React.FC<{ open: boolean; onClose: () => void; call?: CallRecord }> = ({ open, onClose, call }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[440px] sm:w-[480px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold flex items-center gap-2"><PhoneOff className="h-4 w-4 text-accent" />Call Summary</SheetTitle></SheetHeader>
      {call && (
        <div className="p-5 space-y-4">
          <div className="text-center py-4">
            <Avatar className="h-16 w-16 mx-auto mb-3 ring-3 ring-accent/20"><AvatarFallback className="bg-accent/10 text-accent text-lg font-bold">{call.initials}</AvatarFallback></Avatar>
            <div className="text-sm font-bold">{call.participant}</div>
            <Badge variant="secondary" className="text-[8px] mt-1 rounded-lg">{call.type === 'video' ? '📹 Video Call' : '📞 Voice Call'}</Badge>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[{ label: 'Duration', value: call.duration }, { label: 'Quality', value: 'Excellent' }, { label: 'Time', value: call.time }].map(s => (
              <div key={s.label} className="rounded-2xl border p-2.5 text-center">
                <div className="text-xs font-bold">{s.value}</div>
                <div className="text-[8px] text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
          {call.context && (
            <div className="rounded-xl border bg-muted/15 px-3 py-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">Context</Badge>
              <span className="text-[9px] font-semibold">{call.context}</span>
            </div>
          )}
          {call.recording && (
            <SectionCard title="Recording" className="!rounded-2xl">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center"><FileText className="h-3.5 w-3.5 text-accent" /></div>
                <div className="flex-1">
                  <div className="text-[10px] font-semibold">call_recording_{call.id}.mp4</div>
                  <div className="text-[8px] text-muted-foreground">Processing transcript...</div>
                </div>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl gap-0.5"><Download className="h-2.5 w-2.5" />Save</Button>
              </div>
            </SectionCard>
          )}
          <div className="text-[10px] font-semibold mb-1.5">Follow-Up Actions</div>
          <div className="space-y-1">
            {[
              { icon: Calendar, label: 'Schedule follow-up', action: 'Follow-up scheduled' },
              { icon: MessageCircle, label: 'Send message', action: 'Thread opened' },
              { icon: FileText, label: 'Add meeting notes', action: '' },
              { icon: Star, label: 'Rate call quality', action: 'Rating submitted' },
            ].map(a => (
              <button key={a.label} onClick={() => a.action && toast.success(a.action)} className="flex items-center gap-2 w-full px-2.5 py-2 rounded-xl text-[10px] hover:bg-muted/30 transition-all group">
                <a.icon className="h-3.5 w-3.5 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="group-hover:text-accent transition-colors">{a.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground ml-auto opacity-0 group-hover:opacity-100 transition-all" />
              </button>
            ))}
          </div>
        </div>
      )}
    </SheetContent>
  </Sheet>
);

/* ── Schedule Call Drawer ── */
const ScheduleCallDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[420px] sm:w-[460px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm font-bold flex items-center gap-2"><Calendar className="h-4 w-4 text-accent" />Schedule Call</SheetTitle></SheetHeader>
      <div className="p-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Participant</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input placeholder="Search contacts..." className="w-full h-9 rounded-xl border bg-background pl-8 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Call Type</label>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1 h-9 rounded-xl text-[10px] gap-1"><Video className="h-3.5 w-3.5" />Video Call</Button>
            <Button variant="outline" className="flex-1 h-9 rounded-xl text-[10px] gap-1"><Phone className="h-3.5 w-3.5" />Voice Call</Button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Date</label>
            <input type="date" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Time</label>
            <input type="time" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Context (optional)</label>
          <input placeholder="e.g. Project review, Interview..." className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Notes</label>
          <textarea placeholder="Add agenda or notes..." className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" />
        </div>
        <Button className="w-full h-10 rounded-2xl text-[11px] gap-1.5" onClick={() => { onClose(); toast.success('Call scheduled'); }}>
          <Calendar className="h-4 w-4" />Schedule Call
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const CallsVideoPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('overview');
  const [showPreJoin, setShowPreJoin] = useState(false);
  const [showEndedSummary, setShowEndedSummary] = useState(false);
  const [showSchedule, setShowSchedule] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallRecord | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'voice' | 'video'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const TABS: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Overview', icon: Monitor },
    { id: 'history', label: 'History', icon: History },
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'scheduled', label: 'Scheduled', icon: Calendar },
    { id: 'devices', label: 'Devices', icon: Settings },
  ];

  const filteredHistory = CALL_HISTORY.filter(c =>
    (filterType === 'all' || c.type === filterType) &&
    (!searchQuery || c.participant.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><PhoneCall className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Calls & Video</span>
        <Badge className="bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] text-[7px] h-4 px-1.5 rounded-lg border-0 gap-0.5">
          <CircleDot className="h-2 w-2" />Online
        </Badge>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setShowPreJoin(true)}><Video className="h-3 w-3" />New Video Call</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Starting voice call...')}><Phone className="h-3 w-3" />Voice Call</Button>
        <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setShowSchedule(true)}><Calendar className="h-3 w-3" />Schedule</Button>
      </div>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      {/* Active Presence */}
      <SectionCard title="Online Now" subtitle={`${ONLINE_CONTACTS.length} contacts`} className="!rounded-2xl">
        <div className="space-y-1">
          {ONLINE_CONTACTS.slice(0, 6).map(u => (
            <div key={u.id} className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/30 transition-all cursor-pointer group">
              <div className="relative">
                <Avatar className="h-7 w-7 ring-1 ring-muted/40"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{u.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                <span className="absolute -bottom-0.5 -right-0.5"><StatusDot status={['online','online','away','online','busy','online'][parseInt(u.id.slice(1))-1] as any || 'online'} /></span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{u.name}</div>
                <div className="text-[7px] text-muted-foreground truncate">{u.headline?.split(' ').slice(0,3).join(' ')}</div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-all">
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-lg"><Phone className="h-2.5 w-2.5" /></Button>
                <Button variant="ghost" size="icon" className="h-5 w-5 rounded-lg"><Video className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Quick Stats */}
      <SectionCard title="This Week" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { label: 'Total Calls', value: '23' },
            { label: 'Video Calls', value: '15' },
            { label: 'Voice Calls', value: '8' },
            { label: 'Avg Duration', value: '18m' },
            { label: 'Missed Calls', value: '3' },
          ].map(s => (
            <div key={s.label} className="flex justify-between">
              <span className="text-muted-foreground">{s.label}</span>
              <span className="font-semibold">{s.value}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Upcoming */}
      <SectionCard title="Next Up" className="!rounded-2xl">
        {SCHEDULED_CALLS.slice(0, 2).map(s => (
          <div key={s.id} className="flex items-center gap-2 p-2 rounded-xl border mb-1.5 hover:shadow-sm transition-all cursor-pointer" onClick={() => setShowPreJoin(true)}>
            <Avatar className="h-7 w-7"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{s.initials}</AvatarFallback></Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-semibold truncate">{s.participant}</div>
              <div className="text-[7px] text-muted-foreground">{s.date} · {s.time}</div>
            </div>
            <Badge variant="secondary" className="text-[6px] h-3 rounded-lg">{s.type === 'video' ? '📹' : '📞'}</Badge>
          </div>
        ))}
      </SectionCard>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] font-bold flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-accent" />Call Analytics</span>
        <span className="text-[10px] text-muted-foreground">Last 7 days</span>
      </div>
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Calls Made', value: '23' },
          { label: 'Video', value: '15' },
          { label: 'Voice', value: '8' },
          { label: 'Avg Duration', value: '18m' },
          { label: 'Connect Rate', value: '87%' },
          { label: 'Recordings', value: '9' },
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
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      {/* Tab Nav */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200',
            activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ── Overview Tab ── */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Quick Call Row */}
          <div className="grid grid-cols-3 gap-3">
            <button onClick={() => setShowPreJoin(true)} className="rounded-2xl border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group">
              <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center mb-2.5 group-hover:bg-accent/20 transition-colors"><Video className="h-5 w-5 text-accent" /></div>
              <div className="text-[12px] font-bold group-hover:text-accent transition-colors">Start Video Call</div>
              <div className="text-[9px] text-muted-foreground">HD video with screen share</div>
            </button>
            <button onClick={() => toast.info('Starting voice call...')} className="rounded-2xl border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group">
              <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mb-2.5 group-hover:bg-[hsl(var(--state-healthy)/0.2)] transition-colors"><Phone className="h-5 w-5 text-[hsl(var(--state-healthy))]" /></div>
              <div className="text-[12px] font-bold group-hover:text-[hsl(var(--state-healthy))] transition-colors">Voice Call</div>
              <div className="text-[9px] text-muted-foreground">Quick audio connection</div>
            </button>
            <button onClick={() => setShowSchedule(true)} className="rounded-2xl border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 text-left group">
              <div className="h-10 w-10 rounded-2xl bg-[hsl(var(--state-info)/0.1)] flex items-center justify-center mb-2.5 group-hover:bg-[hsl(var(--state-info)/0.2)] transition-colors"><Calendar className="h-5 w-5 text-[hsl(var(--state-info))]" /></div>
              <div className="text-[12px] font-bold">Schedule Meeting</div>
              <div className="text-[9px] text-muted-foreground">Book a future call</div>
            </button>
          </div>

          {/* Upcoming Calls */}
          <SectionCard title="Upcoming Calls" subtitle={`${SCHEDULED_CALLS.length} scheduled`} className="!rounded-2xl">
            <div className="space-y-1.5">
              {SCHEDULED_CALLS.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-xl border hover:shadow-sm hover:-translate-y-0.5 transition-all duration-200 cursor-pointer group">
                  <Avatar className="h-9 w-9 ring-2 ring-muted/40 transition-transform group-hover:scale-105"><AvatarFallback className="bg-accent/10 text-accent text-[9px] font-bold">{s.initials}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{s.participant}</div>
                    <div className="text-[8px] text-muted-foreground flex items-center gap-1.5">
                      <Clock className="h-2.5 w-2.5" />{s.date} · {s.time}
                      {s.context && <><span className="text-muted-foreground/30">·</span>{s.context}</>}
                    </div>
                  </div>
                  <Badge className={cn('text-[7px] h-4 rounded-lg border-0', s.status === 'confirmed' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : s.status === 'rescheduled' ? 'bg-[hsl(var(--state-warning)/0.1)] text-[hsl(var(--state-warning))]' : 'bg-muted text-muted-foreground')}>{s.status}</Badge>
                  <Button size="sm" className="h-6 text-[8px] rounded-xl gap-0.5 opacity-0 group-hover:opacity-100 transition-all" onClick={() => setShowPreJoin(true)}>
                    {s.type === 'video' ? <Video className="h-2.5 w-2.5" /> : <Phone className="h-2.5 w-2.5" />}Join
                  </Button>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Recent Calls */}
          <SectionCard title="Recent Calls" subtitle="Last 48 hours" className="!rounded-2xl">
            <div className="space-y-1">
              {CALL_HISTORY.slice(0, 4).map(c => (
                <div key={c.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/20 transition-all cursor-pointer group" onClick={() => { setSelectedCall(c); setShowEndedSummary(true); }}>
                  <Avatar className="h-8 w-8 ring-1 ring-muted/40"><AvatarFallback className="text-[8px] bg-accent/10 text-accent font-bold">{c.initials}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-semibold group-hover:text-accent transition-colors">{c.participant}</div>
                    <div className="text-[8px] text-muted-foreground">{c.direction === 'inbound' ? '↙' : '↗'} {c.type} · {c.time}</div>
                  </div>
                  <CallStatusBadge status={c.status} />
                  <span className="text-[9px] font-mono text-muted-foreground">{c.duration}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Connection Failed Banner */}
          <div className="rounded-2xl border border-[hsl(var(--state-blocked)/0.3)] bg-[hsl(var(--state-blocked)/0.05)] p-3.5 flex items-center gap-3">
            <WifiOff className="h-5 w-5 text-[hsl(var(--state-blocked))] shrink-0" />
            <div className="flex-1">
              <div className="text-[11px] font-bold">Connection Recovery</div>
              <div className="text-[9px] text-muted-foreground">If a call drops unexpectedly, we'll attempt auto-reconnect within 30 seconds.</div>
            </div>
            <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><RefreshCw className="h-2.5 w-2.5" />Test Connection</Button>
          </div>
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search call history..." className="w-full h-8 rounded-xl border bg-background pl-8 pr-3 text-[10px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
            </div>
            <div className="flex gap-0.5 p-0.5 rounded-xl bg-muted/40">
              {(['all', 'video', 'voice'] as const).map(f => (
                <button key={f} onClick={() => setFilterType(f)} className={cn(
                  'px-2.5 py-1 text-[8px] font-semibold rounded-lg transition-all',
                  filterType === f ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground'
                )}>{f === 'all' ? 'All' : f === 'video' ? '📹 Video' : '📞 Voice'}</button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border overflow-hidden">
            {filteredHistory.map((c, i) => (
              <div key={c.id} className={cn('flex items-center gap-3 p-3 hover:bg-muted/20 transition-all cursor-pointer group', i < filteredHistory.length - 1 && 'border-b')} onClick={() => { setSelectedCall(c); setShowEndedSummary(true); }}>
                <Avatar className="h-9 w-9 ring-2 ring-muted/40 transition-transform group-hover:scale-105"><AvatarFallback className="bg-accent/10 text-accent text-[9px] font-bold">{c.initials}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold group-hover:text-accent transition-colors">{c.participant}</div>
                  <div className="text-[8px] text-muted-foreground flex items-center gap-1.5">
                    <span>{c.direction === 'inbound' ? '↙ Incoming' : '↗ Outgoing'}</span>
                    <span className="text-muted-foreground/30">·</span>
                    <span>{c.type === 'video' ? '📹 Video' : '📞 Voice'}</span>
                    {c.context && <><span className="text-muted-foreground/30">·</span><span>{c.context}</span></>}
                  </div>
                </div>
                <CallStatusBadge status={c.status} />
                <span className="text-[10px] font-mono text-muted-foreground min-w-[50px] text-right">{c.duration}</span>
                <span className="text-[8px] text-muted-foreground min-w-[60px] text-right">{c.time}</span>
                {c.recording && <Badge variant="secondary" className="text-[6px] h-3.5 rounded-lg gap-0.5"><FileText className="h-2 w-2" />Rec</Badge>}
                <div className="opacity-0 group-hover:opacity-100 flex gap-0.5 transition-all">
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg"><Phone className="h-3 w-3" /></Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg"><MessageCircle className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Contacts Tab ── */}
      {activeTab === 'contacts' && (
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input placeholder="Search contacts..." className="w-full h-8 rounded-xl border bg-background pl-8 pr-3 text-[10px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {MOCK_USERS.slice(0, 8).map((u, i) => {
              const statuses: Array<'online'|'away'|'busy'|'offline'> = ['online','online','away','online','busy','offline','online','away'];
              return (
                <div key={u.id} className="rounded-2xl border p-3.5 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                  <div className="flex items-center gap-2.5 mb-2">
                    <div className="relative">
                      <Avatar className="h-10 w-10 ring-2 ring-muted/40 transition-transform group-hover:scale-105"><AvatarFallback className="bg-accent/10 text-accent text-[10px] font-bold">{u.name.split(' ').map(n=>n[0]).join('')}</AvatarFallback></Avatar>
                      <span className="absolute bottom-0 right-0"><StatusDot status={statuses[i]} /></span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-semibold truncate group-hover:text-accent transition-colors">{u.name}</div>
                      <div className="text-[8px] text-muted-foreground truncate">{u.headline}</div>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1 gap-0.5" onClick={() => setShowPreJoin(true)}><Video className="h-2.5 w-2.5" />Video</Button>
                    <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl flex-1 gap-0.5"><Phone className="h-2.5 w-2.5" />Call</Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg shrink-0"><MessageCircle className="h-3 w-3" /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Scheduled Tab ── */}
      {activeTab === 'scheduled' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold">{SCHEDULED_CALLS.length} Scheduled Calls</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1" onClick={() => setShowSchedule(true)}><Plus className="h-3 w-3" />Schedule New</Button>
          </div>
          <div className="space-y-2">
            {SCHEDULED_CALLS.map(s => (
              <div key={s.id} className="rounded-2xl border p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group">
                <div className="flex items-center gap-3 mb-2.5">
                  <Avatar className="h-10 w-10 ring-2 ring-muted/40 transition-transform group-hover:scale-105"><AvatarFallback className="bg-accent/10 text-accent text-xs font-bold">{s.initials}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold group-hover:text-accent transition-colors">{s.participant}</div>
                    <div className="text-[9px] text-muted-foreground flex items-center gap-1.5">
                      <Calendar className="h-2.5 w-2.5" />{s.date} at {s.time}
                      {s.context && <><span className="text-muted-foreground/30">·</span>{s.context}</>}
                    </div>
                  </div>
                  <Badge className={cn('text-[7px] h-4 rounded-lg border-0', s.status === 'confirmed' ? 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]' : s.status === 'rescheduled' ? 'bg-[hsl(var(--state-warning)/0.1)] text-[hsl(var(--state-warning))]' : 'bg-muted text-muted-foreground')}>{s.status}</Badge>
                </div>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-[8px] rounded-xl gap-0.5" onClick={() => setShowPreJoin(true)}>
                    {s.type === 'video' ? <Video className="h-2.5 w-2.5" /> : <Phone className="h-2.5 w-2.5" />}Join Early
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><Calendar className="h-2.5 w-2.5" />Reschedule</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5"><MessageCircle className="h-2.5 w-2.5" />Message</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[8px] rounded-xl gap-0.5 ml-auto"><X className="h-2.5 w-2.5" />Cancel</Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Devices Tab ── */}
      {activeTab === 'devices' && (
        <div className="space-y-4">
          <SectionCard title="Audio & Video Devices" className="!rounded-2xl">
            <div className="space-y-3">
              {[
                { label: 'Microphone', icon: Mic, device: 'MacBook Pro Microphone', status: 'Connected' },
                { label: 'Camera', icon: Video, device: 'FaceTime HD Camera', status: 'Connected' },
                { label: 'Speakers', icon: Volume2, device: 'MacBook Pro Speakers', status: 'Connected' },
              ].map(d => (
                <div key={d.label} className="flex items-center gap-3 p-3 rounded-xl border">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center"><d.icon className="h-4 w-4 text-accent" /></div>
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold">{d.label}</div>
                    <div className="text-[9px] text-muted-foreground">{d.device}</div>
                  </div>
                  <Badge className="bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] text-[7px] h-4 rounded-lg border-0">{d.status}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7 rounded-xl"><ChevronDown className="h-3 w-3" /></Button>
                </div>
              ))}
            </div>
          </SectionCard>
          <SectionCard title="Network Quality" className="!rounded-2xl">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold">Connection</span>
                <Badge className="bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] text-[7px] h-4 rounded-lg border-0 gap-0.5"><Wifi className="h-2 w-2" />Excellent</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                {[{ label: 'Latency', value: '42ms' }, { label: 'Download', value: '85 Mbps' }, { label: 'Upload', value: '24 Mbps' }].map(s => (
                  <div key={s.label} className="rounded-xl border p-2">
                    <div className="text-xs font-bold">{s.value}</div>
                    <div className="text-[7px] text-muted-foreground">{s.label}</div>
                  </div>
                ))}
              </div>
              <Button variant="outline" size="sm" className="w-full h-7 text-[9px] rounded-xl gap-1"><RefreshCw className="h-3 w-3" />Run Speed Test</Button>
            </div>
          </SectionCard>
        </div>
      )}

      {/* Drawers */}
      <PreJoinDrawer open={showPreJoin} onClose={() => setShowPreJoin(false)} />
      <CallEndedDrawer open={showEndedSummary} onClose={() => setShowEndedSummary(false)} call={selectedCall || undefined} />
      <ScheduleCallDrawer open={showSchedule} onClose={() => setShowSchedule(false)} />
    </DashboardLayout>
  );
};

export default CallsVideoPage;
