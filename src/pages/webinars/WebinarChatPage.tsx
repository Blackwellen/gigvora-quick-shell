import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MessageSquare, Hand, BarChart3, ThumbsUp, Send, Pin, Star, Flag } from 'lucide-react';

const CHAT = [
  { author: 'Sarah C.', initials: 'SC', msg: 'This is incredibly useful for our team!', time: '2m ago', likes: 5 },
  { author: 'Marcus J.', initials: 'MJ', msg: 'Can you share the architecture diagram?', time: '1m ago', likes: 3 },
  { author: 'Priya P.', initials: 'PP', msg: 'Best webinar I have attended this year', time: '30s ago', likes: 8 },
  { author: 'Tom W.', initials: 'TW', msg: 'How does this compare to the previous approach?', time: '15s ago', likes: 1 },
];

const QUESTIONS = [
  { author: 'Emma D.', initials: 'ED', question: "What's the recommended team size for adopting this pattern?", votes: 24, answered: false },
  { author: 'Ryan M.', initials: 'RM', question: 'Does this work with React Native as well?', votes: 18, answered: true, answer: 'Yes, the core principles apply with minor adjustments.' },
  { author: 'Olivia C.', initials: 'OC', question: 'Can you share performance benchmarks?', votes: 15, answered: false },
];

const POLLS = [
  { question: 'Which state management do you use?', options: [{ label: 'Zustand', votes: 45, pct: 38 }, { label: 'Redux', votes: 32, pct: 27 }, { label: 'Jotai', votes: 25, pct: 21 }, { label: 'Other', votes: 16, pct: 14 }], totalVotes: 118, active: true },
  { question: 'How large is your React codebase?', options: [{ label: '< 10K LOC', votes: 20, pct: 25 }, { label: '10K–50K', votes: 35, pct: 44 }, { label: '50K–200K', votes: 18, pct: 22 }, { label: '200K+', votes: 7, pct: 9 }], totalVotes: 80, active: false },
];

export default function WebinarChatPage() {
  const [tab, setTab] = useState('chat');

  const topStrip = (
    <>
      <MessageSquare className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Webinar Interaction Panel</span>
      <div className="flex-1" />
      <Badge className="bg-destructive/10 text-destructive text-[9px] border-0 rounded-lg gap-1 animate-pulse"><div className="h-1.5 w-1.5 rounded-full bg-destructive" />LIVE</Badge>
      <Badge variant="outline" className="text-[9px] rounded-lg">187 viewers</Badge>
    </>
  );

  return (
    <DashboardLayout topStrip={topStrip}>
      <Tabs value={tab} onValueChange={setTab} className="mb-3">
        <TabsList className="h-8 rounded-xl">
          <TabsTrigger value="chat" className="text-[10px] px-3 rounded-lg gap-1"><MessageSquare className="h-3 w-3" />Chat</TabsTrigger>
          <TabsTrigger value="qa" className="text-[10px] px-3 rounded-lg gap-1"><Hand className="h-3 w-3" />Q&A</TabsTrigger>
          <TabsTrigger value="polls" className="text-[10px] px-3 rounded-lg gap-1"><BarChart3 className="h-3 w-3" />Polls</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'chat' && (
        <SectionCard className="!rounded-2xl">
          <div className="space-y-2.5 mb-3 max-h-96 overflow-y-auto">
            {CHAT.map((m, i) => (
              <div key={i} className="flex gap-2">
                <Avatar className="h-6 w-6 rounded-lg shrink-0"><AvatarFallback className="rounded-lg text-[7px] bg-accent/10 text-accent">{m.initials}</AvatarFallback></Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-1"><span className="text-[9px] font-semibold">{m.author}</span><span className="text-[7px] text-muted-foreground">{m.time}</span></div>
                  <div className="text-[10px] text-muted-foreground">{m.msg}</div>
                </div>
                <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5 shrink-0"><ThumbsUp className="h-2.5 w-2.5" />{m.likes}</Button>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 border-t pt-2">
            <input className="flex-1 h-8 rounded-xl bg-muted/50 border-0 px-3 text-[10px] focus:outline-none focus:ring-1 focus:ring-accent" placeholder="Type a message..." />
            <Button size="sm" className="h-8 w-8 p-0 rounded-xl"><Send className="h-3.5 w-3.5" /></Button>
          </div>
        </SectionCard>
      )}

      {tab === 'qa' && (
        <div className="space-y-2.5">
          <SectionCard className="!rounded-2xl">
            <input className="w-full h-9 rounded-xl border px-3 text-[10px]" placeholder="Ask a question..." />
          </SectionCard>
          {QUESTIONS.map((q, i) => (
            <SectionCard key={i} className="!rounded-2xl">
              <div className="flex gap-2.5">
                <button className="flex flex-col items-center gap-0.5 shrink-0">
                  <Star className="h-3.5 w-3.5 text-accent" />
                  <span className="text-[10px] font-bold">{q.votes}</span>
                </button>
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[9px] font-semibold">{q.author}</span>
                    {q.answered && <Badge className="text-[7px] bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0 rounded-lg">Answered</Badge>}
                  </div>
                  <div className="text-[10px]">{q.question}</div>
                  {q.answered && <div className="text-[9px] text-muted-foreground mt-1.5 p-2 rounded-xl bg-muted/30">{q.answer}</div>}
                </div>
              </div>
            </SectionCard>
          ))}
        </div>
      )}

      {tab === 'polls' && (
        <div className="space-y-3">
          {POLLS.map((poll, pi) => (
            <SectionCard key={pi} className="!rounded-2xl" action={poll.active ? <Badge className="text-[7px] bg-accent/10 text-accent border-0 rounded-lg animate-pulse">Active</Badge> : <Badge variant="outline" className="text-[7px] rounded-lg">Closed</Badge>}>
              <div className="text-[11px] font-bold mb-2.5">{poll.question}</div>
              <div className="space-y-1.5">
                {poll.options.map(opt => (
                  <div key={opt.label}>
                    <div className="flex justify-between text-[9px] mb-0.5"><span>{opt.label}</span><span className="font-semibold">{opt.pct}%</span></div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-accent transition-all" style={{ width: `${opt.pct}%` }} /></div>
                  </div>
                ))}
              </div>
              <div className="text-[8px] text-muted-foreground mt-2">{poll.totalVotes} votes</div>
            </SectionCard>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
