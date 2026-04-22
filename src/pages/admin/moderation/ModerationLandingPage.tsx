import React from 'react';
import { Link } from 'react-router-dom';
import { ModPageShell, ModPageHeader, ModKpiCard } from './_shared';
import {
  Inbox, CheckSquare, MessageSquare, MessagesSquare, Mail, Megaphone, Bell,
  BarChart3, LayoutGrid, Radio, Video, MessageCircle, FileText, Building2, Users,
  AlertTriangle, ShieldCheck, Clock, Gauge,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuth';

const tiles: { label: string; subtitle: string; path: string; icon: React.ElementType }[] = [
  { label: 'Tickets', subtitle: 'User-reported moderation tickets', path: '/admin/moderation/tickets', icon: Inbox },
  { label: 'Delegated Tasks', subtitle: 'Cross-team review work', path: '/admin/moderation/tasks', icon: CheckSquare },
  { label: 'Internal Chat', subtitle: 'Moderator-only chat', path: '/admin/moderation/internal-chat', icon: MessageSquare },
  { label: 'Customer Chat', subtitle: 'Policy-allowed direct response', path: '/admin/moderation/customer-chat', icon: MessagesSquare },
  { label: 'Emails', subtitle: 'Outbound enforcement emails', path: '/admin/moderation/emails', icon: Mail },
  { label: 'Notices', subtitle: 'Site-wide & targeted notices', path: '/admin/moderation/notices', icon: Megaphone },
  { label: 'Notifications', subtitle: 'In-product moderator alerts', path: '/admin/moderation/notifications', icon: Bell },
  { label: 'Live Feed Review', subtitle: 'Watch the public feed in real time', path: '/admin/moderation/live-feed', icon: Radio },
  { label: 'Chats Review', subtitle: 'Reviewable chat conversations', path: '/admin/moderation/chats', icon: MessageCircle },
  { label: 'Comms Review', subtitle: 'Gig/project/webinar/interview chats', path: '/admin/moderation/communications', icon: MessagesSquare },
  { label: 'Video Comments', subtitle: 'All video comment streams', path: '/admin/moderation/video-comments', icon: Video },
  { label: 'Documents', subtitle: 'Uploaded document review', path: '/admin/moderation/documents', icon: FileText },
  { label: 'Ads', subtitle: 'Ad creative & policy review', path: '/admin/moderation/ads', icon: Megaphone },
  { label: 'Companies', subtitle: 'Company / org records', path: '/admin/moderation/companies', icon: Building2 },
  { label: 'Users', subtitle: 'User account review', path: '/admin/moderation/users', icon: Users },
  { label: 'Trust Analytics', subtitle: 'Trust review integration', path: '/admin/moderation/trust', icon: ShieldCheck },
  { label: 'Stats & Analytics', subtitle: 'Cohort & throughput metrics', path: '/admin/moderation/analytics', icon: BarChart3 },
  { label: 'KPI Cards', subtitle: 'Custom KPIs (super admin only)', path: '/admin/moderation/kpi-cards', icon: LayoutGrid },
];

export default function ModerationLandingPage() {
  const { user, activeRole } = useAdminAuth();
  const isMod = activeRole === 'moderator' || activeRole === 'trust-safety' || !!user?.isSuperAdmin;
  return (
    <ModPageShell>
      <ModPageHeader
        eyebrow="Command Centre"
        title="Moderator & Trust Review"
        subtitle="Unified queue for content, conversations, video, documents, ads, companies, and users — with trust scoring and policy-aware action ladders."
      />
      {!isMod && (
        <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-[13px] text-amber-800 dark:text-amber-200">
          Read-only view. Active moderation actions require a Moderator or Trust & Safety role.
        </div>
      )}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <ModKpiCard label="Open queue" value="184" delta="+12 today" icon={Inbox} />
        <ModKpiCard label="SLA breached" value="6" delta="-2" positive icon={Clock} />
        <ModKpiCard label="High-risk signals" value="9" delta="+3" icon={AlertTriangle} />
        <ModKpiCard label="Auto-moderated 24h" value="1,427" delta="+8.2%" positive icon={Gauge} />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {tiles.map((t) => (
          <Link
            key={t.path}
            to={t.path}
            className="rounded-xl border bg-card p-4 hover:bg-muted/30 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <t.icon className="h-4 w-4" />
              </div>
            </div>
            <div className="text-[13px] font-medium">{t.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.subtitle}</div>
          </Link>
        ))}
      </div>
    </ModPageShell>
  );
}
