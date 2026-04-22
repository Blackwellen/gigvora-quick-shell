import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar, Clock, MapPin, Video, Users, Share2, Bookmark, Bell, MessageSquare, Star, Globe } from 'lucide-react';

const EVENT = {
  title: 'AI Product Leaders Summit 2026',
  host: 'Gigvora',
  date: 'April 22, 2026',
  time: '9:00 AM – 5:00 PM EST',
  format: 'hybrid' as const,
  location: 'San Francisco + Virtual',
  attendees: 450,
  maxAttendees: 600,
  description: 'Join 450+ product leaders for a full-day summit exploring AI-driven product strategy, responsible AI implementation, and the future of human-AI collaboration in product development.',
  tags: ['AI', 'Product', 'Leadership', 'Strategy'],
  speakers: [
    { name: 'Sarah Kim', avatar: 'SK', title: 'VP Product @ Google', topic: 'AI-First Product Strategy' },
    { name: 'Mike Liu', avatar: 'ML', title: 'CTO @ Scale AI', topic: 'Building AI Infrastructure' },
    { name: 'Ana Rodriguez', avatar: 'AR', title: 'Head of AI @ Notion', topic: 'AI UX Patterns' },
  ],
};

const ATTENDEES = [
  { name: 'David Chen', avatar: 'DC', headline: 'PM @ Stripe' },
  { name: 'Lisa Park', avatar: 'LP', headline: 'Design Lead @ Figma' },
  { name: 'James Rivera', avatar: 'JR', headline: 'Engineer @ Vercel' },
  { name: 'Maya Chen', avatar: 'MC', headline: 'Product @ Airbnb' },
  { name: 'Leo Tanaka', avatar: 'LT', headline: 'VP Eng @ Datadog' },
  { name: 'Aisha Patel', avatar: 'AP', headline: 'Director @ Adobe' },
];

export default function EventDetailPage() {
  const [tab, setTab] = useState('overview');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Calendar className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">{EVENT.title}</h1>
          <StatusBadge status="pending" label="Upcoming" />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Bell className="h-3 w-3" /> Remind</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Bookmark className="h-3 w-3" /> Save</Button>
          <Button size="sm" className="h-7 text-[10px]">RSVP</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Event Info">
            <div className="space-y-2 text-[9px]">
              <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" /><span>{EVENT.date}</span></div>
              <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-muted-foreground" /><span>{EVENT.time}</span></div>
              <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-muted-foreground" /><span>{EVENT.location}</span></div>
              <div className="flex items-center gap-2"><Users className="h-3 w-3 text-muted-foreground" /><span>{EVENT.attendees}/{EVENT.maxAttendees} attending</span></div>
              <div className="flex items-center gap-2"><Globe className="h-3 w-3 text-muted-foreground" /><span className="capitalize">{EVENT.format}</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Tags">
            <div className="flex flex-wrap gap-1">
              {EVENT.tags.map(t => <Badge key={t} variant="secondary" className="text-[8px]">{t}</Badge>)}
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-52"
    >
      <SectionBackNav homeRoute="/events" homeLabel="Events" currentLabel={EVENT.title} icon={<Calendar className="h-3 w-3" />} />
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-[10px] px-3">Overview</TabsTrigger>
          <TabsTrigger value="speakers" className="text-[10px] px-3">Speakers</TabsTrigger>
          <TabsTrigger value="attendees" className="text-[10px] px-3">Attendees</TabsTrigger>
          <TabsTrigger value="discussion" className="text-[10px] px-3">Discussion</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && (
        <SectionCard title="About This Event">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{EVENT.description}</p>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {EVENT.speakers.map(s => (
              <div key={s.name} className="p-3 rounded-xl border border-border/40 text-center">
                <Avatar className="h-12 w-12 mx-auto mb-2">
                  <AvatarFallback className="text-sm bg-accent/10 text-accent">{s.avatar}</AvatarFallback>
                </Avatar>
                <div className="text-[11px] font-semibold">{s.name}</div>
                <div className="text-[9px] text-muted-foreground">{s.title}</div>
                <Badge variant="outline" className="text-[7px] h-3.5 mt-1">{s.topic}</Badge>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'speakers' && (
        <SectionCard title="Speakers & Schedule">
          <div className="space-y-3">
            {EVENT.speakers.map((s, i) => (
              <div key={s.name} className="flex items-start gap-3 p-3 rounded-xl border border-border/40">
                <Avatar className="h-10 w-10"><AvatarFallback className="text-xs bg-accent/10 text-accent">{s.avatar}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="text-xs font-semibold">{s.name}</div>
                  <div className="text-[10px] text-muted-foreground">{s.title}</div>
                  <div className="text-[9px] text-muted-foreground mt-1">Talk: {s.topic}</div>
                  <div className="text-[8px] text-muted-foreground">{9 + i * 2}:00 AM – {10 + i * 2}:00 AM EST</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'attendees' && (
        <SectionCard title="Attendees" subtitle={`${ATTENDEES.length} of ${EVENT.attendees} shown`}>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {ATTENDEES.map(a => (
              <div key={a.name} className="flex items-center gap-2 p-2.5 rounded-xl border border-border/30">
                <Avatar className="h-8 w-8"><AvatarFallback className="text-[10px] bg-muted">{a.avatar}</AvatarFallback></Avatar>
                <div className="min-w-0">
                  <div className="text-[10px] font-medium truncate">{a.name}</div>
                  <div className="text-[8px] text-muted-foreground truncate">{a.headline}</div>
                </div>
              </div>
            ))}
          </div>
        </SectionCard>
      )}

      {tab === 'discussion' && (
        <SectionCard title="Discussion" icon={<MessageSquare className="h-3 w-3 text-muted-foreground" />}>
          {[
            { user: 'David C.', msg: 'Really looking forward to the AI UX Patterns talk!', time: '2h ago', likes: 5 },
            { user: 'Lisa P.', msg: 'Will there be recordings available after?', time: '4h ago', likes: 12 },
            { user: 'James R.', msg: 'See you all there! Flying in from NYC.', time: '1d ago', likes: 8 },
          ].map((c, i) => (
            <div key={i} className="py-3 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium">{c.user}</span>
                <span className="text-[8px] text-muted-foreground">{c.time}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{c.msg}</p>
              <div className="flex items-center gap-2 mt-1">
                <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5"><Star className="h-2.5 w-2.5" /> {c.likes}</Button>
                <Button variant="ghost" size="sm" className="h-5 text-[8px]">Reply</Button>
              </div>
            </div>
          ))}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
