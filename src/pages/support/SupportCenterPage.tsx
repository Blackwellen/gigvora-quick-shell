import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { DashboardLayout } from '@/components/shell/DashboardLayout';
import { SectionCard, KPICard, KPIBand } from '@/components/shell/EnterprisePrimitives';
import {
  Search, HelpCircle, MessageSquare, Plus, FileText, Send,
  BookOpen, ChevronRight, History, AlertTriangle, Clock,
  CheckCircle2, XCircle, LifeBuoy, Ticket, Phone, Mail,
  Globe, Shield, TrendingUp, Eye, ExternalLink, Star,
  Bookmark, MoreHorizontal, ArrowUpRight, Zap, Users,
  CircleDot, AlertCircle, RefreshCw, Ban,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRole } from '@/contexts/RoleContext';

// ── Types ──
type TicketStatus = 'open' | 'in_progress' | 'awaiting_reply' | 'resolved' | 'closed' | 'escalated';
type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
type ArticleCategory = 'getting_started' | 'billing' | 'account' | 'marketplace' | 'technical' | 'trust_safety';

interface Article {
  id: string; title: string; category: ArticleCategory; excerpt: string;
  views: number; helpful: number; updated: string; tags: string[];
}

interface TicketItem {
  id: string; subject: string; status: TicketStatus; priority: TicketPriority;
  category: string; created: string; updated: string; lastReply: string;
  assignee?: string; messages: number;
}

interface FAQ {
  id: string; question: string; answer: string; category: string; helpful: number;
}

// ── Mock Data ──
const ARTICLES: Article[] = [
  { id: 'A-001', title: 'Getting Started with Your Account', category: 'getting_started', excerpt: 'Learn how to set up your profile, configure preferences, and navigate the platform.', views: 12400, helpful: 890, updated: '2d ago', tags: ['onboarding', 'profile'] },
  { id: 'A-002', title: 'Understanding Billing & Subscriptions', category: 'billing', excerpt: 'How billing cycles work, upgrading plans, and managing payment methods.', views: 8900, helpful: 650, updated: '1w ago', tags: ['billing', 'payments'] },
  { id: 'A-003', title: 'Posting Jobs and Managing Applications', category: 'marketplace', excerpt: 'Step-by-step guide to creating job listings and reviewing candidate applications.', views: 6700, helpful: 420, updated: '3d ago', tags: ['jobs', 'hiring'] },
  { id: 'A-004', title: 'Security Best Practices', category: 'trust_safety', excerpt: 'Protect your account with two-factor authentication and security recommendations.', views: 5200, helpful: 380, updated: '5d ago', tags: ['security', '2fa'] },
  { id: 'A-005', title: 'Escrow & Payment Protection', category: 'billing', excerpt: 'How escrow works, milestone payments, and dispute resolution for projects.', views: 4800, helpful: 310, updated: '1w ago', tags: ['escrow', 'payments'] },
  { id: 'A-006', title: 'Account Recovery & Password Reset', category: 'account', excerpt: 'Steps to recover your account if locked out or if you forgot your password.', views: 9100, helpful: 720, updated: '4d ago', tags: ['recovery', 'password'] },
  { id: 'A-007', title: 'API Integration Guide', category: 'technical', excerpt: 'Connect your systems using our REST API with authentication and rate limiting.', views: 3200, helpful: 210, updated: '2w ago', tags: ['api', 'integration'] },
  { id: 'A-008', title: 'Reporting & Trust Safety Policies', category: 'trust_safety', excerpt: 'How to report violations, understand moderation actions, and appeal decisions.', views: 2800, helpful: 190, updated: '1w ago', tags: ['reporting', 'moderation'] },
];

