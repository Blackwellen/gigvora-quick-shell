import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Heart, Search, Clock, ChevronRight, MoreHorizontal, History,
  Eye, Bookmark, BookmarkCheck, Building2, Users, MapPin, Briefcase,
  CheckCircle2, AlertTriangle, Award, Star, MessageSquare,
  Plus, Calendar, TrendingUp, Globe, Timer, FileText, Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

// ── Types ──
type VolType = 'skills_based' | 'general' | 'team' | 'virtual';
type OppStatus = 'open' | 'applied' | 'accepted' | 'completed' | 'closed';
type HoursStatus = 'approved' | 'pending' | 'rejected';

interface Opportunity {
  id: string; title: string; org: string; orgAvatar: string; type: VolType;
  location: string; cause: string; commitment: string; spots: number;
  status: OppStatus; saved: boolean; posted: string; skills: string[];
}

interface HoursLog {
  id: string; org: string; orgAvatar: string; role: string; date: string;
  hours: number; status: HoursStatus; description: string;
}

interface ImpactRecord {
  id: string; org: string; orgAvatar: string; role: string; totalHours: number;
  period: string; badges: string[]; referenceAvailable: boolean;
}

// ── Mock Data ──
const OPPORTUNITIES: Opportunity[] = [
  { id: 'V-001', title: 'Web Developer for Education Platform', org: 'Code for Good', orgAvatar: 'CG', type: 'skills_based', location: 'Remote', cause: 'Education', commitment: '5 hrs/week', spots: 3, status: 'open', saved: true, posted: '1d ago', skills: ['React', 'Node.js'] },
  { id: 'V-002', title: 'Community Garden Coordinator', org: 'Green Futures', orgAvatar: 'GF', type: 'general', location: 'Austin, TX', cause: 'Environment', commitment: '4 hrs/week', spots: 8, status: 'open', saved: false, posted: '2d ago', skills: ['Organizing', 'Communication'] },
  { id: 'V-003', title: 'Data Analysis for Homeless Shelter', org: 'SafeHaven', orgAvatar: 'SH', type: 'skills_based', location: 'New York, NY', cause: 'Social Services', commitment: '3 hrs/week', spots: 1, status: 'applied', saved: true, posted: '3d ago', skills: ['Python', 'Excel', 'Data Viz'] },
  { id: 'V-004', title: 'Team Build Day — Food Bank', org: 'FeedForward', orgAvatar: 'FF', type: 'team', location: 'Chicago, IL', cause: 'Hunger Relief', commitment: 'One-time (8 hrs)', spots: 20, status: 'open', saved: false, posted: '5d ago', skills: ['Teamwork'] },
  { id: 'V-005', title: 'Virtual Tutoring — STEM Subjects', org: 'BrightMinds', orgAvatar: 'BM', type: 'virtual', location: 'Remote', cause: 'Education', commitment: '2 hrs/week', spots: 15, status: 'accepted', saved: false, posted: '1w ago', skills: ['Math', 'Science', 'Teaching'] },
  { id: 'V-006', title: 'UX Research for Health App', org: 'HealthBridge', orgAvatar: 'HB', type: 'skills_based', location: 'Remote', cause: 'Healthcare', commitment: '6 hrs/week', spots: 2, status: 'completed', saved: true, posted: '1mo ago', skills: ['UX Research', 'Figma'] },
];

const HOURS: HoursLog[] = [
  { id: 'H-1', org: 'BrightMinds', orgAvatar: 'BM', role: 'Virtual Tutor', date: 'Apr 10, 2026', hours: 2, status: 'approved', description: 'Tutored 2 students in algebra' },
  { id: 'H-2', org: 'BrightMinds', orgAvatar: 'BM', role: 'Virtual Tutor', date: 'Apr 8, 2026', hours: 2, status: 'approved', description: 'Physics lab prep session' },
  { id: 'H-3', org: 'Code for Good', orgAvatar: 'CG', role: 'Web Developer', date: 'Apr 7, 2026', hours: 3, status: 'pending', description: 'Built student dashboard component' },
  { id: 'H-4', org: 'HealthBridge', orgAvatar: 'HB', role: 'UX Researcher', date: 'Apr 5, 2026', hours: 4, status: 'approved', description: 'Conducted 3 user interviews' },
  { id: 'H-5', org: 'FeedForward', orgAvatar: 'FF', role: 'Volunteer', date: 'Mar 28, 2026', hours: 8, status: 'approved', description: 'Team build day — sorted 2,000 items' },
];

