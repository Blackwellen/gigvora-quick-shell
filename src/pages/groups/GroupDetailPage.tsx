import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard } from '@/components/shell/EnterprisePrimitives';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Users, MessageSquare, FileText, Calendar, Bell, Shield,
  Heart, Share2, ArrowRight, Plus, Search, Globe,
  Send, Pin, Image, Link as LinkIcon, Bookmark, Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const GROUP_INFO = {
  name: 'Design Systems Guild',
  description: 'A community for design system practitioners to share patterns, tools, and insights. From token architectures to component governance.',
  members: 1247, posts: 342, created: 'Jan 2025', type: 'Public', category: 'Design & UX',
};

const MEMBERS = [
  { name: 'Sarah Chen', role: 'Admin', initials: 'SC', title: 'Product Lead' },
  { name: 'James Wilson', role: 'Moderator', initials: 'JW', title: 'Design Engineer' },
  { name: 'Priya Sharma', role: 'Member', initials: 'PS', title: 'UX Designer' },
  { name: 'Marcus Johnson', role: 'Member', initials: 'MJ', title: 'Frontend Dev' },
  { name: 'Elena Rodriguez', role: 'Member', initials: 'ER', title: 'Design Lead' },
  { name: 'Alex Kim', role: 'Member', initials: 'AK', title: 'Product Manager' },
];

const FEED_POSTS = [
  { id: 'p1', author: 'Sarah Chen', initials: 'SC', role: 'Admin', content: 'Just published our updated token naming convention. Would love feedback from the group!', likes: 24, comments: 8, time: '2 hours ago', pinned: true, attachments: ['token-guide-v3.pdf'] },
  { id: 'p2', author: 'James Wilson', initials: 'JW', role: 'Moderator', content: 'Interesting talk from Config 2026 about design system adoption metrics. Key insight: teams that measure component coverage ship 40% faster.', likes: 18, comments: 5, time: '5 hours ago', pinned: false },
  { id: 'p3', author: 'Priya Sharma', initials: 'PS', role: 'Member', content: 'Anyone else struggling with dark mode token mapping? Our current approach feels brittle.', likes: 12, comments: 14, time: '1 day ago', pinned: false },
  { id: 'p4', author: 'Marcus Johnson', initials: 'MJ', role: 'Member', content: 'Shipped our component analytics dashboard! Now we can see which components are most/least used across 12 product teams.', likes: 31, comments: 6, time: '2 days ago', pinned: false, attachments: ['dashboard-screenshot.png'] },
];

const RESOURCES = [
  { name: 'Token Naming Convention v3', type: 'PDF', size: '2.4 MB', uploaded: 'Apr 12', by: 'Sarah Chen' },
  { name: 'Component Audit Template', type: 'XLSX', size: '1.1 MB', uploaded: 'Apr 8', by: 'James Wilson' },
  { name: 'Design System ROI Calculator', type: 'GSHEET', size: '—', uploaded: 'Mar 28', by: 'Elena Rodriguez' },
  { name: 'Figma Token Plugin Guide', type: 'DOC', size: '3.5 MB', uploaded: 'Mar 20', by: 'Priya Sharma' },
];

const EVENTS = [
  { title: 'Monthly Design Review', date: 'Apr 22, 4 PM', attendees: 34, type: 'Virtual' },
  { title: 'Token Workshop', date: 'Apr 28, 2 PM', attendees: 18, type: 'Virtual' },
  { title: 'Annual Meetup 2026', date: 'May 15, 10 AM', attendees: 89, type: 'In-Person' },
];

const ROLE_BADGE: Record<string, string> = {
  Admin: 'bg-accent/10 text-accent',
  Moderator: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  Member: 'bg-muted text-muted-foreground',
};

