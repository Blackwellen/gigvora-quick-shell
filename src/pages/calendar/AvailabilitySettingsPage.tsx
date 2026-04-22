import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Clock, Calendar, Globe, Plus, Trash2, Save, ArrowRight,
  Shield, Bell, Video, Phone, MapPin, Users, Settings, Copy,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface DaySlot { day: string; enabled: boolean; slots: { start: string; end: string }[]; }

const DEFAULT_SLOTS: DaySlot[] = DAYS.map(d => ({
  day: d,
  enabled: !['Saturday', 'Sunday'].includes(d),
  slots: ['Saturday', 'Sunday'].includes(d) ? [] : [{ start: '09:00', end: '12:00' }, { start: '14:00', end: '17:00' }],
}));

const BOOKING_TYPES = [
  { id: 'intro', label: '30 min Intro', price: 'Free', duration: '30 min', enabled: true },
  { id: 'deep', label: '60 min Deep Dive', price: '$40', duration: '60 min', enabled: true },
  { id: 'pack', label: '4-Session Pack', price: '$120', duration: '4×60 min', enabled: true },
  { id: 'consult', label: 'Consultation', price: '$80', duration: '90 min', enabled: false },
];

export default function AvailabilitySettingsPage() {
  const [slots, setSlots] = useState(DEFAULT_SLOTS);
  const [timezone, setTimezone] = useState('America/New_York (EST)');
  const [buffer, setBuffer] = useState('15');
  const [maxPerDay, setMaxPerDay] = useState('6');

  const toggleDay = (day: string) => {
    setSlots(prev => prev.map(s => s.day === day ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <DashboardLayout topStrip={
      <>
        <Clock className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">Availability Settings</span>
        <div className="flex-1" />
        <Button size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Save className="h-3 w-3" /> Save Changes</Button>
        <Link to="/calendar" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">
          Calendar <ArrowRight className="h-2.5 w-2.5" />
        </Link>
      </>
    }>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Weekly Schedule */}
        <div className="xl:col-span-2">
          <SectionCard title="Weekly Schedule" icon={<Calendar className="h-3.5 w-3.5 text-accent" />}>
            <div className="space-y-2">
              {slots.map(day => (
                <div key={day.day} className={cn(
                  'flex items-start gap-3 p-3 rounded-xl border transition-all',
                  day.enabled ? 'border-border/30 bg-card' : 'border-border/10 bg-muted/20 opacity-60'
                )}>
                  <div className="flex items-center gap-2 w-28 pt-1 shrink-0">
                    <Switch checked={day.enabled} onCheckedChange={() => toggleDay(day.day)} className="scale-75" />
                    <span className={cn('text-[10px] font-semibold', !day.enabled && 'text-muted-foreground')}>{day.day}</span>
                  </div>
                  <div className="flex-1">
                    {day.enabled ? (
                      <div className="space-y-1.5">
                        {day.slots.map((slot, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <Input defaultValue={slot.start} className="h-7 w-20 text-[10px] text-center" />
                            <span className="text-[9px] text-muted-foreground">to</span>
                            <Input defaultValue={slot.end} className="h-7 w-20 text-[10px] text-center" />
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><Trash2 className="h-3 w-3" /></Button>
                          </div>
                        ))}
                        <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 text-accent"><Plus className="h-2.5 w-2.5" /> Add Slot</Button>
                      </div>
                    ) : (
                      <span className="text-[9px] text-muted-foreground pt-1 block">Unavailable</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Booking Types */}
          <SectionCard title="Booking Types" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="mt-3">
            <div className="space-y-2">
              {BOOKING_TYPES.map(bt => (
                <div key={bt.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
                  <Switch checked={bt.enabled} className="scale-75" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold">{bt.label}</span>
                      <Badge variant="outline" className="text-[7px] h-3.5">{bt.duration}</Badge>
                    </div>
                    <span className="text-[9px] text-accent font-semibold">{bt.price}</span>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 rounded-lg"><Settings className="h-2.5 w-2.5" /> Edit</Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full h-8 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" /> Add Booking Type</Button>
            </div>
          </SectionCard>
        </div>

        {/* Right Rail */}
        <div>
          <SectionCard title="General Settings">
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground">Timezone</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <Globe className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Input value={timezone} onChange={e => setTimezone(e.target.value)} className="h-7 text-[10px]" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground">Buffer Between Bookings</label>
                <div className="flex items-center gap-1.5 mt-1">
                  <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                  <Input value={buffer} onChange={e => setBuffer(e.target.value)} className="h-7 w-16 text-[10px] text-center" />
                  <span className="text-[9px] text-muted-foreground">minutes</span>
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-muted-foreground">Max Bookings Per Day</label>
                <Input value={maxPerDay} onChange={e => setMaxPerDay(e.target.value)} className="h-7 w-16 text-[10px] text-center mt-1" />
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Preferences" className="mt-3">
            <div className="space-y-2.5">
              {[
                { label: 'Auto-confirm bookings', desc: 'Skip manual approval for new bookings', enabled: true },
                { label: 'Require profile completion', desc: 'Only accept bookings from complete profiles', enabled: false },
                { label: 'Email reminders', desc: 'Send reminders 24h and 1h before', enabled: true },
                { label: 'Allow rescheduling', desc: 'Let bookers reschedule up to 24h before', enabled: true },
                { label: 'Show on profile', desc: 'Display booking button on your profile', enabled: true },
              ].map(pref => (
                <div key={pref.label} className="flex items-center gap-2.5">
                  <Switch checked={pref.enabled} className="scale-75 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-semibold">{pref.label}</div>
                    <div className="text-[8px] text-muted-foreground">{pref.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Booking Link" className="mt-3">
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-muted/30 border border-border/30">
              <span className="text-[9px] text-muted-foreground truncate flex-1">gigvora.com/book/yourname</span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0"><Copy className="h-3 w-3" /></Button>
            </div>
          </SectionCard>

          <SectionCard title="Blackout Dates" className="mt-3">
            <div className="space-y-1.5">
              {[
                { label: 'Apr 25–27', reason: 'Conference' },
                { label: 'May 1', reason: 'Holiday' },
              ].map(bd => (
                <div key={bd.label} className="flex items-center gap-2 text-[9px] p-2 rounded-lg bg-muted/20">
                  <Calendar className="h-2.5 w-2.5 text-muted-foreground" />
                  <span className="font-medium">{bd.label}</span>
                  <span className="text-muted-foreground">— {bd.reason}</span>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0 ml-auto text-destructive"><Trash2 className="h-2.5 w-2.5" /></Button>
                </div>
              ))}
              <Button variant="ghost" size="sm" className="h-6 text-[8px] gap-0.5 text-accent w-full"><Plus className="h-2.5 w-2.5" /> Add Blackout</Button>
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
