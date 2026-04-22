import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, StatusBadge, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import { cn } from '@/lib/utils';
import {
  Briefcase, DollarSign, Star, Clock, TrendingUp, BarChart3,
  FileText, MessageSquare, Users, Calendar, Plus, ChevronRight,
  Layers, Zap, CheckCircle2, AlertTriangle, Eye,
  Target, Wallet, Building2, CreditCard, Activity,
  Shield, Upload, Flag, ExternalLink, Package,
  UserCheck, Bookmark, ThumbsUp, ThumbsDown, Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '@/contexts/RoleContext';

type TimeRange = '7d' | '30d' | '90d';
type ClientTab = 'overview' | 'buys' | 'projects' | 'shortlists' | 'approvals' | 'spend' | 'bookings' | 'team';

interface ActiveBuy {
  id: string; title: string; seller: string; status: 'active' | 'in-review' | 'pending' | 'completed' | 'disputed';
  amount: number; due: string; progress: number; type: 'gig' | 'project' | 'service';
}

interface Proposal {
  id: string; title: string; seller: string; rating: number; price: number;
  delivery: string; status: 'new' | 'shortlisted' | 'rejected' | 'accepted';
}

const BUYS: ActiveBuy[] = [
  { id: 'b1', title: 'Website Redesign', seller: 'Elena K.', status: 'active', amount: 4500, due: 'Apr 20', progress: 55, type: 'project' },
  { id: 'b2', title: 'Logo & Brand Package', seller: 'Marcus D.', status: 'in-review', amount: 1200, due: 'Apr 16', progress: 90, type: 'gig' },
  { id: 'b3', title: 'Content Strategy', seller: 'Aisha M.', status: 'active', amount: 2800, due: 'Apr 28', progress: 30, type: 'service' },
  { id: 'b4', title: 'Mobile App MVP', seller: 'James R.', status: 'pending', amount: 8500, due: 'May 10', progress: 0, type: 'project' },
  { id: 'b5', title: 'SEO Audit', seller: 'Clara W.', status: 'completed', amount: 600, due: 'Apr 5', progress: 100, type: 'gig' },
];

const PROPOSALS: Proposal[] = [
  { id: 'pr1', title: 'Data Pipeline Architecture', seller: 'David L.', rating: 4.9, price: 5200, delivery: '21 days', status: 'new' },
  { id: 'pr2', title: 'Data Pipeline Architecture', seller: 'Sophia T.', rating: 4.8, price: 4800, delivery: '18 days', status: 'shortlisted' },
  { id: 'pr3', title: 'Data Pipeline Architecture', seller: 'Ryan K.', rating: 4.7, price: 6100, delivery: '25 days', status: 'new' },
  { id: 'pr4', title: 'UI/UX Audit', seller: 'Nina F.', rating: 5.0, price: 1500, delivery: '7 days', status: 'accepted' },
];

const BUY_STATUS: Record<string, { badge: 'healthy' | 'live' | 'caution' | 'blocked' | 'review' | 'pending'; label: string }> = {
  active: { badge: 'live', label: 'Active' },
  'in-review': { badge: 'review', label: 'In Review' },
  pending: { badge: 'pending', label: 'Pending' },
  completed: { badge: 'healthy', label: 'Completed' },
  disputed: { badge: 'blocked', label: 'Disputed' },
};

const ClientDashboardPage: React.FC = () => {
  const { activeRole } = useRole();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [tab, setTab] = useState<ClientTab>('overview');
  const [selectedBuy, setSelectedBuy] = useState<ActiveBuy | null>(null);
  const [detailDrawer, setDetailDrawer] = useState(false);
  const [detailItem, setDetailItem] = useState<{ type: string; title: string; detail: string } | null>(null);
  const [postJobDrawer, setPostJobDrawer] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  const openDetail = (type: string, title: string, detail: string) => {
    setDetailItem({ type, title, detail });
    setDetailDrawer(true);
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : prev.length < 4 ? [...prev, id] : prev);
  };

  const topStrip = (
    <>
      <Building2 className="h-3.5 w-3.5 text-accent" />
      <span className="text-[11px] font-semibold">Client Workspace</span>
      <Badge variant="secondary" className="text-[7px] capitalize">{activeRole}</Badge>
      <div className="flex-1" />
      <div className="flex items-center gap-1 border rounded-xl p-0.5">
        {(['7d', '30d', '90d'] as const).map(r => (
          <button key={r} onClick={() => setTimeRange(r)} className={cn('px-2 py-0.5 rounded-lg text-[8px] font-medium transition-colors', timeRange === r ? 'bg-accent/10 text-accent' : 'text-muted-foreground hover:bg-muted/30')}>{r}</button>
        ))}
      </div>
      <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl" onClick={() => setPostJobDrawer(true)}><Plus className="h-3 w-3" />Post Job</Button>
      <Link to="/explore"><Button variant="outline" size="sm" className="h-6 text-[9px] gap-1 rounded-xl"><Search className="h-3 w-3" />Find Talent</Button></Link>
    </>
  );

  const rightRail = selectedBuy ? (
    <div className="space-y-3">
      <SectionCard title="Order Detail" icon={<Package className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5 text-[9px]">
          {[
            { l: 'Title', v: selectedBuy.title },
            { l: 'Seller', v: selectedBuy.seller },
            { l: 'Amount', v: `$${selectedBuy.amount.toLocaleString()}` },
            { l: 'Type', v: selectedBuy.type },
            { l: 'Due', v: selectedBuy.due },
          ].map(r => (
            <div key={r.l} className="flex justify-between items-center"><span className="text-muted-foreground">{r.l}</span><span className="font-medium">{r.v}</span></div>
          ))}
          <div className="flex justify-between items-center"><span className="text-muted-foreground">Status</span><StatusBadge status={BUY_STATUS[selectedBuy.status].badge} label={BUY_STATUS[selectedBuy.status].label} /></div>
        </div>
        <Progress value={selectedBuy.progress} className="h-1.5 mt-2" />
      </SectionCard>
      <SectionCard title="Actions" className="!rounded-2xl">
        <div className="space-y-1">
          {selectedBuy.status === 'in-review' && <Button size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><CheckCircle2 className="h-3 w-3" />Approve Delivery</Button>}
          {selectedBuy.status === 'in-review' && <Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><Flag className="h-3 w-3" />Request Revision</Button>}
          {selectedBuy.status === 'active' && <Button size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><Eye className="h-3 w-3" />Track Progress</Button>}
          {selectedBuy.status === 'disputed' && <Button variant="destructive" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><Flag className="h-3 w-3" />View Dispute</Button>}
          <Link to="/inbox"><Button variant="outline" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl"><MessageSquare className="h-3 w-3" />Message Seller</Button></Link>
          <Button variant="ghost" size="sm" className="h-6 text-[9px] w-full gap-1 rounded-xl" onClick={() => openDetail('order', selectedBuy.title, `$${selectedBuy.amount}`)}><ExternalLink className="h-3 w-3" />Full View</Button>
        </div>
      </SectionCard>
    </div>
  ) : (
    <div className="space-y-3">
      <SectionCard title="Spend Summary" icon={<Wallet className="h-3.5 w-3.5 text-accent" />} action={<Link to="/finance" className="text-[8px] text-accent hover:underline">Details</Link>} className="!rounded-2xl">
        <div className="space-y-1 text-[9px]">
          <div className="flex justify-between"><span className="text-muted-foreground">This {timeRange}</span><span className="font-bold">$12,400</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">In Escrow</span><span className="font-medium text-[hsl(var(--state-caution))]">$8,500</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Released</span><span className="font-medium text-[hsl(var(--state-healthy))]">$3,900</span></div>
          <div className="border-t pt-1 flex justify-between font-semibold"><span>Lifetime</span><span>$86,200</span></div>
        </div>
      </SectionCard>

      <SectionCard title="Pending Approvals" icon={<CheckCircle2 className="h-3.5 w-3.5 text-[hsl(var(--state-caution))]" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { text: 'Logo delivery — Marcus D.', type: 'delivery' },
            { text: 'Milestone 2 — Elena K.', type: 'milestone' },
            { text: 'Custom offer — $2,400', type: 'offer' },
          ].map((a, i) => (
            <div key={i} className="flex items-center gap-2 text-[8px] cursor-pointer hover:bg-muted/20 rounded-lg p-1.5 border" onClick={() => openDetail('approval', a.text, a.type)}>
              <StatusBadge status="caution" label="" />
              <span className="flex-1">{a.text}</span>
              <ChevronRight className="h-2.5 w-2.5 text-muted-foreground" />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Saved Sellers" icon={<Bookmark className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
        <div className="space-y-1.5">
          {[
            { name: 'Elena K.', skill: 'Web Design', rating: 4.9 },
            { name: 'James R.', skill: 'Mobile Dev', rating: 4.8 },
            { name: 'David L.', skill: 'Data Eng', rating: 4.9 },
          ].map(s => (
            <div key={s.name} className="flex items-center gap-2 text-[8px] p-1.5 rounded-xl border hover:bg-muted/20 cursor-pointer" onClick={() => openDetail('seller', s.name, `${s.skill} · ${s.rating}★`)}>
              <Avatar className="h-5 w-5"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{s.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
              <div className="flex-1"><div className="font-medium">{s.name}</div><div className="text-muted-foreground">{s.skill}</div></div>
              <div className="flex items-center gap-0.5"><Star className="h-2.5 w-2.5 text-accent fill-accent" /><span>{s.rating}</span></div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Links" className="!rounded-2xl">
        <div className="space-y-1">
          {[
            { label: 'Browse Services', to: '/services', icon: Layers },
            { label: 'Post a Project', to: '/projects/create', icon: Plus },
            { label: 'View Invoices', to: '/finance/invoices', icon: FileText },
            { label: 'Support Center', to: '/support', icon: Shield },
          ].map(l => (
            <Link key={l.label} to={l.to}>
              <button className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-muted/20 transition-colors w-full text-left text-[8px]">
                <l.icon className="h-3 w-3 text-accent" /><span>{l.label}</span><ChevronRight className="h-2.5 w-2.5 text-muted-foreground ml-auto" />
              </button>
            </Link>
          ))}
        </div>
      </SectionCard>
    </div>
  );

  const bottomSection = (
    <div className="p-3">
      <div className="text-[11px] font-semibold mb-2 flex items-center gap-1"><Activity className="h-3.5 w-3.5 text-accent" />Recent Activity</div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
        {[
          { text: 'Approved milestone for Website Redesign', time: '2 hrs ago', icon: CheckCircle2 },
          { text: 'New proposal received from Ryan K.', time: '5 hrs ago', icon: FileText },
          { text: 'Payment released — $600 to Clara W.', time: '1 day ago', icon: DollarSign },
          { text: 'Custom offer sent to James R.', time: '2 days ago', icon: Package },
        ].map((a, i) => (
          <div key={i} className="flex items-center gap-2 p-2 rounded-xl border bg-card text-[8px]">
            <a.icon className="h-3 w-3 text-accent shrink-0" />
            <div><div className="font-medium">{a.text}</div><div className="text-muted-foreground">{a.time}</div></div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-56" bottomSection={bottomSection}>
      {/* Tabs */}
      <div className="flex items-center gap-1 mb-3 border-b pb-2 overflow-x-auto">
        {([
          { key: 'overview' as const, label: 'Overview', icon: BarChart3 },
          { key: 'buys' as const, label: 'Active Buys', icon: Package },
          { key: 'projects' as const, label: 'Projects', icon: Briefcase },
          { key: 'shortlists' as const, label: 'Shortlists', icon: Bookmark },
          { key: 'approvals' as const, label: 'Approvals', icon: CheckCircle2 },
          { key: 'spend' as const, label: 'Spend', icon: DollarSign },
          { key: 'bookings' as const, label: 'Bookings', icon: Calendar },
          { key: 'team' as const, label: 'Team', icon: Users },
        ]).map(w => (
          <button key={w.key} onClick={() => setTab(w.key)} className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] transition-colors whitespace-nowrap shrink-0',
            tab === w.key ? 'bg-accent/10 text-accent font-medium' : 'text-muted-foreground hover:text-foreground hover:bg-muted/30',
          )}>
            <w.icon className="h-3 w-3" />{w.label}
          </button>
        ))}
      </div>

      {/* ═══ OVERVIEW ═══ */}
      {tab === 'overview' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Orders" value="4" change="+1 this week" trend="up" />
            <KPICard label={`Spend (${timeRange})`} value="$12,400" change="+$3,200" trend="up" />
            <KPICard label="Open Proposals" value="6" change="3 shortlisted" trend="up" />
            <KPICard label="Pending Approvals" value="3" change="Action needed" />
          </KPIBand>

          {/* Active Orders Quick View */}
          <SectionCard title="Active Orders" icon={<Package className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('buys')} className="text-[8px] text-accent hover:underline">View All</button>} className="!rounded-2xl">
            <div className="space-y-1.5">
              {BUYS.filter(b => b.status !== 'completed').slice(0, 3).map(item => {
                const sc = BUY_STATUS[item.status];
                return (
                  <div key={item.id} onClick={() => setSelectedBuy(item)} className={cn('rounded-2xl border p-2.5 cursor-pointer transition-all hover:shadow-sm', selectedBuy?.id === item.id && 'ring-1 ring-accent border-accent/30')}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2 min-w-0">
                        <Avatar className="h-5 w-5 shrink-0"><AvatarFallback className="text-[6px] bg-accent/10 text-accent">{item.seller.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                        <span className="text-[10px] font-semibold truncate">{item.title}</span>
                        <StatusBadge status={sc.badge} label={sc.label} />
                      </div>
                      <span className="text-[10px] font-bold shrink-0">${item.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={item.progress} className="h-1 flex-1" />
                      <span className="text-[7px] text-muted-foreground">{item.progress}% · {item.seller} · Due {item.due}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </SectionCard>

          {/* Incoming Proposals */}
          <SectionCard title="Incoming Proposals" icon={<FileText className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('shortlists')} className="text-[8px] text-accent hover:underline">All Proposals</button>} className="!rounded-2xl">
            <div className="space-y-1.5">
              {PROPOSALS.filter(p => p.status === 'new' || p.status === 'shortlisted').slice(0, 3).map(p => (
                <div key={p.id} className="rounded-2xl border bg-card px-3 py-2 flex items-center gap-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('proposal', `${p.seller} — ${p.title}`, `$${p.price} · ${p.delivery}`)}>
                  <Avatar className="h-6 w-6 shrink-0"><AvatarFallback className="text-[7px] bg-accent/10 text-accent">{p.seller.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-medium truncate">{p.seller}</div>
                    <div className="text-[8px] text-muted-foreground">${p.price.toLocaleString()} · {p.delivery}</div>
                  </div>
                  <div className="flex items-center gap-1"><Star className="h-2.5 w-2.5 text-accent fill-accent" /><span className="text-[8px] font-medium">{p.rating}</span></div>
                  <StatusBadge status={p.status === 'shortlisted' ? 'healthy' : 'caution'} label={p.status === 'shortlisted' ? 'Shortlisted' : 'New'} />
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-accent/10 rounded-lg" onClick={e => { e.stopPropagation(); toggleCompare(p.id); }}><Layers className={cn("h-3 w-3", compareIds.includes(p.id) ? "text-accent" : "text-muted-foreground")} /></button>
                  </div>
                </div>
              ))}
            </div>
            {compareIds.length >= 2 && (
              <Button size="sm" className="h-6 text-[9px] gap-1 rounded-xl mt-2" onClick={() => setCompareOpen(true)}>
                <Layers className="h-3 w-3" />Compare ({compareIds.length})
              </Button>
            )}
          </SectionCard>

          {/* Spend Trend */}
          <SectionCard title={`Spend Trend — ${timeRange}`} icon={<DollarSign className="h-3.5 w-3.5 text-accent" />} action={<button onClick={() => setTab('spend')} className="text-[8px] text-accent hover:underline">Details</button>} className="!rounded-2xl">
            <div className="h-24 rounded-xl bg-muted/20 border border-dashed flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-5 w-5 text-muted-foreground mx-auto mb-1" />
                <div className="text-lg font-bold">$12,400</div>
                <div className="text-[8px] text-muted-foreground">Spend trend chart</div>
              </div>
            </div>
          </SectionCard>

          {/* AI Suggestions */}
          <div className="rounded-2xl border border-accent/20 bg-accent/5 p-3">
            <div className="flex items-center gap-2 mb-2"><Zap className="h-4 w-4 text-accent" /><span className="text-[11px] font-semibold">Recommended for You</span></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {[
                { title: 'Full-Stack Developer', match: 96, skills: 'React, Node.js', rate: '$85/hr' },
                { title: 'UX Researcher', match: 91, skills: 'User Testing, Figma', rate: '$70/hr' },
                { title: 'DevOps Engineer', match: 88, skills: 'AWS, Docker', rate: '$95/hr' },
              ].map(m => (
                <div key={m.title} className="rounded-2xl border bg-card p-2.5 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('talent', m.title, `${m.rate} · ${m.skills}`)}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[9px] font-medium">{m.title}</span>
                    <Badge className="text-[7px] bg-accent/10 text-accent">{m.match}%</Badge>
                  </div>
                  <div className="text-[8px] text-muted-foreground">{m.skills}</div>
                  <div className="text-[8px] font-medium mt-0.5">{m.rate}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ACTIVE BUYS ═══ */}
      {tab === 'buys' && (
        <div className="space-y-1.5">
          {BUYS.map(item => {
            const sc = BUY_STATUS[item.status];
            const isSel = selectedBuy?.id === item.id;
            return (
              <div key={item.id} onClick={() => setSelectedBuy(item)} className={cn('rounded-2xl border bg-card px-4 py-3 cursor-pointer transition-all hover:shadow-sm', isSel && 'ring-1 ring-accent border-accent/30')}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-7 w-7 shrink-0"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{item.seller.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[11px] font-semibold truncate">{item.title}</span>
                      <StatusBadge status={sc.badge} label={sc.label} />
                      <Badge variant="secondary" className="text-[7px] capitalize">{item.type}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-muted-foreground">
                      <span>{item.seller}</span><span>·</span><span className="flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" />Due {item.due}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0 space-y-1">
                    <div className="text-[12px] font-bold">${item.amount.toLocaleString()}</div>
                    <div className="flex items-center gap-1">
                      <Progress value={item.progress} className="h-1 w-16" />
                      <span className="text-[7px] text-muted-foreground">{item.progress}%</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══ PROJECTS ═══ */}
      {tab === 'projects' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Active Projects" value="3" />
            <KPICard label="Total Value" value="$15,800" />
            <KPICard label="Milestones Due" value="2" change="This week" />
            <KPICard label="Avg Completion" value="62%" trend="up" />
          </KPIBand>
          <div className="space-y-1.5">
            {[
              { title: 'Website Redesign', seller: 'Elena K.', milestones: '3/5', budget: '$4,500', health: 'healthy' as const },
              { title: 'Content Strategy', seller: 'Aisha M.', milestones: '1/4', budget: '$2,800', health: 'live' as const },
              { title: 'Mobile App MVP', seller: 'James R.', milestones: '0/6', budget: '$8,500', health: 'pending' as const },
            ].map(p => (
              <div key={p.title} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('project', p.title, `${p.budget} · ${p.seller}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><span className="text-[11px] font-semibold">{p.title}</span><StatusBadge status={p.health} label={p.health === 'healthy' ? 'On Track' : p.health === 'live' ? 'Active' : 'Not Started'} /></div>
                    <div className="text-[9px] text-muted-foreground mt-0.5">{p.seller} · Milestones: {p.milestones}</div>
                  </div>
                  <span className="text-[12px] font-bold">{p.budget}</span>
                </div>
              </div>
            ))}
          </div>
          <Link to="/projects/create"><Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl"><Plus className="h-3 w-3" />Create Project</Button></Link>
        </div>
      )}

      {/* ═══ SHORTLISTS ═══ */}
      {tab === 'shortlists' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Total Proposals" value={String(PROPOSALS.length)} />
            <KPICard label="Shortlisted" value={String(PROPOSALS.filter(p => p.status === 'shortlisted').length)} />
            <KPICard label="Avg Price" value={`$${Math.round(PROPOSALS.reduce((a, p) => a + p.price, 0) / PROPOSALS.length).toLocaleString()}`} />
            <KPICard label="Avg Rating" value={`${(PROPOSALS.reduce((a, p) => a + p.rating, 0) / PROPOSALS.length).toFixed(1)}★`} />
          </KPIBand>
          <div className="space-y-1.5">
            {PROPOSALS.map(p => (
              <div key={p.id} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('proposal', `${p.seller} — ${p.title}`, `$${p.price} · ${p.delivery}`)}>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{p.seller.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{p.seller}</span><StatusBadge status={p.status === 'shortlisted' ? 'healthy' : p.status === 'accepted' ? 'live' : p.status === 'rejected' ? 'blocked' : 'caution'} label={p.status} /></div>
                    <div className="text-[8px] text-muted-foreground">{p.title}</div>
                    <div className="text-[8px] text-muted-foreground">${p.price.toLocaleString()} · {p.delivery}</div>
                  </div>
                  <div className="flex items-center gap-1"><Star className="h-3 w-3 text-accent fill-accent" /><span className="text-[9px] font-medium">{p.rating}</span></div>
                  <div className="flex gap-1">
                    <button className="p-1 hover:bg-accent/10 rounded-lg" onClick={e => { e.stopPropagation(); toggleCompare(p.id); }}><Layers className={cn("h-3 w-3", compareIds.includes(p.id) ? "text-accent" : "text-muted-foreground")} /></button>
                    {p.status === 'new' && (
                      <>
                        <button className="p-1 hover:bg-[hsl(var(--state-healthy))]/10 rounded-lg" onClick={e => { e.stopPropagation(); toast.success(`Shortlisted ${p.seller}`); }}><ThumbsUp className="h-3 w-3 text-[hsl(var(--state-healthy))]" /></button>
                        <button className="p-1 hover:bg-[hsl(var(--state-blocked))]/10 rounded-lg" onClick={e => { e.stopPropagation(); toast.info(`Rejected ${p.seller}`); }}><ThumbsDown className="h-3 w-3 text-muted-foreground" /></button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {compareIds.length >= 2 && (
            <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => setCompareOpen(true)}>
              <Layers className="h-3 w-3" />Compare {compareIds.length} Proposals
            </Button>
          )}
        </div>
      )}

      {/* ═══ APPROVALS ═══ */}
      {tab === 'approvals' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Pending" value="3" change="Action needed" />
            <KPICard label="Approved Today" value="2" />
            <KPICard label="Avg Review Time" value="4 hrs" trend="down" />
            <KPICard label="Total This Month" value="14" />
          </KPIBand>
          <div className="space-y-1.5">
            {[
              { title: 'Logo delivery from Marcus D.', type: 'Delivery', amount: '$1,200', submitted: '2 hrs ago', status: 'pending' as const },
              { title: 'Milestone 2 — Website Redesign', type: 'Milestone', amount: '$1,500', submitted: '6 hrs ago', status: 'pending' as const },
              { title: 'Custom offer from James R.', type: 'Offer', amount: '$2,400', submitted: '1 day ago', status: 'pending' as const },
              { title: 'Content Strategy — Scope Change', type: 'Change Request', amount: '+$400', submitted: '2 days ago', status: 'review' as const },
            ].map((a, i) => (
              <div key={i} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold">{a.title}</span>
                    <Badge variant="secondary" className="text-[7px]">{a.type}</Badge>
                    <StatusBadge status={a.status === 'pending' ? 'caution' : 'review'} label={a.status === 'pending' ? 'Pending' : 'In Review'} />
                  </div>
                  <span className="text-[10px] font-bold">{a.amount}</span>
                </div>
                <div className="flex items-center justify-between text-[8px] text-muted-foreground">
                  <span>Submitted {a.submitted}</span>
                  <div className="flex gap-1">
                    <Button size="sm" className="h-5 text-[7px] px-2 gap-0.5 rounded-xl" onClick={() => toast.success(`Approved: ${a.title}`)}><CheckCircle2 className="h-2.5 w-2.5" />Approve</Button>
                    <Button variant="outline" size="sm" className="h-5 text-[7px] px-2 gap-0.5 rounded-xl" onClick={() => toast.info(`Revision requested: ${a.title}`)}><Flag className="h-2.5 w-2.5" />Revise</Button>
                    <Button variant="ghost" size="sm" className="h-5 text-[7px] px-2 rounded-xl" onClick={() => openDetail('approval', a.title, a.amount)}>Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SPEND ═══ */}
      {tab === 'spend' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label={`Total (${timeRange})`} value="$12,400" change="+$3,200" trend="up" />
            <KPICard label="In Escrow" value="$8,500" />
            <KPICard label="Released" value="$3,900" />
            <KPICard label="Lifetime" value="$86,200" />
          </KPIBand>

          <SectionCard title="Spend Breakdown" icon={<BarChart3 className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5 text-[9px]">
              {[
                { cat: 'Development', amount: '$6,200', pct: 50 },
                { cat: 'Design', amount: '$3,100', pct: 25 },
                { cat: 'Content & Marketing', amount: '$2,100', pct: 17 },
                { cat: 'Consulting', amount: '$1,000', pct: 8 },
              ].map(s => (
                <div key={s.cat} className="flex items-center gap-2">
                  <span className="w-32 text-muted-foreground">{s.cat}</span>
                  <Progress value={s.pct} className="h-1.5 flex-1" />
                  <span className="font-medium w-14 text-right">{s.amount}</span>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Recent Payments" icon={<CreditCard className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1">
              {[
                { desc: 'Elena K. — Milestone 2', amount: '-$1,500', date: 'Apr 10', status: 'completed' },
                { desc: 'Clara W. — SEO Audit Final', amount: '-$600', date: 'Apr 5', status: 'completed' },
                { desc: 'Escrow — Mobile App MVP', amount: '-$8,500', date: 'Apr 3', status: 'held' },
                { desc: 'Marcus D. — Logo Package', amount: '-$1,200', date: 'Apr 1', status: 'pending' },
              ].map((t, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded-xl border text-[9px] hover:bg-muted/20 cursor-pointer" onClick={() => openDetail('payment', t.desc, `${t.amount} · ${t.date}`)}>
                  <div className="flex-1"><div className="font-medium">{t.desc}</div><div className="text-muted-foreground">{t.date}</div></div>
                  <span className="font-bold text-muted-foreground">{t.amount}</span>
                  <StatusBadge status={t.status === 'completed' ? 'healthy' : t.status === 'held' ? 'caution' : 'pending'} label={t.status === 'completed' ? 'Paid' : t.status === 'held' ? 'Escrow' : 'Pending'} />
                </div>
              ))}
            </div>
          </SectionCard>
        </div>
      )}

      {/* ═══ BOOKINGS ═══ */}
      {tab === 'bookings' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Upcoming" value="3" />
            <KPICard label="This Week" value="2" />
            <KPICard label="Completed" value="8" />
            <KPICard label="Total Spend" value="$4,200" />
          </KPIBand>
          <div className="space-y-1.5">
            {[
              { title: 'Strategy Call — Elena K.', time: 'Today, 3:00 PM', duration: '45 min', status: 'upcoming' },
              { title: 'Design Review — Marcus D.', time: 'Tomorrow, 10:00 AM', duration: '30 min', status: 'upcoming' },
              { title: 'Sprint Planning — James R.', time: 'Apr 18, 2:00 PM', duration: '1 hr', status: 'upcoming' },
              { title: 'Content Kickoff — Aisha M.', time: 'Apr 10, 11:00 AM', duration: '45 min', status: 'completed' },
            ].map((b, i) => (
              <div key={i} className="rounded-2xl border bg-card px-4 py-3 hover:shadow-sm transition-all cursor-pointer" onClick={() => openDetail('booking', b.title, `${b.time} · ${b.duration}`)}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2"><span className="text-[10px] font-semibold">{b.title}</span><StatusBadge status={b.status === 'upcoming' ? 'live' : 'healthy'} label={b.status === 'upcoming' ? 'Upcoming' : 'Done'} /></div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{b.time} · {b.duration}</div>
                  </div>
                  {b.status === 'upcoming' && <Button variant="outline" size="sm" className="h-6 text-[8px] rounded-xl">Join</Button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ TEAM ═══ */}
      {tab === 'team' && (
        <div className="space-y-3">
          <KPIBand>
            <KPICard label="Team Members" value="4" />
            <KPICard label="Active Roles" value="3" />
            <KPICard label="Pending Invites" value="1" />
            <KPICard label="Team Spend" value="$12,400" />
          </KPIBand>
          <SectionCard title="Team Members" icon={<Users className="h-3.5 w-3.5 text-accent" />} className="!rounded-2xl">
            <div className="space-y-1.5">
              {[
                { name: 'You', role: 'Owner', email: 'you@company.com', status: 'active' },
                { name: 'Sarah P.', role: 'Manager', email: 'sarah@company.com', status: 'active' },
                { name: 'Mike T.', role: 'Viewer', email: 'mike@company.com', status: 'active' },
                { name: 'Anna R.', role: 'Manager', email: 'anna@company.com', status: 'invited' },
              ].map(m => (
                <div key={m.name} className="flex items-center gap-3 p-2 rounded-xl border text-[9px]">
                  <Avatar className="h-7 w-7"><AvatarFallback className="text-[8px] bg-accent/10 text-accent">{m.name.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                  <div className="flex-1">
                    <div className="font-medium">{m.name}</div>
                    <div className="text-muted-foreground">{m.email}</div>
                  </div>
                  <Badge variant="secondary" className="text-[7px]">{m.role}</Badge>
                  <StatusBadge status={m.status === 'active' ? 'healthy' : 'pending'} label={m.status === 'active' ? 'Active' : 'Invited'} />
                </div>
              ))}
            </div>
          </SectionCard>
          <Button size="sm" className="h-7 text-[9px] gap-1 rounded-xl" onClick={() => toast.info('Invite sent')}><Plus className="h-3 w-3" />Invite Member</Button>
        </div>
      )}

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-3 flex items-center gap-2 safe-area-bottom">
        <div className="flex-1"><span className="text-[10px] font-semibold">Client Dashboard</span><div className="text-[8px] text-muted-foreground">$12,400 spent · 4 active</div></div>
        <Button size="sm" className="h-9 text-[10px] gap-1 rounded-xl px-4" onClick={() => setPostJobDrawer(true)}><Plus className="h-3.5 w-3.5" />Post Job</Button>
      </div>

      {/* Post Job Drawer */}
      <Sheet open={postJobDrawer} onOpenChange={setPostJobDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Post a Job</SheetTitle></SheetHeader>
          <div className="p-4 space-y-3">
            <div><label className="text-[9px] font-medium mb-1 block">Title</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. Website Redesign" /></div>
            <div><label className="text-[9px] font-medium mb-1 block">Description</label><textarea className="w-full h-20 rounded-xl border bg-background px-3 py-2 text-[9px] resize-none" placeholder="Describe your requirements..." /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className="text-[9px] font-medium mb-1 block">Budget</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="$0.00" /></div>
              <div><label className="text-[9px] font-medium mb-1 block">Timeline</label><input className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]" placeholder="e.g. 14 days" /></div>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Category</label>
              <select className="w-full h-7 rounded-xl border bg-background px-2 text-[9px]"><option>Select...</option><option>Development</option><option>Design</option><option>Marketing</option><option>Content</option></select>
            </div>
            <div><label className="text-[9px] font-medium mb-1 block">Attachments</label><div className="rounded-xl border-2 border-dashed p-4 text-center"><Upload className="h-4 w-4 text-muted-foreground mx-auto mb-1" /><div className="text-[8px] text-muted-foreground">Drop files or click to upload</div></div></div>
            <div className="flex gap-2 pt-2 border-t">
              <Button variant="outline" size="sm" className="h-7 text-[10px] flex-1 rounded-xl" onClick={() => setPostJobDrawer(false)}>Cancel</Button>
              <Button size="sm" className="h-7 text-[10px] flex-1 gap-1 rounded-xl" onClick={() => { setPostJobDrawer(false); toast.success('Job posted!'); }}><Briefcase className="h-3 w-3" />Post Job</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Detail Drawer */}
      <Sheet open={detailDrawer} onOpenChange={setDetailDrawer}>
        <SheetContent className="w-[440px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Detail Inspector</SheetTitle></SheetHeader>
          {detailItem && (
            <div className="p-4 space-y-3">
              <Badge variant="secondary" className="text-[7px] capitalize">{detailItem.type}</Badge>
              <h3 className="text-[12px] font-bold">{detailItem.title}</h3>
              <p className="text-[9px] text-muted-foreground">{detailItem.detail}</p>
              <div className="flex gap-2 pt-2 border-t">
                <Button variant="outline" size="sm" className="h-7 text-[9px] flex-1 rounded-xl" onClick={() => setDetailDrawer(false)}>Close</Button>
                <Button size="sm" className="h-7 text-[9px] flex-1 gap-1 rounded-xl" onClick={() => { setDetailDrawer(false); toast.success('Action taken!'); }}><CheckCircle2 className="h-3 w-3" />Take Action</Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Compare Drawer */}
      <Sheet open={compareOpen} onOpenChange={setCompareOpen}>
        <SheetContent className="w-[600px] overflow-y-auto p-0">
          <SheetHeader className="p-4 border-b"><SheetTitle className="text-sm">Compare Proposals</SheetTitle></SheetHeader>
          <div className="p-4">
            <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${compareIds.length}, 1fr)` }}>
              {compareIds.map(id => {
                const p = PROPOSALS.find(x => x.id === id);
                if (!p) return null;
                return (
                  <div key={id} className="rounded-2xl border bg-card p-3 space-y-2">
                    <div className="text-center">
                      <Avatar className="h-10 w-10 mx-auto"><AvatarFallback className="text-[10px] bg-accent/10 text-accent">{p.seller.split(' ').map(n => n[0]).join('')}</AvatarFallback></Avatar>
                      <div className="text-[10px] font-semibold mt-1">{p.seller}</div>
                      <div className="flex items-center justify-center gap-0.5"><Star className="h-3 w-3 text-accent fill-accent" /><span className="text-[9px]">{p.rating}</span></div>
                    </div>
                    <div className="space-y-1 text-[9px]">
                      <div className="flex justify-between"><span className="text-muted-foreground">Price</span><span className="font-bold">${p.price.toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span>{p.delivery}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Status</span><StatusBadge status={p.status === 'shortlisted' ? 'healthy' : 'caution'} label={p.status} /></div>
                    </div>
                    <Button size="sm" className="h-6 text-[8px] w-full rounded-xl" onClick={() => { setCompareOpen(false); toast.success(`Accepted ${p.seller}`); }}>Accept</Button>
                  </div>
                );
              })}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
};

export default ClientDashboardPage;