const IMPACT: ImpactRecord[] = [
  { id: 'I-1', org: 'HealthBridge', orgAvatar: 'HB', role: 'UX Researcher', totalHours: 48, period: 'Jan–Mar 2026', badges: ['Skills-Based', 'Completed'], referenceAvailable: true },
  { id: 'I-2', org: 'BrightMinds', orgAvatar: 'BM', role: 'Virtual Tutor', totalHours: 32, period: 'Feb–Present', badges: ['Active', 'Education'], referenceAvailable: false },
  { id: 'I-3', org: 'FeedForward', orgAvatar: 'FF', role: 'Team Volunteer', totalHours: 8, period: 'Mar 2026', badges: ['Team Event'], referenceAvailable: true },
];

const TYPE_COLORS: Record<VolType, string> = {
  skills_based: 'bg-accent/10 text-accent',
  general: 'bg-primary/10 text-primary',
  team: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  virtual: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
};

const STATUS_COLORS: Record<OppStatus, string> = {
  open: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  applied: 'bg-accent/10 text-accent',
  accepted: 'bg-primary/10 text-primary',
  completed: 'bg-muted text-muted-foreground',
  closed: 'bg-muted text-muted-foreground',
};

const HOURS_COLORS: Record<HoursStatus, string> = {
  approved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  pending: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  rejected: 'bg-destructive/10 text-destructive',
};

