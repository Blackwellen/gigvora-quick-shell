import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Video, Plus, Settings, BarChart3, DollarSign, Users, TrendingUp,
  Calendar, Eye, Clock, Edit, Upload, Heart, Ticket,
} from 'lucide-react';

const MY_WEBINARS = [
  { title: 'Scaling AI Infrastructure', date: 'Apr 22, 2026', status: 'upcoming', registered: 340, revenue: '$0' },
  { title: 'ML Model Optimization', date: 'Mar 15, 2026', status: 'completed', registered: 280, revenue: '$2,100', views: '1.2K' },
];

export default function WebinarHostStudioPage() {
  const [tab, setTab] = useState('overview');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Video className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Host Studio</h1>
          <KPICard label="Total Webinars" value="8" />
          <KPICard label="Total Attendees" value="2.4K" />
          <KPICard label="Revenue (MTD)" value="$3,200" change="+22%" trend="up" />
          <KPICard label="Avg. Rating" value="4.7" />
        </div>
      }
    >
      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-[10px] px-3">Overview</TabsTrigger>
          <TabsTrigger value="create" className="text-[10px] px-3">Create Webinar</TabsTrigger>
          <TabsTrigger value="analytics" className="text-[10px] px-3">Analytics</TabsTrigger>
          <TabsTrigger value="monetization" className="text-[10px] px-3">Monetization</TabsTrigger>
          <TabsTrigger value="library" className="text-[10px] px-3">Library</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'overview' && (
        <div className="space-y-4">
          <SectionCard title="My Webinars" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> New Webinar</Button>}>
            {MY_WEBINARS.map((w, i) => (
              <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
                <Video className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold">{w.title}</div>
                  <div className="flex items-center gap-3 text-[9px] text-muted-foreground mt-0.5">
                    <span><Calendar className="h-2.5 w-2.5 inline" /> {w.date}</span>
                    <span><Users className="h-2.5 w-2.5 inline" /> {w.registered}</span>
                    {w.views && <span><Eye className="h-2.5 w-2.5 inline" /> {w.views} replay views</span>}
                  </div>
                </div>
                <Badge variant={w.status === 'upcoming' ? 'secondary' : 'outline'} className="text-[8px] h-4 capitalize">{w.status}</Badge>
                <Button variant="outline" size="sm" className="h-6 text-[9px]"><Edit className="h-2.5 w-2.5" /></Button>
              </div>
            ))}
          </SectionCard>
        </div>
      )}

      {tab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <SectionCard title="Webinar Details">
              <div className="space-y-3">
                <div><label className="text-[10px] font-medium block mb-1">Title</label><Input placeholder="Webinar title..." className="h-9 text-sm" /></div>
                <div><label className="text-[10px] font-medium block mb-1">Description</label><Textarea placeholder="Describe your webinar..." className="min-h-[100px] text-sm" /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-medium block mb-1">Date</label><Input type="date" className="h-9 text-sm" /></div>
                  <div><label className="text-[10px] font-medium block mb-1">Time</label><Input type="time" className="h-9 text-sm" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="text-[10px] font-medium block mb-1">Duration</label><Input placeholder="90 min" className="h-9 text-sm" /></div>
                  <div><label className="text-[10px] font-medium block mb-1">Max Attendees</label><Input placeholder="500" className="h-9 text-sm" /></div>
                </div>
              </div>
            </SectionCard>
          </div>
          <div className="space-y-4">
            <SectionCard title="Pricing">
              <div className="space-y-2">
                {['Free', '$19', '$29', '$49', 'Custom'].map(p => (
                  <label key={p} className="flex items-center gap-2 text-[10px] cursor-pointer p-1.5 rounded-lg hover:bg-accent/5">
                    <input type="radio" name="price" className="accent-accent" defaultChecked={p === 'Free'} /><span>{p}</span>
                  </label>
                ))}
              </div>
            </SectionCard>
            <SectionCard title="Settings" icon={<Settings className="h-3 w-3 text-muted-foreground" />}>
              <div className="space-y-2 text-[10px]">
                <label className="flex items-center justify-between cursor-pointer"><span>Enable Q&A</span><input type="checkbox" defaultChecked className="accent-accent" /></label>
                <label className="flex items-center justify-between cursor-pointer"><span>Enable chat</span><input type="checkbox" defaultChecked className="accent-accent" /></label>
                <label className="flex items-center justify-between cursor-pointer"><span>Record session</span><input type="checkbox" defaultChecked className="accent-accent" /></label>
                <label className="flex items-center justify-between cursor-pointer"><span>Accept donations</span><input type="checkbox" className="accent-accent" /></label>
              </div>
            </SectionCard>
            <Button className="w-full h-9 text-[10px]">Create Webinar</Button>
          </div>
        </div>
      )}

      {tab === 'analytics' && (
        <div className="grid grid-cols-2 gap-4">
          <SectionCard title="Attendance"><div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Attendance by webinar]</div></SectionCard>
          <SectionCard title="Revenue"><div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Revenue over time]</div></SectionCard>
          <SectionCard title="Engagement"><div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Avg watch time / drop-off]</div></SectionCard>
          <SectionCard title="Ratings"><div className="h-40 bg-muted/30 rounded-lg flex items-center justify-center text-[10px] text-muted-foreground">[Chart: Rating distribution]</div></SectionCard>
        </div>
      )}

      {tab === 'monetization' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <SectionCard title="Ticket Sales"><div className="text-center py-3"><div className="text-2xl font-bold">$2,100</div><div className="text-[9px] text-muted-foreground">This month</div></div></SectionCard>
            <SectionCard title="Donations"><div className="text-center py-3"><div className="text-2xl font-bold">$480</div><div className="text-[9px] text-muted-foreground">32 donors</div></div></SectionCard>
            <SectionCard title="Replay Sales"><div className="text-center py-3"><div className="text-2xl font-bold">$620</div><div className="text-[9px] text-muted-foreground">44 purchases</div></div></SectionCard>
          </div>
        </div>
      )}

      {tab === 'library' && (
        <SectionCard title="Replay Library" subtitle="Manage your recorded webinars">
          {[
            { title: 'ML Model Optimization', date: 'Mar 15, 2026', views: '1.2K', duration: '1:25:00' },
            { title: 'Data Pipeline Architecture', date: 'Feb 20, 2026', views: '890', duration: '1:10:00' },
            { title: 'Intro to Vector Databases', date: 'Jan 30, 2026', views: '2.1K', duration: '55:00' },
          ].map((r, i) => (
            <div key={i} className="flex items-center gap-3 py-3 border-b border-border/30 last:border-0">
              <Video className="h-4 w-4 text-muted-foreground shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium">{r.title}</div>
                <div className="text-[9px] text-muted-foreground">{r.date} · {r.duration} · <Eye className="h-2.5 w-2.5 inline" /> {r.views}</div>
              </div>
              <Button variant="outline" size="sm" className="h-6 text-[9px]">Manage</Button>
            </div>
          ))}
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
