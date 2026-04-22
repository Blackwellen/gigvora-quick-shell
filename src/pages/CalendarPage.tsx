import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Calendar as CalendarIcon, Plus, Clock, Video, MapPin,
  Users, ChevronLeft, ChevronRight, MoreHorizontal, Phone,
  Link2, Settings, Globe, Copy, ExternalLink, AlertTriangle,
  CheckCircle2, X, Mic, Monitor, History, Search, Filter,
  Eye, RefreshCw, Lock, Bookmark, ArrowRight, Bell,
  Sparkles, Star, CircleDot, Download, Share2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Types ──
type MeetingType = 'meeting' | 'call' | 'interview' | 'consultation' | 'review' | 'deadline' | 'event';
type MeetingStatus = 'upcoming' | 'live' | 'completed' | 'cancelled' | 'no-show' | 'rescheduled';
type CalView = 'week' | 'month' | 'day';
type ScopeMode = 'personal' | 'team' | 'round-robin';
type MainTab = 'calendar' | 'upcoming' | 'availability' | 'booking' | 'history';

interface Meeting {
  id: string; title: string; time: string; duration: string; type: MeetingType;
  status: MeetingStatus; day: number;
  participants: { name: string; avatar: string }[];
  project?: string; notes?: string; bookingLink?: string; color: string;
}

// ── Mock Data ──
const MEETINGS: Meeting[] = [
  { id: 'e1', title: 'Design Review', time: '9:00 AM', duration: '1h', type: 'review', status: 'upcoming', day: 8, participants: [{ name: 'Sarah C.', avatar: 'SC' }, { name: 'Alex K.', avatar: 'AK' }, { name: 'Elena R.', avatar: 'ER' }], project: 'SaaS Platform', notes: 'Review dashboard wireframes v2, approve color palette.', color: 'bg-accent/20 text-accent border-accent/30' },
  { id: 'e2', title: 'Client Call — TechCorp', time: '11:00 AM', duration: '30m', type: 'call', status: 'upcoming', day: 8, participants: [{ name: 'Client', avatar: 'TC' }], project: 'TechCorp Redesign', color: 'bg-[hsl(var(--gigvora-green))]/20 text-[hsl(var(--gigvora-green))] border-[hsl(var(--gigvora-green))]/30' },
  { id: 'e3', title: 'Sprint Planning', time: '2:00 PM', duration: '1.5h', type: 'meeting', status: 'upcoming', day: 9, participants: [{ name: 'Sarah C.', avatar: 'SC' }, { name: 'Elena R.', avatar: 'ER' }, { name: 'Priya P.', avatar: 'PP' }, { name: 'Alex K.', avatar: 'AK' }], project: 'SaaS Platform', color: 'bg-accent/20 text-accent border-accent/30' },
  { id: 'e4', title: 'Candidate Interview — J. Smith', time: '10:00 AM', duration: '45m', type: 'interview', status: 'upcoming', day: 10, participants: [{ name: 'J. Smith', avatar: 'JS' }], notes: 'Senior Frontend Developer position.', color: 'bg-[hsl(var(--gigvora-purple))]/20 text-[hsl(var(--gigvora-purple))] border-[hsl(var(--gigvora-purple))]/30' },
  { id: 'e5', title: 'Milestone Deadline', time: 'All day', duration: '', type: 'deadline', status: 'upcoming', day: 11, participants: [], project: 'SaaS Platform', color: 'bg-destructive/20 text-destructive border-destructive/30' },
  { id: 'e6', title: 'Speed Networking', time: '4:00 PM', duration: '1h', type: 'event', status: 'upcoming', day: 10, participants: [{ name: 'Community', avatar: 'GV' }], color: 'bg-[hsl(var(--gigvora-amber))]/20 text-[hsl(var(--gigvora-amber))] border-[hsl(var(--gigvora-amber))]/30' },
  { id: 'e7', title: 'Consultation — API Architecture', time: '3:00 PM', duration: '1h', type: 'consultation', status: 'upcoming', day: 9, participants: [{ name: 'Elena R.', avatar: 'ER' }, { name: 'Client', avatar: 'CL' }], project: 'Microservices Migration', notes: 'Paid consultation: $150/hr', bookingLink: 'gigvora.com/book/elena-r/api-consult', color: 'bg-[hsl(var(--gigvora-teal))]/20 text-[hsl(var(--gigvora-teal))] border-[hsl(var(--gigvora-teal))]/30' },
  { id: 'e8', title: 'Project Review — v1.2', time: '11:00 AM', duration: '45m', type: 'review', status: 'completed', day: 7, participants: [{ name: 'Sarah C.', avatar: 'SC' }, { name: 'Alex K.', avatar: 'AK' }], project: 'SaaS Platform', notes: 'Approved. Next milestone triggered.', color: 'bg-muted text-muted-foreground border-muted' },
  { id: 'e9', title: 'Cancelled: Vendor Call', time: '1:00 PM', duration: '30m', type: 'call', status: 'cancelled', day: 7, participants: [{ name: 'Vendor', avatar: 'VN' }], color: 'bg-muted text-muted-foreground border-muted line-through' },
];