const TICKETS: TicketItem[] = [
  { id: 'TK-4521', subject: 'Payment not received for completed milestone', status: 'in_progress', priority: 'high', category: 'Billing', created: '2d ago', updated: '4h ago', lastReply: 'Support Agent', messages: 5, assignee: 'Sarah M.' },
  { id: 'TK-4518', subject: 'Cannot access enterprise workspace after upgrade', status: 'escalated', priority: 'urgent', category: 'Account', created: '3d ago', updated: '1h ago', lastReply: 'Engineering', messages: 8, assignee: 'James K.' },
  { id: 'TK-4515', subject: 'How to export invoices in bulk?', status: 'resolved', priority: 'low', category: 'Billing', created: '1w ago', updated: '2d ago', lastReply: 'Support Agent', messages: 3, assignee: 'Priya G.' },
  { id: 'TK-4510', subject: 'Profile verification stuck in pending', status: 'awaiting_reply', priority: 'medium', category: 'Account', created: '5d ago', updated: '1d ago', lastReply: 'You', messages: 4, assignee: 'Marcus T.' },
  { id: 'TK-4502', subject: 'Request to delete old project data', status: 'closed', priority: 'low', category: 'Privacy', created: '2w ago', updated: '1w ago', lastReply: 'Support Agent', messages: 2, assignee: 'Lina P.' },
];

const FAQS: FAQ[] = [
  { id: 'F-1', question: 'How do I reset my password?', answer: 'Go to Settings → Security → Change Password. If locked out, use the "Forgot Password" link on the sign-in page.', category: 'Account', helpful: 1240 },
  { id: 'F-2', question: 'How does escrow payment work?', answer: 'Funds are held securely until project milestones are approved. Once the client approves delivery, funds are released to the professional.', category: 'Billing', helpful: 980 },
  { id: 'F-3', question: 'Can I change my subscription plan mid-cycle?', answer: 'Yes. Upgrades take effect immediately with prorated billing. Downgrades apply at the next billing cycle.', category: 'Billing', helpful: 870 },
  { id: 'F-4', question: 'How do I report a user or content?', answer: 'Click the three-dot menu on any profile, post, or listing and select "Report". Our Trust & Safety team reviews all reports within 24 hours.', category: 'Trust & Safety', helpful: 650 },
  { id: 'F-5', question: 'What happens when a dispute is filed?', answer: 'Both parties are notified and given 48 hours to provide evidence. A mediator reviews the case and issues a binding resolution.', category: 'Disputes', helpful: 540 },
  { id: 'F-6', question: 'How do I verify my professional profile?', answer: 'Upload government-issued ID and proof of credentials in Settings → Verification. Processing takes 1-3 business days.', category: 'Account', helpful: 720 },
];

const STATUS_COLORS: Record<TicketStatus, string> = {
  open: 'bg-primary/10 text-primary',
  in_progress: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  awaiting_reply: 'bg-accent/10 text-accent',
  resolved: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  closed: 'bg-muted text-muted-foreground',
  escalated: 'bg-destructive/10 text-destructive',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-primary/10 text-primary',
  high: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  urgent: 'bg-destructive/10 text-destructive',
};

const CATEGORY_COLORS: Record<ArticleCategory, string> = {
  getting_started: 'bg-primary/10 text-primary',
  billing: 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]',
  account: 'bg-accent/10 text-accent',
  marketplace: 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]',
  technical: 'bg-muted text-muted-foreground',
  trust_safety: 'bg-destructive/10 text-destructive',
};

const STATUS_ICONS: Record<TicketStatus, React.ElementType> = {
  open: CircleDot, in_progress: RefreshCw, awaiting_reply: Clock,
  resolved: CheckCircle2, closed: XCircle, escalated: AlertCircle,
};

