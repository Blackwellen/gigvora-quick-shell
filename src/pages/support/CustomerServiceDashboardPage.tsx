import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  HeadphonesIcon, Inbox, Search, Clock, AlertTriangle, CheckCircle2, XCircle,
  Users, Eye, Flag, ArrowRight, Pin, Maximize2, Filter, Bookmark, RefreshCw,
  MessageSquare, UserCheck, Shield, Landmark, Gavel, ShieldAlert, ChevronDown,
  TrendingUp, BarChart3, Activity, FileText, Send, Paperclip, Copy,
  ExternalLink, MoreHorizontal, Smartphone, Star, Zap, ChevronRight,
  AlertOctagon, Radio, Hash, LayoutGrid, List, Timer, ThumbsUp, ThumbsDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/* ── Types ── */
interface Ticket {
  id: string; subject: string; requester: string; requesterAvatar: string;
  priority: 'critical' | 'high' | 'medium' | 'low'; status: 'open' | 'pending' | 'in-progress' | 'escalated' | 'resolved' | 'closed';
  category: string; assignee: string; created: string; lastReply: string;
  slaRisk: boolean; messages: number; linkedCases: string[];
}

interface Template { id: string; name: string; body: string; category: string; }

const TICKETS: Ticket[] = [
  { id: 'TKT-5001', subject: 'Payment failed during checkout — card declined', requester: 'Amara Osei', requesterAvatar: 'AO', priority: 'critical', status: 'open', category: 'Billing', assignee: 'Unassigned', created: '8m ago', lastReply: 'Awaiting', slaRisk: true, messages: 1, linkedCases: ['FIN-7720'] },
  { id: 'TKT-5002', subject: 'Cannot access account after MFA reset', requester: 'Jake Morrison', requesterAvatar: 'JM', priority: 'high', status: 'in-progress', category: 'Account', assignee: 'A. Lopez', created: '1h ago', lastReply: '30m ago', slaRisk: false, messages: 4, linkedCases: [] },
  { id: 'TKT-5003', subject: 'Freelancer did not deliver milestone — escrow hold', requester: 'Sana Patel', requesterAvatar: 'SP', priority: 'high', status: 'escalated', category: 'Dispute', assignee: 'R. Patel', created: '3h ago', lastReply: '1h ago', slaRisk: true, messages: 8, linkedCases: ['DSP-0334', 'ESC-1120'] },
  { id: 'TKT-5004', subject: 'Subscription renewed after cancellation', requester: 'Lin Wei', requesterAvatar: 'LW', priority: 'medium', status: 'pending', category: 'Billing', assignee: 'M. Chen', created: '5h ago', lastReply: '2h ago', slaRisk: false, messages: 3, linkedCases: ['INV-4401'] },
  { id: 'TKT-5005', subject: 'Reported user still active after policy violation', requester: 'Carlos Diaz', requesterAvatar: 'CD', priority: 'high', status: 'open', category: 'Trust & Safety', assignee: 'Unassigned', created: '25m ago', lastReply: 'Awaiting', slaRisk: true, messages: 2, linkedCases: ['MOD-1092'] },
  { id: 'TKT-5006', subject: 'Invoice amount incorrect — overcharged $42', requester: 'Fatima Al-Hassan', requesterAvatar: 'FA', priority: 'medium', status: 'in-progress', category: 'Billing', assignee: 'S. Kim', created: '6h ago', lastReply: '45m ago', slaRisk: false, messages: 5, linkedCases: [] },
  { id: 'TKT-5007', subject: 'Job posting removed without explanation', requester: 'David Kim', requesterAvatar: 'DK', priority: 'low', status: 'resolved', category: 'Content', assignee: 'A. Lopez', created: '1d ago', lastReply: '4h ago', slaRisk: false, messages: 6, linkedCases: [] },
  { id: 'TKT-5008', subject: 'Payout delayed — 7 business days overdue', requester: 'Priya Sharma', requesterAvatar: 'PS', priority: 'critical', status: 'escalated', category: 'Finance', assignee: 'S. Kim', created: '2d ago', lastReply: '3h ago', slaRisk: true, messages: 11, linkedCases: ['FIN-8801', 'PAY-3302'] },
];