const BOOKING_LINKS = [
  { id: 'bl1', name: '30-min Consultation', slug: '/book/30min', duration: '30m', price: 'Free', active: true, bookings: 12 },
  { id: 'bl2', name: '1-hr Deep Dive', slug: '/book/60min', duration: '1h', price: '$150', active: true, bookings: 8 },
  { id: 'bl3', name: 'Interview Slot', slug: '/book/interview', duration: '45m', price: 'Free', active: true, bookings: 5 },
  { id: 'bl4', name: 'Project Review', slug: '/book/review', duration: '1h', price: '$100', active: false, bookings: 0 },
];

const AVAILABILITY_SLOTS = [
  { day: 'Monday', slots: ['9:00 AM - 12:00 PM', '2:00 PM - 5:00 PM'] },
  { day: 'Tuesday', slots: ['10:00 AM - 1:00 PM', '3:00 PM - 6:00 PM'] },
  { day: 'Wednesday', slots: ['9:00 AM - 12:00 PM'] },
  { day: 'Thursday', slots: ['10:00 AM - 1:00 PM', '2:00 PM - 5:00 PM'] },
  { day: 'Friday', slots: ['9:00 AM - 12:00 PM'] },
];

const TIMEZONES = [
  { label: 'Eastern (UTC-5)', offset: 'UTC-5', current: '10:30 AM' },
  { label: 'Pacific (UTC-8)', offset: 'UTC-8', current: '7:30 AM' },
  { label: 'GMT (UTC+0)', offset: 'UTC+0', current: '3:30 PM' },
  { label: 'CET (UTC+1)', offset: 'UTC+1', current: '4:30 PM' },
  { label: 'IST (UTC+5:30)', offset: 'UTC+5:30', current: '9:00 PM' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);

const TYPE_ICONS: Record<MeetingType, React.ElementType> = {
  meeting: Users, call: Phone, interview: Video, consultation: Globe,
  review: Eye, deadline: AlertTriangle, event: CalendarIcon,
};

const STATUS_MAP: Record<MeetingStatus, { label: string; state: 'healthy' | 'live' | 'pending' | 'blocked' | 'caution' | 'degraded' }> = {
  upcoming: { label: 'Upcoming', state: 'pending' },
  live: { label: 'Live Now', state: 'live' },
  completed: { label: 'Completed', state: 'healthy' },
  cancelled: { label: 'Cancelled', state: 'blocked' },
  'no-show': { label: 'No Show', state: 'caution' },
  rescheduled: { label: 'Rescheduled', state: 'degraded' },
};

const ACTIVITY_LOG = [
  { actor: 'Elena R.', action: 'accepted "Sprint Planning" invite', time: '15m ago' },
  { actor: 'System', action: '"Milestone Deadline" reminder sent to team', time: '1h ago' },
  { actor: 'Client', action: 'cancelled "Vendor Call" — scheduling conflict', time: '3h ago' },
  { actor: 'J. Smith', action: 'confirmed "Candidate Interview" slot', time: '5h ago' },
  { actor: 'Sarah C.', action: 'created booking link "Project Review"', time: '1d ago' },
];

/* ═══════════════════════════════════════════════════════════
   Meeting Detail Drawer
   ═══════════════════════════════════════════════════════════ */
const MeetingDrawer: React.FC<{ meeting: Meeting | null; open: boolean; onClose: () => void; onReschedule: () => void; onCancel: () => void }> = ({ meeting, open, onClose, onReschedule, onCancel }) => {
  if (!meeting) return null;
  const Icon = TYPE_ICONS[meeting.type];
  const sm = STATUS_MAP[meeting.status];
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto p-0">
        <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Icon className="h-4 w-4 text-accent" />{meeting.title}</SheetTitle></SheetHeader>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Status', value: <StatusBadge status={sm.state} label={sm.label} /> },
              { label: 'Type', value: <Badge variant="secondary" className="text-[8px] capitalize rounded-lg">{meeting.type}</Badge> },
              { label: 'Time', value: `${meeting.time} · ${meeting.duration}` },
              { label: 'Date', value: `Apr ${meeting.day}, 2026` },
            ].map(m => (
              <div key={m.label} className="rounded-2xl border p-2.5">
                <div className="text-[7px] text-muted-foreground mb-0.5">{m.label}</div>
                <div className="text-[9px] font-medium">{m.value}</div>
              </div>
            ))}
          </div>

          {meeting.project && (
            <div className="rounded-xl border bg-muted/15 px-3 py-2 flex items-center gap-2">
              <Badge variant="secondary" className="text-[7px] h-3.5 rounded-lg">Project</Badge>
              <span className="text-[9px] font-semibold text-accent">{meeting.project}</span>
              <Button variant="ghost" size="sm" className="h-4 text-[7px] ml-auto px-1.5 rounded-lg gap-0.5"><ExternalLink className="h-2.5 w-2.5" />Open</Button>
            </div>
          )}

          <div>
            <div className="text-[10px] font-semibold mb-1.5">Participants ({meeting.participants.length})</div>
            <div className="space-y-1">
              {meeting.participants.map(p => (
                <div key={p.name} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-muted/30 transition-all group">
                  <Avatar className="h-7 w-7 ring-1 ring-muted/40"><AvatarFallback className="text-[7px] bg-accent/10 text-accent font-bold">{p.avatar}</AvatarFallback></Avatar>
                  <span className="text-[9px] font-medium group-hover:text-accent transition-colors">{p.name}</span>
                  <span className="text-[7px] text-muted-foreground ml-auto flex items-center gap-0.5"><CircleDot className="h-2 w-2 text-[hsl(var(--state-healthy))]" />Online</span>
                </div>
              ))}
            </div>
          </div>

          {meeting.notes && (
            <div>
              <div className="text-[10px] font-semibold mb-1">Notes</div>
              <p className="text-[9px] text-muted-foreground bg-muted/30 rounded-xl p-3 leading-relaxed">{meeting.notes}</p>
            </div>
          )}

          {meeting.bookingLink && (
            <div className="rounded-xl border p-2.5">
              <div className="text-[7px] text-muted-foreground mb-0.5">Booking Link</div>
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-medium text-accent truncate">{meeting.bookingLink}</span>
                <Button variant="ghost" size="sm" className="h-5 px-1.5 rounded-lg" onClick={() => { navigator.clipboard.writeText(meeting.bookingLink!); toast.success('Copied!'); }}><Copy className="h-2.5 w-2.5" /></Button>
              </div>
            </div>
          )}

          {/* Timezone Resolver */}
          <SectionCard title="Timezone View" className="!rounded-2xl">
            <div className="space-y-1">
              {TIMEZONES.slice(0, 3).map(tz => (
                <div key={tz.offset} className="flex items-center justify-between text-[9px] p-1.5 rounded-lg hover:bg-muted/20 transition-all">
                  <span className="text-muted-foreground">{tz.label}</span>
                  <span className="font-semibold">{tz.current}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Pre-Call Check */}
          {(meeting.type === 'call' || meeting.type === 'interview' || meeting.type === 'consultation' || meeting.type === 'meeting') && meeting.status === 'upcoming' && (
            <div className="border-t pt-3">
              <div className="text-[10px] font-semibold mb-2 flex items-center gap-1"><Monitor className="h-3 w-3 text-accent" />Pre-Call Check</div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: Video, label: 'Camera', ok: true },
                  { icon: Mic, label: 'Mic', ok: true },
                  { icon: Monitor, label: 'Screen', ok: true },
                ].map(d => (
                  <div key={d.label} className="rounded-xl border p-2 text-center">
                    <d.icon className={cn('h-4 w-4 mx-auto mb-1', d.ok ? 'text-[hsl(var(--state-healthy))]' : 'text-destructive')} />
                    <div className="text-[8px] font-medium">{d.label}</div>
                    <CheckCircle2 className="h-2.5 w-2.5 text-[hsl(var(--state-healthy))] mx-auto mt-0.5" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {meeting.status === 'upcoming' && (
              <>
                <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Video className="h-2.5 w-2.5" />Join Call</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => { onClose(); onReschedule(); }}><ArrowRight className="h-2.5 w-2.5" />Reschedule</Button>
                <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl text-destructive" onClick={() => { onClose(); onCancel(); }}><X className="h-2.5 w-2.5" />Cancel</Button>
              </>
            )}
            {meeting.status === 'completed' && (
              <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Download className="h-2.5 w-2.5" />Recording</Button>
            )}
            <Button variant="outline" size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Share2 className="h-2.5 w-2.5" />Share</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/* ═══════════════════════════════════════════════════════════
   Book Time Drawer
   ═══════════════════════════════════════════════════════════ */
const BookTimeDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[460px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4 text-accent" />Book Time</SheetTitle></SheetHeader>
      <div className="p-5 space-y-4">
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Title *</label>
          <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30 transition-all" placeholder="Meeting title..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Type</label>
            <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]">
              <option>Meeting</option><option>Call</option><option>Interview</option><option>Consultation</option><option>Review</option>
            </select>
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">Duration</label>
            <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]">
              <option>15 min</option><option>30 min</option><option>45 min</option><option>1 hour</option><option>1.5 hours</option>
            </select>
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
          <label className="text-[11px] font-semibold mb-1.5 block">Participants</label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <input className="w-full h-9 rounded-xl border bg-background pl-8 pr-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="Search people..." />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Linked Project</label>
          <input className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="Select project..." />
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Notes</label>
          <textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2.5 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="Agenda, context..." />
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Timezone</label>
          <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]">
            {TIMEZONES.map(tz => <option key={tz.offset} value={tz.offset}>{tz.label}</option>)}
          </select>
        </div>
        <Button className="w-full h-10 rounded-2xl text-[11px] gap-1.5" onClick={() => { onClose(); toast.success('Meeting booked!'); }}>
          <CalendarIcon className="h-4 w-4" />Book Meeting
        </Button>
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════════════
   Reschedule Drawer
   ═══════════════════════════════════════════════════════════ */
const RescheduleDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[420px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2"><ArrowRight className="h-4 w-4 text-accent" />Reschedule Meeting</SheetTitle></SheetHeader>
      <div className="p-5 space-y-4">
        <div className="rounded-2xl border border-[hsl(var(--state-warning)/0.3)] bg-[hsl(var(--state-warning)/0.05)] p-3">
          <div className="text-[10px] font-semibold flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-warning))]" />Rescheduling Notification</div>
          <p className="text-[9px] text-muted-foreground mt-1">All participants will be notified of the change and asked to confirm the new time.</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">New Date</label>
            <input type="date" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
          <div>
            <label className="text-[11px] font-semibold mb-1.5 block">New Time</label>
            <input type="time" className="w-full h-9 rounded-xl border bg-background px-3 text-[11px] focus:outline-none focus:ring-2 focus:ring-accent/30" />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Reason (optional)</label>
          <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="Why are you rescheduling?" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-9 rounded-xl text-[11px]" onClick={onClose}>Cancel</Button>
          <Button className="flex-1 h-9 rounded-xl text-[11px] gap-1" onClick={() => { onClose(); toast.success('Meeting rescheduled. Participants notified.'); }}><CheckCircle2 className="h-3.5 w-3.5" />Confirm</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════════════
   Cancel Drawer
   ═══════════════════════════════════════════════════════════ */
const CancelDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => (
  <Sheet open={open} onOpenChange={onClose}>
    <SheetContent className="w-[400px] overflow-y-auto p-0">
      <SheetHeader className="p-5 border-b"><SheetTitle className="text-sm flex items-center gap-2 text-destructive"><X className="h-4 w-4" />Cancel Meeting</SheetTitle></SheetHeader>
      <div className="p-5 space-y-4">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
          <div className="text-[10px] font-semibold flex items-center gap-1.5"><AlertTriangle className="h-3.5 w-3.5 text-destructive" />This action cannot be undone</div>
          <p className="text-[9px] text-muted-foreground mt-1">All participants will be notified. Any linked booking or payment holds will be released.</p>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Cancellation Reason</label>
          <select className="w-full h-9 rounded-xl border bg-background px-3 text-[11px]">
            <option>Schedule conflict</option><option>No longer needed</option><option>Participant unavailable</option><option>Other</option>
          </select>
        </div>
        <div>
          <label className="text-[11px] font-semibold mb-1.5 block">Message to participants</label>
          <textarea className="w-full h-16 rounded-xl border bg-background px-3 py-2 text-[11px] resize-none focus:outline-none focus:ring-2 focus:ring-accent/30" placeholder="Optional message..." />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 h-9 rounded-xl text-[11px]" onClick={onClose}>Keep Meeting</Button>
          <Button variant="destructive" className="flex-1 h-9 rounded-xl text-[11px] gap-1" onClick={() => { onClose(); toast.success('Meeting cancelled.'); }}><X className="h-3.5 w-3.5" />Cancel Meeting</Button>
        </div>
      </div>
    </SheetContent>
  </Sheet>
);

/* ═══════════════════════════════════════════════════════════
   Calendar Grid
   ═══════════════════════════════════════════════════════════ */
const WeekGrid: React.FC<{ meetings: Meeting[]; onSelect: (m: Meeting) => void; selectedId: string | null }> = ({ meetings, onSelect, selectedId }) => (
  <div className="rounded-2xl border bg-card overflow-hidden shadow-sm">
    <div className="grid grid-cols-[48px_repeat(7,1fr)] border-b">
      <div className="px-1 py-2.5" />
      {DAYS.map((day, i) => (
        <div key={day} className={cn('px-1.5 py-2.5 text-center border-l', i === 1 && 'bg-accent/5')}>
          <div className="text-[8px] text-muted-foreground font-medium">{day}</div>
          <div className={cn('text-sm font-bold', i === 1 && 'text-accent')}>{7 + i}</div>
        </div>
      ))}
    </div>
    <div className="relative" style={{ height: '420px', overflowY: 'auto' }}>
      {HOURS.map(hour => (
        <div key={hour} className="flex border-b" style={{ height: '35px' }}>
          <div className="w-12 shrink-0 px-1 text-[7px] text-muted-foreground flex items-start pt-0.5">
            {hour > 12 ? `${hour - 12}PM` : hour === 12 ? '12PM' : `${hour}AM`}
          </div>
          <div className="flex-1 grid grid-cols-7">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="border-l hover:bg-muted/20 cursor-pointer transition-colors" />
            ))}
          </div>
        </div>
      ))}
      {meetings.filter(e => e.time !== 'All day').map(event => {
        const dayOffset = event.day - 7;
        const hourMatch = event.time.match(/(\d+):(\d+)\s*(AM|PM)/);
        if (!hourMatch || dayOffset < 0 || dayOffset > 6) return null;
        let hour = parseInt(hourMatch[1]);
        if (hourMatch[3] === 'PM' && hour !== 12) hour += 12;
        const top = (hour - 8) * 35;
        const left = `calc(48px + ${dayOffset} * (100% - 48px) / 7 + 2px)`;
        const width = `calc((100% - 48px) / 7 - 4px)`;
        return (
          <div key={event.id} onClick={() => onSelect(event)}
            className={cn('absolute rounded-xl border px-1.5 py-0.5 cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200', event.color, selectedId === event.id && 'ring-2 ring-accent')}
            style={{ top: `${top}px`, left, width, height: '32px', zIndex: 10 }}>
            <div className="text-[8px] font-semibold truncate">{event.title}</div>
            <div className="text-[6px] opacity-70">{event.time}</div>
          </div>
        );
      })}
    </div>
  </div>
);

