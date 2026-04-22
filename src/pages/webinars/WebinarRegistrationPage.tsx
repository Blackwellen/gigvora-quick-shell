import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Ticket, User, Mail, Building2, ArrowRight, CheckCircle, Calendar, Clock } from 'lucide-react';

export default function WebinarRegistrationPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const topStrip = (
    <>
      <Ticket className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Webinar Registration</span>
      <div className="flex-1" />
      <div className="flex items-center gap-1">
        {[1, 2, 3].map(s => (
          <div key={s} className={cn('flex items-center gap-1', s > 1 && 'ml-1')}>
            {s > 1 && <div className="w-6 h-px bg-muted-foreground/30" />}
            <div className={cn('h-6 w-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-colors', step >= s ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground')}>{s}</div>
          </div>
        ))}
      </div>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Webinar" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="font-semibold text-[10px]">Scaling React at Enterprise</div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-semibold">May 20, 2026</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Time</span><span className="font-semibold">2:00 PM EST</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Duration</span><span className="font-semibold">90 min</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Spots Left</span><span className="font-semibold text-[hsl(var(--state-caution))]">45/500</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Includes" className="!rounded-2xl">
        <div className="text-[9px] text-muted-foreground space-y-1 leading-relaxed">
          <p>✓ Live presentation + Q&A</p>
          <p>✓ Downloadable slides</p>
          <p>✓ 30-day replay access</p>
          <p>✓ Certificate of attendance</p>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      {step === 1 && (
        <SectionCard title="Your Information" icon={<User className="h-3.5 w-3.5 text-muted-foreground" />} className="!rounded-2xl">
          <div className="space-y-3">
            {[{ label: 'Full Name', value: 'John Doe', icon: User }, { label: 'Email', value: 'john@company.com', icon: Mail }, { label: 'Company', value: 'Acme Corp', icon: Building2 }].map(f => (
              <div key={f.label} className="rounded-xl bg-muted/30 p-3 flex items-center gap-2.5">
                <f.icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <div className="flex-1"><div className="text-[8px] text-muted-foreground">{f.label}</div><div className="text-[11px] font-semibold">{f.value}</div></div>
              </div>
            ))}
            <Button onClick={() => setStep(2)} className="w-full h-8 text-[10px] rounded-xl gap-1">Continue <ArrowRight className="h-3 w-3" /></Button>
          </div>
        </SectionCard>
      )}

      {step === 2 && (
        <SectionCard title="Session Preferences" className="!rounded-2xl">
          <div className="space-y-2.5">
            {["Beginner - I'm new to this topic", "Intermediate - I have some experience", "Advanced - I want deep technical content"].map((opt, i) => (
              <button key={opt} className={cn('w-full rounded-2xl border p-3 text-left text-[10px] transition-all hover:shadow-sm', i === 1 ? 'border-accent bg-accent/5' : '')}>{opt}</button>
            ))}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-8 text-[10px] rounded-xl">Back</Button>
              <Button onClick={() => setStep(3)} className="flex-1 h-8 text-[10px] rounded-xl gap-1">Register <ArrowRight className="h-3 w-3" /></Button>
            </div>
          </div>
        </SectionCard>
      )}

      {step === 3 && (
        <SectionCard title="Registered!" icon={<CheckCircle className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />} className="!rounded-2xl">
          <div className="text-center py-6">
            <div className="h-14 w-14 rounded-2xl bg-[hsl(var(--state-healthy)/0.1)] flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="h-7 w-7 text-[hsl(var(--state-healthy))]" />
            </div>
            <div className="text-[14px] font-bold mb-1">You're Registered!</div>
            <div className="text-[10px] text-muted-foreground mb-4">Scaling React at Enterprise · May 20, 2026</div>
            <div className="flex flex-wrap gap-2 justify-center">
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Calendar className="h-3 w-3" />Add to Calendar</Button>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Mail className="h-3 w-3" />Email Confirmation</Button>
            </div>
          </div>
        </SectionCard>
      )}
    </DashboardLayout>
  );
}