// ── Detail Drawer ──
const OpportunityDrawer: React.FC<{ opp: Opportunity | null; open: boolean; onClose: () => void }> = ({ opp, open, onClose }) => {
  if (!opp) return null;
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Heart className="h-4 w-4 text-accent" />Volunteer Opportunity</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b">
            <Avatar className="h-10 w-10"><AvatarFallback className="text-[8px]">{opp.orgAvatar}</AvatarFallback></Avatar>
            <div className="flex-1">
              <div className="text-sm font-bold">{opp.title}</div>
              <div className="text-[10px] text-muted-foreground">{opp.org} · {opp.location}</div>
            </div>
            <Badge className={cn('text-[7px] border-0 capitalize', STATUS_COLORS[opp.status])}>{opp.status}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Type', v: opp.type.replace('_', ' '), icon: Briefcase },
              { l: 'Location', v: opp.location, icon: MapPin },
              { l: 'Cause', v: opp.cause, icon: Heart },
              { l: 'Commitment', v: opp.commitment, icon: Timer },
              { l: 'Spots Left', v: String(opp.spots), icon: Users },
              { l: 'Posted', v: opp.posted, icon: Clock },
            ].map(m => (
              <div key={m.l} className="rounded-md border p-2 flex items-start gap-1.5">
                <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium capitalize">{m.v}</div></div>
              </div>
            ))}
          </div>
          <div>
            <div className="text-[10px] font-semibold mb-1">Skills Needed</div>
            <div className="flex flex-wrap gap-1">{opp.skills.map(s => <Badge key={s} variant="secondary" className="text-[7px]">{s}</Badge>)}</div>
          </div>
          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {opp.status === 'open' && <Button size="sm" className="h-6 text-[9px] gap-1"><Heart className="h-2.5 w-2.5" />Apply to Volunteer</Button>}
            {opp.status === 'accepted' && <Button size="sm" className="h-6 text-[9px] gap-1"><Timer className="h-2.5 w-2.5" />Log Hours</Button>}
            {opp.status === 'completed' && <Button size="sm" className="h-6 text-[9px] gap-1"><FileText className="h-2.5 w-2.5" />Request Reference</Button>}
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1">{opp.saved ? <BookmarkCheck className="h-2.5 w-2.5" /> : <Bookmark className="h-2.5 w-2.5" />}{opp.saved ? 'Saved' : 'Save'}</Button>
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><MessageSquare className="h-2.5 w-2.5" />Contact Org</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const VolunteeringPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const totalApproved = HOURS.filter(h => h.status === 'approved').reduce((s, h) => s + h.hours, 0);

  const topStrip = (
    <>
      <Heart className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Volunteering & Impact</span>
      <div className="flex-1" />
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search opportunities..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-40 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All types</option>
        <option value="skills_based">Skills-Based</option>
        <option value="general">General</option>
        <option value="team">Team</option>
        <option value="virtual">Virtual</option>
      </select>
      <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1"><Timer className="h-3 w-3" />Log Hours</Button>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="Your Impact" icon={<TrendingUp className="h-3.5 w-3.5 text-accent" />}>
        <div className="flex items-center justify-center py-2">
          <div className="text-center">
            <div className="text-2xl font-bold">{totalApproved}</div>
            <div className="text-[7px] text-muted-foreground">Verified Hours</div>
          </div>
        </div>
        <div className="space-y-1 text-[8px]">
          <div className="flex justify-between"><span>Organizations</span><span className="font-semibold">4</span></div>
          <div className="flex justify-between"><span>References</span><span className="font-semibold">2</span></div>
          <div className="flex justify-between"><span>Badges</span><span className="font-semibold">5</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Badges Earned" icon={<Award className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />}>
        <div className="flex flex-wrap gap-1">
          {['First Hours', 'Skills Volunteer', 'Team Player', '50 Hours', 'Educator'].map(b => (
            <Badge key={b} variant="secondary" className="text-[6px] gap-0.5"><Award className="h-2 w-2" />{b}</Badge>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Pending Approvals" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))]" />}>
        <div className="space-y-1">
          {HOURS.filter(h => h.status === 'pending').map(h => (
            <div key={h.id} className="text-[8px] p-1.5 rounded-md border">
              <div className="font-medium">{h.hours}h — {h.org}</div>
              <div className="text-[7px] text-muted-foreground">{h.date}</div>
            </div>
          ))}
          {HOURS.filter(h => h.status === 'pending').length === 0 && <div className="text-[8px] text-muted-foreground italic">No pending approvals</div>}
        </div>
      </SectionCard>

      <SectionCard title="Quick Actions">
        <div className="space-y-0.5">
          {[
            { label: 'Browse Opportunities', icon: Search },
            { label: 'Log Hours', icon: Timer },
            { label: 'Request Reference', icon: FileText },
            { label: 'View Certificates', icon: Award },
          ].map(a => (
            <button key={a.label} className="flex items-center gap-2 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span>
              <ChevronRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
            </button>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><History className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {[
          { action: 'Hours approved: 2h tutoring at BrightMinds', time: '1d ago', type: 'hours' },
          { action: 'Applied to "Web Developer" at Code for Good', time: '2d ago', type: 'application' },
          { action: 'Earned badge: "50 Hours" milestone', time: '1w ago', type: 'badge' },
          { action: 'Reference received from HealthBridge', time: '2w ago', type: 'reference' },
        ].map((a, i) => (
          <div key={i} className="shrink-0 rounded-lg border bg-card px-3 py-2 min-w-[220px]">
            <Badge variant="secondary" className="text-[6px] capitalize mb-1">{a.type}</Badge>
            <p className="text-[8px] text-muted-foreground line-clamp-2">{a.action}</p>
            <div className="text-[7px] text-muted-foreground mt-0.5">{a.time}</div>
          </div>
        ))}
      </div>
    </div>
  );

  const filtered = OPPORTUNITIES.filter(o => {
    const ms = !search || o.title.toLowerCase().includes(search.toLowerCase()) || o.org.toLowerCase().includes(search.toLowerCase()) || o.cause.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'all' || o.type === typeFilter;
    return ms && mt;
  });

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <KPIBand className="mb-3">
        <KPICard label="Total Hours" value={String(totalApproved)} change="Verified" trend="up" />
        <KPICard label="Active Roles" value="2" change="Currently volunteering" />
        <KPICard label="Organizations" value="4" change="Contributed to" />
        <KPICard label="References" value="2" change="Available" trend="up" />
      </KPIBand>

      <Tabs defaultValue="opportunities">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="opportunities" className="gap-1 text-[10px] h-6 px-2"><Heart className="h-3 w-3" />Opportunities</TabsTrigger>
          <TabsTrigger value="hours" className="gap-1 text-[10px] h-6 px-2"><Timer className="h-3 w-3" />Hours Log</TabsTrigger>
          <TabsTrigger value="impact" className="gap-1 text-[10px] h-6 px-2"><TrendingUp className="h-3 w-3" />Impact Records</TabsTrigger>
        </TabsList>

        {/* Opportunities */}
        <TabsContent value="opportunities">
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-[9px] text-muted-foreground font-medium">
                  <th className="text-left px-3 py-2">Opportunity</th>
                  <th className="text-left px-3 py-2">Type</th>
                  <th className="text-left px-3 py-2">Cause</th>
                  <th className="text-left px-3 py-2">Commitment</th>
                  <th className="text-center px-3 py-2">Status</th>
                  <th className="text-left px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} onClick={() => setSelectedOpp(o)} className={cn('border-t hover:bg-muted/30 cursor-pointer text-[9px] transition-colors', selectedOpp?.id === o.id && 'bg-accent/5')}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <Avatar className="h-6 w-6"><AvatarFallback className="text-[6px]">{o.orgAvatar}</AvatarFallback></Avatar>
                        <div>
                          <div className="font-medium flex items-center gap-1">{o.title}{o.saved && <BookmarkCheck className="h-2.5 w-2.5 text-accent" />}</div>
                          <div className="text-[7px] text-muted-foreground">{o.org} · {o.location}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2"><Badge className={cn('text-[6px] border-0 capitalize', TYPE_COLORS[o.type])}>{o.type.replace('_', ' ')}</Badge></td>
                    <td className="px-3 py-2 text-muted-foreground">{o.cause}</td>
                    <td className="px-3 py-2 text-muted-foreground">{o.commitment}</td>
                    <td className="px-3 py-2 text-center"><Badge className={cn('text-[6px] border-0 capitalize', STATUS_COLORS[o.status])}>{o.status}</Badge></td>
                    <td className="px-3 py-2" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => toast.success(`${o.saved ? 'Removed' : 'Saved'} ${o.title}`)}>{o.saved ? <BookmarkCheck className="h-2.5 w-2.5 text-accent" /> : <Bookmark className="h-2.5 w-2.5" />}</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* Hours Log */}
        <TabsContent value="hours">
          <div className="space-y-2">
            <div className="flex justify-end"><Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />Log Hours</Button></div>
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-[9px] text-muted-foreground font-medium">
                    <th className="text-left px-3 py-2">Organization</th>
                    <th className="text-left px-3 py-2">Role</th>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-center px-3 py-2">Hours</th>
                    <th className="text-center px-3 py-2">Status</th>
                    <th className="text-left px-3 py-2">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {HOURS.map(h => (
                    <tr key={h.id} className="border-t text-[9px] hover:bg-muted/30">
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <Avatar className="h-5 w-5"><AvatarFallback className="text-[5px]">{h.orgAvatar}</AvatarFallback></Avatar>
                          <span className="font-medium">{h.org}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{h.role}</td>
                      <td className="px-3 py-2 text-muted-foreground">{h.date}</td>
                      <td className="px-3 py-2 text-center font-semibold">{h.hours}h</td>
                      <td className="px-3 py-2 text-center"><Badge className={cn('text-[6px] border-0 capitalize', HOURS_COLORS[h.status])}>{h.status}</Badge></td>
                      <td className="px-3 py-2 text-muted-foreground truncate max-w-[180px]">{h.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {HOURS.some(h => h.status === 'pending') && (
              <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2.5 flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
                <div className="text-[8px]"><span className="font-semibold">Hours Awaiting Approval.</span> Some logged hours are pending organization approval. You'll be notified once verified.</div>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Impact Records */}
        <TabsContent value="impact">
          <div className="space-y-3">
            {IMPACT.map(i => (
              <div key={i.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-center gap-2 mb-2">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[7px]">{i.orgAvatar}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[11px] font-semibold">{i.org}</div>
                    <div className="text-[8px] text-muted-foreground">{i.role} · {i.period}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold">{i.totalHours}h</div>
                    <div className="text-[7px] text-muted-foreground">Total</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-0.5 mb-2">
                  {i.badges.map(b => <Badge key={b} variant="secondary" className="text-[6px] gap-0.5"><Award className="h-2 w-2" />{b}</Badge>)}
                </div>
                <div className="flex items-center justify-between border-t pt-2">
                  <div className="flex items-center gap-1 text-[8px] text-muted-foreground">
                    {i.referenceAvailable ? (
                      <><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" /><span>Reference available</span></>
                    ) : (
                      <><Clock className="h-3 w-3" /><span>Reference not yet available</span></>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {i.referenceAvailable && <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><FileText className="h-2 w-2" />Get Reference</Button>}
                    <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><Eye className="h-2 w-2" />Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <OpportunityDrawer opp={selectedOpp} open={!!selectedOpp} onClose={() => setSelectedOpp(null)} />
    </DashboardLayout>
  );
};

export default VolunteeringPage;