/* ═══════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════ */
const CalendarPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MainTab>('calendar');
  const [scope, setScope] = useState<ScopeMode>('personal');
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [bookOpen, setBookOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = filterType === 'all' ? MEETINGS : MEETINGS.filter(m => m.type === filterType);
  const upcoming = MEETINGS.filter(m => m.status === 'upcoming').sort((a, b) => a.day - b.day);
  const todayCount = MEETINGS.filter(m => m.day === 8 && m.status === 'upcoming').length;
  const weekCount = MEETINGS.filter(m => m.status === 'upcoming').length;

  const TABS: { id: MainTab; label: string; icon: React.ElementType }[] = [
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'upcoming', label: 'Upcoming', icon: Clock },
    { id: 'availability', label: 'Availability', icon: Eye },
    { id: 'booking', label: 'Booking Links', icon: Link2 },
    { id: 'history', label: 'History', icon: History },
  ];

  /* ── Top Strip ── */
  const topStrip = (
    <>
      <div className="flex items-center gap-2.5">
        <div className="h-7 w-7 rounded-xl bg-accent/10 flex items-center justify-center"><CalendarIcon className="h-3.5 w-3.5 text-accent" /></div>
        <span className="text-xs font-bold">Calendar & Bookings</span>
        <Badge variant="secondary" className="text-[7px] rounded-lg">Apr 7 – 13, 2026</Badge>
      </div>
      <div className="flex-1" />
      <div className="flex items-center gap-1.5">
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg"><ChevronLeft className="h-3 w-3" /></Button>
        <Button variant="outline" size="sm" className="h-6 text-[9px] rounded-xl">Today</Button>
        <Button variant="ghost" size="icon" className="h-6 w-6 rounded-lg"><ChevronRight className="h-3 w-3" /></Button>
      </div>
      <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-0.5 ml-2">
        {(['personal', 'team', 'round-robin'] as ScopeMode[]).map(s => (
          <button key={s} onClick={() => setScope(s)} className={cn('px-2.5 py-1 rounded-lg text-[8px] font-semibold transition-all capitalize', scope === s ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground')}>{s.replace('-', ' ')}</button>
        ))}
      </div>
      <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-7 rounded-xl border bg-background px-2 text-[9px] ml-1.5">
        <option value="all">All types</option>
        <option value="meeting">Meetings</option><option value="call">Calls</option>
        <option value="interview">Interviews</option><option value="consultation">Consultations</option>
      </select>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 ml-1.5" onClick={() => setBookOpen(true)}><Plus className="h-3 w-3" />Book Time</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5 rounded-lg ml-1"><Globe className="h-2.5 w-2.5" />UTC-5</Badge>
    </>
  );

  /* ── Right Rail ── */
  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Today" className="!rounded-2xl">
        <div className="space-y-1.5">
          {upcoming.filter(m => m.day === 8).map(m => {
            const Icon = TYPE_ICONS[m.type];
            return (
              <div key={m.id} onClick={() => setSelectedMeeting(m)} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/30 cursor-pointer transition-all group">
                <div className="h-7 w-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0"><Icon className="h-3 w-3 text-accent" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] font-semibold truncate group-hover:text-accent transition-colors">{m.title}</div>
                  <div className="text-[7px] text-muted-foreground">{m.time} · {m.duration}</div>
                </div>
                {(m.type === 'call' || m.type === 'interview' || m.type === 'meeting') && (
                  <Button variant="outline" size="sm" className="h-5 text-[7px] px-1.5 rounded-lg shrink-0 opacity-0 group-hover:opacity-100 transition-all"><Video className="h-2 w-2" /></Button>
                )}
              </div>
            );
          })}
          {todayCount === 0 && <div className="text-[8px] text-muted-foreground text-center py-3">No events today</div>}
        </div>
      </SectionCard>

      <SectionCard title="This Week" subtitle={`${weekCount} events`} className="!rounded-2xl">
        <div className="space-y-1">
          {upcoming.slice(0, 5).map(m => (
            <div key={m.id} onClick={() => setSelectedMeeting(m)} className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-muted/30 cursor-pointer text-[8px] transition-all">
              <div className={cn('h-2 w-2 rounded-full shrink-0', m.type === 'meeting' || m.type === 'review' ? 'bg-accent' : m.type === 'call' ? 'bg-[hsl(var(--gigvora-green))]' : m.type === 'interview' ? 'bg-[hsl(var(--gigvora-purple))]' : 'bg-[hsl(var(--gigvora-amber))]')} />
              <span className="truncate flex-1 font-medium">{m.title}</span>
              <span className="text-[7px] text-muted-foreground shrink-0">Apr {m.day}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Timezone Resolver */}
      <SectionCard title="Timezone Resolver" className="!rounded-2xl">
        <div className="space-y-1">
          {TIMEZONES.map(tz => (
            <div key={tz.offset} className="flex items-center justify-between text-[9px] p-1.5 rounded-lg hover:bg-muted/20 transition-all">
              <span className="text-muted-foreground">{tz.label}</span>
              <span className="font-mono font-semibold">{tz.current}</span>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-0.5">
          {[
            { l: 'Share Availability', icon: Share2, action: 'Link copied' },
            { l: 'Timezone Converter', icon: Globe, action: '' },
            { l: 'Booking Links', icon: ExternalLink, action: '' },
            { l: 'Calendar Settings', icon: Settings, action: '' },
          ].map(a => (
            <button key={a.l} onClick={() => { if (a.action) toast.success(a.action); else setActiveTab(a.l.includes('Booking') ? 'booking' : activeTab); }} className="flex items-center gap-2 p-2 rounded-xl hover:bg-muted/30 transition-all w-full text-left text-[9px] font-medium group">
              <a.icon className="h-3 w-3 text-muted-foreground group-hover:text-accent transition-colors" />
              <span className="group-hover:text-accent transition-colors">{a.l}</span>
            </button>
          ))}
        </div>
      </SectionCard>

      <div className="rounded-2xl border p-2.5">
        <div className="flex items-center justify-between text-[8px]">
          <span className="flex items-center gap-1 text-[hsl(var(--state-healthy))]"><CheckCircle2 className="h-2.5 w-2.5" />Synced</span>
          <Button variant="ghost" size="sm" className="h-4 text-[7px] gap-0.5 rounded-lg"><RefreshCw className="h-2 w-2" />Refresh</Button>
        </div>
        <div className="text-[7px] text-muted-foreground mt-0.5">Google Calendar · Last sync: 5m ago</div>
      </div>
    </div>
  );

  /* ── Bottom Section ── */
  const bottomSection = (
    <div className="p-4">
      <div className="text-[11px] font-bold mb-3 flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-accent" />Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {ACTIVITY_LOG.map((a, i) => (
          <div key={i} className="shrink-0 rounded-2xl border bg-card px-3.5 py-2.5 min-w-[220px] hover:shadow-sm transition-all">
            <div className="flex items-center gap-1.5 mb-0.5">
              <Avatar className="h-4 w-4 ring-1 ring-muted/40"><AvatarFallback className="text-[5px] bg-accent/10 text-accent font-bold">{a.actor[0]}</AvatarFallback></Avatar>
              <span className="text-[9px] font-semibold">{a.actor}</span>
            </div>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      {/* KPI Band */}
      <KPIBand className="mb-4">
        <KPICard label="Today" value={String(todayCount)} change="events" />
        <KPICard label="This Week" value={String(weekCount)} change="scheduled" />
        <KPICard label="Interviews" value={String(MEETINGS.filter(m => m.type === 'interview').length)} change="pending" />
        <KPICard label="Consultations" value={String(MEETINGS.filter(m => m.type === 'consultation').length)} change="booked" />
      </KPIBand>

      {/* Tab Nav */}
      <div className="flex items-center gap-0.5 p-1 rounded-2xl bg-muted/30 mb-4">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} className={cn(
            'flex items-center gap-1.5 px-3.5 py-2 text-[10px] font-semibold rounded-xl transition-all duration-200',
            activeTab === t.id ? 'bg-background shadow-sm text-accent' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30'
          )}><t.icon className="h-3 w-3" />{t.label}</button>
        ))}
      </div>

      {/* ── Calendar Tab ── */}
      {activeTab === 'calendar' && <WeekGrid meetings={filtered} onSelect={setSelectedMeeting} selectedId={selectedMeeting?.id || null} />}

      {/* ── Upcoming Tab ── */}
      {activeTab === 'upcoming' && (
        <div className="space-y-2">
          {upcoming.map(m => {
            const Icon = TYPE_ICONS[m.type];
            return (
              <div key={m.id} onClick={() => setSelectedMeeting(m)} className={cn('rounded-2xl border p-3.5 bg-card cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200', selectedMeeting?.id === m.id && 'border-accent')}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center"><Icon className="h-3.5 w-3.5 text-accent" /></div>
                    <div>
                      <span className="text-[11px] font-bold">{m.title}</span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="secondary" className="text-[7px] capitalize rounded-lg">{m.type}</Badge>
                        {m.project && <span className="text-[8px] text-accent">{m.project}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {(m.type === 'call' || m.type === 'interview' || m.type === 'meeting') && (
                      <Button size="sm" className="h-6 text-[8px] gap-1 rounded-xl"><Video className="h-2.5 w-2.5" />Join</Button>
                    )}
                    <Button variant="outline" size="sm" className="h-6 rounded-xl"><MoreHorizontal className="h-3 w-3" /></Button>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                  <span className="flex items-center gap-0.5"><CalendarIcon className="h-2.5 w-2.5" />Apr {m.day}</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{m.time} · {m.duration}</span>
                  <span className="flex items-center gap-0.5"><Users className="h-2.5 w-2.5" />{m.participants.length}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {m.participants.slice(0, 4).map(p => (
                    <Avatar key={p.name} className="h-5 w-5 ring-1 ring-muted/40"><AvatarFallback className="text-[6px] bg-accent/10 text-accent font-bold">{p.avatar}</AvatarFallback></Avatar>
                  ))}
                  {m.participants.length > 4 && <span className="text-[7px] text-muted-foreground">+{m.participants.length - 4}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Availability Tab ── */}
      {activeTab === 'availability' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold">Your Availability Windows</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Add Slot</Button>
          </div>
          <div className="space-y-2">
            {AVAILABILITY_SLOTS.map(day => (
              <div key={day.day} className="rounded-2xl border p-3.5 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold">{day.day}</span>
                  <Badge variant="secondary" className="text-[7px] rounded-lg">{day.slots.length} slot{day.slots.length > 1 ? 's' : ''}</Badge>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {day.slots.map((slot, i) => (
                    <div key={i} className="rounded-xl border bg-accent/5 px-3 py-1.5 text-[9px] font-medium flex items-center gap-1.5 group hover:bg-accent/10 transition-all">
                      <Clock className="h-2.5 w-2.5 text-accent" />
                      {slot}
                      <button className="opacity-0 group-hover:opacity-100 transition-all"><X className="h-2.5 w-2.5 text-muted-foreground hover:text-destructive" /></button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="rounded-2xl border p-4">
            <div className="text-[11px] font-bold mb-2">Booking Buffer Settings</div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Buffer before', value: '15 min' },
                { label: 'Buffer after', value: '10 min' },
                { label: 'Min notice', value: '2 hours' },
                { label: 'Max advance', value: '30 days' },
              ].map(s => (
                <div key={s.label} className="rounded-xl border p-2.5">
                  <div className="text-[8px] text-muted-foreground">{s.label}</div>
                  <div className="text-[11px] font-semibold">{s.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Booking Links Tab ── */}
      {activeTab === 'booking' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-bold">Your Booking Links</span>
            <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Create Link</Button>
          </div>
          {BOOKING_LINKS.map(bl => (
            <div key={bl.id} className={cn('rounded-2xl border p-4 transition-all hover:shadow-sm', bl.active ? 'bg-card' : 'bg-muted/30 opacity-60')}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center"><Link2 className="h-4 w-4 text-accent" /></div>
                  <div>
                    <div className="text-[11px] font-bold flex items-center gap-1.5">{bl.name} {!bl.active && <Badge variant="secondary" className="text-[6px] rounded-lg">Inactive</Badge>}</div>
                    <div className="text-[8px] text-muted-foreground font-mono">{bl.slug}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Badge variant="secondary" className="text-[7px] rounded-lg">{bl.duration}</Badge>
                  <Badge variant="secondary" className="text-[7px] rounded-lg">{bl.price}</Badge>
                  <Badge variant="secondary" className="text-[7px] rounded-lg">{bl.bookings} bookings</Badge>
                </div>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl gap-0.5" onClick={() => toast.success('Copied!')}><Copy className="h-2 w-2" />Copy Link</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl gap-0.5"><Share2 className="h-2 w-2" />Share</Button>
                <Button variant="ghost" size="sm" className="h-6 text-[8px] rounded-xl gap-0.5"><Settings className="h-2 w-2" />Edit</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── History Tab ── */}
      {activeTab === 'history' && (
        <div className="space-y-2">
          <div className="text-[12px] font-bold mb-2">Past Meetings</div>
          {MEETINGS.filter(m => m.status === 'completed' || m.status === 'cancelled' || m.status === 'no-show').map(m => {
            const sm = STATUS_MAP[m.status];
            const Icon = TYPE_ICONS[m.type];
            return (
              <div key={m.id} className="rounded-2xl border p-3.5 bg-card hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className={cn('text-[11px] font-semibold', m.status === 'cancelled' && 'line-through text-muted-foreground')}>{m.title}</span>
                  </div>
                  <StatusBadge status={sm.state} label={sm.label} />
                </div>
                <div className="text-[8px] text-muted-foreground">Apr {m.day} · {m.time} · {m.duration}</div>
                {m.notes && <p className="text-[8px] text-muted-foreground mt-1.5 bg-muted/30 rounded-xl p-2.5">{m.notes}</p>}
              </div>
            );
          })}
        </div>
      )}

      {/* Drawers */}
      <MeetingDrawer meeting={selectedMeeting} open={!!selectedMeeting} onClose={() => setSelectedMeeting(null)} onReschedule={() => setRescheduleOpen(true)} onCancel={() => setCancelOpen(true)} />
      <BookTimeDrawer open={bookOpen} onClose={() => setBookOpen(false)} />
      <RescheduleDrawer open={rescheduleOpen} onClose={() => setRescheduleOpen(false)} />
      <CancelDrawer open={cancelOpen} onClose={() => setCancelOpen(false)} />
    </DashboardLayout>
  );
};

export default CalendarPage;