const TEMPLATES: Template[] = [
  { id: 't1', name: 'Payment Issue — Investigation', body: 'Hi {{name}}, thank you for reaching out. We\'re investigating the payment issue and will update you within 24 hours. Reference: {{ticket_id}}.', category: 'Billing' },
  { id: 't2', name: 'Account Recovery — MFA', body: 'Hi {{name}}, we can help you regain access. Please verify your identity by providing the email address and last 4 digits of your payment method on file.', category: 'Account' },
  { id: 't3', name: 'Escalation Notice', body: 'Hi {{name}}, your case has been escalated to our specialized team. A senior advisor will review within 4 hours. We apologize for the inconvenience.', category: 'General' },
  { id: 't4', name: 'Resolution Confirmation', body: 'Hi {{name}}, your issue ({{ticket_id}}) has been resolved. If you have further questions, please reply to this message. Thank you for your patience.', category: 'General' },
  { id: 't5', name: 'Refund Processed', body: 'Hi {{name}}, a refund of {{amount}} has been processed to your original payment method. Please allow 5-10 business days for the funds to appear.', category: 'Billing' },
];

const VOLUME_DATA = Array.from({ length: 14 }, (_, i) => ({ day: `Day ${i + 1}`, tickets: Math.floor(Math.random() * 40) + 20, resolved: Math.floor(Math.random() * 35) + 15 }));

const prioColor = (p: string) => p === 'critical' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))] border-[hsl(var(--state-blocked))]/30' : p === 'high' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))] border-[hsl(var(--gigvora-amber))]/30' : p === 'medium' ? 'bg-accent/10 text-accent border-accent/30' : 'bg-muted text-muted-foreground border-muted';
const statusColor = (s: string) => s === 'open' ? 'bg-accent/10 text-accent' : s === 'pending' ? 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]' : s === 'in-progress' ? 'bg-primary/10 text-primary' : s === 'escalated' ? 'bg-[hsl(var(--state-blocked))]/10 text-[hsl(var(--state-blocked))]' : s === 'resolved' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-muted text-muted-foreground';

const CustomerServiceDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('queue');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [ticketDrawer, setTicketDrawer] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const openTicket = (t: Ticket) => { setSelectedTicket(t); setTicketDrawer(true); };

  const filteredTickets = TICKETS.filter(t => {
    if (filterStatus !== 'all' && t.status !== filterStatus) return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery && !t.subject.toLowerCase().includes(searchQuery.toLowerCase()) && !t.id.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Environment Ribbon */}
      <div className="flex items-center gap-2 px-4 py-1 text-[8px] font-mono border-b bg-[hsl(var(--state-blocked))]/5 text-[hsl(var(--state-blocked))]">
        <Radio className="h-2.5 w-2.5 animate-pulse" /><span className="uppercase font-bold">Production</span><span className="text-muted-foreground">·</span><span className="text-muted-foreground">Customer Service Console v3.1</span>
        <div className="flex-1" />
        <Badge variant="secondary" className="text-[6px] gap-0.5"><HeadphonesIcon className="h-2 w-2" />CS Agent</Badge>
        <Badge variant="secondary" className="text-[6px] gap-0.5"><Clock className="h-2 w-2" />Shift: 6h 12m</Badge>
      </div>

      <div className="max-w-[1400px] mx-auto px-4 lg:px-8 py-4">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-2xl bg-accent/10 flex items-center justify-center"><HeadphonesIcon className="h-5 w-5 text-accent" /></div>
          <div className="flex-1">
            <h1 className="text-lg font-bold flex items-center gap-2">Customer Service Dashboard</h1>
            <p className="text-[9px] text-muted-foreground">Ticket queues, resolution operations, and service analytics</p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="outline" size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Opening new ticket form')}><Inbox className="h-3 w-3" />New Ticket</Button>
            <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-8 text-[9px] rounded-xl gap-1"><Shield className="h-3 w-3" />Admin Shell</Button></Link>
          </div>
        </div>

        {/* KPI Band */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-2 mb-4">
          {[
            { label: 'Open Tickets', value: '34', delta: '+6 today', icon: Inbox, state: 'caution' },
            { label: 'SLA At Risk', value: '4', delta: '2 critical', icon: AlertTriangle, state: 'blocked' },
            { label: 'Avg Resolution', value: '3.2h', delta: '-22% this week', icon: Timer, state: 'healthy' },
            { label: 'CSAT Score', value: '4.6', delta: '↑ 0.3 MoM', icon: Star, state: 'healthy' },
            { label: 'First Response', value: '8m', delta: 'Target: <15m', icon: Zap, state: 'healthy' },
            { label: 'Escalation Rate', value: '12%', delta: '↓ 3% MoM', icon: TrendingUp, state: 'healthy' },
          ].map(k => (
            <div key={k.label} className="rounded-2xl border bg-card p-3 hover:shadow-sm transition-shadow">
              <div className="flex items-center gap-1 text-[8px] text-muted-foreground mb-1"><k.icon className="h-3 w-3" />{k.label}</div>
              <div className="text-lg font-bold">{k.value}</div>
              <div className={cn('text-[8px]', k.state === 'healthy' ? 'text-[hsl(var(--state-healthy))]' : k.state === 'blocked' ? 'text-[hsl(var(--state-blocked))]' : 'text-[hsl(var(--gigvora-amber))]')}>{k.delta}</div>
            </div>
          ))}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4 flex-wrap">
            <TabsTrigger value="queue" className="text-[9px] gap-1"><Inbox className="h-3 w-3" />Ticket Queue</TabsTrigger>
            <TabsTrigger value="timeline" className="text-[9px] gap-1"><Activity className="h-3 w-3" />User Timeline</TabsTrigger>
            <TabsTrigger value="templates" className="text-[9px] gap-1"><FileText className="h-3 w-3" />Templates</TabsTrigger>
            <TabsTrigger value="escalation" className="text-[9px] gap-1"><AlertTriangle className="h-3 w-3" />Escalation</TabsTrigger>
            <TabsTrigger value="handoffs" className="text-[9px] gap-1"><ArrowRight className="h-3 w-3" />Handoffs</TabsTrigger>
            <TabsTrigger value="qa" className="text-[9px] gap-1"><CheckCircle2 className="h-3 w-3" />QA / Review</TabsTrigger>
            <TabsTrigger value="analytics" className="text-[9px] gap-1"><BarChart3 className="h-3 w-3" />Analytics</TabsTrigger>
            <TabsTrigger value="mobile" className="text-[9px] gap-1"><Smartphone className="h-3 w-3" />Mobile</TabsTrigger>
          </TabsList>

          {/* ═══ TICKET QUEUE ═══ */}
          <TabsContent value="queue">
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <div className="relative flex-1 max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search tickets..." className="pl-8 h-8 text-[9px] rounded-xl" />
              </div>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Status</option>
                <option value="open">Open</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="escalated">Escalated</option>
                <option value="resolved">Resolved</option>
              </select>
              <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className="h-8 px-2 text-[9px] rounded-xl border bg-card">
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
              <Button variant="ghost" size="sm" className="h-8 text-[8px] rounded-xl gap-1" onClick={() => { setFilterStatus('all'); setFilterPriority('all'); setSearchQuery(''); }}><RefreshCw className="h-2.5 w-2.5" />Reset</Button>
              <Button variant="ghost" size="sm" className="h-8 text-[8px] rounded-xl gap-1"><Bookmark className="h-2.5 w-2.5" />Save View</Button>
              <Badge variant="outline" className="text-[7px] gap-1 ml-auto"><Clock className="h-2.5 w-2.5" />Updated 5s ago</Badge>
            </div>

            {/* SLA Warning Banner */}
            {TICKETS.filter(t => t.slaRisk).length > 0 && (
              <div className="rounded-xl border border-[hsl(var(--state-blocked))]/30 bg-[hsl(var(--state-blocked))]/5 p-2.5 mb-3 flex items-center gap-2 text-[8px]">
                <AlertOctagon className="h-4 w-4 text-[hsl(var(--state-blocked))] shrink-0" />
                <span><strong>{TICKETS.filter(t => t.slaRisk).length} tickets</strong> at SLA breach risk. Immediate attention required.</span>
                <Button variant="destructive" size="sm" className="h-6 text-[7px] rounded-lg ml-auto" onClick={() => { setFilterPriority('all'); setFilterStatus('all'); toast.info('Showing SLA-risk tickets'); }}>View At-Risk</Button>
              </div>
            )}

            {/* Queue Table */}
            <div className="rounded-2xl border bg-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-[9px]">
                  <thead><tr className="border-b bg-muted/20">
                    <th className="px-3 py-2 text-left font-semibold">ID</th>
                    <th className="px-2 py-2 text-left font-semibold">Subject</th>
                    <th className="px-2 py-2 text-left font-semibold">Requester</th>
                    <th className="px-2 py-2 text-left font-semibold">Priority</th>
                    <th className="px-2 py-2 text-left font-semibold">Status</th>
                    <th className="px-2 py-2 text-left font-semibold">Assignee</th>
                    <th className="px-2 py-2 text-left font-semibold">Age</th>
                    <th className="px-2 py-2 text-left font-semibold">SLA</th>
                    <th className="px-2 py-2 text-left font-semibold">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y">
                    {filteredTickets.map(t => (
                      <tr key={t.id} onClick={() => openTicket(t)} className={cn('hover:bg-muted/10 transition-colors cursor-pointer', t.slaRisk && 'bg-[hsl(var(--state-blocked))]/[0.02]')}>
                        <td className="px-3 py-2 font-mono font-semibold">{t.id}</td>
                        <td className="px-2 py-2 max-w-[220px]">
                          <div className="truncate">{t.subject}</div>
                          {t.linkedCases.length > 0 && <div className="flex gap-0.5 mt-0.5">{t.linkedCases.map(c => <Badge key={c} variant="outline" className="text-[6px]">{c}</Badge>)}</div>}
                        </td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1.5">
                            <div className="h-5 w-5 rounded-full bg-accent/10 flex items-center justify-center text-[6px] font-bold text-accent">{t.requesterAvatar}</div>
                            <span>{t.requester}</span>
                          </div>
                        </td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', prioColor(t.priority))}>{t.priority}</Badge></td>
                        <td className="px-2 py-2"><Badge variant="secondary" className={cn('text-[6px]', statusColor(t.status))}>{t.status}</Badge></td>
                        <td className="px-2 py-2 text-muted-foreground">{t.assignee}</td>
                        <td className="px-2 py-2 text-muted-foreground">{t.created}</td>
                        <td className="px-2 py-2">{t.slaRisk ? <Badge variant="destructive" className="text-[6px] animate-pulse">⚠ Risk</Badge> : <Badge variant="secondary" className="text-[6px] text-[hsl(var(--state-healthy))]">OK</Badge>}</td>
                        <td className="px-2 py-2">
                          <div className="flex items-center gap-1">
                            <button onClick={e => { e.stopPropagation(); toast.success(`Assigned ${t.id} to you`); }} className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground"><UserCheck className="h-2.5 w-2.5" /></button>
                            <button onClick={e => { e.stopPropagation(); toast.info('Escalating ' + t.id); }} className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground"><AlertTriangle className="h-2.5 w-2.5" /></button>
                            <button onClick={e => { e.stopPropagation(); toast.info('Quick reply'); }} className="p-0.5 rounded hover:bg-muted/30 text-muted-foreground"><MessageSquare className="h-2.5 w-2.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-3 py-2 border-t flex items-center justify-between text-[8px] text-muted-foreground">
                <span>Showing {filteredTickets.length} of {TICKETS.length} tickets</span>
                <div className="flex items-center gap-1"><MessageSquare className="h-2.5 w-2.5" />{TICKETS.reduce((s, t) => s + t.messages, 0)} total messages</div>
              </div>
            </div>
          </TabsContent>

          {/* ═══ USER TIMELINE ═══ */}
          <TabsContent value="timeline">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><Activity className="h-3 w-3 text-accent" />User Activity Timeline — Amara Osei</div>
                <div className="space-y-2">
                  {[
                    { action: 'Submitted ticket TKT-5001', type: 'ticket', time: '8m ago', detail: 'Payment failed during checkout' },
                    { action: 'Viewed invoice INV-4398', type: 'billing', time: '15m ago', detail: 'Invoice for Pro subscription' },
                    { action: 'Attempted payment 3x', type: 'alert', time: '20m ago', detail: 'Card ending 4821 declined' },
                    { action: 'Updated payment method', type: 'account', time: '1h ago', detail: 'Added Visa ending 9012' },
                    { action: 'Contacted support via chat', type: 'support', time: '2h ago', detail: 'General inquiry about billing' },
                    { action: 'Purchased Pro plan', type: 'billing', time: '3d ago', detail: '$29/month subscription' },
                    { action: 'Created account', type: 'account', time: '14d ago', detail: 'Email signup' },
                  ].map((e, i) => (
                    <div key={i} className="flex gap-3 text-[8px]">
                      <div className="flex flex-col items-center">
                        <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', e.type === 'alert' ? 'bg-[hsl(var(--state-blocked))]' : e.type === 'ticket' ? 'bg-accent' : e.type === 'billing' ? 'bg-[hsl(var(--gigvora-amber))]' : 'bg-muted-foreground/40')} />
                        {i < 6 && <div className="w-px flex-1 bg-border mt-1" />}
                      </div>
                      <div className="flex-1 pb-3">
                        <div className="font-semibold">{e.action}</div>
                        <div className="text-muted-foreground">{e.detail}</div>
                        <div className="text-[7px] text-muted-foreground mt-0.5">{e.time}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">User Profile</div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-10 w-10 rounded-full bg-accent/10 flex items-center justify-center text-sm font-bold text-accent">AO</div>
                    <div><div className="text-[10px] font-semibold">Amara Osei</div><div className="text-[8px] text-muted-foreground">Pro subscriber · 14 days</div></div>
                  </div>
                  <div className="space-y-1 text-[8px]">
                    {[{ l: 'Email', v: 'amara@example.com' }, { l: 'Plan', v: 'Pro ($29/mo)' }, { l: 'Tickets', v: '3 total (1 open)' }, { l: 'CSAT', v: '4.8 avg' }, { l: 'Risk', v: 'Low' }].map(m => (
                      <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-semibold">{m.v}</span></div>
                    ))}
                  </div>
                </div>
                <div className="rounded-2xl border bg-card p-3">
                  <div className="text-[9px] font-semibold mb-2">Quick Actions</div>
                  <div className="space-y-1">
                    {[
                      { label: 'View Profile', icon: Users, action: () => toast.info('Opening profile') },
                      { label: 'View Billing', icon: Landmark, action: () => toast.info('Opening billing') },
                      { label: 'Send Message', icon: MessageSquare, action: () => toast.info('Opening messenger') },
                      { label: 'View Orders', icon: FileText, action: () => toast.info('Opening orders') },
                    ].map(a => (
                      <button key={a.label} onClick={a.action} className="flex items-center gap-2 w-full px-2 py-1.5 rounded-xl text-[8px] hover:bg-muted/20 transition-colors">
                        <a.icon className="h-3 w-3 text-muted-foreground" />{a.label}<ArrowRight className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══ TEMPLATES ═══ */}
          <TabsContent value="templates">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {TEMPLATES.map(t => (
                <div key={t.id} className="rounded-2xl border bg-card p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-accent" />
                    <span className="text-[10px] font-semibold flex-1">{t.name}</span>
                    <Badge variant="secondary" className="text-[7px]">{t.category}</Badge>
                  </div>
                  <div className="text-[8px] text-muted-foreground bg-muted/20 rounded-xl p-2.5 mb-2 leading-relaxed">{t.body}</div>
                  <div className="flex gap-1.5">
                    <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => { navigator.clipboard.writeText(t.body); toast.success('Copied'); }}><Copy className="h-2.5 w-2.5" />Copy</Button>
                    <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => { setReplyText(t.body); setActiveTab('queue'); toast.success('Template loaded'); }}><Send className="h-2.5 w-2.5" />Use in Reply</Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* ═══ ESCALATION ═══ */}
          <TabsContent value="escalation">
            <div className="space-y-3">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><AlertTriangle className="h-3 w-3 text-[hsl(var(--state-blocked))]" />Active Escalations</div>
                <div className="space-y-2">
                  {TICKETS.filter(t => t.status === 'escalated').map(t => (
                    <div key={t.id} className="rounded-xl border border-[hsl(var(--state-blocked))]/20 p-3 hover:shadow-sm transition-shadow">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] font-mono font-bold">{t.id}</span>
                        <Badge variant="destructive" className="text-[6px]">Escalated</Badge>
                        <Badge variant="secondary" className={cn('text-[6px]', prioColor(t.priority))}>{t.priority}</Badge>
                        {t.slaRisk && <Badge variant="destructive" className="text-[6px] animate-pulse">SLA Risk</Badge>}
                        <span className="text-[8px] text-muted-foreground ml-auto">{t.created}</span>
                      </div>
                      <div className="text-[10px] font-semibold mb-1">{t.subject}</div>
                      <div className="text-[8px] text-muted-foreground mb-2">Assigned to: {t.assignee} · {t.messages} messages · Linked: {t.linkedCases.join(', ') || 'none'}</div>
                      <div className="flex gap-1.5">
                        <Button size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => openTicket(t)}><Eye className="h-2.5 w-2.5" />Inspect</Button>
                        <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Referring to finance')}><Landmark className="h-2.5 w-2.5" />Refer Finance</Button>
                        <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Requesting arbitration')}><Gavel className="h-2.5 w-2.5" />Arbitration</Button>
                        <Button variant="outline" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Requesting evidence')}><Paperclip className="h-2.5 w-2.5" />Evidence</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-2">Escalation Paths</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  {[
                    { target: 'Finance Team', icon: Landmark, desc: 'Refunds, holds, billing anomalies', route: '/admin/finance' },
                    { target: 'Trust & Safety', icon: ShieldAlert, desc: 'Policy violations, abuse reports', route: '/admin/trust' },
                    { target: 'Dispute Manager', icon: Gavel, desc: 'Arbitration, escrow disputes', route: '/disputes' },
                  ].map(p => (
                    <Link key={p.target} to={p.route} className="rounded-xl border p-3 hover:bg-muted/10 transition-colors">
                      <p.icon className="h-4 w-4 text-accent mb-1" />
                      <div className="text-[9px] font-semibold">{p.target}</div>
                      <div className="text-[7px] text-muted-foreground">{p.desc}</div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══ HANDOFFS ═══ */}
          <TabsContent value="handoffs">
            <div className="rounded-2xl border bg-card p-4 mb-4">
              <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><ArrowRight className="h-3 w-3 text-accent" />Cross-Domain Case Handoffs</div>
              <div className="space-y-2">
                {[
                  { from: 'TKT-5001', to: 'FIN-7720', target: 'Finance', reason: 'Payment investigation requires finance authority', status: 'pending' },
                  { from: 'TKT-5003', to: 'DSP-0334', target: 'Disputes', reason: 'Milestone escrow dispute requires arbitration', status: 'active' },
                  { from: 'TKT-5005', to: 'MOD-1092', target: 'Moderation', reason: 'User report requires content review', status: 'pending' },
                  { from: 'TKT-5008', to: 'PAY-3302', target: 'Payouts', reason: 'Overdue payout requires manual release', status: 'active' },
                ].map((h, i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border hover:bg-muted/10 transition-colors text-[8px]">
                    <span className="font-mono font-semibold text-accent">{h.from}</span>
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                    <span className="font-mono font-semibold">{h.to}</span>
                    <Badge variant="secondary" className="text-[6px]">{h.target}</Badge>
                    <span className="flex-1 text-muted-foreground truncate">{h.reason}</span>
                    <Badge variant="secondary" className={cn('text-[6px]', h.status === 'active' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>{h.status}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* ═══ QA / REVIEW ═══ */}
          <TabsContent value="qa">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3 flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-[hsl(var(--state-healthy))]" />Recently Resolved — QA Queue</div>
                <div className="space-y-2">
                  {TICKETS.filter(t => t.status === 'resolved').map(t => (
                    <div key={t.id} className="rounded-xl border p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[9px] font-mono font-bold">{t.id}</span>
                        <Badge variant="secondary" className="text-[6px] bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]">Resolved</Badge>
                        <span className="text-[8px] text-muted-foreground ml-auto">{t.lastReply}</span>
                      </div>
                      <div className="text-[9px] mb-2">{t.subject}</div>
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-5 text-[7px] rounded-lg gap-0.5" onClick={() => toast.success('Approved')}><ThumbsUp className="h-2.5 w-2.5" />Approve</Button>
                        <Button size="sm" variant="outline" className="h-5 text-[7px] rounded-lg gap-0.5" onClick={() => toast.info('Reopening')}><ThumbsDown className="h-2.5 w-2.5" />Reopen</Button>
                        <Button size="sm" variant="ghost" className="h-5 text-[7px] rounded-lg gap-0.5" onClick={() => openTicket(t)}><Eye className="h-2.5 w-2.5" />Review</Button>
                      </div>
                    </div>
                  ))}
                  {TICKETS.filter(t => t.status === 'resolved').length === 0 && (
                    <div className="text-center py-6 text-[9px] text-muted-foreground">No resolved tickets in QA queue</div>
                  )}
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Quality Metrics</div>
                <div className="space-y-2">
                  {[
                    { metric: 'First Contact Resolution', value: '68%', target: '75%', progress: 68 },
                    { metric: 'Customer Satisfaction', value: '4.6/5', target: '4.5/5', progress: 92 },
                    { metric: 'Response Quality Score', value: '87%', target: '85%', progress: 87 },
                    { metric: 'Escalation Avoidance', value: '88%', target: '90%', progress: 88 },
                  ].map(m => (
                    <div key={m.metric} className="rounded-xl border p-2.5">
                      <div className="flex justify-between text-[8px] mb-1">
                        <span className="font-semibold">{m.metric}</span>
                        <span>{m.value} <span className="text-muted-foreground">/ {m.target}</span></span>
                      </div>
                      <Progress value={m.progress} className="h-1.5" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══ ANALYTICS ═══ */}
          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Ticket Volume — 14 Day Trend</div>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={VOLUME_DATA}>
                      <XAxis dataKey="day" tick={{ fontSize: 8 }} />
                      <YAxis tick={{ fontSize: 8 }} />
                      <Tooltip contentStyle={{ fontSize: 9 }} />
                      <Area type="monotone" dataKey="tickets" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.15} name="Opened" />
                      <Area type="monotone" dataKey="resolved" stroke="hsl(var(--state-healthy))" fill="hsl(var(--state-healthy))" fillOpacity={0.15} name="Resolved" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border bg-card p-4">
                <div className="text-[9px] font-semibold mb-3">Category Breakdown</div>
                <div className="space-y-2">
                  {[
                    { cat: 'Billing', count: 3, pct: 37 },
                    { cat: 'Account', count: 1, pct: 12 },
                    { cat: 'Dispute', count: 1, pct: 12 },
                    { cat: 'Trust & Safety', count: 1, pct: 12 },
                    { cat: 'Finance', count: 1, pct: 12 },
                    { cat: 'Content', count: 1, pct: 12 },
                  ].map(c => (
                    <div key={c.cat} className="flex items-center gap-2 text-[8px]">
                      <span className="w-24 font-semibold">{c.cat}</span>
                      <Progress value={c.pct} className="flex-1 h-2" />
                      <span className="text-muted-foreground w-8 text-right">{c.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* ═══ MOBILE TRIAGE ═══ */}
          <TabsContent value="mobile">
            <div className="rounded-2xl border bg-card p-4 mb-3">
              <div className="text-[9px] font-semibold mb-2 flex items-center gap-1"><Smartphone className="h-3 w-3 text-accent" />Mobile Advisor Triage</div>
              <div className="text-[8px] text-muted-foreground mb-3">Simplified view for on-the-go triage. Critical and high priority tickets only.</div>
              <div className="space-y-2">
                {TICKETS.filter(t => t.priority === 'critical' || t.priority === 'high').map(t => (
                  <button key={t.id} onClick={() => openTicket(t)} className="w-full rounded-xl border p-3 text-left hover:bg-muted/10 transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className={cn('text-[6px]', prioColor(t.priority))}>{t.priority}</Badge>
                      <span className="text-[9px] font-mono font-bold">{t.id}</span>
                      {t.slaRisk && <Badge variant="destructive" className="text-[6px]">SLA</Badge>}
                      <span className="text-[8px] text-muted-foreground ml-auto">{t.created}</span>
                    </div>
                    <div className="text-[9px] font-semibold">{t.subject}</div>
                    <div className="text-[8px] text-muted-foreground mt-0.5">{t.requester} · {t.assignee}</div>
                  </button>
                ))}
              </div>
            </div>
            <div className="rounded-xl border bg-[hsl(var(--gigvora-amber))]/5 border-[hsl(var(--gigvora-amber))]/30 p-3 text-[8px] flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0" />
              <span>Full case management requires desktop. Mobile triage supports viewing and basic assignment only.</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ Ticket Detail Drawer ═══ */}
      <Sheet open={ticketDrawer} onOpenChange={setTicketDrawer}>
        <SheetContent className="w-[460px] overflow-y-auto">
          <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-accent" />Ticket Detail</SheetTitle></SheetHeader>
          {selectedTicket && (
            <div className="mt-4 space-y-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-lg font-mono font-bold">{selectedTicket.id}</span>
                <Badge variant="secondary" className={cn('text-[7px]', prioColor(selectedTicket.priority))}>{selectedTicket.priority}</Badge>
                <Badge variant="secondary" className={cn('text-[7px]', statusColor(selectedTicket.status))}>{selectedTicket.status}</Badge>
                {selectedTicket.slaRisk && <Badge variant="destructive" className="text-[7px] animate-pulse">SLA Risk</Badge>}
              </div>
              <div className="text-[11px] font-semibold">{selectedTicket.subject}</div>

              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-accent/10 flex items-center justify-center text-[9px] font-bold text-accent">{selectedTicket.requesterAvatar}</div>
                <div><div className="text-[9px] font-semibold">{selectedTicket.requester}</div><div className="text-[7px] text-muted-foreground">Requester</div></div>
              </div>

              <div className="rounded-xl border p-3 space-y-1.5 text-[8px]">
                {[
                  { l: 'Category', v: selectedTicket.category },
                  { l: 'Assignee', v: selectedTicket.assignee },
                  { l: 'Created', v: selectedTicket.created },
                  { l: 'Last Reply', v: selectedTicket.lastReply },
                  { l: 'Messages', v: String(selectedTicket.messages) },
                  { l: 'Linked Cases', v: selectedTicket.linkedCases.join(', ') || 'None' },
                ].map(m => (
                  <div key={m.l} className="flex justify-between"><span className="text-muted-foreground">{m.l}</span><span className="font-semibold">{m.v}</span></div>
                ))}
              </div>

              {/* Conversation Thread */}
              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-2">Conversation</div>
                <div className="space-y-2">
                  <div className="rounded-lg bg-muted/20 p-2.5 text-[8px]">
                    <div className="flex items-center gap-1.5 mb-1"><div className="h-4 w-4 rounded-full bg-accent/10 flex items-center justify-center text-[5px] font-bold text-accent">{selectedTicket.requesterAvatar}</div><span className="font-semibold">{selectedTicket.requester}</span><span className="text-muted-foreground ml-auto">{selectedTicket.created}</span></div>
                    <div className="text-muted-foreground">I'm having trouble with {selectedTicket.subject.toLowerCase()}. Please help urgently.</div>
                  </div>
                  {selectedTicket.messages > 1 && (
                    <div className="rounded-lg bg-accent/5 p-2.5 text-[8px]">
                      <div className="flex items-center gap-1.5 mb-1"><div className="h-4 w-4 rounded-full bg-accent flex items-center justify-center text-[5px] font-bold text-white">CS</div><span className="font-semibold">Support Agent</span><span className="text-muted-foreground ml-auto">Reply</span></div>
                      <div className="text-muted-foreground">Thank you for contacting us. We're investigating this issue and will update you shortly.</div>
                    </div>
                  )}
                </div>
              </div>

              {/* Reply Box */}
              <div className="rounded-xl border p-3">
                <div className="text-[9px] font-semibold mb-1.5">Reply</div>
                <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Type your reply..." className="text-[9px] min-h-[60px] rounded-xl mb-2" />
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-7 text-[8px] rounded-xl gap-1" onClick={() => { toast.success('Reply sent'); setReplyText(''); }}><Send className="h-3 w-3" />Send Reply</Button>
                  <Button variant="outline" size="sm" className="h-7 text-[8px] rounded-xl gap-1"><Paperclip className="h-3 w-3" />Attach</Button>
                  <Button variant="ghost" size="sm" className="h-7 text-[8px] rounded-xl gap-1" onClick={() => setActiveTab('templates')}><FileText className="h-3 w-3" />Template</Button>
                </div>
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button size="sm" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Assigned to you')}><UserCheck className="h-3 w-3" />Assign to Me</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Escalating')}><AlertTriangle className="h-3 w-3" />Escalate</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.success('Resolved')}><CheckCircle2 className="h-3 w-3" />Resolve</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Closing')}><XCircle className="h-3 w-3" />Close</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Refer to Finance')}><Landmark className="h-3 w-3" />Finance</Button>
                <Button size="sm" variant="outline" className="h-8 text-[9px] rounded-xl gap-1" onClick={() => toast.info('Refer to Moderation')}><ShieldAlert className="h-3 w-3" />Moderation</Button>
              </div>

              {/* Cross-domain links */}
              <div className="flex gap-1.5 flex-wrap">
                <Link to="/admin/shell"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Shield className="h-2.5 w-2.5" />Admin Shell</Button></Link>
                <Link to="/admin/finance"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Landmark className="h-2.5 w-2.5" />Finance</Button></Link>
                <Link to="/disputes"><Button variant="ghost" size="sm" className="h-6 text-[7px] rounded-lg gap-0.5"><Gavel className="h-2.5 w-2.5" />Disputes</Button></Link>
              </div>

              <div className="rounded-lg border border-[hsl(var(--state-blocked))]/20 bg-[hsl(var(--state-blocked))]/5 p-2 text-[8px] flex items-center gap-2">
                <AlertTriangle className="h-3 w-3 text-[hsl(var(--state-blocked))] shrink-0" />
                <span>All actions are audited. Changes affect live user data.</span>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Mobile Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-card border-t shadow-lg p-2 flex items-center gap-2 safe-area-bottom">
        <button onClick={() => setActiveTab('queue')} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === 'queue' ? 'text-accent' : 'text-muted-foreground')}>
          <Inbox className="h-4 w-4" /><span className="text-[7px]">Queue</span>
        </button>
        <button onClick={() => setActiveTab('escalation')} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === 'escalation' ? 'text-accent' : 'text-muted-foreground')}>
          <AlertTriangle className="h-4 w-4" /><span className="text-[7px]">Escalate</span>
        </button>
        <button onClick={() => setActiveTab('templates')} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === 'templates' ? 'text-accent' : 'text-muted-foreground')}>
          <FileText className="h-4 w-4" /><span className="text-[7px]">Templates</span>
        </button>
        <button onClick={() => setActiveTab('analytics')} className={cn('flex-1 flex flex-col items-center gap-0.5 py-1 rounded-lg', activeTab === 'analytics' ? 'text-accent' : 'text-muted-foreground')}>
          <BarChart3 className="h-4 w-4" /><span className="text-[7px]">Stats</span>
        </button>
      </div>
    </div>
  );
};

export default CustomerServiceDashboardPage;