export default function GroupDetailPage() {
  const { groupId } = useParams();
  const [tab, setTab] = useState('feed');

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="About">
        <p className="text-[9px] text-muted-foreground mb-2">{GROUP_INFO.description}</p>
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-semibold flex items-center gap-0.5"><Globe className="h-2.5 w-2.5" /> {GROUP_INFO.type}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span className="font-semibold">{GROUP_INFO.category}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span className="font-semibold">{GROUP_INFO.created}</span></div>
        </div>
      </SectionCard>
      <SectionCard title="Admins & Mods" action={<Link to={`/groups/${groupId || '1'}/members`} className="text-[8px] text-accent hover:underline">All</Link>}>
        <div className="space-y-1.5">
          {MEMBERS.filter(m => m.role !== 'Member').map(m => (
            <div key={m.name} className="flex items-center gap-2">
              <Avatar className="h-6 w-6 rounded-lg"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[7px] font-bold">{m.initials}</AvatarFallback></Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-[9px] font-semibold truncate">{m.name}</div>
                <Badge className={cn('text-[6px] h-3 border-0', ROLE_BADGE[m.role])}>{m.role}</Badge>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Upcoming Events">
        <div className="space-y-1.5">
          {EVENTS.map(e => (
            <div key={e.title} className="p-2 rounded-lg hover:bg-muted/20 transition-colors cursor-pointer">
              <div className="text-[9px] font-semibold">{e.title}</div>
              <div className="text-[8px] text-muted-foreground flex items-center gap-2"><Calendar className="h-2.5 w-2.5" />{e.date} · {e.attendees} attending</div>
            </div>
          ))}
        </div>
      </SectionCard>
      <SectionCard title="Group Rules">
        <div className="space-y-1 text-[8px] text-muted-foreground">
          {['Be respectful and constructive', 'Share original insights and credit sources', 'No spam, self-promotion limits apply', 'Keep discussions on-topic', 'Report issues to moderators'].map(r => (
            <p key={r} className="flex items-start gap-1"><Shield className="h-2.5 w-2.5 shrink-0 mt-0.5 text-muted-foreground/50" /> {r}</p>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={
      <>
        <Users className="h-4 w-4 text-accent" />
        <span className="text-xs font-semibold">{GROUP_INFO.name}</span>
        <div className="flex-1" />
        <Badge variant="outline" className="text-[9px] rounded-lg gap-1"><Users className="h-3 w-3" /> {GROUP_INFO.members.toLocaleString()}</Badge>
        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Bell className="h-3 w-3" /></Button>
        <Button variant="outline" size="sm" className="h-7 text-[10px] rounded-xl gap-1"><Share2 className="h-3 w-3" /></Button>
        <Link to="/groups" className="text-[9px] text-accent font-medium flex items-center gap-0.5 hover:underline">Groups <ArrowRight className="h-2.5 w-2.5" /></Link>
      </>
    } rightRail={rightRail} rightRailWidth="w-56">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-accent/10 via-[hsl(var(--gigvora-purple))]/5 to-[hsl(var(--gigvora-green))]/5 border p-6 mb-4">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-2xl bg-accent/10 flex items-center justify-center text-2xl shrink-0">🎨</div>
          <div className="flex-1">
            <h2 className="text-lg font-bold">{GROUP_INFO.name}</h2>
            <p className="text-[11px] text-muted-foreground">{GROUP_INFO.description.slice(0, 100)}...</p>
            <div className="flex items-center gap-3 mt-1.5 text-[9px] text-muted-foreground">
              <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {GROUP_INFO.members.toLocaleString()}</span>
              <span className="flex items-center gap-1"><MessageSquare className="h-3 w-3" /> {GROUP_INFO.posts} posts</span>
              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {EVENTS.length} events</span>
            </div>
          </div>
          <Button className="h-9 rounded-xl gap-1 shrink-0"><Plus className="h-3.5 w-3.5" /> Join Group</Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList className="h-7">
          <TabsTrigger value="feed" className="text-[9px] h-5 px-2 gap-1"><MessageSquare className="h-3 w-3" /> Feed</TabsTrigger>
          <TabsTrigger value="members" className="text-[9px] h-5 px-2 gap-1"><Users className="h-3 w-3" /> Members</TabsTrigger>
          <TabsTrigger value="resources" className="text-[9px] h-5 px-2 gap-1"><FileText className="h-3 w-3" /> Resources</TabsTrigger>
          <TabsTrigger value="events" className="text-[9px] h-5 px-2 gap-1"><Calendar className="h-3 w-3" /> Events</TabsTrigger>
        </TabsList>
      </Tabs>

      {tab === 'feed' && (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-4 rounded-2xl border border-border/30 bg-card">
            <Avatar className="h-8 w-8 rounded-lg"><AvatarFallback className="rounded-lg bg-accent/10 text-accent text-[9px] font-bold">YO</AvatarFallback></Avatar>
            <div className="flex-1">
              <Input placeholder="Share something with the group..." className="h-8 text-xs mb-2" />
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Image className="h-2.5 w-2.5" /> Image</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><LinkIcon className="h-2.5 w-2.5" /> Link</Button>
                <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><FileText className="h-2.5 w-2.5" /> File</Button>
                <div className="flex-1" />
                <Button size="sm" className="h-6 text-[8px] rounded-lg gap-0.5"><Send className="h-2.5 w-2.5" /> Post</Button>
              </div>
            </div>
          </div>
          {FEED_POSTS.map(post => (
            <div key={post.id} className="p-4 rounded-2xl border border-border/30 bg-card hover:border-accent/10 transition-all">
              {post.pinned && <div className="flex items-center gap-1 text-[8px] text-accent font-medium mb-2"><Pin className="h-2.5 w-2.5" /> Pinned post</div>}
              <div className="flex items-start gap-3">
                <Avatar className="h-9 w-9 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[9px] font-bold">{post.initials}</AvatarFallback></Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold">{post.author}</span>
                    <Badge className={cn('text-[6px] h-3 border-0', ROLE_BADGE[post.role])}>{post.role}</Badge>
                    <span className="text-[8px] text-muted-foreground ml-auto">{post.time}</span>
                  </div>
                  <p className="text-[10px] text-foreground/90 leading-relaxed">{post.content}</p>
                  {post.attachments && (
                    <div className="flex gap-1.5 mt-2">
                      {post.attachments.map(a => (
                        <Badge key={a} variant="outline" className="text-[7px] h-4 gap-0.5 cursor-pointer hover:bg-accent/10"><FileText className="h-2 w-2" /> {a}</Badge>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-4 mt-3 text-[9px] text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-accent transition-colors"><Heart className="h-3 w-3" /> {post.likes}</button>
                    <button className="flex items-center gap-1 hover:text-accent transition-colors"><MessageSquare className="h-3 w-3" /> {post.comments}</button>
                    <button className="flex items-center gap-1 hover:text-accent transition-colors"><Bookmark className="h-3 w-3" /> Save</button>
                    <button className="flex items-center gap-1 hover:text-accent transition-colors"><Share2 className="h-3 w-3" /> Share</button>
                    <button className="ml-auto hover:text-accent"><Flag className="h-3 w-3" /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'members' && (
        <div className="space-y-2">
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Search members..." className="pl-7 h-8 text-xs" />
          </div>
          {MEMBERS.map(m => (
            <div key={m.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
              <Avatar className="h-10 w-10 rounded-xl"><AvatarFallback className="rounded-xl bg-accent/10 text-accent text-[10px] font-bold">{m.initials}</AvatarFallback></Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2"><span className="text-[11px] font-bold">{m.name}</span><Badge className={cn('text-[7px] h-3.5 border-0', ROLE_BADGE[m.role])}>{m.role}</Badge></div>
                <span className="text-[9px] text-muted-foreground">{m.title}</span>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-[9px] rounded-lg">View Profile</Button>
            </div>
          ))}
        </div>
      )}

      {tab === 'resources' && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="relative flex-1"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" /><Input placeholder="Search resources..." className="pl-7 h-8 text-xs" /></div>
            <Button size="sm" className="h-8 text-[10px] rounded-xl gap-1"><Plus className="h-3 w-3" /> Upload</Button>
          </div>
          {RESOURCES.map(r => (
            <div key={r.name} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
              <div className="h-9 w-9 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><FileText className="h-4 w-4 text-accent" /></div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-semibold truncate">{r.name}</div>
                <div className="text-[8px] text-muted-foreground">{r.type} · {r.size} · by {r.by} · {r.uploaded}</div>
              </div>
              <Button variant="ghost" size="sm" className="h-7 text-[9px] rounded-lg">Download</Button>
            </div>
          ))}
        </div>
      )}

      {tab === 'events' && (
        <div className="space-y-2">
          {EVENTS.map(e => (
            <div key={e.title} className="flex items-center gap-3 p-4 rounded-xl border border-border/30 hover:border-accent/30 transition-all">
              <div className="h-10 w-10 rounded-xl bg-[hsl(var(--gigvora-purple))]/10 flex items-center justify-center shrink-0"><Calendar className="h-5 w-5 text-[hsl(var(--gigvora-purple))]" /></div>
              <div className="flex-1">
                <div className="text-[11px] font-bold">{e.title}</div>
                <div className="text-[9px] text-muted-foreground">{e.date} · {e.type} · {e.attendees} attending</div>
              </div>
              <Button size="sm" className="h-7 text-[9px] rounded-lg">RSVP</Button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
