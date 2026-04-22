import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Heart, MessageSquare, Users, Briefcase,
  Star, Clock, ChevronRight,
  FileText, Eye, Sparkles, Shield, CheckCircle2,
  Pen, GraduationCap, Zap, Award, BarChart3,
  Upload, UserCheck, Building2, Layers,
  Target, AlertTriangle,
  Package, Play,
} from 'lucide-react';
import { MOCK_JOBS } from '@/data/mock';
import { useRole } from '@/contexts/RoleContext';
import { toast } from 'sonner';

const UserDashboardPage: React.FC = () => {
  const { activeRole } = useRole();
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{ type: string; title: string; detail: string } | null>(null);
  const [timeWindow, setTimeWindow] = useState<'7d' | '30d' | '90d'>('30d');

  const openDetail = (type: string, title: string, detail: string) => {
    setSelectedItem({ type, title, detail });
    setDetailDrawer(true);
  };

  const profileItems = [
    { label: 'Profile photo', done: true },
    { label: 'Headline & bio', done: true },
    { label: 'Add 5+ skills', done: true },
    { label: 'Upload resume', done: false },
    { label: 'Verify email', done: true },
    { label: 'Connect LinkedIn', done: false },
    { label: 'Complete portfolio', done: false },
  ];
  const profilePct = Math.round((profileItems.filter(i => i.done).length / profileItems.length) * 100);

  const topStrip = (
    <>
      <span className="text-[11px] font-semibold flex items-center gap-1.5">
        <BarChart3 className="h-3.5 w-3.5 text-accent" />
        Dashboard
      </span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-1 border rounded-xl p-0.5">
        {(['7d', '30d', '90d'] as const).map(w => (
          <button key={w} onClick={() => setTimeWindow(w)} className={cn('px-2 py-0.5 rounded-lg text-[8px] transition-colors', timeWindow === w ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:bg-muted/30')}>{w}</button>
        ))}
      </div>
      <Badge variant="secondary" className="text-[7px] gap-0.5"><Clock className="h-2.5 w-2.5" />Live</Badge>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      {/* Profile Strength */}
      <SectionCard title="Profile Strength" icon={<UserCheck className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="flex items-center gap-2 mb-2">
          <Progress value={profilePct} className="h-1.5 flex-1" />
          <span className="text-[10px] font-bold text-accent">{profilePct}%</span>
        </div>
        <div className="space-y-1">
          {profileItems.filter(i => !i.done).map(i => (
            <div key={i.label} className="flex items-center justify-between text-[8px]">
              <span className="text-muted-foreground">{i.label}</span>
              <Button variant="ghost" size="sm" className="h-4 text-[7px] px-1.5" onClick={() => toast.info(`Complete: ${i.label}`)}>Do it</Button>
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Alerts */}
      <SectionCard title="Needs Attention" icon={<AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { text: 'Payment method expiring', severity: 'caution' as const },
            { text: 'Unread offer from TechCorp', severity: 'live' as const },
            { text: '2 proposals awaiting review', severity: 'review' as const },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[8px] cursor-pointer hover:bg-muted/20 rounded-lg p-1" onClick={() => openDetail('alert', a.text, 'Action required')}>
              <StatusBadge status={a.severity} label="" />
              <span className="flex-1">{a.text}</span>
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>

      {/* Quick Actions — handoff to canonical pages */}
      <SectionCard title="Quick Actions" className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'New Post', icon: Pen, href: '/creation-studio' },
            { label: 'Browse Jobs', icon: Briefcase, href: '/jobs' },
            { label: 'Find Mentor', icon: GraduationCap, href: '/mentorship' },
            { label: 'Upload CV', icon: Upload, href: '/profile' },
          ].map(a => (
            <Link key={a.label} to={a.href}><Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 justify-start"><a.icon className="h-3 w-3" />{a.label}</Button></Link>
          ))}
        </div>
      </SectionCard>

      {/* Trust */}
      <SectionCard title="Trust & Verification" icon={<Shield className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl border-[hsl(var(--state-caution))]/20">
        <div className="space-y-1">
          {[
            { text: 'Verify identity', action: 'Verify' },
            { text: 'Add payment method', action: 'Add' },
          ].map((p, i) => (
            <div key={i} className="flex items-center justify-between text-[8px]">
              <span className="text-muted-foreground">{p.text}</span>
              <Button variant="outline" size="sm" className="h-5 text-[7px] px-1.5 rounded-xl" onClick={() => toast.info(p.action)}>{p.action}</Button>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56">
      <div className="space-y-4">
        {/* Welcome banner */}
        <div className="rounded-2xl border bg-gradient-to-br from-accent/5 via-card to-card p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold mb-0.5">Welcome back 👋</h1>
              <p className="text-[10px] text-muted-foreground">Here's what's happening on Gigvora today.</p>
            </div>
            <Badge variant="secondary" className="text-[7px]">{new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</Badge>
          </div>
        </div>

        {/* KPI Band */}
        <KPIBand>
          <KPICard label="Saved Items" value="12" />
          <KPICard label="Unread Messages" value="5" change="+3 new" trend="up" />
          <KPICard label="Pending Actions" value="6" />
          <KPICard label="Connections" value="47" change="+4 this week" trend="up" />
        </KPIBand>

        {/* Guided Next Actions */}
        <SectionCard title="Guided Next Actions" subtitle="Recommended for you based on your activity" icon={<Sparkles className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="grid md:grid-cols-2 gap-2">
            {[
              { title: 'Complete your portfolio', desc: 'Add 3 more projects to increase visibility', icon: Layers, priority: 'high', href: '/profile' },
              { title: 'Respond to TechCorp offer', desc: 'Custom offer expires in 48 hours', icon: Package, priority: 'urgent', href: '/offers' },
              { title: 'Review proposal from DevTeam', desc: '2 proposals awaiting your review', icon: FileText, priority: 'medium', href: '/projects' },
              { title: 'Schedule mentoring session', desc: 'You have 1 pending mentor request', icon: GraduationCap, priority: 'low', href: '/mentorship' },
            ].map((a, i) => (
              <Link key={i} to={a.href} className="rounded-2xl border p-3 hover:shadow-sm transition-all group cursor-pointer">
                <div className="flex items-start gap-2">
                  <div className="h-8 w-8 rounded-xl bg-accent/10 flex items-center justify-center shrink-0"><a.icon className="h-4 w-4 text-accent" /></div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-semibold group-hover:text-accent transition-colors">{a.title}</span>
                      <Badge variant="secondary" className={cn('text-[6px]', a.priority === 'urgent' && 'bg-[hsl(var(--state-critical))]/10 text-[hsl(var(--state-critical))]', a.priority === 'high' && 'bg-[hsl(var(--state-caution))]/10 text-[hsl(var(--state-caution))]')}>{a.priority}</Badge>
                    </div>
                    <p className="text-[8px] text-muted-foreground">{a.desc}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mt-1" />
                </div>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Continue Where You Left Off */}
        <SectionCard title="Continue Where You Left Off" icon={<Play className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
          <div className="space-y-1.5">
            {[
              { title: 'Editing: Brand Strategy Proposal', type: 'Document', progress: 65, time: '2 hours ago', href: '/projects' },
              { title: 'Reviewing: DevTeam Pro application', type: 'Proposal', progress: 30, time: '4 hours ago', href: '/projects' },
              { title: 'Drafting: Logo Design gig listing', type: 'Gig', progress: 80, time: '1 day ago', href: '/gigs/new' },
            ].map((item, i) => (
              <Link key={i} to={item.href} className="rounded-2xl border p-3 flex items-center gap-3 hover:shadow-sm transition-all">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-semibold truncate">{item.title}</span>
                    <Badge variant="secondary" className="text-[7px] shrink-0">{item.type}</Badge>
                  </div>
                  <div className="text-[8px] text-muted-foreground mb-1.5">Last edited {item.time}</div>
                  <div className="flex items-center gap-2">
                    <Progress value={item.progress} className="h-1.5 flex-1" />
                    <span className="text-[8px] font-medium">{item.progress}%</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[8px] gap-1 rounded-xl shrink-0"><Play className="h-2.5 w-2.5" />Resume</Button>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Recommended Opportunities */}
        <SectionCard title="Recommended Opportunities" icon={<Zap className="h-3.5 w-3.5 text-accent" />} action={<Link to="/jobs" className="text-[8px] text-accent hover:underline">Explore All</Link>} className="!rounded-2xl">
          <div className="space-y-1.5">
            {MOCK_JOBS.slice(0, 4).map(j => (
              <Link key={j.id} to={`/jobs/${j.id}`} className="rounded-2xl border px-3 py-2.5 flex items-center gap-2 hover:shadow-sm transition-all cursor-pointer">
                <div className="h-8 w-8 rounded-xl bg-muted flex items-center justify-center shrink-0"><Building2 className="h-4 w-4 text-muted-foreground" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold truncate">{j.title}</div>
                  <div className="text-[8px] text-muted-foreground">{j.company} · {j.location} · {j.salary}</div>
                </div>
                <Badge className="text-[7px] bg-accent/10 text-accent shrink-0">87%</Badge>
              </Link>
            ))}
          </div>
        </SectionCard>

        {/* Recent Activity */}
        <SectionCard title="Recent Activity" icon={<Clock className="h-3.5 w-3.5 text-accent" />} action={<Link to="/notifications" className="text-[8px] text-accent hover:underline">View All</Link>} className="!rounded-2xl">
          <div className="space-y-1.5">
            {[
              { icon: Heart, text: 'Sarah Chen liked your post', time: '2h ago', color: 'text-pink-500' },
              { icon: Users, text: 'Marcus Johnson accepted your connection', time: '3h ago', color: 'text-accent' },
              { icon: Briefcase, text: 'New job match: Senior Frontend Engineer at Stripe', time: '5h ago', color: 'text-[hsl(var(--state-healthy))]' },
              { icon: MessageSquare, text: 'New message from Elena Rodriguez', time: '6h ago', color: 'text-accent' },
              { icon: Star, text: 'Your profile was viewed 12 times this week', time: '1d ago', color: 'text-[hsl(var(--state-caution))]' },
              { icon: Award, text: 'You earned the "Active Networker" badge', time: '2d ago', color: 'text-purple-500' },
            ].map((a, i) => (
              <div key={i} className="flex items-center gap-2 py-1.5 hover:bg-muted/20 rounded-lg px-1 cursor-pointer" onClick={() => openDetail('activity', a.text, a.time)}>
                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0"><a.icon className={cn('h-3 w-3', a.color)} /></div>
                <span className="text-[9px] flex-1">{a.text}</span>
                <span className="text-[7px] text-muted-foreground shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Analytics Summary (compact) */}
        <div className="grid md:grid-cols-2 gap-3">
          <SectionCard title="Profile Views (30d)" icon={<Eye className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { day: 'Mon', views: 22 }, { day: 'Tue', views: 18 }, { day: 'Wed', views: 31 },
                { day: 'Thu', views: 25 }, { day: 'Fri', views: 19 }, { day: 'Sat', views: 14 }, { day: 'Sun', views: 13 },
              ].map(d => (
                <div key={d.day} className="flex items-center gap-2 text-[9px]">
                  <span className="w-8 text-muted-foreground">{d.day}</span>
                  <div className="flex-1"><Progress value={(d.views / 31) * 100} className="h-1.5" /></div>
                  <span className="font-medium w-6 text-right">{d.views}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Engagement" icon={<Target className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { label: 'Post Impressions', value: '1,240', pct: 78 },
                { label: 'Profile Clicks', value: '89', pct: 56 },
                { label: 'Message Opens', value: '45', pct: 90 },
                { label: 'Connection Accepts', value: '12', pct: 34 },
              ].map(m => (
                <div key={m.label} className="flex items-center gap-2 text-[9px]">
                  <span className="w-28 text-muted-foreground">{m.label}</span>
                  <div className="flex-1"><Progress value={m.pct} className="h-1.5" /></div>
                  <span className="font-medium w-10 text-right">{m.value}</span>
                </div>
              ))}
            </div>
          </SectionCard>
        </div>

        {/* Upgrade CTA */}
        {activeRole === 'user' && (
          <div className="rounded-2xl border bg-gradient-to-r from-accent/10 to-purple-500/10 p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-accent/20 flex items-center justify-center shrink-0"><Zap className="h-5 w-5 text-accent" /></div>
            <div className="flex-1">
              <h3 className="text-[11px] font-semibold">Ready to do more?</h3>
              <p className="text-[8px] text-muted-foreground">Switch to Professional mode to manage gigs, projects, and mentoring sessions.</p>
            </div>
            <Button size="sm" className="text-[9px] rounded-xl shrink-0">Go Professional</Button>
          </div>
        )}
      </div>

      {/* Detail Drawer */}
      <Sheet open={detailDrawer} onOpenChange={setDetailDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Detail Inspector</SheetTitle></SheetHeader>
          {selectedItem && (
            <div className="p-4 space-y-3">
              <Badge variant="secondary" className="text-[7px] capitalize">{selectedItem.type}</Badge>
              <h3 className="text-[12px] font-bold">{selectedItem.title}</h3>
              <p className="text-[9px] text-muted-foreground">{selectedItem.detail}</p>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 rounded-xl" onClick={() => setDetailDrawer(false)}>Close</Button>
                <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { setDetailDrawer(false); toast.success('Action taken!'); }}><CheckCircle2 className="h-3 w-3" />Take Action</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default UserDashboardPage;
