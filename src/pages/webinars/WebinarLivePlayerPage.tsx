import React, { useState } from 'react';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Video, Play, Pause, Volume2, Maximize, MessageSquare, Hand,
  Users, Clock, Share2, Heart, Star, ThumbsUp, Send, LogOut, Settings,
} from 'lucide-react';

export default function WebinarLivePlayerPage() {
  const [chatTab, setChatTab] = useState<'chat' | 'qa'>('chat');

  return (
    <DashboardLayout
      topStrip={
        <div className="flex items-center gap-3 w-full">
          <Video className="h-4 w-4 text-[hsl(var(--state-live))]" />
          <h1 className="text-sm font-bold">Scaling AI Infrastructure</h1>
          <StatusBadge status="live" />
          <span className="text-[10px] text-muted-foreground"><Users className="h-2.5 w-2.5 inline" /> 312 watching · <Clock className="h-2.5 w-2.5 inline" /> 42 min</span>
          <div className="flex-1" />
          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Share2 className="h-3 w-3" /> Share</Button>
          <Button variant="destructive" size="sm" className="h-7 text-[10px] gap-1"><LogOut className="h-3 w-3" /> Leave</Button>
        </div>
      }
      rightRail={
        <div className="space-y-3">
          <div className="flex items-center gap-1">
            <Button variant={chatTab === 'chat' ? 'default' : 'outline'} size="sm" className="h-6 text-[9px] flex-1" onClick={() => setChatTab('chat')}>Chat</Button>
            <Button variant={chatTab === 'qa' ? 'default' : 'outline'} size="sm" className="h-6 text-[9px] flex-1" onClick={() => setChatTab('qa')}>Q&A</Button>
          </div>
          {chatTab === 'chat' ? (
            <SectionCard title="Live Chat">
              <div className="space-y-2 max-h-[350px] overflow-y-auto">
                {[
                  { user: 'Maya C.', msg: 'This is incredibly insightful!', time: '2m' },
                  { user: 'James R.', msg: 'Can you share the GPU cost benchmark data?', time: '5m' },
                  { user: 'Lisa P.', msg: '🔥🔥🔥', time: '6m' },
                  { user: 'David C.', msg: 'We use a similar architecture at our company', time: '8m' },
                  { user: 'Sara K.', msg: 'Question: how do you handle model versioning?', time: '10m' },
                ].map((c, i) => (
                  <div key={i} className="text-[9px]">
                    <span className="font-medium">{c.user}</span>
                    <span className="text-muted-foreground ml-1">{c.time}</span>
                    <p className="text-muted-foreground">{c.msg}</p>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border/30 flex gap-1">
                <input placeholder="Type a message..." className="flex-1 h-7 rounded-md border bg-background px-2 text-[10px]" />
                <Button size="sm" className="h-7 w-7 p-0"><Send className="h-3 w-3" /></Button>
              </div>
            </SectionCard>
          ) : (
            <SectionCard title="Q&A">
              <div className="space-y-3 max-h-[350px] overflow-y-auto">
                {[
                  { user: 'James R.', q: 'How do you handle model versioning in production?', votes: 12, answered: false },
                  { user: 'Sara K.', q: 'What\'s your recommended GPU-to-model ratio for inference?', votes: 8, answered: true },
                  { user: 'Leo T.', q: 'Any thoughts on serverless GPU providers vs dedicated fleets?', votes: 15, answered: false },
                ].map((qa, i) => (
                  <div key={i} className="p-2 rounded-lg bg-muted/30">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-medium">{qa.user}</span>
                      {qa.answered && <Badge className="text-[7px] h-3.5 bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] border-0">Answered</Badge>}
                    </div>
                    <p className="text-[9px] text-muted-foreground">{qa.q}</p>
                    <Button variant="ghost" size="sm" className="h-5 text-[8px] gap-0.5 mt-1"><ThumbsUp className="h-2.5 w-2.5" /> {qa.votes}</Button>
                  </div>
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-border/30">
                <input placeholder="Ask a question..." className="w-full h-7 rounded-md border bg-background px-2 text-[10px]" />
              </div>
            </SectionCard>
          )}

          <SectionCard title="Attendees" subtitle="312 watching">
            <div className="flex flex-wrap gap-1">
              {['MC', 'JR', 'LP', 'DC', 'SK', 'LT', 'AP'].map(a => (
                <Avatar key={a} className="h-6 w-6"><AvatarFallback className="text-[7px] bg-muted">{a}</AvatarFallback></Avatar>
              ))}
              <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[7px] text-muted-foreground">+305</div>
            </div>
          </SectionCard>
        </div>
      }
      rightRailWidth="w-60"
    >
      {/* Video Player */}
      <div className="aspect-video rounded-2xl bg-[hsl(var(--card))] border overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/60 flex items-center justify-center">
          <div className="text-center">
            <div className="flex items-center gap-3 mb-4">
              <Avatar className="h-12 w-12 border-2 border-white/20"><AvatarFallback className="text-sm bg-accent text-accent-foreground">RP</AvatarFallback></Avatar>
              <div className="text-left text-white">
                <div className="text-sm font-semibold">Dr. Raj Patel</div>
                <div className="text-[10px] opacity-80">Presenting: GPU Fleet Management at Scale</div>
              </div>
            </div>
            <p className="text-[10px] text-white/60">[Live video stream area]</p>
          </div>
        </div>
        {/* Controls overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white"><Pause className="h-4 w-4" /></Button>
          <div className="flex-1 h-1 bg-white/20 rounded-full"><div className="h-full w-[65%] bg-accent rounded-full" /></div>
          <span className="text-[9px] text-white/60">42:15 / 1:30:00</span>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white"><Volume2 className="h-4 w-4" /></Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-white"><Maximize className="h-4 w-4" /></Button>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-center gap-3 mt-4 p-3 rounded-xl bg-muted/30 border">
        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"><Hand className="h-3 w-3" /> Raise Hand</Button>
        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"><Heart className="h-3 w-3" /> React</Button>
        <Button variant="outline" size="sm" className="h-8 text-[10px] gap-1"><Star className="h-3 w-3" /> Rate</Button>
        <Badge variant="outline" className="text-[9px] h-6 px-2"><Users className="h-3 w-3 mr-1" /> 312</Badge>
      </div>
    </DashboardLayout>
  );
}
