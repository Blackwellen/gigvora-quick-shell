import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { SectionBackNav } from '@/components/shell/SectionBackNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Heart, DollarSign, Users, Clock, ChevronRight, TrendingUp,
  ArrowUpRight, Gift, Star, Target,
} from 'lucide-react';

const DONATIONS = [
  { id: 'd1', from: 'Sarah Chen', amount: '$25', message: 'Great podcast episode!', date: '2h ago', type: 'podcast' },
  { id: 'd2', from: 'Mike Johnson', amount: '$50', message: 'Love your content, keep it up!', date: '1d ago', type: 'content' },
  { id: 'd3', from: 'Anonymous', amount: '$10', message: '', date: '2d ago', type: 'webinar' },
  { id: 'd4', from: 'Lisa Wang', amount: '$100', message: 'Your webinar was incredibly helpful', date: '3d ago', type: 'webinar' },
  { id: 'd5', from: 'Dev Community', amount: '$75', message: 'Supporting great educators', date: '5d ago', type: 'content' },
  { id: 'd6', from: 'James Rivera', amount: '$15', message: '', date: '1w ago', type: 'podcast' },
];

export default function DonationsPage() {
  const [tab, setTab] = useState('received');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Heart className="h-4 w-4 text-accent" />
          <h1 className="text-sm font-bold mr-4">Donations</h1>
          <KPICard label="Total Received" value="$1,245" />
          <KPICard label="This Month" value="$275" change="+32%" trend="up" />
          <KPICard label="Supporters" value="48" />
          <KPICard label="Given" value="$120" />
        </div>
      }
    >
      <SectionBackNav homeRoute="/dashboard" homeLabel="Dashboard" currentLabel="Donations" icon={<Heart className="h-3 w-3" />} />

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-7">
          <TabsTrigger value="received" className="text-[10px] h-5 px-2">Received</TabsTrigger>
          <TabsTrigger value="given" className="text-[10px] h-5 px-2">Given</TabsTrigger>
          <TabsTrigger value="goals" className="text-[10px] h-5 px-2">Goals</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'received' && (
        <div className="space-y-2">
          {DONATIONS.map(d => (
            <SectionCard key={d.id} className="!rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Gift className="h-4 w-4 text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[11px] font-bold">{d.from}</span>
                    <Badge variant="outline" className="text-[7px] h-3.5 capitalize">{d.type}</Badge>
                  </div>
                  {d.message && <div className="text-[10px] text-muted-foreground italic">"{d.message}"</div>}
                  <div className="text-[9px] text-muted-foreground mt-0.5"><Clock className="h-2.5 w-2.5 inline" /> {d.date}</div>
                </div>
                <span className="text-sm font-bold text-accent">{d.amount}</span>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'goals' && (
        <SectionCard title="Donation Goals" className="!rounded-2xl">
          <div className="space-y-4 py-2">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold">New Microphone Fund</span>
                <span className="text-[10px] text-accent font-semibold">$450 / $500</span>
              </div>
              <Progress value={90} className="h-2" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold">Studio Upgrade</span>
                <span className="text-[10px] text-accent font-semibold">$1,200 / $5,000</span>
              </div>
              <Progress value={24} className="h-2" />
            </div>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
