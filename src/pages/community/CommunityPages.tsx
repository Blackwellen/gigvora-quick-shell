import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Search, Calendar, Video, Mic, Globe, UserPlus } from 'lucide-react';

const GroupsPage: React.FC = () => {
  const groups = [
    { id: 'gr1', name: 'React Developers', members: 12400, desc: 'Community for React and frontend developers', category: 'Technology' },
    { id: 'gr2', name: 'Freelance Professionals', members: 8900, desc: 'Tips, jobs, and support for freelancers', category: 'Career' },
    { id: 'gr3', name: 'Design Systems', members: 5600, desc: 'All things design systems and component libraries', category: 'Design' },
    { id: 'gr4', name: 'Startup Founders', members: 15200, desc: 'Network with founders and share experiences', category: 'Business' },
    { id: 'gr5', name: 'AI & Machine Learning', members: 21000, desc: 'Discuss the latest in AI and ML', category: 'Technology' },
    { id: 'gr6', name: 'Remote Work Hub', members: 9800, desc: 'Resources and discussions for remote workers', category: 'Lifestyle' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <Button>Create Group</Button>
      </div>
      <div className="relative mb-6 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input placeholder="Search groups..." className="w-full h-10 rounded-lg border bg-card pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {groups.map(g => (
          <div key={g.id} className="rounded-xl border bg-card p-5 hover:shadow-md transition-all">
            <div className="h-20 rounded-lg bg-gradient-to-r from-accent/20 to-primary/10 mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-accent/40" />
            </div>
            <Badge variant="secondary" className="text-xs mb-2">{g.category}</Badge>
            <h3 className="font-semibold mb-1">{g.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{g.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{g.members.toLocaleString()} members</span>
              <Button size="sm" variant="outline" className="gap-1 h-7 text-xs"><UserPlus className="h-3 w-3" /> Join</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const EventsPage: React.FC = () => {
  const events = [
    { id: 'ev1', title: 'Design Systems Summit 2026', date: 'Apr 15, 2026', time: '10:00 AM PST', type: 'Virtual', attendees: 1200, host: 'Gigvora Events' },
    { id: 'ev2', title: 'Speed Networking: Tech Leaders', date: 'Apr 18, 2026', time: '2:00 PM EST', type: 'Virtual', attendees: 56, host: 'TechCorp' },
    { id: 'ev3', title: 'Freelancer Mastermind Q2', date: 'Apr 20, 2026', time: '11:00 AM GMT', type: 'Virtual', attendees: 89, host: 'Freelance Pros Group' },
    { id: 'ev4', title: 'Enterprise Innovation Summit', date: 'May 5, 2026', time: '9:00 AM PST', type: 'Hybrid', attendees: 450, host: 'Enterprise Connect' },
    { id: 'ev5', title: 'AI in Recruitment Workshop', date: 'May 12, 2026', time: '3:00 PM EST', type: 'Virtual', attendees: 180, host: 'Recruiter Pro' },
    { id: 'ev6', title: 'Creator Economy Meetup', date: 'May 20, 2026', time: '6:00 PM GMT', type: 'In-Person', attendees: 75, host: 'Creator Studio' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Events</h1>
        <Button>Host an Event</Button>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {events.map(e => (
          <div key={e.id} className="rounded-xl border bg-card overflow-hidden hover:shadow-md transition-all">
            <div className="h-32 bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-accent/40" />
            </div>
            <div className="p-4">
              <Badge variant="secondary" className="text-xs mb-2 gap-1">
                {e.type === 'Virtual' ? <Video className="h-3 w-3" /> : <Globe className="h-3 w-3" />}
                {e.type}
              </Badge>
              <h3 className="font-semibold text-sm mb-1">{e.title}</h3>
              <p className="text-xs text-muted-foreground mb-1">{e.date} · {e.time}</p>
              <p className="text-xs text-muted-foreground mb-3">Hosted by {e.host} · {e.attendees} attending</p>
              <Button size="sm" variant="outline" className="w-full">RSVP</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export { GroupsPage, EventsPage };
