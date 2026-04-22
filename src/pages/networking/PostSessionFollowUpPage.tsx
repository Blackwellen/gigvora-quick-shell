import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Zap, UserPlus, MessageSquare, Star, Clock, MapPin,
  Briefcase, ThumbsUp, Eye, Send, Users,
} from 'lucide-react';

interface MatchResult {
  id: string; name: string; initials: string; headline: string;
  location: string; matchScore: number; sharedInterests: string[];
  sessionName: string; sessionDate: string;
  connected: boolean; messaged: boolean; followedUp: boolean;
}

const MATCHES: MatchResult[] = [
  { id: 'M1', name: 'Sarah Chen', initials: 'SC', headline: 'Staff Engineer at Stripe', location: 'San Francisco, CA', matchScore: 94, sharedInterests: ['Platform Engineering', 'Distributed Systems', 'TypeScript'], sessionName: 'Tech Leaders Speed Round', sessionDate: 'Today', connected: false, messaged: false, followedUp: false },
  { id: 'M2', name: 'Marcus Johnson', initials: 'MJ', headline: 'Product Design Lead', location: 'New York, NY', matchScore: 87, sharedInterests: ['Design Systems', 'User Research'], sessionName: 'Tech Leaders Speed Round', sessionDate: 'Today', connected: true, messaged: false, followedUp: false },
  { id: 'M3', name: 'Priya Patel', initials: 'PP', headline: 'AI/ML Researcher', location: 'London, UK', matchScore: 81, sharedInterests: ['Machine Learning', 'Data Infrastructure'], sessionName: 'AI & Data Meetup', sessionDate: 'Yesterday', connected: true, messaged: true, followedUp: false },
  { id: 'M4', name: 'James Kim', initials: 'JK', headline: 'VP Sales at NovaTech', location: 'Austin, TX', matchScore: 72, sharedInterests: ['Enterprise Sales', 'Go-To-Market'], sessionName: 'AI & Data Meetup', sessionDate: 'Yesterday', connected: true, messaged: true, followedUp: true },
];

const PostSessionFollowUpPage: React.FC = () => {
  const topStrip = (
    <>
      <Zap className="h-4 w-4 text-muted-foreground" />
      <span className="text-xs font-semibold">Post-Session Follow-Up & Matching</span>
      <div className="flex-1" />
      <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1"><Send className="h-3 w-3" />Bulk Follow-Up</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Follow-Up Progress" className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Connected</span><span className="font-semibold">{MATCHES.filter(m => m.connected).length}/{MATCHES.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Messaged</span><span className="font-semibold">{MATCHES.filter(m => m.messaged).length}/{MATCHES.length}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Followed Up</span><span className="font-semibold">{MATCHES.filter(m => m.followedUp).length}/{MATCHES.length}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Tips" className="!rounded-2xl">
        <div className="text-[9px] text-muted-foreground space-y-1 leading-relaxed">
          <p>• Follow up within 24h for 3x connection rate</p>
          <p>• Reference shared interests in your message</p>
          <p>• High match scores indicate strong compatibility</p>
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-48">
      <KPIBand className="mb-3">
        <KPICard label="Matches" value={String(MATCHES.length)} change="From recent sessions" className="!rounded-2xl" />
        <KPICard label="Avg Score" value={`${Math.round(MATCHES.reduce((s, m) => s + m.matchScore, 0) / MATCHES.length)}%`} change="Match quality" className="!rounded-2xl" />
        <KPICard label="Pending" value={String(MATCHES.filter(m => !m.followedUp).length)} change="Need follow-up" className="!rounded-2xl" />
        <KPICard label="Completed" value={String(MATCHES.filter(m => m.followedUp).length)} change="Fully engaged" className="!rounded-2xl" />
      </KPIBand>

      <div className="space-y-2.5">
        {MATCHES.map(match => (
          <div key={match.id} className={cn('rounded-2xl border bg-card p-4 hover:shadow-sm transition-all', !match.followedUp && 'border-l-2 border-l-accent')}>
            <div className="flex items-center gap-3 mb-2.5">
              <Avatar className="h-10 w-10 rounded-2xl"><AvatarFallback className="rounded-2xl text-[10px] font-bold bg-accent/10 text-accent">{match.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[12px] font-bold">{match.name}</span>
                  <Badge className="bg-accent/10 text-accent text-[7px] border-0 rounded-lg gap-0.5"><Star className="h-2 w-2" />{match.matchScore}% match</Badge>
                  {match.followedUp && <Badge className="bg-[hsl(var(--state-healthy)/0.1)] text-[hsl(var(--state-healthy))] text-[7px] border-0 rounded-lg"><ThumbsUp className="h-2 w-2 mr-0.5" />Done</Badge>}
                </div>
                <div className="text-[9px] text-muted-foreground">{match.headline}</div>
                <div className="text-[8px] text-muted-foreground mt-0.5 flex items-center gap-2">
                  <span className="flex items-center gap-0.5"><MapPin className="h-2.5 w-2.5" />{match.location}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Briefcase className="h-2.5 w-2.5" />{match.sessionName}</span>
                  <span>·</span>
                  <span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />{match.sessionDate}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 mb-3 flex-wrap">
              {match.sharedInterests.map(i => <Badge key={i} variant="outline" className="text-[7px] h-4 rounded-lg">{i}</Badge>)}
            </div>

            <div className="flex items-center gap-3 text-[8px] mb-3">
              <span className={cn('flex items-center gap-0.5', match.connected ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}><Users className="h-2.5 w-2.5" />{match.connected ? 'Connected' : 'Not connected'}</span>
              <span className={cn('flex items-center gap-0.5', match.messaged ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}><MessageSquare className="h-2.5 w-2.5" />{match.messaged ? 'Messaged' : 'Not messaged'}</span>
              <span className={cn('flex items-center gap-0.5', match.followedUp ? 'text-[hsl(var(--state-healthy))]' : 'text-muted-foreground')}><ThumbsUp className="h-2.5 w-2.5" />{match.followedUp ? 'Followed up' : 'Pending'}</span>
            </div>

            <div className="flex items-center gap-1.5">
              {!match.connected && <Button size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><UserPlus className="h-3 w-3" />Connect</Button>}
              {!match.messaged && <Button variant={match.connected ? 'default' : 'outline'} size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><MessageSquare className="h-3 w-3" />Message</Button>}
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-xl gap-1 flex-1"><Eye className="h-3 w-3" />Profile</Button>
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
};

export default PostSessionFollowUpPage;