// ── Ticket Drawer ──
const TicketDrawer: React.FC<{ ticket: TicketItem | null; open: boolean; onClose: () => void }> = ({ ticket, open, onClose }) => {
  if (!ticket) return null;
  const StatusIcon = STATUS_ICONS[ticket.status];
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[480px] overflow-y-auto">
        <SheetHeader><SheetTitle className="text-sm flex items-center gap-2"><Ticket className="h-4 w-4 text-accent" />Ticket Detail</SheetTitle></SheetHeader>
        <div className="mt-4 space-y-4">
          <div className="pb-3 border-b">
            <div className="flex items-center gap-1.5 mb-1">
              <Badge variant="secondary" className="text-[7px] font-mono">{ticket.id}</Badge>
              <Badge className={cn('text-[6px] border-0 capitalize gap-0.5', STATUS_COLORS[ticket.status])}><StatusIcon className="h-2 w-2" />{ticket.status.replace('_', ' ')}</Badge>
              <Badge className={cn('text-[6px] border-0 capitalize', PRIORITY_COLORS[ticket.priority])}>{ticket.priority}</Badge>
            </div>
            <div className="text-[12px] font-semibold">{ticket.subject}</div>
            <div className="text-[8px] text-muted-foreground mt-0.5">{ticket.category} · Created {ticket.created}</div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { l: 'Status', v: ticket.status.replace('_', ' '), icon: StatusIcon },
              { l: 'Priority', v: ticket.priority, icon: AlertTriangle },
              { l: 'Messages', v: String(ticket.messages), icon: MessageSquare },
              { l: 'Last Updated', v: ticket.updated, icon: Clock },
              { l: 'Assigned To', v: ticket.assignee || 'Unassigned', icon: Users },
              { l: 'Last Reply', v: ticket.lastReply, icon: Send },
            ].map(m => (
              <div key={m.l} className="rounded-md border p-2 flex items-start gap-1.5">
                <m.icon className="h-3 w-3 text-muted-foreground mt-0.5" />
                <div><div className="text-[7px] text-muted-foreground">{m.l}</div><div className="text-[9px] font-medium capitalize">{m.v}</div></div>
              </div>
            ))}
          </div>

          <div>
            <div className="text-[10px] font-semibold mb-1.5">Conversation</div>
            <div className="space-y-1.5">
              {[
                { from: 'You', time: ticket.created, msg: 'I completed the milestone but haven\'t received payment yet. Can you help?' },
                { from: ticket.assignee || 'Support', time: '1d ago', msg: 'Thank you for reaching out. I\'m looking into this now and will update you shortly.' },
                { from: 'You', time: '12h ago', msg: 'Any updates on this? The milestone was approved 5 days ago.' },
              ].slice(0, ticket.messages > 2 ? 3 : ticket.messages).map((m, i) => (
                <div key={i} className={cn('rounded-md p-2 text-[8px]', m.from === 'You' ? 'bg-primary/5 border-primary/20 border ml-4' : 'bg-muted/50 border mr-4')}>
                  <div className="flex justify-between mb-0.5"><span className="font-semibold">{m.from}</span><span className="text-muted-foreground">{m.time}</span></div>
                  <p className="text-muted-foreground">{m.msg}</p>
                </div>
              ))}
            </div>
          </div>

          {ticket.status === 'escalated' && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-2.5 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Escalated to Engineering.</span> This ticket requires technical investigation. Expected response within 4 hours.</div>
            </div>
          )}

          {ticket.status === 'awaiting_reply' && (
            <div className="rounded-lg border border-[hsl(var(--gigvora-amber))]/30 bg-[hsl(var(--gigvora-amber))]/5 p-2.5 flex items-start gap-2">
              <Clock className="h-3.5 w-3.5 text-[hsl(var(--gigvora-amber))] shrink-0 mt-0.5" />
              <div className="text-[8px]"><span className="font-semibold">Awaiting Your Reply.</span> The support team has responded. Please reply to keep this ticket active.</div>
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 border-t pt-3">
            {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
              <>
                <Button size="sm" className="h-6 text-[9px] gap-1"><Send className="h-2.5 w-2.5" />Reply</Button>
                <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><AlertTriangle className="h-2.5 w-2.5" />Escalate</Button>
              </>
            )}
            {ticket.status === 'resolved' && <Button size="sm" className="h-6 text-[9px] gap-1"><RefreshCw className="h-2.5 w-2.5" />Reopen</Button>}
            <Button variant="outline" size="sm" className="h-6 text-[9px] gap-1"><XCircle className="h-2.5 w-2.5" />Close</Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

// ── Main Page ──
const SupportCenterPage: React.FC = () => {
  const { activeRole } = useRole();
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null);

  const filteredArticles = ARTICLES.filter(a => {
    if (categoryFilter !== 'all' && a.category !== categoryFilter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.excerpt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const topStrip = (
    <>
      <LifeBuoy className="h-4 w-4 text-accent" />
      <span className="text-xs font-semibold">Support Centre</span>
      <div className="flex-1" />
      <select value={categoryFilter} onChange={e => setCategoryFilter(e.target.value)} className="h-6 rounded-md border bg-background px-1.5 text-[8px]">
        <option value="all">All Categories</option>
        <option value="getting_started">Getting Started</option>
        <option value="billing">Billing</option>
        <option value="account">Account</option>
        <option value="marketplace">Marketplace</option>
        <option value="technical">Technical</option>
        <option value="trust_safety">Trust & Safety</option>
      </select>
      <div className="relative">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search help..." className="h-6 rounded-md border bg-background pl-7 pr-2 text-[8px] w-44 focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      <Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />Open Ticket</Button>
    </>
  );

  const rightRail = (
    <div className="space-y-3">
      <SectionCard title="System Status" icon={<Globe className="h-3.5 w-3.5 text-[hsl(var(--state-healthy))]" />}>
        <div className="space-y-1">
          {[
            { service: 'Platform', status: 'operational' },
            { service: 'Payments', status: 'operational' },
            { service: 'Messaging', status: 'operational' },
            { service: 'API', status: 'degraded' },
          ].map(s => (
            <div key={s.service} className="flex items-center justify-between text-[8px]">
              <span>{s.service}</span>
              <Badge className={cn('text-[5px] border-0', s.status === 'operational' ? 'bg-[hsl(var(--state-healthy))]/10 text-[hsl(var(--state-healthy))]' : 'bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]')}>{s.status}</Badge>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="My Tickets" icon={<Ticket className="h-3.5 w-3.5 text-accent" />}>
        <div className="space-y-1">
          {TICKETS.filter(t => t.status !== 'closed').slice(0, 3).map(t => {
            const SIcon = STATUS_ICONS[t.status];
            return (
              <button key={t.id} onClick={() => setSelectedTicket(t)} className="flex items-center gap-1.5 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
                <SIcon className={cn('h-3 w-3 shrink-0', STATUS_COLORS[t.status].split(' ')[1])} />
                <div className="flex-1 min-w-0"><div className="font-medium truncate">{t.subject}</div><div className="text-[6px] text-muted-foreground">{t.id} · {t.updated}</div></div>
              </button>
            );
          })}
        </div>
      </SectionCard>

      <SectionCard title="Contact" icon={<Phone className="h-3.5 w-3.5 text-primary" />}>
        <div className="space-y-1.5 text-[8px]">
          {[
            { icon: Mail, label: 'Email Support', value: 'support@gigvora.com' },
            { icon: MessageSquare, label: 'Live Chat', value: 'Available 9am–6pm' },
            { icon: Phone, label: 'Phone', value: 'Enterprise only' },
          ].map(c => (
            <div key={c.label} className="flex items-center gap-1.5">
              <c.icon className="h-3 w-3 text-muted-foreground" />
              <div><div className="font-medium">{c.label}</div><div className="text-[6px] text-muted-foreground">{c.value}</div></div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Quick Links">
        <div className="space-y-0.5">
          {[
            { label: 'Community Forum', icon: Users },
            { label: 'API Documentation', icon: FileText },
            { label: 'Status Page', icon: Globe },
            { label: 'Trust & Safety', icon: Shield },
          ].map(a => (
            <button key={a.label} className="flex items-center gap-2 p-1.5 rounded-md w-full text-left hover:bg-muted/30 transition-colors text-[8px]">
              <a.icon className="h-3 w-3 text-muted-foreground" /><span>{a.label}</span>
              <ExternalLink className="h-2.5 w-2.5 ml-auto text-muted-foreground" />
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
          { action: 'Ticket TK-4521 updated — agent replied with payment timeline', time: '4h ago', type: 'ticket' },
          { action: 'New help article: "Bulk Invoice Export" published', time: '1d ago', type: 'article' },
          { action: 'Ticket TK-4515 resolved — invoice export instructions provided', time: '2d ago', type: 'resolved' },
          { action: 'System maintenance scheduled for API services — Apr 15', time: '3d ago', type: 'system' },
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

  return (
    <DashboardLayout topStrip={topStrip} rightRail={rightRail} rightRailWidth="w-52" bottomSection={bottomSection}>
      <KPIBand className="mb-3">
        <KPICard label="Open Tickets" value="2" change="Active" />
        <KPICard label="Avg Response" value="2.4h" change="Last 30 days" trend="up" />
        <KPICard label="Resolution Rate" value="94%" change="This month" trend="up" />
        <KPICard label="Articles" value={String(ARTICLES.length)} change="Help centre" />
      </KPIBand>

      <Tabs defaultValue="help">
        <TabsList className="mb-3 flex-wrap h-auto gap-0.5">
          <TabsTrigger value="help" className="gap-1 text-[10px] h-6 px-2"><BookOpen className="h-3 w-3" />Help Centre</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1 text-[10px] h-6 px-2"><Ticket className="h-3 w-3" />My Tickets</TabsTrigger>
          <TabsTrigger value="faq" className="gap-1 text-[10px] h-6 px-2"><HelpCircle className="h-3 w-3" />FAQ</TabsTrigger>
          <TabsTrigger value="contact" className="gap-1 text-[10px] h-6 px-2"><Mail className="h-3 w-3" />Contact</TabsTrigger>
        </TabsList>

        {/* Help Centre */}
        <TabsContent value="help">
          <div className="grid grid-cols-2 gap-3">
            {filteredArticles.map(a => (
              <div key={a.id} className="rounded-lg border bg-card p-3 hover:border-ring/50 transition-colors cursor-pointer">
                <div className="flex items-start justify-between mb-1.5">
                  <Badge className={cn('text-[6px] border-0 capitalize', CATEGORY_COLORS[a.category])}>{a.category.replace('_', ' ')}</Badge>
                  <Bookmark className="h-3 w-3 text-muted-foreground hover:text-accent cursor-pointer" />
                </div>
                <div className="text-[11px] font-semibold mb-1">{a.title}</div>
                <p className="text-[8px] text-muted-foreground line-clamp-2 mb-2">{a.excerpt}</p>
                <div className="flex flex-wrap gap-1 mb-2">
                  {a.tags.map(t => <Badge key={t} variant="secondary" className="text-[5px]">{t}</Badge>)}
                </div>
                <div className="flex items-center justify-between text-[7px] text-muted-foreground border-t pt-1.5">
                  <span><Eye className="h-2.5 w-2.5 inline mr-0.5" />{a.views.toLocaleString()} views</span>
                  <span><Star className="h-2.5 w-2.5 inline mr-0.5" />{a.helpful} helpful</span>
                  <span>Updated {a.updated}</span>
                </div>
              </div>
            ))}
          </div>
          {filteredArticles.length === 0 && (
            <div className="rounded-lg border bg-card p-6 text-center">
              <Search className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
              <div className="text-[10px] font-semibold mb-1">No Articles Found</div>
              <div className="text-[8px] text-muted-foreground">Try different search terms or browse categories.</div>
            </div>
          )}
        </TabsContent>

        {/* My Tickets */}
        <TabsContent value="tickets">
          <div className="flex justify-end mb-2"><Button size="sm" className="h-7 text-[10px] gap-1"><Plus className="h-3 w-3" />New Ticket</Button></div>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="text-[9px] text-muted-foreground font-medium">
                  <th className="text-left px-3 py-2">Ticket</th>
                  <th className="text-center px-3 py-2">Status</th>
                  <th className="text-center px-3 py-2">Priority</th>
                  <th className="text-left px-3 py-2">Assigned</th>
                  <th className="text-left px-3 py-2">Updated</th>
                  <th className="text-left px-3 py-2 w-16"></th>
                </tr>
              </thead>
              <tbody>
                {TICKETS.map(t => {
                  const SIcon = STATUS_ICONS[t.status];
                  return (
                    <tr key={t.id} onClick={() => setSelectedTicket(t)} className="border-t text-[9px] hover:bg-muted/30 cursor-pointer">
                      <td className="px-3 py-2">
                        <div className="font-medium">{t.subject}</div>
                        <div className="text-[7px] text-muted-foreground">{t.id} · {t.category} · {t.messages} msgs</div>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge className={cn('text-[6px] border-0 capitalize gap-0.5', STATUS_COLORS[t.status])}><SIcon className="h-2 w-2" />{t.status.replace('_', ' ')}</Badge>
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Badge className={cn('text-[6px] border-0 capitalize', PRIORITY_COLORS[t.priority])}>{t.priority}</Badge>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{t.assignee || '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">{t.updated}</td>
                      <td className="px-3 py-2"><Button variant="ghost" size="sm" className="h-5 text-[7px]"><MoreHorizontal className="h-3 w-3" /></Button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </TabsContent>

        {/* FAQ */}
        <TabsContent value="faq">
          <div className="space-y-1.5">
            {FAQS.map(f => (
              <div key={f.id} className="rounded-lg border bg-card">
                <button onClick={() => setExpandedFaq(expandedFaq === f.id ? null : f.id)} className="w-full text-left p-3 flex items-center gap-2">
                  <HelpCircle className="h-3.5 w-3.5 text-accent shrink-0" />
                  <div className="flex-1">
                    <div className="text-[11px] font-semibold">{f.question}</div>
                    <div className="text-[7px] text-muted-foreground">{f.category} · {f.helpful} found helpful</div>
                  </div>
                  <ChevronRight className={cn('h-3 w-3 text-muted-foreground transition-transform', expandedFaq === f.id && 'rotate-90')} />
                </button>
                {expandedFaq === f.id && (
                  <div className="px-3 pb-3 border-t mx-3 pt-2">
                    <p className="text-[9px] text-muted-foreground">{f.answer}</p>
                    <div className="flex gap-1.5 mt-2">
                      <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><CheckCircle2 className="h-2 w-2" />Helpful</Button>
                      <Button variant="outline" size="sm" className="h-5 text-[7px] gap-0.5"><XCircle className="h-2 w-2" />Not helpful</Button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Contact */}
        <TabsContent value="contact">
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4">
              <div className="text-[12px] font-semibold mb-3 flex items-center gap-1.5"><Ticket className="h-4 w-4 text-accent" />Submit a Ticket</div>
              <div className="space-y-2.5">
                <div>
                  <label className="text-[9px] font-medium mb-0.5 block">Subject</label>
                  <input className="w-full h-7 rounded-md border bg-background px-2 text-[9px] focus:outline-none focus:ring-1 focus:ring-ring" placeholder="Brief description of your issue" />
                </div>
                <div>
                  <label className="text-[9px] font-medium mb-0.5 block">Category</label>
                  <select className="w-full h-7 rounded-md border bg-background px-2 text-[9px]">
                    <option>Select category...</option>
                    <option>Account</option>
                    <option>Billing</option>
                    <option>Technical</option>
                    <option>Trust & Safety</option>
                    <option>Other</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-medium mb-0.5 block">Priority</label>
                  <select className="w-full h-7 rounded-md border bg-background px-2 text-[9px]">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Urgent</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-medium mb-0.5 block">Description</label>
                  <textarea className="w-full rounded-md border bg-background px-2 py-1.5 text-[9px] h-20 focus:outline-none focus:ring-1 focus:ring-ring resize-none" placeholder="Describe your issue in detail..." />
                </div>
                <Button size="sm" className="h-7 text-[10px] gap-1 w-full"><Send className="h-3 w-3" />Submit Ticket</Button>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { icon: MessageSquare, title: 'Live Chat', desc: 'Chat with a support agent in real-time. Available Mon–Fri, 9am–6pm EST.', action: 'Start Chat', available: true },
                { icon: Mail, title: 'Email', desc: 'Send us an email at support@gigvora.com. We respond within 24 hours.', action: 'Send Email', available: true },
                { icon: Phone, title: 'Phone Support', desc: 'Priority phone support available for Enterprise plan subscribers.', action: 'Call Now', available: activeRole === 'enterprise' },
                { icon: Users, title: 'Community', desc: 'Ask questions and get help from the Gigvora community.', action: 'Visit Forum', available: true },
              ].map(c => (
                <div key={c.title} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start gap-2">
                    <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0"><c.icon className="h-4 w-4 text-muted-foreground" /></div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold flex items-center gap-1">{c.title}{!c.available && <Badge className="text-[5px] border-0 bg-[hsl(var(--gigvora-amber))]/10 text-[hsl(var(--gigvora-amber))]">Enterprise</Badge>}</div>
                      <p className="text-[8px] text-muted-foreground mt-0.5">{c.desc}</p>
                      <Button variant={c.available ? 'default' : 'outline'} size="sm" className="h-5 text-[7px] gap-0.5 mt-1.5" disabled={!c.available}>
                        <ArrowUpRight className="h-2 w-2" />{c.action}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <TicketDrawer ticket={selectedTicket} open={!!selectedTicket} onClose={() => setSelectedTicket(null)} />
    </DashboardLayout>
  );
};

export default SupportCenterPage;
