import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Video, Calendar, Clock, Users, Ticket, Share2, Bookmark, Bell, MessageSquare, Star, DollarSign, CheckCircle2 } from 'lucide-react';

const WEBINAR = {
  title: 'Scaling AI Infrastructure: From Prototype to Production',
  host: 'Dr. Raj Patel',
  hostAvatar: 'RP',
  hostTitle: 'AI Research Director',
  date: 'April 22, 2026',
  time: '2:00 PM – 3:30 PM EST',
  attendees: 340,
  maxAttendees: 500,
  price: 'Free',
  description: 'Learn how to scale AI systems from prototype to production-grade infrastructure. This webinar covers GPU fleet management, model serving at scale, cost optimization, and observability patterns for ML workloads.',
  topics: ['GPU Fleet Management', 'Model Serving', 'Cost Optimization', 'ML Observability'],
  speakers: [
    { name: 'Dr. Raj Patel', avatar: 'RP', title: 'AI Research Director' },
    { name: 'Sarah Kim', avatar: 'SK', title: 'VP Infrastructure @ Scale AI' },
  ],
};

export default function WebinarDetailPage() {
  const [tab, setTab] = useState('overview');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Video className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold">{WEBINAR.title}</h1>
          <StatusBadge status="pending" label="Upcoming" />
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Bell className="h-3 w-3" /> Remind</Button>
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
          <Button size="sm" className="h-7 text-[10px] gap-1"><Ticket className="h-3 w-3" /> Register Free</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <SectionCard title="Details">
            <div className="space-y-2 text-[9px]">
              <div className="flex items-center gap-2"><Calendar className="h-3 w-3 text-muted-foreground" /><span>{WEBINAR.date}</span></div>
              <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-muted-foreground" /><span>{WEBINAR.time}</span></div>
              <div className="flex items-center gap-2"><Users className="h-3 w-3 text-muted-foreground" /><span>{WEBINAR.attendees}/{WEBINAR.maxAttendees} registered</span></div>
              <div className="flex items-center gap-2"><Ticket className="h-3 w-3 text-muted-foreground" /><span>{WEBINAR.price}</span></div>
            </div>
          </SectionCard>
          <SectionCard title="Speakers">
            {WEBINAR.speakers.map((s, i) => (
              <div key={i} className="flex items-center gap-2 py-2 border-b border-border/30 last:border-0">
                <Avatar className="h-7 w-7"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{s.avatar}</AvatarFallback></Avatar>
                <div><div className="text-[9px] font-medium">{s.name}</div><div className="text-[8px] text-muted-foreground">{s.title}</div></div>
              </div>
            ))}
          </SectionCard>
          <SectionCard title="Topics">
            <div className="flex flex-wrap gap-1">{WEBINAR.topics.map(t => <Badge key={t} variant="outline" className="text-[8px] h-3.5 px-1.5">{t}</Badge>)}</div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-52"
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-[10px] px-3">Overview</TabsTrigger>
          <TabsTrigger value="agenda" className="text-[10px] px-3">Agenda</TabsTrigger>
          <TabsTrigger value="discussion" className="text-[10px] px-3">Discussion</TabsTrigger>
          <TabsTrigger value="checkout" className="text-[10px] px-3">Register</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && (
        <SectionCard title="About This Webinar">
          <p className="text-[11px] text-muted-foreground leading-relaxed">{WEBINAR.description}</p>
          <div className="mt-4 p-3 rounded-xl bg-accent/5 border border-accent/20">
            <div className="text-[10px] font-medium text-accent mb-1">What You'll Learn</div>
            <ul className="space-y-1">
              {WEBINAR.topics.map(t => (
                <li key={t} className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 text-accent shrink-0" />{t}
                </li>
              ))}
            </ul>
          </div>
        </SectionCard>
      )}

      {tab === 'agenda' && (
        <SectionCard title="Session Agenda">
          {[
            { time: '2:00 PM', title: 'Welcome & Introduction', speaker: 'Dr. Raj Patel', duration: '10 min' },
            { time: '2:10 PM', title: 'GPU Fleet Management at Scale', speaker: 'Sarah Kim', duration: '25 min' },
            { time: '2:35 PM', title: 'Model Serving Architectures', speaker: 'Dr. Raj Patel', duration: '20 min' },
            { time: '2:55 PM', title: 'Cost Optimization Strategies', speaker: 'Sarah Kim', duration: '15 min' },
            { time: '3:10 PM', title: 'Q&A Session', speaker: 'All', duration: '20 min' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 py-3 border-b border-border/30 last:border-0">
              <span className="text-[10px] text-muted-foreground font-mono w-14 shrink-0">{item.time}</span>
              <div className="flex-1">
                <div className="text-[11px] font-medium">{item.title}</div>
                <div className="text-[9px] text-muted-foreground">{item.speaker} · {item.duration}</div>
              </div>
            </div>
          ))}
        </SectionCard>
      )}

      {tab === 'discussion' && (
        <SectionCard title="Pre-Webinar Discussion" icon={<MessageSquare className="h-3 w-3 text-muted-foreground" />}>
          {[
            { user: 'Maya C.', msg: 'Super excited for this one! Will there be a recording available?', time: '2h ago', likes: 8 },
            { user: 'James R.', msg: 'Can we get a deep dive on cost optimization specifically for fine-tuning workloads?', time: '5h ago', likes: 15 },
          ].map((c, i) => (
            <div key={i} className="py-3 border-b border-border/30 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-medium">{c.user}</span>
                <span className="text-[8px] text-muted-foreground">{c.time}</span>
              </div>
              <p className="text-[10px] text-muted-foreground">{c.msg}</p>
              <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5 mt-1"><Star className="h-2.5 w-2.5" /> {c.likes}</Button>
            </div>
          ))}
          <input placeholder="Ask a question..." className="w-full h-8 rounded-lg border bg-background px-3 text-[10px] mt-2" />
        </SectionCard>
      )}

      {tab === 'checkout' && (
        <SectionCard title="Registration">
          <div className="max-w-md mx-auto py-4 space-y-4">
            <div className="text-center">
              <div className="text-2xl font-bold">Free</div>
              <p className="text-[10px] text-muted-foreground mt-1">No payment required</p>
            </div>
            <div className="p-3 rounded-xl bg-muted/30 space-y-2 text-[10px]">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-accent" /> Live access to webinar</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-accent" /> Q&A participation</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-accent" /> Recording access for 30 days</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-accent" /> Downloadable resources</div>
            </div>
            <Button className="w-full h-10 text-sm">Register Now</Button>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
