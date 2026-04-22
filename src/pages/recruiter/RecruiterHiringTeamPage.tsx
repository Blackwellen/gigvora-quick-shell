import React from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard } from '@/components/shell/EnterprisePrimitives';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Mail, Settings, Clock, Briefcase, MessageSquare } from 'lucide-react';

const MOCK_TEAM = [
  { id: '1', name: 'Sarah Kim', avatar: 'SK', role: 'Hiring Manager', jobs: 3, reviews: 12, lastActive: '5 min ago' },
  { id: '2', name: 'Mike Liu', avatar: 'ML', role: 'Recruiter', jobs: 5, reviews: 28, lastActive: '1h ago' },
  { id: '3', name: 'Ana Rodriguez', avatar: 'AR', role: 'Tech Lead (Interviewer)', jobs: 2, reviews: 8, lastActive: '3h ago' },
  { id: '4', name: 'David Chen', avatar: 'DC', role: 'Sourcer', jobs: 4, reviews: 0, lastActive: '30 min ago' },
  { id: '5', name: 'Lisa Park', avatar: 'LP', role: 'HR Coordinator', jobs: 6, reviews: 5, lastActive: '2h ago' },
];

const MOCK_NOTES = [
  { author: 'Sarah Kim', avatar: 'SK', note: 'Ana Torres is a strong fit for the Frontend role. Prioritize her final round this week.', time: '2h ago', job: 'Senior Frontend Engineer' },
  { author: 'Mike Liu', avatar: 'ML', note: 'David Kim declined our initial offer. Need to discuss comp adjustment.', time: '4h ago', job: 'Engineering Manager' },
  { author: 'Ana Rodriguez', avatar: 'AR', note: 'Technical deep-dive with Priya Patel went very well. Scorecard submitted.', time: '6h ago', job: 'ML Engineer' },
];

export default function RecruiterHiringTeamPage() {
  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-4 w-full">
          <Users className="h-4 w-4 text-[hsl(var(--gigvora-purple))]" />
          <h1 className="text-sm font-bold mr-4">Hiring Team</h1>
          <KPICard label="Members" value={String(MOCK_TEAM.length)} />
          <KPICard label="Active Jobs" value="12" />
          <KPICard label="Pending Reviews" value="4" />
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <SectionCard title="Team Members" action={<Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" /> Invite</Button>}>
            <div className="space-y-2">
              {MOCK_TEAM.map(member => (
                <div key={member.id} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:bg-accent/5 transition-all">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-[10px] bg-muted">{member.avatar}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold">{member.name}</span>
                      <Badge variant="outline" className="text-[8px] h-4">{member.role}</Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[9px] text-muted-foreground">
                      <span>{member.jobs} jobs</span>
                      <span>{member.reviews} reviews</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" /> {member.lastActive}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Mail className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0"><Settings className="h-3 w-3" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        <div>
          <SectionCard title="Internal Notes" icon={<MessageSquare className="h-3 w-3 text-muted-foreground" />}>
            <div className="space-y-3">
              {MOCK_NOTES.map((note, i) => (
                <div key={i} className="p-3 rounded-xl bg-muted/30 border border-border/30">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Avatar className="h-5 w-5">
                      <AvatarFallback className="text-[7px] bg-muted">{note.avatar}</AvatarFallback>
                    </Avatar>
                    <span className="text-[10px] font-medium">{note.author}</span>
                    <span className="text-[8px] text-muted-foreground ml-auto">{note.time}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{note.note}</p>
                  <Badge variant="outline" className="text-[7px] h-3.5 mt-1.5">{note.job}</Badge>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </DashboardLayout>
  );
}
