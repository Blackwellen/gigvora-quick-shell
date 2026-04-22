import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Award, Shield, CheckCircle, Clock, Lock, Share2, Download } from 'lucide-react';

const BADGES = [
  { name: 'Web Builder', desc: 'Completed portfolio website project', status: 'earned' as const, date: 'Apr 2, 2026', category: 'Technical' },
  { name: 'Career Ready', desc: 'Completed professional skills path', status: 'earned' as const, date: 'Mar 28, 2026', category: 'Professional' },
  { name: 'Market Analyst', desc: 'Completed market research project', status: 'earned' as const, date: 'Mar 15, 2026', category: 'Business' },
  { name: 'Frontend Ready', desc: 'Completed frontend development path', status: 'in-progress' as const, date: '', category: 'Technical' },
  { name: 'Data Explorer', desc: 'Completed data dashboard project', status: 'locked' as const, date: '', category: 'Technical' },
  { name: 'Mentor Endorsed', desc: 'Received 3 mentor endorsements', status: 'locked' as const, date: '', category: 'Professional' },
];

export default function BadgesVerificationPage() {
  return (
    <DashboardLayout topStrip={<><Award className="h-4 w-4 text-accent" /><span className="text-xs font-semibold">Badges & Verification</span><div className="flex-1" /><Badge variant="outline" className="text-[9px] rounded-lg"><Shield className="h-2.5 w-2.5 mr-0.5" />Blockchain Verified</Badge></>}>
      <KPIBand className="mb-3">
        <KPICard label="Badges Earned" value={String(BADGES.filter(b => b.status === 'earned').length)} className="!rounded-2xl" />
        <KPICard label="In Progress" value={String(BADGES.filter(b => b.status === 'in-progress').length)} className="!rounded-2xl" />
        <KPICard label="Available" value={String(BADGES.length)} className="!rounded-2xl" />
        <KPICard label="Verification Level" value="Silver" className="!rounded-2xl" />
      </KPIBand>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {BADGES.map((b, i) => (
          <div key={i} className={cn('rounded-2xl border p-4 transition-all', b.status === 'earned' ? 'bg-card hover:shadow-md' : b.status === 'in-progress' ? 'bg-card/50' : 'bg-muted/20 opacity-60')}>
            <div className="flex items-center justify-between mb-2">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center', b.status === 'earned' ? 'bg-accent/10' : 'bg-muted/50')}>
                {b.status === 'earned' && <Award className="h-5 w-5 text-accent" />}
                {b.status === 'in-progress' && <Clock className="h-5 w-5 text-[hsl(var(--gigvora-amber))]" />}
                {b.status === 'locked' && <Lock className="h-5 w-5 text-muted-foreground/40" />}
              </div>
              {b.status === 'earned' && <CheckCircle className="h-4 w-4 text-[hsl(var(--state-healthy))]" />}
            </div>
            <div className="text-[11px] font-bold mb-0.5">{b.name}</div>
            <div className="text-[8px] text-muted-foreground mb-1.5">{b.desc}</div>
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[7px] rounded-md">{b.category}</Badge>
              {b.date && <span className="text-[7px] text-muted-foreground">{b.date}</span>}
            </div>
            {b.status === 'earned' && (
              <div className="flex gap-1 mt-2">
                <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 px-1"><Share2 className="h-2.5 w-2.5" />Share</Button>
                <Button variant="ghost" size="sm" className="h-5 text-[7px] gap-0.5 px-1"><Download className="h-2.5 w-2.5" />Certificate</Button>
              </div>
            )}
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
