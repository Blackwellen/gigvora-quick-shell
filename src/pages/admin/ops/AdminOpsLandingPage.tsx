import React from 'react';
import { Link } from 'react-router-dom';
import { OpsPageShell, OpsPageHeader, OpsKpiCard } from './_shared';
import {
  Inbox, CheckSquare, MessageSquare, MessagesSquare, Mail, Megaphone, Bell,
  BarChart3, LayoutGrid, Briefcase, Video, FolderKanban, GraduationCap,
  Mic, Film, Users, Building2, ShieldCheck, CreditCard, UserCog,
  Settings, Landmark, Wallet, FileText, Smartphone, Image as ImageIcon,
  Plug, Mail as MailServer, Database, Activity, AlertTriangle, Globe,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/adminAuth';

type Tile = { label: string; subtitle: string; path: string; icon: React.ElementType; superOnly?: boolean };

const workflow: Tile[] = [
  { label: 'Tickets', subtitle: 'Cross-team operations tickets', path: '/admin/ops/tickets', icon: Inbox },
  { label: 'Delegated Tasks', subtitle: 'Cross-functional admin work', path: '/admin/ops/tasks', icon: CheckSquare },
  { label: 'Internal Chat', subtitle: 'Admin-only channels', path: '/admin/ops/internal-chat', icon: MessageSquare },
  { label: 'Customer Chat', subtitle: 'Direct response where allowed', path: '/admin/ops/customer-chat', icon: MessagesSquare },
  { label: 'Emails', subtitle: 'Outbound admin correspondence', path: '/admin/ops/emails', icon: Mail },
  { label: 'Notices', subtitle: 'Site & targeted notices', path: '/admin/ops/notices', icon: Megaphone },
  { label: 'Notifications', subtitle: 'Admin alerts & broadcasts', path: '/admin/ops/notifications', icon: Bell },
  { label: 'Stats & Analytics', subtitle: 'Cross-portal admin metrics', path: '/admin/ops/analytics', icon: BarChart3 },
  { label: 'KPI Cards', subtitle: 'Custom KPIs (super admin)', path: '/admin/ops/kpi-cards', icon: LayoutGrid, superOnly: true },
];

const catalog: Tile[] = [
  { label: 'Gigs', subtitle: 'All productized gig listings', path: '/admin/ops/gigs', icon: Briefcase },
  { label: 'Webinars', subtitle: 'All webinar events', path: '/admin/ops/webinars', icon: Video },
  { label: 'Projects', subtitle: 'All project workspaces', path: '/admin/ops/projects', icon: FolderKanban },
  { label: 'Jobs', subtitle: 'All job postings', path: '/admin/ops/jobs', icon: GraduationCap },
  { label: 'Podcasts', subtitle: 'All podcasts & episodes', path: '/admin/ops/podcasts', icon: Mic },
  { label: 'Videos', subtitle: 'All long-form videos', path: '/admin/ops/videos', icon: Video },
  { label: 'Reels', subtitle: 'All short-form reels', path: '/admin/ops/reels', icon: Film },
  { label: 'Users', subtitle: 'All user accounts', path: '/admin/ops/users', icon: Users },
  { label: 'Companies', subtitle: 'All company records', path: '/admin/ops/companies', icon: Building2 },
  { label: 'Enterprise Accounts', subtitle: 'Managed enterprise tenants', path: '/admin/ops/enterprise', icon: ShieldCheck },
  { label: 'Mentors', subtitle: 'Mentor directory', path: '/admin/ops/mentors', icon: UserCog },
  { label: 'Subscriptions', subtitle: 'Plan & billing subscriptions', path: '/admin/ops/subscriptions', icon: CreditCard },
  { label: 'Admin Lists', subtitle: 'Internal admin accounts', path: '/admin/ops/admins', icon: ShieldCheck, superOnly: true },
];

const settings: Tile[] = [
  { label: 'Site Control', subtitle: 'Maintenance, feature flags', path: '/admin/ops/settings/site', icon: Globe, superOnly: true },
  { label: 'Finance Settings', subtitle: 'Payouts, fees, currencies', path: '/admin/ops/settings/finance', icon: Landmark, superOnly: true },
  { label: 'Escrow Settings', subtitle: 'Escrow rules & timelines', path: '/admin/ops/settings/escrow', icon: Wallet, superOnly: true },
  { label: 'Notification Settings', subtitle: 'Channel routing & throttles', path: '/admin/ops/settings/notifications', icon: Bell, superOnly: true },
  { label: 'CMS Settings', subtitle: 'Marketing & content management', path: '/admin/ops/settings/cms', icon: FileText, superOnly: true },
  { label: 'Terms & Conditions', subtitle: 'T&C document', path: '/admin/ops/settings/terms', icon: FileText, superOnly: true },
  { label: 'Privacy Policy', subtitle: 'Privacy policy document', path: '/admin/ops/settings/privacy', icon: FileText, superOnly: true },
  { label: 'User Agreement', subtitle: 'User agreement document', path: '/admin/ops/settings/user-agreement', icon: FileText, superOnly: true },
  { label: 'Mobile App Settings', subtitle: 'App version, force-update', path: '/admin/ops/settings/mobile', icon: Smartphone, superOnly: true },
  { label: 'Logo & Favicon', subtitle: 'Brand assets', path: '/admin/ops/settings/branding', icon: ImageIcon, superOnly: true },
  { label: 'API Settings', subtitle: 'Public API & rate limits', path: '/admin/ops/settings/api', icon: Plug, superOnly: true },
  { label: 'SMTP Settings', subtitle: 'Email delivery configuration', path: '/admin/ops/settings/smtp', icon: MailServer, superOnly: true },
  { label: 'Connectors', subtitle: 'Integrations & OAuth keys', path: '/admin/ops/settings/connectors', icon: Plug, superOnly: true },
  { label: 'Database', subtitle: 'Backups & maintenance windows', path: '/admin/ops/settings/database', icon: Database, superOnly: true },
];

const Section: React.FC<{ title: string; tiles: Tile[]; isSuper: boolean }> = ({ title, tiles, isSuper }) => (
  <div className="mb-8">
    <div className="text-[11px] uppercase tracking-[0.12em] text-muted-foreground/70 font-semibold mb-3">{title}</div>
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
      {tiles.map((t) => {
        const locked = !!t.superOnly && !isSuper;
        return (
          <Link
            key={t.path}
            to={locked ? '#' : t.path}
            onClick={(e) => locked && e.preventDefault()}
            className={`rounded-xl border bg-card p-4 transition-colors group ${locked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted/30'}`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <t.icon className="h-4 w-4" />
              </div>
              {t.superOnly && (
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Super</span>
              )}
            </div>
            <div className="text-[13px] font-medium">{t.label}</div>
            <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{t.subtitle}</div>
          </Link>
        );
      })}
    </div>
  </div>
);

export default function AdminOpsLandingPage() {
  const { user } = useAdminAuth();
  const isSuper = !!user?.isSuperAdmin;
  return (
    <OpsPageShell>
      <OpsPageHeader
        eyebrow="Command Centre"
        title="Admin Ops & Site Control"
        subtitle="Cross-portal admin workflow, the canonical platform catalog, and every system-wide configuration surface for site control, legal, branding, and integrations."
      />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        <OpsKpiCard label="Open ops tickets" value="42" delta="+5 today" icon={Inbox} />
        <OpsKpiCard label="Active sessions" value="1,284" delta="+3.2%" positive icon={Activity} />
        <OpsKpiCard label="System incidents" value="0" delta="7d clean" positive icon={AlertTriangle} />
        <OpsKpiCard label="Pending settings changes" value="3" icon={Settings} />
      </div>
      <Section title="Workflow" tiles={workflow} isSuper={isSuper} />
      <Section title="Platform Catalog" tiles={catalog} isSuper={isSuper} />
      <Section title="Site Control & Settings" tiles={settings} isSuper={isSuper} />
    </OpsPageShell>
  );
}
