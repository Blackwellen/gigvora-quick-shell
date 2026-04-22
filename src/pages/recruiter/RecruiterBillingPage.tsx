import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CreditCard, Users, Zap, Plus, Clock, DollarSign, Crown } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const MOCK_SEATS = [
  { name: 'Mike Liu', avatar: 'ML', role: 'Recruiter', status: 'active' as const, usage: 85 },
  { name: 'David Chen', avatar: 'DC', role: 'Sourcer', status: 'active' as const, usage: 62 },
  { name: 'Sarah Kim', avatar: 'SK', role: 'Hiring Manager', status: 'active' as const, usage: 45 },
  { name: 'Lisa Park', avatar: 'LP', role: 'Coordinator', status: 'active' as const, usage: 30 },
  { name: 'Unassigned', avatar: '--', role: 'Recruiter', status: 'available' as const, usage: 0 },
];

export default function RecruiterBillingPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <CreditCard className="h-4 w-4 text-[hsl(var(--gigvora-amber))]" />
          <h1 className="text-sm font-bold mr-4">Billing & Seats</h1>
          <KPICard label="Plan" value="Pro" />
          <KPICard label="Seats Used" value="4/5" />
          <KPICard label="Credits Left" value="340" change="of 500" trend="neutral" />
          <KPICard label="Next Billing" value="Apr 28" />
          <KPICard label="Monthly" value="$499" />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard title="Seat Management" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Add Seat</Button>}>
            <div className="space-y-2">
              {MOCK_SEATS.map(seat => (
                <div key={seat.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/30">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-[10px] bg-muted">{seat.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-medium">{seat.name}</span>
                      <Badge variant={seat.status === 'active' ? 'default' : 'secondary'} className="text-[7px] h-3.5">{seat.status}</Badge>
                    </div>
                    <span className="text-[9px] text-muted-foreground">{seat.role}</span>
                  </div>
                  {seat.status === 'active' && (
                    <div className="w-20">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[8px] text-muted-foreground">Usage</span>
                        <span className="text-[9px] font-medium">{seat.usage}%</span>
                      </div>
                      <Progress value={seat.usage} className="h-1.5" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Credit Usage" className="mt-4">
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-muted-foreground">340 / 500 credits remaining</span>
                <span className="text-[10px] font-medium">68%</span>
              </div>
              <Progress value={68} className="h-2" />
            </div>
            <div className="space-y-1.5">
              {[
                { action: 'Candidate Search', credits: 80 },
                { action: 'InMail Messages', credits: 45 },
                { action: 'Profile Views', credits: 25 },
                { action: 'AI Match Scoring', credits: 10 },
              ].map(item => (
                <div key={item.action} className="flex items-center justify-between py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-[10px]">{item.action}</span>
                  <span className="text-[10px] font-medium">{item.credits} credits</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Current Plan">
            <div className="p-4 rounded-xl bg-[hsl(var(--state-premium)/0.05)] border border-[hsl(var(--state-premium)/0.15)]">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="h-4 w-4 text-[hsl(var(--state-premium))]" />
                <span className="text-sm font-bold">Recruiter Pro</span>
              </div>
              <div className="text-2xl font-bold">$499<span className="text-xs font-normal text-muted-foreground">/mo</span></div>
              <div className="text-[10px] text-muted-foreground mt-1">5 seats · 500 credits/mo · AI matching</div>
              <Button variant="outline" size="sm" className="w-full mt-3 h-8 text-[10px]">Upgrade Plan</Button>
            </div>
          </SectionCard>

          <SectionCard title="Billing History" className="mt-4">
            {[
              { date: 'Mar 28, 2025', amount: '$499.00', status: 'Paid' },
              { date: 'Feb 28, 2025', amount: '$499.00', status: 'Paid' },
              { date: 'Jan 28, 2025', amount: '$399.00', status: 'Paid' },
            ].map((invoice, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
                <div>
                  <div className="text-[10px] font-medium">{invoice.date}</div>
                  <div className="text-[9px] text-muted-foreground">{invoice.status}</div>
                </div>
                <span className="text-[11px] font-semibold">{invoice.amount}</span>
              </div>
            ))}
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
