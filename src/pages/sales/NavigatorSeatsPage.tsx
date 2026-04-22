import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Shield, Users, Plus, Settings, BarChart3, Crown, Clock,
  Search, Mail, Eye, Target, Zap,
} from 'lucide-react';

interface Seat {
  id: string; name: string; avatar: string; email: string; role: 'admin' | 'sales' | 'recruiter';
  searches: number; searchLimit: number; inmails: number; inmailLimit: number;
  profileViews: number; profileViewLimit: number; lastActive: string; status: 'active' | 'inactive';
}

const SEATS: Seat[] = [
  { id: 'S1', name: 'Alex Kim', avatar: 'AK', email: 'alex@company.com', role: 'admin', searches: 234, searchLimit: 500, inmails: 18, inmailLimit: 50, profileViews: 89, profileViewLimit: 200, lastActive: '1h ago', status: 'active' },
  { id: 'S2', name: 'Sarah Park', avatar: 'SP', email: 'sarah@company.com', role: 'sales', searches: 156, searchLimit: 300, inmails: 12, inmailLimit: 30, profileViews: 67, profileViewLimit: 150, lastActive: '3h ago', status: 'active' },
  { id: 'S3', name: 'Mike Rivera', avatar: 'MR', email: 'mike@company.com', role: 'recruiter', searches: 312, searchLimit: 500, inmails: 24, inmailLimit: 50, profileViews: 145, profileViewLimit: 200, lastActive: '30m ago', status: 'active' },
  { id: 'S4', name: 'Lisa Chen', avatar: 'LC', email: 'lisa@company.com', role: 'sales', searches: 45, searchLimit: 300, inmails: 3, inmailLimit: 30, profileViews: 22, profileViewLimit: 150, lastActive: '2d ago', status: 'inactive' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[hsl(var(--gigvora-purple))]/10 text-[hsl(var(--gigvora-purple))]',
  sales: 'bg-accent/10 text-accent',
  recruiter: 'bg-primary/10 text-primary',
};

const NavigatorSeatsPage: React.FC = () => {
  const topStrip = (
    <>
      <Shield className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Navigator — Seat Management</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Plus className="h-3 w-3" />Add Seat</Button>
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Settings</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Plan Details" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><Badge className="bg-accent/10 text-accent text-[7px] border-0">Team Pro</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seats Used</span><span className="font-semibold">{SEATS.length} / 10</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Billing</span><span className="font-semibold">$99/seat/mo</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Renewal</span><span className="font-semibold">May 1, 2026</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Role Distribution" className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          {['admin', 'sales', 'recruiter'].map(role => (
            <div key={role} className="flex items-center gap-2">
              <Badge className={cn('text-[7px] border-0 capitalize w-16', ROLE_COLORS[role])}>{role}</Badge>
              <span className="font-semibold">{SEATS.filter(s => s.role === role).length}</span>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Seats" value={String(SEATS.filter(s => s.status === 'active').length)} change={`of ${SEATS.length}`} className="!rounded-2xl" />
        <KPICard label="Total Searches" value={String(SEATS.reduce((s, seat) => s + seat.searches, 0))} change="This month" className="!rounded-2xl" />
        <KPICard label="Total InMails" value={String(SEATS.reduce((s, seat) => s + seat.inmails, 0))} change="This month" className="!rounded-2xl" />
        <KPICard label="Monthly Cost" value={`$${SEATS.length * 99}`} change={`${SEATS.length} seats`} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {SEATS.map(seat => (
          <div key={seat.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="h-10 w-10"><AvatarFallback className="text-[10px] font-bold">{seat.avatar}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold">{seat.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize', ROLE_COLORS[seat.role])}>{seat.role}</Badge>
                  <div className={cn('h-2 w-2 rounded-full', seat.status === 'active' ? 'bg-[hsl(var(--state-healthy))]' : 'bg-muted-foreground/30')} />
                </div>
                <div className="text-[9px] text-muted-foreground">{seat.email} · Last active {seat.lastActive}</div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Settings className="h-3 w-3" />Manage</Button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { l: 'Searches', used: seat.searches, limit: seat.searchLimit, icon: Search },
                { l: 'InMails', used: seat.inmails, limit: seat.inmailLimit, icon: Mail },
                { l: 'Profile Views', used: seat.profileViews, limit: seat.profileViewLimit, icon: Eye },
              ].map(u => (
                <div key={u.l} className="rounded-xl bg-muted/30 p-2.5">
                  <div className="flex items-center gap-1 text-[9px] mb-1">
                    <u.icon className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">{u.l}</span>
                  </div>
                  <div className="text-[10px] font-bold">{u.used} / {u.limit}</div>
                  <Progress value={(u.used / u.limit) * 100} className="h-1 mt-1" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default NavigatorSeatsPage;
