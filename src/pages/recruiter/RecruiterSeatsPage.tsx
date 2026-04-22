import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Users, UserPlus, UserMinus, Shield, CreditCard, Clock,
  BarChart3, Mail, Settings, Crown,
} from 'lucide-react';

interface Seat {
  id: string; name: string; initials: string; email: string;
  role: 'admin' | 'recruiter' | 'coordinator';
  status: 'active' | 'invited' | 'suspended';
  searches: number; maxSearches: number; inmails: number; maxInmails: number;
  lastActive: string;
}

const SEATS: Seat[] = [
  { id: 'S1', name: 'You', initials: 'YO', email: 'you@company.com', role: 'admin', status: 'active', searches: 245, maxSearches: 500, inmails: 38, maxInmails: 100, lastActive: 'Now' },
  { id: 'S2', name: 'Lisa Park', initials: 'LP', email: 'lisa@company.com', role: 'recruiter', status: 'active', searches: 189, maxSearches: 500, inmails: 52, maxInmails: 100, lastActive: '2h ago' },
  { id: 'S3', name: 'Tom Wright', initials: 'TW', email: 'tom@company.com', role: 'recruiter', status: 'active', searches: 312, maxSearches: 500, inmails: 67, maxInmails: 100, lastActive: '1d ago' },
  { id: 'S4', name: 'Maria Santos', initials: 'MS', email: 'maria@company.com', role: 'coordinator', status: 'invited', searches: 0, maxSearches: 200, inmails: 0, maxInmails: 50, lastActive: 'Pending' },
];

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-[hsl(var(--gigvora-purple)/0.1)] text-[hsl(var(--gigvora-purple))]',
  recruiter: 'bg-accent/10 text-accent',
  coordinator: 'bg-muted text-muted-foreground',
};
const STATUS_COLORS: Record<string, string> = {
  active: 'bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))]',
  invited: 'bg-[hsl(var(--state-caution)/0.1)] text-[hsl(var(--state-caution))]',
  suspended: 'bg-destructive/10 text-destructive',
};

const RecruiterSeatsPage: React.FC = () => {
  const totalSeats = 5;
  const usedSeats = SEATS.length;

  const topStrip = (
    <>
      <Users className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Recruiter Pro — Seat Management</span>
      <div className="flex-1" />
      <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><CreditCard className="h-3 w-3" />Upgrade Plan</Button>
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><UserPlus className="h-3 w-3" />Invite Member</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Plan" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Plan</span><Badge className="bg-accent/10 text-accent text-[7px] border-0 rounded-lg">Pro Team</Badge></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Seats</span><span className="font-semibold">{usedSeats}/{totalSeats}</span></div>
          <Progress value={(usedSeats / totalSeats) * 100} className="h-1.5 rounded-full" />
          <div className="flex justify-between"><span className="text-muted-foreground">Renewal</span><span className="font-semibold">Jul 1, 2026</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Cost</span><span className="font-semibold">$149/seat/mo</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Roles" className="!rounded-2xl">
        <div className="text-[9px] text-muted-foreground space-y-1 leading-relaxed">
          <p><Crown className="h-2.5 w-2.5 inline mr-0.5" />Admin: Full access + seat mgmt</p>
          <p><Users className="h-2.5 w-2.5 inline mr-0.5" />Recruiter: Search + outreach</p>
          <p><Mail className="h-2.5 w-2.5 inline mr-0.5" />Coordinator: Scheduling only</p>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Active Seats" value={String(SEATS.filter(s => s.status === 'active').length)} change={`of ${totalSeats}`} className="!rounded-2xl" />
        <KPICard label="Searches Used" value={SEATS.reduce((s, t) => s + t.searches, 0).toLocaleString()} change="This month" className="!rounded-2xl" />
        <KPICard label="InMails Used" value={String(SEATS.reduce((s, t) => s + t.inmails, 0))} change="This month" className="!rounded-2xl" />
        <KPICard label="Monthly Cost" value={`$${usedSeats * 149}`} change={`${usedSeats} seats`} className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {SEATS.map(seat => (
          <div key={seat.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10 rounded-2xl"><AvatarFallback className="rounded-2xl text-[10px] font-bold bg-accent/10 text-accent">{seat.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold">{seat.name}</span>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', ROLE_COLORS[seat.role])}>{seat.role}</Badge>
                  <Badge className={cn('text-[7px] border-0 capitalize rounded-lg', STATUS_COLORS[seat.status])}>{seat.status}</Badge>
                </div>
                <div className="text-[9px] text-muted-foreground mt-0.5">{seat.email}</div>
              </div>
              <div className="flex items-center gap-4 text-[9px]">
                <div className="text-center">
                  <div className="font-semibold">{seat.searches}/{seat.maxSearches}</div>
                  <div className="text-[8px] text-muted-foreground">searches</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{seat.inmails}/{seat.maxInmails}</div>
                  <div className="text-[8px] text-muted-foreground">inmails</div>
                </div>
                <div className="text-center">
                  <span className="text-[8px] text-muted-foreground flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{seat.lastActive}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg"><Settings className="h-3 w-3" /></Button>
                {seat.name !== 'You' && <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded-lg text-destructive"><UserMinus className="h-3 w-3" /></Button>}
              </div>
            </div>

            {seat.status === 'active' && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <div className="flex justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">Searches</span><span>{Math.round((seat.searches / seat.maxSearches) * 100)}%</span></div>
                  <Progress value={(seat.searches / seat.maxSearches) * 100} className="h-1 rounded-full" />
                </div>
                <div>
                  <div className="flex justify-between text-[8px] mb-0.5"><span className="text-muted-foreground">InMails</span><span>{Math.round((seat.inmails / seat.maxInmails) * 100)}%</span></div>
                  <Progress value={(seat.inmails / seat.maxInmails) * 100} className="h-1 rounded-full" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default RecruiterSeatsPage;
