import React, { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Video, Clock, Users, MessageSquare, Bell, Share2 } from 'lucide-react';

export default function WebinarLobbyPage() {
  const [countdown, setCountdown] = useState(3600);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setInterval(() => setCountdown(p => p - 1), 1000);
    return () => clearInterval(t);
  }, [countdown]);

  const hrs = Math.floor(countdown / 3600);
  const mins = Math.floor((countdown % 3600) / 60);
  const secs = countdown % 60;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto text-center py-12">
        <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center text-4xl mx-auto mb-4">🤖</div>
        <h1 className="text-xl font-bold mb-1">Scaling AI Infrastructure</h1>
        <p className="text-sm text-muted-foreground mb-6">Hosted by Dr. Raj Patel</p>

        <div className="text-center mb-8">
          <div className="text-[10px] text-muted-foreground mb-2">Starting in</div>
          <div className="flex items-center justify-center gap-4">
            {[
              { value: hrs, label: 'Hours' },
              { value: mins, label: 'Minutes' },
              { value: secs, label: 'Seconds' },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-4xl font-bold font-mono w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                  {String(value).padStart(2, '0')}
                </div>
                <div className="text-[9px] text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 mb-8">
          <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"><Bell className="h-3 w-3" /> Set Reminder</Button>
          <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
        </div>

        <SectionCard title="Who's Joining" subtitle="340 registered">
          <div className="flex flex-wrap justify-center gap-2">
            {['SK', 'ML', 'AR', 'DC', 'LP', 'JR', 'MC', 'LT'].map(a => (
              <Avatar key={a} className="h-8 w-8"><AvatarFallback className="text-[9px] bg-muted">{a}</AvatarFallback></Avatar>
            ))}
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-[8px] text-muted-foreground">+332</div>
          </div>
        </SectionCard>

        <SectionCard title="Pre-Session Chat" icon={<MessageSquare className="h-3 w-3 text-muted-foreground" />} className="mt-4">
          {[
            { user: 'Maya C.', msg: 'Can\'t wait! Been looking forward to this all week.' },
            { user: 'James R.', msg: 'Any prerequisite reading recommended?' },
          ].map((c, i) => (
            <div key={i} className="text-left py-2 border-b border-border/30 last:border-0">
              <span className="text-[10px] font-medium">{c.user}: </span>
              <span className="text-[10px] text-muted-foreground">{c.msg}</span>
            </div>
          ))}
          <input placeholder="Say something..." className="w-full h-8 rounded-lg border bg-background px-3 text-[10px] mt-2" />
        </SectionCard>
      </div>
    </DashboardLayout>
  );
}
